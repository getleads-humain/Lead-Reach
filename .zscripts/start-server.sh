#!/bin/bash
cd /home/z/my-project
export DATABASE_URL=file:/home/z/my-project/db/custom.db
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=3000

# Kill any existing server
pkill -f "server.js" 2>/dev/null || true
sleep 2

# Start the server
exec node .next/standalone/server.js
