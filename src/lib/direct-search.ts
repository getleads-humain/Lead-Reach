/**
 * Direct Search Module — No Jina Dependency
 * =========================================
 *
 * WHY THIS EXISTS
 * ===============
 * The previous search infrastructure relied on Jina Reader
 * (https://r.jina.ai/) to fetch web pages and DuckDuckGo results.
 * However, Jina Reader has blocked this server's IP with HTTP 401:
 *   "You have been blocked from performing anonymous queries due
 *    to bad IP reputation. Please authenticate."
 *
 * Since we don't have a Jina API key configured, ALL search and
 * web-read calls fail. This breaks the entire Prospect Discovery
 * pipeline.
 *
 * This module replaces Jina with direct fetches:
 *   1. `directDuckDuckGoSearch(query)` — fetches DDG HTML directly,
 *      parses result links/snippets ourselves
 *   2. `directWebRead(url)` — fetches a URL directly, strips HTML tags
 *      to produce plain text/markdown-ish content
 *
 * Both use `fetchIPv4` from `network-helpers.ts` so they bypass
 * the broken IPv6 path AND respect the rate-limit queue.
 *
 * PUBLIC API
 * ==========
 *   directDuckDuckGoSearch(query, numResults?) — DDG HTML search
 *   directWebRead(url)                         — fetch + extract text
 *   directDuckDuckGoSiteSearch(site, query)    — site:operator search
 */

import { fetchIPv4 } from './network-helpers';

// ─── Types ───────────────────────────────────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface WebReadResult {
  url: string;
  title: string;
  content: string;
  wordCount: number;
}

// ─── DuckDuckGo HTML Search ──────────────────────────────────────

const DDG_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Search DuckDuckGo's HTML endpoint directly (no Jina).
 *
 * DDG's html.duckduckgo.com endpoint returns simple HTML we can parse
 * with regex. We extract:
 *   - result links (uddg= redirect URLs)
 *   - result titles
 *   - result snippets
 *
 * This is the SAME approach Jina was using internally, just without
 * the Jina middleman (and without Jina's IP block).
 *
 * @param query Search query (e.g., "Kavya Shah Credora software developer")
 * @param numResults Max results to return (default 10)
 * @returns Array of { title, url, snippet }
 */
export async function directDuckDuckGoSearch(
  query: string,
  numResults = 10,
): Promise<{ success: boolean; data: SearchResult[]; error?: string }> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetchIPv4(url, {
      method: 'GET',
      headers: {
        'User-Agent': DDG_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeoutMs: 15_000,
    });

    if (!response.ok) {
      return {
        success: false,
        data: [],
        error: `DuckDuckGo returned ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    const results = parseDuckDuckGoHtml(html, numResults);

    return { success: true, data: results };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      data: [],
      error: `DuckDuckGo fetch failed: ${msg}`,
    };
  }
}

/**
 * Search DuckDuckGo with a site: filter.
 * Useful for LinkedIn profile search, GitHub user search, etc.
 *
 * Example: directDuckDuckGoSiteSearch('linkedin.com/in', 'Kavya Shah Credora')
 */
export async function directDuckDuckGoSiteSearch(
  site: string,
  query: string,
  numResults = 10,
): Promise<{ success: boolean; data: SearchResult[]; error?: string }> {
  return directDuckDuckGoSearch(`site:${site} ${query}`, numResults);
}

/**
 * Parse DuckDuckGo HTML response into structured search results.
 *
 * DDG's HTML structure (simplified):
 *   <a class="result__a" href="//duckduckgo.com/l/?uddg=<ENCODED_URL>">Title</a>
 *   <a class="result__snippet">Snippet text</a>
 *
 * We use regex to extract:
 *   1. All uddg=<URL> patterns (encoded destination URLs)
 *   2. The result title that appears in the same <a> tag
 *   3. The snippet that follows
 */
function parseDuckDuckGoHtml(html: string, numResults: number): SearchResult[] {
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  // Strategy: find all result blocks. Each result is wrapped in
  // <div class="result results_links results_links_deep web-result">
  // or similar. The most reliable pattern is to extract uddg= URLs
  // and their surrounding context.

  // Pattern 1: Look for result__a links with uddg= parameter
  // <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=<URL>&rut=...">
  const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  // Extract links first
  const links: Array<{ url: string; title: string }> = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1];
    const title = decodeHtmlEntities(match[2].trim());

    // Extract uddg= parameter
    const uddgMatch = rawHref.match(/uddg=([^&"']+)/);
    if (uddgMatch) {
      try {
        const url = decodeURIComponent(uddgMatch[1]);
        if (url.startsWith('http') && !seenUrls.has(url)) {
          seenUrls.add(url);
          links.push({ url, title });
        }
      } catch {
        // Skip malformed URLs
      }
    } else if (rawHref.startsWith('http')) {
      // Direct URL (no redirect)
      if (!seenUrls.has(rawHref)) {
        seenUrls.add(rawHref);
        links.push({ url: rawHref, title });
      }
    }
  }

  // Extract snippets in order
  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    const snippet = decodeHtmlEntities(stripTags(match[1])).trim();
    snippets.push(snippet);
  }

  // Combine links with snippets
  for (let i = 0; i < links.length && i < numResults; i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] || '',
    });
  }

  // Fallback: if no results via class regex, try a simpler approach
  if (results.length === 0) {
    const uddgRegex = /uddg=([^&"')]+)/g;
    const uddgUrls: string[] = [];
    while ((match = uddgRegex.exec(html)) !== null) {
      try {
        const url = decodeURIComponent(match[1]);
        if (url.startsWith('http') && !seenUrls.has(url)) {
          seenUrls.add(url);
          uddgUrls.push(url);
        }
      } catch {
        // Skip
      }
    }

    // For each URL, try to find a nearby title (text before the URL)
    for (let i = 0; i < uddgUrls.length && i < numResults; i++) {
      const url = uddgUrls[i];
      const urlIdx = html.indexOf(url);
      const beforeUrl = html.slice(Math.max(0, urlIdx - 500), urlIdx);
      const titleMatch = beforeUrl.match(/>([^<]{5,100})<\/a>$/);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : url.split('/').pop() || url;

      // Find snippet after URL
      const afterUrl = html.slice(urlIdx, urlIdx + 1000);
      const snippetMatch = afterUrl.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      const snippet = snippetMatch ? decodeHtmlEntities(stripTags(snippetMatch[1])).trim() : '';

      results.push({ title, url, snippet });
    }
  }

  return results;
}

// ─── Direct Web Read ─────────────────────────────────────────────

/**
 * Fetch a web page directly and extract its text content.
 *
 * Replaces Jina Reader's `r.jina.ai/<url>` endpoint.
 * Fetches the URL, strips HTML tags, extracts title, and returns
 * plain-text-ish content (markdown-ish, with line breaks preserved).
 *
 * @param url URL to fetch
 * @returns WebReadResult with title + content
 */
export async function directWebRead(
  url: string,
): Promise<{ success: boolean; data?: WebReadResult; error?: string }> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol.startsWith('http')) {
      return { success: false, error: 'Invalid URL protocol' };
    }

    const response = await fetchIPv4(url, {
      method: 'GET',
      headers: {
        'User-Agent': DDG_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeoutMs: 20_000,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    const title = extractTitle(html);
    const content = htmlToText(html);

    return {
      success: true,
      data: {
        url,
        title,
        content: content.slice(0, 50_000), // Cap at 50k chars
        wordCount: content.split(/\s+/).length,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Web read failed: ${msg}`,
    };
  }
}

// ─── HTML Utilities ──────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string {
  // <title>...</title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return decodeHtmlEntities(titleMatch[1].trim());
  }
  // <h1>...</h1> as fallback
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return decodeHtmlEntities(h1Match[1].trim());
  }
  // <meta property="og:title" content="...">
  const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogMatch) {
    return decodeHtmlEntities(ogMatch[1].trim());
  }
  return '';
}

/**
 * Convert HTML to plain text with basic structure preserved.
 * Strips scripts/styles, converts <p>/<br> to newlines, etc.
 */
function htmlToText(html: string): string {
  let text = html;

  // Remove script and style content entirely
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Convert common block elements to newlines
  text = text.replace(/<\/(p|div|section|article|header|footer|nav|aside|li|h[1-6]|tr|blockquote)>/gi, '\n');
  text = text.replace(/<(br|hr)\s*\/?>/gi, '\n');

  // Convert list items to bullet points
  text = text.replace(/<li[^>]*>/gi, '• ');

  // Convert headings to markdown-ish
  text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, _level, content) => {
    return `\n\n## ${stripTags(content).trim()}\n\n`;
  });

  // Convert links to "text (url)" format
  text = text.replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, content) => {
    const text = stripTags(content).trim();
    if (!text) return '';
    if (text === href || href.startsWith('#')) return text;
    return `${text}`;
  });

  // Strip all remaining tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
}

// ─── Health Check ────────────────────────────────────────────────

/**
 * Quick health check: can we reach DuckDuckGo?
 */
export async function directSearchHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  const result = await directDuckDuckGoSearch('test', 1);
  return {
    ok: result.success,
    latencyMs: Date.now() - start,
    error: result.error,
  };
}
