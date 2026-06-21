// ============================================================
// Z.AI Embeddings Client — Knowledge Base Semantic Retrieval
// ============================================================
// Calls Z.AI's /embeddings endpoint (model: embedding-3) to generate
// 2048-dim dense vectors for knowledge documents and queries.
// Embeddings are cached on disk so we don't pay the API cost on
// every server restart.
//
// Design:
//   - Disk cache at .knowledge-cache/embeddings.json (slug → vector)
//   - Lazy: only embeds when semantic retrieval is requested
//   - Batch API: up to 64 inputs per call (per Z.AI limit)
//   - Rate-limited: reuses the LLM rate limiter (1 concurrent, 3.5s)
//   - Graceful degradation: returns null on any failure
//
// Cache invalidation: cache key = sha256(body)[0..16]. If the doc
// body changes, the cache miss triggers a fresh embedding.
// ============================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';
import { getZhipuToken, getZhipuApiBase, isZhipuConfigured } from '../zhipu-jwt';
import { withRateLimit } from '../network-helpers';

// ============================================================
// Constants
// ============================================================

const CACHE_DIR = resolve(process.cwd(), '.knowledge-cache');
const EMBEDDINGS_CACHE_FILE = join(CACHE_DIR, 'embeddings.json');
const BATCH_SIZE = 16; // conservative — Z.AI allows up to 64 but we keep it small to stay under token limits
const EMBEDDING_DIM = 2048; // embedding-3 default dimensionality

const EMBEDDINGS_MODEL = 'embedding-3';

// ============================================================
// Types
// ============================================================

export interface EmbeddingCacheEntry {
  /** Slug of the document */
  slug: string;
  /** SHA-256 of the body (first 16 hex chars) — used for cache invalidation */
  bodyHash: string;
  /** The embedding vector */
  vector: number[];
  /** ISO timestamp of when this embedding was generated */
  generatedAt: string;
}

export interface EmbeddingCache {
  /** Map of slug → cache entry */
  entries: Record<string, EmbeddingCacheEntry>;
  /** Cache file version */
  version: number;
  /** ISO timestamp of last cache update */
  updatedAt: string;
}

// ============================================================
// In-Memory Cache (mirrors disk cache)
// ============================================================

let cache: EmbeddingCache | null = null;
let embeddingInProgress: Promise<void> | null = null;

// ============================================================
// Cache Management
// ============================================================

function loadCache(): EmbeddingCache {
  if (cache) return cache;
  try {
    if (existsSync(EMBEDDINGS_CACHE_FILE)) {
      const raw = readFileSync(EMBEDDINGS_CACHE_FILE, 'utf8');
      cache = JSON.parse(raw) as EmbeddingCache;
      return cache!;
    }
  } catch (err) {
    console.warn('[knowledge/embeddings] Failed to load cache:', err);
  }
  cache = { entries: {}, version: 1, updatedAt: new Date().toISOString() };
  return cache;
}

function saveCache(c: EmbeddingCache): void {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    c.updatedAt = new Date().toISOString();
    writeFileSync(EMBEDDINGS_CACHE_FILE, JSON.stringify(c), 'utf8');
  } catch (err) {
    console.warn('[knowledge/embeddings] Failed to save cache:', err);
  }
}

function bodyHash(body: string): string {
  return createHash('sha256').update(body).digest('hex').slice(0, 16);
}

// ============================================================
// Public API
// ============================================================

/**
 * Get the embedding for a single text. Uses cache when available.
 * Returns null if the API is unavailable or the call fails.
 */
export async function embedText(text: string, slug: string = '_query_'): Promise<number[] | null> {
  const hash = bodyHash(text);
  const c = loadCache();

  // Cache hit
  const cached = c.entries[slug];
  if (cached && cached.bodyHash === hash) {
    return cached.vector;
  }

  // Cache miss — call the API
  const vectors = await embedBatchInternal([{ slug, text }]);
  return vectors[0] || null;
}

/**
 * Embed a query (always fresh — never cached, since queries are unique).
 * Use this for runtime query embedding.
 */
export async function embedQuery(query: string): Promise<number[] | null> {
  if (!isZhipuConfigured()) return null;
  try {
    const vectors = await embedBatchInternal([{ slug: '_query_', text: query, skipCache: true }]);
    return vectors[0] || null;
  } catch (err) {
    console.warn('[knowledge/embeddings] embedQuery failed:', err);
    return null;
  }
}

/**
 * Embed (or load from cache) a batch of documents. Returns a map of
 * slug → vector. Documents already cached with matching body hash are
 * not re-embedded.
 *
 * This is the primary function used by the semantic retriever to
 * embed the entire knowledge base on first use.
 */
export async function embedDocuments(
  docs: Array<{ slug: string; body: string }>
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();
  const c = loadCache();

  // Partition into cache hits and misses
  const misses: Array<{ slug: string; text: string }> = [];
  for (const doc of docs) {
    const hash = bodyHash(doc.body);
    const cached = c.entries[doc.slug];
    if (cached && cached.bodyHash === hash) {
      result.set(doc.slug, cached.vector);
    } else {
      misses.push({ slug: doc.slug, text: doc.body });
    }
  }

  if (misses.length === 0) {
    return result;
  }

  // Embed misses in batches
  console.log(`[knowledge/embeddings] Embedding ${misses.length} document(s) (cache hits: ${result.size})`);

  for (let i = 0; i < misses.length; i += BATCH_SIZE) {
    const batch = misses.slice(i, i + BATCH_SIZE);
    try {
      const vectors = await embedBatchInternal(batch);
      for (let j = 0; j < batch.length; j++) {
        const slug = batch[j].slug;
        const text = batch[j].text;
        const vector = vectors[j];
        if (vector) {
          result.set(slug, vector);
          c.entries[slug] = {
            slug,
            bodyHash: bodyHash(text),
            vector,
            generatedAt: new Date().toISOString(),
          };
        }
      }
      // Save cache after each batch (so progress isn't lost on crash)
      saveCache(c);
    } catch (err) {
      console.warn(`[knowledge/embeddings] Batch ${i / BATCH_SIZE + 1} failed:`, err);
    }
  }

  return result;
}

/**
 * Pre-warm the cache by embedding all knowledge documents.
 * Call this from a CLI script or background job.
 */
export async function prewarmEmbeddings(
  docs: Array<{ slug: string; body: string }>,
  onProgress?: (done: number, total: number) => void
): Promise<{ embedded: number; cached: number; failed: number }> {
  const c = loadCache();
  let embedded = 0;
  let cached = 0;
  let failed = 0;

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const hash = bodyHash(doc.body);
    const existing = c.entries[doc.slug];
    if (existing && existing.bodyHash === hash) {
      cached++;
      onProgress?.(i + 1, docs.length);
      continue;
    }

    try {
      const vectors = await embedBatchInternal([{ slug: doc.slug, text: doc.body }]);
      const vector = vectors[0];
      if (vector) {
        c.entries[doc.slug] = {
          slug: doc.slug,
          bodyHash: hash,
          vector,
          generatedAt: new Date().toISOString(),
        };
        embedded++;
      } else {
        failed++;
      }
      saveCache(c);
    } catch {
      failed++;
    }
    onProgress?.(i + 1, docs.length);
  }

  return { embedded, cached, failed };
}

/**
 * Get the cache stats (number of cached embeddings, cache file size, etc.)
 */
export function getEmbeddingsCacheStats(): {
  cachedCount: number;
  cacheSizeBytes: number;
  updatedAt: string | null;
  cacheFile: string;
  model: string;
  dimension: number;
} {
  const c = loadCache();
  let cacheSizeBytes = 0;
  if (existsSync(EMBEDDINGS_CACHE_FILE)) {
    try {
      const stat = require('fs').statSync(EMBEDDINGS_CACHE_FILE);
      cacheSizeBytes = stat.size;
    } catch {
      // ignore
    }
  }
  return {
    cachedCount: Object.keys(c.entries).length,
    cacheSizeBytes,
    updatedAt: c.updatedAt,
    cacheFile: EMBEDDINGS_CACHE_FILE,
    model: EMBEDDINGS_MODEL,
    dimension: EMBEDDING_DIM,
  };
}

/**
 * Check if embeddings are available (API configured + cache has at least 1 entry).
 */
export function isSemanticReady(): boolean {
  if (!isZhipuConfigured()) return false;
  const c = loadCache();
  return Object.keys(c.entries).length > 0;
}

/**
 * Clear the embeddings cache (admin operation).
 */
export function clearEmbeddingsCache(): void {
  cache = { entries: {}, version: 1, updatedAt: new Date().toISOString() };
  saveCache(cache);
}

// ============================================================
// Internal: Z.AI Embeddings API Call
// ============================================================

interface BatchItem {
  slug: string;
  text: string;
  skipCache?: boolean;
}

async function embedBatchInternal(items: BatchItem[]): Promise<(number[] | null)[]> {
  if (!isZhipuConfigured()) {
    return items.map(() => null);
  }

  const token = getZhipuToken();
  if (!token) {
    return items.map(() => null);
  }

  // Truncate each text to ~6000 chars to stay within token limits.
  // embedding-3 supports up to 8192 tokens.
  const inputs = items.map((it) => it.text.slice(0, 6000));

  const url = `${getZhipuApiBase()}/embeddings`;

  // Rate-limit via the shared per-host limiter (same one used by llm.ts)
  const json = await withRateLimit(
    url,
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            model: EMBEDDINGS_MODEL,
            input: inputs,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          console.warn(`[knowledge/embeddings] API returned ${res.status}: ${text}`);
          return null;
        }

        return await res.json();
      } finally {
        clearTimeout(timeout);
      }
    },
    { maxRetries: 2, minIntervalMs: 3500, cooldownMs: 30_000 },
  );

  if (!json || !json.data || !Array.isArray(json.data)) {
    console.warn('[knowledge/embeddings] Unexpected response shape');
    return items.map(() => null);
  }

  // Z.AI returns data sorted by index
  const sorted = (json.data as Array<{ embedding: number[]; index: number }>)
    .sort((a, b) => a.index - b.index);
  return items.map((_, i) => sorted[i]?.embedding || null);
}

// ============================================================
// Vector Math Helpers (used by semantic.ts)
// ============================================================

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
