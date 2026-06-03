#!/bin/bash
# LeadReach — Preview server (production mode)
# Used by the Z.ai preview system to serve the application.
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=1024"

# Start the production server with auto-restart on crash
while true; do
  echo "[$(date)] Starting Next.js production server..." >> server-restart.log
  node_modules/.bin/next start -p 3000 -H 0.0.0.0 2>&1 | tee -a server-restart.log
  EXIT_CODE=${PIPESTATUS[0]}
  echo "[$(date)] Server exited with code $EXIT_CODE" >> server-restart.log
  if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Clean shutdown, not restarting" >> server-restart.log
    break
  fi
  echo "[$(date)] Restarting in 3 seconds..." >> server-restart.log
  sleep 3
done
