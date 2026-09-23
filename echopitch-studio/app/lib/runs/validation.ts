export const pitchAudiences = ["Hackathon judges", "Investors", "Potential customers", "Developers", "General audience"] as const;
export const pitchDurations = [30, 60, 90, 120] as const;
export const pitchGoals = ["Product overview", "Hackathon pitch", "Investor pitch", "Technical walkthrough", "Customer demo"] as const;

export type ValidPitchRunInput = {
  githubUrl: string;
  audience: (typeof pitchAudiences)[number];
  pitchGoal: (typeof pitchGoals)[number];
  targetDuration: (typeof pitchDurations)[number];
};

export function validatePitchRunInput(body: { githubUrl?: unknown; audience?: unknown; pitchGoal?: unknown; targetDuration?: unknown }): ValidPitchRunInput | undefined {
  const githubUrl = normalizeGitHubRepositoryUrl(typeof body.githubUrl === "string" ? body.githubUrl : "");
  const targetDuration = Number(body.targetDuration);
  const audience = typeof body.audience === "string" && pitchAudiences.includes(body.audience as ValidPitchRunInput["audience"]) ? body.audience as ValidPitchRunInput["audience"] : undefined;
  const pitchGoal = typeof body.pitchGoal === "string" && pitchGoals.includes(body.pitchGoal as ValidPitchRunInput["pitchGoal"]) ? body.pitchGoal as ValidPitchRunInput["pitchGoal"] : undefined;
  if (!githubUrl || !pitchDurations.includes(targetDuration as ValidPitchRunInput["targetDuration"]) || !audience || !pitchGoal) return undefined;
  return { githubUrl, audience, pitchGoal, targetDuration: targetDuration as ValidPitchRunInput["targetDuration"] };
}

export function normalizeGitHubRepositoryUrl(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "github.com" ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash ||
      parts.length !== 2 ||
      !parts[0] ||
      !parts[1]
    ) return undefined;
    const repository = parts[1].replace(/\.git$/i, "");
    if (!repository) return undefined;
    return `https://github.com/${parts[0]}/${repository}`;
  } catch {
    return undefined;
  }
}
