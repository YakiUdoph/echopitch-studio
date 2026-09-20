import { NextResponse } from "next/server";
import { getRun } from "@/app/lib/runs/store";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const run = await getRun(id);
  return run ? NextResponse.json({ run }) : NextResponse.json({ error: "Run not found." }, { status: 404 });
}
