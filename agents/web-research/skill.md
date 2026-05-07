# Web Research Agent — Skills (Sage)

> Complete skill reference for the Sage Web Research Agent. Each skill documents the trigger conditions, input/output schemas, method, Agent-Reach bridge function signatures, LLM prompts, fallback chains, error handling, example API calls, and performance targets.

---

## Skill 1: Company Deep-Dive Research

### Overview

Sage performs comprehensive analysis of a specific company — reading its website in full, searching LinkedIn for professional data, and scanning news for recent developments. This produces a 360° company profile with history, services, leadership, financials, and competitive position.

### Trigger

| Condition | Action |
|-----------|--------|
| User requests detailed analysis of a specific company | Execute full company deep-dive |
| Lead needs comprehensive research before outreach | Execute targeted deep-dive |
| Partnership or acquisition evaluation needed | Execute financial + strategic deep-dive |

### Input Schema

```typescript
interface CompanyDeepDiveInput {
  companyName: string;
  website?: string;            // Known URL (optional, will be discovered)
  focusAreas?: string[];       // Optional focus: ["financials", "products", "leadership"]
  depth?: 'standard' | 'deep'; // standard = 3 sources, deep = 5+ sources
}
```

### Output Schema

```typescript
interface CompanyDeepDiveOutput {
  summary: string;
  companyProfile: {
    name: string;
    industry: string;
    founded: string | null;
    headquarters: string | null;
    employeeCount: string | null;
    revenue: string | null;
    website: string;
    description: string;
  };
  products: Array<{ name: string; description: string }>;
  leadership: Array<{ name: string; title: string; linkedinUrl?: string }>;
  recentNews: Array<{ title: string; date: string; source: string; url: string }>;
  competitivePosition: string;
  sources: Array<{ title: string; url: string; type: string }>;
}
```

### Method

1. **Website deep read**: `webRead(companyWebsite)` — Read homepage, `/about`, `/products`, `/team`
2. **LinkedIn company search**: `linkedInSearchCompanies(companyName)` — Find official company page
3. **LinkedIn company page read**: `linkedInReadCompanyPage(linkedinUrl)` — Extract structured data
4. **Exa search for news/financials**: `exaSearch("COMPANY_NAME revenue funding news 2025")`
5. **Twitter recent activity**: `twitterSearch("COMPANY_NAME announcement 2025")`
6. **YouTube presentations**: `youtubeSearch("COMPANY_NAME conference presentation")`
7. **LLM synthesis**: Combine all sources into structured company profile

### Agent-Reach Bridge Functions

```typescript
// src/lib/agent-reach-bridge.ts

export async function webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
export async function webReadMultiple(urls: string[]): Promise<ToolResult<WebReadResult>[]>
export async function linkedInSearchCompanies(query: string, limit?: number): Promise<ToolResult<LinkedInProfileResult[]>>
export async function linkedInReadCompanyPage(companyUrl: string): Promise<ToolResult<LinkedInProfileResult>>
export async function exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
export async function twitterSearch(query: string, limit?: number): Promise<ToolResult<TwitterResult[]>>
export async function youtubeSearch(query: string, limit?: number): Promise<ToolResult<YouTubeResult[]>>
```

### LLM Prompt

```
System: You are a corporate intelligence analyst. Given multi-source research data about a company, produce a comprehensive company profile.

Return a JSON object:
{
  "summary": "Executive overview (2-3 paragraphs)",
  "companyProfile": {
    "name": "Official company name",
    "industry": "Industry classification",
    "founded": "Year or null",
    "headquarters": "City, Country or null",
    "employeeCount": "Range or null",
    "revenue": "Estimate or null",
    "website": "URL",
    "description": "Brief description (2-3 sentences)"
  },
  "products": [{"name": "Product/Service", "description": "Brief description"}],
  "leadership": [{"name": "Full Name", "title": "Title", "linkedinUrl": "URL or null"}],
  "recentNews": [{"title": "Headline", "date": "YYYY-MM-DD or null", "source": "Source name", "url": "URL"}],
  "competitivePosition": "Analysis of competitive strengths and weaknesses",
  "sources": [{"title": "Source Title", "url": "URL", "type": "web|search|linkedin|twitter|youtube"}]
}

Rules:
- Support every factual claim with at least one source
- Mark inferences as [inferred]
- Flag data older than 2 years with [⚠ as of YYYY]
- Only include leadership you can confirm from sources

User: Company: {companyName}
Website content: {websiteContent}
LinkedIn data: {linkedInData}
Search results: {exaResults}
Twitter activity: {twitterResults}
YouTube content: {youtubeResults}
```

### Fallback Chain

| Step | Method | Data Quality |
|------|--------|-------------|
| 1 | Full multi-source collection (6 channels) | Highest |
| 2 | Reduced collection (4 channels, skip YouTube + Reddit) | High |
| 3 | Minimal collection (Web + Exa only) | Medium |
| 4 | LLM knowledge fallback | Low (marked as estimated) |

### Error Handling

| Error | Recovery |
|-------|----------|
| Company website returns 403/404 | Use Exa + LinkedIn as primary sources |
| LinkedIn company page not found | Use Exa search for company profiles |
| No recent news found | Note in brief: "No recent public news available" |
| YouTube returns no results | Skip video analysis, proceed with text sources |
| LLM JSON parse failure | Retry with stricter prompt; return default structure |

### Example API Call

```typescript
// Read company website
const webResult = await webRead('https://stripe.com');
// → Full homepage content

// Search for company on LinkedIn
const linkedIn = await linkedInSearchCompanies('Stripe', 3);
// → [{ name: "Stripe", headline: "Financial Services | 5001-10000 employees", url: "..." }]

// Read LinkedIn company page for structured data
const companyPage = await linkedInReadCompanyPage('https://linkedin.com/company/stripe');
// → { name: "Stripe", headline: "Financial Services | 5001-10000 | Privately Held", ... }

// Search for recent news and financials
const news = await exaSearch('Stripe revenue funding news 2025', 5);
// → [{ title: "Stripe Hits $1T in Payments", url: "...", snippet: "..." }, ...]
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Company profile completeness | 85%+ of fields filled |
| Leadership identification | 3+ key executives identified |
| Recent news items | 3+ news items from last 12 months |
| Total execution time | < 3 minutes |
| Source count | 5+ distinct sources |

---

## Skill 2: Market & Industry Research

### Overview

Sage researches industry landscapes — market size, growth trends, key players, regulatory environment, and emerging opportunities. This intelligence helps users understand a market before committing resources.

### Trigger

| Condition | Action |
|-----------|--------|
| User asks about a market/industry landscape | Execute market research |
| Need to understand a target market before prospecting | Execute market sizing + trends |
| Evaluating market entry opportunities | Execute comprehensive market analysis |

### Input Schema

```typescript
interface MarketResearchInput {
  industry: string;           // e.g., "Healthcare Technology"
  geography?: string;         // e.g., "North America" (default: Global)
  aspects?: string[];         // e.g., ["size", "growth", "regulation", "players"]
  year?: string;              // Target year for data (default: current year)
}
```

### Output Schema

```typescript
interface MarketResearchOutput {
  summary: string;
  marketSize: { value: string; year: string; source: string } | null;
  growthRate: { value: string; period: string; source: string } | null;
  keyPlayers: Array<{ name: string; marketShare?: string; details: string }>;
  trends: string[];
  regulatoryOverview: string;
  opportunities: string[];
  challenges: string[];
  sources: Array<{ title: string; url: string; type: string }>;
}
```

### Method

1. **Exa search for market reports**: `exaSearch("INDUSTRY market size trends GEOGRAPHY 2024 2025")`
2. **Web deep read**: Read top 2-3 industry report URLs for detailed data
3. **LinkedIn company scan**: `linkedInSearchCompanies("INDUSTRY")` for key players
4. **YouTube expert talks**: `youtubeSearch("INDUSTRY market trends conference 2025")`
5. **Reddit practitioner views**: `redditSearch("INDUSTRY market trends")` for grassroots insights
6. **Twitter real-time signals**: `twitterSearch("INDUSTRY trends 2025")`
7. **LLM synthesis**: Combine all sources into structured market intelligence

### Agent-Reach Bridge Functions

```typescript
export async function exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
export async function webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
export async function linkedInSearchCompanies(query: string, limit?: number): Promise<ToolResult<LinkedInProfileResult[]>>
export async function youtubeSearch(query: string, limit?: number): Promise<ToolResult<YouTubeResult[]>>
export async function redditSearch(query: string, limit?: number): Promise<ToolResult<RedditPostResult[]>>
export async function twitterSearch(query: string, limit?: number): Promise<ToolResult<TwitterResult[]>>
```

### LLM Prompt

```
System: You are a market research analyst. Given multi-source research data about an industry, produce a comprehensive market intelligence brief.

Return a JSON object:
{
  "summary": "Executive overview of the market (2-3 paragraphs)",
  "marketSize": {"value": "$XX billion", "year": "YYYY", "source": "Source name"} or null,
  "growthRate": {"value": "XX% CAGR", "period": "YYYY-YYYY", "source": "Source name"} or null,
  "keyPlayers": [
    {"name": "Company", "marketShare": "XX% or null", "details": "Brief profile"}
  ],
  "trends": ["Trend 1 with evidence", "Trend 2 with evidence", ...],
  "regulatoryOverview": "Summary of key regulations and compliance requirements",
  "opportunities": ["Opportunity 1", "Opportunity 2", ...],
  "challenges": ["Challenge 1", "Challenge 2", ...],
  "sources": [{"title": "Title", "url": "URL", "type": "web|search|linkedin|reddit|youtube|twitter"}]
}

Rules:
- Market size and growth rate MUST be attributed to a specific source
- If sources disagree on market size, present the range and note the discrepancy
- Support every trend with evidence from at least one source
- Mark estimates as [estimated]
- Focus on actionable insights over raw data

User: Industry: {industry}
Geography: {geography}
Search results: {exaResults}
Deep reads: {deepReads}
LinkedIn companies: {linkedInData}
YouTube content: {youtubeResults}
Reddit discussions: {redditResults}
Twitter signals: {twitterResults}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | Full 6-channel collection + deep reads | Highest |
| 2 | 4-channel collection (skip YouTube + Reddit) | High |
| 3 | Exa search only + web reads | Medium |
| 4 | LLM knowledge (no web data) | Low |

### Error Handling

| Error | Recovery |
|-------|----------|
| Market size not found in any source | Mark as null, note "Market size data not publicly available" |
| Conflicting market size figures | Present range, attribute to sources |
| No industry reports found | Use company data and news to estimate |
| Reddit blocks server IP | Fall back to Jina Reader for Reddit content |

### Example API Call

```typescript
// Search for industry reports
const reports = await exaSearch('healthcare AI market size 2024 2025 trends', 10);
// → [{ title: "AI in Healthcare Market - Grand View Research", url: "...", snippet: "Market size $15.4B..." }, ...]

// Read top report for detailed data
const reportContent = await webRead(reports.data[0].url);
// → Full report content with market size, CAGR, segments, key players

// Find key companies on LinkedIn
const companies = await linkedInSearchCompanies('healthcare AI medical technology', 5);
// → [{ name: "Tempus", headline: "Hospitals & Health Care | 1001-5000", ... }, ...]
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Market size data found | 70%+ of research tasks |
| Key players identified | 5+ companies per brief |
| Trends identified | 5+ trends with evidence |
| Source diversity | 3+ channel types |
| Total execution time | < 4 minutes |

---

## Skill 3: Competitive Landscape Analysis

### Overview

Sage identifies and profiles competitors within a market segment, producing a competitive landscape map with positioning, strengths/weaknesses, and strategic recommendations.

### Trigger

| Condition | Action |
|-----------|--------|
| User asks about competitors or alternatives | Execute competitive analysis |
| Need to understand competitive dynamics for a market | Execute competitor scan + profiling |
| Evaluating a company's competitive position | Execute positioning analysis |

### Input Schema

```typescript
interface CompetitiveAnalysisInput {
  companyName?: string;       // Target company (optional)
  industry: string;           // Market segment
  geography?: string;         // Region (default: Global)
}
```

### Output Schema

```typescript
interface CompetitiveAnalysisOutput {
  summary: string;
  competitors: Array<{
    name: string;
    position: 'leader' | 'challenger' | 'niche' | 'emerging';
    strengths: string[];
    weaknesses: string[];
    details: string;
  }>;
  positioningMap: string;        // Text description of competitive positions
  marketDynamics: string;        // How competition is evolving
  recommendations: string[];
  sources: Array<{ title: string; url: string; type: string }>;
}
```

### Method

1. **Identify competitors**: `exaSearch("INDUSTRY competitors alternatives market leaders")` + `exaSearch("COMPANY vs competitors comparison")`
2. **Individual competitor research**: For top 3-5 competitors, `webRead()` their websites
3. **LinkedIn positioning**: `linkedInSearchCompanies()` for each competitor's profile
4. **Community sentiment**: `redditSearch("INDUSTRY best alternatives comparison")`
5. **Twitter buzz**: `twitterSearch("INDUSTRY vs competitors")` for real-time comparisons
6. **LLM synthesis**: Build competitive landscape map with positioning analysis

### Agent-Reach Bridge Functions

```typescript
export async function exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
export async function webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
export async function linkedInSearchCompanies(query: string, limit?: number): Promise<ToolResult<LinkedInProfileResult[]>>
export async function redditSearch(query: string, limit?: number): Promise<ToolResult<RedditPostResult[]>>
export async function twitterSearch(query: string, limit?: number): Promise<ToolResult<TwitterResult[]>>
```

### LLM Prompt

```
System: You are a competitive intelligence analyst. Given multi-source research data about a market and its competitors, produce a comprehensive competitive landscape analysis.

Return a JSON object:
{
  "summary": "Executive overview of the competitive landscape (2-3 paragraphs)",
  "competitors": [
    {
      "name": "Company Name",
      "position": "leader|challenger|niche|emerging",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "details": "Brief company profile"
    }
  ],
  "positioningMap": "Text description of how competitors are positioned in the market",
  "marketDynamics": "Analysis of how competition is evolving and what's driving change",
  "recommendations": ["Strategic recommendation 1", "Recommendation 2", ...],
  "sources": [{"title": "Title", "url": "URL", "type": "web|search|linkedin|reddit|twitter"}]
}

Rules:
- Classify each competitor by market position (leader/challenger/niche/emerging)
- Support strengths/weaknesses with evidence from sources
- Focus on actionable competitive intelligence, not just company descriptions
- Identify market gaps and underserved segments

User: Industry: {industry}
Company: {companyName or 'N/A'}
Search results: {exaResults}
Deep reads: {deepReads}
LinkedIn data: {linkedInData}
Reddit discussions: {redditResults}
Twitter signals: {twitterResults}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | Full competitor search + individual deep-dives | Highest |
| 2 | Competitor search + summary data only | High |
| 3 | Exa search only | Medium |
| 4 | LLM knowledge | Low |

### Error Handling

| Error | Recovery |
|-------|----------|
| No direct competitors found | Broaden search to adjacent markets |
| Competitor websites unavailable | Use LinkedIn + Exa data |
| Conflicting competitive assessments | Present multiple perspectives, note conflicts |
| Too many competitors (>10) | Focus on top 5 by estimated market presence |

### Performance Targets

| Metric | Target |
|--------|--------|
| Competitors identified | 5+ per analysis |
| Competitor profile depth | Strengths + weaknesses for each |
| Market dynamics analysis | Substantive paragraph with evidence |
| Total execution time | < 5 minutes |

---

## Skill 4: News & Press Release Monitoring

### Overview

Sage monitors recent news, press releases, funding announcements, and social media updates about target companies or topics. This provides real-time intelligence for timely outreach.

### Trigger

| Condition | Action |
|-----------|--------|
| User asks for recent news about a company/topic | Execute news monitoring |
| Need to identify timely outreach triggers | Execute news + social scan |
| Tracking competitor announcements | Execute focused news search |

### Input Schema

```typescript
interface NewsMonitoringInput {
  topic: string;               // Company name or topic
  timeframe?: string;          // "week" | "month" | "quarter" (default: "month")
  categories?: string[];       // ["funding", "product", "hiring", "expansion", "partnership"]
}
```

### Output Schema

```typescript
interface NewsMonitoringOutput {
  summary: string;
  newsItems: Array<{
    title: string;
    date: string | null;
    source: string;
    url: string;
    category: string;           // "funding" | "product" | "hiring" | "expansion" | "partnership" | "general"
    significance: 'high' | 'medium' | 'low';
    summary: string;
  }>;
  trends: string[];
  actionableSignals: string[];
  sources: Array<{ title: string; url: string; type: string }>;
}
```

### Method

1. **Exa news search**: `exaSearch("TOPIC news announcement 2025")` for recent articles
2. **Twitter real-time scan**: `twitterSearch("TOPIC announcement news")` for immediate updates
3. **Reddit discussion**: `redditSearch("TOPIC news")` for community reaction
4. **LinkedIn company updates**: `linkedInSearchCompanies(topic)` for official announcements
5. **LLM categorization**: Classify news by category and significance level

### Agent-Reach Bridge Functions

```typescript
export async function exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
export async function twitterSearch(query: string, limit?: number): Promise<ToolResult<TwitterResult[]>>
export async function redditSearch(query: string, limit?: number): Promise<ToolResult<RedditPostResult[]>>
export async function linkedInSearchCompanies(query: string, limit?: number): Promise<ToolResult<LinkedInProfileResult[]>>
```

### LLM Prompt

```
System: You are a news intelligence analyst. Given search results and social media data about a topic, categorize and assess recent news items.

Return a JSON object:
{
  "summary": "Overview of recent developments (2-3 paragraphs)",
  "newsItems": [
    {
      "title": "Headline",
      "date": "YYYY-MM-DD or null",
      "source": "Source name",
      "url": "URL",
      "category": "funding|product|hiring|expansion|partnership|general",
      "significance": "high|medium|low",
      "summary": "1-2 sentence summary"
    }
  ],
  "trends": ["Trend observed across multiple news items"],
  "actionableSignals": ["Signal that could inform business decisions"],
  "sources": [{"title": "Title", "url": "URL", "type": "search|twitter|reddit|linkedin"}]
}

Rules:
- Only include news from the requested timeframe
- Classify significance: high = material impact, medium = notable, low = informational
- Identify patterns across multiple news items as trends
- Focus on actionable signals that could inform outreach or business decisions
- Sort news items by significance (high → low)

User: Topic: {topic}
Timeframe: {timeframe}
Exa results: {exaResults}
Twitter results: {twitterResults}
Reddit results: {redditResults}
LinkedIn results: {linkedInResults}
```

### Fallback Chain

| Step | Method | Speed |
|------|--------|-------|
| 1 | Exa + Twitter + Reddit (parallel) | Fast (10s) |
| 2 | Exa + Twitter only | Medium (8s) |
| 3 | Exa only | Slow (5s) |
| 4 | LLM knowledge | Instant |

### Error Handling

| Error | Recovery |
|-------|----------|
| No recent news found | Return empty newsItems, note in summary |
| Twitter search blocked | Use Exa search for Twitter-indexed content |
| Dates not available in results | LLM estimates from content context |
| Overwhelming volume of news | Prioritize by significance, cap at 10 items |

### Example API Call

```typescript
// Search for recent news
const news = await exaSearch('Stripe news announcement 2025', 10);
// → [{ title: "Stripe Launches New Payment Method", url: "...", publishedDate: "2025-01-15" }, ...]

// Search Twitter for real-time updates
const tweets = await twitterSearch('Stripe announcement', 5);
// → [{ text: "Stripe just announced...", author: "@stripe", url: "..." }, ...]
```

### Performance Targets

| Metric | Target |
|--------|--------|
| News items found | 5+ per monitoring task |
| Category accuracy | 85%+ correct categorization |
| Significance accuracy | 80%+ correct assessment |
| Recency | 90%+ items within requested timeframe |
| Total execution time | < 2 minutes |

---

## Skill 5: LinkedIn Company Intelligence

### Overview

Sage uses LinkedIn to gather detailed company profiles — industry, size, specialties, headquarters, and key personnel. LinkedIn provides the most structured and reliable company data available through Agent-Reach.

### Trigger

| Condition | Action |
|-----------|--------|
| Need structured company profile data | Execute LinkedIn company search + read |
| Need employee/leadership data | Execute LinkedIn people search |
| Verify company information from other sources | Cross-reference with LinkedIn |

### Input Schema

```typescript
interface LinkedInIntelligenceInput {
  companyName: string;
  needPeople?: boolean;       // Whether to search for people (default: true)
  needCompanyPage?: boolean;  // Whether to deep-read company page (default: true)
  limit?: number;             // Max results per search (default: 5)
}
```

### Output Schema

```typescript
interface LinkedInIntelligenceOutput {
  company: {
    name: string;
    industry: string | null;
    employeeCount: string | null;
    organizationType: string | null;
    headquarters: string | null;
    specialties: string[];
    description: string | null;
    url: string;
  };
  people: Array<{
    name: string;
    headline: string;
    location: string;
    url: string;
  }>;
}
```

### Method

1. **Company search**: `linkedInSearchCompanies(companyName, limit)` — Find company pages
2. **Company page deep read**: `linkedInReadCompanyPage(url)` — Extract structured data
3. **People search**: `linkedInSearchPeople(companyName, limit)` — Find key personnel
4. **Individual profile read**: `linkedInGetProfile(url)` (optional) — Deep-read specific profiles

### Agent-Reach Bridge Functions

```typescript
export async function linkedInSearchCompanies(
  query: string,
  limit: number = 10
): Promise<ToolResult<LinkedInProfileResult[]>>

export async function linkedInReadCompanyPage(
  companyUrl: string
): Promise<ToolResult<LinkedInProfileResult>>

export async function linkedInSearchPeople(
  query: string,
  limit: number = 10
): Promise<ToolResult<LinkedInProfileResult[]>>

export async function linkedInGetProfile(
  url: string
): Promise<ToolResult<LinkedInProfileResult>>
```

**Returns**:
```typescript
interface LinkedInProfileResult {
  name: string;
  headline: string;
  location: string;
  url: string;
  summary?: string;
  experience?: string[];
}
```

### LLM Prompt

```
System: You are a LinkedIn data analyst. Given LinkedIn search results and company page data, extract structured company intelligence.

Return a JSON object:
{
  "company": {
    "name": "Official name",
    "industry": "Industry or null",
    "employeeCount": "Range or null",
    "organizationType": "Type or null",
    "headquarters": "Location or null",
    "specialties": ["Specialty 1", "Specialty 2"] or [],
    "description": "Company description or null",
    "url": "LinkedIn URL"
  },
  "people": [
    {"name": "Name", "headline": "Title at Company", "location": "City", "url": "LinkedIn URL"}
  ]
}

Rules:
- Extract data exactly as presented on LinkedIn
- If company page data includes Industry/Company size/Headquarters fields, use those directly
- Parse the headline field for structured information (industry | size | type)
- Only include people whose profiles clearly indicate employment at the target company

User: Company search results: {companySearchData}
Company page data: {companyPageData}
People search results: {peopleSearchData}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | mcporter LinkedIn API | Highest (structured JSON) |
| 2 | Exa `site:linkedin.com/company` | High (semantic search) |
| 3 | Jina Search | Medium (URL extraction) |
| 4 | Jina Reader direct page read | Medium (regex extraction) |

### Error Handling

| Error | Recovery |
|-------|----------|
| mcporter not available | Automatic fallback to Exa search |
| LinkedIn page requires login | Jina Reader reads public page content |
| Company not found on LinkedIn | Return null for company, note in output |
| People search returns 0 results | Return empty people array |
| Rate limiting by LinkedIn | All methods fall back gracefully |

### Example API Call

```typescript
// Search for company on LinkedIn
const companies = await linkedInSearchCompanies('Stripe', 5);
// → [{ name: "Stripe", headline: "Financial Services | 5001-10000 employees | Privately Held", ... }]

// Read detailed company page
const companyPage = await linkedInReadCompanyPage('https://linkedin.com/company/stripe');
// → { name: "Stripe", headline: "Financial Services | 5001-10000 | Privately Held",
//     location: "San Francisco, CA", summary: "...", experience: ["Payments", "API", ...] }

// Search for people at the company
const people = await linkedInSearchPeople('Stripe CEO executive', 5);
// → [{ name: "Patrick Collison", headline: "CEO at Stripe", location: "San Francisco", url: "..." }]
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Company page found | 85%+ for established companies |
| Structured data extracted | 4+ fields (industry, size, HQ, type) |
| People identified | 3+ key personnel per company |
| Total execution time | < 10 seconds |

---

## Skill 6: Twitter/X Social Intelligence

### Overview

Sage monitors Twitter/X for real-time sentiment, company announcements, executive activity, and trending discussions. Twitter provides the most current social signals available.

### Trigger

| Condition | Action |
|-----------|--------|
| Need real-time company updates | Execute Twitter search |
| Want to understand social sentiment | Execute Twitter + Reddit scan |
| Looking for executive social presence | Execute Twitter user search |

### Input Schema

```typescript
interface TwitterIntelligenceInput {
  topic: string;               // Company name or topic
  searchType?: 'tweets' | 'users' | 'both';  // Default: 'both'
  limit?: number;              // Max results (default: 5)
}
```

### Output Schema

```typescript
interface TwitterIntelligenceOutput {
  tweets: Array<{
    text: string;
    author: string;
    url: string;
    date: string;
    engagement: { likes: number; retweets: number };
  }>;
  users: Array<{
    handle: string;
    name: string;
    bio: string;
    url: string;
  }>;
  sentiment: 'positive' | 'neutral' | 'mixed' | 'negative';
  keyThemes: string[];
}
```

### Method

1. **Tweet search**: `twitterSearch(topic, limit)` — Find recent tweets about the topic
2. **User search**: `twitterSearchUsers(topic, limit)` — Find relevant profiles
3. **Deep tweet read**: `twitterReadTweet(url)` (optional) — Read specific high-value tweets
4. **LLM analysis**: Extract sentiment, themes, and key insights from tweet data

### Agent-Reach Bridge Functions

```typescript
export async function twitterSearch(
  query: string,
  limit: number = 10
): Promise<ToolResult<TwitterResult[]>>

export async function twitterSearchUsers(
  query: string,
  limit: number = 10
): Promise<ToolResult<TwitterResult[]>>

export async function twitterReadTweet(
  tweetUrl: string
): Promise<ToolResult<TwitterResult>>
```

### LLM Prompt

```
System: You are a social media intelligence analyst. Given Twitter/X search results, analyze sentiment and extract key themes.

Return a JSON object:
{
  "tweets": [
    {"text": "Tweet text", "author": "@handle", "url": "URL", "date": "YYYY-MM-DD", "engagement": {"likes": N, "retweets": N}}
  ],
  "users": [
    {"handle": "@handle", "name": "Display name", "bio": "Profile bio", "url": "Profile URL"}
  ],
  "sentiment": "positive|neutral|mixed|negative",
  "keyThemes": ["Theme 1", "Theme 2", ...]
}

Rules:
- Sentiment should reflect the overall tone across all tweets
- Key themes should identify recurring topics, not individual tweets
- For engagement, use available data (likes/retweets); default to 0 if not available
- Distinguish official company accounts from personal/executive accounts

User: Tweet results: {tweetResults}
User results: {userResults}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | bird CLI (if authenticated) | Highest (full API data) |
| 2 | Exa `site:twitter.com QUERY` | High (semantic search) |
| 3 | Jina Search | Medium |
| 4 | Skip Twitter | — |

### Error Handling

| Error | Recovery |
|-------|----------|
| bird CLI not installed | Automatic fallback to Exa search |
| Twitter API rate limited | Use Exa for Twitter-indexed content |
| No tweets found for topic | Return empty results, note in output |
| Engagement data unavailable | Default to 0 likes/retweets |

### Example API Call

```typescript
// Search for tweets about a company
const tweets = await twitterSearch('Stripe announcement 2025', 5);
// → [{ text: "Stripe just launched...", author: "@fintech_insider", likes: 342, retweets: 89 }, ...]

// Search for company profiles on Twitter
const users = await twitterSearchUsers('Stripe', 3);
// → [{ text: "Payments infrastructure for the internet", author: "@stripe", url: "..." }, ...]
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Tweet discovery rate | 3+ relevant tweets per search |
| User profile found | 70%+ for companies with Twitter presence |
| Sentiment accuracy | 80%+ correct classification |
| Total execution time | < 8 seconds |

---

## Skill 7: Full Website Content Analysis

### Overview

Sage reads a company's full website — homepage, services, about, pricing, team, and clients pages — to extract structured intelligence about the company's offerings, positioning, and business model.

### Trigger

| Condition | Action |
|-----------|--------|
| Need complete understanding of a company's offerings | Execute multi-page website analysis |
| Evaluating a company's positioning and messaging | Read key pages and analyze |
| Need pricing or product details | Read services/pricing pages |

### Input Schema

```typescript
interface WebsiteAnalysisInput {
  url: string;                 // Company website URL
  pages?: string[];            // Sub-pages to read (default: ["/", "/about", "/services", "/pricing", "/team", "/clients"])
  extractType?: 'full' | 'contact' | 'services' | 'pricing';  // Default: 'full'
}
```

### Output Schema

```typescript
interface WebsiteAnalysisOutput {
  companyName: string;
  description: string;
  services: Array<{ name: string; description: string }>;
  pricing: Array<{ tier: string; price: string; features: string[] }> | null;
  team: Array<{ name: string; title: string }>;
  clients: string[];
  contactInfo: {
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  valueProposition: string;
  targetMarket: string;
}
```

### Method

1. **Homepage read**: `webRead(url)` — Core positioning and overview
2. **Sub-page reads**: `webReadMultiple([url + '/about', url + '/services', ...])` — Detailed content
3. **LLM extraction**: Structured extraction from all page content
4. **Cross-page synthesis**: Merge data from multiple pages into unified company profile

### Agent-Reach Bridge Functions

```typescript
export async function webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
export async function webReadMultiple(urls: string[]): Promise<ToolResult<WebReadResult>[]>
```

### LLM Prompt

```
System: You are a website content analyst. Given the content of a company website (multiple pages), extract structured business intelligence.

Return a JSON object:
{
  "companyName": "Official company name",
  "description": "Brief company description (2-3 sentences)",
  "services": [{"name": "Service Name", "description": "Brief description"}],
  "pricing": [{"tier": "Plan name", "price": "Price string", "features": ["Feature 1", ...]}] or null,
  "team": [{"name": "Full Name", "title": "Job Title"}],
  "clients": ["Client 1", "Client 2"] or [],
  "contactInfo": {"email": "email or null", "phone": "phone or null", "address": "address or null"},
  "valueProposition": "Core value proposition in 1-2 sentences",
  "targetMarket": "Target market/customer profile"
}

Rules:
- Only include information explicitly stated on the website
- If pricing is not published, use null
- Extract client names only if they're explicitly named (logos, case studies)
- Value proposition should be the company's own stated positioning

User: Homepage: {homepageContent}
About page: {aboutContent}
Services page: {servicesContent}
Pricing page: {pricingContent}
Team page: {teamContent}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | Full multi-page read (6 pages) | Highest |
| 2 | Homepage + 2 key pages | High |
| 3 | Homepage only | Medium |
| 4 | Skip website analysis | — |

### Error Handling

| Error | Recovery |
|-------|----------|
| Sub-page returns 404 | Skip that page, continue with others |
| Website is JavaScript-only (Jina gets empty content) | Note limitation, rely on other channels |
| Content too large | Cap per page at 3,000 chars |
| Multiple pages have conflicting info | Use most specific page (e.g., pricing page over homepage mention) |

### Example API Call

```typescript
// Read multiple pages in parallel
const pages = await webReadMultiple([
  'https://acme.com',
  'https://acme.com/about',
  'https://acme.com/services',
  'https://acme.com/pricing',
  'https://acme.com/team',
]);
// → Array of ToolResult<WebReadResult>, one per page
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Pages successfully read | 4+ of 6 attempted |
| Service extraction accuracy | 85%+ |
| Team member identification | 70%+ for listed members |
| Pricing data found | 40%+ (many companies don't publish pricing) |
| Total execution time | < 15 seconds |

---

## Skill 8: Regulatory & Compliance Research

### Overview

Sage researches industry-specific regulations, licensing requirements, and compliance standards by reading government websites and regulatory publications via Jina Reader.

### Trigger

| Condition | Action |
|-----------|--------|
| User asks about regulations in a market | Execute regulatory research |
| Need to understand compliance requirements for prospecting | Search for industry regulations |
| Evaluating market entry barriers | Research regulatory landscape |

### Input Schema

```typescript
interface RegulatoryResearchInput {
  industry: string;
  geography: string;           // e.g., "United States", "EU", "Singapore"
  specificTopic?: string;      // e.g., "data privacy", "financial licensing"
}
```

### Output Schema

```typescript
interface RegulatoryResearchOutput {
  summary: string;
  keyRegulations: Array<{
    name: string;
    description: string;
    governingBody: string;
    impactLevel: 'critical' | 'important' | 'informational';
  }>;
  licensingRequirements: string[];
  complianceStandards: string[];
  recentChanges: string[];
  sources: Array<{ title: string; url: string; type: string }>;
}
```

### Method

1. **Exa search for regulations**: `exaSearch("INDUSTRY regulations compliance GEOGRAPHY 2024 2025")`
2. **Government website reads**: Read top government/regulatory URLs found in search
3. **Reddit compliance discussions**: `redditSearch("INDUSTRY compliance regulations")`
4. **LLM synthesis**: Extract and categorize regulatory requirements

### Agent-Reach Bridge Functions

```typescript
export async function exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
export async function webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
export async function redditSearch(query: string, limit?: number): Promise<ToolResult<RedditPostResult[]>>
```

### LLM Prompt

```
System: You are a regulatory research analyst. Given web search results and government website content, extract regulatory and compliance requirements.

Return a JSON object:
{
  "summary": "Overview of the regulatory landscape (2-3 paragraphs)",
  "keyRegulations": [
    {"name": "Regulation Name", "description": "What it requires", "governingBody": "Agency", "impactLevel": "critical|important|informational"}
  ],
  "licensingRequirements": ["Requirement 1", "Requirement 2"],
  "complianceStandards": ["Standard 1", "Standard 2"],
  "recentChanges": ["Change 1", "Change 2"],
  "sources": [{"title": "Title", "url": "URL", "type": "web|search|reddit"}]
}

Rules:
- Distinguish between mandatory regulations and recommended standards
- Flag regulations with critical impact (can prevent market entry)
- Note recent or upcoming regulatory changes
- Attribute each regulation to its governing body

User: Industry: {industry}
Geography: {geography}
Search results: {exaResults}
Government content: {govContent}
Reddit discussions: {redditResults}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | Exa search + government site deep reads | Highest |
| 2 | Exa search only | Medium |
| 3 | LLM knowledge | Low |

### Error Handling

| Error | Recovery |
|-------|----------|
| Government site blocks Jina Reader | Use search snippet data |
| Regulatory information outdated | Flag with date, note may be superseded |
| Conflicting regulatory information | Present most authoritative source |
| No regulations found for niche industry | Note "Limited public regulatory information available" |

### Performance Targets

| Metric | Target |
|--------|--------|
| Key regulations found | 3+ per research task |
| Governing body identified | 80%+ of regulations |
| Impact level accuracy | 85%+ |
| Total execution time | < 3 minutes |

---

## Skill 9: YouTube Video Research

### Overview

Sage searches YouTube for conference talks, company presentations, product demos, and expert interviews. Video content often contains insights not available in text form.

### Trigger

| Condition | Action |
|-----------|--------|
| Need expert perspectives on a topic | Execute YouTube search |
| Looking for company presentations or demos | Search for company videos |
| Want industry conference insights | Search for conference talks |

### Input Schema

```typescript
interface YouTubeResearchInput {
  query: string;
  limit?: number;              // Max results (default: 3)
  needSubtitles?: boolean;     // Whether to extract subtitles (default: false)
}
```

### Output Schema

```typescript
interface YouTubeResearchOutput {
  videos: Array<{
    id: string;
    title: string;
    description: string;
    channel: string;
    duration: string | null;
    url: string;
    subtitles?: string;        // Full transcript if requested
  }>;
  keyInsights: string[];
}
```

### Method

1. **Video search**: `youtubeSearch(query, limit)` — Find relevant videos
2. **Video info**: `youtubeGetInfo(url)` — Get metadata for specific videos
3. **Subtitle extraction**: `youtubeGetSubtitles(url)` (optional) — Get video transcripts
4. **LLM analysis**: Extract key insights from video descriptions and subtitles

### Agent-Reach Bridge Functions

```typescript
export async function youtubeSearch(
  query: string,
  limit: number = 5
): Promise<ToolResult<YouTubeResult[]>>

export async function youtubeGetInfo(
  url: string
): Promise<ToolResult<YouTubeResult>>

export async function youtubeGetSubtitles(
  url: string,
  lang?: string
): Promise<ToolResult<string>>
```

**Returns**:
```typescript
interface YouTubeResult {
  id: string;
  title: string;
  description: string;
  channel: string;
  duration?: string;
  subtitles?: string;
}
```

### LLM Prompt

```
System: You are a video content analyst. Given YouTube video search results and optional subtitles, extract key insights.

Return a JSON object:
{
  "videos": [
    {"id": "Video ID", "title": "Title", "description": "Description (max 200 chars)", "channel": "Channel name", "duration": "Duration string", "url": "URL"}
  ],
  "keyInsights": ["Insight 1 from video content", "Insight 2", ...]
}

Rules:
- Extract insights from both video descriptions and subtitles (if available)
- Focus on actionable intelligence, not just video summaries
- Note the source video for each insight
- If subtitles are available, they provide the richest analysis

User: Video search results: {videoResults}
Subtitles (if available): {subtitles}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | yt-dlp search + subtitles | Highest (full transcripts) |
| 2 | yt-dlp search + descriptions only | High |
| 3 | Jina Reader for YouTube pages | Medium |
| 4 | Skip YouTube | — |

### Error Handling

| Error | Recovery |
|-------|----------|
| yt-dlp not installed | Fall back to Jina Reader for YouTube |
| No subtitles available | Use video description only |
| Video age-restricted | Skip that video, proceed with others |
| Search returns no results | Return empty results, note in output |

### Example API Call

```typescript
// Search for conference videos
const videos = await youtubeSearch('Stripe Sessions 2024 conference', 3);
// → [{ id: "abc123", title: "Stripe Sessions 2024: Keynote", channel: "Stripe", duration: "45:23" }, ...]

// Get subtitles for detailed analysis
const subtitles = await youtubeGetSubtitles('https://youtube.com/watch?v=abc123');
// → Full transcript text (VTT cleaned)
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Relevant videos found | 2+ per search |
| Subtitle extraction success | 60%+ of videos with English subs |
| Key insights extracted | 3+ per video set |
| Total execution time | < 15 seconds (without subtitles), < 45 seconds (with subtitles) |

---

## Skill 10: Research Synthesis & Briefing

### Overview

The synthesis skill is Sage's **capstone capability** — it takes all raw research data from multiple channels and produces a structured intelligence brief with executive summary, key findings, market insights, and source attribution.

### Trigger

| Condition | Action |
|-----------|--------|
| All channel data collected | Execute LLM synthesis |
| Research pipeline reaching Stage 5 | Synthesize all findings |
| User requests a summary/brief | Generate intelligence brief |

### Input Schema

```typescript
interface SynthesisInput {
  topic: string;
  researchData: {
    searchResults: {
      exa: SearchResult[];
      reddit: RedditPostResult[];
      youtube: YouTubeResult[];
      twitter: TwitterResult[];
      linkedInCompanies: LinkedInProfileResult[];
      twitterUsers: TwitterResult[];
    };
    deepReads: Array<{
      title: string;
      url: string;
      content: string;
    }>;
  };
}
```

### Output Schema

```typescript
interface IntelligenceBrief {
  summary: string;              // Executive summary (2-3 paragraphs)
  keyFindings: string[];        // 5-10 key findings with evidence
  marketInsights: string[];     // 3-5 market insights
  companies: Array<{           // Companies identified
    name: string;
    details: string;
  }>;
  trends: string[];             // 3-5 observed trends
  recommendations: string[];    // 3-5 actionable recommendations
  sources: Array<{             // Full source attribution
    title: string;
    url: string;
    type: 'search' | 'reddit' | 'youtube' | 'twitter' | 'web';
  }>;
}
```

### Method

1. **Compile research data**: Aggregate all channel results + deep reads
2. **Token management**: Cap total data at 15,000 characters for LLM context window
3. **LLM synthesis**: `callLLMForJSON(synthesisPrompt, researchData)`
4. **Validation**: Ensure brief has all required sections
5. **Source attribution**: Verify every finding has at least one source

### Agent-Reach Bridge (Indirect)

Synthesis uses `callLLMForJSON()` from `agent-executor.ts`. The bridge functions provide the **input data**.

### LLM Prompt

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
- Support every key finding with at least one source
- Distinguish facts (from sources) from inferences (from analysis)
- Flag information that may be outdated (older than 2 years)
- Provide 5-10 key findings, 3-5 market insights, 3-5 trends
- Include at least 3 source types for source diversity
- Recommendations should be actionable and specific

User: Research data:
{researchData}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | Full multi-source synthesis | Highest |
| 2 | Partial synthesis (reduced data) | High |
| 3 | LLM knowledge-based brief | Low (marked as estimated) |
| 4 | Minimal brief (summary only) | Minimal |

### Error Handling

| Error | Recovery |
|-------|----------|
| LLM returns invalid JSON | `callLLMForJSON()` retries with stricter prompt |
| Research data exceeds 15,000 chars | Truncate deep reads to fit |
| No data from any channel | Generate LLM-knowledge brief, mark as estimated |
| Missing required sections | LLM retries with explicit section requirements |
| Source URLs invalid | Include anyway with type attribution, user can verify |

### Performance Targets

| Metric | Target |
|--------|--------|
| Key findings count | 5-10 per brief |
| Market insights count | 3-5 per brief |
| Source diversity | 3+ channel types |
| Companies identified | 3+ per brief |
| Synthesis accuracy | 90%+ factually supported |
| LLM call time | < 8 seconds |
| Total synthesis time | < 30 seconds |

---

## Skill 11: Execution Engine Integration

### Overview

This skill documents how Sage integrates with the Agent Execution Engine — the runtime that dispatches tasks, calls Agent-Reach bridge functions, and stores results.

### Runtime Handler

```typescript
// src/lib/agent-executor.ts

async function executeWebResearch(
  ctx: AgentExecutionContext
): Promise<AgentExecutionResult>
```

### Execution Context

```typescript
interface AgentExecutionContext {
  taskId: string;
  agentName: 'web-research';
  taskType: 'research';
  campaignId: string | null;
  input: Record<string, unknown>;
  priority: number;
}
```

### Execution Result

```typescript
interface AgentExecutionResult {
  success: boolean;
  output: {
    researchComplete: boolean;
    analysis: IntelligenceBrief;
  };
  channelActivity: ChannelActivityRecord[];
  error?: string;
}
```

### Channel Activity Record

```typescript
interface ChannelActivityRecord {
  channel: string;       // 'exa_search', 'reddit', 'youtube', 'twitter', 'linkedin', 'web'
  operation: string;     // 'research_search', 'video_search', 'social_search', etc.
  success: boolean;
  timestamp: string;
  resultCount?: number;
  error?: string;
}
```

### Agent-Reach Bridge Functions Used

| Bridge Function | Channel | Purpose |
|----------------|---------|---------|
| `exaSearch(query, numResults)` | exa_search | Primary web search for reports, articles, directories |
| `redditSearch(query, limit)` | reddit | Community discussions and sentiment analysis |
| `youtubeSearch(query, limit)` | youtube | Conference talks, company presentations |
| `twitterSearch(query, limit)` | twitter | Real-time news, company updates |
| `linkedInSearchCompanies(query, limit)` | linkedin | Company profile data |
| `twitterSearchUsers(query, limit)` | twitter | Social profile discovery |
| `webRead(url)` | web | Deep content extraction from top results |
| `webReadMultiple(urls)` | web | Parallel multi-page reading |

### API Dispatch

```typescript
// Direct task dispatch
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "web-research",
  "taskType": "research",
  "input": {
    "query": "AI in healthcare market landscape",
    "topic": "AI healthcare",
    "industry": "Healthcare Technology"
  }
}

// Via AI Chat (Orchestrator routes to Sage)
POST /api/ai
{
  "message": "Research the AI healthcare market for me"
}
// → AI parses intent → Dispatches to web-research → Agent-Reach multi-source research → Intelligence brief stored
```

### Pipeline Flow

```
1. Task dispatched to web-research agent
2. executeWebResearch() called with AgentExecutionContext
3. Extract topic from input: ctx.input.query || ctx.input.description || ctx.input.topic
4. [Progress 10%] Multi-channel parallel search (6 channels via Promise.allSettled):
   - exaSearch(topic, 10)                    [exa_search channel]
   - redditSearch(topic, 5)                  [reddit channel]
   - youtubeSearch(topic, 3)                 [youtube channel]
   - twitterSearch(topic, 5)                 [twitter channel]
   - linkedInSearchCompanies(topic, 5)       [linkedin channel]
   - twitterSearchUsers(topic, 5)            [twitter channel]
5. [Progress 50%] Deep read top 3 Exa URLs:
   - webRead(url1)                           [web channel]
   - webRead(url2)                           [web channel]
   - webRead(url3)                           [web channel]
6. [Progress 70%] Compile research data:
   - Aggregate successful search results
   - Aggregate deep-read content
   - Cap total data at 15,000 characters
7. LLM synthesis via callLLMForJSON():
   - System prompt: research analyst
   - User message: compiled research data
   - Output: structured IntelligenceBrief
8. [Progress 100%] Return AgentExecutionResult:
   - success: true
   - output: { researchComplete: true, analysis: IntelligenceBrief }
   - channelActivity: array of ChannelActivityRecord
```

### Database Operations

Sage does **not** directly create or update Lead records. Its output is stored in the `AgentTask.output` field as a JSON string. Downstream agents (Lead Qualification, Outreach Composer) consume this intelligence.

```typescript
// Task progress is updated throughout execution
await updateTaskProgress(taskId, 10, 'running');   // Search started
await updateTaskProgress(taskId, 50, 'running');   // Deep reading
await updateTaskProgress(taskId, 70, 'running');   // Compiling data
await updateTaskProgress(taskId, 100, 'completed', {
  researchComplete: true,
  channelsUsed: ['exa_search', 'reddit', 'youtube', 'twitter', 'linkedin', 'web'],
  sourceCount: 23,
  analysis: intelligenceBrief,
});
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Total task execution time | < 3 minutes (standard research) |
| Channel call parallelism | 6 simultaneous searches |
| Deep read parallelism | 3 simultaneous webRead calls |
| LLM calls per task | 1 (synthesis) + 0-1 (retries) |
| Channel success rate | 4+ of 6 channels returning data |
| Progress update granularity | 4 checkpoints (10%, 50%, 70%, 100%) |
| Research data size | 10,000-15,000 chars for LLM synthesis |
