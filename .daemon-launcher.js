#!/usr/bin/env node
/**
 * LeadReach — Daemon Server Launcher
 * Starts the Next.js production server and keeps it alive.
 * Uses setsid to create a new session so tini doesn't reap the process.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const MAX_RETRIES = 100;
const RETRY_DELAY = 3000;
let retries = 0;
let serverProcess = null;

// Load .env file
const envPath = path.join(__dirname, '.env');
const env = { ...process.env };
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Ensure required env vars
env.NODE_ENV = 'production';
env.HOSTNAME = '0.0.0.0';
env.PORT = '3000';
env.NODE_OPTIONS = '--max-old-space-size=768';

const PID_FILE = path.join(__dirname, '.server-pid');
const LOG_FILE = '/tmp/leadreach-server.log';

// ── News Worker (Python FastAPI sidecar) ─────────────────────────────────
//
// The Newspaper3k Python worker is a separate process running on port 5341.
// It provides article extraction, news search, and sentiment analysis for
// the Judge agent. We start it alongside Next.js so the platform has full
// news-intent enrichment available out of the box.
//
// If Python or the worker dependencies aren't installed, this is a no-op —
// the platform still works, just without news enrichment.
let newsWorkerProcess = null;
const NEWS_WORKER_PID_FILE = path.join(__dirname, '.news-worker-pid');
const NEWS_WORKER_LOG = '/tmp/leadreach-news-worker.log';

function startNewsWorker() {
  const workerDir = path.join(__dirname, 'python-workers', 'news-worker');
  const startScript = path.join(workerDir, 'start.sh');

  // Only start if the script exists
  if (!fs.existsSync(startScript)) {
    console.log('[daemon] News worker start.sh not found — skipping');
    return;
  }

  console.log('[daemon] Starting News Worker (Python sidecar on port 5341)...');

  try {
    newsWorkerProcess = spawn('bash', [startScript, '--detached'], {
      cwd: workerDir,
      env,
      stdio: ['ignore', fs.openSync(NEWS_WORKER_LOG, 'a'), fs.openSync(NEWS_WORKER_LOG, 'a')],
      detached: true,
    });

    if (newsWorkerProcess.pid) {
      fs.writeFileSync(NEWS_WORKER_PID_FILE, String(newsWorkerProcess.pid));
      console.log(`[daemon] News Worker PID: ${newsWorkerProcess.pid}`);
    }

    newsWorkerProcess.on('error', (err) => {
      console.warn(`[daemon] News Worker failed to start: ${err.message} — continuing without it`);
    });

    newsWorkerProcess.on('exit', (code) => {
      console.log(`[daemon] News Worker exited with code=${code}`);
    });

    newsWorkerProcess.unref();
  } catch (err) {
    console.warn(`[daemon] News Worker startup failed: ${err.message} — continuing without it`);
  }
}

function startServer() {
  console.log(`[daemon] Starting Next.js server (attempt ${retries + 1}/${MAX_RETRIES})...`);

  const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');

  serverProcess = spawn(nextBin, ['start', '-p', '3000', '-H', '0.0.0.0'], {
    cwd: __dirname,
    env,
    stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')],
    detached: true,
  });

  // Write PID file
  fs.writeFileSync(PID_FILE, String(serverProcess.pid));
  console.log(`[daemon] Server PID: ${serverProcess.pid}`);

  serverProcess.on('error', (err) => {
    console.error(`[daemon] Server error: ${err.message}`);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[daemon] Server exited with code=${code} signal=${signal}`);
    if (retries < MAX_RETRIES) {
      retries++;
      console.log(`[daemon] Restarting in ${RETRY_DELAY / 1000}s...`);
      setTimeout(startServer, RETRY_DELAY);
    }
  });

  // Detach so the parent can exit but child keeps running
  serverProcess.unref();
}

// Handle signals — pass them to the child
process.on('SIGTERM', () => {
  console.log('[daemon] Received SIGTERM, stopping server...');
  if (serverProcess) serverProcess.kill('SIGTERM');
  if (newsWorkerProcess) newsWorkerProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('[daemon] Received SIGINT, stopping server...');
  if (serverProcess) serverProcess.kill('SIGINT');
  if (newsWorkerProcess) newsWorkerProcess.kill('SIGINT');
});

// Start the News Worker first (non-blocking — failures are logged but not fatal)
startNewsWorker();

startServer();

// Keep this process alive
process.stdin.resume();

// Periodic health check
setInterval(() => {
  try {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    // Check if the process is still running
    try {
      process.kill(Number(pid), 0);
    } catch {
      console.log('[daemon] Server process is dead, restarting...');
      startServer();
    }
  } catch {}
}, 30000);
