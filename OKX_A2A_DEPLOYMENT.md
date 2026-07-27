# EchoPitch Studio (Agent ID #9230) — OKX A2A Production Deployment Guide

## 1. Executive Summary & Architecture Overview

EchoPitch AI Studio (#9230) operates an automated Agent-to-Agent (A2A) node daemon and second-person historical narrative producer built on the OKX A2A Protocol (`@okxweb3/a2a-node`).

### System Topology

```
                   +---------------------------------------+
                   |          OKX.AI Marketplace           |
                   |   (ERC-8004 Agent ID #9230 Node)      |
                   +-------------------+-------------------+
                                       |
                                       | A2A Protocol / XMTP Network
                                       v
         +-----------------------------------------------------------+
         |                 EchoPitch A2A Daemon                      |
         |                 (Node.js / PM2 Process)                   |
         |                                                           |
         |  +---------------------+     +-------------------------+  |
         |  | HTTP Health Server  |     |  OKX A2A Node Runtime   |  |
         |  | (Port 10000)        |     |  (okx-a2a listener)     |  |
         |  | - /health           |     |  - Agent Task Queue     |  |
         |  | - /status           |     |  - Heartbeat Broadcast  |  |
         |  +---------------------+     +-------------------------+  |
         +-----------------------------------------------------------+
```

---

## 2. Prerequisites & Environment Requirements

* **Node.js**: Version `22.14.0` or higher required.
* **Package Manager**: `npm` 10+
* **System Tools**: `curl`, `git`, `ca-certificates`, `procps`
* **OKX A2A Package**: `@okxweb3/a2a-node` (`^0.1.10`)

---

## 3. Environment Variables Audit

All production variables must be configured in your environment or deployment platform (e.g. Railway, Render, VPS `.env` file):

| Variable Name | Required | Default Value / Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | `10000` | HTTP Health Monitor Port for platform probes |
| `NODE_ENV` | Yes | `production` | Node execution environment |
| `NEXT_PUBLIC_OKX_AGENT_ID` | Yes | `9230` | ERC-8004 Agent ID registered on OKX.AI |
| `NEXT_PUBLIC_OKX_A2A_SERVICE_ID` | Yes | `36961` | On-chain A2A Service ID |
| `NEXT_PUBLIC_OKX_CONTRACT_ADDRESS` | Yes | `0x779ded0c9e1022225f8e0630b35a9b54be713736` | OKX Registry Contract Address |
| `NEXT_PUBLIC_OKX_NETWORK` | Yes | `OKX X Layer Mainnet` | Target blockchain network |
| `NEXT_PUBLIC_OKX_CHAIN_ID` | Yes | `196` | Network Chain ID (196 = X Layer Mainnet) |
| `NEXT_PUBLIC_OKX_COMMUNICATION_ADDRESS` | Yes | `0x78507f00f3BA4665a505e616ead3211e405fC11e` | Communication Node Address |
| `OKX_AGENT_TASK_HOME` | Yes | `/app/data` | Persistent task data storage directory |
| `OKX_A2A_AI_PERMISSION_PRESET` | Yes | `auto` | Automated permission policy preset |
| `XMTP_ENV` | Yes | `production` | XMTP messaging environment |

> [!WARNING]
> Never commit private keys, wallet mnemonic phrases, or secret env files (`.env`, `.env.local`) to source control. Ensure `/data`, `data/`, `*.lock`, and `*.pid` are listed in `.gitignore`.

---

## 4. Production Deployment & Runtime Commands

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/YakiUdoph/echopitch-studio.git
cd echopitch-studio
npm install
```

### Step 2: Global A2A CLI Setup (Linux VPS / Server)
```bash
npm install -g @okxweb3/a2a-node@0.1.10
```

### Step 3: Run Environment Health Check & Auto-Fix
```bash
npm run doctor
# Executed CLI command: okx-a2a doctor --fix
```

### Step 4: Launch Daemon Runtime

#### Option A: PM2 Production Manager (Recommended)
```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start daemon using ecosystem configuration
npm run pm2:start
# Command executed: pm2 start ecosystem.config.cjs

# Check PM2 process status
npm run pm2:status

# Tail logs
npm run pm2:logs
```

#### Option B: Standalone Node Daemon Process
```bash
npm start
# Command executed: node scripts/start-a2a.js
```

---

## 5. PM2 Process Management Reference

| Action | Command |
| :--- | :--- |
| **Start Daemon** | `pm2 start ecosystem.config.cjs` |
| **Stop Daemon** | `pm2 stop echopitch-node` |
| **Restart Daemon** | `pm2 restart echopitch-node` |
| **Process Status** | `pm2 status` |
| **Tail Live Logs** | `pm2 logs echopitch-node` |
| **Configure System Auto-Boot** | `pm2 startup && pm2 save` |

---

## 6. Rollback Procedure

If a deployment experiences critical errors, perform the following rollback sequence:

1. **Stop Running Processes**:
   ```bash
   pm2 stop echopitch-node || pkill -f start-a2a.js
   ```

2. **Revert to Last Stable Commit**:
   ```bash
   git fetch origin
   git reset --hard HEAD~1
   ```

3. **Clean Up Stale Lock Files**:
   ```bash
   rm -f /app/data/*.lock /app/data/*.pid ./data/*.lock
   ```

4. **Re-install Dependencies & Restart Daemon**:
   ```bash
   npm install
   npm run pm2:start
   ```

5. **Verify Endpoint Health**:
   ```bash
   curl -f http://localhost:10000/health
   ```
