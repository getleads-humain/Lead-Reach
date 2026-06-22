#!/usr/bin/env bash
# Start the crawl4ai-service (long-lived local HTTP API exposing the full
# unclecode/crawl4ai 0.9.x surface to the Agent Reach Next.js platform).
#
# Usage:
#   ./start-crawl4ai-service.sh         # foreground
#   ./start-crawl4ai-service.sh --bg    # background (daemon)
#
# Environment:
#   CRAWL4AI_SERVICE_PORT  (default 8765)
#   CRAWL4AI_SERVICE_HOST  (default 127.0.0.1)

set -euo pipefail

PORT="${CRAWL4AI_SERVICE_PORT:-8765}"
HOST="${CRAWL4AI_SERVICE_HOST:-127.0.0.1}"
PYTHON_BIN="${CRAWL4AI_PYTHON:-/home/z/.venv/bin/python3}"
SCRIPT="/home/z/my-project/lib/crawl4ai-service/server.py"
LOG_FILE="/home/z/my-project/lib/crawl4ai-service/server.log"
PID_FILE="/home/z/my-project/lib/crawl4ai-service/server.pid"

mkdir -p "$(dirname "$LOG_FILE")"

# If a stale PID file exists, try to clean up
if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" || echo '')"
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[crawl4ai-service] Already running with PID $OLD_PID"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if [[ "${1:-}" == "--bg" ]]; then
  echo "[crawl4ai-service] Starting in background on ${HOST}:${PORT}..."
  setsid "$PYTHON_BIN" "$SCRIPT" --port "$PORT" --host "$HOST" \
    >"$LOG_FILE" 2>&1 < /dev/null &
  NEW_PID=$!
  echo "$NEW_PID" > "$PID_FILE"
  disown "$NEW_PID" 2>/dev/null || true
  echo "[crawl4ai-service] PID $NEW_PID, log: $LOG_FILE"
  # Wait briefly and verify
  sleep 3
  if kill -0 "$NEW_PID" 2>/dev/null; then
    echo "[crawl4ai-service] Started successfully."
  else
    echo "[crawl4ai-service] ERROR: Process died within 3s. See log:"
    tail -20 "$LOG_FILE" >&2 || true
    exit 1
  fi
else
  exec "$PYTHON_BIN" "$SCRIPT" --port "$PORT" --host "$HOST"
fi
