#!/bin/bash
# API route sweep: GET every endpoint, report non-2xx/3xx
BASE="http://localhost:3000/api"
ROUTES=(
  /health /agents /agents/memory /campaigns /leads /leads/pipeline-health
  /reports /analytics /analytics/insights /proactive-insights /dashboard/stats
  /enrichment/stats /data-quality /datasets /billing /revenue /bookings
  /connectors /connectors/registry /connectors/health /icp /emails /outreach
  /messaging /setters /abm /identity /tokens /knowledge /knowledge/list
  /knowledge/stats /knowledge/gap-report /knowledge/analytics /knowledge/doc
  /autoresearch /vellum/health /vellum/plugins /vellum/skills /vellum/schedule
  /vellum/followups /vellum/memory /vellum/memory/graph /vellum/memory/search
  /vellum/mcp /workflow/bridge /workforce /workforce/health /workforce/tasks
  /agent-infrastructure /admin/agents/overview /admin/agents/runs
  /admin/agents/evals /admin/agents/safety /exa/status /gmaps/health
  /gmaps/jobs /data-sources/health /prospect-discovery/health
  /prospect-discovery/sessions /scrapegraph/health /sales-intelligence
  /sales-enablement /lead-intelligence /ai /opensrc /pygenleads /settings
  /stripe/subscription /stripe/usage /llm/key-pool /security/csp-report
  /channels/scraper /crawl4ai /auth/profile /ai-activate
)
echo "===== API ROUTES (GET) ====="
for r in "${ROUTES[@]}"; do
  resp=$(curl -s -w "\n%{http_code}" --max-time 90 "$BASE$r" 2>/dev/null)
  code=$(echo "$resp" | tail -1)
  echo "$code $r"
done
