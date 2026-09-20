import { NextResponse } from "next/server";
import { analyzeRepository } from "@/app/lib/intelligence/repository-intelligence";
import { applyClaimLock, candidateClaimsFromIntelligence } from "@/app/lib/intelligence/claim-lock";
import { createStoryManifest } from "@/app/lib/intelligence/story-manifest";
import { getRun, updateRun } from "@/app/lib/runs/store";

export const maxDuration = 60;

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const run = await getRun(id);
  if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });
  if (run.intelligenceResult) return NextResponse.json({ run });
  if (!["collecting", "failed"].includes(run.status)) return NextResponse.json({ error: `Run is currently ${run.status}.` }, { status: 409 });
  try {
    await updateRun(id, { status: "understanding", error: undefined });
    const intelligence = await analyzeRepository(run.input.githubUrl);
    await updateRun(id, { status: "verifying" });
    const claimLock = applyClaimLock(intelligence, candidateClaimsFromIntelligence(intelligence, run.input.additionalClaims));
    await updateRun(id, { status: "planning" });
    const storyManifest = createStoryManifest(intelligence, claimLock, run.input.audience, run.input.pitchGoal, run.input.targetDuration);
    const complete = await updateRun(id, { status: "planning", intelligenceResult: { intelligence, claimLock, storyManifest } });
    return NextResponse.json({ run: complete });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateRun(id, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
