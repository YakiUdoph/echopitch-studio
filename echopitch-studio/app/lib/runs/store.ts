import crypto from "node:crypto";
import type { IntelligencePipelineInput } from "../intelligence/types.ts";
import { FileSystemRunStore } from "./filesystem-run-store.ts";
import type { RunStore } from "./run-store.ts";
import type { PitchRun } from "./types.ts";
import { UpstashRunStore } from "./upstash-run-store.ts";

let defaultStore: RunStore | undefined;

export function getRunStore(): RunStore {
  defaultStore ??= createRunStore();
  return defaultStore;
}

export function createRunStore(): RunStore {
  const configured = process.env.ECHOPITCH_RUN_STORE?.trim().toLowerCase();
  if (configured && !["filesystem", "upstash"].includes(configured)) {
    throw new Error("ECHOPITCH_RUN_STORE must be either filesystem or upstash.");
  }
  if (configured === "filesystem") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ECHOPITCH_RUN_STORE=filesystem is local-only and cannot be used in production.");
    }
    return new FileSystemRunStore();
  }
  if (configured === "upstash" || process.env.NODE_ENV === "production" || hasUpstashEnvironment()) {
    return new UpstashRunStore();
  }
  return new FileSystemRunStore();
}

export async function createRun(input: IntelligencePipelineInput, store = getRunStore()): Promise<PitchRun> {
  const now = new Date().toISOString();
  return store.save({ id: crypto.randomUUID(), status: "collecting", input, createdAt: now, updatedAt: now });
}

export function getRun(id: string, store = getRunStore()): Promise<PitchRun | undefined> {
  return store.get(id);
}

export function saveRun(run: PitchRun, store = getRunStore()): Promise<PitchRun> {
  return store.save(run);
}

export function updateRun(id: string, patch: Partial<PitchRun>, store = getRunStore()): Promise<PitchRun> {
  return store.update(id, patch);
}

function hasUpstashEnvironment(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_TOKEN);
}
