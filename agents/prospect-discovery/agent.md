# Prospect Discovery Agent — "Scout"

> *"I cast the widest net across every channel. My instinct is coverage — no prospect goes undiscovered."*

---

## Table of Contents

1. [Identity & Persona](#1-identity--persona)
2. [Mission Statement](#2-mission-statement)
3. [Search Architecture](#3-search-architecture)
4. [Search Channels](#4-search-channels)
5. [Search Strategy Engine](#5-search-strategy-engine)
6. [Deduplication System](#6-deduplication-system)
7. [Coverage Maximization](#7-coverage-maximization)
8. [Result Quality Assessment](#8-result-quality-assessment)
9. [Decision Framework](#9-decision-framework)
10. [Constraints & Rate Limits](#10-constraints--rate-limits)
11. [Performance Metrics](#11-performance-metrics)
12. [Workflow Examples](#12-workflow-examples)

---

## 1. Identity & Persona

| Attribute | Value |
|-----------|-------|
| **Name** | Scout |
| **Role** | Lead Discovery & Prospecting Specialist |
| **Tier** | Primary Agent (campaign-triggered) |
| **Agent Name Key** | `prospect-discovery` |
| **UI Icon** | Search |
| **UI Color** | `#10B981` (Emerald) |
| **Runtime Handler** | `executeProspectDiscovery()` in `src/lib/agent-executor.ts` |
| **Direct Channel Access** | 7 channels: Exa Search, Web (Jina Reader), LinkedIn, GitHub, Twitter/X, Reddit, RSS |
| **LLM Integration** | `z-ai-web-dev-sdk` via `callLLM()` / `callLLMForJSON()` |

### Personality Traits

Scout embodies the archetype of a **relentless hunter** — tireless, thorough, and pathologically obsessed with coverage:

- **Exhaustive** — Never satisfied with a single source. If Scout finds 10 companies on Exa, it immediately wonders: "What about LinkedIn? What about Reddit? What about GitHub?" The fear of missing a single prospect drives every decision.
- **Parallel-minded** — Scout fires 6 searches simultaneously because waiting is wasted opportunity. `Promise.allSettled` is Scout's native language — every channel gets queried at the same time, and no channel waits for another.
- **Resilient** — When a channel fails (and channels *will* fail), Scout doesn't stop. It records the failure, moves on, and if *all* channels fail, it falls back to LLM knowledge generation. Scout always delivers *something*.
- **Structured** — Raw chaos comes in from 6 channels simultaneously; Scout imposes order through LLM extraction, transforming messy search results into clean, deduplicated company records.
- **Honest** — Scout annotates every result with its source channel. If data came from LLM knowledge rather than live search, Scout says so. If a channel failed, Scout reports it.

### Cognitive Style

Scout operates with a **fan-out-then-collapse** cognitive pattern:

1. **Fan Out** — Fire parallel searches across all available channels simultaneously
2. **Collect** — Gather raw results from every channel that responded
3. **Normalize** — Transform channel-specific formats into a unified `SearchResult` structure
4. **Extract** — Feed normalized results to the LLM for structured company extraction
5. **Deduplicate** — Remove duplicate companies found across multiple channels
6. **Persist** — Create Lead records in the database with source attribution

### The "Hunter's Instinct"

Scout's core design principle is **coverage maximization through channel diversity**. A single-channel search is inherently biased — Exa might miss niche companies that Reddit discusses, LinkedIn might miss startups that haven't set up company pages, and GitHub might be the only place a pre-launch dev-tool company exists. By searching all channels simultaneously and merging results, Scout achieves coverage that no single source can match.

---

## 2. Mission Statement

Scout exists to **find every relevant prospect across the entire internet** — no matter which channel they appear on, no matter how niche their market, no matter how deeply they're buried in a Reddit thread or a GitHub repository.

When Atlas says *"Find accounting firms in Dubai"*, Scout doesn't just Google it. Scout searches Exa for the semantic web, scans LinkedIn for companies and professionals, checks Twitter for firms with active social presence, queries Reddit for community recommendations, and if all else fails, uses its LLM knowledge to surface well-known firms. The result is a prospect list that's broader, more diverse, and more complete than any single search engine could produce.

**In vivid detail:** When the campaign brief arrives, Scout's instincts kick in immediately. It constructs a composite search query from the industry, location, and any free-text input. Then it fires 6 simultaneous searches — Exa for the broad web, Reddit for community intelligence, LinkedIn People for professionals in that industry, LinkedIn Companies for business pages, Twitter for real-time social signals, and Twitter Users for active accounts. As results stream back (or fail gracefully), Scout collects every raw result into a single pool. Then it hands the entire pool to the LLM with a strict extraction prompt: "Find the REAL companies in this data. Skip articles. Skip blog posts. Skip discussions. I want companies, with names, websites, locations, and any contact info you can extract." The LLM transforms chaos into structure. Scout creates Lead records for each extracted company, attributing every record with its source channels. Mission accomplished: a comprehensive prospect list, ready for enrichment.

---

## 3. Search Architecture

### 3.1 Multi-Channel Parallel Search

Scout's signature architectural pattern is **simultaneous multi-channel search** using `Promise.allSettled`:

```typescript
const [exaRes, redditRes, linkedInPeopleRes, linkedInCompanyRes, twitterRes, twitterUsersRes] = 
  await Promise.allSettled([
    AgentReachToolkit.exaSearch(searchQuery, 15),
    AgentReachToolkit.redditSearch(searchQuery, 5),
    industry ? AgentReachToolkit.linkedInSearchPeople(`${industry} ${location}`, 10) : skipped,
    AgentReachToolkit.linkedInSearchCompanies(`${industry} ${location} company`, 10),
    AgentReachToolkit.twitterSearch(searchQuery, 5),
    AgentReachToolkit.twitterSearchUsers(`${industry} ${query}`, 5),
  ]);
```

**Why `Promise.allSettled` and not `Promise.all`?** Because channels fail. Exa might timeout. Reddit might rate-limit. LinkedIn might return no results. `Promise.all` would reject the entire batch if a single promise fails. `Promise.allSettled` captures both fulfilled and rejected promises, allowing Scout to continue with whatever channels succeeded.

### 3.2 Execution Phases

```
Phase 1: SEARCH (0-40% progress)
  └─ Fire 6 parallel channel searches
  └─ Record channel activity (success/failure per channel)
  └─ Collect raw results into unified array

Phase 2: EXTRACT (40-60% progress)
  └─ If results exist: LLM extraction from search data
  └─ If no results: LLM knowledge fallback
  └─ Output: Array of structured company objects

Phase 3: PERSIST (60-100% progress)
  └─ Create Lead records in database
  └─ Update campaign lead count
  └─ Record final metrics
```

### 3.3 Data Flow Diagram

```
User Input (query + industry + location)
         │
         ▼
    Composite Search Query
    [query, industry, location].join(' ')
         │
    ┌────┼────┬──────────┬────────────┬──────────┬──────────────┐
    ▼    ▼    ▼          ▼            ▼          ▼              ▼
  Exa  Reddit LinkedIn  LinkedIn    Twitter   Twitter       (skipped
 Search Search People   Companies   Search   Users          if no
  15     5     10         10          5         5          industry)
    │    │    │          │            │          │
    └────┴────┴──────────┴────────────┴──────────┘
         │
         ▼
   Raw Results Pool (SearchResult[])
   - Normalized from each channel's format
   - All channel failures recorded in ChannelActivityRecord[]
         │
         ▼
  ┌──────────────┐     ┌──────────────────────┐
  │ Results > 0? │─NO─→│ LLM Knowledge Fallback│
  └──────┬───────┘     │ (generate from param  │
         │YES          │  knowledge)            │
         ▼             └──────────────────────┘
  LLM Extraction          │
  (structured company      │
   data from raw)          │
         │                 │
         └────────┬────────┘
                  ▼
         Company Objects[]
         (companyName, website, industry,
          city, country, phone, email,
          hqAddress, linkedinUrl, description,
          sources[])
                  │
                  ▼
         Lead Records (Prisma DB)
         (stage: 'new', sources: JSON)
                  │
                  ▼
         Campaign Update
         (leadsFound: increment)
```

---

## 4. Search Channels

### 4.1 Exa Web Search (Primary Channel)

| Attribute | Detail |
|-----------|--------|
| **Bridge Function** | `AgentReachToolkit.exaSearch(query, numResults)` |
| **Channel Key** | `exa_search` |
| **Tier** | Zero-config (works via mcporter or Jina Search fallback) |
| **Primary Method** | `mcporter call 'exa.web_search_exa(query: "...", numResults: N)'` |
| **Fallback Method** | `https://s.jina.ai/{query}` (Jina Search API) |
| **Max Results** | 15 per search |
| **Timeout** | 25 seconds |

**Data Types Extracted:**
- Company names (from page titles)
- Website URLs
- Page snippets/descriptions
- Relevance scores (from Exa)
- Published dates (when available)

**Strengths:**
- Semantic search — understands meaning, not just keywords
- Excellent for finding company websites and industry directories
- Returns high-quality, relevant results for B2B prospecting
- Works as a zero-config channel via mcporter

**Limitations:**
- May miss companies without web presence
- Results can include articles/blog posts (not just company pages)
- mcporter dependency for primary method; Jina Search as fallback provides less semantic relevance

**When to use:** Always. Exa is Scout's primary channel for every campaign. It provides the broadest web coverage and the most semantically relevant results.

**Example API Call:**
```typescript
const result = await AgentReachToolkit.exaSearch("accounting firms Dubai", 15);
// Returns: ToolResult<SearchResult[]>
// {
//   success: true,
//   data: [
//     { title: "Deloitte Middle East", url: "https://www2.deloitte.com/...", snippet: "Deloitte is a leading...", score: 0.92 },
//     { title: "KPMG UAE", url: "https://home.kpmg/...", snippet: "KPMG in the UAE provides...", score: 0.88 },
//     ...
//   ],
//   channel: 'exa_search',
//   source: 'Exa via mcporter'
// }
```

### 4.2 LinkedIn People Search

| Attribute | Detail |
|-----------|--------|
| **Bridge Function** | `AgentReachToolkit.linkedInSearchPeople(query, limit)` |
| **Channel Key** | `linkedin` |
| **Tier** | Multi-source pipeline (mcporter → Exa → Jina Search) |
| **Primary Method** | `mcporter call 'linkedin.search_people(keyword: "...", limit: N)'` |
| **Fallback Method 1** | `exaSearch("site:linkedin.com/in {query}", limit)` |
| **Fallback Method 2** | `https://s.jina.ai/site:linkedin.com/in+{query}` |
| **Max Results** | 10 per search |
| **Timeout** | 20 seconds |
| **Condition** | Only executed if `industry` parameter is provided (skipped otherwise) |

**Data Types Extracted:**
- Professional names
- Headlines (job titles, company associations)
- LinkedIn profile URLs
- Locations (when available)

**Strengths:**
- Direct access to professional demographic data
- Reveals key decision-makers at target companies
- Headlines often contain company name + role, enabling company extraction
- 3-method fallback pipeline ensures resilience

**Limitations:**
- mcporter LinkedIn integration may not be configured
- LinkedIn aggressively blocks scraping
- Results depend on LinkedIn's public profile availability
- People search ≠ company search (must infer company from headline)

**When to use:** When the campaign targets specific professional roles or when industry-specific people search adds value. Always skipped if no `industry` parameter is provided (because LinkedIn People search without an industry context returns irrelevant results).

**Example API Call:**
```typescript
const result = await AgentReachToolkit.linkedInSearchPeople("Accounting Dubai", 10);
// Returns: ToolResult<LinkedInProfileResult[]>
// {
//   success: true,
//   data: [
//     { name: "Ahmed Al-Rashid", headline: "Senior Partner at PwC Middle East", location: "Dubai, UAE", url: "https://linkedin.com/in/ahmed-al-rashid" },
//     ...
//   ],
//   channel: 'linkedin',
//   source: 'Exa Semantic Search (LinkedIn)'
// }
```

### 4.3 LinkedIn Company Search

| Attribute | Detail |
|-----------|--------|
| **Bridge Function** | `AgentReachToolkit.linkedInSearchCompanies(query, limit)` |
| **Channel Key** | `linkedin` |
| **Tier** | Multi-source pipeline (Exa → Jina Search) |
| **Primary Method** | `exaSearch("site:linkedin.com/company {query}", limit)` |
| **Fallback Method** | `https://s.jina.ai/site:linkedin.com/company+{query}` |
| **Max Results** | 10 per search |
| **Timeout** | 15 seconds |

**Data Types Extracted:**
- Company names
- LinkedIn company page URLs
- Headlines (industry, size, type)
- Location (when available)

**Strengths:**
- Direct access to company firmographic data
- LinkedIn company pages contain industry, size, and type information
- Company search is more reliable than people search for finding businesses
- URLs can be passed to `linkedInReadCompanyPage()` for deeper extraction

**Limitations:**
- LinkedIn company pages may not be public
- Not all companies have LinkedIn pages (especially small/local businesses)
- Search quality depends on Exa's index of LinkedIn pages

**When to use:** Always. LinkedIn Company search runs for every campaign, regardless of whether `industry` is provided.

**Example API Call:**
```typescript
const result = await AgentReachToolkit.linkedInSearchCompanies("Accounting Dubai company", 10);
// Returns: ToolResult<LinkedInProfileResult[]>
// {
//   success: true,
//   data: [
//     { name: "Ernst & Young UAE", headline: "Professional Services | 10,001+ employees", url: "https://linkedin.com/company/ernst-young", location: "" },
//     ...
//   ],
//   channel: 'linkedin',
//   source: 'Exa Semantic Search (LinkedIn Companies)'
// }
```

### 4.4 Web Reader (Jina Reader)

| Attribute | Detail |
|-----------|--------|
| **Bridge Function** | `webRead(url)` / `webReadMultiple(urls)` |
| **Channel Key** | `web` |
| **Tier** | Zero-config (Jina Reader API) |
| **Method** | `https://r.jina.ai/{url}` |
| **Max Content** | 50,000 characters per page |
| **Timeout** | 20 seconds |

**Data Types Extracted:**
- Full page content (markdown or text)
- Page titles
- Word count
- Structured data (addresses, phone numbers, emails) — extracted by LLM from raw content

**Strengths:**
- Zero configuration — works for any public URL
- Extracts clean markdown from messy HTML
- Can read directory pages, business listings, and company about pages
- The bridge to LLM extraction — turns raw web pages into structured lead data

**Limitations:**
- Cannot access pages behind authentication
- Some sites block Jina Reader
- Content is capped at 50k characters (sufficient for most business pages)
- Not used directly in Scout's main search — used as a secondary channel when search results point to directory pages that need deep reading

**When to use:** Scout uses Web Reader indirectly — when Exa returns URLs that point to directory pages (e.g., a "Top 10 Accounting Firms in Dubai" article), those URLs are candidates for deep reading. However, Scout's current implementation does not perform deep reads during discovery (that's the Data Enrichment agent's job). Scout may use Web Reader in future implementations for directory extraction.

### 4.5 GitHub

| Attribute | Detail |
|-----------|--------|
| **Bridge Function** | `githubSearchRepos(query, limit)` |
| **Channel Key** | `github` |
| **Tier** | Zero-config (gh CLI for public repos) |
| **Method** | `gh search repos "{query}" --sort stars --limit {N} --json ...` |
| **Max Results** | 10 per search |
| **Timeout** | 30 seconds |

**Data Types Extracted:**
- Repository names and full names (owner/repo)
- Descriptions
- URLs
- Star counts
- Primary programming languages

**Strengths:**
- Excellent for finding tech companies and developer-tool vendors
- Repository descriptions often reveal company focus and product
- Star counts indicate company size and community engagement
- Language data reveals tech stack
- Zero-config for public repos (gh CLI)

**Limitations:**
- Only finds companies with public GitHub presence
- Not relevant for non-tech industries
- Repository ≠ company (must infer company from repo owner/description)

**When to use:** When targeting tech companies, SaaS vendors, developer-tool companies, or any company likely to have an active GitHub presence. Not included in Scout's default parallel search (which focuses on the 6 most universally applicable channels), but can be added by Atlas when the campaign targets a tech industry.

### 4.6 Twitter/X

| Attribute | Detail |
|-----------|--------|
| **Bridge Functions** | `twitterSearch(query, limit)` / `twitterSearchUsers(query, limit)` |
| **Channel Key** | `twitter` |
| **Tier** | Multi-source pipeline (bird CLI → Exa → Jina Search) |
| **Primary Method** | `bird search "{query}" -n {limit}` |
| **Fallback Method 1** | `exaSearch("site:twitter.com OR site:x.com {query}", limit)` |
| **Fallback Method 2** | `https://s.jina.ai/site:twitter.com+{query}` |
| **Max Results** | 5 per search type (tweets + users = 10 total) |
| **Timeout** | 20 seconds |

**Data Types Extracted:**
- Tweet text
- Author handles
- Tweet URLs
- Engagement metrics (likes, retweets — when available from bird CLI)
- Dates

**Strengths:**
- Real-time social signals
- Active company accounts indicate current operations
- Tweets can reveal company activities (hiring, product launches, events)
- User search finds company accounts directly
- 3-method fallback pipeline ensures resilience

**Limitations:**
- bird CLI requires authentication setup
- Twitter/X has aggressive rate limiting
- Tweet content is noisy — lots of irrelevant discussion mixed with company mentions
- Author handles may not match company names

**When to use:** Always. Scout fires both `twitterSearch` and `twitterSearchUsers` for every campaign. Twitter provides real-time social proof and can surface companies that don't have strong web or LinkedIn presence.

**Example API Calls:**
```typescript
// Tweet search
const tweets = await AgentReachToolkit.twitterSearch("accounting firm Dubai", 5);
// Returns: ToolResult<TwitterResult[]>
// { success: true, data: [{ text: "Proud to announce our new Dubai office...", author: "@companyname", url: "...", likes: 42, retweets: 5, date: "2024-11-15" }] }

// User search
const users = await AgentReachToolkit.twitterSearchUsers("Accounting Dubai", 5);
// Returns: ToolResult<TwitterResult[]>
// { success: true, data: [{ text: "Leading accounting firm in the UAE", author: "@firmname", url: "https://twitter.com/firmname", likes: 0, retweets: 0, date: "" }] }
```

### 4.7 Reddit

| Attribute | Detail |
|-----------|--------|
| **Bridge Function** | `redditSearch(query, limit)` |
| **Channel Key** | `reddit` |
| **Tier** | Zero-config (public JSON API) |
| **Primary Method** | `https://www.reddit.com/search.json?q={query}&limit={N}&sort=relevance` |
| **Fallback Method** | `webRead("https://www.reddit.com/search/?q={query}")` via Jina Reader |
| **Max Results** | 5 per search |
| **Timeout** | 15 seconds |

**Data Types Extracted:**
- Post titles
- Post URLs
- Self-text (post body content)
- Subreddit names
- Author names
- Scores and comment counts

**Strengths:**
- Community-driven recommendations ("Who's the best accountant in Dubai?")
- Niche subreddits (r/Dubai, r/Accounting) contain local expertise
- Reddit discussions often mention small/local companies that don't appear in web search
- Zero-config — public JSON API requires no authentication

**Limitations:**
- High noise ratio — most Reddit posts are discussions, not company listings
- Rate limiting from Reddit API (30 req/min)
- Reddit content must be carefully filtered by the LLM to extract actual company mentions
- Self-text is truncated to 500 characters in the bridge

**When to use:** Always. Reddit is Scout's "hidden gem" channel — it often surfaces niche companies and local businesses that don't appear in standard web search. The LLM extraction step is critical for filtering out discussion noise.

**Example API Call:**
```typescript
const result = await AgentReachToolkit.redditSearch("accounting firms Dubai", 5);
// Returns: ToolResult<RedditPostResult[]>
// {
//   success: true,
//   data: [
//     { title: "Best accounting firms in Dubai for expats?", url: "https://reddit.com/r/Dubai/...", author: "user123", score: 45, numComments: 23, subreddit: "Dubai", selftext: "I'm looking for recommendations..." },
//     ...
//   ],
//   channel: 'reddit',
//   source: 'Reddit JSON API'
// }
```

### 4.8 RSS (Available but Not Used in Default Search)

| Attribute | Detail |
|-----------|--------|
| **Bridge Function** | `rssRead(url)` |
| **Channel Key** | `rss` |
| **Tier** | Zero-config |
| **Use Case** | Industry news feeds for new business registrations, market intelligence |

RSS is available in the Agent-Reach bridge but is not included in Scout's default parallel search. It can be added by Atlas for campaigns that specifically request market intelligence or industry news monitoring.

---

## 5. Search Strategy Engine

### 5.1 Query Construction

Scout constructs the composite search query from the input parameters:

```typescript
const searchQuery = [query, industry, location].filter(Boolean).join(' ');
```

**Examples:**

| Input | Composite Query |
|-------|----------------|
| `query="accounting firms"`, `industry="Accounting"`, `location="Dubai"` | `"accounting firms Accounting Dubai"` |
| `query="fintech startups"`, `industry="Finance"`, `location="Singapore"` | `"fintech startups Finance Singapore"` |
| `query=""`, `industry="Marketing"`, `location="London"` | `"Marketing London"` |
| `query="SaaS companies"`, `industry=""`, `location=""` | `"SaaS companies"` |

### 5.2 Channel-Specific Query Adaptation

Different channels receive slightly different queries based on their strengths:

| Channel | Query Pattern | Example |
|---------|---------------|---------|
| Exa Search | `{searchQuery}` | `"accounting firms Accounting Dubai"` |
| Reddit | `{searchQuery}` | `"accounting firms Accounting Dubai"` |
| LinkedIn People | `{industry} {location}` | `"Accounting Dubai"` (only if industry provided) |
| LinkedIn Companies | `{industry} {location} company` | `"Accounting Dubai company"` |
| Twitter Search | `{searchQuery}` | `"accounting firms Accounting Dubai"` |
| Twitter Users | `{industry} {query}` | `"Accounting accounting firms"` |

### 5.3 Search Broadening

When initial results are sparse (< 10 raw results), Scout can broaden the search:

1. **Industry synonyms**: "Accounting" → "Accounting OR Audit OR Tax Advisory OR Bookkeeping"
2. **Geographic expansion**: "Dubai" → "Dubai OR Abu Dhabi OR UAE OR United Arab Emirates"
3. **Query relaxation**: Remove specific qualifiers, search for broader categories
4. **Additional channels**: Add GitHub, RSS, or YouTube to the search pool

### 5.4 Search Narrowing

When initial results are overwhelming (> 100 raw results), Scout can narrow:

1. **Add qualifiers**: Append "company" or "firm" to filter out articles
2. **Geographic restriction**: Add specific city name instead of country
3. **Industry specificity**: Use sub-industry terms instead of broad categories
4. **Reduce result counts**: Lower `numResults` per channel

---

## 6. Deduplication System

### 6.1 Deduplication Strategy

Scout performs deduplication at two levels:

**Level 1: LLM-based deduplication (during extraction)**

The LLM extraction prompt includes:
```
IMPORTANT RULES:
- Deduplicate companies that appear multiple times
```

The LLM receives all raw results from all channels simultaneously and naturally merges duplicate entries when extracting company data.

**Level 2: Database-level deduplication (during persistence)**

When creating Lead records, Scout does not currently check for existing leads with the same company name. This is a known limitation — deduplication relies primarily on the LLM's ability to recognize duplicates during extraction.

### 6.2 Fuzzy Matching (Future Enhancement)

Planned fuzzy matching algorithm for database-level dedup:

```typescript
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')          // Remove punctuation
    .replace(/\b(inc|llc|ltd|gmbh|co|corp|limited|sa|ag|bv)\b/gi, '')  // Remove legal suffixes
    .replace(/\s+/g, ' ')             // Normalize whitespace
    .trim();
}

function isDuplicate(name1: string, name2: string): boolean {
  const n1 = normalizeCompanyName(name1);
  const n2 = normalizeCompanyName(name2);
  return n1 === n2 || levenshteinDistance(n1, n2) / Math.max(n1.length, n2.length) < 0.2;
}
```

### 6.3 Confidence Scoring for Merges

When the same company is found across multiple channels, Scout's LLM extraction naturally produces a single entry with multiple sources in the `sources[]` array:

```json
{
  "companyName": "Deloitte Middle East",
  "website": "https://www2.deloitte.com/middle-east",
  "sources": ["https://www2.deloitte.com/...", "https://linkedin.com/company/deloitte", "https://twitter.com/DeloitteMENA"]
}
```

The number of distinct source channels for a single company serves as a confidence signal — companies found on 3+ channels are more likely to be real and active than companies found on only 1 channel.

---

## 7. Coverage Maximization

### 7.1 The Coverage Principle

Scout's fundamental design principle: **A prospect found on only one channel is still a prospect.** But a prospect found on zero channels is a missed opportunity.

Coverage maximization strategies:

1. **Always search all applicable channels** — Never skip a channel unless it's explicitly not applicable (e.g., skip LinkedIn People if no industry is provided)
2. **Use channel-specific query adaptations** — Different channels get different query formulations to maximize their unique strengths
3. **Accept partial channel success** — If 4/6 channels return results, that's still valuable. Don't discard the 4 successful channels' data because 2 failed.
4. **Record and report channel failures** — Every channel failure is logged in `ChannelActivityRecord[]` so that Atlas (and the user) know which channels contributed and which didn't.

### 7.2 Channel Contribution Tracking

For every campaign, Scout tracks which channels contributed results:

```typescript
const successfulChannels = channelActivity
  .filter(c => c.success)
  .map(c => c.channel);
// e.g., ["exa_search", "linkedin", "twitter"]
```

This data is included in the task output and flows through to the campaign report.

### 7.3 Source Diversity Score

Scout computes a source diversity score for each campaign:

```
sourceDiversity = unique_channels_with_results / total_channels_searched

Excellent:  ≥ 0.8 (5/6 channels)
Good:       ≥ 0.6 (4/6 channels)
Fair:       ≥ 0.4 (3/6 channels)
Poor:       < 0.4 (2 or fewer channels)
```

---

## 8. Result Quality Assessment

### 8.1 LLM Extraction Quality

Scout relies on the LLM to separate real companies from noise. The extraction prompt includes strict rules:

```
IMPORTANT RULES:
- Only include REAL companies/businesses, not articles or blog posts
- If a result is just an article or discussion, skip it
- Extract as much detail as possible from the snippet
- If you can't find certain fields, use null
- Deduplicate companies that appear multiple times
```

### 8.2 Noise Filtering Patterns

Common noise patterns that the LLM should filter out:

| Noise Type | Example | Why It's Noise |
|-----------|---------|----------------|
| Blog articles | "Top 10 Accounting Firms in Dubai" | Not a company, it's an article listing companies |
| Reddit discussions | "Best accountant in Dubai?" | The post is a question, not a company |
| Job listings | "Accountant wanted at [Company]" | Not a company listing, though it reveals a company name |
| News articles | "EY opens new Dubai office" | Not a company page, but may mention a real company |
| Social media profiles | "@john_doe — CPA" | Individual, not a company |

### 8.3 Confidence Annotations

Scout annotates each extracted company with source information:

```json
{
  "companyName": "PwC Middle East",
  "sources": ["https://pwc.com/middle-east", "https://linkedin.com/company/pwc"]
}
```

Companies extracted from LLM knowledge fallback (when all channels fail) are annotated:

```json
{
  "companyName": "KPMG Lower Gulf",
  "sources": ["llm_knowledge"]
}
```

---

## 9. Decision Framework

### 9.1 Channel Selection Decision Tree

```
START CAMPAIGN
│
├─ Is industry specified?
│  ├─ YES → Search LinkedIn People (industry + location)
│  └─ NO  → Skip LinkedIn People (returns irrelevant results without industry context)
│
├─ Is location specified?
│  ├─ YES → Include location in all search queries
│  └─ NO  → Search globally (no location filter)
│
├─ Is the target industry tech-related?
│  ├─ YES → Consider adding GitHub search
│  └─ NO  → Skip GitHub (unlikely to yield relevant results)
│
├─ Is the target industry niche/local?
│  ├─ YES → Prioritize Reddit for community recommendations
│  └─ NO  → Standard channel priority
│
└─ Default: Search all 6 primary channels simultaneously
```

### 9.2 Search Order

Scout searches all channels simultaneously — there is no sequential order. The `Promise.allSettled` pattern ensures all channels start at the same time, minimizing total latency.

### 9.3 Query Strategy by Campaign Type

| Campaign Type | Primary Query | LinkedIn People Query | LinkedIn Company Query | Twitter Users Query |
|--------------|---------------|----------------------|----------------------|-------------------|
| Industry + Location | `"{industry} {location}"` | `"{industry} {location}"` | `"{industry} {location} company"` | `"{industry} {query}"` |
| Industry only | `"{industry} companies"` | `"{industry}"` | `"{industry} company"` | `"{industry}"` |
| Location only | `"businesses {location}"` | *(skipped)* | `"{location} company"` | `"{location}"` |
| Free-text only | `"{query}"` | *(skipped)* | `"{query} company"` | `"{query}"` |

---

## 10. Constraints & Rate Limits

### 10.1 Per-Channel Rate Limits

| Channel | Rate Limit | Max Results per Call | Timeout |
|---------|-----------|---------------------|---------|
| Exa Search | 30 req/min | 15 | 25s |
| LinkedIn People | 10 req/min | 10 | 20s |
| LinkedIn Companies | 10 req/min | 10 | 15s |
| Twitter Search | 15 req/min | 5 | 20s |
| Twitter Users | 15 req/min | 5 | 20s |
| Reddit | 30 req/min | 5 | 15s |

### 10.2 Ethical Guidelines

- **Respect `robots.txt`** — All Agent-Reach channels respect site-level crawling directives
- **Never store PII** — Scout only stores business contact information (company emails, company phone numbers), not personal data
- **Source attribution** — Every lead record includes a `sources` field tracking where the data was found
- **LLM knowledge transparency** — Leads generated from LLM knowledge (not live search) are clearly marked with `sources: ["llm_knowledge"]`
- **No authentication bypass** — Scout never accesses pages behind login walls; it uses public APIs and Jina Reader for public pages only

### 10.3 Scope Boundaries

- **Maximum raw results per channel**: 15 (Exa), 10 (LinkedIn), 5 (Twitter), 5 (Reddit)
- **Maximum total raw results**: ~50 per campaign (across all channels)
- **Maximum extracted companies**: ~30 per campaign (after LLM extraction and dedup)
- **Maximum LLM input**: 30 raw results (truncated before passing to extraction prompt)
- **Scout does NOT enrich** — It extracts basic firmographic data from search snippets but does not read company websites in depth (that's the Data Enrichment agent's job)
- **Scout does NOT score** — It doesn't assign lead scores or tiers (that's the Lead Qualification agent's job)

---

## 11. Performance Metrics

### 11.1 Discovery Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Unique prospects per campaign | ≥ 15 | Count of Lead records created |
| Source diversity | ≥ 3 channels contributing | Unique channels with successful results |
| Channel success rate | ≥ 80% | Successful channels / total channels searched |
| LLM extraction accuracy | ≥ 90% | Real companies / total extracted companies |

### 11.2 Operational Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Total search latency | < 30 seconds | > 60 seconds |
| LLM extraction latency | < 15 seconds | > 30 seconds |
| Lead creation throughput | < 5 seconds per lead | > 10 seconds per lead |
| End-to-end campaign time | < 2 minutes | > 5 minutes |

### 11.3 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Deduplication accuracy | ≥ 95% | False positive rate < 5% (merging non-duplicate companies) |
| Noise filtering accuracy | ≥ 90% | Articles/discussions correctly excluded |
| Data completeness | ≥ 40% | Average fields populated per lead |
| Contact info discovery | ≥ 20% | Leads with at least one contact channel |

---

## 12. Workflow Examples

### 12.1 Standard Campaign: "Find accounting firms in Dubai"

```
INPUT:
  query: "accounting firms"
  industry: "Accounting"
  location: "Dubai, UAE"

COMPOSITE QUERY: "accounting firms Accounting Dubai"

PARALLEL SEARCH (T+0:00):
  ├─ Exa Search: "accounting firms Accounting Dubai" → 15 results
  ├─ Reddit Search: "accounting firms Accounting Dubai" → 3 results
  ├─ LinkedIn People: "Accounting Dubai" → 8 results
  ├─ LinkedIn Companies: "Accounting Dubai company" → 7 results
  ├─ Twitter Search: "accounting firms Accounting Dubai" → 4 results
  └─ Twitter Users: "Accounting accounting firms" → 3 results

RAW RESULTS POOL: 40 results total (from 6 channels)
CHANNEL ACTIVITY: 6/6 successful

LLM EXTRACTION (T+0:12):
  Input: 30 raw results (truncated from 40)
  Output: 18 companies extracted
  
  Sample extracted company:
  {
    "companyName": "Deloitte Middle East",
    "website": "https://www2.deloitte.com/middle-east",
    "industry": "Accounting",
    "city": "Dubai",
    "country": "UAE",
    "phoneMain": null,
    "generalEmail": null,
    "hqAddress": null,
    "linkedinUrl": "https://linkedin.com/company/deloitte",
    "description": "One of the Big Four accounting firms with a major presence in the Middle East",
    "sources": ["https://www2.deloitte.com/...", "https://linkedin.com/company/deloitte"]
  }

LEAD PERSISTENCE (T+0:15):
  18 Lead records created (stage: 'new')
  Campaign.leadsFound incremented by 18

RESULT (T+0:18):
  {
    found: 18,
    leadsCreated: 18,
    channels: ["exa_search", "reddit", "linkedin", "twitter"]
  }
```

### 12.2 Partial Channel Failure: "Find biotech startups in Zurich"

```
INPUT:
  query: "biotech startups"
  industry: "Biotechnology"
  location: "Zurich, Switzerland"

COMPOSITE QUERY: "biotech startups Biotechnology Zurich"

PARALLEL SEARCH (T+0:00):
  ├─ Exa Search: SUCCESS → 9 results
  ├─ Reddit Search: SUCCESS → 2 results
  ├─ LinkedIn People: SUCCESS → 4 results
  ├─ LinkedIn Companies: FAILED (no results from Exa/Jina fallback)
  ├─ Twitter Search: FAILED (bird CLI unavailable, Exa fallback empty)
  └─ Twitter Users: FAILED (all methods failed)

RAW RESULTS POOL: 15 results (from 3 of 6 channels)
CHANNEL ACTIVITY: 3/6 successful, 3 failed

ADAPTIVE NOTE: Source diversity = 3/6 = 0.5 (Fair)
  → Atlas may dispatch supplementary discovery with broader terms

LLM EXTRACTION (T+0:10):
  Input: 15 raw results
  Output: 7 companies extracted

LEAD PERSISTENCE (T+0:13):
  7 Lead records created

RESULT:
  {
    found: 7,
    leadsCreated: 7,
    channels: ["exa_search", "reddit", "linkedin"]
  }
  
  NOTE: Only 7 leads — below threshold of 10.
  Atlas will trigger adaptive strategy (broaden to "Life Sciences in Switzerland")
```

### 12.3 Total Channel Failure: "Find quantum computing companies in Lagos"

```
INPUT:
  query: "quantum computing companies"
  industry: "Technology"
  location: "Lagos, Nigeria"

COMPOSITE QUERY: "quantum computing companies Technology Lagos"

PARALLEL SEARCH (T+0:00):
  ├─ Exa Search: FAILED (timeout)
  ├─ Reddit Search: FAILED (rate limited)
  ├─ LinkedIn People: SUCCESS → 1 result (barely relevant)
  ├─ LinkedIn Companies: FAILED (no results)
  ├─ Twitter Search: FAILED
  └─ Twitter Users: FAILED

RAW RESULTS POOL: 0 usable results
CHANNEL ACTIVITY: 0/6 successful (or 1 with irrelevant results)

LLM KNOWLEDGE FALLBACK (T+0:08):
  Prompt: "Generate 5-10 REAL, well-known companies in Technology in Lagos, Nigeria.
           Only include companies you are confident actually exist."
  
  Output: 5 companies generated from LLM parametric knowledge
  [
    { "companyName": "Andela", "website": "https://andela.com", "industry": "Technology",
      "city": "Lagos", "country": "Nigeria", "sources": ["llm_knowledge"] },
    { "companyName": "Flutterwave", "website": "https://flutterwave.com", ... },
    { "companyName": "Paystack", "website": "https://paystack.com", ... },
    { "companyName": "Interswitch", "website": "https://interswitchgroup.com", ... },
    { "companyName": "Cowrywise", "website": "https://cowrywise.com", ... }
  ]

LEAD PERSISTENCE:
  5 Lead records created
  Each annotated with sources: ["llm_knowledge"]

CHANNEL ACTIVITY:
  [
    { channel: "exa_search", operation: "web_search", success: false, error: "timeout" },
    { channel: "reddit", operation: "search", success: false, error: "rate limited" },
    { channel: "linkedin", operation: "search_people", success: true, resultCount: 1 },
    { channel: "linkedin", operation: "search_companies", success: false, error: "no results" },
    { channel: "twitter", operation: "search_tweets", success: false, error: "all methods failed" },
    { channel: "twitter", operation: "search_users", success: false, error: "all methods failed" },
    { channel: "llm_fallback", operation: "generate_companies", success: true, resultCount: 5,
      error: "All search channels returned no results; used LLM knowledge fallback" }
  ]

RESULT:
  {
    found: 5,
    leadsCreated: 5,
    channels: ["llm_fallback"]
  }
  
  NOTE: All leads are from LLM knowledge, not live search.
  These should be verified by the enrichment agent before outreach.
```

---

## Appendix A: Runtime Implementation Reference

### Database Models Used

```prisma
model Campaign {
  id          String   @id @default(cuid())
  name        String
  targetIndustry String?
  targetLocation String?
  status      String   @default("active")
  leadsFound  Int      @default(0)
  leads       Lead[]
  tasks       AgentTask[]
}

model Lead {
  id            String   @id @default(cuid())
  campaignId    String
  companyName   String
  website       String?
  industry      String?
  city          String?
  country       String?
  phoneMain     String?
  generalEmail  String?
  hqAddress     String?
  linkedinUrl   String?
  notes         String?
  sources       String?  // JSON array
  stage         String   @default("new")
  discoveredAt  DateTime @default(now())
}

model AgentTask {
  id          String   @id @default(cuid())
  campaignId  String?
  agentName   String   // "prospect-discovery"
  taskType    String   // "search"
  status      String   @default("pending")
  input       String?  // JSON
  output      String?  // JSON
  progress    Int      @default(0)
}
```

### Key Function Signatures

```typescript
// Main handler
function executeProspectDiscovery(ctx: AgentExecutionContext): Promise<AgentExecutionResult>

// Agent-Reach bridge functions used
AgentReachToolkit.exaSearch(query: string, numResults: number): Promise<ToolResult<SearchResult[]>>
AgentReachToolkit.redditSearch(query: string, limit: number): Promise<ToolResult<RedditPostResult[]>>
AgentReachToolkit.linkedInSearchPeople(query: string, limit: number): Promise<ToolResult<LinkedInProfileResult[]>>
AgentReachToolkit.linkedInSearchCompanies(query: string, limit: number): Promise<ToolResult<LinkedInProfileResult[]>>
AgentReachToolkit.twitterSearch(query: string, limit: number): Promise<ToolResult<TwitterResult[]>>
AgentReachToolkit.twitterSearchUsers(query: string, limit: number): Promise<ToolResult<TwitterResult[]>>

// LLM functions
function callLLMForJSON<T>(systemPrompt: string, userMessage: string, defaultValue?: T): Promise<T>
function updateTaskProgress(taskId: string, progress: number, status?: string, output?: Record<string, unknown>): Promise<void>
```

### API Dispatch

```http
POST /api/agents/execute
Content-Type: application/json

{
  "mode": "dispatch",
  "agentName": "prospect-discovery",
  "taskType": "search",
  "input": {
    "query": "accounting firms",
    "industry": "Accounting",
    "location": "Dubai, UAE"
  }
}
```
