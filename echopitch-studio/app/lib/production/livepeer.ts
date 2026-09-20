import crypto from "node:crypto";
import type { GenerationExecutor, LivepeerGenerationResult, ProductionInstruction } from "./types.ts";

type JsonObject = Record<string, unknown>;

export interface LivepeerClientOptions {
  endpoint?: string;
  apiKey?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export class LivepeerMcpClient implements GenerationExecutor {
  private sessionId?: string;
  private initialized = false;
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;
  private availableCapabilities?: Set<string>;

  constructor(options: LivepeerClientOptions = {}) {
    this.endpoint = options.endpoint || process.env.LIVEPEER_MCP_URL || "https://agent.livepeer.org/api/mcp";
    this.apiKey = options.apiKey || process.env.LIVEPEER_API_KEY;
    this.pollIntervalMs = options.pollIntervalMs || numberEnv("LIVEPEER_POLL_INTERVAL_MS", 5_000);
    this.timeoutMs = options.timeoutMs || numberEnv("LIVEPEER_TIMEOUT_MS", 10 * 60_000);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    const payload = await this.rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "echopitch-production", version: "1.0.0" } });
    assertToolSuccess(payload, "Livepeer MCP initialization");
    await this.notify("notifications/initialized", {});
    this.initialized = true;
  }

  async generate(instruction: ProductionInstruction): Promise<LivepeerGenerationResult> {
    const startedAt = Date.now();
    const mediaType = instruction.mediaType || "image";
    const requestedCapability = instruction.requestedCapability || defaultCapability(mediaType);
    try {
      await this.initialize();
      const capabilities = await this.discoverCapabilities();
      const executedCapability = selectCapability(requestedCapability, mediaType, capabilities);
      const discoverySubstitution = executedCapability === requestedCapability ? undefined : { requested: requestedCapability, served: executedCapability, reason: "requested_capability_unavailable" };
      let payload = await this.callTool("run_capability", {
        capability: executedCapability,
        prompt: instruction.prompt,
        inputs: mediaType === "video" ? { aspect_ratio: "16:9", duration: 5 } : mediaType === "image" ? { aspect_ratio: "16:9" } : { prompt: instruction.prompt },
        timeout: Math.max(Math.ceil(this.timeoutMs / 1_000), mediaType === "audio" ? 62 : mediaType === "image" ? 40 : 90),
        async: mediaType === "video",
        persist: false,
        session_id: `echopitch_scene_${safeId(instruction.sceneId)}`,
        idempotency_key: `echopitch_${safeId(instruction.sceneId)}_${crypto.randomUUID()}`
      });
      assertToolSuccess(payload, `Livepeer scene ${instruction.sceneId}`);
      const jobId = extractString(payload, ["job_id", "jobId"]);
      if (jobId && !extractOutputReference(payload)) payload = await this.poll(jobId, startedAt);
      const outputReference = extractOutputReference(payload);
      if (!outputReference) throw new Error("Livepeer completed without an output reference.");
      const capabilityUsed = extractString(payload, ["capability_used", "capability", "executed_capability", "served_capability"]) || executedCapability;
      return {
        sceneId: instruction.sceneId, requestedCapability, executedCapability: capabilityUsed, prompt: instruction.prompt,
        jobId, outputReference, latencyMs: Date.now() - startedAt, status: "completed",
        substitution: extractValue(payload, ["upstream_substitution", "model_note", "modelNote"]) || discoverySubstitution,
        capabilityDiscovery: { discoveredAt: new Date().toISOString(), availableCapabilities: capabilities.size, requestedAvailable: capabilities.has(requestedCapability) }, raw: payload
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = /timed out/i.test(message) ? "timed-out" : "failed";
      return { sceneId: instruction.sceneId, requestedCapability, prompt: instruction.prompt, latencyMs: Date.now() - startedAt, status, error: message };
    }
  }

  async discoverCapabilities(): Promise<Set<string>> {
    if (this.availableCapabilities) return this.availableCapabilities;
    await this.initialize();
    const payload = await this.callTool("list_capabilities", { kind: "ai", limit: 200 });
    assertToolSuccess(payload, "Livepeer capability discovery");
    const names = collectObjects(payload).map((item) => item.name).filter((name): name is string => typeof name === "string" && Boolean(name));
    if (!names.length) throw new Error("Livepeer capability discovery returned no named capabilities.");
    this.availableCapabilities = new Set(names);
    return this.availableCapabilities;
  }

  private async poll(jobId: string, startedAt: number): Promise<JsonObject> {
    while (Date.now() - startedAt < this.timeoutMs) {
      const payload = await this.callTool("get_create_media", { job_id: jobId });
      assertToolSuccess(payload, `Livepeer job ${jobId}`);
      const status = (extractString(payload, ["status", "state"]) || "").toLowerCase();
      if (["failed", "cancelled", "canceled", "error"].includes(status)) throw new Error(`Livepeer job ${jobId} failed with status ${status}: ${collectText(payload)}`);
      if (extractOutputReference(payload) && ["", "done", "completed", "complete", "succeeded", "success", "ready"].includes(status)) return payload;
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
    throw new Error(`Livepeer job ${jobId} timed out after ${this.timeoutMs}ms.`);
  }

  private callTool(name: string, args: JsonObject) { return this.rpc("tools/call", { name, arguments: args }); }
  private async notify(method: string, params: JsonObject) {
    const response = await fetch(this.endpoint, { method: "POST", headers: this.headers(), body: JSON.stringify({ jsonrpc: "2.0", method, params }) });
    this.capture(response);
    if (!response.ok) throw new Error(`Livepeer MCP ${method} failed: HTTP ${response.status} ${await response.text()}`);
  }
  private async rpc(method: string, params: JsonObject): Promise<JsonObject> {
    const response = await fetch(this.endpoint, { method: "POST", headers: this.headers(), body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params }) });
    this.capture(response);
    const raw = await response.text();
    if (!response.ok) throw new Error(`Livepeer MCP ${method} failed: HTTP ${response.status} ${raw}`);
    return parseMcpResponse(raw, response.headers.get("content-type"));
  }
  private headers(): Record<string, string> { return { "content-type": "application/json", accept: "application/json, text/event-stream", ...(this.sessionId ? { "mcp-session-id": this.sessionId } : {}), ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) }; }
  private capture(response: Response) { this.sessionId = response.headers.get("mcp-session-id") || this.sessionId; }
}

export function parseMcpResponse(raw: string, contentType: string | null): JsonObject {
  try {
    if (contentType?.includes("text/event-stream") || raw.trimStart().startsWith("event:")) {
      const values = raw.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).filter((line) => line && line !== "[DONE]");
      if (!values.length) throw new Error("empty event stream");
      return JSON.parse(values.at(-1)!) as JsonObject;
    }
    return JSON.parse(raw) as JsonObject;
  } catch (error) { throw new Error(`Malformed Livepeer MCP result: ${error instanceof Error ? error.message : String(error)}`); }
}

export function extractOutputReference(payload: JsonObject): string | undefined {
  const direct = extractString(payload, ["output_url", "outputUrl", "url", "uri", "output_reference", "outputReference"]);
  if (direct?.startsWith("http")) return direct;
  const urls = `${collectText(payload)}\n${JSON.stringify(payload)}`.match(/https?:\/\/[^"'\s)\\]+/g) || [];
  return urls.find((url) => /\.(?:png|jpe?g|webp|gif|mp4|webm|mov|m4v)(?:\?|$)/i.test(url))?.replace(/[.,]+$/, "") || urls.at(-1)?.replace(/[.,]+$/, "");
}

export function assertToolSuccess(payload: JsonObject, label: string): void {
  const result = object(payload.result);
  if (payload.error || result?.isError === true) throw new Error(`${label} failed: ${collectText(payload) || JSON.stringify(payload.error || payload)}`);
}
function collectObjects(value: unknown, output: JsonObject[] = []): JsonObject[] {
  const item = object(value);
  if (item) {
    output.push(item);
    Object.values(item).forEach((entry) => collectObjects(entry, output));
  } else if (Array.isArray(value)) value.forEach((entry) => collectObjects(entry, output));
  else if (typeof value === "string" && value.trim().startsWith("{")) { try { collectObjects(JSON.parse(value), output); } catch { /* text content */ } }
  return output;
}
function extractValue(payload: JsonObject, keys: string[]): unknown { for (const item of collectObjects(payload)) for (const key of keys) if (item[key] !== undefined) return item[key]; }
function extractString(payload: JsonObject, keys: string[]): string | undefined { const value = extractValue(payload, keys); return typeof value === "string" && value ? value : undefined; }
function collectText(payload: JsonObject): string { const content = object(payload.result)?.content; return Array.isArray(content) ? content.map((item) => object(item)?.text).filter((text): text is string => typeof text === "string").join("\n") : ""; }
function object(value: unknown): JsonObject | undefined { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : undefined; }
function safeId(value: string) { return value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80) || "scene"; }
function numberEnv(name: string, fallback: number) { const value = Number(process.env[name]); return Number.isFinite(value) && value > 0 ? value : fallback; }
function defaultCapability(mediaType: NonNullable<ProductionInstruction["mediaType"]>) {
  if (mediaType === "video") return process.env.LIVEPEER_VIDEO_CAPABILITY || "pixverse-t2v";
  if (mediaType === "audio") return process.env.LIVEPEER_TTS_CAPABILITY || "gemini-tts";
  return process.env.LIVEPEER_IMAGE_CAPABILITY || "flux-schnell";
}
function selectCapability(requested: string, mediaType: NonNullable<ProductionInstruction["mediaType"]>, available: Set<string>): string {
  if (available.has(requested)) return requested;
  const candidates = mediaType === "video" ? ["pixverse-t2v", "ltx-25-t2v-fast", "kling-v3-turbo-t2v"] : mediaType === "audio" ? ["gemini-tts", "chatterbox-tts", "inworld-tts", "grok-tts"] : ["flux-schnell", "flux-dev", "gemini-image"];
  const selected = candidates.find((candidate) => available.has(candidate));
  if (!selected) throw new Error(`No supported Livepeer ${mediaType} capability is currently available.`);
  return selected;
}
