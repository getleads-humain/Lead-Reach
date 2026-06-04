#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=1024"

# Keep stdin open to prevent process from being killed
exec 0</dev/null

while true; do
  echo "[$(date)] Starting Next.js production server..." >> /home/z/my-project/server-restart.log
  node_modules/.bin/next start -p 3000 -H 0.0.0.0 2>&1 >> /home/z/my-project/server-restart.log
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> /home/z/my-project/server-restart.log
  sleep 3
done
