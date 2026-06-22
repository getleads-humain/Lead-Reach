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

class KnowledgeIndex {
  private chunks: KnowledgeChunk[] = [];
  private bm25: BM25Index | null = null;
  private loaded = false;
  private embeddingsEnabled = false;

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
 * Optional: generate embeddings for a chunk using Z.AI's embedding-3 API.
 * Disabled by default; enable via USE_KNOWLEDGE_EMBEDDINGS=true.
 *
 * Returns null if embeddings are disabled or the API call fails.
 *
 * Future enhancement: pre-compute chunk embeddings at index time and
 * store to disk for fast cosine similarity at query time.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (process.env.USE_KNOWLEDGE_EMBEDDINGS !== 'true') return null;
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) return null;

  try {
    // Z.AI embedding-3 API
    const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'embedding-3',
        input: text.slice(0, 8000),  // truncate to API limit
      }),
    });
    if (!resp.ok) {
      console.error('[knowledge] Embedding API failed:', resp.status, await resp.text());
      return null;
    }
    const data = await resp.json() as { data: { embedding: number[] }[] };
    return data.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error('[knowledge] Embedding error:', err);
    return null;
  }
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
 * When embeddings are enabled, generates query embedding and combines
 * BM25 score (normalized) with cosine similarity.
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

  // Generate embeddings for top BM25 results and combine scores
  const maxBm25 = Math.max(...bm25Results.map(r => r.score), 1);
  const hybridResults: SearchResult[] = [];

  for (const bm25Result of bm25Results) {
    const chunkEmbedding = bm25Result.chunk.embedding ?? await generateEmbedding(bm25Result.chunk.content);
    if (chunkEmbedding) {
      bm25Result.chunk.embedding = chunkEmbedding;  // cache
      const cosine = cosineSimilarity(queryEmbedding, chunkEmbedding);
      const bm25Norm = bm25Result.score / maxBm25;
      const hybridScore = 0.4 * bm25Norm + 0.6 * cosine;
      hybridResults.push({
        ...bm25Result,
        score: hybridScore,
        retrievalMethod: 'hybrid',
      });
    } else {
      hybridResults.push(bm25Result);
    }
  }

  hybridResults.sort((a, b) => b.score - a.score);
  return hybridResults.slice(0, topK);
}
