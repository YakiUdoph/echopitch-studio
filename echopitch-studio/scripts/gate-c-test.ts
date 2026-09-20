import assert from "node:assert/strict";
import { runIntelligencePipeline } from "../app/lib/intelligence/pipeline.ts";
import type { StoryManifest } from "../app/lib/intelligence/types.ts";
import { createProductionReceipt, directManifest, evaluateScene, LivepeerMcpClient, produceScene } from "../app/lib/production/index.ts";
import type { GenerationExecutor, LivepeerGenerationResult, ProductionContext } from "../app/lib/production/types.ts";

async function main() {
  const gateStartedAt = Date.now();
  try {
    const intelligenceResult = await runIntelligencePipeline({ githubUrl: "https://github.com/YakiUdoph/echopitch-studio", audience: "Hackathon judges", pitchGoal: "Explain verified implementation", targetDuration: 30 });
    const syntheticClaim = intelligenceResult.claimLock.claims.find((claim) =>
      claim.status === "SUPPORTED" && claim.evidence.some((evidence) => ["manifest", "configuration"].includes(evidence.kind))
    );
    if (!syntheticClaim?.allowedNarration) throw new Error("No supported architecture claim was available for the synthetic test scene.");
    const existingScene = intelligenceResult.storyManifest.scenes[0];
    const syntheticScene = {
      sceneId: "scene-gate-c-synthetic", purpose: "Explain verified architecture", duration: 15,
      narration: syntheticClaim.allowedNarration,
      visualIntent: "A restrained architecture diagram showing only the verified mechanism and no additional capabilities.",
      claimIds: [syntheticClaim.id],
      evidenceReferences: [{ claimId: syntheticClaim.id, evidenceIds: syntheticClaim.evidence.map((item) => item.id) }],
      recommendedMediaType: "diagram" as const
    };
    const manifest: StoryManifest = { ...intelligenceResult.storyManifest, targetDuration: 30, scenes: [{ ...existingScene, duration: 15 }, syntheticScene], provenance: [
      ...existingScene.evidenceReferences.map((reference) => ({ sceneId: existingScene.sceneId, claimId: reference.claimId, evidenceIds: reference.evidenceIds })),
      ...syntheticScene.evidenceReferences.map((reference) => ({ sceneId: syntheticScene.sceneId, claimId: reference.claimId, evidenceIds: reference.evidenceIds }))
    ] };
    const context: ProductionContext = { intelligence: intelligenceResult.intelligence, claimLock: intelligenceResult.claimLock, manifest };
    const instructions = directManifest(context);
    assert.equal(instructions[0].mediaSource, "existing-product-evidence");
    assert.equal(instructions[1].mediaSource, "livepeer-generated");

    const client = new LivepeerMcpClient();
    const realProduction = await client.generate(instructions[1]);
    assert.equal(realProduction.status, "completed", realProduction.error);
    assert.ok(realProduction.outputReference);
    const productionCritic = evaluateScene(context, instructions[1], realProduction);
    assert.equal(productionCritic.verdict, "ACCEPT");

    const invalidArtifact: LivepeerGenerationResult = {
      sceneId: instructions[1].sceneId, requestedCapability: instructions[1].requestedCapability!, prompt: instructions[1].prompt,
      latencyMs: 0, status: "failed", error: "Deterministic critic test: artifact reference is missing."
    };
    class InvalidThenRealExecutor implements GenerationExecutor {
      private attempt = 0;
      async generate(instruction: typeof instructions[number]) {
        this.attempt++;
        return this.attempt === 1 ? invalidArtifact : client.generate(instruction);
      }
    }
    const repairedProduction = await produceScene(context, instructions[1], new InvalidThenRealExecutor());
    assert.equal(repairedProduction.attempts.length, 2);
    assert.equal(repairedProduction.attempts[0].critic.verdict, "REPAIR");
    assert.ok(repairedProduction.attempts[0].repairPlan);
    assert.equal(repairedProduction.attempts[1].result.status, "completed", repairedProduction.attempts[1].result.error);
    assert.equal(repairedProduction.finalVerdict, "ACCEPT");

    const existingProduction = await produceScene(context, instructions[0], client);
    const receipt = createProductionReceipt(context, [existingProduction, repairedProduction], {
      artifactReference: "/gate-c-artifact", downloadReference: "/gate-c-artifact?download=1", format: "interactive-html", duration: 30,
      sceneCount: 2, sceneOrder: manifest.scenes.map((scene) => scene.sceneId), status: "completed", narrationAudioStatus: "on-screen-copy-only", assembledAt: new Date().toISOString()
    }, { method: "on-screen-copy", status: "text-only", latencyMs: 0 });
    console.log(`Production Director: ${instructions.map((item) => `${item.sceneId}=${item.mediaSource}`).join(", ")}`);
    console.log(`Real production generation: ${JSON.stringify(realProduction)}`);
    console.log(`Production Critic: ${JSON.stringify(productionCritic)}`);
    console.log(`Deterministic critic test: ${JSON.stringify(repairedProduction.attempts[0].critic)}`);
    console.log(`Repair Plan: ${JSON.stringify(repairedProduction.attempts[0].repairPlan)}`);
    console.log(`Real retry generation: ${JSON.stringify(repairedProduction.attempts[1].result)}`);
    console.log(`Production Receipt: ${JSON.stringify(receipt)}`);
    console.log(`Livepeer calls made: 2`);
    console.log(`Gate C latency: ${Date.now() - gateStartedAt}ms`);
    console.log("ECHOPITCH AGENCY INTEGRATION TEST: PASS");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("ECHOPITCH AGENCY INTEGRATION TEST: FAIL");
    console.error(`Reason: ${reason}`);
    process.exitCode = 1;
  }
}

void main();
