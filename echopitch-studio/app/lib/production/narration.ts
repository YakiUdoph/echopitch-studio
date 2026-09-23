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
      costEstimate: result.costEstimate, actualCost: result.actualCost, diagnostics: result.diagnostics
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

export async function inspectNarrationAssets(
  narration: NarrationProduction,
  fetchAsset: typeof fetch = fetch
): Promise<NarrationProduction> {
  if (narration.status !== "generated" || !narration.segments?.length) return narration;
  const segments = await Promise.all(narration.segments.map(async (segment) => {
    if (segment.status !== "generated" || !segment.outputReference) return segment;
    try {
      const url = new URL(segment.outputReference);
      if (url.protocol !== "https:") throw new Error("Narration asset URL is not HTTPS.");
      const response = await fetchAsset(url, { redirect: "follow", cache: "no-store" });
      if (!response.ok) throw new Error(`Narration asset returned HTTP ${response.status}.`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const durationSeconds = mp3DurationSeconds(bytes);
      if (!durationSeconds) throw new Error("Narration asset duration could not be determined.");
      return {
        ...segment,
        durationSeconds,
        mimeType: response.headers.get("content-type")?.split(";")[0]?.trim() || undefined,
        sizeBytes: bytes.byteLength,
        inspectionError: undefined
      };
    } catch (error) {
      return { ...segment, inspectionError: error instanceof Error ? error.message : String(error) };
    }
  }));
  return { ...narration, segments };
}

export function mp3DurationSeconds(bytes: Uint8Array): number | undefined {
  let offset = 0;
  if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    offset = 10 + size;
  }
  let duration = 0;
  let frames = 0;
  while (offset + 4 <= bytes.length) {
    const header = ((bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
    if (((header & 0xffe00000) >>> 0) !== 0xffe00000) { offset += 1; continue; }
    const versionBits = (header >>> 19) & 3;
    const layerBits = (header >>> 17) & 3;
    const bitrateIndex = (header >>> 12) & 15;
    const sampleRateIndex = (header >>> 10) & 3;
    const padding = (header >>> 9) & 1;
    if (versionBits === 1 || layerBits !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) { offset += 1; continue; }
    const mpeg1 = versionBits === 3;
    const bitrates = mpeg1
      ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
      : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
    const sampleRates = versionBits === 3 ? [44100, 48000, 32000] : versionBits === 2 ? [22050, 24000, 16000] : [11025, 12000, 8000];
    const bitrate = bitrates[bitrateIndex] * 1000;
    const sampleRate = sampleRates[sampleRateIndex];
    const samples = mpeg1 ? 1152 : 576;
    const frameLength = Math.floor((mpeg1 ? 144 : 72) * bitrate / sampleRate) + padding;
    if (frameLength < 4 || offset + frameLength > bytes.length) break;
    duration += samples / sampleRate;
    frames += 1;
    offset += frameLength;
  }
  return frames ? Math.round(duration * 1000) / 1000 : undefined;
}
