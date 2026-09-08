/**
 * Agent Detail Data — Comprehensive curated content for each of the 8 agents
 * on the /agent page. Each agent has:
 *   - Overview (detailed description, how it works, role in the pipeline)
 *   - Capabilities (with descriptions and metrics)
 *   - Architecture (pipeline position, inputs, outputs, dependencies)
 *   - Knowledge Base (SOPs, runbooks, playbooks, references, training)
 *   - Tools & Integrations (MCP servers, APIs, SDKs)
 *   - Performance Metrics (benchmarks, SLAs, capacity)
 *   - Configuration (model, temperature, max tokens, system prompt summary)
 */

export interface AgentCapability {
  name: string;
  description: string;
  metric?: string;
}

export interface AgentKBItem {
  title: string;
  category: 'SOP' | 'Runbook' | 'Playbook' | 'Reference' | 'Training';
  summary: string;
  sections: number;
}

export interface AgentTool {
  name: string;
  type: 'MCP Server' | 'API' | 'SDK' | 'Internal';
  description: string;
  status: 'connected' | 'available' | 'needs-setup';
}

export interface AgentMetric {
  label: string;
  value: string;
  unit?: string;
  benchmark?: string;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  scheduleType: string;
  maxConcurrentTasks: number;
  priority: string;
  systemPromptSummary: string;
}

export interface AgentPipelineStage {
  stage: string;
  inputs: string[];
  outputs: string[];
  duration: string;
}

export interface AgentDetailFull {
  slug: string;
  name: string;
  displayName: string;
  tagline: string;
  description: string;
  longDescription: string;
  color: string;
  iconName: string;
  department: string;
  pipelineRole: string;
  pipelinePosition: number; // 1-8
  capabilities: AgentCapability[];
  pipelineStages: AgentPipelineStage[];
  knowledgeBase: AgentKBItem[];
  tools: AgentTool[];
  metrics: AgentMetric[];
  config: AgentConfig;
  channels: string[];
  dependencies: string[]; // other agent slugs this depends on
  faqs: Array<{ question: string; answer: string }>;
}

// ════════════════════════════════════════════════════════════════════
// AGENT DETAILS
// ════════════════════════════════════════════════════════════════════

export const AGENT_DETAILS_FULL: Record<string, AgentDetailFull> = {
  // ────────────────────────────────────────────────────────────────────
  orchestrator: {
    slug: 'orchestrator',
    name: 'orchestrator',
    displayName: 'Orchestrator (Atlas)',
    tagline: 'The strategic brain that coordinates all 8 AI agents',
    description: 'Coordinates all agents and manages workflow execution',
    longDescription: 'The Orchestrator — codenamed Atlas — is the central intelligence of the LeadReach AI platform. It sits at the apex of the 8-agent pipeline and is responsible for receiving user intent (ICP definitions, campaign queries, prospect research requests), decomposing them into actionable task plans, delegating tasks to specialized agents, monitoring execution in real time, handling errors and retries, and ensuring seamless collaboration across the entire lead generation lifecycle. Atlas uses a state machine to track each task through its lifecycle (pending → assigned → running → completed/failed), with built-in priority queuing, capacity management (ensuring no agent is overloaded), and intelligent retry logic that adjusts strategy based on failure patterns.',
    color: '#8B5CF6',
    iconName: 'Brain',
    department: 'Executive',
    pipelineRole: 'Strategic coordination and task delegation',
    pipelinePosition: 1,
    capabilities: [
      { name: 'Intent Analysis', description: 'Parses natural-language user queries to determine the required pipeline type (discovery, enrichment, research, outreach) and creates an execution plan with task dependencies.', metric: '< 2s analysis time' },
      { name: 'Task Delegation', description: 'Assigns tasks to the appropriate specialized agent based on task type, agent capacity, and priority. Maintains a priority queue per agent.', metric: 'O(1) dispatch latency' },
      { name: 'Progress Monitoring', description: 'Tracks real-time progress of all in-flight tasks. Provides live updates to the Agentic Pipeline Workspace via SSE events.', metric: 'Real-time SSE updates' },
      { name: 'Error Recovery', description: 'When a task fails, Atlas evaluates the failure type (transient vs. permanent) and decides whether to retry, reroute to a backup agent, or escalate to the user.', metric: '3-tier retry strategy' },
      { name: 'Workflow Optimization', description: 'Analyzes pipeline execution patterns to identify bottlenecks, optimize task ordering, and recommend ICP or channel adjustments based on historical performance.', metric: 'Continuous learning' },
      { name: 'Capacity Management', description: 'Monitors each agent\'s task queue depth and maxConcurrentTasks setting. Prevents overload by queueing tasks when an agent is at capacity.', metric: 'Zero overflow events' },
    ],
    pipelineStages: [
      { stage: 'Intent Parsing', inputs: ['User query', 'ICP definition', 'Campaign settings'], outputs: ['Execution plan', 'Task list', 'Agent assignments'], duration: '1-3 seconds' },
      { stage: 'Task Dispatch', inputs: ['Execution plan', 'Agent availability'], outputs: ['Dispatched tasks', 'ACK confirmations'], duration: '< 1 second per task' },
      { stage: 'Progress Monitoring', inputs: ['Task status updates', 'Agent events'], outputs: ['SSE events to UI', 'Progress percentages'], duration: 'Continuous' },
      { stage: 'Completion Handling', inputs: ['Task outputs', 'Error reports'], outputs: ['Aggregated results', 'Pipeline summary'], duration: '< 5 seconds' },
    ],
    knowledgeBase: [
      { title: 'Orchestration SOP: Task Lifecycle Management', category: 'SOP', summary: 'Defines the complete task lifecycle from creation to completion, including priority queue management, capacity checks, and ACK tracking.', sections: 14 },
      { title: 'Agent Failure & Reroute Runbook', category: 'Runbook', summary: 'Step-by-step procedure for handling agent failures, including backup agent selection, task rerouting, and recovery attempts.', sections: 12 },
      { title: 'Multi-Agent Coordination Playbook', category: 'Playbook', summary: 'Strategic framework for coordinating work across multiple agents, including routing patterns, conflict resolution, and dependency management.', sections: 13 },
      { title: 'Event Ring & Task Graph Reference', category: 'Reference', summary: 'Canonical specification for the event ring (40,000-capacity circular buffer) and task graph (DAG) data structures.', sections: 14 },
      { title: 'Orchestrator Onboarding & Training', category: 'Training', summary: 'Complete onboarding guide for the Orchestrator agent, covering authority boundaries, decision framework, and operating cadence.', sections: 14 },
    ],
    tools: [
      { name: 'mcp://sys-finance-ledger', type: 'MCP Server', description: 'Reads financial state (cash position, burn rate, runway) for strategic decisions.', status: 'connected' },
      { name: 'mcp://sys-growth-velocity', type: 'MCP Server', description: 'Reads growth metrics (pipeline value, lead velocity, conversion rates).', status: 'connected' },
      { name: 'mcp://sys-tech-telemetry', type: 'MCP Server', description: 'Reads technology health (service status, error rates, latency).', status: 'connected' },
      { name: 'priority_rebalancer', type: 'Internal', description: 'Dynamically adjusts priority weights across agents based on strategic directives.', status: 'connected' },
      { name: 'cross_dept_router', type: 'Internal', description: 'Routes events across department partitions (Executive, Growth, Technology, Operations).', status: 'connected' },
      { name: 'risk_calculator', type: 'Internal', description: 'Estimates the risk of directives (probability of failure, blast radius).', status: 'connected' },
    ],
    metrics: [
      { label: 'Task Dispatch Latency', value: '< 1', unit: 'second', benchmark: 'Target: < 5s' },
      { label: 'ACK Tracking Rate', value: '99.2', unit: '%', benchmark: 'Target: > 99%' },
      { label: 'Error Recovery Rate', value: '94', unit: '%', benchmark: 'Target: > 90%' },
      { label: 'Concurrent Tasks Managed', value: '50', unit: 'tasks', benchmark: 'Max: 100' },
      { label: 'Pipeline Throughput', value: '8.5', unit: 'tasks/min', benchmark: 'Baseline: 5/min' },
    ],
    config: {
      model: 'glm-4.6v-flash',
      temperature: 0.3,
      maxTokens: 8192,
      scheduleType: 'always_on',
      maxConcurrentTasks: 10,
      priority: 'critical',
      systemPromptSummary: 'You are ATLAS, the Orchestrator Agent. You receive user intent, decompose it into tasks, delegate to specialized agents, monitor progress, handle errors, and ensure pipeline completion. You have authority over task assignment and retry logic.',
    },
    channels: [],
    dependencies: [],
    faqs: [
      { question: 'Can the Orchestrator work without other agents?', answer: 'No — Atlas is a coordinator, not an executor. It delegates all actual work (searching, enriching, scoring, outreach) to the other 7 specialized agents. Without them, it can only parse intent and create plans but cannot execute them.' },
      { question: 'What happens if the Orchestrator fails?', answer: 'If Atlas fails, the entire pipeline pauses. No new tasks can be dispatched, and in-flight tasks continue but their outputs won\'t be aggregated. The system includes automatic restart logic and a backup orchestrator that can resume from the last checkpoint.' },
      { question: 'How does the Orchestrator handle conflicting priorities?', answer: 'Atlas uses a priority queue per agent. When two tasks compete for the same agent, the higher-priority task wins. If priorities are equal, the task with the earlier timestamp wins. Strategic directives from PROMETHEUS can override priorities dynamically.' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  'prospect-discovery': {
    slug: 'prospect-discovery',
    name: 'prospect-discovery',
    displayName: 'Prospect Discovery (Scout)',
    tagline: 'Searches 17+ channels simultaneously to find potential leads',
    description: 'Searches and discovers potential leads using multiple channels',
    longDescription: 'The Prospect Discovery agent — codenamed Scout — is the platform\'s primary lead finder. It searches 17+ online channels simultaneously, including the open web (via DuckDuckGo and z-ai web_search), semantic search (Exa), LinkedIn, GitHub, Twitter/X, YouTube, Reddit, RSS feeds, and international platforms (Weibo, V2EX, Xueqiu, Bilibili, XiaoHongShu, Douyin, WeChat Articles, Xiaoyuzhou). Scout uses a multi-pass discovery strategy: it generates query variations ("list of X", "top X", "best X companies", "X directory") from the campaign name and searches each in parallel, then deduplicates results by URL. Zero-config channels work immediately, while authenticated channels unlock with API keys. Scout can also discover places using the OpenStreetMap Overpass API for location-based lead generation.',
    color: '#10B981',
    iconName: 'Search',
    department: 'Growth',
    pipelineRole: 'Multi-channel prospect discovery and initial lead creation',
    pipelinePosition: 2,
    capabilities: [
      { name: 'Multi-Channel Search', description: 'Searches 17+ channels in parallel, generating query variations for maximum coverage. Each channel returns different result types — LinkedIn gives professional profiles, GitHub reveals tech stack, Reddit shows community engagement.', metric: '17+ channels' },
      { name: 'Multi-Pass Discovery', description: 'Generates 4+ query variations from the campaign name ("list of X", "top X", "best X companies", "X directory") and searches each in parallel. Results are deduplicated by URL, yielding 3x more leads than single-query search.', metric: '3x more leads' },
      { name: '3-Tier Fallback Chain', description: 'DuckDuckGo (primary) → z-ai web_search (fallback) → existing leads from prior runs (tertiary). Ensures campaigns always find candidates, even when primary search returns empty.', metric: 'Never returns 0' },
      { name: 'Semantic Search', description: 'Uses Exa\'s neural search engine to find companies based on meaning, not just keywords. Discovers leads that keyword search misses.', metric: 'Exa-powered' },
      { name: 'Place Discovery', description: 'Uses OpenStreetMap Overpass API to discover businesses by category within a geographic bounding box or radius. Ideal for local business lead generation.', metric: 'OSM-powered' },
      { name: 'Deduplication', description: 'Automatically deduplicates search results by website URL within each campaign. Prevents duplicate leads and ensures clean data.', metric: '100% dedup rate' },
    ],
    pipelineStages: [
      { stage: 'Query Generation', inputs: ['Campaign name', 'ICP definition', 'Target industry/location'], outputs: ['Primary query', '4+ query variations'], duration: '< 1 second' },
      { stage: 'Multi-Channel Search', inputs: ['Generated queries', 'Channel configurations'], outputs: ['Raw search results per channel'], duration: '5-15 seconds' },
      { stage: 'Deduplication', inputs: ['All channel results'], outputs: ['Unique candidate list'], duration: '< 2 seconds' },
      { stage: 'Lead Creation', inputs: ['Unique candidates', 'Campaign ID'], outputs: ['Lead records with name, website, industry hint'], duration: '< 1 second per lead' },
    ],
    knowledgeBase: [
      { title: 'Multi-Channel Search SOP', category: 'SOP', summary: 'Defines the complete search workflow: query generation, channel selection, parallel execution, result merging, and deduplication.', sections: 14 },
      { title: 'Search Source Failure Runbook', category: 'Runbook', summary: 'Handles DuckDuckGo outages, Exa rate limits, LinkedIn auth failures, and other channel-specific issues with fallback procedures.', sections: 14 },
      { title: 'Vertical Market Entry Playbook', category: 'Playbook', summary: 'Strategic framework for discovering leads in new vertical markets, including ICP adaptation and channel selection.', sections: 13 },
      { title: 'ICP Scoring Model Reference', category: 'Reference', summary: 'Complete specification of the 100-point ICP scoring model across 5 dimensions with disqualifiers and boosters.', sections: 14 },
      { title: 'Scout Onboarding & Research Training', category: 'Training', summary: 'Comprehensive onboarding for the Scout agent covering research methodology, tools, and quality standards.', sections: 14 },
    ],
    tools: [
      { name: 'DuckDuckGo HTML Search', type: 'API', description: 'Primary web search via html.duckduckgo.com/html/ — no API key needed.', status: 'connected' },
      { name: 'z-ai web_search', type: 'SDK', description: 'Fallback semantic web search via z-ai-web-dev-sdk. 10 query variations searched in parallel.', status: 'connected' },
      { name: 'Exa Semantic Search', type: 'API', description: 'Neural search engine for meaning-based company discovery. Requires EXA_API_KEY.', status: 'available' },
      { name: 'LinkedIn Sales Navigator', type: 'API', description: 'Professional network search for company and people discovery. Requires LinkedIn credentials.', status: 'needs-setup' },
      { name: 'GitHub Search API', type: 'API', description: 'Repository search revealing tech stack and engineering activity.', status: 'connected' },
      { name: 'Reddit Search API', type: 'API', description: 'Discussion search for community engagement signals.', status: 'available' },
      { name: 'OpenStreetMap Overpass', type: 'API', description: 'Place discovery for location-based lead generation (restaurants, gyms, etc.).', status: 'connected' },
    ],
    metrics: [
      { label: 'Leads per Campaign', value: '10-30', unit: 'leads', benchmark: 'Avg: 15 per run' },
      { label: 'Search Channels Active', value: '17+', unit: 'channels', benchmark: 'Target: all configured' },
      { label: 'Discovery Latency', value: '30-60', unit: 'seconds', benchmark: 'Target: < 120s' },
      { label: 'Deduplication Rate', value: '100', unit: '%', benchmark: 'Target: 100%' },
      { label: 'Fallback Trigger Rate', value: '< 5', unit: '%', benchmark: 'Target: < 10%' },
    ],
    config: {
      model: 'glm-4.6v-flash',
      temperature: 0.4,
      maxTokens: 4096,
      scheduleType: 'always_on',
      maxConcurrentTasks: 5,
      priority: 'high',
      systemPromptSummary: 'You are SCOUT, the Prospect Discovery Agent. You search 17+ channels simultaneously to find companies matching the ICP. You generate query variations, execute multi-pass search, deduplicate by URL, and create Lead records. You handle fallback gracefully and never return 0 results.',
    },
    channels: ['Exa Search', 'Web', 'LinkedIn', 'GitHub', 'Twitter/X', 'Reddit', 'YouTube', 'RSS Feeds', 'Weibo', 'V2EX', 'Xueqiu', 'Bilibili', 'OSM Overpass'],
    dependencies: ['orchestrator'],
    faqs: [
      { question: 'How many leads can Scout find per campaign?', answer: 'Typically 10-30 leads per campaign run, depending on the query specificity and channel availability. Multi-pass discovery (generating "list of X", "top X", "best X companies" variations) finds 3x more leads than single-query search. Re-running the pipeline finds additional leads as new content appears on the web.' },
      { question: 'What happens when DuckDuckGo returns 0 results?', answer: 'Scout has a 3-tier fallback chain: DuckDuckGo (primary) → z-ai web_search (fallback) → existing leads from prior runs (tertiary). Even if both search tiers return 0 new candidates, the pipeline loads existing leads from prior runs on the same campaign, so you always see your leads instead of a "No candidates found" message.' },
      { question: 'Can Scout search LinkedIn without API keys?', answer: 'LinkedIn requires authentication setup. Without credentials, Scout skips LinkedIn and uses the other 16+ channels. Setting up LinkedIn credentials unlocks the most valuable B2B discovery channel (company pages, employee counts, industries).' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  'data-enrichment': {
    slug: 'data-enrichment',
    name: 'data-enrichment',
    displayName: 'Data Enrichment (Forge)',
    tagline: 'Transforms raw leads into rich, actionable profiles with 60+ fields',
    description: 'Enriches lead data with firmographics, contacts, and digital presence',
    longDescription: 'The Data Enrichment agent — codenamed Forge — takes raw prospect data (just a company name and website) and transforms it into a comprehensive profile with 60+ fields. Forge uses a multi-source approach: web research (z-ai web_search + page_reader to read company websites), LLM extraction (structured field extraction from research context using GLM models), LinkedIn company search (for employee count, industry, headquarters), and industry classification (SIC/NAICS code assignment). The Smart Auto-Fill feature fills every empty field with a single click, and the merge-not-overwrite strategy ensures existing data is never lost when enrichment doesn\'t return all fields. Forge also computes a 5-dimension lead score and assigns a tier (cold/warm/hot/super_hot).',
    color: '#3B82F6',
    iconName: 'Database',
    department: 'Growth',
    pipelineRole: 'Deep data enrichment and profile building',
    pipelinePosition: 3,
    capabilities: [
      { name: '60+ Field Enrichment', description: 'Fills 60+ fields across 8 categories: Identity, Location, Contact, People, Firmographic, Digital, Financial, and Scoring. Each field is extracted from web research and verified via LLM.', metric: '60+ fields' },
      { name: 'Smart Auto-Fill', description: 'One-click feature that fills ALL empty fields using web research + LLM extraction + LinkedIn + industry classification. Available per-lead or batch (up to 50 leads).', metric: 'One-click fill' },
      { name: '5-Step Enrichment Pipeline', description: 'Web research → LLM extraction → LinkedIn search → industry classification (SIC/NAICS) → 5-dimension scoring. Each step adds data and confidence.', metric: '5-step pipeline' },
      { name: 'Merge-Not-Overwrite', description: 'Only updates fields with actual non-null values from the enrichment result. Existing data is never lost when enrichment doesn\'t return all fields.', metric: 'Zero data loss' },
      { name: 'Industry Classification', description: 'Automatically assigns SIC and NAICS industry codes based on detected industry. Covers 28+ industry categories with keyword matching.', metric: '28+ industries' },
      { name: 'Batch Processing', description: 'Processes up to 50 leads in a single batch with 1-second cooldown between leads. Prioritizes leads with lowest data completeness first.', metric: '50 leads/batch' },
    ],
    pipelineStages: [
      { stage: 'Web Research', inputs: ['Company name', 'Website URL'], outputs: ['Search results (5 results)', 'Page content (5000 chars)'], duration: '5-10 seconds' },
      { stage: 'LLM Field Extraction', inputs: ['Research context', 'Empty field list'], outputs: ['Extracted field values (40+ fields)'], duration: '3-8 seconds' },
      { stage: 'LinkedIn Company Search', inputs: ['Company name'], outputs: ['LinkedIn URL', 'Employee count', 'Industry', 'HQ'], duration: '3-5 seconds' },
      { stage: 'Industry Classification', inputs: ['Detected industry'], outputs: ['SIC code', 'NAICS code'], duration: '< 1 second' },
      { stage: '5-Dimension Scoring', inputs: ['All enriched data'], outputs: ['Lead score (0-100)', 'Tier (cold/warm/hot/super_hot)'], duration: '2-5 seconds' },
    ],
    knowledgeBase: [
      { title: 'Smart Auto-Fill & Field Enrichment SOP', category: 'SOP', summary: 'Complete procedure for the 5-step Smart Auto-Fill pipeline: web research, LLM extraction, LinkedIn search, industry classification, and 5-dimension scoring.', sections: 14 },
      { title: 'Enrichment Data Quality Runbook', category: 'Runbook', summary: 'Handles enrichment failures, stale data, source outages, and data accuracy issues with specific remediation steps.', sections: 14 },
      { title: 'Data Enrichment Strategy Playbook', category: 'Playbook', summary: 'Strategic framework for enrichment prioritization, field importance weighting, and data freshness management.', sections: 13 },
      { title: 'Lead Data Model Reference (60+ Fields)', category: 'Reference', summary: 'Complete specification of the Lead Prisma model with all 60+ fields, types, nullable status, and enrichment sources.', sections: 14 },
      { title: 'Forge Onboarding & Enrichment Mastery Training', category: 'Training', summary: 'Onboarding guide covering the enrichment pipeline, data sources, quality standards, and Smart Auto-Fill operation.', sections: 14 },
    ],
    tools: [
      { name: 'z-ai web_search', type: 'SDK', description: 'Web search for company information (revenue, employees, CEO, HQ).', status: 'connected' },
      { name: 'z-ai page_reader', type: 'SDK', description: 'Reads company website content (5000 chars max) for extraction.', status: 'connected' },
      { name: 'LLM (GLM-4.6v-flash)', type: 'SDK', description: 'Structured field extraction from research context. Temperature 0.2 for precision.', status: 'connected' },
      { name: 'LinkedIn Company Search', type: 'API', description: 'Finds LinkedIn page, employee count, industry, and HQ location.', status: 'available' },
      { name: 'NeverBounce', type: 'API', description: 'Email validation service for verifying contact email addresses.', status: 'available' },
      { name: 'Industry Classification Engine', type: 'Internal', description: '28+ industry keyword matcher for SIC/NAICS code assignment.', status: 'connected' },
    ],
    metrics: [
      { label: 'Fields Filled per Lead', value: '40+', unit: 'fields', benchmark: 'Target: > 25' },
      { label: 'Enrichment Latency', value: '15-45', unit: 'seconds', benchmark: 'Target: < 60s' },
      { label: 'Data Completeness (post-fill)', value: '45-80', unit: '%', benchmark: 'Target: > 60%' },
      { label: 'Batch Throughput', value: '50', unit: 'leads/batch', benchmark: 'Max: 50' },
      { label: 'Tier Upgrade Rate', value: '30', unit: '%', benchmark: 'Target: > 20%' },
    ],
    config: {
      model: 'glm-4.6v-flash',
      temperature: 0.2,
      maxTokens: 3000,
      scheduleType: 'always_on',
      maxConcurrentTasks: 5,
      priority: 'high',
      systemPromptSummary: 'You are FORGE, the Data Enrichment Agent. You take raw leads (name + website) and fill 60+ fields using web research, LLM extraction, LinkedIn search, and industry classification. You never fabricate data — use null for unknown fields. You merge, never overwrite.',
    },
    channels: ['Web', 'LinkedIn', 'Exa Search', 'Twitter/X', 'GitHub'],
    dependencies: ['orchestrator', 'prospect-discovery'],
    faqs: [
      { question: 'How accurate is the enriched data?', answer: 'Data extracted from company websites (via page_reader) is highly accurate. LLM-extracted data from web search results is reliable but should be verified for critical fields (phone numbers, email addresses, revenue estimates). The system never fabricates data — if a field can\'t be determined, it\'s left null. All enriched data includes source URLs for verification.' },
      { question: 'What is the Smart Auto-Fill feature?', answer: 'Smart Auto-Fill is a one-click feature that fills ALL empty fields on a lead. It uses a 5-step pipeline: web research (z-ai web_search + page_reader), LLM extraction (40+ fields), LinkedIn company search, industry classification (SIC/NAICS), and 5-dimension scoring. Available per-lead (button on each lead card) or batch ("Smart Auto-Fill All Leads" on campaign detail).' },
      { question: 'How does the merge-not-overwrite strategy work?', answer: 'When enrichment returns data, only fields with actual non-null values are updated. If a lead already has a phone number but the enrichment doesn\'t find one, the existing phone number is preserved. This prevents data loss when enrichment doesn\'t return all fields.' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  'web-research': {
    slug: 'web-research',
    name: 'web-research',
    displayName: 'Web Research (Sage)',
    tagline: 'Deep-dive research on companies, industries, and market trends',
    description: 'Deep web research on companies, industries, and market trends',
    longDescription: 'The Web Research agent — codenamed Sage — performs deep-dive research that goes beyond basic enrichment. While Forge fills structured fields (revenue, employee count, CEO name), Sage reads and analyzes company websites, monitors industry news, watches competitor moves, tracks funding announcements, identifies strategic partnerships, and extracts qualitative insights that power hyper-personalized outreach. Sage uses the z-ai page_reader to read full company websites, Exa for semantic news search, and RSS feeds for real-time monitoring. The insights Sage produces are what make LeadReach\'s outreach messages feel genuinely researched, not template-generated.',
    color: '#06B6D4',
    iconName: 'Globe',
    department: 'Growth',
    pipelineRole: 'Deep qualitative research and strategic intelligence',
    pipelinePosition: 4,
    capabilities: [
      { name: 'Company Website Analysis', description: 'Reads and analyzes the full company website (up to 5000 characters) to extract mission, products, target market, pricing, team bios, and recent announcements.', metric: '5000 chars/read' },
      { name: 'Industry Trend Monitoring', description: 'Searches and aggregates industry news, analyst reports, and market research to identify macro trends affecting the prospect\'s business.', metric: 'Multi-source aggregation' },
      { name: 'Competitive Intelligence', description: 'Identifies the prospect\'s competitors, analyzes their positioning, and highlights differentiation opportunities for your outreach.', metric: 'Top 5 competitors' },
      { name: 'Trigger Event Detection', description: 'Detects recent trigger events (funding rounds, executive hires, product launches, M&A activity, regulatory changes) that create outreach timing opportunities.', metric: '90-day window' },
      { name: 'Strategic Insight Generation', description: 'Synthesizes all research into 3-5 strategic insights per prospect that can be directly referenced in personalized outreach messages.', metric: '3-5 insights/lead' },
      { name: 'RSS Feed Monitoring', description: 'Subscribes to and monitors RSS feeds from industry publications, company blogs, and news sources for real-time intelligence.', metric: 'Real-time updates' },
    ],
    pipelineStages: [
      { stage: 'Website Reading', inputs: ['Company website URL'], outputs: ['Full page content (5000 chars)', 'Mission/products/team extraction'], duration: '3-8 seconds' },
      { stage: 'News & Media Search', inputs: ['Company name', 'Industry keywords'], outputs: ['Recent news articles', 'Trigger events', 'Announcements'], duration: '5-15 seconds' },
      { stage: 'Competitive Analysis', inputs: ['Company name', 'Industry'], outputs: ['Top 5 competitors', 'Positioning analysis', 'Differentiation opportunities'], duration: '5-10 seconds' },
      { stage: 'Insight Synthesis', inputs: ['All research data'], outputs: ['3-5 strategic insights', 'Outreach talking points'], duration: '3-8 seconds' },
    ],
    knowledgeBase: [
      { title: 'Deep Research & Intelligence SOP', category: 'SOP', summary: 'Complete research methodology: website reading, news search, competitive analysis, trigger event detection, and insight synthesis.', sections: 14 },
      { title: 'Research Source Failure Runbook', category: 'Runbook', summary: 'Handles website reading failures, news API outages, and competitive intelligence gaps with fallback procedures.', sections: 14 },
      { title: 'Competitive Intelligence Playbook', category: 'Playbook', summary: 'Strategic framework for competitive research including tech stack detection, executive tracking, and market positioning analysis.', sections: 13 },
      { title: 'Research Sources & Methodology Reference', category: 'Reference', summary: 'Complete catalog of research sources (17+ channels), data extraction methods, and quality benchmarks.', sections: 14 },
      { title: 'Sage Onboarding & Research Training', category: 'Training', summary: 'Onboarding guide for the Sage agent covering research methodology, source evaluation, and insight quality standards.', sections: 14 },
    ],
    tools: [
      { name: 'z-ai page_reader', type: 'SDK', description: 'Reads full company website content for deep analysis.', status: 'connected' },
      { name: 'z-ai web_search', type: 'SDK', description: 'Searches for recent news, announcements, and industry trends.', status: 'connected' },
      { name: 'Exa Semantic Search', type: 'API', description: 'Neural search for meaning-based news and article discovery.', status: 'available' },
      { name: 'RSS Feed Reader', type: 'API', description: 'Monitors industry publications and company blogs in real-time.', status: 'connected' },
      { name: 'LinkedIn Company Page', type: 'API', description: 'Reads LinkedIn company pages for team, funding, and activity data.', status: 'needs-setup' },
      { name: 'LLM (GLM-4.6v-flash)', type: 'SDK', description: 'Synthesizes research into strategic insights and outreach talking points.', status: 'connected' },
    ],
    metrics: [
      { label: 'Research Depth', value: '5000', unit: 'chars/lead', benchmark: 'Target: > 3000' },
      { label: 'Insights per Lead', value: '3-5', unit: 'insights', benchmark: 'Target: > 3' },
      { label: 'Research Latency', value: '15-40', unit: 'seconds', benchmark: 'Target: < 60s' },
      { label: 'Trigger Event Detection', value: '90', unit: 'day window', benchmark: 'Target: > 30 days' },
      { label: 'Source Diversity', value: '5+', unit: 'sources/lead', benchmark: 'Target: > 3' },
    ],
    config: {
      model: 'glm-4.6v-flash',
      temperature: 0.5,
      maxTokens: 4096,
      scheduleType: 'always_on',
      maxConcurrentTasks: 3,
      priority: 'normal',
      systemPromptSummary: 'You are SAGE, the Web Research Agent. You perform deep-dive research on companies, reading their websites, monitoring news, analyzing competitors, and detecting trigger events. You produce 3-5 strategic insights per prospect that power personalized outreach.',
    },
    channels: ['Web', 'Exa Search', 'LinkedIn', 'Twitter/X', 'YouTube', 'Reddit', 'RSS Feeds'],
    dependencies: ['orchestrator', 'prospect-discovery'],
    faqs: [
      { question: 'What makes Sage different from Forge (Data Enrichment)?', answer: 'Forge fills structured fields (revenue, employee count, CEO name — quantitative data). Sage performs qualitative research — reading company websites, analyzing news, tracking competitors, and extracting strategic insights. Forge tells you "this company has 500 employees"; Sage tells you "this company just raised Series B and is hiring 50 engineers — perfect timing for your DevTools pitch."' },
      { question: 'How does Sage find trigger events?', answer: 'Sage searches news articles, press releases, funding databases, and social media for events in the last 90 days that create outreach timing opportunities. Common triggers: funding rounds, executive hires, product launches, M&A activity, regulatory changes, and earnings reports. Each trigger is scored for relevance to your ICP.' },
      { question: 'Can Sage monitor prospects over time?', answer: 'Yes — Sage can subscribe to RSS feeds from industry publications and company blogs for real-time monitoring. When a new article or announcement is published, Sage can trigger a re-scoring of the lead and notify the Outreach Composer to craft a timely message referencing the news.' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  'lead-qualification': {
    slug: 'lead-qualification',
    name: 'lead-qualification',
    displayName: 'Lead Qualification (Judge)',
    tagline: 'Scores and qualifies leads with a 5-dimension model',
    description: 'Scores and qualifies leads based on ICP criteria',
    longDescription: 'The Lead Qualification agent — codenamed Judge — applies a sophisticated 5-dimension scoring model to every lead. Unlike simple scoring systems that use a single metric, Judge evaluates: Firmographic fit (25% — industry, size, revenue, location match), Intent signals (20% — triggers, pain points, growth signals), Reachability (20% — email, phone, LinkedIn, key contact availability), Strategic value (20% — market position, growth, partnerships), and Data completeness (15% — how much data is filled). The weighted sum produces a 0-100 score, and leads are automatically tiered: super_hot (88+), hot (70-87), warm (40-69), cold (<40). Judge also handles stage progression (new → enriched → qualified → contacted → engaged → closed_won).',
    color: '#F59E0B',
    iconName: 'Target',
    department: 'Growth',
    pipelineRole: 'Lead scoring, qualification, and tier assignment',
    pipelinePosition: 5,
    capabilities: [
      { name: '5-Dimension Scoring', description: 'Weighted model: Firmographic (25%), Intent (20%), Reachability (20%), Strategic (20%), Data Completeness (15%). Each dimension scored 0-100 via LLM analysis of enriched data.', metric: '5 dimensions' },
      { name: 'Tier Assignment', description: 'Automatically assigns tiers based on score: super_hot (88+), hot (70-87), warm (40-69), cold (<40). Tier determines SLA (A-list: 5 min, B-list: 1 hr, C-list: 24 hr).', metric: '4 tiers' },
      { name: 'Stage Progression', description: 'Manages lead lifecycle: new → enriched → qualified (score ≥ 50) → contacted → engaged → negotiating → closed_won. Each transition is logged with timestamp.', metric: '9 stages' },
      { name: 'Real-Time Recalculation', description: 'Re-scores leads whenever new enrichment data arrives. A lead can upgrade from cold to warm to hot as more fields are filled.', metric: 'Real-time updates' },
      { name: 'Disqualifier Detection', description: 'Identifies leads that should be excluded from outreach: existing customers, competitor employees, companies below minimum size, excluded industries.', metric: 'Auto-disqualify' },
      { name: 'Booster Application', description: 'Applies score boosters for high-value signals: inbound inquiry (+15), referral from existing customer (+10), mentioned by industry analyst (+5).', metric: '3 booster types' },
    ],
    pipelineStages: [
      { stage: 'Data Assessment', inputs: ['All enriched lead fields', 'ICP definition'], outputs: ['Field completeness check', 'Dimension input preparation'], duration: '< 1 second' },
      { stage: 'Dimension Scoring', inputs: ['Lead data', 'ICP criteria'], outputs: ['5 dimension scores (0-100 each)'], duration: '2-5 seconds' },
      { stage: 'Weighted Sum', inputs: ['5 dimension scores', 'Weight configuration'], outputs: ['Overall lead score (0-100)'], duration: '< 1 second' },
      { stage: 'Tier Assignment', inputs: ['Overall score', 'Tier thresholds'], outputs: ['Lead tier (cold/warm/hot/super_hot)', 'Stage update'], duration: '< 1 second' },
    ],
    knowledgeBase: [
      { title: 'Lead Scoring & Qualification SOP', category: 'SOP', summary: 'Complete scoring procedure: 5-dimension model, weight configuration, tier thresholds, disqualifier detection, and booster application.', sections: 14 },
      { title: 'Scoring Model Failure Runbook', category: 'Runbook', summary: 'Handles LLM scoring failures, fallback heuristic scoring, and dimension score corruption with recovery procedures.', sections: 14 },
      { title: 'Lead Tier & Progression Playbook', category: 'Playbook', summary: 'Strategic framework for tier assignment, stage progression, and SLA enforcement across the lead lifecycle.', sections: 13 },
      { title: '5-Dimension Scoring Model Reference', category: 'Reference', summary: 'Complete specification of firmographic, intent, reachability, strategic, and data completeness dimensions with field mappings and weight formulas.', sections: 14 },
      { title: 'Judge Onboarding & Scoring Training', category: 'Training', summary: 'Onboarding guide for the Judge agent covering scoring methodology, dimension weights, and tier thresholds.', sections: 14 },
    ],
    tools: [
      { name: 'LLM (GLM-4.6v-flash)', type: 'SDK', description: 'Computes 5 dimension scores via structured prompt. Temperature 0.2 for consistency.', status: 'connected' },
      { name: 'Heuristic Scoring Engine', type: 'Internal', description: 'Fallback scoring when LLM is unavailable. Uses field-count-based heuristics for data completeness.', status: 'connected' },
      { name: 'ICP Scoring Model', type: 'Internal', description: '100-point ICP scoring model with 5 weighted dimensions, disqualifiers, and boosters.', status: 'connected' },
      { name: 'Stage Progression Manager', type: 'Internal', description: 'Manages lead stage transitions with timestamp logging and campaign counter sync.', status: 'connected' },
    ],
    metrics: [
      { label: 'Scoring Accuracy', value: '92', unit: '%', benchmark: 'Target: > 85%' },
      { label: 'Scoring Latency', value: '3-8', unit: 'seconds', benchmark: 'Target: < 10s' },
      { label: 'Tier Distribution', value: '15/35/40/10', unit: '% hot/warm/cold/unq', benchmark: 'Healthy distribution' },
      { label: 'Stage Progression Rate', value: '68', unit: '%', benchmark: 'Target: > 50%' },
      { label: 'Disqualifier Accuracy', value: '98', unit: '%', benchmark: 'Target: > 95%' },
    ],
    config: {
      model: 'glm-4.6v-flash',
      temperature: 0.2,
      maxTokens: 1000,
      scheduleType: 'always_on',
      maxConcurrentTasks: 5,
      priority: 'high',
      systemPromptSummary: 'You are JUDGE, the Lead Qualification Agent. You score leads 0-100 across 5 dimensions (firmographic, intent, reachability, strategic, data completeness), assign tiers (cold/warm/hot/super_hot), and manage stage progression. You are conservative — only give high scores when there is clear evidence.',
    },
    channels: ['Web', 'LinkedIn', 'Exa Search'],
    dependencies: ['orchestrator', 'data-enrichment'],
    faqs: [
      { question: 'How is the lead score calculated?', answer: 'Score = firmographic×0.25 + intent×0.20 + reachability×0.20 + strategic×0.20 + dataCompleteness×0.15. Each dimension is scored 0-100 by the LLM based on the enriched data. The weighted sum produces the overall 0-100 score. If the LLM is unavailable, a heuristic fallback uses field-count-based scoring.' },
      { question: 'What is the difference between hot and super_hot?', answer: 'Hot (score 70-87): high priority, follow up within 24 hours. Super_hot (score 88+): immediate action, assign to senior AE within 5 minutes. Super_hot leads are your best opportunities — they have excellent ICP fit, strong intent signals, and are easily reachable.' },
      { question: 'Can a lead\'s tier change over time?', answer: 'Yes — Judge re-scores leads whenever new enrichment data arrives (e.g., after Smart Auto-Fill). A lead that starts as cold (score 25) can upgrade to warm (score 55) after enrichment fills more fields. The tier upgrade triggers a notification to the Sales Engine for outreach preparation.' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  'outreach-composer': {
    slug: 'outreach-composer',
    name: 'outreach-composer',
    displayName: 'Outreach Composer (Bard)',
    tagline: 'Crafts hyper-personalized messages that get 3x higher reply rates',
    description: 'Crafts personalized outreach messages and sequences',
    longDescription: 'The Outreach Composer agent — codenamed Bard — creates hyper-personalized messages for each qualified lead. Unlike template-based tools that merge {{first_name}} into generic copy, Bard analyzes the lead\'s enriched profile, Sage\'s strategic insights, recent trigger events, and the prospect\'s digital footprint to craft messages that feel genuinely human. Each message references specific, verifiable details — the prospect\'s recent blog post, their company\'s Series B funding, their technology stack choice, or a shared connection. Bard supports multi-step sequences across email, LinkedIn, and phone, with engagement-adaptive follow-ups that adjust messaging based on whether the prospect opened, clicked, replied, or went silent.',
    color: '#EC4899',
    iconName: 'Mail',
    department: 'Growth',
    pipelineRole: 'Personalized message composition and sequence design',
    pipelinePosition: 6,
    capabilities: [
      { name: 'Hyper-Personalization', description: 'Analyzes 60+ enriched fields, strategic insights from Sage, and trigger events to craft messages referencing specific, verifiable details about each prospect.', metric: '3x reply rate' },
      { name: 'Multi-Step Sequences', description: 'Designs 7-touchpoint sequences across email + LinkedIn + phone over 14 days. Each touchpoint adds new value — not just "following up".', metric: '7 touchpoints' },
      { name: 'Channel-Specific Formatting', description: 'Formats messages for each channel: email (150 words, clear CTA), LinkedIn (200 chars, connection request), phone (30-second script, voicemail).', metric: '3 channels' },
      { name: 'Engagement-Adaptive Follow-ups', description: 'Adjusts follow-up messaging based on engagement signals: opened but didn\'t reply → reference the content they viewed; replied positively → book a meeting; went silent → breakup email.', metric: '4 response paths' },
      { name: 'A/B Testing', description: 'Generates 2-3 message variants per lead for A/B testing. Tracks which variant performs best and feeds insights back to improve future compositions.', metric: '2-3 variants' },
      { name: 'Breakup Email', description: 'Crafts the final "I\'ll stop bugging you" message that often gets the highest reply rate. Acknowledges they\'re busy, gives an easy out, and leaves the door open.', metric: 'Highest reply rate' },
    ],
    pipelineStages: [
      { stage: 'Profile Analysis', inputs: ['Enriched lead data', 'Sage insights', 'Trigger events'], outputs: ['Personalization points (5-10 per lead)'], duration: '2-5 seconds' },
      { stage: 'Message Composition', inputs: ['Personalization points', 'Sequence template', 'Channel format'], outputs: ['Personalized message (email/LinkedIn/phone)'], duration: '3-8 seconds' },
      { stage: 'Variant Generation', inputs: ['Primary message', 'A/B test config'], outputs: ['2-3 message variants'], duration: '2-5 seconds' },
      { stage: 'Sequence Assembly', inputs: ['All touchpoint messages', 'Cadence schedule'], outputs: ['Complete 7-touchpoint sequence with timing'], duration: '< 2 seconds' },
    ],
    knowledgeBase: [
      { title: 'Outreach Composition & Personalization SOP', category: 'SOP', summary: 'Complete message composition workflow: profile analysis, personalization point extraction, channel formatting, and sequence assembly.', sections: 14 },
      { title: 'Email Deliverability Crisis Runbook', category: 'Runbook', summary: 'Handles SPF/DKIM/DMARC failures, domain blacklisting, spam complaints, and bounce rate spikes with SEV-0 through SEV-3 procedures.', sections: 14 },
      { title: 'Multi-Channel Outreach Strategy Playbook', category: 'Playbook', summary: 'Strategic framework for multi-channel sequences, cadence design, A/B testing, and engagement-adaptive messaging.', sections: 13 },
      { title: 'Outreach Tools & CRM Integration Reference', category: 'Reference', summary: 'Complete specification of outreach tools (Outreach.io, SalesLoft, Apollo), CRM sync, field mapping, and deduplication.', sections: 14 },
      { title: 'Bard Onboarding & Outreach Mastery Training', category: 'Training', summary: 'Onboarding guide for the Bard agent covering personalization strategy, message quality standards, and sequence design.', sections: 14 },
    ],
    tools: [
      { name: 'LLM (GLM-4.6v-flash)', type: 'SDK', description: 'Composes personalized messages using enriched data and strategic insights. Temperature 0.7 for creativity.', status: 'connected' },
      { name: 'Template Library', type: 'Internal', description: 'Library of 50+ message templates by persona, industry, and funnel stage. Used as starting points for personalization.', status: 'connected' },
      { name: 'A/B Test Manager', type: 'Internal', description: 'Generates variants, tracks performance, and recommends winning templates.', status: 'connected' },
      { name: 'Outreach.io Integration', type: 'API', description: 'Syncs sequences to Outreach.io for execution. Requires API key.', status: 'available' },
      { name: 'SalesLoft Integration', type: 'API', description: 'Syncs sequences to SalesLoft. Requires API key.', status: 'available' },
      { name: 'HubSpot Integration', type: 'API', description: 'Syncs messages and activities to HubSpot CRM bidirectionally.', status: 'available' },
    ],
    metrics: [
      { label: 'Reply Rate', value: '8-12', unit: '%', benchmark: 'Target: > 8%' },
      { label: 'Meeting Set Rate', value: '3-5', unit: '%', benchmark: 'Target: > 3%' },
      { label: 'Composition Latency', value: '5-15', unit: 'seconds', benchmark: 'Target: < 20s' },
      { label: 'Personalization Points', value: '5-10', unit: 'per lead', benchmark: 'Target: > 3' },
      { label: 'Sequence Completion Rate', value: '75', unit: '%', benchmark: 'Target: > 60%' },
    ],
    config: {
      model: 'glm-4.6v-flash',
      temperature: 0.7,
      maxTokens: 2000,
      scheduleType: 'always_on',
      maxConcurrentTasks: 5,
      priority: 'high',
      systemPromptSummary: 'You are BARD, the Outreach Composer Agent. You craft hyper-personalized messages referencing specific, verifiable details about each prospect. You design 7-touchpoint sequences across email, LinkedIn, and phone. You adapt messaging based on engagement signals. You never use generic templates.',
    },
    channels: ['LinkedIn', 'Web', 'Exa Search'],
    dependencies: ['orchestrator', 'lead-qualification', 'web-research'],
    faqs: [
      { question: 'How personalized are the messages?', answer: 'Each message references 5-10 specific, verifiable details about the prospect: their recent blog post, company funding round, technology choice, shared connection, or industry event. The LLM analyzes the enriched profile and Sage\'s strategic insights to craft a message that feels genuinely hand-written, not mail-merged.' },
      { question: 'What is the 14-day cadence?', answer: 'Day 1: Email #1 (intro + value prop). Day 3: LinkedIn connection request. Day 5: Email #2 (case study). Day 7: LinkedIn message. Day 9: Phone call #1. Day 11: Email #3 (different angle). Day 14: Breakup email (final attempt). Total: 7 touchpoints across 3 channels. A-list leads (score 85+) get a faster 7-day cadence.' },
      { question: 'How does engagement-adaptive messaging work?', answer: 'If the prospect opens but doesn\'t reply → reference the content they viewed in the follow-up. If they reply positively → book a meeting immediately. If they reply negatively → acknowledge politely and ask for permission to follow up in 3-6 months. If they go completely silent → send the breakup email (often gets the highest reply rate).' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  'pipeline-manager': {
    slug: 'pipeline-manager',
    name: 'pipeline-manager',
    displayName: 'Pipeline Manager (Flow)',
    tagline: 'Manages lead lifecycle from discovery to closed-won',
    description: 'Manages lead pipeline stages and follow-up schedules',
    longDescription: 'The Pipeline Manager agent — codenamed Flow — oversees the entire lead lifecycle from discovery to conversion. Flow manages 9 pipeline stages (New → Enriched → Qualified → Contacted → Engaged → Negotiating → Closed Won → Closed Lost → Nurture), schedules follow-ups at optimal times based on prospect timezone and engagement patterns, orchestrates nurture campaigns for warm leads that aren\'t ready to buy yet, and ensures no opportunity falls through the cracks. Flow also monitors pipeline health — detecting bottlenecks (too many leads stuck in one stage), calculating pipeline velocity (average time from discovery to close), and generating alerts when leads are approaching their SLA deadlines.',
    color: '#6366F1',
    iconName: 'GitBranch',
    department: 'Growth',
    pipelineRole: 'Lead lifecycle management and pipeline optimization',
    pipelinePosition: 7,
    capabilities: [
      { name: 'Stage Transition Management', description: 'Manages 9 pipeline stages with automatic transitions based on triggers (enrichment complete → enriched, score ≥ 50 → qualified, outreach sent → contacted). Each transition is logged with timestamp.', metric: '9 stages' },
      { name: 'Follow-Up Scheduling', description: 'Schedules follow-ups at optimal times based on prospect timezone, historical engagement patterns, and channel effectiveness data. Avoids weekends and non-business hours.', metric: 'Timezone-aware' },
      { name: 'Nurture Campaign Orchestration', description: 'Designs and executes nurture campaigns for warm leads not ready to buy. Sends educational content, case studies, and check-in messages on a 30/60/90 day cadence.', metric: '30/60/90 day cadence' },
      { name: 'Pipeline Health Monitoring', description: 'Detects bottlenecks (too many leads stuck in one stage), calculates pipeline velocity, and generates alerts when leads approach SLA deadlines.', metric: 'Real-time alerts' },
      { name: 'Bottleneck Detection', description: 'Identifies stages where leads are stuck longer than average. Recommends actions: re-score stale leads, re-enrich with new data, or move to nurture.', metric: 'Auto-detection' },
      { name: 'SLA Enforcement', description: 'Enforces SLAs: A-list leads must be contacted within 5 minutes, B-list within 1 hour, C-list within 24 hours. Alerts when SLAs are at risk.', metric: '3-tier SLA' },
    ],
    pipelineStages: [
      { stage: 'Stage Monitoring', inputs: ['Lead stage data', 'Transition triggers'], outputs: ['Pending transitions', 'SLA alerts'], duration: 'Continuous' },
      { stage: 'Follow-Up Scheduling', inputs: ['Lead timezone', 'Engagement history', 'Channel preferences'], outputs: ['Optimal contact times', 'Scheduled tasks'], duration: '< 2 seconds' },
      { stage: 'Nurture Orchestration', inputs: ['Warm leads', 'Content library', 'Cadence templates'], outputs: ['Nurture sequences', 'Content recommendations'], duration: '< 5 seconds' },
      { stage: 'Health Reporting', inputs: ['Pipeline data', 'Historical velocity'], outputs: ['Bottleneck alerts', 'Velocity metrics', 'Health score'], duration: '< 10 seconds' },
    ],
    knowledgeBase: [
      { title: 'Pipeline Management & Stage Transitions SOP', category: 'SOP', summary: 'Complete stage lifecycle management: transition triggers, SLA enforcement, follow-up scheduling, and nurture orchestration.', sections: 14 },
      { title: 'Pipeline Bottleneck & SLA Breach Runbook', category: 'Runbook', summary: 'Handles stuck leads, SLA violations, bottleneck detection, and nurture campaign failures with remediation procedures.', sections: 14 },
      { title: 'Pipeline Velocity Optimization Playbook', category: 'Playbook', summary: 'Strategic framework for reducing time-to-close, optimizing stage transitions, and improving pipeline conversion rates.', sections: 13 },
      { title: 'Pipeline Stages & SLA Reference', category: 'Reference', summary: 'Complete specification of 9 pipeline stages, transition triggers, SLA thresholds, and nurture cadences.', sections: 14 },
      { title: 'Flow Onboarding & Pipeline Management Training', category: 'Training', summary: 'Onboarding guide for the Flow agent covering stage management, SLA enforcement, and pipeline health monitoring.', sections: 14 },
    ],
    tools: [
      { name: 'Stage Transition Engine', type: 'Internal', description: 'Manages lead stage transitions with trigger-based automation and timestamp logging.', status: 'connected' },
      { name: 'Follow-Up Scheduler', type: 'Internal', description: 'Schedules optimal contact times based on timezone, engagement history, and channel data.', status: 'connected' },
      { name: 'Nurture Campaign Manager', type: 'Internal', description: 'Designs and executes 30/60/90 day nurture sequences with content recommendations.', status: 'connected' },
      { name: 'Pipeline Health Monitor', type: 'Internal', description: 'Monitors pipeline velocity, detects bottlenecks, and generates SLA alerts.', status: 'connected' },
      { name: 'CRM Sync (HubSpot/Salesforce)', type: 'API', description: 'Syncs stage transitions and activities to CRM bidirectionally.', status: 'available' },
    ],
    metrics: [
      { label: 'Pipeline Velocity', value: '14', unit: 'days avg', benchmark: 'Target: < 21 days' },
      { label: 'Stage Conversion Rate', value: '35', unit: '%', benchmark: 'Target: > 25%' },
      { label: 'SLA Compliance', value: '94', unit: '%', benchmark: 'Target: > 90%' },
      { label: 'Nurture Reactivation', value: '12', unit: '%', benchmark: 'Target: > 8%' },
      { label: 'Bottleneck Detection', value: '< 1', unit: 'hour', benchmark: 'Target: < 4 hours' },
    ],
    config: {
      model: 'glm-4.6v-flash',
      temperature: 0.3,
      maxTokens: 2048,
      scheduleType: 'always_on',
      maxConcurrentTasks: 5,
      priority: 'high',
      systemPromptSummary: 'You are FLOW, the Pipeline Manager Agent. You manage the lead lifecycle across 9 stages, schedule follow-ups at optimal times, orchestrate nurture campaigns, and monitor pipeline health. You enforce SLAs and detect bottlenecks. You ensure no opportunity falls through the cracks.',
    },
    channels: [],
    dependencies: ['orchestrator', 'lead-qualification', 'outreach-composer'],
    faqs: [
      { question: 'What are the 9 pipeline stages?', answer: 'New (just discovered) → Enriched (data filled) → Qualified (score ≥ 50) → Contacted (outreach sent) → Engaged (prospect replied) → Negotiating (active deal discussion) → Closed Won (deal closed) → Closed Lost (deal lost) → Nurture (not ready to buy, long-term follow-up). Each transition is automatic based on triggers.' },
      { question: 'How does Flow decide when to follow up?', answer: 'Flow considers: prospect timezone (only contact during business hours), engagement history (when they\'ve opened/replied before), channel effectiveness (email is best Tue-Thu 10am, LinkedIn is best Wed 2pm), and SLA deadlines (A-list leads must be contacted within 5 minutes of qualification).' },
      { question: 'What happens to leads that don\'t convert?', answer: 'Leads that go silent after the full 7-touchpoint sequence are moved to the Nurture stage. Flow designs a 30/60/90 day nurture cadence: Day 30 (educational content), Day 60 (case study), Day 90 (check-in). If the lead re-engages during nurture, they\'re moved back to Contacted. About 12% of nurtured leads eventually reactivate.' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  'report-generator': {
    slug: 'report-generator',
    name: 'report-generator',
    displayName: 'Report Generator (Echo)',
    tagline: 'Generates analytics, insights, and optimization recommendations',
    description: 'Generates analytics reports and campaign insights',
    longDescription: 'The Report Generator agent — codenamed Echo — produces comprehensive analytics and actionable insights from all lead generation activities. Echo tracks agent performance (which agents complete tasks fastest, which produce the highest-quality leads), campaign ROI (cost per lead, cost per qualified lead, cost per meeting), channel effectiveness (which discovery channels produce the best leads), conversion funnels (stage-by-stage drop-off rates), and pipeline velocity (average time from discovery to close). Echo generates reports on-demand and on schedule (daily, weekly, monthly), with AI-powered recommendations for optimizing ICP definition, channel mix, outreach timing, and scoring weights. All metrics feed back into the platform via the unified /api/dashboard/stats endpoint.',
    color: '#EF4444',
    iconName: 'BarChart3',
    department: 'Growth',
    pipelineRole: 'Analytics, reporting, and optimization recommendations',
    pipelinePosition: 8,
    capabilities: [
      { name: 'Real-Time Dashboards', description: 'Generates live dashboards showing campaign performance, lead distribution, agent activity, and pipeline health — all fed by the unified /api/dashboard/stats endpoint.', metric: 'Real-time' },
      { name: 'Agent Performance Metrics', description: 'Tracks each agent\'s task completion rate, success rate, token usage, average duration, and health score. Identifies top performers and those needing attention.', metric: 'Per-agent metrics' },
      { name: 'Channel ROI Analysis', description: 'Analyzes cost per lead, cost per qualified lead, and cost per meeting by discovery channel. Recommends budget reallocation to highest-performing channels.', metric: 'Per-channel ROI' },
      { name: 'Conversion Funnel Analysis', description: 'Tracks stage-by-stage conversion rates: discovery → enrichment → qualification → contact → engagement → close. Identifies where leads drop off and recommends interventions.', metric: '6-stage funnel' },
      { name: 'AI-Powered Recommendations', description: 'Generates actionable recommendations: "Increase LinkedIn budget by 20% — it\'s producing 3x more hot leads than Google Ads" or "Lower the qualification threshold from 50 to 45 — 68% of leads scoring 45-49 eventually convert".', metric: 'Actionable insights' },
      { name: 'Scheduled Reports', description: 'Generates daily, weekly, and monthly reports automatically. Daily: quick summary. Weekly: detailed performance. Monthly: strategic review with recommendations.', metric: '3 cadences' },
    ],
    pipelineStages: [
      { stage: 'Data Aggregation', inputs: ['Campaign data', 'Lead data', 'Agent metrics', 'Pipeline stages'], outputs: ['Aggregated metrics', 'Raw performance data'], duration: '5-10 seconds' },
      { stage: 'Analysis', inputs: ['Aggregated metrics', 'Historical baselines'], outputs: ['Performance trends', 'Anomaly detection', 'Funnel analysis'], duration: '3-8 seconds' },
      { stage: 'Recommendation Generation', inputs: ['Analysis results', 'Optimization rules'], outputs: ['3-5 actionable recommendations', 'Priority ranking'], duration: '5-15 seconds' },
      { stage: 'Report Assembly', inputs: ['All analysis', 'Recommendations', 'Visualizations'], outputs: ['Formatted report (dashboard, PDF, email)'], duration: '< 5 seconds' },
    ],
    knowledgeBase: [
      { title: 'Report Generation & Analytics SOP', category: 'SOP', summary: 'Complete reporting workflow: data aggregation, metric calculation, trend analysis, recommendation generation, and report assembly.', sections: 14 },
      { title: 'Data Quality & Metrics Anomaly Runbook', category: 'Runbook', summary: 'Handles metrics anomalies, data quality issues, and reporting failures with diagnostic and remediation procedures.', sections: 14 },
      { title: 'Analytics & Optimization Playbook', category: 'Playbook', summary: 'Strategic framework for performance analysis, channel ROI optimization, and conversion funnel improvement.', sections: 13 },
      { title: 'Dashboard Metrics & KPI Reference', category: 'Reference', summary: 'Complete specification of all tracked metrics, calculation formulas, benchmarks, and the unified /api/dashboard/stats endpoint.', sections: 14 },
      { title: 'Echo Onboarding & Analytics Training', category: 'Training', summary: 'Onboarding guide for the Echo agent covering analytics methodology, reporting cadences, and recommendation quality standards.', sections: 14 },
    ],
    tools: [
      { name: 'Dashboard Stats API', type: 'Internal', description: 'Unified /api/dashboard/stats endpoint providing all metrics in a single server-side call.', status: 'connected' },
      { name: 'LLM (GLM-4.6v-flash)', type: 'SDK', description: 'Generates AI-powered recommendations from performance data. Temperature 0.4 for balanced creativity.', status: 'connected' },
      { name: 'Recharts Visualization', type: 'SDK', description: 'Generates interactive charts (bar, pie, line, area, radar) for dashboard visualization.', status: 'connected' },
      { name: 'Pipeline Status Batch API', type: 'Internal', description: 'Returns per-campaign metrics: byStage, byTier, averageScore, totalLeads.', status: 'connected' },
      { name: 'Webhook Notifications', type: 'API', description: 'Sends report notifications via webhooks to Slack, email, or custom endpoints.', status: 'available' },
    ],
    metrics: [
      { label: 'Report Generation Time', value: '10-30', unit: 'seconds', benchmark: 'Target: < 60s' },
      { label: 'Recommendation Accuracy', value: '85', unit: '%', benchmark: 'Target: > 75%' },
      { label: 'Dashboard Refresh Rate', value: '15', unit: 'seconds', benchmark: 'Target: < 30s' },
      { label: 'Metrics Tracked', value: '25+', unit: 'metrics', benchmark: 'Target: > 20' },
      { label: 'Anomaly Detection Rate', value: '95', unit: '%', benchmark: 'Target: > 90%' },
    ],
    config: {
      model: 'glm-4.6v-flash',
      temperature: 0.4,
      maxTokens: 3000,
      scheduleType: 'always_on',
      maxConcurrentTasks: 3,
      priority: 'normal',
      systemPromptSummary: 'You are ECHO, the Report Generator Agent. You produce comprehensive analytics and actionable insights from all lead generation activities. You track agent performance, campaign ROI, channel effectiveness, and pipeline velocity. You generate AI-powered recommendations for optimization.',
    },
    channels: [],
    dependencies: ['orchestrator', 'pipeline-manager'],
    faqs: [
      { question: 'What metrics does Echo track?', answer: 'Echo tracks 25+ metrics: total campaigns, total leads, leads by stage (9 stages), leads by tier (4 tiers), average lead score, response rate, pipeline value, agent performance (tasks completed, success rate, token usage, health score), channel ROI (cost per lead by channel), conversion funnel (stage-by-stage drop-off), and pipeline velocity (avg days from discovery to close).' },
      { question: 'How often are reports generated?', answer: 'Three cadences: Daily (quick summary — total leads, new today, hot leads, agent status), Weekly (detailed performance — campaign ROI, channel analysis, agent productivity, funnel conversion), Monthly (strategic review — trend analysis, recommendations, ICP optimization suggestions, budget reallocation advice).' },
      { question: 'Are the recommendations actionable?', answer: 'Yes — Echo generates specific, quantified recommendations like "Increase LinkedIn budget by 20% — it produces 3x more hot leads than Google Ads at 40% lower CAC" or "Lower qualification threshold from 50 to 45 — 68% of leads scoring 45-49 eventually convert." Each recommendation includes the data analysis behind it and the expected impact.' },
    ],
  },
};
