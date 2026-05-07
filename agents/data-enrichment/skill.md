# Data Enrichment Agent — Skills (Forge)

> Complete skill reference for the Forge Data Enrichment Agent. Each skill documents the trigger conditions, input/output schemas, method, Agent-Reach bridge function signatures, LLM prompts, fallback chains, error handling, example API calls, and performance targets.

---

## Skill 1: Website Contact Extraction

### Overview

Forge reads company websites via Jina Reader to extract contact information, addresses, service descriptions, and team details. This is the **highest-priority enrichment source** because company websites are first-party, authoritative data.

### Trigger

| Condition | Action |
|-----------|--------|
| Lead has a `website` URL and `stage = 'new'` | Execute full website contact extraction |
| Lead has a `website` but missing `phoneMain`, `generalEmail`, or `hqAddress` | Execute targeted extraction |
| Lead has no `website` | Skip to Exa Search (Skill 5) |

### Input Schema

```typescript
interface WebsiteExtractionInput {
  url: string;           // Company website URL (e.g., "https://acme.com")
  subpages?: string[];   // Optional sub-pages to read (default: ["/contact", "/about", "/team"])
  maxContentLength?: number; // Max chars to capture (default: 15000)
}
```

### Output Schema

```typescript
interface WebsiteExtractionOutput {
  phoneMain: string | null;
  phoneDirect: string | null;
  generalEmail: string | null;
  supportEmail: string | null;
  hqAddress: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  postalCode: string | null;
  description: string | null;
  teamMembers: Array<{ name: string; title: string }> | null;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  } | null;
}
```

### Method

1. **Primary page read**: Call `webRead(url)` to fetch the homepage
2. **Sub-page navigation**: If homepage lacks contact info, read `/contact`, `/about`, `/team` pages
3. **LLM extraction**: Feed page content to LLM with structured extraction prompt
4. **Regex pre-processing**: Before LLM, run regex patterns for quick wins:
   - Email: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`
   - Phone: `/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g`
   - Address: Look for patterns containing "St", "Ave", "Blvd", state abbreviations, ZIP codes

### Agent-Reach Bridge Function

```typescript
// src/lib/agent-reach-bridge.ts

// Primary: Read a single web page
export async function webRead(
  url: string,
  format: 'markdown' | 'text' = 'markdown'
): Promise<ToolResult<WebReadResult>>

// Batch: Read multiple pages in parallel
export async function webReadMultiple(
  urls: string[]
): Promise<ToolResult<WebReadResult>[]>

// Convenience: Enrich company data from website
export async function enrichCompanyData(
  website: string
): Promise<ToolResult<WebReadResult>>
```

**Returns**:
```typescript
interface WebReadResult {
  url: string;
  title: string;
  content: string;      // Markdown content, capped at 50,000 chars
  wordCount: number;
}
```

### LLM Prompt

```
System: You are a contact information extraction specialist. Given the content of a company website, extract all contact details, addresses, and team information.

Return a JSON object with these fields:
{
  "phoneMain": "Main company phone number or null",
  "phoneDirect": "Direct phone number if found or null",
  "generalEmail": "General contact email or null",
  "supportEmail": "Support/help email or null",
  "hqAddress": "Full headquarters address or null",
  "city": "City or null",
  "stateProvince": "State or province or null",
  "country": "Country or null",
  "postalCode": "Postal/ZIP code or null",
  "description": "Brief company description (1-2 sentences) or null",
  "teamMembers": [{"name": "Full Name", "title": "Job Title"}] or null,
  "socialLinks": {"linkedin": "URL", "twitter": "URL", "facebook": "URL"} or null
}

Rules:
- Extract ONLY information explicitly stated on the page
- Do not infer or fabricate any data
- Format phone numbers as they appear on the page
- For addresses, capture the full address string as written
- If a field is not found, use null

User: Extract contact information from this website content:
{content}
```

### Fallback Chain

| Step | Method | Quality | When Used |
|------|--------|---------|-----------|
| 1 | `webRead(url)` via Jina Reader | Full content, markdown | Primary — always tried first |
| 2 | `webRead(url, 'text')` | Plain text only | If markdown parsing fails |
| 3 | `webReadMultiple([url + '/contact', url + '/about'])` | Sub-page content | If homepage has no contact info |
| 4 | Skip website, rely on Exa/LinkedIn | Reduced data | If Jina Reader returns error or empty content |

### Error Handling

| Error | Code | Recovery |
|-------|------|----------|
| Jina Reader returns 4xx/5xx | `makeError()` | Log error, proceed to Exa search |
| Timeout (>20s) | `AbortSignal.timeout(20000)` | Skip website, use search data |
| Content too short (<100 chars) | Quality check | Likely a redirect/JS-only page, try Exa |
| Content is a CAPTCHA page | Pattern detection | Skip, rely on other channels |

### Example API Call

```typescript
const result = await webRead('https://acmecorp.com');

if (result.success) {
  console.log(`Title: ${result.data.title}`);
  console.log(`Content length: ${result.data.wordCount} words`);
  // Feed result.data.content to LLM for extraction
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Page read time | < 5 seconds |
| Contact extraction accuracy | 90%+ for emails/phones present on page |
| Sub-page hit rate | 70%+ of companies have /contact or /about |
| Content extraction completeness | 95%+ of visible text captured |

---

## Skill 2: LinkedIn Company Enrichment

### Overview

Forge uses three LinkedIn methods to find company profiles, employee data, and organizational details. LinkedIn provides the most structured and reliable firmographic data available.

### Trigger

| Condition | Action |
|-----------|--------|
| Need company size, industry, or headquarters | Execute LinkedIn company search |
| Need key personnel names/titles | Execute LinkedIn people search |
| Have a LinkedIn company URL | Execute LinkedIn company page read |

### Input Schema

```typescript
interface LinkedInEnrichmentInput {
  companyName: string;
  limit?: number;          // Max results per search (default: 3)
  companyUrl?: string;     // Known LinkedIn URL (optional)
}
```

### Output Schema

```typescript
interface LinkedInCompanyOutput {
  name: string;
  headline: string;        // Industry | Size | Type
  location: string;
  url: string;
  summary?: string;        // Up to 5,000 chars of company description
  experience?: string[];   // Specialties list
  // Parsed from headline by Forge:
  industry?: string;
  employeeCount?: string;
  organizationType?: string;
  headquarters?: string;
}
```

### Method

Three sub-skills operate as a **3-method fallback pipeline**:

#### Method A: LinkedIn People Search
```typescript
linkedInSearchPeople(query: string, limit: number)
```
1. Try `mcporter call 'linkedin.search_people(keyword: "QUERY", limit: N)'`
2. If mcporter fails → `exaSearch("site:linkedin.com/in QUERY", limit)`
3. If Exa fails → `Jina Search: s.jina.ai?q=site:linkedin.com/in+QUERY`

#### Method B: LinkedIn Company Search
```typescript
linkedInSearchCompanies(query: string, limit: number)
```
1. `exaSearch("site:linkedin.com/company QUERY", limit)` — Exa is primary for companies
2. If Exa fails → `Jina Search: s.jina.ai?q=site:linkedin.com/company+QUERY`

#### Method C: LinkedIn Company Page Read
```typescript
linkedInReadCompanyPage(companyUrl: string)
```
1. `webRead(companyUrl)` via Jina Reader
2. Extract structured fields via regex:
   - `Industry: <value>`
   - `Company size: <value>`
   - `Headquarters: <value>`
   - `Specialties: <value1>, <value2>`

### Agent-Reach Bridge Functions

```typescript
// src/lib/agent-reach-bridge.ts

export async function linkedInSearchPeople(
  query: string,
  limit: number = 10
): Promise<ToolResult<LinkedInProfileResult[]>>

export async function linkedInSearchCompanies(
  query: string,
  limit: number = 10
): Promise<ToolResult<LinkedInProfileResult[]>>

export async function linkedInReadCompanyPage(
  companyUrl: string
): Promise<ToolResult<LinkedInProfileResult>>

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
System: You are a LinkedIn data extraction specialist. Given LinkedIn search results and company page data, extract structured company and personnel information.

Return a JSON object:
{
  "industry": "Industry classification or null",
  "employeeCount": "Range like '51-200' or null",
  "organizationType": "Company type (Privately Held, Public, etc.) or null",
  "headquarters": "City, State/Country or null",
  "foundingYear": "Year or null",
  "specialties": ["Specialty 1", "Specialty 2"] or null,
  "keyPeople": [
    {"name": "Full Name", "title": "Job Title", "linkedinUrl": "URL"}
  ] or null
}

User: Extract company data from LinkedIn results:
People: {linkedInPeopleData}
Company: {linkedInCompanyData}
```

### Fallback Chain

| Step | Method | Quality | Speed |
|------|--------|---------|-------|
| 1 | mcporter `linkedin.search_people` | Highest (structured JSON) | Fast (5–10s) |
| 2 | Exa `site:linkedin.com/in QUERY` | High (semantic search) | Medium (10–15s) |
| 3 | Jina Search `s.jina.ai` | Medium (URL extraction) | Slow (15–20s) |
| 4 | Skip LinkedIn | — | Instant |

### Error Handling

| Error | Recovery |
|-------|----------|
| mcporter not installed | Skip to Exa search (automatic) |
| LinkedIn auth cookies expired | mcporter fails silently → Exa fallback |
| Rate limited by LinkedIn | All methods fall back to Jina Search |
| No results found | Return empty array, proceed to other channels |
| `Promise.allSettled` rejection | Isolated — other parallel calls still succeed |

### Example API Calls

```typescript
// People search
const people = await linkedInSearchPeople('Acme Corp', 3);
// Returns: [{ name: "Sarah Chen", headline: "CEO at Acme Corp", location: "San Francisco", url: "..." }]

// Company search
const companies = await linkedInSearchCompanies('Acme Corp', 3);
// Returns: [{ name: "Acme Corp", headline: "Software | 51-200 employees | Privately Held", ... }]

// Company page deep read
const companyPage = await linkedInReadCompanyPage('https://linkedin.com/company/acme-corp');
// Returns: Full company description, industry, size, HQ, specialties
```

### Performance Targets

| Metric | Target |
|--------|--------|
| People search results | 1–3 relevant profiles per company |
| Company search results | 1 exact match per company |
| Company page read success | 80%+ of LinkedIn URLs readable |
| Total LinkedIn time per lead | < 10 seconds |
| Fallback activation rate | < 30% (mcporter works most of the time) |

---

## Skill 3: Twitter/X Profile Discovery

### Overview

Forge searches Twitter/X for company profiles and handles. This reveals the company's social voice, recent announcements, and provides a direct communication channel.

### Trigger

| Condition | Action |
|-----------|--------|
| Missing `twitterHandle` for a lead | Execute Twitter user search |
| Need social activity signals | Execute Twitter content search |

### Input Schema

```typescript
interface TwitterDiscoveryInput {
  companyName: string;
  limit?: number;  // Max results (default: 3)
}
```

### Output Schema

```typescript
interface TwitterDiscoveryOutput {
  handle: string;         // e.g., "@acmecorp"
  url: string;            // e.g., "https://twitter.com/acmecorp"
  bio: string;            // Profile bio/description
  recentActivity?: string; // Summary of recent tweets
}
```

### Method

1. Call `twitterSearchUsers(companyName, limit)`
2. Exa searches `site:twitter.com COMPANY -inurl:status` for profile pages
3. Extract handle from URL pattern: `twitter.com/USERNAME`
4. Fallback: Jina Search for `site:twitter.com COMPANY profile`

### Agent-Reach Bridge Functions

```typescript
// src/lib/agent-reach-bridge.ts

export async function twitterSearchUsers(
  query: string,
  limit: number = 10
): Promise<ToolResult<TwitterResult[]>>

export async function twitterSearch(
  query: string,
  limit: number = 10
): Promise<ToolResult<TwitterResult[]>>

export async function twitterReadTweet(
  tweetUrl: string
): Promise<ToolResult<TwitterResult>>
```

**Returns**:
```typescript
interface TwitterResult {
  text: string;       // Bio or tweet content
  author: string;     // @handle
  url: string;        // Profile or tweet URL
  likes: number;
  retweets: number;
  date: string;
}
```

### LLM Prompt

```
System: You are a social media profile analyst. Given Twitter/X search results for a company, identify the official company profile and extract key information.

Return a JSON object:
{
  "twitterHandle": "@handle or null",
  "twitterUrl": "https://twitter.com/handle or null",
  "bioSummary": "Brief summary of the company's Twitter presence or null"
}

Rules:
- Prefer verified accounts and accounts with the company name in the handle
- If multiple results, select the most likely official account
- If no clear company account found, use null

User: Identify the company's Twitter profile:
{twitterResults}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | Exa `site:twitter.com QUERY -inurl:status` | High (semantic match) |
| 2 | Jina Search `site:twitter.com QUERY profile` | Medium (URL extraction) |
| 3 | Skip Twitter | — |

### Error Handling

| Error | Recovery |
|-------|----------|
| Exa returns no results | Try Jina Search fallback |
| Twitter API rate limited | Skip, rely on website social links |
| Multiple ambiguous profiles | LLM selects most likely official account |
| Handle extraction failure | Return null for twitterHandle |

### Example API Call

```typescript
const profiles = await twitterSearchUsers('Acme Corp', 3);
// Returns: [
//   { text: "Building the future of SaaS", author: "@acmecorp", url: "https://twitter.com/acmecorp", ... },
//   { text: "CEO at Acme Corp", author: "@sarahchen", url: "https://twitter.com/sarahchen", ... }
// ]
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Profile discovery rate | 75%+ for companies with Twitter presence |
| Handle accuracy | 90%+ (correct official account) |
| Time per search | < 8 seconds |
| False positive rate | < 10% |

---

## Skill 4: Email Pattern Discovery

### Overview

Forge detects corporate email patterns from known email addresses and generates likely email addresses for key contacts. This is essential because direct email addresses for decision-makers are rarely published publicly.

### Trigger

| Condition | Action |
|-----------|--------|
| Have contact names but no email addresses | Execute pattern detection + generation |
| Found 1+ emails at company domain | Infer pattern, generate for other contacts |
| No emails found at domain | Use industry norms + domain to generate candidates |

### Input Schema

```typescript
interface EmailPatternInput {
  domain: string;                        // e.g., "acme.com"
  knownEmails: string[];                 // e.g., ["info@acme.com", "john.smith@acme.com"]
  contacts: Array<{                      // People needing email addresses
    firstName: string;
    lastName: string;
    title?: string;
  }>;
}
```

### Output Schema

```typescript
interface EmailPatternOutput {
  detectedPattern: string | null;        // e.g., "first.last"
  confidence: number;                    // 0-100%
  generatedEmails: Array<{
    name: string;
    email: string;
    pattern: string;
    confidence: number;                  // 35-75%
  }>;
}
```

### Method

1. **Domain extraction**: Parse the company website URL to get the email domain
2. **Pattern detection**: Analyze known emails against standard patterns:
   ```
   For "john.smith@acme.com" with first="John", last="Smith":
   → Pattern: "first.last" ✓ (MATCH)
   → Pattern: "firstlast" → "johnsmith" ✗
   → Pattern: "firstl" → "jsmith" ✗
   ```
3. **Candidate generation**: Apply detected pattern to all contacts:
   ```
   Contact: Sarah Chen, Domain: acme.com, Pattern: first.last
   → sarah.chen@acme.com (confidence: 75% if 2+ confirming emails)
   → sarah.chen@acme.com (confidence: 55% if 1 confirming email)
   ```
4. **Structural validation**: Regex check on all generated emails
5. **No known emails?** Try the top 3 most common patterns:
   - `first.last` (30% prevalence)
   - `firstl` (15% prevalence)
   - `firstlast` (25% prevalence)

### Agent-Reach Bridge Function

Email pattern discovery is primarily an **LLM-powered skill** that operates on data already collected by other skills. It uses the same `callLLMForJSON()` engine:

```typescript
// Internal LLM call (no separate bridge function)
async function detectEmailPattern(
  domain: string,
  knownEmails: string[],
  contacts: Array<{ firstName: string; lastName: string }>
): Promise<EmailPatternOutput>
```

### LLM Prompt

```
System: You are an email pattern detection specialist. Given a company domain, known email addresses, and contact names, detect the corporate email pattern and generate likely email addresses.

Common patterns:
- first.last: john.smith@domain.com (most common, ~30%)
- firstlast: johnsmith@domain.com (~25%)
- firstl: jsmith@domain.com (~15%)
- first_last: john_smith@domain.com (~5%)
- first: john@domain.com (~5%)

Return a JSON object:
{
  "detectedPattern": "pattern name or null",
  "patternConfidence": 0-100,
  "generatedEmails": [
    {
      "name": "Contact Name",
      "email": "generated@domain.com",
      "pattern": "pattern name",
      "confidence": 0-100
    }
  ]
}

Rules:
- Only generate emails if you can identify a clear pattern
- If no pattern is detectable, generate candidates using top 3 patterns with lower confidence
- Always validate email format
- Confidence should be based on number of confirming examples found
- Never claim more than 75% confidence for generated emails

User: Domain: {domain}
Known emails: {knownEmails}
Contacts needing emails: {contacts}
```

### Fallback Chain

| Step | Method | Confidence |
|------|--------|------------|
| 1 | Pattern detected from 2+ known emails | 75% |
| 2 | Pattern detected from 1 known email | 55% |
| 3 | Top 3 patterns attempted (no known emails) | 35% |
| 4 | No email generation (skip) | 0% |

### Error Handling

| Error | Recovery |
|-------|----------|
| No known emails at domain | Generate candidates using top 3 patterns |
| Domain is generic (gmail.com, etc.) | Skip email generation entirely |
| Contact name is mononym (single word) | Generate `first@domain` only |
| Generated email fails regex | Discard that candidate |

### Example

```typescript
// Input
{
  domain: "acmecorp.com",
  knownEmails: ["info@acmecorp.com", "john.smith@acmecorp.com"],
  contacts: [
    { firstName: "Sarah", lastName: "Chen", title: "CEO" },
    { firstName: "Michael", lastName: "Park", title: "VP Sales" }
  ]
}

// Output
{
  detectedPattern: "first.last",
  patternConfidence: 75,
  generatedEmails: [
    { name: "Sarah Chen", email: "sarah.chen@acmecorp.com", pattern: "first.last", confidence: 55 },
    { name: "Michael Park", email: "michael.park@acmecorp.com", pattern: "first.last", confidence: 55 }
  ]
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Pattern detection accuracy | 85%+ when 2+ known emails available |
| Generated email deliverability | 70%+ (confirmed by subsequent engagement) |
| False positive rate | < 20% |
| Time per pattern detection | < 3 seconds (LLM call) |

---

## Skill 5: Firmographic Data Enrichment

### Overview

Forge uses Exa Search to find company firmographic data — revenue estimates, employee counts, industry codes, and founding years. This data fills critical fields for lead qualification and ICP matching.

### Trigger

| Condition | Action |
|-----------|--------|
| Missing `employeeCount`, `revenueEstimate`, or `foundingYear` | Execute firmographic search |
| Missing `sicCode` or `naicsCode` | Execute industry code search |
| Need company financial intelligence | Search for funding/revenue data |

### Input Schema

```typescript
interface FirmographicInput {
  companyName: string;
  industry?: string;
  website?: string;
}
```

### Output Schema

```typescript
interface FirmographicOutput {
  employeeCount: string | null;     // Range: "51-200"
  revenueEstimate: string | null;   // Range: "$10M-$50M"
  foundingYear: string | null;      // Year: "2018"
  ownershipType: string | null;     // "Privately Held", "Public", etc.
  sicCode: string | null;
  naicsCode: string | null;
  description: string | null;
}
```

### Method

1. **Construct search query**: `"COMPANY_NAME INDUSTRY revenue employees funding founded"`
2. **Execute Exa search**: `exaSearch(query, 5)` for targeted results
3. **Supplement with LinkedIn**: Data from `linkedInSearchCompanies()` provides employee count, industry
4. **LLM synthesis**: Extract firmographic data from search results

### Agent-Reach Bridge Function

```typescript
// src/lib/agent-reach-bridge.ts

export async function exaSearch(
  query: string,
  numResults: number = 10
): Promise<ToolResult<SearchResult[]>>
```

**Returns**:
```typescript
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
  publishedDate?: string;
}
```

### LLM Prompt

```
System: You are a firmographic data extraction specialist. Given web search results about a company, extract company size, revenue, and industry data.

Return a JSON object:
{
  "employeeCount": "Range like '51-200' or null",
  "revenueEstimate": "Range like '$10M-$50M' or null",
  "foundingYear": "Year as string or null",
  "ownershipType": "Privately Held, Public, Nonprofit, etc. or null",
  "sicCode": "SIC code if found or null",
  "naicsCode": "NAICS code if found or null",
  "description": "Brief company description (1-2 sentences) or null"
}

Rules:
- Employee counts should be ranges, not exact numbers
- Revenue should be ranges with currency
- Only include data you found in the search results
- Prefer data from authoritative sources (Crunchbase, Bloomberg, LinkedIn)

User: Company: {companyName}
Industry: {industry}
Search results: {exaResults}
LinkedIn company data: {linkedInCompanyData}
```

### Fallback Chain

| Step | Method | Data Quality |
|------|--------|-------------|
| 1 | Exa search for firmographic data | High (finds directories, reports) |
| 2 | Jina Search fallback | Medium (less semantic) |
| 3 | LinkedIn company page data | High for employee count, industry |
| 4 | LLM estimate from company name + industry | Low (estimated ranges) |

### Error Handling

| Error | Recovery |
|-------|----------|
| Exa search returns no results | Try Jina Search fallback |
| Revenue data not found | Use LLM estimate, mark as estimated |
| Conflicting employee counts | Use LinkedIn data as primary, note conflict |
| Company not found in any directory | Use LLM estimate based on industry norms |

### Example API Call

```typescript
const results = await exaSearch('Acme Corp Technology revenue employees funding founded', 5);
// Returns: ToolResult<SearchResult[]>
// {
//   success: true,
//   data: [
//     { title: "Acme Corp - Crunchbase", url: "...", snippet: "Revenue: $15M, Employees: 120" },
//     { title: "Acme Corp - Bloomberg", url: "...", snippet: "Founded 2019, SaaS company" }
//   ]
// }
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Employee count found | 70%+ of leads |
| Revenue estimate found | 40%+ of leads (often private) |
| Founding year found | 60%+ of leads |
| Firmographic search time | < 5 seconds |

---

## Skill 6: Technology Stack Detection

### Overview

Forge analyzes company websites and GitHub presence to detect the technology stack — CMS, hosting, analytics, frameworks. This intelligence helps Outreach Composer (Pen) personalize messages with technical context.

### Trigger

| Condition | Action |
|-----------|--------|
| Lead is a developer-focused or tech company | Execute tech stack detection |
| Need tech context for outreach personalization | Analyze website + GitHub |

### Input Schema

```typescript
interface TechStackInput {
  website: string;
  companyName: string;
}
```

### Output Schema

```typescript
interface TechStackOutput {
  technologies: string[];  // e.g., ["React", "Next.js", "Vercel", "Google Analytics"]
  categories: {
    cms?: string;
    hosting?: string;
    analytics?: string;
    framework?: string;
    language?: string;
  };
}
```

### Method

1. **Website source analysis**: `webRead(url)` — Jina Reader captures page source indicators
2. **LLM tech detection**: Feed page content to LLM to identify tech signatures
3. **GitHub search** (for dev companies): `githubSearchRepos(companyName)` to find open-source projects
4. **Combine results**: Merge website-detected tech with GitHub repo languages

### Agent-Reach Bridge Functions

```typescript
export async function webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
export async function githubSearchRepos(query: string, limit?: number): Promise<ToolResult<GitHubRepoResult[]>>
export async function githubViewRepo(ownerRepo: string): Promise<ToolResult<Record<string, unknown>>>
```

### LLM Prompt

```
System: You are a technology detection specialist. Given the content of a company website and their GitHub repositories, identify the technologies they use.

Look for indicators of:
- CMS: WordPress, Drupal, Contentful, Strapi, etc.
- Hosting: AWS, Vercel, Netlify, Heroku, etc.
- Analytics: Google Analytics, Mixpanel, Amplitude, etc.
- Framework: React, Vue, Angular, Next.js, Django, Rails, etc.
- Language: JavaScript, Python, Go, Rust, etc.

Return a JSON object:
{
  "technologies": ["Tech1", "Tech2", ...],
  "categories": {
    "cms": "Detected CMS or null",
    "hosting": "Detected hosting or null",
    "analytics": "Detected analytics or null",
    "framework": "Detected framework or null",
    "language": "Primary language or null"
  }
}

Only include technologies you can detect with reasonable confidence.

User: Website content: {content}
GitHub repos: {githubData}
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | Website source via Jina Reader + LLM | Medium (Jina strips some HTML) |
| 2 | GitHub repo language detection | High for dev companies |
| 3 | Skip tech stack | — |

### Error Handling

| Error | Recovery |
|-------|----------|
| Jina Reader strips tech signatures | Rely on visible text clues (footer mentions) |
| No GitHub repos found | Skip GitHub analysis |
| LLM uncertain about tech | Only include high-confidence detections |

### Performance Targets

| Metric | Target |
|--------|--------|
| Tech detection accuracy | 70%+ for visible tech |
| GitHub repo match rate | 40%+ for tech companies |
| Time per detection | < 8 seconds |

---

## Skill 7: Social Profile Linking

### Overview

Forge discovers and links social media profiles across platforms — LinkedIn, Twitter, Facebook — for both the company and key contacts. This builds a complete digital presence map.

### Trigger

| Condition | Action |
|-----------|--------|
| Missing `linkedinUrl` or `twitterHandle` | Execute social profile discovery |
| Need social links for outreach channel selection | Search across platforms |

### Input Schema

```typescript
interface SocialLinkingInput {
  companyName: string;
  contactNames?: string[];
  website?: string;
}
```

### Output Schema

```typescript
interface SocialLinkingOutput {
  company: {
    linkedinUrl: string | null;
    twitterHandle: string | null;
    facebookPage: string | null;
  };
  contacts: Array<{
    name: string;
    linkedinUrl: string | null;
    twitterHandle: string | null;
  }>;
}
```

### Method

1. **Website footer scan**: Check for social links in website content
2. **LinkedIn search**: `linkedInSearchCompanies(companyName)` for company page
3. **Twitter search**: `twitterSearchUsers(companyName)` for company handle
4. **Exa search**: `exaSearch("COMPANY_NAME linkedin twitter facebook")` for all profiles
5. **Cross-link**: Use discovered profile URLs to find additional profiles

### Agent-Reach Bridge Functions

```typescript
linkedInSearchCompanies(query, limit)
twitterSearchUsers(query, limit)
exaSearch(query, numResults)
webRead(url)  // For website footer social links
```

### LLM Prompt

```
System: You are a social media profile discovery specialist. Given search results for a company, identify all official social media profiles.

Return a JSON object:
{
  "company": {
    "linkedinUrl": "URL or null",
    "twitterHandle": "@handle or null",
    "facebookPage": "URL or null"
  }
}

Rules:
- Only include verified official profiles
- Prefer the primary/most active account when multiple exist

User: Search results: {searchResults}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| LinkedIn URL found | 80%+ |
| Twitter handle found | 60%+ |
| Facebook page found | 40%+ |
| Total time per lead | < 5 seconds (parallel calls) |

---

## Skill 8: Data Cross-Verification

### Overview

Forge cross-references data from multiple sources to verify accuracy and resolve conflicts. This skill operates as a **meta-skill** — it's invoked during the LLM synthesis step (Stage 5) of the pipeline.

### Trigger

| Condition | Action |
|-----------|--------|
| Data collected from 2+ sources | Execute cross-verification |
| Conflicting data between sources | Resolve conflict using priority hierarchy |

### Input Schema

```typescript
interface CrossVerificationInput {
  field: string;
  values: Array<{
    source: string;
    value: unknown;
    confidence: number;
  }>;
}
```

### Output Schema

```typescript
interface CrossVerificationOutput {
  field: string;
  verifiedValue: unknown;
  confidence: number;
  sources: string[];
  conflict: boolean;
  conflictNote?: string;
}
```

### Method

1. **Collect values**: Gather all values for each field from all sources
2. **Exact match**: If all values are identical → cross-verified, confidence = 90%+
3. **Fuzzy match**: If values differ only in formatting → use highest-priority source, confidence = 85%+
4. **Conflict**: If values differ substantively → use highest-priority source, flag conflict, confidence = 60%
5. **Single source**: Only one value available → single-source, confidence = 50-70%

### LLM Prompt

```
System: You are a data verification specialist. Given values for a field from multiple sources, determine the most accurate value.

Source priority: Website > LinkedIn > Exa > Twitter > LLM

Return a JSON object:
{
  "field": "field_name",
  "verifiedValue": "the best value or null",
  "confidence": 0-100,
  "conflict": true/false,
  "conflictNote": "Description of conflict if any, or null"
}

User: Field: {field}
Values from sources: {values}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Cross-verification rate | 50%+ of fields verified by 2+ sources |
| Conflict detection rate | 90%+ of actual conflicts caught |
| Conflict resolution accuracy | 80%+ (higher-priority source is correct) |

---

## Skill 9: LLM-Based Enrichment Synthesis

### Overview

The synthesis skill is the **final stage** of Forge's pipeline. It takes all raw data collected from Agent-Reach channels and synthesizes it into a structured, deduplicated lead record. This is where all the intelligence is fused together.

### Trigger

| Condition | Action |
|-----------|--------|
| All channel data collected for a lead | Execute LLM synthesis |
| Pipeline stage: after Stages 1–4 | Fuse all data into final record |

### Input Schema

```typescript
interface SynthesisInput {
  lead: {
    companyName: string;
    website?: string;
    industry?: string;
    city?: string;
    country?: string;
  };
  websiteContent?: string;
  exaResults?: SearchResult[];
  linkedInPeople?: LinkedInProfileResult[];
  linkedInCompanies?: LinkedInProfileResult[];
  twitterProfiles?: TwitterResult[];
}
```

### Output Schema

```typescript
interface SynthesisOutput {
  phoneMain: string | null;
  phoneDirect: string | null;
  generalEmail: string | null;
  supportEmail: string | null;
  hqAddress: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  postalCode: string | null;
  ceoName: string | null;
  ceoEmail: string | null;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;
  employeeCount: string | null;
  revenueEstimate: string | null;
  foundingYear: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  description: string | null;
}
```

### Method

1. **Aggregate all data**: Collect results from webRead, exaSearch, linkedIn, twitter
2. **Select prompt**: Choose between full-data prompt or LLM-estimate prompt
3. **LLM extraction**: Call `callLLMForJSON()` with structured extraction prompt
4. **Validation**: Verify all extracted values are not empty/null before writing to DB
5. **Write to database**: Update the Lead record with enriched data + set `stage: 'enriched'`

### Agent-Reach Bridge (Indirect)

Synthesis uses `callLLMForJSON()` from `agent-executor.ts`, not a direct Agent-Reach bridge function. The bridge functions provide the **input data** for synthesis.

### LLM Prompts

#### Full-Data Synthesis Prompt (hasData = true)

```
System: You are a data enrichment specialist. Given a lead record and web research data, extract and fill in missing fields.

Current lead data:
{leadData}

Website content: {websiteContent}
Search results: {exaResults}
LinkedIn people: {linkedInPeople}
LinkedIn companies: {linkedInCompanies}
Twitter profiles: {twitterProfiles}

Return a JSON object with ONLY the fields you can confidently fill in:
{
  "phoneMain": "phone or null",
  "phoneDirect": "phone or null",
  "generalEmail": "email or null",
  "supportEmail": "email or null",
  "hqAddress": "full address or null",
  "city": "city or null",
  "stateProvince": "state or null",
  "country": "country or null",
  "postalCode": "postal code or null",
  "ceoName": "CEO name or null",
  "ceoEmail": "CEO email or null",
  "keyContactName": "key contact name or null",
  "keyContactTitle": "key contact title or null",
  "keyContactEmail": "key contact email or null",
  "employeeCount": "range like '51-200' or null",
  "revenueEstimate": "estimate like '$10M-$50M' or null",
  "foundingYear": "year or null",
  "linkedinUrl": "LinkedIn URL or null",
  "twitterHandle": "@handle or null",
  "description": "brief company description"
}

Only include fields where you found actual data. Omit fields where no data was found.
```

#### LLM-Estimate Prompt (hasData = false)

```
System: You are a data enrichment specialist. No web data was available for this company. Based on your knowledge, provide your best estimates for this company.

Company: {companyName}
Industry: {industry}
Location: {city}, {country}

Return a JSON object with your best estimates:
{
  "employeeCount": "estimated range like '51-200' or null",
  "revenueEstimate": "estimated range like '$10M-$50M' or null",
  "description": "brief company description based on name and industry"
}

Only include fields you can reasonably estimate. Mark uncertain fields as null.
```

### Fallback Chain

| Step | Method | Quality |
|------|--------|---------|
| 1 | LLM synthesis from multi-source data | High (verified data) |
| 2 | LLM synthesis from limited data (1–2 sources) | Medium |
| 3 | LLM estimates from company name only | Low (marked as estimated) |
| 4 | Empty enrichment, advance lead anyway | Minimal (pipeline continues) |

### Error Handling

| Error | Recovery |
|-------|----------|
| LLM returns invalid JSON | `callLLMForJSON()` retries up to 2 times with stricter prompt |
| LLM returns empty response | Return default `{}` — lead still advances |
| LLM hallucinates data | System only writes non-null values; LLM estimates are marked |
| JSON extraction fails | `extractJSONFromString()` tries 3 strategies |

### Performance Targets

| Metric | Target |
|--------|--------|
| Synthesis accuracy | 90%+ for verified data, 50%+ for estimates |
| LLM call time | < 5 seconds |
| Fields filled per lead | 12+ fields (with web data), 3+ (LLM estimate only) |
| JSON parse success rate | 98%+ (with retries) |

---

## Skill 10: Execution Engine Integration

### Overview

This skill documents how Forge integrates with the Agent Execution Engine — the runtime that dispatches tasks, calls Agent-Reach bridge functions, and stores results.

### Runtime Handler

```typescript
// src/lib/agent-executor.ts

async function executeDataEnrichment(
  ctx: AgentExecutionContext
): Promise<AgentExecutionResult>
```

### Execution Context

```typescript
interface AgentExecutionContext {
  taskId: string;
  agentName: 'data-enrichment';
  taskType: 'enrich';
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
    enriched: number;        // Number of leads enriched
    totalProcessed: number;  // Total leads attempted
  };
  channelActivity: ChannelActivityRecord[];
  error?: string;
}
```

### Channel Activity Record

```typescript
interface ChannelActivityRecord {
  channel: string;       // 'web', 'exa_search', 'linkedin', 'twitter'
  operation: string;     // 'read_company_site', 'enrichment_search', 'people_search', etc.
  success: boolean;
  timestamp: string;
  resultCount?: number;
  error?: string;
}
```

### Agent-Reach Bridge Functions Used

| Bridge Function | Channel | Purpose |
|----------------|---------|---------|
| `enrichCompanyData(website)` | web | Read company website for contact info |
| `exaSearch(query, numResults)` | exa_search | Search for company data across the web |
| `linkedInSearchPeople(query, limit)` | linkedin | Find company employees on LinkedIn |
| `linkedInSearchCompanies(query, limit)` | linkedin | Find company page on LinkedIn |
| `linkedInReadCompanyPage(url)` | linkedin | Read detailed company data |
| `linkedInGetProfile(url)` | linkedin | Read individual LinkedIn profile |
| `twitterSearchUsers(query, limit)` | twitter | Find company Twitter profile |
| `twitterSearch(query, limit)` | twitter | Search for company-related tweets |
| `githubSearchRepos(query, limit)` | github | Find company's open-source repos |
| `webRead(url)` | web | Read any web page |

### API Dispatch

```typescript
// Direct task dispatch
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "data-enrichment",
  "taskType": "enrich",
  "input": {
    "campaignId": "clxxx...",
    "query": "technology companies",
    "industry": "Technology",
    "location": "San Francisco"
  }
}

// Via AI Chat (Orchestrator routes to Forge)
POST /api/ai
{
  "message": "Enrich the leads in my technology campaign"
}
// → Orchestrator → data-enrichment agent → Agent-Reach channels → LLM synthesis → Lead records updated
```

### Pipeline Flow

```
1. Task dispatched to data-enrichment agent
2. executeDataEnrichment() called with AgentExecutionContext
3. Query leads: db.lead.findMany({ where: { stage: 'new' }, take: 20 })
4. For each lead:
   a. [Progress 10-90%] 5-stage pipeline
      - enrichCompanyData(website)         [web channel]
      - exaSearch(company + industry)      [exa_search channel]
      - linkedInSearchPeople(company)      [linkedin channel] ──┐
      - linkedInSearchCompanies(company)   [linkedin channel] ──┤ Promise.allSettled()
      - twitterSearchUsers(company)        [twitter channel]  ──┘
      - callLLMForJSON(synthesisPrompt)    [LLM]
   b. Update lead record: db.lead.update({ stage: 'enriched' })
5. [Progress 100%] Return AgentExecutionResult
```

### Database Operations

```typescript
// Read leads needing enrichment
const leads = await db.lead.findMany({
  where: { campaignId, stage: 'new' },
  take: 20,
});

// Update lead with enriched data
await db.lead.update({
  where: { id: lead.id },
  data: {
    ...enrichedData,        // All non-null extracted fields
    stage: 'enriched',
    enrichedAt: new Date(),
    notes: hasData ? lead.notes : '[Enriched via LLM estimates — no web data available]',
  },
});

// Update campaign count
await db.campaign.update({
  where: { id: campaignId },
  data: { leadsQualified: enrichedLeadCount },
});
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Total task execution time (20 leads) | < 8 minutes |
| Per-lead processing time | < 25 seconds |
| Channel call parallelism | 3 simultaneous (LinkedIn + Twitter) |
| LLM calls per lead | 1 (synthesis) + 0-1 (retries) |
| Database writes per lead | 1 (lead update) |
| Progress update granularity | Per-lead (5% increments for 20 leads) |
