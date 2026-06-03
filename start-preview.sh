#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT=3000

# Ensure static files and public dir are copied
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/ 2>/dev/null
cp -r public .next/standalone/ 2>/dev/null

# Start the standalone server with auto-restart
while true; do
  echo "[$(date)] Starting standalone server..." >> server-restart.log
  node .next/standalone/server.js 2>&1 | tee -a server-restart.log
  EXIT_CODE=${PIPESTATUS[0]}
  echo "[$(date)] Server exited with code $EXIT_CODE" >> server-restart.log
  if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Clean shutdown, not restarting" >> server-restart.log
    break
  fi
  sleep 3
done
