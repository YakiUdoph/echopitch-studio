import type { VerifiedClaim } from "../intelligence/types.ts";
import type { MediaPlanItem, ProductionContext, ProductionInstruction, SceneWithNeighbors } from "./types.ts";

const PRESENTATION_ASSET = /\.(?:avif|gif|jpe?g|png|svg|webp|mp4|m4v|mov|webm)$/i;

export function createMediaPlan(context: ProductionContext): MediaPlanItem[] {
  const candidates = context.manifest.scenes.flatMap((scene, index) => {
    const evidenceIds = scene.evidenceReferences.flatMap((reference) => reference.evidenceIds);
    const evidence = evidenceIds.map((id) => context.intelligence.evidence.find((item) => item.id === id)).filter((item) => Boolean(item));
    if (evidence.some((item) => item && PRESENTATION_ASSET.test(item.path)) || scene.claimIds.length === 0) return [];
    const explanatoryPurpose = /\b(explain|implementation|architecture|mechanism|workflow|how)\b/i.test(scene.purpose);
    if (!explanatoryPurpose && scene.recommendedMediaType !== "diagram") return [];
    return [{ sceneId: scene.sceneId, score: (explanatoryPurpose ? 3 : 0) + (scene.recommendedMediaType === "diagram" ? 2 : 0) + (index > 0 && index < context.manifest.scenes.length - 1 ? 1 : 0) }];
  }).sort((a, b) => b.score - a.score);
  const generationBudget = Math.max(1, Math.floor(context.manifest.scenes.length / 4));
  const generatedScenes = new Set(candidates.slice(0, generationBudget).map((item) => item.sceneId));
  return context.manifest.scenes.map((scene) => {
    const evidenceIds = Array.from(new Set(scene.evidenceReferences.flatMap((reference) => reference.evidenceIds)));
    const evidence = evidenceIds.map((id) => context.intelligence.evidence.find((item) => item.id === id)).filter((item) => Boolean(item));
    const presentationAsset = evidence.find((item) => item && PRESENTATION_ASSET.test(item.path));
    const needsExplanation = generatedScenes.has(scene.sceneId);
    const livepeerCapability = process.env.LIVEPEER_IMAGE_CAPABILITY || "flux-schnell";
    if (presentationAsset) {
      return {
        sceneId: scene.sceneId, narrativePurpose: scene.purpose, narration: scene.narration,
        verifiedClaimIds: scene.claimIds, evidenceIds, preferredVisualSource: "repository-asset" as const,
        repositoryAsset: rawAssetUrl(presentationAsset.url), mediaType: /\.(?:mp4|m4v|mov|webm)$/i.test(presentationAsset.path) ? "video" as const : "image" as const,
        productionRationale: `The verified repository file ${presentationAsset.path} is a presentation-ready media asset and can show the product truth directly.`
      };
    }
    if (needsExplanation && scene.claimIds.length > 0) {
      return {
        sceneId: scene.sceneId, narrativePurpose: scene.purpose, narration: scene.narration,
        verifiedClaimIds: scene.claimIds, evidenceIds, preferredVisualSource: "livepeer-generated" as const,
        livepeerCapability, mediaType: "image" as const,
        productionRationale: "The repository evidence proves the claim but is source/configuration rather than presentation-ready media; a grounded explanatory visual materially improves this narrative moment."
      };
    }
    return {
      sceneId: scene.sceneId, narrativePurpose: scene.purpose, narration: scene.narration,
      verifiedClaimIds: scene.claimIds, evidenceIds, preferredVisualSource: "repository-evidence-card" as const,
      repositoryAsset: evidence[0]?.url, mediaType: "evidence-card" as const,
      productionRationale: "A designed evidence card keeps the factual repository proof legible; synthetic media would not add enough explanatory value for this scene."
    };
  });
}

export function directScene(context: ProductionContext, input: SceneWithNeighbors, planned?: MediaPlanItem): ProductionInstruction {
  const { scene, previous, next } = input;
  const claims = scene.claimIds.map((id) => context.claimLock.claims.find((claim) => claim.id === id)).filter((claim): claim is VerifiedClaim => Boolean(claim));
  const forbidden = claims.filter((claim) => claim.status !== "SUPPORTED" || !context.claimLock.allowedClaimIds.includes(claim.id));
  if (forbidden.length) throw new Error(`Scene ${scene.sceneId} contains claims not permitted by ClaimLock: ${forbidden.map((claim) => claim.id).join(", ")}`);
  const evidenceIds = Array.from(new Set(scene.evidenceReferences.flatMap((reference) => reference.evidenceIds)));
  const evidence = evidenceIds.map((id) => context.intelligence.evidence.find((item) => item.id === id)).filter((item) => Boolean(item));
  const plan = planned || createMediaPlan(context).find((item) => item.sceneId === scene.sceneId);
  if (!plan) throw new Error(`Media Plan is missing scene ${scene.sceneId}.`);
  const existingReference = plan.repositoryAsset;
  const canUseExisting = plan.preferredVisualSource !== "livepeer-generated";
  const continuity = `Previous: ${previous?.purpose || "opening"}. Next: ${next?.purpose || "closing"}.`;
  const prompt = canUseExisting
    ? `Use repository evidence for ${scene.purpose}. Narration: ${scene.narration}`
    : [
        `Create a clear 16:9 editorial illustration for scene ${scene.sceneId}.`,
        `Purpose: ${scene.purpose}.`,
        `Verified narration: ${scene.narration}`,
        `Visual intent: ${scene.visualIntent}`,
        `Allowed claims only: ${claims.map((claim) => `${claim.id}: ${claim.allowedNarration}`).join(" | ")}.`,
        `Evidence context: ${evidence.map((item) => `${item?.path}: ${item?.reason}`).join(" | ")}.`,
        `Continuity: ${continuity}`,
        "Do not add text, logos, metrics, integrations, or product capabilities not stated above."
      ].join(" ");
  return { sceneId: scene.sceneId, mediaSource: canUseExisting ? "existing-product-evidence" : "livepeer-generated", mediaType: canUseExisting ? undefined : plan.mediaType as "image" | "video", requestedCapability: canUseExisting ? undefined : plan.livepeerCapability, prompt, claimIds: scene.claimIds, evidenceIds, existingReference, continuity };
}

export function directManifest(context: ProductionContext, mediaPlan = createMediaPlan(context)): ProductionInstruction[] {
  return context.manifest.scenes.map((scene, index, scenes) => directScene(context, { scene, previous: scenes[index - 1], next: scenes[index + 1] }, mediaPlan[index]));
}

function rawAssetUrl(url: string): string {
  return url.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/");
}
