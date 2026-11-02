#!/bin/bash
# LeadReach — immediate GitHub sync (same rules as the repo.git_sync ops job)
# Commits any pending changes and pushes all local commits to origin/main.
# Auth: GITHUB_TOKEN in .env or environment (written to git credential store
# once), or any credential already available to git.
# Usage: bash scripts/git-push-now.sh

set -u
cd /home/z/my-project

# 1. Best-effort credential wiring from .env / environment
TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$TOKEN" ] && [ -f .env ]; then
  TOKEN=$(grep -E '^GITHUB_TOKEN=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d ' ')
fi
# Always (re)write the credential store with the resolved token — write-once
# logic kept a stale/under-scoped token forever and blocked rotation.
if [ -n "$TOKEN" ]; then
  umask 077
  echo "https://x-access-token:${TOKEN}@github.com" > "$HOME/.git-credentials"
  git config credential.helper store
fi

# 2. Commit any pending platform changes
git add -A
if ! git diff --cached --quiet; then
  git commit -m "checkpoint: manual sync $(date -u +%Y-%m-%dT%H:%M:%SZ)" --quiet
  echo "[git-push-now] committed pending changes"
fi

# 3. Fetch + measure queue
git fetch origin --quiet
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
if [ "$AHEAD" = "0" ]; then
  echo "[git-push-now] already in sync with origin/main"
  exit 0
fi

# 4. Push (fast-forward; lease-guarded retry if the platform auto-committer
#    amended an already-pushed commit)
echo "[git-push-now] pushing $AHEAD commit(s) to origin/main..."
BEFORE=$(git rev-parse origin/main)
if git push origin main 2>&1; then
  echo "[git-push-now] done"
  exit 0
fi
echo "[git-push-now] normal push rejected — retrying with lease-guarded force"
if git push --force-with-lease=main:"$BEFORE" origin main 2>&1; then
  echo "[git-push-now] done (lease-guarded)"
  exit 0
fi
echo "[git-push-now] FAILED — check credentials (set GITHUB_TOKEN in .env) and remote state"
exit 1
