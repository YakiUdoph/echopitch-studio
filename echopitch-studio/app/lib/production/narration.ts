import type { GenerationExecutor, NarrationProduction, ProductionContext, ProductionInstruction } from "./types.ts";

export async function produceNarration(context: ProductionContext, executor: GenerationExecutor): Promise<NarrationProduction> {
  const script = context.manifest.scenes.map((scene) => scene.narration.trim()).filter(Boolean).join(" ... ");
  if (!script) return { method: "on-screen-copy", status: "text-only", latencyMs: 0, error: "Story Manifest contained no narration." };
  const instruction: ProductionInstruction = {
    sceneId: "final-narration",
    mediaSource: "livepeer-generated",
    mediaType: "audio",
    requestedCapability: process.env.LIVEPEER_TTS_CAPABILITY || "gemini-tts",
    prompt: script,
    claimIds: context.manifest.scenes.flatMap((scene) => scene.claimIds),
    evidenceIds: context.manifest.scenes.flatMap((scene) => scene.evidenceReferences.flatMap((reference) => reference.evidenceIds)),
    continuity: "Previous: opening. Next: final pitch close."
  };
  const result = await executor.generate(instruction);
  if (result.status !== "completed" || !result.outputReference) {
    return { method: "on-screen-copy", status: "failed", requestedCapability: result.requestedCapability, executedCapability: result.executedCapability, jobId: result.jobId, latencyMs: result.latencyMs, error: result.error || "Livepeer TTS returned no audio artifact.", substitution: result.substitution };
  }
  return { method: "livepeer-tts", status: "generated", requestedCapability: result.requestedCapability, executedCapability: result.executedCapability, outputReference: result.outputReference, jobId: result.jobId, latencyMs: result.latencyMs, substitution: result.substitution };
}
