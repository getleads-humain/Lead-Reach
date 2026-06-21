// ============================================================
// Hybrid Semantic + TF-IDF Knowledge Retrieval
// ============================================================
// Augments the existing TF-IDF retrieval (loader.ts) with dense
// vector embeddings from Z.AI's embedding-3 model.
//
// Retrieval weights (hybrid):
//   - 40% TF-IDF cosine similarity (lexical match — strong for
//     exact-keyword queries like "saas" or "GDPR")
//   - 40% Embedding cosine similarity (semantic match — strong for
//     paraphrased queries like "how to reach cloud software buyers")
//   - 10% Tag/keyword overlap (exact-match boost)
//   - 10% Priority normalization (frontmatter priority / 100)
//
// Fallback behavior:
//   - If embeddings API is not configured → pure TF-IDF (delegates
//     to retrieveKnowledge() in loader.ts)
//   - If a query embedding fails → pure TF-IDF for that query
//   - If a doc embedding is missing → 0 for that doc's semantic
//     component (TF-IDF + tag + priority still apply)
//
// All functions log to analytics.ts for the Echo gap report.
// ============================================================

import {
  retrieveKnowledge,
  listAllKnowledge,
  type RetrievedDocument,
  type RetrievalQuery,
  type KnowledgeDocument,
} from './loader';
import { embedDocuments, embedQuery, cosineSimilarity, isSemanticReady } from './embeddings';
import { logRetrieval } from './analytics';

// ============================================================
// Types
// ============================================================

export interface SemanticRetrievalQuery extends RetrievalQuery {
  /** Whether to use semantic (embedding) retrieval. Default: true. */
  semantic?: boolean;
}

export interface SemanticRetrievalResult extends RetrievedDocument {
  /** Semantic (embedding) score component (0-1) */
  semanticScore?: number;
  /** TF-IDF score component (0-1) */
  tfidfScore?: number;
}

// ============================================================
// Constants
// ============================================================

const WEIGHT_TFIDF = 0.40;
const WEIGHT_SEMANTIC = 0.40;
const WEIGHT_TAG = 0.10;
const WEIGHT_PRIORITY = 0.10;

// ============================================================
// In-Memory Embeddings Index
// ============================================================

let embeddingsIndex: Map<string, number[]> | null = null;
let embeddingsIndexBuilding: Promise<Map<string, number[]>> | null = null;

/**
 * Build (or return cached) the embeddings index for the entire
 * knowledge base. This is lazy — only built when semantic retrieval
 * is first requested.
 */
async function getEmbeddingsIndex(): Promise<Map<string, number[]>> {
  if (embeddingsIndex) return embeddingsIndex;
  if (embeddingsIndexBuilding) return embeddingsIndexBuilding;

  embeddingsIndexBuilding = (async () => {
    const docs = listAllKnowledge();
    const result = await embedDocuments(docs.map((d) => ({ slug: d.slug, body: d.body })));
    embeddingsIndex = result;
    console.log(`[knowledge/semantic] Embeddings index built: ${result.size}/${docs.length} docs`);
    return result;
  })();

  try {
    return await embeddingsIndexBuilding;
  } finally {
    embeddingsIndexBuilding = null;
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Hybrid retrieval: TF-IDF + semantic embeddings.
 *
 * This is the recommended retrieval function for all agent
 * invocations. Falls back to pure TF-IDF if embeddings are
 * unavailable.
 */
export async function retrieveKnowledgeSemantic(
  query: SemanticRetrievalQuery
): Promise<SemanticRetrievalResult[]> {
  const startTime = Date.now();
  const useSemantic = query.semantic !== false && isSemanticReady();

  // 1. Always compute TF-IDF retrieval (broad recall)
  const tfidfResults = retrieveKnowledge({
    ...query,
    // Get more candidates than requested so we can re-rank with semantic
    topK: (query.topK ?? 5) * 3,
    maxTokens: query.maxTokens ?? 6000,
    minScore: 0.01, // Lower threshold for candidate generation
  });

  // 2. If semantic is disabled or not ready, return TF-IDF results
  if (!useSemantic) {
    const results = tfidfResults.slice(0, query.topK ?? 5) as SemanticRetrievalResult[];
    logRetrievalSafe(query, results, startTime, false);
    return results;
  }

  // 3. Compute query embedding
  const queryVec = query.query ? await embedQuery(query.query) : null;

  if (!queryVec) {
    // Query embedding failed — fall back to TF-IDF
    const results = tfidfResults.slice(0, query.topK ?? 5) as SemanticRetrievalResult[];
    logRetrievalSafe(query, results, startTime, false);
    return results;
  }

  // 4. Get embeddings index
  const index = await getEmbeddingsIndex();

  // 5. Also consider docs NOT in TF-IDF top-K (semantic recall)
  // Get embeddings for all docs, compute semantic score
  const allDocs = listAllKnowledge();
  const semanticScores = new Map<string, number>();

  for (const doc of allDocs) {
    const docVec = index.get(doc.slug);
    if (docVec) {
      const sim = cosineSimilarity(queryVec, docVec);
      semanticScores.set(doc.slug, sim);
    }
  }

  // 6. Combine TF-IDF + semantic into a hybrid score
  // Start with all TF-IDF candidates, then add any high-semantic docs
  // that weren't in TF-IDF top-K
  const candidateMap = new Map<string, SemanticRetrievalResult>();

  for (const r of tfidfResults) {
    const semScore = semanticScores.get(r.document.slug) ?? 0;
    const tagScore = extractTagScore(r.matchedOn);
    const priorityScore = r.document.priority / 100;

    const hybridScore =
      WEIGHT_TFIDF * r.score +
      WEIGHT_SEMANTIC * semScore +
      WEIGHT_TAG * tagScore +
      WEIGHT_PRIORITY * priorityScore;

    candidateMap.set(r.document.slug, {
      ...r,
      score: hybridScore,
      semanticScore: semScore,
      tfidfScore: r.score,
    });
  }

  // Add docs that had high semantic score but weren't in TF-IDF top-K
  for (const [slug, semScore] of semanticScores) {
    if (candidateMap.has(slug)) continue;
    if (semScore < 0.3) continue; // Threshold for semantic-only recall

    const doc = allDocs.find((d) => d.slug === slug);
    if (!doc) continue;

    // Apply same hard filters as TF-IDF would
    if (query.agent && doc.agents.length > 0 && !doc.agents.includes(query.agent)) continue;
    if (query.category && doc.category !== query.category) continue;
    if (query.industries && query.industries.length > 0) {
      const docInd = doc.industries || [];
      if (docInd.length > 0 && !docInd.some((i) => query.industries!.includes(i))) continue;
    }
    if (query.regions && query.regions.length > 0) {
      const docReg = doc.regions || [];
      if (docReg.length > 0 && !docReg.some((r) => query.regions!.includes(r))) continue;
    }
    if (query.intent_types && query.intent_types.length > 0) {
      const docInt = doc.intent_types || [];
      if (docInt.length > 0 && !docInt.some((i) => query.intent_types!.includes(i))) continue;
    }

    const priorityScore = doc.priority / 100;
    const hybridScore =
      WEIGHT_TFIDF * 0 + // No TF-IDF score for this doc
      WEIGHT_SEMANTIC * semScore +
      WEIGHT_TAG * 0 +
      WEIGHT_PRIORITY * priorityScore;

    candidateMap.set(slug, {
      document: doc,
      score: hybridScore,
      matchedOn: [`semantic:${semScore.toFixed(2)}`, 'semantic-only-recall'],
      includedTokens: doc.tokenEstimate,
      semanticScore: semScore,
      tfidfScore: 0,
    });
  }

  // 7. Sort by hybrid score
  const candidates = Array.from(candidateMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.document.priority !== a.document.priority) return b.document.priority - a.document.priority;
    return a.document.slug.localeCompare(b.document.slug);
  });

  // 8. Token-budget-aware truncation (same logic as loader.ts)
  const topK = query.topK ?? 5;
  const maxTokens = query.maxTokens ?? 6000;
  const results: SemanticRetrievalResult[] = [];
  let tokensUsed = 0;
  const TOKEN_CHARS = 4;

  for (const candidate of candidates.slice(0, topK * 3)) {
    if (results.length >= topK) break;
    if (tokensUsed + candidate.includedTokens > maxTokens) {
      const remaining = maxTokens - tokensUsed;
      if (remaining > 800) {
        const charsAvailable = remaining * TOKEN_CHARS;
        const truncated = candidate.document.body.slice(0, charsAvailable);
        results.push({
          ...candidate,
          document: { ...candidate.document, body: truncated + '\n\n[...truncated]' },
          includedTokens: Math.ceil(truncated.length / TOKEN_CHARS),
        });
      }
      continue;
    }
    results.push(candidate);
    tokensUsed += candidate.includedTokens;
  }

  logRetrievalSafe(query, results, startTime, true);
  return results;
}

/**
 * Synchronous version that uses TF-IDF only. Kept for callers that
 * can't await (e.g., the existing `retrieveKnowledge` callers in
 * loader.ts that are invoked synchronously).
 *
 * If you can await, prefer `retrieveKnowledgeSemantic()` — it will
 * use embeddings when available and fall back to TF-IDF when not.
 */
export function retrieveKnowledgeSync(query: RetrievalQuery): RetrievedDocument[] {
  const startTime = Date.now();
  const results = retrieveKnowledge(query);
  // Log to analytics (fire-and-forget)
  logRetrievalSafe(query, results, startTime, false);
  return results;
}

// ============================================================
// Helpers
// ============================================================

function extractTagScore(matchedOn: string[]): number {
  const tagMatch = matchedOn.find((m) => m.startsWith('tag-match:'));
  if (!tagMatch) return 0;
  const count = parseInt(tagMatch.split(':')[1] || '0', 10);
  return Math.min(1, count * 0.2);
}

function logRetrievalSafe(
  query: RetrievalQuery,
  results: RetrievedDocument[],
  startTime: number,
  semantic: boolean
): void {
  try {
    logRetrieval({
      query: query.query || '',
      agent: query.agent,
      filters: {
        category: query.category,
        industries: query.industries,
        regions: query.regions,
        intent_types: query.intent_types,
        tags: query.tags,
      },
      resultCount: results.length,
      topScore: results.length > 0 ? results[0].score : 0,
      meanScore: results.length > 0
        ? results.reduce((s, r) => s + r.score, 0) / results.length
        : 0,
      returnedSlugs: results.map((r) => r.document.slug),
      durationMs: Date.now() - startTime,
      semantic,
    });
  } catch {
    // Swallow — analytics must never break retrieval
  }
}

/**
 * Clear the in-memory embeddings index (forces rebuild on next call).
 * Useful when the knowledge base is reloaded.
 */
export function clearSemanticIndex(): void {
  embeddingsIndex = null;
  embeddingsIndexBuilding = null;
}

/**
 * Get the current semantic retrieval status (for admin UI).
 */
export function getSemanticStatus(): {
  ready: boolean;
  apiConfigured: boolean;
  indexedDocCount: number;
  totalDocCount: number;
} {
  const totalDocCount = listAllKnowledge().length;
  const apiConfigured = isSemanticReady();
  const indexedDocCount = embeddingsIndex?.size ?? 0;
  return {
    ready: apiConfigured && indexedDocCount > 0,
    apiConfigured,
    indexedDocCount,
    totalDocCount,
  };
}
