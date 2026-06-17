#!/bin/bash
# LeadReach — stable production launcher
# ---------------------------------------
# Uses setsid + nohup + full I/O redirection to fully detach the Next.js
# standalone server from the launching shell. This ensures the server keeps
# running even after the parent shell session exits (which is important in
# IM/preview environments where each tool call runs in a fresh shell).
#
# The server is run with a conservative 384MB heap cap — the standalone
# build is small and a tighter heap reduces GC pressure on shared hosts.

set -e
cd /home/z/my-project

# Kill any existing instances
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "standalone/server.js" 2>/dev/null || true
sleep 1

# Load env
set -a
source .env 2>/dev/null || true
set +a

export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=384"

LOG=/tmp/leadreach-prod.log

# Start server fully detached: setsid creates a new session (no controlling
# terminal), nohup ignores SIGHUP, all stdio is redirected to a log file,
# and stdin comes from /dev/null. The `&` puts setsid in the background,
# then we disown it so the parent shell doesn't track it.
setsid nohup node /home/z/my-project/.next/standalone/server.js \
  >"$LOG" 2>&1 </dev/null &

SRV_PID=$!
disown $SRV_PID 2>/dev/null || true
echo "$SRV_PID" > /home/z/my-project/.server-pid
echo "[run-stable] Server PID: $SRV_PID"

# Wait for the server to bind to port 3000 (max 20s)
for i in $(seq 1 20); do
  if ss -tln 2>/dev/null | grep -q ":3000"; then
    echo "[run-stable] Server listening on :3000 (after ${i}s)"
    break
  fi
  sleep 1
done

# Final status
if ss -tln 2>/dev/null | grep -q ":3000"; then
  echo "[run-stable] OK — server is live"
else
  echo "[run-stable] FAIL — server did not bind"
  tail -20 "$LOG" 2>&1 || true
  exit 1
fi
