# Crawl4AI Channel — Deep Web Crawling & Scraping

## Overview
Crawl4AI is an LLM-friendly web crawler and scraper that turns web pages into clean, structured Markdown. It provides full browser rendering (JavaScript/SPA support), deep site crawling, structured data extraction, and lead data mining capabilities.

## Installation
```bash
pip install crawl4ai
crawl4ai-setup  # Install browser
```

## Channel Functions

### Basic Crawl
```typescript
import { crawl4aiCrawl } from './agent-reach-bridge';

// Crawl a single URL with full browser rendering
const result = await crawl4aiCrawl('https://example.com', {
  outputFormat: 'all',           // 'markdown' | 'markdown-fit' | 'json' | 'all'
  screenshot: false,             // Include screenshot
  cacheMode: 'enabled',          // 'enabled' | 'disabled' | 'bypass'
  markdownGenerator: 'default',  // 'default' | 'fit' | 'bm25'
  bm25Query: 'contact info',     // For BM25 content filtering
  flattenShadowDom: true,        // Extract shadow DOM content
});
```

### Deep Crawl (Multi-page)
```typescript
import { crawl4aiDeepCrawl } from './agent-reach-bridge';

// Crawl multiple pages from a start URL
const result = await crawl4aiDeepCrawl('https://example.com', {
  strategy: 'bfs',     // 'bfs' | 'dfs' | 'bestfirst'
  maxDepth: 2,         // Maximum crawl depth
  maxPages: 10,        // Maximum pages to crawl
  query: 'contact',    // For bestfirst strategy scoring
});
```

### CSS Extraction (No LLM)
```typescript
import { crawl4aiExtractCSS } from './agent-reach-bridge';

// Extract structured data using CSS selectors
const result = await crawl4aiExtractCSS('https://example.com/team', {
  name: 'Team Members',
  baseSelector: '.team-member',
  fields: [
    { name: 'name', selector: '.name', type: 'text' },
    { name: 'title', selector: '.title', type: 'text' },
    { name: 'email', selector: 'a[href^="mailto:"]', type: 'href' },
    { name: 'linkedin', selector: 'a[href*="linkedin.com"]', type: 'href' },
  ],
});
```

### Lead Extraction
```typescript
import { crawl4aiCrawlLeads } from './agent-reach-bridge';

// Extract emails, phones, addresses, company info
const result = await crawl4aiCrawlLeads('https://example.com/about', {
  pageType: 'auto',  // 'about' | 'contact' | 'team' | 'pricing' | 'auto'
});
// Returns: { emails, phones, addresses, companyInfo, rawMarkdown }
```

### Screenshot
```typescript
import { crawl4aiScreenshot } from './agent-reach-bridge';

const result = await crawl4aiScreenshot('https://example.com', {
  fullPage: true,
  width: 1920,
  height: 1080,
});
```

### Status Check
```typescript
import { crawl4aiStatus } from './agent-reach-bridge';

const status = await crawl4aiStatus();
// Returns: { installed, version, browserReady, cliAvailable }
```

## CLI Commands
```bash
# Basic crawl
crwl https://example.com -o markdown

# Deep crawl
crwl https://example.com --deep-crawl bfs --max-pages 10

# Extract with LLM
crwl https://example.com -q "Extract all contact information"
```

## Use Cases for Lead Generation

1. **Contact Page Mining**: Extract emails, phones, addresses from contact pages
2. **About Page Analysis**: Get company description, founding year, team size
3. **Team Page Scraping**: Extract team member names, titles, LinkedIn profiles
4. **Deep Site Exploration**: Crawl entire site for all contact-related pages
5. **Pricing Page Analysis**: Extract pricing tiers for qualification
6. **Screenshot Capture**: Visual record of company website for reports

## Agent Mappings
- **Prospect Discovery**: Deep crawl target company websites for initial intelligence
- **Data Enrichment**: Extract contact data, company info, team details
- **Web Research**: Full site crawling for comprehensive research
- **Lead Qualification**: Verify contact data and company legitimacy
- **Outreach Composer**: Analyze company pages for personalized outreach
