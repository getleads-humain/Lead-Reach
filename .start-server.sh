#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=1024"
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
exec node node_modules/.bin/next dev -p 3000 -H 0.0.0.0 --webpack
