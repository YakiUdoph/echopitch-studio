# EchoPitch Studio (Agent ID #9230) — Health Check & Diagnostics Specification

## 1. Health Check Endpoint Specification

EchoPitch AI Studio provides a lightweight HTTP Health Server built into `scripts/start-a2a.js`. It runs on port `10000` (or `process.env.PORT`) to ensure continuous compatibility with cloud platform probes (Railway, Render, AWS ECS, K8s).

* **HTTP Method**: `GET`
* **Supported Paths**: `/health`, `/status`, `/`
* **Response Header**: `Content-Type: application/json`
* **Expected HTTP Status**: `200 OK`

---

## 2. Sample Health Response JSON

```json
{
  "status": "healthy",
  "service": "EchoPitch Studio A2A Node Daemon",
  "agentId": "9230",
  "a2aServiceId": "36961",
  "contractAddress": "0x779ded0c9e1022225f8e0630b35a9b54be713736",
  "network": "OKX X Layer Mainnet",
  "chainId": 196,
  "communicationAddress": "0x78507f00f3BA4665a505e616ead3211e405fC11e",
  "uptimeSeconds": 1420,
  "daemon": {
    "running": true,
    "pid": 12844,
    "activeInTaskHome": true
  },
  "doctorCheck": {
    "ready": true,
    "status": "ok",
    "timestamp": "2026-07-27T08:55:00.000Z"
  },
  "timestamp": "2026-07-27T09:00:00.000Z"
}
```

---

## 3. Field Definitions

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `status` | string | Health indicator (`"healthy"`) |
| `service` | string | Full service descriptor |
| `agentId` | string | Registered OKX ERC-8004 Agent ID (`9230`) |
| `a2aServiceId` | string | On-chain OKX A2A Service ID (`36961`) |
| `contractAddress` | string | OKX registry smart contract address |
| `network` | string | Blockchain network name (`OKX X Layer Mainnet`) |
| `chainId` | number | Network chain ID (`196`) |
| `uptimeSeconds` | number | Process uptime in seconds |
| `daemon.running` | boolean | Indicates if the A2A node daemon is actively listening |
| `daemon.pid` | number/null | PID of spawned daemon process |
| `doctorCheck.ready` | boolean | Environmental health status output from `okx-a2a doctor` |
| `timestamp` | string | Current ISO-8601 heartbeat timestamp |

---

## 4. Verification Commands

### Local Health Probe
```bash
curl -i http://localhost:10000/health
```

### Docker Container Health Probe
```bash
docker exec -it <container_id> curl -f http://localhost:10000/health
```

### Environmental Repair Command
If `doctorCheck.ready` returns `false`, execute:
```bash
npm run doctor
```
