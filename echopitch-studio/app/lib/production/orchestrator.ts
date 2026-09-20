import { createRepairPlan, evaluateScene } from "./critic.ts";
import type { GenerationExecutor, LivepeerGenerationResult, ProductionAttempt, ProductionContext, ProductionInstruction, SceneProduction } from "./types.ts";

const MAX_ATTEMPTS = 2;

export async function produceScene(context: ProductionContext, initial: ProductionInstruction, executor: GenerationExecutor): Promise<SceneProduction> {
  if (initial.mediaSource === "existing-product-evidence") {
    return { sceneId: initial.sceneId, mediaSource: initial.mediaSource, attempts: [], finalOutputReference: initial.existingReference, finalVerdict: initial.existingReference ? "ACCEPT" : "FAILED", warning: initial.existingReference ? undefined : "Existing evidence had no usable reference." };
  }
  const attempts: ProductionAttempt[] = [];
  let instruction = initial;
  for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
    const result = await executor.generate(instruction);
    const critic = evaluateScene(context, instruction, result);
    const attempt: ProductionAttempt = { attempt: attemptNumber, instruction, result, critic };
    attempts.push(attempt);
    if (critic.verdict === "ACCEPT") return { sceneId: instruction.sceneId, mediaSource: initial.mediaSource, attempts, finalOutputReference: result.outputReference, finalVerdict: "ACCEPT" };
    if (attemptNumber < MAX_ATTEMPTS) {
      attempt.repairPlan = createRepairPlan(instruction, critic, attemptNumber);
      instruction = attempt.repairPlan.revisedInstruction;
    }
  }
  const best = [...attempts].reverse().find((attempt) => attempt.result.outputReference)?.result;
  return { sceneId: initial.sceneId, mediaSource: initial.mediaSource, attempts, finalOutputReference: best?.outputReference, finalVerdict: best ? "WARNING" : "FAILED", warning: "Maximum of two attempts reached without Critic acceptance." };
}

export class SequenceExecutor implements GenerationExecutor {
  private index = 0;
  private readonly results: LivepeerGenerationResult[];
  constructor(results: LivepeerGenerationResult[]) { this.results = results; }
  async generate(): Promise<LivepeerGenerationResult> {
    const result = this.results[this.index++];
    if (!result) throw new Error("No generation result configured for this attempt.");
    return result;
  }
}
