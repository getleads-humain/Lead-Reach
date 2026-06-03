#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_ENV=production

# Write PID file
echo $$ > /home/z/my-project/.server.pid

# Run the server
exec node_modules/.bin/next start -p 3000 -H 0.0.0.0
