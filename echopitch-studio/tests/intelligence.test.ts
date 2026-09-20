import assert from "node:assert/strict";
import test from "node:test";
import { applyClaimLock } from "../app/lib/intelligence/claim-lock.ts";
import { parseGitHubRepositoryUrl } from "../app/lib/intelligence/github.ts";
import { createStoryManifest } from "../app/lib/intelligence/story-manifest.ts";
import type { CandidateClaim, RepositoryIntelligence } from "../app/lib/intelligence/types.ts";
import { normalizeGitHubRepositoryUrl } from "../app/lib/runs/validation.ts";

const intelligence: RepositoryIntelligence = {
  repository: { owner: "example", name: "project", url: "https://github.com/example/project", defaultBranch: "main" },
  productName: "Project",
  summary: "A test project",
  problem: "Insufficient evidence.",
  targetUser: "Insufficient evidence.",
  capabilities: [],
  technicalMechanisms: [],
  differentiators: [],
  inspectedPaths: ["src/api.ts", "README.md"],
  limitations: [],
  evidence: [
    { id: "ev-code", path: "src/api.ts", kind: "source", excerpt: "export async function POST", reason: "HTTP handler is implemented.", url: "https://github.com/example/project/blob/main/src/api.ts" },
    { id: "ev-readme", path: "README.md", kind: "documentation", excerpt: "The fastest analytics engine in the world.", reason: "README description.", url: "https://github.com/example/project/blob/main/README.md" }
  ]
};

test("parses only canonical public GitHub repository URLs", () => {
  assert.deepEqual(parseGitHubRepositoryUrl("https://github.com/example/project.git"), { owner: "example", name: "project" });
  assert.throws(() => parseGitHubRepositoryUrl("https://example.com/example/project"));
});

test("normalizes composer repository URLs and rejects non-repository GitHub paths", () => {
  assert.equal(normalizeGitHubRepositoryUrl(" https://github.com/example/project.git "), "https://github.com/example/project");
  assert.equal(normalizeGitHubRepositoryUrl("https://github.com/example/project/issues"), undefined);
  assert.equal(normalizeGitHubRepositoryUrl("https://github.com/example/project?tab=readme"), undefined);
  assert.equal(normalizeGitHubRepositoryUrl("http://github.com/example/project"), undefined);
});

test("ClaimLock supports implementation evidence, marks README-only claims partial, and rejects unsupported claims", () => {
  const candidates: CandidateClaim[] = [
    { id: "implemented", claim: "Provides an HTTP API", source: "capability", evidenceIds: ["ev-code"] },
    { id: "marketing", claim: "The fastest analytics engine in the world", source: "differentiator", evidenceIds: ["ev-readme"] },
    { id: "invented", claim: "Provides biometric authentication", source: "external" }
  ];
  const result = applyClaimLock(intelligence, candidates);
  assert.equal(result.claims.find((claim) => claim.id === "implemented")?.status, "SUPPORTED");
  assert.equal(result.claims.find((claim) => claim.id === "marketing")?.status, "PARTIAL");
  assert.equal(result.claims.find((claim) => claim.id === "invented")?.status, "UNSUPPORTED");
  assert.equal(result.claims.find((claim) => claim.id === "invented")?.reason, "Insufficient evidence.");
});

test("Story Manifest uses supported claims only and preserves narration-to-evidence provenance", () => {
  const lock = applyClaimLock(intelligence, [
    { id: "implemented", claim: "Provides an HTTP API", source: "capability", evidenceIds: ["ev-code"] },
    { id: "invented", claim: "Provides biometric authentication", source: "external" }
  ]);
  const manifest = createStoryManifest(intelligence, lock, "Judges", "Explain verified value", 90);
  assert.equal(manifest.scenes.length, 4);
  assert.equal(manifest.scenes.reduce((total, scene) => total + scene.duration, 0), 90);
  assert.ok(manifest.scenes.every((scene) => !scene.claimIds.includes("invented")));
  assert.ok(manifest.scenes.every((scene) => scene.evidenceReferences.every((reference) => reference.evidenceIds.includes("ev-code"))));
  assert.ok(manifest.blockedClaims.some((claim) => claim.claimId === "invented"));
});
