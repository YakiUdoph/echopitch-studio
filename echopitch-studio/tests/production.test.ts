import assert from "node:assert/strict";
import test from "node:test";
import { assemblePitch, assertToolSuccess, createMediaPlan, createProductionReceipt, createRepairPlan, directManifest, evaluateScene, extractOutputReference, LivepeerMcpClient, parseMcpResponse, produceNarration, produceScene, SequenceExecutor } from "../app/lib/production/index.ts";
import type { GenerationExecutor, LivepeerGenerationResult, ProductionContext, ProductionInstruction } from "../app/lib/production/types.ts";

const context: ProductionContext = {
  intelligence: {
    repository: { owner: "example", name: "project", url: "https://github.com/example/project", defaultBranch: "main" },
    productName: "Project", summary: "Summary", problem: "Problem", targetUser: "Developers", capabilities: [], technicalMechanisms: [], differentiators: [], inspectedPaths: ["app/page.tsx", "package.json"], limitations: [],
    evidence: [
      { id: "ev-ui", path: "app/page.tsx", kind: "source", excerpt: "export default function Page", reason: "UI implemented", url: "https://github.com/example/project/blob/main/app/page.tsx" },
      { id: "ev-config", path: "package.json", kind: "manifest", excerpt: "next", reason: "Framework declared", url: "https://github.com/example/project/blob/main/package.json" }
    ]
  },
  claimLock: {
    allowedClaimIds: ["claim-ui", "claim-framework"], blockedClaimIds: ["claim-invented"],
    claims: [
      { id: "claim-ui", claim: "Implements a web interface.", status: "SUPPORTED", evidence: [], reason: "code", confidence: 0.9, allowedNarration: "Implements a web interface." },
      { id: "claim-framework", claim: "Uses a web framework.", status: "SUPPORTED", evidence: [], reason: "manifest", confidence: 0.8, allowedNarration: "Uses a web framework." },
      { id: "claim-invented", claim: "Invented feature", status: "UNSUPPORTED", evidence: [], reason: "Insufficient evidence.", confidence: 0.05 }
    ]
  },
  manifest: {
    title: "Project pitch", audience: "Judges", pitchGoal: "Explain", targetDuration: 20, blockedClaims: [], provenance: [],
    scenes: [
      { sceneId: "scene-1", purpose: "Show UI", duration: 10, narration: "Implements a web interface.", visualIntent: "Show interface code", claimIds: ["claim-ui"], evidenceReferences: [{ claimId: "claim-ui", evidenceIds: ["ev-ui"] }], recommendedMediaType: "repository-ui" },
      { sceneId: "scene-2", purpose: "Explain architecture", duration: 10, narration: "Uses a web framework.", visualIntent: "Explain architecture visually", claimIds: ["claim-framework"], evidenceReferences: [{ claimId: "claim-framework", evidenceIds: ["ev-config"] }], recommendedMediaType: "diagram" }
    ]
  }
};

test("Production Director chooses existing evidence and synthetic media without changing claims", () => {
  const plan = createMediaPlan(context);
  assert.equal(plan[0].preferredVisualSource, "repository-evidence-card");
  assert.equal(plan[1].preferredVisualSource, "livepeer-generated");
  assert.match(plan[1].productionRationale, /rather than presentation-ready/);
  const instructions = directManifest(context);
  assert.equal(instructions[0].mediaSource, "existing-product-evidence");
  assert.equal(instructions[1].mediaSource, "livepeer-generated");
  assert.deepEqual(instructions[1].claimIds, ["claim-framework"]);
  assert.match(instructions[1].prompt, /Uses a web framework/);
});

test("Final Assembler preserves scene order, duration, visuals, and honest narration status", async () => {
  const mediaPlan = createMediaPlan(context);
  const instructions = directManifest(context, mediaPlan);
  const productions = [
    await produceScene(context, instructions[0], new SequenceExecutor([])),
    await produceScene(context, instructions[1], new SequenceExecutor([{ sceneId: "scene-2", requestedCapability: "flux-schnell", executedCapability: "flux-schnell", prompt: instructions[1].prompt, outputReference: "https://example.com/diagram.png", latencyMs: 5, status: "completed" }]))
  ];
  const result = assemblePitch(context, mediaPlan, productions, { method: "on-screen-copy", status: "text-only", latencyMs: 0 }, "/api/runs/test/artifact");
  assert.equal(result.assembly.duration, 20);
  assert.deepEqual(result.assembly.sceneOrder, ["scene-1", "scene-2"]);
  assert.equal(result.assembly.narrationAudioStatus, "on-screen-copy-only");
  assert.match(result.html, /Verified repository evidence/);
  assert.match(result.html, /https:\/\/example.com\/diagram.png/);
});

test("scene narration covers the complete 60-second manifest and is synchronized at scene boundaries", async () => {
  const sixtySecondContext: ProductionContext = {
    ...context,
    manifest: {
      ...context.manifest,
      targetDuration: 60,
      scenes: [
        { ...context.manifest.scenes[0], sceneId: "scene-1", duration: 15, narration: "Opening narration." },
        { ...context.manifest.scenes[0], sceneId: "scene-2", duration: 15, narration: "Capability narration." },
        { ...context.manifest.scenes[0], sceneId: "scene-3", duration: 15, narration: "Architecture narration." },
        { ...context.manifest.scenes[0], sceneId: "scene-4", duration: 15, narration: "Closing narration." }
      ]
    }
  };
  const executor = new RecordingExecutor([1, 2, 3, 4].map((number) => ({
    sceneId: `narration-scene-${number}`, requestedCapability: "gemini-tts", executedCapability: "gemini-tts",
    prompt: "", outputReference: `https://example.com/scene-${number}.mp3`, latencyMs: number, status: "completed" as const
  })));
  const narration = await produceNarration(sixtySecondContext, executor);
  assert.deepEqual(executor.prompts, ["Opening narration.", "Capability narration.", "Architecture narration.", "Closing narration."]);
  assert.equal(narration.status, "generated");
  assert.deepEqual(narration.segments?.map((segment) => segment.sceneId), ["scene-1", "scene-2", "scene-3", "scene-4"]);

  const mediaPlan = createMediaPlan(sixtySecondContext);
  const productions = await Promise.all(directManifest(sixtySecondContext, mediaPlan).map((instruction) => produceScene(sixtySecondContext, instruction, new SequenceExecutor([]))));
  const result = assemblePitch(sixtySecondContext, mediaPlan, productions, narration, "/api/runs/test/artifact");
  assert.equal(result.assembly.duration, 60);
  assert.equal(result.assembly.narrationAudioStatus, "livepeer-tts-embedded");
  for (let number = 1; number <= 4; number += 1) assert.match(result.html, new RegExp(`https://example\\.com/scene-${number}\\.mp3`));
  assert.match(result.html, /sceneAudios/);
  assert.match(result.html, /t-state\.start/);

  const receipt = createProductionReceipt(sixtySecondContext, productions, result.assembly, narration);
  assert.equal(receipt.capabilityExecutions.filter((execution) => execution.purpose === "narration").length, 4);
  assert.equal(receipt.narration.artifactReferences?.length, 4);
  assert.equal(receipt.totalLivepeerGenerations, 4);
});

test("incomplete scene narration is not embedded or reported as complete", async () => {
  const executor = new RecordingExecutor([
    { sceneId: "narration-scene-1", requestedCapability: "gemini-tts", prompt: "", outputReference: "https://example.com/partial.mp3", latencyMs: 1, status: "completed" },
    { sceneId: "narration-scene-2", requestedCapability: "gemini-tts", prompt: "", latencyMs: 1, status: "failed", error: "TTS failed" }
  ]);
  const narration = await produceNarration(context, executor);
  assert.equal(executor.prompts.length, 2);
  assert.equal(narration.status, "failed");
  const mediaPlan = createMediaPlan(context);
  const instructions = directManifest(context, mediaPlan);
  const productions = [
    await produceScene(context, instructions[0], new SequenceExecutor([])),
    await produceScene(context, instructions[1], new SequenceExecutor([{ sceneId: "scene-2", requestedCapability: "flux-schnell", executedCapability: "flux-schnell", prompt: instructions[1].prompt, outputReference: "https://example.com/diagram.png", latencyMs: 1, status: "completed" }]))
  ];
  const result = assemblePitch(context, mediaPlan, productions, narration, "/api/runs/test/artifact");
  assert.equal(result.assembly.narrationAudioStatus, "on-screen-copy-only");
  assert.doesNotMatch(result.html, /partial\.mp3/);
  const falselyCompleted = assemblePitch(context, mediaPlan, productions, { ...narration, method: "livepeer-tts", status: "generated" }, "/api/runs/test/artifact");
  assert.equal(falselyCompleted.assembly.narrationAudioStatus, "on-screen-copy-only");
  assert.doesNotMatch(falselyCompleted.html, /partial\.mp3/);
});

test("Livepeer parser handles JSON, SSE, malformed results, outputs, and failed tools", () => {
  assert.deepEqual(parseMcpResponse('{"result":{"ok":true}}', "application/json"), { result: { ok: true } });
  assert.deepEqual(parseMcpResponse('event: message\ndata: {"result":{"ok":true}}\n\n', "text/event-stream"), { result: { ok: true } });
  assert.throws(() => parseMcpResponse("not-json", "application/json"), /Malformed Livepeer/);
  assert.equal(extractOutputReference({ result: { structuredContent: { output_url: "https://example.com/art.png" } } }), "https://example.com/art.png");
  assert.throws(() => assertToolSuccess({ result: { isError: true, content: [{ text: "job failed" }] } }, "job"), /job failed/);
});

test("Livepeer MCP initializes and calls tools without authorization", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ method: string; tool?: string; authorization: string | null }> = [];
  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body)) as { id?: string; method: string; params?: { name?: string } };
    const headers = new Headers(init?.headers);
    requests.push({ method: request.method, tool: request.params?.name, authorization: headers.get("authorization") });
    if (request.method === "initialize") {
      return Response.json({ jsonrpc: "2.0", id: request.id, result: {} }, { headers: { "mcp-session-id": "keyless-test-session" } });
    }
    if (request.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (request.method === "tools/call" && request.params?.name === "list_capabilities") {
      return Response.json({ jsonrpc: "2.0", id: request.id, result: { structuredContent: { capabilities: [{ name: "flux-schnell" }] } } });
    }
    if (request.method === "tools/call" && request.params?.name === "run_capability") {
      return Response.json({ jsonrpc: "2.0", id: request.id, result: { structuredContent: { output_url: "https://example.com/keyless.png" } } });
    }
    return Response.json({ jsonrpc: "2.0", id: request.id, error: { message: "Unexpected test request" } }, { status: 500 });
  };

  try {
    const client = new LivepeerMcpClient({ endpoint: "https://example.test/api/mcp" });
    const result = await client.generate({
      sceneId: "keyless-test", mediaSource: "livepeer-generated", mediaType: "image", requestedCapability: "flux-schnell",
      prompt: "Verify keyless transport", claimIds: [], evidenceIds: [], continuity: "Test only."
    });
    assert.equal(result.status, "completed", result.error);
    assert.equal(result.outputReference, "https://example.com/keyless.png");
    assert.deepEqual(requests.map(({ method, tool }) => ({ method, tool })), [
      { method: "initialize", tool: undefined },
      { method: "notifications/initialized", tool: undefined },
      { method: "tools/call", tool: "list_capabilities" },
      { method: "tools/call", tool: "run_capability" }
    ]);
    assert.ok(requests.every((request) => request.authorization === null));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Critic rejects invalid artifacts, preserves provenance, and creates a bounded repair plan", async () => {
  const instruction = directManifest(context)[1];
  const failed = { sceneId: "scene-2", requestedCapability: "image", prompt: instruction.prompt, latencyMs: 2, status: "failed" as const, error: "missing output" };
  const evaluation = evaluateScene(context, instruction, failed);
  assert.equal(evaluation.verdict, "REPAIR");
  const plan = createRepairPlan(instruction, evaluation, 1);
  assert.deepEqual(plan.revisedInstruction.claimIds, instruction.claimIds);
  assert.deepEqual(plan.revisedInstruction.evidenceIds, instruction.evidenceIds);

  const production = await produceScene(context, instruction, new SequenceExecutor([failed, failed]));
  assert.equal(production.attempts.length, 2);
  assert.equal(production.finalVerdict, "FAILED");
});

test("Critic accepts valid results and receipt retains attempts, claims, evidence, latency, and repair history", async () => {
  const instruction: ProductionInstruction = directManifest(context)[1];
  const invalid = { sceneId: "scene-2", requestedCapability: "flux-schnell", prompt: instruction.prompt, latencyMs: 3, status: "failed" as const, error: "invalid artifact" };
  const valid = { sceneId: "scene-2", requestedCapability: "flux-schnell", executedCapability: "flux-schnell", prompt: instruction.prompt, outputReference: "https://example.com/final.png", latencyMs: 7, status: "completed" as const };
  const production = await produceScene(context, instruction, new SequenceExecutor([invalid, valid]));
  assert.equal(production.finalVerdict, "ACCEPT");
  assert.equal(production.attempts.length, 2);
  const receipt = createProductionReceipt(context, [production], {
    artifactReference: "/artifact", downloadReference: "/artifact?download=1", format: "interactive-html", duration: 10,
    sceneCount: 1, sceneOrder: ["scene-2"], status: "completed", narrationAudioStatus: "on-screen-copy-only", assembledAt: new Date(0).toISOString()
  }, { method: "on-screen-copy", status: "text-only", latencyMs: 0 });
  assert.deepEqual(receipt.scenes[0].verifiedClaimReferences, ["claim-framework"]);
  assert.deepEqual(receipt.scenes[0].evidenceIds, ["ev-config"]);
  assert.equal(receipt.scenes[0].repairHistory.length, 1);
  assert.equal(receipt.totalLatencyMs, 10);
  assert.equal(receipt.narration.status, "text-only");
  assert.equal(receipt.narration.audioEmbedded, false);
});

class RecordingExecutor implements GenerationExecutor {
  readonly prompts: string[] = [];
  private readonly results: LivepeerGenerationResult[];
  constructor(results: LivepeerGenerationResult[]) { this.results = results; }
  async generate(instruction: ProductionInstruction): Promise<LivepeerGenerationResult> {
    this.prompts.push(instruction.prompt);
    const result = this.results.shift();
    if (!result) throw new Error("No recorded generation result available.");
    return { ...result, sceneId: instruction.sceneId, prompt: instruction.prompt };
  }
}
