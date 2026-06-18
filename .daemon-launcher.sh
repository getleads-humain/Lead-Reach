#!/bin/bash
# LeadReach — Daemon launcher for preview server (commit 1450034 version)
# Properly daemonizes the Next.js standalone server so it survives the
# shell that launched it. Uses setsid + nohup + disown + I/O redirection
# to fully detach from the controlling terminal.
cd /home/z/my-project || exit 1

export NODE_OPTIONS="--max-old-space-size=1024"
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT="3000"
export NEXT_PUBLIC_SUPABASE_URL="https://ssaskkftdpidfwvpgdwl.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyOTYsImV4cCI6MjA5NTU2OTI5Nn0.9B2yYStYtOVTHAAbJn3_czl7F5laVH6rT0VXX0MVScg"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk5MzI5NiwiZXhwIjoyMDk1NTY5Mjk2fQ.5yna1hYhjqmzrLiqoTmVoKKsB6Fr90qILdkTVTqSyF0"
export ZHIPU_API_KEY="c68cdeade96b45fa8bf45fbd487707b2.cgpoWSZ5Ae8BHEdO"
export NEXT_TELEMETRY_DISABLED=1

# Kill any stale server on port 3000
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp 2>/dev/null || true
fi
OLD_PID=$(cat .server-pid 2>/dev/null || echo "")
if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
  kill -TERM "$OLD_PID" 2>/dev/null
  sleep 1
  kill -KILL "$OLD_PID" 2>/dev/null || true
fi

# Start standalone server with full detachment
cd .next/standalone || exit 1
setsid nohup node server.js </dev/null >>/tmp/next-prod.log 2>&1 &
SERVER_PID=$!
disown $SERVER_PID 2>/dev/null || true

cd /home/z/my-project
echo "$SERVER_PID" > .server-pid
echo "[$(date -Iseconds)] Started Next.js standalone (PID $SERVER_PID, session-leader)"

# Wait for HTTP readiness (max 30s)
echo "[$(date -Iseconds)] Waiting for HTTP readiness on :3000/health…"
READY=0
for i in $(seq 1 30); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[$(date -Iseconds)] Server process exited during startup. Last log lines:"
    tail -30 /tmp/next-prod.log 2>&1
    exit 1
  fi
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/health" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
    READY=1
    echo "[$(date -Iseconds)] Server ready after ${i}s (HTTP $HTTP_CODE from /health)."
    break
  fi
  sleep 1
done

if [ $READY -eq 0 ]; then
  echo "[$(date -Iseconds)] Server did not become HTTP-ready within 30s. Last log lines:"
  tail -30 /tmp/next-prod.log 2>&1
  exit 1
fi

echo "[$(date -Iseconds)] Preview server live at http://localhost:3000 (PID $SERVER_PID)"
