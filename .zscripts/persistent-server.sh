#!/bin/bash
# Persistent server launcher
cd /home/z/my-project
export DATABASE_URL=file:/home/z/my-project/db/custom.db
export NODE_ENV=production  
export HOSTNAME=0.0.0.0
export PORT=3000

while true; do
  echo "[$(date)] Starting server..." >> /home/z/my-project/server-restart.log
  node .next/standalone/server.js 2>&1 >> /home/z/my-project/server.log
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE" >> /home/z/my-project/server-restart.log
  sleep 3
done
