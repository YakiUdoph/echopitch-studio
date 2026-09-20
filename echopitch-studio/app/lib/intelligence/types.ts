export type EvidenceKind = "metadata" | "documentation" | "manifest" | "source" | "configuration" | "schema";

export interface RepositoryEvidence {
  id: string;
  path: string;
  kind: EvidenceKind;
  excerpt: string;
  reason: string;
  url: string;
}

export interface RepositoryCapability {
  id: string;
  name: string;
  description: string;
  evidenceIds: string[];
  confidence: number;
}

export interface RepositoryIntelligence {
  repository: {
    owner: string;
    name: string;
    url: string;
    defaultBranch: string;
  };
  productName: string;
  summary: string;
  problem: string;
  targetUser: string;
  capabilities: RepositoryCapability[];
  technicalMechanisms: RepositoryCapability[];
  differentiators: RepositoryCapability[];
  evidence: RepositoryEvidence[];
  inspectedPaths: string[];
  limitations: string[];
}

export type ClaimStatus = "SUPPORTED" | "PARTIAL" | "UNSUPPORTED";

export interface CandidateClaim {
  id: string;
  claim: string;
  evidenceIds?: string[];
  source: "identity" | "problem" | "capability" | "mechanism" | "differentiator" | "external";
}

export interface VerifiedClaim {
  id: string;
  claim: string;
  status: ClaimStatus;
  evidence: RepositoryEvidence[];
  reason: string;
  confidence: number;
  allowedNarration?: string;
}

export interface ClaimLockResult {
  claims: VerifiedClaim[];
  allowedClaimIds: string[];
  blockedClaimIds: string[];
}

export type RecommendedMediaType = "repository-ui" | "code-visualization" | "diagram" | "text-card";

export interface StoryScene {
  sceneId: string;
  purpose: string;
  duration: number;
  narration: string;
  visualIntent: string;
  claimIds: string[];
  evidenceReferences: Array<{ claimId: string; evidenceIds: string[] }>;
  recommendedMediaType: RecommendedMediaType;
}

export interface StoryManifest {
  title: string;
  audience: string;
  pitchGoal: string;
  targetDuration: number;
  scenes: StoryScene[];
  provenance: Array<{ sceneId: string; claimId: string; evidenceIds: string[] }>;
  blockedClaims: Array<{ claimId: string; claim: string; status: ClaimStatus; reason: string }>;
}

export interface IntelligencePipelineInput {
  githubUrl: string;
  audience: string;
  pitchGoal: string;
  targetDuration: number;
  additionalClaims?: string[];
}

export interface IntelligencePipelineResult {
  intelligence: RepositoryIntelligence;
  claimLock: ClaimLockResult;
  storyManifest: StoryManifest;
}
