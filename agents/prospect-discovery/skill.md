# Prospect Discovery Agent — Skills Reference

> *Scout doesn't just search. Scout launches a 6-channel simultaneous sweep, collects every signal, and turns noise into structured intelligence.*

---

## Table of Contents

1. [Multi-Channel Parallel Search](#1-multi-channel-parallel-search)
2. [LinkedIn People Discovery](#2-linkedin-people-discovery)
3. [LinkedIn Company Discovery](#3-linkedin-company-discovery)
4. [Twitter/X Social Prospecting](#4-twitterx-social-prospecting)
5. [Business Directory Extraction](#5-business-directory-extraction)
6. [GitHub Tech Company Discovery](#6-github-tech-company-discovery)
7. [Reddit Community Intelligence](#7-reddit-community-intelligence)
8. [Result Deduplication & Merging](#8-result-deduplication--merging)
9. [Search Strategy Optimization](#9-search-strategy-optimization)
10. [LLM-Based Company Extraction](#10-llm-based-company-extraction)
11. [Execution Engine Integration](#11-execution-engine-integration)

---

## 1. Multi-Channel Parallel Search

### Trigger
Campaign requires prospect discovery — triggered when Atlas dispatches a task with `agentName: "prospect-discovery"` and `taskType: "search"`.

### Input Schema

```typescript
interface ProspectDiscoveryInput {
  query?: string;        // Free-text search query (e.g., "accounting firms")
  description?: string;  // Alternative query field (used if query is empty)
  industry?: string;     // Target industry (e.g., "Accounting", "Fintech")
  location?: string;     // Target location (e.g., "Dubai, UAE", "Singapore")
  campaignId?: string;   // Campaign to associate leads with
}
```

### Output Schema

```typescript
interface ProspectDiscoveryOutput {
  found: number;              // Number of companies extracted by LLM
  leadsCreated: number;       // Number of Lead records successfully created in DB
  channels: string[];         // List of channels that returned successful results
}

interface ChannelActivityRecord {
  channel: string;           // Channel name (e.g., "exa_search", "linkedin")
  operation: string;         // Operation performed (e.g., "web_search", "search_people")
  success: boolean;          // Whether the channel operation succeeded
  timestamp: string;         // ISO timestamp of the operation
  resultCount?: number;      // Number of results returned
  error?: string;            // Error message if operation failed
}
```

### Method

1. **Construct composite search query** — Combine query, industry, and location into a single search string:
   ```typescript
   const searchQuery = [query, industry, location].filter(Boolean).join(' ');
   // Example: "accounting firms Accounting Dubai" 
   ```

2. **Fire 6 parallel channel searches** — Use `Promise.allSettled` to search all channels simultaneously:
   ```typescript
   const [exaRes, redditRes, linkedInPeopleRes, linkedInCompanyRes, twitterRes, twitterUsersRes] = 
     await Promise.allSettled([
       AgentReachToolkit.exaSearch(searchQuery, 15),
       AgentReachToolkit.redditSearch(searchQuery, 5),
       industry 
         ? AgentReachToolkit.linkedInSearchPeople(`${industry} ${location}`, 10) 
         : Promise.resolve({ success: false, data: [], channel: 'linkedin', source: 'skipped', timestamp: '' }),
       AgentReachToolkit.linkedInSearchCompanies(`${industry} ${location} company`, 10),
       AgentReachToolkit.twitterSearch(searchQuery, 5),
       AgentReachToolkit.twitterSearchUsers(`${industry} ${query}`, 5),
     ]);
   ```

3. **Record channel activity** — For each result (fulfilled or rejected), create a `ChannelActivityRecord`:
   ```typescript
   const recordActivity = (result: PromiseSettledResult<ToolResult<unknown>>, channel: string, operation: string) => {
     if (result.status === 'fulfilled') {
       channelActivity.push({
         channel, operation,
         success: result.value.success,
         timestamp: result.value.timestamp,
         resultCount: Array.isArray(result.value.data) ? result.value.data.length : (result.value.success ? 1 : 0),
         error: result.value.error,
       });
     } else {
       channelActivity.push({ channel, operation, success: false, timestamp: new Date().toISOString(), error: result.reason?.message });
     }
   };
   ```

4. **Collect raw results** — Merge results from all successful channels into a single `SearchResult[]` array (see individual skill sections for normalization details).

5. **LLM extraction** — Pass raw results to the LLM for structured company extraction (see Skill 10).

6. **Persist leads** — Create Lead records in the database (see Skill 11).

### Agent-Reach Bridge Function Signatures

```typescript
AgentReachToolkit.exaSearch(query: string, numResults: number): Promise<ToolResult<SearchResult[]>>
AgentReachToolkit.redditSearch(query: string, limit: number): Promise<ToolResult<RedditPostResult[]>>
AgentReachToolkit.linkedInSearchPeople(query: string, limit: number): Promise<ToolResult<LinkedInProfileResult[]>>
AgentReachToolkit.linkedInSearchCompanies(query: string, limit: number): Promise<ToolResult<LinkedInProfileResult[]>>
AgentReachToolkit.twitterSearch(query: string, limit: number): Promise<ToolResult<TwitterResult[]>>
AgentReachToolkit.twitterSearchUsers(query: string, limit: number): Promise<ToolResult<TwitterResult[]>>
```

### LLM Prompts Used

None directly in the parallel search step — LLM is used in the extraction step (Skill 10).

### Fallback Chain

```
Primary: All 6 channels searched in parallel
  ↓ If all channels fail or return 0 results
Fallback: LLM knowledge generation (see Skill 10)
```

### Error Handling

- Each channel is independent — a failure in one channel does not affect others
- `Promise.allSettled` ensures all promises resolve (fulfilled or rejected)
- Rejected promises are recorded in `ChannelActivityRecord` with error details
- If ALL channels fail, the LLM knowledge fallback is triggered automatically

### Example API Call

```typescript
// Inside executeProspectDiscovery()
const ctx: AgentExecutionContext = {
  taskId: "clx123",
  agentName: "prospect-discovery",
  taskType: "search",
  campaignId: "clx456",
  input: { query: "accounting firms", industry: "Accounting", location: "Dubai, UAE" },
  priority: 10,
};

const result = await executeProspectDiscovery(ctx);
// result = {
//   success: true,
//   output: { found: 18, leadsCreated: 18, channels: ["exa_search", "reddit", "linkedin", "twitter"] },
//   channelActivity: [
//     { channel: "exa_search", operation: "web_search", success: true, resultCount: 15, timestamp: "..." },
//     { channel: "reddit", operation: "search", success: true, resultCount: 3, timestamp: "..." },
//     { channel: "linkedin", operation: "search_people", success: true, resultCount: 8, timestamp: "..." },
//     { channel: "linkedin", operation: "search_companies", success: true, resultCount: 7, timestamp: "..." },
//     { channel: "twitter", operation: "search_tweets", success: true, resultCount: 4, timestamp: "..." },
//     { channel: "twitter", operation: "search_users", success: true, resultCount: 3, timestamp: "..." },
//   ]
// }
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Total parallel search latency | < 25 seconds (limited by slowest channel) |
| Channel success rate | ≥ 80% (5/6 channels succeeding) |
| Raw results collected | ≥ 20 per campaign |

---

## 2. LinkedIn People Discovery

### Trigger
Part of the multi-channel parallel search — always executed when `industry` parameter is provided; skipped when no industry is specified.

### Input Schema

```typescript
interface LinkedInPeopleInput {
  query: string;    // Format: "{industry} {location}" (e.g., "Accounting Dubai")
  limit: number;    // Maximum results to return (default: 10)
}
```

### Output Schema

```typescript
// Normalized to SearchResult for LLM extraction:
interface NormalizedLinkedInPeopleResult {
  title: string;    // Person's name
  url: string;      // LinkedIn profile URL
  snippet: string;  // Headline (e.g., "Senior Partner at PwC Middle East")
}
```

### Method

Scout calls `AgentReachToolkit.linkedInSearchPeople()` which executes a **3-method fallback pipeline**:

**Method 1: mcporter LinkedIn Scraper (highest quality)**
```bash
mcporter call 'linkedin.search_people(keyword: "Accounting Dubai", limit: 10)'
```
Returns structured JSON with `firstName`, `lastName`, `headline`, `location`, `linkedinUrl`.

**Method 2: Exa Semantic Search (fallback)**
```typescript
const exaResult = await exaSearch(`site:linkedin.com/in ${query}`, limit);
```
Returns `SearchResult[]` with LinkedIn profile URLs in the results.

**Method 3: Jina Search (final fallback)**
```typescript
const searchUrl = `https://s.jina.ai/${encodeURIComponent(`site:linkedin.com/in ${query}`)}`;
const response = await fetch(searchUrl, { headers: { 'Accept': 'text/plain' } });
```
Parses the response text for LinkedIn URLs and nearby name text.

**Result normalization** (in `executeProspectDiscovery()`):
```typescript
if (linkedInPeopleRes.status === 'fulfilled' && linkedInPeopleRes.value.success) {
  rawResults.push(...linkedInPeopleRes.value.data.map(r => ({
    title: r.name,        // Person's name
    url: r.url,           // LinkedIn profile URL
    snippet: r.headline,  // "Senior Partner at PwC Middle East"
  })));
}
```

### Agent-Reach Bridge Function Signature

```typescript
// In agent-reach-bridge.ts
async function linkedInSearchPeople(query: string, limit: number = 10): Promise<ToolResult<LinkedInProfileResult[]>>
```

### LLM Prompts Used

None directly — LinkedIn People results are normalized and passed to the company extraction LLM (Skill 10).

### Fallback Chain

```
Method 1: mcporter LinkedIn Scraper → If unavailable/fails
Method 2: Exa Semantic Search (site:linkedin.com/in) → If no results
Method 3: Jina Search (site:linkedin.com/in) → If no results
Final: Return error ToolResult
```

### Error Handling

- Method 1 failure is caught silently; falls through to Method 2
- Method 2 returns empty array if no LinkedIn profiles found; falls through to Method 3
- Method 3 parses text for URLs; returns empty array if no LinkedIn URLs found
- Final fallback: Return `makeError<LinkedInProfileResult[]>()`
- In the parallel search, a rejected promise is recorded in `ChannelActivityRecord` and skipped

### Example API Call

```typescript
const result = await AgentReachToolkit.linkedInSearchPeople("Accounting Dubai", 10);
// If mcporter is available:
// { success: true, data: [{ name: "Ahmed Al-Rashid", headline: "Partner at PwC", location: "Dubai", url: "https://linkedin.com/in/ahmed" }], channel: "linkedin", source: "LinkedIn via mcporter" }
// If mcporter fails, Exa fallback:
// { success: true, data: [{ name: "Sarah Johnson", headline: "CFO at Deloitte Middle East | Audit | Dubai", location: "", url: "https://linkedin.com/in/sarah-j" }], channel: "linkedin", source: "Exa Semantic Search (LinkedIn)" }
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Search latency | < 20 seconds |
| Results per search | ≥ 5 profiles |
| Fallback success rate | ≥ 95% (at least one method succeeds) |

---

## 3. LinkedIn Company Discovery

### Trigger
Part of the multi-channel parallel search — always executed regardless of whether `industry` is provided.

### Input Schema

```typescript
interface LinkedInCompanyInput {
  query: string;    // Format: "{industry} {location} company" (e.g., "Accounting Dubai company")
  limit: number;    // Maximum results to return (default: 10)
}
```

### Output Schema

```typescript
// Normalized to SearchResult for LLM extraction:
interface NormalizedLinkedInCompanyResult {
  title: string;    // Company name
  url: string;      // LinkedIn company page URL
  snippet: string;  // Headline (e.g., "Professional Services | 10,001+ employees")
}
```

### Method

Scout calls `AgentReachToolkit.linkedInSearchCompanies()` which executes a **2-method fallback pipeline**:

**Method 1: Exa Semantic Search**
```typescript
const exaResult = await exaSearch(`site:linkedin.com/company ${query}`, limit);
```
Returns `SearchResult[]` with LinkedIn company page URLs.

**Method 2: Jina Search (fallback)**
```typescript
const searchUrl = `https://s.jina.ai/${encodeURIComponent(`site:linkedin.com/company ${query}`)}`;
const response = await fetch(searchUrl, { headers: { 'Accept': 'text/plain' } });
```
Parses response for LinkedIn company URLs using regex:
```typescript
const urlPattern = /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+/g;
const companyUrls = [...new Set(text.match(urlPattern) || [])];
```

**Result normalization** (in `executeProspectDiscovery()`):
```typescript
if (linkedInCompanyRes.status === 'fulfilled' && linkedInCompanyRes.value.success) {
  rawResults.push(...linkedInCompanyRes.value.data.map(r => ({
    title: r.name,        // Company name
    url: r.url,           // LinkedIn company page URL
    snippet: r.headline,  // "Professional Services | 10,001+ employees"
  })));
}
```

### Agent-Reach Bridge Function Signature

```typescript
// In agent-reach-bridge.ts
async function linkedInSearchCompanies(query: string, limit: number = 10): Promise<ToolResult<LinkedInProfileResult[]>>
```

### LLM Prompts Used

None directly — LinkedIn Company results are normalized and passed to the company extraction LLM (Skill 10).

### Fallback Chain

```
Method 1: Exa Semantic Search (site:linkedin.com/company) → If no results
Method 2: Jina Search (site:linkedin.com/company) → If no results
Final: Return error ToolResult
```

### Error Handling

- Method 1 failure falls through to Method 2
- Method 2 parses URLs from text; returns empty array if none found
- Final fallback: Return `makeError<LinkedInProfileResult[]>()`

### Example API Call

```typescript
const result = await AgentReachToolkit.linkedInSearchCompanies("Accounting Dubai company", 10);
// { success: true, data: [
//   { name: "Ernst & Young", headline: "Professional Services | 10,001+ employees | Consulting", location: "", url: "https://linkedin.com/company/ernst-young" },
//   { name: "KPMG Lower Gulf", headline: "Audit, Tax and Advisory | 1,001-5,000 employees", location: "", url: "https://linkedin.com/company/kpmg-lower-gulf" },
// ], channel: "linkedin", source: "Exa Semantic Search (LinkedIn Companies)" }
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Search latency | < 15 seconds |
| Results per search | ≥ 5 companies |
| Fallback success rate | ≥ 90% |

---

## 4. Twitter/X Social Prospecting

### Trigger
Part of the multi-channel parallel search — always executed. Two separate searches are fired: `twitterSearch` for tweets and `twitterSearchUsers` for user profiles.

### Input Schema

```typescript
interface TwitterSearchInput {
  query: string;    // Composite search query (e.g., "accounting firms Accounting Dubai")
  limit: number;    // Maximum results (default: 5)
}

interface TwitterUsersInput {
  query: string;    // Format: "{industry} {query}" (e.g., "Accounting accounting firms")
  limit: number;    // Maximum results (default: 5)
}
```

### Output Schema

```typescript
// Normalized to SearchResult for LLM extraction:
interface NormalizedTwitterResult {
  title: string;    // Tweet text (first 100 chars) or author name
  url: string;      // Tweet URL or profile URL
  snippet: string;  // Tweet text (first 300 chars)
}
```

### Method

**Twitter Search (`twitterSearch`):**

3-method fallback pipeline:

**Method 1: bird CLI**
```bash
bird search "accounting firms Dubai" -n 5
```
Returns JSON array of tweets or text output with URLs.

**Method 2: Exa Semantic Search**
```typescript
const exaResult = await exaSearch(`site:twitter.com OR site:x.com ${query}`, limit);
```
Extracts author from URL: `twitter.com/{username}/status/...`

**Method 3: Jina Search**
```typescript
const searchUrl = `https://s.jina.ai/${encodeURIComponent(`site:twitter.com OR site:x.com ${query}`)}`;
```
Parses response for tweet URLs using regex:
```typescript
const urlPattern = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/g;
```

**Twitter Users (`twitterSearchUsers`):**

2-method fallback pipeline:

**Method 1: Exa Semantic Search**
```typescript
const exaResult = await exaSearch(`site:twitter.com ${query} -inurl:status`, limit);
```
Excludes tweet URLs to focus on profile pages.

**Method 2: Jina Search**
```typescript
const searchUrl = `https://s.jina.ai/${encodeURIComponent(`site:twitter.com ${query} profile`)}`;
```

**Result normalization** (in `executeProspectDiscovery()`):
```typescript
// Tweet results
if (twitterRes.status === 'fulfilled' && twitterRes.value.success) {
  rawResults.push(...twitterRes.value.data.map(r => ({
    title: r.text?.slice(0, 100) || '',
    url: r.url,
    snippet: r.text?.slice(0, 300) || '',
  })));
}

// User results
if (twitterUsersRes.status === 'fulfilled' && twitterUsersRes.value.success) {
  rawResults.push(...twitterUsersRes.value.data.map(r => ({
    title: r.author || r.text?.slice(0, 100) || '',
    url: r.url,
    snippet: r.text?.slice(0, 300) || '',
  })));
}
```

### Agent-Reach Bridge Function Signatures

```typescript
// In agent-reach-bridge.ts
async function twitterSearch(query: string, limit: number = 10): Promise<ToolResult<TwitterResult[]>>
async function twitterSearchUsers(query: string, limit: number = 10): Promise<ToolResult<TwitterResult[]>>
```

### LLM Prompts Used

None directly — Twitter results are normalized and passed to the company extraction LLM (Skill 10).

### Fallback Chain

**For `twitterSearch`:**
```
Method 1: bird CLI → If unavailable/fails
Method 2: Exa Semantic Search (site:twitter.com OR site:x.com) → If no results
Method 3: Jina Search → If no results
Final: Return error ToolResult
```

**For `twitterSearchUsers`:**
```
Method 1: Exa Semantic Search (site:twitter.com -inurl:status) → If no results
Method 2: Jina Search → If no results
Final: Return error ToolResult
```

### Error Handling

- Each method failure is caught silently; falls through to the next method
- bird CLI errors (not installed, not authenticated) are expected — gracefully falls through
- Empty Exa results fall through to Jina Search
- All failures recorded in `ChannelActivityRecord`

### Example API Call

```typescript
// Tweet search
const tweets = await AgentReachToolkit.twitterSearch("accounting firm Dubai", 5);
// { success: true, data: [
//   { text: "Excited to announce our new Dubai office! Our accounting team is growing...", author: "@bigfourfirm", url: "https://twitter.com/bigfourfirm/status/123", likes: 42, retweets: 5, date: "2024-11-15" }
// ], channel: "twitter", source: "Exa Semantic Search (Twitter/X)" }

// User search
const users = await AgentReachToolkit.twitterSearchUsers("Accounting Dubai", 5);
// { success: true, data: [
//   { text: "Leading accounting and advisory firm in the UAE", author: "@accounting_dubai", url: "https://twitter.com/accounting_dubai", likes: 0, retweets: 0, date: "" }
// ], channel: "twitter", source: "Exa Semantic Search (Twitter/X Profiles)" }
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Tweet search latency | < 20 seconds |
| User search latency | < 15 seconds |
| Combined results | ≥ 5 relevant items |
| Fallback success rate | ≥ 85% |

---

## 5. Business Directory Extraction

### Trigger
Not part of Scout's default parallel search. Used when the LLM extraction step identifies directory URLs in search results, or when explicitly requested by Atlas for directory-specific campaigns.

### Input Schema

```typescript
interface DirectoryExtractionInput {
  url: string;           // Directory page URL (e.g., "https://www.yelp.com/search?find_desc=accounting&find_loc=Dubai")
  extractionPrompt?: string;  // Custom extraction instructions
}
```

### Output Schema

```typescript
interface ExtractedCompany {
  companyName: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  phoneMain: string | null;
  generalEmail: string | null;
  hqAddress: string | null;
  description: string | null;
  sources: string[];
}
```

### Method

1. **Read directory page** — Use `webRead()` to fetch the page content via Jina Reader:
   ```typescript
   const webResult = await webRead(directoryUrl);
   ```

2. **LLM extraction** — Pass the page content to the LLM with a directory-specific extraction prompt:
   ```
   You are a business directory data extraction specialist. Given the content of a business
   directory page, extract all company listings as structured data.
   
   For each company found, extract:
   - Company name
   - Website URL (if linked)
   - Phone number
   - Email address
   - Physical address
   - Description/review summary
   
   Return as JSON array. Skip advertisements and non-business entries.
   ```

3. **Normalize** — Map extracted data to the `ExtractedCompany` schema.

### Agent-Reach Bridge Function Signature

```typescript
// Uses the generic webRead function
async function webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
```

### LLM Prompts Used

```
You are a business directory data extraction specialist. Given the content of a business
directory page, extract all company listings as structured data.

Return a JSON array of company objects:
[
  {
    "companyName": "Company Name",
    "website": "https://example.com",
    "phoneMain": "Phone if found",
    "generalEmail": "Email if found",
    "hqAddress": "Address if found",
    "description": "Brief description from listing",
    "sources": ["DIRECTORY_URL"]
  }
]

IMPORTANT:
- Extract EVERY company listing on the page
- Skip advertisements and sponsored listings
- If a field is not present, use null
- Phone numbers should include country code if available
```

### Fallback Chain

```
Primary: Jina Reader (webRead) → If page is not readable
Fallback: Exa Search for the same directory URL → If no results
Final: Skip this directory, continue with other channels
```

### Error Handling

- Jina Reader may fail on pages that block content extraction
- Rate limiting on Jina Reader is 60 req/min
- Content is capped at 50,000 characters — sufficient for most directory pages
- If the LLM can't extract any companies from the page, return empty array

### Example API Call

```typescript
// Read a Yellow Pages directory
const page = await webRead("https://www.yellowpages.com/dubai/accountants");
// Pass content to LLM for extraction
const companies = await callLLMForJSON<ExtractedCompany[]>(
  directoryExtractionPrompt,
  page.data.content.slice(0, 15000),
  []
);
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Page read latency | < 10 seconds |
| LLM extraction latency | < 15 seconds |
| Companies extracted per page | ≥ 5 |
| Extraction accuracy | ≥ 85% |

---

## 6. GitHub Tech Company Discovery

### Trigger
Not part of Scout's default 6-channel parallel search. Added by Atlas when the campaign targets a tech-related industry. Can also be used standalone for developer-tool vendor discovery.

### Input Schema

```typescript
interface GitHubDiscoveryInput {
  query: string;    // Search query (e.g., "fintech singapore", "accounting software")
  limit: number;    // Maximum results (default: 10)
}
```

### Output Schema

```typescript
interface GitHubRepoResult {
  name: string;          // Repository name
  fullName: string;      // owner/repo
  description: string;   // Repository description
  url: string;           // GitHub URL
  stars: number;         // Star count
  language: string;      // Primary language
}
```

### Method

1. **Search GitHub repos** — Use `githubSearchRepos()` which runs the `gh` CLI:
   ```bash
   gh search repos "fintech singapore" --sort stars --limit 10 --json fullName,description,url,stargazersCount,language
   ```

2. **Parse results** — The CLI returns JSON that's parsed into `GitHubRepoResult[]`:
   ```typescript
   const parsed = safeJsonParse<Record<string, unknown>[]>(stdout);
   const results: GitHubRepoResult[] = parsed.map(item => ({
     name: item.fullName.split('/').pop(),
     fullName: item.fullName,
     description: item.description || '',
     url: item.url || '',
     stars: item.stargazersCount || 0,
     language: item.language || '',
   }));
   ```

3. **Infer companies from repos** — Pass repo data to the LLM for company inference:
   ```
   Given GitHub repository search results, identify the companies behind these projects.
   For each repo, determine:
   - The company or organization that maintains it
   - The company's website (often in the description or repo URL)
   - The industry (based on the repo description)
   ```

### Agent-Reach Bridge Function Signature

```typescript
// In agent-reach-bridge.ts
async function githubSearchRepos(query: string, limit: number = 10): Promise<ToolResult<GitHubRepoResult[]>>
```

### LLM Prompts Used

```
You are a tech company identification specialist. Given GitHub repository search results,
identify the real companies or organizations behind these projects.

For each repository, extract:
- The company/organization name
- Their website (if mentioned in description or inferable from repo URL)
- Their industry (based on the product/service described)
- A brief description of what the company does

Return a JSON array of company objects:
[
  {
    "companyName": "Company Name",
    "website": "https://example.com",
    "industry": "Industry",
    "description": "What the company does",
    "sources": ["GitHub repo URL"]
  }
]

Only include repositories that represent real companies or products, not personal projects or tutorials.
```

### Fallback Chain

```
Primary: gh CLI (githubSearchRepos) → If gh is not installed/authenticated
Fallback: Exa Search (site:github.com {query}) → If no results
Final: Skip GitHub, continue with other channels
```

### Error Handling

- `gh` CLI may not be installed or authenticated — returns `makeError`
- Rate limit: 60 requests/hour for unauthenticated, 5000/hour for authenticated
- Repository results may include personal projects, tutorials, and archived repos — LLM filters these

### Example API Call

```typescript
const result = await githubSearchRepos("fintech singapore", 10);
// { success: true, data: [
//   { name: "payment-gateway", fullName: "fintech-sg/payment-gateway", description: "Open-source payment processing for SE Asia", url: "https://github.com/fintech-sg/payment-gateway", stars: 342, language: "TypeScript" },
// ], channel: "github", source: "gh CLI" }
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Search latency | < 10 seconds |
| Results per search | ≥ 5 repos |
| Company inference accuracy | ≥ 80% |

---

## 7. Reddit Community Intelligence

### Trigger
Part of the multi-channel parallel search — always executed.

### Input Schema

```typescript
interface RedditSearchInput {
  query: string;    // Composite search query (e.g., "accounting firms Accounting Dubai")
  limit: number;    // Maximum results (default: 5)
}
```

### Output Schema

```typescript
// Normalized to SearchResult for LLM extraction:
interface NormalizedRedditResult {
  title: string;    // Post title
  url: string;      // Post URL
  snippet: string;  // Post selftext or "r/{subreddit}"
}
```

### Method

**Primary: Reddit Public JSON API**
```typescript
const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=relevance`;
const response = await fetch(url, {
  headers: { 'User-Agent': 'agent-reach/1.0' },
  signal: AbortSignal.timeout(15000),
});
```

**Parsing Reddit API response:**
```typescript
const data = await response.json();
const children = data.data.children || [];
const results: RedditPostResult[] = children
  .filter(child => child.kind === 't3')  // Only link posts
  .map(child => ({
    title: child.data.title || '',
    url: child.data.url || `https://reddit.com${child.data.permalink || ''}`,
    author: child.data.author || '',
    score: child.data.score || 0,
    numComments: child.data.num_comments || 0,
    subreddit: child.data.subreddit || '',
    selftext: child.data.selftext?.slice(0, 500) || '',
  }));
```

**Fallback: Jina Reader**
```typescript
const jinaResult = await webRead(`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`);
```
Returns a single result with the page content.

**Result normalization** (in `executeProspectDiscovery()`):
```typescript
if (redditRes.status === 'fulfilled' && redditRes.value.success) {
  rawResults.push(...redditRes.value.data.map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.selftext || `r/${r.subreddit}`,
  })));
}
```

### Agent-Reach Bridge Function Signature

```typescript
// In agent-reach-bridge.ts
async function redditSearch(query: string, limit: number = 10): Promise<ToolResult<RedditPostResult[]>>
```

### LLM Prompts Used

None directly — Reddit results are normalized and passed to the company extraction LLM (Skill 10). The LLM extraction prompt specifically handles the noisy nature of Reddit data:
```
IMPORTANT RULES:
- If a result is just an article or discussion, skip it
- Only include REAL companies/businesses
```

### Fallback Chain

```
Primary: Reddit JSON API → If rate-limited (429) or server error
Fallback: Jina Reader (webRead reddit.com/search) → If page not readable
Final: Return error ToolResult
```

### Error Handling

- Reddit API returns 429 when rate-limited — triggers Jina Reader fallback
- Reddit API returns 403 when blocked — triggers Jina Reader fallback
- Jina Reader may also be blocked — returns `makeError`
- `AbortSignal.timeout(15000)` prevents hanging on slow Reddit responses

### Example API Call

```typescript
const result = await redditSearch("accounting firms Dubai", 5);
// { success: true, data: [
//   { title: "Best accounting firms in Dubai for expats?", url: "https://reddit.com/r/Dubai/comments/abc", author: "user123", score: 45, numComments: 23, subreddit: "Dubai", selftext: "I'm looking for recommendations for a good accounting firm..." },
//   { title: "Taxes in UAE - need an accountant", url: "https://reddit.com/r/UAE/comments/def", author: "expat99", score: 12, numComments: 8, subreddit: "UAE", selftext: "Can anyone recommend..." },
// ], channel: "reddit", source: "Reddit JSON API" }
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Search latency | < 15 seconds |
| Results per search | ≥ 3 posts |
| Fallback success rate | ≥ 90% |

---

## 8. Result Deduplication & Merging

### Trigger
After all channel searches complete and raw results are collected, before LLM extraction.

### Input Schema

```typescript
interface RawResultsPool {
  results: SearchResult[];  // All results from all channels, normalized
}
```

### Output Schema

```typescript
interface DeduplicatedResults {
  results: SearchResult[];    // Deduplicated results
  duplicatesRemoved: number;  // Count of duplicates found
}
```

### Method

**Current Implementation: LLM-Based Deduplication**

Scout currently relies on the LLM extraction step to perform deduplication. The extraction prompt includes:
```
IMPORTANT RULES:
- Deduplicate companies that appear multiple times
```

When the same company is found across multiple channels (e.g., "Deloitte" on both Exa and LinkedIn), the LLM naturally merges them into a single entry with multiple sources.

**Planned Enhancement: Algorithmic Pre-Deduplication**

Before passing results to the LLM, Scout will perform algorithmic deduplication:

```typescript
function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  
  for (const result of results) {
    const key = normalizeForDedup(result.title, result.url);
    if (!seen.has(key)) {
      seen.set(key, result);
    } else {
      // Merge: keep the result with more data
      const existing = seen.get(key)!;
      if (result.snippet.length > existing.snippet.length) {
        seen.set(key, { ...existing, snippet: result.snippet });
      }
    }
  }
  
  return Array.from(seen.values());
}

function normalizeForDedup(title: string, url: string): string {
  // Normalize by domain + simplified title
  const domain = extractDomain(url);
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${domain}:${normalizedTitle}`;
}
```

### LLM Prompts Used

Deduplication is handled within the main extraction prompt (Skill 10), not by a separate prompt.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| LLM fails to deduplicate | Accept potential duplicates; Data Enrichment agent will catch them later |
| Algorithmic dedup removes non-duplicates | Use lower similarity threshold; prefer false positives (keeping duplicates) over false negatives (removing unique companies) |

### Error Handling

- Deduplication is best-effort — it never fails the overall task
- If dedup produces fewer results than expected, the LLM knowledge fallback may compensate

### Performance Targets

| Metric | Target |
|--------|--------|
| Deduplication accuracy | ≥ 95% (false positive merge rate < 5%) |
| False negative rate | < 2% (incorrectly removing unique companies) |
| Dedup latency | < 1 second for algorithmic; included in LLM extraction time for LLM-based |

---

## 9. Search Strategy Optimization

### Trigger
When initial search results are below the target threshold (fewer than 10 raw results or fewer than 5 extracted companies).

### Input Schema

```typescript
interface StrategyOptimizationInput {
  currentQuery: string;
  currentResults: number;
  targetResults: number;
  industry?: string;
  location?: string;
  failedChannels: string[];
}
```

### Output Schema

```typescript
interface OptimizedStrategy {
  revisedQueries: string[];     // Alternative search queries
  additionalChannels: string[]; // Channels to add
  parameterChanges: {
    industry?: string;          // Broadened industry terms
    location?: string;          // Expanded geography
  };
}
```

### Method

1. **Query broadening** — Generate alternative search queries using LLM:
   ```
   Given the search query "{query}" which returned only {count} results,
   generate 3 alternative search queries that would return more results for
   the same target market. Use synonyms, broader categories, and related terms.
   Return as JSON array of strings.
   ```

2. **Geographic expansion** — Expand location terms:
   - "Dubai" → "Dubai OR Abu Dhabi OR UAE"
   - "Singapore" → "Singapore OR Southeast Asia"
   - "London" → "London OR UK OR England"

3. **Industry synonyms** — Add industry-related terms:
   - "Accounting" → "Accounting OR Audit OR Tax OR Bookkeeping"
   - "Marketing" → "Marketing OR Advertising OR Digital Agency"
   - "Fintech" → "Fintech OR Financial Technology OR Payments OR Banking Tech"

4. **Channel addition** — Add channels not in the default 6:
   - GitHub (for tech companies)
   - RSS (for industry news)
   - YouTube (for video content with company mentions)

5. **Result count adjustment** — Increase `numResults` per channel:
   - Exa: 15 → 25
   - LinkedIn: 10 → 15

### LLM Prompts Used

```
Given the search query "{query}" which returned only {resultCount} results
for the industry "{industry}" in "{location}", generate 3 alternative search
queries that would return more results. Use synonyms, broader categories,
and related terms.

Return a JSON array of alternative query strings.
Example: ["audit firms Dubai", "tax advisory UAE", "bookkeeping services Middle East"]
```

### Agent-Reach Bridge Functions Referenced

Same as multi-channel search — uses all the same bridge functions with modified queries.

### Fallback Chain

```
Strategy 1: Broaden search terms → If still too few results
Strategy 2: Expand geography → If still too few results
Strategy 3: Add more channels → If still too few results
Strategy 4: LLM knowledge fallback → If all strategies fail
Final: Accept limited results and note in campaign output
```

### Error Handling

- LLM query generation failure → Use hardcoded expansion rules
- Supplementary search also returns few results → Accept and proceed
- Maximum 2 optimization rounds before accepting results

### Performance Targets

| Metric | Target |
|--------|--------|
| Optimization decision latency | < 5 seconds |
| Result improvement rate | ≥ 50% (at least 50% more results after optimization) |
| Maximum optimization rounds | 2 |

---

## 10. LLM-Based Company Extraction

### Trigger
After raw search results are collected from all channels (or when all channels fail and LLM knowledge fallback is needed).

### Input Schema

```typescript
interface ExtractionInput {
  rawResults: SearchResult[];  // Normalized results from all channels
  searchQuery: string;         // Original composite query
  industry?: string;           // Target industry
  location?: string;           // Target location
}
```

### Output Schema

```typescript
interface ExtractedCompany {
  companyName: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  phoneMain: string | null;
  generalEmail: string | null;
  hqAddress: string | null;
  linkedinUrl: string | null;
  description: string | null;
  sources: string[];           // URLs or "llm_knowledge"
}
```

### Method

**Path A: Normal Extraction (when rawResults.length > 0)**

1. **Truncate raw results** — Limit to 30 results to fit within LLM context window:
   ```typescript
   const truncatedResults = rawResults.slice(0, 30);
   ```

2. **Call LLM with extraction prompt**:
   ```typescript
   const companies = await callLLMForJSON<ExtractedCompany[]>(
     extractionPrompt,
     `Search query: "${searchQuery}"\n\nSearch results:\n${JSON.stringify(truncatedResults)}`,
     []  // Default: empty array
   );
   ```

3. **Validate extracted companies** — Skip any entry without a `companyName`:
   ```typescript
   for (const company of companies) {
     if (!company.companyName) continue;
     // Create Lead record
   }
   ```

**Path B: LLM Knowledge Fallback (when rawResults.length === 0)**

1. **Generate companies from LLM knowledge**:
   ```typescript
   const companies = await callLLMForJSON<ExtractedCompany[]>(
     fallbackPrompt,
     `Generate companies for: ${searchQuery}`,
     []  // Default: empty array
   );
   ```

2. **Annotate with LLM source** — All generated companies get `sources: ["llm_knowledge"]`

3. **Record fallback in channel activity**:
   ```typescript
   channelActivity.push({
     channel: 'llm_fallback',
     operation: 'generate_companies',
     success: true,
     timestamp: new Date().toISOString(),
     resultCount: companies.length,
     error: 'All search channels returned no results; used LLM knowledge fallback',
   });
   ```

### LLM Prompts Used

**Extraction Prompt (Path A):**
```
You are a lead data extraction specialist. Given web search results about
businesses/companies, extract structured company information.

Return a JSON array of company objects with these fields:
[
  {
    "companyName": "Company Name",
    "website": "https://example.com",
    "industry": "Industry",
    "city": "City",
    "country": "Country",
    "phoneMain": "Phone if found",
    "generalEmail": "Email if found",
    "hqAddress": "Address if found",
    "linkedinUrl": "LinkedIn URL if found",
    "description": "Brief description",
    "sources": ["url1", "url2"]
  }
]

IMPORTANT RULES:
- Only include REAL companies/businesses, not articles or blog posts
- If a result is just an article or discussion, skip it
- Extract as much detail as possible from the snippet
- If you can't find certain fields, use null
- Deduplicate companies that appear multiple times
```

**Fallback Prompt (Path B):**
```
You are a lead generation specialist. The web search channels are currently
unavailable, but the user wants to find companies.

Based on your knowledge, generate a list of 5-10 REAL, well-known companies
in the following industry and location. Only include companies you are
confident actually exist.

Industry: {industry}
Location: {location}
Query: {query}

Return a JSON array of company objects:
[
  {
    "companyName": "Company Name",
    "website": "https://example.com",
    "industry": "Industry",
    "city": "City",
    "country": "Country",
    "phoneMain": null,
    "generalEmail": null,
    "hqAddress": null,
    "linkedinUrl": null,
    "description": "Brief description",
    "sources": ["llm_knowledge"]
  }
]
```

### Agent-Reach Channels Referenced

None — this is an LLM-only operation. The `sources[]` field in each extracted company references the URLs from the original channel results.

### Fallback Chain

```
Path A: LLM extraction from search results → If LLM fails
  ↓ callLLMForJSON retries up to 2 times with stricter prompt
  ↓ If all retries fail, return defaultValue (empty array)

Path B: LLM knowledge generation → If LLM fails
  ↓ callLLMForJSON retries up to 2 times
  ↓ If all retries fail, return defaultValue (empty array)
  ↓ Task completes with 0 leads created (honest failure)
```

### Error Handling

- `callLLMForJSON()` retries up to 2 times with increasingly strict JSON-only prompts
- On each retry, the system prompt is appended with: "IMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no explanations, just raw JSON."
- If all retries fail, the `defaultValue` (empty array `[]`) is returned
- Empty company arrays result in 0 leads created — the task still succeeds but reports `found: 0`
- JSON extraction uses 3 strategies: (1) strip code blocks, (2) find balanced JSON, (3) parse entire response

### Example LLM Call

```typescript
// Input: 30 raw search results
// Output: 18 extracted companies

const extractionPrompt = `You are a lead data extraction specialist...`;
const userMessage = `Search query: "accounting firms Accounting Dubai"\n\nSearch results:\n${JSON.stringify(rawResults.slice(0, 30))}`;

const companies = await callLLMForJSON<ExtractedCompany[]>(extractionPrompt, userMessage, []);
// Returns:
// [
//   { companyName: "Deloitte Middle East", website: "https://www2.deloitte.com/middle-east", ... },
//   { companyName: "PwC UAE", website: "https://www.pwc.com/middle-east", ... },
//   { companyName: "Ernst & Young UAE", website: "https://www.ey.com/en_ae", ... },
//   ... (15 more)
// ]
```

### Performance Targets

| Metric | Target |
|--------|--------|
| LLM extraction latency | < 15 seconds |
| Companies extracted per 30 raw results | ≥ 10 |
| Noise filtering accuracy | ≥ 90% (articles correctly excluded) |
| Field completeness | ≥ 40% average fields populated |
| JSON parsing success rate | ≥ 98% (after retries) |

---

## 11. Execution Engine Integration

### Runtime Handler

**Function**: `executeProspectDiscovery(ctx: AgentExecutionContext): Promise<AgentExecutionResult>`

**File**: `src/lib/agent-executor.ts`

**Location in code**: Lines 416-644

### Execution Flow

```
1. Receive AgentExecutionContext
   ├─ taskId: string
   ├─ agentName: "prospect-discovery"
   ├─ taskType: "search"
   ├─ campaignId: string | null
   ├─ input: { query?, industry?, location?, description? }
   └─ priority: number

2. Extract parameters from input
   ├─ query = input.query || input.description || ''
   ├─ industry = input.industry || ''
   └─ location = input.location || ''

3. Update task progress to 10% (running)

4. Construct composite search query
   └─ searchQuery = [query, industry, location].filter(Boolean).join(' ')

5. Fire 6 parallel channel searches (Promise.allSettled)
   ├─ Exa Search (15 results)
   ├─ Reddit Search (5 results)
   ├─ LinkedIn People (10 results, conditionally)
   ├─ LinkedIn Companies (10 results)
   ├─ Twitter Search (5 results)
   └─ Twitter Users (5 results)

6. Record channel activity for each result

7. Update task progress to 40% (running)

8. Collect raw results into unified SearchResult[] array
   ├─ Exa results → push directly
   ├─ Reddit results → normalize (title, url, selftext||subreddit)
   ├─ LinkedIn People → normalize (name, url, headline)
   ├─ LinkedIn Companies → normalize (name, url, headline)
   ├─ Twitter tweets → normalize (text.slice(100), url, text.slice(300))
   └─ Twitter users → normalize (author||text.slice(100), url, text.slice(300))

9. Update task progress to 60% (running)

10. LLM extraction
    ├─ IF rawResults.length > 0:
    │   └─ Use extraction prompt (structured data from search results)
    └─ ELSE:
        └─ Use fallback prompt (generate from LLM knowledge)

11. Update task progress to 80% (running)

12. Create Lead records in database
    ├─ FOR each extracted company:
    │   ├─ Skip if companyName is empty
    │   ├─ Resolve campaignId (use input, or find active, or create new)
    │   ├─ Create Lead record with:
    │   │   ├─ companyName, website, industry, city, country
    │   │   ├─ phoneMain, generalEmail, hqAddress, linkedinUrl
    │   │   ├─ notes (from description), sources (JSON), stage: 'new'
    │   │   └─ discoveredAt: now()
    │   └─ Catch dbError silently (skip failed leads)
    └─ Collect created lead IDs

13. Update campaign lead count
    └─ Campaign.leadsFound += createdLeads.length

14. Update task progress to 100% (completed)
    └─ Output: { found, leadsCreated, channels, rawResultCount }

15. Return AgentExecutionResult
    └─ { success: true, output: { found, leadsCreated, channels }, channelActivity }
```

### Error Flow

```
Any step throws error:
  ├─ msg = error.message
  ├─ await updateTaskProgress(ctx.taskId, 0, 'failed')
  └─ return { success: false, output: { error: msg }, channelActivity: [], error: msg }
```

### Agent-Reach Bridge Functions Used

| Bridge Function | Channel | Operation | Used In Step |
|----------------|---------|-----------|-------------|
| `AgentReachToolkit.exaSearch()` | `exa_search` | `web_search` | Step 5 |
| `AgentReachToolkit.redditSearch()` | `reddit` | `search` | Step 5 |
| `AgentReachToolkit.linkedInSearchPeople()` | `linkedin` | `search_people` | Step 5 |
| `AgentReachToolkit.linkedInSearchCompanies()` | `linkedin` | `search_companies` | Step 5 |
| `AgentReachToolkit.twitterSearch()` | `twitter` | `search_tweets` | Step 5 |
| `AgentReachToolkit.twitterSearchUsers()` | `twitter` | `search_users` | Step 5 |

### Database Models Used

| Model | Operations |
|-------|-----------|
| `Campaign` | READ (find active), CREATE (if none), UPDATE (increment leadsFound) |
| `Lead` | CREATE (new lead records) |
| `AgentTask` | READ (task input), UPDATE (progress, status, output) |

### Key Function Signatures

```typescript
// Main handler
function executeProspectDiscovery(ctx: AgentExecutionContext): Promise<AgentExecutionResult>

// LLM utilities
function callLLM(systemPrompt: string, userMessage: string, retries?: number): Promise<string>
function callLLMForJSON<T>(systemPrompt: string, userMessage: string, defaultValue?: T): Promise<T>

// Progress tracking
function updateTaskProgress(taskId: string, progress: number, status?: string, output?: Record<string, unknown>): Promise<void>

// JSON extraction
function extractJSONFromString<T>(response: string): T | null
function findBalancedJSON(text: string): string | null
```

### LLM Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `temperature` | 0.3 | Low randomness for structured extraction |
| `max_tokens` | 4000 | Sufficient for up to 30 extracted companies |
| `retries` | 1 (callLLM), 2 (callLLMForJSON) | Balance reliability vs. latency |
| JSON extraction | 3 strategies | Code block → balanced JSON → full parse |

### API Dispatch

**Direct dispatch:**
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
  },
  "campaignId": "clx...",
  "priority": 10
}
```

**Via Orchestrator:**
```http
POST /api/agents/execute
Content-Type: application/json

{
  "mode": "dispatch",
  "agentName": "orchestrator",
  "taskType": "campaign-plan",
  "input": {
    "query": "Find accounting firms in Dubai"
  }
}
```
→ Atlas creates plan → Creates AgentTask for Scout → Execution engine runs `executeProspectDiscovery()`

**Via AI Chat:**
```http
POST /api/ai
Content-Type: application/json

{ "message": "Find accounting firms in Dubai" }
```
→ AI parses intent → Dispatches to orchestrator → Scout runs discovery

**Response:**
```json
{
  "success": true,
  "output": {
    "found": 18,
    "leadsCreated": 18,
    "channels": ["exa_search", "reddit", "linkedin", "twitter"]
  },
  "channelActivity": [
    { "channel": "exa_search", "operation": "web_search", "success": true, "resultCount": 15, "timestamp": "2024-11-15T10:30:00Z" },
    { "channel": "reddit", "operation": "search", "success": true, "resultCount": 3, "timestamp": "2024-11-15T10:30:01Z" },
    { "channel": "linkedin", "operation": "search_people", "success": true, "resultCount": 8, "timestamp": "2024-11-15T10:30:02Z" },
    { "channel": "linkedin", "operation": "search_companies", "success": true, "resultCount": 7, "timestamp": "2024-11-15T10:30:02Z" },
    { "channel": "twitter", "operation": "search_tweets", "success": true, "resultCount": 4, "timestamp": "2024-11-15T10:30:01Z" },
    { "channel": "twitter", "operation": "search_users", "success": true, "resultCount": 3, "timestamp": "2024-11-15T10:30:01Z" }
  ]
}
```

### Progress Reporting Timeline

```
Progress  0% → Task created, status: 'pending'
Progress 10% → Task picked up, status: 'running'
Progress 40% → Channel searches complete, raw results collected
Progress 60% → LLM extraction complete, companies extracted
Progress 80% → Lead records being created in database
Progress 100% → All leads created, campaign updated, status: 'completed'
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Total execution time | < 2 minutes |
| Channel search phase | < 30 seconds |
| LLM extraction phase | < 15 seconds |
| Lead persistence phase | < 30 seconds |
| End-to-end (from dispatch to completed) | < 3 minutes |
