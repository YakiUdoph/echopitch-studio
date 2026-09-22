# EchoPitch Studio application

This directory is the production Next.js application and the configured Vercel Root Directory. For the product overview and canonical documentation, start with the [repository README](../README.md).

## Requirements

- Node.js 22.14 or newer
- npm
- network access to GitHub and, for production runs, Livepeer Creative MCP

## Setup

```bash
npm ci
```

Copy `.env.example` to `.env.local` and provide values locally. Never commit credentials.

Production persistence requires:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional configuration:

- `ECHOPITCH_RUN_STORE` (`filesystem` locally or `upstash`)
- `GITHUB_TOKEN`
- `LIVEPEER_MCP_URL`
- `LIVEPEER_IMAGE_CAPABILITY`
- `LIVEPEER_VIDEO_CAPABILITY`
- `LIVEPEER_TTS_CAPABILITY`
- `LIVEPEER_POLL_INTERVAL_MS`
- `LIVEPEER_TIMEOUT_MS`
- `LIVEPEER_IMAGE_PROMPT` and `LIVEPEER_VIDEO_PROMPT` for live gate scripts only

The Livepeer client defaults to the public Creative MCP endpoint and currently uses keyless demo access. The application does not define a Livepeer credential variable.

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm test
npm run test:production
```

The default tests are deterministic and do not perform paid generation. Scripts whose names include `:live`, `test:livepeer`, or the Phase E/F gates call external services and may consume Livepeer credits.

## Runtime behavior

- Local development defaults to filesystem run storage under `.data/runs`.
- Production selects Upstash Redis and refuses the filesystem adapter.
- Analysis route maximum duration is 60 seconds.
- Production route maximum duration is 300 seconds.
- Final artifacts are reconstructed HTML responses, not committed build outputs.

## Detailed documentation

- [Architecture](../docs/ARCHITECTURE.md)
- [Livepeer Integration](../docs/LIVEPEER.md)
- [ClaimLock](../docs/CLAIMLOCK.md)
- [Failure Modes](../docs/FAILURE-MODES.md)
