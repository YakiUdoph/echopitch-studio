import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runIntelligencePipeline } from "../app/lib/intelligence/pipeline.ts";
import { assemblePitch, createMediaPlan, createProductionReceipt, directManifest, evaluateScene, LivepeerMcpClient, produceNarration, produceScene } from "../app/lib/production/index.ts";
import type { LivepeerGenerationResult, ProductionContext, SceneProduction } from "../app/lib/production/types.ts";

const REPOSITORY = "https://github.com/sindresorhus/ky";

async function verifyAsset(url: string, expected: "image" | "audio" | "video") {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      assert.ok(response.ok, `Asset ${url} returned HTTP ${response.status}.`);
      const contentType = response.headers.get("content-type") || "unknown";
      assert.ok(contentType.startsWith(`${expected}/`), `Asset ${url} returned ${contentType}, expected ${expected}.`);
      await response.body?.cancel();
      return contentType;
    } catch (error) { lastError = error; }
  }
  throw new Error(`Asset validation failed after 3 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`, { cause: lastError });
}

async function main() {
  const startedAt = Date.now();
  try {
    console.log("[phase-f] collecting foreign repository");
    const intelligenceResult = await runIntelligencePipeline({
      githubUrl: REPOSITORY,
      audience: "Hackathon judges",
      pitchGoal: "Explain verified product",
      targetDuration: 30
    });
    const context: ProductionContext = {
      intelligence: intelligenceResult.intelligence,
      claimLock: intelligenceResult.claimLock,
      manifest: intelligenceResult.storyManifest
    };
    const allowed = new Set(context.claimLock.allowedClaimIds);
    for (const scene of context.manifest.scenes) {
      assert.ok(scene.claimIds.every((id) => allowed.has(id)), `${scene.sceneId} contains a blocked narration claim.`);
      for (const reference of scene.evidenceReferences) {
        assert.ok(allowed.has(reference.claimId), `${scene.sceneId} provenance references a blocked claim.`);
        assert.ok(reference.evidenceIds.length > 0, `${scene.sceneId} has no evidence IDs.`);
        assert.ok(reference.evidenceIds.every((id) => context.intelligence.evidence.some((item) => item.id === id)), `${scene.sceneId} references missing evidence.`);
      }
    }
    const mediaPlan = createMediaPlan(context);
    const instructions = directManifest(context, mediaPlan);
    console.log(`[phase-f] planned ${mediaPlan.length} scenes (${mediaPlan.filter((item) => item.preferredVisualSource === "livepeer-generated").length} Livepeer)`);
    const client = new LivepeerMcpClient();
    const productions: SceneProduction[] = [];
    for (const instruction of instructions) {
      console.log(`[phase-f] producing ${instruction.sceneId} via ${instruction.mediaSource}`);
      if (instruction.mediaSource === "livepeer-generated" && process.env.PHASE_F_RESUME_IMAGE_URL) {
        const recoveredResult: LivepeerGenerationResult = {
          sceneId: instruction.sceneId, requestedCapability: instruction.requestedCapability || "flux-schnell",
          executedCapability: "flux-schnell", prompt: instruction.prompt, outputReference: process.env.PHASE_F_RESUME_IMAGE_URL,
          latencyMs: 0, status: "completed", raw: { recovery: "Livepeer recent-assets ledger; original latency unavailable after validation transport failure." }
        };
        const critic = evaluateScene(context, instruction, recoveredResult);
        productions.push({ sceneId: instruction.sceneId, mediaSource: instruction.mediaSource, attempts: [{ attempt: 1, instruction, result: recoveredResult, critic }], finalOutputReference: recoveredResult.outputReference, finalVerdict: critic.verdict === "ACCEPT" ? "ACCEPT" : "FAILED" });
      } else productions.push(await produceScene(context, instruction, client));
    }
    assert.ok(productions.every((item) => item.finalVerdict !== "FAILED"), "A scene failed production.");
    const assetChecks = [];
    for (const production of productions.filter((item) => item.mediaSource === "livepeer-generated")) {
      assert.ok(production.finalOutputReference, `${production.sceneId} has no Livepeer artifact.`);
      const instruction = instructions.find((item) => item.sceneId === production.sceneId)!;
      assetChecks.push({ sceneId: production.sceneId, contentType: await verifyAsset(production.finalOutputReference!, instruction.mediaType === "video" ? "video" : "image") });
    }
    console.log("[phase-f] producing narration");
    const narration = await produceNarration(context, client);
    if (narration.status === "generated" && narration.outputReference) assetChecks.push({ sceneId: "narration", contentType: await verifyAsset(narration.outputReference, "audio") });
    const resultDirectory = path.join(process.cwd(), ".data", "reliability");
    const artifactPath = path.join(resultDirectory, "foreign-final-pitch.html");
    const { assembly, html } = assemblePitch(context, mediaPlan, productions, narration, artifactPath);
    const receipt = createProductionReceipt(context, productions, assembly, narration);
    await mkdir(resultDirectory, { recursive: true });
    await writeFile(artifactPath, html, "utf8");
    const provenance = context.manifest.scenes.flatMap((scene) => scene.evidenceReferences.slice(0, 1).map((reference) => {
      const claim = context.claimLock.claims.find((item) => item.id === reference.claimId)!;
      const evidence = context.intelligence.evidence.find((item) => item.id === reference.evidenceIds[0])!;
      return { sceneId: scene.sceneId, narration: scene.narration, claimId: claim.id, claim: claim.claim, evidenceId: evidence.id, repositoryPath: evidence.path };
    }));
    const counts = context.claimLock.claims.reduce((value, claim) => ({ ...value, [claim.status]: value[claim.status] + 1 }), { SUPPORTED: 0, PARTIAL: 0, UNSUPPORTED: 0 });
    const report = {
      repository: REPOSITORY,
      filesInspected: context.intelligence.inspectedPaths,
      repositoryIntelligence: context.intelligence,
      candidateClaims: context.claimLock.claims,
      claimLockCounts: counts,
      rewrittenClaims: context.claimLock.claims.filter((claim) => claim.status === "PARTIAL" && Boolean(claim.allowedNarration)),
      blockedClaims: context.claimLock.claims.filter((claim) => context.claimLock.blockedClaimIds.includes(claim.id)),
      provenance,
      storyManifest: context.manifest,
      mediaPlan,
      livepeerExecutions: receipt.capabilityExecutions,
      criticAndRepair: productions.map((production) => ({ sceneId: production.sceneId, finalVerdict: production.finalVerdict, attempts: production.attempts.map((attempt) => ({ attempt: attempt.attempt, critic: attempt.critic, repairPlan: attempt.repairPlan })) })),
      narration,
      assembly,
      productionReceipt: receipt,
      verifiedAssetTypes: assetChecks,
      totalRuntimeMs: Date.now() - startedAt,
      recoveredLivepeerAsset: Boolean(process.env.PHASE_F_RESUME_IMAGE_URL)
    };
    await writeFile(path.join(resultDirectory, "foreign-report.json"), JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify({
      repository: report.repository, filesInspected: report.filesInspected, claimLockCounts: counts,
      provenance: provenance[0], storyManifest: report.storyManifest, mediaPlan, livepeerExecutions: report.livepeerExecutions,
      criticAndRepair: report.criticAndRepair, narration, assembly, verifiedAssetTypes: assetChecks, totalRuntimeMs: report.totalRuntimeMs
    }, null, 2));
    console.log("ECHOPITCH FOREIGN REPOSITORY TEST: PASS");
  } catch (error) {
    console.error("ECHOPITCH FOREIGN REPOSITORY TEST: FAIL");
    console.error(`Reason: ${error instanceof Error ? error.stack || error.message : String(error)}`);
    process.exitCode = 1;
  }
}

void main();
