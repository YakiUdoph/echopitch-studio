import assert from "node:assert/strict";
import { runIntelligencePipeline } from "../app/lib/intelligence/pipeline.ts";

const repositories = [
  { label: "EchoPitch", url: "https://github.com/YakiUdoph/echopitch-studio" },
  { label: "Unrelated software", url: "https://github.com/expressjs/express" },
  { label: "Weak documentation", url: "https://github.com/octocat/Hello-World" }
];
const rejectedClaim = "This product provides biometric authentication with enterprise identity verification.";

async function main() {
  try {
    for (const repository of repositories) {
      const result = await runIntelligencePipeline({
        githubUrl: repository.url,
        audience: "Hackathon judges",
        pitchGoal: "Explain only capabilities supported by repository evidence",
        targetDuration: 90,
        additionalClaims: [rejectedClaim]
      });
      const rejected = result.claimLock.claims.find((claim) => claim.claim === rejectedClaim);
      assert.equal(rejected?.status, "UNSUPPORTED", `${repository.label} must reject the deliberate unsupported claim.`);
      assert.ok(!result.storyManifest.scenes.some((scene) => scene.claimIds.includes(rejected!.id)), `${repository.label} manifest included a blocked claim.`);
      assert.equal(result.storyManifest.scenes.length, 4);
      assert.ok(result.storyManifest.provenance.every((link) => link.evidenceIds.length > 0));

      console.log(`\n=== ${repository.label}: ${repository.url} ===`);
      console.log(`Product: ${result.intelligence.productName}`);
      console.log(`Summary: ${result.intelligence.summary}`);
      console.log(`Problem: ${result.intelligence.problem}`);
      console.log(`Target user: ${result.intelligence.targetUser}`);
      console.log(`Inspected paths (${result.intelligence.inspectedPaths.length}): ${result.intelligence.inspectedPaths.join(", ")}`);
      console.log(`Capabilities: ${result.intelligence.capabilities.map((item) => `${item.name} [${item.evidenceIds.join(",")}]`).join("; ") || "Insufficient evidence."}`);
      console.log(`Mechanisms: ${result.intelligence.technicalMechanisms.map((item) => `${item.name} [${item.evidenceIds.join(",")}]`).join("; ") || "Insufficient evidence."}`);
      console.log(`ClaimLock: ${result.claimLock.claims.map((claim) => `${claim.id}=${claim.status}`).join(", ")}`);
      console.log(`Rejected claim: ${rejected?.status} — ${rejected?.reason}`);
      console.log(`Manifest scenes: ${result.storyManifest.scenes.map((scene) => `${scene.sceneId}:${scene.claimIds.join("+") || "no-claim"}`).join(", ")}`);
      console.log(`Limitations: ${result.intelligence.limitations.join(" ") || "none"}`);

      if (repository.label === "Weak documentation") {
        const assertedClaims = result.claimLock.claims.filter((claim) => claim.status === "SUPPORTED");
        assert.ok(result.intelligence.limitations.length > 0 || assertedClaims.length <= 3, "Weak repository analysis was not conservative.");
      }
    }
    console.log("\nECHOPITCH INTELLIGENCE INTEGRATION TEST: PASS");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("ECHOPITCH INTELLIGENCE INTEGRATION TEST: FAIL");
    console.error(`Reason: ${reason}`);
    process.exitCode = 1;
  }
}

void main();
