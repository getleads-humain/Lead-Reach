#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp | rg -q ":3000"; then
    echo "[$(date)] Server not running, starting..." >> /tmp/keep-alive.log
    NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js >> /tmp/next-standalone.log 2>&1 &
    SERVER_PID=$!
    sleep 5
    # Verify it started
    if ss -tlnp | rg -q ":3000"; then
      echo "[$(date)] Server started (PID: $SERVER_PID)" >> /tmp/keep-alive.log
    else
      echo "[$(date)] Server failed to start" >> /tmp/keep-alive.log
    fi
  fi
  sleep 10
done
