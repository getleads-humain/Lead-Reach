#!/bin/bash
# LeadReach — stable production launcher
# ---------------------------------------
# Builds (if needed) and runs the Next.js standalone production server with
# full detachment so it survives the parent shell exiting.
#
# IMPORTANT: We must use `npm run build` (NOT `npx next build`) because the
# project's build script does two critical post-build copies that Next.js
# itself does NOT do automatically:
#   1. cp -r .next/static .next/standalone/.next/
#   2. cp -r public .next/standalone/
# Without step 2, the standalone server has no access to /public/blog/*.png,
# /public/logo.png, etc. — every image on the site returns HTTP 404 even
# though the files exist on disk in the source tree.
#
# This script can take an optional argument:
#   --no-build   Skip the build step (use the existing .next/standalone/)
#   --build      Force a fresh build (default behavior)

set -e
cd /home/z/my-project

DO_BUILD=1
if [ "$1" = "--no-build" ]; then
  DO_BUILD=0
fi

# Kill any existing instances
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "standalone/server.js" 2>/dev/null || true
sleep 1

# Load env
set -a
source .env 2>/dev/null || true
set +a

# Build (uses the project's build script which copies public/ and .next/static/)
if [ "$DO_BUILD" -eq 1 ]; then
  echo "[run-stable] Building (npm run build)…"
  npm run build > /tmp/leadreach-build.log 2>&1 || {
    echo "[run-stable] BUILD FAILED — tail of build log:"
    tail -40 /tmp/leadreach-build.log
    exit 1
  }
  echo "[run-stable] Build complete."
fi

# Verify standalone has public/ (the build script should have copied it)
if [ ! -d .next/standalone/public ]; then
  echo "[run-stable] WARN: .next/standalone/public missing — copying manually"
  cp -r public .next/standalone/
fi
if [ ! -d .next/standalone/.next/static ]; then
  echo "[run-stable] WARN: .next/standalone/.next/static missing — copying manually"
  mkdir -p .next/standalone/.next
  cp -r .next/static .next/standalone/.next/
fi

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
