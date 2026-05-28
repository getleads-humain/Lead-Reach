#!/bin/bash
cd /home/z/my-project
export DATABASE_URL=file:/home/z/my-project/db/custom.db
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=3000

# Keep restarting if it crashes
while true; do
  echo "Starting standalone server at $(date)" >> /home/z/my-project/server-restart.log
  node .next/standalone/server.js 2>&1 >> /home/z/my-project/server-restart.log
  EXIT_CODE=$?
  echo "Server exited with code $EXIT_CODE at $(date)" >> /home/z/my-project/server-restart.log
  if [ $EXIT_CODE -ne 0 ]; then
    echo "Restarting in 3 seconds..." >> /home/z/my-project/server-restart.log
    sleep 3
  else
    break
  fi
done
