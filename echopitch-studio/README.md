# EchoPitch Studio

EchoPitch turns repository evidence into a claim-locked pitch storyboard, selectively generates explanatory media through Livepeer, and persists the final interactive artifact with evidence and production receipts.

## Local development

Use Node.js 22.14 or newer. Copy `.env.example` to `.env.local`, configure the run store and GitHub token, then run:

```bash
npm ci
npm run dev
```

The production API route has a 300-second `maxDuration`. Filesystem storage is used outside production; production requires Upstash Redis.

## Livepeer Creative MCP

Production uses the official Creative MCP endpoint:

```text
https://agent.livepeer.org/api/mcp/creative
```

The current endpoint offers keyless demo credits, so no Livepeer API key is required. `LIVEPEER_MCP_URL` can override the endpoint, and the optional `LIVEPEER_IMAGE_CAPABILITY`, `LIVEPEER_VIDEO_CAPABILITY`, and `LIVEPEER_TTS_CAPABILITY` variables can request specific models.

Every Livepeer attempt follows the server's approval contract:

1. Discover currently available capabilities with `list_capabilities`.
2. Propose the exact single-step `create_media` request through `submit_plan`.
3. Require a `proposed` plan with a numeric `total_est_cost_usd`; otherwise stop before generation.
4. Approve that same plan with `confirm: true` and poll `get_plan` to completion.
5. Persist the raw estimate response, per-attempt estimate, actual cost/units when returned, selected capability, job ID, substitution data, output URL, critic result, and repair history.

Repository evidence remains preferred where it explains a scene. Livepeer generation is reserved for genuinely explanatory visuals and narration. Visual repair stays bounded to two attempts, and every repair receives a fresh estimate before approval.

## Verification

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

Live integration scripts can spend credits and are intentionally separate from the default test suite. Do not run them during routine engineering validation.
