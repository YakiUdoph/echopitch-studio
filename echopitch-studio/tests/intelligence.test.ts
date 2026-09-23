import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { applyClaimLock } from "../app/lib/intelligence/claim-lock.ts";
import { collectGitHubRepository, parseGitHubRepositoryUrl } from "../app/lib/intelligence/github.ts";
import { createStoryManifest } from "../app/lib/intelligence/story-manifest.ts";
import type { CandidateClaim, RepositoryIntelligence } from "../app/lib/intelligence/types.ts";
import { normalizeGitHubRepositoryUrl, pitchAudiences, pitchDurations, pitchGoals, validatePitchRunInput } from "../app/lib/runs/validation.ts";

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

test("collector reports nonexistent, inaccessible, and rate-limited repositories without fake success", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [status, label] of [[404, "Not Found"], [403, "Forbidden"], [429, "rate limit"]] as const) {
      let calls = 0;
      globalThis.fetch = async () => { calls += 1; return new Response(label, { status }); };
      await assert.rejects(() => collectGitHubRepository("https://github.com/example/unavailable"), new RegExp(`GitHub request failed \\(${status}\\).*${label}`, "i"));
      assert.equal(calls, status === 429 ? 3 : 1);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("composer exposes the complete selectable audience, duration, and pitch-goal contract", () => {
  assert.deepEqual([...pitchAudiences], ["Hackathon judges", "Investors", "Potential customers", "Developers", "General audience"]);
  assert.deepEqual([...pitchDurations], [30, 60, 90, 120]);
  assert.deepEqual([...pitchGoals], ["Product overview", "Hackathon pitch", "Investor pitch", "Technical walkthrough", "Customer demo"]);
});

test("every composer option validates and reaches Story Director unchanged", () => {
  const lock = applyClaimLock(intelligence, [{ id: "implemented", claim: "Provides an HTTP API", source: "capability", evidenceIds: ["ev-code"] }]);
  for (const audience of pitchAudiences) {
    const input = validatePitchRunInput({ githubUrl: intelligence.repository.url, audience, pitchGoal: pitchGoals[0], targetDuration: pitchDurations[0] });
    assert.equal(input?.audience, audience);
    assert.equal(createStoryManifest(intelligence, lock, input!.audience, input!.pitchGoal, input!.targetDuration).audience, audience);
  }
  for (const targetDuration of pitchDurations) {
    const input = validatePitchRunInput({ githubUrl: intelligence.repository.url, audience: pitchAudiences[0], pitchGoal: pitchGoals[0], targetDuration });
    assert.equal(input?.targetDuration, targetDuration);
    assert.equal(createStoryManifest(intelligence, lock, input!.audience, input!.pitchGoal, input!.targetDuration).targetDuration, targetDuration);
  }
  for (const pitchGoal of pitchGoals) {
    const input = validatePitchRunInput({ githubUrl: intelligence.repository.url, audience: pitchAudiences[0], pitchGoal, targetDuration: pitchDurations[0] });
    assert.equal(input?.pitchGoal, pitchGoal);
    assert.equal(createStoryManifest(intelligence, lock, input!.audience, input!.pitchGoal, input!.targetDuration).pitchGoal, pitchGoal);
  }
});

test("landing navigation targets the composer and dropdowns remain pointer-interactive", async () => {
  const source = await readFile(new URL("../app/components/landing/LandingPage.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/components/landing/LandingPage.module.css", import.meta.url), "utf8");
  assert.match(source, /\["How It Works", "Architecture", "Livepeer"\]/);
  assert.match(source, /https:\/\/livepeer\.org\//);
  assert.doesNotMatch(source, /View Source|SOURCE_URL/);
  assert.match(source, /href="#composer" onClick=\{focusComposer\}>Direct My Pitch/);
  assert.match(source, /repositoryInput\.current\?\.focus/);
  assert.match(source, /pitchAudiences\.map/);
  assert.match(source, /pitchDurations\.map/);
  assert.match(source, /pitchGoals\.map/);
  assert.match(source, /JSON\.stringify\(\{ githubUrl: normalizedUrl, audience, targetDuration: duration, pitchGoal \}\)/);
  assert.match(source, /router\.push\(`\/studio\?run=\$\{encodeURIComponent\(payload\.run\.id\)\}`\)/);
  assert.match(styles, /\.right\{[^}]*pointer-events:none/);
  assert.match(styles, /\.right button\{[^}]*pointer-events:auto/);
  for (const label of ["GitHub Repository", "Repository Intelligence", "ClaimLock Verification", "Story Director", "Production Director", "Repository Evidence + Livepeer Agent", "Pitch Critic", "Final Pitch Assembly", "Evidence Receipt + Production Receipt", "Upstash Redis"]) assert.match(source, new RegExp(label.replace(/[+]/g, "\\+")));
  assert.doesNotMatch(source, new RegExp(["ma", "nus"].join(""), "i"));
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
  assert.equal(manifest.scenes.length, 1);
  assert.equal(manifest.targetDuration, 90);
  assert.equal(manifest.scenes.reduce((total, scene) => total + scene.duration, 0), 15);
  assert.ok(manifest.scenes.every((scene) => !scene.claimIds.includes("invented")));
  assert.ok(manifest.scenes.every((scene) => scene.evidenceReferences.every((reference) => reference.evidenceIds.includes("ev-code"))));
  assert.ok(manifest.blockedClaims.some((claim) => claim.claimId === "invented"));
});

test("Story Director preserves a 120-second target without padding one supported claim", () => {
  const lock = applyClaimLock(intelligence, [{ id: "implemented", claim: "Provides an HTTP API", source: "capability", evidenceIds: ["ev-code"] }]);
  const manifest = createStoryManifest(intelligence, lock, "Developers", "Technical walkthrough", 120);
  assert.equal(manifest.audience, "Developers");
  assert.equal(manifest.pitchGoal, "Technical walkthrough");
  assert.match(manifest.title, /Technical walkthrough for Developers/);
  assert.equal(manifest.targetDuration, 120);
  assert.deepEqual(manifest.scenes.map((scene) => scene.duration), [15]);
  assert.equal(manifest.scenes.reduce((total, scene) => total + scene.duration, 0), 15);
  assert.match(manifest.scenes[0].purpose, /verified system/i);
  assert.ok(manifest.scenes.every((scene) => /technical mechanisms and repository evidence/i.test(scene.visualIntent)));
});

test("every supported duration target adapts scene count without duplicating claims", () => {
  const claims = Array.from({ length: 8 }, (_, index) => ({
    id: `claim-${index + 1}`, claim: `Verified capability ${index + 1}.`, status: "SUPPORTED" as const,
    evidence: [intelligence.evidence[0]], reason: "Implementation evidence.", confidence: 0.9,
    allowedNarration: `Verified capability ${index + 1}.`
  }));
  const lock = { claims, allowedClaimIds: claims.map((claim) => claim.id), blockedClaimIds: [] };
  for (const targetDuration of pitchDurations) {
    const manifest = createStoryManifest(intelligence, lock, "Hackathon judges", "Product overview", targetDuration);
    const claimIds = manifest.scenes.flatMap((scene) => scene.claimIds);
    assert.equal(manifest.targetDuration, targetDuration);
    assert.equal(manifest.scenes.length, targetDuration / 15);
    assert.equal(manifest.scenes.reduce((sum, scene) => sum + scene.duration, 0), targetDuration);
    assert.equal(new Set(claimIds).size, claimIds.length);
  }
});
