# Failure Modes

This document describes current implemented behavior. “Retry” means an automatic application retry, not a suggestion that a user can refresh or start another run.

| Failure | System behavior | What the user sees | Automatic retry | Output blocked? |
| --- | --- | --- | --- | --- |
| Malformed repository URL | `POST /api/runs` rejects non-canonical, non-HTTPS, nested-path, query/fragment, credentialed, or non-GitHub input with HTTP 400. No run is created. | Landing composer shows the returned validation error and refocuses the URL field. | No. | Yes. |
| Nonexistent or inaccessible public repository | Run creation can succeed because the URL shape is valid. Analysis later receives a GitHub error, marks the run `failed`, and returns HTTP 502 from the analyze route. | Studio shows **Run stopped honestly** and the underlying GitHub failure message. | GitHub transport retries apply only to transient cases; a normal 404 is not retried. | Yes. |
| GitHub transport or rate-limit failure | Repository requests retry on network errors and HTTP 429/502/503/504, then throw after the third attempt. | Studio enters the failed state with the real analysis error. | Up to three GitHub request attempts. | Yes. |
| Individual prioritized blob cannot be read | Collector skips that file, counts it as unreadable, and records a limitation. Other selected files continue. | Repository Intelligence limitations name the number of unreadable prioritized files. | Each underlying GitHub request can use the transient retry policy. | No, unless no usable evidence remains and a later stage cannot proceed meaningfully. |
| Repository tree is truncated or inspection cap is reached | Analysis uses the highest-priority visible files and records the limitation. | Limitation appears in Repository Intelligence details. | No. | No. |
| Insufficient implementation evidence | Intelligence records missing capabilities/problem/user as insufficient. ClaimLock blocks weak claims. Story scenes use supported identity/evidence where available or neutral “Insufficient evidence” copy. | Low/zero capability counts, evidence limitations, blocked claims, and conservative scene copy. | No. | Not automatically; the product may deliver an evidence-only pitch if the remaining scene data is usable. |
| Documentation-only or unsupported claim | ClaimLock marks it `PARTIAL` or `UNSUPPORTED`, omits allowed narration, and includes it in blocked claims. | Verify panel labels the claim and says it is excluded from narration. | No. | The claim is blocked, not the whole run. |
| Claim boundary violated during direction | Production Director throws if a scene references a claim ClaimLock did not allow. Production route catches the error and marks the run failed. | **Run stopped honestly** with the claim-boundary error. | No. | Yes. |
| Livepeer MCP initialization failure | The generation executor returns a failed result with the real error. The visual critic requests repair after the first failed attempt. | Produce/Review state eventually shows an unusable scene or run error. | One visual repair attempt; no separate transport retry inside MCP RPC. | Yes if both visual attempts have no usable output. |
| Capability discovery fails or no suitable capability exists | Attempt fails before plan proposal. | Failure is retained in the production attempt and run error if the scene ultimately fails. | One visual repair attempt. | Yes if no usable visual results. |
| Pre-run estimate fails, is malformed, or lacks a numeric USD total | EchoPitch records the response/error and does not send `confirm: true`. | Production attempt records an estimate failure; terminal scene failure stops the run. | A rejected visual receives the one bounded repair attempt, which requests a new estimate. TTS moves to the next segment but overall narration becomes failed. | Visual: yes after two unusable attempts. Narration: no; delivery falls back to on-screen copy. |
| Livepeer plan approval, polling, cancellation, partial completion, terminal error, or timeout | Attempt is marked failed or timed out. `failed`, `partial`, `cancelled`, and `error` plan states are terminal failures. | Attempt error is retained; final run shows a truthful failure if no visual survives. | One visual repair attempt. | Yes if no usable visual survives. |
| Livepeer completes without an output URL | Attempt fails with “completed without an output reference.” | Error appears in attempt/run state. | One visual repair attempt. | Yes if both attempts are unusable. |
| Critic rejects the first generated visual | A repair plan appends only failed criteria and preserves verified narration, claims, and evidence. The executor performs one newly estimated attempt. | Review section can show one bounded repair and its problems. | Exactly once. | Not yet. |
| Critic rejects the second attempt but a usable output exists | Loop terminates with `WARNING`; the most recent usable output is retained. | Scene is labeled **Usable with note** and the maximum-attempt warning is preserved. | No further retry. | No. |
| Both visual attempts produce no usable output | Scene becomes `FAILED`; production route throws before narration and assembly and marks the run failed. | **Run stopped honestly** with the production failure. | No after the second attempt. | Yes. |
| Repository evidence scene has no reference | Scene is immediately `FAILED` without calling Livepeer. | Run stops during production. | No. | Yes. |
| One or more narration segments fail | All scene requests are recorded; narration status becomes `failed`. Final Assembly treats narration as incomplete. | Delivered artifact shows on-screen copy, receipt says narration is not embedded, and narration error names failed scene IDs. | No narration repair loop. | No, provided visuals are usable. |
| Narration set is incomplete or does not match current scene text | Assembler refuses to embed the partial audio set. | Narration metric reports on-screen copy rather than Livepeer audio. | No. | No. |
| Browser blocks or cannot load narration during playback | Player pauses, records a console diagnostic, displays a status message, and changes the control to Resume. | “Narration playback was blocked or could not be loaded. Select Resume to retry.” | User-triggered Resume retries playback. | The artifact remains visible; audible playback is paused. |
| Browser reaches an audio segment after that asset's duration | Player skips that audio start and records an `ended-before-offset` diagnostic. | Scene copy remains visible; no false audible start is claimed. | No. | No. |
| Final assembly is missing scene production or a required generated artifact | Assembler throws and cannot mark the run delivered. | Run enters the failed state with the assembly/production error. | No. | Yes. |
| Artifact requested before complete delivery | Artifact route returns HTTP 404 with “Final pitch artifact is not available.” | Browser receives the JSON error instead of partial HTML. | No. | Yes. |
| Upstash production configuration is missing | Store construction throws because both Redis URL and token are required in production. | API request fails; no durable production run can be confirmed. | No. | Yes. |
| Filesystem or Redis write/read fails | The store error propagates. Most route operations cannot complete; a failure while trying to record another failure is not specially recovered. | Request error or unavailable run. The application does not claim persistence succeeded. | No store-level retry is implemented. | Yes when required state cannot be read or written. |

## Playback safeguards

The final artifact prepares narration from a user gesture before starting the timeline, tracks scene boundaries, pauses old scene audio, and reports rejected playback. It exposes Play/Pause/Resume, Seek, and Restart. Complete per-scene narration is required before any narration set is embedded; otherwise the artifact remains text-only.

## Deliberate termination rules

- GitHub transient request attempts: maximum three.
- Generated visual attempts: maximum two total.
- Narration attempts: one per narrated scene.
- Livepeer plan polling: bounded by `LIVEPEER_TIMEOUT_MS` (ten minutes by default in the client, subject to the hosting route's execution limit).
- Production route maximum duration: 300 seconds.
