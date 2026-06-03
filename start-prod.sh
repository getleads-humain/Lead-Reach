#!/bin/bash
# LeadReach — Persistent production server
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=1024"
exec node_modules/.bin/next start -p 3000 -H 0.0.0.0
