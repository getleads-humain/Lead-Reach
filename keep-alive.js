// Persistent server launcher for LeadReach AI
// This script starts the Next.js standalone server and keeps it running
const { spawn } = require('child_process');
const path = require('path');

const STANDALONE_DIR = path.join(__dirname, '.next', 'standalone');

const env = {
  ...process.env,
  DATABASE_URL: 'file:./db/custom.db',
  PORT: '3000',
  HOSTNAME: '0.0.0.0',
  NODE_ENV: 'production',
};

console.log('[keep-alive] Starting LeadReach AI server...');
console.log('[keep-alive] Working directory:', STANDALONE_DIR);
console.log('[keep-alive] DATABASE_URL:', env.DATABASE_URL);

const child = spawn('node', ['server.js'], {
  cwd: STANDALONE_DIR,
  env,
  stdio: 'inherit',
  detached: true,
});

child.on('error', (err) => {
  console.error('[keep-alive] Failed to start server:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`[keep-alive] Server exited with code ${code}, signal ${signal}`);
  // Auto-restart after 2 seconds
  setTimeout(() => {
    console.log('[keep-alive] Restarting server...');
    const newChild = spawn('node', ['server.js'], {
      cwd: STANDALONE_DIR,
      env,
      stdio: 'inherit',
      detached: true,
    });
    newChild.unref();
  }, 2000);
});

child.unref();
console.log('[keep-alive] Server started, PID:', child.pid);
