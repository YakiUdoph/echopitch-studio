# EchoPitch Studio — Product Requirements Document

## 1. Product thesis

A working repository contains enough evidence to direct a truthful product pitch. EchoPitch converts that evidence into a structured, playable pitch while preserving the chain from implementation evidence to narration and media production.

## 2. Problem

Builders commonly finish software before they finish a credible explanation of it. Producing a pitch still requires several disconnected tasks: repository review, claim selection, story writing, evidence gathering, media generation, narration, quality review, assembly, and provenance tracking. The work is slow and makes it easy for unsupported marketing language to enter the final story.

## 3. Primary user

The primary user is a software builder, founder, or developer who needs to communicate a working public repository to judges, customers, investors, developers, or a general audience.

## 4. Current workaround

The user manually reads code and documentation, decides which claims are safe, drafts a script, captures or creates visuals, records narration, reviews the output, edits the pieces together, and reconstructs supporting evidence when challenged.

## 5. Product promise

**Repository → evidence-grounded autonomous pitch.**

EchoPitch produces a four-scene interactive HTML pitch from a public GitHub repository. It exposes what it inspected, what it allowed or blocked, how each scene was produced, and what happened during media generation.

## 6. User journey

1. Paste a canonical public GitHub repository URL.
2. Select an audience.
3. Select 30, 60, 90, or 120 seconds.
4. Select a pitch goal.
5. Repository Intelligence inspects prioritized repository files.
6. ClaimLock verifies candidate claims.
7. Story Director creates the Story Manifest.
8. The user starts production from the Studio.
9. Production Director chooses repository evidence or Livepeer; generated visuals are reviewed and may receive one repair.
10. Livepeer TTS is requested per narrated scene.
11. Final Assembly creates a playable HTML artifact.
12. The Studio exposes Evidence and Production Receipts.

## 7. Functional requirements

### GitHub input

- Accept only canonical `https://github.com/owner/repository` URLs, optionally ending in `.git`.
- Reject issue paths, query strings, fragments, credentials, non-HTTPS URLs, and non-GitHub hosts at run creation.
- Use GitHub metadata, recursive tree, and blob APIs to inspect public repositories.
- Support an optional `GITHUB_TOKEN` for server-side GitHub requests.

### Configuration

- Offer the implemented audiences: Hackathon judges, Investors, Potential customers, Developers, and General audience.
- Offer durations of 30, 60, 90, and 120 seconds.
- Offer Product overview, Hackathon pitch, Investor pitch, Technical walkthrough, and Customer demo goals.
- Persist the exact selected configuration with the run.

### Repository Intelligence

- Rank and inspect useful text files while excluding dependencies, generated output, lockfiles, binaries, and oversized files.
- Cap inspection at 18 files, 80 KB per file, and 360 KB total.
- Extract repository identity, summary, problem framing, likely target user, implemented capabilities, technical mechanisms, evidence, inspected paths, and limitations.
- Derive capability signals from non-documentation source, configuration, schema, and manifest files.

### ClaimLock

- Create claims from repository identity, problem framing, capabilities, mechanisms, differentiators, and optional external claims.
- Classify claims as `SUPPORTED`, `PARTIAL`, or `UNSUPPORTED`.
- Permit narration only for supported claims with allowed narration.
- Preserve evidence paths, excerpts, reasons, URLs, and confidence.
- Treat documentation-only capability claims as partial rather than implemented proof.

### Story Director

- Create exactly four scenes.
- Distribute the selected duration across those scenes.
- Adapt scene purposes and visual framing to recognized audiences and goals.
- Preserve claim and evidence references for every narrated statement.
- Emit neutral “Insufficient evidence” copy rather than inventing behavior when no allowed claim is available.

### Production Director

- Decide how each Story Manifest scene should be produced without changing its claims.
- Prefer a presentation-ready repository asset when one is present in evidence.
- Use a designed repository evidence card when generation adds little value.
- Select a limited explanatory Livepeer image when source/configuration evidence is true but not presentation-ready.
- Preserve neighboring-scene continuity and evidence boundaries in production instructions.

### Livepeer execution and estimates

- Use the Creative MCP endpoint configured by `LIVEPEER_MCP_URL`, with the public Creative endpoint as the default.
- Initialize MCP and discover current AI capabilities before generation.
- Use the requested capability when available or record a substitution from a bounded fallback list.
- Propose the exact `create_media` step with `submit_plan` before every image, video, or TTS execution.
- Require a proposed plan identifier and numeric `total_est_cost_usd`; do not approve generation otherwise.
- Approve the same plan and poll `get_plan` to a terminal state.
- Persist the raw estimate and returned cost/unit data.

### Critic and repair

- Evaluate each generated visual attempt's production contract for preserved narration and purpose, allowed claim IDs, an inspectable HTTPS artifact, neighboring-scene continuity, and valid completed execution.
- Accept a passing artifact immediately.
- On failure, create a repair instruction that preserves narration, claim IDs, and evidence boundaries.
- Permit at most two visual attempts total.
- Obtain a fresh Livepeer estimate for the repair attempt.
- Do not represent the deterministic contract check as pixel-level or semantic inspection of the rendered image.

### Narration

- Request one Livepeer TTS asset for each scene with non-empty narration.
- Associate every narration segment with its scene and production evidence.
- Embed audio only when every required segment succeeded and still matches the scene narration.
- Fall back to on-screen copy if narration is incomplete or failed.

### Assembly and receipts

- Reject assembly when any scene has no usable production data or a required generated visual has no artifact.
- Generate an interactive HTML artifact with Play, Pause, Resume, Seek, and Restart behavior.
- Offer inline viewing and HTML download.
- Produce an Evidence Receipt mapping scenes to claim and evidence IDs.
- Produce a Production Receipt with media source, requested/executed capability, attempts, critic verdicts, repairs, returned job IDs, output URLs, failures, substitutions, latency, estimates, actual costs when available, narration state, and assembly state.

### Persistence

- Persist the complete run state after major stages and after every visual scene.
- Use filesystem storage for local development unless Upstash is configured.
- Require Upstash Redis configuration in production.
- Reconstruct the final artifact from persisted intelligence, plan, production, narration, and assembly state on a later request.

## 8. Truthfulness requirements

- Never place `PARTIAL` or `UNSUPPORTED` claims in narration.
- Never treat README marketing copy alone as implementation evidence.
- Never silently add claims during media prompting or repair.
- Never mark an absent generated visual as successful.
- Never mark incomplete narration as embedded audio.
- Never synthesize job IDs, output URLs, costs, cost units, substitutions, or latency.
- Show operational state and evidence, not private reasoning.

## 9. Reliability requirements

- Retry transient GitHub transport failures at most three times; record unreadable prioritized files as limitations.
- Keep visual generation to two attempts per generated scene.
- Stop before Livepeer execution when estimation fails.
- Treat failed, partial, cancelled, and error plan states as failures; enforce a configured polling timeout.
- Persist incremental production progress so fresh serverless requests can read completed scene state.
- Keep artifact responses private and uncached, with a restrictive content security policy.
- Represent terminal failures with the run's `failed` status and an actionable error message.

## 10. Non-goals

The current product is not:

- a full timeline-based video editor;
- a multi-user collaboration or approval system;
- a template or creator marketplace;
- an authenticated account product;
- a wallet, payment, or billing stack;
- an avatar or digital-presenter system;
- a private-repository ingestion system;
- a general-purpose integration hub;
- a rendered MP4 export pipeline.

## 11. Success criteria

- A valid public repository can create and persist a configured run.
- Repository inspection produces explicit evidence and limitations.
- An unsupported claim cannot enter scene narration.
- Scene duration totals match the selected duration.
- Every Livepeer execution is preceded by a valid estimate for the same plan.
- A repair attempt receives a separate estimate and the critic terminates after the second attempt.
- A final artifact is playable and downloadable when required visuals are usable.
- Incomplete narration cannot be reported or embedded as complete.
- A persisted run can reconstruct the same artifact across fresh store instances.
- Receipts preserve the evidence and production chain.

## 12. Post-hackathon direction

Future work may include explicitly authorized private repositories, richer capture of repository-hosted product media, more sophisticated assembly and export formats, team review, reusable brand/story preferences, and production analytics. These are not implemented today.

## 13. Monetization hypothesis

This is an unvalidated hypothesis. A possible model is a limited free/basic pitch, paid production runs whose economics reflect media-generation cost, a recurring creator/founder plan, and a team or agency tier for review and reusable preferences. No pricing, revenue, or willingness-to-pay claim has been validated.
