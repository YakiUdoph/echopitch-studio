import { NextRequest, NextResponse } from "next/server";
import { runIntelligencePipeline } from "../../lib/intelligence/pipeline";

interface RequestBody {
  githubUrl?: unknown;
  audience?: unknown;
  pitchGoal?: unknown;
  targetDuration?: unknown;
  additionalClaims?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    if (typeof body.githubUrl !== "string") return NextResponse.json({ error: "githubUrl must be a public GitHub repository URL." }, { status: 400 });
    const targetDuration = typeof body.targetDuration === "number" ? body.targetDuration : 90;
    if (!Number.isFinite(targetDuration) || targetDuration < 20 || targetDuration > 300) {
      return NextResponse.json({ error: "targetDuration must be between 20 and 300 seconds." }, { status: 400 });
    }
    const additionalClaims = Array.isArray(body.additionalClaims)
      ? body.additionalClaims.filter((claim): claim is string => typeof claim === "string").slice(0, 20)
      : [];
    const result = await runIntelligencePipeline({
      githubUrl: body.githubUrl,
      audience: typeof body.audience === "string" ? body.audience : "Hackathon judges",
      pitchGoal: typeof body.pitchGoal === "string" ? body.pitchGoal : "Explain the product with verifiable claims",
      targetDuration,
      additionalClaims
    });
    return NextResponse.json(result);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const status = /GitHub request failed \(404\)|Invalid GitHub|must use|must identify/.test(reason) ? 400 : 502;
    return NextResponse.json({ error: "Repository intelligence failed.", reason }, { status });
  }
}
