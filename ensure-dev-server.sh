#!/bin/bash
# Ensure the Next.js dev server is running on port 3000
# If it's not running, start it as a detached process

if ss -tlnp 2>/dev/null | grep -q ':3000 '; then
  echo "Dev server is already running on port 3000"
  exit 0
fi

echo "Starting dev server..."
cd /home/z/my-project

node -e "
const { spawn } = require('child_process');
const fs = require('fs');
const log = fs.openSync('/tmp/next-dev.log', 'a');
const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
  cwd: '/home/z/my-project',
  detached: true,
  stdio: ['ignore', log, log],
  env: { ...process.env, PORT: '3000' }
});
child.unref();
console.log('Spawned detached PID:', child.pid);
"

sleep 10

if ss -tlnp 2>/dev/null | grep -q ':3000 '; then
  echo "Dev server started successfully on port 3000"
else
  echo "WARNING: Dev server may not have started properly"
fi
