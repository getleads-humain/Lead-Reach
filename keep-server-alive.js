#!/usr/bin/env node
/**
 * LeadReach — Persistent Server Runner
 * Uses Node.js cluster-like approach to keep the server alive.
 * Spawns `next start` as a child process and restarts it if it dies.
 */
const { spawn } = require('child_process');
const path = require('path');

const MAX_RETRIES = 50;
const RETRY_DELAY = 3000;
let retries = 0;

const env = {
  ...process.env,
  DATABASE_URL: 'file:/home/z/my-project/db/custom.db',
  NODE_ENV: 'production',
  HOSTNAME: '0.0.0.0',
  PORT: '3000',
  NODE_OPTIONS: '--max-old-space-size=1024',
  NEXT_PUBLIC_SUPABASE_URL: 'https://ssaskkftdpidfwvpgdwl.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyOTYsImV4cCI6MjA5NTU2OTI5Nn0.9B2yYStYtOVTHAAbJn3_czl7F5laVH6rT0VXX0MVScg',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk5MzI5NiwiZXhwIjoyMDk1NTY5Mjk2fQ.5yna1hYhjqmzrLiqoTmVoKKsB6Fr90qILdkTVTqSyF0',
  ZHIPU_API_KEY: 'c68cdeade96b45fa8bf45fbd487707b2.cgpoWSZ5Ae8BHEdO',
};

function startServer() {
  console.log(`[keep-server-alive] Starting Next.js server (attempt ${retries + 1}/${MAX_RETRIES})...`);

  const child = spawn(
    path.join(__dirname, 'node_modules', '.bin', 'next'),
    ['start', '-p', '3000', '-H', '0.0.0.0'],
    {
      cwd: __dirname,
      env,
      stdio: 'inherit',
      detached: false,
    }
  );

  child.on('error', (err) => {
    console.error(`[keep-server-alive] Server error: ${err.message}`);
  });

  child.on('exit', (code, signal) => {
    console.log(`[keep-server-alive] Server exited with code=${code} signal=${signal}`);
    if (retries < MAX_RETRIES) {
      retries++;
      console.log(`[keep-server-alive] Restarting in ${RETRY_DELAY / 1000}s...`);
      setTimeout(startServer, RETRY_DELAY);
    } else {
      console.error(`[keep-server-alive] Max retries reached, giving up.`);
      process.exit(1);
    }
  });

  // Keep the process alive
  process.stdin.resume();
}

startServer();
