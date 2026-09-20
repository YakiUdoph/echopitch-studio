import crypto from "node:crypto";
import type { EvidenceKind, RepositoryEvidence } from "./types.ts";

interface GitHubRepository {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  language: string | null;
}

interface GitTreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
  url: string;
}

interface GitTreeResponse {
  tree: GitTreeItem[];
  truncated: boolean;
}

interface GitBlobResponse { content: string; encoding: string; size: number }

export interface CollectedRepository {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
  description: string;
  language: string;
  files: CollectedFile[];
  limitations: string[];
}

export interface CollectedFile {
  path: string;
  content: string;
  kind: EvidenceKind;
  url: string;
  score: number;
}

const MAX_FILES = 18;
const MAX_FILE_BYTES = 80_000;
const MAX_TOTAL_BYTES = 360_000;

export function parseGitHubRepositoryUrl(input: string): { owner: string; name: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid GitHub repository URL.");
  }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
    throw new Error("Repository URL must use https://github.com/owner/repository.");
  }
  const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("GitHub URL must identify one public repository.");
  return { owner: parts[0], name: parts[1].replace(/\.git$/i, "") };
}

export async function collectGitHubRepository(input: string): Promise<CollectedRepository> {
  const { owner, name } = parseGitHubRepositoryUrl(input);
  const repository = await githubJson<GitHubRepository>(`https://api.github.com/repos/${owner}/${name}`);
  const tree = await githubJson<GitTreeResponse>(
    `https://api.github.com/repos/${owner}/${name}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`
  );

  const selected = tree.tree
    .filter((item) => item.type === "blob" && isUsefulPath(item.path, item.size))
    .map((item) => ({ ...item, score: scorePath(item.path) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))
    .slice(0, MAX_FILES);

  let totalBytes = 0;
  const files: CollectedFile[] = [];
  let unreadableFiles = 0;
  for (const item of selected) {
    if (totalBytes >= MAX_TOTAL_BYTES) break;
    try {
      const blob = await githubJson<GitBlobResponse>(item.url);
      if (blob.encoding !== "base64") { unreadableFiles++; continue; }
      const content = Buffer.from(blob.content.replace(/\s/g, ""), "base64").toString("utf8").slice(0, Math.min(MAX_FILE_BYTES, MAX_TOTAL_BYTES - totalBytes));
      totalBytes += Buffer.byteLength(content);
      files.push({ path: item.path, content, kind: evidenceKind(item.path), url: `${repository.html_url}/blob/${repository.default_branch}/${item.path}`, score: item.score });
    } catch {
      unreadableFiles++;
    }
  }

  const limitations: string[] = [];
  if (tree.truncated) limitations.push("GitHub returned a truncated repository tree; analysis used the highest-priority visible files.");
  if (files.length === 0) limitations.push("No useful text files were available for inspection.");
  if (selected.length === MAX_FILES) limitations.push(`Inspection was intentionally capped at ${MAX_FILES} prioritized files.`);
  if (unreadableFiles > 0) limitations.push(`${unreadableFiles} prioritized repository file(s) could not be read from the GitHub blob API.`);

  return {
    owner,
    name: repository.name,
    url: repository.html_url,
    defaultBranch: repository.default_branch,
    description: repository.description || "",
    language: repository.language || "",
    files,
    limitations
  };
}

export function evidenceFromFile(file: CollectedFile, reason: string, excerpt: string): RepositoryEvidence {
  return {
    id: `ev_${crypto.createHash("sha256").update(`${file.path}:${reason}:${excerpt}`).digest("hex").slice(0, 12)}`,
    path: file.path,
    kind: file.kind,
    excerpt: compactExcerpt(excerpt),
    reason,
    url: file.url
  };
}

function isUsefulPath(path: string, size = 0): boolean {
  const normalized = path.toLowerCase();
  if (size > MAX_FILE_BYTES || size === 0) return false;
  if (/(^|\/)(node_modules|dist|build|out|coverage|\.next|vendor|generated|fixtures?|snapshots?|public\/assets)(\/|$)/.test(normalized)) return false;
  if (/(^|\/)(package-lock|pnpm-lock|yarn\.lock|bun\.lockb?|composer\.lock|cargo\.lock)$/.test(normalized)) return false;
  if (/\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|mp4|webm|mov|mp3|wav|woff2?|ttf|eot|map|min\.js)$/i.test(normalized)) return false;
  return /(^|\/)(readme[^/]*|package\.json|pyproject\.toml|cargo\.toml|go\.mod|requirements[^/]*\.txt|dockerfile|compose\.ya?ml|next\.config\.[^/]+|tsconfig\.json|[^/]+\.(ts|tsx|js|jsx|py|go|rs|java|rb|php|md|mdx|ya?ml|toml|graphql|prisma|proto))$/i.test(path);
}

function scorePath(path: string): number {
  const value = path.toLowerCase();
  let score = 0;
  if (/(^|\/)readme(\.|$)/.test(value)) score += 100;
  if (/(^|\/)(package\.json|pyproject\.toml|cargo\.toml|go\.mod|requirements[^/]*\.txt)$/.test(value)) score += 90;
  if (/(^|\/)(app|src|server|api|routes?|services?|integrations?|lib|core|schemas?|types?)(\/|$)/.test(value)) score += 55;
  if (/(route|handler|service|adapter|client|schema|types?|config|index|main|app)\.[^.]+$/.test(value)) score += 35;
  if (/\.(ts|tsx|js|jsx|py|go|rs)$/.test(value)) score += 20;
  if (/\.(md|mdx)$/.test(value)) score += 12;
  score -= Math.min(25, value.split("/").length * 2);
  return score;
}

function evidenceKind(path: string): EvidenceKind {
  const value = path.toLowerCase();
  if (/(^|\/)readme|\/docs?\//.test(value) || /\.(md|mdx)$/.test(value)) return "documentation";
  if (/(package\.json|pyproject\.toml|cargo\.toml|go\.mod|requirements.*\.txt)$/.test(value)) return "manifest";
  if (/(schema|types?|\.graphql|\.prisma|\.proto)/.test(value)) return "schema";
  if (/(config|dockerfile|compose|tsconfig)/.test(value)) return "configuration";
  return "source";
}

async function githubJson<T>(url: string): Promise<T> {
  const response = await githubFetch(url, { accept: "application/vnd.github+json" });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`GitHub request failed (${response.status}) for ${url}: ${detail}`);
  }
  return response.json() as Promise<T>;
}

async function githubFetch(url: string, extraHeaders: Record<string, string>): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "echopitch-repository-intelligence/1.0",
          ...extraHeaders,
          ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
        },
        signal: AbortSignal.timeout(20_000)
      });
      if (![429, 502, 503, 504].includes(response.status) || attempt === 3) return response;
      await response.body?.cancel();
      lastError = new Error(`GitHub returned transient HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
    }
  }
  const detail = lastError instanceof Error ? `${lastError.name}: ${lastError.message}` : String(lastError);
  throw new Error(`GitHub transport failed after 3 attempts for ${url}: ${detail}`, { cause: lastError });
}

function compactExcerpt(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 360) || "No readable excerpt.";
}
