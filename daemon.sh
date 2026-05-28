#!/bin/bash
cd /home/z/my-project
export DATABASE_URL=file:/home/z/my-project/db/custom.db
export PORT=3000
export HOSTNAME=0.0.0.0
export NODE_ENV=production
while true; do
  node .next/standalone/server.js 2>&1 | tee -a /home/z/my-project/server.log
  echo "Server crashed, restarting in 3s..." >> /home/z/my-project/server.log
  sleep 3
done
