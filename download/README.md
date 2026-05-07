# LeadReach AI — Autonomous Agentic Lead Generation Platform

> Deploy 8 specialized AI agents that discover, enrich, qualify, and engage leads across 17+ internet channels — all on autopilot. Turn your sales pipeline into an autonomous machine.

---

## Table of Contents

- [What Is LeadReach AI?](#what-is-leadreach-ai)
- [How It Works: The Full Pipeline](#how-it-works-the-full-pipeline)
- [The 8 AI Agents](#the-8-ai-agents)
- [17+ Internet Channels](#17-internet-channels)
- [Platform Architecture](#platform-architecture)
- [For End-Users: Getting Results](#for-end-users-getting-results)
- [For Agency Owners: Scaling Lead Generation](#for-agency-owners-scaling-lead-generation)
- [For Investors: Market Opportunity](#for-investors-market-opportunity)
- [For Developers: Technical Deep Dive](#for-developers-technical-deep-dive)
- [Data Model & Pipeline Stages](#data-model--pipeline-stages)
- [Intelligence & Scoring Engine](#intelligence--scoring-engine)
- [Resilience & Fallback Systems](#resilience--fallback-systems)
- [Tech Stack](#tech-stack)
- [Pages & Routes](#pages--routes)
- [Security & Privacy](#security--privacy)
- [Roadmap](#roadmap)

---

## What Is LeadReach AI?

LeadReach AI is a fully autonomous, agentic lead generation platform that replaces manual prospecting with a coordinated workforce of 8 AI agents. Each agent is a specialist — one discovers prospects, another enriches their data, another qualifies them against your ideal customer profile, and another crafts personalized outreach messages. Together, they form an always-on pipeline that delivers qualified leads while you sleep.

The platform is built on top of **Agent-Reach**, an open-source toolkit that gives AI agents real internet access through 17+ channels. This means every agent can search LinkedIn, read company websites, scan Twitter conversations, browse GitHub repositories, watch YouTube videos, and mine Reddit discussions — all simultaneously and autonomously, without any human intervention.

Unlike traditional lead generation tools that require you to manually search, filter, and contact prospects one by one, LeadReach AI orchestrates the entire workflow from discovery to outreach in a single, automated pipeline. You define your ideal customer profile, and the agents handle everything else.

### Why This Is Different

Traditional tools give you data. LeadReach AI gives you outcomes. The difference is agency — our AI agents don't just fetch information; they make decisions, prioritize leads, personalize messages, and manage your pipeline autonomously. The Orchestrator agent coordinates the entire workflow, ensuring that each specialist agent fires at the right time with the right context, creating a seamless end-to-end experience that turns raw internet data into booked meetings.

---

## How It Works: The Full Pipeline

The LeadReach AI pipeline is a multi-stage, fully automated process that transforms a simple query like "SaaS companies in Berlin with 50-200 employees" into a pipeline of scored, enriched leads with personalized outreach messages ready to send.

### Step 1: Define Your Target

You provide a natural language description of your ideal customer — industry, location, company size, technology stack, buying signals, or any other criteria. The Orchestrator agent parses this into a structured execution plan.

### Step 2: Multi-Channel Discovery

The Prospect Discovery agent launches parallel searches across all available channels simultaneously — Exa semantic search, LinkedIn people and company search, Twitter user search, Reddit discussions, and more. It collects hundreds of raw results in seconds, then uses the LLM to extract structured company data (name, website, industry, location, contact info).

### Step 3: Deep Enrichment

The Data Enrichment agent takes each discovered lead and enriches it with detailed information. It reads company websites via Jina Reader, searches LinkedIn for key people and company profiles, finds Twitter handles, and cross-references multiple sources. The LLM synthesizes all this data into a complete, enriched lead profile with firmographics, contact details, and key decision-makers.

### Step 4: Intelligent Qualification

The Lead Qualification agent scores each enriched lead against your ideal customer profile. It searches for intent signals (hiring, expansion, funding, new offices) via Exa, reads LinkedIn profiles for fit assessment, and calculates a multi-dimensional score covering firmographic fit, intent signals, reachability, and strategic value. Leads are categorized as Hot, Warm, or Cold.

### Step 5: Personalized Outreach

The Outreach Composer agent researches each qualified lead's company challenges, pain points, and recent news, then crafts hyper-personalized cold emails that reference specific details about the company. Each message includes a compelling subject line, a value-driven body, and a clear call-to-action — all generated using real intelligence gathered from the company's website and online presence.

### Step 6: Pipeline Management & Reporting

The Pipeline Manager tracks lead stages, schedules follow-ups, and maintains pipeline health. The Report Generator produces comprehensive analytics with actionable insights on campaign performance, agent efficiency, and ROI — all synthesized by the LLM from your actual campaign data.

---

## The 8 AI Agents

Each agent is a specialist with a defined role, specific channel access, and a unique set of capabilities. Together, they form a coordinated workforce that handles the entire lead generation lifecycle.

### 1. Orchestrator (Codename: Atlas)

The master coordinator that plans and delegates all work. When you submit a request, the Orchestrator breaks it into a structured execution plan, creates sub-tasks for each specialist agent, and monitors their progress. It determines which agents to activate, in what order, and with what input — creating a dependency graph that ensures efficient, parallel execution wherever possible.

- **Channel Access**: None directly — delegates to specialized agents
- **Core Capability**: Execution planning, task decomposition, campaign creation, progress monitoring
- **Output**: Structured execution plan with sub-tasks, campaign records, dependency graph
- **Intelligence**: Uses LLM to understand natural language requests and create optimal execution strategies

### 2. Prospect Discovery (Codename: Scout)

The primary lead-finding agent. It searches across all available channels simultaneously, collecting hundreds of raw results, then uses the LLM to extract structured company data. It is the first agent to fire in any pipeline, responsible for filling the top of the funnel with real, verified companies.

- **Channel Access**: Exa Search, Web (Jina Reader), LinkedIn (People + Companies), GitHub, Twitter, Reddit, RSS
- **Core Capability**: Multi-channel parallel search, company extraction, deduplication, lead creation
- **Output**: Structured lead records with company name, website, industry, location, and available contact data
- **Resilience**: If all channels fail, generates companies from LLM knowledge as a fallback

### 3. Data Enrichment (Codename: Augment)

Takes raw leads and fills in every missing detail. For each lead, it reads the company website, searches LinkedIn for people and company pages, finds Twitter profiles, and cross-references multiple sources. The LLM synthesizes all gathered intelligence into a comprehensive, enriched lead profile.

- **Channel Access**: Web (Jina Reader), LinkedIn (People + Companies), Exa Search, Twitter, GitHub
- **Core Capability**: Website content extraction, LinkedIn profile parsing, contact discovery, firmographic estimation
- **Output**: Fully enriched lead records with phone, email, CEO name, employee count, revenue estimate, LinkedIn URL, Twitter handle, and company description
- **Resilience**: If no web data is available, generates best estimates from LLM knowledge

### 4. Web Research (Codename: Analyst)

Performs deep, multi-source research on any topic, company, or market. Unlike the discovery agent (which finds companies), the research agent synthesizes intelligence — reading top results in depth, compiling findings across channels, and producing a comprehensive analysis brief with key findings, market insights, trends, and recommendations.

- **Channel Access**: Web (Jina Reader), Exa Search, LinkedIn (Companies), Twitter, YouTube, Reddit, RSS
- **Core Capability**: Multi-source research, deep reading, intelligence synthesis, trend analysis
- **Output**: Research brief with executive summary, key findings, market insights, company list, trends, recommendations, and sourced references
- **Special Feature**: Reads top search results in depth via Jina Reader for comprehensive analysis beyond snippets

### 5. Lead Qualification (Codename: Judge)

Scores and qualifies enriched leads against your ideal customer profile. It searches for intent signals (hiring, expansion, funding, new offices), assesses firmographic fit, evaluates reachability, and calculates a multi-dimensional lead score. Leads are categorized into Hot, Warm, and Cold tiers with specific recommendations for each.

- **Channel Access**: Web (Jina Reader), LinkedIn, Exa Search
- **Core Capability**: Intent signal detection, ICP scoring, multi-dimensional evaluation, tier classification
- **Output**: Qualified leads with scores (firmographic, intent, reachability, strategic), tier assignment, and actionable recommendations
- **Scoring Dimensions**: Firmographic Fit (0-25), Intent Signals (0-25), Reachability (0-25), Strategic Value (0-25), Data Completeness (0-10)
- **Resilience**: If no enriched leads exist, qualifies new leads directly (skips enrichment requirement)

### 6. Outreach Composer (Codename: Scribe)

Crafts hyper-personalized outreach messages using real intelligence about each lead's company. It researches company challenges and pain points, reads the company website for specific hooks, and composes tailored cold emails that reference actual details — not generic templates.

- **Channel Access**: LinkedIn, Web (Jina Reader), Exa Search
- **Core Capability**: Company research for personalization, message composition, tone matching, CTA generation
- **Output**: Personalized outreach messages with subject line, body, tone, CTA, and personalization hooks — stored as draft records ready for review
- **Resilience**: If no hot/warm leads available, composes outreach for cold leads as well

### 7. Pipeline Manager (Codename: Steward)

Manages the health and flow of your sales pipeline. It tracks lead stages across the entire lifecycle, identifies leads that need follow-up, schedules next actions, and provides pipeline analytics. It operates entirely on database records without direct channel access, ensuring your pipeline stays organized and no leads fall through the cracks.

- **Channel Access**: None — operates on database records
- **Core Capability**: Stage tracking, follow-up scheduling, pipeline metrics calculation, bottleneck identification
- **Output**: Pipeline metrics (stage counts, tier distribution), follow-up schedules, health indicators

### 8. Report Generator (Codename: Chronicler)

Produces comprehensive analytics reports from your campaign data. It aggregates lead counts, outreach metrics, stage distributions, and score averages across all campaigns, then uses the LLM to synthesize actionable insights — what's working, what's not, and what to do next.

- **Channel Access**: None — operates on collected data
- **Core Capability**: Data aggregation, insight generation, trend analysis, performance reporting
- **Output**: Comprehensive report with executive summary, key metrics, campaign analysis, recommendations, and identified risks

---

## 17+ Internet Channels

Agent-Reach provides real internet access through 17+ channels, each with multi-source fallback pipelines that ensure reliability even when individual APIs are unavailable.

### Always Active (Zero Configuration Required)

| Channel | Backend | What It Does |
|---------|---------|-------------|
| **Web** | Jina Reader | Read any webpage, extract content, parse company sites — zero config, works instantly |
| **Exa Search** | mcporter / Jina Search | AI-powered semantic web search with high-quality, relevant results |
| **LinkedIn** | Exa + Jina Reader (Smart Fallback) | Search people, search companies, read profiles, extract firmographic data |
| **Twitter/X** | Exa + Jina Reader (Smart Fallback) | Search tweets, find user profiles, read threads, extract social intelligence |
| **YouTube** | yt-dlp | Video metadata, subtitles/transcripts, channel search, content extraction |
| **GitHub** | gh CLI | Repository search, code search, organization info, tech stack detection |
| **RSS Feeds** | Feedparser | Parse and read any RSS/Atom feed for industry news and signals |
| **Bilibili** | yt-dlp + Platform API Keys | Video subtitle extraction with 3 platform keys and auto-rotation |
| **Weibo** | Weibo API | Hot topics, search, user posts, and comment extraction |
| **V2EX** | V2EX API | Hot posts, node discussions, and user information |
| **Xueqiu** | Xueqiu API | Stock quotes, financial data, and trending investment posts |

### Available with Configuration

| Channel | Tier | What It Does |
|---------|------|-------------|
| **Reddit** | Needs Key | Post search, subreddit browsing, community intelligence (cookie login) |
| **WeChat Articles** | Needs Key | WeChat public account article search and full-text reading |
| **XiaoHongShu** | Needs Setup | Note search, reading, and interaction (cookie export required) |
| **Douyin** | Needs Setup | Video parsing and watermark-free downloads (mcporter setup) |
| **Xiaoyuzhou** | Needs Setup | Podcast audio-to-text transcription (Groq API key + ffmpeg) |

### Multi-Source Fallback Architecture

Every channel operates with a layered fallback system. If the primary source fails, the system automatically tries the next available source. For example, LinkedIn searches go through:

1. **mcporter** (highest quality, if MCP server is available)
2. **Exa Semantic Search** (searches LinkedIn's public index)
3. **Jina Search** (final fallback, parses search results)

This ensures that agents always get data, even when individual APIs experience downtime or rate limits. The same pattern applies to Twitter, Reddit, YouTube, and every other channel — the system degrades gracefully rather than failing completely.

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│   Landing Page │ Dashboard │ Agents │ Campaigns │ Leads  │
│   Outreach │ Reports │ Blog │ FAQ │ Privacy │ Terms      │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    API LAYER                             │
│   /api/agents/execute │ /api/leads │ /api/campaigns     │
│   /api/outreach │ /api/ai │ /api/agent-reach            │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              AGENT EXECUTION ENGINE                       │
│                                                          │
│   Orchestrator ──► Prospect Discovery                    │
│        │          Data Enrichment                        │
│        │          Web Research                           │
│        ├──────► Lead Qualification                      │
│        │          Outreach Composer                      │
│        ├──────► Pipeline Manager                        │
│        └──────► Report Generator                        │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│             AGENT-REACH TOOL BRIDGE                      │
│   webRead │ exaSearch │ linkedInSearchPeople             │
│   linkedInSearchCompanies │ linkedInReadCompanyPage      │
│   linkedInGetProfile │ twitterSearch │ twitterReadTweet  │
│   twitterSearchUsers │ githubSearchRepos │ redditSearch  │
│   youtubeSearch │ youtubeGetSubtitles │ rssRead          │
│   discoverBusinesses │ enrichCompanyData                 │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    INTERNET                               │
│   Jina Reader │ Exa │ LinkedIn │ Twitter/X │ YouTube    │
│   GitHub │ Reddit │ RSS │ Bilibili │ Weibo │ V2EX       │
│   Xueqiu │ WeChat │ And more...                         │
└─────────────────────────────────────────────────────────┘
```

The architecture follows a strict layered design where each layer only communicates with the layer directly above or below it. The UI never calls Agent-Reach directly — it goes through the API layer, which dispatches to the Agent Execution Engine. The engine then calls the Tool Bridge, which executes the actual HTTP/CLI commands against internet services. Results flow back up through the same layers, with the LLM processing data at each stage to extract structured intelligence from raw web content.

---

## For End-Users: Getting Results

### How to Generate Leads in 3 Steps

**1. Launch the Platform**

Navigate to the LeadReach AI dashboard. The intuitive interface gives you immediate access to all 8 agents, your campaign dashboard, lead pipeline, and outreach center.

**2. Submit Your Request**

Use natural language to describe your target. Examples that work well:

- "Find SaaS companies in Berlin with 50-200 employees that are hiring"
- "Prospect fintech startups in Singapore that recently raised Series A"
- "Discover AI agencies in London that use Python and have open roles"
- "Search for e-commerce companies in the US using Shopify with revenue over $5M"

The more specific your criteria, the more targeted your results. Include industry, location, company size indicators, technology preferences, and any buying signals you care about.

**3. Review and Send**

The agents run autonomously through the full pipeline. Within minutes, you'll have:

- **Discovered leads** with company names, websites, and industries
- **Enriched profiles** with contact details, key people, firmographics, and social links
- **Qualified scores** categorizing leads as Hot, Warm, or Cold with detailed reasoning
- **Personalized outreach messages** referencing specific company details, ready for your review

All outreach messages start as drafts — you review, edit if needed, and approve them before anything is sent.

### Understanding Lead Scores

Every lead receives a multi-dimensional score (0-100):

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Firmographic Fit | 0-25 | How well the company matches your ICP (industry, size, location) |
| Intent Signals | 0-25 | Buying signals: hiring, expansion, funding, technology adoption |
| Reachability | 0-25 | How contactable the lead is (email, phone, LinkedIn availability) |
| Strategic Value | 0-25 | Long-term potential: market position, growth trajectory, alignment |
| Data Completeness | 0-10 | How much information we have (more data = higher confidence) |

Leads are then categorized:

- **Hot (Score 70+)**: Strong fit across multiple dimensions — prioritize outreach
- **Warm (Score 40-69)**: Good potential — include in nurture sequences
- **Cold (Score < 40)**: Weak fit or insufficient data — consider for future campaigns

### Pipeline Stages

Every lead moves through a defined pipeline:

`New` → `Enriched` → `Qualified` → `Contacted` → `Engaged` → `Negotiating` → `Closed Won` / `Closed Lost` / `Nurture`

The Pipeline Manager agent automatically advances leads through stages and schedules follow-ups, ensuring no opportunity falls through the cracks.

---

## For Agency Owners: Scaling Lead Generation

### Multi-Client Campaign Management

LeadReach AI is designed for agencies managing multiple clients simultaneously. Each campaign operates independently with its own target criteria, lead pool, and outreach strategy. The Orchestrator agent ensures that tasks for different campaigns don't interfere with each other, and the Pipeline Manager provides per-campaign analytics.

### Channel Diversification

The 17+ channel coverage means you're not dependent on any single data source. If LinkedIn search is rate-limited, the system falls back to Exa and Jina Reader. If Twitter changes its API, the smart fallback pipeline switches to alternative methods. This diversification ensures consistent lead flow regardless of external platform changes.

### Volume and Speed

- A single pipeline run can discover **15-50 new leads** depending on the query and channels
- Enrichment processes **up to 20 leads per task** with deep web research
- Qualification evaluates **up to 30 leads per task** with intent signal analysis
- Outreach composition personalizes **up to 15 messages per task**
- All stages run with parallel channel calls, maximizing speed

### Customization for Client Verticals

The LLM-powered agents adapt to any industry vertical without custom configuration. Whether your client targets healthcare, fintech, manufacturing, or any other sector, the agents understand industry-specific terminology, relevant buying signals, and appropriate outreach tones. The system learns from the context you provide — no training required.

---

## For Investors: Market Opportunity

### The Problem

B2B sales teams spend 21% of their time prospecting (Salesforce State of Sales). The average SDR makes 94 calls per day but only books 1-2 meetings. Manual lead generation is slow, expensive, and doesn't scale. Existing tools like ZoomInfo, Apollo, and Lusha provide data but don't automate the workflow — sales teams still need to manually search, filter, enrich, qualify, and compose outreach for every single lead.

### The Solution

LeadReach AI replaces the entire manual workflow with autonomous AI agents that handle discovery, enrichment, qualification, and outreach in a single, automated pipeline. The key innovation is **agentic orchestration** — instead of providing tools that humans must operate, we deploy AI agents that operate the tools themselves, making decisions and taking actions autonomously.

### Key Differentiators

| Factor | Traditional Tools | LeadReach AI |
|--------|------------------|--------------|
| Data freshness | Periodic database updates | Real-time web research via 17+ channels |
| Lead discovery | Database query | Multi-channel autonomous search |
| Enrichment | Static firmographics | Dynamic, multi-source deep enrichment |
| Qualification | Manual scoring rules | AI-powered multi-dimensional scoring with intent signals |
| Outreach | Template-based | Hyper-personalized using real company intelligence |
| Pipeline management | Manual tracking | Autonomous stage transitions and follow-up scheduling |
| Scalability | Limited by human capacity | Unlimited parallel agent execution |

### Market Size

The global sales intelligence market is projected to reach $8.6B by 2028 (MarketsandMarkets). The AI-powered sales tools segment is the fastest growing, driven by the shift from manual to autonomous workflows. LeadReach AI positions itself at the intersection of sales intelligence, AI automation, and agentic systems — three converging trends that are reshaping how B2B sales operates.

---

## For Developers: Technical Deep Dive

### Agent Execution Flow

The Agent Execution Engine (`src/lib/agent-executor.ts`) is the core runtime. Here's how a task flows through the system:

```
1. User submits request via API or AI chat
2. Task record created in SQLite (status: pending)
3. Engine picks up task, dispatches to correct agent handler
4. Agent handler calls Agent-Reach Bridge tools (parallel where possible)
5. Raw data fed to LLM (z-ai-web-dev-sdk) for structured extraction
6. Results stored in database (leads, outreach, campaign records)
7. Task progress updated in real-time (0-100%)
8. Channel activity logged for transparency
```

### LLM Integration

Every agent uses the LLM for structured data extraction. The system includes robust JSON parsing with multiple strategies:

1. **Markdown code block extraction**: Strips `json` fences
2. **Balanced bracket matching**: Finds first valid JSON object/array
3. **Full response parsing**: Attempts to parse entire response
4. **Retry with emphasis**: Re-prompts with explicit JSON-only instructions (up to 2 retries)
5. **Safe defaults**: Returns a structured default instead of crashing

This resilience ensures that even when the LLM produces imperfect output, the pipeline continues functioning.

### Agent-Reach Tool Bridge

The Tool Bridge (`src/lib/agent-reach-bridge.ts`) executes real HTTP/CLI commands against Agent-Reach channels. Each function returns a standardized `ToolResult<T>` with success status, data, source, channel, raw output, and timestamp. Key implementation details:

- **Jina Reader**: Direct HTTP fetch to `r.jina.ai/URL` — zero config, works instantly
- **Exa Search**: Primary via mcporter CLI, fallback to Jina Search API (`s.jina.ai/`)
- **GitHub**: Uses `gh search repos` CLI with JSON output — zero config for public repos
- **Reddit**: Direct HTTP fetch to Reddit's public JSON API, fallback to Jina Reader
- **YouTube**: Uses `yt-dlp --dump-json` for metadata and `--write-sub` for subtitles
- **LinkedIn**: Multi-source pipeline — mcporter → Exa semantic → Jina Reader
- **Twitter/X**: Multi-source pipeline — bird CLI → Exa semantic → Jina Search
- **RSS**: Python feedparser via command line
- **Bilibili**: yt-dlp + platform API keys with auto-rotation

Every channel function includes timeout handling, error recovery, and structured logging.

### Database Schema

The Prisma ORM manages four core models:

- **Campaign**: Target criteria, lead counts, status tracking
- **Lead**: 35+ fields covering company info, location, contacts, firmographics, digital presence, qualification scores, and pipeline stage
- **Outreach**: Channel, type, subject, body, status tracking (draft → sent → opened → replied)
- **AgentTask**: Agent name, task type, input/output JSON, progress tracking, priority queue

### API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agents/execute` | POST | Execute single agent, all agents, or dispatch to orchestrator |
| `/api/agents` | GET/POST | List agents, check status |
| `/api/leads` | GET/POST | List and create leads |
| `/api/leads/[id]` | GET/PATCH/DELETE | Individual lead operations |
| `/api/campaigns` | GET/POST | List and create campaigns |
| `/api/campaigns/[id]` | GET/PATCH/DELETE | Individual campaign operations |
| `/api/outreach` | GET/POST | List and create outreach messages |
| `/api/ai` | POST | AI chat endpoint for natural language interaction |
| `/api/agent-reach` | GET/POST | Channel health check and configuration |
| `/api/seed` | POST | Seed database with sample data |

### Execution Modes

The `/api/agents/execute` endpoint supports three execution modes:

- **Single Agent**: Execute one specific agent with provided input
- **All Agents**: Run the full pipeline (discovery → enrichment → qualification → outreach → pipeline management → reporting)
- **Dispatch**: Submit a natural language request to the Orchestrator, which creates an optimized execution plan

---

## Data Model & Pipeline Stages

### Lead Schema (35+ Fields)

**Company Information**: companyName, legalName, website, industry, subIndustry, sicCode, naicsCode

**Location**: hqAddress, city, stateProvince, country, postalCode

**Contact Information**: phoneMain, phoneDirect, generalEmail, supportEmail

**Key People**: ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail

**Firmographics**: employeeCount, revenueEstimate, foundingYear, ownershipType

**Digital Presence**: linkedinUrl, twitterHandle, facebookPage, techStack

**Qualification Scores**: leadScore (0-100), leadTier (hot/warm/cold/unqualified), firmographicScore, intentScore, reachabilityScore, strategicScore, dataCompleteness

**Pipeline Tracking**: stage, lastContactDate, nextFollowUp, notes, sources, discoveredAt, enrichedAt, qualifiedAt, contactedAt

### Pipeline Stage Definitions

| Stage | Description | Agent Responsible |
|-------|-------------|-------------------|
| `new` | Raw lead from discovery, minimal data | Prospect Discovery |
| `enriched` | Detailed data filled in from multiple sources | Data Enrichment |
| `qualified` | Scored and categorized by ICP fit | Lead Qualification |
| `contacted` | Outreach message composed and sent | Outreach Composer |
| `engaged` | Lead has responded or shown interest | Pipeline Manager |
| `negotiating` | Active deal discussion in progress | Pipeline Manager |
| `closed_won` | Deal successfully closed | Pipeline Manager |
| `closed_lost` | Deal lost or disqualified | Pipeline Manager |
| `nurture` | Not ready now, but potential for future | Pipeline Manager |

---

## Intelligence & Scoring Engine

The Lead Qualification agent uses a multi-dimensional scoring framework that evaluates leads across five independent dimensions, each designed to capture a different aspect of lead quality.

### Firmographic Fit Score (0-25)

Measures how well the company matches your ideal customer profile. Factors include industry alignment, company size fit, geographic relevance, and technology stack compatibility. A SaaS company targeting enterprise clients would score a 50-person startup low on firmographic fit even if it has strong intent signals.

### Intent Signal Score (0-25)

Detects active buying signals that indicate a company is in-market for your solution. The agent searches for hiring patterns (especially for roles related to your product), recent funding rounds, office expansions, technology adoption signals, and public statements of need. A company actively hiring for a role your product serves is a strong intent signal.

### Reachability Score (0-25)

Evaluates how contactable the lead is based on available communication channels and data quality. Higher scores go to leads with direct email addresses, phone numbers, and active LinkedIn profiles. This score helps prioritize outreach efforts toward leads you can actually reach.

### Strategic Value Score (0-25)

Assesses long-term strategic potential beyond immediate fit. Factors include market position, competitive landscape, growth trajectory, partnership potential, and lifetime value indicators. A market leader in your target vertical scores high on strategic value even if they're not actively buying.

### Data Completeness Score (0-10)

Measures how much information we have about the lead, which directly correlates with scoring confidence. A lead with 30 out of 35 fields populated has a higher data completeness score than one with only 10 fields, meaning the other dimension scores are more reliable.

### Composite Score Calculation

The overall lead score is the sum of all five dimensions (0-110, normalized to 0-100). Tier assignments:

- **Hot**: Score >= 70 — immediate outreach priority
- **Warm**: Score 40-69 — include in nurture sequences
- **Cold**: Score < 40 — deprioritize or archive

---

## Resilience & Fallback Systems

The platform is designed with defense-in-depth resilience. No single point of failure can halt the pipeline.

### Channel-Level Fallbacks

Every channel function implements a multi-source pipeline. If the primary source is unavailable, the system automatically tries alternatives:

- **LinkedIn**: mcporter → Exa Semantic Search → Jina Search
- **Twitter/X**: bird CLI → Exa Semantic Search → Jina Search
- **Exa Search**: mcporter → Jina Search API
- **Reddit**: Reddit JSON API → Jina Reader
- **YouTube**: yt-dlp → Jina Reader

### Agent-Level Fallbacks

- **Prospect Discovery**: If all search channels return no results, generates companies from LLM knowledge
- **Data Enrichment**: If no web data is found for a lead, produces best estimates from LLM knowledge and marks them accordingly
- **Lead Qualification**: If no enriched leads exist, qualifies new leads directly (skips enrichment requirement)
- **Outreach Composer**: If no hot/warm leads are available, composes outreach for cold leads
- **Pipeline Advancement**: Even if enrichment or qualification fails for a lead, it is automatically advanced to prevent pipeline stalling

### LLM Resilience

- Automatic retry on timeout (up to 2 retries)
- Multiple JSON extraction strategies (code blocks, balanced brackets, full parse)
- Re-prompt with explicit JSON-only instructions on parse failure
- Safe default values returned when all retries are exhausted
- No unhandled exceptions — every LLM call is wrapped in error recovery

### Database Resilience

- All database operations wrapped in try/catch
- Individual lead failures don't halt the entire batch
- Progress is persisted after each step, so tasks can resume after interruption
- Campaign counters are updated atomically using Prisma's `increment`

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | Latest |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui + Radix Primitives | Latest |
| Animation | Framer Motion | Latest |
| State Management | Zustand | Latest |
| Database | SQLite via Prisma ORM | Latest |
| AI/LLM | z-ai-web-dev-sdk | Latest |
| Charts | Recharts | Latest |
| Icons | Lucide React | Latest |
| Notifications | Sonner (Toaster) | Latest |
| Package Manager | Bun | Latest |
| Build Tool | Next.js Turbopack | Built-in |
| Runtime | Bun | Latest |

### Agent-Reach Toolkit (Channel Backends)

| Tool | Purpose |
|------|---------|
| Jina Reader | Web page reading (zero config) |
| Exa (via mcporter) | Semantic web search |
| gh CLI | GitHub repository access |
| yt-dlp | YouTube video/subtitle extraction |
| Reddit JSON API | Post and community data |
| Feedparser | RSS/Atom feed parsing |
| bird CLI | Twitter/X access (optional) |

---

## Pages & Routes

### Public Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page with interactive Spline 3D background, feature showcase, agent preview, pricing, and testimonials |
| `/agent` | Detailed agent showcase with capabilities, channel access, and workflow descriptions |
| `/blog` | Content hub for thought leadership, product updates, and industry insights |
| `/faq` | Frequently asked questions organized by category |
| `/privacy` | Privacy policy and data handling practices |
| `/terms` | Terms of service and usage agreements |

### Platform (Authenticated)

| Route | Purpose |
|-------|---------|
| `/app` | Main platform dashboard with sidebar navigation |
| Dashboard | Overview with KPIs, recent activity, and agent status |
| Campaigns | Create, manage, and monitor lead generation campaigns |
| Leads | Full lead database with search, filters, and detail views |
| Agents | Agent management, execution controls, and real-time progress |
| Outreach | Message drafts, sent items, and response tracking |
| Reports | Analytics dashboards, campaign performance, and AI-generated insights |

### API Endpoints

All data flows through RESTful API routes under `/api/`, supporting CRUD operations for campaigns, leads, outreach, and agent tasks, plus specialized endpoints for AI chat and Agent-Reach channel management.

---

## Security & Privacy

- **Data Storage**: All data stored locally in SQLite — no external database dependencies
- **API Keys**: Platform API keys (Bilibili, etc.) are managed server-side and never exposed to the client
- **No Direct Channel Credentials**: LinkedIn and Twitter access uses smart fallback pipelines via public APIs and search engines — no user credentials are stored
- **LLM Processing**: All AI processing happens through the secure z-ai-web-dev-sdk backend
- **Draft-First Outreach**: All outreach messages are generated as drafts requiring human review before sending
- **Channel Transparency**: Every agent action is logged with channel source, operation, success status, and timestamp

---

## Roadmap

### Current Capabilities (v0.2)

- 8 specialized AI agents with full autonomous execution
- 17+ internet channels with multi-source fallback pipelines
- Multi-dimensional lead scoring (5 dimensions)
- Personalized outreach composition
- Campaign management and pipeline tracking
- Interactive Spline 3D landing page
- Dark premium UI with glassmorphism design

### Upcoming

- **Email Integration**: Direct send capability via SMTP/SendGrid for approved outreach
- **CRM Sync**: Bidirectional sync with HubSpot, Salesforce, and Pipedrive
- **Agent Customization**: Custom agent definitions and skill configuration
- **Team Collaboration**: Multi-user access with role-based permissions
- **Webhook Events**: Real-time notifications for pipeline stage changes
- **Advanced Reporting**: Trend analysis, forecasting, and ROI calculations
- **Mobile App**: iOS and Android companion for pipeline monitoring
- **API Marketplace**: Third-party agent skills and channel integrations

---

*LeadReach AI — Autonomous AI Agents That Generate Leads While You Sleep.*
*Powered by Agent-Reach. Built for the future of B2B sales.*
