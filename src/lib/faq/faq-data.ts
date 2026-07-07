/**
 * LeadReach — Comprehensive FAQ Data Layer
 * ==========================================
 * Industry-grade FAQ system organized by category, subcategory,
 * user persona, and funnel stage. Each FAQ item includes:
 *   - Rich, educational answer content (teaching approach)
 *   - Related FAQ cross-references
 *   - Knowledge base linkage
 *   - User persona tags (for personalized discovery)
 *   - Funnel stage (awareness, consideration, decision, retention)
 */

// ============================================================
// Types
// ============================================================

export type FunnelStage = 'awareness' | 'consideration' | 'decision' | 'retention' | 'onboarding';

export type UserPersona =
  | 'sales-leader'      // VP Sales, CRO, Head of Revenue
  | 'sdr-bdr'           // SDR/BDR individual contributor
  | 'revops'            // Revenue Operations, Sales Ops
  | 'founder'           // Startup founder, CEO
  | 'marketer'          // Demand gen, growth, ABM
  | 'it-admin'          // IT, security, compliance
  | 'procurement'       // Purchasing, vendor management
  | 'channel-partner';  // Agency, reseller, consultant

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  subcategory: string;
  personas: UserPersona[];
  funnelStage: FunnelStage;
  relatedIds?: string[];
  kbSlug?: string;     // link to knowledge base doc
  popular?: boolean;   // show in "Popular" filter
  new?: boolean;       // recently added badge
}

// ============================================================
// FAQ Items — Comprehensive Coverage
// ============================================================

export const FAQ_ITEMS: FAQItem[] = [
  // =================================================================
  // 1. GETTING STARTED (Onboarding & First Steps)
  // =================================================================
  {
    id: 'gs-001',
    question: 'What is LeadReach AI and how does it work?',
    answer: 'LeadReach AI is an agentic B2B lead generation platform that deploys 8 specialized AI agents — Atlas (Orchestrator), Scout (Discovery), Forge (Enrichment), Sage (Research), Judge (Qualification), Bard (Outreach), Flow (Pipeline), and Echo (Reporting) — to autonomously discover, enrich, qualify, and engage leads across 17+ channels. Think of it as hiring an entire SDR team that works 24/7: Atlas coordinates the workflow, Scout finds prospects matching your ICP, Forge enriches their profiles with firmographic and technographic data, Sage performs deep company research, Judge scores and qualifies each lead, Bard crafts personalized outreach messages, Flow manages pipeline stages and follow-ups, and Echo generates analytics and campaign insights. The entire pipeline runs end-to-end with minimal manual intervention — you define your Ideal Customer Profile, deploy the agents, and they handle the rest while giving you full visibility through a real-time workspace dashboard.',
    category: 'Getting Started',
    subcategory: 'Overview',
    personas: ['sales-leader', 'founder', 'sdr-bdr', 'marketer'],
    funnelStage: 'awareness',
    relatedIds: ['gs-002', 'gs-003', 'ai-001'],
    popular: true,
  },
  {
    id: 'gs-002',
    question: 'How is LeadReach different from traditional lead generation tools like Apollo, ZoomInfo, or Lusha?',
    answer: 'Traditional tools are databases — they give you a list of contacts and leave the rest to you. LeadReach is an autonomous workforce. The key differences are: (1) **Multi-agent orchestration**: Instead of a single tool doing one thing, 8 AI agents coordinate end-to-end — from prospect discovery through outreach to reporting. (2) **Autonomous research**: Scout searches 17+ channels simultaneously (LinkedIn, GitHub, Reddit, Google, Exa semantic search, and more), not just a static database. (3) **Deep enrichment**: Forge doesn\'t just pull firmographics — it builds a complete profile including tech stack, hiring signals, funding, and digital footprint. (4) **Intelligent qualification**: Judge applies a weighted, multi-signal scoring model tied to YOUR ICP, not generic intent data. (5) **Personalized outreach**: Bard crafts unique messages referencing specific, verifiable details about each prospect — not mail-merge templates. (6) **Pipeline automation**: Flow manages stages, follow-ups, and multi-threaded engagement automatically. (7) **Continuous learning**: Echo analyzes what\'s working and feeds insights back to improve the pipeline. In short: Apollo gives you a phonebook; LeadReach gives you an SDR team.',
    category: 'Getting Started',
    subcategory: 'Overview',
    personas: ['sales-leader', 'founder', 'marketer', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['gs-001', 'ai-001', 'int-001'],
    popular: true,
  },
  {
    id: 'gs-003',
    question: 'How do I get started with LeadReach? What are the first steps after signing up?',
    answer: 'Getting started takes about 15 minutes: **Step 1** — Create your account (no credit card required for the 14-day trial). **Step 2** — Define your Ideal Customer Profile (ICP): specify your target industry, company size, geography, technology stack, and growth signals. Atlas (the Orchestrator agent) will validate your ICP and confirm the target population. **Step 3** — Choose your discovery channels: select from 17+ channels including LinkedIn, web search, semantic search, GitHub, Reddit, and more. **Step 4** — Deploy the pipeline: click "Launch Campaign" and all 8 agents begin working — Scout discovers prospects, Forge enriches them, Sage researches deep context, Judge qualifies and scores, Bard prepares outreach, Flow manages the pipeline, and Echo reports results. **Step 5** — Monitor your workspace: the real-time Agentic Pipeline Workspace shows you exactly what each agent is doing, every lead discovered, and every communication between agents. You\'ll typically see your first qualified leads within 24 hours.',
    category: 'Getting Started',
    subcategory: 'Onboarding',
    personas: ['sdr-bdr', 'sales-leader', 'founder'],
    funnelStage: 'onboarding',
    relatedIds: ['gs-004', 'gs-005'],
    popular: true,
    new: true,
  },
  {
    id: 'gs-004',
    question: 'Do I need technical expertise or coding skills to use LeadReach?',
    answer: 'Not at all. LeadReach is designed for sales professionals, not developers. The entire workflow is point-and-click: you define your ICP through a guided form, select channels from a checklist, and deploy agents with one click. No API configuration, no scripting, no SQL queries needed. The dashboard gives you full visibility through visual cards, progress bars, and color-coded agent status — not terminal logs. That said, if you ARE technical, our REST API and SDKs (Python, Node.js) give you programmatic access to every feature for custom integrations and workflow automation.',
    category: 'Getting Started',
    subcategory: 'Onboarding',
    personas: ['sdr-bdr', 'sales-leader', 'founder'],
    funnelStage: 'consideration',
    relatedIds: ['gs-003', 'int-005'],
    popular: true,
  },
  {
    id: 'gs-005',
    question: 'What kind of results can I expect, and how quickly?',
    answer: 'Results vary by industry, ICP definition, and market size, but typical benchmarks from our customer base include: **5-10x increase** in qualified leads discovered per week compared to manual prospecting; **3x improvement** in outreach reply rates due to deep personalization; **60% reduction** in time spent on manual prospecting (research, enrichment, list building); **First qualified leads appear within 24 hours** of pipeline deployment; **2-4 weeks** to see a fully enriched, qualified pipeline of 500+ leads; **4-8 weeks** to attribute closed revenue to LeadReach-sourced pipeline. The key variable is ICP quality — a well-defined, specific ICP produces dramatically better results than a broad one. Our Atlas agent validates your ICP before deployment to ensure you have a sufficient target population.',
    category: 'Getting Started',
    subcategory: 'Results',
    personas: ['sales-leader', 'founder', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['gs-001', 'pr-006'],
    popular: true,
  },
  {
    id: 'gs-006',
    question: 'Is there a free trial? What\'s included?',
    answer: 'Yes! We offer a **14-day free trial** on all paid plans with full feature access — no credit card required. You get access to all 8 AI agents, all 17+ research channels, full enrichment and scoring capabilities, outreach composition, and the complete pipeline workspace. The trial includes the same lead volume as your selected plan tier. After the trial, you can choose to subscribe or move to our free Launchpad plan (2 agents, 100 leads/month) with no obligation. We also offer a **30-day money-back guarantee** on all paid plans — if you\'re not satisfied in the first 30 days, we\'ll refund your payment in full.',
    category: 'Getting Started',
    subcategory: 'Trial',
    personas: ['sales-leader', 'founder', 'procurement'],
    funnelStage: 'decision',
    relatedIds: ['pr-001', 'pr-002'],
    popular: true,
  },
  {
    id: 'gs-007',
    question: 'What is the Agentic Pipeline Workspace?',
    answer: 'The Agentic Pipeline Workspace is LeadReach\'s real-time command center that makes the entire 8-agent pipeline completely transparent. It has 5 tabbed panels: **Architecture** — a visual flow diagram showing all 8 agents, pipeline phases (Discovery → Enrichment → Complete), and the methodology being applied. **Agents** — expandable per-agent cards showing capabilities, timing, current status, and recent activity. **Events** — a structured, color-coded event stream with filtering by event type (discovery, enrichment, qualification, outreach, errors). **Leads** — a lead tracker with pipeline stage progress bars and data completeness indicators. **Comms** — inter-agent communication messages showing how agents coordinate and hand off work. You can see exactly what Scout discovered, how Forge enriched it, what Judge scored it, and what Bard is composing — all in real time. No black box, no mystery.',
    category: 'Getting Started',
    subcategory: 'Platform',
    personas: ['sales-leader', 'sdr-bdr', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['gs-001', 'ai-001'],
    new: true,
  },
  {
    id: 'gs-008',
    question: 'What industries and regions does LeadReach support?',
    answer: 'LeadReach has comprehensive knowledge base coverage for **22 industries** including SaaS, FinTech, HealthTech, EdTech, PropTech, LegalTech, HRTech, MarTech, Cybersecurity, AI Infrastructure, Dev Tools, Manufacturing, E-commerce, Biotech, AgTech, Energy, Logistics, Construction, Real Estate, Media, Travel, and CLM. For **regions**, we cover 16 markets including the US, Canada, UK, EU/GDPR, DACH, Nordics, Japan, South Korea, Australia, India, Southeast Asia, MENA, Latin America (Brazil, Mexico), and Africa. Each industry and region has dedicated prospecting intelligence — buyer personas, ICP signals, technographic data, compliance frameworks, cultural norms, outreach templates, and trigger events — that our agents use to deliver industry-specific, region-compliant results.',
    category: 'Getting Started',
    subcategory: 'Coverage',
    personas: ['sales-leader', 'founder', 'marketer'],
    funnelStage: 'consideration',
    relatedIds: ['gs-001', 'kb-001'],
    popular: true,
  },

  // =================================================================
  // 2. AGENTS & AI (Deep Technical FAQ)
  // =================================================================
  {
    id: 'ai-001',
    question: 'How do the 8 AI agents work together? Explain the full pipeline.',
    answer: 'The 8-agent pipeline operates in coordinated phases: **Phase 1 — Discovery**: Atlas (Orchestrator) decomposes your ICP into actionable search tasks and hands them to Scout. Scout searches across 17+ channels — LinkedIn, web search, semantic search (Exa), GitHub, Reddit, Google Maps, and more — to discover companies and contacts matching your ICP. **Phase 2 — Enrichment**: Forge takes Scout\'s raw discoveries and enriches each lead with firmographics (revenue, headcount, industry codes), technographics (CRM, marketing automation, cloud provider), contact details, digital presence, and recent signals (funding, hiring, product launches). Sage performs deep web research on high-priority accounts — earnings calls, press releases, competitive landscape, and strategic initiatives. **Phase 3 — Qualification**: Judge applies your ICP criteria as a weighted, multi-signal scoring model. Each lead receives a composite score based on firmographic fit, technographic match, behavioral signals, and trigger events. Leads below threshold are deprioritized; leads above threshold enter the outreach queue. **Phase 4 — Outreach**: Bard crafts personalized messages for each qualified lead, referencing specific, verifiable details — recent funding, hiring patterns, technology choices, competitor mentions. Flow manages the multi-touch sequence (email, LinkedIn, phone) and tracks pipeline stages. **Phase 5 — Reporting**: Echo generates campaign analytics, pipeline health metrics, and insights that feed back to improve the next cycle. Throughout the entire pipeline, Atlas orchestrates agent handoffs, manages state, and ensures no lead falls through the cracks.',
    category: 'Agents & AI',
    subcategory: 'Architecture',
    personas: ['sales-leader', 'revops', 'it-admin'],
    funnelStage: 'consideration',
    relatedIds: ['ai-002', 'ai-003', 'gs-001'],
    popular: true,
  },
  {
    id: 'ai-002',
    question: 'Can I customize which agents are active or configure their behavior?',
    answer: 'Yes, you have granular control: **Agent activation**: Enable or disable individual agents. For example, if you only need research and enrichment (no outreach), you can disable Bard (Outreach Composer) and Flow (Pipeline Manager). **Scoring weights**: Customize Judge\'s qualification criteria — adjust the weight of firmographic fit, technographic match, behavioral signals, and trigger events. **Outreach guardrails**: Configure Bard\'s tone, CTA style, subject line patterns, and compliance requirements (CAN-SPAM, GDPR, CASL). Set approval workflows so you review messages before they\'re sent. **Channel selection**: Choose which channels Scout researches — some channels require API keys (LinkedIn, Exa), others work with zero configuration. **Pipeline stages**: Customize Flow\'s pipeline stages and follow-up cadence — from a 14-day fast cycle to a 35-day enterprise sequence. **Reporting focus**: Configure Echo\'s reporting priorities — pipeline health, reply rates, meeting conversion, or revenue attribution. All configuration is done through the dashboard — no coding required. Settings can be saved as templates for reuse across campaigns.',
    category: 'Agents & AI',
    subcategory: 'Configuration',
    personas: ['sales-leader', 'revops', 'sdr-bdr'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-006'],
    popular: true,
  },
  {
    id: 'ai-003',
    question: 'What is Atlas (the Orchestrator agent) and what does it do?',
    answer: 'Atlas is the strategic orchestrator — the "manager" of the 8-agent team. Its core responsibilities: (1) **ICP Decomposition** — Takes your Ideal Customer Profile and breaks it into actionable search tasks for Scout, including industry codes, headcount ranges, technology signals, and geographic filters. (2) **Pipeline Coordination** — Manages the handoff between agents: when Scout finishes discovery, Atlas triggers Forge to begin enrichment; when Forge completes, Atlas signals Judge to begin qualification. (3) **Priority Management** — Dynamically adjusts agent priorities based on pipeline health. If enrichment is backing up, Atlas allocates more resources; if outbound reply rates drop, Atlas adjusts Bard\'s messaging strategy. (4) **Error Recovery** — If an agent encounters an error (rate limit, API failure, data quality issue), Atlas implements fallback strategies and retries. (5) **State Management** — Maintains the complete pipeline state so no lead is lost between agent transitions. You can observe Atlas\'s decisions in real-time through the Agentic Pipeline Workspace\'s Comms and Events panels.',
    category: 'Agents & AI',
    subcategory: 'Agent Deep Dives',
    personas: ['revops', 'it-admin', 'sales-leader'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-004', 'ai-005'],
  },
  {
    id: 'ai-004',
    question: 'What does Scout (Prospect Discovery) search for and where?',
    answer: 'Scout is the discovery agent that finds prospects matching your ICP across 17+ channels: **Primary channels**: Open web (Jina Reader), semantic search (Exa AI), LinkedIn (profiles, company pages, job postings), Google Search, Google Maps (for local business discovery). **Developer & Tech channels**: GitHub (repositories, contributors, tech stack signals), Stack Overflow, Product Hunt. **Social & Community**: Reddit (industry subreddits, AMAs), Twitter/X (company and executive posts), YouTube (company channels, product demos). **News & Media**: RSS feeds, press releases, news articles, earnings call transcripts. **Regional channels**: WeChat Articles (China), Weibo (China), V2EX (China), Xueqiu (China finance). **Data sources**: Crunchbase, AngelList/Wellfound, government registries (SEC EDGAR, MCA India, Companies House UK). Scout combines keyword search, semantic search, and structured queries to maximize coverage. Results are deduplicated, normalized, and ranked by ICP match probability before being passed to Forge for enrichment.',
    category: 'Agents & AI',
    subcategory: 'Agent Deep Dives',
    personas: ['sdr-bdr', 'sales-leader', 'marketer'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-006'],
  },
  {
    id: 'ai-005',
    question: 'How does Bard (Outreach Composer) personalize messages — and can I review them before sending?',
    answer: 'Bard crafts truly personalized messages by synthesizing multiple data sources for each lead: **Company context** — recent funding, M&A, product launches, earnings call highlights. **Role context** — the prospect\'s title, seniority, likely responsibilities, and career trajectory. **Technology context** — their tech stack, recent technology changes, and integration needs. **Trigger context** — specific, time-bound events (new CRO hire, Series B funding, compliance deadline) that create urgency. **Industry context** — from our knowledge base (22 industries), Bard applies industry-specific vocabulary, pain points, and proven outreach angles. **Regional context** — from our 16-region coverage, Bard adjusts tone, formality, language, and compliance requirements (e.g., GDPR opt-out for EU, CASL for Canada). Each message references 1-2 specific, verifiable details — not generic "I noticed your company is growing." **Review workflow**: You can set Bard to require approval before sending, or allow autonomous sending with a daily digest. You can also define brand voice guidelines, prohibited phrases, and CTA preferences that Bard follows strictly.',
    category: 'Agents & AI',
    subcategory: 'Agent Deep Dives',
    personas: ['sdr-bdr', 'sales-leader', 'marketer'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-002', 'comp-003'],
    popular: true,
  },
  {
    id: 'ai-006',
    question: 'How does Judge (Lead Qualification) score leads?',
    answer: 'Judge uses a **weighted, multi-signal composite scoring model** that you can customize: **Firmographic fit** (weight: configurable, default 25%) — Does the company match your ICP on industry, headcount, revenue, geography, and funding stage? **Technographic match** (weight: default 20%) — Does their technology stack indicate they could benefit from your solution? (e.g., using Salesforce + Outreach but no intent data tool). **Behavioral signals** (weight: default 25%) — Recent, observable events: funding rounds, hiring patterns (especially SDR/BDR/AE hires), leadership changes, product launches. **Trigger events** (weight: default 20%) — Time-bound urgency signals: recent funding (90-day window), new CRO hire (60-day window), compliance deadline (30-day window). **Digital presence** (weight: default 10%) — Website activity, content publishing, social media engagement, community participation. Each dimension is scored 0-100, then weighted and combined into a composite score. Leads above your threshold (configurable, default 70) enter the outreach queue; leads below are deprioritized but not deleted — their scores update in real-time as Forge enriches new data. Judge also provides an explainability breakdown: "This lead scored 85 because: Series B funding 45 days ago (+22), hiring 3 SDRs (+18), uses Salesforce + Outreach (+15), headcount 200-500 (+12), no recent leadership change (-5)."',
    category: 'Agents & AI',
    subcategory: 'Scoring & Qualification',
    personas: ['sales-leader', 'revops', 'sdr-bdr'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-002'],
    popular: true,
  },
  {
    id: 'ai-007',
    question: 'Can AI agents make autonomous decisions? What guardrails exist?',
    answer: 'Agents operate autonomously within the guardrails you define — think of it as "autonomous within boundaries": **What agents decide autonomously**: Which channels to search and in what order, how to prioritize leads during discovery, which enrichment sources to query, how to adjust scoring weights based on outcome feedback, when to send follow-ups and through which channel, how to phrase outreach based on the lead\'s context. **Guardrails you control**: Approval workflows — require human review before any outreach message is sent. Scoring thresholds — define minimum scores for leads to enter the outreach queue. Compliance rules — enforce CAN-SPAM, GDPR, CASL, and other regulations automatically. Rate limits — control how many messages are sent per day/week. Escalation rules — route high-value leads (score >90) to your AE team instead of automated outreach. Channel restrictions — disable specific channels or regions. Brand voice — define tone, prohibited phrases, and required disclosures. **Safety mechanisms**: All agent decisions are logged and auditable. The Agentic Pipeline Workspace shows every decision in real-time. You can pause, resume, or abort any agent at any time. Emergency stop halts all outbound communication immediately.',
    category: 'Agents & AI',
    subcategory: 'Autonomy & Guardrails',
    personas: ['sales-leader', 'it-admin', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-002', 'sec-001'],
  },
  {
    id: 'ai-008',
    question: 'What happens when an agent encounters an error or rate limit?',
    answer: 'LeadReach has a multi-layered error recovery system: **Rate limit handling**: When a channel API returns a rate limit error (HTTP 429), the agent automatically implements exponential backoff with jitter, queues the request for retry, and Atlas may redirect work to alternative channels. **API failures**: If a data source becomes unavailable, Forge falls back to alternative enrichment providers. For example, if LinkedIn API is down, Scout shifts to Exa semantic search and web scraping. **Data quality issues**: If enriched data fails validation (e.g., invalid email format, suspicious company data), Forge flags the lead for manual review rather than passing bad data to Judge. **Network errors**: Transient network failures trigger automatic retry with circuit breaker patterns — after 3 consecutive failures, the agent pauses and Atlas reroutes. **Agent crash recovery**: Agent state is persisted after every successful operation. If an agent crashes, it resumes from the last checkpoint, not from the beginning. All errors are logged in the Events panel of the Agentic Pipeline Workspace with severity classification and resolution status.',
    category: 'Agents & AI',
    subcategory: 'Reliability',
    personas: ['it-admin', 'revops'],
    funnelStage: 'retention',
    relatedIds: ['ai-007', 'ai-003'],
  },
  {
    id: 'ai-009',
    question: 'How does the knowledge base improve agent accuracy?',
    answer: 'LeadReach\'s knowledge base is the "brain" behind agent intelligence. It contains **102+ documents** across 6 categories: **Industries (34 docs)**: Deep prospecting intelligence for 22 industries — buyer personas, ICP signals, technographic data, vocabulary, trigger events, outreach best practices, regulatory frameworks, and regional variants. **Regions (24 docs)**: B2B compliance guides for 16 regions — business registries, regulatory frameworks, cultural norms, channel preferences, tax infrastructure, and outreach compliance checklists. **Playbooks (14 docs)**: Proven methodologies — outbound cold email, ICP discovery, multi-threaded selling, competitor displacement, pricing negotiation, security review, procurement navigation, and more. **Agent Tools (8 docs)**: Each agent\'s operational manual — capabilities, error handling, integration patterns, QA rules, and anti-patterns. **Training Data (8 JSONL files)**: Few-shot examples for each agent — 166+ curated input/output pairs. **Domain (6 docs)**: Core B2B lead generation theory — ICP design, lead qualification frameworks, data enrichment methodology, trigger event detection. When an agent processes a lead in, say, the FinTech industry in the EU, it retrieves the FinTech industry guide and EU/GDPR region guide to apply industry-specific scoring weights, EU-compliant outreach patterns, and FinTech buyer persona knowledge. This is why LeadReach produces industry-grade results rather than generic output.',
    category: 'Agents & AI',
    subcategory: 'Knowledge Base',
    personas: ['sales-leader', 'revops', 'it-admin'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'kb-001'],
    kbSlug: 'industry-fintech',
    popular: true,
  },
  {
    id: 'ai-010',
    question: 'How does Echo (Report Generator) work and what metrics does it track?',
    answer: 'Echo is the insights and reporting agent that closes the feedback loop: **Campaign analytics**: Pipeline velocity, conversion rates by stage, agent performance metrics, channel effectiveness comparison. **Lead analytics**: Total discovered, enrichment rate, qualification rate, average lead score, score distribution, top industries/regions represented. **Outreach analytics**: Messages sent, open rates, reply rates, positive reply rates, meeting booking rates, by channel and by sequence step. **Pipeline health**: Stages with bottlenecks, leads aging without progression, follow-up compliance, multi-threading coverage. **Agent efficiency**: Average discovery time per lead, enrichment completeness, scoring accuracy (validated against actual outcomes), outreach personalization quality scores. **Trend analysis**: Week-over-week changes, seasonal patterns, ICP performance drift. **Recommendations**: Echo identifies what\'s working and what\'s not — for example, "Leads from the FinTech ICP in the EU are converting at 2x the rate of US FinTech leads. Consider allocating more discovery budget to EU channels." All reports are accessible through the dashboard, and Echo can be configured to send weekly digests, Slack notifications, or webhook payloads to your BI tools.',
    category: 'Agents & AI',
    subcategory: 'Agent Deep Dives',
    personas: ['sales-leader', 'revops', 'founder'],
    funnelStage: 'retention',
    relatedIds: ['ai-001', 'ai-006'],
  },
  {
    id: 'ai-011',
    question: 'What is the Forge (Data Enrichment) agent and what data does it provide?',
    answer: 'Forge enriches each raw lead from Scout with a comprehensive profile: **Firmographics** — Company name, legal entity, industry (NAICS/SIC codes), headcount range, revenue estimate, founding year, funding stage, investor list, headquarters location, office locations. **Technographics** — CRM (Salesforce, HubSpot, Pipedrive), marketing automation (Marketo, Pardot, HubSpot), sales engagement (Outreach, Salesloft), cloud provider (AWS, GCP, Azure), data warehouse, observability tools, and 30+ more technology categories. **Contact data** — Verified email addresses (with deliverability score), phone numbers (where legally permissible), LinkedIn profile URLs, job titles, seniority level, time at company. **Digital presence** — Website traffic estimates, social media followers, content publishing cadence, community engagement levels, tech blog activity. **Signals** — Recent funding rounds (amount, date, investors), hiring patterns (roles, velocity, locations), leadership changes (new CRO, CTO, VP Sales), product launches, M&A activity, compliance events, earnings call highlights. **Source attribution** — Every data point includes its source and recency, so you can assess reliability. Forge uses a multi-provider enrichment strategy: primary data from LinkedIn and web sources, supplemented by Crunchbase for funding, GitHub for tech signals, and government registries for verification.',
    category: 'Agents & AI',
    subcategory: 'Agent Deep Dives',
    personas: ['sdr-bdr', 'sales-leader', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-004'],
  },
  {
    id: 'ai-012',
    question: 'How does Sage (Web Research) differ from Scout (Prospect Discovery)?',
    answer: 'Scout and Sage serve different purposes in the pipeline: **Scout is breadth-focused** — it casts a wide net across 17+ channels to find ALL companies matching your ICP. Think of Scout as "finding the haystack." Scout processes thousands of prospects quickly with automated queries, and its output is a ranked list of candidate companies and contacts. **Sage is depth-focused** — it performs deep research on high-priority accounts that have already been identified. Think of Sage as "finding the needle." For accounts that Judge scores above a threshold (or that you manually flag), Sage researches: detailed company strategy from earnings calls and investor presentations, competitive positioning and market share analysis, key initiative analysis (what they\'re prioritizing this quarter), organizational structure and decision-making dynamics, recent news and press coverage with sentiment analysis, and partnership/M&A rumors. Sage\'s output is a rich research brief that Bard uses to craft hyper-personalized outreach. Not every lead gets Sage treatment — it\'s reserved for leads worth the extra investment. You control which leads trigger deep research based on score thresholds or manual selection.',
    category: 'Agents & AI',
    subcategory: 'Agent Deep Dives',
    personas: ['sales-leader', 'sdr-bdr', 'marketer'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-004'],
  },

  // =================================================================
  // 3. PRICING & PLANS
  // =================================================================
  {
    id: 'pr-001',
    question: 'What plans are available and what do they include?',
    answer: 'LeadReach offers plans for both B2B and B2C tracks: **B2B Plans**: **Launchpad** (Free forever) — 2 AI agents, 100 leads/month, 3 research channels, basic ICP/lead scoring. **Scout** ($149/mo or $1,490/yr) — 3 AI agents, 1,000 leads/month, 7 research channels, CRM integration, email outreach. **Command** ($399/mo or $3,990/yr) — All 8 AI agents, 10,000+ leads/month, all 17+ channels, full pipeline workspace, API access, priority support. **Enterprise** (Custom pricing) — Unlimited everything, dedicated success manager, custom integrations, SLA guarantees, SSO/SAML. **Founders\' Pass** ($2,497 one-time) — Lifetime access to Command-tier features, 15,000 leads/month, no recurring bills. **B2C Plans**: **Setter** ($97/mo) — 2 agents, 500 leads/month, social media channels. **Closer** ($297/mo) — Unlimited agents, 10,000+ leads/month, all channels. **Agency** (Custom) — Unlimited, white-label options, multi-client management. All paid plans include a 14-day free trial and 30-day money-back guarantee.',
    category: 'Pricing & Plans',
    subcategory: 'Plan Overview',
    personas: ['sales-leader', 'founder', 'procurement'],
    funnelStage: 'decision',
    relatedIds: ['pr-002', 'pr-003', 'pr-004'],
    popular: true,
  },
  {
    id: 'pr-002',
    question: 'What is the Founders\' Pass (Lifetime Deal)?',
    answer: 'The Founders\' Pass is a **one-time payment of $2,497** for lifetime access to the full Command-tier feature set — that\'s all 8 AI agents, 15,000 leads per month, all 17+ research channels, CRM integrations, API access, priority support, and the complete Agentic Pipeline Workspace. No recurring bills, ever. All future platform updates, new agent capabilities, and knowledge base expansions are included at no additional cost. This is a limited-time offer for early adopters — once the Founders\' Pass window closes, it will not be offered again. At $2,497 one-time vs. Command at $399/month ($4,788/year), the Founders\' Pass pays for itself in just 6.3 months. Many founders choose this option because it eliminates the recurring SaaS expense and locks in pricing before planned increases.',
    category: 'Pricing & Plans',
    subcategory: 'Founders Pass',
    personas: ['founder', 'sales-leader'],
    funnelStage: 'decision',
    relatedIds: ['pr-001'],
    popular: true,
  },
  {
    id: 'pr-003',
    question: 'Can I switch plans at any time? What about upgrades and downgrades?',
    answer: 'Yes, you can switch plans at any time with no penalties: **Upgrades** take effect immediately — you get instant access to additional agents, channels, and capacity. Prorated charges apply from the upgrade date. **Downgrades** take effect at the start of your next billing cycle. You keep access to your current plan features until then. Prorated credits are applied automatically. **Plan switches** (e.g., B2B Scout to B2B Command) are seamless — your data, campaigns, and pipeline state are preserved. **Trial to paid** is instant when you add payment — no data loss, no pipeline interruption. **Annual to monthly** — you can switch from annual to monthly billing at renewal. We do not offer mid-cycle refunds for the remaining annual period, but you retain access until the annual period ends.',
    category: 'Pricing & Plans',
    subcategory: 'Plan Management',
    personas: ['sales-leader', 'procurement', 'founder'],
    funnelStage: 'decision',
    relatedIds: ['pr-001', 'pr-005'],
  },
  {
    id: 'pr-004',
    question: 'What happens when I exceed my monthly lead limit?',
    answer: 'We handle lead limits gracefully — you\'ll never be surprised by overage charges: **Approaching limit** (80%): You receive an in-app notification and email suggesting you upgrade or wait for the next cycle. **At limit** (100%): Discovery agents pause automatically. Existing leads continue through enrichment, qualification, and outreach — we don\'t freeze your entire pipeline. **Overage option**: You can choose to purchase additional lead capacity at a per-1,000 rate without upgrading your entire plan. This is pay-as-you-go and requires explicit consent. **Enterprise plans**: Include unlimited leads with fair-use policies — no hard caps, but we monitor for abuse. **Carry-over**: Unused lead capacity does not roll over to the next month. We recommend starting with a plan that has some headroom above your typical volume.',
    category: 'Pricing & Plans',
    subcategory: 'Usage & Limits',
    personas: ['sales-leader', 'procurement'],
    funnelStage: 'retention',
    relatedIds: ['pr-001'],
  },
  {
    id: 'pr-005',
    question: 'Do you offer discounts for annual billing or startups?',
    answer: 'Yes, multiple discount programs: **Annual billing**: 20% discount on all plans. Scout drops from $149/mo to $1,490/yr (saving $298). Command drops from $399/mo to $3,990/yr (saving $798). **Startup program**: Companies under 2 years old with less than $5M in funding qualify for 30% off any plan for the first year. Apply through our support team with your Crunchbase profile. **Non-profit discount**: 25% off for verified non-profit organizations. **Volume/Enterprise discounts**: Custom pricing for teams of 10+ seats or annual commitments over $25,000. **Education discount**: 50% off for accredited educational institutions using LeadReach for research or teaching. Contact our sales team for custom quotes.',
    category: 'Pricing & Plans',
    subcategory: 'Discounts',
    personas: ['founder', 'procurement', 'sales-leader'],
    funnelStage: 'decision',
    relatedIds: ['pr-001', 'pr-003'],
  },
  {
    id: 'pr-006',
    question: 'What ROI can I expect? How do I measure the value of LeadReach?',
    answer: 'ROI depends on your ACV (Average Contract Value) and pipeline conversion rates, but here\'s the framework: **Cost calculation**: At Command tier ($399/mo), your fully-loaded cost per qualified lead (assuming 2,000 qualified leads/month) is ~$0.20/lead. Compare this to: SDR cost per qualified lead: $50-$200. ZoomInfo/Apollo cost per lead: $0.50-$5.00. **Revenue impact**: If your ACV is $30,000 and LeadReach helps you close just 1 additional deal per month that you wouldn\'t have otherwise, that\'s $30,000/month in attributed revenue against $399/month cost — a 75x return. **Time savings**: 60% reduction in manual prospecting time. For a team of 5 SDRs averaging $60K salary, that\'s $180,000/year in productivity reclaimed. **Metrics to track**: Leads discovered per week, qualification rate, outreach reply rate, meetings booked, pipeline sourced, closed-won revenue attributed to LeadReach, time-to-first-meeting, and cost-per-qualified-lead vs. your previous method. Most customers see positive ROI within the first month.',
    category: 'Pricing & Plans',
    subcategory: 'ROI',
    personas: ['sales-leader', 'founder', 'revops', 'procurement'],
    funnelStage: 'consideration',
    relatedIds: ['gs-005', 'pr-001'],
    popular: true,
  },

  // =================================================================
  // 4. SECURITY, COMPLIANCE & DATA PRIVACY
  // =================================================================
  {
    id: 'sec-001',
    question: 'Is my data secure? What security certifications and practices do you follow?',
    answer: 'Data security is foundational to LeadReach: **Encryption**: All data encrypted at rest (AES-256) and in transit (TLS 1.3). Database backups are encrypted with separate key management. **Infrastructure**: Hosted on SOC 2 Type II certified cloud providers with network segmentation, intrusion detection, and DDoS protection. **Access control**: Role-based access control (RBAC), multi-factor authentication (MFA), SSO/SAML for Enterprise. API keys are scoped and rotatable. **Agent isolation**: Each AI agent processes data in isolated, containerized environments. No cross-tenant data leakage is possible. **Audit logging**: Every action — data access, API call, configuration change, export — is logged with timestamp, user, and IP address. Logs retained for 1 year. **Vulnerability management**: Regular penetration testing by third-party firms, automated dependency scanning, responsible disclosure program. **Employee access**: No employee can access your data without explicit authorization. Support access requires a time-limited, auditable session with your consent. **Certifications**: SOC 2 Type II (in progress), GDPR compliant, CCPA compliant, ISO 27001 roadmap for 2027.',
    category: 'Security & Compliance',
    subcategory: 'Data Security',
    personas: ['it-admin', 'procurement', 'sales-leader'],
    funnelStage: 'decision',
    relatedIds: ['sec-002', 'sec-003', 'sec-004'],
    popular: true,
  },
  {
    id: 'sec-002',
    question: 'Is LeadReach GDPR, CCPA, and CASL compliant?',
    answer: 'Yes, LeadReach is fully compliant with major privacy regulations: **GDPR (EU)**: We process data under legitimate interest for B2B outreach (documented LIAs). We honor opt-out requests within 24 hours. We provide data export (Article 20) and deletion (Article 17) capabilities. We have EU-US Data Privacy Framework adequacy. We appoint an EU representative (Article 27) for EU data subjects. **CCPA/CPRA (California)**: We provide opt-out mechanisms for "sale" or "sharing" of personal information. We honor Do Not Sell requests. We publish a clear privacy notice with categorized data collection. We maintain records of consumer requests. **CASL (Canada)**: We support implied and express consent models. We include unsubscribe mechanisms in every message. We maintain consent records with timestamps and source documentation. **Beyond compliance**: Our agents automatically apply region-specific compliance rules. Bard (Outreach Composer) adjusts message format, opt-out language, and sending behavior based on the prospect\'s location. Judge flags leads in high-regulation regions for additional review. Our knowledge base contains detailed compliance guides for 16 regions with specific rules, penalties, and best practices.',
    category: 'Security & Compliance',
    subcategory: 'Privacy Regulations',
    personas: ['it-admin', 'procurement', 'revops'],
    funnelStage: 'decision',
    relatedIds: ['sec-001', 'sec-003'],
    popular: true,
    kbSlug: 'region-european-union',
  },
  {
    id: 'sec-003',
    question: 'Where is my data stored? Can I choose data residency?',
    answer: 'By default, data is stored in US-based SOC 2 Type II certified data centers. **Data residency options**: Enterprise customers can select specific geographic regions for data storage — currently available in US (Virginia), EU (Frankfurt), and APAC (Singapore). **Data processing**: AI agent processing occurs in the same region as data storage to avoid cross-border transfers without safeguards. **Backups**: Encrypted backups are stored in the same region. **Sub-processors**: All sub-processors (cloud infrastructure, LLM providers) are documented and contractually bound to equivalent security standards. **Data retention**: You control retention policies. Default: active data retained for the account lifetime, deleted within 30 days of account closure. You can request immediate deletion. **Transfer mechanisms**: For regions requiring data localization (EU, China), we implement Standard Contractual Clauses (SCCs), EU-US Data Privacy Framework certification, and local processing where available.',
    category: 'Security & Compliance',
    subcategory: 'Data Residency',
    personas: ['it-admin', 'procurement'],
    funnelStage: 'decision',
    relatedIds: ['sec-001', 'sec-002'],
  },
  {
    id: 'sec-004',
    question: 'How do you handle lead data from public sources? Is web scraping legal?',
    answer: 'We follow a strict data governance framework: **Public data only**: We collect only publicly available information — company websites, LinkedIn public profiles, press releases, government filings, and public social media posts. We do not access private messages, gated content, or personal data behind login walls. **Platform compliance**: Our research agents respect each platform\'s Terms of Service and robots.txt directives. We use official APIs where available (LinkedIn, Exa, Jina) and fall back to ethical web scraping with rate limiting where APIs are unavailable. **Source attribution**: Every data point in our system includes its source, collection date, and access method. You can verify where any piece of information came from. **Legal basis**: Under GDPR, we process B2B contact data under legitimate interest (LIA documented). Under CCPA, business contact information is exempt from consumer data requirements. **Opt-out mechanisms**: We maintain a global do-not-contact list and honor individual opt-out requests within 24 hours. **Scraping ethics**: We implement rate limiting (no more than 1 request per 3 seconds per domain), respect crawl delays, never bypass CAPTCHAs or authentication, and do not scrape personal social media profiles for consumer purposes.',
    category: 'Security & Compliance',
    subcategory: 'Data Collection',
    personas: ['it-admin', 'procurement', 'sales-leader'],
    funnelStage: 'consideration',
    relatedIds: ['sec-001', 'sec-002'],
  },
  {
    id: 'sec-005',
    question: 'Does LeadReach support SOC 2, ISO 27001, or other security assessments?',
    answer: 'We are committed to enterprise-grade security standards: **SOC 2 Type II**: Currently in progress with a Big Four auditor. We expect certification by Q4 2026. Our security controls map to all Trust Service Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy). **ISO 27001**: On our 2027 roadmap. Information Security Management System (ISMS) is being formalized. **Penetration testing**: Annual third-party penetration tests by a CREST-certified firm. Summary reports available to Enterprise customers under NDA. **Vendor risk assessment**: We complete security questionnaires (SIG, CAIQ, custom) for Enterprise procurement processes. Our security whitepaper covers 150+ questions with evidence. **Incident response**: Documented IR plan with 1-hour detection SLA, 4-hour containment SLA, and 24-hour notification SLA for data breaches. **Business continuity**: Multi-region infrastructure with automated failover. RPO: 1 hour. RTO: 4 hours. If you need specific certifications for your procurement process, contact our security team — we regularly accelerate timelines for customer-driven requirements.',
    category: 'Security & Compliance',
    subcategory: 'Certifications',
    personas: ['it-admin', 'procurement'],
    funnelStage: 'decision',
    relatedIds: ['sec-001'],
  },

  // =================================================================
  // 5. INTEGRATIONS & TECHNICAL
  // =================================================================
  {
    id: 'int-001',
    question: 'What CRM integrations are available?',
    answer: 'LeadReach integrates natively with the leading CRMs: **Salesforce**: Bi-directional sync — leads, contacts, accounts, opportunities, and activities sync in real-time. Custom field mapping, workflow triggers, and lead assignment rules. Supports Sales Cloud and Service Cloud. **HubSpot**: Native integration with CRM, Marketing Hub, and Sales Hub. Automatic lead creation, enrichment data sync, email tracking, and meeting scheduling. **Pipedrive**: Contact and deal sync, activity logging, and pipeline stage mapping. **Custom CRM via API**: Our REST API supports integration with any CRM — Microsoft Dynamics, SugarCRM, Close, Attio, or custom-built systems. Webhooks push events in real-time. **Sync behavior**: All integrations support configurable sync direction (one-way or bi-directional), field mapping, conflict resolution rules, and deduplication. Sync frequency: real-time for native integrations, configurable (5-min to hourly) for API-based integrations.',
    category: 'Integrations & Technical',
    subcategory: 'CRM',
    personas: ['revops', 'it-admin', 'sales-leader'],
    funnelStage: 'decision',
    relatedIds: ['int-002', 'int-003', 'int-005'],
    popular: true,
  },
  {
    id: 'int-002',
    question: 'What email and outreach tool integrations are available?',
    answer: 'LeadReach connects with your existing email and outreach stack: **Email providers**: Gmail (via OAuth), Microsoft Outlook (via OAuth), custom SMTP/IMAP for corporate email servers. **Outreach platforms**: Outreach.io, Salesloft, Lemlist, Reply.io, Instantly — via API integration. Bard (Outreach Composer) can push sequences directly. **Email warmup**: Built-in domain warmup tool for new sending domains to build sender reputation before high-volume outreach. **Deliverability monitoring**: Real-time tracking of bounce rates, spam complaints, and inbox placement rates. Alerts when reputation scores drop. **Sending limits**: Configurable daily send limits per sender account, with intelligent distribution across multiple sender accounts for Enterprise plans. **Email compliance**: Automatic insertion of CAN-SPAM physical addresses, GDPR opt-out links, and CASL unsubscribe mechanisms based on prospect region.',
    category: 'Integrations & Technical',
    subcategory: 'Email',
    personas: ['revops', 'sdr-bdr', 'sales-leader'],
    funnelStage: 'decision',
    relatedIds: ['int-001'],
  },
  {
    id: 'int-003',
    question: 'Is there an API? What can I do with it?',
    answer: 'Yes, our REST API is available on Command and Enterprise plans: **Full feature access**: Every platform feature is available via API — define ICPs, deploy agents, retrieve leads, trigger outreach, manage pipeline, fetch reports. **Authentication**: API key-based (scoped keys with fine-grained permissions) or OAuth 2.0 for user-context operations. **Rate limits**: Command plan: 1,000 requests/hour. Enterprise: 10,000 requests/hour or custom limits. **Endpoints**: /campaigns (create, list, manage), /leads (search, filter, enrich, score), /outreach (compose, send, sequence), /pipeline (stages, transitions, analytics), /agents (status, configure, deploy), /knowledge (search, retrieve), /reports (generate, download). **Webhooks**: Real-time event notifications for lead discovered, lead qualified, outreach sent, reply received, meeting booked. **SDKs**: Official SDKs for Python and Node.js with TypeScript support. **Documentation**: Interactive API docs with code examples, authentication guides, and rate limit policies at /api-docs.',
    category: 'Integrations & Technical',
    subcategory: 'API',
    personas: ['it-admin', 'revops', 'founder'],
    funnelStage: 'decision',
    relatedIds: ['int-001', 'int-005'],
    popular: true,
  },
  {
    id: 'int-004',
    question: 'Can I connect LeadReach to my data warehouse or BI tool?',
    answer: 'Yes, through multiple integration patterns: **Direct API**: Pull lead, campaign, and pipeline data into your data warehouse (Snowflake, BigQuery, Redshift) using our REST API. We provide SQL-compatible export formats. **Webhooks**: Real-time event streaming to Kafka, Segment, or custom endpoints. Events include lead discovery, enrichment updates, qualification changes, and outreach activities. **CSV/Excel export**: Manual or scheduled exports of any data view — leads, enrichment details, scoring breakdowns, campaign metrics. **Segment integration**: Push LeadReach events to Segment for unified customer data. **Zapier/Make**: Connect LeadReach to 5,000+ apps through our Zapier integration (coming Q3 2026). **Native BI connectors**: We provide pre-built Looker and Tableau dashboards for Enterprise customers. **Reverse ETL**: Push enrichment data back to your CRM or data warehouse using Census, Hightouch, or custom connectors.',
    category: 'Integrations & Technical',
    subcategory: 'Data & BI',
    personas: ['revops', 'it-admin'],
    funnelStage: 'decision',
    relatedIds: ['int-003'],
  },
  {
    id: 'int-005',
    question: 'What about SSO, SAML, and enterprise authentication?',
    answer: 'Enterprise authentication features: **SSO/SAML 2.0**: Available on Enterprise plans. Supports Okta, Azure AD, OneLogin, Google Workspace, and any SAML 2.0-compliant identity provider. **SCIM provisioning**: Automatic user provisioning and deprovisioning via SCIM 2.0. When an employee joins or leaves your organization, their LeadReach access is automatically granted or revoked. **Multi-factor authentication (MFA)**: Available on all plans. Supports TOTP authenticator apps and hardware keys. **API key management**: Scoped API keys with expiration dates, IP allowlists, and automatic rotation. Enterprise supports single-use keys for CI/CD pipelines. **Session management**: Configurable session timeouts, IP-based access restrictions, and concurrent session limits. **Audit trail**: Every authentication event (login, logout, MFA challenge, API key usage) is logged with timestamp, IP, and user agent. If your organization requires specific authentication configurations not listed here, contact our security team — we regularly implement custom requirements for Enterprise customers.',
    category: 'Integrations & Technical',
    subcategory: 'Authentication',
    personas: ['it-admin', 'procurement'],
    funnelStage: 'decision',
    relatedIds: ['sec-001', 'sec-005'],
  },

  // =================================================================
  // 6. INDUSTRY-SPECIFIC FAQ
  // =================================================================
  {
    id: 'ind-001',
    question: 'How does LeadReach work for SaaS / B2B software companies?',
    answer: 'LeadReach excels for SaaS companies because our knowledge base has dedicated prospecting intelligence for 6+ SaaS sub-segments: **Vertical SaaS** (industry-specific), **Horizontal SaaS** (broad-use), **Dev Tools** (developer-focused), **AI/ML Infrastructure**, **Cybersecurity**, and **MarTech**. For SaaS, the key signals are: technographic fit (do they use Salesforce/HubSpot? do they have a sales team?), hiring velocity (SDR/BDR/AE hiring = growth investment), funding stage (Series B+ = budget for tools), and product launch timing (new product = new outreach need). Scout discovers SaaS companies matching your ICP across LinkedIn, Crunchbase, Product Hunt, and GitHub. Forge enriches with tech stack data from BuiltWith and HG Insights. Bard applies our proven SaaS outreach playbook — the 21-day multi-touch sequence that achieves 4-8% reply rates. The pipeline workspace shows you exactly which SaaS companies are in which stage, their tech stack, and why they were scored the way they were.',
    category: 'Industry-Specific',
    subcategory: 'SaaS',
    personas: ['sales-leader', 'sdr-bdr', 'founder'],
    funnelStage: 'consideration',
    relatedIds: ['gs-008', 'ai-009'],
    kbSlug: 'industry-saas',
  },
  {
    id: 'ind-002',
    question: 'How does LeadReach work for FinTech and financial services?',
    answer: 'FinTech prospecting requires regulatory awareness, relationship sensitivity, and industry-specific vocabulary — all of which are built into LeadReach\'s FinTech knowledge base: **Sub-segment coverage**: Banking, Payments, Neobanks, Lending, Embedded Finance, Insurance (InsurTech), Wealth Management, RegTech, Crypto/Digital Assets. **Compliance-aware outreach**: Bard automatically adjusts messaging for financial services — no hype, no unrealistic claims, ROI-focused, compliance-friendly. For EU prospects, GDPR-compliant opt-out is included. For US prospects, SOX and GLBA considerations are applied. **FinTech buyer personas**: Our knowledge base profiles 8 FinTech buyer personas from CRO at a neobank to VP Compliance at an insurance company, each with specific pain points, outreach angles, and channel preferences. **Trigger events**: FinTech-specific triggers include regulatory fines, compliance audit failures, new charter approvals, funding rounds, and partnership announcements. **Regional nuances**: FinTech regulation varies dramatically — US (state-by-state), EU (PSD2, DORA), UK (FCA), Singapore (MAS). Judge applies region-specific compliance weights automatically.',
    category: 'Industry-Specific',
    subcategory: 'FinTech',
    personas: ['sales-leader', 'sdr-bdr', 'marketer'],
    funnelStage: 'consideration',
    relatedIds: ['gs-008', 'sec-002'],
    kbSlug: 'industry-fintech',
  },
  {
    id: 'ind-003',
    question: 'How does LeadReach work for healthcare, biotech, and life sciences?',
    answer: 'Healthcare prospecting is uniquely challenging due to HIPAA, FDA regulations, and long procurement cycles. LeadReach addresses this with dedicated knowledge: **Sub-segments**: HealthTech (EHR, telehealth, RPM), Biotech (drug discovery, clinical trials), Pharma (commercial, R&D), Medical Devices, Payer/Insurance, Provider Systems. **Regulatory compliance**: Judge automatically flags HIPAA-covered entities for additional compliance review. Bard ensures outreach doesn\'t make claims that could violate FDA advertising rules. **Long-cycle optimization**: Flow manages extended sequences (28-42 days) appropriate for healthcare buying cycles, with direct mail integration for high-value targets. **Decision mapping**: Healthcare buying committees are complex (CMO, CIO, CISO, compliance, clinical staff). Our knowledge base maps each persona\'s influence, pain points, and preferred outreach channels. **Data sensitivity**: Forge applies additional data handling protocols for healthcare prospects, including de-identification where required and restricted enrichment sources.',
    category: 'Industry-Specific',
    subcategory: 'Healthcare',
    personas: ['sales-leader', 'sdr-bdr'],
    funnelStage: 'consideration',
    relatedIds: ['gs-008', 'sec-002'],
    kbSlug: 'industry-healthtech',
  },
  {
    id: 'ind-004',
    question: 'Can LeadReach find suppliers, manufacturers, or trading partners (not just SaaS prospects)?',
    answer: 'Absolutely. LeadReach isn\'t limited to SaaS prospects — it works for any B2B relationship: **Supplier discovery**: Scout can search for suppliers in specific countries and categories — for example, "dragonfruit suppliers in Vietnam" or "steel manufacturers in South Korea." Google Maps, trade directories, and government registries are key channels. **Manufacturing partners**: Find contract manufacturers, OEMs, and co-packers. Forge enriches with certifications (ISO, HACCP, BRC), production capacity, and export destinations. **Trading partners**: Discover importers, exporters, and distributors. Our knowledge base includes agriculture & food trade, logistics, and cross-border commerce intelligence. **Non-SaaS ICPs**: Define ICPs based on product category, certifications, production capacity, geographic location, and export markets — not just software buying signals. **Case study**: The canonical use case is "Find dragonfruit suppliers in Vietnam for import to India" — Scout searches Vietnamese trade directories and government registries, Forge enriches with export certifications and capacity, Judge qualifies based on your requirements, and Bard crafts outreach in Vietnamese or English. This works for any commodity, any country.',
    category: 'Industry-Specific',
    subcategory: 'Supply Chain',
    personas: ['founder', 'sales-leader'],
    funnelStage: 'consideration',
    relatedIds: ['gs-008', 'ai-004'],
    kbSlug: 'industry-agriculture-food-trade',
    popular: true,
  },

  // =================================================================
  // 7. REGIONAL & COMPLIANCE FAQ
  // =================================================================
  {
    id: 'reg-001',
    question: 'How does LeadReach handle GDPR for EU prospects?',
    answer: 'GDPR compliance for EU B2B outreach is built into every agent: **Legal basis**: We process B2B contact data under Article 6(1)(f) — Legitimate Interest — with documented Legitimate Interest Assessments (LIAs) available for your records. **Opt-out requirements**: Every outreach message to EU prospects includes a clear, one-click opt-out mechanism. Opt-outs are processed within 24 hours and added to our global suppression list. **Data minimization**: Forge collects only data necessary for the stated purpose. We do not collect special category data (health, biometric, political opinions). **Data subject rights**: We support Article 15 (access), Article 17 (deletion), Article 20 (portability), and Article 21 (objection) requests. **International transfers**: US-EU data transfers are covered by the EU-US Data Privacy Framework. For transfers to other countries, we implement Standard Contractual Clauses. **Regional knowledge**: Our EU/GDPR region guide (485+ lines of prospecting intelligence) covers EDPB guidance, member state variations, enforcement patterns, and best practices for compliant outreach in each EU country. Bard automatically adjusts messaging for EU prospects — formal tone, explicit opt-out, no tracking pixels without consent.',
    category: 'Regional & Compliance',
    subcategory: 'EU/GDPR',
    personas: ['it-admin', 'sales-leader', 'revops'],
    funnelStage: 'decision',
    relatedIds: ['sec-002', 'sec-004'],
    kbSlug: 'region-european-union',
  },
  {
    id: 'reg-002',
    question: 'Can LeadReach find and engage prospects in Japan, South Korea, and APAC markets?',
    answer: 'Yes, with full cultural and regulatory adaptation: **Japan**: Bard composes outreach in formal Japanese (敬語) with correct honorifics. Judge applies APPI (Act on Protection of Personal Information) compliance rules. Scout searches Japanese business registries (法人番号) and directories (TSR, Teikoku). Our Japan region guide covers keiretsu dynamics, nemawashi consensus-building, and meishi business card etiquette. **South Korea**: Bard uses Korean with appropriate formality levels. Judge applies PIPA (Personal Information Protection Act) rules. Scout searches KISLINE, NICE D&B, and DART. Our South Korea guide covers chaebol decision-making, ppalli-ppalli culture, and KakaoTalk as a B2B channel. **Southeast Asia**: Multi-country coverage with WhatsApp-dominant outreach (Indonesia, Vietnam, Thailand), LINE (Thailand), Zalo (Vietnam). Each country has specific data protection laws and cultural norms documented in our SEA region guide. **Language support**: Bard can compose outreach in Japanese, Korean, Simplified Chinese, Traditional Chinese, Vietnamese, Thai, Indonesian, Malay, and English. All with culturally appropriate formality and business norms.',
    category: 'Regional & Compliance',
    subcategory: 'APAC',
    personas: ['sales-leader', 'sdr-bdr', 'marketer'],
    funnelStage: 'consideration',
    relatedIds: ['gs-008', 'ai-005'],
    kbSlug: 'region-japan',
  },
  {
    id: 'reg-003',
    question: 'How does LeadReach handle outreach compliance in the US (CAN-SPAM, TCPA, CCPA)?',
    answer: 'US compliance is automated across three regulatory layers: **CAN-SPAM**: Bard automatically includes a physical postal address in every email, a clear unsubscribe link, accurate From name/email, and non-deceptive subject lines. Unsubscribes are processed within 10 business days (we process within 24 hours). **TCPA**: For cold calls, Judge verifies DNC (Do Not Call) registry status before Flow initiates phone outreach. We scrub against the National DNC registry every 31 days. Prior express consent is required for autodialed calls to mobile numbers. **CCPA/CPRA**: We include opt-out links for "sale" or "sharing" of personal information. We honor Do Not Sell requests. We categorize all data collection in our privacy notice. B2B contact data used for business purposes has specific exemptions under CCPA. **State privacy laws**: Our US region guide (748+ lines) covers 15+ state privacy laws including California, Virginia, Colorado, Connecticut, Utah, Texas, and emerging legislation. Bard automatically applies the most restrictive applicable law based on the prospect\'s state. **Practical result**: You don\'t need to be a compliance expert — our agents handle it automatically based on our continuously updated knowledge base.',
    category: 'Regional & Compliance',
    subcategory: 'US',
    personas: ['it-admin', 'sales-leader', 'revops'],
    funnelStage: 'decision',
    relatedIds: ['sec-002', 'sec-004'],
    kbSlug: 'region-united-states',
  },

  // =================================================================
  // 8. KNOWLEDGE BASE & DATA QUALITY
  // =================================================================
  {
    id: 'kb-001',
    question: 'What is the LeadReach Knowledge Base and how does it work?',
    answer: 'The Knowledge Base is LeadReach\'s proprietary intelligence layer containing **102+ documents** across 6 categories: **Industries (34 docs)**: Deep prospecting guides for 22 industries with buyer personas, ICP signals, technographic data, trigger events, outreach best practices, regulatory frameworks, vocabulary, common objections, and regional variants. **Regions (24 docs)**: B2B compliance and cultural guides for 16 regions with business registries, regulatory frameworks, cultural norms, hub cities, channel preferences, tax infrastructure, outreach compliance checklists, and playbook templates. **Playbooks (14 docs)**: Proven methodologies including outbound cold email, ICP discovery, multi-threaded selling, competitor displacement, event follow-up, referral programs, pricing negotiation, security review, and procurement navigation. **Agent Tools (8 docs)**: Operational manuals for each agent. **Training Data (8 files)**: 166+ few-shot examples. **Domain (6 docs)**: B2B lead generation core theory. The Knowledge Base uses hybrid retrieval: BM25 keyword matching for precise queries and optional semantic embeddings (Z.AI embedding-3) for conceptual matching. When agents process a lead, they retrieve the most relevant industry, region, and playbook documents to apply domain-specific intelligence. This is what makes LeadReach\'s output industry-grade rather than generic.',
    category: 'Knowledge Base',
    subcategory: 'Overview',
    personas: ['sales-leader', 'revops', 'it-admin'],
    funnelStage: 'consideration',
    relatedIds: ['ai-009', 'gs-008'],
    popular: true,
  },
  {
    id: 'kb-002',
    question: 'How often is the Knowledge Base updated? How do you ensure data freshness?',
    answer: 'The Knowledge Base follows a structured maintenance schedule: **Monthly gap reports**: Echo (Report Generator) runs a monthly gap analysis comparing existing documents against our expected coverage baseline (22 industries, 16 regions, 12 playbooks). Gaps are flagged for authoring. **Quarterly reviews**: Every document is reviewed at least quarterly for accuracy — market sizes, regulatory changes, technology landscapes, and buyer persona shifts. Documents receive a grade (A, B, C, D) and must maintain B or higher. **Trigger-based updates**: Major events (new regulation, industry disruption, significant market shift) trigger immediate document updates. For example, when the EU AI Act enforcement began, our EU/GDPR region guide was updated within 48 hours. **Freshness tracking**: Each document has a `lastReviewed` date. Documents not reviewed in 180+ days are flagged as "very stale" in gap reports. Currently, all documents are within the freshness window. **Community contributions**: Our knowledge engineering team includes former SDRs, RevOps professionals, and industry specialists who contribute domain expertise. **Version control**: All documents are versioned (V1, V2) with changelogs. Breaking changes (e.g., new compliance rules) trigger agent retraining.',
    category: 'Knowledge Base',
    subcategory: 'Maintenance',
    personas: ['revops', 'it-admin'],
    funnelStage: 'retention',
    relatedIds: ['kb-001'],
  },

  // =================================================================
  // 9. COMPETITIVE COMPARISON
  // =================================================================
  {
    id: 'comp-001',
    question: 'How does LeadReach compare to Apollo.io?',
    answer: 'Apollo is a contact database with basic sequencing. LeadReach is an autonomous agent workforce: **Data approach**: Apollo has a static database of ~275M contacts. LeadReach dynamically researches across 17+ channels in real-time, finding prospects that aren\'t in any database. **Enrichment**: Apollo provides firmographic data from its database. LeadReach\'s Forge agent enriches with 50+ data points including technographics, digital presence, trigger events, and source attribution from live web sources. **Outreach**: Apollo offers template-based sequences. LeadReach\'s Bard crafts genuinely personalized messages referencing specific, verifiable details about each prospect, guided by industry and region knowledge. **Scoring**: Apollo uses basic filters (title, industry, intent data). LeadReach\'s Judge applies a weighted, multi-signal composite model with explainability. **Automation**: Apollo requires manual list building, filtering, and sequence setup. LeadReach runs end-to-end autonomously after ICP definition. **Knowledge**: Apollo has no industry-specific intelligence. LeadReach has 102+ knowledge documents guiding every agent decision. **Pricing**: Apollo starts at $49/user/month. LeadReach starts at $149/month for the entire team (not per user). Use Apollo if you need a contact database. Use LeadReach if you need an autonomous pipeline.',
    category: 'Competitive',
    subcategory: 'vs. Apollo',
    personas: ['sales-leader', 'founder', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['gs-002', 'comp-002'],
    popular: true,
  },
  {
    id: 'comp-002',
    question: 'How does LeadReach compare to ZoomInfo?',
    answer: 'ZoomInfo is the market leader in B2B contact data and intent signals. Here\'s how LeadReach differs: **Data model**: ZoomInfo is a subscription data platform — you pay for access to their database. LeadReach is an autonomous pipeline — you pay for agents that work for you. **Intent data**: ZoomInfo\'s strongest feature is its intent signal network (Bombora integration). LeadReach doesn\'t rely on a single intent provider — Scout discovers behavioral signals across 17+ channels in real-time. **Cost**: ZoomInfo Enterprise starts at ~$15,000-$25,000/year. LeadReach Command is $399/month ($4,788/year) or $2,497 lifetime with Founders\' Pass. **Depth**: ZoomInfo provides broad firmographic and contact data. LeadReach provides deeper enrichment per lead — technographics, digital presence, trigger events, and industry-specific intelligence from our knowledge base. **Automation**: ZoomInfo requires manual workflow (search → filter → export → import to CRM → set up sequence). LeadReach automates the entire workflow end-to-end. **Best together**: Many customers use ZoomInfo as a data source alongside LeadReach for pipeline automation. Our API can ingest ZoomInfo data as a seed list for Scout.',
    category: 'Competitive',
    subcategory: 'vs. ZoomInfo',
    personas: ['sales-leader', 'founder', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['gs-002', 'comp-001'],
  },
  {
    id: 'comp-003',
    question: 'How does LeadReach compare to AI SDR tools like 11x, Artisan, or Relevance AI?',
    answer: 'AI SDR tools are emerging rapidly — here\'s how LeadReach differs: **Architecture**: Most AI SDR tools are single-agent (one AI that does everything). LeadReach uses 8 specialized agents that coordinate — each optimized for its specific function (discovery, enrichment, research, qualification, outreach, pipeline management, reporting, orchestration). **Knowledge base**: No other AI SDR tool has an integrated knowledge base with 102+ industry/region/playbook documents. This is why LeadReach produces industry-specific output rather than generic AI text. **Transparency**: Most AI SDR tools are black boxes — you see inputs and outputs. LeadReach\'s Agentic Pipeline Workspace shows you every agent decision, inter-agent communication, and lead transition in real-time. **Compliance**: LeadReach has built-in regional compliance for 16 markets. Most competitors are US-only or have minimal compliance features. **Pricing**: 11x starts at ~$500/month. Artisan starts at ~$400/month. LeadReach Command is $399/month with more features. **Customization**: LeadReach offers granular agent configuration, scoring weight customization, and approval workflows. Many AI SDR tools offer limited customization. **The tradeoff**: Single-agent tools may be simpler to set up. LeadReach requires more initial ICP definition but produces dramatically better results due to specialization and knowledge depth.',
    category: 'Competitive',
    subcategory: 'vs. AI SDR Tools',
    personas: ['sales-leader', 'founder', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['gs-002', 'ai-001'],
    popular: true,
  },

  // =================================================================
  // 10. SUPPORT, ONBOARDING & ACCOUNT
  // =================================================================
  {
    id: 'sup-001',
    question: 'What onboarding and support do you offer?',
    answer: 'We provide multiple support tiers: **All plans**: Email support (response within 24 hours), comprehensive documentation (/docs), interactive API documentation (/api-docs), and community forum. **Scout plan and above**: Priority email support (response within 4 hours), live chat during business hours (9am-6pm ET), and onboarding video library. **Command plan**: Dedicated onboarding session (1-hour call with a customer success manager), Slack channel for real-time support, and quarterly business reviews. **Enterprise**: Dedicated Customer Success Manager, custom onboarding program (2-4 weeks), 24/7 priority support with 1-hour response SLA, custom training sessions, and executive sponsor alignment. **Founders\' Pass**: Priority support (same as Command) for lifetime. **Self-service resources**: Knowledge base with 102+ industry/region/playbook documents, video tutorials, step-by-step guides, sample ICPs for 22 industries, and outreach template libraries for 16 regions.',
    category: 'Support & Account',
    subcategory: 'Support',
    personas: ['sales-leader', 'founder', 'sdr-bdr'],
    funnelStage: 'decision',
    relatedIds: ['gs-003', 'sup-002'],
  },
  {
    id: 'sup-002',
    question: 'How do I cancel my subscription? Is there a money-back guarantee?',
    answer: 'We make it easy to leave because we\'re confident you\'ll stay: **Cancellation**: Cancel anytime from Settings → Billing → Cancel Subscription. No phone calls, no retention scripts, no hidden buttons. Your access continues until the end of your current billing period. **Money-back guarantee**: 30-day money-back guarantee on all paid plans. If you\'re not satisfied within the first 30 days, email support and we\'ll refund your payment in full — no questions asked. **Data export**: Before cancellation, export all your data — leads, enrichment details, scoring models, campaign templates, and outreach sequences — in CSV, JSON, or Excel format. Your data remains accessible for 30 days after cancellation. **Account deletion**: After the 30-day post-cancellation window, all data is permanently deleted from our systems. You can request immediate deletion if needed. **Reactivation**: If you change your mind, you can reactivate your account within 90 days and pick up where you left off — all data, pipeline state, and configurations are preserved.',
    category: 'Support & Account',
    subcategory: 'Billing',
    personas: ['founder', 'procurement', 'sales-leader'],
    funnelStage: 'decision',
    relatedIds: ['pr-003', 'pr-005'],
  },
  {
    id: 'sup-003',
    question: 'Can I have multiple team members on one account?',
    answer: 'Yes, team collaboration is supported: **Team seats**: All plans support multiple team members. Scout includes 2 seats, Command includes 5 seats, Enterprise includes unlimited seats. Additional seats can be purchased on any plan. **Role-based access**: Admin, Manager, and Member roles with different permission levels. Admins can configure agents, Managers can review and approve outreach, Members can view pipeline and reports. **Shared campaigns**: Teams share campaign visibility — everyone sees the same pipeline, leads, and analytics. Outreach assignments can be distributed by territory, industry, or round-robin. **Shared ICPs**: ICP definitions are shared across the team, ensuring consistent targeting. **Activity tracking**: Every team member\'s actions are logged — who approved which message, who modified which ICP, who exported which lead list. **SSO**: Enterprise plans support SSO/SAML for team management through your identity provider.',
    category: 'Support & Account',
    subcategory: 'Team',
    personas: ['sales-leader', 'revops', 'it-admin'],
    funnelStage: 'decision',
    relatedIds: ['int-005', 'sup-001'],
  },

  // =================================================================
  // 11. USE CASES & SCENARIOS
  // =================================================================
  {
    id: 'uc-001',
    question: 'Can I use LeadReach for account-based marketing (ABM)?',
    answer: 'LeadReach is exceptionally well-suited for ABM because of its deep research and personalization capabilities: **Target account identification**: Define your ABM target list as an ICP, and Scout will discover accounts matching your ideal profile across all channels. Alternatively, import your target account list and let Forge, Sage, and Judge enrich, research, and qualify each one. **Multi-threaded engagement**: Flow manages multi-threaded outreach — engaging multiple stakeholders at the same account simultaneously (CRO, VP Sales, VP RevOps) with personalized messages for each persona. **Deep research**: Sage performs account-specific research — earnings calls, strategic initiatives, competitive landscape, organizational changes — to inform hyper-personalized messaging. **Intent signals**: Judge detects when target accounts show buying signals (hiring SDRs, adopting new technology, recent funding) and automatically increases priority. **Playbook alignment**: Our playbooks for competitor displacement, upsell-to-enterprise, and security review navigation are specifically designed for ABM scenarios. **CRM sync**: All ABM activities sync with your CRM for full pipeline visibility and attribution.',
    category: 'Use Cases',
    subcategory: 'ABM',
    personas: ['marketer', 'sales-leader'],
    funnelStage: 'consideration',
    relatedIds: ['ai-001', 'ai-012'],
    popular: true,
  },
  {
    id: 'uc-002',
    question: 'Can LeadReach help with international expansion — finding partners in new countries?',
    answer: 'This is one of LeadReach\'s most powerful use cases: **Country-specific research**: Scout searches local business registries (MCA India, ACRA Singapore, CAC Nigeria, Receita Federal Brazil), regional directories, and country-specific platforms (WeChat in China, KakaoTalk in South Korea). **Cultural adaptation**: Bard composes outreach in the local language with culturally appropriate formality — Japanese keigo for Japan, Korean honorifics for South Korea, Portuguese for Brazil (not European Portuguese). **Compliance by region**: Judge applies region-specific data protection laws — APPI in Japan, PIPA in South Korea, LGPD in Brazil, PDPA in Singapore, POPIA in South Africa. **Local business norms**: Our region guides cover cultural norms (nemawashi in Japan, wasta in MENA, ubuntu in Southern Africa), channel preferences (WhatsApp in Latin America and Southeast Asia, LINE in Thailand), and regulatory pitfalls to avoid. **Practical example**: If you\'re a US SaaS company expanding to Japan, Scout searches Japanese registries, Forge enriches with local data, Sage researches the company\'s Japan strategy, Judge qualifies with APPI-aware scoring, and Bard composes formal Japanese outreach — all automatically.',
    category: 'Use Cases',
    subcategory: 'International',
    personas: ['sales-leader', 'founder', 'marketer'],
    funnelStage: 'consideration',
    relatedIds: ['gs-008', 'reg-002'],
    popular: true,
  },
  {
    id: 'uc-003',
    question: 'I\'m a solo founder / small team. Is LeadReach too complex for me?',
    answer: 'LeadReach is actually ideal for small teams because it replaces the SDR team you can\'t afford to hire yet: **Solo founder**: Define your ICP, deploy agents, and let LeadReach run your entire outbound pipeline while you focus on closing deals and building product. The Launchpad plan (free) gives you 2 agents and 100 leads/month — enough to validate your market. The Founders\' Pass ($2,497 lifetime) is specifically designed for founders who want a one-time investment instead of another monthly SaaS bill. **Small team (2-5)**: Command plan gives you 5 seats, all 8 agents, and 10,000+ leads/month. Your team focuses on closing; LeadReach handles everything before the meeting. **No SDR hiring needed**: The average SDR costs $60,000-$80,000/year (salary + tools + management). LeadReach Command is $399/month ($4,788/year) — that\'s 92% less than one SDR, and it works 24/7 across 17+ channels. **Simple setup**: 15-minute onboarding, guided ICP definition, and one-click pipeline deployment. No complex configuration required.',
    category: 'Use Cases',
    subcategory: 'Small Teams',
    personas: ['founder', 'sdr-bdr'],
    funnelStage: 'consideration',
    relatedIds: ['gs-003', 'pr-001', 'pr-002'],
    popular: true,
  },
  {
    id: 'uc-004',
    question: 'Can LeadReach replace my entire SDR team?',
    answer: 'LeadReach can handle the top-of-funnel work that typically occupies 70-80% of an SDR\'s time — research, list building, enrichment, qualification, and initial outreach. Here\'s the realistic picture: **What LeadReach replaces**: Manual prospecting across databases, list building and deduplication, data enrichment and verification, lead scoring and prioritization, initial outreach composition and sequencing, follow-up management, and pipeline reporting. **What still needs humans**: Complex deal strategy and negotiation, relationship building with key accounts, handling nuanced objections in real-time conversations, navigating complex enterprise procurement, and closing deals. **The hybrid model (most common)**: 1-2 AEs focus on closing while LeadReach fills the pipeline. This is more effective and 60-90% cheaper than a traditional SDR→AE model. **The fully autonomous model**: For SMB/Mid-market deals with shorter sales cycles, some customers let LeadReach handle everything through meeting booking, and the founder/CEO just takes the calls. **Metrics**: Our customers who replaced their SDR team with LeadReach typically see: 3x more qualified leads per dollar spent, 5x faster pipeline velocity, 0% SDR turnover (because there are no SDRs), and 60% reduction in cost-per-meeting-booked.',
    category: 'Use Cases',
    subcategory: 'SDR Replacement',
    personas: ['sales-leader', 'founder', 'revops'],
    funnelStage: 'consideration',
    relatedIds: ['gs-005', 'comp-003', 'pr-006'],
    popular: true,
  },
  {
    id: 'uc-005',
    question: 'Can I use LeadReach for B2C lead generation (not just B2B)?',
    answer: 'Yes, LeadReach offers dedicated B2C plans: **Setter plan** ($97/month): 2 AI agents, 500 leads/month, optimized for social media channels (Instagram, Facebook, TikTok), influencer outreach, and community-based prospecting. **Closer plan** ($297/month): Unlimited agents, 10,000+ leads/month, all channels including social media, messaging apps (WhatsApp, Messenger), and content platforms. **Agency plan** (Custom): Multi-client management, white-label options, and bulk outreach capabilities. **B2C-specific features**: Social media lead discovery (Instagram followers, Facebook group members, TikTok creators), influencer identification and outreach, WhatsApp Business messaging, and consumer-focused outreach templates. **Compliance**: All B2C outreach follows CAN-SPAM, TCPA, and platform-specific terms of service. We\'re more cautious with B2C data collection due to stricter consent requirements under GDPR and CCPA for consumer data.',
    category: 'Use Cases',
    subcategory: 'B2C',
    personas: ['founder', 'marketer', 'channel-partner'],
    funnelStage: 'consideration',
    relatedIds: ['pr-001'],
  },
];

// ============================================================
// Category Definitions
// ============================================================

export interface FAQCategoryDef {
  id: string;
  label: string;
  icon: string;   // Lucide icon name
  description: string;
  color: string;  // Tailwind color class
}

export const FAQ_CATEGORIES: FAQCategoryDef[] = [
  { id: 'Getting Started', label: 'Getting Started', icon: 'Rocket', description: 'Basics, onboarding, first steps, and expected results', color: 'emerald' },
  { id: 'Agents & AI', label: 'Agents & AI', icon: 'Brain', description: 'How the 8 agents work, configuration, scoring, and knowledge base', color: 'violet' },
  { id: 'Pricing & Plans', label: 'Pricing & Plans', icon: 'CreditCard', description: 'Plans, billing, ROI, and the Founders\' Pass', color: 'amber' },
  { id: 'Security & Compliance', label: 'Security & Compliance', icon: 'Shield', description: 'Data security, GDPR, CCPA, and certifications', color: 'rose' },
  { id: 'Integrations & Technical', label: 'Integrations & Technical', icon: 'Plug', description: 'CRM, API, email, data warehouse, and authentication', color: 'cyan' },
  { id: 'Industry-Specific', label: 'Industry-Specific', icon: 'Building2', description: 'SaaS, FinTech, healthcare, supply chain, and more', color: 'indigo' },
  { id: 'Regional & Compliance', label: 'Regional & Compliance', icon: 'Globe', description: 'EU/GDPR, APAC, US compliance, and international outreach', color: 'sky' },
  { id: 'Knowledge Base', label: 'Knowledge Base', icon: 'BookOpen', description: 'What\'s inside, how it works, and data freshness', color: 'teal' },
  { id: 'Competitive', label: 'Competitive', icon: 'Swords', description: 'vs. Apollo, vs. ZoomInfo, vs. AI SDR tools', color: 'orange' },
  { id: 'Support & Account', label: 'Support & Account', icon: 'Headset', description: 'Onboarding, cancellation, team management, and billing', color: 'pink' },
  { id: 'Use Cases', label: 'Use Cases', icon: 'Lightbulb', description: 'ABM, international expansion, solo founders, SDR replacement, B2C', color: 'lime' },
];

// ============================================================
// Helper Functions
// ============================================================

export function getFAQsByCategory(category: string): FAQItem[] {
  return FAQ_ITEMS.filter(faq => faq.category === category);
}

export function getPopularFAQs(): FAQItem[] {
  return FAQ_ITEMS.filter(faq => faq.popular);
}

export function getNewFAQs(): FAQItem[] {
  return FAQ_ITEMS.filter(faq => faq.new);
}

export function searchFAQs(query: string): FAQItem[] {
  const lower = query.toLowerCase();
  const terms = lower.split(/\s+/).filter(t => t.length > 1);

  return FAQ_ITEMS
    .map(faq => {
      let score = 0;
      const q = faq.question.toLowerCase();
      const a = faq.answer.toLowerCase();

      for (const term of terms) {
        if (q.includes(term)) score += 3;  // question match is strongest
        if (a.includes(term)) score += 1;  // answer match
        if (faq.subcategory.toLowerCase().includes(term)) score += 2;  // subcategory match
        if (faq.category.toLowerCase().includes(term)) score += 1;  // category match
      }

      // Boost popular items slightly
      if (faq.popular) score += 0.5;

      return { faq, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ faq }) => faq);
}

export function getFAQsByPersona(persona: UserPersona): FAQItem[] {
  return FAQ_ITEMS.filter(faq => faq.personas.includes(persona));
}

export function getFAQsByFunnelStage(stage: FunnelStage): FAQItem[] {
  return FAQ_ITEMS.filter(faq => faq.funnelStage === stage);
}

export function getRelatedFAQs(faqId: string): FAQItem[] {
  const faq = FAQ_ITEMS.find(f => f.id === faqId);
  if (!faq || !faq.relatedIds) return [];
  return faq.relatedIds
    .map(id => FAQ_ITEMS.find(f => f.id === id))
    .filter((f): f is FAQItem => f !== undefined);
}

export function getFAQStats() {
  return {
    total: FAQ_ITEMS.length,
    categories: FAQ_CATEGORIES.length,
    popular: FAQ_ITEMS.filter(f => f.popular).length,
    byCategory: FAQ_CATEGORIES.map(cat => ({
      category: cat.id,
      count: FAQ_ITEMS.filter(f => f.category === cat.id).length,
    })),
  };
}
