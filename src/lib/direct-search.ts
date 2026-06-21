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

/**
 * Decode HTML entities in a single pass.
 *
 * SECURITY: The old implementation did multiple sequential `.replace()`
 * passes (`&amp;` → `&` first, then `&lt;` → `<`, etc.), which caused
 * double-unescaping: an input like `&amp;lt;` would first become `&lt;`
 * and then `<`, even though the original intent was the literal text
 * `&lt;`. Single-pass decoding with a callback avoids this class of bug
 * because each character of the input is examined at most once.
 */
function decodeHtmlEntities(text: string): string {
  const NAMED: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    '#39': "'",
    '#x27': "'",
    '#x2F': '/',
  };

  // Single-pass regex that matches any HTML entity form (named, decimal,
  // or hex). The callback decides how to decode each match without
  // re-processing the output, so nested-encoded entities are preserved
  // (e.g. `&amp;lt;` → `&lt;`, not `<`).
  return text.replace(
    /&(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#(?:[0-9]{1,7}|[xX][0-9a-fA-F]{1,6}));/g,
    (match) => {
      const inner = match.slice(1, -1); // strip leading `&` and trailing `;`
      if (NAMED[inner]) return NAMED[inner];
      if (inner.startsWith('#x') || inner.startsWith('#X')) {
        const code = parseInt(inner.slice(2), 16);
        if (Number.isNaN(code) || code < 0 || code > 0x10ffff) return match;
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      if (inner.startsWith('#')) {
        const code = parseInt(inner.slice(1), 10);
        if (Number.isNaN(code) || code < 0 || code > 0x10ffff) return match;
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      return match; // unknown entity — leave as-is
    },
  );
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove a paired block (e.g. `<script>…</script>`) from HTML using
 * case-insensitive string search instead of regex.
 *
 * SECURITY: Regex-based block removal like `/<script[\s\S]*?<\/script>/gi`
 * is flagged by CodeQL because (1) it can be bypassed by adversarial HTML
 * (e.g. nested `<script>` tags, missing closing tag), and (2) the lazy
 * `[\s\S]*?` quantifier has polynomial backtracking on pathological input.
 * Using `indexOf` is both faster and more predictable.
 *
 * If no closing tag is found, the rest of the input from the start tag
 * onward is dropped (fail-closed — better to lose content than to leak
 * script source into the extracted text).
 */
function stripHtmlBlock(html: string, startMarker: string, endMarker: string): string {
  const lower = html.toLowerCase();
  const startLower = startMarker.toLowerCase();
  const endLower = endMarker.toLowerCase();
  const startLen = startLower.length;
  const endLen = endLower.length;

  let result = '';
  let cursor = 0;
  // Cap the number of removals to prevent pathological loops on
  // adversarial input.
  let removals = 0;
  const MAX_REMOVALS = 1000;

  while (removals < MAX_REMOVALS) {
    const startIdx = lower.indexOf(startLower, cursor);
    if (startIdx === -1) {
      result += html.slice(cursor);
      break;
    }
    result += html.slice(cursor, startIdx);
    const endIdx = lower.indexOf(endLower, startIdx + startLen);
    if (endIdx === -1) {
      // No closing marker — drop the rest (fail-closed).
      break;
    }
    cursor = endIdx + endLen;
    removals++;
  }
  return result;
}

/**
 * Strip HTML comments (`<!-- … -->`) using string search.
 *
 * SECURITY: Regex-based removal (`/<!--[\s\S]*?-->/g`) is flagged by
 * CodeQL because comments can legitimately contain `--` sequences inside
 * them (e.g. `<!-- foo -- bar -->`) and the lazy regex would stop at the
 * first `--`, leaving the rest of the comment in the output.
 */
function stripHtmlComments(html: string): string {
  const lower = html.toLowerCase();
  const startLower = '<!--';
  const endLower = '-->';
  const startLen = startLower.length;
  const endLen = endLower.length;

  let result = '';
  let cursor = 0;
  let removals = 0;
  const MAX_REMOVALS = 1000;

  while (removals < MAX_REMOVALS) {
    const startIdx = lower.indexOf(startLower, cursor);
    if (startIdx === -1) {
      result += html.slice(cursor);
      break;
    }
    result += html.slice(cursor, startIdx);
    const endIdx = lower.indexOf(endLower, startIdx + startLen);
    if (endIdx === -1) {
      break;
    }
    cursor = endIdx + endLen;
    removals++;
  }
  return result;
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

  // SECURITY: Strip script/style/noscript/svg blocks using string search
  // instead of regex. The old regex-based approach was flagged by CodeQL
  // for being bypassable (nested tags) and vulnerable to polynomial
  // backtracking on adversarial input.
  text = stripHtmlBlock(text, '<script', '</script>');
  text = stripHtmlBlock(text, '<style', '</style>');
  text = stripHtmlBlock(text, '<noscript', '</noscript>');
  text = stripHtmlBlock(text, '<svg', '</svg>');
  text = stripHtmlComments(text);

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
    const linkText = stripTags(content).trim();
    if (!linkText) return '';
    if (linkText === href || href.startsWith('#')) return linkText;
    return `${linkText}`;
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
