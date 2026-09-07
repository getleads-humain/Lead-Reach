#!/bin/bash
# Generate all 37 missing blog hero images using z-ai image generation
# Each prompt is crafted to visually represent the blog post's topic
# with a modern, professional, tech-focused aesthetic matching the existing images

BLOG_DIR="/home/z/my-project/public/blog"

# Function to generate an image
gen_image() {
  local filename="$1"
  local prompt="$2"
  local output="${BLOG_DIR}/${filename}"
  
  if [ -f "$output" ]; then
    echo "SKIP: $filename (already exists)"
    return 0
  fi
  
  echo "Generating: $filename"
  z-ai image -p "$prompt" -o "$output" -s 1344x768 2>&1 | tail -1
}

echo "=== Generating 37 blog hero images ==="
echo ""

# ── AI Workforce Deep Dives ──────────────────────────────────────────

gen_image "hero-prometheus-ceo-agent.png" \
  "A futuristic digital dashboard showing a strategic decision-making AI system with Monte Carlo simulation visualizations, confidence score gauges, organizational state vectors, glowing emerald and amber data flows on a dark background, representing an AI CEO agent making autonomous strategic decisions"

gen_image "hero-kronos-orchestrator.png" \
  "A technical architecture diagram showing a circular event ring buffer with 4 colored partitions (blue, green, purple, orange), task graph nodes connected by arrows, ACK tracking timers, on a dark navy background with cyan data flow lines, representing an AI orchestration system"

gen_image "hero-workforce-command-center.png" \
  "A command center dashboard with 14 agent cards in a grid layout, each showing health bars, status indicators, and real-time metrics, with a live activity feed on the side, emerald green accent color on dark background, representing an AI workforce management interface"

gen_image "hero-office-chat.png" \
  "A modern office chat interface showing real-time messages between AI agents, with different colored message bubbles (blue for status updates, green for task updates, red for alerts), agent avatars, and timestamps, on a dark slate background with ambient office lighting effect"

gen_image "hero-work-log.png" \
  "A time-based activity log viewer showing a hierarchical Year-Month-Day-Hour navigation tree, hourly activity bar chart at the top, category filter pills, and expandable log entries with JSON details, on a dark background with cyan accent colors"

gen_image "hero-24-7-workforce.png" \
  "A circular 24/7/365 clock visualization with 14 AI agent icons positioned around it, showing continuous activity pulses, inter-agent communication lines connecting them, glowing emerald network nodes on a dark cosmic background, representing always-on AI workforce"

gen_image "hero-knowledge-base.png" \
  "A digital library visualization showing 70 document cards organized in 5 categories (SOP, Runbook, Playbook, Reference, Training), each with different color coding, book icons, and progress indicators, on a dark background with warm amber lighting"

# ── Lead Generation ──────────────────────────────────────────────────

gen_image "hero-smart-auto-fill.png" \
  "A lead enrichment interface showing a form with 60+ fields being auto-filled, with glowing green checkmarks appearing next to each field as it gets filled, AI processing indicator, web search results panel on the side, on a dark background with emerald accent"

gen_image "hero-multi-pass-discovery.png" \
  "A search pipeline visualization showing 3 parallel search queries (list of X, top X, best X) with results merging into a single deduplicated list, magnifying glass icons, web search result cards flowing through pipes, on a dark background with blue and green data flows"

gen_image "hero-lead-scoring-5d.png" \
  "A radar chart visualization showing 5 scoring dimensions (Firmographic, Intent, Reachability, Strategic, Data Completeness) with a weighted score gauge showing 0-100, tier badges (cold/warm/hot/super_hot), on a dark background with violet and emerald accent colors"

gen_image "hero-lead-tiers.png" \
  "A funnel visualization showing leads progressing through tiers: Cold (blue, wide top), Warm (green, middle), Hot (amber, narrowing), Super Hot (red, narrow bottom), with upward arrows showing tier upgrades, lead count badges on each tier, on a dark gradient background"

gen_image "hero-campaign-pipeline.png" \
  "A 3-phase pipeline flowchart: Phase 1 Discovery (search icons, web results), Phase 2 Full Enrichment (8-agent orchestrator icons), Phase 3 Auto-Enrichment (batch processing icon), connected by arrows with progress indicators, on a dark background with emerald and blue accents"

gen_image "hero-data-enrichment-4tab.png" \
  "A 4-tab interface showing: CSV Import (drag-drop zone), AI Pipeline (5-stage flowchart), Field Coverage (radar chart + gauge), and Visualization (bar chart + pie chart), each tab with a distinct color, on a dark background with purple and cyan accents"

gen_image "hero-icp-scoring.png" \
  "A scoring model diagram showing 100 points distributed across 5 dimensions with weighted bars: Firmographic 30pts, Technographic 15pts, Behavioral 25pts, Situational 20pts, Economic 10pts, with disqualifier and booster callouts, on a dark background"

gen_image "hero-search-fallback.png" \
  "A 3-tier search fallback chain visualization: Tier 1 DuckDuckGo (search icon), Tier 2 z-ai web search (AI brain icon), Tier 3 Existing Leads (database icon), with downward arrows showing fallback flow, on a dark background with blue gradient"

# ── Sales Intelligence ──────────────────────────────────────────────

gen_image "hero-dashboard-metrics.png" \
  "A unified dashboard showing 4 metric cards (Total Campaigns, Total Leads, Qualified Leads, Response Rate), a pipeline stage distribution bar chart, and a tier breakdown pie chart, all fed by a single API endpoint icon, on a dark background with emerald and cyan accents"

gen_image "hero-campaign-breakdown.png" \
  "A campaign card showing lead counts broken down by tier: Hot (amber badge), Warm (green badge), Cold (blue badge), with a mini progress bar showing data completeness, on a dark card background with emerald accent border"

gen_image "hero-lead-stage-sync.png" \
  "A synchronization diagram showing a lead moving from 'new' to 'qualified' stage, with arrows automatically incrementing campaign counters (leadsQualified++, leadsContacted++, leadsResponded++), database sync indicators, on a dark background with green flow lines"

gen_image "hero-pipeline-tracking.png" \
  "A pipeline kanban board showing 9 stages (New, Enriched, Qualified, Contacted, Engaged, Negotiating, Closed Won, Closed Lost, Nurture) with lead cards in each column, deal value badges, and a total pipeline value gauge at the top, on a dark background"

# ── Tutorials ────────────────────────────────────────────────────────

gen_image "hero-first-campaign.png" \
  "A step-by-step tutorial visualization showing: 1. Name campaign, 2. Define ICP, 3. Click Launch, 4. Watch pipeline, 5. Review leads, with numbered steps and screenshots, on a dark background with emerald accent"

gen_image "hero-pipeline-workspace.png" \
  "A 5-tab workspace interface showing: Architecture (agent flowchart), Agents (status cards), Events (live log), Leads (lead tracker), Comms (chat messages), with the Events tab active showing real-time entries, on a dark background"

gen_image "hero-prospect-discovery.png" \
  "A prospect discovery search interface with a search bar, 8-agent orchestrator pipeline visualization, real-time results appearing as cards, and a timer showing 30-120 seconds, on a dark background with blue and emerald data flows"

gen_image "hero-csv-import.png" \
  "A CSV import interface showing a drag-and-drop zone with a file being dropped, automatic column type detection badges (string, number, email, URL), a data preview table, and an import button, on a dark background with amber accent"

gen_image "hero-agent-workspace.png" \
  "A 9-tab agent workspace interface showing all tab labels: Overview, Superpowers, Live Tasks, Office Chat, Direct Chat, Work Log, Training & Config, Activity, Knowledge Base, with the Overview tab active showing agent profile and stats, on a dark background"

gen_image "hero-agent-config.png" \
  "A configuration panel showing: Model dropdown (glm-4.6v-flash), Temperature slider (0.1), Max Tokens input (8192), System Prompt textarea, Schedule dropdown (always_on), Max Concurrent Tasks (5), Save button, on a dark background with cyan accent"

# ── Industry & Use Cases ────────────────────────────────────────────

gen_image "hero-fintech-leads.png" \
  "A fintech industry visualization showing: financial technology icons (credit cards, blockchain, banking), ICP targeting criteria panel, LinkedIn company search results, and lead cards with fintech company data, on a dark background with blue and green financial data patterns"

gen_image "hero-saas-leads.png" \
  "A SaaS industry visualization showing: cloud computing icons, tech stack detection panel (AWS, React, Kubernetes), funding round badges, hiring pattern graphs, and SaaS company lead cards with ARR estimates, on a dark background with purple and blue accents"

gen_image "hero-agency-leads.png" \
  "A multi-tenant agency dashboard showing: multiple client campaigns in tabs, white-label branding indicator, lead pipeline per client, and a Channel Partner badge, on a dark background with emerald and orange accents"

gen_image "hero-competitive-intel.png" \
  "A competitive intelligence dashboard showing: competitor company profile with tech stack icons, executive names, recent news timeline, funding history, and social media presence metrics, on a dark background with red and cyan accents"

# ── Technical Deep Dives ─────────────────────────────────────────────

gen_image "hero-tech-stack.png" \
  "A technology stack diagram showing layered architecture: Next.js 16 (frontend), React 19 (UI), TypeScript (language), Tailwind CSS v4 (styling), Prisma ORM (database), z-ai-web-dev-sdk (AI), with connection lines and data flow arrows, on a dark background with blue and green accents"

gen_image "hero-workforce-bridge.png" \
  "A bridge architecture diagram showing campaign events on the left (lead discovered, lead enriched, pipeline complete) flowing through a central bridge module to AI workforce agents on the right (Market Strategist, Sales Engine, PROMETHEUS), with task/log/chat icons, on a dark background"

gen_image "hero-zai-sdk.png" \
  "A SDK capabilities diagram showing 4 modules: web_search (search results icon), page_reader (web page icon), chat completions (chat bubble icon), vision (eye icon), with data flowing from each module to different platform features (discovery, enrichment, scoring, outreach), on a dark background with purple accents"

gen_image "hero-database-schema.png" \
  "A database entity relationship diagram showing: Lead table (60+ fields), WorkforceAgent table, WorkforceTask table, WorkforceLog table, WorkforceChatMessage table, with foreign key relationships drawn as lines, on a dark background with cyan table borders"

# ── Best Practices & Strategy ────────────────────────────────────────

gen_image "hero-icp-best-practices.png" \
  "A best practices checklist showing 5 ICP dimensions with checkmarks: Firmographic (industry, size, revenue), Technographic (tech stack), Behavioral (triggers), Situational (pain points), Economic (LTV, CAC), with a validation panel showing 50+ deal analysis, on a dark background"

gen_image "hero-outreach-cadence.png" \
  "A 14-day outreach calendar showing 7 touchpoints: Day 1 Email + LinkedIn, Day 3 LinkedIn, Day 5 Email, Day 7 LinkedIn, Day 9 Phone, Day 11 Email, Day 14 Breakup, with reply rate metrics and meeting count, on a dark background with violet accent"

gen_image "hero-email-deliverability.png" \
  "An email authentication diagram showing: SPF record (TXT in DNS), DKIM signature (cryptographic key), DMARC policy (p=quarantine), with email flow from sender to inbox (not spam folder), green checkmarks for authenticated emails, on a dark background with red and green contrast"

gen_image "hero-pricing-plans.png" \
  "A pricing comparison table showing 6 plans: Launchpad (Free), Scout ($29), Setter ($99), Closer ($299), Command ($599), Enterprise (Custom), plus the Founders Pass ($2,497 lifetime), with feature checkmarks and lead limit badges, on a dark background with emerald accent"

echo ""
echo "=== All images generated ==="
echo "Total images in blog directory:"
ls /home/z/my-project/public/blog/hero-*.png 2>/dev/null | wc -l
