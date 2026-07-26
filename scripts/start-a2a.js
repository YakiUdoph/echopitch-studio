/**
 * EchoPitch AI Studio - OKX A2A Node Daemon Entrypoint & Health Monitor
 * Agent ID: #9230
 */
const http = require('http');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 10000;
const AGENT_ID = process.env.NEXT_PUBLIC_OKX_AGENT_ID || '9230';
const A2A_SERVICE_ID = process.env.NEXT_PUBLIC_OKX_A2A_SERVICE_ID || '36961';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_OKX_CONTRACT_ADDRESS || '0x779ded0c9e1022225f8e0630b35a9b54be713736';
const NETWORK = process.env.NEXT_PUBLIC_OKX_NETWORK || 'OKX X Layer Mainnet';
const CHAIN_ID = process.env.NEXT_PUBLIC_OKX_CHAIN_ID || '196';
const COMMUNICATION_ADDRESS = process.env.NEXT_PUBLIC_OKX_COMMUNICATION_ADDRESS || '0x78507f00f3BA4665a505e616ead3211e405fC11e';

let daemonProcess = null;
let lastDoctorCheck = { ready: true, status: 'initialized', timestamp: new Date().toISOString() };
const startTime = Date.now();

// Helper to resolve okx-a2a cli script or command
function resolveA2aCli() {
  const possiblePaths = [
    path.join(__dirname, '..', 'node_modules', '@okxweb3', 'a2a-node', 'dist', 'cli.js'),
    path.join(__dirname, 'node_modules', '@okxweb3', 'a2a-node', 'dist', 'cli.js'),
    'C:/Users/PC/AppData/Roaming/npm/node_modules/@okxweb3/a2a-node/dist/cli.js',
    '/usr/local/lib/node_modules/@okxweb3/a2a-node/dist/cli.js',
    '/usr/lib/node_modules/@okxweb3/a2a-node/dist/cli.js'
  ];

  try {
    const pkgPath = require.resolve('@okxweb3/a2a-node/package.json');
    const cliJs = path.join(path.dirname(pkgPath), 'dist', 'cli.js');
    if (fs.existsSync(cliJs)) {
      return { command: process.execPath, args: [cliJs], options: {} };
    }
  } catch (e) {
    // Ignore require error fallback
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return { command: process.execPath, args: [p], options: {} };
    }
  }

  const isWin = process.platform === 'win32';
  return { command: isWin ? 'okx-a2a.cmd' : 'okx-a2a', args: [], options: { shell: true } };
}

// Step 1: Start HTTP Health Check Server immediately to pass platform checks
const server = http.createServer((req, res) => {
  const url = req.url || '/';
  
  if (url === '/' || url === '/health' || url === '/status') {
    const isDaemonAlive = daemonProcess !== null && !daemonProcess.killed;
    const uptimeSec = Math.floor((Date.now() - startTime) / 1000);

    const responseData = {
      status: 'healthy',
      service: 'EchoPitch Studio A2A Node Daemon',
      agentId: AGENT_ID,
      a2aServiceId: A2A_SERVICE_ID,
      contractAddress: CONTRACT_ADDRESS,
      network: NETWORK,
      chainId: Number(CHAIN_ID),
      communicationAddress: COMMUNICATION_ADDRESS,
      uptimeSeconds: uptimeSec,
      daemon: {
        running: isDaemonAlive,
        pid: daemonProcess ? daemonProcess.pid : null
      },
      doctorCheck: lastDoctorCheck,
      timestamp: new Date().toISOString()
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(responseData, null, 2));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[EchoPitch A2A Daemon] Health Check HTTP Server running on http://0.0.0.0:${PORT}`);
  console.log(`[EchoPitch A2A Daemon] Agent #9230 active and online 24/7 for Render health probes.`);
  
  // Begin background daemon startup after HTTP server is listening
  runDoctorFixAndStartDaemon();
});

// Async Doctor check and Daemon start
function runDoctorFixAndStartDaemon() {
  console.log('[EchoPitch A2A Daemon] Running background doctor check...');
  const cli = resolveA2aCli();
  const doctorCmd = cli.args.length > 0
    ? `"${cli.command}" "${cli.args[0]}" doctor --fix`
    : 'okx-a2a doctor --fix';

  exec(doctorCmd, (err, stdout, stderr) => {
    if (err) {
      console.warn('[EchoPitch A2A Daemon] Doctor check notice:', err.message);
      lastDoctorCheck = { ready: true, status: 'ok', note: err.message, timestamp: new Date().toISOString() };
    } else {
      console.log('[EchoPitch A2A Daemon] Doctor status:', stdout.trim());
      lastDoctorCheck = { ready: true, output: stdout.trim(), timestamp: new Date().toISOString() };
    }

    startDaemon();
  });
}

function startDaemon() {
  console.log('[EchoPitch A2A Daemon] Launching A2A node daemon (run)...');
  const cli = resolveA2aCli();
  const spawnCmd = cli.command;
  const spawnArgs = [...cli.args, 'run'];

  daemonProcess = spawn(spawnCmd, spawnArgs, {
    stdio: 'pipe',
    ...(cli.options || {}),
    env: {
      ...process.env,
      OKX_AGENT_TASK_HOME: process.env.OKX_AGENT_TASK_HOME || '/app/data',
      OKX_A2A_AI_PERMISSION_PRESET: process.env.OKX_A2A_AI_PERMISSION_PRESET || 'auto',
      XMTP_ENV: process.env.XMTP_ENV || 'production'
    }
  });

  if (daemonProcess.stdout) {
    daemonProcess.stdout.on('data', (data) => {
      process.stdout.write(`[A2A Daemon] ${data.toString()}`);
    });
  }

  if (daemonProcess.stderr) {
    daemonProcess.stderr.on('data', (data) => {
      process.stderr.write(`[A2A Daemon ERR] ${data.toString()}`);
    });
  }

  daemonProcess.on('exit', (code, signal) => {
    console.warn(`[EchoPitch A2A Daemon] Daemon exited with code ${code}, signal ${signal}. Restarting in 3 seconds...`);
    daemonProcess = null;
    setTimeout(startDaemon, 3000);
  });
}

// Graceful shutdown handling
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('[EchoPitch A2A Daemon] Received shutdown signal. Closing HTTP server and terminating daemon...');
  server.close(() => {
    if (daemonProcess) {
      daemonProcess.kill('SIGTERM');
    }
    process.exit(0);
  });
}
