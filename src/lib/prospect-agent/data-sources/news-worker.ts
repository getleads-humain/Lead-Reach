// ============================================================
// News Worker Bridge — TypeScript Client for Newspaper3k Sidecar
// ============================================================
//
// Calls the Python FastAPI news-worker service (port 5341) to extract
// articles, search news for intent signals, and analyze sentiment.
//
// Wired to: Judge (Lead Qualification) — for news-based intent detection.
//
// The worker is started by `python-workers/news-worker/start.sh`.
// If the worker is not running, all calls degrade gracefully:
// the bridge returns an empty result instead of throwing, so the
// agent pipeline continues with other data sources.
// ============================================================

// ─── Configuration ───────────────────────────────────────────────────────

const NEWS_WORKER_URL =
  process.env.NEWS_WORKER_URL || 'http://localhost:5341';
const NEWS_WORKER_TIMEOUT = 90_000; // 90s — article extraction can be slow

// ─── Types ───────────────────────────────────────────────────────────────

export interface NewsArticle {
  url: string;
  title: string;
  authors: string[];
  publishDate: string | null;
  topImage: string | null;
  metaDescription: string;
  metaKeywords: string[];
  text: string;
  summary: string;
  keywords: string[];
  wordCount: number;
  success: boolean;
  error?: string;
}

export interface NewsIntentResult {
  success: boolean;
  companyName: string;
  query: string;
  mentionCount30d: number;
  articles: NewsArticle[];
  intentSignals: Record<string, number>;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    overall: 'positive' | 'negative' | 'neutral';
  };
  publicationDates: string[];
  topSources: string[];
  error?: string;
}

export interface NewsSentiment {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;            // -1.0 to 1.0
  confidence: number;       // 0.0 to 1.0
  method: string;
}

export interface NewsWorkerHealth {
  status: 'ok' | 'error';
  version?: string;
  newspaperAvailable?: boolean;
  spacyAvailable?: boolean;
  uptimeSeconds?: number;
}

// ─── Internal Helpers ────────────────────────────────────────────────────

async function newsFetch<T>(
  path: string,
  body?: Record<string, unknown>,
  method: 'POST' | 'GET' = 'POST',
): Promise<T> {
  const url = `${NEWS_WORKER_URL}${path}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(NEWS_WORKER_TIMEOUT),
  };
  if (method === 'POST' && body) init.body = JSON.stringify(body);

  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`news-worker ${path} returned ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Extract a single article from a URL using Newspaper3k.
 *
 * @example
 * const article = await newsExtractArticle('https://example.com/news/123');
 * console.log(article.title, article.summary, article.keywords);
 */
export async function newsExtractArticle(
  url: string,
  opts: { summarize?: boolean; extractKeywords?: boolean; language?: string } = {},
): Promise<NewsArticle> {
  try {
    return await newsFetch<NewsArticle>('/extract', {
      url,
      summarize: opts.summarize ?? true,
      extract_keywords: opts.extractKeywords ?? true,
      language: opts.language || 'en',
    });
  } catch (err) {
    return {
      url,
      title: '',
      authors: [],
      publishDate: null,
      topImage: null,
      metaDescription: '',
      metaKeywords: [],
      text: '',
      summary: '',
      keywords: [],
      wordCount: 0,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Extract multiple articles in parallel.
 */
export async function newsExtractBatch(
  urls: string[],
  opts: { summarize?: boolean; language?: string; maxConcurrent?: number } = {},
): Promise<NewsArticle[]> {
  try {
    return await newsFetch<NewsArticle[]>('/extract-batch', {
      urls,
      summarize: opts.summarize ?? true,
      language: opts.language || 'en',
      max_concurrent: opts.maxConcurrent || 3,
    });
  } catch (err) {
    // Worker unavailable — return all-failed stubs
    return urls.map(url => ({
      url,
      title: '',
      authors: [],
      publishDate: null,
      topImage: null,
      metaDescription: '',
      metaKeywords: [],
      text: '',
      summary: '',
      keywords: [],
      wordCount: 0,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));
  }
}

/**
 * Search Google News for a company and compute intent signals.
 *
 * Returns mention count, sentiment breakdown, detected intent keywords,
 * and the top articles for the look-back period.
 *
 * @example
 * const intent = await newsSearchIntent('Tesla', { daysBack: 30 });
 * console.log(intent.mentionCount30d, intent.sentiment.overall);
 */
export async function newsSearchIntent(
  companyName: string,
  opts: { daysBack?: number; maxArticles?: number; query?: string; language?: string } = {},
): Promise<NewsIntentResult> {
  try {
    return await newsFetch<NewsIntentResult>('/search-intent', {
      company_name: companyName,
      query: opts.query,
      max_articles: opts.maxArticles ?? 5,
      days_back: opts.daysBack ?? 30,
      language: opts.language || 'en',
    });
  } catch (err) {
    return {
      success: false,
      companyName,
      query: opts.query || companyName,
      mentionCount30d: 0,
      articles: [],
      intentSignals: {},
      sentiment: { positive: 0, negative: 0, neutral: 0, overall: 'neutral' },
      publicationDates: [],
      topSources: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Analyze sentiment of a text snippet.
 */
export async function newsAnalyzeSentiment(
  text: string,
  method: 'vader' | 'spacy' | 'simple' = 'vader',
): Promise<NewsSentiment> {
  try {
    return await newsFetch<NewsSentiment>('/sentiment', { text, method });
  } catch {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      method: 'unavailable',
    };
  }
}

/**
 * Check news worker health.
 */
export async function newsHealth(): Promise<NewsWorkerHealth> {
  try {
    return await newsFetch<NewsWorkerHealth>('/health', undefined, 'GET');
  } catch {
    return { status: 'error' };
  }
}

/**
 * Build a `customKpis` object suitable for storage on a Lead model,
 * based on the results of a news intent search.
 */
export function newsIntentToKPIs(intent: NewsIntentResult): Record<string, number | string | boolean> {
  const kpis: Record<string, number | string | boolean> = {
    news_mention_count_30d: intent.mentionCount30d,
    news_sentiment_overall: intent.sentiment.overall,
    news_positive_count: intent.sentiment.positive,
    news_negative_count: intent.sentiment.negative,
    news_neutral_count: intent.sentiment.neutral,
  };
  for (const [kw, count] of Object.entries(intent.intentSignals)) {
    kpis[`news_intent_${kw.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`] = count;
  }
  return kpis;
}
