/**
 * Memory System — Type Definitions
 *
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 * Implements a multi-layered memory model with Ebbinghaus-inspired decay,
 * knowledge graph edges, and per-user scope isolation.
 *
 * Memory Types:
 *   - Episodic:  Specific events and experiences (e.g., "User asked about SaaS in Berlin")
 *   - Semantic:  General knowledge facts (e.g., "Berlin has a thriving SaaS ecosystem")
 *   - Procedural: How-to knowledge (e.g., "To qualify a lead, check ICP score >= 50")
 *   - Emotional:  Affective associations (e.g., "User seemed frustrated with slow results")
 *   - Prospective: Future intentions (e.g., "User plans to launch a campaign next week")
 *   - Behavioral:  Observed patterns (e.g., "User always asks for LinkedIn data first")
 *   - Narrative:   Story-form summaries (e.g., "The user is building a pipeline for fintech")
 *
 * Fidelity tracks how "vivid" a memory is — decaying over time unless reinforced,
 * following the Ebbinghaus forgetting curve model.
 */

// ============================================================
// Core Memory Types
// ============================================================

/**
 * The category of memory, each serving a distinct cognitive function.
 */
export type MemoryType =
  | 'episodic'      // Specific events and experiences
  | 'semantic'      // General knowledge facts
  | 'procedural'    // How-to / step-by-step knowledge
  | 'emotional'     // Affective associations and sentiment
  | 'prospective'   // Future intentions and reminders
  | 'behavioral'    // Observed user patterns and preferences
  | 'narrative';    // Story-form summaries of interactions

/**
 * How vividly a memory is retained. Decays over time (Ebbinghaus curve)
 * unless reinforced through re-access or re-encoding.
 */
export type Fidelity = 'vivid' | 'dim' | 'fading' | 'gone';

/**
 * The shape of the forgetting curve applied to a memory node.
 *   - ebbinghaus: Exponential decay (default, models human forgetting)
 *   - linear:     Constant decay rate
 *   - flat:       No decay (permanent memories like core procedures)
 */
export type DecayCurve = 'ebbinghaus' | 'linear' | 'flat';

/**
 * How the memory was originally acquired.
 */
export type SourceType = 'direct' | 'inferred' | 'observed' | 'told-by-other';

/**
 * The type of relationship between two memory nodes in the knowledge graph.
 */
export type EdgeRelationship =
  | 'caused-by'      // A caused B
  | 'reminds-of'     // A reminds of B (associative)
  | 'contradicts'    // A contradicts B
  | 'depends-on'     // A depends on B
  | 'part-of'        // A is part of B (hierarchical)
  | 'supersedes'     // A supersedes/replaces B
  | 'resolved-by';   // A is resolved by B (problem → solution)

// ============================================================
// Memory Node
// ============================================================

/**
 * A single unit of memory, stored as first-person prose content.
 *
 * Key properties:
 *   - significance:  Ebbinghaus-based importance score (0–1). Decays over time,
 *                    increases on reinforcement (re-access).
 *   - stability:     Grows monotonically with reinforcement. High stability
 *                    means the memory decays more slowly.
 *   - confidence:    How certain we are about this memory's accuracy (0–1).
 *   - fidelity:      Current retention strength — vivid → dim → fading → gone.
 *   - emotionalCharge: Optional emotional valence mapping (e.g., { joy: 0.6, frustration: 0.3 })
 */
export interface MemoryNode {
  /** Unique identifier for this memory node */
  id: string;

  /** The memory content, written as first-person prose */
  content: string;

  /** Category of memory (episodic, semantic, procedural, etc.) */
  type: MemoryType;

  /** Current retention fidelity — decays over time unless reinforced */
  fidelity: Fidelity;

  /** Confidence in the accuracy of this memory (0–1) */
  confidence: number;

  /** Ebbinghaus-inspired significance score (0–1). Decays, reinforced on access */
  significance: number;

  /** Stability score — grows with reinforcement, slows decay (0–1) */
  stability: number;

  /** Optional emotional valence mapping (e.g., { joy: 0.6, frustration: 0.3 }) */
  emotionalCharge?: Record<string, number>;

  /** IDs of conversations that contributed to this memory */
  sourceConversations: string[];

  /** How this memory was originally acquired */
  sourceType: SourceType;

  /** Optional narrative role (e.g., "protagonist", "antagonist", "setting") */
  narrativeRole?: string;

  /** Scope ID for per-user isolation (e.g., user ID or session ID) */
  scopeId: string;

  /** Unix timestamp (ms) when the memory was created */
  createdAt: number;

  /** Unix timestamp (ms) when the memory was last updated */
  updatedAt: number;

  /** Unix timestamp (ms) when the memory was last accessed */
  lastAccessedAt: number;
}

// ============================================================
// Memory Edge (Knowledge Graph)
// ============================================================

/**
 * A directed edge connecting two memory nodes in the knowledge graph.
 * Edges represent semantic, causal, or associative relationships.
 */
export interface MemoryEdge {
  /** Unique identifier for this edge */
  id: string;

  /** Source memory node ID */
  sourceId: string;

  /** Target memory node ID */
  targetId: string;

  /** The type of relationship this edge represents */
  relationship: EdgeRelationship;

  /** Edge weight / strength (0–1). Higher = stronger connection */
  weight: number;

  /** Scope ID for per-user isolation */
  scopeId: string;
}

// ============================================================
// Memory Trigger
// ============================================================

/**
 * A trigger that causes a memory to be activated or surfaced.
 * Triggers can be temporal (time-based), semantic (keyword-based),
 * or event-based (specific system events).
 */
export interface MemoryTrigger {
  /** Unique identifier for this trigger */
  id: string;

  /** The memory node this trigger is attached to */
  nodeId: string;

  /** The type of trigger condition */
  type: 'temporal' | 'semantic' | 'event';

  /** The condition configuration (varies by type) */
  condition: Record<string, unknown>;

  /** Scope ID for per-user isolation */
  scopeId: string;
}

// ============================================================
// Scored Memory (Retrieval Result)
// ============================================================

/**
 * A memory node with an attached relevance score, used during retrieval.
 * The score combines significance, confidence, recency, and semantic similarity.
 */
export interface ScoredMemory {
  /** The memory node */
  node: MemoryNode;

  /** Combined relevance score (0–1) for the current query */
  score: number;

  /** Breakdown of the score components */
  scoreBreakdown: {
    /** Contribution from significance (Ebbinghaus-weighted) */
    significance: number;
    /** Contribution from confidence */
    confidence: number;
    /** Contribution from recency (time since last access) */
    recency: number;
    /** Contribution from keyword/semantic match */
    relevance: number;
  };
}

// ============================================================
// Utility Types
// ============================================================

/**
 * Configuration for the Ebbinghaus decay model.
 */
export interface DecayConfig {
  /** Decay curve type */
  curve: DecayCurve;
  /** Base decay rate per hour (default: 0.01 for ebbinghaus) */
  decayRatePerHour: number;
  /** Significance threshold below which fidelity drops to 'fading' */
  fadingThreshold: number;
  /** Significance threshold below which fidelity drops to 'gone' */
  goneThreshold: number;
  /** Reinforcement boost when a memory is re-accessed (added to significance) */
  reinforcementDelta: number;
  /** Stability growth per reinforcement event (capped at 1.0) */
  stabilityGrowthPerReinforcement: number;
}

/**
 * Default Ebbinghaus decay configuration.
 */
export const DEFAULT_DECAY_CONFIG: DecayConfig = {
  curve: 'ebbinghaus',
  decayRatePerHour: 0.01,
  fadingThreshold: 0.3,
  goneThreshold: 0.1,
  reinforcementDelta: 0.15,
  stabilityGrowthPerReinforcement: 0.1,
};

/**
 * Configuration for the retrieval pipeline.
 */
export interface RetrievalConfig {
  /** Maximum number of memories to return from a retrieval call */
  maxResults: number;
  /** Minimum combined score threshold for a memory to be included */
  minScore: number;
  /** Weight of significance in the combined score (default: 0.3) */
  significanceWeight: number;
  /** Weight of confidence in the combined score (default: 0.2) */
  confidenceWeight: number;
  /** Weight of recency in the combined score (default: 0.2) */
  recencyWeight: number;
  /** Weight of keyword/semantic relevance in the combined score (default: 0.3) */
  relevanceWeight: number;
  /** Recency half-life in hours — after this time, recency score halves (default: 24) */
  recencyHalfLifeHours: number;
}

/**
 * Default retrieval configuration.
 */
export const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
  maxResults: 20,
  minScore: 0.15,
  significanceWeight: 0.3,
  confidenceWeight: 0.2,
  recencyWeight: 0.2,
  relevanceWeight: 0.3,
  recencyHalfLifeHours: 24,
};
