import type { FinalAssembly, NarrationProduction, ProductionContext, ProductionReceipt, SceneProduction } from "./types.ts";

export function createProductionReceipt(context: ProductionContext, productions: SceneProduction[], assembly: FinalAssembly, narration: NarrationProduction): ProductionReceipt {
  const scenes = productions.map((production) => {
    const scene = context.manifest.scenes.find((item) => item.sceneId === production.sceneId);
    if (!scene) throw new Error(`Cannot create receipt for unknown scene ${production.sceneId}.`);
    const results = production.attempts.map((attempt) => attempt.result);
    return {
      sceneId: production.sceneId,
      verifiedClaimReferences: scene.claimIds,
      evidenceIds: scene.evidenceReferences.flatMap((reference) => reference.evidenceIds),
      mediaSource: production.mediaSource,
      requestedCapability: results.find((result) => result.requestedCapability)?.requestedCapability,
      executedCapability: [...results].reverse().find((result) => result.executedCapability)?.executedCapability,
      jobIds: results.map((result) => result.jobId).filter((id): id is string => Boolean(id)),
      attempts: production.attempts.length,
      criticVerdicts: production.attempts.map((attempt) => attempt.critic.verdict),
      repairHistory: production.attempts.map((attempt) => attempt.repairPlan).filter((plan): plan is NonNullable<typeof plan> => Boolean(plan)),
      finalOutputReference: production.finalOutputReference,
      latencyMs: results.reduce((sum, result) => sum + result.latencyMs, 0),
      failuresAndFallbacks: results.flatMap((result) => [result.error, result.substitution ? JSON.stringify(result.substitution) : undefined]).filter((item): item is string => Boolean(item)),
      costEstimates: results.map((result) => result.costEstimate).filter((estimate): estimate is NonNullable<typeof estimate> => Boolean(estimate)),
      actualCosts: results.map((result) => result.actualCost).filter((cost): cost is NonNullable<typeof cost> => Boolean(cost)),
      executionDiagnostics: results.map((result) => result.diagnostics).filter((diagnostics): diagnostics is NonNullable<typeof diagnostics> => Boolean(diagnostics)),
      finalVerdict: production.finalVerdict
    };
  });
  const sceneExecutions = productions.flatMap((production) => production.attempts.map((attempt) => ({
    purpose: "scene-visual" as const, sceneId: production.sceneId,
    requestedCapability: attempt.result.requestedCapability, executedCapability: attempt.result.executedCapability,
    jobId: attempt.result.jobId, status: attempt.result.status, outputReference: attempt.result.outputReference, substitution: attempt.result.substitution,
    costEstimate: attempt.result.costEstimate, actualCost: attempt.result.actualCost, diagnostics: attempt.result.diagnostics
  })));
  const narrationExecution = narration.segments?.length ? narration.segments.map((segment) => ({
    purpose: "narration" as const, sceneId: segment.sceneId, requestedCapability: segment.requestedCapability,
    executedCapability: segment.executedCapability, jobId: segment.jobId,
    status: segment.status === "generated" ? "completed" as const : "failed" as const,
    outputReference: segment.outputReference, substitution: segment.substitution, costEstimate: segment.costEstimate, actualCost: segment.actualCost, diagnostics: segment.diagnostics, error: segment.error
  })) : narration.requestedCapability ? [{
    purpose: "narration" as const, requestedCapability: narration.requestedCapability, executedCapability: narration.executedCapability,
    jobId: narration.jobId, status: narration.status === "generated" ? "completed" as const : "failed" as const,
    outputReference: narration.outputReference, substitution: narration.substitution, error: narration.error
  }] : [];
  return {
    repository: context.intelligence.repository, manifestTitle: context.manifest.title, scenes,
    totalLatencyMs: scenes.reduce((sum, scene) => sum + scene.latencyMs, 0) + narration.latencyMs,
    assembly,
    repositoryAssetCount: productions.filter((production) => production.mediaSource === "existing-product-evidence").length,
    livepeerGeneratedAssetCount: productions.filter((production) => production.mediaSource === "livepeer-generated" && Boolean(production.finalOutputReference)).length,
    totalLivepeerGenerations: sceneExecutions.length + narrationExecution.length,
    repairAttempts: productions.reduce((sum, production) => sum + production.attempts.filter((attempt) => attempt.repairPlan).length, 0),
    capabilityExecutions: [...sceneExecutions, ...narrationExecution],
    narration: {
      provider: narration.requestedCapability ? "Livepeer" : "none",
      requestedCapability: narration.requestedCapability,
      executedCapability: narration.executedCapability,
      artifactReference: narration.outputReference,
      artifactReferences: narration.segments?.map((segment) => segment.outputReference).filter((reference): reference is string => Boolean(reference)),
      status: narration.status,
      audioEmbedded: assembly.narrationAudioStatus === "livepeer-tts-embedded",
      segments: narration.segments,
      error: narration.error
    }
  };
}
