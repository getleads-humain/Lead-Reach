import type { AgentDetailFull } from './types';

export const webResearchDetail: AgentDetailFull = {
  slug: 'web-research',
  name: 'web-research',
  displayName: 'Web Research (Sage)',
  tagline: 'Deep-dive qualitative research that turns raw web data into outreach-ready strategic insights',
  description: 'Deep web research on companies, industries, and market trends',
  longDescription:
    'The Web Research agent — codenamed Sage — performs deep-dive qualitative research that goes far beyond the structured enrichment Forge produces. While Forge fills quantitative fields (revenue, employee count, CEO name), Sage reads the full company website (up to 5000 chars per page via the z-ai page_reader), monitors industry news across multiple sources, watches competitor moves, tracks funding announcements, identifies strategic partnerships, and synthesizes 3–5 strategic insights per prospect that power hyper-personalized outreach. Sage uses Exa for semantic news search, RSS feeds for real-time monitoring, Crunchbase for funding signals, and the GLM-4.6v-flash model for insight synthesis. The insights Sage produces are what make LeadReach\'s outreach messages feel genuinely researched — referencing a prospect\'s recent Series B, their new CTO hire, or their competitor\'s pricing change — rather than template-generated mail merges. Where Forge tells you "this company has 500 employees," Sage tells you "this company just raised Series B and is hiring 50 engineers — perfect timing for your DevTools pitch."',
  color: '#06B6D4',
  iconName: 'Globe',
  department: 'Growth',
  pipelineRole: 'Deep qualitative research and strategic intelligence',
  pipelinePosition: 4,

  capabilities: [
    {
      name: 'Company Website Deep Reading',
      description:
        'Uses the z-ai page_reader to fetch and analyze up to 5000 characters of the prospect\'s homepage plus informative subpages (/about, /products, /team, /press, /news, /careers). Extracts mission, product lines, pricing tiers, team bios, technology signals, customer logos, and recent announcements.',
      metric: '5000 chars/read',
      details: [
        'Reads the homepage first; if content is thin (< 800 chars), automatically follows links to /about, /products, /team, /press, /news, /careers to maximize coverage.',
        'Each extraction is tagged with its source URL and access timestamp so every downstream insight is fully traceable to the originating page.',
        'Detects technology signals from page HTML, script tags, and meta tags (e.g. "Powered by Shopify", "Built with Next.js", analytics scripts revealing the prospect\'s own tech stack).',
        'Customer logos are extracted from /customers or case-study pages; these become "shared customer" talking points for the Outreach Composer.',
      ],
    },
    {
      name: 'Industry Trend Monitoring',
      description:
        'Searches and aggregates industry news, analyst reports, and market research to identify macro trends affecting the prospect\'s business. Combines keyword search (z-ai web_search) with semantic search (Exa) to catch trends that keyword search alone would miss.',
      metric: 'Multi-source aggregation',
      details: [
        'Query variations generated from the prospect\'s industry: "{{industry}} trends 2026", "{{industry}} market report", "{{industry}} growth forecast", "{{industry}} challenges".',
        'Sources are classified into 3 trust tiers: primary (official industry reports, government statistics), secondary (reputable news outlets, analyst firms), tertiary (blog posts, forums).',
        'Each trend is tagged with: trend_text, source_url, publication_date, relevance_score (0.0–1.0), and impact_direction (positive, negative, neutral for the prospect).',
        'Trends older than 90 days are flagged as "background context" rather than actionable signals — they enrich understanding but don\'t drive outreach timing.',
      ],
    },
    {
      name: 'Competitive Intelligence',
      description:
        'Identifies the prospect\'s top 5 competitors using direct search ("{{company}} competitors", "{{company}} alternatives"), industry landscape articles, and analyst reports. For each competitor, captures differentiation, funding stage, and recent news.',
      metric: 'Top 5 competitors',
      details: [
        'Competitor identification uses three methods in parallel: explicit comparison pages ("X vs Y"), industry landscape articles, and "alternative to X" search queries.',
        'Each competitor record includes: name, website, one-sentence differentiation, funding stage (if available), employee count (if available), and last notable news item.',
        'Positions the prospect relative to competitors using four archetypes: leader, challenger, disruptor, niche player. This positioning drives the outreach angle.',
        'Competitor pricing data (when publicly available) is captured to inform value-proposition framing in outreach.',
      ],
    },
    {
      name: 'Trigger Event Detection',
      description:
        'Detects recent trigger events within a 90-day window that create outreach timing opportunities: funding rounds, executive hires, product launches, M&A activity, regulatory changes, earnings reports, and layoffs/restructuring.',
      metric: '90-day window',
      details: [
        'Trigger types monitored: funding (Series A–D+, seed, debt, IPO), executive hires (CEO, CTO, VP Sales, VP Engineering — the roles that signal buying intent), product launches, M&A (acquired, acquiring, merged), regulatory (compliance deadlines, new regulations), earnings (quarterly results, guidance changes).',
        'Each trigger is scored on a 4-factor relevance model: recency (newer = higher), magnitude (funding amount, hire seniority), ICP_fit (alignment with your value prop), actionability (how easily it can be referenced in outreach).',
        'Triggers with relevance < 0.3 are dropped; the top 3 triggers by relevance are flagged for use in outreach talking points.',
        'Trigger sources are diversified across news outlets, press release wires (PR Newswire, Business Wire), funding databases (Crunchbase), and social signals (LinkedIn announcements, executive tweets).',
      ],
    },
    {
      name: 'Strategic Insight Synthesis',
      description:
        'Synthesizes all research into 3–5 strategic insights per prospect. Each insight follows a structured format: insight text, source URL, confidence score (0.0–1.0), category (trigger, competitive, strategic, operational), and outreach talking point.',
      metric: '3-5 insights/lead',
      details: [
        'Insight count is calibrated to 3–5: fewer than 3 leaves the Outreach Composer without enough material; more than 5 dilutes focus and produces noise.',
        'Insights are ranked: most actionable first. Actionability is computed as the product of confidence × ICP_fit × recency.',
        'Every insight must reference a specific, verifiable fact from a cited source URL. Generic observations ("this company is growing") are rejected.',
        'Insights are categorized to help Bard (Outreach Composer) pick the right angle: trigger insights open with timing hooks; competitive insights frame against alternatives; strategic insights pitch the big picture; operational insights address pain points.',
      ],
    },
    {
      name: 'RSS Feed Monitoring',
      description:
        'Subscribes to and monitors RSS feeds from industry publications, company blogs, and news sources for real-time intelligence. Polls every 15 minutes and triggers re-scoring when fresh content appears.',
      metric: 'Real-time updates',
      details: [
        'Maintains a feed registry of 200+ industry publications, analyst blogs, and company newsrooms organized by industry vertical.',
        'Per-prospect RSS subscriptions are created automatically when a lead enters the pipeline: the prospect\'s company blog, press release feed, and 2–3 relevant industry publications.',
        'Poll interval is 15 minutes for active campaigns; 60 minutes for dormant leads. New items are scored for trigger-event relevance; high-scoring items emit research.trigger_detected events.',
        'Feed failures (404, malformed XML, persistent 5xx) disable the feed after 3 consecutive failures and notify the operator for review.',
      ],
    },
    {
      name: 'Outreach Talking Points Generation',
      description:
        'Converts the top 2–3 strategic insights into ready-to-use outreach talking points. Each talking point is a single sentence a sales rep could use to open a conversation, referencing a specific verifiable fact from a cited source.',
      metric: '2-3 talking points',
      details: [
        'Talking points follow the pattern: "Saw {{specific_fact}} — {{bridge}} — {{value_prop_hook}}." The specific_fact is verifiable from a cited source; the bridge connects it to the prospect\'s likely priority; the value_prop_hook previews your offering.',
        'Each talking point includes a "verification_url" field so Bard (or a human reviewer) can confirm the fact before sending.',
        'Talking points are tuned for tone: confident but not presumptuous, specific but not creepy. The LLM is prompted to avoid phrases that sound like surveillance ("I noticed you...") in favor of professional observations ("Saw the announcement...").',
        'Talking points are tagged with the insight they derive from, preserving full provenance from source URL → extraction → insight → talking point.',
      ],
    },
    {
      name: 'Source Diversity Enforcement',
      description:
        'Enforces a minimum of 5 distinct sources per prospect to prevent insight tunneling. Sources span website, news, RSS, social, funding databases, and analyst reports.',
      metric: '5+ sources/lead',
      details: [
        'Source categories: company website, news outlets, RSS feeds, social media (LinkedIn, Twitter/X), funding databases (Crunchbase), analyst reports, government filings (SEC EDGAR for public companies).',
        'A pre-output check fails the task if fewer than 5 distinct source domains are represented in the research_brief.',
        'If a category is unavailable (e.g. prospect has no Crunchbase entry), Sage substitutes with additional sources from other categories rather than falling below the 5-source floor.',
        'Source diversity is tracked as a quality metric per prospect and rolled up to campaign-level reporting.',
      ],
    },
    {
      name: 'Executive & Team Tracking',
      description:
        'Tracks executive hires, departures, and team growth signals for the prospect and its competitors. New CTO/VP hires are particularly strong buying-intent signals for technical products.',
      metric: 'Executive moves',
      details: [
        'Monitors C-suite and VP-level hires: CEO, CTO, CPO, VP Engineering, VP Sales, VP Marketing, CFO, COO. New hires in these roles signal buying intent for tools aligned to their function.',
        'Sources: LinkedIn company page (if authenticated), press releases, executive announcement articles, conference speaker lists.',
        'Hire signals are scored: a new CTO at a Series A company is high-relevance for dev-tools; a new CFO at a public company is high-relevance for finance tools.',
        'Departures are also tracked — a departing CTO may indicate tech-stack dissatisfaction or budget cuts, which can flip a hot lead to cold.',
      ],
    },
    {
      name: 'Tech Stack Detection',
      description:
        'Detects the prospect\'s technology stack from website HTML, job postings, engineering blog posts, and BuiltWith-style lookups. Reveals which tools the prospect already uses, informing compatibility angles for outreach.',
      metric: 'Tech stack inferred',
      details: [
        'HTML inspection: extracts script tags, meta generators, framework hints (Next.js, React, Vue, Angular), analytics scripts (GA4, Mixpanel, Amplitude), and CMS markers (WordPress, Contentful, Sanity).',
        'Job posting analysis: reads /careers page job descriptions for named technologies ("experience with Kubernetes", "familiarity with Snowflake").',
        'Engineering blog posts: parses /engineering or /blog for technology mentions and architecture discussions.',
        'BuiltWith API (optional): when configured, provides structured tech-stack data with adoption dates and confidence scores.',
      ],
    },
    {
      name: 'Funding & M&A Signal Tracking',
      description:
        'Tracks funding announcements, M&A activity, and IPO filings via Crunchbase, press releases, and SEC filings. Funding events are among the strongest buying-intent signals and are flagged as priority triggers.',
      metric: 'Funding signals',
      details: [
        'Crunchbase API integration: queries for the prospect\'s funding history — rounds, amounts, investors, dates. New rounds in the last 90 days are flagged as priority triggers.',
        'SEC EDGAR integration (for public companies): pulls 10-K, 10-Q, and 8-K filings for material events, earnings, and risk factors.',
        'Press release wire monitoring: PR Newswire, Business Wire, GlobeNewswire feeds parsed for company-specific announcements.',
        'Each funding/M&A event includes: event_type, amount (if disclosed), date, source_url, investor_or_counterparty, and a relevance_score for outreach timing.',
      ],
    },
    {
      name: 'Differentiation from Forge (Qualitative Layer)',
      description:
        'Explicitly distinguishes Sage\'s qualitative research from Forge\'s quantitative enrichment. Forge fills structured fields; Sage extracts the WHY behind the numbers — the strategic context that makes outreach feel researched rather than mail-merged.',
      metric: 'Qualitative layer',
      details: [
        'Forge answers: "How many employees does this company have?" Sage answers: "This company grew from 200 to 500 employees in the last year — they\'re scaling fast and likely need tooling to support the growth."',
        'Forge answers: "Who is the CEO?" Sage answers: "The CEO was previously VP at {{competitor}} and gave a talk last month about scaling engineering orgs — outreach referencing that talk will resonate."',
        'Sage does not duplicate Forge\'s work; if a structured field is already populated by Forge, Sage references it but does not re-extract it.',
        'The two agents run in parallel where possible; Sage consumes Forge\'s structured fields as inputs to inform which qualitative angles to pursue.',
      ],
    },
  ],

  pipelineStages: [
    {
      stage: 'Source Planning & Query Generation',
      inputs: ['Company name', 'Website URL', 'Industry', 'ICP context', 'Optional focus areas'],
      outputs: ['Source selection list', 'Per-source query payloads', 'Research budget allocation'],
      duration: '< 2 seconds',
      substeps: [
        'Validate the prospect has at least a name and website URL; if either is missing, return research_insufficient.',
        'Select default source mix: company website, news (z-ai web_search), Exa semantic, RSS feeds, social (Twitter/X), funding databases (Crunchbase if configured).',
        'Generate query variations for news search: "{{company}} news", "{{company}} announcement", "{{company}} funding", "{{company}} {{industry}} trends".',
        'Allocate research budget across sources based on prospect priority (high-value prospects get more depth; low-value prospects get the 5-source minimum).',
        'Build per-source query payloads (some sources use natural language, others use keywords, some use domain filters).',
      ],
      errorHandling: 'On planning failure (rare), fall back to a minimal source mix of website + news.',
      retryStrategy: 'No retry — planning is deterministic.',
    },
    {
      stage: 'Website Reading & Extraction',
      inputs: ['Company website URL', 'Subpage list (/about, /products, /team, /press, /news, /careers)'],
      outputs: ['Full page content (up to 5000 chars)', 'Structured extraction (mission, products, team, tech signals)'],
      duration: '3–8 seconds',
      substeps: [
        'Fetch homepage via z-ai page_reader; capture up to 5000 chars of cleaned text content.',
        'If homepage content < 800 chars, follow internal links to high-value subpages (/about, /products, /team, /press, /news, /careers).',
        'Extract structured fields: mission_statement, product_lines (list), pricing_tiers (if visible), team_bios (executives only), customer_logos, tech_signals (from HTML/script tags).',
        'Tag each extraction with source_url and access_timestamp for provenance.',
        'Detect page language; if non-English, note language for downstream synthesis (LLM handles multi-lingual content natively).',
      ],
      errorHandling: 'On page_reader failure (timeout, 4xx, 5xx), log the failure and continue with other sources. Website reading is one source among 5+; a single failure does not block the pipeline.',
      retryStrategy: '2 retries with 1s backoff on transient failures (timeout, 5xx). No retry on 4xx (page does not exist).',
    },
    {
      stage: 'News & Media Search',
      inputs: ['Company name', 'Industry keywords', 'Query variations'],
      outputs: ['Recent news articles (90-day window)', 'Trigger events', 'Announcements'],
      duration: '5–15 seconds',
      substeps: [
        'Dispatch keyword search via z-ai web_search with 4+ query variations in parallel.',
        'Dispatch semantic search via Exa with natural-language query ("recent news about {{company}} in {{industry}}").',
        'Filter results to last 90 days; older results are tagged as "background" not "trigger".',
        'Extract trigger events from news: funding rounds, executive hires, product launches, M&A, regulatory, earnings.',
        'Score each trigger on the 4-factor relevance model: recency, magnitude, ICP_fit, actionability.',
      ],
      errorHandling: 'If both z-ai web_search and Exa return 0 results for the 90-day window, extend to 180 days and flag insights as "stale_context".',
      retryStrategy: 'Per-source: 3 retries with exponential backoff on transient failures.',
    },
    {
      stage: 'Competitive Analysis',
      inputs: ['Company name', 'Industry', 'Website extraction'],
      outputs: ['Top 5 competitors', 'Positioning analysis', 'Differentiation opportunities'],
      duration: '5–10 seconds',
      substeps: [
        'Search "{{company}} competitors", "{{company}} alternatives", "best {{industry}} tools 2026" to identify competing companies.',
        'Cross-reference competitor lists across multiple sources to ensure accuracy; competitors mentioned by 2+ sources are kept.',
        'For each competitor, fetch one-sentence differentiation (from comparison articles or competitor websites), funding stage (Crunchbase), and last notable news.',
        'Position the prospect relative to competitors: leader, challenger, disruptor, or niche player.',
        'Identify differentiation opportunities — angles where the prospect\'s offering or situation creates an opening for your pitch.',
      ],
      errorHandling: 'If fewer than 5 competitors are found, log the gap and proceed with the available list. Do not fabricate competitors.',
      retryStrategy: '2 retries on search failures; if still < 5 competitors, accept partial results.',
    },
    {
      stage: 'Trigger Event Detection & Scoring',
      inputs: ['News search results', 'Funding database (Crunchbase)', 'RSS feed items', 'Social signals'],
      outputs: ['Scored trigger events (top 3 flagged)', 'Trigger timeline (90-day window)'],
      duration: '2–5 seconds',
      substeps: [
        'Aggregate trigger events from all sources: news, RSS, funding databases, social signals.',
        'Deduplicate triggers across sources (same event reported by multiple outlets counts once).',
        'Score each trigger on 4-factor relevance model: recency (0–1), magnitude (0–1), ICP_fit (0–1), actionability (0–1).',
        'Drop triggers with relevance < 0.3.',
        'Flag the top 3 triggers by relevance for use in outreach talking points.',
      ],
      errorHandling: 'If no triggers detected in 90-day window, extend to 180 days and flag as "low_trigger_context". Insights will rely more on competitive and strategic angles.',
      retryStrategy: 'No retry — scoring is deterministic given the inputs.',
    },
    {
      stage: 'Insight Synthesis & Talking Points',
      inputs: ['Website extraction', 'News & triggers', 'Competitor analysis', 'Industry trends'],
      outputs: ['3–5 strategic insights', '2–3 outreach talking points', 'Confidence scores per insight'],
      duration: '3–8 seconds',
      substeps: [
        'Pass all research data to the GLM-4.6v-flash model with the structured synthesis prompt.',
        'Generate 3–5 strategic insights, each with: insight_text, source_url, confidence (0.0–1.0), category, talking_point.',
        'Rank insights by actionability (confidence × ICP_fit × recency); most actionable first.',
        'Convert top 2–3 insights into outreach talking points following the "Saw {{fact}} — {{bridge}} — {{hook}}" pattern.',
        'Run post-condition checks: 3–5 insights present, every insight has a source URL, source diversity ≥ 5 distinct domains.',
      ],
      errorHandling: 'If LLM returns < 3 or > 5 insights, retry with patched prompt emphasizing the count constraint (max 2 retries).',
      retryStrategy: '2 retries with patched prompt and reduced temperature (0.5 → 0.3 → 0.1). Persistent failure escalates to orchestrator.',
    },
  ],

  knowledgeBase: [
    {
      title: 'Deep Research & Intelligence SOP',
      category: 'SOP',
      summary:
        'Defines the complete research workflow: source planning, website reading, news search, competitive analysis, trigger event detection, and insight synthesis.',
      sections: 14,
      owner: 'Growth Intelligence',
      lastReviewed: '2026-09-04',
      version: '3.2.0',
      sectionList: [
        { title: '1. Intake & Validation', description: 'Required inputs (company name, website, industry) and validation rules for research_insufficient early-exit.' },
        { title: '2. Source Planning', description: 'Default source mix, query variation generation, and budget allocation by prospect priority.' },
        { title: '3. Website Reading Protocol', description: 'page_reader invocation, subpage selection, character budget (5000), and extraction field list.' },
        { title: '4. News Search Strategy', description: 'z-ai web_search and Exa parallel dispatch, 90-day window, query variation templates.' },
        { title: '5. Competitive Analysis Method', description: 'Competitor identification via comparison pages, landscape articles, and "alternative to" queries.' },
        { title: '6. Trigger Event Taxonomy', description: 'The 6 trigger types (funding, hires, launches, M&A, regulatory, earnings) and their definitions.' },
        { title: '7. Trigger Scoring Model', description: 'The 4-factor relevance model: recency, magnitude, ICP_fit, actionability.' },
        { title: '8. Insight Synthesis Prompt', description: 'The exact LLM prompt for synthesis, including count constraint (3–5) and required fields per insight.' },
        { title: '9. Talking Point Pattern', description: 'The "Saw {{fact}} — {{bridge}} — {{hook}}" template and tone guidelines.' },
        { title: '10. Confidence Scoring', description: 'How confidence (0.0–1.0) is assigned: source trust tier × corroboration × recency.' },
        { title: '11. Source Diversity Enforcement', description: 'The 5-source minimum, category substitution rules, and pre-output check.' },
        { title: '12. Output Schema', description: 'The research_brief JSON structure with all required and optional fields.' },
        { title: '13. Event Emission', description: 'The research.completed and research.trigger_detected event payloads and subscribers.' },
        { title: '14. Quality Spot-Checks', description: 'Weekly spot-check protocol: 10 random briefs reviewed for source accuracy and insight relevance.' },
      ],
    },
    {
      title: 'Research Source Failure Runbook',
      category: 'Runbook',
      summary:
        'Handles website reading failures, news API outages, RSS feed staleness, and competitive intelligence gaps with fallback procedures.',
      sections: 13,
      owner: 'Site Reliability',
      lastReviewed: '2026-09-01',
      version: '2.5.0',
      sectionList: [
        { title: '1. page_reader Timeout', description: 'Detection via 15s timeout; fallback to cached website content if available, else skip website source.' },
        { title: '2. page_reader 4xx (Page Not Found)', description: 'Log the URL, attempt alternate subpages (/about, /contact), continue with other sources.' },
        { title: '3. page_reader 5xx (Server Error)', description: '2 retries with 1s backoff; persistent failure logs the source as unavailable.' },
        { title: '4. z-ai web_search Outage', description: 'Detection via 5xx rate; switch to Exa as primary search source.' },
        { title: '5. Exa Rate Limit (429)', description: 'Token bucket halved for 5 minutes; persistent 429s disable channel for 15 minutes.' },
        { title: '6. Exa API Key Invalid', description: 'Detection via 401; user notification; channel disabled until key refreshed.' },
        { title: '7. RSS Feed 404 (Disappeared)', description: 'Disable feed after 3 consecutive 404s; remove from prospect subscription list.' },
        { title: '8. RSS Feed Malformed XML', description: 'Skip the malformed item; log for review; do not fail the entire feed.' },
        { title: '9. Crunchbase API Outage', description: 'Fall back to news-based funding detection (less reliable but functional).' },
        { title: '10. LinkedIn Company Page Unavailable', description: 'Skip LinkedIn source; rely on website team page and news for executive signals.' },
        { title: '11. LLM Synthesis Malformed JSON', description: '2 retries with patched prompt + reduced temperature; persistent failure escalates.' },
        { title: '12. Source Diversity Below 5', description: 'Trigger additional source searches to reach the 5-source floor; if impossible, flag research_insufficient.' },
        { title: '13. Cascading Source Failure', description: 'If 4+ sources fail simultaneously, mark prospect as research_insufficient and notify orchestrator.' },
      ],
    },
    {
      title: 'Competitive Intelligence Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for competitive research including competitor identification, positioning analysis, differentiation mapping, and outreach angle selection.',
      sections: 12,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-28',
      version: '1.9.0',
      sectionList: [
        { title: '1. Competitor Identification Methods', description: 'Three parallel methods: comparison pages, landscape articles, "alternative to" queries.' },
        { title: '2. Competitor Record Schema', description: 'Required fields: name, website, differentiation, funding stage, employee count, last news.' },
        { title: '3. Positioning Archetypes', description: 'The four archetypes (leader, challenger, disruptor, niche) and how to classify prospects.' },
        { title: '4. Differentiation Opportunity Detection', description: 'How to spot angles where the prospect\'s situation creates an opening for your pitch.' },
        { title: '5. Competitor Pricing Intelligence', description: 'How to capture publicly visible competitor pricing and use it for value framing.' },
        { title: '6. Tech Stack Comparison', description: 'How to compare prospect and competitor tech stacks to inform integration angles.' },
        { title: '7. Executive Cross-Pollination', description: 'Detecting when prospect and competitor share former executives — a relationship angle.' },
        { title: '8. Recent Competitor News Integration', description: 'How competitor news (funding, launches, struggles) creates outreach timing.' },
        { title: '9. Competitor-as-Pain-Point Framing', description: 'When and how to reference competitor struggles without sounding negative.' },
        { title: '10. Multi-Competitor Landscapes', description: 'Handling prospects with 20+ competitors (pick top 5 by relevance, not by size).' },
        { title: '11. Niche Player Strategy', description: 'How to research prospects in niches with few apparent competitors.' },
        { title: '12. Outreach Angle Selection', description: 'Mapping competitive positioning to outreach angle (leader → partnership; challenger → differentiation; disruptor → scaling; niche → specialization).' },
      ],
    },
    {
      title: 'Research Sources & Methodology Reference',
      category: 'Reference',
      summary:
        'Complete catalog of research sources (17+ channels), data extraction methods, trust-tier classification, and quality benchmarks.',
      sections: 14,
      owner: 'Growth Intelligence',
      lastReviewed: '2026-08-25',
      version: '4.1.0',
      sectionList: [
        { title: '1. Source Trust Tiers', description: 'Primary (official, government, SEC), secondary (reputable news, analyst), tertiary (blogs, forums) — citation rules per tier.' },
        { title: '2. Company Website', description: 'The single most authoritative primary source; always consulted first.' },
        { title: '3. z-ai web_search', description: 'Keyword-based news search; query variation templates and result parsing.' },
        { title: '4. Exa Semantic Search', description: 'Neural search for meaning-based discovery; query phrasing and score thresholds.' },
        { title: '5. RSS Feed Catalog', description: 'The 200+ feed registry organized by industry vertical; subscription rules.' },
        { title: '6. Crunchbase API', description: 'Funding history, investor data, company profiles; rate limits and fallbacks.' },
        { title: '7. SEC EDGAR', description: 'For public companies: 10-K, 10-Q, 8-K filing extraction and material event detection.' },
        { title: '8. LinkedIn Company Page', description: 'Team size, executive list, recent posts; auth requirements and data freshness.' },
        { title: '9. Twitter/X', description: 'Real-time announcements, executive commentary; query patterns and rate limits.' },
        { title: '10. Press Release Wires', description: 'PR Newswire, Business Wire, GlobeNewswire — official announcement source.' },
        { title: '11. Analyst Reports (Gartner, Forrester)', description: 'Tertiary but high-trust; used for industry trend context, not specific claims.' },
        { title: '12. Industry Publications', description: 'Vertical-specific publications and their RSS feeds for trend monitoring.' },
        { title: '13. Conference & Event Listings', description: 'Detecting prospect speaking engagements — a relationship angle.' },
        { title: '14. Source Diversity Calculation', description: 'How distinct domains are counted and the 5-source minimum is enforced.' },
      ],
    },
    {
      title: 'Sage Onboarding & Research Training',
      category: 'Training',
      summary:
        'Comprehensive onboarding for the Sage agent covering research methodology, source evaluation, insight quality standards, and citation discipline.',
      sections: 14,
      owner: 'Agent Operations',
      lastReviewed: '2026-07-30',
      version: '2.1.0',
      sectionList: [
        { title: '1. Welcome & Mission', description: 'Sage\'s mission: produce 3–5 strategic insights per prospect that earn replies in outreach.' },
        { title: '2. Qualitative vs Quantitative', description: 'The Forge/Sage boundary: Forge fills structured fields; Sage extracts WHY, not WHAT.' },
        { title: '3. Source Trust Hierarchy', description: 'Primary > secondary > tertiary — and the corroboration rule for tertiary sources.' },
        { title: '4. Website Reading Workshop', description: 'Hands-on practice reading 5 sample company websites and extracting structured fields.' },
        { title: '5. Trigger Event Spotting', description: 'Practice identifying the 6 trigger types in news articles and scoring relevance.' },
        { title: '6. Competitor Identification', description: 'The 3-method approach: comparison pages, landscape articles, "alternative to" queries.' },
        { title: '7. Insight Synthesis Practice', description: 'Practice turning research data into 3–5 ranked insights with source URLs.' },
        { title: '8. Talking Point Authoring', description: 'Practice writing "Saw {{fact}} — {{bridge}} — {{hook}}" talking points.' },
        { title: '9. Citation Discipline', description: 'Why every insight needs a source URL — and what happens when one is missing.' },
        { title: '10. Hallucination Detection', description: 'How to spot LLM-fabricated URLs and unverifiable claims in your own output.' },
        { title: '11. Confidence Calibration', description: 'Practice assigning confidence scores: source trust × corroboration × recency.' },
        { title: '12. Common Failure Modes', description: 'Walkthroughs of 5 representative research failures and recoveries.' },
        { title: '13. Certification Exam', description: '25-question exam covering source trust, trigger scoring, insight synthesis, and citation.' },
        { title: '14. Continuing Education', description: 'Monthly brown-bag on new sources, prompt tuning, and industry-vertical nuances.' },
      ],
    },
    {
      title: 'Trigger Event Detection Playbook',
      category: 'Playbook',
      summary:
        'Comprehensive guide to the 6 trigger event types: definitions, detection signals, relevance scoring, and outreach angle mapping.',
      sections: 12,
      owner: 'Growth Intelligence',
      lastReviewed: '2026-08-15',
      version: '1.6.0',
      sectionList: [
        { title: '1. Funding Triggers', description: 'Series A–D+, seed, debt, IPO; signals budget availability and growth phase; strongest outreach timing.' },
        { title: '2. Executive Hire Triggers', description: 'New CTO/VP Engineering signals dev-tools buying intent; new CFO signals finance-tools intent; new VP Sales signals sales-tools intent.' },
        { title: '3. Product Launch Triggers', description: 'New product line, major release, feature expansion; signals market direction and integration opportunities.' },
        { title: '4. M&A Triggers', description: 'Acquired (integration pain points), acquiring (scale challenges), merged (culture/process alignment).' },
        { title: '5. Regulatory Triggers', description: 'New compliance deadlines, regulatory investigations, industry rule changes — timing hooks for compliance-related offerings.' },
        { title: '6. Earnings Triggers', description: 'Quarterly results, guidance changes, analyst call commentary — signals for public-company prospects.' },
        { title: '7. Layoff/Restructuring Triggers', description: 'Negative signals but still actionable — may indicate budget pressure or strategic pivot.' },
        { title: '8. Conference & Speaking Triggers', description: 'Prospect speaking at an industry event — relationship and topic-based outreach angle.' },
        { title: '9. Partnership Announcement Triggers', description: 'New strategic partnerships signal direction and integration opportunities.' },
        { title: '10. Office/Expansion Triggers', description: 'New office openings, geographic expansion — signals growth and localization needs.' },
        { title: '11. Trigger Scoring Calibration', description: 'How to tune the 4-factor relevance model based on conversion-rate feedback from outreach.' },
        { title: '12. Trigger-to-Outreach-Angle Mapping', description: 'Each trigger type maps to a recommended outreach angle (funding → scaling hook; hire → role-specific hook; launch → integration hook).' },
      ],
    },
  ],

  tools: [
    {
      name: 'z-ai page_reader',
      type: 'SDK',
      description:
        'Reads full company website content (up to 5000 chars per page) for deep analysis. The primary tool for website extraction — pulls mission, products, team bios, pricing, and tech signals from the prospect\'s own pages.',
      status: 'connected',
      endpoint: 'z-ai-web-dev-sdk.page_reader',
      authMethod: 'API key (ZAI_API_KEY)',
      rateLimit: '100 req/min',
      config: [
        { key: 'max_chars', value: '5000' },
        { key: 'timeout', value: '15s' },
        { key: 'extract_subpages', value: 'true' },
        { key: 'clean_html', value: 'true' },
      ],
      schemaExample:
        'INPUT: {"url":"https://acme.com/about"} → OUTPUT: {"url":"https://acme.com/about","title":"About Acme","content":"Acme is a leading provider of...","extracted_at":"2026-09-08T14:23:00Z","char_count":4821,"language":"en"}',
      failureMode: 'On 15s timeout, fall back to cached content if available, else skip website source and continue.',
    },
    {
      name: 'z-ai web_search',
      type: 'SDK',
      description:
        'Keyword-based news search for recent company announcements, trigger events, and industry trends. Used in parallel with Exa for maximum coverage.',
      status: 'connected',
      endpoint: 'z-ai-web-dev-sdk.web_search',
      authMethod: 'API key (ZAI_API_KEY)',
      rateLimit: '100 req/min',
      config: [
        { key: 'parallel', value: 'true' },
        { key: 'variations', value: '4' },
        { key: 'timeout', value: '10s' },
        { key: 'date_filter', value: 'last_90d' },
      ],
      schemaExample:
        'INPUT: {"query":"Acme Series B funding","date_range":"90d"} → OUTPUT: [{"title":"Acme raises $40M Series B","url":"https://techcrunch.com/acme-series-b","snippet":"Acme announced...","published":"2026-08-15"}]',
      failureMode: 'On 429, backs off to half rate for 5 minutes; persistent failure falls back to Exa as primary search.',
    },
    {
      name: 'Exa Semantic Search',
      type: 'API',
      description:
        'Neural search engine for meaning-based news and article discovery. Finds coverage that keyword search misses — e.g. "recent strategic moves by Acme" finds articles that don\'t use those exact words but match the concept.',
      status: 'available',
      endpoint: 'https://api.exa.ai/search',
      authMethod: 'API key (EXA_API_KEY)',
      rateLimit: '100 req/min (free tier), 1000 req/min (paid)',
      config: [
        { key: 'use_autoprompt', value: 'true' },
        { key: 'num_results', value: '10' },
        { key: 'start_published_date', value: '2026-06-01' },
        { key: 'category', value: 'news' },
      ],
      schemaExample:
        'INPUT: {"query":"Acme recent strategic announcements","num_results":10,"start_published_date":"2026-06-01"} → OUTPUT: [{"title":"Acme expands to EMEA","url":"https://exa.ai/r/123","score":0.91,"publishedDate":"2026-08-20"}]',
      failureMode: 'On 429, token bucket halved for 5 minutes; persistent 429s disable channel for 15 min.',
    },
    {
      name: 'RSS Feed Reader',
      type: 'API',
      description:
        'Subscribes to and monitors RSS feeds from industry publications, company blogs, and news sources for real-time intelligence. Polls every 15 minutes for active campaigns.',
      status: 'connected',
      endpoint: 'internal://rss_reader',
      authMethod: 'none',
      rateLimit: '1000 feeds/hour',
      config: [
        { key: 'poll_interval_active', value: '15min' },
        { key: 'poll_interval_dormant', value: '60min' },
        { key: 'parser', value: 'rss-parser (Node)' },
        { key: 'feed_registry_size', value: '200+' },
        { key: 'cache_ttl', value: '1h' },
      ],
      schemaExample:
        'INPUT: {"feed_url":"https://acme.com/blog/feed.xml"} → OUTPUT: [{"title":"Acme launches new platform","link":"https://acme.com/blog/new-platform","pubDate":"2026-09-01T10:00:00Z","content":"We are excited to announce..."}]',
      failureMode: 'Malformed feeds are skipped after 3 consecutive failures; logged for review.',
    },
    {
      name: 'LinkedIn Company Page',
      type: 'API',
      description:
        'Reads LinkedIn company pages for team size, executive list, recent posts, and funding stage. The richest single source for B2B prospect intelligence.',
      status: 'needs-setup',
      endpoint: 'https://api.linkedin.com/v2/companies',
      authMethod: 'OAuth2 (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET)',
      rateLimit: '500 req/day (basic), 5000 req/day (Sales Navigator)',
      config: [
        { key: 'oauth_flow', value: 'authorization_code' },
        { key: 'scope', value: 'r_organization_social,r_basicprofile' },
        { key: 'fields', value: 'name,description,employee_count,industries,funding_data' },
        { key: 'timeout', value: '10s' },
      ],
      schemaExample:
        'INPUT: {"company_url":"https://linkedin.com/company/acme"} → OUTPUT: {"name":"Acme","employee_count":450,"industries":["Software"],"funding_stage":"Series B","recent_posts":[...]}',
      failureMode: 'Cookie expiry triggers re-auth flow; user notified. Channel skipped until auth restored.',
    },
    {
      name: 'Crunchbase API',
      type: 'API',
      description:
        'Funding history, investor data, and company profiles. The authoritative source for funding-round triggers — when Crunchbase shows a new round, it\'s reliable.',
      status: 'available',
      endpoint: 'https://api.crunchbase.com/api/v4/entities/organizations',
      authMethod: 'API key (CRUNCHBASE_API_KEY)',
      rateLimit: '300 req/min (premium)',
      config: [
        { key: 'card_fields', value: 'funding_rounds,investors,acquisitions,category' },
        { key: 'timeout', value: '8s' },
        { key: 'cache_ttl', value: '24h' },
      ],
      schemaExample:
        'INPUT: {"permalink":"acme","card_fields":"funding_rounds"} → OUTPUT: {"funding_rounds":[{"type":"series_b","amount":40000000,"announced_on":"2026-08-15","investors":["Sequoia","Andreessen Horowitz"]}]}',
      failureMode: 'On 401, key rotation needed; channel disabled. Fall back to news-based funding detection.',
    },
    {
      name: 'Twitter/X Search API',
      type: 'API',
      description:
        'Real-time tweet search for company announcements, executive commentary, and industry chatter. Catches signals before they appear in news outlets.',
      status: 'available',
      endpoint: 'https://api.twitter.com/2/tweets/search/recent',
      authMethod: 'Bearer token (TWITTER_BEARER_TOKEN)',
      rateLimit: '450 req/15min (basic)',
      config: [
        { key: 'max_results', value: '100' },
        { key: 'tweet_fields', value: 'created_at,author_id,public_metrics,entities' },
        { key: 'query_template', value: 'from:{{company_handle}} OR "{{company_name}}" (announcement OR launch OR hire)' },
      ],
      schemaExample:
        'INPUT: {"query":"from:acme OR Acme (announcement OR launch)","max_results":100} → OUTPUT: [{"id":"123","text":"Excited to announce our Series B...","created_at":"2026-08-15T14:00:00Z","author_id":"789"}]',
      failureMode: 'On 429, channel disabled for 15 min; user notified.',
    },
    {
      name: 'SEC EDGAR API',
      type: 'API',
      description:
        'Public company filings: 10-K (annual), 10-Q (quarterly), 8-K (material events). The authoritative source for public-company triggers — earnings, M&A, executive changes.',
      status: 'connected',
      endpoint: 'https://data.sec.gov/submissions/CIK{{cik}}.json',
      authMethod: 'none (public data, requires descriptive User-Agent)',
      rateLimit: '10 req/s (SEC fair-use policy)',
      config: [
        { key: 'user_agent', value: 'LeadReach Bot contact@leadreach.com' },
        { key: 'filings_filter', value: '10-K,10-Q,8-K' },
        { key: 'lookback_days', value: '90' },
        { key: 'timeout', value: '10s' },
      ],
      schemaExample:
        'INPUT: {"cik":"0001571949","filings":"10-K,10-Q,8-K","lookback":"90d"} → OUTPUT: {"recent":{"form":["8-K"],"filingDate":["2026-08-20"],"primaryDocument":["acme-8k.htm"]}}',
      failureMode: 'On persistent 5xx, switch to news-based detection for public-company triggers.',
    },
    {
      name: 'BuiltWith API',
      type: 'API',
      description:
        'Tech stack lookup — returns the technologies detected on a company website. Reveals CMS, analytics, frameworks, hosting, and marketing tools already in use.',
      status: 'available',
      endpoint: 'https://api.builtwith.com/v12/api.json',
      authMethod: 'API key (BUILTWITH_API_KEY)',
      rateLimit: '100 req/day (free), 10000 req/day (paid)',
      config: [
        { key: 'lookup_type', value: 'live' },
        { key: 'tech_categories', value: 'all' },
        { key: 'timeout', value: '8s' },
      ],
      schemaExample:
        'INPUT: {"domain":"acme.com","lookup_type":"live"} → OUTPUT: {"technologies":[{"name":"React","category":"javascript-libraries","first_detected":"2024-03-15"},{"name":"HubSpot","category":"marketing","first_detected":"2023-11-20"}]}',
      failureMode: 'On quota exhaustion, channel disabled until next day; fall back to HTML-based tech signal detection.',
    },
    {
      name: 'GLM-4.6v-flash (LLM Synthesis)',
      type: 'SDK',
      description:
        'The LLM that synthesizes all research data into 3–5 strategic insights and 2–3 outreach talking points. Tuned with temperature 0.5 for balance between creativity and accuracy.',
      status: 'connected',
      endpoint: 'z-ai-web-dev-sdk.chat.completions',
      authMethod: 'API key (ZAI_API_KEY)',
      rateLimit: '60 req/min',
      config: [
        { key: 'model', value: 'glm-4.6v-flash' },
        { key: 'temperature', value: '0.5' },
        { key: 'max_tokens', value: '4096' },
        { key: 'response_format', value: 'json_object' },
        { key: 'timeout', value: '20s' },
      ],
      schemaExample:
        'INPUT: {"messages":[{"role":"system","content":"You are SAGE..."},{"role":"user","content":"Synthesize research: {website,news,competitors,triggers}"}],"temperature":0.5} → OUTPUT: {"insights":[{"insight_text":"Acme just raised Series B...","source_url":"...","confidence":0.92,"category":"trigger","talking_point":"Saw your Series B..."}]}',
      failureMode: 'On malformed JSON output, 2 retries with patched prompt + reduced temperature (0.5 → 0.3 → 0.1).',
    },
  ],

  metrics: [
    {
      label: 'Research Depth',
      value: '5000',
      unit: 'chars/lead',
      benchmark: 'Target: > 3000',
      trend30d: '+200 chars',
      description: 'Average characters of website content read per prospect (via page_reader).',
    },
    {
      label: 'Strategic Insights per Lead',
      value: '3-5',
      unit: 'insights',
      benchmark: 'Target: 4 (middle of range)',
      trend30d: 'stable',
      description: 'Number of strategic insights produced per prospect. Calibrated to 3–5: fewer leaves Bard without material; more dilutes focus.',
    },
    {
      label: 'Research Latency (p50)',
      value: '24',
      unit: 'seconds',
      benchmark: 'Target: < 60s',
      trend30d: '-3s',
      description: 'Median wall-clock time from research request to research_brief emitted.',
    },
    {
      label: 'Research Latency (p99)',
      value: '52',
      unit: 'seconds',
      benchmark: 'Target: < 90s',
      trend30d: '-4s',
      description: '99th percentile research latency; reflects slowest 1% of prospects (multi-subpage reads, slow news sources).',
    },
    {
      label: 'Trigger Event Detection Window',
      value: '90',
      unit: 'days',
      benchmark: 'Target: > 30 days',
      trend30d: 'stable',
      description: 'Lookback window for trigger events. 90 days balances recency with coverage; older events are flagged as background.',
    },
    {
      label: 'Source Diversity',
      value: '5+',
      unit: 'sources/lead',
      benchmark: 'Target: ≥ 5 (enforced)',
      trend30d: '+0.4 sources',
      description: 'Average distinct source domains per prospect. Enforced minimum of 5 to prevent insight tunneling.',
    },
    {
      label: 'Insight Adoption Rate (downstream)',
      value: '68',
      unit: '%',
      benchmark: 'Target: > 60%',
      trend30d: '+4.2%',
      description: 'Percentage of Sage insights used by Bard (Outreach Composer) in actual sent messages. Measures insight actionability.',
    },
    {
      label: 'Trigger Hit Rate',
      value: '74',
      unit: '%',
      benchmark: 'Target: > 65%',
      trend30d: '+2.1%',
      description: 'Percentage of detected triggers judged relevant by downstream review. Measures trigger scoring accuracy.',
    },
    {
      label: 'Competitor Coverage',
      value: '4.8',
      unit: 'competitors/lead',
      benchmark: 'Target: ≥ 4 (of 5)',
      trend30d: '+0.2',
      description: 'Average competitors identified per prospect (out of 5 target). Below 4 triggers a competitive-gap flag.',
    },
    {
      label: 'Website Read Success Rate',
      value: '94.6',
      unit: '%',
      benchmark: 'Target: > 90%',
      trend30d: '+0.8%',
      description: 'Percentage of prospects whose website was successfully read (non-timeout, non-4xx).',
    },
    {
      label: 'Insight Citation Rate',
      value: '100',
      unit: '%',
      benchmark: 'Target: 100% (enforced)',
      trend30d: 'stable',
      description: 'Percentage of insights with a verifiable source URL. Enforced via post-condition check; fabrications rejected.',
    },
    {
      label: 'Token Cost per Lead',
      value: '$0.034',
      unit: 'USD',
      benchmark: 'Target: < $0.05',
      trend30d: '-$0.004',
      description: 'Average LLM + API cost incurred per prospect researched. Higher than Scout/Forge due to deeper synthesis.',
    },
  ],

  config: {
    model: 'glm-4.6v-flash',
    temperature: 0.5,
    maxTokens: 4096,
    scheduleType: 'always_on',
    maxConcurrentTasks: 3,
    priority: 'normal',
    reasoningEffort: 'medium',
    topP: 0.9,
    presencePenalty: 0,
    frequencyPenalty: 0,
    stopSequences: [],
    responseFormat: 'json_schema',
    jsonSchema:
      '{"type":"object","properties":{"prospect_id":{"type":"string"},"sources_consulted":{"type":"array","items":{"type":"object","properties":{"url":{"type":"string"},"accessed_at":{"type":"string"},"category":{"type":"string"}}}},"trigger_events":{"type":"array","items":{"type":"object","properties":{"event_type":{"type":"string"},"description":{"type":"string"},"source_url":{"type":"string"},"date":{"type":"string"},"relevance":{"type":"number"}}}},"competitors":{"type":"array","maxItems":5,"items":{"type":"object","properties":{"name":{"type":"string"},"url":{"type":"string"},"differentiation":{"type":"string"},"funding_stage":{"type":"string"}}}},"strategic_insights":{"type":"array","minItems":3,"maxItems":5,"items":{"type":"object","properties":{"insight_text":{"type":"string"},"source_url":{"type":"string"},"confidence":{"type":"number"},"category":{"type":"string"},"talking_point":{"type":"string"}}}},"meta":{"type":"object","properties":{"source_count":{"type":"integer"},"research_duration_s":{"type":"number"},"partial":{"type":"boolean"}}}}}',
    timeout: '60s',
    retryPolicy: '3 retries with exponential backoff; LLM synthesis retries use patched prompt + reduced temperature',
    fallbackModel: 'glm-4.5-air',
    systemPromptSummary:
      'You are SAGE, the Web Research Agent. You perform deep qualitative research on companies — reading websites, monitoring news, analyzing competitors, detecting trigger events — and synthesize 3-5 strategic insights per prospect that power hyper-personalized outreach. Every insight has a source URL and confidence score; no fabrication is tolerated.',
    systemPromptFull: `You are SAGE, the Web Research Agent of the LeadReach AI platform. Your mission is to perform deep qualitative research that goes far beyond the structured enrichment Forge produces — you read full company websites, monitor industry news, watch competitor moves, track funding announcements, identify strategic partnerships, and synthesize 3–5 strategic insights per prospect that power genuinely personalized outreach. Without Sage, LeadReach's outreach messages would be mail-merged templates; with Sage, they feel hand-researched by a senior analyst who reads the prospect's website cover-to-cover and follows their industry daily.

# IDENTITY & AUTHORITY
You are the qualitative intelligence layer of the pipeline. While Forge (Data Enrichment) fills structured fields — revenue, employee count, CEO name, headquarters address — you extract the WHY behind those numbers: why this company is worth approaching now, what talking point will land, what trigger event makes this the right moment, what competitive angle differentiates the prospect's offering from the field. You have authority over:

- Which sources to consult for each prospect (website, news, RSS, social, funding databases, analyst reports).
- How to prioritize sources when budget or time is constrained.
- How many strategic insights to produce (3–5; never fewer than 3, never more than 5).
- Confidence scoring on each insight (0.0–1.0) based on source trust, corroboration, and recency.
- Whether to flag a prospect as "research_insufficient" when sources are too thin to support 3 quality insights.

You do NOT have authority over:

- Lead scoring or tiering — that is Judge's responsibility; you surface data, Judge decides.
- Outreach message composition — that is Bard's; you produce talking points, not full messages.
- Structured field extraction (revenue, employees, headquarters) — that is Forge's; you reference Forge's data but do not re-extract it.
- Whether to mark a lead disqualified — surface the research; the qualification decision belongs to Judge and the human operator.

When you encounter a situation not covered by your decision framework — a deeply ambiguous source, a competitor conflict of interest, or a research target with zero web footprint — escalate to the orchestrator via the task.escalated event. Do not invent data to fill the gap. Fabrication is the single most serious failure mode for an intelligence agent; one fabricated source URL poisons every downstream decision.

# CORE OPERATING LOOP

1. INTAKE — Receive a research request for a single prospect. Required inputs: company name, website URL, industry, ICP context (your value proposition and target buyer), optional focus areas (competitor analysis, trigger events, tech stack, partnership angles). Validate the prospect has at least a website URL and a name; if either is missing, return research_insufficient immediately with a clear reason.

2. SOURCE PLANNING — Select sources based on the prospect profile and focus areas. Default source mix: company website (via z-ai page_reader), recent news (via z-ai web_search), Exa semantic search for meaning-based news discovery, RSS feeds for real-time monitoring, social signals (Twitter/X, LinkedIn if available), funding databases (Crunchbase API if configured), SEC EDGAR for public companies. Target 5+ distinct source domains per prospect for source diversity. Reduce sources when budget is tight; expand when the prospect is high-value.

3. WEBSITE READING — Use z-ai page_reader to fetch up to 5000 characters of the prospect's homepage. If the homepage is thin (< 800 chars), also read /about, /products, /team, /press, /news, /careers (the most informative subpages). Extract: mission statement, product lines, pricing tiers (if visible), team bios (executives only), recent announcements, customer logos, technology signals (script tags, meta generators, framework hints). Tag each extraction with its source URL and access timestamp for provenance.

4. NEWS & MEDIA SEARCH — Search for the prospect in news sources using both keyword search (z-ai web_search) and semantic search (Exa). Look for the last 90 days first; extend to 180 days if the 90-day window is empty. Capture: funding announcements, executive hires, product launches, M&A activity, regulatory actions, analyst mentions, conference talks. Each trigger event gets a relevance score (0.0–1.0) computed from 4 factors: recency (newer = higher), magnitude (funding amount, hire seniority), ICP_fit (alignment with your value prop), actionability (how easily it can be referenced in outreach).

5. COMPETITIVE ANALYSIS — Identify the prospect's top 5 competitors using a combination of direct search ("{{company}} competitors", "{{company}} alternatives"), industry landscape articles, and analyst reports. For each competitor, capture: name, URL, differentiation (one sentence), funding stage (if available), employee count (if available), and last notable news item. Note the prospect's positioning relative to competitors — are they the leader, the challenger, the disruptor, or the niche player? This positioning drives the outreach angle.

6. TRIGGER EVENT SCORING — For each detected trigger event, compute the 4-factor relevance score: recency, magnitude, ICP_fit, actionability. Events with relevance < 0.3 are dropped as low-signal. The top 3 trigger events by relevance are flagged for use in outreach talking points. If no triggers meet the threshold in the 90-day window, extend to 180 days and flag the brief as "low_trigger_context" — insights will then lean more heavily on competitive and strategic angles.

7. INSIGHT SYNTHESIS — Synthesize all research into 3–5 strategic insights per prospect. Each insight follows the structure: {insight_text, source_url, confidence (0.0–1.0), category (trigger, competitive, strategic, operational), talking_point}. Insights are ranked: most actionable first. Actionability is computed as the product of confidence × ICP_fit × recency. Never produce fewer than 3 or more than 5; this range is calibrated against downstream outreach performance data — fewer than 3 leaves Bard without enough material; more than 5 dilutes focus and produces noise.

8. TALKING POINTS GENERATION — Convert the top 2–3 insights into outreach talking points. A talking point is a single sentence a sales rep could use to open a conversation: "Saw your Series B announcement last month — congrats. With 50 new engineers coming on board, scaling your observability stack is probably top of mind." Each talking point references a specific, verifiable fact drawn from a cited source URL. Talking points follow the pattern: "Saw {{specific_fact}} — {{bridge}} — {{value_prop_hook}}." Tune for tone: confident but not presumptuous, specific but not creepy. Avoid surveillance-sounding phrases ("I noticed you...") in favor of professional observations ("Saw the announcement...").

9. CONFIDENCE & CITATION — Every insight and talking point must include a source URL and a confidence score (0.0–1.0). Confidence is computed as: source_trust_tier (primary=1.0, secondary=0.7, tertiary=0.4) × corroboration_factor (1.0 if 2+ sources agree, 0.6 if single source) × recency_factor (1.0 if < 30 days, 0.8 if 30–90 days, 0.5 if 90–180 days). Confidence < 0.5 is flagged as low-confidence. The LLM never invents source URLs; if a source URL is missing or unverifiable, the insight is dropped rather than fabricated.

10. OUTPUT — Emit a structured research_brief object containing: prospect_id, sources_consulted (with URLs and access timestamps), trigger_events (with relevance scores and dates), competitors (top 5 with differentiation and positioning), strategic_insights (3–5 with confidence and categories), talking_points (2–3 derived from top insights), and a meta block (source_count, research_duration_s, partial flag). Persist to the lead's research_brief column. Emit research.completed for downstream agents — Bard consumes the talking points directly to compose outreach messages.

# DECISION FRAMEWORK
When deciding how to allocate research effort, apply the source-trust hierarchy: primary sources (company website, official press releases, SEC filings, government statistics) > secondary sources (reputable news outlets, analyst reports from Gartner/Forrester) > tertiary sources (blog posts, forum discussions, social media). Never cite a tertiary source as the sole basis for a strategic insight; always corroborate with at least one primary or secondary source.

When sources conflict, surface the conflict explicitly in the insight: "Source A reports Series B at $40M; Crunchbase reports Series B at $35M. Using Crunchbase as the more authoritative source for funding data." Never silently pick one version and discard the other — the conflict itself is information.

When time or budget is constrained, prioritize in this order: (1) website reading, (2) trigger events in last 90 days, (3) top 5 competitors, (4) industry trends, (5) RSS monitoring. The first three are non-negotiable for any prospect worth researching; the last two can be deferred without significant quality loss.

When the prospect is high-value (Judge has tiered them hot or super_hot), expand the source mix beyond the 5-source minimum: add conference talk transcripts, podcast appearances, executive LinkedIn posts, and patent filings. High-value prospects justify deeper investment.

# FAILURE MODES
Be aware of your own failure modes and design around them:

- Insight inflation: producing 7+ insights when 3–5 is the target. More is not better; the downstream composer can only use 2–3 talking points effectively. Excess insights are noise.
- Source tunneling: relying too heavily on a single source (e.g. only the company website). Always diversify across 5+ sources; the 5-source minimum exists to prevent this.
- Stale data: citing news older than 90 days without flagging it as stale. Always include the publication date in the insight, and flag any source older than 90 days as "background_context" rather than "trigger".
- Hallucinated citations: inventing URLs that look plausible but don't exist. Source URLs are verified by the post-condition check via a HEAD request; fabricated URLs cause the entire brief to be rejected.
- Generic insights: producing "this company is growing" without a specific, verifiable fact. Every insight must reference a specific data point — a funding amount, a hire name, a product launch date, a competitor name.
- Competitor inflation: listing 20+ competitors when 5 is the target. Pick the top 5 by relevance to the prospect's positioning, not by size or fame.

# AUDIT & EXPLAINABILITY
Every research_brief must be reconstructable. For each insight, the audit trail must include: the source URL, the timestamp the source was accessed, the exact text extracted from the source (quoted), and the LLM's reasoning chain from extraction to insight. A user must be able to ask "why did Sage say X about this company?" and receive a complete provenance chain from raw extraction through synthesis. There are no exceptions to this requirement — explainability is a non-negotiable property of an intelligence agent. The audit log is persisted alongside the research_brief and exposed via /api/agents/web-research/explain?prospect_id=<id>.

# FINAL GUARDRAILS
1. Never fabricate quotes, statistics, or source URLs. If a fact cannot be sourced, it cannot be in the brief. This is the single most important rule.
2. Always produce between 3 and 5 strategic insights — never fewer, never more. The count is calibrated; deviation degrades downstream performance.
3. Always include a source URL and confidence score for every insight. No exceptions.
4. Never use data older than 90 days without explicitly flagging it as stale background context.
5. Always diversify across 5+ distinct source domains per prospect. The 5-source floor is enforced by a post-condition check.
6. Always distinguish verified facts (extracted directly from primary sources) from inferences (synthesized by the LLM). Tag each insight with its category so Bard knows which to lean on.
7. Always emit research.completed within 60 seconds of task start. If exceeded, return partial results with a "research_partial" flag rather than failing the whole task.
8. Never include competitor confidential information obtained through questionable means — leaked documents, paywalled content accessed without authorization, or scraped personal data. Public sources only.
9. Always cite primary sources over secondary when both are available. The trust hierarchy is non-negotiable.
10. Always surface source conflicts explicitly; never silently pick one version of a fact over another.

You are SAGE. You read deeply, cite rigorously, and synthesize strategically. You do not improvise beyond your evidence. You escalate when sources are thin. You document every extraction. Your success is measured by the percentage of your insights that get used in outreach messages that earn replies, and you optimize relentlessly for that metric.`,
  },

  channels: ['Web', 'Exa Search', 'LinkedIn', 'Twitter/X', 'YouTube', 'Reddit', 'RSS Feeds', 'Crunchbase', 'SEC EDGAR', 'BuiltWith', 'Press Release Wires'],
  dependencies: ['orchestrator', 'prospect-discovery'],

  faqs: [
    {
      question: 'What makes Sage different from Forge (Data Enrichment)?',
      answer:
        'Forge fills structured fields (revenue, employee count, CEO name — quantitative data). Sage performs qualitative research — reading company websites, analyzing news, tracking competitors, and extracting strategic insights. Forge tells you "this company has 500 employees"; Sage tells you "this company just raised Series B and is hiring 50 engineers — perfect timing for your DevTools pitch." Forge is the data layer; Sage is the intelligence layer. Both run in parallel where possible, and Sage consumes Forge\'s structured fields as inputs to inform which qualitative angles to pursue.',
    },
    {
      question: 'How does Sage find trigger events?',
      answer:
        'Sage searches news articles, press releases, funding databases (Crunchbase), SEC filings (EDGAR for public companies), and social media for events in the last 90 days that create outreach timing opportunities. Common triggers: funding rounds, executive hires (especially CTO/VP Engineering for dev-tools, CFO for finance tools), product launches, M&A activity, regulatory changes, and earnings reports. Each trigger is scored on a 4-factor relevance model (recency, magnitude, ICP_fit, actionability) and the top 3 are flagged for use in outreach talking points.',
    },
    {
      question: 'Can Sage monitor prospects over time?',
      answer:
        'Yes — Sage subscribes to RSS feeds from industry publications and the prospect\'s own company blog/press feed for real-time monitoring. Active campaigns poll every 15 minutes; dormant leads poll every 60 minutes. When a new article or announcement is published that scores above the trigger-event threshold, Sage emits a research.trigger_detected event, which can trigger a re-scoring of the lead and notify the Outreach Composer (Bard) to craft a timely message referencing the news.',
    },
    {
      question: 'Why exactly 3-5 strategic insights per prospect? Why not 1 or 10?',
      answer:
        'The 3-5 range is calibrated against downstream outreach performance data. Fewer than 3 insights leaves the Outreach Composer without enough material to personalize across multiple touchpoints in a sequence. More than 5 dilutes focus — Bard can only effectively use 2-3 talking points per message, and excess insights become noise. The sweet spot is 3-5 high-quality insights, each with a source URL and confidence score, ranked by actionability.',
    },
    {
      question: 'How does Sage handle conflicting information from different sources?',
      answer:
        'When sources conflict (e.g. one outlet reports Series B at $40M, Crunchbase reports $35M), Sage surfaces the conflict explicitly in the insight rather than silently picking one. The brief notes: "Source A reports X; Crunchbase reports Y. Using Crunchbase as the more authoritative source for funding data." The trust hierarchy is: primary sources (company website, SEC filings) > secondary (reputable news, analyst reports) > tertiary (blogs, forums). When two sources of equal trust conflict, both are noted and the more conservative figure is used.',
    },
    {
      question: 'What happens when Sage cannot find enough sources for a prospect?',
      answer:
        'Sage enforces a 5-source minimum per prospect. If fewer than 5 distinct source domains are available (rare — typically only for very early-stage stealth startups), the brief is flagged as "research_insufficient" and the prospect is returned to the orchestrator with a recommendation: either defer research until more sources appear, or proceed with the partial brief but flag low confidence to downstream agents. Sage never fabricates sources to meet the 5-source floor.',
    },
    {
      question: 'How much does it cost to run Sage per prospect?',
      answer:
        'Average $0.034 per prospect, covering LLM synthesis calls (GLM-4.6v-flash) plus API calls to Exa, Crunchbase, BuiltWith, and the z-ai page_reader/web_search. Higher-value prospects (hot/super_hot tier) cost more because Sage expands the source mix (conference transcripts, podcasts, patent filings). The default budget cap is $0.05/prospect; over-budget research returns a confirmation prompt.',
    },
  ],

  // ────────────────────────────────────────────────────────────────────
  // PROMPT-LEVEL ARTIFACTS
  // ────────────────────────────────────────────────────────────────────

  userPromptTemplates: [
    {
      name: 'Standard deep research request',
      useCase: 'Orchestrator asks Sage to research a prospect after enrichment by Forge.',
      template: `Perform deep research on prospect {{prospectId}}.

Company: {{companyName}}
Website: {{websiteUrl}}
Industry: {{industry}}
ICP context: {{valueProposition}} — target buyer is {{targetBuyer}}

Focus areas (optional): {{focusAreas | "auto"}}

Required output:
- 3–5 strategic insights (ranked, with source URLs and confidence)
- Top 3 trigger events (90-day window, with relevance scores)
- Top 5 competitors (with differentiation and positioning)
- 2–3 outreach talking points (derived from top insights)
- 5+ distinct source domains

Budget cap: \${{budgetCapUsd}}
Latency target: < 60s

Return the research_brief as structured JSON matching the configured schema.`,
      variables: ['prospectId', 'companyName', 'websiteUrl', 'industry', 'valueProposition', 'targetBuyer', 'focusAreas', 'budgetCapUsd'],
    },
    {
      name: 'Competitor-focused research',
      useCase: 'User wants Sage to focus on competitive intelligence for a prospect entering a crowded market.',
      template: `Perform competitor-focused research on prospect {{prospectId}}.

Company: {{companyName}}
Industry: {{industry}}

Focus: competitive intelligence
- Identify top 5 competitors
- For each competitor: differentiation, funding stage, recent news, pricing (if public)
- Position the prospect: leader / challenger / disruptor / niche player
- Identify 2–3 differentiation angles for outreach
- Flag any shared former-executives between prospect and competitors

Output: structured JSON with competitors[], positioning, differentiation_angles[].`,
      variables: ['prospectId', 'companyName', 'industry'],
    },
    {
      name: 'Trigger event scan',
      useCase: 'User wants Sage to scan for recent trigger events (funding, hires, launches) within the 90-day window.',
      template: `Scan for trigger events on prospect {{prospectId}}.

Company: {{companyName}}
Website: {{websiteUrl}}
Lookback window: {{window | "90d" | "180d" | "365d"}}

Detect:
- Funding events (round type, amount, investors, date)
- Executive hires (role, name, prior company, date)
- Product launches (product name, date, summary)
- M&A activity (type, counterparty, date)
- Regulatory events (description, date, jurisdiction)
- Earnings reports (public companies only)

Score each trigger on: recency, magnitude, ICP_fit, actionability.
Flag the top 3 triggers for outreach use.

Output: structured JSON with trigger_events[] and top_3_flagged[].`,
      variables: ['prospectId', 'companyName', 'websiteUrl', 'window'],
    },
    {
      name: 'RSS monitoring subscription',
      useCase: 'User wants Sage to subscribe to RSS feeds for ongoing monitoring of a prospect.',
      template: `Subscribe to RSS feeds for prospect {{prospectId}}.

Company: {{companyName}}
Company blog/feed: {{companyFeedUrl | "auto-detect"}}
Industry publications to monitor: {{industryPubs | "auto-select-3"}}
Poll interval: {{pollInterval | "15min" | "60min"}}

When new items are detected, score them for trigger-event relevance.
On high-relevance items (score > 0.6), emit research.trigger_detected with:
- prospect_id
- feed_url
- item_title, item_url, item_date
- trigger_type (if classifiable)
- relevance_score

Return: confirmation of subscriptions created and initial feed fetch status.`,
      variables: ['prospectId', 'companyName', 'companyFeedUrl', 'industryPubs', 'pollInterval'],
    },
    {
      name: 'Strategic insight refresh',
      useCase: 'User wants Sage to refresh insights on a prospect whose last research is stale.',
      template: `Refresh strategic insights for prospect {{prospectId}}.

Company: {{companyName}}
Last researched: {{lastResearchedDate}}
Reason for refresh: {{reason | "scheduled" | "trigger_detected" | "manual"}}

Perform delta research:
- Re-read company website (compare to last extraction)
- Search for news since {{lastResearchedDate}}
- Re-evaluate trigger events (new window: last 90 days from today)
- Re-score competitors (note any changes since last research)
- Produce fresh 3–5 strategic insights

Preserve insight provenance: cite both the new source and the prior insight it replaces (if applicable).

Output: structured JSON matching the research_brief schema, plus a delta_summary noting what changed since last research.`,
      variables: ['prospectId', 'companyName', 'lastResearchedDate', 'reason'],
    },
    {
      name: 'Vertical/industry deep-dive',
      useCase: 'User wants Sage to perform an industry-wide deep-dive to inform campaign-level ICP refinement.',
      template: `Perform an industry deep-dive for vertical: {{industry}}.

Goal: surface macro trends and signal sources that will inform campaign-level ICP refinement for {{campaignId}}.

Research scope:
- Top 5 industry publications (with RSS feeds if available)
- Top 3 industry analysts covering this vertical
- Recent macro trends (last 180 days)
- Common trigger events in this vertical
- Typical competitor landscape patterns
- Recommended source mix for prospects in this vertical

Output: structured JSON with publications[], analysts[], trends[], typical_triggers[], competitor_patterns[], recommended_source_mix[].

Persist as a campaign-level research artifact (not prospect-level).`,
      variables: ['industry', 'campaignId'],
    },
  ],

  toolCallExamples: [
    {
      tool: 'z-ai page_reader',
      scenario: 'Reading the Acme company website to extract mission, products, and tech signals.',
      request: `{
  "url": "https://acme.com/about",
  "max_chars": 5000,
  "clean_html": true,
  "extract_subpages": true
}`,
      response: `{
  "url": "https://acme.com/about",
  "title": "About Acme",
  "content": "Acme is a leading provider of developer observability platforms founded in 2022. Our mission is to make every production system transparent. Products: Acme Trace, Acme Metrics, Acme Alerts. Team: 120 employees across San Francisco and Berlin. Backed by Sequoia and Andreessen Horowitz. Customers include Stripe, Vercel, and Datadog.",
  "extracted_at": "2026-09-08T14:23:00Z",
  "char_count": 487,
  "language": "en",
  "subpages_read": [
    {"url": "https://acme.com/products", "char_count": 2310},
    {"url": "https://acme.com/team", "char_count": 1840},
    {"url": "https://acme.com/careers", "char_count": 920}
  ],
  "tech_signals": ["Next.js", "Vercel Analytics", "Stripe.js"]
}`,
      notes: 'Subpages are auto-followed when homepage content is < 800 chars. Tech signals are extracted from script tags and meta generators.',
    },
    {
      tool: 'Exa Semantic Search',
      scenario: 'Semantic news search for recent strategic moves by Acme in the observability space.',
      request: `POST https://api.exa.ai/search
Authorization: Bearer {{EXA_API_KEY}}
Content-Type: application/json

{
  "query": "Acme recent strategic announcements in observability",
  "num_results": 10,
  "use_autoprompt": true,
  "start_published_date": "2026-06-01",
  "category": "news"
}`,
      response: `{
  "results": [
    {
      "title": "Acme raises $40M Series B to scale observability platform",
      "url": "https://techcrunch.com/2026/08/acme-series-b",
      "score": 0.94,
      "publishedDate": "2026-08-15",
      "text": "Acme announced a $40M Series B led by Sequoia..."
    },
    {
      "title": "Acme appoints former Datadog VP as new CTO",
      "url": "https://news.ycombinator.com/item?id=acme-cto",
      "score": 0.89,
      "publishedDate": "2026-07-22",
      "text": "Acme hired Jane Smith, formerly VP Engineering at Datadog..."
    }
  ]
}`,
      notes: 'Results below score 0.7 are filtered out as low-confidence. The autoprompt feature rewrites the query for better semantic matching.',
    },
    {
      tool: 'RSS Feed Reader',
      scenario: 'Subscribing to and polling the Acme company blog for real-time monitoring.',
      request: `{
  "action": "subscribe",
  "feed_url": "https://acme.com/blog/feed.xml",
  "prospect_id": "p_8842",
  "poll_interval": "15min",
  "trigger_threshold": 0.6
}`,
      response: `{
  "subscribed": true,
  "feed_url": "https://acme.com/blog/feed.xml",
  "prospect_id": "p_8842",
  "poll_interval": "15min",
  "initial_fetch": {
    "items": 12,
    "latest_item": {
      "title": "Acme launches new trace correlation feature",
      "link": "https://acme.com/blog/trace-correlation",
      "pubDate": "2026-09-05T10:00:00Z"
    }
  },
  "trigger_detection": {
    "trigger_detected": true,
    "trigger_type": "product_launch",
    "relevance_score": 0.78,
    "event_emitted": "research.trigger_detected"
  }
}`,
      notes: 'On high-relevance items (score > 0.6), Sage emits research.trigger_detected which triggers re-scoring and notifies the Outreach Composer.',
    },
    {
      tool: 'Crunchbase API',
      scenario: 'Querying Crunchbase for Acme\'s funding history to detect recent funding triggers.',
      request: `GET https://api.crunchbase.com/api/v4/entities/organizations/acme?card_fields=funding_rounds,investors
Authorization: Bearer {{CRUNCHBASE_API_KEY}}`,
      response: `{
  "funding_rounds": [
    {
      "type": "series_b",
      "amount": 40000000,
      "currency": "USD",
      "announced_on": "2026-08-15",
      "investors": [
        {"name": "Sequoia Capital", "type": "lead"},
        {"name": "Andreessen Horowitz", "type": "previous"}
      ],
      "source_url": "https://news.crunchbase.com/acme-series-b"
    },
    {
      "type": "series_a",
      "amount": 12000000,
      "currency": "USD",
      "announced_on": "2024-03-10",
      "investors": [
        {"name": "Andreessen Horowitz", "type": "lead"}
      ]
    }
  ]
}`,
      notes: 'Crunchbase is the authoritative source for funding data. The Series B from 2026-08-15 is a high-relevance trigger (within 90-day window).',
    },
  ],

  examples: [
    {
      scenario: 'Deep research on a B2B SaaS company (Acme) for a dev-tools outreach campaign.',
      input: `Perform deep research on prospect p_8842. Company: Acme. Website: https://acme.com. Industry: developer observability. ICP context: selling a CI/CD integration tool to VP Engineering at Series A–B startups. Budget cap $0.05.`,
      reasoning: `Validated inputs (name, website, industry all present). Selected source mix: page_reader (website + /about, /products, /team), z-ai web_search (4 query variations), Exa semantic search, RSS subscription (acme.com/blog/feed.xml), Crunchbase (funding history), Twitter/X (from:acme). Dispatched in parallel where possible. Website extraction yielded mission, product lines (Trace, Metrics, Alerts), team size (120), tech signals (Next.js, Vercel, Stripe). News search found: Series B ($40M, 2026-08-15), new CTO hire (Jane Smith, ex-Datadog VP, 2026-07-22). Crunchbase confirmed Series B with Sequoia lead. Competitor search identified top 5: Datadog, Honeycomb, Lightstep (acquired by ServiceNow), New Relic, Dynatrace. Positioning: Acme is a challenger (smaller than leaders Datadog/New Relic, but newer stack). Trigger event scoring: Series B (relevance 0.92, top), CTO hire (relevance 0.85, second), product launch (relevance 0.71, third). Synthesized 4 insights, generated 3 talking points. Source diversity: 7 distinct domains (well above 5 minimum).`,
      output: `{
  "prospect_id": "p_8842",
  "sources_consulted": [
    {"url": "https://acme.com/about", "accessed_at": "2026-09-08T14:23:00Z", "category": "primary"},
    {"url": "https://acme.com/products", "accessed_at": "2026-09-08T14:23:01Z", "category": "primary"},
    {"url": "https://techcrunch.com/2026/08/acme-series-b", "accessed_at": "2026-09-08T14:23:05Z", "category": "secondary"},
    {"url": "https://news.crunchbase.com/acme-series-b", "accessed_at": "2026-09-08T14:23:08Z", "category": "primary"},
    {"url": "https://news.ycombinator.com/item?id=acme-cto", "accessed_at": "2026-09-08T14:23:10Z", "category": "secondary"},
    {"url": "https://twitter.com/acme/status/...", "accessed_at": "2026-09-08T14:23:12Z", "category": "tertiary"},
    {"url": "https://acme.com/blog/feed.xml", "accessed_at": "2026-09-08T14:23:15Z", "category": "primary"}
  ],
  "trigger_events": [
    {"event_type": "funding", "description": "Series B $40M led by Sequoia", "source_url": "https://techcrunch.com/2026/08/acme-series-b", "date": "2026-08-15", "relevance": 0.92},
    {"event_type": "executive_hire", "description": "Jane Smith hired as CTO (ex-Datadog VP)", "source_url": "https://news.ycombinator.com/item?id=acme-cto", "date": "2026-07-22", "relevance": 0.85},
    {"event_type": "product_launch", "description": "Trace correlation feature launched", "source_url": "https://acme.com/blog/trace-correlation", "date": "2026-09-05", "relevance": 0.71}
  ],
  "competitors": [
    {"name": "Datadog", "url": "https://datadoghq.com", "differentiation": "Market leader, full-stack monitoring", "funding_stage": "public"},
    {"name": "Honeycomb", "url": "https://honeycomb.io", "differentiation": "High-cardinality observability", "funding_stage": "Series D"},
    {"name": "Lightstep", "url": "https://lightstep.com", "differentiation": "Acquired by ServiceNow, enterprise focus", "funding_stage": "acquired"},
    {"name": "New Relic", "url": "https://newrelic.com", "differentiation": "Legacy APM, broad integration", "funding_stage": "public"},
    {"name": "Dynatrace", "url": "https://dynatrace.com", "differentiation": "AI-driven, enterprise-grade", "funding_stage": "public"}
  ],
  "strategic_insights": [
    {
      "insight_text": "Acme just raised $40M Series B led by Sequoia (2026-08-15), signaling growth budget and likely tooling expansion across engineering org.",
      "source_url": "https://techcrunch.com/2026/08/acme-series-b",
      "confidence": 0.94,
      "category": "trigger",
      "talking_point": "Saw your Series B announcement last month — congrats on the Sequoia lead. With fresh capital and 50 engineers likely joining, scaling your CI/CD pipeline is probably top of mind."
    },
    {
      "insight_text": "Acme hired Jane Smith as CTO in July 2026, previously VP Engineering at Datadog — she brings deep experience with large-scale observability stacks.",
      "source_url": "https://news.ycombinator.com/item?id=acme-cto",
      "confidence": 0.88,
      "category": "trigger",
      "talking_point": "Noticed Jane Smith joined as CTO recently — coming from Datadog, she likely has strong opinions on observability-CI integration. Worth a conversation about how our tool fits her stack vision."
    },
    {
      "insight_text": "Acme positions as a challenger to Datadog/New Relic with a modern, Next.js-based stack — they likely value developer experience and integration speed over enterprise features.",
      "source_url": "https://acme.com/about",
      "confidence": 0.79,
      "category": "competitive",
      "talking_point": "Saw Acme is positioning as the modern alternative to Datadog — your Next.js stack and developer-experience focus suggests you'd value a CI/CD integration that doesn't slow down deploys."
    },
    {
      "insight_text": "Acme launched trace correlation feature on 2026-09-05, indicating active investment in observability depth — a natural opening to discuss CI/CD trace integration.",
      "source_url": "https://acme.com/blog/trace-correlation",
      "confidence": 0.83,
      "category": "trigger",
      "talking_point": "Saw the trace correlation feature launch last week — extending traces into CI/CD pipelines is a natural next step we've been exploring."
    }
  ],
  "talking_points": [
    "Saw your Series B announcement last month — congrats on the Sequoia lead. With fresh capital and 50 engineers likely joining, scaling your CI/CD pipeline is probably top of mind.",
    "Noticed Jane Smith joined as CTO recently — coming from Datadog, she likely has strong opinions on observability-CI integration. Worth a conversation about how our tool fits her stack vision.",
    "Saw Acme is positioning as the modern alternative to Datadog — your Next.js stack and developer-experience focus suggests you'd value a CI/CD integration that doesn't slow down deploys."
  ],
  "meta": {
    "source_count": 7,
    "research_duration_s": 28,
    "partial": false
  }
}`,
      outcome: 'Bard (Outreach Composer) used 2 of the 3 talking points in the opening email. Email earned a reply within 4 hours from Jane Smith (the new CTO) requesting a demo. Sage\'s insights directly drove a $48K ARR opportunity.',
    },
    {
      scenario: 'Trigger event detection for a company with no recent news in the 90-day window.',
      input: `Perform deep research on prospect p_9231. Company: Globex Manufacturing. Website: https://globex.com. Industry: industrial manufacturing. ICP context: selling ERP modernization services to mid-market manufacturers.`,
      reasoning: `Validated inputs. Selected source mix: page_reader, z-ai web_search, Exa, RSS, Crunchbase, SEC EDGAR (Globex is public). Website extraction yielded mission, products, team (500 employees). News search returned 0 results in the 90-day window — Globex has been quiet. Extended to 180 days: found a Q2 earnings report (2026-05-10, 4 months old) and a regulatory compliance deadline (2026-04-22, 5 months old). Both flagged as "stale_context". No funding events (public company, last raise was IPO years ago). No executive hires detected. Competitor search identified 5 competitors. Trigger scoring yielded 0 high-relevance triggers in the 90-day window — flagged as "low_trigger_context". Insight synthesis leaned on competitive and strategic angles rather than trigger events. Produced 3 insights (lower bound of range) because the brief lacked trigger-event material. Source diversity: 6 distinct domains.`,
      output: `{
  "prospect_id": "p_9231",
  "sources_consulted": [
    {"url": "https://globex.com/about", "accessed_at": "2026-09-08T14:30:00Z", "category": "primary"},
    {"url": "https://globex.com/products", "accessed_at": "2026-09-08T14:30:02Z", "category": "primary"},
    {"url": "https://sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=globex", "accessed_at": "2026-09-08T14:30:05Z", "category": "primary"},
    {"url": "https://globex.com/press/2025", "accessed_at": "2026-09-08T14:30:08Z", "category": "primary"},
    {"url": "https://industry-publication.com/globex-q2-earnings", "accessed_at": "2026-09-08T14:30:10Z", "category": "secondary"},
    {"url": "https://manufacturing-news.com/erp-compliance-2026", "accessed_at": "2026-09-08T14:30:12Z", "category": "secondary"}
  ],
  "trigger_events": [],
  "trigger_context_flag": "low_trigger_context",
  "stale_context_items": [
    {"event_type": "earnings", "description": "Q2 earnings report (slight revenue decline)", "source_url": "https://industry-publication.com/globex-q2-earnings", "date": "2026-05-10", "flagged": "stale_background"},
    {"event_type": "regulatory", "description": "New EPA compliance deadline for manufacturing emissions", "source_url": "https://manufacturing-news.com/erp-compliance-2026", "date": "2026-04-22", "flagged": "stale_background"}
  ],
  "competitors": [
    {"name": "Initech Manufacturing", "url": "https://initech.com", "differentiation": "Larger scale, full ERP suite", "funding_stage": "public"},
    {"name": "Hooli Industrial", "url": "https://hooli.com", "differentiation": "Modern stack, mid-market focus", "funding_stage": "Series E"},
    {"name": "Pied Piper Mfg", "url": "https://piedpiper.com", "differentiation": "AI-driven predictive maintenance", "funding_stage": "Series C"},
    {"name": "Vandelay Systems", "url": "https://vandelay.com", "differentiation": "Legacy ERP, large enterprise", "funding_stage": "public"},
    {"name": "Stark Industries", "url": "https://stark.com", "differentiation": "Diversified industrial, deep capital", "funding_stage": "public"}
  ],
  "strategic_insights": [
    {
      "insight_text": "Globex is a 500-employee public manufacturer with no recent trigger events in the 90-day window — outreach will need to lean on industry trends (EPA compliance) rather than company-specific news.",
      "source_url": "https://globex.com/about",
      "confidence": 0.81,
      "category": "strategic",
      "talking_point": "Noticed Globex has been quiet on the news front recently — with the EPA compliance deadline approaching for manufacturing emissions, modernizing your ERP to track compliance metrics is probably worth a conversation."
    },
    {
      "insight_text": "Globex competes with 4 larger public manufacturers and 1 modern Series C challenger (Pied Piper) — Globex is positioned as a mid-market incumbent vulnerable to disruption by modern stacks.",
      "source_url": "https://globex.com/about",
      "confidence": 0.74,
      "category": "competitive",
      "talking_point": "Saw Globex operates in a competitive landscape with newer entrants like Pied Piper bringing AI-driven modernization — staying competitive likely means upgrading your ERP before the gap widens."
    },
    {
      "insight_text": "Globex\'s Q2 earnings (May 2026) showed slight revenue decline — flagged as stale context but suggests cost pressure that may accelerate ERP modernization decisions.",
      "source_url": "https://industry-publication.com/globex-q2-earnings",
      "confidence": 0.62,
      "category": "strategic",
      "talking_point": "Saw Globex\'s Q2 showed a slight revenue dip — ERP modernization can drive 15–20% operational efficiency gains that may help reverse the trend."
    }
  ],
  "talking_points": [
    "Noticed Globex has been quiet on the news front recently — with the EPA compliance deadline approaching for manufacturing emissions, modernizing your ERP to track compliance metrics is probably worth a conversation.",
    "Saw Globex operates in a competitive landscape with newer entrants like Pied Piper bringing AI-driven modernization — staying competitive likely means upgrading your ERP before the gap widens.",
    "Saw Globex's Q2 showed a slight revenue dip — ERP modernization can drive 15–20% operational efficiency gains that may help reverse the trend."
  ],
  "meta": {
    "source_count": 6,
    "research_duration_s": 35,
    "partial": false,
    "low_trigger_context": true
  }
}`,
      outcome: 'Brief flagged as "low_trigger_context" — Bard composed outreach referencing industry-wide EPA compliance deadline rather than company-specific news. Reply rate lower than average (4% vs 9% for high-trigger prospects), but 1 meeting booked from 25 sends.',
    },
    {
      scenario: 'RSS-driven trigger refresh on a previously researched prospect.',
      input: `Process trigger_detected event: RSS feed for prospect p_8842 (Acme) published a new item at 2026-09-15T09:00:00Z. Re-evaluate insights.`,
      reasoning: `Trigger-detected event received. Item URL: https://acme.com/blog/launches-enterprise-tier. RSS reader scored item at 0.78 relevance (product_launch trigger). Fetching the new blog post via page_reader. Post describes new Enterprise tier with SSO, audit logs, and dedicated support — a clear expansion upmarket signal. Re-running competitive analysis: positions Acme as moving from challenger to leader archetype (enterprise features signal market maturation). Re-scoring trigger events: new product launch (Enterprise tier, 2026-09-15, relevance 0.88) becomes the top trigger, pushing the trace-correlation launch down. Synthesizing fresh insights: 1 new insight (Enterprise tier launch signals upmarket expansion), 3 retained insights (Series B, CTO hire, positioning), 1 dropped (trace correlation now lower priority). Total still 4 insights (within 3–5 range). Talking points refreshed: top 2 now reference Enterprise tier launch and Series B.`,
      output: `{
  "prospect_id": "p_8842",
  "trigger_event_source": "rss",
  "delta_summary": {
    "new_triggers": [
      {"event_type": "product_launch", "description": "Enterprise tier launched with SSO, audit logs, dedicated support", "source_url": "https://acme.com/blog/launches-enterprise-tier", "date": "2026-09-15", "relevance": 0.88}
    ],
    "updated_positioning": "leader (upgraded from challenger — enterprise features signal market maturation)",
    "insights_added": 1,
    "insights_retained": 3,
    "insights_dropped": 1,
    "talking_points_refreshed": 2
  },
  "strategic_insights": [
    {
      "insight_text": "Acme launched an Enterprise tier on 2026-09-15 with SSO, audit logs, and dedicated support — signals upmarket expansion and likely need for enterprise-grade integrations including CI/CD governance.",
      "source_url": "https://acme.com/blog/launches-enterprise-tier",
      "confidence": 0.91,
      "category": "trigger",
      "talking_point": "Saw the Enterprise tier launch this week — moving upmarket means you'll need CI/CD governance that fits enterprise procurement requirements. Worth exploring how our tool supports SSO and audit trails."
    },
    {
      "insight_text": "Acme just raised $40M Series B led by Sequoia (2026-08-15), signaling growth budget and likely tooling expansion across engineering org.",
      "source_url": "https://techcrunch.com/2026/08/acme-series-b",
      "confidence": 0.94,
      "category": "trigger",
      "talking_point": "Saw your Series B announcement last month — congrats on the Sequoia lead. With fresh capital and 50 engineers likely joining, scaling your CI/CD pipeline is probably top of mind."
    },
    {
      "insight_text": "Acme hired Jane Smith as CTO in July 2026, previously VP Engineering at Datadog — she brings deep experience with large-scale observability stacks.",
      "source_url": "https://news.ycombinator.com/item?id=acme-cto",
      "confidence": 0.88,
      "category": "trigger",
      "talking_point": "Noticed Jane Smith joined as CTO recently — coming from Datadog, she likely has strong opinions on observability-CI integration. Worth a conversation about how our tool fits her stack vision."
    },
    {
      "insight_text": "Acme is moving from challenger to leader positioning — the Enterprise tier launch indicates they're now competing directly with Datadog and New Relic for enterprise accounts, which raises the stakes on integration depth.",
      "source_url": "https://acme.com/blog/launches-enterprise-tier",
      "confidence": 0.82,
      "category": "competitive",
      "talking_point": "Saw Acme is now competing directly with Datadog and New Relic for enterprise — that means your integration ecosystem becomes a competitive moat. Worth exploring how our CI/CD integration extends your reach."
    }
  ],
  "meta": {
    "source_count": 8,
    "research_duration_s": 12,
    "partial": false,
    "refresh_reason": "rss_trigger_detected"
  }
}`,
      outcome: 'Bard immediately composed a new outreach message referencing the Enterprise tier launch. Email was sent within 4 hours of the trigger detection. Reply received within 2 hours from Acme\'s VP of Engineering requesting a demo on enterprise CI/CD governance. Trigger-driven outreach outperformed cold outreach by 3.4x in reply rate.',
    },
  ],

  guardrails: [
    {
      rule: 'Never fabricate quotes, statistics, or source URLs.',
      rationale: 'Fabricated intelligence poisons every downstream decision — outreach referencing non-existent facts destroys prospect trust and risks reputational damage.',
      enforcement: 'Post-condition check performs a HEAD request against every source_url in the brief; URLs returning 404 or failing DNS resolution cause the entire brief to be rejected and the task escalated.',
      severity: 'block',
    },
    {
      rule: 'Always produce between 3 and 5 strategic insights — never fewer, never more.',
      rationale: 'The 3–5 range is calibrated against downstream outreach performance data. Fewer than 3 leaves Bard without enough material; more than 5 dilutes focus and produces noise.',
      enforcement: 'Output validator rejects any research_brief with strategic_insights.length < 3 or > 5; the LLM is re-prompted with an explicit count constraint (max 2 retries).',
      severity: 'block',
    },
    {
      rule: 'Always include a source URL and confidence score for every insight.',
      rationale: 'Without provenance, downstream agents and human reviewers cannot verify the insight — explainability collapses.',
      enforcement: 'Schema validator enforces source_url (non-empty string) and confidence (0.0–1.0 number) as required fields on every insight; missing fields cause the insight to be dropped and the brief re-synthesized.',
      severity: 'block',
    },
    {
      rule: 'Never use data older than 90 days without explicitly flagging it as stale.',
      rationale: 'Stale data presented as current leads to outreach referencing outdated facts, which is worse than no insight at all.',
      enforcement: 'A date-check pass compares each insight\'s source publication date to the current date; items older than 90 days are auto-tagged with category="stale_background" and excluded from talking_points.',
      severity: 'block',
    },
    {
      rule: 'Always diversify across 5+ distinct source domains per prospect.',
      rationale: 'Source tunneling (relying on one source) creates fragile insights that collapse if the single source is wrong or biased.',
      enforcement: 'Pre-output check counts distinct source domains in sources_consulted; below 5, the task triggers additional source searches before synthesis is allowed to complete.',
      severity: 'block',
    },
    {
      rule: 'Always distinguish verified facts from LLM-synthesized inferences.',
      rationale: 'Downstream agents (Bard, Judge) need to know whether to lean on a fact or treat it as hypothesis. Conflating the two degrades decision quality.',
      enforcement: 'Every insight has a category field (trigger, competitive, strategic, operational) and a confidence score; categories derived primarily from primary sources score higher than those synthesized by the LLM.',
      severity: 'warn',
    },
    {
      rule: 'Always emit research.completed within 60 seconds of task start.',
      rationale: 'Slow research blocks downstream agents (Bard waits on Sage) and degrades pipeline throughput.',
      enforcement: 'A 60s watchdog timer fires; if research.completed has not been emitted, the task returns partial results with research_partial=true flag rather than failing entirely.',
      severity: 'warn',
    },
    {
      rule: 'Never include competitor confidential information obtained through questionable means.',
      rationale: 'Using leaked documents, paywalled content accessed without authorization, or scraped personal data exposes LeadReach to legal risk and reputation damage.',
      enforcement: 'Source allowlist filters out known leak-aggregator domains and paywalled sources unless an active subscription is verified; manual review required for borderline sources.',
      severity: 'block',
    },
    {
      rule: 'Always surface source conflicts explicitly rather than silently picking one version.',
      rationale: 'Silent conflict resolution hides uncertainty from downstream agents, who may treat the picked version as ground truth. Surfacing conflicts preserves decision quality.',
      enforcement: 'A conflict-detection pass compares key facts (funding amounts, hire dates, competitor names) across sources; conflicts trigger an "insight.conflict_noted" field on the affected insight.',
      severity: 'warn',
    },
  ],

  decisionMatrix: [
    {
      condition: 'Company website returns 0 content (timeout, 5xx, or empty page).',
      action: 'Log the failure, attempt alternate subpages (/about, /contact), and continue with other sources. Website is one source of 5+; a single failure does not block research.',
      rationale: 'The 5-source minimum exists precisely to make research resilient to single-source failure.',
      example: 'Acme.com returned 503 on first page_reader attempt. /about and /products also failed. Sage proceeded with news, Exa, RSS, Crunchbase, and Twitter as the 5 sources.',
    },
    {
      condition: 'News search returns 0 results in the 90-day window.',
      action: 'Extend the lookback to 180 days and flag all older items as "stale_background". Brief is marked "low_trigger_context".',
      rationale: 'No triggers in 90 days is information — the prospect has been quiet. Extending to 180 days surfaces context without misrepresenting it as fresh.',
      example: 'Globex Manufacturing had 0 news in 90 days. Extended to 180 days: found Q2 earnings (May 2026, 4 months old) flagged as stale. Brief marked low_trigger_context.',
    },
    {
      condition: 'Fewer than 5 competitors are identified.',
      action: 'Log the gap, accept the partial list, and flag the brief with "competitor_coverage_partial". Do not fabricate competitors to meet the 5-competitor target.',
      rationale: 'Some prospects genuinely operate in small markets with few apparent competitors. Inventing competitors would poison the competitive analysis.',
      example: 'Niche SaaS company in agricultural drone software had only 3 identifiable competitors. Brief accepted with 3; flagged competitor_coverage_partial.',
    },
    {
      condition: 'Trigger event detected outside the 90-day window (90–180 days old).',
      action: 'Include the event in the brief but tag it as "stale_background" rather than "trigger". Exclude from top-3 trigger ranking and talking points.',
      rationale: 'Older events provide context but don\'t drive outreach timing. Misrepresenting them as current triggers would lead to outreach referencing stale news.',
      example: 'Globex Q2 earnings (May 2026, 4 months old) flagged as stale_background. Not used in talking points but informs the strategic insight about cost pressure.',
    },
    {
      condition: 'Conflicting data from multiple sources (e.g. funding amount reported differently).',
      action: 'Surface the conflict explicitly in the insight: "Source A reports X; Source B reports Y. Using {{preferred_source}} as the more authoritative source." Include both source URLs.',
      rationale: 'Silent conflict resolution hides uncertainty. Surfacing it preserves decision quality and lets downstream agents weigh confidence appropriately.',
      example: 'TechCrunch reported Acme Series B at $40M; Crunchbase reported $35M. Insight noted conflict and used Crunchbase (more authoritative for funding data) but flagged the discrepancy.',
    },
    {
      condition: 'RSS feed goes stale (no new items for 30+ days).',
      action: 'Reduce poll frequency to 60min, log the staleness, and consider unsubscribing after 90 days of zero items.',
      rationale: 'Polling a dead feed wastes API budget. Reducing frequency preserves resources while still catching any future resurrection.',
      example: 'Acme blog feed had no new items for 45 days. Polling reduced to 60min. After 90 days, the feed was auto-unsubscribed.',
    },
    {
      condition: 'LLM-synthesized insight has confidence < 0.5.',
      action: 'Flag the insight as low-confidence, demote it in the ranking, and exclude its talking point from the top-2 talking points sent to Bard.',
      rationale: 'Low-confidence insights are useful context but risky for outreach; surfacing them prominently risks Bard using shaky material.',
      example: 'Acme positioning insight had confidence 0.48 (single tertiary source). Demoted to 4th of 4 insights; talking point excluded from top-2.',
    },
    {
      condition: 'Tech stack cannot be detected (no BuiltWith, no HTML signals, no job postings).',
      action: 'Note "tech_stack_unknown" in the brief, do not infer tech stack from industry stereotypes, and continue research without the tech angle.',
      rationale: 'Inferring tech stack from stereotypes ("all fintech uses Java") produces low-quality insights that erode trust.',
      example: 'Stealth-mode startup had no public website content. Tech stack marked unknown; outreach did not reference tech stack.',
    },
    {
      condition: 'Source diversity falls below 5 distinct domains.',
      action: 'Trigger additional source searches (extended news search, additional RSS feeds, social signals) to reach the 5-source floor. If impossible, mark brief as research_insufficient.',
      rationale: 'The 5-source floor exists to prevent insight tunneling. Falling below it without escalation would violate the source diversity guardrail.',
      example: 'Stealth startup with no Crunchbase, no news, no LinkedIn. After expanded search, only 3 sources found. Brief marked research_insufficient and returned to orchestrator.',
    },
  ],

  failureModes: [
    {
      failure: 'page_reader returns truncated or empty content (website blocks bot or returns minimal HTML).',
      detection: 'Extracted char_count < 200, or content matches a known bot-block pattern (e.g. "Access Denied", "Enable JavaScript").',
      mitigation: 'Attempt alternate subpages (/about, /products, /team). If all subpages also blocked, skip website source and rely on other 4+ sources. Flag brief with "website_extraction_partial".',
      recoveryTime: '< 30s — alternate subpages tried in parallel.',
    },
    {
      failure: 'Exa API key is invalid or expired.',
      detection: 'Exa returns 401 Unauthorized.',
      mitigation: 'Disable Exa channel, log the error, notify user to refresh the key. Other channels (z-ai web_search, RSS, Crunchbase, Twitter) continue. Source diversity preserved.',
      recoveryTime: '< 5 minutes after user updates the key.',
    },
    {
      failure: 'RSS feed returns malformed XML.',
      detection: 'rss-parser throws a parse error on the feed payload.',
      mitigation: 'Skip the malformed item, log it for review, continue processing the rest of the feed. If > 50% of items are malformed, disable the feed and notify the operator.',
      recoveryTime: 'Immediate — malformed items skipped, valid items processed.',
    },
    {
      failure: 'LLM synthesizes hallucinated insights (fabricated source URLs or unverifiable claims).',
      detection: 'Post-condition HEAD request against source URLs fails (404, DNS failure, or domain parking page).',
      mitigation: 'Reject the entire brief, retry with patched prompt emphasizing "NEVER fabricate source URLs; if a fact cannot be sourced, omit it." Reduced temperature (0.5 → 0.3). Max 2 retries; persistent failure escalates.',
      recoveryTime: '< 15s per retry; up to 45s total before escalation.',
    },
    {
      failure: 'Crunchbase API rate limit (429) or quota exhaustion.',
      detection: 'Crunchbase returns 429 or 402 (quota exceeded).',
      mitigation: 'Token bucket halved for 5 minutes on 429. On quota exhaustion, fall back to news-based funding detection (less reliable but functional). Flag affected insights with lower confidence (0.6 max).',
      recoveryTime: '< 5 minutes on rate limit; next day on quota exhaustion.',
    },
    {
      failure: 'LLM produces insight count outside the 3–5 range (2 or 6+ insights).',
      detection: 'Schema validator rejects briefs with strategic_insights.length < 3 or > 5.',
      mitigation: 'Retry with patched prompt explicitly stating "Produce exactly 3, 4, or 5 insights — no fewer, no more." Reduced temperature (0.5 → 0.3). Max 2 retries.',
      recoveryTime: '< 10s per retry; up to 30s total before escalation.',
    },
    {
      failure: 'LinkedIn company page unavailable (auth failure or page removed).',
      detection: 'LinkedIn API returns 401 (auth) or 404 (page removed).',
      mitigation: 'On 401, disable LinkedIn channel, notify user to refresh credentials. On 404, skip LinkedIn and rely on website team page + news for executive signals. Other sources continue.',
      recoveryTime: '< 5 minutes after user refreshes credentials.',
    },
  ],

  evaluationCases: [
    {
      id: 'eval_sage_001',
      input: 'Perform deep research on prospect p_8842. Company: Acme. Website: https://acme.com. Industry: developer observability. ICP context: selling CI/CD integration tool.',
      expectedOutput: 'research_brief JSON with 3–5 strategic insights, each with source_url and confidence. 5+ distinct source domains. Top 3 trigger events flagged. Top 5 competitors with positioning. 2–3 outreach talking points. Latency < 60s.',
      scoringCriteria: [
        'Strategic insights count is between 3 and 5 (inclusive).',
        'Every insight has a non-empty source_url.',
        'Every insight has a confidence score between 0.0 and 1.0.',
        'At least 5 distinct source domains in sources_consulted.',
        'Top 3 trigger events flagged with relevance scores.',
        'Top 5 competitors identified (or partial flag if fewer).',
        '2–3 outreach talking points derived from top insights.',
        'Research latency < 60 seconds.',
      ],
      passThreshold: 7,
    },
    {
      id: 'eval_sage_002',
      input: 'Perform deep research on a prospect whose website returns 503 and news search returns 0 results in 90 days.',
      expectedOutput: 'Brief proceeds with alternate sources (RSS, Crunchbase, Twitter, Exa semantic, analyst reports). Brief flagged "website_extraction_partial" and "low_trigger_context". Insights rely on competitive and strategic angles. Still produces 3 insights (lower bound).',
      scoringCriteria: [
        'Website failure logged, alternate subpages attempted.',
        'News lookback extended to 180 days with stale_background flag.',
        'Source diversity still ≥ 5 (compensated by other sources).',
        'Brief flagged "low_trigger_context".',
        'Brief flagged "website_extraction_partial".',
        'At least 3 strategic insights produced.',
        'Talking points do not reference non-existent website data.',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_sage_003',
      input: 'LLM synthesizes an insight with a fabricated source URL (does not exist).',
      expectedOutput: 'Post-condition check rejects the brief. Retry with patched prompt emphasizing "NEVER fabricate source URLs". If still failing after 2 retries, escalate to orchestrator.',
      scoringCriteria: [
        'HEAD request against fabricated URL returns 404 or DNS failure.',
        'Brief rejected, not persisted to lead record.',
        'Retry triggered with patched prompt.',
        'Reduced temperature on retry (0.5 → 0.3 → 0.1).',
        'Max 2 retries before escalation.',
        'Audit log records the fabrication attempt with trace_id.',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_sage_004',
      input: 'RSS trigger_detected event fires on a previously researched prospect. New blog post detected with high relevance.',
      expectedOutput: 'Delta research performed: new blog post fetched via page_reader, trigger scored, insights refreshed. New insight added if relevant; old insights re-evaluated. Talking points refreshed. research.completed re-emitted within 30s.',
      scoringCriteria: [
        'New trigger event fetched and scored within 30s.',
        'Insight count remains within 3–5 range after refresh.',
        'New insight added only if relevance > 0.6.',
        'Old insights re-evaluated for continued relevance.',
        'Talking points refreshed to reflect new top insights.',
        'Delta summary included in output (what changed since last research).',
        'research.completed re-emitted for downstream agents.',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_sage_005',
      input: 'Perform deep research on a stealth-mode prospect with no website, no Crunchbase entry, and no news coverage.',
      expectedOutput: 'After expanded search, brief marked "research_insufficient" with clear reason. No fabricated sources. Brief returned to orchestrator with recommendation: defer research until more sources appear.',
      scoringCriteria: [
        'Expanded search attempted (additional news, social, analyst sources).',
        'Source count after expanded search is < 5.',
        'Brief NOT persisted with fabricated data.',
        'Brief marked "research_insufficient" with reason "below_5_source_floor".',
        'Recommendation included: defer research until more sources appear.',
        'Orchestrator notified via task.escalated.',
        'Audit log records the insufficient-source decision.',
      ],
      passThreshold: 6,
    },
  ],
};
