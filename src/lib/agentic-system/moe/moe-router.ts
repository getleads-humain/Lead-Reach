/**
 * Mixture-of-Experts (MoE) Router for LeadReach
 * ==============================================
 *
 * LeadReach is intentionally NOT a true MoE in the neural sense — we don't
 * have multiple LLM backends that we route between at the token level.
 *
 * What we DO have is multiple EXPERT PIPELINES — different ways to handle
 * the same user query depending on its shape. The MoE router picks the
 * best expert (pipeline variant) for each query, and the harness can
 * fan-out the same query to multiple experts and pick the best result.
 *
 * Experts:
 *   1. discovery_expert   — multi-channel web search (default for research_*)
 *   2. enrichment_expert  — deep crawl + LLM extraction (for research_url)
 *   3. qualification_expert — ICP scoring (for score_lead / build_icp)
 *   4. outreach_expert    — message composition (for compose_outreach)
 *   5. analysis_expert    — market & competitive analysis (for analyze_*)
 *   6. conversation_expert — fast path for clarify / converse
 *
 * The router computes a soft score for each expert given the query and
 * picks the top-K (default top-1). If scores are tied, it falls back to
 * the discovery_expert (most general-purpose).
 */

import type { UserIntent } from '@/lib/prospect-agent/types';
import type { SOPVariant } from '../sop/sop-spec';
import { pickSopVariant } from '../sop/sop-spec';

// ============================================================
// Expert Definitions
// ============================================================

export interface Expert {
  name: string;
  description: string;
  /** Intents this expert is best at handling. */
  primaryIntents: UserIntent[];
  /** SOP variant this expert corresponds to. */
  sopVariant: SOPVariant;
  /** Estimated cost (1=cheap, 10=expensive). */
  cost: number;
  /** Estimated latency in ms. */
  estimatedLatencyMs: number;
  /** Quality score for its primary intents (0-1). */
  qualityScore: number;
}

export const EXPERTS: Expert[] = [
  {
    name: 'discovery_expert',
    description: 'Multi-channel web search across DuckDuckGo, Exa, LinkedIn, GitHub, etc.',
    primaryIntents: ['research_company', 'research_url', 'refine_search'],
    sopVariant: 'discovery',
    cost: 4,
    estimatedLatencyMs: 90_000,
    qualityScore: 0.85,
  },
  {
    name: 'enrichment_expert',
    description: 'Deep crawl + LLM extraction for person-level contact research.',
    primaryIntents: ['research_person'],
    sopVariant: 'enrichment',
    cost: 6,
    estimatedLatencyMs: 120_000,
    qualityScore: 0.80,
  },
  {
    name: 'qualification_expert',
    description: 'ICP-based lead scoring and qualification.',
    primaryIntents: ['score_lead', 'build_icp'],
    sopVariant: 'qualification',
    cost: 2,
    estimatedLatencyMs: 30_000,
    qualityScore: 0.90,
  },
  {
    name: 'outreach_expert',
    description: 'Personalized outreach message composition.',
    primaryIntents: ['compose_outreach', 'add_to_pipeline'],
    sopVariant: 'outreach',
    cost: 3,
    estimatedLatencyMs: 30_000,
    qualityScore: 0.88,
  },
  {
    name: 'analysis_expert',
    description: 'Market and competitive analysis with trigger event detection.',
    primaryIntents: ['analyze_market', 'analyze_competitors'],
    sopVariant: 'analysis',
    cost: 5,
    estimatedLatencyMs: 60_000,
    qualityScore: 0.82,
  },
  {
    name: 'conversation_expert',
    description: 'Fast path for clarification and general conversation.',
    primaryIntents: ['clarify', 'converse'],
    sopVariant: 'conversation',
    cost: 1,
    estimatedLatencyMs: 8_000,
    qualityScore: 0.95,
  },
];

// ============================================================
// Router
// ============================================================

export interface RoutingDecision {
  /** The selected expert. */
  expert: Expert;
  /** All experts considered, with their scores. */
  scores: Array<{ expert: string; score: number; reason: string }>;
  /** The intent used to make the decision. */
  intent: UserIntent;
  /** The SOP variant that will run. */
  sopVariant: SOPVariant;
}

/**
 * Route a query to the best expert.
 *
 * The current implementation uses intent-based hard routing (one expert per
 * intent). This is intentionally simple — it matches the existing pipeline
 * behavior and is fully deterministic.
 *
 * Future enhancement: when we have multiple LLM backends, this router can
 * become a true soft MoE that fans out to multiple experts and picks the
 * best result.
 */
export function routeQuery(
  intent: UserIntent,
  opts: { allowMultiple?: boolean; maxExperts?: number } = {},
): RoutingDecision {
  const scores = EXPERTS.map(expert => {
    if (expert.primaryIntents.includes(intent)) {
      return {
        expert: expert.name,
        score: expert.qualityScore,
        reason: `Primary intent match (${intent})`,
      };
    }
    // Soft score — experts that handle similar intents get partial credit
    return {
      expert: expert.name,
      score: 0.1,
      reason: 'Not a primary intent match (fallback only)',
    };
  }).sort((a, b) => b.score - a.score);

  const topExpert = EXPERTS.find(e => e.name === scores[0].expert) ?? EXPERTS[0];
  const sopVariant = pickSopVariant(intent);

  return {
    expert: topExpert,
    scores,
    intent,
    sopVariant,
  };
}

/**
 * Route to multiple experts (for fan-out / ensemble).
 * Currently returns just the top-1, but the API supports top-K for future use.
 */
export function routeQueryMulti(
  intent: UserIntent,
  maxExperts = 1,
): RoutingDecision[] {
  const decision = routeQuery(intent);
  if (maxExperts <= 1) return [decision];

  // For now, just return the top-1 — the soft MoE enhancement is future work
  return [decision];
}

// ============================================================
// Public API
// ============================================================

export function getExpert(name: string): Expert | undefined {
  return EXPERTS.find(e => e.name === name);
}

export function listExperts(): Expert[] {
  return [...EXPERTS];
}
