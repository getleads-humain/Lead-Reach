# Web Research Agent — Sage

> *"Information is abundant. Intelligence is scarce. I find the signal in the noise."*

---

## 1. Identity & Persona

| Attribute | Value |
|-----------|-------|
| **Name** | Sage |
| **Role** | Deep Web Research & Intelligence Specialist |
| **Tier** | Primary Agent (on-demand) |
| **Agent Name Key** | `web-research` |
| **Icon** | Globe |
| **Color** | `#06B6D4` (Cyan) |
| **Task Type** | `research` |

### Cognitive Style

Sage operates with **analytical rigor**, **thorough sourcing**, and **obsessive attribution**. Every claim is traced to a source. Every inference is distinguished from a fact. Sage's thinking is structured in three layers:

1. **Question-first** — Before collecting data, Sage clarifies exactly what intelligence is needed. Research without a question is just browsing.
2. **Multi-source triangulation** — Every finding is supported by at least 3 sources. A single-source "fact" is a hypothesis.
3. **Synthesis over summary** — Sage doesn't just compile information. It synthesizes intelligence — identifying patterns, contradictions, and implications that aren't visible in any single source.

Sage is the opposite of a search engine. A search engine returns documents. Sage returns **understanding**.

---

## 2. Mission Statement

> **Conduct deep-dive research on any target to produce comprehensive intelligence briefs with multi-source verification, proper attribution, and actionable insights.**

Where Prospect Discovery (Scout) casts a wide net to find companies, Sage goes deep on a specific target. Sage reads full websites, analyzes industry reports, extracts insights from news and social media, and compiles everything into structured intelligence briefs that answer the user's research questions with evidence and citations.

---

## 3. Core Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     SAGE RESEARCH ENGINE                           │
│                                                                    │
│  ┌───────────┐    ┌──────────────┐    ┌────────────────────────┐  │
│  │  Research  │───▶│  6-Stage     │───▶│  Synthesis Pipeline    │  │
│  │  Planner   │    │  Methodology │    │  (LLM-powered)         │  │
│  └───────────┘    └──────────────┘    └───────────┬────────────┘  │
│                                                    │               │
│  ┌───────────┐    ┌──────────────┐    ┌───────────▼────────────┐  │
│  │  Source    │◀───│  Citation &  │◀───│  Deep Reading Pipeline │  │
│  │  Evaluator │    │  Attribution │    │  (multi-page webRead)  │  │
│  └───────────┘    └──────────────┘    └────────────────────────┘  │
│       │                                                           │
│       ▼                                                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              Agent-Reach Channels (17+)                     │   │
│  │  Web │ Exa │ LinkedIn │ Twitter │ YouTube │ Reddit │ RSS   │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### Components

| Component | File | Purpose |
|-----------|------|---------|
| **Runtime Handler** | `src/lib/agent-executor.ts` → `executeWebResearch()` | Orchestrates the research pipeline |
| **Tool Bridge** | `src/lib/agent-reach-bridge.ts` | Provides typed access to all 17+ Agent-Reach channels |
| **LLM Engine** | `z-ai-web-dev-sdk` via `callLLM()` / `callLLMForJSON()` | Analysis, synthesis, and briefing generation |
| **Database** | Prisma ORM → `AgentTask` model | Stores research output (analysis JSON) |

---

## 4. Research Methodology

Sage follows a rigorous **6-stage research process** modeled on professional intelligence analysis:

### Stage 1: Define Scope

```
Input: User's research request
Output: Structured research questions
Method: LLM-powered scope clarification
```

- Parse the user's request into specific, answerable research questions
- Identify the research type (company deep-dive, market intelligence, competitive analysis, etc.)
- Set time boundaries (how recent must the data be?)
- Define deliverable format (intelligence brief, SWOT analysis, market landscape, etc.)

### Stage 2: Identify Sources

```
Input: Research questions
Output: Channel selection + search strategy
Method: Decision framework (see Section 7)
```

- Select the best Agent-Reach channels for each research question
- Design search queries for each channel
- Prioritize sources by reliability and expected data richness

### Stage 3: Multi-Source Collection

```
Input: Search queries + channel selection
Output: Raw research data from multiple channels
Method: Parallel channel dispatch via Promise.allSettled()
```

- Execute searches across 6 channels simultaneously:
  - `exaSearch(topic, 10)` — Web search for articles, reports, directories
  - `redditSearch(topic, 5)` — Community discussions and sentiment
  - `youtubeSearch(topic, 3)` — Conference talks, presentations, reviews
  - `twitterSearch(topic, 5)` — Real-time updates, announcements
  - `linkedInSearchCompanies(topic, 5)` — Company profiles and professional data
  - `twitterSearchUsers(topic, 5)` — Key people and influencers

### Stage 4: Deep Reading

```
Input: Top URLs from Stage 3
Output: Full page content from the most relevant sources
Method: webRead() for top 3 Exa results
```

- Read the top 3 most relevant web pages in depth
- Extract key information, quotes, and data points
- Follow links to sub-pages if they contain relevant information
- Cap content at 3,000 characters per page for LLM processing

### Stage 5: LLM Analysis

```
Input: All raw research data + deep reads
Output: Structured intelligence analysis
Method: callLLMForJSON() with synthesis prompt
```

- Synthesize findings across all sources
- Identify patterns, contradictions, and gaps
- Generate key findings, market insights, and trends
- Extract company intelligence and recommendations
- Compile source list with type attribution

### Stage 6: Briefing Generation

```
Input: LLM analysis output
Output: Final intelligence brief
Method: Stored as task output in AgentTask record
```

- Format the analysis into a structured intelligence brief:
  - Executive summary (2-3 paragraphs)
  - Key findings (bullet list)
  - Market insights (bullet list)
  - Companies identified (name + details)
  - Trends observed (bullet list)
  - Recommendations (bullet list)
  - Sources with attribution (title + URL + type)

---

## 5. Research Capabilities

### 5.1 Company Deep-Dive

**Purpose**: Comprehensive analysis of a specific company.

| Dimension | Data Points | Sources |
|-----------|------------|---------|
| History | Founding year, key milestones, evolution | Website, Exa search, LinkedIn |
| Products/Services | Core offerings, pricing, positioning | Website deep read, YouTube |
| Financial | Revenue, funding, growth rate | Exa search (Crunchbase, Bloomberg) |
| Leadership | CEO, key executives, board | LinkedIn people search, website /team |
| Clients | Named clients, case studies, industries served | Website, Exa search |
| Competitive position | Market share, differentiation, weaknesses | Exa search, Reddit discussions |
| Recent news | Press releases, funding, product launches | Twitter, Exa search, RSS |
| Digital presence | Website quality, social activity, tech stack | Web read, Twitter, GitHub |

**Channel Strategy**: Website (primary) → LinkedIn (people) → Exa (financials/news) → Twitter (real-time) → YouTube (presentations) → Reddit (sentiment)

### 5.2 Market Intelligence

**Purpose**: Understand the market landscape for a target industry or segment.

| Dimension | Data Points | Sources |
|-----------|------------|---------|
| Market size | TAM/SAM/SOM, growth rate, projections | Exa search (industry reports) |
| Key players | Top companies, market share, segmentation | Exa search, LinkedIn |
| Trends | Emerging trends, disruption signals, technology shifts | Exa search, Reddit, YouTube |
| Regulatory | Key regulations, compliance requirements | Exa search, web read (gov sites) |
| Customer needs | Pain points, buying patterns, decision criteria | Reddit, Exa search |
| Barriers to entry | Capital requirements, regulation, network effects | Exa search |

**Channel Strategy**: Exa search (reports/analysis) → Web read (analyst content) → LinkedIn (company landscape) → Reddit (community insight) → YouTube (expert opinions)

### 5.3 Competitive Analysis

**Purpose**: Identify and profile competitors of a target company or within a market segment.

| Dimension | Data Points | Sources |
|-----------|------------|---------|
| Competitor list | Direct and indirect competitors | Exa search, LinkedIn |
| Positioning | Value propositions, differentiation | Website reads, Exa search |
| Strengths/Weaknesses | SWOT-style analysis | Exa search, Reddit |
| Market share | Relative size, customer count | Exa search (reports) |
| Pricing | Pricing models, tiers, competitive positioning | Website reads |
| Recent moves | Product launches, partnerships, funding | Twitter, Exa search |

**Channel Strategy**: Exa search (competitor identification) → Individual company deep-dives → Twitter (recent moves) → Reddit (customer sentiment)

### 5.4 News & Press Release Monitoring

**Purpose**: Track recent developments about target companies or topics.

| Dimension | Data Points | Sources |
|-----------|------------|---------|
| Press releases | Product launches, partnerships, hires | Exa search, Twitter |
| Funding news | Investment rounds, acquisitions, IPOs | Exa search (Crunchbase) |
| Industry events | Conferences, trade shows, webinars | Exa search, YouTube |
| Crisis signals | Layoffs, lawsuits, controversies | Exa search, Reddit, Twitter |
| Executive moves | New hires, departures, board changes | LinkedIn, Exa search |

**Channel Strategy**: Exa search (news) → Twitter (real-time) → Reddit (discussion) → LinkedIn (executive moves) → YouTube (event recordings)

### 5.5 Regulatory Research

**Purpose**: Identify industry-specific regulations, licensing requirements, and compliance standards.

| Dimension | Data Points | Sources |
|-----------|------------|---------|
| Regulations | Key laws, rules, standards | Web read (gov sites via Jina) |
| Licensing | Required licenses, permits, certifications | Exa search |
| Compliance | Standards, frameworks, audit requirements | Exa search, web read |
| Regulatory bodies | Governing agencies, contact info | Web read (gov sites) |
| Recent changes | New regulations, proposed rules | Exa search, RSS feeds |

**Channel Strategy**: Exa search (regulation search) → Web read (government websites) → Reddit (compliance discussions)

### 5.6 Financial Intelligence

**Purpose**: Research company financials, funding rounds, and growth indicators.

| Dimension | Data Points | Sources |
|-----------|------------|---------|
| Revenue | Annual revenue, growth rate, projections | Exa search (Crunchbase, Bloomberg) |
| Funding | Total raised, last round, investors | Exa search (Crunchbase) |
| Valuation | Current valuation, comparable exits | Exa search |
| Financial health | Profitability, burn rate, runway | Exa search (reports) |
| Growth signals | Hiring, expansion, new offices | LinkedIn, Twitter, Exa search |

**Channel Strategy**: Exa search (financial data) → LinkedIn (hiring signals) → Twitter (funding announcements) → Web read (annual reports)

---

## 6. Source Evaluation Framework

Sage rates every source on three dimensions to determine its contribution weight:

### Reliability Rating

| Rating | Score | Criteria | Examples |
|--------|-------|----------|----------|
| **Authoritative** | 90-100 | Official, verified, institutional | Company website, SEC filings, government sites |
| **Credible** | 70-89 | Reputable, editorial review | Bloomberg, TechCrunch, industry reports |
| **Plausible** | 50-69 | Community-sourced, generally reliable | Reddit discussions, blog posts, YouTube talks |
| **Unverified** | 30-49 | Unattributed, potentially biased | Random social posts, unverified claims |
| **Unreliable** | 0-29 | Known misinformation, no sources | Tabloid content, anonymous forums |

### Recency Rating

| Rating | Score | Age | Usage |
|--------|-------|-----|-------|
| **Current** | 100 | < 3 months | Primary evidence |
| **Recent** | 80 | 3-12 months | Supporting evidence |
| **Dated** | 60 | 1-2 years | Background context only |
| **Stale** | 40 | 2-5 years | Historical reference only |
| **Ancient** | 20 | > 5 years | Avoid using for current analysis |

### Relevance Rating

| Rating | Score | Criteria |
|--------|-------|----------|
| **Direct** | 90-100 | Directly addresses the research question |
| **Highly relevant** | 70-89 | Closely related, provides strong context |
| **Related** | 50-69 | Tangentially related, provides background |
| **Peripheral** | 30-49 | Adjacent topic, limited direct value |
| **Irrelevant** | 0-29 | Not relevant to the research question |

### Combined Source Score

```
sourceScore = (reliability × 0.45) + (recency × 0.30) + (relevance × 0.25)
```

Sources scoring **below 40** are excluded from the analysis. Sources scoring **above 75** are marked as high-confidence citations.

---

## 7. Decision Framework

### Channel Selection by Research Type

| Research Type | Primary Channel | Secondary Channels | Rationale |
|---------------|----------------|-------------------|-----------|
| **Company deep-dive** | Web (Jina Reader) | LinkedIn, Exa, Twitter, YouTube | Website is richest single source |
| **Market intelligence** | Exa Search | Web, LinkedIn, YouTube | Reports and analysis are web-native |
| **Competitive analysis** | Exa Search | Web, LinkedIn, Twitter, Reddit | Need breadth across competitors |
| **News monitoring** | Twitter, Exa Search | Reddit, RSS | Real-time + comprehensive coverage |
| **Regulatory research** | Web (Jina Reader) | Exa Search | Government sites are authoritative |
| **Financial intelligence** | Exa Search | LinkedIn, Web | Financial databases are web-indexed |
| **Social sentiment** | Twitter, Reddit | YouTube comments | Real-time social signals |

### Search Strategy Patterns

| Pattern | Query Template | When to Use |
|---------|---------------|-------------|
| **Broad discovery** | `"{topic} overview trends 2024 2025"` | Initial research on a topic |
| **Specific fact** | `"{topic} {specific_question}"` | Targeted fact-finding |
| **Company intelligence** | `"{company_name} revenue employees funding"` | Company deep-dive |
| **Competitor scan** | `"{topic} competitors alternatives market leaders"` | Competitive landscape |
| **News tracking** | `"{topic} news announcement 2025"` | Recent developments |
| **Social signals** | `"{topic} site:twitter.com OR site:reddit.com"` | Community discussion |
| **Regulatory search** | `"{industry} regulations compliance {geography}"` | Regulatory requirements |
| **Video research** | `"{topic} conference presentation talk"` | Expert presentations |

---

## 8. Deep Reading Pipeline

### How Sage Reads Multiple Web Pages in Depth

The deep reading pipeline is Sage's distinguishing capability — it goes beyond search results to actually **read and comprehend** web content.

```
Stage 3: Multi-Source Collection
    │
    ▼
Top 3 URLs from Exa results
    │
    ├── URL 1 ──▶ webRead(url1) ──▶ Full content (up to 3,000 chars)
    ├── URL 2 ──▶ webRead(url2) ──▶ Full content (up to 3,000 chars)
    └── URL 3 ──▶ webRead(url3) ──▶ Full content (up to 3,000 chars)
    │
    ▼
Combined deep-read content (up to 9,000 chars)
    │
    ▼
Fed to LLM synthesis prompt
```

### Deep Reading Rules

1. **Always read the top 3 URLs** from Exa search results — these are the most semantically relevant
2. **Cap content at 3,000 chars per page** — enough for key information without overwhelming the LLM
3. **Prioritize by source score** — if >3 high-quality URLs exist, read the top-scored ones
4. **Parallel reading** — All `webRead()` calls execute via `Promise.allSettled()` for speed
5. **Failure isolation** — If one URL fails, others still succeed

### Content Extraction Focus

| Source Type | What to Extract |
|-------------|----------------|
| Company website | Services, pricing, team, clients, about |
| Industry report | Market size, growth rate, key players, trends |
| News article | Key facts, quotes, data points, analysis |
| Blog post | Opinions, insights, predictions |
| Government site | Regulations, requirements, compliance standards |
| Reddit thread | Pain points, opinions, real-world experiences |

---

## 9. LLM Synthesis Engine

### How Raw Research Data Becomes Structured Intelligence Briefs

The synthesis engine is the brain of Sage — it transforms raw, multi-source data into coherent, actionable intelligence.

### Synthesis Input

```typescript
interface ResearchData {
  searchResults: {
    exa: SearchResult[];           // Exa web search results
    reddit: RedditPostResult[];    // Reddit discussions
    youtube: YouTubeResult[];      // Video search results
    twitter: TwitterResult[];      // Tweet search results
    linkedInCompanies: LinkedInProfileResult[];  // LinkedIn company data
    twitterUsers: TwitterResult[]; // Twitter user profiles
  };
  deepReads: Array<{
    title: string;
    url: string;
    content: string;               // Up to 3,000 chars per page
  }>;
}
```

### Synthesis Prompt

```
System: You are a research analyst. Synthesize the following multi-source research data into a comprehensive intelligence brief.

Topic: "{topic}"

Return a JSON object:
{
  "summary": "Executive summary (2-3 paragraphs)",
  "keyFindings": ["Finding 1", "Finding 2", ...],
  "marketInsights": ["Insight 1", ...],
  "companies": [{"name": "Company", "details": "Relevant details"}],
  "trends": ["Trend 1", ...],
  "recommendations": ["Recommendation 1", ...],
  "sources": [{"title": "Title", "url": "URL", "type": "search|reddit|youtube|twitter|web"}]
}

Rules:
- Support every finding with at least one source
- Distinguish facts (from sources) from inferences (from analysis)
- Flag information that may be outdated
- Include source type attribution for every cited source
- Provide 5-10 key findings, 3-5 market insights, 3-5 trends

User: Research data:
{researchData}
```

### Synthesis Output

```typescript
interface IntelligenceBrief {
  summary: string;               // Executive summary (2-3 paragraphs)
  keyFindings: string[];         // 5-10 key findings with evidence
  marketInsights: string[];      // 3-5 market insights
  companies: Array<{             // Companies identified
    name: string;
    details: string;
  }>;
  trends: string[];              // 3-5 observed trends
  recommendations: string[];     // 3-5 actionable recommendations
  sources: Array<{               // Full source attribution
    title: string;
    url: string;
    type: 'search' | 'reddit' | 'youtube' | 'twitter' | 'web';
  }>;
}
```

---

## 10. Citation & Attribution System

### Source Tracking

Every piece of intelligence in a Sage brief is traced back to its source. The system uses a three-tier attribution model:

### Tier 1: Direct Citation

```
"According to [Source Title], [specific fact]."
Source: [URL] (type: web, reliability: 85, recency: recent)
```

Used for facts directly stated in a source. Highest confidence.

### Tier 2: Cross-Referenced

```
"[Finding] is supported by [Source A], [Source B], and [Source C]."
Sources: [URL A] (web), [URL B] (search), [URL C] (twitter)
```

Used for findings confirmed by multiple independent sources. Highest reliability.

### Tier 3: Inferred

```
"Based on [evidence from Source A] and [pattern from Source B], [inference]."
Note: This is an analytical inference, not a directly stated fact.
Sources: [URL A] (web), [URL B] (search)
```

Used for conclusions drawn by combining evidence. Clearly distinguished from direct facts.

### Fact vs. Inference Distinction

| Category | Marker | Example |
|----------|--------|---------|
| **Direct fact** | No marker needed | "Company X raised $50M in Series B" |
| **Cross-verified** | `[✓ verified]` | "Company X has 200+ employees [✓ verified by LinkedIn + website]" |
| **Inference** | `[inferred]` | "Company X appears to be expanding into Asia [inferred from hiring patterns]" |
| **Estimate** | `[estimated]` | "Market size ~$5B [estimated from 3 industry reports]" |
| **Outdated** | `[⚠ as of YYYY]` | "Revenue was $10M [⚠ as of 2023]" |

---

## 11. Constraints

### Time Limits

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Maximum research task duration | 15 minutes | Prevent runaway queries |
| Per-channel call timeout | 15–30 seconds | Individual channel resilience |
| LLM synthesis timeout | 30 seconds (with 1 retry) | Prevent infinite LLM waits |
| Deep reading parallel limit | 3 URLs | Balance depth vs. speed |

### Source Requirements

| Requirement | Standard |
|-------------|----------|
| Minimum sources per key finding | 1 (direct) or 2 (inferred) |
| Source diversity | At least 3 different channel types per brief |
| Recency standard | 80%+ of findings from sources < 1 year old |
| Citation completeness | Every finding must have at least one source URL |

### Fact-Checking Standards

| Standard | Implementation |
|----------|---------------|
| No unsourced claims | Every finding in the brief has a source |
| Inference flagging | Analytical conclusions are explicitly marked |
| Outdated flagging | Data older than 2 years is flagged |
| Contradiction flagging | When sources disagree, both views are presented |

---

## 12. Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Research completeness** | All requested questions answered | % of research questions with findings |
| **Source diversity** | 3+ source types per brief | Count of distinct channel types used |
| **Source recency** | 80%+ findings < 1 year old | Published date analysis |
| **Key findings count** | 5-10 per brief | Output field length |
| **Company identification** | 3+ companies per brief | Output field length |
| **Processing speed** | < 3 minutes for standard research | Task execution time |
| **Deep read success rate** | 2+ of 3 URLs successfully read | Channel activity records |
| **Channel success rate** | 4+ of 6 channels returning data | Channel activity filter |
| **Citation accuracy** | 95%+ URLs are valid and reachable | Source URL validation |

---

## 13. Workflow Examples

### Example 1: Company Deep-Dive on "Stripe"

```
Input: "Research Stripe — I need a full company profile for a partnership proposal"

Stage 1 — Define Scope:
  Questions: What is Stripe's current product suite? Who are key executives?
  What is their financial position? What are recent strategic moves?
  Research type: Company deep-dive
  Time boundary: Last 2 years

Stage 2 — Identify Sources:
  Primary: Web (stripe.com) + LinkedIn + Exa
  Secondary: Twitter + YouTube + Reddit
  Queries: "Stripe products pricing 2025", "Stripe revenue funding",
           "Stripe executives leadership", "Stripe partnerships strategy"

Stage 3 — Multi-Source Collection:
  exaSearch("Stripe products pricing revenue 2025", 10)
    → 8 results: TechCrunch article, Stripe blog, analyst report, Crunchbase...
  redditSearch("Stripe payment processing", 5)
    → 3 results: r/fintech discussion, r/startups experience thread...
  youtubeSearch("Stripe conference presentation 2024", 3)
    → 2 results: Stripe Sessions keynote, fintech conference talk
  twitterSearch("Stripe announcement", 5)
    → 4 results: Product launch tweet, partnership announcement...
  linkedInSearchCompanies("Stripe", 5)
    → 1 result: Stripe official LinkedIn page
  twitterSearchUsers("Stripe", 5)
    → 2 results: @Stripe, @patrickc (CEO)

Stage 4 — Deep Reading:
  webRead("https://techcrunch.com/stripe-2025-analysis")
    → Full article: Stripe's market position, revenue growth, new products
  webRead("https://stripe.com/blog/session-2025")
    → Product announcements, pricing changes, roadmap
  webRead("https://crunchbase.com/organization/stripe")
    → Funding history, valuation, investors

Stage 5 — LLM Analysis:
  Input: All research data (search results + deep reads)
  Output: {
    summary: "Stripe is the dominant online payment infrastructure provider...",
    keyFindings: [
      "Stripe processed $1T+ in payments in 2024",
      "Launched Stripe Atlas 2.0 for international incorporation",
      "Valued at $65B after latest funding round",
      ...
    ],
    companies: [
      { name: "Stripe", details: "Payment infrastructure, $65B valuation, 8000+ employees" },
      ...
    ],
    trends: [
      "Embedded finance is Stripe's strategic direction",
      "International expansion driving growth",
      ...
    ],
    recommendations: [
      "Partnership should focus on Stripe Connect — their platform play",
      ...
    ],
    sources: [
      { title: "TechCrunch Analysis", url: "...", type: "web" },
      { title: "Stripe Blog", url: "...", type: "web" },
      { title: "r/fintech discussion", url: "...", type: "reddit" },
      ...
    ]
  }

Stage 6 — Briefing: Stored as task output, ready for user review
```

### Example 2: Market Intelligence on "AI in Healthcare"

```
Input: "What's the market landscape for AI in healthcare? I need to understand the space before we prospect"

Stage 1 — Define Scope:
  Questions: What is the market size? Who are key players? What are the trends?
  What are the regulatory considerations?
  Research type: Market intelligence
  Time boundary: Last 18 months

Stage 2 — Identify Sources:
  Primary: Exa Search (industry reports) + Web (analyst content)
  Secondary: LinkedIn + YouTube (expert talks) + Reddit (practitioner views)

Stage 3 — Multi-Source Collection:
  exaSearch("AI healthcare market size trends 2024 2025", 10)
    → 7 results: Grand View Research, McKinsey report, Nature Medicine article...
  redditSearch("AI healthcare medical", 5)
    → 4 results: r/medicine AI discussion, r/MachineLearning healthcare thread...
  youtubeSearch("AI healthcare conference 2024", 3)
    → 3 results: HIMSS keynote, AMA presentation, startup pitch
  twitterSearch("AI healthcare FDA approval 2025", 5)
    → 3 results: FDA announcement, research paper discussion...
  linkedInSearchCompanies("AI healthcare", 5)
    → 5 results: Tempus, PathAI, Aidoc, Zebra Medical, Viz.ai

Stage 4 — Deep Reading:
  webRead("https://grandviewresearch.com/ai-healthcare-market")
    → Market size: $15.4B in 2024, CAGR 37.5%
  webRead("https://mckinsey.com/ai-healthcare-potential")
    → Value potential: $350B+ in annual savings
  webRead("https://nature.com/ai-medical-diagnosis")
    → Clinical validation data, accuracy benchmarks

Stage 5 — LLM Analysis:
  Output: {
    summary: "The AI in healthcare market is experiencing explosive growth...",
    keyFindings: [
      "Market valued at $15.4B in 2024, projected to reach $187B by 2030",
      "FDA has approved 692 AI-enabled medical devices as of 2024",
      "Radiology and cardiology are the most mature AI applications",
      ...
    ],
    marketInsights: [
      "Diagnostic AI leads in clinical adoption",
      "Regulatory framework is accelerating with FDA's AI/ML action plan",
      ...
    ],
    companies: [
      { name: "Tempus", details: "Precision medicine, $6B valuation" },
      { name: "PathAI", details: "AI-powered pathology, $400M raised" },
      { name: "Aidoc", details: "Radiology AI, FDA-cleared, $275M raised" },
      ...
    ],
    trends: [
      "Shift from diagnostic AI to therapeutic AI",
      "Real-world evidence becoming key differentiator",
      ...
    ],
    recommendations: [
      "Focus prospecting on Series B+ companies — they have budget and urgency",
      ...
    ],
    sources: [...]
  }
```

### Example 3: Competitive Analysis for "Accounting Software Market"

```
Input: "Who are the main competitors in cloud accounting software? How do they compare?"

Stage 3 — Multi-Source Collection:
  exaSearch("cloud accounting software competitors comparison 2025", 10)
    → Comparison articles, G2 reviews, analyst reports
  redditSearch("accounting software recommendations", 5)
    → User comparisons, switching experiences, pain points
  youtubeSearch("accounting software comparison review", 3)
    → Demo videos, feature comparisons
  linkedInSearchCompanies("cloud accounting software", 5)
    → QuickBooks, Xero, FreshBooks, Zoho Books, Sage

Stages 4-5 — Deep Read + Analysis:
  Read top comparison articles and G2 review pages
  Synthesize into competitive landscape with positioning map
  Output: Companies, market shares, strengths/weaknesses, recommendations
```

---

## 14. Agent-Reach Channel Access

Sage uses the broadest channel set of any agent:

| Channel | Bridge Function | Primary Use | Fallback Chain |
|---------|----------------|-------------|----------------|
| **web** | `webRead()`, `webReadMultiple()` | Deep content extraction | Jina Reader (zero-config) |
| **exa_search** | `exaSearch()` | Industry reports, news, company data | mcporter → Jina Search |
| **linkedin** | `linkedInSearchCompanies()`, `linkedInReadCompanyPage()` | Company profiles, professional data | Exa → Jina Search |
| **twitter** | `twitterSearch()`, `twitterSearchUsers()` | Real-time updates, announcements | bird CLI → Exa → Jina Search |
| **youtube** | `youtubeSearch()`, `youtubeGetInfo()`, `youtubeGetSubtitles()` | Conference talks, presentations | yt-dlp → Jina Reader |
| **reddit** | `redditSearch()`, `redditSubreddit()` | Community discussions, sentiment | Reddit API → Jina Reader |
| **rss** | `rssRead()` | Industry publications, news feeds | feedparser |
| **github** | `githubSearchRepos()`, `githubViewRepo()` | Tech company open-source | gh CLI |

---

## 15. Integration Points

### Upstream

| Agent | Relationship |
|-------|-------------|
| **Orchestrator** (Atlas) | Dispatches research tasks to Sage |
| **User** (via AI Chat) | Direct research requests |

### Downstream

| Agent | Relationship |
|-------|-------------|
| **Lead Qualification** (Judge) | Uses market insights for ICP definition |
| **Outreach Composer** (Pen) | Uses competitive intelligence for message personalization |
| **Report Generator** | Incorporates research findings into campaign reports |

### API Dispatch

```typescript
// Direct dispatch
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "web-research",
  "taskType": "research",
  "input": {
    "query": "AI in healthcare market landscape",
    "topic": "AI healthcare",
    "industry": "Healthcare Technology",
    "location": "Global"
  }
}

// Via AI Chat
POST /api/ai
{ "message": "Research the AI healthcare market for me" }
// → AI parses intent → Dispatches to web-research → Agent-Reach executes multi-source research → Intelligence brief stored
```

### Runtime Handler

```typescript
// src/lib/agent-executor.ts
async function executeWebResearch(
  ctx: AgentExecutionContext
): Promise<AgentExecutionResult>
```

The handler:
1. Extracts the research topic from `ctx.input`
2. Executes 6-channel parallel search via `Promise.allSettled()`
3. Reads top 3 Exa results in depth
4. Compiles all research data
5. Synthesizes with LLM into structured intelligence brief
6. Returns `AgentExecutionResult` with analysis and channel activity
