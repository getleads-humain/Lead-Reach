#!/bin/bash
# Persistent Next.js production server script
# Uses a while loop + wait to prevent tini from reaping the server process

cd /home/z/my-project

# Load environment variables
set -a
source .env 2>/dev/null || true
set +a

export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=768"

echo "[LeadReach] Starting persistent production server..."

while true; do
  echo "[LeadReach] Launching Next.js server on port 3000..."
  node node_modules/.bin/next start -p 3000 -H 0.0.0.0 &
  SERVER_PID=$!
  echo "[LeadReach] Server PID: $SERVER_PID"

  # Wait for the server to become ready
  for i in $(seq 1 30); do
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null | grep -q "200\|302"; then
      echo "[LeadReach] Server is ready!"
      break
    fi
    sleep 1
  done

  # Wait for the server process
  wait "$SERVER_PID" 2>/dev/null
  EXIT_CODE=$?
  echo "[LeadReach] Server exited with code $EXIT_CODE, restarting in 5s..."
  sleep 5
done
