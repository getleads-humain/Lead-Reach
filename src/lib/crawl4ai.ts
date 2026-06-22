/**
 * Crawl4AI Integration Module (v2 — HTTP Service Backed)
 * =======================================================
 *
 * Integrates the unclecode/crawl4ai 0.9.x library into the Agent Reach platform.
 * The full crawl4ai Python package is vendored at `lib/crawl4ai-source/` (editable
 * install) and exposed via a long-lived local HTTP service at `lib/crawl4ai-service/`
 * that listens on `127.0.0.1:8765`.
 *
 * Why an HTTP service instead of per-call subprocess?
 *  - Per-call subprocess (old v1 implementation) had ~1-3s startup overhead per
 *    crawl (Python init + Playwright launch + AsyncWebCrawler warm-up). The
 *    service pays that cost ONCE at boot and every subsequent crawl is ~10x faster.
 *  - The shared AsyncWebCrawler keeps a browser pool warm for concurrent crawls.
 *  - Deep-crawl responses (multi-page) can easily exceed the 20MB exec() buffer
 *    cap; HTTP streaming handles them cleanly.
 *  - Single health-checkable endpoint — Next.js can probe `/health` on boot.
 *
 * Capabilities exposed (matching crawl4ai 0.9.0):
 *  - Single URL crawl with markdown + cleaned HTML + media + links + metadata
 *  - Deep crawling (BFS / DFS / BestFirst with keyword scorer)
 *  - Structured extraction: CSS selectors, XPath, LLM-based, Regex
 *  - Content filtering: Pruning, BM25 (query-relevance)
 *  - Chunking: Regex, SlidingWindow, OverlappingWindow, FixedWord, NlpSentence, Topic
 *  - Screenshot capture (full-page PNG, base64)
 *  - PDF capture (base64)
 *  - Sitemap generation (deep crawl returning URLs/titles/depth)
 *  - JavaScript execution before extraction (for SPA / dynamic content)
 *  - Wait-for selector / wait-until domcontentloaded|load|networkidle
 *  - Proxy support (per-request)
 *  - Stealth mode (Patchright undetected browser) via browser_config.enable_stealth
 *  - Magic mode (auto-handle consent popups, overlays, user simulation)
 *
 * Start the service:   `./lib/crawl4ai-service/start-service.sh --bg`
 * Verify:              `curl http://127.0.0.1:8765/health`
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

// ============================================================
// Configuration
// ============================================================

const CRAWL4AI_SERVICE_URL =
  process.env.CRAWL4AI_SERVICE_URL ||
  'http://127.0.0.1:8765';

const CRAWL4AI_SERVICE_HOST = process.env.CRAWL4AI_SERVICE_HOST || '127.0.0.1';
const CRAWL4AI_SERVICE_PORT = parseInt(process.env.CRAWL4AI_SERVICE_PORT || '8765', 10);
const SERVICE_STARTUP_SCRIPT = '/home/z/my-project/lib/crawl4ai-service/start-service.sh';
const SERVICE_LOG_FILE = '/home/z/my-project/lib/crawl4ai-service/server.log';
const SERVICE_PID_FILE = '/home/z/my-project/lib/crawl4ai-service/server.pid';

const REQUEST_TIMEOUT = 90_000;       // 90s for normal crawl ops
const DEEP_CRAWL_TIMEOUT = 300_000;   // 5 min for deep crawls
const HEALTH_CHECK_TIMEOUT = 5_000;
const SERVICE_STARTUP_GRACE = 8_000;

// ============================================================
// Types
// ============================================================

export interface Crawl4AIResult {
  url: string;
  markdown: string;
  markdownFit: string;
  html: string;
  cleanedHtml: string;
  media: {
    images: Array<{ src: string; alt: string; type: string }>;
    videos: Array<{ src: string; type: string }>;
    audio: Array<{ src: string; type: string }>;
  };
  links: {
    internal: Array<{ href: string; text: string }>;
    external: Array<{ href: string; text: string }>;
  };
  metadata: {
    title: string;
    description: string;
    keywords: string;
    author: string;
    canonical: string;
    language: string;
    [k: string]: unknown;
  };
  screenshot?: string;
  extractedContent?: string;
  success: boolean;
  statusCode: number;
  error?: string;
}

export interface DeepCrawlResult {
  url: string;
  depth: number;
  result: Crawl4AIResult;
}

export interface Crawl4AIExtractionResult {
  url: string;
  extractedContent: string;
  success: boolean;
  extractionType: string;
}

export interface Crawl4AISiteMap {
  urls: Array<{
    url: string;
    depth: number;
    title?: string;
  }>;
  totalPages: number;
  maxDepth: number;
}

export interface Crawl4AITableResult {
  url: string;
  tables: Array<{
    headers: string[];
    rows: string[][];
    caption?: string;
  }>;
  success: boolean;
}

export interface Crawl4AIStatusResult {
  installed: boolean;
  version: string;
  browserReady: boolean;
  cliAvailable: boolean;
  serviceUrl?: string;
  pythonVersion?: string;
  crawl4aiPath?: string;
}

export interface Crawl4AIChannelResult {
  success: boolean;
  operation: string;
  result: unknown;
  error?: string;
}

// ============================================================
// Internal HTTP client
// ============================================================

interface ServiceError extends Error {
  status?: number;
  traceback?: string;
}

async function callService<T = unknown>(
  path: string,
  body?: unknown,
  timeout: number = REQUEST_TIMEOUT,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const init: RequestInit & { signal: AbortSignal } = {
      method: body !== undefined ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };
    if (body !== undefined) init.body = JSON.stringify(body);

    const res = await fetch(`${CRAWL4AI_SERVICE_URL}${path}`, init);

    if (!res.ok) {
      let errPayload: { error?: string; traceback?: string } = {};
      try { errPayload = await res.json() as typeof errPayload; } catch { /* ignore */ }
      const e = new Error(errPayload.error || `Service returned ${res.status}`) as ServiceError;
      e.status = res.status;
      e.traceback = errPayload.traceback;
      throw e;
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if the crawl4ai HTTP service is running and reachable.
 */
export async function isServiceRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
    try {
      const res = await fetch(`${CRAWL4AI_SERVICE_URL}/health`, { signal: controller.signal });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

/**
 * Start the crawl4ai HTTP service if it is not already running.
 * Safe to call multiple times — uses a PID file to avoid duplicates.
 */
export async function ensureServiceRunning(): Promise<boolean> {
  if (await isServiceRunning()) return true;
  try {
    await execAsync(`bash ${SERVICE_STARTUP_SCRIPT} --bg`, { timeout: SERVICE_STARTUP_GRACE + 5000 });
    // Wait for it to actually become ready
    const deadline = Date.now() + SERVICE_STARTUP_GRACE;
    while (Date.now() < deadline) {
      if (await isServiceRunning()) return true;
      await new Promise(r => setTimeout(r, 500));
    }
    return await isServiceRunning();
  } catch (error) {
    console.error('[crawl4ai] Failed to start service:', error);
    return false;
  }
}

// ============================================================
// Service response → Crawl4AIResult adapter
// ============================================================

interface ServiceCrawlResponse {
  url: string;
  success: boolean;
  status_code: number | null;
  response_headers?: Record<string, string>;
  markdown: string;
  markdown_fit: string;
  html: string;
  cleaned_html: string;
  media?: {
    images?: Array<{ src: string; alt?: string; type?: string }>;
    videos?: Array<{ src: string; type?: string }>;
    audio?: Array<{ src: string; type?: string }>;
  };
  links?: {
    internal?: Array<{ href: string; text?: string }>;
    external?: Array<{ href: string; text?: string }>;
  };
  metadata?: Record<string, unknown>;
  extracted_content?: string | null;
  screenshot?: string | null;
  pdf?: string | null;
  error_message?: string | null;
  session_id?: string | null;
  total_tokens?: number | null;
}

function adaptServiceResult(r: ServiceCrawlResponse): Crawl4AIResult {
  const meta = (r.metadata || {}) as Record<string, unknown>;
  return {
    url: r.url,
    markdown: r.markdown || '',
    markdownFit: r.markdown_fit || '',
    html: r.html || '',
    cleanedHtml: r.cleaned_html || '',
    media: {
      images: (r.media?.images || []).map(i => ({ src: i.src, alt: i.alt || '', type: i.type || 'image' })),
      videos: (r.media?.videos || []).map(v => ({ src: v.src, type: v.type || 'video' })),
      audio: (r.media?.audio || []).map(a => ({ src: a.src, type: a.type || 'audio' })),
    },
    links: {
      internal: (r.links?.internal || []).map(l => ({ href: l.href, text: l.text || '' })),
      external: (r.links?.external || []).map(l => ({ href: l.href, text: l.text || '' })),
    },
    metadata: {
      title: (meta.title as string) || '',
      description: (meta.description as string) || '',
      keywords: (meta.keywords as string) || '',
      author: (meta.author as string) || '',
      canonical: (meta.canonical as string) || '',
      language: (meta.lang as string) || (meta.language as string) || '',
      ...meta,
    },
    screenshot: r.screenshot || undefined,
    extractedContent: r.extracted_content || undefined,
    success: r.success,
    statusCode: r.status_code ?? 0,
    error: r.error_message || undefined,
  };
}

// ============================================================
// Public API — Crawler Run Options
// ============================================================

export interface CrawlerRunOptions {
  /** CSS selector to wait for before scraping */
  waitFor?: string;
  /** Timeout in ms for navigation / page operations */
  pageTimeout?: number;
  /** Playwright wait_until state: 'domcontentloaded' | 'load' | 'networkidle' */
  waitUntil?: 'domcontentloaded' | 'load' | 'networkidle';
  /** JavaScript to execute on the page before scraping */
  jsCode?: string | string[];
  /** Reuse an existing browser session (for multi-step flows) */
  sessionId?: string;
  /** Use crawl4ai "magic" — auto-handle overlays, consent popups, simulate user */
  magic?: boolean;
  /** Stealth mode (Patchright undetected browser) */
  stealth?: boolean;
  /** Headless browser (default true) */
  headless?: boolean;
  /** Take a full-page screenshot */
  screenshot?: boolean;
  /** Capture PDF */
  pdf?: boolean;
  /** Bypass cache (default true) */
  bypassCache?: boolean;
  /** Remove overlay elements (popups, banners) */
  removeOverlayElements?: boolean;
  /** Scroll through the entire page (lazy-load content) */
  scanFullPage?: boolean;
  /** Process iframes (default true) */
  processIframes?: boolean;
  /** CSS selector to scope extraction to a part of the page */
  cssSelector?: string;
  /** Custom user agent */
  userAgent?: string;
  /** Viewport width */
  viewportWidth?: number;
  /** Viewport height */
  viewportHeight?: number;
  /** Word count threshold for content filtering */
  wordCountThreshold?: number;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Delay (seconds) before returning HTML, for lazy-loaded content */
  delayBeforeReturnHtml?: number;
}

function buildBrowserConfig(opts: CrawlerRunOptions): Record<string, unknown> | undefined {
  // Only build a custom browser config when we need to override defaults
  if (
    opts.userAgent === undefined &&
    opts.viewportWidth === undefined &&
    opts.viewportHeight === undefined &&
    opts.stealth === undefined &&
    opts.headless === undefined &&
    opts.headers === undefined
  ) {
    return undefined;
  }
  const cfg: Record<string, unknown> = {};
  if (opts.headless !== undefined) cfg.headless = opts.headless;
  if (opts.userAgent !== undefined) cfg.user_agent = opts.userAgent;
  if (opts.viewportWidth !== undefined) cfg.viewport_width = opts.viewportWidth;
  if (opts.viewportHeight !== undefined) cfg.viewport_height = opts.viewportHeight;
  if (opts.stealth !== undefined) cfg.enable_stealth = opts.stealth;
  if (opts.headers !== undefined) cfg.headers = opts.headers;
  return cfg;
}

function buildCrawlerConfig(opts: CrawlerRunOptions): Record<string, unknown> {
  const cfg: Record<string, unknown> = { bypass_cache: opts.bypassCache ?? true };
  if (opts.waitFor !== undefined) cfg.wait_for = opts.waitFor;
  if (opts.pageTimeout !== undefined) cfg.page_timeout = opts.pageTimeout;
  if (opts.waitUntil !== undefined) cfg.wait_until = opts.waitUntil;
  if (opts.jsCode !== undefined) cfg.js_code = opts.jsCode;
  if (opts.sessionId !== undefined) cfg.session_id = opts.sessionId;
  if (opts.magic !== undefined) cfg.magic = opts.magic;
  if (opts.screenshot !== undefined) cfg.screenshot = opts.screenshot;
  if (opts.pdf !== undefined) cfg.pdf = opts.pdf;
  if (opts.removeOverlayElements !== undefined) cfg.remove_overlay_elements = opts.removeOverlayElements;
  if (opts.scanFullPage !== undefined) cfg.scan_full_page = opts.scanFullPage;
  if (opts.processIframes !== undefined) cfg.process_iframes = opts.processIframes;
  if (opts.cssSelector !== undefined) cfg.css_selector = opts.cssSelector;
  if (opts.wordCountThreshold !== undefined) cfg.word_count_threshold = opts.wordCountThreshold;
  if (opts.delayBeforeReturnHtml !== undefined) cfg.delay_before_return_html = opts.delayBeforeReturnHtml;
  return cfg;
}

// ============================================================
// Public API — Core Crawl Operations
// ============================================================

/**
 * Crawl a single URL and get LLM-ready markdown content.
 * This is the primary function for agents — it returns clean, structured
 * markdown from any webpage, including JavaScript-rendered SPAs.
 */
export async function crawlUrl(
  url: string,
  options: CrawlerRunOptions = {},
): Promise<{
  success: boolean;
  data: Crawl4AIResult | null;
  error?: string;
}> {
  try {
    if (!(await ensureServiceRunning())) {
      return { success: false, data: null, error: 'crawl4ai service unavailable' };
    }
    const browserConfig = buildBrowserConfig(options);
    const crawlerConfig = buildCrawlerConfig(options);
    const payload: Record<string, unknown> = { url, crawler_config: crawlerConfig };
    if (browserConfig) payload.browser_config = browserConfig;

    const resp = await callService<ServiceCrawlResponse>('/crawl', payload, REQUEST_TIMEOUT);
    return { success: resp.success, data: adaptServiceResult(resp), error: resp.error_message || undefined };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: null, error: msg };
  }
}

/**
 * Crawl a URL with full advanced options. Same as crawlUrl but with
 * deeper control over the run config (used for SPA / dynamic pages).
 */
export async function crawlUrlAdvanced(
  url: string,
  options: CrawlerRunOptions & {
    markdownGenerator?: 'default' | 'fit' | 'bm25';
    bm25Query?: string;
  } = {},
): Promise<{
  success: boolean;
  data: Crawl4AIResult | null;
  error?: string;
}> {
  try {
    if (!(await ensureServiceRunning())) {
      return { success: false, data: null, error: 'crawl4ai service unavailable' };
    }
    const browserConfig = buildBrowserConfig(options);
    const crawlerConfig = buildCrawlerConfig(options);

    // Optional content filter for fit/bm25 markdown generation
    if (options.markdownGenerator === 'fit') {
      crawlerConfig.content_filter = { type: 'pruning' };
    } else if (options.markdownGenerator === 'bm25' && options.bm25Query) {
      crawlerConfig.content_filter = { type: 'bm25', query: options.bm25Query };
    }

    const payload: Record<string, unknown> = { url, crawler_config: crawlerConfig };
    if (browserConfig) payload.browser_config = browserConfig;

    const resp = await callService<ServiceCrawlResponse>('/crawl', payload, REQUEST_TIMEOUT);
    return { success: resp.success, data: adaptServiceResult(resp), error: resp.error_message || undefined };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: null, error: msg };
  }
}

// ============================================================
// Public API — Deep Crawling
// ============================================================

export interface DeepCrawlOptions extends CrawlerRunOptions {
  /** Strategy: 'bfs' | 'dfs' | 'best-first' (default 'bfs') */
  strategy?: 'bfs' | 'dfs' | 'best-first';
  /** Max link depth from the seed URL (default 1) */
  maxDepth?: number;
  /** Max number of pages to crawl (default 10) */
  maxPages?: number;
  /** For 'best-first': keywords to score URLs by relevance */
  keywords?: string[];
}

/**
 * Deep-crawl a site starting from `url`. Returns one Crawl4AIResult per page.
 */
export async function deepCrawl(
  url: string,
  options: DeepCrawlOptions = {},
): Promise<{
  success: boolean;
  pages: Crawl4AIResult[];
  error?: string;
}> {
  try {
    if (!(await ensureServiceRunning())) {
      return { success: false, pages: [], error: 'crawl4ai service unavailable' };
    }
    const browserConfig = buildBrowserConfig(options);
    const crawlerConfig = buildCrawlerConfig(options);

    const deepSpec: Record<string, unknown> = {
      type: options.strategy || 'bfs',
      max_depth: options.maxDepth ?? 1,
      max_pages: options.maxPages ?? 10,
    };
    if (options.strategy === 'best-first' && options.keywords?.length) {
      deepSpec.scorer = { keywords: options.keywords };
    }

    const payload: Record<string, unknown> = {
      url,
      deep_crawl: deepSpec,
      crawler_config: crawlerConfig,
    };
    if (browserConfig) payload.browser_config = browserConfig;

    const resp = await callService<{
      pages: ServiceCrawlResponse[];
      total_pages: number;
      urls: string[];
    }>('/deep-crawl', payload, DEEP_CRAWL_TIMEOUT);

    return {
      success: resp.pages.length > 0 && resp.pages.every(p => p.success),
      pages: resp.pages.map(adaptServiceResult),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, pages: [], error: msg };
  }
}

// ============================================================
// Public API — Structured Extraction
// ============================================================

export interface ExtractionSchema {
  name?: string;
  baseSelector: string;
  fields: Array<{
    name: string;
    selector: string;
    type: 'text' | 'attribute' | 'html' | 'regex';
    attribute?: string;
    pattern?: string;
  }>;
}

/**
 * Extract structured data from a URL using CSS selectors.
 * Returns parsed JSON array of records matching the schema.
 */
export async function extractWithCSS(
  url: string,
  schema: ExtractionSchema,
  options: CrawlerRunOptions = {},
): Promise<{
  success: boolean;
  data: unknown[] | null;
  raw: Crawl4AIResult | null;
  error?: string;
}> {
  return extractWithStrategy(url, { type: 'css', schema }, options);
}

/**
 * Extract structured data from a URL using XPath.
 */
export async function extractWithXPath(
  url: string,
  schema: ExtractionSchema,
  options: CrawlerRunOptions = {},
): Promise<{
  success: boolean;
  data: unknown[] | null;
  raw: Crawl4AIResult | null;
  error?: string;
}> {
  return extractWithStrategy(url, { type: 'xpath', schema }, options);
}

/**
 * Extract structured data using an LLM (Z.AI GLM by default).
 * The LLM is given the page markdown + an instruction + optional JSON schema,
 * and returns structured records. This is the most powerful extraction mode
 * — it can pull arbitrary fields from messy HTML.
 */
export async function extractWithLLM(
  url: string,
  instruction: string,
  options: CrawlerRunOptions & {
    schema?: Record<string, unknown>;
    provider?: string;       // litellm format e.g. "zhipu-tls/glm-4.6-flash"
    extractionType?: 'block' | 'schema';
    inputFormat?: 'markdown' | 'html' | 'fit_markdown';
    chunkTokenThreshold?: number;
  } = {},
): Promise<{
  success: boolean;
  data: unknown | null;
  raw: Crawl4AIResult | null;
  error?: string;
}> {
  const extractionSpec: Record<string, unknown> = {
    type: 'llm',
    instruction,
    extraction_type: options.extractionType || 'schema',
    input_format: options.inputFormat || 'markdown',
    chunk_token_threshold: options.chunkTokenThreshold || 1200,
    llm_config: {
      provider: options.provider || 'openai/glm-4.7-flash',
      base_url: 'https://open.bigmodel.cn/api/paas/v4/',
    },
  };
  if (options.schema) extractionSpec.schema = options.schema;
  return extractWithStrategy(url, extractionSpec, options);
}

/**
 * Extract data using a regex pattern. Returns matched groups as records.
 */
export async function extractWithRegex(
  url: string,
  pattern: string,
  options: CrawlerRunOptions = {},
): Promise<{
  success: boolean;
  data: unknown[] | null;
  raw: Crawl4AIResult | null;
  error?: string;
}> {
  return extractWithStrategy(url, { type: 'regex', pattern }, options);
}

async function extractWithStrategy(
  url: string,
  extractionSpec: Record<string, unknown>,
  options: CrawlerRunOptions,
): Promise<{
  success: boolean;
  data: unknown[] | null;
  raw: Crawl4AIResult | null;
  error?: string;
}> {
  try {
    if (!(await ensureServiceRunning())) {
      return { success: false, data: null, raw: null, error: 'crawl4ai service unavailable' };
    }
    const browserConfig = buildBrowserConfig(options);
    const crawlerConfig = buildCrawlerConfig(options);
    crawlerConfig.extraction = extractionSpec;

    const payload: Record<string, unknown> = { url, crawler_config: crawlerConfig };
    if (browserConfig) payload.browser_config = browserConfig;

    const resp = await callService<ServiceCrawlResponse>('/crawl', payload, REQUEST_TIMEOUT);
    let extracted: unknown[] | null = null;
    if (resp.extracted_content) {
      try {
        const parsed = JSON.parse(resp.extracted_content);
        extracted = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        extracted = [{ raw: resp.extracted_content }];
      }
    }
    return {
      success: resp.success,
      data: extracted,
      raw: adaptServiceResult(resp),
      error: resp.error_message || undefined,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: null, raw: null, error: msg };
  }
}

// ============================================================
// Public API — Screenshot & PDF
// ============================================================

export async function takeScreenshot(
  url: string,
  options: CrawlerRunOptions = {},
): Promise<{
  success: boolean;
  screenshot: string | null;  // base64-encoded PNG
  error?: string;
}> {
  try {
    if (!(await ensureServiceRunning())) {
      return { success: false, screenshot: null, error: 'crawl4ai service unavailable' };
    }
    const browserConfig = buildBrowserConfig(options);
    const crawlerConfig = buildCrawlerConfig(options);
    crawlerConfig.screenshot = true;

    const payload: Record<string, unknown> = { url, crawler_config: crawlerConfig };
    if (browserConfig) payload.browser_config = browserConfig;

    const resp = await callService<ServiceCrawlResponse>('/screenshot', payload, REQUEST_TIMEOUT);
    return {
      success: resp.success,
      screenshot: resp.screenshot || null,
      error: resp.error_message || undefined,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, screenshot: null, error: msg };
  }
}

export async function capturePdf(
  url: string,
  options: CrawlerRunOptions = {},
): Promise<{
  success: boolean;
  pdf: string | null;  // base64-encoded PDF
  error?: string;
}> {
  try {
    if (!(await ensureServiceRunning())) {
      return { success: false, pdf: null, error: 'crawl4ai service unavailable' };
    }
    const browserConfig = buildBrowserConfig(options);
    const crawlerConfig = buildCrawlerConfig(options);
    crawlerConfig.pdf = true;

    const payload: Record<string, unknown> = { url, crawler_config: crawlerConfig };
    if (browserConfig) payload.browser_config = browserConfig;

    const resp = await callService<ServiceCrawlResponse>('/pdf', payload, REQUEST_TIMEOUT);
    return {
      success: resp.success,
      pdf: resp.pdf || null,
      error: resp.error_message || undefined,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, pdf: null, error: msg };
  }
}

// ============================================================
// Public API — Sitemap Generation
// ============================================================

/**
 * Generate a sitemap by deep-crawling a site. Returns URLs, titles, depths.
 */
export async function generateSitemap(
  url: string,
  options: { maxDepth?: number; maxPages?: number; strategy?: 'bfs' | 'dfs' | 'best-first' } = {},
): Promise<Crawl4AISiteMap> {
  try {
    if (!(await ensureServiceRunning())) {
      return { urls: [], totalPages: 0, maxDepth: 0 };
    }
    const payload = {
      url,
      deep_crawl: {
        type: options.strategy || 'bfs',
        max_depth: options.maxDepth ?? 2,
        max_pages: options.maxPages ?? 50,
      },
    };
    const resp = await callService<{
      urls: Array<{ url: string; title?: string; depth: number }>;
      total_pages: number;
      max_depth: number;
    }>('/sitemap', payload, DEEP_CRAWL_TIMEOUT);
    return {
      urls: resp.urls,
      totalPages: resp.total_pages,
      maxDepth: resp.max_depth,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[crawl4ai] generateSitemap failed:', msg);
    return { urls: [], totalPages: 0, maxDepth: 0 };
  }
}

// ============================================================
// Public API — Lead Discovery (high-level helper)
// ============================================================

/**
 * Crawl a URL specifically optimized for lead discovery — extracts contact
 * info, social links, team members, and key page content. Used by the
 * Scout and Forge agents.
 */
export async function crawlForLeads(
  url: string,
  options: { deepCrawl?: boolean; maxPages?: number; company?: string } = {},
): Promise<{
  success: boolean;
  leads: Array<{
    name?: string;
    email?: string;
    phone?: string;
    title?: string;
    linkedin?: string;
    twitter?: string;
  }>;
  companyInfo: {
    name?: string;
    description?: string;
    emails: string[];
    phones: string[];
    social: Record<string, string>;
  };
  pagesCrawled: number;
  rawContent: string;
  error?: string;
}> {
  try {
    if (!(await ensureServiceRunning())) {
      return { success: false, leads: [], companyInfo: { emails: [], phones: [], social: {} }, pagesCrawled: 0, rawContent: '', error: 'crawl4ai service unavailable' };
    }

    // Regex patterns for contact extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})/g;
    const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+/g;
    const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/g;

    let allEmails = new Set<string>();
    let allPhones = new Set<string>();
    let allLinkedin = new Set<string>();
    let allTwitter = new Set<string>();
    let rawContent = '';
    let pagesCrawled = 0;
    let companyName = options.company || '';
    let description = '';

    if (options.deepCrawl) {
      const result = await deepCrawl(url, { maxPages: options.maxPages || 5, maxDepth: 1 });
      if (result.success) {
        pagesCrawled = result.pages.length;
        for (const page of result.pages) {
          rawContent += '\n\n--- ' + page.url + ' ---\n' + page.markdown;
          const md = page.markdown || '';
          const html = page.cleanedHtml || page.html || '';
          const combined = md + '\n' + html;
          (combined.match(emailRegex) || []).forEach(e => allEmails.add(e));
          (combined.match(phoneRegex) || []).forEach(p => allPhones.add(p));
          (combined.match(linkedinRegex) || []).forEach(l => allLinkedin.add(l));
          (combined.match(twitterRegex) || []).forEach(t => allTwitter.add(t));
          if (!companyName && page.metadata.title) companyName = page.metadata.title.replace(/\s*[-|].*$/, '').trim();
          if (!description && page.metadata.description) description = page.metadata.description;
        }
      } else if (result.error) {
        return { success: false, leads: [], companyInfo: { emails: [], phones: [], social: {} }, pagesCrawled: 0, rawContent: '', error: result.error };
      }
    } else {
      const result = await crawlUrl(url, { scanFullPage: true, magic: true });
      if (result.success && result.data) {
        pagesCrawled = 1;
        const md = result.data.markdown || '';
        const html = result.data.cleanedHtml || result.data.html || '';
        const combined = md + '\n' + html;
        rawContent = md;
        (combined.match(emailRegex) || []).forEach(e => allEmails.add(e));
        (combined.match(phoneRegex) || []).forEach(p => allPhones.add(p));
        (combined.match(linkedinRegex) || []).forEach(l => allLinkedin.add(l));
        (combined.match(twitterRegex) || []).forEach(t => allTwitter.add(t));
        if (!companyName && result.data.metadata.title) companyName = result.data.metadata.title.replace(/\s*[-|].*$/, '').trim();
        if (!description && result.data.metadata.description) description = result.data.metadata.description;
      } else if (result.error) {
        return { success: false, leads: [], companyInfo: { emails: [], phones: [], social: {} }, pagesCrawled: 0, rawContent: '', error: result.error };
      }
    }

    return {
      success: true,
      leads: [],  // LLM-based lead extraction handled at the agent layer
      companyInfo: {
        name: companyName || undefined,
        description: description || undefined,
        emails: Array.from(allEmails).slice(0, 50),
        phones: Array.from(allPhones).slice(0, 20),
        social: {
          ...(allLinkedin.size ? { linkedin: Array.from(allLinkedin)[0] } : {}),
          ...(allTwitter.size ? { twitter: Array.from(allTwitter)[0] } : {}),
        },
      },
      pagesCrawled,
      rawContent: rawContent.slice(0, 50000),  // cap for downstream LLM context
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, leads: [], companyInfo: { emails: [], phones: [], social: {} }, pagesCrawled: 0, rawContent: '', error: msg };
  }
}

// ============================================================
// Public API — Status Check
// ============================================================

/**
 * Check the install status of crawl4ai — service running, version, etc.
 */
export async function checkCrawl4AIStatus(): Promise<Crawl4AIStatusResult> {
  const running = await isServiceRunning();
  if (running) {
    try {
      const status = await callService<{
        status: string;
        version: string;
        browser_ready: boolean;
        python_version: string;
        crawl4ai_path: string;
      }>('/health', undefined, HEALTH_CHECK_TIMEOUT);
      return {
        installed: true,
        version: status.version,
        browserReady: status.browser_ready,
        cliAvailable: true,
        serviceUrl: CRAWL4AI_SERVICE_URL,
        pythonVersion: status.python_version,
        crawl4aiPath: status.crawl4ai_path,
      };
    } catch {
      // fall through
    }
  }
  // Fallback: read version from vendored source
  let version = 'unknown';
  try {
    const versionFile = '/home/z/my-project/lib/crawl4ai-source/crawl4ai/__version__.py';
    if (existsSync(versionFile)) {
      const content = readFileSync(versionFile, 'utf-8');
      const m = content.match(/__version__\s*=\s*["']([^"']+)["']/);
      if (m) version = m[1];
    }
  } catch { /* ignore */ }
  return {
    installed: existsSync('/home/z/my-project/lib/crawl4ai-source'),
    version,
    browserReady: false,
    cliAvailable: false,
    serviceUrl: CRAWL4AI_SERVICE_URL,
  };
}

// ============================================================
// Public API — Channel Bridge (used by agent-reach)
// ============================================================

export type Crawl4AIOperation =
  | 'crawl'
  | 'crawl_advanced'
  | 'deep_crawl'
  | 'extract_css'
  | 'extract_xpath'
  | 'extract_llm'
  | 'extract_regex'
  | 'screenshot'
  | 'pdf'
  | 'sitemap'
  | 'crawl_for_leads'
  | 'status';

/**
 * Unified entry point for the Agent Reach channel — dispatches any supported
 * operation by name. Used by `agent-reach-bridge.ts` to expose crawl4ai as a
 * channel tool.
 */
export async function executeCrawl4AIOperation(
  operation: Crawl4AIOperation,
  params: Record<string, unknown> = {},
): Promise<Crawl4AIChannelResult> {
  try {
    let result: unknown;
    const opts = (params.options as CrawlerRunOptions) || {};

    switch (operation) {
      case 'crawl':
        result = await crawlUrl(params.url as string, opts);
        break;
      case 'crawl_advanced':
        result = await crawlUrlAdvanced(params.url as string, opts);
        break;
      case 'deep_crawl':
        result = await deepCrawl(params.url as string, {
          ...opts,
          strategy: params.strategy as 'bfs' | 'dfs' | 'best-first' | undefined,
          maxDepth: params.maxDepth as number | undefined,
          maxPages: params.maxPages as number | undefined,
          keywords: params.keywords as string[] | undefined,
        });
        break;
      case 'extract_css':
        result = await extractWithCSS(params.url as string, params.schema as ExtractionSchema, opts);
        break;
      case 'extract_xpath':
        result = await extractWithXPath(params.url as string, params.schema as ExtractionSchema, opts);
        break;
      case 'extract_llm':
        result = await extractWithLLM(
          params.url as string,
          params.instruction as string,
          { ...opts, schema: params.schema as Record<string, unknown> | undefined },
        );
        break;
      case 'extract_regex':
        result = await extractWithRegex(params.url as string, params.pattern as string, opts);
        break;
      case 'screenshot':
        result = await takeScreenshot(params.url as string, opts);
        break;
      case 'pdf':
        result = await capturePdf(params.url as string, opts);
        break;
      case 'sitemap':
        result = await generateSitemap(params.url as string, {
          maxDepth: params.maxDepth as number | undefined,
          maxPages: params.maxPages as number | undefined,
          strategy: params.strategy as 'bfs' | 'dfs' | 'best-first' | undefined,
        });
        break;
      case 'crawl_for_leads':
        result = await crawlForLeads(params.url as string, {
          deepCrawl: params.deepCrawl as boolean | undefined,
          maxPages: params.maxPages as number | undefined,
          company: params.company as string | undefined,
        });
        break;
      case 'status':
        result = await checkCrawl4AIStatus();
        break;
      default:
        return { success: false, operation, result: null, error: `Unknown operation: ${operation}` };
    }
    return { success: true, operation, result };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, operation, result: null, error: msg };
  }
}

// ============================================================
// Backwards-compat: legacy CLI fallback (used only when service is down)
// ============================================================

const CRAWL4AI_CLI_BIN = '/home/z/.venv/bin/crwl';

/**
 * Detect whether the legacy CLI binary exists. Used by the status page to
 * show whether the subprocess fallback is also available.
 */
export function isCliAvailable(): boolean {
  return existsSync(CRAWL4AI_CLI_BIN);
}

/**
 * Read the last N lines of the crawl4ai-service log. Useful for the admin UI.
 */
export function readServiceLogTail(lines: number = 50): string {
  try {
    if (!existsSync(SERVICE_LOG_FILE)) return '';
    const { stdout } = require('child_process').spawnSync('tail', ['-n', String(lines), SERVICE_LOG_FILE]);
    return stdout?.toString() || '';
  } catch {
    return '';
  }
}

/**
 * Get the current PID of the crawl4ai-service (if running), from the PID file.
 */
export function getServicePid(): number | null {
  try {
    if (!existsSync(SERVICE_PID_FILE)) return null;
    const pid = parseInt(readFileSync(SERVICE_PID_FILE, 'utf-8').trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * Public getters for the admin UI / introspection.
 */
export const crawl4aiConfig = {
  serviceUrl: CRAWL4AI_SERVICE_URL,
  serviceHost: CRAWL4AI_SERVICE_HOST,
  servicePort: CRAWL4AI_SERVICE_PORT,
  startupScript: SERVICE_STARTUP_SCRIPT,
  logFile: SERVICE_LOG_FILE,
  pidFile: SERVICE_PID_FILE,
  sourceDir: '/home/z/my-project/lib/crawl4ai-source',
  serviceDir: '/home/z/my-project/lib/crawl4ai-service',
};
