export const pitchAudiences = ["Hackathon judges", "Investors", "Potential customers", "Developers", "General audience"] as const;
export const pitchDurations = [30, 60, 90, 120] as const;
export const pitchGoals = ["Product overview", "Hackathon pitch", "Investor pitch", "Technical walkthrough", "Customer demo"] as const;

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
