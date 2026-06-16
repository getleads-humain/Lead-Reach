#!/usr/bin/env bash
# ─── News Worker — Start Script ────────────────────────────────────────────
#
# Starts the Newspaper3k FastAPI worker on the configured port.
# Used by the LeadReach daemon to keep the worker running alongside Next.js.
#
# Usage:
#   ./python-workers/news-worker/start.sh            # foreground
#   ./python-workers/news-worker/start.sh --detached # background

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Resolve Python ───────────────────────────────────────────────────────
PYTHON="${PYTHON:-python3}"
VENV_DIR="$SCRIPT_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
  echo "[news-worker] Creating virtualenv at $VENV_DIR"
  "$PYTHON" -m venv "$VENV_DIR"
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  pip install --upgrade pip wheel
  pip install -r requirements.txt
  python -m spacy download en_core_web_sm 2>/dev/null || true
else
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
fi

# ─── Resolve port ─────────────────────────────────────────────────────────
PORT="${NEWS_WORKER_PORT:-5341}"
HOST="${NEWS_WORKER_HOST:-0.0.0.0}"

echo "[news-worker] Starting on ${HOST}:${PORT}"

if [ "$1" = "--detached" ]; then
  nohup python -m uvicorn main:app --host "$HOST" --port "$PORT" \
    > "$SCRIPT_DIR/news-worker.log" 2>&1 &
  echo $! > "$SCRIPT_DIR/news-worker.pid"
  echo "[news-worker] Started (PID $(cat "$SCRIPT_DIR/news-worker.pid"))"
  echo "[news-worker] Logs: tail -f $SCRIPT_DIR/news-worker.log"
else
  exec python -m uvicorn main:app --host "$HOST" --port "$PORT"
fi
