// ============================================================
// Knowledge Base Retrieval Analytics
// ============================================================
// Tracks every retrieval call so the Echo agent can run a monthly
// "Knowledge Base Gap Report" (see knowledge/agents/echo.md §9).
//
// Design:
//   - Fire-and-forget logging (never blocks retrieval)
//   - In-memory buffer flushed to JSONL on disk every 50 entries
//   - JSONL format = one JSON object per line (easy to tail/grep)
//   - Lives at /home/z/my-project/.knowledge-analytics/retrievals.jsonl
//   - Auto-rotates monthly (YYYY-MM suffix)
//   - Graceful degradation: if disk write fails, just drop the entry
//
// All functions are non-throwing. Analytics is best-effort.
// ============================================================

import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync } from 'fs';
import { join, resolve } from 'path';

// ============================================================
// Types
// ============================================================

export interface RetrievalLogEntry {
  /** ISO timestamp */
  ts: string;
  /** Year-month bucket, e.g. "2026-06" */
  month: string;
  /** The query text (truncated to 500 chars) */
  query: string;
  /** Which agent requested retrieval */
  agent?: string;
  /** Filters applied */
  filters: {
    category?: string;
    industries?: string[];
    regions?: string[];
    intent_types?: string[];
    tags?: string[];
  };
  /** Number of documents returned */
  resultCount: number;
  /** Top score (0-1) */
  topScore: number;
  /** Mean score of returned docs (0 if none) */
  meanScore: number;
  /** Slugs of returned docs */
  returnedSlugs: string[];
  /** Retrieval duration in ms */
  durationMs: number;
  /** Whether semantic (embedding) retrieval was used */
  semantic: boolean;
}

export interface AnalyticsSummary {
  /** Total retrievals tracked */
  totalRetrievals: number;
  /** Distinct queries (normalized) */
  distinctQueries: number;
  /** Retrievals with 0 results */
  zeroResultCount: number;
  /** Retrievals with topScore < 0.3 */
  lowRelevanceCount: number;
  /** Top 20 queries by frequency (with counts + mean score) */
  topQueries: Array<{ query: string; count: number; meanScore: number; zeroResultCount: number }>;
  /** Top 20 low-relevance queries (sorted by frequency × (1-score)) */
  topLowRelevanceQueries: Array<{ query: string; count: number; meanTopScore: number }>;
  /** Top 20 zero-result queries (sorted by frequency) */
  topZeroResultQueries: Array<{ query: string; count: number }>;
  /** Top 10 most-retrieved docs (slug + retrieval count) */
  topRetrievedDocs: Array<{ slug: string; title: string; count: number }>;
  /** Industries mentioned in queries but NOT covered in KB */
  missingIndustries: Array<{ industry: string; queryCount: number; sampleQueries: string[] }>;
  /** Regions mentioned in queries but NOT covered in KB */
  missingRegions: Array<{ region: string; queryCount: number; sampleQueries: string[] }>;
  /** Earliest and latest retrieval timestamps in the dataset */
  earliestTs: string | null;
  latestTs: string | null;
  /** Number of months covered */
  monthsCovered: string[];
}

// ============================================================
// Constants
// ============================================================

const ANALYTICS_ROOT = resolve(process.cwd(), '.knowledge-analytics');
const FLUSH_THRESHOLD = 50;
const MAX_QUERY_LEN = 500;

// Curated keyword → industry/region mapping (for gap detection).
// These are the canonical slugs used in the KB's frontmatter.
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  saas: ['saas', 'software-as-a-service', 'cloud software', 'subscription software'],
  ecommerce: ['ecommerce', 'e-commerce', 'online retail', 'd2c', 'direct-to-consumer', 'shopify'],
  retail: ['retail', 'brick-and-mortar', 'pos', 'point of sale', 'store'],
  manufacturing: ['manufacturing', 'factory', 'production line', 'industrial', 'oem', 'odm'],
  agriculture: ['agriculture', 'agribusiness', 'farming', 'agritech', 'ag-tech', 'crop'],
  'real-estate': ['real estate', 'property', 'construction', 'builder', 'developer', 'proptech'],
  'financial-services': ['financial services', 'banking', 'insurance', 'fintech', 'wealth management', 'asset management'],
  healthcare: ['healthcare', 'health care', 'medical', 'hospital', 'pharma', 'biotech', 'life sciences', 'medtech'],
  logistics: ['logistics', 'supply chain', 'freight', 'shipping', 'warehousing', '3pl', '4pl', 'last mile', 'cargo'],
  education: ['education', 'edtech', 'k-12', 'higher ed', 'university', 'school', 'learning', 'training', 'lms'],
  energy: ['energy', 'oil and gas', 'oil & gas', 'petroleum', 'renewable', 'solar', 'wind', 'utility', 'power grid', 'cleantech'],
  legal: ['legal', 'law firm', 'lawyer', 'attorney', 'litigation', 'biglaw', 'corporate counsel'],
  media: ['media', 'entertainment', 'streaming', 'gaming', 'publishing', 'broadcasting', 'content'],
  hospitality: ['hospitality', 'hotel', 'restaurant', 'travel', 'tourism', 'food service', 'lodging', 'cruise'],
  'telecommunications': ['telecom', 'telecommunications', 'isp', 'mobile operator', 'carrier'],
  'automotive': ['automotive', 'auto', 'vehicle', 'car', 'ev', 'electric vehicle'],
  'government': ['government', 'public sector', 'municipal', 'federal', 'state and local'],
  'nonprofit': ['nonprofit', 'non-profit', 'ngo', 'charity', 'foundation'],
};

const REGION_KEYWORDS: Record<string, string[]> = {
  'united-states': ['united states', 'usa', 'us ', 'america', 'american'],
  'united-kingdom': ['united kingdom', 'uk ', 'britain', 'british', 'england', 'scotland', 'wales'],
  'european-union': ['european union', 'europe', 'eu ', 'germany', 'france', 'spain', 'italy', 'netherlands'],
  vietnam: ['vietnam', 'vietnamese'],
  india: ['india', 'indian'],
  china: ['china', 'chinese', 'prc'],
  'latin-america': ['latin america', 'latam', 'brazil', 'mexico', 'argentina', 'colombia', 'chile'],
  mena: ['mena', 'middle east', 'gcc', 'uae', 'saudi', 'dubai', 'riyadh', 'egypt', 'israel'],
  anz: ['australia', 'new zealand', 'anz', 'oceania', 'sydney', 'melbourne', 'auckland'],
  canada: ['canada', 'canadian'],
  japan: ['japan', 'japanese'],
  korea: ['korea', 'korean', 'south korea'],
  'southeast-asia': ['southeast asia', 'sea ', 'singapore', 'malaysia', 'indonesia', 'thailand', 'philippines'],
  africa: ['africa', 'african', 'nigeria', 'south africa', 'kenya', 'egypt'],
};

// ============================================================
// In-Memory Buffer
// ============================================================

let buffer: RetrievalLogEntry[] = [];
let flushInProgress = false;

// ============================================================
// Public API
// ============================================================

/**
 * Log a retrieval call. Fire-and-forget — never throws.
 * Call this from the loader / semantic retriever AFTER results
 * are computed, so analytics never blocks retrieval.
 */
export function logRetrieval(entry: Omit<RetrievalLogEntry, 'ts' | 'month'>): void {
  try {
    const now = new Date();
    const ts = now.toISOString();
    const month = ts.slice(0, 7); // YYYY-MM

    const fullEntry: RetrievalLogEntry = {
      ...entry,
      query: entry.query.slice(0, MAX_QUERY_LEN),
      ts,
      month,
    };

    buffer.push(fullEntry);

    if (buffer.length >= FLUSH_THRESHOLD) {
      void flush();
    }
  } catch {
    // Swallow — analytics must never break retrieval
  }
}

/**
 * Force-flush the buffer to disk. Await this before reading
 * analytics for a consistent view.
 */
export async function flush(): Promise<void> {
  if (flushInProgress || buffer.length === 0) return;
  flushInProgress = true;
  const toWrite = buffer;
  buffer = [];
  try {
    if (!existsSync(ANALYTICS_ROOT)) {
      mkdirSync(ANALYTICS_ROOT, { recursive: true });
    }
    const month = new Date().toISOString().slice(0, 7);
    const file = join(ANALYTICS_ROOT, `retrievals-${month}.jsonl`);
    const lines = toWrite.map((e) => JSON.stringify(e)).join('\n') + '\n';
    appendFileSync(file, lines, 'utf8');
  } catch (err) {
    // Put entries back at the front of the buffer for retry
    buffer.unshift(...toWrite);
    console.warn('[knowledge/analytics] flush failed:', err);
  } finally {
    flushInProgress = false;
  }
}

/**
 * Synchronous flush — used by CLI scripts that need a final flush
 * before exit.
 */
export function flushSync(): void {
  if (buffer.length === 0) return;
  const toWrite = buffer;
  buffer = [];
  try {
    if (!existsSync(ANALYTICS_ROOT)) {
      mkdirSync(ANALYTICS_ROOT, { recursive: true });
    }
    const month = new Date().toISOString().slice(0, 7);
    const file = join(ANALYTICS_ROOT, `retrievals-${month}.jsonl`);
    const lines = toWrite.map((e) => JSON.stringify(e)).join('\n') + '\n';
    appendFileSync(file, lines, 'utf8');
  } catch (err) {
    console.warn('[knowledge/analytics] flushSync failed:', err);
    buffer.unshift(...toWrite);
  }
}

// ============================================================
// Analytics Aggregation
// ============================================================

/**
 * Read all retrieval logs from disk and return a structured summary.
 * Used by the Echo gap-report generator and the /knowledge admin UI.
 */
export function getAnalyticsSummary(options: { monthsBack?: number } = {}): AnalyticsSummary {
  const monthsBack = options.monthsBack ?? 6;

  // Make sure in-memory buffer is flushed first
  flushSync();

  const entries = readAllEntries(monthsBack);

  // Build aggregations
  const queryCounts = new Map<string, { count: number; scoreSum: number; zeroCount: number }>();
  const docCounts = new Map<string, { slug: string; title: string; count: number }>();
  const lowRelevanceQueries = new Map<string, { count: number; scoreSum: number }>();
  const zeroResultQueries = new Map<string, number>();
  const industryQueryCounts = new Map<string, { count: number; samples: string[] }>();
  const regionQueryCounts = new Map<string, { count: number; samples: string[] }>();

  const monthsCoveredSet = new Set<string>();
  let earliestTs: string | null = null;
  let latestTs: string | null = null;
  let totalRetrievals = 0;
  let zeroResultCount = 0;
  let lowRelevanceCount = 0;

  for (const entry of entries) {
    totalRetrievals++;
    monthsCoveredSet.add(entry.month);
    if (!earliestTs || entry.ts < earliestTs) earliestTs = entry.ts;
    if (!latestTs || entry.ts > latestTs) latestTs = entry.ts;

    const normalizedQuery = normalizeQuery(entry.query);
    if (normalizedQuery) {
      const existing = queryCounts.get(normalizedQuery) || { count: 0, scoreSum: 0, zeroCount: 0 };
      existing.count++;
      existing.scoreSum += entry.meanScore;
      if (entry.resultCount === 0) existing.zeroCount++;
      queryCounts.set(normalizedQuery, existing);
    }

    if (entry.resultCount === 0) {
      zeroResultCount++;
      if (normalizedQuery) {
        zeroResultQueries.set(normalizedQuery, (zeroResultQueries.get(normalizedQuery) || 0) + 1);
      }
    }

    if (entry.topScore > 0 && entry.topScore < 0.3) {
      lowRelevanceCount++;
      if (normalizedQuery) {
        const existing = lowRelevanceQueries.get(normalizedQuery) || { count: 0, scoreSum: 0 };
        existing.count++;
        existing.scoreSum += entry.topScore;
        lowRelevanceQueries.set(normalizedQuery, existing);
      }
    }

    for (const slug of entry.returnedSlugs) {
      const existing = docCounts.get(slug) || { slug, title: slug, count: 0 };
      existing.count++;
      docCounts.set(slug, existing);
    }

    // Industry / region gap detection — only when retrieval was low-quality
    if (entry.topScore < 0.4 || entry.resultCount === 0) {
      const lowerQuery = entry.query.toLowerCase();
      for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
        if (keywords.some((k) => lowerQuery.includes(k))) {
          const existing = industryQueryCounts.get(industry) || { count: 0, samples: [] };
          existing.count++;
          if (existing.samples.length < 3) existing.samples.push(entry.query.slice(0, 100));
          industryQueryCounts.set(industry, existing);
        }
      }
      for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
        if (keywords.some((k) => lowerQuery.includes(k))) {
          const existing = regionQueryCounts.get(region) || { count: 0, samples: [] };
          existing.count++;
          if (existing.samples.length < 3) existing.samples.push(entry.query.slice(0, 100));
          regionQueryCounts.set(region, existing);
        }
      }
    }
  }

  // Sort + slice
  const topQueries = Array.from(queryCounts.entries())
    .map(([query, v]) => ({ query, count: v.count, meanScore: v.count > 0 ? v.scoreSum / v.count : 0, zeroResultCount: v.zeroCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const topLowRelevanceQueries = Array.from(lowRelevanceQueries.entries())
    .map(([query, v]) => ({ query, count: v.count, meanTopScore: v.count > 0 ? v.scoreSum / v.count : 0 }))
    .sort((a, b) => (b.count * (1 - b.meanTopScore)) - (a.count * (1 - a.meanTopScore)))
    .slice(0, 20);

  const topZeroResultQueries = Array.from(zeroResultQueries.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const topRetrievedDocs = Array.from(docCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const missingIndustries = Array.from(industryQueryCounts.entries())
    .map(([industry, v]) => ({ industry, queryCount: v.count, sampleQueries: v.samples }))
    .sort((a, b) => b.queryCount - a.queryCount);

  const missingRegions = Array.from(regionQueryCounts.entries())
    .map(([region, v]) => ({ region, queryCount: v.count, sampleQueries: v.samples }))
    .sort((a, b) => b.queryCount - a.queryCount);

  return {
    totalRetrievals,
    distinctQueries: queryCounts.size,
    zeroResultCount,
    lowRelevanceCount,
    topQueries,
    topLowRelevanceQueries,
    topZeroResultQueries,
    topRetrievedDocs,
    missingIndustries,
    missingRegions,
    earliestTs,
    latestTs,
    monthsCovered: Array.from(monthsCoveredSet).sort(),
  };
}

/**
 * Get raw retrieval entries for a specific month (or current month if not given).
 * Useful for detailed inspection / debugging.
 */
export function getRawEntries(month?: string): RetrievalLogEntry[] {
  flushSync();
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const file = join(ANALYTICS_ROOT, `retrievals-${targetMonth}.jsonl`);
  if (!existsSync(file)) return [];
  return readJsonl(file);
}

// ============================================================
// Helpers
// ============================================================

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}

function readAllEntries(monthsBack: number): RetrievalLogEntry[] {
  if (!existsSync(ANALYTICS_ROOT)) return [];

  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const allEntries: RetrievalLogEntry[] = [];
  for (const month of months) {
    const file = join(ANALYTICS_ROOT, `retrievals-${month}.jsonl`);
    if (existsSync(file)) {
      allEntries.push(...readJsonl(file));
    }
  }
  return allEntries;
}

function readJsonl(file: string): RetrievalLogEntry[] {
  try {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim());
    const entries: RetrievalLogEntry[] = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line) as RetrievalLogEntry);
      } catch {
        // Skip malformed lines
      }
    }
    return entries;
  } catch {
    return [];
  }
}

/**
 * Check if analytics tracking is active (i.e., the analytics dir exists).
 */
export function isAnalyticsActive(): boolean {
  return existsSync(ANALYTICS_ROOT);
}

/**
 * Get the analytics directory path (for the admin UI to surface).
 */
export function getAnalyticsDir(): string {
  return ANALYTICS_ROOT;
}
