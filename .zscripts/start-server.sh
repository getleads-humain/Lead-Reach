#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=3000

# Kill any existing server
pkill -f "next start" 2>/dev/null || true
pkill -f "server.js" 2>/dev/null || true
sleep 2

# Start the server using next start (standalone mode has chunk hash mismatch issues)
exec npx next start -p 3000
