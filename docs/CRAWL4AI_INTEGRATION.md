# Crawl4AI Integration

This document describes the deep integration of [`unclecode/crawl4ai`](https://github.com/unclecode/crawl4ai) (v0.9.0) into the Agent Reach / LeadReach platform.

## What is Crawl4AI?

Crawl4AI is an open-source LLM-friendly web crawler & scraper that turns the web into clean, structured Markdown for RAG, agents, and data pipelines. It provides:

- **Full browser rendering** (Playwright + Patchright) — JS-heavy SPAs, dynamic content, lazy-load
- **LLM-ready Markdown** — clean, structured markdown with headings, tables, code blocks
- **Structured data extraction** — CSS selectors, XPath, LLM-based, Regex
- **Deep crawling** — BFS / DFS / BestFirst strategies with keyword scoring for multi-page site exploration
- **Anti-bot detection** — stealth mode (Patchright undetected), proxy escalation, user-agent rotation
- **Screenshot & PDF capture** — full-page, high-resolution
- **Sitemap generation** — discover all URLs on a site via deep crawl
- **Content filtering** — Pruning (relevance-scored) and BM25 (query-relevance)
- **Chunking strategies** — Regex, SlidingWindow, OverlappingWindow, FixedWord, NlpSentence, TopicSegmentation
- **Shadow DOM flattening** — extracts content from web components
- **Session management** — preserve browser state for multi-step crawling
- **Built-in caching** — faster repeat crawls

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Next.js App (TypeScript)                                            │
│                                                                      │
│  src/lib/crawl4ai.ts        ← TypeScript API (HTTP client)           │
│  src/lib/agent-reach-bridge.ts  ← exposes crawl4ai as a channel      │
│  src/lib/agent-executor.ts  ← smartWebRead + crawl4aiLeads in        │
│                                DataEnrichment + WebResearch agents   │
│  src/app/api/crawl4ai/route.ts  ← REST API: POST /api/crawl4ai       │
│  src/instrumentation.ts     ← auto-starts service on Next.js boot    │
│                                                                      │
│         │ fetch http://127.0.0.1:8765/*                              │
│         ▼                                                             │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  crawl4ai-service (long-lived Python HTTP server)                    │
│                                                                      │
│  lib/crawl4ai-service/server.py    ← HTTP endpoints                  │
│  lib/crawl4ai-service/start-service.sh  ← daemon launcher            │
│                                                                      │
│  Endpoints:                                                          │
│    GET  /health                                                      │
│    POST /crawl            POST /deep-crawl                           │
│    POST /extract-css      POST /extract-xpath                        │
│    POST /extract-llm      POST /extract-regex                        │
│    POST /screenshot       POST /pdf                                  │
│    POST /sitemap          GET  /shutdown                             │
│                                                                      │
│         │ import crawl4ai (editable install)                         │
│         ▼                                                             │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  Vendored crawl4ai 0.9.0 source (39 MB, committed to repo)           │
│                                                                      │
│  lib/crawl4ai-source/                                                │
│    crawl4ai/                ← Python package (editable install)      │
│    pyproject.toml           ← package metadata + entry points        │
│    README.md                ← upstream docs                          │
│    docs/                    ← upstream documentation                 │
│                                                                      │
│  Editable install: `pip install -e lib/crawl4ai-source/`             │
│  (installed in /home/z/.venv/)                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Why an HTTP Service Instead of Per-Call Subprocess?

The original `src/lib/crawl4ai.ts` (v1) called `crwl` CLI via `child_process.exec` for each crawl. This had several problems:

1. **Slow startup**: Each call paid 1–3s for Python interpreter init + Playwright launch + AsyncWebCrawler warm-up
2. **Buffer cap**: `exec()` has a 20MB max buffer — deep-crawl responses (multi-page markdown) easily exceed this
3. **No browser reuse**: Each call spawned a fresh browser, missing Playwright's connection pool

The new HTTP service (v2):

- Pays the startup cost **once** at boot (~3s)
- Keeps a single `AsyncWebCrawler` instance warm (with internal browser pool)
- Streams large responses over HTTP (no buffer cap)
- Exposes a single health-checkable endpoint (`GET /health`)
- Auto-starts when Next.js boots (via `src/instrumentation.ts`)
- Calls from TypeScript take ~50–500ms instead of ~2–3s

## Why Vendor the Source?

We vendor the entire `unclecode/crawl4ai` repository at `lib/crawl4ai-source/` for several reasons:

1. **Offline access**: The platform has full access to crawl4ai's API without depending on PyPI at runtime
2. **Version pinning**: We control exactly which version (0.9.0) is used — no surprise breaking changes from `pip install crawl4ai`
3. **Customization**: We can patch the source if needed (e.g., to add new extraction strategies)
4. **Auditability**: The full source is visible in our repo — security review and code audits can inspect every line
5. **Editable install**: We install it via `pip install -e lib/crawl4ai-source/` so any local edits take effect immediately without reinstalling

## Quick Start

### 1. Start the service manually

```bash
./lib/crawl4ai-service/start-service.sh --bg
```

### 2. Verify it's running

```bash
curl http://127.0.0.1:8765/health
# → {"status": "ok", "version": "...", "browser_ready": true, ...}
```

### 3. Use it from TypeScript

```typescript
import { crawlUrl, extractWithCSS, extractWithLLM, deepCrawl } from '@/lib/crawl4ai';

// Basic crawl
const r = await crawlUrl('https://example.com');
console.log(r.data?.markdown);
console.log(r.data?.metadata.title);

// CSS extraction
const stories = await extractWithCSS(
  'https://news.ycombinator.com/',
  {
    baseSelector: '.athing',
    fields: [
      { name: 'title', selector: '.titleline > a', type: 'text' },
      { name: 'url', selector: '.titleline > a', type: 'attribute', attribute: 'href' },
    ],
  },
);

// LLM extraction (Z.AI GLM-4.7-flash by default)
const data = await extractWithLLM(
  'https://example.com/about',
  'Extract the company name, founding year, and CEO name as JSON.',
);

// Deep crawl (BFS, up to 10 pages, max depth 2)
const deep = await deepCrawl('https://example.com', { strategy: 'bfs', maxPages: 10, maxDepth: 2 });
console.log(deep.pages.length, 'pages crawled');
```

### 4. Use it via REST API

```bash
# Basic crawl
curl -X POST http://127.0.0.1:8765/crawl \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'

# CSS extraction
curl -X POST http://127.0.0.1:8765/extract-css \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://news.ycombinator.com/","schema":{"baseSelector":".athing","fields":[{"name":"title","selector":".titleline > a","type":"text"}]}}'

# LLM extraction (uses Z.AI GLM-4.7-flash)
curl -X POST http://127.0.0.1:8765/extract-llm \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","instruction":"Extract the title as JSON."}'

# Screenshot
curl -X POST http://127.0.0.1:8765/screenshot \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```

Or via the Next.js API route:

```bash
curl -X POST http://localhost:3000/api/crawl4ai \
  -H 'Content-Type: application/json' \
  -d '{"operation":"crawl","url":"https://example.com"}'
```

## Auto-Start on Next.js Boot

The service auto-starts when Next.js boots, via `src/instrumentation.ts`. This means:

- No manual setup needed — `npm run dev` or `npm start` will start the service automatically
- If the service fails to start (e.g., missing Python deps), the platform still works — crawl4ai calls will fail gracefully and fall back to `webRead` (Jina Reader)
- The auto-start fires 2 seconds after Next.js boots (to let the Next.js server stabilize first)

## Agent Integration

### Agent Reach Channel

Crawl4AI is registered as a first-class channel in `src/lib/agent-reach.ts`:

```typescript
{
  name: 'crawl4ai',
  displayName: 'Crawl4AI',
  description: 'Deep web crawler & LLM-ready extractor (unclecode/crawl4ai 0.9.0)...',
  status: 'ok',
  tier: 0,  // zero-config
  backend: 'unclecode/crawl4ai (vendored at lib/crawl4ai-source/)',
}
```

Agents that previously used only `web` (Jina Reader) now also have access to `crawl4ai`:

| Agent            | Channels (with crawl4ai)                                        |
|------------------|------------------------------------------------------------------|
| prospect-discovery | `exa_search`, `web`, **`crawl4ai`**, `linkedin`, `github`, `twitter`, `reddit` |
| data-enrichment  | **`crawl4ai`**, `web`, `linkedin`, `exa_search`, `twitter`, `github` |
| web-research     | **`crawl4ai`**, `web`, `exa_search`, `linkedin`, `twitter`, `youtube`, `reddit`, `rss` |
| lead-qualification | **`crawl4ai`**, `web`, `linkedin`, `exa_search`                |
| outreach-composer | `linkedin`, `web`, **`crawl4ai`**, `exa_search`                |

### `smartWebRead` — automatic backend selection

The agent executor (`src/lib/agent-executor.ts`) introduces a `smartWebRead` helper that picks the best backend per-URL:

1. **Try `webRead` first** (fast — direct fetch + Jina Reader fallback)
2. **If the result is thin (<800 chars) OR the URL is on a known JS-heavy domain**, fall back to `crawl4aiRead` (full JS rendering via Playwright)
3. **If `crawl4aiRead` also fails**, return whatever `webRead` gave us

JS-heavy domains in the priority list:
- `linkedin.com`, `twitter.com`, `x.com`, `reddit.com`
- `instagram.com`, `facebook.com`, `tiktok.com`
- `ycombinator.com`, `producthunt.com`, `crunchbase.com`
- `bloomberg.com`, `nytimes.com`, `washingtonpost.com`
- `medium.com`, `substack.com`, `notion.so`, `airtable.com`

URLs containing `/app/`, `/dashboard/`, `/portal/`, `/login/`, `/signup/`, `/cart/`, `/checkout/` also trigger crawl4ai.

### `crawl4aiLeads` — contact signal extraction

The DataEnrichment agent (Forge) now uses `crawl4aiLeads` in parallel with `smartWebRead` when reading a company website. This extracts:

- **Emails** (regex: `[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}`)
- **Phone numbers** (international format)
- **LinkedIn URLs** (profiles + company pages)
- **Twitter/X URLs**

These signals are appended to the website intel and passed to the LLM for outreach composition.

## TypeScript API Reference

### Core functions

```typescript
// Basic crawl — returns markdown + metadata + links + media
crawlUrl(url, options?): Promise<{ success, data: Crawl4AIResult | null, error? }>

// Advanced crawl — adds content filtering (fit / bm25)
crawlUrlAdvanced(url, options?): Promise<{ success, data, error? }>

// Deep crawl — multi-page BFS/DFS/BestFirst
deepCrawl(url, options?): Promise<{ success, pages: Crawl4AIResult[], error? }>

// Structured extraction
extractWithCSS(url, schema, options?): Promise<{ success, data, raw, error? }>
extractWithXPath(url, schema, options?): Promise<{ success, data, raw, error? }>
extractWithLLM(url, instruction, options?): Promise<{ success, data, raw, error? }>
extractWithRegex(url, pattern, options?): Promise<{ success, data, raw, error? }>

// Visual capture
takeScreenshot(url, options?): Promise<{ success, screenshot: string (base64 PNG), error? }>
capturePdf(url, options?): Promise<{ success, pdf: string (base64 PDF), error? }>

// Site mapping
generateSitemap(url, options?): Promise<Crawl4AISiteMap>

// Lead discovery
crawlForLeads(url, options?): Promise<{ success, leads, companyInfo, pagesCrawled, rawContent, error? }>

// Status / lifecycle
checkCrawl4AIStatus(): Promise<Crawl4AIStatusResult>
ensureServiceRunning(): Promise<boolean>
isServiceRunning(): Promise<boolean>

// Generic dispatcher (used by agent-reach channel)
executeCrawl4AIOperation(operation, params): Promise<Crawl4AIChannelResult>
```

### CrawlerRunOptions

```typescript
interface CrawlerRunOptions {
  waitFor?: string;                  // CSS selector to wait for
  pageTimeout?: number;              // ms (default 60000)
  waitUntil?: 'domcontentloaded' | 'load' | 'networkidle';
  jsCode?: string | string[];        // JS to execute before scraping
  sessionId?: string;                // reuse browser session
  magic?: boolean;                   // auto-handle overlays, simulate user
  stealth?: boolean;                 // Patchright undetected browser
  headless?: boolean;                // default true
  screenshot?: boolean;
  pdf?: boolean;
  bypassCache?: boolean;             // default true
  removeOverlayElements?: boolean;
  scanFullPage?: boolean;            // scroll through lazy-load content
  processIframes?: boolean;
  cssSelector?: string;              // scope to a part of the page
  userAgent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  wordCountThreshold?: number;
  headers?: Record<string, string>;
  delayBeforeReturnHtml?: number;    // seconds
}
```

## HTTP Service Reference

### Endpoints

| Method | Path             | Description                                |
|--------|------------------|--------------------------------------------|
| GET    | `/health`        | Health check + version info                |
| POST   | `/crawl`         | Single URL crawl                           |
| POST   | `/deep-crawl`    | Multi-page BFS/DFS/BestFirst crawl         |
| POST   | `/extract-css`   | JsonCssExtractionStrategy                  |
| POST   | `/extract-xpath` | JsonXPathExtractionStrategy                |
| POST   | `/extract-llm`   | LLMExtractionStrategy (Z.AI GLM by default)|
| POST   | `/extract-regex` | RegexExtractionStrategy                    |
| POST   | `/screenshot`    | Full-page PNG screenshot                   |
| POST   | `/pdf`           | Full-page PDF                              |
| POST   | `/sitemap`       | Deep crawl returning URLs/titles/depths    |
| GET    | `/shutdown`      | Graceful shutdown                          |

### POST /crawl

```json
{
  "url": "https://example.com",
  "browser_config": { "headless": true, "viewport_width": 1280 },
  "crawler_config": {
    "bypass_cache": true,
    "wait_for": "selector",
    "page_timeout": 60000,
    "js_code": "window.scrollTo(0, document.body.scrollHeight)",
    "magic": true,
    "scan_full_page": true,
    "screenshot": false,
    "extraction": { "type": "css", "schema": {} }
  }
}
```

Response: full `ServiceCrawlResponse` with `markdown`, `markdown_fit`, `html`, `cleaned_html`, `media`, `links`, `metadata`, `extracted_content`, `screenshot`, `pdf`, `error_message`.

## Updating crawl4ai

To update to a newer version of crawl4ai:

```bash
# 1. Remove the old vendored source
rm -rf lib/crawl4ai-source/

# 2. Clone the new version (replace `main` with a tag like `v0.10.0` if you want a specific release)
git clone --depth 1 --branch main https://github.com/unclecode/crawl4ai.git lib/crawl4ai-source/

# 3. Remove the upstream .git folder (we don't want a nested git repo)
rm -rf lib/crawl4ai-source/.git

# 4. Reinstall in editable mode
/home/z/.venv/bin/pip3 install -e lib/crawl4ai-source/

# 5. Run the setup script
/home/z/.venv/bin/crawl4ai-setup

# 6. Restart the service
pkill -f crawl4ai-service; sleep 2
./lib/crawl4ai-service/start-service.sh --bg

# 7. Verify
curl http://127.0.0.1:8765/health
```

## Troubleshooting

### Service won't start

1. Check the log: `tail -50 lib/crawl4ai-service/server.log`
2. Verify Python deps: `/home/z/.venv/bin/pip3 show crawl4ai`
3. Re-run setup: `/home/z/.venv/bin/crawl4ai-setup`
4. Install Playwright browsers: `/home/z/.venv/bin/python3 -m playwright install chromium`

### Crawl returns empty markdown

1. Try with `magic: true` — handles consent popups and overlays
2. Try with `scanFullPage: true` — scrolls through lazy-loaded content
3. Try with a `waitFor` selector — waits for specific content to render
4. Check if the site blocks headless browsers — try `stealth: true`

### LLM extraction fails

1. Verify `ZHIPU_API_KEY` is set in `.env`
2. The default model is `glm-4.7-flash` via the OpenAI-compatible endpoint
3. Check the service log for litellm errors: `tail -50 lib/crawl4ai-service/server.log`
4. Try a different model: `extractWithLLM(url, instruction, { provider: 'openai/glm-4.6v-flash' })`

### Service dies between requests

The service is a long-lived process. If it dies:

1. Check the log for OOM or Playwright crashes
2. Restart it: `./lib/crawl4ai-service/start-service.sh --bg`
3. The Next.js instrumentation will also try to restart it on the next server boot

## Files Modified / Added

### Added

- `lib/crawl4ai-source/` — vendored unclecode/crawl4ai 0.9.0 (39 MB, full repo)
- `lib/crawl4ai-service/server.py` — long-lived HTTP service exposing crawl4ai's API
- `lib/crawl4ai-service/start-service.sh` — daemon launcher script
- `scripts/test-crawl4ai.py` — Python smoke test (basic crawl, CSS extraction, deep crawl)
- `scripts/test-crawl4ai-ts.ts` — TypeScript end-to-end smoke test
- `docs/CRAWL4AI_INTEGRATION.md` — this document

### Modified

- `src/lib/crawl4ai.ts` — rewritten from subprocess-based to HTTP-service-backed
- `src/lib/agent-reach.ts` — registered `crawl4ai` as a first-class channel
- `src/lib/agent-reach-bridge.ts` — added `crawl4aiRead`, `crawl4aiDeepRead`, `crawl4aiExtract`, `crawl4aiLLMExtract`, `crawl4aiLeads`, `crawl4aiScreenshot`, `crawl4aiSitemap`, `crawl4aiStatus` exports
- `src/lib/agent-executor.ts` — added `smartWebRead` helper, integrated crawl4ai into WebResearch and DataEnrichment agents
- `src/app/api/crawl4ai/route.ts` — updated to actually use crawl4ai (was using Jina Reader before)
- `src/instrumentation.ts` — auto-starts crawl4ai service on Next.js boot
- `.gitignore` — added crawl4ai-related exclusions
- `.env.example` — documented CRAWL4AI_SERVICE_URL / HOST / PORT vars

## License

The vendored `lib/crawl4ai-source/` is licensed under the Apache-2.0 License (upstream). See `lib/crawl4ai-source/LICENSE` for details.
