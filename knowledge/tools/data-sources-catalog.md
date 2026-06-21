---
title: "Data Sources & Tool Catalog — Complete Reference"
slug: tool-data-sources-catalog
category: tools
tags: [data-sources, tools, apis, integrations, channels]
agents: [atlas, scout, forge, sage, judge, bard, flow, echo]
intent_types: [research_company, research_person, discover_places, enrich_lead]
priority: 92
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "The complete catalog of data sources and tools available in LeadReach — when to use each, rate limits, and integration patterns."
---

# Data Sources & Tool Catalog — Complete Reference

## 1. Overview

LeadReach integrates with **15+ external data sources** across 6 categories: place discovery, company registries, financial data, news/intent, technology detection, and geospatial utilities. Each source has strengths, weaknesses, and ideal use cases.

This document is the **single source of truth** for what data sources exist, how to use them, and when to choose each.

## 2. Source Categories

### Place Discovery (Physical Locations)
For finding businesses with physical presence (retail, agriculture, manufacturing, services).

### Company Registries (Legal Entity Data)
For verifying company existence, structure, officers, financials.

### Financial KPIs
For public company financials and stock data.

### News & Intent
For recent events, trigger detection, sentiment analysis.

### Technology Footprints
For detecting what software a company uses.

### Geospatial Utilities
For address geocoding, distance calculation, timezone detection.

## 3. Detailed Source Reference

### 3.1 Overpass API (OpenStreetMap)
**File**: `src/lib/prospect-agent/data-sources/overpass.ts`
**Functions**: `overpassSearchPlaces(query, options)`, `overpassGetPlace(id)`, `overpassPlaceToLeadFields(place)`, `overpassHealth()`
**What it does**: Queries OpenStreetMap for businesses by name, category, or location
**Best for**: 
- Finding physical businesses globally (free alternative to Google Maps)
- Agriculture suppliers with facilities
- Manufacturers with plants
- Retail stores, restaurants, service providers

**Query patterns**:
```typescript
// Find all dragonfruit exporters in Binh Thuan, Vietnam
overpassSearchPlaces({
  query: 'dragonfruit',
  bbox: [10.5, 107.5, 11.5, 108.5],  // Binh Thuan province
  category: 'shop'
});

// Find coffee shops in Seattle
overpassSearchPlaces({
  query: 'coffee',
  bbox: [47.5, -122.5, 47.7, -122.2],
  category: 'amenity'
});
```

**Rate limit**: 2 requests/second (be respectful — free service)
**Output**: Place name, address, coordinates, contact info, hours, categories
**Trust tier**: 4 (50-70)

### 3.2 Google Maps (via browser-service)
**File**: `mini-services/browser-service/routes/google-maps.ts`, `src/components/google-maps/google-maps-search.tsx`
**API route**: `/api/google-maps/search`
**Functions**: `searchPlaces(query)`, `getPlace(id)`, `discoverPlaces(query, options)`
**What it does**: Queries Google Maps for businesses
**Best for**:
- Most accurate business listings globally
- Reviews and ratings (sentiment signal)
- Photos (verify physical existence)
- Hours, contact info, website

**Rate limit**: Subject to Google Maps API quotas; browser-service provides abstraction
**Output**: Business name, address, phone, website, rating, reviews, hours, photos
**Trust tier**: 4 (50-70)
**Cost**: Google Maps API has paid tier beyond free quota

### 3.3 SEC EDGAR (US Public Companies)
**File**: `src/lib/prospect-agent/data-sources/sec-edgar.ts`
**Functions**: `edgarGetCikByTicker(ticker)`, `edgarGetCompanyInfo(cik)`, `edgarGetFilings(cik, type)`, `edgarGetInsiderTransactions(cik)`, `edgarEnrichCompany(ticker)`, `edgarHealth()`, `computeEdgarKPIs(filings)`
**What it does**: Fetches SEC filings for US public companies
**Best for**:
- Authoritative financial data (10-K, 10-Q)
- Executive compensation (DEF 14A)
- Material events (8-K)
- Insider transactions (Forms 3, 4, 5)
- Ownership structure

**Query patterns**:
```typescript
// Get Apple's most recent 10-K
const cik = await edgarGetCikByTicker('AAPL');
const filings = await edgarGetFilings(cik, '10-K');
const latest10K = filings[0];

// Get insider transactions for Tesla
const teslaCik = await edgarGetCikByTicker('TSLA');
const insiderTxns = await edgarGetInsiderTransactions(teslaCik);
```

**Rate limit**: 10 requests/second (well-documented)
**Output**: Filings in XML/JSON; financial data extracted; executive list; insider transactions
**Trust tier**: 1 (95-100) — Authoritative primary source

### 3.4 yfinance (Yahoo Finance)
**File**: `src/lib/prospect-agent/data-sources/yfinance.ts`
**Functions**: `yfinanceEnrich(ticker)`, `yfinanceSearchTicker(query)`, `yfinanceHealth()`
**What it does**: Fetches real-time stock data, financials, profile
**Best for**:
- Real-time stock price
- Historical financials (revenue, earnings, balance sheet)
- Company profile (sector, industry, employees, description)
- Quick ticker lookup

**Query patterns**:
```typescript
// Enrich Apple's profile
const appleData = await yfinanceEnrich('AAPL');
// Returns: { quote: {...}, profile: {...}, financials: {...} }

// Search for a company by name
const results = await yfinanceSearchTicker('Tesla');
```

**Rate limit**: Yahoo Finance unofficial API; be respectful (1 req/sec)
**Output**: Quote (price, market cap, P/E), profile (sector, industry, employees, description), financials (income statement, balance sheet, cash flow)
**Trust tier**: 2 (80-90) for public company data
**Note**: Only useful for publicly traded companies

### 3.5 OpenCorporates (Global Registry)
**File**: `src/lib/prospect-agent/data-sources/opencorporates.ts`
**Functions**: `ocSearchCompanies(query)`, `ocGetCompany(id)`, `ocEnrichByName(name)`, `ocHealth()`, `ocOfficerToPersonLeadFields(officer)`
**What it does**: Queries global corporate registry data
**Best for**:
- Company legal existence verification
- Officer/director lists
- Filing history
- Cross-border company research

**Query patterns**:
```typescript
// Search for a company
const results = await ocSearchCompanies({ query: 'Acme Corp' });

// Enrich by name (finds + gets details)
const enriched = await ocEnrichByName('Acme Corp');

// Get specific company by OpenCorporates ID
const company = await ocGetCompany('us_de/acme-corp');
```

**Rate limit**: Free tier 500 req/month; paid tiers higher
**Output**: Legal name, jurisdiction, incorporation date, status, officers, filings
**Trust tier**: 1 (95-100) — Government registry aggregator

### 3.6 PublicWWW (Technology Detection)
**File**: `src/lib/prospect-agent/data-sources/publicwww.ts`
**Functions**: `publicWwwSearch(query, options)`, `publicWwwDiscoverByTechnology(tech)`, `publicWwwHealth()`
**What it does**: Searches HTML/CSS/JS source code across millions of websites
**Best for**:
- Discovering companies using specific tech (reverse tech stack search)
- Detecting what tech a specific website uses
- Finding companies by technology fingerprint

**Query patterns**:
```typescript
// Find all sites using Salesforce
const salesforceUsers = await publicWwwDiscoverByTechnology('salesforce');

// Search for a specific code snippet
const results = await publicWwwSearch({
  query: 'stripe.com/v3/',
  limit: 50
});

// Find sites using both Stripe AND HubSpot
const results = await publicWwwSearch({
  query: 'stripe.com AND js.hs-scripts.com',
  limit: 50
});
```

**Rate limit**: Free tier 50 req/month; paid tiers higher
**Output**: URL, snippet, technology detected
**Trust tier**: 4 (50-70) — Aggregator
**Caveat**: Only detects frontend tech; backend tech not visible from HTML

### 3.7 Geocoder (Nominatim)
**File**: `src/lib/prospect-agent/data-sources/geocoder.ts`
**Functions**: `geocodeForward(address)`, `geocodeReverse(lat, lng)`, `haversineDistance(a, b)`, `computeDistanceKpi(from, to)`, `roughTimezoneFromLongitude(lng)`, `geocoderHealth()`
**What it does**: Geocodes addresses to lat/lng and vice versa
**Best for**:
- Converting addresses to coordinates
- Calculating distances between locations
- Estimating timezones from longitude
- Verifying address validity

**Query patterns**:
```typescript
// Geocode an address
const result = await geocodeForward('1 Infinite Loop, Cupertino, CA');
// Returns: { lat: 37.3318, lng: -122.0312, formatted_address: '...', ... }

// Calculate distance
const dist = haversineDistance(
  { lat: 37.3318, lng: -122.0312 },  // Apple HQ
  { lat: 47.6395, lng: -122.1283 }   // Microsoft HQ
);
// Returns: ~1,300 km

// Estimate timezone from longitude
const tz = roughTimezoneFromLongitude(-122.0312);
// Returns: 'America/Los_Angeles' (approximately)
```

**Rate limit**: 1 req/sec per Nominatim usage policy
**Output**: Lat/lng, formatted address, bounding box
**Trust tier**: 3 (70-85) for geocoding accuracy

### 3.8 News Worker (Newspaper3k Python sidecar)
**File**: `src/lib/prospect-agent/data-sources/news-worker.ts`, `python-workers/news-worker/main.py`
**Functions**: `newsExtractArticle(url)`, `newsExtractBatch(urls)`, `newsSearchIntent(query)`, `newsAnalyzeSentiment(text)`, `newsHealth()`, `newsIntentToKPIs(intent)`
**What it does**: Extracts article content; analyzes sentiment; classifies intent
**Best for**:
- Extracting clean text from news articles (Newspaper3k is excellent)
- Sentiment analysis on prospect mentions
- Trigger event detection from news

**Query patterns**:
```typescript
// Extract an article
const article = await newsExtractArticle('https://techcrunch.com/2026/...');
// Returns: { title, authors, publish_date, text, summary, keywords }

// Analyze sentiment of a recent prospect mention
const sentiment = await newsAnalyzeSentiment(article.text);
// Returns: { sentiment: 'positive'|'negative'|'neutral', score: 0.85, ... }
```

**Rate limit**: Subject to source websites' rate limits; Newspaper3k is polite
**Output**: Article title, authors, publish date, full text, summary, keywords, sentiment
**Trust tier**: 3 (70-85) for news content

### 3.9 Exa Search (Web Search)
**File**: `src/lib/exa-sdk.ts`, `src/lib/agent-reach-bridge.ts`
**Functions**: `exaSearch(query, options)`, `linkedInSearchCompanies(query)`, `linkedInSearchPeople(query)`
**What it does**: Web search via Exa API; LinkedIn search via agent-reach bridge
**Best for**:
- Broad web search
- Finding company websites
- Recent news mentions
- Academic / industry research

**Rate limit**: Exa free tier ~100 req/hour
**Output**: URLs, snippets, full content (if requested)
**Trust tier**: 3 (70-85) for general web content

### 3.10 Direct Search (DuckDuckGo + Bing Fallback)
**File**: `src/lib/direct-search.ts`
**Functions**: Direct search utilities
**What it does**: Search without relying on Jina Reader (which can be rate-limited)
**Best for**: Fallback when Exa is rate-limited; quick searches

### 3.11 Crawl4AI (Deep Web Crawling)
**File**: `src/lib/crawl4ai.ts`, `mini-services/scraper-service/app/services/scrapy_service.py`
**Functions**: Deep web crawling with Playwright-based rendering
**Best for**:
- JavaScript-heavy sites
- Sites that block simple HTTP requests
- Dynamic content (infinite scroll, AJAX-loaded content)

### 3.12 ScrapeGraph Bridge (AI-Powered Scraping)
**File**: `src/lib/scrapegraph-bridge.ts`, `scrapegraph-service/server.py`
**API routes**: `/api/scrapegraph/scrape`, `/api/scrapegraph/smart-scraper`, `/api/scrapegraph/multi-scraper`, `/api/scrapegraph/extract-company`, `/api/scrapegraph/search`, `/api/scrapegraph/script-creator`
**What it does**: AI-powered scraping using scrapegraphai library
**Best for**:
- Extracting structured data from unstructured pages
- Company info extraction from any website
- Smart scraping with prompt-based extraction

### 3.13 Agent Reach Toolkit (Multi-channel)
**File**: `src/lib/agent-reach.ts`, `src/lib/agent-reach-bridge.ts`, `agent-reach-toolkit/`
**Channels**: RSS, Reddit, Exa, GitHub, Weibo, V2EX, Exa SDK, Web, Xueqiu, Bilibili, crawl4ai, LinkedIn, Xiaoyuzhou, Twitter, WeChat, Douyin, YouTube, Xiaohongshu
**Best for**: Multi-channel research across social media, code repos, video platforms

### 3.14 PyGen Leads (Python Lead Generation)
**File**: `python-genleads/service.py`, `src/lib/pygenleads.ts`
**API route**: `/api/pygenleads`
**What it does**: Python-based lead generation service
**Best for**: Bulk lead generation; specialized lead-gen algorithms

### 3.15 Vellum Core (Internal Agent Infrastructure)
**Files**: `src/lib/vellum-core/` (multiple modules)
**Modules**: agent-loop, bridge, channels, compaction, cooldown-manager, event-bus, mcp, memory, permissions, plugins, proactivity, skills, streaming, tool-registry, z-ai-provider
**What it does**: Internal infrastructure for agent orchestration
**Used by**: All agents internally

## 4. Source Selection Strategy

### For Company Discovery
1. **If public US company**: Start with SEC EDGAR → yfinance → LinkedIn → company website
2. **If private company**: LinkedIn → OpenCorporates → company website → Crunchbase
3. **If physical business**: Google Maps / Overpass → company website → LinkedIn
4. **If international**: OpenCorporates → national registry → LinkedIn → company website

### For Person Discovery
1. **If name + company known**: LinkedIn → company website "Team" page → news search
2. **If name only**: LinkedIn → news search → conference talk search → podcast search
3. **If technical person**: Add GitHub → Twitter/X → dev.to → Medium

### For Trigger Event Detection
1. News Worker for news mentions
2. SEC EDGAR (8-K) for material events
3. LinkedIn for executive changes
4. Crunchbase for funding rounds
5. Twitter/X for real-time signals

### For Tech Stack Detection
1. PublicWWW for HTML/JS fingerprints
2. BuiltWith (paid) for comprehensive tech stack
3. Job postings for backend tech inference
4. DNS records for hosting/email infrastructure

## 5. Rate Limit Strategy

### Per-Source Limits
| Source | Free Tier Limit | Paid Tier Limit | Backoff Strategy |
|--------|----------------|----------------|------------------|
| Overpass | 2 req/sec | N/A | Exponential 1s/2s/4s |
| Google Maps API | 28K req/month | Per-request pricing | Exponential 5s/10s/20s |
| SEC EDGAR | 10 req/sec | N/A | None needed |
| yfinance | ~1 req/sec (unofficial) | N/A | Exponential 2s/4s/8s |
| OpenCorporates | 500 req/month | 5K-50K req/month | Daily quota — fail gracefully |
| PublicWWW | 50 req/month | 1K-50K req/month | Daily quota — fail gracefully |
| Nominatim | 1 req/sec | N/A | Exponential 1s/2s/4s |
| News Worker | Subject to source sites | N/A | Exponential 2s/4s/8s |
| Exa | ~100 req/hour | Higher on paid | Exponential 5s/10s/20s |

### Cross-Source Strategy
- **Parallelize** independent requests across sources (Promise.all)
- **Sequential** when one source's results inform the next query
- **Cache aggressively** — don't re-fetch the same URL within 24 hours
- **Fail gracefully** — if one source fails, continue with others; don't crash the pipeline

## 6. Integration Patterns

### Pattern 1: Enrichment Pipeline
```typescript
// Forge enrichment flow
async function enrichCompany(seed: { name: string; website?: string }) {
  // 1. Resolve identity (parallel)
  const [linkedinResult, opencorporatesResult] = await Promise.all([
    linkedInSearchCompanies(seed.name),
    ocEnrichByName(seed.name),
  ]);
  
  // 2. Get firmographics (parallel, dependent on #1)
  const [edgarResult, yfinanceResult] = await Promise.all([
    seed.stock_ticker ? edgarEnrichCompany(seed.stock_ticker) : null,
    seed.stock_ticker ? yfinanceEnrich(seed.stock_ticker) : null,
  ]);
  
  // 3. Get technographics (parallel, independent)
  const [publicwwwResult, newsResult] = await Promise.all([
    seed.website ? publicWwwSearch({ query: seed.website, limit: 50 }) : null,
    newsSearchIntent(`${seed.name} ${seed.website ?? ''}`),
  ]);
  
  // 4. Geocode headquarters
  const address = opencorporatesResult?.address ?? edgarResult?.address;
  const geocoded = address ? await geocodeForward(address) : null;
  
  // 5. Merge results with conflict resolution
  return mergeEnrichmentResults({
    linkedin: linkedinResult,
    opencorporates: opencorporatesResult,
    edgar: edgarResult,
    yfinance: yfinanceResult,
    publicwww: publicwwwResult,
    news: newsResult,
    geocoded,
  });
}
```

### Pattern 2: Discovery Pipeline
```typescript
// Scout discovery flow for "dragonfruit suppliers in Vietnam"
async function discoverDragonfruitSuppliers() {
  // Parallel: try multiple channels
  const [places, news, directories, customs] = await Promise.allSettled([
    overpassSearchPlaces({ query: 'dragonfruit', bbox: vietnamBbox }),
    newsSearchIntent('dragonfruit Vietnam export'),
    exaSearch('Vietnam dragonfruit exporters site:vietrade.gov.vn OR site:vasep.com.vn'),
    exaSearch('Vietnam dragonfruit HS 0810.40 customs'),
  ]);
  
  // Aggregate, deduplicate, score quality
  const allResults = [];
  if (places.status === 'fulfilled') allResults.push(...places.value);
  if (news.status === 'fulfilled') allResults.push(...extractCompaniesFromNews(news.value));
  if (directories.status === 'fulfilled') allResults.push(...extractFromSearch(directories.value));
  if (customs.status === 'fulfilled') allResults.push(...extractFromSearch(customs.value));
  
  const deduped = deduplicateCompanies(allResults);
  return deduped;
}
```

### Pattern 3: Trigger Event Monitoring
```typescript
// Sage trigger detection for a single company
async function detectTriggers(company: Company): Promise<TriggerEvent[]> {
  const triggers: TriggerEvent[] = [];
  
  // Parallel: multiple signal sources
  const [news, edgarFilings, linkedinChanges] = await Promise.allSettled([
    newsSearchIntent(company.name),
    company.stock_ticker ? edgarGetFilings(await edgarGetCikByTicker(company.stock_ticker), '8-K') : null,
    detectLinkedInChanges(company.linkedin_url),
  ]);
  
  if (news.status === 'fulfilled') {
    triggers.push(...classifyNewsAsTriggers(news.value, company));
  }
  if (edgarFilings.status === 'fulfilled' && edgarFilings.value) {
    triggers.push(...classifyFilingsAsTriggers(edgarFilings.value));
  }
  if (linkedinChanges.status === 'fulfilled') {
    triggers.push(...classifyLinkedInChanges(linkedinChanges.value));
  }
  
  return triggers.sort((a, b) => b.combined_score - a.combined_score);
}
```

## 7. Health Check Pattern

The `checkAllDataSources()` function runs a unified health check across all sources in parallel:

```typescript
const health = await checkAllDataSources();
// Returns:
// {
//   overpass: { status: 'ok', latencyMs: 234 },
//   edgar: { status: 'ok', latencyMs: 89 },
//   yfinance: { status: 'ok', latencyMs: 156 },
//   opencorporates: { status: 'ok', apiTokenUsed: true, latencyMs: 412 },
//   publicwww: { status: 'ok', apiStatus: { requestsUsed: 234, requestsLimit: 1000, requestsRemaining: 766 } },
//   geocoder: { status: 'ok', latencyMs: 198 },
//   newsWorker: { status: 'ok', newspaperAvailable: true, spacyAvailable: true },
//   timestamp: '2026-06-22T12:00:00Z'
// }
```

This is exposed via `/api/data-sources/health` for monitoring.

## 8. Adding a New Data Source

To add a new data source:

1. **Create the module** at `src/lib/prospect-agent/data-sources/<name>.ts`
2. **Export**:
   - `<name>Health()` function returning `{ status: 'ok' | 'error', ...details }`
   - Action functions (search, get, enrich)
   - Types for inputs/outputs
3. **Register** in `src/lib/prospect-agent/data-sources/index.ts`:
   - Add re-exports
   - Add to `checkAllDataSources()` if appropriate
4. **Add URL guard** if the source makes HTTP requests (use `safeFetch()` from `src/lib/url-guard.ts`)
5. **Add tests** in `scripts/` directory
6. **Document** in this file (add to section 3 above)
7. **Add knowledge** — if this source has industry/region specializations, add to relevant knowledge files

## 9. Compliance Considerations

### Data Minimization
Only fetch what you need. Don't pull all EDGAR filings when you only need the latest 10-K.

### Source Attribution
Every fetched data point must record its source (URL, fetch timestamp). This is essential for:
- GDPR compliance (data subject access requests)
- Conflict resolution (which source to trust)
- Audit trails

### Rate Limit Respect
Don't DOS a free service. Overpass, Nominatim, and SEC EDGAR are public goods — be respectful.

### Personal Data Handling
- Public professional information (work email, work phone, title): generally OK to collect
- Personal information (home address, personal phone): generally NOT OK
- Special category data (health, religion, politics): NEVER collect (GDPR Article 9)

## 10. Performance Benchmarks

Expected latencies (cold cache):
- Overpass search: 500-2000ms
- Google Maps search: 200-1000ms
- SEC EDGAR lookup: 100-500ms
- yfinance enrich: 500-2000ms
- OpenCorporates search: 500-1500ms
- PublicWWW search: 1000-3000ms
- Geocoder: 200-800ms
- News Worker extract: 2000-5000ms (depends on article size)

Total enrichment time for a single prospect: 3-15 seconds (parallel)
Total discovery time for 100 prospects: 30-90 seconds (parallel + paginated)
