#!/bin/bash
# LeadReach AI - Development Server Start Script
# Starts the Next.js dev server with auto-restart keep-alive loop

PROJECT_ROOT="/home/z/my-project"
cd "$PROJECT_ROOT"

export DATABASE_URL="file:./db/custom.db"
export PORT=3000

# Start the dev server with auto-restart
while true; do
  echo "[Start-Server] Starting Next.js dev server..."
  npx next dev -p 3000 2>&1
  EXIT_CODE=$?
  echo "[Start-Server] Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
