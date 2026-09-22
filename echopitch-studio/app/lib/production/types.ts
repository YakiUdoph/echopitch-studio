import type { ClaimLockResult, RepositoryIntelligence, StoryManifest, StoryScene } from "../intelligence/types.ts";

export type MediaSource = "existing-product-evidence" | "livepeer-generated";
export type ProductionStatus = "completed" | "failed" | "timed-out";
export type PreferredVisualSource = "repository-asset" | "repository-evidence-card" | "livepeer-generated";

export interface MediaPlanItem {
  sceneId: string;
  narrativePurpose: string;
  narration: string;
  verifiedClaimIds: string[];
  evidenceIds: string[];
  preferredVisualSource: PreferredVisualSource;
  repositoryAsset?: string;
  livepeerCapability?: string;
  mediaType: "image" | "video" | "evidence-card";
  productionRationale: string;
}

export interface ProductionInstruction {
  sceneId: string;
  mediaSource: MediaSource;
  mediaType?: "image" | "video" | "audio";
  requestedCapability?: string;
  prompt: string;
  claimIds: string[];
  evidenceIds: string[];
  existingReference?: string;
  continuity: string;
}

export interface LivepeerCostEstimate {
  planId: string;
  status: "proposed";
  estimatedCostUsd: number;
  currency: "USD";
  raw: Record<string, unknown>;
}

export interface LivepeerActualCost {
  costUsd?: number;
  paidUsd?: number;
  units?: number;
  unitKind?: string;
}

export interface LivepeerGenerationResult {
  sceneId: string;
  requestedCapability: string;
  executedCapability?: string;
  prompt: string;
  jobId?: string;
  outputReference?: string;
  latencyMs: number;
  status: ProductionStatus;
  substitution?: unknown;
  capabilityDiscovery?: {
    discoveredAt: string;
    availableCapabilities: number;
    requestedAvailable: boolean;
  };
  costEstimate?: LivepeerCostEstimate;
  actualCost?: LivepeerActualCost;
  error?: string;
  raw?: Record<string, unknown>;
}

export type CriticCriterionName = "narrativeAlignment" | "claimConsistency" | "visualClarity" | "continuity" | "technicalValidity";
export interface CriticCriterion { name: CriticCriterionName; passed: boolean; reason: string }
export interface CriticEvaluation {
  verdict: "ACCEPT" | "REPAIR";
  criteria: CriticCriterion[];
  problems: string[];
  repairRecommendation?: string;
  evidenceClaimConflicts: string[];
}

export interface RepairPlan {
  sceneId: string;
  basedOnAttempt: number;
  problems: string[];
  revisedInstruction: ProductionInstruction;
}

export interface ProductionAttempt {
  attempt: number;
  instruction: ProductionInstruction;
  result: LivepeerGenerationResult;
  critic: CriticEvaluation;
  repairPlan?: RepairPlan;
}

export interface SceneProduction {
  sceneId: string;
  mediaSource: MediaSource;
  attempts: ProductionAttempt[];
  finalOutputReference?: string;
  finalVerdict: "ACCEPT" | "WARNING" | "FAILED";
  warning?: string;
}

export interface ProductionReceipt {
  repository: RepositoryIntelligence["repository"];
  manifestTitle: string;
  scenes: Array<{
    sceneId: string;
    verifiedClaimReferences: string[];
    evidenceIds: string[];
    mediaSource: MediaSource;
    requestedCapability?: string;
    executedCapability?: string;
    jobIds: string[];
    attempts: number;
    criticVerdicts: CriticEvaluation["verdict"][];
    repairHistory: RepairPlan[];
    finalOutputReference?: string;
    latencyMs: number;
    failuresAndFallbacks: string[];
    costEstimates?: LivepeerCostEstimate[];
    actualCosts?: LivepeerActualCost[];
    finalVerdict: SceneProduction["finalVerdict"];
  }>;
  totalLatencyMs: number;
  assembly: FinalAssembly;
  repositoryAssetCount: number;
  livepeerGeneratedAssetCount: number;
  totalLivepeerGenerations: number;
  repairAttempts: number;
  capabilityExecutions: Array<{
    purpose: "scene-visual" | "narration";
    sceneId?: string;
    requestedCapability: string;
    executedCapability?: string;
    jobId?: string;
    status: ProductionStatus;
    outputReference?: string;
    substitution?: unknown;
    costEstimate?: LivepeerCostEstimate;
    actualCost?: LivepeerActualCost;
    error?: string;
  }>;
  narration: {
    provider: "Livepeer" | "none";
    requestedCapability?: string;
    executedCapability?: string;
    artifactReference?: string;
    artifactReferences?: string[];
    status: NarrationProduction["status"];
    audioEmbedded: boolean;
    segments?: NarrationSegment[];
    error?: string;
  };
}

export interface NarrationSegment {
  sceneId: string;
  narration: string;
  status: "generated" | "failed";
  requestedCapability: string;
  executedCapability?: string;
  outputReference?: string;
  jobId?: string;
  latencyMs: number;
  error?: string;
  substitution?: unknown;
  costEstimate?: LivepeerCostEstimate;
  actualCost?: LivepeerActualCost;
}

export interface NarrationProduction {
  method: "livepeer-tts" | "on-screen-copy";
  status: "generated" | "text-only" | "failed";
  requestedCapability?: string;
  executedCapability?: string;
  outputReference?: string;
  jobId?: string;
  latencyMs: number;
  segments?: NarrationSegment[];
  error?: string;
  substitution?: unknown;
}

export interface FinalAssembly {
  artifactReference: string;
  downloadReference: string;
  format: "interactive-html";
  duration: number;
  sceneCount: number;
  sceneOrder: string[];
  status: "completed" | "failed";
  narrationAudioStatus: "livepeer-tts-embedded" | "on-screen-copy-only";
  assembledAt: string;
}

export interface ProductionContext {
  intelligence: RepositoryIntelligence;
  claimLock: ClaimLockResult;
  manifest: StoryManifest;
}

export interface GenerationExecutor { generate(instruction: ProductionInstruction): Promise<LivepeerGenerationResult> }
export type SceneWithNeighbors = { scene: StoryScene; previous?: StoryScene; next?: StoryScene };
