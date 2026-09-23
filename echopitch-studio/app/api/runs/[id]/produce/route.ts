import { NextResponse } from "next/server";
import { createMediaPlan, directManifest } from "@/app/lib/production/director";
import { LivepeerMcpClient } from "@/app/lib/production/livepeer";
import { describeProductionFailure, produceScene } from "@/app/lib/production/orchestrator";
import { createProductionReceipt } from "@/app/lib/production/receipt";
import { inspectNarrationAssets, produceNarration } from "@/app/lib/production/narration";
import { assemblePitch } from "@/app/lib/production/assembler";
import { getRun, updateRun } from "@/app/lib/runs/store";
import type { ProductionContext } from "@/app/lib/production/types";

export const maxDuration = 300;

export async function POST(_: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  const run = await getRun(id);
  if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });
  if (!run.intelligenceResult) return NextResponse.json({ error: "Repository intelligence must complete before production." }, { status: 409 });
  if (run.productionReceipt) return NextResponse.json({ run });
  if (!['planning', 'failed'].includes(run.status)) return NextResponse.json({ error: `Run is currently ${run.status}.` }, { status: 409 });
  const context: ProductionContext = { intelligence: run.intelligenceResult.intelligence, claimLock: run.intelligenceResult.claimLock, manifest: run.intelligenceResult.storyManifest };
  try {
    const mediaPlan = createMediaPlan(context);
    const instructions = directManifest(context, mediaPlan);
    await updateRun(id, { status: "producing", mediaPlan, instructions, productions: [], error: undefined });
    const client = new LivepeerMcpClient();
    const productions = [];
    for (const instruction of instructions) {
      productions.push(await produceScene(context, instruction, client));
      await updateRun(id, { status: "producing", mediaPlan, instructions, productions });
    }
    const failed = productions.some((item) => item.finalVerdict === "FAILED");
    if (failed) throw new Error(describeProductionFailure(context, productions));
    await updateRun(id, { status: "reviewing", mediaPlan, instructions, productions });
    const narration = await inspectNarrationAssets(await produceNarration(context, client));
    const artifactReference = `/api/runs/${id}/artifact`;
    const { assembly } = assemblePitch(context, mediaPlan, productions, narration, artifactReference);
    const productionReceipt = createProductionReceipt(context, productions, assembly, narration);
    const complete = await updateRun(id, { status: "delivered", mediaPlan, instructions, productions, narration, finalAssembly: assembly, productionReceipt, error: undefined });
    return NextResponse.json({ run: complete });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateRun(id, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
