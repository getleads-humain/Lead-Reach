#!/bin/bash
# Persistent server launcher — keeps server alive despite tini process reaper
# The key: this script stays running, so the server process isn't orphaned.
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=1024"
export NEXT_PUBLIC_SUPABASE_URL="https://ssaskkftdpidfwvpgdwl.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyOTYsImV4cCI6MjA5NTU2OTI5Nn0.9B2yYStYtOVTHAAbJn3_czl7F5laVH6rT0VXX0MVScg"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk5MzI5NiwiZXhwIjoyMDk1NTY5Mjk2fQ.5yna1hYhjqmzrLiqoTmVoKKsB6Fr90qILdkTVTqSyF0"
export ZHIPU_API_KEY="c68cdeade96b45fa8bf45fbd487707b2.cgpoWSZ5Ae8BHEdO"

while true; do
  echo "[$(date)] Starting Next.js production server..." >> /home/z/my-project/server-restart.log
  node_modules/.bin/next start -p 3000 -H 0.0.0.0 2>&1 >> /home/z/my-project/server-restart.log &
  SERVER_PID=$!
  echo "[$(date)] Server PID: $SERVER_PID" >> /home/z/my-project/server-restart.log

  # Wait for the server to exit (keeps us as parent, preventing tini from reaping)
  wait $SERVER_PID 2>/dev/null
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> /home/z/my-project/server-restart.log
  sleep 3
done
