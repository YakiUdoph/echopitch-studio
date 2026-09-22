import type { GenerationExecutor, NarrationProduction, NarrationSegment, ProductionContext, ProductionInstruction } from "./types.ts";

export async function produceNarration(context: ProductionContext, executor: GenerationExecutor): Promise<NarrationProduction> {
  const narratedScenes = context.manifest.scenes.filter((scene) => Boolean(scene.narration.trim()));
  if (!narratedScenes.length) return { method: "on-screen-copy", status: "text-only", latencyMs: 0, segments: [], error: "Story Manifest contained no narration." };
  const requestedCapability = process.env.LIVEPEER_TTS_CAPABILITY || "gemini-tts";
  const segments: NarrationSegment[] = [];
  for (const [index, scene] of narratedScenes.entries()) {
    const previous = narratedScenes[index - 1];
    const next = narratedScenes[index + 1];
    const instruction: ProductionInstruction = {
      sceneId: `narration-${scene.sceneId}`,
      mediaSource: "livepeer-generated",
      mediaType: "audio",
      requestedCapability,
      prompt: scene.narration.trim(),
      claimIds: scene.claimIds,
      evidenceIds: scene.evidenceReferences.flatMap((reference) => reference.evidenceIds),
      continuity: `Previous: ${previous?.sceneId || "opening"}. Next: ${next?.sceneId || "final pitch close"}.`
    };
    const result = await executor.generate(instruction);
    const generated = result.status === "completed" && Boolean(result.outputReference);
    segments.push({
      sceneId: scene.sceneId, narration: scene.narration.trim(), status: generated ? "generated" : "failed",
      requestedCapability: result.requestedCapability, executedCapability: result.executedCapability,
      outputReference: result.outputReference, jobId: result.jobId, latencyMs: result.latencyMs,
      error: generated ? undefined : result.error || "Livepeer TTS returned no audio artifact.", substitution: result.substitution,
      costEstimate: result.costEstimate, actualCost: result.actualCost
    });
  }
  const failedSceneIds = segments.filter((segment) => segment.status === "failed").map((segment) => segment.sceneId);
  const latencyMs = segments.reduce((sum, segment) => sum + segment.latencyMs, 0);
  if (failedSceneIds.length) {
    return {
      method: "on-screen-copy", status: "failed", requestedCapability,
      executedCapability: [...segments].reverse().find((segment) => segment.executedCapability)?.executedCapability,
      latencyMs, segments, error: `Livepeer TTS failed for: ${failedSceneIds.join(", ")}.`
    };
  }
  return {
    method: "livepeer-tts", status: "generated", requestedCapability,
    executedCapability: [...segments].reverse().find((segment) => segment.executedCapability)?.executedCapability,
    latencyMs, segments
  };
}
