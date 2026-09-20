import { applyClaimLock, candidateClaimsFromIntelligence } from "./claim-lock.ts";
import { analyzeRepository } from "./repository-intelligence.ts";
import { createStoryManifest } from "./story-manifest.ts";
import type { IntelligencePipelineInput, IntelligencePipelineResult } from "./types.ts";

export async function runIntelligencePipeline(input: IntelligencePipelineInput): Promise<IntelligencePipelineResult> {
  const intelligence = await analyzeRepository(input.githubUrl);
  const candidates = candidateClaimsFromIntelligence(intelligence, input.additionalClaims);
  const claimLock = applyClaimLock(intelligence, candidates);
  const storyManifest = createStoryManifest(intelligence, claimLock, input.audience, input.pitchGoal, input.targetDuration);
  return { intelligence, claimLock, storyManifest };
}

export type * from "./types.ts";
