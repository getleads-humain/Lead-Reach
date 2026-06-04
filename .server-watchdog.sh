#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=1024"

while true; do
  node_modules/.bin/next start -p 3000 -H 0.0.0.0 >> /home/z/my-project/server-watchdog.log 2>&1
  echo "[$(date)] Server died, restarting in 2s..." >> /home/z/my-project/server-watchdog.log
  sleep 2
done
