import { LivepeerMcpClient } from "../app/lib/production/livepeer.ts";
import type { ProductionInstruction } from "../app/lib/production/types.ts";

function instruction(mediaType: "image" | "video"): ProductionInstruction {
  return {
    sceneId: `foundation-${mediaType}`,
    mediaSource: "livepeer-generated",
    mediaType,
    requestedCapability: mediaType === "image" ? process.env.LIVEPEER_IMAGE_CAPABILITY || "flux-schnell" : process.env.LIVEPEER_VIDEO_CAPABILITY || "pixverse-t2v",
    prompt: mediaType === "image"
      ? process.env.LIVEPEER_IMAGE_PROMPT || "A cinematic cyan robot editing a pitch storyboard in a dark creative studio, widescreen concept art"
      : process.env.LIVEPEER_VIDEO_PROMPT || "A cyan holographic storyboard comes alive in a dark creative studio, slow camera push, five second cinematic clip",
    claimIds: [], evidenceIds: [], continuity: "Previous: opening. Next: closing."
  };
}

async function main() {
  try {
    const client = new LivepeerMcpClient();
    const initializedAt = Date.now();
    await client.initialize();
    console.log(`Livepeer MCP session initialized: ${Date.now() - initializedAt}ms`);
    for (const kind of ["image", "video"] as const) {
      const result = await client.generate(instruction(kind));
      if (result.status !== "completed" || !result.outputReference) throw new Error(result.error || `${kind} generation returned no artifact.`);
      console.log(`[${kind}] requested capability: ${result.requestedCapability}`);
      console.log(`[${kind}] actual/executed capability: ${result.executedCapability}`);
      console.log(`[${kind}] job ID: ${result.jobId || "n/a (synchronous response)"}`);
      console.log(`[${kind}] output URL/reference: ${result.outputReference}`);
      console.log(`[${kind}] latency: ${result.latencyMs}ms`);
      console.log(`[${kind}] fallback/substitution: ${result.substitution ? JSON.stringify(result.substitution) : "none"}`);
    }
    console.log("LIVEPEER FOUNDATION TEST: PASS");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.log("LIVEPEER FOUNDATION TEST: FAIL");
    console.log(`Reason: ${reason}`);
    process.exitCode = 1;
  }
}

void main();
