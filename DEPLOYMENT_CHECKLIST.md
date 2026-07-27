# EchoPitch Studio (Agent ID #9230) — Deployment & OKX Listing Checklist

Use this checklist to verify production readiness before submitting or updating Agent ID `#9230` on the OKX.AI Marketplace.

---

## 1. Pre-Deployment Verification

- [x] **Node Environment**: Node.js version `>= 22.14.0` verified.
- [x] **Dependencies Installed**: `@okxweb3/a2a-node` installed (`^0.1.10`).
- [x] **Root Manifest**: `package.json` `scripts.start` set to `"node scripts/start-a2a.js"`.
- [x] **PM2 Ecosystem Configuration**: `ecosystem.config.cjs` present and configured for 1 instance, autorestart, and 500M memory cap.
- [x] **Lock File Auto-Cleanup**: `cleanupStaleLockFiles()` active in `scripts/start-a2a.js`.
- [x] **Health Check Port**: `PORT` environment variable default set to `10000`.

---

## 2. Security & Key Management

- [x] **Data Directory Ignored**: `.gitignore` contains `/data`, `data/`, `*.lock`, `*.pid`.
- [x] **No Secrets Committed**: Private identity keys and seed phrases remain uncommitted.
- [x] **Environment Template**: Root `.env.example` verified.

---

## 3. Deployment Build & Code Integrity

- [x] **Next.js Web Application Build**: `npm --prefix echopitch-studio run build` builds cleanly.
- [x] **TypeScript Validation**: Zero compilation errors.
- [x] **ESLint Integrity**: `npm --prefix echopitch-studio run lint` passes without errors.

---

## 4. Post-Deployment Verification (Live Service)

- [ ] **HTTP Health Probe**: `curl http://localhost:10000/health` returns `200 OK` with `status: "healthy"`.
- [ ] **PM2 Status Check**: `pm2 status` shows `echopitch-node` status `online` without restart counter increments.
- [ ] **OKX A2A Doctor Check**: `okx-a2a doctor --fix` reports `ready: true`.
- [ ] **Heartbeat Persistence**: Verify daemon uptime exceeds 10 minutes without interruption.

---

## 5. Manual Steps Required Before Resubmitting OKX Listing

1. **Verify On-Chain Registration**: Ensure Agent ID `#9230` and Service ID `#36961` are active on OKX X Layer Mainnet (Chain ID `196`).
2. **Verify Communication Address**: Confirm wallet address `0x78507f00f3BA4665a505e616ead3211e405fC11e` matches registered communication node.
3. **Trigger Public Health Ping**: Confirm the publicly exposed deployment URL (e.g., Railway/Render URL) returns valid status JSON.
4. **Resubmit Listing**: Update endpoint URL in the OKX.AI Developer Portal.
