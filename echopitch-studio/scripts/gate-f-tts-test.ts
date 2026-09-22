import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { LivepeerMcpClient } from "../app/lib/production/livepeer.ts";
import type { ProductionInstruction } from "../app/lib/production/types.ts";

const instruction: ProductionInstruction = {
  sceneId: "phase-f-tts-contract",
  mediaSource: "livepeer-generated",
  mediaType: "audio",
  requestedCapability: "gemini-tts",
  prompt: "Welcome to this verified product pitch.",
  claimIds: [],
  evidenceIds: [],
  continuity: "Previous: opening. Next: closing."
};

async function main() {
  const resultDirectory = path.join(process.cwd(), ".data", "reliability");
  const requestShape = {
    estimateTool: "submit_plan",
    estimateMode: "propose",
    executionTool: "submit_plan",
    executionApproval: { plan_id: "from estimate", confirm: true },
    step: { tool: "create_media", args: { action: "tts", model_override: "gemini-tts", prompt: "string", async: true } },
    secretFields: "omitted"
  };
  const result = await new LivepeerMcpClient().generate(instruction);
  let artifactType: string | undefined;
  if (result.status === "completed" && result.outputReference) {
    const response = await fetch(result.outputReference);
    assert.ok(response.ok, `TTS artifact returned HTTP ${response.status}.`);
    artifactType = response.headers.get("content-type") || "unknown";
    await response.body?.cancel();
  }
  const report = {
    requestedCapability: result.requestedCapability,
    executedCapability: result.executedCapability,
    requestShape,
    success: result.status === "completed" && Boolean(result.outputReference),
    status: result.status,
    artifactType,
    artifactReference: result.outputReference,
    latencyMs: result.latencyMs,
    costEstimate: result.costEstimate,
    actualCost: result.actualCost,
    substitutionOrFallback: result.substitution,
    errorCategory: result.error ? categorize(result.error) : undefined,
    error: result.error
  };
  await mkdir(resultDirectory, { recursive: true });
  await writeFile(path.join(resultDirectory, "tts-contract-result.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
  console.log(`ECHOPITCH TTS CONTRACT TEST: ${report.success ? "PASS" : "FAIL"}`);
}

function categorize(message: string): string {
  if (/timed out/i.test(message)) return "timeout";
  if (/HTTP 4\d\d|rejected|missing/i.test(message)) return "invalid-request-or-provider-rejection";
  if (/HTTP 5\d\d/i.test(message)) return "upstream-service-failure";
  if (/fetch failed|network/i.test(message)) return "transport-failure";
  return "generation-failure";
}

void main().catch((error) => {
  console.error(`ECHOPITCH TTS CONTRACT TEST: FAIL\nReason: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
