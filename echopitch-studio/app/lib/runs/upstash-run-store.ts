import { Redis } from "@upstash/redis";
import { assertRunId, mergeRun, RUN_ID_PATTERN, type RunStore } from "./run-store.ts";
import type { PitchRun } from "./types.ts";

export interface RedisRunClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
}

export class UpstashRunStore implements RunStore {
  private readonly redis: RedisRunClient;

  constructor(redis: RedisRunClient = createRedisClient()) {
    this.redis = redis;
  }

  async get(id: string): Promise<PitchRun | undefined> {
    if (!RUN_ID_PATTERN.test(id)) return undefined;
    return (await this.redis.get<PitchRun>(runKey(id))) ?? undefined;
  }

  async save(run: PitchRun): Promise<PitchRun> {
    assertRunId(run.id);
    const next = { ...run, updatedAt: new Date().toISOString() };
    await this.redis.set(runKey(run.id), next);
    return next;
  }

  async update(id: string, patch: Partial<PitchRun>): Promise<PitchRun> {
    const current = await this.get(id);
    if (!current) throw new Error("Run not found.");
    return this.save(mergeRun(current, patch));
  }
}

function createRedisClient(): RedisRunClient {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Production run storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
  }
  return new Redis({ url, token });
}

function runKey(id: string): string {
  assertRunId(id);
  return `echopitch:run:${id}`;
}
