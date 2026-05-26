#!/bin/bash
# ============================================================
# GitHub Push Script — LeadReach AI
# ============================================================
# Usage:
#   ./push-to-github.sh <GITHUB_TOKEN>
#
# Or set GITHUB_TOKEN environment variable:
#   export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
#   ./push-to-github.sh
#
# To create a token:
#   1. Go to https://github.com/settings/tokens
#   2. Generate new token (classic)
#   3. Select scopes: repo (full control)
#   4. Copy the token and pass it to this script
# ============================================================

TOKEN="${1:-$GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: GitHub token required"
  echo ""
  echo "Usage:"
  echo "  ./push-to-github.sh <GITHUB_TOKEN>"
  echo "  GITHUB_TOKEN=ghp_xxx ./push-to-github.sh"
  echo ""
  echo "Create a token at: https://github.com/settings/tokens"
  exit 1
fi

REPO="getleads-humain/Lead-Reach"
REMOTE_URL="https://x-access-token:${TOKEN}@github.com/${REPO}.git"

cd /home/z/my-project

# Set the remote URL with token
git remote set-url origin "$REMOTE_URL"

# Stage all changes
git add -A

# Check if there are changes to commit
if git diff --cached --quiet 2>/dev/null; then
  echo "ℹ️  No staged changes to commit"
else
  # Commit with timestamp
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  git commit -m "sync: ${TIMESTAMP}" 2>/dev/null
  echo "✅ Committed changes"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
if git push -u origin main 2>&1; then
  echo "✅ Successfully pushed to https://github.com/${REPO}"
else
  echo "❌ Push failed. Check your token and repository access."
  exit 1
fi

# Reset remote URL to remove token from git config (security)
git remote set-url origin "https://github.com/${REPO}.git"

echo "🔒 Token cleared from git config for security"
echo "✅ Done!"
