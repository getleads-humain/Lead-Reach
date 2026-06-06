#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const MAX_RETRIES = 200;
const RETRY_DELAY = 3000;
let retries = 0;

// Load .env
const env = { ...process.env };
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
}

env.NODE_ENV = 'production';
env.HOSTNAME = '0.0.0.0';
env.PORT = '3000';
env.NODE_OPTIONS = '--max-old-space-size=768';
// Ensure both API key names are set
if (env.ZHIPU_API_KEY && !env.ZHIPU_AI_API_KEY) env.ZHIPU_AI_API_KEY = env.ZHIPU_API_KEY;

function startServer() {
  console.log(`[keep-alive] Starting Next.js (attempt ${retries + 1}/${MAX_RETRIES})...`);

  const child = spawn(
    path.join(__dirname, 'node_modules', '.bin', 'next'),
    ['start', '-p', '3000', '-H', '0.0.0.0'],
    { cwd: __dirname, env, stdio: 'inherit', detached: false }
  );

  child.on('error', (err) => console.error(`[keep-alive] Error: ${err.message}`));
  child.on('exit', (code, signal) => {
    console.log(`[keep-alive] Server exited code=${code} signal=${signal}`);
    if (retries < MAX_RETRIES) {
      retries++;
      console.log(`[keep-alive] Restarting in ${RETRY_DELAY/1000}s...`);
      setTimeout(startServer, RETRY_DELAY);
    }
  });
}

startServer();
