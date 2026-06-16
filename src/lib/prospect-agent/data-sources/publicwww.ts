// ============================================================
// PublicWWW Data Source — Technology Stack & Footprint Discovery
// ============================================================
//
// Uses the PublicWWW API (https://publicwww.com/) to find websites
// that contain specific source-code patterns: tech stack fingerprints,
// analytics IDs, affiliate codes, JS library signatures.
//
// Requires: PUBLICWWW_API_KEY environment variable.
// Rate limit: 60-second delay between requests (per provider guidance).
//
// Wired to: Scout (Prospect Discovery) — for tech-stack-based discovery
// ("find all sites using Salesforce CRM", "find Shopify stores with >X traffic").
// ============================================================

// ─── Configuration ───────────────────────────────────────────────────────

const PUBLICWWW_BASE = 'https://publicwww.com';
const PW_TIMEOUT = 60_000;
const PW_MIN_DELAY_MS = 60_000; // 60s between requests per provider policy

function getApiKey(): string {
  return process.env.PUBLICWWW_API_KEY || '';
}

// ─── Types ───────────────────────────────────────────────────────────────

export interface PublicWwwResult {
  url: string;
  rank: number;             // Global rank (lower = higher traffic)
  snippet: string;          // The matched code snippet
  firstSeen?: string;
  lastSeen?: string;
}

export interface PublicWwwSearchOptions {
  /** Query string — exact substring of source code to find.
   *  Use %22 for quoted strings, e.g., %22adserver.adtech.de%22 */
  query: string;
  /** Max results (default 50, capped at 1000 by API) */
  limit?: number;
  /** Snapshot date (YYYYMMDD) — historical query */
  snapshotDate?: string;
  /** Use ### as column delimiter instead of ; */
  hashDelimiter?: boolean;
}

export interface PublicWwwSearchResult {
  success: boolean;
  query: string;
  results: PublicWwwResult[];
  count: number;
  apiStatus?: {
    requestsUsed: number;
    requestsLimit: number;
    requestsRemaining: number;
  };
  errors: string[];
}

export interface PublicWwwTechProfile {
  technologies: string[];    // Detected tech stack
  cms?: string;
  frameworks: string[];
  analyticsTools: string[];
  crmTools: string[];
  chatWidgets: string[];
  cdnTools: string[];
  hasOutdatedJs: boolean;
  affiliateIds: string[];
}

// ─── Internal Helpers ────────────────────────────────────────────────────

let lastPwRequestTime = 0;

async function enforceRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastPwRequestTime;
  if (elapsed < PW_MIN_DELAY_MS) {
    const wait = PW_MIN_DELAY_MS - elapsed;
    console.debug(`[publicwww] Rate-limiting: waiting ${Math.round(wait / 1000)}s`);
    await new Promise(r => setTimeout(r, wait));
  }
  lastPwRequestTime = Date.now();
}

async function pwFetchCsv(query: string, opts: PublicWwwSearchOptions): Promise<{
  rows: string[][];
  apiStatus?: PublicWwwSearchResult['apiStatus'];
}> {
  const key = getApiKey();
  if (!key) {
    throw new Error('PUBLICWWW_API_KEY is not set. Configure it in .env to use PublicWWW.');
  }

  await enforceRateLimit();

  const colDelim = opts.hashDelimiter ? '###' : ';';
  const params = new URLSearchParams({
    export: 'csvu',
    key,
  });
  if (opts.snapshotDate) params.set('snapshot', opts.snapshotDate);
  if (opts.hashDelimiter) {
    params.set('delimiterColumns', '###');
    params.set('delimiterSnippets', '###');
  }

  // The query is part of the URL path, not a query param
  const url = `${PUBLICWWW_BASE}/websites/${encodeURIComponent(query)}/?${params.toString()}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'text/csv, text/plain' },
    signal: AbortSignal.timeout(PW_TIMEOUT),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PublicWWW returned ${res.status}: ${text.slice(0, 200)}`);
  }

  const csv = await res.text();

  // Parse CSV (simple — PublicWWW uses CSVU = CSV with UTF-8 BOM)
  const lines = csv.split(/\r?\n/).filter(Boolean);
  // Skip header line if present
  const header = lines[0]?.toLowerCase() || '';
  const startIdx = header.includes('rank') || header.includes('url') ? 1 : 0;
  const rows = lines.slice(startIdx).map(line => line.split(colDelim));

  // Try to fetch API status (separate endpoint, doesn't count against quota)
  let apiStatus: PublicWwwSearchResult['apiStatus'];
  try {
    const statusRes = await fetch(
      `${PUBLICWWW_BASE}/profile/api_status.xml?key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (res.ok) {
      const statusXml = await statusRes.text();
      const used = statusXml.match(/<requests_used>(\d+)<\/requests_used>/);
      const limit = statusXml.match(/<requests_limit>(\d+)<\/requests_limit>/);
      const remaining = statusXml.match(/<requests_remaining>(\d+)<\/requests_remaining>/);
      if (used && limit && remaining) {
        apiStatus = {
          requestsUsed: Number(used[1]),
          requestsLimit: Number(limit[1]),
          requestsRemaining: Number(remaining[1]),
        };
      }
    }
  } catch {
    // Status check is non-critical
  }

  return { rows, apiStatus };
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Search for websites whose source code contains a specific pattern.
 *
 * @example
 * // Find sites using Google Analytics
 * const r1 = await publicWwwSearch({ query: 'google-analytics.com/analytics.js' });
 *
 * // Find Shopify stores
 * const r2 = await publicWwwSearch({ query: 'cdn.shopify.com' });
 *
 * // Find sites with a specific ad-network code
 * const r3 = await publicWwwSearch({ query: '%22adserver.adtech.de%22' });
 */
export async function publicWwwSearch(
  opts: PublicWwwSearchOptions,
): Promise<PublicWwwSearchResult> {
  const errors: string[] = [];

  try {
    const { rows, apiStatus } = await pwFetchCsv(opts.query, opts);
    const limit = Math.min(opts.limit || 50, rows.length);

    const results: PublicWwwResult[] = rows.slice(0, limit).map(row => ({
      url: row[0] || '',
      rank: Number(row[1]) || 0,
      snippet: row[2] || '',
      firstSeen: row[3] || undefined,
      lastSeen: row[4] || undefined,
    })).filter(r => r.url);

    return {
      success: true,
      query: opts.query,
      results,
      count: results.length,
      apiStatus,
      errors,
    };
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    return {
      success: false,
      query: opts.query,
      results: [],
      count: 0,
      errors,
    };
  }
}

/**
 * Convenience: discover companies using a specific technology.
 *
 * @param technology - Human-readable tech name (e.g., 'shopify', 'salesforce')
 * @returns Discovered sites + a partial tech profile
 */
export async function publicWwwDiscoverByTechnology(
  technology: string,
  limit = 50,
): Promise<PublicWwwSearchResult & { techProfile: PublicWwwTechProfile }> {
  // Build a fingerprint query for common tech
  const fingerprints: Record<string, string[]> = {
    shopify: ['cdn.shopify.com', 'Shopify.theme'],
    salesforce: ['force.com', 'salesforce.com'],
    hubspot: ['js.hs-scripts.com', 'js.hsforms.net'],
    wordpress: ['wp-content/', 'wp-includes/'],
    wix: ['static.wixstatic.com', 'wix.com'],
    squarespace: ['static1.squarespace.com'],
    magento: ['skin/frontend', 'Mage.Cookies'],
    react: ['_next/static/', 'react.production.min.js'],
    vue: ['vue.runtime', 'vue.global'],
    angular: ['angular.min.js', '@angular/core'],
    'google-analytics': ['google-analytics.com/analytics.js', 'www.googletagmanager.com/gtag/js'],
    intercom: ['widget.intercom.io'],
    drift: ['js.driftt.com'],
    zendesk: ['static.zdassets.com'],
    'jquery-1': ['jquery/1.', 'jquery-1.'], // outdated
  };

  const fp = fingerprints[technology.toLowerCase()] || [technology];
  const query = fp[0]; // Use the first fingerprint

  const search = await publicWwwSearch({ query, limit });

  const techProfile: PublicWwwTechProfile = {
    technologies: [technology],
    frameworks: technology.toLowerCase().includes('react') ||
                technology.toLowerCase().includes('vue') ||
                technology.toLowerCase().includes('angular') ? [technology] : [],
    analyticsTools: technology.toLowerCase().includes('analytics') ? [technology] : [],
    crmTools: technology.toLowerCase().includes('salesforce') ||
              technology.toLowerCase().includes('hubspot') ? [technology] : [],
    chatWidgets: ['intercom', 'drift', 'zendesk'].includes(technology.toLowerCase())
      ? [technology] : [],
    cdnTools: [],
    hasOutdatedJs: technology.toLowerCase().startsWith('jquery-1'),
    affiliateIds: [],
  };

  return { ...search, techProfile };
}

/**
 * Health check — verifies API key is set and quota is available.
 */
export async function publicWwwHealth(): Promise<{
  status: 'ok' | 'error' | 'no_key';
  apiStatus?: PublicWwwSearchResult['apiStatus'];
}> {
  const key = getApiKey();
  if (!key) return { status: 'no_key' };

  try {
    const res = await fetch(
      `${PUBLICWWW_BASE}/profile/api_status.xml?key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return { status: 'error' };

    const xml = await res.text();
    const used = xml.match(/<requests_used>(\d+)<\/requests_used>/);
    const limit = xml.match(/<requests_limit>(\d+)<\/requests_limit>/);
    const remaining = xml.match(/<requests_remaining>(\d+)<\/requests_remaining>/);

    if (used && limit && remaining) {
      return {
        status: 'ok',
        apiStatus: {
          requestsUsed: Number(used[1]),
          requestsLimit: Number(limit[1]),
          requestsRemaining: Number(remaining[1]),
        },
      };
    }
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}
