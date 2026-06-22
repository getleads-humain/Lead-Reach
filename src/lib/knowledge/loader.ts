// ============================================================
// Knowledge Base Loader & Retrieval System
// ============================================================
// Loads Markdown knowledge files from /knowledge at runtime,
// parses YAML frontmatter, and exposes a retrieval API for
// agents to pull the most relevant knowledge pieces (RAG layer).
//
// Design goals:
//   1. Zero cold-start cost — index built lazily on first call,
//      cached for the lifetime of the process.
//   2. Hybrid retrieval — keyword (TF-IDF) + tag/category matching.
//      No external embedding model required.
//   3. Token-aware truncation — never blow an agent's context window.
//   4. Graceful degradation — if /knowledge is missing, returns
//      empty results, never throws.
//   5. Hot-reloadable in dev — `clearKnowledgeCache()` exists for tests.
//
// All knowledge files live in /knowledge/<category>/<slug>.md and
// MUST begin with a YAML frontmatter block:
//
//   ---
//   title: <human title>
//   slug: <kebab-case-slug>
//   category: domain | industries | regions | agents | tools | playbooks | templates | datasets | compliance
//   tags: [b2b, outbound, saas]
//   agents: [atlas, scout, forge]            # which agents should retrieve this
//   industries: [saas, fintech]              # optional industry relevance
//   regions: [vietnam, apac]                 # optional regional relevance
//   intent_types: [research_company, build_icp]  # optional intent relevance
//   priority: 80                             # 0-100, higher = more important
//   version: 1
//   updated: 2026-06-22
//   ---
//
// Files without frontmatter are still indexed but with reduced priority.
// ============================================================

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, basename, extname, relative } from 'path';

// ============================================================
// Types
// ============================================================

export type KnowledgeCategory =
  | 'domain'
  | 'industries'
  | 'regions'
  | 'agents'
  | 'tools'
  | 'playbooks'
  | 'templates'
  | 'datasets'
  | 'compliance';

export interface KnowledgeFrontmatter {
  title: string;
  slug: string;
  category: KnowledgeCategory;
  tags: string[];
  agents: string[];
  industries?: string[];
  regions?: string[];
  intent_types?: string[];
  priority: number;
  version: number;
  updated: string;
  author?: string;
  summary?: string;
}

export interface KnowledgeDocument extends KnowledgeFrontmatter {
  /** Absolute filesystem path */
  filePath: string;
  /** Path relative to /knowledge, e.g. "industries/saas.md" */
  relativePath: string;
  /** Raw markdown body (after frontmatter) */
  body: string;
  /** Word count of body */
  wordCount: number;
  /** Token estimate (~4 chars per token) */
  tokenEstimate: number;
  /** Pre-tokenized lowercase words for TF-IDF */
  tokens: string[];
}

export interface RetrievalQuery {
  /** Free-text query (e.g., the user's prompt or agent's task description) */
  query?: string;
  /** Restrict to documents tagged for this agent */
  agent?: string;
  /** Restrict to documents for this category */
  category?: KnowledgeCategory;
  /** Restrict to documents matching at least one of these industries */
  industries?: string[];
  /** Restrict to documents matching at least one of these regions */
  regions?: string[];
  /** Restrict to documents matching at least one of these intent types */
  intent_types?: string[];
  /** Restrict to documents matching at least one of these tags */
  tags?: string[];
  /** Maximum number of documents to return */
  topK?: number;
  /** Maximum total tokens to return */
  maxTokens?: number;
  /** Minimum relevance score (0-1) to include a document */
  minScore?: number;
}

export interface RetrievedDocument {
  document: KnowledgeDocument;
  /** Relevance score 0-1 */
  score: number;
  /** Why this document was retrieved (debug) */
  matchedOn: string[];
  /** Tokens included for this document (after truncation) */
  includedTokens: number;
}

// ============================================================
// Constants
// ============================================================

const KNOWLEDGE_ROOT = resolve(process.cwd(), 'knowledge');
const SUPPORTED_EXTENSIONS = ['.md', '.markdown'];
const DEFAULT_TOP_K = 5;
const DEFAULT_MAX_TOKENS = 6000;
const DEFAULT_MIN_SCORE = 0.05;
const TOKEN_CHARS = 4; // OpenAI rule of thumb: 1 token ≈ 4 chars

// Common English stopwords — kept short to avoid over-aggressive filtering
const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'or', 'but', 'if', 'then', 'else', 'for', 'of', 'to',
  'in', 'on', 'at', 'by', 'with', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'may', 'might', 'must', 'shall', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their',
  'his', 'her', 'its', 'our', 'your', 'my', 'me', 'us', 'him',
]);

// ============================================================
// Cache
// ============================================================

let cache: {
  documents: KnowledgeDocument[];
  indexedAt: number;
  /** Inverse document frequency per token */
  idf: Map<string, number>;
  /** Document frequency (count of docs containing token) */
  df: Map<string, number>;
  /** Total document count */
  nDocs: number;
} | null = null;

// ============================================================
// YAML Frontmatter Parser (minimal, dependency-free)
// ============================================================

function parseFrontmatter(raw: string): { frontmatter: Partial<KnowledgeFrontmatter>; body: string } {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { frontmatter: {}, body: raw };
  }

  const yamlBlock = fmMatch[1];
  const body = fmMatch[2];
  const frontmatter: Partial<KnowledgeFrontmatter> = {};
  const lines = yamlBlock.split('\n');

  let currentKey: string | null = null;
  let currentList: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // List item under current key
    if (trimmed.startsWith('- ') && currentKey) {
      const val = trimmed.slice(2).trim().replace(/^["']|["']$/g, '');
      currentList.push(val);
      continue;
    }

    // Flush previous list
    if (currentKey && currentList.length > 0) {
      (frontmatter as any)[currentKey] = currentList;
      currentList = [];
    }

    // Key: value
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const rawValue = kvMatch[2].trim();
      const value = rawValue.replace(/^["']|["']$/g, '');

      // Handle inline array: [item1, item2, item3]
      if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1);
        const items = inner
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter((s) => s.length > 0);
        (frontmatter as any)[key] = items;
        currentKey = null;
        continue;
      }

      if (value === '') {
        // Could be a list — start collecting
        currentKey = key;
        currentList = [];
      } else {
        // Try to parse as number
        const num = Number(value);
        if (!isNaN(num) && value !== '') {
          (frontmatter as any)[key] = num;
        } else if (value === 'true') {
          (frontmatter as any)[key] = true;
        } else if (value === 'false') {
          (frontmatter as any)[key] = false;
        } else {
          (frontmatter as any)[key] = value;
        }
        currentKey = null;
      }
    }
  }

  // Flush final list
  if (currentKey && currentList.length > 0) {
    (frontmatter as any)[currentKey] = currentList;
  }

  return { frontmatter, body };
}

// ============================================================
// Tokenization
// ============================================================

function tokenize(text: string): string[] {
  // Lowercase, split on non-alphanumeric, filter stopwords and short tokens
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function countTokens(text: string): number {
  return Math.ceil(text.length / TOKEN_CHARS);
}

// ============================================================
// File Discovery
// ============================================================

function discoverKnowledgeFiles(rootDir: string): string[] {
  if (!existsSync(rootDir)) return [];

  const results: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        // Skip hidden dirs like .git
        if (!entry.startsWith('.')) stack.push(fullPath);
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  return results.sort();
}

// ============================================================
// Document Loading
// ============================================================

function loadDocument(filePath: string): KnowledgeDocument | null {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(raw);

    const relPath = relative(KNOWLEDGE_ROOT, filePath).replace(/\\/g, '/');
    const slug = frontmatter.slug || basename(filePath, extname(filePath));

    const doc: KnowledgeDocument = {
      title: frontmatter.title || slug,
      slug,
      category: (frontmatter.category as KnowledgeCategory) || inferCategoryFromPath(relPath),
      tags: frontmatter.tags || [],
      agents: frontmatter.agents || [],
      industries: frontmatter.industries || [],
      regions: frontmatter.regions || [],
      intent_types: frontmatter.intent_types || [],
      priority: typeof frontmatter.priority === 'number' ? frontmatter.priority : 50,
      version: typeof frontmatter.version === 'number' ? frontmatter.version : 1,
      updated: frontmatter.updated || new Date().toISOString().slice(0, 10),
      author: frontmatter.author,
      summary: frontmatter.summary,
      filePath,
      relativePath: relPath,
      body,
      wordCount: body.split(/\s+/).filter(Boolean).length,
      tokenEstimate: countTokens(body),
      tokens: tokenize(body),
    };

    return doc;
  } catch (err) {
    console.warn(`[knowledge] Failed to load ${filePath}:`, err);
    return null;
  }
}

function inferCategoryFromPath(relPath: string): KnowledgeCategory {
  const topDir = relPath.split('/')[0];
  const valid: KnowledgeCategory[] = [
    'domain', 'industries', 'regions', 'agents',
    'tools', 'playbooks', 'templates', 'datasets', 'compliance',
  ];
  return (valid as string[]).includes(topDir) ? (topDir as KnowledgeCategory) : 'domain';
}

// ============================================================
// Index Building
// ============================================================

function buildIndex(documents: KnowledgeDocument[]) {
  const df = new Map<string, number>();
  for (const doc of documents) {
    const uniqueTokens = new Set(doc.tokens);
    for (const token of Array.from(uniqueTokens)) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  const nDocs = documents.length;
  const idf = new Map<string, number>();
  for (const [token, count] of Array.from(df.entries())) {
    // Smoothed IDF — prevents division by zero and bounds the value
    idf.set(token, Math.log(1 + nDocs / (1 + count)) + 1);
  }

  return { documents, idf, df, nDocs, indexedAt: Date.now() };
}

function getIndex() {
  if (cache) return cache;
  const files = discoverKnowledgeFiles(KNOWLEDGE_ROOT);
  const documents: KnowledgeDocument[] = [];
  for (const file of files) {
    const doc = loadDocument(file);
    if (doc) documents.push(doc);
  }
  cache = buildIndex(documents);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[knowledge] Indexed ${documents.length} documents from ${KNOWLEDGE_ROOT}`);
  }
  return cache;
}

// ============================================================
// Retrieval
// ============================================================

function computeTfIdfVector(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  const total = tokens.length || 1;
  const vec = new Map<string, number>();
  for (const [token, count] of Array.from(tf.entries())) {
    const idfVal = idf.get(token);
    if (idfVal !== undefined) {
      vec.set(token, (count / total) * idfVal);
    }
  }
  return vec;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [k, v] of Array.from(a.entries())) {
    normA += v * v;
    const bv = b.get(k);
    if (bv !== undefined) dot += v * bv;
  }
  for (const v of Array.from(b.values())) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve the most relevant knowledge documents for a query.
 *
 * Combines four signals:
 *   1. TF-IDF cosine similarity between query and document body
 *   2. Tag/category overlap (exact match boost)
 *   3. Agent filter (only docs tagged for this agent)
 *   4. Priority boost (frontmatter priority normalized)
 *
 * Returns documents sorted by descending score, truncated to topK and maxTokens.
 */
export function retrieveKnowledge(query: RetrievalQuery): RetrievedDocument[] {
  const index = getIndex();
  if (index.documents.length === 0) return [];

  const topK = query.topK ?? DEFAULT_TOP_K;
  const maxTokens = query.maxTokens ?? DEFAULT_MAX_TOKENS;
  const minScore = query.minScore ?? DEFAULT_MIN_SCORE;

  const queryTokens = query.query ? tokenize(query.query) : [];
  const queryVec = computeTfIdfVector(queryTokens, index.idf);

  const candidates: RetrievedDocument[] = [];

  for (const doc of index.documents) {
    const matchedOn: string[] = [];

    // Hard filters — agent / category / industry / region / intent / tags
    if (query.agent) {
      if (doc.agents.length > 0 && !doc.agents.includes(query.agent)) continue;
      if (doc.agents.includes(query.agent)) matchedOn.push(`agent:${query.agent}`);
    }
    if (query.category && doc.category !== query.category) continue;
    if (query.industries && query.industries.length > 0) {
      const docInd = doc.industries || [];
      const hasMatch = docInd.some((i) => query.industries!.includes(i));
      if (docInd.length > 0 && !hasMatch) continue;
      if (hasMatch) matchedOn.push(`industry:${query.industries!.find((i) => docInd.includes(i))}`);
    }
    if (query.regions && query.regions.length > 0) {
      const docReg = doc.regions || [];
      const hasMatch = docReg.some((r) => query.regions!.includes(r));
      if (docReg.length > 0 && !hasMatch) continue;
      if (hasMatch) matchedOn.push(`region:${query.regions!.find((r) => docReg.includes(r))}`);
    }
    if (query.intent_types && query.intent_types.length > 0) {
      const docInt = doc.intent_types || [];
      const hasMatch = docInt.some((i) => query.intent_types!.includes(i));
      if (docInt.length > 0 && !hasMatch) continue;
      if (hasMatch) matchedOn.push(`intent:${query.intent_types!.find((i) => docInt.includes(i))}`);
    }
    if (query.tags && query.tags.length > 0) {
      const hasMatch = doc.tags.some((t) => query.tags!.includes(t));
      if (doc.tags.length > 0 && !hasMatch) continue;
      if (hasMatch) matchedOn.push(`tag:${query.tags!.find((t) => doc.tags.includes(t))}`);
    }

    // Soft signals
    let score = 0;
    let components = 0;

    // 1. TF-IDF cosine similarity (weight: 0.5)
    if (queryVec.size > 0 && doc.tokens.length > 0) {
      const docVec = computeTfIdfVector(doc.tokens, index.idf);
      const sim = cosineSimilarity(queryVec, docVec);
      score += sim * 0.5;
      components += 1;
      if (sim > 0.05) matchedOn.push(`tfidf:${sim.toFixed(2)}`);
    }

    // 2. Tag overlap (weight: 0.25)
    if (query.query) {
      const queryTagSet = new Set(queryTokens);
      const tagMatches = doc.tags.filter((t) => queryTagSet.has(t.toLowerCase()));
      if (tagMatches.length > 0) {
        score += Math.min(0.25, tagMatches.length * 0.05);
        components += 1;
        matchedOn.push(`tag-match:${tagMatches.length}`);
      }
    }

    // 3. Priority normalization (weight: 0.25)
    const priorityScore = (doc.priority / 100) * 0.25;
    score += priorityScore;
    components += 1;

    if (components === 0) continue;
    if (score < minScore) continue;

    candidates.push({
      document: doc,
      score,
      matchedOn,
      includedTokens: doc.tokenEstimate,
    });
  }

  // Sort by score desc, then by priority desc, then by slug asc for stability
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.document.priority !== a.document.priority) return b.document.priority - a.document.priority;
    return a.document.slug.localeCompare(b.document.slug);
  });

  // Token-budget-aware truncation
  const results: RetrievedDocument[] = [];
  let tokensUsed = 0;
  for (const candidate of candidates.slice(0, topK * 3)) {
    if (results.length >= topK) break;
    if (tokensUsed + candidate.includedTokens > maxTokens) {
      // Try to fit a truncated version of this candidate
      const remaining = maxTokens - tokensUsed;
      if (remaining > 800) {
        // Truncate body to fit
        const charsAvailable = remaining * TOKEN_CHARS;
        const truncated = candidate.document.body.slice(0, charsAvailable);
        const includedTokens = countTokens(truncated);
        results.push({
          ...candidate,
          document: { ...candidate.document, body: truncated + '\n\n[...truncated]' },
          includedTokens,
        });
        tokensUsed += includedTokens;
      }
      // Don't break — continue to next candidate which might be smaller
      continue;
    }
    results.push(candidate);
    tokensUsed += candidate.includedTokens;
  }

  return results;
}

// ============================================================
// Convenience: Get a specific document by slug
// ============================================================

export function getKnowledgeBySlug(slug: string): KnowledgeDocument | null {
  const index = getIndex();
  return index.documents.find((d) => d.slug === slug) || null;
}

export function listKnowledgeByCategory(category: KnowledgeCategory): KnowledgeDocument[] {
  const index = getIndex();
  return index.documents.filter((d) => d.category === category);
}

export function listAllKnowledge(): KnowledgeDocument[] {
  const index = getIndex();
  return index.documents;
}

// ============================================================
// Convenience: Format retrieved docs for injection into an LLM prompt
// ============================================================

export function formatRetrievedKnowledge(
  results: RetrievedDocument[],
  options: { includeMetadata?: boolean; includeBody?: boolean } = {}
): string {
  const { includeMetadata = true, includeBody = true } = options;
  if (results.length === 0) return '';

  const blocks: string[] = [];
  for (const r of results) {
    const lines: string[] = [];
    if (includeMetadata) {
      lines.push(`### ${r.document.title}`);
      lines.push(`> category: ${r.document.category} | priority: ${r.document.priority} | relevance: ${(r.score * 100).toFixed(0)}% | matched on: ${r.matchedOn.join(', ')}`);
      lines.push(`> source: ${r.document.relativePath}`);
      lines.push('');
    } else {
      lines.push(`### ${r.document.title}`);
      lines.push('');
    }
    if (includeBody) {
      lines.push(r.document.body);
    }
    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n---\n\n');
}

// ============================================================
// Cache Management
// ============================================================

export function clearKnowledgeCache(): void {
  cache = null;
}

export function getKnowledgeStats(): {
  totalDocuments: number;
  byCategory: Record<string, number>;
  totalTokens: number;
  totalWords: number;
  indexedAt: number | null;
} {
  const index = getIndex();
  const byCategory: Record<string, number> = {};
  let totalTokens = 0;
  let totalWords = 0;
  for (const doc of index.documents) {
    byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    totalTokens += doc.tokenEstimate;
    totalWords += doc.wordCount;
  }
  return {
    totalDocuments: index.documents.length,
    byCategory,
    totalTokens,
    totalWords,
    indexedAt: index.indexedAt,
  };
}

// ============================================================
// Agent-specific Retrieval Helpers
// ============================================================

const AGENT_NAMES = ['atlas', 'scout', 'forge', 'sage', 'judge', 'bard', 'flow', 'echo'] as const;
type AgentName = (typeof AGENT_NAMES)[number];

/**
 * Retrieve knowledge specifically for an agent invocation.
 * Combines the agent's identity, the user query, and any detected
 * intent/industry/region signals.
 */
export function retrieveForAgent(
  agent: AgentName | string,
  userQuery: string,
  context: {
    industries?: string[];
    regions?: string[];
    intent_types?: string[];
    tags?: string[];
    topK?: number;
    maxTokens?: number;
  } = {}
): RetrievedDocument[] {
  return retrieveKnowledge({
    query: userQuery,
    agent,
    industries: context.industries,
    regions: context.regions,
    intent_types: context.intent_types,
    tags: context.tags,
    topK: context.topK ?? 4,
    maxTokens: context.maxTokens ?? 3000,
    minScore: 0.03,
  });
}

/**
 * Build a "KNOWLEDGE BASE" section suitable for prepending to an
 * agent's system prompt. Returns empty string if no relevant docs.
 */
export function buildKnowledgePromptSection(
  agent: AgentName | string,
  userQuery: string,
  context: {
    industries?: string[];
    regions?: string[];
    intent_types?: string[];
    tags?: string[];
    topK?: number;
    maxTokens?: number;
  } = {}
): string {
  const results = retrieveForAgent(agent, userQuery, context);
  if (results.length === 0) return '';

  const formatted = formatRetrievedKnowledge(results, { includeMetadata: true, includeBody: true });
  return [
    '============================================================',
    'RETRIEVED KNOWLEDGE BASE (use as authoritative context)',
    '============================================================',
    `The following ${results.length} knowledge document(s) were retrieved from the LeadReach`,
    `knowledge base as most relevant to the current task. Treat these as authoritative`,
    `guidance — they encode institutional best practices, industry-specific patterns,`,
    `regional norms, and proven playbooks. Apply them when generating your response.`,
    '',
    formatted,
    '============================================================',
    'END OF RETRIEVED KNOWLEDGE',
    '============================================================',
  ].join('\n');
}
