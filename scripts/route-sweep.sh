#!/bin/bash
# Route sweep: verify every page and API route responds
BASE="http://localhost:3000"
PAGES=(
  / /about /admin/agents /agent /agent/orchestrator /agent/prospect-discovery
  /agent/data-enrichment /agent/web-research /agent/lead-qualification
  /agent/outreach-composer /agent/pipeline-manager /agent/report-generator
  /agentic-framework /ai-hub /api-docs /app /blog /careers /contact
  /cookie-policy /culture /docs /faq /forgot-password /knowledge /login
  /onboarding /platform /portal /press /pricing /pricing/agency /pricing/closer
  /pricing/command /pricing/enterprise /pricing/founders-pass /pricing/launchpad
  /pricing/scout /pricing/setter /privacy /reset-password /settings /signup
  /support /terms /vellum /health
)
echo "===== PAGES ====="
for p in "${PAGES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "$BASE$p")
  echo "$code $p"
done
