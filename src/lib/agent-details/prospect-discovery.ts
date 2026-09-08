import type { AgentDetailFull } from './types';

export const prospectDiscoveryDetail: AgentDetailFull = {
  slug: 'prospect-discovery',
  name: 'prospect-discovery',
  displayName: 'Prospect Discovery (Scout)',
  tagline: 'Searches 17+ channels simultaneously to find potential leads',
  description: 'Searches and discovers potential leads using multiple channels',
  longDescription:
    'The Prospect Discovery agent — codenamed Scout — is the platform\'s primary lead finder. It searches 17+ online channels simultaneously, including the open web (via DuckDuckGo and z-ai web_search), semantic search (Exa), LinkedIn, GitHub, Twitter/X, YouTube, Reddit, RSS feeds, and international platforms (Weibo, V2EX, Xueqiu, Bilibili, XiaoHongShu, Douyin, WeChat Articles, Xiaoyuzhou). Scout uses a multi-pass discovery strategy: it generates query variations ("list of X", "top X", "best X companies", "X directory") from the campaign name and searches each in parallel, then deduplicates results by URL. Zero-config channels work immediately, while authenticated channels unlock with API keys. Scout can also discover places using the OpenStreetMap Overpass API for location-based lead generation.',
  color: '#10B981',
  iconName: 'Search',
  department: 'Growth',
  pipelineRole: 'Multi-channel prospect discovery and initial lead creation',
  pipelinePosition: 2,

  capabilities: [
    {
      name: 'Multi-Channel Simultaneous Search',
      description:
        'Searches 17+ channels in parallel, generating query variations for maximum coverage. Each channel returns different result types — LinkedIn gives professional profiles, GitHub reveals tech stack, Reddit shows community engagement.',
      metric: '17+ channels',
      details: [
        'Channels are dispatched in parallel via Promise.allSettled so a single channel failure does not block others.',
        'Each channel has its own rate limit handler (e.g. Exa 100 req/min, DuckDuckGo 30 req/min).',
        'Channels are classified into 4 tiers: zero-config, authenticated, premium, experimental.',
        'Per-channel timeout of 15s; slow channels are abandoned and the partial result is used.',
      ],
    },
    {
      name: 'Multi-Pass Query Variation',
      description:
        'Generates 4+ query variations from the campaign name ("list of X", "top X", "best X companies", "X directory") and searches each in parallel. Results are deduplicated by URL, yielding 3x more leads than single-query search.',
      metric: '3x more leads',
      details: [
        'Variation templates: "list of {{topic}}", "top {{topic}} companies", "best {{topic}}", "{{topic}} directory", "{{topic}} 2026".',
        'Each variation is searched against all enabled channels.',
        'URL normalization (strip query params, normalize scheme) prevents near-duplicate URLs from polluting the dedup set.',
        'Dedup by canonical URL; if multiple channels return the same URL, the result with richer metadata is kept.',
      ],
    },
    {
      name: '3-Tier Fallback Chain',
      description:
        'DuckDuckGo (primary) → z-ai web_search (fallback) → existing leads from prior runs (tertiary). Ensures campaigns always find candidates, even when primary search returns empty.',
      metric: 'Never returns 0',
      details: [
        'Tier 1: DuckDuckGo HTML search — free, no key required, returns ~10 results per query.',
        'Tier 2: z-ai web_search — semantic search via the z-ai-web-dev-sdk, 10 query variations searched in parallel.',
        'Tier 3: Prior-run leads — if both tiers return 0, the system loads existing leads from prior runs on the same campaign.',
        'If all 3 tiers return 0, the campaign is marked "discovery_failed" and the user is notified with diagnostic info.',
      ],
    },
    {
      name: 'Semantic Neural Search (Exa)',
      description:
        'Uses Exa\'s neural search engine to find companies based on meaning, not just keywords. Discovers leads that keyword search misses — e.g. "AI observability platforms" finds companies that don\'t use those exact words but match the concept.',
      metric: 'Exa-powered',
      details: [
        'Sends natural-language queries to Exa instead of keyword strings.',
        'Exa returns results with similarity scores; results below 0.7 are filtered out.',
        'Couples well with multi-pass: each query variation is sent to both DuckDuckGo and Exa.',
        'Requires EXA_API_KEY; if absent, channel is skipped and the rest continue.',
      ],
    },
    {
      name: 'Place Discovery (OpenStreetMap Overpass)',
      description:
        'Uses OpenStreetMap Overpass API to discover businesses by category within a geographic bounding box or radius. Ideal for local business lead generation — restaurants, gyms, salons, retail stores.',
      metric: 'OSM-powered',
      details: [
        'Queries Overpass QL with category tags (amenity=restaurant, leisure=fitness, shop=*) and bounding box.',
        'Returns OSM nodes with name, address, coordinates, opening hours.',
        'Useful for field-sales teams targeting a specific neighborhood or city block.',
        'No API key required (Overpass is open data); rate limited to 10,000 queries/day per IP.',
      ],
    },
    {
      name: 'Deduplication by Canonical URL',
      description:
        'Automatically deduplicates search results by website URL within each campaign. Prevents duplicate leads and ensures clean data.',
      metric: '100% dedup rate',
      details: [
        'URL normalization: lowercase host, strip "www.", strip fragment, strip tracking query params (utm_*, gclid, fbclid).',
        'Hash normalized URL with SHA-256; store hash in campaign_dedup_index table.',
        'On candidate insertion, hash is checked; duplicates are logged and skipped.',
        'Cross-campaign dedup is opt-in (default off) so the same company can be a lead in multiple campaigns.',
      ],
    },
    {
      name: 'Industry-Aware Filtering',
      description:
        'Filters candidates against the campaign\'s industry allowlist before lead creation. Reduces noise from irrelevant results.',
      metric: '28+ industries',
      details: [
        'Uses a 28-industry keyword matcher to classify each candidate.',
        'Candidates whose detected industry is not in the campaign allowlist are dropped.',
        'Industry classification is later refined by the Data Enrichment agent (Forge) using SIC/NAICS codes.',
        'False positives are logged for monthly classifier tuning.',
      ],
    },
    {
      name: 'Channel Health Monitoring',
      description:
        'Tracks per-channel success rate, latency, and error rate. Disables channels that fall below thresholds and alerts the operator.',
      metric: 'Per-channel health',
      details: [
        'Per-channel rolling 1-hour success rate; threshold 80%.',
        'Per-channel p99 latency; threshold 8s.',
        'Channels below thresholds are auto-disabled for 15 minutes and re-tested.',
        'Health metrics are exposed via /api/agents/prospect-discovery/health.',
      ],
    },
    {
      name: 'Rate Limit Management',
      description:
        'Per-channel token bucket rate limiter ensures Scout never trips upstream API rate limits. Backs off gracefully on 429 responses.',
      metric: 'Per-channel limiter',
      details: [
        'Token bucket per channel with refill rate matching the channel\'s documented limit.',
        'On 429: switch to half the previous rate for 5 minutes (penalty box).',
        'On repeated 429s (3 in 5 minutes): disable channel for 15 minutes.',
        'Rate limiter state is persisted so restarts do not lose the penalty state.',
      ],
    },
    {
      name: 'Lead Enrichment Hint Generation',
      description:
        'Attaches a hint object to each created lead with metadata useful for downstream enrichment: search snippet, channel source, detected industry hint, and confidence score.',
      metric: 'Per-lead hints',
      details: [
        'Hint object: {source_channel, search_snippet, detected_industry, confidence, query_variation}.',
        'Data Enrichment (Forge) uses the hint to prioritize which fields to extract first.',
        'Confidence is computed from snippet relevance and source authority (e.g. official company site = high).',
        'Low-confidence leads (< 0.4) are flagged for manual review before enrichment.',
      ],
    },
  ],

  pipelineStages: [
    {
      stage: 'Query Generation',
      inputs: ['Campaign name', 'ICP definition', 'Target industry/location'],
      outputs: ['Primary query', '4+ query variations', 'Channel selection list'],
      duration: '< 1 second',
      substeps: [
        'Extract the campaign topic from the campaign name.',
        'Generate 4+ query variations using templates.',
        'Select channels based on campaign settings and channel availability.',
        'Build per-channel query payloads (some channels use natural language, others use keywords).',
      ],
      errorHandling: 'On generation failure (rare), fall back to a single query equal to the campaign name.',
      retryStrategy: 'No retry — generation is deterministic.',
    },
    {
      stage: 'Multi-Channel Parallel Search',
      inputs: ['Generated queries', 'Channel configurations', 'Rate limit state'],
      outputs: ['Raw search results per channel', 'Channel health metrics'],
      duration: '5–15 seconds',
      substeps: [
        'Acquire rate-limit tokens for each channel.',
        'Dispatch parallel search requests via Promise.allSettled.',
        'Collect results as they arrive (do not block on slow channels).',
        'Apply per-channel timeout of 15s; abandon slow channels.',
        'Update channel health metrics (success rate, latency, errors).',
      ],
      errorHandling: 'Per-channel failures are isolated; one channel failure does not affect others.',
      retryStrategy: 'Per-channel: 3 retries with exponential backoff on transient failures.',
    },
    {
      stage: 'Result Normalization',
      inputs: ['Raw search results per channel'],
      outputs: ['Normalized candidate list (uniform schema)'],
      duration: '< 1 second',
      substeps: [
        'Map each channel\'s result schema to the canonical candidate schema (name, url, snippet, source_channel).',
        'Drop results missing required fields (name or url).',
        'Apply initial industry classification via keyword matching.',
      ],
      errorHandling: 'Schema mismatches are logged with the raw payload for debugging.',
      retryStrategy: 'No retry — normalization is deterministic.',
    },
    {
      stage: 'Deduplication',
      inputs: ['Normalized candidate list'],
      outputs: ['Unique candidate list', 'Duplicate count per channel'],
      duration: '< 2 seconds',
      substeps: [
        'Normalize each candidate\'s URL (lowercase host, strip www, strip tracking params).',
        'Compute SHA-256 hash of normalized URL.',
        'Check hash against campaign_dedup_index.',
        'New hashes are inserted; duplicates are logged and skipped.',
      ],
      errorHandling: 'Hash collisions (extremely rare) are resolved by comparing full URLs.',
      retryStrategy: 'No retry.',
    },
    {
      stage: 'Lead Creation',
      inputs: ['Unique candidates', 'Campaign ID', 'Industry allowlist'],
      outputs: ['Lead records with name, website, industry hint', 'Hint object for enrichment'],
      duration: '< 1 second per lead',
      substeps: [
        'Filter candidates against industry allowlist.',
        'Create Lead record in Postgres with required fields populated.',
        'Attach hint object (source_channel, search_snippet, confidence).',
        'Emit lead.created event for downstream agents.',
        'Update campaign counter (total_leads, leads_today).',
      ],
      errorHandling: 'DB write failures trigger a 3-retry backoff; persistent failures escalate.',
      retryStrategy: '3 retries with 200ms backoff on DB write.',
    },
    {
      stage: 'Fallback Activation (if needed)',
      inputs: ['Empty or sparse candidate list from primary tiers'],
      outputs: ['Fallback results from z-ai web_search or prior-run leads'],
      duration: '5–10 seconds',
      substeps: [
        'If primary tier (DuckDuckGo) returned < 5 candidates, activate Tier 2 (z-ai web_search).',
        'If Tier 2 also returns < 5, activate Tier 3 (load existing leads from prior runs).',
        'Log fallback activation reason for diagnostics.',
        'If all 3 tiers return 0, mark campaign as "discovery_failed" and notify user.',
      ],
      errorHandling: 'Tier 3 failures (no prior leads) result in user notification with diagnostic info.',
      retryStrategy: 'No retry across tiers; each tier is tried once.',
    },
  ],

  knowledgeBase: [
    {
      title: 'Multi-Channel Search SOP',
      category: 'SOP',
      summary:
        'Defines the complete search workflow: query generation, channel selection, parallel execution, result merging, and deduplication.',
      sections: 14,
      owner: 'Growth Engineering',
      lastReviewed: '2026-08-18',
      version: '3.1.0',
      sectionList: [
        { title: '1. Query Generation Rules', description: 'How the campaign name is decomposed into 4+ query variations.' },
        { title: '2. Channel Selection Matrix', description: 'Which channels are used for which campaign types and ICP characteristics.' },
        { title: '3. Parallel Dispatch Protocol', description: 'How Promise.allSettled is used to dispatch and collect results without blocking.' },
        { title: '4. Per-Channel Timeouts', description: 'Standard 15s timeout; exceptions for known slow channels.' },
        { title: '5. Result Schema Normalization', description: 'How each channel\'s result schema is mapped to the canonical candidate schema.' },
        { title: '6. URL Normalization Rules', description: 'The exact normalization steps for deduplication.' },
        { title: '7. Hash-based Dedup', description: 'How SHA-256 hashes are computed and checked against the dedup index.' },
        { title: '8. Industry Classification (initial)', description: 'The 28-industry keyword matcher used for initial filtering.' },
        { title: '9. Lead Record Creation', description: 'Required fields, hint object structure, and DB write protocol.' },
        { title: '10. Campaign Counter Sync', description: 'How total_leads and leads_today are updated atomically.' },
        { title: '11. Event Emission', description: 'The lead.created event payload and downstream subscribers.' },
        { title: '12. Channel Health Tracking', description: 'How per-channel success rate, latency, and error rate are tracked.' },
        { title: '13. Fallback Activation Triggers', description: 'When and how the 3-tier fallback chain activates.' },
        { title: '14. Quality Assurance', description: 'How sample leads are spot-checked weekly for accuracy.' },
      ],
    },
    {
      title: 'Search Source Failure Runbook',
      category: 'Runbook',
      summary:
        'Handles DuckDuckGo outages, Exa rate limits, LinkedIn auth failures, and other channel-specific issues with fallback procedures.',
      sections: 14,
      owner: 'Site Reliability',
      lastReviewed: '2026-09-03',
      version: '2.4.0',
      sectionList: [
        { title: '1. DuckDuckGo HTML Outage', description: 'Detection via 5xx response rate > 30%; activation of Tier 2 fallback.' },
        { title: '2. Exa Rate Limit (429)', description: 'Token bucket adjustment; penalty box for 5 minutes; re-test.' },
        { title: '3. Exa API Key Invalid', description: 'Detection, user notification, channel disablement until key is updated.' },
        { title: '4. LinkedIn Auth Failure', description: 'Cookie expiry detection; re-login procedure; key rotation.' },
        { title: '5. GitHub API Rate Limit', description: 'Token rotation across multiple GitHub accounts; backoff.' },
        { title: '6. Reddit API Outage', description: 'Detection; disable Reddit channel; rely on other channels.' },
        { title: '7. Overpass API Slow Response', description: 'Increase timeout for Overpass queries; consider alternative mirrors.' },
        { title: '8. z-ai web_search Failure', description: 'Detection; fall back to Tier 3 (prior-run leads).' },
        { title: '9. International Channel Failures', description: 'Weibo, V2EX, Xueqiu, Bilibili specific failure modes.' },
        { title: '10. Network Partition Handling', description: 'How Scout behaves when outbound network is partitioned.' },
        { title: '11. Cascading Failure Detection', description: 'How to detect when multiple channels fail simultaneously.' },
        { title: '12. Recovery Validation', description: 'How to confirm a channel has recovered before re-enabling it.' },
        { title: '13. User Notification Templates', description: 'Pre-written user notifications for common failure scenarios.' },
        { title: '14. Post-Incident Review Template', description: '5-whys template for any channel outage > 15 minutes.' },
      ],
    },
    {
      title: 'Vertical Market Entry Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for discovering leads in new vertical markets, including ICP adaptation and channel selection.',
      sections: 13,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-10',
      version: '1.8.0',
      sectionList: [
        { title: '1. Vertical Selection Criteria', description: 'How to evaluate whether a vertical is worth entering (TAM, ICP clarity, channel availability).' },
        { title: '2. ICP Adaptation', description: 'How to adapt the ICP definition for a new vertical (industry, size, geography).' },
        { title: '3. Channel Selection for New Verticals', description: 'Which channels work best for which verticals (e.g. GitHub for dev tools, LinkedIn for enterprise).' },
        { title: '4. Query Variation Tuning', description: 'How to tune the 4+ query variations for vertical-specific terminology.' },
        { title: '5. Pilot Campaign Design', description: 'How to design a 50-lead pilot campaign to validate the vertical.' },
        { title: '6. Success Metrics for Pilots', description: 'What KPIs define a successful pilot (lead quality, reply rate, meeting rate).' },
        { title: '7. Scaling from Pilot to Full', description: 'How to scale from 50 to 500+ leads once the pilot succeeds.' },
        { title: '8. Channel Mix Optimization', description: 'How to optimize the channel mix based on pilot data.' },
        { title: '9. Competitive Intelligence Integration', description: 'How to use competitor data to refine ICP and channel selection.' },
        { title: '10. Localization Considerations', description: 'Language, currency, timezone, and cultural nuances for international verticals.' },
        { title: '11. Compliance Check', description: 'Regulatory considerations (GDPR, CCPA, industry-specific).' },
        { title: '12. Reporting for New Verticals', description: 'Custom report templates for vertical launch progress.' },
        { title: '13. Sunset Criteria', description: 'When to abandon a vertical that isn\'t performing.' },
      ],
    },
    {
      title: 'ICP Scoring Model Reference',
      category: 'Reference',
      summary:
        'Complete specification of the 100-point ICP scoring model across 5 dimensions with disqualifiers and boosters.',
      sections: 14,
      owner: 'Growth Engineering',
      lastReviewed: '2026-08-22',
      version: '4.2.1',
      sectionList: [
        { title: '1. Model Overview', description: 'The 5-dimension weighted model: firmographic 25%, intent 20%, reachability 20%, strategic 20%, data completeness 15%.' },
        { title: '2. Firmographic Dimension', description: 'Industry match, company size match, geography match, revenue match.' },
        { title: '3. Intent Dimension', description: 'Trigger events, hiring signals, technology adoption signals, content engagement.' },
        { title: '4. Reachability Dimension', description: 'Email availability, phone availability, LinkedIn presence, key contact identification.' },
        { title: '5. Strategic Dimension', description: 'Market position, growth trajectory, partnership potential, strategic alignment.' },
        { title: '6. Data Completeness Dimension', description: 'Percentage of 60+ fields populated; bonus for verified fields.' },
        { title: '7. Disqualifiers', description: 'Existing customer, competitor employee, excluded industry, below minimum size.' },
        { title: '8. Boosters', description: 'Inbound inquiry (+15), referral (+10), analyst mention (+5).' },
        { title: '9. Tier Thresholds', description: 'super_hot 88+, hot 70-87, warm 40-69, cold < 40.' },
        { title: '10. Scoring Formula', description: 'The exact weighted-sum formula and edge cases.' },
        { title: '11. Recalculation Triggers', description: 'When a lead\'s score is recomputed (enrichment complete, new trigger event, manual).' },
        { title: '12. Score Decay', description: 'How scores decay over time if no new signals arrive.' },
        { title: '13. Audit Trail Requirements', description: 'What must be logged for each scoring event.' },
        { title: '14. Tuning Procedure', description: 'How the model is tuned monthly based on conversion data.' },
      ],
    },
    {
      title: 'Scout Onboarding & Research Training',
      category: 'Training',
      summary:
        'Comprehensive onboarding for the Scout agent covering research methodology, tools, and quality standards.',
      sections: 14,
      owner: 'Agent Operations',
      lastReviewed: '2026-07-22',
      version: '2.0.0',
      sectionList: [
        { title: '1. Welcome & Mission', description: 'Scout\'s mission: find the highest-quality candidates matching the ICP across 17+ channels.' },
        { title: '2. Channel Inventory', description: 'Complete walkthrough of every supported channel and its quirks.' },
        { title: '3. Query Generation Workshop', description: 'Hands-on practice generating query variations for sample campaigns.' },
        { title: '4. Channel Health Monitoring', description: 'How to read the per-channel health dashboard.' },
        { title: '5. Dedup Discipline', description: 'Why dedup matters and how to spot dedup failures.' },
        { title: '6. Fallback Activation', description: 'When and how the 3-tier fallback chain activates.' },
        { title: '7. Industry Classification Practice', description: 'Practice classifying 50 sample leads across 28 industries.' },
        { title: '8. Hint Object Authoring', description: 'How to write high-quality hint objects for downstream enrichment.' },
        { title: '9. Quality Spot-Checks', description: 'How to perform the weekly quality spot-check on a sample of leads.' },
        { title: '10. Common Failure Modes', description: 'Walkthroughs of 5 representative failure scenarios.' },
        { title: '11. Communication Style', description: 'How Scout reports progress and failures to the orchestrator.' },
        { title: '12. Shadow Shifts', description: '2-day shadow program observing a senior Scout instance.' },
        { title: '13. Certification Exam', description: '25-question exam covering query generation, channel selection, and dedup.' },
        { title: '14. Continuing Education', description: 'Monthly brown-bag on new channels and query techniques.' },
      ],
    },
    {
      title: 'International Channel Playbook',
      category: 'Playbook',
      summary:
        'How to use international channels (Weibo, V2EX, Xueqiu, Bilibili, XiaoHongShu, Douyin, WeChat Articles, Xiaoyuzhou) effectively for non-US markets.',
      sections: 8,
      owner: 'International Growth',
      lastReviewed: '2026-08-15',
      version: '1.3.0',
      sectionList: [
        { title: '1. Channel Inventory by Region', description: 'Which channels work for which regions (China, Japan, Korea, SEA).' },
        { title: '2. Language Considerations', description: 'How query variations are localized for non-English markets.' },
        { title: '3. Cultural Nuances', description: 'Business etiquette differences that affect ICP definition.' },
        { title: '4. Compliance Requirements', description: 'GDPR, PIPL, and other regional data protection regulations.' },
        { title: '5. Authentication Setup', description: 'How to obtain API keys for international channels.' },
        { title: '6. Rate Limit Variations', description: 'Per-channel rate limits and how they differ from US channels.' },
        { title: '7. Result Schema Variations', description: 'How international channel results differ in schema and quality.' },
        { title: '8. Quality Benchmarks', description: 'Expected lead quality per international channel.' },
      ],
    },
  ],

  tools: [
    {
      name: 'DuckDuckGo HTML Search',
      type: 'API',
      description:
        'Primary web search via html.duckduckgo.com/html/ — no API key needed. Returns ~10 organic results per query with title, URL, and snippet.',
      status: 'connected',
      endpoint: 'https://html.duckduckgo.com/html/',
      authMethod: 'none (anonymous)',
      rateLimit: '30 req/min',
      config: [
        { key: 'method', value: 'POST' },
        { key: 'form_data', value: 'q={{query}}' },
        { key: 'timeout', value: '8s' },
        { key: 'user_agent', value: 'Mozilla/5.0 (compatible; LeadReachBot/1.0)' },
      ],
      schemaExample:
        'INPUT: {"q":"list of dev tools companies"} → OUTPUT: [{"title":"20 Dev Tools Companies to Watch","url":"https://example.com/devtools","snippet":"A curated list of..."}]',
      failureMode: 'Returns empty results on 429; falls back to Tier 2.',
    },
    {
      name: 'z-ai web_search',
      type: 'SDK',
      description:
        'Fallback semantic web search via z-ai-web-dev-sdk. 10 query variations searched in parallel. Returns ranked results with relevance scores.',
      status: 'connected',
      endpoint: 'z-ai-web-dev-sdk.web_search',
      authMethod: 'API key (ZAI_API_KEY)',
      rateLimit: '100 req/min',
      config: [
        { key: 'variations', value: '10' },
        { key: 'parallel', value: 'true' },
        { key: 'timeout', value: '10s' },
      ],
      schemaExample:
        'INPUT: {"query":"AI observability platforms"} → OUTPUT: [{"title":"WhyLabs","url":"https://whylabs.ai","snippet":"AI observability...","relevance":0.92}]',
      failureMode: 'On 429, backs off to half rate for 5 minutes.',
    },
    {
      name: 'Exa Semantic Search',
      type: 'API',
      description:
        'Neural search engine for meaning-based company discovery. Finds companies that match concepts even if they don\'t use the same keywords. Requires EXA_API_KEY.',
      status: 'available',
      endpoint: 'https://api.exa.ai/search',
      authMethod: 'API key (EXA_API_KEY)',
      rateLimit: '100 req/min (free tier), 1000 req/min (paid)',
      config: [
        { key: 'use_autoprompt', value: 'true' },
        { key: 'num_results', value: '10' },
        { key: 'include_domains', value: '[]' },
        { key: 'exclude_domains', value: '[]' },
      ],
      schemaExample:
        'INPUT: {"query":"companies building AI observability tools","num_results":10} → OUTPUT: [{"title":"Arize AI","url":"https://arize.com","score":0.94,"text":"Arize helps teams..."}]',
      failureMode: 'On 429, token bucket halved for 5 minutes; persistent 429s disable channel for 15 min.',
    },
    {
      name: 'LinkedIn Sales Navigator',
      type: 'API',
      description:
        'Professional network search for company and people discovery. Returns company size, industry, HQ, employee list. Requires LinkedIn credentials.',
      status: 'needs-setup',
      endpoint: 'https://api.linkedin.com/v2/search',
      authMethod: 'OAuth2 (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET)',
      rateLimit: '500 req/day (basic), 5000 req/day (Sales Navigator)',
      config: [
        { key: 'oauth_flow', value: 'authorization_code' },
        { key: 'scope', value: 'r_organization_social,r_basicprofile' },
        { key: 'timeout', value: '10s' },
      ],
      schemaExample:
        'INPUT: {"keywords":"dev tools","company_size":"50-500"} → OUTPUT: [{"name":"Vercel","industry":"Software","size":"200-500","hq":"San Francisco"}]',
      failureMode: 'Cookie expiry triggers re-auth flow; user notified.',
    },
    {
      name: 'GitHub Search API',
      type: 'API',
      description:
        'Repository search revealing tech stack and engineering activity. Useful for discovering dev-tools companies.',
      status: 'connected',
      endpoint: 'https://api.github.com/search/repositories',
      authMethod: 'Personal access token (GITHUB_TOKEN)',
      rateLimit: '30 req/min (authenticated)',
      config: [
        { key: 'sort', value: 'stars' },
        { key: 'order', value: 'desc' },
        { key: 'per_page', value: '30' },
      ],
      schemaExample:
        'INPUT: {"q":"language:python stars:>1000"} → OUTPUT: [{"full_name":"langchain-ai/langchain","html_url":"https://github.com/langchain-ai/langchain","stargazers_count":92000}]',
      failureMode: 'On 403 (rate limit), falls back to web scraping GitHub search results.',
    },
    {
      name: 'Reddit Search API',
      type: 'API',
      description:
        'Discussion search for community engagement signals. Returns posts and comments matching the query.',
      status: 'available',
      endpoint: 'https://oauth.reddit.com/search',
      authMethod: 'OAuth2 (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET)',
      rateLimit: '60 req/min',
      config: [
        { key: 'limit', value: '25' },
        { key: 'sort', value: 'relevance' },
        { key: 't', value: 'month' },
      ],
      schemaExample:
        'INPUT: {"q":"best AI observability tool","limit":25} → OUTPUT: [{"title":"Best AI observability tool?","subreddit":"MLOps","ups":42,"url":"..."}]',
      failureMode: 'On 401, key rotation needed; channel disabled until fixed.',
    },
    {
      name: 'OpenStreetMap Overpass API',
      type: 'API',
      description:
        'Place discovery for location-based lead generation (restaurants, gyms, salons, retail). Returns OSM nodes with name, address, coordinates.',
      status: 'connected',
      endpoint: 'https://overpass-api.de/api/interpreter',
      authMethod: 'none (open data)',
      rateLimit: '10000 queries/day per IP',
      config: [
        { key: 'timeout', value: '15s' },
        { key: 'mirror_fallback', value: 'https://overpass.kumi.systems/api/interpreter' },
      ],
      schemaExample:
        'INPUT: {"query":"[out:json];node[amenity=restaurant](around:5000,40.7,-74.0);out;"} → OUTPUT: [{"type":"node","id":123,"lat":40.71,"lon":-74.01,"tags":{"name":"Joe\'s Pizza","amenity":"restaurant"}}]',
      failureMode: 'Primary mirror timeouts fall back to kumi.systems mirror.',
    },
    {
      name: 'Twitter/X Search API',
      type: 'API',
      description:
        'Real-time tweet search for trigger events (funding announcements, product launches, hiring). Requires X API credentials.',
      status: 'available',
      endpoint: 'https://api.twitter.com/2/tweets/search/recent',
      authMethod: 'Bearer token (TWITTER_BEARER_TOKEN)',
      rateLimit: '450 req/15min (basic)',
      config: [
        { key: 'max_results', value: '100' },
        { key: 'tweet_fields', value: 'created_at,author_id,public_metrics' },
      ],
      schemaExample:
        'INPUT: {"query":"Series B funding announcement"} → OUTPUT: [{"id":"123","text":"Excited to announce our Series B...","created_at":"2026-09-01T10:00:00Z"}]',
      failureMode: 'On 429, channel disabled for 15 min; user notified.',
    },
    {
      name: 'YouTube Data API',
      type: 'API',
      description:
        'Video search for company channels and product demos. Useful for B2C and creator-economy ICPs.',
      status: 'connected',
      endpoint: 'https://www.googleapis.com/youtube/v3/search',
      authMethod: 'API key (YOUTUBE_API_KEY)',
      rateLimit: '10000 units/day',
      config: [
        { key: 'part', value: 'snippet' },
        { key: 'type', value: 'channel,video' },
        { key: 'maxResults', value: '25' },
      ],
      schemaExample:
        'INPUT: {"q":"AI tutorial","type":"channel"} → OUTPUT: [{"snippet":{"title":"3Blue1Brown","channelId":"UCYO_jab_es...","description":"Math..."}]})',
      failureMode: 'On quota exhaustion, channel disabled until next day.',
    },
    {
      name: 'RSS Feed Reader',
      type: 'API',
      description:
        'Subscribes to and monitors RSS feeds from industry publications, company blogs, and news sources for real-time intelligence.',
      status: 'connected',
      endpoint: 'internal://rss_reader',
      authMethod: 'none',
      rateLimit: '1000 feeds/hour',
      config: [
        { key: 'poll_interval', value: '15min' },
        { key: 'parser', value: 'rss-parser (Node)' },
        { key: 'cache_ttl', value: '1h' },
      ],
      schemaExample:
        'INPUT: {"feed_url":"https://techcrunch.com/feed/"} → OUTPUT: [{"title":"OpenAI raises...","link":"...","pubDate":"2026-09-01","content":"..."}]',
      failureMode: 'Malformed feeds are skipped; logged for review.',
    },
  ],

  metrics: [
    {
      label: 'Leads per Campaign',
      value: '10–30',
      unit: 'leads',
      benchmark: 'Avg: 15 per run',
      trend30d: '+2 leads',
      description: 'Average number of unique leads discovered per campaign run.',
    },
    {
      label: 'Search Channels Active',
      value: '17+',
      unit: 'channels',
      benchmark: 'Target: all configured',
      trend30d: '+2 channels',
      description: 'Number of channels currently enabled and healthy.',
    },
    {
      label: 'Discovery Latency (p50)',
      value: '42',
      unit: 'seconds',
      benchmark: 'Target: < 60s',
      trend30d: '-3s',
      description: 'Median wall-clock time from query generation to lead creation.',
    },
    {
      label: 'Discovery Latency (p99)',
      value: '88',
      unit: 'seconds',
      benchmark: 'Target: < 120s',
      trend30d: '-6s',
      description: '99th percentile discovery latency; reflects slowest 1% of runs.',
    },
    {
      label: 'Deduplication Rate',
      value: '100',
      unit: '%',
      benchmark: 'Target: 100%',
      trend30d: 'stable',
      description: 'Percentage of duplicate URLs successfully detected and skipped.',
    },
    {
      label: 'Fallback Trigger Rate',
      value: '< 5',
      unit: '%',
      benchmark: 'Target: < 10%',
      trend30d: '-1.2%',
      description: 'Percentage of campaigns that required Tier 2 or Tier 3 fallback.',
    },
    {
      label: 'Channel Health Score',
      value: '96.4',
      unit: '%',
      benchmark: 'Target: > 90%',
      trend30d: '+0.8%',
      description: 'Weighted average health across all active channels.',
    },
    {
      label: 'Lead Quality Score (downstream)',
      value: '7.2',
      unit: '/10',
      benchmark: 'Target: > 6.5',
      trend30d: '+0.3',
      description: 'Average quality score assigned by the Lead Qualification agent to Scout\'s discoveries.',
    },
    {
      label: 'Token Cost per Lead',
      value: '$0.012',
      unit: 'USD',
      benchmark: 'Target: < $0.02',
      trend30d: '-$0.002',
      description: 'Average LLM + API cost incurred per lead discovered.',
    },
    {
      label: 'API Error Rate',
      value: '0.8',
      unit: '%',
      benchmark: 'Target: < 2%',
      trend30d: '-0.3%',
      description: 'Percentage of API calls that returned an error (4xx or 5xx).',
    },
  ],

  config: {
    model: 'glm-4.6v-flash',
    temperature: 0.4,
    maxTokens: 4096,
    scheduleType: 'always_on',
    maxConcurrentTasks: 5,
    priority: 'high',
    reasoningEffort: 'medium',
    topP: 0.9,
    presencePenalty: 0,
    frequencyPenalty: 0,
    stopSequences: [],
    responseFormat: 'json_schema',
    jsonSchema:
      '{"type":"object","properties":{"candidates":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"url":{"type":"string"},"snippet":{"type":"string"},"source_channel":{"type":"string"},"industry_hint":{"type":"string"},"confidence":{"type":"number"}}}},"meta":{"type":"object","properties":{"total_found":{"type":"integer"},"deduped":{"type":"integer"},"channels_used":{"type":"array","items":{"type":"string"}}}}}}',
    timeout: '60s',
    retryPolicy: '3 retries per channel with exponential backoff',
    fallbackModel: 'glm-4.5-air',
    systemPromptSummary:
      'You are SCOUT, the Prospect Discovery Agent. You search 17+ channels simultaneously to find companies matching the ICP. You generate query variations, execute multi-pass search, deduplicate by URL, and create Lead records. You handle fallback gracefully and never return 0 results.',
    systemPromptFull: `You are SCOUT, the Prospect Discovery Agent of the LeadReach AI platform. Your mission is to find the highest-quality candidate companies matching a given Ideal Customer Profile (ICP) across 17+ online channels — fast, comprehensively, and without duplicates.

# IDENTITY & MISSION
You are the front of the lead-generation pipeline. Everything downstream (enrichment, scoring, outreach) depends on the quality and breadth of the candidates you discover. A missed candidate is a missed opportunity; a duplicate candidate wastes downstream budget. You take this responsibility seriously.

# CORE OPERATING LOOP

1. QUERY GENERATION — Receive the campaign definition (name, ICP, target channels). Extract the topic from the campaign name. Generate 4+ query variations using templates: "list of {{topic}}", "top {{topic}} companies", "best {{topic}}", "{{topic}} directory", "{{topic}} 2026". For non-English campaigns, localize the variations.

2. CHANNEL SELECTION — Based on the ICP and campaign settings, select which channels to query. Defaults: DuckDuckGo, z-ai web_search, Exa (if key present), GitHub (for dev-tools ICPs), Reddit (for community signals), RSS (for news monitoring). LinkedIn, Twitter/X, and international channels require explicit setup.

3. PARALLEL DISPATCH — Dispatch searches to all selected channels in parallel using Promise.allSettled. Each channel has its own rate limiter and timeout (default 15s). Do not block on slow channels; collect results as they arrive and abandon channels that exceed the timeout.

4. RESULT NORMALIZATION — Map each channel's result schema to the canonical candidate schema: {name, url, snippet, source_channel, industry_hint, confidence}. Drop candidates missing required fields (name or url).

5. DEDUPLICATION — Normalize each URL (lowercase host, strip "www.", strip tracking params like utm_*, gclid, fbclid). Compute SHA-256 hash of normalized URL. Check against the campaign_dedup_index. New hashes are inserted; duplicates are logged and skipped.

6. INDUSTRY FILTERING — Apply the 28-industry keyword matcher to each candidate. Drop candidates whose detected industry is not in the campaign's industry allowlist. (This is a coarse filter; Forge will refine later with SIC/NAICS codes.)

7. LEAD CREATION — For each surviving candidate, create a Lead record in Postgres with required fields populated (name, website, source_channel, campaign_id, hint object). Emit lead.created event for downstream agents. Update campaign counter atomically.

8. FALLBACK ACTIVATION — If primary tier (DuckDuckGo) returned < 5 candidates, activate Tier 2 (z-ai web_search). If Tier 2 also returns < 5, activate Tier 3 (load existing leads from prior runs on the same campaign). If all 3 tiers return 0, mark campaign "discovery_failed" and notify user with diagnostic info.

# QUERY VARIATION STRATEGY
The choice of query variations is the single biggest lever on lead yield. Always generate at least 4 variations; for ambiguous topics, generate up to 8. Templates:
- "list of {{topic}}" — finds curated lists and directories.
- "top {{topic}} companies" — finds ranking articles and "best of" posts.
- "best {{topic}}" — finds review aggregation pages.
- "{{topic}} directory" — finds industry-specific directories.
- "{{topic}} 2026" — finds recent articles and announcements.
- "alternative to {{competitor}}" — finds comparison pages that reveal alternatives.
- "site:linkedin.com/company {{topic}}" — finds LinkedIn company pages directly (when LinkedIn channel is enabled).

# DEDUPLICATION DISCIPLINE
Dedup is non-negotiable. A duplicate lead wastes enrichment budget and creates confusion downstream. Rules:
- Always normalize URLs before hashing.
- Strip query parameters that don't affect identity (utm_*, gclid, fbclid, ref, source).
- Preserve query parameters that DO affect identity (e.g. /companies/acme vs /companies/acme/jobs).
- If two channels return the same URL, keep the one with richer metadata (longer snippet, more fields).
- Cross-campaign dedup is OFF by default; the same company can be a lead in multiple campaigns.

# FALLBACK CHAIN
The fallback chain exists to ensure you NEVER return 0 results — even when primary channels fail. The chain is:
- Tier 1: DuckDuckGo HTML search (free, anonymous).
- Tier 2: z-ai web_search (semantic, 10 query variations in parallel).
- Tier 3: Existing leads from prior runs on the same campaign.

If all 3 tiers return 0, the campaign is marked "discovery_failed" and the user is notified with diagnostic info (which channels failed, error messages, suggested fixes).

# CHANNEL HEALTH
You track per-channel health metrics: success rate, p99 latency, error rate. Channels below 80% success rate or above 8s p99 latency are auto-disabled for 15 minutes and re-tested. Health metrics are exposed via /api/agents/prospect-discovery/health.

# RATE LIMIT MANAGEMENT
Each channel has its own rate limiter (token bucket). On 429:
- Halve the rate for 5 minutes (penalty box).
- After 3 429s in 5 minutes, disable the channel for 15 minutes.
- Rate limiter state is persisted; restarts do not lose penalty state.

# COMMUNICATION STYLE
When reporting to the orchestrator, be specific and quantitative. Use this template:
"Discovered {{count}} candidates across {{channel_count}} channels in {{latency}}s. {{dedup_count}} duplicates removed. {{final_count}} leads created. {{fallback_info}}."

When reporting failures, include the channel, the error code, and the recovery action:
"Channel {{channel}} failed with {{error_code}}. Recovery action: {{action}}. Channel health now at {{health}}%."

# FAILURE MODES TO AVOID
- Single-channel dependency: never rely on one channel. Even if DuckDuckGo returns enough leads, still query Exa and z-ai to validate coverage.
- Premature termination: do not stop after the first channel returns results. Wait for all channels (or their timeouts) before deduping.
- Lazy dedup: do not skip dedup "just this once" because the count looks low. Always dedup.
- Industry misclassification: if the keyword matcher is uncertain, err on the side of inclusion and let Forge refine. False negatives are worse than false positives here.

# FINAL GUARDRAILS
1. Never return 0 results without activating all 3 fallback tiers.
2. Never create a lead without a normalized, hashed URL.
3. Never block on a single channel for more than 15 seconds.
4. Never bypass the rate limiter, even if the channel "looks fine".
5. Always emit lead.created for every new lead so downstream agents can react.
6. Always update the campaign counter atomically (use a transaction).
7. Always attach a hint object to each lead (source_channel, search_snippet, confidence).

You are SCOUT. You move fast, you cover ground, you dedup ruthlessly, and you never leave the user with an empty result.`,
  },

  channels: ['Exa Search', 'Web', 'LinkedIn', 'GitHub', 'Twitter/X', 'Reddit', 'YouTube', 'RSS Feeds', 'Weibo', 'V2EX', 'Xueqiu', 'Bilibili', 'OSM Overpass'],
  dependencies: ['orchestrator'],

  faqs: [
    {
      question: 'How many leads can Scout find per campaign?',
      answer:
        'Typically 10-30 leads per campaign run, depending on the query specificity and channel availability. Multi-pass discovery (generating "list of X", "top X", "best X companies" variations) finds 3x more leads than single-query search. Re-running the pipeline finds additional leads as new content appears on the web.',
    },
    {
      question: 'What happens when DuckDuckGo returns 0 results?',
      answer:
        'Scout has a 3-tier fallback chain: DuckDuckGo (primary) → z-ai web_search (fallback) → existing leads from prior runs (tertiary). Even if both search tiers return 0 new candidates, the pipeline loads existing leads from prior runs on the same campaign, so you always see your leads instead of a "No candidates found" message.',
    },
    {
      question: 'Can Scout search LinkedIn without API keys?',
      answer:
        'LinkedIn requires authentication setup. Without credentials, Scout skips LinkedIn and uses the other 16+ channels. Setting up LinkedIn credentials unlocks the most valuable B2B discovery channel (company pages, employee counts, industries).',
    },
    {
      question: 'How does Scout handle rate limits?',
      answer:
        'Each channel has its own token bucket rate limiter. On 429, the rate is halved for 5 minutes (penalty box). After 3 429s in 5 minutes, the channel is disabled for 15 minutes. Rate limiter state is persisted so restarts do not lose penalty state.',
    },
    {
      question: 'Can Scout discover local businesses (restaurants, gyms, etc.)?',
      answer:
        'Yes — Scout uses the OpenStreetMap Overpass API to discover businesses by category within a geographic bounding box or radius. Ideal for local business lead generation. No API key required (Overpass is open data); rate limited to 10,000 queries/day per IP.',
    },
  ],

  userPromptTemplates: [
    {
      name: 'Standard discovery request',
      useCase: 'Orchestrator asks Scout to discover leads for a campaign.',
      template: `Discover leads for campaign {{campaignId}}.

ICP:
- Industry: {{industry}}
- Company size: {{minEmployees}}–{{maxEmployees}}
- Geography: {{geography}}

Channels to use: {{channels}}
Query variations: {{variations | "auto"}}
Target lead count: {{targetLeads}}

Return the list of discovered candidates with name, URL, snippet, source channel, and confidence.`,
      variables: ['campaignId', 'industry', 'minEmployees', 'maxEmployees', 'geography', 'channels', 'variations', 'targetLeads'],
    },
    {
      name: 'Place discovery (geo-based)',
      useCase: 'User wants to discover local businesses within a geographic area.',
      template: `Discover places near {{centerLat}},{{centerLon}} within {{radiusMeters}} meters.

Category: {{category | "restaurant" | "gym" | "salon" | "retail" | "all"}}
Country: {{country}}

Use the OpenStreetMap Overpass API. Return name, address, coordinates, and opening hours for each place.`,
      variables: ['centerLat', 'centerLon', 'radiusMeters', 'category', 'country'],
    },
    {
      name: 'Channel-specific discovery',
      useCase: 'User wants to discover leads using a specific channel only.',
      template: `Discover leads using ONLY the {{channel}} channel.

Query: {{query}}
Max results: {{maxResults}}

Return the list of candidates. If the channel is unavailable or returns 0 results, return an empty list (do NOT activate fallback).`,
      variables: ['channel', 'query', 'maxResults'],
    },
    {
      name: 'Channel health query',
      useCase: 'Operator asks about the health of discovery channels.',
      template: `Report channel health.

Window: {{window | "now" | "last_1h" | "last_24h"}}
Detail: {{detail | "summary" | "per_channel"}}

For each channel, return: success rate, p99 latency, error rate, current status (enabled/disabled/penalty_box).`,
      variables: ['window', 'detail'],
    },
    {
      name: 'Rediscovery request',
      useCase: 'User wants to re-run discovery to find new leads since the last run.',
      template: `Rediscover leads for campaign {{campaignId}}.

Since: {{sinceDate}}
New channels to try: {{newChannels | "none"}}
Skip existing leads: true (default)

Return only leads not already in the campaign. Apply the 3-tier fallback chain if primary channels return 0.`,
      variables: ['campaignId', 'sinceDate', 'newChannels'],
    },
  ],

  toolCallExamples: [
    {
      tool: 'DuckDuckGo HTML Search',
      scenario: 'Primary search for "list of AI observability companies".',
      request: `POST https://html.duckduckgo.com/html/
Content-Type: application/x-www-form-urlencoded
User-Agent: Mozilla/5.0 (compatible; LeadReachBot/1.0)

q=list+of+AI+observability+companies`,
      response: `<!DOCTYPE html>
...
<div class="result">
  <a class="result__a" href="https://arize.com">Arize AI</a>
  <a class="result__snippet" href="https://arize.com">Arize AI is a leading observability platform for machine learning...</a>
</div>
<div class="result">
  <a class="result__a" href="https://whylabs.ai">WhyLabs</a>
  <a class="result__snippet" href="https://whylabs.ai">WhyLabs provides AI observability and data quality monitoring...</a>
</div>
...`,
      notes: 'HTML is parsed with a Cheerio-based extractor. Each .result div becomes one candidate.',
    },
    {
      tool: 'Exa Semantic Search',
      scenario: 'Semantic search for companies building AI observability tools.',
      request: `POST https://api.exa.ai/search
Authorization: Bearer {{EXA_API_KEY}}
Content-Type: application/json

{
  "query": "companies building AI observability tools",
  "num_results": 10,
  "use_autoprompt": true
}`,
      response: `{
  "results": [
    { "title": "Arize AI", "url": "https://arize.com", "score": 0.94, "text": "Arize helps teams..." },
    { "title": "WhyLabs", "url": "https://whylabs.ai", "score": 0.91, "text": "WhyLabs provides..." },
    { "title": "Fiddler Labs", "url": "https://fiddler.ai", "score": 0.88, "text": "Fiddler offers..." }
  ]
}`,
      notes: 'Results below score 0.7 are filtered out as low-confidence.',
    },
    {
      tool: 'OpenStreetMap Overpass API',
      scenario: 'Discovering restaurants within 5km of Times Square, NYC.',
      request: `POST https://overpass-api.de/api/interpreter
Body (Overpass QL):

[out:json][timeout:15];
node[amenity=restaurant](around:5000,40.7589,-73.9851);
out body;`,
      response: `{
  "elements": [
    { "type": "node", "id": 123456789, "lat": 40.7612, "lon": -73.9818, "tags": { "name": "Joe's Pizza", "amenity": "restaurant", "cuisine": "pizza" } },
    { "type": "node", "id": 123456790, "lat": 40.7550, "lon": -73.9870, "tags": { "name": "Carmine's", "amenity": "restaurant", "cuisine": "italian" } }
  ]
}`,
      notes: 'Primary mirror timeouts fall back to https://overpass.kumi.systems/api/interpreter.',
    },
  ],

  examples: [
    {
      scenario: 'Discovering dev-tools companies for a B2B SaaS campaign.',
      input: `Discover leads for campaign c_412. ICP: dev-tools companies, 50-500 employees, US-based, Series A or later. Channels: DuckDuckGo, Exa, GitHub, Reddit. Target 20 leads.`,
      reasoning: `Topic extracted: "dev-tools companies". 4 query variations generated: "list of dev tools companies", "top dev tools companies", "best dev tools", "dev tools directory". Dispatched in parallel to 4 channels. DuckDuckGo returns 12 results, Exa returns 8, GitHub returns 5 (matching repositories with company websites), Reddit returns 3 discussion threads (extracting mentioned companies). Total raw: 28 candidates. After dedup by canonical URL: 22 unique. After industry filter (must match dev-tools): 21 survive. All 21 created as Lead records with hint objects.`,
      output: `{
  "campaign_id": "c_412",
  "candidates_found": 28,
  "deduped": 6,
  "filtered_by_industry": 1,
  "leads_created": 21,
  "channels_used": ["DuckDuckGo", "Exa", "GitHub", "Reddit"],
  "latency_seconds": 38,
  "hint_examples": [
    { "name": "Vercel", "url": "https://vercel.com", "source_channel": "Exa", "confidence": 0.92 },
    { "name": "Linear", "url": "https://linear.app", "source_channel": "DuckDuckGo", "confidence": 0.85 }
  ]
}`,
      outcome: '21 leads created. Lead Qualification agent (Judge) later marked 6 as hot and 9 as warm based on enriched data.',
    },
    {
      scenario: 'Fallback activation when primary channels return empty.',
      input: `Discover leads for campaign c_415. ICP: "European fintech startups". Channels: DuckDuckGo, Exa, z-ai web_search. Target 15 leads.`,
      reasoning: `DuckDuckGo returned 0 results (rare but happens for very narrow queries). Exa returned 3 (below threshold of 5). Activating Tier 2 fallback: z-ai web_search with 10 query variations searched in parallel. z-ai returns 14 candidates. After dedup: 12 unique. After industry filter (must match fintech): 11 survive. 11 leads created. Tier 3 not needed.`,
      output: `{
  "campaign_id": "c_415",
  "fallback_activated": "tier_2",
  "fallback_reason": "primary returned 3 candidates (below threshold 5)",
  "tier_1_count": 3,
  "tier_2_count": 14,
  "tier_3_count": 0,
  "candidates_found": 17,
  "deduped": 5,
  "filtered_by_industry": 1,
  "leads_created": 11,
  "channels_used": ["DuckDuckGo", "Exa", "z-ai web_search"],
  "latency_seconds": 52
}`,
      outcome: '11 leads created. User notified of fallback activation via UI banner.',
    },
    {
      scenario: 'Place discovery for local restaurant leads.',
      input: `Discover restaurants within 5km of Times Square, NYC (40.7589, -73.9851).`,
      reasoning: `Geographic discovery requires the Overpass API. Building Overpass QL query: node[amenity=restaurant](around:5000,40.7589,-73.9851). Dispatching to Overpass. Returns 47 OSM nodes. Normalizing to candidate schema with name, address (from tags.addr:street etc.), coordinates, opening hours (from tags.opening_hours). 47 candidates, 0 duplicates (all unique OSM nodes). 47 leads created.`,
      output: `{
  "campaign_id": "c_418",
  "place_count": 47,
  "leads_created": 47,
  "channel": "OpenStreetMap Overpass",
  "latency_seconds": 12,
  "examples": [
    { "name": "Joe's Pizza", "address": "233 W 42nd St", "cuisine": "pizza" },
    { "name": "Carmine's", "address": "200 W 44th St", "cuisine": "italian" }
  ]
}`,
      outcome: '47 restaurant leads created. Owner was a field-sales team targeting the Times Square area.',
    },
  ],

  guardrails: [
    {
      rule: 'Never return 0 results without activating all 3 fallback tiers.',
      rationale: 'An empty result is almost always a fixable failure; the fallback chain exists to handle it.',
      enforcement: 'A post-condition check fails the task if 0 leads are created and any tier was not tried.',
      severity: 'block',
    },
    {
      rule: 'Never create a lead without a normalized, hashed URL.',
      rationale: 'Without dedup, downstream enrichment wastes budget and creates duplicate outreach.',
      enforcement: 'Lead creation requires a non-empty url_hash column; DB constraint rejects otherwise.',
      severity: 'block',
    },
    {
      rule: 'Never block on a single channel for more than 15 seconds.',
      rationale: 'Slow channels should not delay the entire pipeline; partial results are valuable.',
      enforcement: 'Per-channel timeout of 15s enforced via Promise.race with a timeout.',
      severity: 'block',
    },
    {
      rule: 'Never bypass the rate limiter, even if the channel "looks fine".',
      rationale: 'Bypassing rate limits leads to 429s and channel disablement.',
      enforcement: 'All channel calls go through the rate limiter middleware; no bypass path exists.',
      severity: 'block',
    },
    {
      rule: 'Always emit lead.created for every new lead.',
      rationale: 'Downstream agents (Forge, Judge) subscribe to this event to trigger enrichment and scoring.',
      enforcement: 'A post-creation hook verifies the event was emitted; failures are retried.',
      severity: 'block',
    },
    {
      rule: 'Always update the campaign counter atomically.',
      rationale: 'Non-atomic updates can cause counter drift under concurrent discovery runs.',
      enforcement: 'Counter update is in the same DB transaction as lead creation.',
      severity: 'block',
    },
    {
      rule: 'Always attach a hint object to each lead.',
      rationale: 'Hint objects help Forge prioritize which fields to extract first, improving enrichment quality.',
      enforcement: 'Lead creation requires a non-null hint object; DB constraint rejects otherwise.',
      severity: 'warn',
    },
  ],

  decisionMatrix: [
    {
      condition: 'DuckDuckGo returns 0 results for the primary query.',
      action: 'Activate Tier 2 fallback (z-ai web_search) with 10 query variations in parallel.',
      rationale: 'Tier 2 has different failure modes and broader coverage; it usually finds candidates when DuckDuckGo does not.',
      example: 'Query "European fintech startups Series A" returned 0 on DuckDuckGo but 14 on z-ai web_search.',
    },
    {
      condition: 'Channel returns 429 rate limit response.',
      action: 'Halve the channel\'s token bucket rate for 5 minutes (penalty box). After 3 429s in 5 minutes, disable channel for 15 minutes.',
      rationale: 'Backing off respects the upstream service and prevents cascading failures.',
      example: 'Exa returned 429 at 10:23:14. Rate halved to 50 req/min. Re-tested at 10:28:14; succeeded.',
    },
    {
      condition: 'Channel times out (> 15s).',
      action: 'Abandon the channel for this run; use partial results from other channels. Log the timeout.',
      rationale: 'A 15s timeout indicates upstream issues; blocking longer would slow the whole pipeline.',
      example: 'Reddit timed out at 15s on a campaign. 3 results from Reddit would have been available at 22s but were skipped.',
    },
    {
      condition: 'All 3 fallback tiers return 0 candidates.',
      action: 'Mark campaign "discovery_failed". Notify user with diagnostic info: channels tried, errors per channel, suggested fixes.',
      rationale: 'A complete failure requires human diagnosis; the user needs visibility.',
      example: 'Campaign for "Antarctic research stations" failed on all tiers. User notified that the ICP is too narrow.',
    },
    {
      condition: 'Duplicate URL detected during dedup.',
      action: 'Skip the candidate, log the duplicate (with source channel and original lead ID), increment dedup counter.',
      rationale: 'Duplicates waste downstream budget; skipping is mandatory.',
      example: 'Vercel returned by both DuckDuckGo and Exa. DuckDuckGo result kept (richer snippet); Exa result skipped.',
    },
    {
      condition: 'Candidate\'s detected industry is not in campaign allowlist.',
      action: 'Drop the candidate, log the drop reason.',
      rationale: 'Industry filtering reduces noise and downstream cost.',
      example: 'Candidate "Acme Hardware" (detected industry: retail) dropped from dev-tools campaign.',
    },
    {
      condition: 'Channel success rate drops below 80% over 1 hour.',
      action: 'Auto-disable channel for 15 minutes, emit SEV-3 alert, re-test after 15 minutes.',
      rationale: 'A failing channel degrades overall discovery quality; disabling prevents cascading issues.',
      example: 'Reddit channel success rate dropped to 72% after API changes. Auto-disabled; on-call investigated.',
    },
  ],

  failureModes: [
    {
      failure: 'All channels fail simultaneously (network partition).',
      detection: 'No channel returns results within 15s; Promise.allSettled resolves with all rejections.',
      mitigation: 'Activate Tier 3 (load existing leads from prior runs). If Tier 3 also empty, mark campaign "discovery_failed" and alert user.',
      recoveryTime: '< 30s to detect and notify.',
    },
    {
      failure: 'Exa API key is invalid or expired.',
      detection: 'Exa returns 401 Unauthorized.',
      mitigation: 'Disable Exa channel, log the error, notify user to refresh the key. Other channels continue.',
      recoveryTime: '< 5 minutes after user updates the key.',
    },
    {
      failure: 'Postgres write fails during lead creation.',
      detection: 'DB write returns error within 5s.',
      mitigation: '3 retries with 200ms backoff. If still failing, queue leads in-memory and flush when DB recovers.',
      recoveryTime: '< 60s after DB recovery.',
    },
    {
      failure: 'URL normalization produces inconsistent hashes (rare).',
      detection: 'QA spot-check finds duplicates in a sample.',
      mitigation: 'Add the missing normalization rule; re-run dedup on the affected campaign.',
      recoveryTime: '< 1 hour to push the fix.',
    },
    {
      failure: 'Overpass API mirror is down.',
      detection: 'Primary mirror returns 5xx or times out.',
      mitigation: 'Switch to backup mirror (https://overpass.kumi.systems/api/interpreter).',
      recoveryTime: '< 5 seconds (auto-failover).',
    },
  ],

  evaluationCases: [
    {
      id: 'eval_scout_001',
      input: 'Discover leads for campaign "dev-tools companies, US, 50-500 employees". Channels: DuckDuckGo, Exa, GitHub. Target 15 leads.',
      expectedOutput: '15+ leads created. At least 3 channels used. Dedup applied. Hint objects attached.',
      scoringCriteria: [
        'Leads created ≥ 15.',
        'Channels used ≥ 3.',
        'All leads have non-empty url_hash.',
        'All leads have hint object attached.',
        'Industry filter applied (all leads match dev-tools).',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_scout_002',
      input: 'Discover leads for an extremely narrow ICP that returns 0 results on DuckDuckGo.',
      expectedOutput: 'Tier 2 fallback activated. Either returns leads from Tier 2/3 or marks campaign "discovery_failed" with diagnostic info.',
      scoringCriteria: [
        'Tier 2 activated when Tier 1 returns < 5.',
        'Tier 3 activated when Tier 2 returns < 5.',
        'If all tiers return 0, campaign marked "discovery_failed".',
        'User notified with diagnostic info.',
      ],
      passThreshold: 4,
    },
    {
      id: 'eval_scout_003',
      input: 'Place discovery for restaurants within 2km of a specific coordinate.',
      expectedOutput: 'Returns OSM nodes with name, address, coordinates, opening hours. Uses Overpass API.',
      scoringCriteria: [
        'Overpass API used.',
        'At least 1 restaurant returned (or notification of empty area).',
        'Each result has name and coordinates.',
        'Latency < 20s.',
      ],
      passThreshold: 4,
    },
    {
      id: 'eval_scout_004',
      input: 'Channel returns 429 rate limit.',
      expectedOutput: 'Rate halved for 5 minutes. Channel not disabled on first 429. After 3 429s, channel disabled for 15 minutes.',
      scoringCriteria: [
        'Token bucket rate halved after first 429.',
        'Channel not disabled on first 429.',
        'After 3 429s in 5 min, channel disabled for 15 min.',
        'Audit log records the rate limit event.',
      ],
      passThreshold: 4,
    },
  ],
};
