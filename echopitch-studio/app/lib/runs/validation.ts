export const pitchAudiences = ["Hackathon judges", "Investors", "Developers", "Product users"] as const;
export const pitchDurations = [30, 60, 90] as const;
export const pitchGoals = ["Explain verified product", "Show technical architecture", "Showcase implemented capabilities"] as const;

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
