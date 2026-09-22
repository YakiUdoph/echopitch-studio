import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assemblePitch, renderPitchArtifact } from "../app/lib/production/assembler.ts";
import type { MediaPlanItem, NarrationProduction, ProductionContext, SceneProduction } from "../app/lib/production/types.ts";
import { FileSystemRunStore } from "../app/lib/runs/filesystem-run-store.ts";
import { createRun } from "../app/lib/runs/store.ts";
import { UpstashRunStore, type RedisRunClient } from "../app/lib/runs/upstash-run-store.ts";
import type { PitchRun } from "../app/lib/runs/types.ts";

const context: ProductionContext = {
  intelligence: {
    repository: { owner: "example", name: "durable", url: "https://github.com/example/durable", defaultBranch: "main" },
    productName: "Durable", summary: "Stored summary", problem: "Stored problem", targetUser: "Developers",
    capabilities: [], technicalMechanisms: [], differentiators: [], inspectedPaths: ["README.md"], limitations: [],
    evidence: [{ id: "ev-readme", path: "README.md", kind: "documentation", excerpt: "Durable evidence", reason: "Documented", url: "https://github.com/example/durable/blob/main/README.md" }]
  },
  claimLock: {
    allowedClaimIds: ["claim-durable"], blockedClaimIds: [],
    claims: [{ id: "claim-durable", claim: "Persists verified state.", status: "SUPPORTED", evidence: [], reason: "Documented", confidence: 1, allowedNarration: "Persists verified state." }]
  },
  manifest: {
    title: "Durable pitch", audience: "Judges", pitchGoal: "Explain persistence", targetDuration: 30, blockedClaims: [], provenance: [],
    scenes: [{ sceneId: "scene-1", purpose: "Show durability", duration: 30, narration: "Persists verified state.", visualIntent: "Show evidence", claimIds: ["claim-durable"], evidenceReferences: [{ claimId: "claim-durable", evidenceIds: ["ev-readme"] }], recommendedMediaType: "repository-ui" }]
  }
};

const mediaPlan: MediaPlanItem[] = [{
  sceneId: "scene-1", narrativePurpose: "Show durability", narration: "Persists verified state.", verifiedClaimIds: ["claim-durable"], evidenceIds: ["ev-readme"],
  preferredVisualSource: "repository-evidence-card", mediaType: "evidence-card", productionRationale: "Use repository evidence."
}];
const productions: SceneProduction[] = [{ sceneId: "scene-1", mediaSource: "existing-product-evidence", attempts: [], finalVerdict: "WARNING" }];
const narration: NarrationProduction = {
  method: "livepeer-tts", status: "generated", requestedCapability: "gemini-tts", executedCapability: "gemini-tts", latencyMs: 4,
  segments: [{ sceneId: "scene-1", narration: "Persists verified state.", status: "generated", requestedCapability: "gemini-tts", executedCapability: "gemini-tts", outputReference: "https://example.com/narration-scene-1.mp3", latencyMs: 4 }]
};
const intelligenceResult = { intelligence: context.intelligence, claimLock: context.claimLock, storyManifest: context.manifest };

test("filesystem store survives fresh adapter instances and reconstructs the artifact", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "echopitch-store-"));
  try {
    const firstRequestStore = new FileSystemRunStore(directory);
    const created = await createRun({ githubUrl: context.intelligence.repository.url, audience: "Judges", pitchGoal: "Explain persistence", targetDuration: 30 }, firstRequestStore);
    const artifactReference = `/api/runs/${created.id}/artifact`;
    const { assembly } = assemblePitch(context, mediaPlan, productions, narration, artifactReference);
    await firstRequestStore.update(created.id, {
      status: "delivered", intelligenceResult, mediaPlan, productions, narration, finalAssembly: assembly
    });

    const secondRequestStore = new FileSystemRunStore(directory);
    const retrieved = await secondRequestStore.get(created.id);
    assert.equal(retrieved?.status, "delivered");

    const thirdRequestStore = new FileSystemRunStore(directory);
    const artifactRun = await thirdRequestStore.get(created.id);
    assert.ok(artifactRun?.intelligenceResult && artifactRun.mediaPlan && artifactRun.productions && artifactRun.narration);
    const restoredContext: ProductionContext = {
      intelligence: artifactRun.intelligenceResult.intelligence,
      claimLock: artifactRun.intelligenceResult.claimLock,
      manifest: artifactRun.intelligenceResult.storyManifest
    };
    const html = renderPitchArtifact(restoredContext, artifactRun.mediaPlan, artifactRun.productions, artifactRun.narration);
    assert.match(html, /Durable pitch/);
    assert.match(html, /Persists verified state/);
    assert.match(html, /https:\/\/example\.com\/narration-scene-1\.mp3/);
    assert.equal(artifactRun.narration.segments?.[0]?.sceneId, "scene-1");
    assert.equal(html, renderPitchArtifact(restoredContext, artifactRun.mediaPlan, artifactRun.productions, artifactRun.narration));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("persisted runs retain the selected composer configuration", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "echopitch-config-"));
  try {
    const store = new FileSystemRunStore(directory);
    const created = await createRun({ githubUrl: "https://github.com/example/configured", audience: "Potential customers", pitchGoal: "Customer demo", targetDuration: 120 }, store);
    const restored = await new FileSystemRunStore(directory).get(created.id);
    assert.deepEqual(restored?.input, { githubUrl: "https://github.com/example/configured", audience: "Potential customers", pitchGoal: "Customer demo", targetDuration: 120 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Upstash adapter contract survives fresh clients without process-local state", async () => {
  const durableService = new Map<string, unknown>();
  const firstRequestStore = new UpstashRunStore(new TestRedisClient(durableService));
  const created = await createRun({ githubUrl: context.intelligence.repository.url, audience: "Judges", pitchGoal: "Explain persistence", targetDuration: 30 }, firstRequestStore);
  await firstRequestStore.update(created.id, { status: "planning", intelligenceResult });

  const secondRequestStore = new UpstashRunStore(new TestRedisClient(durableService));
  const retrieved = await secondRequestStore.get(created.id);
  assert.equal(retrieved?.status, "planning");
  assert.equal(retrieved?.intelligenceResult?.storyManifest.title, "Durable pitch");
});

test("stores reject traversal identifiers and artifact JSON cannot terminate its script", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "echopitch-store-security-"));
  try {
    const store = new FileSystemRunStore(directory);
    assert.equal(await store.get("../../outside"), undefined);
    await assert.rejects(() => store.save({ id: "../../outside" } as PitchRun), /Invalid run identifier/);
    const hostile = structuredClone(context);
    hostile.manifest.title = "</script><img src=x onerror=alert(1)>";
    const html = renderPitchArtifact(hostile, mediaPlan, productions, narration);
    assert.doesNotMatch(html, /const pitch=.*<\/script>/);
    assert.match(html, /\\u003c\/script\\u003e/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

class TestRedisClient implements RedisRunClient {
  private readonly values: Map<string, unknown>;
  constructor(values: Map<string, unknown>) { this.values = values; }
  async get<T>(key: string): Promise<T | null> {
    const value = this.values.get(key);
    return value === undefined ? null : structuredClone(value) as T;
  }
  async set(key: string, value: unknown): Promise<unknown> {
    this.values.set(key, structuredClone(value));
    return "OK";
  }
}
