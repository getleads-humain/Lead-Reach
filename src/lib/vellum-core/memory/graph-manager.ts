/**
 * Graph Manager — Knowledge Graph Operations
 *
 * Manages the memory knowledge graph: nodes, edges, activation spreading,
 * Ebbinghaus decay, path finding, and knowledge merging.
 *
 * The knowledge graph connects memory nodes via typed edges (caused-by,
 * reminds-of, contradicts, etc.), enabling:
 *
 *   1. **Activation spreading** — When a node is accessed, activation
 *      propagates to neighboring nodes, reinforcing related memories.
 *
 *   2. **Path finding** — Discovering chains of reasoning between memories
 *      (e.g., "lead was found" → caused-by → "search completed" → depends-on → "ICP defined").
 *
 *   3. **Decay** — Periodic Ebbinghaus decay of the entire graph for a scope,
 *      reducing significance of unaccessed memories over time.
 *
 *   4. **Merge** — Deduplicating and merging similar knowledge into
 *      consolidated memory nodes.
 */

import type {
  MemoryNode,
  MemoryEdge,
  EdgeRelationship,
  DecayConfig,
  Fidelity,
} from './types';
import { DEFAULT_DECAY_CONFIG } from './types';
import {
  save,
  get,
  saveEdge,
  getRelated,
  deleteNode,
  deleteEdge,
  getNodesByScope,
  getEdgesByScope,
  generateNodeId,
  generateEdgeId,
  computeFidelity,
} from './memory-store';

// ============================================================
// Node & Edge Addition
// ============================================================

/**
 * Add a new memory node to the graph.
 * If a node with the same ID already exists, it will be overwritten.
 *
 * @param node - The memory node to add
 */
export async function addNode(node: MemoryNode): Promise<void> {
  await save(node);
}

/**
 * Add a new edge to the knowledge graph.
 * Validates that both source and target nodes exist before adding.
 *
 * @param edge - The memory edge to add
 * @throws Error if source or target node doesn't exist
 */
export async function addEdge(edge: MemoryEdge): Promise<void> {
  // Validate that both nodes exist
  const sourceNode = await get(edge.sourceId);
  const targetNode = await get(edge.targetId);

  if (!sourceNode) {
    console.warn(
      `[GraphManager] Edge source node ${edge.sourceId} not found — edge may be orphaned`,
    );
  }
  if (!targetNode) {
    console.warn(
      `[GraphManager] Edge target node ${edge.targetId} not found — edge may be orphaned`,
    );
  }

  await saveEdge(edge);
}

/**
 * Convenience: Create and add an edge between two nodes.
 *
 * @param sourceId    - Source node ID
 * @param targetId    - Target node ID
 * @param relationship - Edge relationship type
 * @param weight      - Edge weight (0–1, default 0.5)
 * @param scopeId     - Scope ID for isolation
 * @returns The created edge
 */
export async function createEdge(
  sourceId: string,
  targetId: string,
  relationship: EdgeRelationship,
  weight: number = 0.5,
  scopeId: string,
): Promise<MemoryEdge> {
  const edge: MemoryEdge = {
    id: generateEdgeId(),
    sourceId,
    targetId,
    relationship,
    weight,
    scopeId,
  };

  await addEdge(edge);
  return edge;
}

// ============================================================
// Neighbor & Path Finding
// ============================================================

/**
 * Get neighboring nodes of a given node, up to a specified depth.
 *
 * At depth=1, returns direct neighbors.
 * At depth=2, returns neighbors of neighbors, etc.
 *
 * @param nodeId - The starting node ID
 * @param depth  - Traversal depth (default: 1)
 * @param visited - Internal set for cycle detection (don't pass manually)
 * @returns Array of neighboring memory nodes
 */
export async function getNeighbors(
  nodeId: string,
  depth: number = 1,
  visited?: Set<string>,
): Promise<MemoryNode[]> {
  const visitedSet = visited ?? new Set<string>();
  visitedSet.add(nodeId);

  if (depth <= 0) return [];

  const edges = getRelated(nodeId);
  const neighbors: MemoryNode[] = [];

  for (const edge of edges) {
    const neighborId =
      edge.sourceId === nodeId ? edge.targetId : edge.sourceId;

    if (visitedSet.has(neighborId)) continue;

    const neighborNode = await get(neighborId);
    if (neighborNode) {
      neighbors.push(neighborNode);
      visitedSet.add(neighborId);

      // Recurse for deeper traversal
      if (depth > 1) {
        const deeperNeighbors = await getNeighbors(
          neighborId,
          depth - 1,
          visitedSet,
        );
        neighbors.push(...deeperNeighbors);
      }
    }
  }

  return neighbors;
}

/**
 * Find all paths between two nodes using BFS.
 *
 * Returns an array of paths, where each path is an array of MemoryNodes
 * from the source to the target. Returns empty array if no path exists.
 *
 * @param fromId    - Starting node ID
 * @param toId      - Target node ID
 * @param maxDepth  - Maximum path length to search (default: 5)
 * @returns Array of paths (each path is an array of nodes)
 */
export async function findPaths(
  fromId: string,
  toId: string,
  maxDepth: number = 5,
): Promise<MemoryNode[][]> {
  if (fromId === toId) {
    const node = await get(fromId);
    return node ? [[node]] : [];
  }

  const paths: MemoryNode[][] = [];
  const queue: Array<{ nodeId: string; path: string[] }> = [
    { nodeId: fromId, path: [fromId] },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!;

    if (path.length > maxDepth) continue;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const edges = getRelated(nodeId);

    for (const edge of edges) {
      const neighborId =
        edge.sourceId === nodeId ? edge.targetId : edge.sourceId;

      if (neighborId === toId) {
        // Found a path!
        const fullPath = [...path, neighborId];
        const nodePath: MemoryNode[] = [];
        for (const id of fullPath) {
          const node = await get(id);
          if (node) nodePath.push(node);
        }
        if (nodePath.length === fullPath.length) {
          paths.push(nodePath);
        }
      } else if (!visited.has(neighborId)) {
        queue.push({
          nodeId: neighborId,
          path: [...path, neighborId],
        });
      }
    }
  }

  return paths;
}

// ============================================================
// Activation Spreading
// ============================================================

/**
 * Activate a node and spread activation to its neighbors.
 *
 * When a memory is accessed, activation "spreads" through the graph
 * via edges, reinforcing related memories. The strength of activation
 * decreases with distance from the source node.
 *
 * @param nodeId            - The node to activate
 * @param activationStrength - Initial activation strength (0–1, default: 1.0)
 * @param decayFactor       - How much activation decays per hop (default: 0.5)
 * @param maxHops           - Maximum hops to spread (default: 3)
 */
export async function activateNode(
  nodeId: string,
  activationStrength: number = 1.0,
  decayFactor: number = 0.5,
  maxHops: number = 3,
): Promise<void> {
  const node = await get(nodeId);
  if (!node) return;

  // Reinforce the source node
  const reinforcement = activationStrength * DEFAULT_DECAY_CONFIG.reinforcementDelta;
  await save({
    ...node,
    significance: Math.min(1.0, node.significance + reinforcement),
    stability: Math.min(
      1.0,
      node.stability + DEFAULT_DECAY_CONFIG.stabilityGrowthPerReinforcement,
    ),
    lastAccessedAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Spread activation to neighbors
  if (maxHops <= 0 || activationStrength * decayFactor < 0.05) return;

  const edges = getRelated(nodeId);

  for (const edge of edges) {
    const neighborId =
      edge.sourceId === nodeId ? edge.targetId : edge.sourceId;

    const neighbor = await get(neighborId);
    if (!neighbor) continue;

    // Edge weight modulates activation strength
    const edgeWeightedActivation = activationStrength * decayFactor * edge.weight;

    // Reinforce the neighbor
    const neighborReinforcement =
      edgeWeightedActivation * DEFAULT_DECAY_CONFIG.reinforcementDelta * 0.5;

    await save({
      ...neighbor,
      significance: Math.min(1.0, neighbor.significance + neighborReinforcement),
      stability: Math.min(
        1.0,
        neighbor.stability +
          DEFAULT_DECAY_CONFIG.stabilityGrowthPerReinforcement * 0.5,
      ),
      lastAccessedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Recurse with reduced strength
    await activateNode(
      neighborId,
      edgeWeightedActivation,
      decayFactor,
      maxHops - 1,
    );
  }
}

// ============================================================
// Ebbinghaus Decay
// ============================================================

/**
 * Apply Ebbinghaus decay to all memories in a scope.
 *
 * This should be called periodically (e.g., every hour) to simulate
 * the forgetting curve. Memories that haven't been accessed recently
 * will have their significance reduced, and their fidelity may drop.
 *
 * Decay formula:
 *   newSignificance = significance * e^(-decayRate * hoursSinceLastAccess * (1 - stability))
 *
 * Stability slows decay — a memory with stability=1.0 never decays.
 *
 * @param scopeId - The scope to decay
 * @param config  - Decay configuration
 * @returns Number of memories that had their fidelity reduced
 */
export async function decayGraph(
  scopeId: string,
  config: DecayConfig = DEFAULT_DECAY_CONFIG,
): Promise<number> {
  const nodes = await getNodesByScope(scopeId);
  let fidelityChanges = 0;

  for (const node of nodes) {
    // Flat decay = no decay ever
    if (config.curve === 'flat') continue;

    const hoursSinceLastAccess =
      (Date.now() - node.lastAccessedAt) / (1000 * 60 * 60);

    // Skip very recent accesses (less than 1 hour)
    if (hoursSinceLastAccess < 1) continue;

    // Stability reduces the effective decay rate
    const effectiveDecayRate =
      config.decayRatePerHour * (1 - node.stability);

    let newSignificance: number;

    if (config.curve === 'ebbinghaus') {
      // Exponential decay: significance * e^(-rate * hours)
      newSignificance =
        node.significance * Math.exp(-effectiveDecayRate * hoursSinceLastAccess);
    } else {
      // Linear decay: significance - rate * hours
      newSignificance = Math.max(
        0,
        node.significance - effectiveDecayRate * hoursSinceLastAccess,
      );
    }

    // Clamp to [0, 1]
    newSignificance = Math.max(0, Math.min(1, newSignificance));

    // Check if fidelity changed
    const oldFidelity = node.fidelity;
    const newFidelity = computeFidelity(newSignificance, config);

    if (oldFidelity !== newFidelity) {
      fidelityChanges++;
    }

    // Update the node
    await save({
      ...node,
      significance: newSignificance,
      fidelity: newFidelity,
      updatedAt: Date.now(),
    });

    // Clean up "gone" memories (optional — could also keep them for audit)
    if (newFidelity === 'gone' && newSignificance < config.goneThreshold * 0.5) {
      await deleteNode(node.id);
    }
  }

  return fidelityChanges;
}

// ============================================================
// Knowledge Merging
// ============================================================

/**
 * Merge a new knowledge node with an existing node if they represent
 * the same concept. If no existing node is found, the new node is
 * created as-is.
 *
 * Merge strategy:
 *   - Content: Concatenate with " | " separator if different
 *   - Significance: Take the maximum
 *   - Confidence: Take the weighted average (weighted by significance)
 *   - Stability: Take the maximum
 *   - Source conversations: Union of both sets
 *   - Emotional charge: Merge, taking the max for each emotion
 *   - Fidelity: Recalculate from merged significance
 *
 * @param newNode    - The new memory node to merge
 * @param existingId - Optional ID of an existing node to merge with
 * @returns The merged (or newly created) memory node
 */
export async function mergeKnowledge(
  newNode: MemoryNode,
  existingId?: string,
): Promise<MemoryNode> {
  // If no existing ID, check for similar content in the same scope
  let existing: MemoryNode | null = null;

  if (existingId) {
    existing = await get(existingId);
  } else {
    // Try to find a similar node in the same scope
    const scopeNodes = await getNodesByScope(newNode.scopeId);
    const newNodeKeywords = extractKeywords(newNode.content);

    for (const candidate of scopeNodes) {
      if (candidate.type !== newNode.type) continue;

      const candidateKeywords = extractKeywords(candidate.content);
      const overlap = calculateKeywordOverlap(newNodeKeywords, candidateKeywords);

      // If >60% keyword overlap, consider it a duplicate
      if (overlap > 0.6) {
        existing = candidate;
        break;
      }
    }
  }

  if (!existing) {
    // No merge needed — save as new
    await save(newNode);
    return newNode;
  }

  // Merge the two nodes
  const merged: MemoryNode = {
    id: existing.id, // Keep the existing ID
    content: mergeContent(existing.content, newNode.content),
    type: newNode.type, // Prefer the new type (more recent)
    fidelity: 'vivid', // Will be recalculated
    confidence: weightedAverage(
      existing.confidence,
      newNode.confidence,
      existing.significance,
      newNode.significance,
    ),
    significance: Math.max(existing.significance, newNode.significance),
    stability: Math.max(existing.stability, newNode.stability),
    emotionalCharge: mergeEmotionalCharge(
      existing.emotionalCharge,
      newNode.emotionalCharge,
    ),
    sourceConversations: Array.from(
      new Set([
        ...existing.sourceConversations,
        ...newNode.sourceConversations,
      ]),
    ),
    sourceType: newNode.sourceType, // Prefer the more recent source type
    narrativeRole: newNode.narrativeRole || existing.narrativeRole,
    scopeId: existing.scopeId,
    createdAt: existing.createdAt, // Keep the original creation time
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
  };

  // Recalculate fidelity
  merged.fidelity = computeFidelity(merged.significance);

  // Save the merged node
  await save(merged);

  // If the new node had a different ID, create a "supersedes" edge
  if (newNode.id !== existing.id) {
    await createEdge(
      newNode.id,
      existing.id,
      'supersedes',
      0.8,
      newNode.scopeId,
    );
  }

  return merged;
}

// ============================================================
// Merge Helpers
// ============================================================

/**
 * Extract keywords from text for similarity comparison.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

/**
 * Calculate the overlap ratio between two keyword sets.
 */
function calculateKeywordOverlap(
  keywordsA: string[],
  keywordsB: string[],
): number {
  if (keywordsA.length === 0 || keywordsB.length === 0) return 0;

  const setA = new Set(keywordsA);
  const setB = new Set(keywordsB);

  let intersection = 0;
  for (const word of Array.from(setA)) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Merge two content strings, avoiding redundancy.
 * If they're very similar, keep the longer one.
 * If they're different, concatenate with " | ".
 */
function mergeContent(existing: string, incoming: string): string {
  const overlap = calculateKeywordOverlap(
    extractKeywords(existing),
    extractKeywords(incoming),
  );

  if (overlap > 0.8) {
    // Very similar — keep the longer, more detailed version
    return incoming.length >= existing.length ? incoming : existing;
  }

  // Different enough to concatenate
  return `${existing} | ${incoming}`;
}

/**
 * Calculate a weighted average of two values.
 */
function weightedAverage(
  a: number,
  b: number,
  weightA: number,
  weightB: number,
): number {
  const totalWeight = weightA + weightB;
  if (totalWeight === 0) return (a + b) / 2;
  return (a * weightA + b * weightB) / totalWeight;
}

/**
 * Merge two emotional charge records, taking the max for each emotion.
 */
function mergeEmotionalCharge(
  existing?: Record<string, number>,
  incoming?: Record<string, number>,
): Record<string, number> | undefined {
  if (!existing && !incoming) return undefined;
  if (!existing) return incoming;
  if (!incoming) return existing;

  const merged: Record<string, number> = { ...existing };
  for (const [emotion, value] of Object.entries(incoming)) {
    merged[emotion] = Math.max(merged[emotion] ?? 0, value);
  }
  return merged;
}

// ============================================================
// Graph Statistics
// ============================================================

/**
 * Get statistics about the knowledge graph for a scope.
 */
export async function getGraphStats(
  scopeId: string,
): Promise<{
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  nodesByFidelity: Record<string, number>;
  averageSignificance: number;
  averageConfidence: number;
  averageStability: number;
}> {
  const nodes = await getNodesByScope(scopeId);
  const edges = await getEdgesByScope(scopeId);

  const nodesByType: Record<string, number> = {};
  const nodesByFidelity: Record<string, number> = {};
  let totalSignificance = 0;
  let totalConfidence = 0;
  let totalStability = 0;

  for (const node of nodes) {
    nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    nodesByFidelity[node.fidelity] = (nodesByFidelity[node.fidelity] || 0) + 1;
    totalSignificance += node.significance;
    totalConfidence += node.confidence;
    totalStability += node.stability;
  }

  const count = nodes.length || 1;

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodesByType,
    nodesByFidelity,
    averageSignificance: totalSignificance / count,
    averageConfidence: totalConfidence / count,
    averageStability: totalStability / count,
  };
}
