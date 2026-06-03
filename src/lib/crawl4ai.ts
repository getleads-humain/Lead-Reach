/**
 * Crawl4AI Integration Module
 * 
 * Integrates the unclecode/crawl4ai library into the Agent Reach platform.
 * Crawl4AI is an LLM-friendly web crawler and scraper that turns the web into
 * clean, structured Markdown for RAG, agents, and data pipelines.
 * 
 * Benefits for Agent Reach:
 * - Deep Web Crawling: Full browser rendering (JavaScript, SPA, dynamic content)
 * - LLM-Ready Markdown: Clean, structured markdown with headings, tables, code
 * - Structured Data Extraction: CSS/XPath selectors + LLM extraction strategies
 * - Deep Crawling: BFS/DFS/BestFirst strategies for multi-page site exploration
 * - Anti-Bot Detection: 3-tier detection with proxy escalation (stealth mode)
 * - Screenshot Capture: Visual debugging and page analysis
 * - Table Extraction: Intelligent table extraction with chunking for massive tables
 * - Shadow DOM Support: Flattens shadow DOM components for complete content
 * - Session Management: Preserve browser states for multi-step crawling
 * - Caching: Built-in cache for faster repeat crawls
 * 
 * CLI Reference: https://github.com/unclecode/crawl4ai
 * Version: 0.8.6
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

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
}

// ============================================================
// Configuration
// ============================================================

const CRAWL4AI_CLI = 'crwl';
const CRAWL4AI_PYTHON = 'crawl4ai';
const CRAWL4AI_CACHE_DIR = '/home/z/my-project/.crawl4ai-cache';
const EXEC_TIMEOUT = 60000; // 60 seconds for crawl operations (page rendering takes time)
const DEEP_CRAWL_TIMEOUT = 180000; // 3 minutes for deep crawls

// ============================================================
// Core CLI / Python Wrapper
// ============================================================

/**
 * Run a crawl4ai CLI command.
 */
async function runCrawl4AI(args: string, timeout = EXEC_TIMEOUT): Promise<{ stdout: string; stderr: string }> {
  try {
    const cliPath = process.env.HOME ? `${process.env.HOME}/.local/bin/${CRAWL4AI_CLI}` : CRAWL4AI_CLI;
    const { stdout, stderr } = await execAsync(`${cliPath} ${args}`, {
      timeout,
      maxBuffer: 20 * 1024 * 1024, // 20MB for large pages
      env: {
        ...process.env,
        PATH: `${process.env.PATH}:${process.env.HOME}/.local/bin`,
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '',
      },
    });
    return { stdout: stdout || '', stderr: stderr || '' };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string; killed?: boolean };
    if (err.killed) {
      return { stdout: '', stderr: `crawl4ai command timed out after ${timeout}ms` };
    }
    const errMsg = err.message || 'crawl4ai command failed';
    console.warn(`[crawl4ai] Command failed: ${errMsg.slice(0, 300)}`);
    // Return any partial stdout
    return { stdout: err.stdout || '', stderr: err.stderr || errMsg };
  }
}

/**
 * Run a Python script using crawl4ai's Python API.
 * This gives us more control than the CLI for complex operations.
 */
async function runPython(script: string, timeout = EXEC_TIMEOUT): Promise<{ stdout: string; stderr: string }> {
  try {
    // Ensure cache dir exists
    if (!existsSync(CRAWL4AI_CACHE_DIR)) {
      await mkdir(CRAWL4AI_CACHE_DIR, { recursive: true });
    }

    const scriptFile = join(CRAWL4AI_CACHE_DIR, `script_${Date.now()}.py`);
    await writeFile(scriptFile, script, 'utf-8');

    const { stdout, stderr } = await execAsync(`python3 "${scriptFile}"`, {
      timeout,
      maxBuffer: 20 * 1024 * 1024,
      env: {
        ...process.env,
        PATH: `${process.env.PATH}:${process.env.HOME}/.local/bin`,
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '',
      },
    });

    // Cleanup script file
    try { await import('fs/promises').then(f => f.unlink(scriptFile)); } catch {}

    return { stdout: stdout || '', stderr: stderr || '' };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string; killed?: boolean };
    if (err.killed) {
      return { stdout: '', stderr: `Python script timed out after ${timeout}ms` };
    }
    return { stdout: err.stdout || '', stderr: err.stderr || err.message || 'Python script failed' };
  }
}

/**
 * Safely parse JSON from a string.
 */
function safeJsonParse<T>(str: string): T | null {
  if (!str || !str.trim()) return null;
  const trimmed = str.trim();
  if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

// ============================================================
// Public API — Core Crawl Operations
// ============================================================

/**
 * Crawl a single URL and get LLM-ready markdown content.
 * This is the primary function for agents — it returns clean, structured
 * markdown from any webpage, including JavaScript-rendered SPAs.
 * 
 * @param url The URL to crawl
 * @param options Crawl options
 * @returns Structured crawl result with markdown, links, media, metadata
 */
export async function crawlUrl(
  url: string,
  options: {
    outputFormat?: 'markdown' | 'markdown-fit' | 'json' | 'all';
    includeLinks?: boolean;
    includeMedia?: boolean;
    screenshot?: boolean;
    cacheMode?: 'enabled' | 'disabled' | 'bypass';
    waitFor?: string; // CSS selector to wait for
    jsCode?: string; // JavaScript to execute before extraction
  } = {}
): Promise<{
  success: boolean;
  data: Crawl4AIResult | null;
  error?: string;
}> {
  try {
    const outputFormat = options.outputFormat || 'all';
    const outputPath = join(CRAWL4AI_CACHE_DIR, `crawl_${Date.now()}.json`);

    let args = `"${url}" -o ${outputFormat} -O "${outputPath}"`;
    
    if (options.screenshot) {
      args += ' --screenshot';
    }
    if (options.waitFor) {
      args += ` --wait-for "${options.waitFor}"`;
    }

    // Build crawler params
    const crawlerParams: string[] = [];
    if (options.cacheMode === 'disabled') {
      crawlerParams.push('cache_mode=CacheMode.BYPASS');
    }
    if (options.includeLinks === false) {
      // Links are included by default, no option to disable via CLI
    }

    if (crawlerParams.length > 0) {
      args += ` -c "${crawlerParams.join(',')}"`;
    }

    const { stdout, stderr } = await runCrawl4AI(args);

    // Check for errors
    if (stderr.includes('Error') && !stdout.trim()) {
      return { success: false, data: null, error: stderr.slice(0, 500) };
    }

    // Try reading the output file
    if (existsSync(outputPath)) {
      const content = await readFile(outputPath, 'utf-8');
      try { await import('fs/promises').then(f => f.unlink(outputPath)); } catch {}
      
      const parsed = safeJsonParse<Crawl4AIResult>(content);
      if (parsed) {
        return { success: true, data: parsed };
      }
    }

    // If no output file, try parsing stdout directly
    if (stdout.trim()) {
      // CLI may return markdown directly when output is markdown
      const result: Crawl4AIResult = {
        url,
        markdown: stdout,
        markdownFit: stdout,
        html: '',
        cleanedHtml: '',
        media: { images: [], videos: [], audio: [] },
        links: { internal: [], external: [] },
        metadata: {
          title: '',
          description: '',
          keywords: '',
          author: '',
          canonical: '',
          language: '',
        },
        success: true,
        statusCode: 200,
      };
      return { success: true, data: result };
    }

    return { success: false, data: null, error: stderr || 'No output from crawl4ai' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, data: null, error: msg };
  }
}

/**
 * Crawl a URL using Python API for full control.
 * Returns structured data including markdown, fit markdown, links, media, metadata.
 */
export async function crawlUrlAdvanced(
  url: string,
  options: {
    headless?: boolean;
    markdownGenerator?: 'default' | 'fit' | 'bm25';
    bm25Query?: string;
    includeScreenshot?: boolean;
    cacheMode?: 'enabled' | 'disabled' | 'bypass';
    waitFor?: string;
    jsCode?: string;
    proxy?: string;
    stealthMode?: boolean;
    flattenShadowDom?: boolean;
    timeout?: number;
  } = {}
): Promise<{
  success: boolean;
  data: Crawl4AIResult | null;
  error?: string;
}> {
  const headless = options.headless !== false;
  const cacheMode = options.cacheMode || 'enabled';
  const cacheModeStr = cacheMode === 'disabled' ? 'BYPASS' : cacheMode === 'bypass' ? 'BYPASS' : 'ENABLED';
  const outputPath = join(CRAWL4AI_CACHE_DIR, `advanced_${Date.now()}.json`);

  let markdownGeneratorCode = '';
  if (options.markdownGenerator === 'fit') {
    markdownGeneratorCode = `
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
md_gen = DefaultMarkdownGenerator(content_filter=PruningContentFilter(threshold=0.48, threshold_type="fixed", min_word_threshold=0))
run_config = CrawlerRunConfig(cache_mode=CacheMode.${cacheModeStr}, markdown_generator=md_gen)`;
  } else if (options.markdownGenerator === 'bm25' && options.bm25Query) {
    markdownGeneratorCode = `
from crawl4ai.content_filter_strategy import BM25ContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
md_gen = DefaultMarkdownGenerator(content_filter=BM25ContentFilter(user_query="${options.bm25Query.replace(/"/g, '\\"')}", bm25_threshold=1.0))
run_config = CrawlerRunConfig(cache_mode=CacheMode.${cacheModeStr}, markdown_generator=md_gen)`;
  } else {
    markdownGeneratorCode = `run_config = CrawlerRunConfig(cache_mode=CacheMode.${cacheModeStr})`;
  }

  const screenshotArg = options.includeScreenshot ? ', screenshot=True' : '';
  const shadowDomArg = options.flattenShadowDom ? ', flatten_shadow_dom=True' : '';
  const waitForArg = options.waitFor ? `, wait_for="${options.waitFor}"` : '';
  const jsCodeArg = options.jsCode ? `, js_code=[${JSON.stringify(options.jsCode)}]` : '';
  const proxyArg = options.proxy ? `, proxy="${options.proxy}"` : '';

  const script = `
import asyncio
import json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def main():
    browser_config = BrowserConfig(headless=${headless ? 'True' : 'False'}, verbose=False${proxyArg})
    ${markdownGeneratorCode}
    
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(
            url="${url}",
            config=run_config${screenshotArg}${shadowDomArg}${waitForArg}${jsCodeArg}
        )
        
        output = {
            "url": result.url,
            "markdown": result.markdown.raw_markdown if hasattr(result.markdown, 'raw_markdown') else str(result.markdown),
            "markdownFit": result.markdown.fit_markdown if hasattr(result.markdown, 'fit_markdown') else "",
            "html": result.html[:50000] if result.html else "",
            "cleanedHtml": result.cleaned_html[:50000] if result.cleaned_html else "",
            "media": {"images": [], "videos": [], "audio": []},
            "links": {"internal": [], "external": []},
            "metadata": {
                "title": result.metadata.get("title", "") if result.metadata else "",
                "description": result.metadata.get("description", "") if result.metadata else "",
                "keywords": result.metadata.get("keywords", "") if result.metadata else "",
                "author": "",
                "canonical": "",
                "language": "",
            },
            "success": result.success,
            "statusCode": result.status_code if hasattr(result, 'status_code') else 200,
        }
        
        if hasattr(result, 'media') and result.media:
            try:
                output["media"] = {
                    "images": [{"src": i.get("src", ""), "alt": i.get("alt", ""), "type": i.get("type", "image")} for i in (result.media.get("images", []) or [])],
                    "videos": [{"src": v.get("src", ""), "type": v.get("type", "video")} for v in (result.media.get("videos", []) or [])],
                    "audio": [{"src": a.get("src", ""), "type": a.get("type", "audio")} for a in (result.media.get("audio", []) or [])],
                }
            except:
                pass
        
        if hasattr(result, 'links') and result.links:
            try:
                output["links"] = {
                    "internal": [{"href": l.get("href", ""), "text": l.get("text", "")} for l in (result.links.get("internal", []) or [])],
                    "external": [{"href": l.get("href", ""), "text": l.get("text", "")} for l in (result.links.get("external", []) or [])],
                }
            except:
                pass
        
        if hasattr(result, 'screenshot') and result.screenshot:
            output["screenshot"] = result.screenshot[:1000] if isinstance(result.screenshot, str) else ""
        
        if hasattr(result, 'extracted_content') and result.extracted_content:
            output["extractedContent"] = result.extracted_content
        
        with open("${outputPath}", "w") as f:
            json.dump(output, f)

asyncio.run(main())
`;

  const { stderr } = await runPython(script, options.timeout || EXEC_TIMEOUT);

  if (existsSync(outputPath)) {
    const content = await readFile(outputPath, 'utf-8');
    try { await import('fs/promises').then(f => f.unlink(outputPath)); } catch {};
    
    const parsed = safeJsonParse<Crawl4AIResult>(content);
    if (parsed) {
      return { success: true, data: parsed };
    }
  }

  return { success: false, data: null, error: stderr.slice(0, 500) || 'Crawl failed' };
}

/**
 * Deep crawl a website using BFS/DFS/BestFirst strategy.
 * Discovers and crawls multiple pages following links from a start URL.
 * 
 * @param startUrl Starting URL for deep crawl
 * @param options Deep crawl options
 * @returns Array of results from all crawled pages
 */
export async function deepCrawl(
  startUrl: string,
  options: {
    strategy?: 'bfs' | 'dfs' | 'bestfirst';
    maxDepth?: number;
    maxPages?: number;
    query?: string; // For bestfirst strategy scoring
    cacheMode?: 'enabled' | 'disabled' | 'bypass';
    headless?: boolean;
  } = {}
): Promise<{
  success: boolean;
  data: DeepCrawlResult[];
  totalPages: number;
  error?: string;
}> {
  const strategy = options.strategy || 'bfs';
  const maxDepth = options.maxDepth || 2;
  const maxPages = options.maxPages || 10;
  const headless = options.headless !== false;
  const cacheMode = options.cacheMode === 'disabled' || options.cacheMode === 'bypass' ? 'BYPASS' : 'ENABLED';
  const outputPath = join(CRAWL4AI_CACHE_DIR, `deep_${Date.now()}.json`);

  let strategyImport = '';
  let strategyCode = '';
  if (strategy === 'bfs') {
    strategyImport = 'from crawl4ai.deep_crawling import BFSDeepCrawlStrategy';
    strategyCode = `strategy = BFSDeepCrawlStrategy(max_depth=${maxDepth}, max_pages=${maxPages})`;
  } else if (strategy === 'dfs') {
    strategyImport = 'from crawl4ai.deep_crawling import DFSDeepCrawlStrategy';
    strategyCode = `strategy = DFSDeepCrawlStrategy(max_depth=${maxDepth}, max_pages=${maxPages})`;
  } else if (strategy === 'bestfirst' && options.query) {
    strategyImport = 'from crawl4ai.deep_crawling import BestFirstCrawlingStrategy';
    strategyCode = `strategy = BestFirstCrawlingStrategy(max_depth=${maxDepth}, max_pages=${maxPages}, query="${options.query.replace(/"/g, '\\"')}")`;
  } else {
    strategyImport = 'from crawl4ai.deep_crawling import BFSDeepCrawlStrategy';
    strategyCode = `strategy = BFSDeepCrawlStrategy(max_depth=${maxDepth}, max_pages=${maxPages})`;
  }

  const script = `
import asyncio
import json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
${strategyImport}

async def main():
    browser_config = BrowserConfig(headless=${headless ? 'True' : 'False'}, verbose=False)
    run_config = CrawlerRunConfig(cache_mode=CacheMode.${cacheMode}, deep_crawl_strategy=strategy)
    
    results = []
    async with AsyncWebCrawler(config=browser_config) as crawler:
        async for result in await crawler.arun(
            url="${startUrl}",
            config=run_config
        ):
            results.append({
                "url": result.url,
                "depth": 0,
                "result": {
                    "url": result.url,
                    "markdown": result.markdown.raw_markdown if hasattr(result.markdown, 'raw_markdown') else str(result.markdown),
                    "markdownFit": result.markdown.fit_markdown if hasattr(result.markdown, 'fit_markdown') else "",
                    "html": "",
                    "cleanedHtml": "",
                    "media": {"images": [], "videos": [], "audio": []},
                    "links": {"internal": [], "external": []},
                    "metadata": {"title": "", "description": "", "keywords": "", "author": "", "canonical": "", "language": ""},
                    "success": result.success,
                    "statusCode": result.status_code if hasattr(result, 'status_code') else 200,
                }
            })
    
    with open("${outputPath}", "w") as f:
        json.dump(results, f)

${strategyCode}
asyncio.run(main())
`;

  // Deep crawls can take longer
  const { stderr } = await runPython(script, DEEP_CRAWL_TIMEOUT);

  if (existsSync(outputPath)) {
    const content = await readFile(outputPath, 'utf-8');
    try { await import('fs/promises').then(f => f.unlink(outputPath)); } catch {};
    
    const parsed = safeJsonParse<DeepCrawlResult[]>(content);
    if (parsed && Array.isArray(parsed)) {
      return { success: true, data: parsed, totalPages: parsed.length };
    }
  }

  return { success: false, data: [], totalPages: 0, error: stderr.slice(0, 500) || 'Deep crawl failed' };
}

/**
 * Extract structured data from a URL using CSS selectors.
 * No LLM required — fast and deterministic extraction.
 * 
 * @param url The URL to extract data from
 * @param schema CSS extraction schema
 */
export async function extractWithCSS(
  url: string,
  schema: {
    name: string;
    baseSelector: string;
    fields: Array<{
      name: string;
      selector: string;
      type: 'text' | 'attribute' | 'html' | 'href' | 'src';
      attribute?: string;
    }>;
  }
): Promise<{
  success: boolean;
  data: Crawl4AIExtractionResult | null;
  error?: string;
}> {
  const schemaPath = join(CRAWL4AI_CACHE_DIR, `schema_${Date.now()}.json`);
  const outputPath = join(CRAWL4AI_CACHE_DIR, `extract_${Date.now()}.json`);

  await writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');

  const script = `
import asyncio
import json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode, JsonCssExtractionStrategy

async def main():
    with open("${schemaPath}") as f:
        schema = json.load(f)
    
    extraction_strategy = JsonCssExtractionStrategy(schema, verbose=False)
    browser_config = BrowserConfig(headless=True, verbose=False)
    run_config = CrawlerRunConfig(
        extraction_strategy=extraction_strategy,
        cache_mode=CacheMode.BYPASS,
    )
    
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url="${url}", config=run_config)
        
        output = {
            "url": "${url}",
            "extractedContent": result.extracted_content if result.extracted_content else "[]",
            "success": result.success,
            "extractionType": "css",
        }
        
        with open("${outputPath}", "w") as f:
            json.dump(output, f)

asyncio.run(main())
`;

  const { stderr } = await runPython(script, EXEC_TIMEOUT);

  // Cleanup schema file
  try { await import('fs/promises').then(f => f.unlink(schemaPath)); } catch {}

  if (existsSync(outputPath)) {
    const content = await readFile(outputPath, 'utf-8');
    try { await import('fs/promises').then(f => f.unlink(outputPath)); } catch {};
    
    const parsed = safeJsonParse<Crawl4AIExtractionResult>(content);
    if (parsed) {
      return { success: true, data: parsed };
    }
  }

  return { success: false, data: null, error: stderr.slice(0, 500) || 'CSS extraction failed' };
}

/**
 * Crawl a website specifically for lead/contact data.
 * Uses CSS selectors to extract company info, contact details, team members.
 * Pre-built schemas for common page types: about, contact, team pages.
 */
export async function crawlForLeads(
  url: string,
  options: {
    pageType?: 'about' | 'contact' | 'team' | 'pricing' | 'auto';
    extractEmails?: boolean;
    extractPhones?: boolean;
    extractAddresses?: boolean;
  } = {}
): Promise<{
  success: boolean;
  data: {
    url: string;
    companyInfo: Record<string, string>;
    contacts: Array<Record<string, string>>;
    emails: string[];
    phones: string[];
    addresses: string[];
    rawMarkdown: string;
  } | null;
  error?: string;
}> {
  const pageType = options.pageType || 'auto';
  const outputPath = join(CRAWL4AI_CACHE_DIR, `leads_${Date.now()}.json`);

  // Pre-built schemas for different page types
  const schemas: Record<string, Record<string, string>> = {
    about: {
      company_name: 'h1, [class*="company-name"], [class*="companyName"], [class*="title"]',
      description: 'meta[name="description"], [class*="about"], [class*="description"], p',
      mission: '[class*="mission"], [class*="vision"]',
      founded: '[class*="founded"], [class*="year"], [class*="established"]',
      team_size: '[class*="team-size"], [class*="employees"], [class*="headcount"]',
    },
    contact: {
      email: 'a[href^="mailto:"], [class*="email"], [class*="contact-email"]',
      phone: 'a[href^="tel:"], [class*="phone"], [class*="telephone"]',
      address: '[class*="address"], [class*="location"], address',
      support: '[class*="support"], [class*="help"]',
    },
    team: {
      member_name: '[class*="name"], [class*="member-name"], h3, h4',
      member_title: '[class*="title"], [class*="role"], [class*="position"]',
      member_email: 'a[href^="mailto:"]',
      member_linkedin: 'a[href*="linkedin.com/in/"]',
    },
  };

  const script = `
import asyncio
import json
import re
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def main():
    browser_config = BrowserConfig(headless=True, verbose=False)
    run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
    
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url="${url}", config=run_config)
        
        markdown_text = result.markdown.raw_markdown if hasattr(result.markdown, 'raw_markdown') else str(result.markdown)
        
        # Extract emails using regex
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
        emails = list(set(re.findall(email_pattern, markdown_text)))
        
        # Extract phone numbers using regex
        phone_pattern = r'(?:\\+?1?[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}'
        phones = list(set(re.findall(phone_pattern, markdown_text)))
        
        # Extract addresses (simple heuristic)
        address_pattern = r'\\d+\\s+[A-Za-z0-9\\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct)[,\\s]+[A-Za-z\\s]+[,\\s]+[A-Z]{2}\\s+\\d{5}'
        addresses = list(set(re.findall(address_pattern, markdown_text, re.IGNORECASE)))
        
        # Try to extract company info from metadata
        company_info = {}
        if result.metadata:
            if result.metadata.get("title"):
                company_info["title"] = result.metadata["title"]
            if result.metadata.get("description"):
                company_info["description"] = result.metadata["description"]
        
        output = {
            "url": "${url}",
            "companyInfo": company_info,
            "contacts": [],
            "emails": emails,
            "phones": phones,
            "addresses": addresses,
            "rawMarkdown": markdown_text[:50000],
        }
        
        with open("${outputPath}", "w") as f:
            json.dump(output, f)

asyncio.run(main())
`;

  const { stderr } = await runPython(script, EXEC_TIMEOUT);

  if (existsSync(outputPath)) {
    const content = await readFile(outputPath, 'utf-8');
    try { await import('fs/promises').then(f => f.unlink(outputPath)); } catch {};
    
    const parsed = safeJsonParse<{
      url: string;
      companyInfo: Record<string, string>;
      contacts: Array<Record<string, string>>;
      emails: string[];
      phones: string[];
      addresses: string[];
      rawMarkdown: string;
    }>(content);
    if (parsed) {
      return { success: true, data: parsed };
    }
  }

  return { success: false, data: null, error: stderr.slice(0, 500) || 'Lead crawl failed' };
}

/**
 * Take a screenshot of a webpage.
 * Useful for visual debugging and page analysis.
 */
export async function takeScreenshot(
  url: string,
  options: {
    fullPage?: boolean;
    width?: number;
    height?: number;
  } = {}
): Promise<{
  success: boolean;
  data: { url: string; screenshotPath: string } | null;
  error?: string;
}> {
  const outputPath = join(CRAWL4AI_CACHE_DIR, `screenshot_${Date.now()}.png`);

  const script = `
import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def main():
    browser_config = BrowserConfig(
        headless=True, 
        verbose=False,
        viewport_width=${options.width || 1920},
        viewport_height=${options.height || 1080},
    )
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        screenshot=True,
        screenshot_wait_for=2.0,
    )
    
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url="${url}", config=run_config)
        
        if result.screenshot_data:
            import base64
            with open("${outputPath}", "wb") as f:
                f.write(base64.b64decode(result.screenshot_data))
        elif result.screenshot:
            with open("${outputPath}", "wb") as f:
                f.write(result.screenshot if isinstance(result.screenshot, bytes) else result.screenshot.encode())

asyncio.run(main())
`;

  const { stderr } = await runPython(script, EXEC_TIMEOUT);

  if (existsSync(outputPath)) {
    return { success: true, data: { url, screenshotPath: outputPath } };
  }

  return { success: false, data: null, error: stderr.slice(0, 500) || 'Screenshot failed' };
}

/**
 * Check crawl4ai installation status and readiness.
 */
export async function checkCrawl4AIStatus(): Promise<Crawl4AIStatusResult> {
  const result: Crawl4AIStatusResult = {
    installed: false,
    version: '',
    browserReady: false,
    cliAvailable: false,
  };

  // Check Python package
  try {
    const { stdout } = await execAsync('python3 -c "import crawl4ai; print(crawl4ai.__version__)"', {
      timeout: 10000,
      env: { ...process.env, PATH: `${process.env.PATH}:${process.env.HOME}/.local/bin` },
    });
    if (stdout.trim()) {
      result.installed = true;
      result.version = stdout.trim();
    }
  } catch {
    // Not installed
  }

  // Check CLI
  try {
    const cliPath = `${process.env.HOME}/.local/bin/crwl`;
    const { stdout } = await execAsync(`"${cliPath}" --version 2>/dev/null || echo "not found"`, { timeout: 10000 });
    if (!stdout.includes('not found')) {
      result.cliAvailable = true;
    }
  } catch {
    // CLI not available
  }

  // Check browser
  try {
    const { stdout } = await execAsync('python3 -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); b = p.chromium.launch(); b.close(); p.stop(); print(\'ok\')"', {
      timeout: 30000,
      env: { ...process.env, PATH: `${process.env.PATH}:${process.env.HOME}/.local/bin` },
    });
    if (stdout.trim() === 'ok') {
      result.browserReady = true;
    }
  } catch {
    // Browser not ready
  }

  return result;
}

// ============================================================
// Agent-Reach Bridge Integration Types
// ============================================================

export interface Crawl4AIChannelResult {
  operation: string;
  url: string;
  success: boolean;
  data: unknown;
  error?: string;
  timestamp: string;
}

/**
 * Main entry point for Agent-Reach Bridge integration.
 * This function is called by the bridge when agents use the crawl4ai channel.
 */
export async function executeCrawl4AIOperation(
  operation: string,
  params: Record<string, unknown>,
): Promise<Crawl4AIChannelResult> {
  const timestamp = new Date().toISOString();
  const url = (params.url as string) || '';

  try {
    let data: unknown;

    switch (operation) {
      case 'crawl':
        data = await crawlUrl(url, {
          outputFormat: (params.outputFormat as 'markdown' | 'markdown-fit' | 'json' | 'all') || 'all',
          screenshot: (params.screenshot as boolean) || false,
          cacheMode: (params.cacheMode as 'enabled' | 'disabled' | 'bypass') || 'enabled',
          waitFor: params.waitFor as string,
        });
        break;
      case 'crawl_advanced':
        data = await crawlUrlAdvanced(url, {
          headless: params.headless as boolean,
          markdownGenerator: (params.markdownGenerator as 'default' | 'fit' | 'bm25') || 'default',
          bm25Query: params.bm25Query as string,
          includeScreenshot: params.screenshot as boolean,
          cacheMode: (params.cacheMode as 'enabled' | 'disabled' | 'bypass') || 'enabled',
          flattenShadowDom: params.flattenShadowDom as boolean,
        });
        break;
      case 'deep_crawl':
        data = await deepCrawl(url, {
          strategy: (params.strategy as 'bfs' | 'dfs' | 'bestfirst') || 'bfs',
          maxDepth: (params.maxDepth as number) || 2,
          maxPages: (params.maxPages as number) || 10,
          query: params.query as string,
        });
        break;
      case 'extract_css':
        data = await extractWithCSS(url, params.schema as {
          name: string;
          baseSelector: string;
          fields: Array<{ name: string; selector: string; type: 'text' | 'attribute' | 'html' | 'href' | 'src'; attribute?: string }>;
        });
        break;
      case 'crawl_leads':
        data = await crawlForLeads(url, {
          pageType: (params.pageType as 'about' | 'contact' | 'team' | 'pricing' | 'auto') || 'auto',
          extractEmails: params.extractEmails as boolean,
          extractPhones: params.extractPhones as boolean,
          extractAddresses: params.extractAddresses as boolean,
        });
        break;
      case 'screenshot':
        data = await takeScreenshot(url, {
          fullPage: params.fullPage as boolean,
          width: params.width as number,
          height: params.height as number,
        });
        break;
      case 'status':
        data = await checkCrawl4AIStatus();
        break;
      default:
        return {
          operation,
          url,
          success: false,
          data: null,
          error: `Unknown crawl4ai operation: ${operation}`,
          timestamp,
        };
    }

    return { operation, url, success: true, data, timestamp };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { operation, url, success: false, data: null, error: msg, timestamp };
  }
}
