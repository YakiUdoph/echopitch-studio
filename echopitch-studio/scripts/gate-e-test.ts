import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runIntelligencePipeline } from "../app/lib/intelligence/pipeline.ts";
import { assemblePitch, createMediaPlan, createProductionReceipt, directManifest, LivepeerMcpClient, produceNarration, produceScene } from "../app/lib/production/index.ts";
import type { ProductionContext } from "../app/lib/production/types.ts";

const REPOSITORY = process.env.PHASE_E_REPOSITORY || "https://github.com/livepeer/storyboard";

async function verifyRemoteArtifact(url: string, expected: "image" | "audio") {
  const response = await fetch(url);
  assert.ok(response.ok, `Artifact ${url} returned HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type") || "";
  assert.match(contentType, expected === "image" ? /^image\// : /^audio\//, `Artifact ${url} returned unexpected content type ${contentType}.`);
  await response.body?.cancel();
}

async function main() {
  const startedAt = Date.now();
  try {
    const intelligenceResult = await runIntelligencePipeline({ githubUrl: REPOSITORY, audience: "Livepeer hackathon judges", pitchGoal: "Explain the verified product and implementation", targetDuration: 36 });
    const context: ProductionContext = { intelligence: intelligenceResult.intelligence, claimLock: intelligenceResult.claimLock, manifest: intelligenceResult.storyManifest };
    const mediaPlan = createMediaPlan(context);
    const generatedPlan = mediaPlan.filter((item) => item.preferredVisualSource === "livepeer-generated");
    assert.ok(generatedPlan.length > 0, "The general media decision system selected no genuinely explanatory Livepeer scene.");
    const instructions = directManifest(context, mediaPlan);
    const client = new LivepeerMcpClient();
    const productions = [];
    for (const instruction of instructions) productions.push(await produceScene(context, instruction, client));
    assert.ok(productions.every((item) => item.finalVerdict !== "FAILED"), "At least one scene failed production.");
    const generatedProductions = productions.filter((item) => item.mediaSource === "livepeer-generated");
    for (const production of generatedProductions) {
      assert.ok(production.finalOutputReference);
      await verifyRemoteArtifact(production.finalOutputReference!, "image");
    }
    const narration = await produceNarration(context, client);
    if (narration.status === "generated" && narration.outputReference) await verifyRemoteArtifact(narration.outputReference, "audio");
    const artifactPath = path.join(process.cwd(), ".data", "e2e", "phase-e-final-pitch.html");
    const { assembly, html } = assemblePitch(context, mediaPlan, productions, narration, artifactPath);
    await mkdir(path.dirname(artifactPath), { recursive: true });
    await writeFile(artifactPath, html, "utf8");
    const receipt = createProductionReceipt(context, productions, assembly, narration);
    assert.equal(assembly.status, "completed");
    assert.equal(assembly.sceneCount, context.manifest.scenes.length);
    assert.deepEqual(assembly.sceneOrder, context.manifest.scenes.map((scene) => scene.sceneId));
    assert.ok(html.includes("id=\"play\""));
    const report = {
      repository: REPOSITORY,
      repositoryFilesInspected: context.intelligence.inspectedPaths,
      claims: context.claimLock.claims,
      claimLockSummary: { allowed: context.claimLock.allowedClaimIds, blocked: context.claimLock.blockedClaimIds },
      storyManifest: context.manifest,
      mediaPlan,
      repositoryAssetsSelected: mediaPlan.filter((item) => item.preferredVisualSource !== "livepeer-generated"),
      livepeerAssetsRequested: generatedPlan,
      livepeerExecutions: receipt.capabilityExecutions,
      criticVerdicts: productions.map((production) => ({ sceneId: production.sceneId, verdicts: production.attempts.map((attempt) => attempt.critic.verdict), problems: production.attempts.flatMap((attempt) => attempt.critic.problems) })),
      repairs: receipt.scenes.flatMap((scene) => scene.repairHistory),
      narration,
      assembly,
      productionReceipt: receipt,
      totalRuntimeMs: Date.now() - startedAt,
      errorsAndFallbacks: [...receipt.scenes.flatMap((scene) => scene.failuresAndFallbacks), ...(narration.error ? [narration.error] : [])]
    };
    await writeFile(path.join(process.cwd(), ".data", "e2e", "phase-e-report.json"), JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify(report, null, 2));
    console.log("ECHOPITCH FINAL ASSEMBLY E2E: PASS");
  } catch (error) {
    console.error("ECHOPITCH FINAL ASSEMBLY E2E: FAIL");
    console.error(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

void main();
