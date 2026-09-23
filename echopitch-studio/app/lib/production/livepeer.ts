import crypto from "node:crypto";
import type { GenerationExecutor, LivepeerActualCost, LivepeerCostEstimate, LivepeerExecutionDiagnostics, LivepeerFailureCategory, LivepeerGenerationResult, LivepeerPlanObservation, ProductionInstruction } from "./types.ts";

type JsonObject = Record<string, unknown>;
const EXPECTED_OUTPUT_PATHS = ["result.structuredContent.url", "result.structuredContent.steps[].output_url"];

export interface LivepeerClientOptions {
  endpoint?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export class LivepeerMcpClient implements GenerationExecutor {
  private sessionId?: string;
  private initialized = false;
  private readonly endpoint: string;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;
  private availableCapabilities?: Set<string>;

  constructor(options: LivepeerClientOptions = {}) {
    this.endpoint = options.endpoint || process.env.LIVEPEER_MCP_URL || "https://agent.livepeer.org/api/mcp/creative";
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
    let costEstimate: LivepeerCostEstimate | undefined;
    let estimateRaw: JsonObject | undefined;
    let lastPayload: JsonObject | undefined;
    const diagnostics: LivepeerExecutionDiagnostics = {
      estimateAccepted: false,
      confirmationAccepted: false,
      observations: [],
      expectedOutputPaths: [...EXPECTED_OUTPUT_PATHS],
      observedOutputFields: [],
      outputExtraction: "not-attempted"
    };
    try {
      await this.initialize();
      const capabilities = await this.discoverCapabilities();
      const executedCapability = selectCapability(requestedCapability, mediaType, capabilities);
      const discoverySubstitution = executedCapability === requestedCapability ? undefined : { requested: requestedCapability, served: executedCapability, reason: "requested_capability_unavailable" };
      const createMediaArgs: JsonObject = {
        action: mediaType === "audio" ? "tts" : "generate",
        model_override: executedCapability,
        prompt: instruction.prompt,
        ...(mediaType === "video" ? { aspect_ratio: "16:9", duration: 5 } : mediaType === "image" ? { aspect_ratio: "16:9" } : {}),
        // submit_plan already executes in the background. A nested async create_media call
        // returns only a job_id, which the plan executor correctly rejects as incomplete.
        async: false,
        persist: false,
        session_id: `echopitch_scene_${safeId(instruction.sceneId)}`,
        idempotency_key: `echopitch_${safeId(instruction.sceneId)}_${crypto.randomUUID()}`
      };
      const estimatePayload = await this.callTool("submit_plan", {
        goal: `EchoPitch ${mediaType} for ${instruction.sceneId}`,
        steps: [{ tool: "create_media", label: `${instruction.sceneId} ${mediaType}`, args: createMediaArgs }]
      });
      estimateRaw = estimatePayload;
      assertToolSuccess(estimatePayload, `Livepeer cost estimate for ${instruction.sceneId}`);
      costEstimate = parseCostEstimate(estimatePayload, instruction.sceneId);
      diagnostics.estimateAccepted = true;
      diagnostics.planId = costEstimate.planId;

      let payload = await this.callTool("submit_plan", { plan_id: costEstimate.planId, confirm: true });
      lastPayload = payload;
      const confirmationObservation = summarizePlanPayload("confirmation", payload);
      diagnostics.observations.push(confirmationObservation);
      diagnostics.observedOutputFields = confirmationObservation.outputFields;
      assertToolSuccess(payload, `Livepeer plan approval for ${instruction.sceneId}`);
      diagnostics.confirmationAccepted = true;
      if (!extractOutputReference(payload)) payload = await this.pollPlan(costEstimate.planId, startedAt, (observation, raw) => {
        diagnostics.observations.push(observation);
        diagnostics.observedOutputFields = observation.outputFields;
        lastPayload = raw;
      });
      const outputReference = extractOutputReference(payload);
      diagnostics.outputExtraction = outputReference ? "found" : "missing";
      if (!outputReference) throw new Error("Livepeer completed without an output reference.");
      const jobId = extractString(payload, ["job_id", "jobId"]);
      const capabilityUsed = extractString(payload, ["capability_used", "capability", "executed_capability", "served_capability"]) || executedCapability;
      return {
        sceneId: instruction.sceneId, requestedCapability, executedCapability: capabilityUsed, prompt: instruction.prompt,
        jobId, outputReference, latencyMs: Date.now() - startedAt, status: "completed",
        substitution: extractValue(payload, ["upstream_substitution", "model_note", "modelNote"]) || discoverySubstitution,
        capabilityDiscovery: { discoveredAt: new Date().toISOString(), availableCapabilities: capabilities.size, requestedAvailable: capabilities.has(requestedCapability) },
        costEstimate, actualCost: extractActualCost(payload), diagnostics, raw: sanitizeProviderPayload(payload)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = /timed out/i.test(message) ? "timed-out" : "failed";
      if (diagnostics.outputExtraction === "not-attempted" && diagnostics.confirmationAccepted) diagnostics.outputExtraction = "missing";
      diagnostics.failureCategory = failureCategory(message, diagnostics);
      return { sceneId: instruction.sceneId, requestedCapability, prompt: instruction.prompt, latencyMs: Date.now() - startedAt, status, costEstimate, actualCost: lastPayload ? extractActualCost(lastPayload) : undefined, diagnostics, error: message, raw: sanitizeProviderPayload(lastPayload || estimateRaw) };
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

  private async pollPlan(planId: string, startedAt: number, observe: (observation: LivepeerPlanObservation, payload: JsonObject) => void): Promise<JsonObject> {
    while (Date.now() - startedAt < this.timeoutMs) {
      const payload = await this.callTool("get_plan", { plan_id: planId });
      assertToolSuccess(payload, `Livepeer plan ${planId}`);
      observe(summarizePlanPayload("poll", payload), payload);
      const status = (extractString(payload, ["status", "state"]) || "").toLowerCase();
      if (["failed", "partial", "cancelled", "canceled", "error"].includes(status)) throw new Error(`Livepeer plan ${planId} failed with status ${status}: ${collectText(payload)}`);
      if (["done", "completed", "complete", "succeeded", "success", "ready"].includes(status)) {
        if (extractOutputReference(payload)) return payload;
        throw new Error(`Livepeer plan ${planId} completed without an output reference.`);
      }
      if (!status && extractOutputReference(payload)) return payload;
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
    throw new Error(`Livepeer plan ${planId} timed out after ${this.timeoutMs}ms.`);
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
  private headers(): Record<string, string> { return { "content-type": "application/json", accept: "application/json, text/event-stream", ...(this.sessionId ? { "mcp-session-id": this.sessionId } : {}) }; }
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
  const structuredContent = object(object(payload.result)?.structuredContent);
  const directUrl = validHttpsUrl(structuredContent?.url);
  if (directUrl) return directUrl;
  const steps = structuredContent?.steps;
  if (!Array.isArray(steps)) return undefined;
  for (const value of steps) {
    const stepUrl = validHttpsUrl(object(value)?.output_url);
    if (stepUrl) return stepUrl;
  }
  return undefined;
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
function extractNumber(payload: JsonObject, keys: string[]): number | undefined { const value = extractValue(payload, keys); return typeof value === "number" && Number.isFinite(value) ? value : undefined; }
function collectText(payload: JsonObject): string { const content = object(payload.result)?.content; return Array.isArray(content) ? content.map((item) => object(item)?.text).filter((text): text is string => typeof text === "string").join("\n") : ""; }
function summarizePlanPayload(phase: LivepeerPlanObservation["phase"], payload: JsonObject): LivepeerPlanObservation {
  const stepStates = collectObjects(payload)
    .filter((item) => ["create_media", "generate_project"].includes(String(item.tool || "")) && (item.id !== undefined || item.status !== undefined))
    .map((item) => {
      const error = typeof item.error === "string" ? sanitizeDiagnosticText(item.error) : undefined;
      const jobId = typeof item.job_id === "string" ? item.job_id : error?.match(/\bmjob_[a-z0-9]{6,32}\b/i)?.[0];
      const outputFieldPresent = Object.hasOwn(item, "output_url");
      return {
        id: typeof item.id === "string" || typeof item.id === "number" ? item.id : undefined,
        tool: typeof item.tool === "string" ? item.tool : undefined,
        status: typeof item.status === "string" ? item.status : undefined,
        jobId,
        error,
        hasOutput: Boolean(validHttpsUrl(item.output_url)),
        outputFieldPresent,
        outputType: outputFieldPresent ? valueType(item.output_url) : undefined,
        outputIsHttps: outputFieldPresent && typeof item.output_url === "string" ? Boolean(validHttpsUrl(item.output_url)) : undefined
      };
    });
  const outputFields = inspectOutputFields(payload);
  return {
    phase,
    planStatus: extractString(payload, ["status", "state"]),
    stepStates,
    hasOutput: Boolean(extractOutputReference(payload)),
    outputFields,
    actualCostUsd: extractNumber(payload, ["total_actual_cost_usd", "actual_cost_usd"])
  };
}
function failureCategory(message: string, diagnostics: LivepeerExecutionDiagnostics): LivepeerFailureCategory {
  if (!diagnostics.estimateAccepted) return "estimate-rejected";
  if (!diagnostics.confirmationAccepted) return "confirmation-rejected";
  if (/timed out/i.test(message)) return "timeout";
  if (/failed with status|status (?:failed|partial|cancelled|canceled|error)/i.test(message)) return "plan-terminal-failure";
  if (/without an output reference/i.test(message)) return "output-missing";
  return "transport-or-protocol";
}
function sanitizeDiagnosticText(value: string): string {
  return value.replace(/(?:authorization|bearer|token)\s*[:=]\s*\S+/gi, "credential=[redacted]").replace(/\s+/g, " ").trim().slice(0, 500);
}
function inspectOutputFields(payload: JsonObject): LivepeerPlanObservation["outputFields"] {
  const structuredContent = object(object(payload.result)?.structuredContent);
  const fields: LivepeerPlanObservation["outputFields"] = [];
  if (structuredContent && Object.hasOwn(structuredContent, "url")) {
    fields.push({ path: "result.structuredContent.url", valueType: valueType(structuredContent.url), ...(typeof structuredContent.url === "string" ? { isHttps: Boolean(validHttpsUrl(structuredContent.url)) } : {}) });
  }
  if (Array.isArray(structuredContent?.steps)) {
    structuredContent.steps.forEach((value, index) => {
      const step = object(value);
      if (step && Object.hasOwn(step, "output_url")) {
        fields.push({ path: `result.structuredContent.steps[${index}].output_url`, valueType: valueType(step.output_url), ...(typeof step.output_url === "string" ? { isHttps: Boolean(validHttpsUrl(step.output_url)) } : {}) });
      }
    });
  }
  return fields;
}
function sanitizeProviderPayload(payload: JsonObject | undefined): JsonObject | undefined {
  if (!payload) return undefined;
  const result = object(payload.result);
  const structuredContent = object(result?.structuredContent);
  const sanitizedStructuredContent: JsonObject = {};
  for (const key of ["plan_id", "status", "total_est_cost_usd", "total_actual_cost_usd", "url", "job_id", "capability_used"] as const) {
    if (structuredContent && structuredContent[key] !== undefined) sanitizedStructuredContent[key] = structuredContent[key];
  }
  if (Array.isArray(structuredContent?.steps)) {
    sanitizedStructuredContent.steps = structuredContent.steps.map((value) => {
      const step = object(value);
      if (!step) return { valueType: valueType(value) };
      const summary: JsonObject = {};
      for (const key of ["id", "tool", "label", "status", "est_cost_usd", "elapsed_ms", "job_id", "output_url"] as const) {
        if (step[key] !== undefined) summary[key] = step[key];
      }
      if (typeof step.error === "string") summary.error = sanitizeDiagnosticText(step.error);
      return summary;
    });
  }
  return {
    ...(payload.error !== undefined ? { error: sanitizeDiagnosticText(typeof payload.error === "string" ? payload.error : JSON.stringify(payload.error)) } : {}),
    result: { ...(result?.isError !== undefined ? { isError: result.isError } : {}), structuredContent: sanitizedStructuredContent }
  };
}
function validHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) ? value : undefined;
  } catch {
    return undefined;
  }
}
function valueType(value: unknown): string { return value === null ? "null" : Array.isArray(value) ? "array" : typeof value; }
function object(value: unknown): JsonObject | undefined { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : undefined; }
function safeId(value: string) { return value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80) || "scene"; }
function numberEnv(name: string, fallback: number) { const value = Number(process.env[name]); return Number.isFinite(value) && value > 0 ? value : fallback; }
function parseCostEstimate(payload: JsonObject, sceneId: string): LivepeerCostEstimate {
  const planId = extractString(payload, ["plan_id"]);
  const status = extractString(payload, ["status"]);
  const estimatedCostUsd = extractNumber(payload, ["total_est_cost_usd"]);
  if (!planId || status !== "proposed" || estimatedCostUsd === undefined || estimatedCostUsd < 0) {
    throw new Error(`Livepeer cost estimate for ${sceneId} did not return a valid proposed plan and numeric USD estimate.`);
  }
  return { planId, status: "proposed", estimatedCostUsd, currency: "USD", raw: sanitizeProviderPayload(payload) || {} };
}
function extractActualCost(payload: JsonObject): LivepeerActualCost | undefined {
  const actualCost: LivepeerActualCost = {
    costUsd: extractNumber(payload, ["actual_cost_usd", "total_actual_cost_usd", "cost_usd"]),
    paidUsd: extractNumber(payload, ["cost_paid_usd"]),
    units: extractNumber(payload, ["billable_units", "cost_units"]),
    unitKind: extractString(payload, ["cost_unit_kind", "unit_kind", "billable_units_source"])
  };
  return Object.values(actualCost).some((value) => value !== undefined) ? actualCost : undefined;
}
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
