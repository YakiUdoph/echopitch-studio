import { NextResponse } from "next/server";
import { renderPitchArtifact } from "@/app/lib/production/assembler";
import type { ProductionContext } from "@/app/lib/production/types";
import { getRun } from "@/app/lib/runs/store";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const run = await getRun(id);
  if (!run?.intelligenceResult || !run.mediaPlan || !run.productions || !run.narration || !run.finalAssembly || run.finalAssembly.status !== "completed") {
    return NextResponse.json({ error: "Final pitch artifact is not available." }, { status: 404 });
  }
  const productionContext: ProductionContext = {
    intelligence: run.intelligenceResult.intelligence,
    claimLock: run.intelligenceResult.claimLock,
    manifest: run.intelligenceResult.storyManifest
  };
  const artifact = renderPitchArtifact(productionContext, run.mediaPlan, run.productions, run.narration);
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new NextResponse(artifact, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="echopitch-${id.slice(0, 8)}.html"`,
      "cache-control": "private, no-store",
      "content-security-policy": "default-src 'none'; img-src https: data:; media-src https:; style-src 'unsafe-inline'; script-src 'unsafe-inline';"
    }
  });
}
