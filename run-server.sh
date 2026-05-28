#!/bin/bash
# Robust server keep-alive for LeadReach AI
cd /home/z/my-project/.next/standalone

while true; do
    echo "[$(date)] Starting server..."
    DATABASE_URL="file:/home/z/my-project/db/custom.db" \
    NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=128" \
    node server.js 2>&1
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 3s..."
    sleep 3
done
