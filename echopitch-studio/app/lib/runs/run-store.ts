import type { PitchRun } from "./types.ts";

export const RUN_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface RunStore {
  get(id: string): Promise<PitchRun | undefined>;
  save(run: PitchRun): Promise<PitchRun>;
  update(id: string, patch: Partial<PitchRun>): Promise<PitchRun>;
}

export function assertRunId(id: string): void {
  if (!RUN_ID_PATTERN.test(id)) throw new Error("Invalid run identifier.");
}

export function mergeRun(current: PitchRun, patch: Partial<PitchRun>): PitchRun {
  return {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString()
  };
}
