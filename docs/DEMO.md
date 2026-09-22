# EchoPitch Demo Guide

## Demo objective

In roughly two to three minutes, prove that:

1. a public repository enters the system;
2. EchoPitch identifies implementation evidence;
3. ClaimLock verifies and blocks claims;
4. Story Director creates an audience-aware plan;
5. Livepeer supplies a real estimate before generation;
6. Livepeer executes the required visual and per-scene narration;
7. the deterministic critic accepts or repairs the generated attempt;
8. a playable pitch is assembled; and
9. Evidence and Production Receipts preserve provenance.

## Recommended demo configuration

- **Repository:** `https://github.com/sindresorhus/ky`
- **Audience:** Hackathon judges
- **Duration:** 30 seconds
- **Pitch goal:** Hackathon pitch

`sindresorhus/ky` is the public foreign repository used by the current end-to-end gate script. It is a demo input, not hardcoded behavior. The exact landing-page configuration above uses supported UI values; run it before recording because GitHub contents and external media availability can change.

The current Vercel deployment is access-protected. Remove or configure Vercel access protection for judges before publishing the final demo link. Do not claim the link is public until an unauthenticated check succeeds.

## Demo sequence

### 0:00–0:20 — Configure the run

1. Open EchoPitch.
2. Paste the repository URL.
3. Select Hackathon judges, 30 seconds, and Hackathon pitch.
4. Select **Direct My Pitch**.

Narration cue: “EchoPitch starts from a real public repository and a specific communication goal.”

### 0:20–0:50 — Understand and verify

1. In **Understand**, show the product summary, implemented capabilities, technical mechanisms, inspected paths, and any limitations.
2. In **Verify**, show supported, partial, and unsupported counts.
3. Open one supported claim to show its repository evidence path.
4. Open a blocked claim if present and show that it is excluded from narration.

Narration cue: “README language is not enough; implementation evidence controls what the pitch may say.”

### 0:50–1:15 — Plan

1. Show the four-scene Story Manifest.
2. Point out the selected audience, goal, exact total duration, narration, and evidence IDs.
3. Open the technical media plan after it becomes available.

Narration cue: “Story Director decides what to say; Production Director decides how to show it.”

### 1:15–1:50 — Produce with Livepeer

1. Select **Produce My Pitch**.
2. Show which scenes use repository evidence and which explanatory scene is assigned to Livepeer.
3. In captured logs or the persisted Production Receipt, show the Livepeer plan ID and estimate before the resulting media execution.
4. Show requested and executed capabilities, returned job ID when available, output URL, and actual cost/unit fields only when returned.

Narration cue: “The exact Livepeer call is estimated first. Without a valid estimate, EchoPitch does not approve generation.”

Do not expose environment values, credentials, participant balances, or private organizer material in the recording.

### 1:50–2:10 — Review and repair

1. Show the critic verdict for the generated attempt and explain that it validates instruction/result metadata, not image pixels.
2. If no repair occurred, state that the first output passed; do not imply a repair.
3. If a repair occurred, open the repair details and show the second attempt and its separate estimate.

Narration cue: “Repair is evidence-bounded and terminates after the second visual attempt.”

### 2:10–2:45 — Deliver and prove provenance

1. Play the final artifact and seek across a scene boundary.
2. Show narration status. If TTS is unavailable, explicitly show the honest on-screen-copy fallback.
3. Open the Evidence Receipt to trace narration to repository paths.
4. Open the Production Receipt to show media source, capabilities, attempts, jobs, artifacts, and repair count.
5. Open or download the final HTML artifact.

Narration cue: “The result is playable, and every story and production decision remains inspectable.”

## What judges should notice

- Livepeer is the execution infrastructure for generated visuals and narration.
- Every Livepeer attempt is estimate-gated before approval.
- ClaimLock prevents unsupported repository storytelling.
- Repository evidence and generated media have distinct, visible roles.
- Story planning and production planning are separate stages.
- Critic repair is bounded rather than open-ended.
- Failed narration is not presented as successful audio.
- The Evidence Receipt explains what the story says; the Production Receipt explains how it was produced.

## Before recording

- Verify the deployment is accessible without the project owner's Vercel session.
- Run the selected repository once and confirm current GitHub/API availability.
- Confirm Upstash production variables are configured.
- Confirm the Livepeer Creative MCP endpoint initializes and returns estimates.
- Do not run repeated generations merely to capture a prettier outcome.
- Record the real outcome, including any honest fallback state.

Demo video: coming before final submission.
