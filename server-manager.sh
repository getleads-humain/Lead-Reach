#!/bin/bash
# LeadReach AI Server Manager - Auto-restart on crash
# Uses double-fork to detach from process group

LOG_FILE="/home/z/my-project/server-manager.log"
PORT=3000

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

cleanup() {
    log "Server manager shutting down..."
    pkill -f "next start" 2>/dev/null
    exit 0
}

trap cleanup SIGTERM SIGINT

log "Server manager starting..."

while true; do
    log "Starting Next.js server on port $PORT..."
    
    cd /home/z/my-project
    DATABASE_URL="file:/home/z/my-project/db/custom.db" \
    NODE_ENV=production \
    npx next start -p $PORT -H 0.0.0.0 2>&1 >> "$LOG_FILE"
    
    EXIT_CODE=$?
    log "Server exited with code $EXIT_CODE. Restarting in 2s..."
    sleep 2
done
