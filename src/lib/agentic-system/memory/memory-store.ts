/**
 * Unified Memory Store
 * ====================
 *
 * A single facade over LeadReach's existing memory systems:
 *   - Prisma `AgentSession` table (conversation state, per-campaign)
 *   - Prisma `VellumMemoryNode` + `VellumMemoryEdge` (knowledge graph)
 *   - In-process LRU cache (fast hot-path reads)
 *
 * The agentic system uses this single API to remember things across
 * pipeline runs, leads, and campaigns — without each agent having to
 * know which backend holds which data.
 *
 * Public API:
 *   - remember(scope, key, value, ttl?) -> void
 *   - recall(scope, key) -> unknown | null
 *   - forget(scope, key) -> void
 *   - search(scope, query) -> MemoryEntry[]
 *
 * Scope is hierarchical: 'campaign:<id>' / 'lead:<id>' / 'agent:<name>' / 'global'.
 */

import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

export type MemoryScope = `campaign:${string}` | `lead:${string}` | `agent:${string}` | 'global';

export interface MemoryEntry {
  id: string;
  scope: MemoryScope;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  /** Source agent that wrote this entry. */
  source: string;
}

// ============================================================
// In-Process LRU Cache (hot path)
// ============================================================

interface CacheEntry {
  value: unknown;
  expiresAt: number | null;
  updatedAt: number;
}

const MAX_CACHE_SIZE = 500;
const cache = new Map<string, CacheEntry>();

function cacheKey(scope: MemoryScope, key: string): string {
  return `${scope}::${key}`;
}

function cacheSet(scope: MemoryScope, key: string, value: unknown, ttlMs?: number): void {
  const ck = cacheKey(scope, key);
  // LRU eviction
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(ck, {
    value,
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
    updatedAt: Date.now(),
  });
}

function cacheGet(scope: MemoryScope, key: string): unknown | null {
  const ck = cacheKey(scope, key);
  const entry = cache.get(ck);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    cache.delete(ck);
    return null;
  }
  // LRU refresh — move to end
  cache.delete(ck);
  cache.set(ck, entry);
  return entry.value;
}

function cacheDelete(scope: MemoryScope, key: string): void {
  cache.delete(cacheKey(scope, key));
}

// ============================================================
// Public API
// ============================================================

/**
 * Store a value in memory.
 *
 * - ttlMs > 0: ephemeral memory (cache only, never persisted)
 * - ttlMs = undefined: durable memory (cache + persisted to VellumMemoryNode
 *   if scope is agent/lead/campaign; persisted to a separate table for global)
 */
export async function remember(
  scope: MemoryScope,
  key: string,
  value: unknown,
  opts: { ttlMs?: number; source?: string } = {},
): Promise<void> {
  // Always set in cache (even durable — cache is the hot path)
  cacheSet(scope, key, value, opts.ttlMs);

  // Skip DB write for ephemeral entries
  if (opts.ttlMs !== undefined) return;

  try {
    // Persist to VellumMemoryNode as a typed node
    // Using upsert pattern
    const nodeId = `${scope}::${key}`.slice(0, 100);
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const scopeId = scope; // VellumMemoryNode.scopeId is used for scope isolation
    const sourceType = `agentic:${opts.source ?? 'unknown'}`;
    const existing = await db.vellumMemoryNode.findUnique({ where: { id: nodeId } });
    if (existing) {
      await db.vellumMemoryNode.update({
        where: { id: nodeId },
        data: {
          content: valueStr,
          updatedAt: new Date(),
          lastAccessedAt: new Date(),
        },
      });
    } else {
      await db.vellumMemoryNode.create({
        data: {
          id: nodeId,
          type: 'procedural', // closest type for "facts we remember"
          content: valueStr,
          scopeId,
          scopeType: 'user',
          sourceType,
        },
      });
    }
  } catch (err) {
    // Memory persistence is best-effort — don't fail the pipeline
    console.warn('[MemoryStore] Failed to persist:', err);
  }
}

/**
 * Recall a value from memory. Checks cache first, then DB.
 */
export async function recall<T = unknown>(scope: MemoryScope, key: string): Promise<T | null> {
  // Check cache
  const cached = cacheGet(scope, key);
  if (cached !== null) return cached as T;

  // Check DB
  try {
    const nodeId = `${scope}::${key}`.slice(0, 100);
    const node = await db.vellumMemoryNode.findUnique({ where: { id: nodeId } });
    if (!node) return null;
    let value: unknown;
    try {
      value = JSON.parse(node.content);
    } catch {
      value = node.content;
    }
    // Re-populate cache
    cacheSet(scope, key, value);
    return value as T;
  } catch {
    return null;
  }
}

/**
 * Forget a value.
 */
export async function forget(scope: MemoryScope, key: string): Promise<void> {
  cacheDelete(scope, key);
  try {
    const nodeId = `${scope}::${key}`.slice(0, 100);
    await db.vellumMemoryNode.delete({ where: { id: nodeId } }).catch(() => {});
  } catch {
    // best-effort
  }
}

/**
 * Search memory entries within a scope.
 * Note: this is a simple LIKE search — for semantic search, use the
 * existing knowledge/embeddings module.
 */
export async function search(scope: MemoryScope, query: string): Promise<MemoryEntry[]> {
  try {
    const nodes = await db.vellumMemoryNode.findMany({
      where: {
        AND: [
          { scopeId: scope },
          { content: { contains: query } },
        ],
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });
    return nodes.map(n => ({
      id: n.id,
      scope,
      key: n.id.split('::')[1] ?? n.id,
      value: (() => {
        try { return JSON.parse(n.content); } catch { return n.content; }
      })(),
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      expiresAt: null,
      source: n.sourceType?.replace('agentic:', '') ?? 'unknown',
    }));
  } catch {
    return [];
  }
}

/**
 * Clear all memory for a scope (used when a campaign is deleted).
 */
export async function clearScope(scope: MemoryScope): Promise<void> {
  // Clear cache
  for (const key of cache.keys()) {
    if (key.startsWith(`${scope}::`)) cache.delete(key);
  }
  // Clear DB
  try {
    await db.vellumMemoryNode.deleteMany({
      where: { scopeId: scope },
    });
  } catch {
    // best-effort
  }
}
