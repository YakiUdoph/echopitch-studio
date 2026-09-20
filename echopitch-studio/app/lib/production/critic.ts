import type { ProductionContext, ProductionInstruction, LivepeerGenerationResult, CriticEvaluation, RepairPlan } from "./types.ts";

export function evaluateScene(context: ProductionContext, instruction: ProductionInstruction, result: LivepeerGenerationResult): CriticEvaluation {
  const scene = context.manifest.scenes.find((item) => item.sceneId === instruction.sceneId);
  if (!scene) throw new Error(`Critic cannot find scene ${instruction.sceneId} in Story Manifest.`);
  const allowed = new Set(context.claimLock.allowedClaimIds);
  const conflicts = instruction.claimIds.filter((id) => !allowed.has(id)).map((id) => `Claim ${id} is not allowed by ClaimLock.`);
  const criteria = [
    { name: "narrativeAlignment" as const, passed: instruction.prompt.includes(scene.narration) && instruction.prompt.includes(scene.purpose), reason: "Production instruction must preserve the exact verified narration and scene purpose." },
    { name: "claimConsistency" as const, passed: conflicts.length === 0 && instruction.claimIds.every((id) => scene.claimIds.includes(id)), reason: conflicts[0] || "Every production claim must be supported and present in the scene manifest." },
    { name: "visualClarity" as const, passed: Boolean(result.outputReference && /^https:\/\//.test(result.outputReference)), reason: result.outputReference ? "A concrete HTTPS artifact reference is available for inspection." : "No inspectable output artifact was returned." },
    { name: "continuity" as const, passed: instruction.continuity.includes("Previous:") && instruction.continuity.includes("Next:"), reason: "The instruction must state its relationship to adjacent scenes." },
    { name: "technicalValidity" as const, passed: result.status === "completed" && Boolean(result.executedCapability) && !result.error, reason: result.error || `Generation status is ${result.status}.` }
  ];
  const problems = criteria.filter((criterion) => !criterion.passed).map((criterion) => `${criterion.name}: ${criterion.reason}`);
  return { verdict: problems.length ? "REPAIR" : "ACCEPT", criteria, problems, repairRecommendation: problems.length ? `Repair only the failed criteria: ${problems.join(" ")}` : undefined, evidenceClaimConflicts: conflicts };
}

export function createRepairPlan(instruction: ProductionInstruction, evaluation: CriticEvaluation, attempt: number): RepairPlan {
  if (evaluation.verdict !== "REPAIR") throw new Error("A repair plan can only be created for a failed Critic evaluation.");
  return {
    sceneId: instruction.sceneId,
    basedOnAttempt: attempt,
    problems: evaluation.problems,
    revisedInstruction: {
      ...instruction,
      prompt: `${instruction.prompt} REPAIR REQUIREMENTS: ${evaluation.problems.join(" ")} Preserve the same verified narration, claim IDs, and evidence boundaries. Return one clear, valid artifact.`
    }
  };
}
