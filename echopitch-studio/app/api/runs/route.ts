import { NextResponse } from "next/server";
import { createRun } from "@/app/lib/runs/store";
import { normalizeGitHubRepositoryUrl, pitchDurations, validatePitchRunInput } from "@/app/lib/runs/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { githubUrl?: unknown; audience?: unknown; pitchGoal?: unknown; targetDuration?: unknown };
    const githubUrl = normalizeGitHubRepositoryUrl(typeof body.githubUrl === "string" ? body.githubUrl : "");
    if (!githubUrl) return NextResponse.json({ error: "Enter a canonical public GitHub repository URL." }, { status: 400 });
    const targetDuration = Number(body.targetDuration);
    if (!pitchDurations.includes(targetDuration as (typeof pitchDurations)[number])) return NextResponse.json({ error: "Duration must be 30, 60, 90, or 120 seconds." }, { status: 400 });
    const input = validatePitchRunInput(body);
    if (!input) return NextResponse.json({ error: "Choose a valid audience and pitch goal." }, { status: 400 });
    const run = await createRun(input);
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 }); }
}
