import crypto from "node:crypto";
import { collectGitHubRepository, evidenceFromFile, type CollectedFile } from "./github.ts";
import type { RepositoryCapability, RepositoryEvidence, RepositoryIntelligence } from "./types.ts";

interface SignalRule {
  id: string;
  name: string;
  description: string;
  filePattern?: RegExp;
  contentPattern: RegExp;
  reason: string;
  mechanism?: boolean;
}

const signalRules: SignalRule[] = [
  { id: "web-ui", name: "Interactive web interface", description: "Implements a browser-facing user interface.", filePattern: /\.(tsx|jsx|vue|svelte|html)$/i, contentPattern: /(?:export default function|createRoot\(|<html|<template|useState\(|onClick=)/i, reason: "UI entry point or interactive component code is present." },
  { id: "http-api", name: "HTTP API", description: "Exposes request handlers for programmatic use.", filePattern: /(?:api|route|handler|server|controller|view)/i, contentPattern: /(?:export async function (?:GET|POST|PUT|PATCH|DELETE)|app\.(?:get|post|put|patch|delete)\(|router\.(?:get|post|put|patch|delete)|http\.HandleFunc|@(?:app|router)\.(?:get|post|put|patch|delete)|@(?:RestController|Controller|GetMapping|PostMapping|RequestMapping)|\.(?:route|get|post)\s*\(|axum::Router|warp::)/i, reason: "An HTTP request handler is implemented in source code." },
  { id: "http-client", name: "Outbound HTTP client", description: "Sends outbound HTTP requests from application code.", contentPattern: /(?:\bfetch\s*\(|\bnew\s+Request\s*\(|\baxios\.(?:get|post|put|patch|delete)\(|\brequests\.(?:get|post|put|patch|delete)\(|\bhttpx\.(?:get|post|put|patch|delete)\(|\breqwest::|http\.Client\s*\{)/i, reason: "Source code invokes an HTTP client API." },
  { id: "repo-ingestion", name: "External repository ingestion", description: "Fetches and processes repository-hosted source or documentation.", contentPattern: /(?:api\.github\.com|raw\.githubusercontent\.com|githubUrl|GitHub repository)/i, reason: "Source code contains explicit GitHub repository retrieval logic." },
  { id: "media-export", name: "Media or asset export", description: "Produces downloadable media or structured presentation assets.", contentPattern: /(?:MediaRecorder|URL\.createObjectURL|\.download\s*=|video\/webm)/i, reason: "Source code constructs downloadable media or data artifacts." },
  { id: "speech", name: "Speech preview", description: "Provides browser-based speech synthesis or narration preview.", contentPattern: /(?:SpeechSynthesisUtterance|speechSynthesis|Web Speech API)/i, reason: "Speech synthesis APIs are invoked in application source." },
  { id: "typed-models", name: "Typed domain models", description: "Uses explicit types or schemas for application data.", filePattern: /(?:types?|models?|schemas?|\.prisma|\.graphql|\.proto|dto)/i, contentPattern: /(?:export interface|export type|type Query|model \w+|message \w+|@dataclass|BaseModel|record\s+\w+|class\s+\w+Dto)/i, reason: "Repository defines explicit domain types or schemas.", mechanism: true },
  { id: "automated-tests", name: "Automated tests", description: "Includes executable automated test coverage.", filePattern: /(?:^|\/)(?:tests?|__tests__)(?:\/|\.)|\.(?:test|spec)\.|Test\.(?:java|kt|cs)$|_test\.go$/i, contentPattern: /(?:\btest\(|\bit\(|describe\(|node:test|pytest|unittest|@Test\b|testing\.T|#\[test\])/i, reason: "Test source contains executable test declarations.", mechanism: true },
  { id: "retry-handling", name: "Retry handling", description: "Implements bounded retry or backoff behavior for failed operations.", filePattern: /(?:retry|client|core|request)/i, contentPattern: /(?:retryCount|retryLimit|Retry-After|calculateRetry|backoff)/i, reason: "Source code implements retry limits, retry timing, or backoff behavior.", mechanism: true },
  { id: "async-jobs", name: "Asynchronous job polling", description: "Tracks asynchronous work until completion or failure.", contentPattern: /(?:(?:job_id|jobId).{0,160}(?:completed|failed|timeout|succeeded)|poll(?:ing)?.{0,160}(?:completed|failed|timeout|succeeded))/is, reason: "Source implements explicit job polling and terminal-state handling.", mechanism: true },
  { id: "framework-next", name: "Next.js application architecture", description: "Uses Next.js for the application and server routes.", filePattern: /package\.json$/i, contentPattern: /"next"\s*:\s*"[^"]+"/i, reason: "The package manifest declares Next.js.", mechanism: true },
  { id: "framework-react", name: "React component architecture", description: "Uses React components for the application interface.", contentPattern: /(?:from ["']react["']|"react"\s*:\s*"[^"]+")/i, reason: "Source or manifest declares React usage.", mechanism: true },
  { id: "container", name: "Containerized runtime", description: "Provides container configuration for reproducible execution.", filePattern: /dockerfile|compose\.ya?ml/i, contentPattern: /(?:^FROM\s|services:)/im, reason: "Container configuration is present.", mechanism: true },
  { id: "cli", name: "Command-line interface", description: "Provides commands intended to run from a terminal.", contentPattern: /(?:commander|yargs|argparse|click\.command|cobra\.Command|clap::Parser|picocli)/i, reason: "CLI framework or executable entry-point code is present." },
  { id: "application-entrypoint", name: "Executable application", description: "Includes an executable application entry point.", filePattern: /(?:^|\/)(?:main|app|server|program|application)\.(?:py|go|rs|java|kt|cs|rb|php|exs?)$/i, contentPattern: /(?:if\s+__name__\s*==\s*["']__main__["']|\bfunc\s+main\s*\(|\bfn\s+main\s*\(|public\s+static\s+void\s+main|static\s+(?:async\s+)?(?:void|Task)\s+Main)/i, reason: "Source code defines an executable application entry point." }
];

export async function analyzeRepository(githubUrl: string): Promise<RepositoryIntelligence> {
  const collected = await collectGitHubRepository(githubUrl);
  return analyzeCollectedRepository(collected);
}

export function analyzeCollectedRepository(collected: Awaited<ReturnType<typeof collectGitHubRepository>>): RepositoryIntelligence {
  const evidence: RepositoryEvidence[] = [];
  const metadataEvidence: RepositoryEvidence = {
    id: evidenceId("repository-metadata", collected.url),
    path: "(GitHub repository metadata)",
    kind: "metadata",
    excerpt: `${collected.name}${collected.description ? ` — ${collected.description}` : ""}${collected.language ? `; primary language: ${collected.language}` : ""}`,
    reason: "GitHub identifies the repository, its description, and primary language.",
    url: collected.url
  };
  evidence.push(metadataEvidence);

  const readme = collected.files.find((file) => /(^|\/)readme(?:\.|$)/i.test(file.path));
  if (readme) evidence.push(evidenceFromFile(readme, "Repository documentation describes the project and its stated purpose.", readme.content));
  const manifest = collected.files.find((file) => /(^|\/)(package\.json|pyproject\.toml|cargo\.toml|go\.mod|pom\.xml)$/i.test(file.path));
  const productName = manifestProductName(manifest) || readmeHeading(readme) || collected.name;
  const summary = collected.description || readmeSummary(readme) || "Insufficient evidence.";
  const problem = readmeSection(readme, ["problem", "motivation", "why"]) || "Insufficient evidence.";
  const targetUser = inferTargetUser(readme?.content || "") || "Insufficient evidence.";

  const capabilities: RepositoryCapability[] = [];
  const technicalMechanisms: RepositoryCapability[] = [];
  for (const rule of signalRules) {
    const matches = collected.files.filter((file) =>
      file.kind !== "documentation" &&
      (!rule.filePattern || rule.filePattern.test(file.path)) &&
      rule.contentPattern.test(file.content)
    );
    if (matches.length === 0) continue;
    const ruleEvidence = matches.slice(0, 3).map((file) => evidenceFromFile(file, rule.reason, matchingExcerpt(file, rule.contentPattern)));
    evidence.push(...ruleEvidence);
    const capability: RepositoryCapability = {
      id: `cap_${rule.id}`,
      name: rule.name,
      description: rule.description,
      evidenceIds: ruleEvidence.map((item) => item.id),
      confidence: Math.min(0.98, 0.76 + ruleEvidence.length * 0.07)
    };
    (rule.mechanism ? technicalMechanisms : capabilities).push(capability);
  }

  const differentiators: RepositoryCapability[] = [];
  if (capabilities.length >= 2) {
    const selected = capabilities.slice(0, 2);
    differentiators.push({
      id: "diff_combined_workflow",
      name: `Combined ${selected[0].name.toLowerCase()} and ${selected[1].name.toLowerCase()}`,
      description: `Combines ${selected[0].name.toLowerCase()} with ${selected[1].name.toLowerCase()}.`,
      evidenceIds: selected.flatMap((item) => item.evidenceIds),
      confidence: Math.min(...selected.map((item) => item.confidence))
    });
  }

  const uniqueEvidence = Array.from(new Map(evidence.map((item) => [item.id, item])).values());
  const limitations = [...collected.limitations];
  if (!readme) limitations.push("No README was available among prioritized files.");
  if (capabilities.length === 0) limitations.push("Insufficient non-documentation evidence to assert implemented product capabilities.");
  if (problem === "Insufficient evidence.") limitations.push("The product problem could not be established from repository evidence.");
  if (targetUser === "Insufficient evidence.") limitations.push("The likely target user could not be established from repository evidence.");

  return {
    repository: { owner: collected.owner, name: collected.name, url: collected.url, defaultBranch: collected.defaultBranch },
    productName,
    summary,
    problem,
    targetUser,
    capabilities,
    technicalMechanisms,
    differentiators,
    evidence: uniqueEvidence,
    inspectedPaths: collected.files.map((file) => file.path),
    limitations
  };
}

function manifestProductName(file?: CollectedFile): string | undefined {
  if (!file) return undefined;
  if (file.path.endsWith("package.json")) {
    try {
      const parsed = JSON.parse(file.content) as { name?: unknown };
      return typeof parsed.name === "string" ? parsed.name.replace(/^@[^/]+\//, "") : undefined;
    } catch { return undefined; }
  }
  if (/(?:pyproject|cargo)\.toml$/i.test(file.path)) return file.content.match(/^name\s*=\s*["']([^"']+)["']/m)?.[1];
  if (/go\.mod$/i.test(file.path)) return file.content.match(/^module\s+\S+\/([^/\s]+)\s*$/m)?.[1];
  if (/pom\.xml$/i.test(file.path)) return file.content.match(/<artifactId>([^<]+)<\/artifactId>/i)?.[1]?.trim();
  return undefined;
}

function readmeHeading(file?: CollectedFile): string | undefined {
  return file?.content.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "").trim();
}

function readmeSummary(file?: CollectedFile): string | undefined {
  if (!file) return undefined;
  const paragraphs = file.content.replace(/^#.*$/gm, "").split(/\n\s*\n/).map((value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  return paragraphs.find((value) => value.length >= 30 && !value.startsWith("[") && !value.startsWith("!"))?.slice(0, 280);
}

function readmeSection(file: CollectedFile | undefined, headings: string[]): string | undefined {
  if (!file) return undefined;
  for (const heading of headings) {
    const match = file.content.match(new RegExp(`^#{1,4}\\s+[^\\n]*${heading}[^\\n]*\\n([\\s\\S]*?)(?=^#{1,4}\\s|$)`, "im"));
    const text = match?.[1]?.replace(/[`*_>#-]/g, " ").replace(/\s+/g, " ").trim();
    if (text && text.length >= 15) return text.slice(0, 280);
  }
  return undefined;
}

function inferTargetUser(content: string): string | undefined {
  const patterns: Array<[RegExp, string]> = [
    [/\bdevelopers?\b/i, "Software developers"],
    [/\bteams?\b/i, "Product or engineering teams"],
    [/\bcreators?\b/i, "Content creators"],
    [/\bdesigners?\b/i, "Designers"],
    [/\boperators?|administrators?\b/i, "System operators"],
    [/\busers?\b/i, "General software users"]
  ];
  return patterns.find(([pattern]) => pattern.test(content))?.[1];
}

function matchingExcerpt(file: CollectedFile, pattern: RegExp): string {
  const match = file.content.match(pattern);
  if (!match || match.index === undefined) return file.content.slice(0, 360);
  return file.content.slice(Math.max(0, match.index - 100), Math.min(file.content.length, match.index + match[0].length + 220));
}

function evidenceId(label: string, value: string): string {
  return `ev_${crypto.createHash("sha256").update(`${label}:${value}`).digest("hex").slice(0, 12)}`;
}
