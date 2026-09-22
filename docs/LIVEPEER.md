# Livepeer Integration

## Why Livepeer is central

EchoPitch can understand a repository and plan a story without generative media. Livepeer Agent is the required execution path for any planned generated visual and for the application's per-scene narration attempts. EchoPitch connects those executions to verified claims, cost gates, critic decisions, and production receipts. A failed narration can degrade honestly to on-screen copy; a required generated visual must yield a usable artifact for delivery to continue.

Repository evidence remains the default where it communicates the truth directly. Livepeer is used when generation materially improves an explanatory scene and for the narration track.

## MCP endpoint and configuration

The server-only client reads `LIVEPEER_MCP_URL` and defaults to:

```text
https://agent.livepeer.org/api/mcp/creative
```

The current Creative MCP supports keyless demo access, and EchoPitch sends no Authorization header. No Livepeer secret is present in the application environment contract.

Optional configuration:

- `LIVEPEER_IMAGE_CAPABILITY`
- `LIVEPEER_VIDEO_CAPABILITY`
- `LIVEPEER_TTS_CAPABILITY`
- `LIVEPEER_POLL_INTERVAL_MS`
- `LIVEPEER_TIMEOUT_MS`

The client uses MCP protocol version `2025-03-26`, accepts JSON or server-sent-event responses, and supports an MCP session header when a server returns one. The current Creative endpoint can operate without one.

## Capability discovery

The first execution initializes MCP and calls:

```text
list_capabilities { kind: "ai", limit: 200 }
```

The resulting capability names are cached for that client instance. If the requested model is present, it is used exactly. Otherwise, EchoPitch selects the first available capability from a media-type-specific fallback list and records the substitution.

Current defaults used by the production path are:

- explanatory image: `flux-schnell`;
- per-scene TTS: `gemini-tts`.

The client contains video mappings for production instructions, but the current Production Director creates explanatory images, not generated video scenes. Tests cover exact image and TTS `create_media` request shapes without paid generation.

## Pre-run estimate

Every Livepeer attempt starts from a single `create_media` argument object containing the action, selected model, prompt, media parameters, session tag, persistence choice, and idempotency key. EchoPitch submits that object as one step in `submit_plan` propose mode.

```text
scene requires generation
→ submit exact create_media step for estimation
→ require status="proposed", plan_id, and numeric total_est_cost_usd
→ retain the raw and normalized estimate on the attempt
→ approve the same plan with confirm=true
→ poll get_plan
→ persist the completed scene attempt and returned actual-cost fields
→ critic
→ optional repair with a new proposal and estimate
```

The estimate is retained in memory before approval so the exact proposed plan can be confirmed. The production route persists it with the completed scene attempt; it does not perform a separate database write between proposal and approval. Narration estimates are persisted with the delivered narration state.

The application does not calculate or invent the estimate. It accepts Livepeer's returned `total_est_cost_usd` only when it is a finite, non-negative number. A missing or malformed estimate stops the attempt before approval.

The normalized estimate stores:

- plan ID;
- `proposed` status;
- estimated USD cost;
- currency; and
- the raw MCP response.

## Media generation

For generated visual scenes, EchoPitch currently sends:

- `action: generate`;
- `model_override` set to the discovered image capability;
- the claim-bounded scene prompt;
- `aspect_ratio: 16:9`;
- asynchronous execution;
- `persist: false`;
- a scene attribution tag and unique idempotency key.

EchoPitch approves the proposed plan and polls `get_plan` until it finds a successful terminal status and output URL. Failed, partial, cancelled, or error plans fail the attempt. Polling also has a configured timeout.

Because `persist` is currently false, EchoPitch stores the returned asset URL in the run but does not claim that Livepeer re-hosted it to durable storage.

## Narration

Each scene with narration is sent as a separate TTS production instruction. The `create_media` action is `tts`, the narration text is the prompt, and the selected TTS model is supplied as `model_override`. Each segment gets its own plan, estimate, approval, polling result, latency, output URL, and cost metadata.

Final Assembly embeds per-scene audio only when every required segment is complete and matches the exact scene narration. If one segment fails or is missing, the artifact uses on-screen copy and the receipt says audio was not embedded.

## Repair

The critic may request one repaired visual. The revised prompt names only the failed criteria and explicitly preserves the original verified narration, claim IDs, and evidence boundaries. Because repair calls the same generation executor again, it receives a new idempotency key, Livepeer plan, and estimate while using the client's discovered capability set. Total visual attempts remain capped at two.

## Production Receipt

For each Livepeer visual or narration execution, the persisted run and Production Receipt can retain:

- purpose and scene ID;
- requested and executed capabilities;
- returned job ID;
- completion/failure status;
- output reference;
- model substitution data;
- normalized estimate and raw estimate response;
- returned actual cost, paid cost, units, and unit kind when available;
- latency and error details;
- critic verdict and repair history for visuals.

Fields are optional when the provider does not return them. Absence is not reported as zero or as free.

## Cost discipline

EchoPitch limits generation structurally rather than claiming an invented budget:

- repository evidence is used when it is sufficient;
- a four-scene manifest budgets at most one generated explanatory visual when an eligible scene exists;
- every narrated scene receives its own TTS request;
- estimates come from Livepeer immediately before approval;
- repair is limited to one additional visual attempt.

The application does not expose participant balances or publish assumed prices.

## Failure handling

- Initialization or capability discovery failure returns a failed generation result.
- No suitable capability returns a failed result before proposal.
- Failed or malformed estimation prevents approval.
- Approval, polling, terminal-plan, missing-output, and timeout failures are recorded on the attempt.
- A visual failure enters the critic/repair path once; two attempts terminate the loop.
- If no visual attempt yields an output, production fails and assembly is blocked.
- TTS failure is recorded and assembly falls back to on-screen copy.

See [Failure Modes](FAILURE-MODES.md) for the user-visible consequences.

## What Livepeer does not do

EchoPitch itself handles repository collection, implementation-signal extraction, ClaimLock, audience/goal story planning, media-source decisions, prompt evidence boundaries, critic orchestration, run persistence, final assembly, and receipts.

Livepeer handles the media-generation and TTS execution layer, including capability availability, plan estimates, plan execution, job state, and returned media/cost metadata. That boundary keeps Livepeer central to production without attributing unrelated application logic to it.
