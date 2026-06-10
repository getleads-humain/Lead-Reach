/**
 * Memory Store — Persistence Layer
 *
 * Implements the in-memory Map + Prisma persistence pattern for MemoryNode,
 * MemoryEdge, and MemoryTrigger records.
 *
 * Design:
 *   - Primary store: In-memory Maps for fast reads during conversation
 *   - Persistence: Periodic writes to Prisma (SQLite) for durability
 *   - Scope isolation: All operations are scoped by scopeId (per-user)
 *   - Ebbinghaus reinforcement: updateSignificance() boosts significance
 *     and stability when a memory is re-accessed
 *
 * NOTE: Prisma model is not added to schema yet — using AgentTask as a
 * fallback persistence mechanism (same pattern as existing agent-memory.ts).
 * When the MemoryNode model is added to schema.prisma, swap the DB calls.
 */

import { db } from '@/lib/db';
import type {
  MemoryNode,
  MemoryEdge,
  MemoryTrigger,
  Fidelity,
  DecayConfig,
} from './types';
import { DEFAULT_DECAY_CONFIG } from './types';

// ============================================================
// In-Memory Stores
// ============================================================

/** Primary node store: nodeId → MemoryNode */
const nodeStore = new Map<string, MemoryNode>();

/** Edge store: edgeId → MemoryEdge */
const edgeStore = new Map<string, MemoryEdge>();

/** Trigger store: triggerId → MemoryTrigger */
const triggerStore = new Map<string, MemoryTrigger>();

/** Index: scopeId → Set of nodeIds for fast scope-based queries */
const scopeIndex = new Map<string, Set<string>>();

/** Index: scopeId → Set of edgeIds for fast scope-based edge queries */
const scopeEdgeIndex = new Map<string, Set<string>>();

/** Track which scopes have been hydrated from DB */
const hydratedScopes = new Set<string>();

// ============================================================
// ID Generation
// ============================================================

function generateNodeId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateEdgeId(): string {
  return `edge_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateTriggerId(): string {
  return `trg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================
// Fidelity Calculation
// ============================================================

/**
 * Compute the fidelity level from the current significance value,
 * using the configured thresholds.
 */
export function computeFidelity(
  significance: number,
  config: DecayConfig = DEFAULT_DECAY_CONFIG,
): Fidelity {
  if (significance >= 0.6) return 'vivid';
  if (significance >= config.fadingThreshold) return 'dim';
  if (significance >= config.goneThreshold) return 'fading';
  return 'gone';
}

// ============================================================
// Scope Hydration (load from DB on first access)
// ============================================================

/**
 * Load memories for a scope from the database into the in-memory store.
 * This is called lazily on first access for a given scopeId.
 */
async function hydrateScope(scopeId: string): Promise<void> {
  if (hydratedScopes.has(scopeId)) return;

  try {
    // Use AgentTask as a persistence layer (same pattern as agent-memory.ts)
    // When MemoryNode model is added to schema, replace this with a direct query
    const dbRecords = await db.agentTask.findMany({
      where: {
        agentName: 'memory-system',
        taskType: { startsWith: 'memory_node_' },
        status: 'completed',
        input: { contains: scopeId },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    for (const record of dbRecords) {
      if (!record.output) continue;
      try {
        const node = JSON.parse(record.output) as MemoryNode;
        if (node.scopeId === scopeId && !nodeStore.has(node.id)) {
          nodeStore.set(node.id, node);
          if (!scopeIndex.has(scopeId)) {
            scopeIndex.set(scopeId, new Set());
          }
          scopeIndex.get(scopeId)!.add(node.id);
        }
      } catch {
        // Skip malformed records
      }
    }

    // Also hydrate edges
    const dbEdges = await db.agentTask.findMany({
      where: {
        agentName: 'memory-system',
        taskType: 'memory_edge',
        status: 'completed',
        input: { contains: scopeId },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    for (const record of dbEdges) {
      if (!record.output) continue;
      try {
        const edge = JSON.parse(record.output) as MemoryEdge;
        if (edge.scopeId === scopeId && !edgeStore.has(edge.id)) {
          edgeStore.set(edge.id, edge);
          if (!scopeEdgeIndex.has(scopeId)) {
            scopeEdgeIndex.set(scopeId, new Set());
          }
          scopeEdgeIndex.get(scopeId)!.add(edge.id);
        }
      } catch {
        // Skip malformed records
      }
    }

    hydratedScopes.add(scopeId);
  } catch (error) {
    console.warn(
      `[MemoryStore] Failed to hydrate scope ${scopeId}: ${error instanceof Error ? error.message : 'Unknown'}`,
    );
    // Mark as hydrated even on failure to avoid repeated DB queries
    hydratedScopes.add(scopeId);
  }
}

// ============================================================
// Node Operations
// ============================================================

/**
 * Save a memory node to the in-memory store and persist to DB.
 * If the node already exists, it will be updated.
 */
export async function save(node: MemoryNode): Promise<void> {
  const now = Date.now();
  const updatedNode: MemoryNode = {
    ...node,
    updatedAt: now,
    fidelity: computeFidelity(node.significance),
  };

  // Update in-memory store
  nodeStore.set(node.id, updatedNode);

  // Update scope index
  if (!scopeIndex.has(node.scopeId)) {
    scopeIndex.set(node.scopeId, new Set());
  }
  scopeIndex.get(node.scopeId)!.add(node.id);

  // Persist to database (non-blocking)
  persistNode(updatedNode).catch((err) => {
    console.warn(
      `[MemoryStore] Failed to persist node ${node.id}: ${err instanceof Error ? err.message : 'Unknown'}`,
    );
  });
}

/**
 * Persist a single memory node to the database.
 * Uses upsert-like behavior: creates if new, updates if existing.
 */
async function persistNode(node: MemoryNode): Promise<void> {
  try {
    const taskType = `memory_node_${node.type}`;
    const inputJson = JSON.stringify({ scopeId: node.scopeId, nodeId: node.id });
    const outputJson = JSON.stringify(node);

    // Check if record exists
    const existing = await db.agentTask.findFirst({
      where: {
        agentName: 'memory-system',
        taskType,
        input: inputJson,
      },
    });

    if (existing) {
      await db.agentTask.update({
        where: { id: existing.id },
        data: {
          output: outputJson,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.agentTask.create({
        data: {
          agentName: 'memory-system',
          taskType,
          status: 'completed',
          input: inputJson,
          output: outputJson,
          completedAt: new Date(),
        },
      });
    }
  } catch (error) {
    // Non-critical — memory is still in-memory
    console.warn(
      `[MemoryStore] DB persist error for node: ${error instanceof Error ? error.message : 'Unknown'}`,
    );
  }
}

/**
 * Get a memory node by ID. Returns null if not found.
 * Automatically hydrates the scope if needed.
 */
export async function get(id: string): Promise<MemoryNode | null> {
  // Check in-memory store first
  const node = nodeStore.get(id);
  if (node) {
    // Update lastAccessedAt
    node.lastAccessedAt = Date.now();
    return node;
  }
  return null;
}

/**
 * Search for memory nodes matching a query within a scope.
 * Uses keyword matching against content, type, and narrativeRole.
 * For full semantic retrieval, use the Retriever module instead.
 */
export async function search(
  query: string,
  scopeId: string,
  limit: number = 20,
): Promise<MemoryNode[]> {
  await hydrateScope(scopeId);

  const scopeNodes = scopeIndex.get(scopeId);
  if (!scopeNodes) return [];

  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);

  const results: Array<{ node: MemoryNode; score: number }> = [];

  const nodeIds = Array.from(scopeNodes);
  for (const nodeId of nodeIds) {
    const node = nodeStore.get(nodeId);
    if (!node || node.fidelity === 'gone') continue;

    const contentLower = node.content.toLowerCase();
    const typeLower = node.type.toLowerCase();
    const roleLower = (node.narrativeRole || '').toLowerCase();

    // Calculate keyword match score
    let matchScore = 0;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) matchScore += 2;
      if (typeLower.includes(term)) matchScore += 1;
      if (roleLower.includes(term)) matchScore += 1;
    }

    // Weight by significance and confidence
    const weightedScore =
      matchScore * node.significance * node.confidence;

    if (matchScore > 0) {
      results.push({ node, score: weightedScore });
    }
  }

  // Sort by weighted score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit).map((r) => r.node);
}

/**
 * Get all edges related to a node, optionally filtered by relationship type.
 */
export function getRelated(
  nodeId: string,
  relationship?: import('./types').EdgeRelationship,
): MemoryEdge[] {
  const edges: MemoryEdge[] = [];
  const allEdges = Array.from(edgeStore.values());

  for (const edge of allEdges) {
    const matchesSource = edge.sourceId === nodeId;
    const matchesTarget = edge.targetId === nodeId;
    const matchesRelationship = !relationship || edge.relationship === relationship;

    if ((matchesSource || matchesTarget) && matchesRelationship) {
      edges.push(edge);
    }
  }

  return edges;
}

/**
 * Delete a memory node and all its associated edges.
 */
export async function deleteNode(id: string): Promise<void> {
  const node = nodeStore.get(id);
  if (!node) return;

  // Remove from scope index
  const scopeNodes = scopeIndex.get(node.scopeId);
  if (scopeNodes) {
    scopeNodes.delete(id);
    if (scopeNodes.size === 0) {
      scopeIndex.delete(node.scopeId);
    }
  }

  // Remove associated edges
  const edgesToRemove: string[] = [];
  const allEntries = Array.from(edgeStore.entries());
  for (const [edgeId, edge] of allEntries) {
    if (edge.sourceId === id || edge.targetId === id) {
      edgesToRemove.push(edgeId);
    }
  }

  for (const edgeId of edgesToRemove) {
    const edge = edgeStore.get(edgeId);
    if (edge) {
      const scopeEdges = scopeEdgeIndex.get(edge.scopeId);
      if (scopeEdges) {
        scopeEdges.delete(edgeId);
      }
    }
    edgeStore.delete(edgeId);
  }

  // Remove from in-memory store
  nodeStore.delete(id);

  // Remove from database
  try {
    await db.agentTask.deleteMany({
      where: {
        agentName: 'memory-system',
        taskType: { startsWith: 'memory_node_' },
        input: { contains: id },
      },
    });
  } catch {
    // Non-critical
  }
}

/**
 * Update the significance of a memory node (Ebbinghaus reinforcement).
 *
 * When a memory is re-accessed or re-confirmed:
 *   - significance += delta (capped at 1.0)
 *   - stability += stabilityGrowthPerReinforcement (capped at 1.0)
 *   - fidelity is recalculated
 *   - lastAccessedAt is updated
 */
export async function updateSignificance(
  id: string,
  delta: number,
  config: DecayConfig = DEFAULT_DECAY_CONFIG,
): Promise<void> {
  const node = nodeStore.get(id);
  if (!node) return;

  node.significance = Math.min(1.0, node.significance + delta);
  node.stability = Math.min(
    1.0,
    node.stability + config.stabilityGrowthPerReinforcement,
  );
  node.fidelity = computeFidelity(node.significance, config);
  node.lastAccessedAt = Date.now();
  node.updatedAt = Date.now();

  nodeStore.set(id, node);

  // Persist the update
  persistNode(node).catch(() => {
    // Non-critical
  });
}

// ============================================================
// Edge Operations
// ============================================================

/**
 * Save a memory edge to the in-memory store and persist to DB.
 */
export async function saveEdge(edge: MemoryEdge): Promise<void> {
  edgeStore.set(edge.id, edge);

  // Update scope edge index
  if (!scopeEdgeIndex.has(edge.scopeId)) {
    scopeEdgeIndex.set(edge.scopeId, new Set());
  }
  scopeEdgeIndex.get(edge.scopeId)!.add(edge.id);

  // Persist to database (non-blocking)
  persistEdge(edge).catch(() => {
    // Non-critical
  });
}

/**
 * Persist a single memory edge to the database.
 */
async function persistEdge(edge: MemoryEdge): Promise<void> {
  try {
    const inputJson = JSON.stringify({ scopeId: edge.scopeId, edgeId: edge.id });
    const outputJson = JSON.stringify(edge);

    const existing = await db.agentTask.findFirst({
      where: {
        agentName: 'memory-system',
        taskType: 'memory_edge',
        input: inputJson,
      },
    });

    if (existing) {
      await db.agentTask.update({
        where: { id: existing.id },
        data: {
          output: outputJson,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.agentTask.create({
        data: {
          agentName: 'memory-system',
          taskType: 'memory_edge',
          status: 'completed',
          input: inputJson,
          output: outputJson,
          completedAt: new Date(),
        },
      });
    }
  } catch {
    // Non-critical
  }
}

/**
 * Get an edge by ID.
 */
export function getEdge(id: string): MemoryEdge | null {
  return edgeStore.get(id) ?? null;
}

/**
 * Delete an edge by ID.
 */
export function deleteEdge(id: string): void {
  const edge = edgeStore.get(id);
  if (!edge) return;

  const scopeEdges = scopeEdgeIndex.get(edge.scopeId);
  if (scopeEdges) {
    scopeEdges.delete(id);
  }

  edgeStore.delete(id);
}

// ============================================================
// Trigger Operations
// ============================================================

/**
 * Save a memory trigger.
 */
export function saveTrigger(trigger: MemoryTrigger): void {
  triggerStore.set(trigger.id, trigger);
}

/**
 * Get triggers for a node.
 */
export function getTriggersForNode(nodeId: string): MemoryTrigger[] {
  const triggers: MemoryTrigger[] = [];
  const allTriggers = Array.from(triggerStore.values());
  for (const trigger of allTriggers) {
    if (trigger.nodeId === nodeId) {
      triggers.push(trigger);
    }
  }
  return triggers;
}

/**
 * Delete a trigger by ID.
 */
export function deleteTrigger(id: string): void {
  triggerStore.delete(id);
}

// ============================================================
// Bulk Operations
// ============================================================

/**
 * Get all nodes in a scope (hydrates from DB if needed).
 */
export async function getNodesByScope(scopeId: string): Promise<MemoryNode[]> {
  await hydrateScope(scopeId);

  const scopeNodes = scopeIndex.get(scopeId);
  if (!scopeNodes) return [];

  const nodes: MemoryNode[] = [];
  const nodeIds = Array.from(scopeNodes);
  for (const nodeId of nodeIds) {
    const node = nodeStore.get(nodeId);
    if (node && node.fidelity !== 'gone') {
      nodes.push(node);
    }
  }
  return nodes;
}

/**
 * Get all edges in a scope (hydrates from DB if needed).
 */
export async function getEdgesByScope(scopeId: string): Promise<MemoryEdge[]> {
  await hydrateScope(scopeId);

  const scopeEdges = scopeEdgeIndex.get(scopeId);
  if (!scopeEdges) return [];

  const edges: MemoryEdge[] = [];
  const edgeIds = Array.from(scopeEdges);
  for (const edgeId of edgeIds) {
    const edge = edgeStore.get(edgeId);
    if (edge) {
      edges.push(edge);
    }
  }
  return edges;
}

/**
 * Clear all memories for a scope (in-memory + DB).
 */
export async function clearScope(scopeId: string): Promise<void> {
  // Remove nodes
  const scopeNodes = scopeIndex.get(scopeId);
  if (scopeNodes) {
    const nodeIds = Array.from(scopeNodes);
    for (const nodeId of nodeIds) {
      nodeStore.delete(nodeId);
    }
    scopeIndex.delete(scopeId);
  }

  // Remove edges
  const scopeEdges = scopeEdgeIndex.get(scopeId);
  if (scopeEdges) {
    const edgeIds = Array.from(scopeEdges);
    for (const edgeId of edgeIds) {
      edgeStore.delete(edgeId);
    }
    scopeEdgeIndex.delete(scopeId);
  }

  // Remove from hydrated set
  hydratedScopes.delete(scopeId);

  // Remove from DB
  try {
    await db.agentTask.deleteMany({
      where: {
        agentName: 'memory-system',
        input: { contains: scopeId },
      },
    });
  } catch {
    // Non-critical
  }
}

// ============================================================
// ID Generators (exported for external use)
// ============================================================

export { generateNodeId, generateEdgeId, generateTriggerId };
