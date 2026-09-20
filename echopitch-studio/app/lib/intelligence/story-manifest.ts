import type { ClaimLockResult, RecommendedMediaType, RepositoryIntelligence, StoryManifest, StoryScene, VerifiedClaim } from "./types.ts";

const purposes = ["Establish the product", "Show verified capability", "Explain implementation", "Close on evidenced value"];

export function createStoryManifest(
  intelligence: RepositoryIntelligence,
  claimLock: ClaimLockResult,
  audience: string,
  pitchGoal: string,
  targetDuration: number
): StoryManifest {
  const allowed = claimLock.claims.filter((claim) => claimLock.allowedClaimIds.includes(claim.id) && claim.allowedNarration);
  const sceneCount = 4;
  const durations = distributeDuration(Math.max(sceneCount, Math.round(targetDuration)), sceneCount);
  const scenes: StoryScene[] = Array.from({ length: sceneCount }, (_, index) => {
    const claim = allowed[index % Math.max(allowed.length, 1)];
    return sceneFromClaim(claim, index, durations[index]);
  });
  const provenance = scenes.flatMap((scene) => scene.evidenceReferences.map((reference) => ({
    sceneId: scene.sceneId,
    claimId: reference.claimId,
    evidenceIds: reference.evidenceIds
  })));

  return {
    title: `${intelligence.productName}: Evidence-Backed Pitch`,
    audience: audience.trim() || "General technical audience",
    pitchGoal: pitchGoal.trim() || "Explain the verified product value",
    targetDuration: durations.reduce((total, value) => total + value, 0),
    scenes,
    provenance,
    blockedClaims: claimLock.claims
      .filter((claim) => !claimLock.allowedClaimIds.includes(claim.id))
      .map((claim) => ({ claimId: claim.id, claim: claim.claim, status: claim.status, reason: claim.reason }))
  };
}

function sceneFromClaim(claim: VerifiedClaim | undefined, index: number, duration: number): StoryScene {
  if (!claim?.allowedNarration) {
    return {
      sceneId: `scene-${index + 1}`,
      purpose: purposes[index],
      duration,
      narration: "Insufficient evidence.",
      visualIntent: "Show a neutral repository card without asserting unverified product behavior.",
      claimIds: [],
      evidenceReferences: [],
      recommendedMediaType: "text-card"
    };
  }
  const evidenceIds = claim.evidence.map((item) => item.id);
  return {
    sceneId: `scene-${index + 1}`,
    purpose: purposes[index],
    duration,
    narration: claim.allowedNarration,
    visualIntent: visualIntent(claim),
    claimIds: [claim.id],
    evidenceReferences: [{ claimId: claim.id, evidenceIds }],
    recommendedMediaType: recommendedMedia(claim)
  };
}

function recommendedMedia(claim: VerifiedClaim): RecommendedMediaType {
  if (claim.evidence.some((item) => /\.(tsx|jsx|vue|svelte|html)$/i.test(item.path))) return "repository-ui";
  if (claim.evidence.some((item) => item.kind === "source" || item.kind === "schema")) return "code-visualization";
  if (claim.evidence.some((item) => item.kind === "configuration" || item.kind === "manifest")) return "diagram";
  return "text-card";
}

function visualIntent(claim: VerifiedClaim): string {
  const paths = claim.evidence.map((item) => item.path).slice(0, 2).join(" and ");
  return paths
    ? `Visualize the verified implementation context from ${paths}; do not introduce capabilities absent from those files.`
    : "Use a restrained product identity card tied to repository metadata.";
}

function distributeDuration(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}
