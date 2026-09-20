import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertRunId, mergeRun, RUN_ID_PATTERN, type RunStore } from "./run-store.ts";
import type { PitchRun } from "./types.ts";

export class FileSystemRunStore implements RunStore {
  private readonly runDirectory: string;

  constructor(runDirectory = path.join(process.cwd(), ".data", "runs")) {
    this.runDirectory = runDirectory;
  }

  async get(id: string): Promise<PitchRun | undefined> {
    if (!RUN_ID_PATTERN.test(id)) return undefined;
    try {
      return JSON.parse(await readFile(path.join(this.runDirectory, `${id}.json`), "utf8")) as PitchRun;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }

  async save(run: PitchRun): Promise<PitchRun> {
    assertRunId(run.id);
    await mkdir(this.runDirectory, { recursive: true });
    const next = { ...run, updatedAt: new Date().toISOString() };
    await writeFile(path.join(this.runDirectory, `${run.id}.json`), JSON.stringify(next, null, 2), "utf8");
    return next;
  }

  async update(id: string, patch: Partial<PitchRun>): Promise<PitchRun> {
    const current = await this.get(id);
    if (!current) throw new Error("Run not found.");
    return this.save(mergeRun(current, patch));
  }
}
