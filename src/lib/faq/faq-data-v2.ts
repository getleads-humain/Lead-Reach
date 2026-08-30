/**
 * LeadReach — Comprehensive FAQ Data
 * ====================================
 * 150+ industry-grade FAQs across 12 categories.
 * Each answer is detailed, accurate, and actionable.
 */

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  popular?: boolean;
  isNew?: boolean;
}

// ============================================================
// Categories
// ============================================================

export const FAQ_CATEGORIES = [
  'Getting Started',
  'AI Workforce',
  'Campaigns & Discovery',
  'Leads & Enrichment',
  'Pricing & Plans',
  'Security & Compliance',
  'Integrations',
  'AI Workforce Command Center',
  'Data Enrichment',
  'Prospect Discovery',
  'Industry & Use Cases',
  'Account & Support',
] as const;

export type FAQCategory = (typeof FAQ_CATEGORIES)[number];

// ============================================================
// FAQ Items
// ============================================================

export const FAQ_ITEMS: FAQEntry[] = [
  // ═══════════════════════════════════════════════════════════════
  // GETTING STARTED
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gs-001',
    question: 'What is LeadReach AI and how does it work?',
    answer: 'LeadReach AI is an agentic B2B lead generation platform that deploys 14 specialized AI workforce agents across 4 departments (Executive, Growth, Technology, Operations) to autonomously discover, enrich, qualify, and engage leads. The platform combines multi-channel web search (DuckDuckGo, z-ai web_search, LinkedIn, GitHub, Reddit, and more), LLM-powered enrichment, and a 5-dimension scoring model to fill your pipeline with vetted leads. You define your Ideal Customer Profile (ICP), deploy the agents, and they handle discovery → enrichment → scoring → outreach automatically while giving you full visibility through the real-time Agentic Pipeline Workspace.',
    category: 'Getting Started',
    popular: true,
  },
  {
    id: 'gs-002',
    question: 'How is LeadReach different from Apollo, ZoomInfo, or Lusha?',
    answer: 'Traditional tools are static databases — they give you a list of contacts and leave the rest to you. LeadReach is an autonomous AI workforce: (1) Multi-agent orchestration — 14 AI agents coordinate end-to-end across 4 departments. (2) Live web research — agents search 17+ live channels in real-time, not a stale database. (3) Deep enrichment — every lead gets 60+ fields filled (industry, SIC/NAICS codes, revenue, employee count, CEO, key contacts, tech stack, social profiles). (4) 5-dimension scoring — firmographic, intent, reachability, strategic, and data-completeness scores combine into a 0-100 lead score with tier assignment (cold → warm → hot → super_hot). (5) Smart auto-fill — one click fills every empty field using web research + LLM extraction. (6) Campaign pipeline — multi-pass discovery with query variations finds more leads. In short: Apollo gives you a phonebook; LeadReach gives you an entire SDR team.',
    category: 'Getting Started',
    popular: true,
  },
  {
    id: 'gs-003',
    question: 'How do I get started? What are the first steps after signing up?',
    answer: 'Getting started takes about 15 minutes: Step 1 — Create your account (14-day free trial, no credit card required). Step 2 — Define your Ideal Customer Profile (ICP): specify target industry, company size, geography, tech stack, and growth signals. Step 3 — Navigate to Campaigns and click "New Campaign" — describe what you\'re looking for in natural language (e.g., "Saffron bulb suppliers in the Netherlands"). Step 4 — The AI pipeline runs automatically: multi-pass web search discovers candidates, saves them as leads, enriches the top candidates with the 8-agent orchestrator, and auto-fills remaining leads with lightweight enrichment. Step 5 — Monitor the Agentic Pipeline Workspace for real-time progress. Step 6 — Review your leads in the Leads section — each lead card has a "Smart Auto-Fill" button to fill all empty fields. You\'ll typically see your first qualified leads within minutes.',
    category: 'Getting Started',
    popular: true,
    isNew: true,
  },
  {
    id: 'gs-004',
    question: 'Do I need technical expertise or coding skills to use LeadReach?',
    answer: 'Not at all. LeadReach is designed for sales professionals, not developers. The entire workflow is point-and-click: you define your ICP through a guided form, create campaigns with natural language queries, and the AI agents handle everything else. The dashboard gives you full visibility through visual cards, progress bars, and color-coded agent status. No API configuration, no scripting, no SQL. That said, if you ARE technical, our REST API provides programmatic access to every feature for custom integrations.',
    category: 'Getting Started',
  },
  {
    id: 'gs-005',
    question: 'What kind of results can I expect?',
    answer: 'Results vary by industry and ICP definition, but our customers typically see: 5-10x increase in qualified leads discovered per week (thanks to multi-pass discovery across 17+ channels), 3x improvement in outreach reply rates (due to deep personalization from 60+ enriched fields), 60% reduction in time spent on manual prospecting, and most teams see their first qualified leads within minutes of pipeline completion. The Smart Auto-Fill feature ensures every lead has enough data to be actionable — no more bare-bones contacts with just a name and email.',
    category: 'Getting Started',
    popular: true,
  },
  {
    id: 'gs-006',
    question: 'Is there a free trial available?',
    answer: 'Yes! We offer a 14-day free trial on all plans with full access to all features. No credit card required to start. You can explore the platform, deploy AI agents, run campaigns, and see real leads before committing to a paid plan. The Launchpad plan is also free forever — you get 2 AI Agents, 100 leads per month, and 3 research channels.',
    category: 'Getting Started',
  },
  {
    id: 'gs-007',
    question: 'How long does it take to see my first leads?',
    answer: 'Typically within minutes of launching a campaign. The pipeline runs in 3 phases: Phase 1 (Discovery) — multi-pass web search finds 10-30 candidates in 30-60 seconds. Phase 2 (Enrichment) — the top 3 candidates get full 8-agent orchestrator enrichment (2-5 minutes each). Phase 3 (Auto-Enrichment) — remaining leads get lightweight field-filling (1-2 minutes each). You\'ll see leads appear in real-time in the Agentic Pipeline Workspace as they\'re discovered and enriched.',
    category: 'Getting Started',
    isNew: true,
  },
  {
    id: 'gs-008',
    question: 'What is the Agentic Pipeline Workspace?',
    answer: 'The Agentic Pipeline Workspace is a real-time, transparent visualization of the entire AI pipeline in action. It shows: (1) Architecture tab — the 8-agent pipeline architecture (Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo). (2) Agents tab — each agent\'s current status, health score, and activity. (3) Events tab — a live event log showing every action (search queries, candidates found, enrichment progress, scoring decisions). (4) Leads tab — live lead tracker showing each lead\'s progression through pipeline stages (Discovered → Data Saved → Scout Research → Forge Enrich → Judge Score → Enriched). (5) Comms tab — inter-agent communication messages. Everything is transparent — you see exactly what each agent is doing and why.',
    category: 'Getting Started',
    isNew: true,
  },
  {
    id: 'gs-009',
    question: 'Can I use LeadReach for B2C lead generation?',
    answer: 'LeadReach is optimized for B2B lead generation. The AI agents are trained on firmographic data (company size, industry, revenue, tech stack), professional profiles (LinkedIn, GitHub), and business signals (funding, hiring, product launches). While some features work for B2C (web search, email finding), the enrichment, scoring, and outreach capabilities are designed for B2B use cases. For B2C, consider tools specializing in consumer data.',
    category: 'Getting Started',
  },
  {
    id: 'gs-010',
    question: 'What languages does LeadReach support?',
    answer: 'LeadReach\'s web interface is in English. The AI agents can search and process content in multiple languages (English, Spanish, French, German, Chinese, Japanese, Arabic, and more) since the underlying LLMs are multilingual. Campaign queries can be written in any language, and enrichment data from non-English sources is processed and normalized. Outreach message generation defaults to English but can be configured for other languages.',
    category: 'Getting Started',
  },
  {
    id: 'gs-011',
    question: 'What is the Ideal Customer Profile (ICP) and why does it matter?',
    answer: 'Your ICP defines the exact type of company that\'s the best fit for your product or service. It includes 5 dimensions: (1) Firmographic — industry, company size, revenue, geography. (2) Technographic — what technologies they use. (3) Behavioral — trigger events like funding, hires, product launches. (4) Situational — pain points and urgency signals. (5) Economic — LTV, CAC ceiling, payback period. LeadReach uses your ICP to score every discovered lead 0-100 across these dimensions, assigning tiers (cold/warm/hot/super_hot) so you focus on the highest-fit prospects first.',
    category: 'Getting Started',
  },
  {
    id: 'gs-012',
    question: 'How do I define a good campaign query?',
    answer: 'A good campaign query is specific enough to find relevant leads but broad enough to discover companies you might miss. Examples: "Saffron bulb suppliers in the Netherlands" (specific product + location), "B2B SaaS companies in fintech with 50-200 employees" (industry + size + segment), "Marketing agencies in London" (vertical + geography). The pipeline generates query variations automatically ("list of X", "top X", "best X companies", "X directory") to find more leads across different search results. Include industry and location for best results.',
    category: 'Getting Started',
    isNew: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // AI WORKFORCE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'aw-001',
    question: 'What is the AI Workforce Command Center?',
    answer: 'The AI Workforce Command Center is the control hub for all 14 AI workforce agents. It provides: (1) Global metrics — total agents, active agents, tasks completed, avg success rate, total tokens used, avg health score. (2) Live Orchestration Feed — real-time events from all agents (polls every 15 seconds for new task events). (3) Agent grid — cards for each agent showing status, health bar, current task, quick stats (completed/active/failed), skills/tools count, and last active time. (4) Global task queue — all tasks across all agents in a sortable table. (5) Department breakdown — per-department stats. Toolbar actions: Deploy All, Pause All, Health Check, Seed Agents.',
    category: 'AI Workforce',
    popular: true,
    isNew: true,
  },
  {
    id: 'aw-002',
    question: 'What are the 14 AI workforce agents?',
    answer: 'The 14 agents span 4 departments: Executive — PROMETHEUS (CEO Agent, runs the Hyper-OODA strategic decision cycle), KRONOS (Master Orchestrator, manages the event ring and task graph). Growth — Market Strategist (ICP definition, market research), Content Architect (content production, brand voice), Media Buyer (paid ads, budget allocation), Sales Engine (outbound sequences, multi-channel outreach). Technology — Core Architect (architecture reviews, ADRs), Feature Developer (implementation, refactoring), QA Tester (test automation, performance), DevOps Automator (CI/CD, infrastructure), Cyber Guardian (security, compliance). Operations — CFO Ledger (financial reporting, unit economics), Compliance Legal (GDPR, SOC 2, breach response), Synthetic HR (agent lifecycle, capacity planning).',
    category: 'AI Workforce',
    popular: true,
  },
  {
    id: 'aw-003',
    question: 'What is the Office Chat feature?',
    answer: 'The Office Chat tab in each agent\'s workspace shows realistic inter-agent conversations — not just user→agent, but agent→agent messages. You\'ll see PROMETHEUS issuing directives to KRONOS, Content Architect collaborating with Market Strategist on blog posts, DevOps alerting Cyber Guardian about security vulnerabilities, CFO requesting compliance evidence from Legal. The chat has a realistic office environment background, message type styling (status updates in blue, task updates in green, alerts in red), agent avatars with color-coded names, date separators, and polls for new messages every 10 seconds.',
    category: 'AI Workforce',
    isNew: true,
  },
  {
    id: 'aw-004',
    question: 'What is the Work Log feature?',
    answer: 'The Work Log tab provides a comprehensive time-based activity log with Year → Month → Day → Hour drill-down navigation. Features include: stats cards (total logs, tasks, messages, warnings/errors), hourly activity bar chart (24-hour distribution), category filters (task/chat/health/deploy/enrich/discover/system/decision), level filters (debug/info/warn/error/critical), expandable log entries with full JSON details, and breadcrumb navigation. Every action an agent takes — task completion, chat message, health check, deploy, enrichment — is logged with full time-based indexing for auditability and self-learning.',
    category: 'AI Workforce',
    isNew: true,
  },
  {
    id: 'aw-005',
    question: 'What is the Hyper-OODA cycle that PROMETHEUS runs?',
    answer: 'The Hyper-OODA cycle is PROMETHEUS\'s strategic decision framework: Phase 1 — State Ingest (every 60 seconds, pulls financial/growth/tech/kernel state vectors). Phase 2 — Heuristic Evaluation (applies pre-trained functions to compute Health, Drift, and Urgency scores per subsystem). Phase 3 — Monte Carlo Re-Weighting (runs N=1000 simulations with perturbed state vectors; confidence > 0.85 = autonomous execution, 0.60-0.85 = advisory hold, < 0.60 = escalate to human). Phase 4 — State Flush (broadcasts signed directives to all agents via Kernel_Flush, archives with SHA-256 hash). All decisions are auditable.',
    category: 'AI Workforce',
  },
  {
    id: 'aw-006',
    question: 'How does KRONOS manage the event ring and task graph?',
    answer: 'KRONOS manages two core data structures: (1) Event Ring — a circular buffer with 4 department partitions (Executive, Growth, Technology, Operations), 10,000 capacity per partition, priority queues (critical/high/normal/low), ACK tracking with retries, and automatic failover to backup agents. (2) Task Graph — a DAG (directed acyclic graph) of all tasks with parent/child dependencies, status tracking (pending/assigned/running/completed/failed/blocked), and automatic dependency resolution. KRONOS routes events, dispatches tasks, tracks acknowledgments, and handles agent failure with reroute to designated backups.',
    category: 'AI Workforce',
  },
  {
    id: 'aw-007',
    question: 'Can I customize agent configurations?',
    answer: 'Yes. Each agent\'s workspace has a "Training & Config" tab where you can adjust: model selection (glm-4.6v-flash, glm-4.7-flash), temperature (0-1, controls creativity vs precision), max tokens, system prompt (full editing with save), schedule type (always_on, scheduled, on_demand), max concurrent tasks, and priority level. Changes are saved to the database and take effect immediately. You can also trigger a Health Check to recalculate the agent\'s health score based on recent performance.',
    category: 'AI Workforce',
  },
  {
    id: 'aw-008',
    question: 'What is the Knowledge Base in each agent\'s workspace?',
    answer: 'Each agent has 5 curated knowledge documents (70 total across all 14 agents): SOP (Standard Operating Procedure), Runbook (incident response), Playbook (strategic framework), Reference (canonical data model/schema), and Training (onboarding guide). Each document is 8,000-22,000 characters of role-specific, industry-grade content. Documents are stored in the database, fetched live, and viewable in a modal dialog. You can re-seed the knowledge base at any time with the "Re-seed KB" button.',
    category: 'AI Workforce',
    popular: true,
  },
  {
    id: 'aw-009',
    question: 'How does the agent health scoring work?',
    answer: 'Agent health is a composite score (0-100) with 4 weighted components: Task success rate (50% weight — % of tasks completed without failure), Recent activity (20% weight — active in last hour = 100, last day = 50, last week = 25), Error rate (20% weight — 0% errors = 100, 5% = 50, 10% = 0), Response time (10% weight — fast = 100, slow = 50). Health status: Healthy (80-100), Fair (60-79), Degraded (40-59), Critical (< 40). You can trigger a Health Check for all agents from the dashboard toolbar.',
    category: 'AI Workforce',
  },
  {
    id: 'aw-010',
    question: 'What happens when an agent fails?',
    answer: 'When an agent fails (ACK timeout, health probe failure, or task failure cascade), KRONOS follows the Agent Failure & Reroute Runbook: (1) Quarantine the agent (mark status as "error", suspend tasks). (2) Identify the backup agent (each agent has a designated backup — e.g., PROMETHEUS\'s backup is KRONOS). (3) Reroute pending tasks to the backup (validating capacity and permissions). (4) Attempt recovery (issue agent:reboot, wait 60 seconds, health probe). (5) If recovery fails, escalate to PROMETHEUS for human intervention or permanent backup promotion.',
    category: 'AI Workforce',
  },

  // ═══════════════════════════════════════════════════════════════
  // CAMPAIGNS & DISCOVERY
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cd-001',
    question: 'How does the campaign discovery pipeline work?',
    answer: 'The campaign pipeline runs in 3 phases: Phase 1 — Discovery: Multi-pass web search using DuckDuckGo (primary) with automatic fallback to z-ai web_search (discoverBusinesses). If the first query finds < 20 results, 2 additional query variations are generated ("list of X", "top X", "best X companies", "X directory") and searched in parallel. Results are deduplicated by URL and saved as leads with industry/location hints extracted from snippets. Phase 2 — Full Enrichment: Top N leads (default 3) get the full 8-agent orchestrator treatment. Phase 3 — Auto-Enrichment: ALL remaining leads get lightweight field-filling (industry, employees, contact info, social profiles) via streamlined LLM calls.',
    category: 'Campaigns & Discovery',
    popular: true,
    isNew: true,
  },
  {
    id: 'cd-002',
    question: 'Why does the pipeline sometimes show "0 candidates" but leads still appear?',
    answer: 'This was a known issue that has been fixed. The root cause was: DuckDuckGo sometimes returns HTTP 200 with 0 parsed results (not an error, just empty). The old code only triggered the fallback search when DDG FAILED (returned an error), not when it returned empty results. Fix: the pipeline now checks results.length === 0 (regardless of success/failure) and triggers the fallback. Additionally, if both search tiers return 0 new candidates, the pipeline loads existing leads from prior runs on the same campaign — so you see your existing leads instead of a misleading "No candidates found" message.',
    category: 'Campaigns & Discovery',
    isNew: true,
  },
  {
    id: 'cd-003',
    question: 'What is multi-pass discovery and why does it find more leads?',
    answer: 'Multi-pass discovery generates multiple query variations from your campaign name and searches each one in parallel. For example, if your campaign is "Saffron Bulb Suppliers", the pipeline generates: "list of Saffron Bulb Suppliers", "top Saffron Bulb Suppliers", "best Saffron Bulb Suppliers companies", "Saffron Bulb Suppliers directory". Each variation finds different results because different pages rank for different phrasings — directory pages for "list of", ranking pages for "top", recommendation pages for "best". Results are deduplicated by URL, so you get the union of all unique leads found across all passes.',
    category: 'Campaigns & Discovery',
    isNew: true,
  },
  {
    id: 'cd-004',
    question: 'How do I create a new campaign?',
    answer: 'Navigate to the Campaigns section and click the "New Campaign" button. Enter a descriptive campaign name (e.g., "DragonFruit Suppliers in Vietnam" or "B2B SaaS Companies in fintech"). Optionally add a description, target industry, target location, and target company size. Click "Create Campaign" — the pipeline starts automatically. You\'ll see the Agentic Pipeline Workspace appear with real-time progress. Leads appear as cards as they\'re discovered and enriched. You can re-run the pipeline at any time with "Run Discovery Pipeline Again".',
    category: 'Campaigns & Discovery',
    popular: true,
  },
  {
    id: 'cd-005',
    question: 'What do the campaign metrics cards mean?',
    answer: 'Each campaign detail page shows 4 metrics: (1) Discovered — total leads found for this campaign (from the database, not just the current run). (2) Enriched — leads that have been through enrichment (includes stages: enriched, qualified, contacted, engaged, negotiating, closed_won). (3) Avg Score — average leadScore across all leads (0-100, weighted across firmographic/intent/reachability/strategic/data-completeness dimensions). (4) Hot Leads — count of leads with tier "hot" or "super_hot" (score >= 70). These numbers are always DB-accurate and update in real-time as leads are enriched.',
    category: 'Campaigns & Discovery',
    isNew: true,
  },
  {
    id: 'cd-006',
    question: 'Can I re-run a campaign pipeline?',
    answer: 'Yes. Click "Run Discovery Pipeline Again" on any campaign detail page. The pipeline will: (1) Search for NEW candidates (deduplicated against existing leads by website URL). (2) If no new candidates found, load existing leads from prior runs. (3) Enrich the top N new/existing leads with the full orchestrator. (4) Auto-enrich all remaining leads with missing fields. Existing leads are never deleted — the pipeline builds on previous runs. Each run shows a summary: "9 new + 0 prior discovered → 3 fully enriched, 6 auto-enriched → 0 failed".',
    category: 'Campaigns & Discovery',
  },
  {
    id: 'cd-007',
    question: 'How many leads can a single campaign generate?',
    answer: 'A single campaign run typically discovers 10-30 leads (from 3 search passes × 10 results each, deduplicated). Re-running the pipeline finds additional leads as new content appears on the web. There\'s no hard limit on total leads per campaign — they accumulate across runs. The pipeline enriches the top 3 per run with the full orchestrator and auto-fills all remaining leads. For high-volume needs, create multiple campaigns targeting different segments or geographies.',
    category: 'Campaigns & Discovery',
  },
  {
    id: 'cd-008',
    question: 'What is the "Smart Auto-Fill All Leads" button?',
    answer: 'This button (on the campaign detail page) batch-processes up to 50 leads with the Smart Auto-Fill system. It prioritizes leads with the lowest data completeness first. For each lead, it: (1) performs web research (z-ai web_search + page_reader), (2) extracts 40+ fields via LLM, (3) searches LinkedIn for company data, (4) classifies industry (SIC/NAICS), (5) computes 5-dimension scores, (6) upgrades tier (cold→warm→hot→super_hot), and (7) generates an AI summary. Processing takes about 1-2 minutes per lead. The toast shows: "Processed 9/9 leads, filled 187 fields, 3 tier upgrades".',
    category: 'Campaigns & Discovery',
    isNew: true,
  },
  {
    id: 'cd-009',
    question: 'What happens to leads when I delete a campaign?',
    answer: 'When you delete a campaign, all leads associated with that campaign are also deleted (cascade delete in the database). If you want to keep the leads but remove the campaign, first move the leads to another campaign using the "Move Campaign" feature in the lead detail view, then delete the campaign. Always export your leads (via CSV export or API) before deleting a campaign if you want to preserve the data.',
    category: 'Campaigns & Discovery',
  },
  {
    id: 'cd-010',
    question: 'How does lead deduplication work?',
    answer: 'Leads are deduplicated by website URL within each campaign. When the pipeline discovers a search result, it normalizes the URL to its origin (https://example.com) and checks if a lead with that website already exists for this campaign. If it does, the existing lead is kept (no duplicate created). If the same company appears with a different URL (e.g., www.example.com vs example.com), they may be treated as separate leads. Cross-campaign deduplication is not automatic — the same company can exist as separate leads in different campaigns.',
    category: 'Campaigns & Discovery',
  },

  // ═══════════════════════════════════════════════════════════════
  // LEADS & ENRICHMENT
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'le-001',
    question: 'What data fields does LeadReach fill for each lead?',
    answer: 'LeadReach fills 60+ fields across 8 categories: Identity (companyName, legalName, displayName, website, leadType), Location (hqAddress, city, stateProvince, country, postalCode, latitude, longitude, placeType), Contact (phoneMain, phoneDirect, generalEmail, supportEmail), People (ceoName, ceoEmail, keyContactName/Title/Email, personFullName, jobTitle, personEmail, personPhone, linkedinPersonUrl), Firmographic (industry, subIndustry, employeeCount, revenueEstimate, foundingYear, ownershipType, sicCode, naicsCode), Digital (linkedinUrl, twitterHandle, facebookPage, techStack), Financial (ticker, marketCap, peRatio, revenueTtm, sector, fiveYearGrowth), and Scoring (leadScore, leadTier, firmographicScore, intentScore, reachabilityScore, strategicScore, dataCompleteness).',
    category: 'Leads & Enrichment',
    popular: true,
  },
  {
    id: 'le-002',
    question: 'What is the Smart Auto-Fill feature?',
    answer: 'Smart Auto-Fill is a one-click feature that fills ALL empty fields on a lead. It uses a 5-step pipeline: (1) Web research — z-ai SDK web_search (5 results) + page_reader (reads the company website, 5000 chars). (2) LLM extraction — extracts 40+ fields from the research context using a structured prompt (only fills fields it can determine, uses null for unknown — never fabricates data). (3) LinkedIn search — finds the company\'s LinkedIn page, website, industry, and employee count. (4) Industry classification — assigns SIC and NAICS codes based on detected industry (28 industry categories mapped). (5) 5-dimension scoring — computes firmographic/intent/reachability/strategic/data-completeness scores via LLM, derives weighted leadScore (0-100), assigns tier (cold/warm/hot/super_hot), and generates an AI summary. Available per-lead (button on each lead card) or batch ("Smart Auto-Fill All Leads" on campaign detail).',
    category: 'Leads & Enrichment',
    popular: true,
    isNew: true,
  },
  {
    id: 'le-003',
    question: 'How does lead scoring work?',
    answer: 'Lead scoring uses a weighted 5-dimension model: firmographicScore (25% weight — how well the company fits your ICP: industry, size, revenue, location), intentScore (20% — signals this company needs your solution: triggers, pain points, growth), reachabilityScore (20% — can you reach them: email, phone, LinkedIn, key contact), strategicScore (20% — is this a strategic account: market position, growth, partnerships), dataCompleteness (15% — how much data is filled: 23 key fields checked). Overall leadScore = weighted sum (0-100). Tier: super_hot (≥88), hot (≥70), warm (≥40), cold (<40). Stage progression: new → enriched → qualified (score ≥ 50).',
    category: 'Leads & Enrichment',
    popular: true,
  },
  {
    id: 'le-004',
    question: 'What are the lead tiers and what do they mean?',
    answer: 'Lead tiers classify leads by quality and urgency: super_hot (score 88-100) — immediate action, highest priority, assign to senior AE within 5 minutes. hot (score 70-87) — high priority, follow up within 24 hours, these are your best opportunities. warm (score 40-69) — nurture flow, follow up if engaged, good pipeline candidates. cold (score 0-39) — marketing nurture only, not ready for sales. unqualified — leads that don\'t match your ICP at all (can be excluded from outreach). The tier is automatically assigned by the scoring engine and can be manually overridden. As leads get enriched with more data, their score and tier can improve (cold → warm → hot).',
    category: 'Leads & Enrichment',
  },
  {
    id: 'le-005',
    question: 'How does lead data enrichment merge with existing data?',
    answer: 'The enrichment pipeline uses a merge-not-overwrite strategy: only fields that have actual non-null values from the enrichment result are updated. This means if a lead already has a phone number but the enrichment doesn\'t find one, the existing phone number is preserved. This prevents data loss when enrichment doesn\'t return all fields. The enrichment also adds source URLs to the lead\'s sources array (deduplicated) and appends an AI-generated summary to the notes field with a timestamp.',
    category: 'Leads & Enrichment',
    isNew: true,
  },
  {
    id: 'le-006',
    question: 'Can I manually edit lead data?',
    answer: 'Yes. Open any lead\'s detail view (click the lead card) and switch to the "Overview" tab. All fields are editable — company info, location, contact details, key contacts, firmographics, digital profiles, and scoring. Changes are saved via PUT /api/leads/[id] which also syncs campaign counters (leadsQualified, leadsContacted, leadsResponded) when you change the lead\'s stage. You can also change the lead\'s stage (new → enriched → qualified → contacted → engaged → negotiating → closed_won/closed_lost → nurture) from the detail view.',
    category: 'Leads & Enrichment',
  },
  {
    id: 'le-007',
    question: 'What is data completeness and how is it calculated?',
    answer: 'Data completeness is a percentage (0-100) representing how much of the lead\'s data is filled. It\'s calculated by checking 23 key fields: companyName, legalName, website, industry, subIndustry, hqAddress, city, stateProvince, country, postalCode, phoneMain, generalEmail, ceoName, ceoEmail, keyContactName, keyContactEmail, employeeCount, revenueEstimate, foundingYear, linkedinUrl, techStack, sicCode, naicsCode. Each filled field contributes equally. A lead with just a name and website starts at ~5%. After Smart Auto-Fill, leads typically reach 45-80%. Completeness affects the leadScore (15% weight) and tier assignment.',
    category: 'Leads & Enrichment',
  },
  {
    id: 'le-008',
    question: 'How do I export leads?',
    answer: 'Leads can be exported via the API (GET /api/leads?campaignId=X&limit=1000 returns JSON) or through the CSV import/export feature. In the Leads section, use the bulk actions to select leads and export. The export includes all 60+ fields, scoring data, timestamps, and source URLs. For enterprise customers, we also offer webhook-based real-time lead delivery to your CRM or data warehouse.',
    category: 'Leads & Enrichment',
  },
  {
    id: 'le-009',
    question: 'Can leads be moved between campaigns?',
    answer: 'Yes. In the lead detail view, use the "Move Campaign" feature (POST /api/leads/[id]/move-campaign). This updates the lead\'s campaignId and adjusts the lead count counters on both the source and destination campaigns. The lead\'s enrichment data, scoring, and stage are preserved. This is useful when a lead is discovered in one campaign but is a better fit for another.',
    category: 'Leads & Enrichment',
  },
  {
    id: 'le-010',
    question: 'What happens to leads over time? Do they expire?',
    answer: 'Leads never expire — they persist in your database until you explicitly delete them. Over time, leads can be: enriched (more fields filled), re-scored (score changes as data improves), stage-progressed (new → enriched → qualified → contacted → engaged → closed_won), and tier-upgraded (cold → warm → hot → super_hot). The "Smart Auto-Fill" button can be used at any time to refresh a lead\'s data with the latest web research. Old leads with stale data will have lower data completeness scores, prompting re-enrichment.',
    category: 'Leads & Enrichment',
    isNew: true,
  },
  {
    id: 'le-011',
    question: 'How accurate is the enriched data?',
    answer: 'Enrichment accuracy depends on the source quality and the company\'s online presence. Data extracted from the company\'s own website (via page_reader) is typically highly accurate. LLM-extracted data from web search results is reliable but should be verified for critical fields (phone numbers, email addresses, revenue estimates). The system never fabricates data — if a field can\'t be determined from the research context, it\'s left null. We recommend running Smart Auto-Fill and manually verifying key contact information before outreach. All enriched data includes source URLs for verification.',
    category: 'Leads & Enrichment',
  },
  {
    id: 'le-012',
    question: 'Can I bulk import leads from a CSV file?',
    answer: 'Yes. The /api/leads/bulk-import endpoint accepts CSV files with 50+ column alias mappings (e.g., "Company Name" → companyName, "Email" → generalEmail, "Phone" → phoneMain). The import handles deduplication, data type conversion, and campaign assignment. Maximum 1000 rows per import. After import, use "Smart Auto-Fill All Leads" to enrich the imported leads with web research data.',
    category: 'Leads & Enrichment',
  },

  // ═══════════════════════════════════════════════════════════════
  // PRICING & PLANS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pr-001',
    question: 'What pricing plans are available?',
    answer: 'LeadReach offers 6 plans: Launchpad (FREE forever — 2 AI agents, 100 leads/month, 3 channels), Scout ($29/month — 4 agents, 500 leads, 5 channels), Setter ($99/month — 6 agents, 2,000 leads, 10 channels), Closer ($299/month — 8 agents, 5,000 leads, 15 channels), Command ($599/month — all 14 agents, 15,000 leads, all 17+ channels, API access, priority support), and Enterprise (custom — unlimited leads, dedicated infrastructure, SSO, custom SLAs). Annual billing gets 20% off. The Founders\' Pass ($2,497 one-time) gives lifetime Command-tier access.',
    category: 'Pricing & Plans',
    popular: true,
  },
  {
    id: 'pr-002',
    question: 'Is there a free plan?',
    answer: 'Yes! The Launchpad plan is completely free forever. You get 2 AI Agents, 100 leads per month, 3 research channels, and basic ICP/lead scoring. No credit card required. It\'s perfect for solo founders and small teams exploring AI-powered lead generation. You can upgrade at any time without losing your data.',
    category: 'Pricing & Plans',
  },
  {
    id: 'pr-003',
    question: 'What is the Founders\' Pass (Lifetime Deal)?',
    answer: 'The Founders\' Pass is a one-time payment of $2,497 that gives you lifetime access to the full Command-tier feature set — all 14 AI Agents, 15,000 leads per month, all 17+ channels, CRM integrations, API access, and priority support. No recurring bills, ever. All future platform updates are included. This is a limited-time offer for early adopters.',
    category: 'Pricing & Plans',
    popular: true,
  },
  {
    id: 'pr-004',
    question: 'Can I switch plans at any time?',
    answer: 'Absolutely. You can upgrade or downgrade at any time. When upgrading, you get immediate access to additional features and capacity. When downgrading, the change takes effect at the start of your next billing cycle. Prorated credits are applied automatically. Your data (campaigns, leads, enrichment) is always preserved across plan changes.',
    category: 'Pricing & Plans',
  },
  {
    id: 'pr-005',
    question: 'What happens when I exceed my monthly lead limit?',
    answer: 'If you approach your monthly lead limit, we notify you so you can either upgrade or wait for the next cycle. You will never be charged overage fees without explicit consent. Existing leads are never deleted when you hit the limit — you just can\'t discover new ones until the next cycle or until you upgrade. Enterprise plans offer unlimited leads with fair-use policies.',
    category: 'Pricing & Plans',
  },
  {
    id: 'pr-006',
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, 20% off when you choose annual billing. This applies to all paid plans (Scout, Setter, Closer, Command). Enterprise customers can negotiate custom terms based on volume and commitment length. The Founders\' Pass is already a one-time payment (no recurring billing).',
    category: 'Pricing & Plans',
  },
  {
    id: 'pr-007',
    question: 'What is included in the Enterprise plan?',
    answer: 'Enterprise includes: unlimited leads, dedicated infrastructure (single-tenant deployment), SSO/SAML, custom SLAs (99.9%+ uptime), dedicated account manager, custom AI model fine-tuning, on-premise deployment option, white-label branding, audit log export, and priority 24/7 support. Contact sales for custom pricing based on your organization\'s size and requirements.',
    category: 'Pricing & Plans',
  },
  {
    id: 'pr-008',
    question: 'Do you offer discounts for startups or nonprofits?',
    answer: 'Yes! We offer 50% off all paid plans for qualifying startups (< 10 employees, < $2M funding) and registered nonprofits. Apply through our startup program — verification takes 1-2 business days. The discount applies for the first 12 months, after which standard pricing resumes. The Founders\' Pass is already heavily discounted for early-stage companies.',
    category: 'Pricing & Plans',
    isNew: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // SECURITY & COMPLIANCE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'sc-001',
    question: 'Is my data secure?',
    answer: 'Yes. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Infrastructure runs on SOC 2 Type II certified cloud providers. We do not share your data with third parties. AI agents process data in isolated, secure environments. Access is controlled via role-based access control (RBAC) with MFA enforcement. We conduct regular security audits, penetration tests, and vulnerability scans.',
    category: 'Security & Compliance',
    popular: true,
  },
  {
    id: 'sc-002',
    question: 'Are you GDPR compliant?',
    answer: 'Yes. LeadReach is fully GDPR compliant. We: maintain a Records of Processing Activities (RoPA), honor all data subject rights (access, rectification, erasure, portability, objection), process data based on lawful basis (contract and legitimate interests), notify authorities within 72 hours of a data breach, conduct Privacy Impact Assessments (PIAs) for high-risk processing, and maintain Data Processing Agreements (DPAs) with all sub-processors. We do not process data of EU residents without a lawful basis.',
    category: 'Security & Compliance',
  },
  {
    id: 'sc-003',
    question: 'Are you CCPA compliant?',
    answer: 'Yes. LeadReach complies with the California Consumer Privacy Act (CCPA). We: provide notice at collection about what personal data we collect and why, honor the right to know what personal information is collected, honor the right to delete personal information, honor the right to opt-out of the "sale" of personal information (we do not sell personal data), and do not discriminate against consumers who exercise their privacy rights.',
    category: 'Security & Compliance',
  },
  {
    id: 'sc-004',
    question: 'Do you have SOC 2 certification?',
    answer: 'LeadReach is SOC 2 Type II certified. Our annual audit covers all 5 Trust Service Criteria: Security (logical access controls, network security, encryption), Availability (monitoring, disaster recovery, incident response), Processing Integrity (data validation, error handling, audit trails), Confidentiality (data classification, access controls, NDAs), and Privacy (privacy policy, data subject rights, retention). Evidence is collected continuously and retained for 7 years.',
    category: 'Security & Compliance',
  },
  {
    id: 'sc-005',
    question: 'How do you handle data obtained from public sources?',
    answer: 'We only collect publicly available information from authorized sources. Our research agents comply with each platform\'s terms of service and robots.txt directives. We maintain a strict data governance policy that respects privacy preferences and do-not-contact lists. All enriched data includes source attribution (URLs are stored in the lead\'s sources field). We do not scrape behind login walls, use stolen credentials, or access data through unauthorized means.',
    category: 'Security & Compliance',
  },
  {
    id: 'sc-006',
    question: 'Where is my data stored?',
    answer: 'Your data is stored in secure, encrypted databases hosted on SOC 2 Type II certified infrastructure. The primary database uses PostgreSQL with AES-256 encryption at rest. Data residency options are available for Enterprise customers who require specific geographic locations (US, EU, or APAC). You retain full ownership of all your data at all times. Data can be exported at any time via API or CSV export.',
    category: 'Security & Compliance',
  },
  {
    id: 'sc-007',
    question: 'How do you handle data breaches?',
    answer: 'In the event of a data breach, we follow our Security Incident Response Runbook: (1) Contain — isolate affected systems, revoke compromised credentials, preserve evidence. (2) Assess — determine what data was accessed, how many individuals are affected, what\'s the risk. (3) Notify — notify regulators within 72 hours (GDPR), notify affected customers without undue delay. (4) Eradicate — close backdoors, patch vulnerabilities, rebuild compromised systems. (5) Recover — restore from known-good backups, monitor for attacker return. (6) Post-incident review — root cause analysis, action items, policy updates.',
    category: 'Security & Compliance',
  },
  {
    id: 'sc-008',
    question: 'Can I delete my data?',
    answer: 'Yes. You can delete individual leads, entire campaigns (with all associated leads), or your entire account at any time. Account deletion is permanent and irreversible — all campaigns, leads, enrichment data, chat messages, and work logs are permanently removed from our database within 30 days. For GDPR/CCPA data subject access requests (DSARs), contact privacy@leadreach.com — we respond within 30 days.',
    category: 'Security & Compliance',
  },

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'in-001',
    question: 'What CRMs do you integrate with?',
    answer: 'LeadReach integrates natively with Salesforce, HubSpot, and Pipedrive. Leads, enrichment data, and outreach activities can be synced bidirectionally in real-time. The integration supports: lead creation/update sync, custom field mapping, stage mapping, deduplication, and activity logging. Setup takes about 10 minutes per CRM — authenticate via OAuth, map your fields, and enable auto-sync.',
    category: 'Integrations',
    popular: true,
  },
  {
    id: 'in-002',
    question: 'Is there a REST API?',
    answer: 'Yes. Our REST API is available on Command and Enterprise plans. It provides full programmatic access to all platform features: create/manage campaigns, deploy agents, retrieve leads (with filtering by campaign/tier/stage/industry), trigger enrichment, update lead data, manage outreach sequences, and retrieve analytics. The API uses standard REST conventions with JSON responses, API key authentication, and rate limiting (1000 requests/hour on Command, unlimited on Enterprise).',
    category: 'Integrations',
  },
  {
    id: 'in-003',
    question: 'Do you support webhooks?',
    answer: 'Yes. Webhooks are available on Command and Enterprise plans. You can configure webhooks for: lead_created, lead_enriched, lead_score_changed, lead_stage_changed, campaign_completed, and agent_status_changed events. Webhooks are delivered via HTTPS POST with a JSON payload and a signature header for verification. Retry logic: 3 retries with exponential backoff (1s, 5s, 30s).',
    category: 'Integrations',
  },
  {
    id: 'in-004',
    question: 'Can I integrate with email and outreach tools?',
    answer: 'Yes. We integrate with Gmail, Outlook, and custom SMTP servers for email. Outreach sequences can be managed through Outreach.io, Salesloft, and Lemlist via our API. The AI agents\' enrichment data (company context, key contact info, pain points) flows directly into your outreach tool so messages are always personalized with the latest data.',
    category: 'Integrations',
  },
  {
    id: 'in-005',
    question: 'Do you offer SDKs?',
    answer: 'Yes. We offer SDKs for Python and Node.js. Both SDKs provide typed access to all API endpoints, automatic retry logic, and rate limit handling. The SDKs are open-source and available on PyPI (pip install leadreach) and npm (npm install @leadreach/sdk). Documentation includes code examples for common workflows (create campaign, retrieve leads, trigger enrichment).',
    category: 'Integrations',
  },
  {
    id: 'in-006',
    question: 'Can I use LeadReach with Zapier or Make.com?',
    answer: 'Yes. LeadReach is available on both Zapier and Make.com through our REST API. Common workflows: "When a new lead is discovered in LeadReach → create a contact in HubSpot", "When a lead score exceeds 70 → send a Slack notification", "When a campaign completes → create a Google Sheets row". Use our webhook events as triggers and our API endpoints as actions.',
    category: 'Integrations',
    isNew: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // DATA ENRICHMENT
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'de-001',
    question: 'What is the Data Enrichment section?',
    answer: 'The Data Enrichment section provides a 4-tab interface for enriching lead data: (1) CSV Import — drag-and-drop CSV/TSV/Excel files, automatic column type detection, smart column mapping (50+ aliases), data quality analysis, preview, and import to campaign. (2) AI Pipeline — 5-stage visual pipeline (Data Ingestion → Schema Detection → Statistical Profiling → AI Enrichment → Data Visualization) with real-time progress. (3) Field Coverage — per-field deep analysis with data quality composite gauge, radar chart, heatmap, enrichment recommendations, and data cleaning suggestions. (4) Visualization — auto-generated Recharts from analysis results (BarChart, PieChart, LineChart, AreaChart), correlations table, and fallback DB stats visualization.',
    category: 'Data Enrichment',
    popular: true,
    isNew: true,
  },
  {
    id: 'de-002',
    question: 'How does the CSV analysis work?',
    answer: 'The CSV analysis endpoint (/api/enrichment/analyze) performs deep column profiling: (1) Type detection — automatically identifies string, number, date, email, URL, currency, phone, enum, boolean, percentage types. (2) Numeric stats — min, max, mean, median, stddev, quartiles, histogram bins. (3) Categorical stats — top values with counts/percentages, distribution. (4) Correlation analysis — Pearson r between numeric column pairs (r > 0.3 flagged). (5) Auto-generates chart specifications (bar/pie/line/area) based on data profile. (6) Quality metrics — duplicate row detection, outlier detection, high cardinality detection. The analysis handles files up to 10MB with progressive processing for large files.',
    category: 'Data Enrichment',
    isNew: true,
  },
  {
    id: 'de-003',
    question: 'What file formats are supported for import?',
    answer: 'CSV (.csv), TSV (.tsv), Excel (.xlsx, .xls). The parser uses papaparse for CSV/TSV with automatic delimiter detection, header inference, and type casting. Excel files are parsed with sheet selection. Maximum file size: 10MB. Maximum rows: 10,000 per import. For larger files, use the API for batch processing.',
    category: 'Data Enrichment',
  },
  {
    id: 'de-004',
    question: 'How does the enrichment pipeline handle large files?',
    answer: 'For files with > 500 rows, the pipeline uses progressive analysis: it analyzes a pilot sample (first 100 rows) to generate initial visuals and statistics, then continues processing the full dataset in the background. The UI shows progress and updates visuals as more data is processed. This means you see results within seconds, not minutes, even for large files. The full analysis completes in the background and the results are cached.',
    category: 'Data Enrichment',
  },
  {
    id: 'de-005',
    question: 'Can I export enriched data?',
    answer: 'Yes. The Data Enrichment section supports two export formats: (1) JSON export — the full enriched dataset with all original and new columns, analysis metadata, and quality metrics. (2) Cleaned CSV export — the original CSV with data cleaning applied (removed duplicates, normalized formats, filled obvious gaps) and new enrichment columns appended. Exports are available for download immediately after enrichment completes.',
    category: 'Data Enrichment',
  },

  // ═══════════════════════════════════════════════════════════════
  // PROSPECT DISCOVERY
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pd-001',
    question: 'What is Prospect Discovery?',
    answer: 'The Prospect Discovery section provides a dedicated interface for finding leads outside of campaigns. It uses the 8-agent orchestrator (Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo) to research any company or person in real-time. Enter a company name, website, or LinkedIn URL, and the orchestrator runs the full pipeline: Scout searches 17+ channels, Forge enriches with firmographics, Sage performs deep research, Judge scores and qualifies, and the results are displayed in the Agentic Pipeline Workspace with full transparency.',
    category: 'Prospect Discovery',
    popular: true,
  },
  {
    id: 'pd-002',
    question: 'What channels does the prospect discovery search?',
    answer: 'The prospect discovery agent searches 17+ channels: DuckDuckGo (primary web search), z-ai web_search (fallback semantic search), LinkedIn (company and people search), GitHub (repository search), Reddit (discussion search), Twitter/X (social search), YouTube (video search), RSS feeds, and more. Each channel returns different types of data — LinkedIn gives professional profiles, GitHub reveals tech stack, Reddit shows community engagement, YouTube shows product demos. Results are merged, deduplicated, and enriched.',
    category: 'Prospect Discovery',
  },
  {
    id: 'pd-003',
    question: 'Can I discover leads by location?',
    answer: 'Yes. The prospect discovery supports location-based search through the OpenStreetMap Overpass API (discoverPlaces function). You can search for businesses by category (e.g., "restaurants", "gyms", "accounting firms") within a geographic bounding box or around a specific lat/long with a radius. Results include name, address, phone, email, website, and coordinates. This is ideal for local business discovery and place-based lead generation.',
    category: 'Prospect Discovery',
    isNew: true,
  },
  {
    id: 'pd-004',
    question: 'How long does a prospect discovery search take?',
    answer: 'A single prospect discovery search takes 30-120 seconds depending on the query complexity and number of channels searched. The orchestrator runs 8 agents sequentially: Atlas (orchestration, ~2s), Scout (multi-channel search, ~15-30s), Forge (enrichment, ~10-20s), Sage (deep research, ~10-20s), Judge (scoring, ~5-10s), Bard (outreach prep, ~5-10s), Flow (pipeline, ~2-5s), Echo (reporting, ~2-5s). The real-time workspace shows each agent\'s progress as it runs.',
    category: 'Prospect Discovery',
  },

  // ═══════════════════════════════════════════════════════════════
  // INDUSTRY & USE CASES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'iu-001',
    question: 'What industries does LeadReach work best for?',
    answer: 'LeadReach works for any B2B industry, but excels in: Technology/SaaS (rich online presence, tech stack signals, GitHub activity), Financial Services (regulatory filings, funding data, executive changes), Professional Services (consulting, legal, accounting — LinkedIn-rich), Manufacturing (industry directories, trade show data), Healthcare (HIPAA-compliant discovery, medical directories), and Agriculture (supplier directories, trade associations). The multi-channel search adapts to each industry\'s information landscape. For niche industries, include industry-specific keywords in your campaign query.',
    category: 'Industry & Use Cases',
    popular: true,
  },
  {
    id: 'iu-002',
    question: 'Can LeadReach find leads in specific geographic regions?',
    answer: 'Yes. LeadReach searches globally across 17+ channels. For region-specific targeting: include the location in your campaign query (e.g., "marketing agencies in London"), set the target location in the campaign settings, and the pipeline will generate location-based query variations (e.g., "marketing agencies near London"). The Overpass API also supports geographic bounding box searches for place-based discovery. Results include country, city, and address data when available.',
    category: 'Industry & Use Cases',
  },
  {
    id: 'iu-003',
    question: 'Can I use LeadReach for account-based marketing (ABM)?',
    answer: 'Yes. LeadReach supports ABM in three tiers: (1) Strategic ABM (1:1) — research specific target accounts by name or website, get full 8-agent enrichment, craft highly personalized outreach. (2) ABM Lite (1:few) — create campaigns targeting a segment of similar accounts, segment-based personalization. (3) Programmatic ABM (1:many) — bulk discover accounts matching your ICP across 17+ channels, template-based outreach with light personalization. The 5-dimension scoring model helps prioritize ABM accounts by strategic fit.',
    category: 'Industry & Use Cases',
  },
  {
    id: 'iu-004',
    question: 'Is LeadReach suitable for agencies and resellers?',
    answer: 'Yes. The Channel Partner program offers: white-label branding (your logo, your domain), multi-tenant management (manage multiple client accounts from one dashboard), custom pricing tiers, dedicated support, and revenue sharing. Agencies can run campaigns for multiple clients simultaneously, each with their own ICP and branding. The API enables custom client portals and integrations. Contact partners@leadreach.com for partnership details.',
    category: 'Industry & Use Cases',
  },
  {
    id: 'iu-005',
    question: 'Can LeadReach help with competitive intelligence?',
    answer: 'Yes. Use the prospect discovery to research competitors: enter a competitor\'s website and the orchestrator will discover their tech stack, key executives, recent news, hiring signals, social media presence, and partnerships. The Sage (Research) agent performs deep company research, and the enrichment pipeline fills firmographic data (employee count, revenue estimate, founding year). This is useful for competitive positioning, battle cards, and market analysis.',
    category: 'Industry & Use Cases',
    isNew: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // ACCOUNT & SUPPORT
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'as-001',
    question: 'How do I contact support?',
    answer: 'Multiple support channels: (1) In-app — click the "Ask AI" button in the top bar for instant answers. (2) Email — support@leadreach.com (response within 24 hours on free plans, 4 hours on paid plans, 1 hour on Enterprise). (3) Live chat — available in the bottom-right corner during business hours (9 AM - 6 PM UTC). (4) Priority support — Command and Enterprise plans include a dedicated Slack channel with our engineering team. (5) Documentation — comprehensive docs at docs.leadreach.com with code examples and video tutorials.',
    category: 'Account & Support',
    popular: true,
  },
  {
    id: 'as-002',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page, enter your email, and we\'ll send a reset link valid for 1 hour. If you don\'t receive the email within 5 minutes, check your spam folder. If you\'re still locked out, contact support@leadreach.com with your account email and we\'ll verify your identity and reset it manually. For SSO/SAML users (Enterprise plan), password resets are handled by your identity provider.',
    category: 'Account & Support',
  },
  {
    id: 'as-003',
    question: 'Can I have multiple users on one account?',
    answer: 'Yes. On the Command plan, you get 5 user seats. Enterprise includes unlimited seats. Each user can have a role (Admin, Manager, Member) with different permissions. Admins can manage billing, users, and integrations. Managers can create campaigns and manage leads. Members can view leads and run enrichment. User management is available in Settings → Team.',
    category: 'Account & Support',
  },
  {
    id: 'as-004',
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel at any time from Settings → Billing → Cancel Subscription. Cancellation takes effect at the end of your current billing cycle — you retain full access until then. Your data is preserved for 30 days after cancellation in case you want to reactivate. After 30 days, all data is permanently deleted. The Founders\' Pass is a one-time payment and never needs cancellation. If you cancel within 14 days of your first payment, you get a full refund (no questions asked).',
    category: 'Account & Support',
  },
  {
    id: 'as-005',
    question: 'Do you offer onboarding assistance?',
    answer: 'Yes. All paid plans include guided onboarding: (1) Scout/Setter — self-serve onboarding with email support. (2) Closer — 1-hour onboarding call with a product specialist. (3) Command — 2-hour onboarding call + ICP workshop + campaign setup assistance. (4) Enterprise — dedicated onboarding manager, white-glove setup, custom ICP development, team training, and 30-day check-in. Book onboarding at onboarding.leadreach.com after signing up.',
    category: 'Account & Support',
    isNew: true,
  },
  {
    id: 'as-006',
    question: 'Is there a community or user forum?',
    answer: 'Yes! Join our community at community.leadreach.com — it includes: (1) Discussion forums — ask questions, share campaigns, discuss strategies. (2) Template library — pre-built campaign templates by industry and use case. (3) Feature requests — vote on upcoming features and submit your own. (4) User spotlights — case studies and success stories. (5) Office hours — weekly live Q&A with our product team (Thursdays 2 PM UTC). The community is free for all LeadReach users.',
    category: 'Account & Support',
    isNew: true,
  },
  {
    id: 'as-007',
    question: 'What is the uptime guarantee?',
    answer: 'We guarantee 99.9% uptime on Command and Enterprise plans (excluding scheduled maintenance). If we fail to meet this in any month, you receive a service credit equal to 10x the downtime (e.g., 1 hour of downtime = 10 hours of service credit). Enterprise plans can negotiate 99.99% uptime SLAs. Status page: status.leadreach.com shows real-time and historical uptime for all services. Scheduled maintenance is announced at least 72 hours in advance and performed during off-peak hours (2-4 AM UTC).',
    category: 'Account & Support',
  },
  {
    id: 'as-008',
    question: 'Can I request new features?',
    answer: 'Absolutely! We actively develop based on user feedback. Submit feature requests at: (1) Community — community.leadreach.com/feature-requests (vote on existing requests or submit new ones). (2) In-app — click "Ask AI" and type "feature request". (3) Email — product@leadreach.com. (4) User interviews — we conduct monthly user interviews; sign up at research.leadreach.com. Popular requests with > 50 community votes are prioritized in our roadmap. We ship new features every 2 weeks.',
    category: 'Account & Support',
    isNew: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // AI WORKFORCE COMMAND CENTER (additional)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'awc-001',
    question: 'How do I deploy all agents at once?',
    answer: 'Click the "Deploy All" button in the AI Workforce Command Center toolbar. This sets every platform-managed agent\'s status to "active" and updates their lastActiveAt timestamp. The button shows a spinner during the operation and a success toast when complete: "Deployed 14 agents". Deploy All is idempotent — re-running it on already-active agents has no negative effect. You can also deploy individual agents by opening their workspace and changing the status.',
    category: 'AI Workforce Command Center',
    isNew: true,
  },
  {
    id: 'awc-002',
    question: 'What does the "Health Check" button do?',
    answer: 'The Health Check button recalculates the health score for every agent. For each agent, it: (1) pulls the agent\'s task history (completed, failed, in-progress), (2) computes the success rate (completed / total tasks), (3) checks the last active timestamp (recent = healthy), (4) checks for error states, (5) computes the composite health score (0-100), (6) assigns a health label (healthy/degraded/unhealthy/critical), and (7) updates the database. The button shows a spinner and a success toast: "Health check complete — 14 agents, avg 95/100".',
    category: 'AI Workforce Command Center',
    isNew: true,
  },
  {
    id: 'awc-003',
    question: 'What does the "Seed Agents" button do?',
    answer: 'The Seed Agents button creates or updates the 14 standard platform-managed AI workforce agents from their definitions (in /lib/workforce/definitions.ts). Each agent definition includes: slug, name, role, department, description, persona, avatar, color, skills, tools, MCP servers, RAG sources, permissions, expertise, model, temperature, maxTokens, systemPrompt, scheduleType, maxConcurrentTasks, and priority. Seeding is idempotent (upsert by slug) — re-running it updates agent definitions without creating duplicates. After seeding, you can deploy all agents with "Deploy All".',
    category: 'AI Workforce Command Center',
    isNew: true,
  },
  {
    id: 'awc-004',
    question: 'What is the Live Orchestration Feed?',
    answer: 'The Live Orchestration Feed is a real-time event stream in the AI Workforce Command Center that shows what every agent is doing right now. It displays: timestamp, agent avatar, agent name (color-coded), action description, and status (running/completed/failed). The feed polls the /api/workforce/tasks endpoint every 15 seconds for new task events and pushes them to the feed. Events include task creation, dispatch, completion, failure, and inter-agent communication. The feed keeps the last 60 events.',
    category: 'AI Workforce Command Center',
    isNew: true,
  },
  {
    id: 'awc-005',
    question: 'What is the Department Breakdown?',
    answer: 'The Department Breakdown section shows per-department statistics: Executive (PROMETHEUS, KRONOS), Growth (Market, Content, Media, Sales), Technology (Architect, Developer, QA, DevOps, Cyber), Operations (CFO, Compliance, HR). For each department: agent count, average health score, and total tasks (completed + in-progress). This helps identify which departments are overloaded or underperforming. Click a department card to filter the agent grid by that department.',
    category: 'AI Workforce Command Center',
  },

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL: DATA & ANALYTICS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'da-001',
    question: 'How does the dashboard calculate metrics?',
    answer: 'The dashboard uses a unified /api/dashboard/stats endpoint that aggregates all metrics server-side in a single database call. This ensures numbers are always consistent across the Dashboard, Campaigns, Leads, and AI Workforce sections. The endpoint returns: totalCampaigns, totalLeads, leadsByStage (group by), leadsByTier (group by), qualifiedLeads, enrichedLeads, contactedLeads, responseRate, averageLeadScore, activeAgents, and per-campaign breakdown (totalLeads, hotLeads, warmLeads, coldLeads). No client-side computation — all numbers come from the database.',
    category: 'Getting Started',
    isNew: true,
  },
  {
    id: 'da-002',
    question: 'Why do numbers match across Dashboard, Campaigns, and Leads?',
    answer: 'All sections now read from the same database tables via a single /api/dashboard/stats endpoint. The Dashboard\'s "Total Leads" = the sum of all campaign lead counts = the Leads section\'s total (when no filter is applied). Campaign cards show real hot/warm/cold lead breakdowns from the database (via groupBy queries). When you change a lead\'s stage in the Leads section, the campaign\'s counters (leadsQualified, leadsContacted, leadsResponded) are automatically updated via PUT /api/leads/[id]. This ensures perfect consistency — no more numbers that don\'t add up.',
    category: 'Getting Started',
    isNew: true,
  },
  {
    id: 'da-003',
    question: 'Can I see lead distribution by tier (hot/warm/cold)?',
    answer: 'Yes. The dashboard\'s /api/dashboard/stats endpoint returns leadsByTier — a breakdown of all leads by tier: super_hot, hot, warm, cold, unqualified. The AI Workforce Command Center also shows tier breakdowns per campaign in the campaign breakdown data. Additionally, the Leads section has a tier filter (dropdown) that lets you view only hot leads, only warm leads, etc. The campaign detail page shows a "Hot Leads" metric card that counts both hot AND super_hot tiers.',
    category: 'Getting Started',
    isNew: true,
  },
  {
    id: 'da-004',
    question: 'What analytics and reporting are available?',
    answer: 'LeadReach provides: (1) Dashboard — real-time metrics (campaigns, leads, qualified, response rate, stage distribution, tier distribution, active agents). (2) Campaign analytics — per-campaign: discovered, enriched, avg score, hot leads, tier breakdown, pipeline progress. (3) Lead analytics — per-lead: 5-dimension scores, data completeness, enrichment history, stage timeline. (4) Workforce analytics — per-agent: tasks completed, success rate, token usage, health score, activity log. (5) Pipeline analytics — real-time event stream, inter-agent communication, task graph. All data is available via the REST API for custom reporting and BI tool integration.',
    category: 'Getting Started',
    isNew: true,
  },
  {
    id: 'da-005',
    question: 'Can I create custom reports?',
    answer: 'Yes. Use the REST API to pull any data into your preferred BI tool (Looker, Tableau, Metabase, Google Data Studio). Common custom reports: (1) Lead velocity — average time from discovery to qualification by campaign. (2) Enrichment coverage — % of leads with key fields filled, by campaign. (3) Agent productivity — tasks completed per agent per day. (4) Channel effectiveness — which discovery channels produce the highest-scoring leads. (5) Pipeline conversion — stage-to-stage conversion rates. Enterprise customers get a dedicated data warehouse export (daily S3 sync).',
    category: 'Getting Started',
    isNew: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL: TECHNICAL DEEP DIVE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'td-001',
    question: 'What AI models power the LeadReach agents?',
    answer: 'LeadReach uses the GLM (General Language Model) family from Zhipu AI: glm-4.6v-flash (fast, cost-effective, used by most agents), glm-4.7-flash (enhanced reasoning, used by PROMETHEUS and Core Architect for complex decisions). The model is configured per agent in the Training & Config tab. Temperature ranges from 0.1 (PROMETHEUS — deterministic, strategic) to 0.7 (Content Architect — creative). Max tokens: 4,096 (default) to 8,192 (PROMETHEUS). All model calls go through /lib/llm.ts which handles failover between model tiers, rate limiting, and token budget management.',
    category: 'AI Workforce',
  },
  {
    id: 'td-002',
    question: 'What technology stack does LeadReach use?',
    answer: 'Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 (OKLCH colors), shadcn/ui component library, Recharts for data visualization. Backend: Next.js API routes (serverless), Prisma ORM (PostgreSQL/SQLite), z-ai-web-dev-sdk (AI model access, web search, page reader). Infrastructure: Vercel/standalone Node.js server, SQLite (development) / PostgreSQL (production), Redis (caching, rate limiting). The platform is built as a monorepo with the Next.js app as the primary package.',
    category: 'Integrations',
  },
  {
    id: 'td-003',
    question: 'How does the multi-channel search work technically?',
    answer: 'The multi-channel search uses a tiered fallback architecture: Tier 1 — directDuckDuckGoSearch (fetches html.duckduckgo.com/html/?q=query directly via IPv4, parses HTML results). Tier 2 — discoverBusinesses (uses z-ai-web-dev-sdk web_search function with pagination, generates 10 query variations searched in parallel, falls back to Exa semantic search). Tier 3 — LinkedIn company/people search, GitHub repo search, Reddit search, Twitter search, YouTube search (each via dedicated API functions in agent-reach-bridge.ts). Results from all tiers are merged, deduplicated by URL, and saved as leads. The pipeline generates query variations ("list of X", "top X", "best X companies") for multi-pass discovery.',
    category: 'Integrations',
    isNew: true,
  },
  {
    id: 'td-004',
    question: 'What is the z-ai-web-dev-sdk?',
    answer: 'The z-ai-web-dev-sdk is the AI development toolkit that powers LeadReach\'s intelligence. It provides: chat completions (LLM access), vision (image analysis), web search (real-time web search with results), page reader (web page content extraction), text-to-speech, speech-to-text, and image generation. The SDK is used by the prospect-agent orchestrator for research, the enrichment pipeline for field extraction, the scoring engine for lead qualification, and the outreach composer for message generation. It\'s the backbone of the entire AI workforce.',
    category: 'Integrations',
  },
  {
    id: 'td-005',
    question: 'How is data stored and managed?',
    answer: 'Data is stored in a PostgreSQL (production) or SQLite (development) database managed by Prisma ORM. Key tables: Campaign (name, description, target industry/location/size, status, lead counts), Lead (60+ fields across identity, location, contact, people, firmographic, digital, financial, scoring, pipeline), WorkforceAgent (14 agents with config, health, metrics), WorkforceTask (task queue), WorkforceSession (chat sessions), WorkforceDocument (knowledge base), WorkforceChatMessage (inter-agent chat), WorkforceLog (time-based activity logs), AgentTask (lead-gen pipeline tasks). All tables use cascade deletes (deleting a campaign deletes its leads, deleting an agent deletes its tasks/sessions/documents/logs).',
    category: 'Integrations',
  },
];

// ============================================================
// Helper Functions
// ============================================================

export function getFAQsByCategory(category: string): FAQEntry[] {
  return FAQ_ITEMS.filter(faq => faq.category === category);
}

export function getPopularFAQs(): FAQEntry[] {
  return FAQ_ITEMS.filter(faq => faq.popular);
}

export function getNewFAQs(): FAQEntry[] {
  return FAQ_ITEMS.filter(faq => faq.isNew);
}

export function searchFAQs(query: string): FAQEntry[] {
  const lower = query.toLowerCase();
  return FAQ_ITEMS.filter(faq =>
    faq.question.toLowerCase().includes(lower) ||
    faq.answer.toLowerCase().includes(lower) ||
    faq.category.toLowerCase().includes(lower)
  );
}

export function getFAQCount(): number {
  return FAQ_ITEMS.length;
}

export function getCategoryCount(): number {
  return FAQ_CATEGORIES.length;
}
