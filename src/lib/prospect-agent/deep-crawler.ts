// ============================================================
// Deep Website Crawler — Recursive Sub-Page Discovery Engine
// ============================================================
//
// When a user provides a URL like https://www.barriesmilecentre.com/
// or https://jankelley.com/, this engine:
//
// 1. Reads the main landing page
// 2. Discovers ALL internal links (sub-pages, About, Contact, Team, etc.)
// 3. Recursively crawls discovered sub-pages up to a configurable depth
// 4. Tries sitemap.xml and robots.txt for additional URLs
// 5. Returns comprehensive structured data about the entire website
//
// The result is a COMPLETE picture of the company/person behind the URL.

import { webRead } from '@/lib/agent-reach-bridge';

// ─── Configuration ───

const MAX_DEPTH = 2;           // How many link hops from the root page
const MAX_PAGES = 15;          // Maximum pages to crawl per domain
const MAX_CONCURRENT = 3;      // Parallel page reads
const PAGE_READ_TIMEOUT = 20000; // 20s per page
const CONTENT_SLICE = 6000;    // Characters to keep per page for LLM context

// Priority path patterns — these pages are most valuable for B2B intelligence
const PRIORITY_PATHS = [
  /\/about/i, /\/about-us/i, /\/company/i, /\/who-we-are/i,
  /\/team/i, /\/our-team/i, /\/leadership/i, /\/people/i, /\/staff/i,
  /\/contact/i, /\/contact-us/i, /\/reach-us/i,
  /\/services/i, /\/products/i, /\/solutions/i, /\/what-we-do/i,
  /\/pricing/i, /\/plans/i,
  /\/careers/i, /\/jobs/i,
  /\/blog/i, /\/news/i, /\/press/i, /\/media/i,
  /\/testimonials/i, /\/reviews/i, /\/case-stud/i,
  /\/industries/i, /\/clients/i, /\/portfolio/i,
  /\/faq/i,
];

// Patterns to SKIP — these are not useful for company intelligence
const SKIP_PATTERNS = [
  /\.(jpg|jpeg|png|gif|svg|webp|ico|mp4|mp3|pdf|zip|doc|docx|xls|xlsx)$/i,
  /\/cart/i, /\/checkout/i, /\/login/i, /\/register/i, /\/signup/i,
  /\/account/i, /\/password/i, /\/search\?/i,
  /\/feed/i, /\/rss/i, /\/tag\//i, /\/page\/\d+/i,
  /#/, /mailto:/, /tel:/, /javascript:/,
];

// ─── Types ───

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  depth: number;
  isPriority: boolean;
}

export interface DeepCrawlResult {
  rootUrl: string;
  domain: string;
  pages: CrawledPage[];
  totalPagesCrawled: number;
  totalWords: number;
  discoveredUrls: string[];      // All URLs found (including uncrawled)
  priorityPages: CrawledPage[];  // Pages matching PRIORITY_PATHS
  contactPages: CrawledPage[];   // Contact/about/team pages specifically
  allContentCombined: string;    // All content concatenated for LLM extraction
}

// ─── Link Extraction ───

/**
 * Extract all internal links from page content (markdown from Jina Reader).
 * Filters to same-domain URLs only, deduplicates, and removes skip patterns.
 */
function extractInternalLinks(pageContent: string, rootDomain: string): string[] {
  const links = new Set<string>();
  
  // Match markdown links: [text](url)
  const mdLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  
  while ((match = mdLinkRegex.exec(pageContent)) !== null) {
    const rawUrl = match[2].trim();
    try {
      // Resolve relative URLs
      const resolved = new URL(rawUrl, `https://${rootDomain}`).href;
      const parsed = new URL(resolved);
      
      // Only same-domain, http/https
      if (parsed.hostname === rootDomain || parsed.hostname === `www.${rootDomain}` ||
          parsed.hostname.replace(/^www\./, '') === rootDomain) {
        // Remove fragment, trailing slash normalization
        const cleanUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, '');
        
        // Skip unwanted patterns
        if (!SKIP_PATTERNS.some(p => p.test(cleanUrl))) {
          links.add(cleanUrl);
        }
      }
    } catch {
      // Invalid URL — skip
    }
  }
  
  // Also match raw URLs in content
  const rawUrlRegex = /https?:\/\/[^\s)\]"'<>]+/g;
  while ((match = rawUrlRegex.exec(pageContent)) !== null) {
    const rawUrl = match[0].trim().replace(/[.,;:!?)\]">]+$/, '');
    try {
      const parsed = new URL(rawUrl);
      if (parsed.hostname === rootDomain || parsed.hostname === `www.${rootDomain}` ||
          parsed.hostname.replace(/^www\./, '') === rootDomain) {
        const cleanUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, '');
        if (!SKIP_PATTERNS.some(p => p.test(cleanUrl))) {
          links.add(cleanUrl);
        }
      }
    } catch {
      // Invalid URL — skip
    }
  }
  
  return [...links];
}

/**
 * Check if a URL path matches priority patterns.
 */
function isPriorityUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return PRIORITY_PATHS.some(p => p.test(path));
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a contact/about/team page specifically.
 */
function isContactPage(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\/contact/i.test(path) || /\/about/i.test(path) || /\/team/i.test(path) ||
           /\/leadership/i.test(path) || /\/staff/i.test(path) || /\/people/i.test(path);
  } catch {
    return false;
  }
}

// ─── Sitemap Discovery ───

/**
 * Try to fetch and parse sitemap.xml for additional URLs.
 */
async function trySitemap(domain: string): Promise<string[]> {
  const urls: string[] = [];
  
  for (const sitemapPath of ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/']) {
    try {
      const result = await webRead(`https://${domain}${sitemapPath}`);
      if (result.success && result.data.content) {
        // Extract URLs from XML sitemap
        const urlRegex = /<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi;
        let match: RegExpExecArray | null;
        while ((match = urlRegex.exec(result.data.content)) !== null) {
          const url = match[1].trim();
          try {
            const parsed = new URL(url);
            if (parsed.hostname === domain || parsed.hostname === `www.${domain}`) {
              const cleanUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, '');
              if (!SKIP_PATTERNS.some(p => p.test(cleanUrl))) {
                urls.push(cleanUrl);
              }
            }
          } catch {
            // skip
          }
        }
        if (urls.length > 0) break; // Found a working sitemap
      }
    } catch {
      // sitemap not found — continue
    }
  }
  
  return [...new Set(urls)];
}

// ─── Main Crawl Engine ───

/**
 * Deep-crawl a website starting from the given URL.
 * Returns comprehensive data about every page discovered.
 */
export async function deepCrawlWebsite(
  rootUrl: string,
  onProgress?: (msg: string) => void,
): Promise<DeepCrawlResult> {
  const parsed = new URL(rootUrl);
  const domain = parsed.hostname.replace(/^www\./, '');
  const rootOrigin = `${parsed.protocol}//${parsed.hostname}`;
  
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const allDiscoveredUrls = new Set<string>();
  
  // Normalize URL for dedup
  const normalizeUrl = (url: string): string => {
    try {
      const u = new URL(url, rootOrigin);
      return `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/+$/, '') + u.search;
    } catch {
      return url;
    }
  };
  
  // ─── Step 1: Read root page ───
  onProgress?.(`Reading root page: ${rootUrl}...`);
  const rootResult = await webRead(rootUrl);
  if (!rootResult.success) {
    return {
      rootUrl,
      domain,
      pages: [],
      totalPagesCrawled: 0,
      totalWords: 0,
      discoveredUrls: [],
      priorityPages: [],
      contactPages: [],
      allContentCombined: '',
    };
  }
  
  const rootPage: CrawledPage = {
    url: rootUrl,
    title: rootResult.data.title,
    content: rootResult.data.content.slice(0, 50000),
    wordCount: rootResult.data.wordCount,
    depth: 0,
    isPriority: true, // Root is always priority
  };
  pages.push(rootPage);
  visited.add(normalizeUrl(rootUrl));
  
  // ─── Step 2: Extract links from root page ───
  const rootLinks = extractInternalLinks(rootResult.data.content, domain);
  rootLinks.forEach(l => allDiscoveredUrls.add(l));
  
  onProgress?.(`Found ${rootLinks.length} internal links on root page`);
  
  // ─── Step 3: Try sitemap.xml ───
  onProgress?.('Checking sitemap.xml...');
  const sitemapUrls = await trySitemap(domain);
  sitemapUrls.forEach(l => allDiscoveredUrls.add(l));
  if (sitemapUrls.length > 0) {
    onProgress?.(`Found ${sitemapUrls.length} URLs in sitemap`);
  }
  
  // ─── Step 4: Prioritize and sort URLs ───
  // Priority pages first, then by path depth (shorter paths = more important)
  const allUrls = [...allDiscoveredUrls]
    .filter(url => !visited.has(normalizeUrl(url)))
    .sort((a, b) => {
      // Priority pages come first
      const aPriority = isPriorityUrl(a) ? 0 : 1;
      const bPriority = isPriorityUrl(b) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then by path depth (shorter = more important)
      const aDepth = new URL(a, rootOrigin).pathname.split('/').length;
      const bDepth = new URL(b, rootOrigin).pathname.split('/').length;
      return aDepth - bDepth;
    })
    .slice(0, MAX_PAGES - 1); // -1 because root page already counted
  
  // ─── Step 5: Crawl sub-pages in batches ───
  onProgress?.(`Crawling ${allUrls.length} sub-pages (max ${MAX_PAGES})...`);
  
  for (let i = 0; i < allUrls.length; i += MAX_CONCURRENT) {
    const batch = allUrls.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        // Check if already visited (from sitemap)
        const normUrl = normalizeUrl(url);
        if (visited.has(normUrl)) return null;
        visited.add(normUrl);
        
        const result = await webRead(url);
        if (!result.success || !result.data.content || result.data.wordCount < 20) {
          return null; // Skip empty/error pages
        }
        
        const crawledPage: CrawledPage = {
          url,
          title: result.data.title,
          content: result.data.content.slice(0, 50000),
          wordCount: result.data.wordCount,
          depth: 1,
          isPriority: isPriorityUrl(url),
        };
        
        // Also extract links from this page for depth-2 discovery
        const subLinks = extractInternalLinks(result.data.content, domain);
        subLinks.forEach(l => allDiscoveredUrls.add(l));
        
        return crawledPage;
      }),
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        pages.push(result.value);
      }
    }
    
    onProgress?.(`Crawled ${Math.min(i + MAX_CONCURRENT, allUrls.length)} of ${allUrls.length} pages...`);
  }
  
  // ─── Step 6: If we haven't found priority pages, try depth-2 from discovered links ───
  const contactPages = pages.filter(p => isContactPage(p.url));
  if (contactPages.length === 0 && pages.length < MAX_PAGES) {
    const unvisitedPriority = [...allDiscoveredUrls]
      .filter(url => !visited.has(normalizeUrl(url)) && isContactPage(url))
      .slice(0, 3);
    
    if (unvisitedPriority.length > 0) {
      onProgress?.(`Searching for contact pages (depth 2)...`);
      const depth2Results = await Promise.allSettled(
        unvisitedPriority.map(async (url) => {
          visited.add(normalizeUrl(url));
          const result = await webRead(url);
          if (!result.success || !result.data.content || result.data.wordCount < 20) return null;
          return {
            url,
            title: result.data.title,
            content: result.data.content.slice(0, 50000),
            wordCount: result.data.wordCount,
            depth: 2,
            isPriority: true,
          } as CrawledPage;
        }),
      );
      for (const result of depth2Results) {
        if (result.status === 'fulfilled' && result.value) {
          pages.push(result.value);
        }
      }
    }
  }
  
  // ─── Step 7: Compile results ───
  const priorityPages = pages.filter(p => p.isPriority);
  const contactPagesFinal = pages.filter(p => isContactPage(p.url));
  const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);
  
  // Build combined content for LLM — prioritize contact/about/team pages
  const orderedForLLM = [
    ...contactPagesFinal,
    ...priorityPages.filter(p => !isContactPage(p.url)),
    ...pages.filter(p => !p.isPriority),
  ];
  
  // Build per-page summaries for the combined context
  const allContentCombined = orderedForLLM
    .map(p => `=== ${p.title} (${p.url}) ===\n${p.content.slice(0, CONTENT_SLICE)}`)
    .join('\n\n');
  
  return {
    rootUrl,
    domain,
    pages,
    totalPagesCrawled: pages.length,
    totalWords,
    discoveredUrls: [...allDiscoveredUrls],
    priorityPages,
    contactPages: contactPagesFinal,
    allContentCombined: allContentCombined.slice(0, 80000), // Cap for LLM context
  };
}
