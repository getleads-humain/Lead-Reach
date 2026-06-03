#!/bin/bash
# LeadReach — Persistent production server
cd /home/z/my-project
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_ENV=production
exec node_modules/.bin/next start -p 3000 -H 0.0.0.0
