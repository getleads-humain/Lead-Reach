/**
 * Memory System — Main Entry Point
 *
 * Exports all modules from the LeadReach AI Memory System,
 * adapted from the Vellum Assistant architecture.
 *
 * Architecture Overview:
 *
 *   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 *   │  MemoryNode  │────▶│  MemoryEdge  │────▶│   Knowledge  │
 *   │  (types.ts)  │     │  (graph)     │     │    Graph     │
 *   └──────┬───────┘     └──────────────┘     └──────────────┘
 *          │
 *          ▼
 *   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 *   │  MemoryStore │────▶│  Retriever   │────▶│  Compaction  │
 *   │ (persistence)│     │ (retrieval)  │     │ (summarize)  │
 *   └──────────────┘     └──────────────┘     └──────────────┘
 *
 * Usage:
 *
 *   import { MemoryStore, Retriever, GraphManager, Compaction } from '@/lib/vellum-core/memory';
 *
 *   // Store a new memory
 *   await MemoryStore.save({ id, content, type, significance, ... });
 *
 *   // Retrieve relevant memories for a conversation
 *   const context = await Retriever.loadContextMemory(scopeId, query);
 *
 *   // Compact a conversation into a summary
 *   const summary = await Compaction.compactToSummary(messages);
 *
 *   // Apply Ebbinghaus decay periodically
 *   await GraphManager.decayGraph(scopeId);
 */

// ============================================================
// Types (re-exported for convenience)
// ============================================================

export type {
  MemoryType,
  Fidelity,
  DecayCurve,
  SourceType,
  EdgeRelationship,
  MemoryNode,
  MemoryEdge,
  MemoryTrigger,
  ScoredMemory,
  DecayConfig,
  RetrievalConfig,
} from './types';

export {
  DEFAULT_DECAY_CONFIG,
  DEFAULT_RETRIEVAL_CONFIG,
} from './types';

// ============================================================
// Memory Store
// ============================================================

export {
  save as saveNode,
  get as getNode,
  search as searchNodes,
  getRelated as getRelatedEdges,
  deleteNode,
  updateSignificance,
  saveEdge,
  getEdge,
  deleteEdge,
  saveTrigger,
  getTriggersForNode,
  deleteTrigger,
  getNodesByScope,
  getEdgesByScope,
  clearScope,
  computeFidelity,
  generateNodeId,
  generateEdgeId,
  generateTriggerId,
} from './memory-store';

// ============================================================
// Retriever
// ============================================================

export {
  loadContextMemory,
  retrieveForTurn,
  retrieveByType,
  retrieveAndReinforce,
} from './retriever';

// ============================================================
// Graph Manager
// ============================================================

export {
  addNode,
  addEdge,
  createEdge,
  getNeighbors,
  findPaths,
  activateNode,
  decayGraph,
  mergeKnowledge,
  getGraphStats,
} from './graph-manager';

// ============================================================
// Compaction
// ============================================================

export {
  compactConversation,
  compactToSummary,
  getCircuitBreakerState,
  resetCircuitBreaker,
} from './compaction';

export type {
  ConversationMessage,
  CompactionStrategy,
  CompactionResult,
} from './compaction';
