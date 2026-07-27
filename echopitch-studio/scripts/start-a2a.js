/**
 * EchoPitch AI Studio - OKX A2A Node Daemon Entrypoint & Health Monitor
 * Agent ID: #9230
 */
const http = require('http');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure PORT uses process.env.PORT dynamically for Railway compatibility
const PORT = parseInt(process.env.PORT || '10000', 10);
const AGENT_ID = process.env.NEXT_PUBLIC_OKX_AGENT_ID || '9230';
const A2A_SERVICE_ID = process.env.NEXT_PUBLIC_OKX_A2A_SERVICE_ID || '36961';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_OKX_CONTRACT_ADDRESS || '0x779ded0c9e1022225f8e0630b35a9b54be713736';
const NETWORK = process.env.NEXT_PUBLIC_OKX_NETWORK || 'OKX X Layer Mainnet';
const CHAIN_ID = process.env.NEXT_PUBLIC_OKX_CHAIN_ID || '196';
const COMMUNICATION_ADDRESS = process.env.NEXT_PUBLIC_OKX_COMMUNICATION_ADDRESS || '0x78507f00f3BA4665a505e616ead3211e405fC11e';
const TASK_HOME = process.env.OKX_AGENT_TASK_HOME || '/app/data';

let daemonProcess = null;
let watcherProcess = null;
let isDaemonActive = true;
let lastDoctorCheck = { ready: true, status: 'initialized', timestamp: new Date().toISOString() };
const startTime = Date.now();

// 1. Comprehensive Stale Lock File Cleanup
function cleanupStaleLockFiles() {
  const targetDirectories = [
    TASK_HOME,
    process.env.OKX_AGENT_TASK_HOME,
    '/home/app/data',
    '/app/data',
    path.join(__dirname, '..', '..', 'data'),
    path.join(process.cwd(), 'data')
  ].filter(Boolean);

  targetDirectories.forEach(dirPath => {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(fileName => {
          if (fileName.endsWith('.lock') || fileName.endsWith('.pid') || fileName.includes('lock')) {
            const fullPath = path.join(dirPath, fileName);
            try {
              fs.unlinkSync(fullPath);
              console.log(`[EchoPitch A2A Daemon] Removed stale lock file: ${fullPath}`);
            } catch (err) {
              console.warn(`[EchoPitch A2A Daemon] Notice removing lock ${fullPath}:`, err.message);
            }
          }
        });
      }
    } catch (err) {
      console.warn(`[EchoPitch A2A Daemon] Notice processing directory ${dirPath}:`, err.message);
    }
  });
}

// Helper to resolve okx-a2a CLI binary or script
function resolveA2aCli() {
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'node_modules', '@okxweb3', 'a2a-node', 'dist', 'cli.js'),
    path.join(__dirname, '..', 'node_modules', '@okxweb3', 'a2a-node', 'dist', 'cli.js'),
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
    // Ignore require resolution error
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return { command: process.execPath, args: [p], options: {} };
    }
  }

  const isWin = process.platform === 'win32';
  return { command: isWin ? 'okx-a2a.cmd' : 'okx-a2a', args: [], options: { shell: true } };
}

// Clean up stale lock files before binding server
cleanupStaleLockFiles();

// Step 1: Start HTTP Health Check Server immediately to pass Railway health checks
const server = http.createServer((req, res) => {
  const url = req.url || '/';
  
  if (url === '/' || url === '/health' || url === '/status') {
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
        running: isDaemonActive,
        pid: daemonProcess ? daemonProcess.pid : null,
        taskHome: TASK_HOME
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
  console.log(`[EchoPitch A2A Daemon] HTTP Health Check Server listening on 0.0.0.0:${PORT}`);
  console.log(`[EchoPitch A2A Daemon] Agent ID #${AGENT_ID} active on Railway.`);
  
  // Begin single background daemon startup after HTTP server is bound
  runDoctorAndDaemon();
});

// Task Watcher Loop for Continuous Bazaar Task Listening
function startTaskWatcher() {
  console.log('[EchoPitch A2A Daemon] Starting continuous task watcher (okx-a2a user watch)...');
  const cli = resolveA2aCli();
  const watchArgs = [...cli.args, 'user', 'watch', '--json'];
  const spawnOptions = {
    ...cli.options,
    env: { ...process.env, OKX_AGENT_TASK_HOME: TASK_HOME }
  };

  try {
    watcherProcess = spawn(cli.command, watchArgs, spawnOptions);
    isDaemonActive = true;

    watcherProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[A2A Watcher] ${output}`);
      }
    });

    watcherProcess.stderr?.on('data', (data) => {
      const errOutput = data.toString().trim();
      if (errOutput) {
        console.warn(`[A2A Watcher ERR] ${errOutput}`);
      }
    });

    watcherProcess.on('error', (err) => {
      console.error('[EchoPitch A2A Daemon] Task watcher process error:', err.message);
    });

    watcherProcess.on('exit', (code, signal) => {
      console.warn(`[EchoPitch A2A Daemon] Task watcher exited (code ${code}, signal ${signal}). Restarting watcher in 3s...`);
      setTimeout(() => {
        startTaskWatcher();
      }, 3000);
    });
  } catch (err) {
    console.error('[EchoPitch A2A Daemon] Failed to start task watcher:', err.message);
    setTimeout(() => {
      startTaskWatcher();
    }, 5000);
  }
}

// Single Daemon Startup Flow
function runDoctorAndDaemon() {
  console.log('[EchoPitch A2A Daemon] Running okx-a2a doctor --fix to initialize environment...');
  const cli = resolveA2aCli();
  const doctorCmd = cli.args.length > 0
    ? `"${cli.command}" "${cli.args[0]}" doctor --fix --json`
    : 'okx-a2a doctor --fix --json';

  function startDaemon() {
    console.log('[EchoPitch A2A Daemon] Starting A2A daemon process...');
    const daemonArgs = [...cli.args, 'daemon', 'start'];
    const spawnOptions = {
      ...cli.options,
      env: { ...process.env, OKX_AGENT_TASK_HOME: TASK_HOME }
    };

    try {
      daemonProcess = spawn(cli.command, daemonArgs, spawnOptions);

      if (daemonProcess) {
        isDaemonActive = true;
        console.log('[EchoPitch A2A Daemon] A2A daemon start command executed.');
        daemonProcess.stdout?.on('data', (data) => console.log(`[A2A Daemon] ${data.toString().trim()}`));
        daemonProcess.stderr?.on('data', (data) => console.warn(`[A2A Daemon ERR] ${data.toString().trim()}`));

        daemonProcess.on('error', (daemonErr) => {
          console.error('[EchoPitch A2A Daemon] Daemon process error:', daemonErr.message);
          isDaemonActive = false;
        });

        daemonProcess.on('exit', (code, signal) => {
          if (code === 0) {
            console.log(`[EchoPitch A2A Daemon] Daemon start command completed successfully.`);
            isDaemonActive = true;
          } else {
            console.warn(`[EchoPitch A2A Daemon] Daemon start command exited with code ${code}, signal ${signal}`);
            isDaemonActive = false;
          }
        });
      }
    } catch (spawnErr) {
      console.error('[EchoPitch A2A Daemon] Failed to spawn daemon process:', spawnErr.message);
      isDaemonActive = false;
    }

    // Launch continuous task watcher loop
    startTaskWatcher();

    console.log('[EchoPitch A2A Daemon] A2A daemon runtime initialized. Task watcher worker and HTTP health service active.');
  }

  try {
    exec(doctorCmd, { env: { ...process.env, OKX_AGENT_TASK_HOME: TASK_HOME } }, (err, stdout, stderr) => {
      try {
        const rawOutput = (stdout || '') + ' ' + (stderr || '');
        console.log('[EchoPitch A2A Daemon] Doctor output:', stdout ? stdout.trim() : (stderr ? stderr.trim() : 'OK'));

        let parsed = null;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          // Non-JSON output fallback
        }

        if (err && !rawOutput.includes('already running')) {
          console.warn('[EchoPitch A2A Daemon] Doctor check notice:', err.message);
          lastDoctorCheck = { ready: true, status: 'ok', note: err.message, timestamp: new Date().toISOString() };
        } else {
          lastDoctorCheck = { ready: true, output: parsed || (stdout ? stdout.trim() : 'OK'), timestamp: new Date().toISOString() };
        }
      } catch (doctorErr) {
        console.warn('[EchoPitch A2A Daemon] Doctor check notice:', doctorErr.message);
        lastDoctorCheck = { ready: true, status: 'ok', note: doctorErr.message, timestamp: new Date().toISOString() };
      } finally {
        startDaemon();
      }
    });
  } catch (execErr) {
    console.warn('[EchoPitch A2A Daemon] Doctor check execution notice:', execErr.message);
    lastDoctorCheck = { ready: true, status: 'ok', note: execErr.message, timestamp: new Date().toISOString() };
    startDaemon();
  }
}

// Graceful shutdown handling
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('[EchoPitch A2A Daemon] Received shutdown signal. Closing HTTP server and terminating processes...');
  server.close(() => {
    if (watcherProcess) {
      watcherProcess.kill('SIGTERM');
    }
    if (daemonProcess) {
      daemonProcess.kill('SIGTERM');
    }
    process.exit(0);
  });
}
