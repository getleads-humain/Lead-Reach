#!/bin/bash
# LeadReach — Preview server (production mode for stability)
# Dev mode (webpack) crashes due to memory issues in constrained environments.
# Production mode is significantly more stable and uses less memory.
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=1024"
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT=3000
exec node_modules/.bin/next start -p 3000 -H 0.0.0.0
