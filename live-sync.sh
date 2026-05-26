#!/bin/bash
# ============================================================
# Live Sync Script — LeadReach AI → GitHub
# ============================================================
# Watches for file changes and auto-pushes to GitHub every
# 60 seconds (configurable via SYNC_INTERVAL env var).
#
# Usage:
#   export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
#   ./live-sync.sh
#
# Or:
#   GITHUB_TOKEN=ghp_xxx ./live-sync.sh
#
# Stop: Ctrl+C or kill the process
# ============================================================

TOKEN="${GITHUB_TOKEN}"
INTERVAL="${SYNC_INTERVAL:-60}"  # seconds between syncs
REPO="getleads-humain/Lead-Reach"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: GITHUB_TOKEN environment variable required"
  echo "   export GITHUB_TOKEN=ghp_xxxxxxxxxxxx"
  echo "   ./live-sync.sh"
  exit 1
fi

cd /home/z/my-project

# Set remote with token
REMOTE_URL="https://x-access-token:${TOKEN}@github.com/${REPO}.git"
git remote set-url origin "$REMOTE_URL"

echo "🔄 Live Sync Active — every ${INTERVAL}s"
echo "   Repo: https://github.com/${REPO}"
echo "   Press Ctrl+C to stop"
echo ""

LAST_COMMIT=$(git rev-parse HEAD 2>/dev/null)

while true; do
  # Check for file changes
  git add -A 2>/dev/null

  if ! git diff --cached --quiet 2>/dev/null; then
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    CHANGED_FILES=$(git diff --cached --name-only | wc -l)
    git commit -m "auto-sync: ${TIMESTAMP} (${CHANGED_FILES} files)" 2>/dev/null

    echo "📦 [$(date +%H:%M:%S)] Syncing ${CHANGED_FILES} file(s)..."

    if git push origin main 2>/dev/null; then
      NEW_COMMIT=$(git rev-parse --short HEAD)
      echo "✅ [$(date +%H:%M:%S)] Pushed ${NEW_COMMIT}"
      LAST_COMMIT=$NEW_COMMIT
    else
      echo "⚠️  [$(date +%H:%M:%S)] Push failed (will retry next cycle)"
    fi
  fi

  sleep "$INTERVAL"
done
