import { NextResponse } from "next/server";
import { createRun } from "@/app/lib/runs/store";
import { normalizeGitHubRepositoryUrl, pitchAudiences, pitchDurations, pitchGoals } from "@/app/lib/runs/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { githubUrl?: unknown; audience?: unknown; pitchGoal?: unknown; targetDuration?: unknown };
    const githubUrl = normalizeGitHubRepositoryUrl(typeof body.githubUrl === "string" ? body.githubUrl : "");
    if (!githubUrl) return NextResponse.json({ error: "Enter a canonical public GitHub repository URL." }, { status: 400 });
    const targetDuration = Number(body.targetDuration);
    if (!pitchDurations.includes(targetDuration as (typeof pitchDurations)[number])) return NextResponse.json({ error: "Duration must be 30, 60, 90, or 120 seconds." }, { status: 400 });
    const audience = typeof body.audience === "string" && pitchAudiences.includes(body.audience as (typeof pitchAudiences)[number]) ? body.audience : undefined;
    const pitchGoal = typeof body.pitchGoal === "string" && pitchGoals.includes(body.pitchGoal as (typeof pitchGoals)[number]) ? body.pitchGoal : undefined;
    if (!audience || !pitchGoal) return NextResponse.json({ error: "Choose a valid audience and pitch goal." }, { status: 400 });
    const run = await createRun({ githubUrl, audience, pitchGoal, targetDuration });
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 }); }
}
