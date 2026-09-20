import type { IntelligencePipelineInput, IntelligencePipelineResult } from "../intelligence/types.ts";
import type { FinalAssembly, MediaPlanItem, NarrationProduction, ProductionInstruction, ProductionReceipt, SceneProduction } from "../production/types.ts";

export type RunStatus = "idle" | "collecting" | "understanding" | "verifying" | "planning" | "producing" | "reviewing" | "delivered" | "failed";

export interface PitchRun {
  id: string;
  status: RunStatus;
  input: IntelligencePipelineInput;
  createdAt: string;
  updatedAt: string;
  intelligenceResult?: IntelligencePipelineResult;
  mediaPlan?: MediaPlanItem[];
  instructions?: ProductionInstruction[];
  productions?: SceneProduction[];
  narration?: NarrationProduction;
  finalAssembly?: FinalAssembly;
  productionReceipt?: ProductionReceipt;
  error?: string;
}
