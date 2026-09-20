import assert from "node:assert/strict";
import test from "node:test";
import { assemblePitch, assertToolSuccess, createMediaPlan, createProductionReceipt, createRepairPlan, directManifest, evaluateScene, extractOutputReference, parseMcpResponse, produceScene, SequenceExecutor } from "../app/lib/production/index.ts";
import type { ProductionContext, ProductionInstruction } from "../app/lib/production/types.ts";

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

test("Livepeer parser handles JSON, SSE, malformed results, outputs, and failed tools", () => {
  assert.deepEqual(parseMcpResponse('{"result":{"ok":true}}', "application/json"), { result: { ok: true } });
  assert.deepEqual(parseMcpResponse('event: message\ndata: {"result":{"ok":true}}\n\n', "text/event-stream"), { result: { ok: true } });
  assert.throws(() => parseMcpResponse("not-json", "application/json"), /Malformed Livepeer/);
  assert.equal(extractOutputReference({ result: { structuredContent: { output_url: "https://example.com/art.png" } } }), "https://example.com/art.png");
  assert.throws(() => assertToolSuccess({ result: { isError: true, content: [{ text: "job failed" }] } }, "job"), /job failed/);
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
