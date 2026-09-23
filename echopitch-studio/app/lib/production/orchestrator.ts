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

export function describeProductionFailure(context: ProductionContext, productions: SceneProduction[]): string {
  const production = productions.find((item) => item.finalVerdict === "FAILED");
  if (!production) return "Production stopped because no usable scene artifact remained.";
  const scene = context.manifest.scenes.find((item) => item.sceneId === production.sceneId);
  const sceneNumber = production.sceneId.replace(/^scene-/, "");
  const label = scene?.purpose ? `Scene ${sceneNumber} (${scene.purpose})` : `Scene ${sceneNumber}`;
  if (production.mediaSource === "existing-product-evidence") {
    return `Production stopped. ${label} could not use its planned repository evidence because no valid artifact reference was available.`;
  }
  const attempts = production.attempts.length;
  const firstFailure = production.attempts[0]?.result;
  const capability = firstFailure?.requestedCapability ? ` ${firstFailure.requestedCapability}` : "";
  const category = publicFailureCategory(firstFailure?.error, firstFailure?.status);
  return `Production stopped. ${label} could not produce usable media after ${attempts} bounded ${attempts === 1 ? "attempt" : "attempts"}. Livepeer${capability} ${category}`;
}

function publicFailureCategory(error?: string, status?: LivepeerGenerationResult["status"]): string {
  const detail = error || "";
  if (/capabilit.*(?:unavailable|no named|no supported)|discovery/i.test(detail)) return "capability discovery was unavailable.";
  if (/cost estimate|proposed plan|numeric USD estimate/i.test(detail)) return "did not return a valid pre-run estimate, so generation was not confirmed.";
  if (/plan approval|confirm/i.test(detail)) return "plan confirmation failed before a usable asset was returned.";
  if (status === "timed-out" || /timed out/i.test(detail)) return "generation timed out before returning a usable asset.";
  if (/completed without an output|output reference|valid asset/i.test(detail)) return "generation completed without returning a valid asset.";
  if (/failed with status|cancelled|canceled/i.test(detail)) return "generation ended in a terminal failure state without a usable asset.";
  return "generation failed before a valid asset was returned.";
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
