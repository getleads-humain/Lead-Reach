/**
 * Knowledge Base Retrieval Layer
 * --------------------------------
 * Hybrid retrieval: BM25 keyword matching + optional semantic embeddings.
 *
 * Files are read from /knowledge directory (markdown + JSONL training data).
 * Each file is parsed into "chunks" (sections for markdown; lines for JSONL).
 * Chunks are indexed with BM25; if Z.AI embedding API is available,
 * embeddings are generated and stored alongside BM25 index for hybrid retrieval.
 *
 * Default retrieval: BM25 only (no API calls, fast, deterministic).
 * Optional: when USE_EMBEDDINGS env var is set, query-time embedding is
 * fetched from Z.AI's embedding-3 API and cosine similarity is computed
 * against pre-computed chunk embeddings.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Types
// ============================================================

export interface KnowledgeChunk {
  id: string;
  filePath: string;            // relative path from /knowledge
  category: 'industry' | 'region' | 'playbook' | 'tool' | 'training-data' | 'gap-report';
  title: string;
  section?: string;            // for markdown sections
  content: string;
  tokens: string[];
  frontmatter?: Record<string, unknown>;
  embedding?: number[];        // optional, populated when embeddings enabled
  lastReviewed?: string;
  grade?: string;
  tags?: string[];
}

export interface SearchResult {
  chunk: KnowledgeChunk;
  score: number;
  matchedTokens: string[];
  retrievalMethod: 'bm25' | 'hybrid';
}

export interface KnowledgeStats {
  totalDocs: number;
  totalChunks: number;
  byCategory: Record<string, number>;
  byGrade: Record<string, number>;
  freshness: {
    fresh: number;       // reviewed in last 90 days
    stale: number;       // 90-180 days
    very_stale: number;  // 180+ days
  };
  embeddingsEnabled: boolean;
}

// ============================================================
// BM25 Implementation (Okapi BM25)
// ============================================================

class BM25Index {
  private chunks: KnowledgeChunk[];
  private docFreq: Map<string, number> = new Map();
  private avgDocLength: number = 0;
  private k1: number = 1.5;
  private b: number = 0.75;

  constructor(chunks: KnowledgeChunk[]) {
    this.chunks = chunks;
    this.build();
  }

  private build(): void {
    let totalLength = 0;
    const seen = new Set<string>();

    for (const chunk of this.chunks) {
      totalLength += chunk.tokens.length;
      seen.clear();
      for (const token of chunk.tokens) {
        if (!seen.has(token)) {
          seen.add(token);
          this.docFreq.set(token, (this.docFreq.get(token) || 0) + 1);
        }
      }
    }
    this.avgDocLength = this.chunks.length > 0 ? totalLength / this.chunks.length : 0;
  }

  search(queryTokens: string[], topK: number = 10): SearchResult[] {
    const N = this.chunks.length;
    const results: SearchResult[] = [];

    for (const chunk of this.chunks) {
      let score = 0;
      const matched: string[] = [];
      const tfMap = new Map<string, number>();
      for (const t of chunk.tokens) {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
      }

      for (const qToken of queryTokens) {
        const tf = tfMap.get(qToken) || 0;
        if (tf === 0) continue;
        matched.push(qToken);
        const df = this.docFreq.get(qToken) || 0;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const denominator = tf + this.k1 * (1 - this.b + this.b * (chunk.tokens.length / Math.max(this.avgDocLength, 1)));
        score += idf * (tf * (this.k1 + 1)) / denominator;
      }

      if (score > 0) {
        results.push({
          chunk,
          score,
          matchedTokens: matched,
          retrievalMethod: 'bm25',
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}

// ============================================================
// Tokenization
// ============================================================

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'shall', 'can', 'need', 'of', 'in', 'on', 'at',
  'to', 'for', 'with', 'by', 'from', 'as', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'over', 'of', 'about', 'against',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'some', 'any', 'no', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'should', 'now',
]);

export function tokenize(text: string): string[] {
  // Lowercase, split on non-alphanumeric, remove stopwords, dedupe
  const lower = text.toLowerCase();
  const raw = lower.match(/[a-z0-9]+/g) || [];
  const out: string[] = [];
  for (const t of raw) {
    if (t.length < 2) continue;
    if (STOPWORDS.has(t)) continue;
    if (/^\d+$/.test(t) && t.length < 3) continue;  // skip 1-2 digit numbers
    out.push(t);
  }
  return out;
}

// ============================================================
// File Parsing
// ============================================================

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  if (!content.startsWith('---')) return { frontmatter: {}, body: content };
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) return { frontmatter: {}, body: content };
  const yamlBlock = content.slice(3, endIdx).trim();
  const body = content.slice(endIdx + 4).trim();
  // Minimal YAML parsing (key: value)
  const frontmatter: Record<string, unknown> = {};
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();
    // Handle quoted strings
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    // Handle arrays [a, b, c]
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    if (key) frontmatter[key] = value;
  }
  return { frontmatter, body };
}

function splitMarkdownIntoSections(body: string): { heading?: string; content: string }[] {
  const lines = body.split('\n');
  const sections: { heading?: string; content: string }[] = [];
  let currentHeading: string | undefined;
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('# ')) {
      if (currentLines.length > 0) {
        sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
      }
      currentHeading = line.replace(/^#+\s*/, '').trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
  }
  return sections.filter(s => s.content.length > 30);
}

function parseMarkdownFile(absPath: string, relPath: string): KnowledgeChunk[] {
  const content = fs.readFileSync(absPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  const sections = splitMarkdownIntoSections(body);
  const title = (frontmatter.title as string) || path.basename(relPath, '.md');
  const category = deriveCategory(relPath);

  return sections.map((section, idx) => ({
    id: `${relPath}#${idx}`,
    filePath: relPath,
    category,
    title,
    section: section.heading,
    content: section.heading ? `## ${section.heading}\n\n${section.content}` : section.content,
    tokens: tokenize(section.content),
    frontmatter,
    lastReviewed: frontmatter.last_reviewed as string | undefined,
    grade: frontmatter.grade as string | undefined,
    tags: frontmatter.tags as string[] | undefined,
  }));
}

function parseJsonlFile(absPath: string, relPath: string): KnowledgeChunk[] {
  const content = fs.readFileSync(absPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const category: KnowledgeChunk['category'] = 'training-data';
  const title = path.basename(relPath, '.jsonl');

  return lines.map((line, idx) => {
    const parsed = JSON.parse(line);
    const contentStr = JSON.stringify(parsed, null, 2);
    return {
      id: `${relPath}#${idx}`,
      filePath: relPath,
      category,
      title,
      section: `Example ${idx + 1}`,
      content: contentStr,
      tokens: tokenize(contentStr),
    } as KnowledgeChunk;
  });
}

function deriveCategory(relPath: string): KnowledgeChunk['category'] {
  if (relPath.startsWith('industries/')) return 'industry';
  if (relPath.startsWith('regions/')) return 'region';
  if (relPath.startsWith('playbooks/')) return 'playbook';
  if (relPath.startsWith('tools/')) return 'tool';
  if (relPath.startsWith('training-data/')) return 'training-data';
  if (relPath.startsWith('gap-reports/')) return 'gap-report';
  return 'playbook';
}

function walkKnowledgeDir(dir: string, baseDir: string = dir): { abs: string; rel: string }[] {
  const out: { abs: string; rel: string }[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkKnowledgeDir(abs, baseDir));
    } else if (entry.isFile()) {
      if (entry.name === 'README.md') continue;
      const rel = path.relative(baseDir, abs).split(path.sep).join('/');
      out.push({ abs, rel });
    }
  }
  return out;
}

// ============================================================
// Knowledge Index (Singleton)
// ============================================================

const EMBEDDINGS_CACHE_PATH = path.join(process.cwd(), '.knowledge-embeddings.cache.json');
const EMBEDDINGS_BATCH_SIZE = 16;        // Z.AI embedding API accepts up to 64/batch; keep conservative
const EMBEDDINGS_BATCH_DELAY_MS = 200;   // polite delay between batches
const EMBEDDING_MODEL = process.env.KNOWLEDGE_EMBEDDING_MODEL || 'embedding-3';
const EMBEDDING_FALLBACK_MODEL = 'embedding-2';  // widely available on Z.AI accounts
const ZHIPU_EMBEDDINGS_URL = 'https://open.bigmodel.cn/api/paas/v4/embeddings';

interface EmbeddingsCache {
  version: 1;
  model: string;
  generated_at: string;
  chunk_count: number;
  embeddings: Record<string, number[]>;  // chunkId -> embedding vector
}

class KnowledgeIndex {
  private chunks: KnowledgeChunk[] = [];
  private bm25: BM25Index | null = null;
  private loaded = false;
  private embeddingsEnabled = false;
  private embeddingsCache: Map<string, number[]> = new Map();
  private embeddingsLoaded = false;

  load(force = false): void {
    if (this.loaded && !force) return;
    this.chunks = [];
    const files = walkKnowledgeDir(KNOWLEDGE_DIR);
    for (const { abs, rel } of files) {
      try {
        if (rel.endsWith('.md')) {
          this.chunks.push(...parseMarkdownFile(abs, rel));
        } else if (rel.endsWith('.jsonl')) {
          this.chunks.push(...parseJsonlFile(abs, rel));
        }
      } catch (err) {
        console.error(`[knowledge] Failed to parse ${rel}:`, err);
      }
    }
    this.bm25 = new BM25Index(this.chunks);
    this.embeddingsEnabled = process.env.USE_KNOWLEDGE_EMBEDDINGS === 'true';
    this.loaded = true;
    console.log(`[knowledge] Loaded ${this.chunks.length} chunks from ${files.length} files (embeddings: ${this.embeddingsEnabled})`);

    // Pre-load cached embeddings from disk (non-blocking, async)
    if (this.embeddingsEnabled) {
      void this.loadEmbeddingsFromDisk();
    }
  }

  /**
   * Load cached embeddings from disk into the in-memory map.
   * Stale entries (chunk IDs no longer in the index) are pruned.
   * Missing entries are queued for background computation.
   */
  private async loadEmbeddingsFromDisk(): Promise<void> {
    if (this.embeddingsLoaded) return;
    this.embeddingsLoaded = true;
    try {
      if (!fs.existsSync(EMBEDDINGS_CACHE_PATH)) {
        console.log('[knowledge] No embeddings cache found — will compute on demand');
        return;
      }
      const raw = fs.readFileSync(EMBEDDINGS_CACHE_PATH, 'utf-8');
      const cache = JSON.parse(raw) as EmbeddingsCache;
      if (cache.version !== 1 || cache.model !== EMBEDDING_MODEL) {
        console.log(`[knowledge] Embeddings cache outdated (model=${cache.model}, version=${cache.version}) — will recompute`);
        return;
      }
      const validChunkIds = new Set(this.chunks.map(c => c.id));
      let pruned = 0;
      this.embeddingsCache.clear();
      for (const [id, vec] of Object.entries(cache.embeddings)) {
        if (validChunkIds.has(id)) {
          this.embeddingsCache.set(id, vec);
          // Also attach to chunk for in-place access
          const chunk = this.chunks.find(c => c.id === id);
          if (chunk) chunk.embedding = vec;
        } else {
          pruned++;
        }
      }
      console.log(`[knowledge] Loaded ${this.embeddingsCache.size} cached embeddings from disk${pruned > 0 ? ` (pruned ${pruned} stale)` : ''}`);
    } catch (err) {
      console.error('[knowledge] Failed to load embeddings cache:', err);
    }
  }

  /**
   * Pre-compute embeddings for ALL chunks that don't have one yet.
   * Persists to disk for fast subsequent loads.
   *
   * This is invoked:
   *   - On demand via POST /api/knowledge/precompute-embeddings (admin)
   *   - From the CLI: npx tsx scripts/precompute-embeddings.ts
   *   - Automatically as a background job after each knowledge:reindex
   *
   * Returns a summary of how many embeddings were generated.
   */
  async precomputeEmbeddings(): Promise<{ total: number; generated: number; cached: number; failed: number }> {
    if (!this.embeddingsEnabled) {
      throw new Error('USE_KNOWLEDGE_EMBEDDINGS is not true — cannot precompute embeddings');
    }
    this.load();
    await this.loadEmbeddingsFromDisk();

    const missing = this.chunks.filter(c => !this.embeddingsCache.has(c.id));
    console.log(`[knowledge] Pre-computing embeddings: ${missing.length} missing / ${this.embeddingsCache.size} cached / ${this.chunks.length} total`);

    let generated = 0;
    let failed = 0;
    for (let i = 0; i < missing.length; i += EMBEDDINGS_BATCH_SIZE) {
      const batch = missing.slice(i, i + EMBEDDINGS_BATCH_SIZE);
      try {
        const vectors = await generateEmbeddingsBatch(batch.map(c => c.content));
        if (vectors) {
          for (let j = 0; j < batch.length; j++) {
            const vec = vectors[j];
            if (vec) {
              this.embeddingsCache.set(batch[j].id, vec);
              batch[j].embedding = vec;
              generated++;
            } else {
              failed++;
            }
          }
        } else {
          failed += batch.length;
        }
      } catch (err) {
        console.error(`[knowledge] Batch ${i / EMBEDDINGS_BATCH_SIZE + 1} failed:`, err);
        failed += batch.length;
      }
      // Persist after each batch so progress isn't lost
      this.persistEmbeddings();
      // Polite delay
      if (i + EMBEDDINGS_BATCH_SIZE < missing.length) {
        await new Promise(r => setTimeout(r, EMBEDDINGS_BATCH_DELAY_MS));
      }
    }

    console.log(`[knowledge] Pre-compute complete: ${generated} generated, ${failed} failed, ${this.embeddingsCache.size} total cached`);
    return { total: this.chunks.length, generated, cached: this.embeddingsCache.size, failed };
  }

  /**
   * Persist the in-memory embeddings cache to disk.
   */
  private persistEmbeddings(): void {
    const cache: EmbeddingsCache = {
      version: 1,
      model: EMBEDDING_MODEL,
      generated_at: new Date().toISOString(),
      chunk_count: this.chunks.length,
      embeddings: Object.fromEntries(this.embeddingsCache),
    };
    try {
      fs.writeFileSync(EMBEDDINGS_CACHE_PATH, JSON.stringify(cache), 'utf-8');
    } catch (err) {
      console.error('[knowledge] Failed to persist embeddings cache:', err);
    }
  }

  search(query: string, topK = 10, filterCategory?: KnowledgeChunk['category']): SearchResult[] {
    this.load();
    if (!this.bm25) return [];
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    let results = this.bm25.search(queryTokens, topK * 3);  // over-fetch before filtering
    if (filterCategory) {
      results = results.filter(r => r.chunk.category === filterCategory);
    }
    return results.slice(0, topK);
  }

  listDocs(): KnowledgeChunk[] {
    this.load();
    return this.chunks;
  }

  listFiles(): { path: string; category: string; title: string; grade?: string; lastReviewed?: string; tags?: string[] }[] {
    this.load();
    const seen = new Map<string, KnowledgeChunk>();
    for (const chunk of this.chunks) {
      if (!seen.has(chunk.filePath)) seen.set(chunk.filePath, chunk);
    }
    return Array.from(seen.values()).map(c => ({
      path: c.filePath,
      category: c.category,
      title: c.title,
      grade: c.grade,
      lastReviewed: c.lastReviewed,
      tags: c.tags,
    }));
  }

  readRaw(filePath: string): string | null {
    this.load();
    const safe = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
    const abs = path.join(KNOWLEDGE_DIR, safe);
    if (!abs.startsWith(KNOWLEDGE_DIR)) return null;  // path traversal guard
    if (!fs.existsSync(abs)) return null;
    return fs.readFileSync(abs, 'utf-8');
  }

  stats(): KnowledgeStats {
    this.load();
    const byCategory: Record<string, number> = {};
    const byGrade: Record<string, number> = {};
    const seenFiles = new Map<string, KnowledgeChunk>();

    for (const chunk of this.chunks) {
      byCategory[chunk.category] = (byCategory[chunk.category] || 0) + 1;
      if (chunk.grade) byGrade[chunk.grade] = (byGrade[chunk.grade] || 0) + 1;
      if (!seenFiles.has(chunk.filePath)) seenFiles.set(chunk.filePath, chunk);
    }

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    let fresh = 0, stale = 0, veryStale = 0;
    for (const chunk of seenFiles.values()) {
      if (!chunk.lastReviewed) { veryStale++; continue; }
      const reviewed = new Date(chunk.lastReviewed).getTime();
      const days = (now - reviewed) / DAY;
      if (days < 90) fresh++;
      else if (days < 180) stale++;
      else veryStale++;
    }

    return {
      totalDocs: seenFiles.size,
      totalChunks: this.chunks.length,
      byCategory,
      byGrade,
      freshness: { fresh, stale, very_stale: veryStale },
      embeddingsEnabled: this.embeddingsEnabled,
    };
  }

  /**
   * Return the number of chunks that have a precomputed embedding cached.
   * Used by /api/knowledge/stats to show "embeddings: 187/226 cached".
   */
  embeddingsCoverage(): { cached: number; total: number } {
    return {
      cached: this.embeddingsCache.size,
      total: this.chunks.length,
    };
  }

  isEmbeddingsEnabled(): boolean {
    return this.embeddingsEnabled;
  }
}

// Singleton
let _index: KnowledgeIndex | null = null;
export function getKnowledgeIndex(): KnowledgeIndex {
  if (!_index) _index = new KnowledgeIndex();
  return _index;
}

// ============================================================
// Embeddings (Optional — Z.AI embedding-3 API)
// ============================================================

/**
 * Call Z.AI embeddings API with model fallback.
 * Tries EMBEDDING_MODEL (default 'embedding-3') first; falls back to
 * EMBEDDING_FALLBACK_MODEL ('embedding-2') on 400 / model-not-found.
 *
 * Returns the parsed response data, or null on failure.
 */
async function callZhipuEmbeddings(
  input: string | string[],
  apiKey: string
): Promise<{ data: { embedding: number[] }[] } | null> {
  const inputs = Array.isArray(input) ? input : [input];
  for (const model of [EMBEDDING_MODEL, EMBEDDING_FALLBACK_MODEL]) {
    try {
      const resp = await fetch(ZHIPU_EMBEDDINGS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: inputs.map(t => t.slice(0, 8000)),
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        // 400 = model not found / bad request — try fallback model
        if (resp.status === 400 && model === EMBEDDING_MODEL) {
          console.warn(`[knowledge] Embedding model "${model}" rejected (400) — falling back to "${EMBEDDING_FALLBACK_MODEL}"`);
          continue;
        }
        console.error(`[knowledge] Embedding API (${model}) failed:`, resp.status, errText.slice(0, 200));
        return null;
      }
      const data = await resp.json() as { data: { embedding: number[] }[] };
      if (!data.data || data.data.length !== inputs.length) {
        console.error(`[knowledge] Embedding (${model}) response length mismatch: expected ${inputs.length}, got ${data.data?.length ?? 0}`);
        return null;
      }
      return data;
    } catch (err) {
      console.error(`[knowledge] Embedding (${model}) network error:`, err);
      // Try fallback model
      if (model === EMBEDDING_MODEL) continue;
      return null;
    }
  }
  return null;
}

/**
 * Optional: generate embeddings for a chunk using Z.AI's embedding-3 API.
 * Disabled by default; enable via USE_KNOWLEDGE_EMBEDDINGS=true.
 *
 * Returns null if embeddings are disabled or the API call fails.
 *
 * For bulk pre-computation, use generateEmbeddingsBatch() instead.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (process.env.USE_KNOWLEDGE_EMBEDDINGS !== 'true') return null;
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) return null;

  const data = await callZhipuEmbeddings(text, apiKey);
  return data?.data?.[0]?.embedding ?? null;
}

/**
 * Batch-embed multiple texts in a single API call (Z.AI embedding API supports up to 64 inputs).
 * Returns null on failure; partial results on per-input failure are not supported.
 *
 * Use this for pre-computing chunk embeddings at index time.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[] | null> {
  if (process.env.USE_KNOWLEDGE_EMBEDDINGS !== 'true') return null;
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) return null;
  if (texts.length === 0) return [];

  const data = await callZhipuEmbeddings(texts, apiKey);
  if (!data) return null;
  return data.data.map(d => d.embedding);
}

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

/**
 * Hybrid search: BM25 + optional embeddings.
 * When embeddings are enabled:
 *   - Pre-computed chunk embeddings are loaded from disk cache (fast path).
 *   - Query embedding is generated on-the-fly (single API call).
 *   - BM25 score (normalized) is combined with cosine similarity (60/40 weighting).
 *   - Missing chunk embeddings fall back to BM25-only scoring (graceful degradation).
 */
export async function hybridSearch(
  query: string,
  topK = 10,
  filterCategory?: KnowledgeChunk['category']
): Promise<SearchResult[]> {
  const index = getKnowledgeIndex();
  const bm25Results = index.search(query, topK * 2, filterCategory);

  if (!index.isEmbeddingsEnabled()) {
    return bm25Results.slice(0, topK);
  }

  // Embeddings enabled — fetch query embedding
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) {
    return bm25Results.slice(0, topK);
  }

  // Combine BM25 score with cosine similarity of pre-cached chunk embeddings.
  // Missing chunk embeddings fall back to BM25-only (no blocking API calls in the
  // hot path — embeddings should be pre-computed via precomputeEmbeddings()).
  const maxBm25 = Math.max(...bm25Results.map(r => r.score), 1);
  const hybridResults: SearchResult[] = [];

  for (const bm25Result of bm25Results) {
    if (bm25Result.chunk.embedding) {
      const cosine = cosineSimilarity(queryEmbedding, bm25Result.chunk.embedding);
      const bm25Norm = bm25Result.score / maxBm25;
      const hybridScore = 0.4 * bm25Norm + 0.6 * cosine;
      hybridResults.push({
        ...bm25Result,
        score: hybridScore,
        retrievalMethod: 'hybrid',
      });
    } else {
      // No pre-computed embedding — fall back to BM25-only
      hybridResults.push(bm25Result);
    }
  }

  hybridResults.sort((a, b) => b.score - a.score);
  return hybridResults.slice(0, topK);
}
