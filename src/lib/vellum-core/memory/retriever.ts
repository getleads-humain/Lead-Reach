/**
 * Memory Retriever — Hybrid Retrieval Pipeline
 *
 * Adapted from Vellum Assistant's retrieval architecture for LeadReach AI.
 * Implements a two-stage retrieval pipeline:
 *
 *   1. loadContextMemory()  — Full retrieval at conversation start.
 *      Loads all relevant memories for the scope, scores them, and returns
 *      the top-N most relevant for context injection.
 *
 *   2. retrieveForTurn()    — Lightweight per-turn retrieval.
 *      Uses the last exchange to find additionally relevant memories
 *      that weren't already in context, avoiding redundancy.
 *
 * Scoring combines four signals:
 *   - Significance (Ebbinghaus-weighted importance)
 *   - Confidence   (accuracy certainty)
 *   - Recency      (time since last access, exponential decay)
 *   - Relevance    (keyword/semantic match to query)
 *
 * Since we're using SQLite without a vector DB (Qdrant), semantic
 * matching is approximated via keyword extraction and TF-IDF-like scoring.
 */

import type {
  MemoryNode,
  ScoredMemory,
  RetrievalConfig,
} from './types';
import { DEFAULT_RETRIEVAL_CONFIG } from './types';
import {
  getNodesByScope,
  get,
  updateSignificance,
} from './memory-store';
import { DEFAULT_DECAY_CONFIG } from './types';

// ============================================================
// Keyword Extraction & Matching
// ============================================================

/**
 * Common English stop words to filter out during keyword extraction.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'were',
  'been', 'are', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'me',
  'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
  'their', 'what', 'which', 'who', 'whom', 'how', 'when', 'where',
  'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'about', 'above', 'after',
  'before', 'between', 'into', 'through', 'during', 'again', 'further',
  'then', 'once', 'here', 'there', 'any', 'if', 'also', 'up', 'out',
]);

/**
 * Extract meaningful keywords from a text string.
 * Filters stop words and normalizes to lowercase.
 */
function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return Array.from(new Set(words)); // deduplicate
}

/**
 * Calculate a TF-IDF-like relevance score between query keywords
 * and a memory node's content.
 *
 * Returns a value between 0 and 1:
 *   - 1.0 = all query terms found in content
 *   - 0.5 = half of query terms found
 *   - 0.0 = no terms found
 *
 * Also considers partial matches (substring) for robustness.
 */
function calculateKeywordRelevance(
  queryKeywords: string[],
  node: MemoryNode,
): number {
  if (queryKeywords.length === 0) return 0;

  const contentLower = node.content.toLowerCase();
  const typeLower = node.type.toLowerCase();
  const roleLower = (node.narrativeRole || '').toLowerCase();

  // Combine searchable text
  const searchableText = `${contentLower} ${typeLower} ${roleLower}`;

  let matchCount = 0;
  for (const keyword of queryKeywords) {
    if (searchableText.includes(keyword)) {
      matchCount++;
    }
  }

  // Base relevance: fraction of query terms matched
  let relevance = matchCount / queryKeywords.length;

  // Bonus for exact type match (e.g., query about "procedural" matches type=procedural)
  if (queryKeywords.some((kw) => typeLower.includes(kw))) {
    relevance = Math.min(1.0, relevance + 0.15);
  }

  // Bonus for content-length-adjusted relevance
  // Longer content with matches is more informative
  if (matchCount > 0 && node.content.length > 100) {
    relevance = Math.min(1.0, relevance + 0.05);
  }

  return relevance;
}

// ============================================================
// Recency Scoring
// ============================================================

/**
 * Calculate a recency score based on time since last access.
 * Uses exponential decay: score = 0.5^(age / halfLife)
 *
 * @param lastAccessedAt - Unix timestamp (ms) of last access
 * @param halfLifeHours  - Hours for the score to halve (default: 24)
 * @returns Score between 0 (very old) and 1 (just accessed)
 */
function calculateRecencyScore(
  lastAccessedAt: number,
  halfLifeHours: number = 24,
): number {
  const ageMs = Date.now() - lastAccessedAt;
  const ageHours = ageMs / (1000 * 60 * 60);
  return Math.pow(0.5, ageHours / halfLifeHours);
}

// ============================================================
// Combined Scoring
// ============================================================

/**
 * Calculate the combined retrieval score for a memory node.
 *
 * Formula:
 *   score = (significance * w_sig) + (confidence * w_conf) +
 *           (recency * w_rec) + (relevance * w_rel)
 *
 * All weights sum to 1.0 and are configurable.
 */
function calculateScore(
  node: MemoryNode,
  queryKeywords: string[],
  config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG,
): ScoredMemory {
  const significance = node.significance;
  const confidence = node.confidence;
  const recency = calculateRecencyScore(
    node.lastAccessedAt,
    config.recencyHalfLifeHours,
  );
  const relevance = calculateKeywordRelevance(queryKeywords, node);

  const score =
    significance * config.significanceWeight +
    confidence * config.confidenceWeight +
    recency * config.recencyWeight +
    relevance * config.relevanceWeight;

  return {
    node,
    score,
    scoreBreakdown: {
      significance: significance * config.significanceWeight,
      confidence: confidence * config.confidenceWeight,
      recency: recency * config.recencyWeight,
      relevance: relevance * config.relevanceWeight,
    },
  };
}

// ============================================================
// Deduplication
// ============================================================

/**
 * Deduplicate memory nodes by content similarity.
 * If two nodes have very similar content (>80% overlap), keep the one
 * with the higher score and merge sourceConversations.
 */
function deduplicateMemories(
  scored: ScoredMemory[],
): ScoredMemory[] {
  const result: ScoredMemory[] = [];
  const seen = new Set<string>();

  // Sort by score descending (highest first)
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  for (const item of sorted) {
    // Create a simplified fingerprint of the content
    const fingerprint = item.node.content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 10)
      .join(' ');

    // Check for overlap with already-seen fingerprints
    let isDuplicate = false;
    for (const existingFingerprint of seen) {
      const overlap = calculateStringOverlap(fingerprint, existingFingerprint);
      if (overlap > 0.8) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(fingerprint);
      result.push(item);
    }
  }

  return result;
}

/**
 * Calculate the overlap ratio between two strings.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
function calculateStringOverlap(a: string, b: string): number {
  const wordsA = Array.from(new Set(a.split(/\s+/)));
  const wordsBSet = new Set(b.split(/\s+/));

  if (wordsA.length === 0 && wordsBSet.size === 0) return 1.0;
  if (wordsA.length === 0 || wordsBSet.size === 0) return 0.0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsBSet.has(word)) intersection++;
  }

  const union = wordsA.length + wordsBSet.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ============================================================
// Public API — Retrieval Pipeline
// ============================================================

/**
 * Full retrieval at conversation start.
 *
 * Loads all memories for the scope, scores them against the initial
 * query, and returns the top-N most relevant memories for context injection.
 *
 * This is the "heavy" retrieval call — it considers all memories
 * in the scope, not just recent ones.
 *
 * @param scopeId - The scope to retrieve memories from (e.g., user ID)
 * @param query   - The initial conversation query
 * @param config  - Optional retrieval configuration overrides
 * @returns Scored and deduplicated memory nodes, sorted by relevance
 */
export async function loadContextMemory(
  scopeId: string,
  query: string,
  config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG,
): Promise<ScoredMemory[]> {
  // Load all nodes for this scope
  const nodes = await getNodesByScope(scopeId);

  if (nodes.length === 0) return [];

  // Extract query keywords
  const queryKeywords = extractKeywords(query);

  // Score each node
  const scored: ScoredMemory[] = [];
  for (const node of nodes) {
    // Skip "gone" fidelity nodes — they're too decayed to be useful
    if (node.fidelity === 'gone') continue;

    const scoredMemory = calculateScore(node, queryKeywords, config);

    // Filter by minimum score threshold
    if (scoredMemory.score >= config.minScore) {
      scored.push(scoredMemory);
    }
  }

  // Deduplicate overlapping content
  const deduplicated = deduplicateMemories(scored);

  // Sort by score descending
  deduplicated.sort((a, b) => b.score - a.score);

  // Return top N results
  const results = deduplicated.slice(0, config.maxResults);

  // Reinforce accessed memories (Ebbinghaus reinforcement)
  for (const result of results) {
    updateSignificance(result.node.id, DEFAULT_DECAY_CONFIG.reinforcementDelta).catch(() => {
      // Non-critical
    });
  }

  return results;
}

/**
 * Lightweight per-turn retrieval.
 *
 * Uses the last exchange to find additionally relevant memories
 * that weren't already in the active context. This avoids loading
 * redundant information already known to the conversation.
 *
 * @param scopeId      - The scope to retrieve memories from
 * @param lastExchange - The last user-assistant exchange text
 * @param inContextIds - Set of memory node IDs already in context
 * @param config       - Optional retrieval configuration overrides
 * @returns New scored memory nodes not already in context
 */
export async function retrieveForTurn(
  scopeId: string,
  lastExchange: string,
  inContextIds: Set<string>,
  config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG,
): Promise<ScoredMemory[]> {
  // Load all nodes for this scope
  const nodes = await getNodesByScope(scopeId);

  if (nodes.length === 0) return [];

  // Extract keywords from the last exchange
  const queryKeywords = extractKeywords(lastExchange);

  // Score each node, excluding those already in context
  const scored: ScoredMemory[] = [];
  for (const node of nodes) {
    // Skip nodes already in context
    if (inContextIds.has(node.id)) continue;

    // Skip "gone" fidelity nodes
    if (node.fidelity === 'gone') continue;

    const scoredMemory = calculateScore(node, queryKeywords, config);

    // Apply a higher threshold for per-turn retrieval to avoid noise
    const turnThreshold = Math.max(config.minScore, 0.25);
    if (scoredMemory.score >= turnThreshold) {
      scored.push(scoredMemory);
    }
  }

  // Deduplicate
  const deduplicated = deduplicateMemories(scored);

  // Sort by score descending
  deduplicated.sort((a, b) => b.score - a.score);

  // Return fewer results for per-turn (max 5 to avoid overwhelming context)
  const turnLimit = Math.min(5, config.maxResults);
  const results = deduplicated.slice(0, turnLimit);

  // Reinforce accessed memories
  for (const result of results) {
    updateSignificance(result.node.id, DEFAULT_DECAY_CONFIG.reinforcementDelta).catch(() => {
      // Non-critical
    });
  }

  return results;
}

/**
 * Quick retrieval by memory type within a scope.
 * Useful for fetching specific memory categories (e.g., all procedural memories).
 *
 * @param scopeId   - The scope to retrieve from
 * @param type      - The memory type to filter by
 * @param limit     - Maximum results
 * @returns Memory nodes of the specified type, sorted by significance
 */
export async function retrieveByType(
  scopeId: string,
  type: import('./types').MemoryType,
  limit: number = 10,
): Promise<MemoryNode[]> {
  const nodes = await getNodesByScope(scopeId);

  return nodes
    .filter((n) => n.type === type && n.fidelity !== 'gone')
    .sort((a, b) => b.significance - a.significance)
    .slice(0, limit);
}

/**
 * Retrieve a single memory node by ID and reinforce it.
 * Returns null if not found.
 */
export async function retrieveAndReinforce(
  nodeId: string,
): Promise<MemoryNode | null> {
  const node = await get(nodeId);
  if (!node) return null;

  // Reinforce on access
  await updateSignificance(nodeId, DEFAULT_DECAY_CONFIG.reinforcementDelta);

  return node;
}
