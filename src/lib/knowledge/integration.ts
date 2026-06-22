// ============================================================
// Knowledge Integration for Prospect Agent Pipeline
// ============================================================
// Thin wrapper that integrates the knowledge base with the
// 8-agent prospect pipeline. Provides:
//   - retrieveContextForAgent(): Pull relevant knowledge for a
//     specific agent invocation
//   - augmentSystemPrompt(): Inject knowledge into an agent's
//     system prompt
//   - getKnowledgeContextForPipeline(): Pre-compute knowledge
//     context for the entire pipeline (Atlas uses this)
//
// All functions are non-throwing — if knowledge retrieval fails,
// they return empty strings / empty arrays so the pipeline
// continues without knowledge context (graceful degradation).
// ============================================================

import {
  retrieveKnowledge,
  formatRetrievedKnowledge,
  getKnowledgeStats,
  type RetrievedDocument,
  type RetrievalQuery,
} from './loader';
import { retrieveKnowledgeSemantic } from './semantic';
import { isSemanticReady } from './embeddings';

// ============================================================
// Types
// ============================================================

export interface AgentContext {
  agent: string;
  userQuery: string;
  industries?: string[];
  regions?: string[];
  intent_types?: string[];
  tags?: string[];
  topK?: number;
  maxTokens?: number;
}

export interface KnowledgeContextResult {
  /** Formatted prompt section ready to inject into LLM system prompt */
  promptSection: string;
  /** Raw retrieved documents */
  documents: RetrievedDocument[];
  /** Whether retrieval succeeded (false = graceful degradation) */
  retrieved: boolean;
  /** Stats for logging/debugging */
  stats: {
    retrieved_count: number;
    total_tokens: number;
    retrieval_duration_ms: number;
    knowledge_base_size: number;
  };
}

// ============================================================
// Constants
// ============================================================

const KNOWLEDGE_HEADER = `
============================================================
RETRIEVED KNOWLEDGE BASE (use as authoritative context)
============================================================
`.trim();

const KNOWLEDGE_FOOTER = `
============================================================
END OF RETRIEVED KNOWLEDGE
============================================================
`.trim();

// ============================================================
// Main Integration Functions
// ============================================================

/**
 * Retrieve knowledge context for a specific agent invocation.
 *
 * This is the primary function agents should call before invoking
 * the LLM. The returned `promptSection` should be injected into
 * the agent's system prompt.
 *
 * If the knowledge base is empty or retrieval fails, returns an
 * empty promptSection (graceful degradation).
 */
export function retrieveContextForAgent(context: AgentContext): KnowledgeContextResult {
  const startTime = Date.now();

  let stats;
  try {
    stats = getKnowledgeStats();
  } catch {
    stats = { totalDocuments: 0, byCategory: {}, totalTokens: 0, totalWords: 0, indexedAt: null };
  }

  if (stats.totalDocuments === 0) {
    return {
      promptSection: '',
      documents: [],
      retrieved: false,
      stats: {
        retrieved_count: 0,
        total_tokens: 0,
        retrieval_duration_ms: Date.now() - startTime,
        knowledge_base_size: 0,
      },
    };
  }

  let documents: RetrievedDocument[] = [];
  try {
    const query: RetrievalQuery = {
      query: context.userQuery,
      agent: context.agent,
      industries: context.industries,
      regions: context.regions,
      intent_types: context.intent_types,
      tags: context.tags,
      topK: context.topK ?? 4,
      maxTokens: context.maxTokens ?? 3000,
      minScore: 0.03,
    };
    documents = retrieveKnowledge(query);
  } catch (err) {
    console.warn(`[knowledge] Retrieval failed for agent ${context.agent}:`, err);
  }

  const promptSection = documents.length > 0
    ? formatPromptSection(documents, context.agent)
    : '';

  return {
    promptSection,
    documents,
    retrieved: documents.length > 0,
    stats: {
      retrieved_count: documents.length,
      total_tokens: documents.reduce((sum, d) => sum + d.includedTokens, 0),
      retrieval_duration_ms: Date.now() - startTime,
      knowledge_base_size: stats.totalDocuments,
    },
  };
}

/**
 * Augment an existing system prompt with retrieved knowledge.
 *
 * Inserts the knowledge section after the agent's role definition
 * but before the task description. The agent's original prompt
 * is preserved; knowledge is additive.
 */
export function augmentSystemPrompt(
  originalPrompt: string,
  context: AgentContext
): { prompt: string; knowledgeUsed: boolean; stats: KnowledgeContextResult['stats'] } {
  const result = retrieveContextForAgent(context);

  if (!result.retrieved || !result.promptSection) {
    return {
      prompt: originalPrompt,
      knowledgeUsed: false,
      stats: result.stats,
    };
  }

  // Insert knowledge section after the first major section break
  // (typically after the agent's identity / role definition).
  // Look for double newline followed by a section header (## or ---).
  const insertionPoint = findInsertionPoint(originalPrompt);
  const augmentedPrompt =
    originalPrompt.slice(0, insertionPoint) +
    '\n\n' + result.promptSection + '\n\n' +
    originalPrompt.slice(insertionPoint);

  return {
    prompt: augmentedPrompt,
    knowledgeUsed: true,
    stats: result.stats,
  };
}

/**
 * Pre-compute knowledge context for an entire pipeline run.
 * Atlas uses this to:
 *   1. Pull relevant knowledge ONCE (cached for downstream agents)
 *   2. Pass relevant slices to each downstream agent
 *
 * This avoids each agent re-querying the knowledge base, which
 * would be 8× slower.
 */
export function getKnowledgeContextForPipeline(
  userQuery: string,
  context: {
    industries?: string[];
    regions?: string[];
    intent_types?: string[];
    tags?: string[];
    topK?: number;
    maxTokens?: number;
  } = {}
): {
  /** Per-agent prompt sections */
  perAgent: { [agent: string]: string };
  /** All retrieved documents (for reference) */
  documents: RetrievedDocument[];
  /** Whether retrieval succeeded */
  retrieved: boolean;
  /** Stats */
  stats: KnowledgeContextResult['stats'];
} {
  const startTime = Date.now();

  let stats;
  try {
    stats = getKnowledgeStats();
  } catch {
    stats = { totalDocuments: 0, byCategory: {}, totalTokens: 0, totalWords: 0, indexedAt: null };
  }

  if (stats.totalDocuments === 0) {
    return {
      perAgent: {},
      documents: [],
      retrieved: false,
      stats: {
        retrieved_count: 0,
        total_tokens: 0,
        retrieval_duration_ms: Date.now() - startTime,
        knowledge_base_size: 0,
      },
    };
  }

  // Single retrieval — no agent filter, gets all relevant docs
  let documents: RetrievedDocument[] = [];
  try {
    documents = retrieveKnowledge({
      query: userQuery,
      industries: context.industries,
      regions: context.regions,
      intent_types: context.intent_types,
      tags: context.tags,
      topK: context.topK ?? 8,
      maxTokens: context.maxTokens ?? 6000,
      minScore: 0.03,
    });
  } catch (err) {
    console.warn('[knowledge] Pipeline retrieval failed:', err);
  }

  // Per-agent slices: filter the retrieved docs by which agents
  // they're tagged for. If a doc has no `agents` field, include it
  // for all agents.
  const agents = ['atlas', 'scout', 'forge', 'sage', 'judge', 'bard', 'flow', 'echo'];
  const perAgent: { [agent: string]: string } = {};
  for (const agent of agents) {
    const agentDocs = documents.filter((d) => {
      // If doc has no agents specified, include for all
      if (!d.document.agents || d.document.agents.length === 0) return true;
      return d.document.agents.includes(agent);
    });
    perAgent[agent] = agentDocs.length > 0 ? formatPromptSection(agentDocs, agent) : '';
  }

  return {
    perAgent,
    documents,
    retrieved: documents.length > 0,
    stats: {
      retrieved_count: documents.length,
      total_tokens: documents.reduce((sum, d) => sum + d.includedTokens, 0),
      retrieval_duration_ms: Date.now() - startTime,
      knowledge_base_size: stats.totalDocuments,
    },
  };
}

// ============================================================
// Helpers
// ============================================================

function formatPromptSection(docs: RetrievedDocument[], agent: string): string {
  const formatted = formatRetrievedKnowledge(docs, { includeMetadata: true, includeBody: true });
  const docCount = docs.length;
  return [
    KNOWLEDGE_HEADER,
    '',
    `The following ${docCount} knowledge document(s) were retrieved from the LeadReach`,
    `knowledge base as most relevant to the current task for the ${agent.toUpperCase()} agent.`,
    'Treat these as authoritative guidance — they encode institutional best practices,',
    'industry-specific patterns, regional norms, and proven playbooks.',
    '',
    'Apply this knowledge when generating your response. If a retrieved document',
    'contradicts your training, defer to the retrieved knowledge (it is more recent',
    'and more specific to the LeadReach platform).',
    '',
    formatted,
    '',
    KNOWLEDGE_FOOTER,
  ].join('\n');
}

/**
 * Find a good insertion point in the original prompt.
 * Strategy:
 *   1. Look for the first "## " section header after line 5
 *   2. If not found, look for the first "---" separator
 *   3. Fallback: insert at the midpoint
 */
function findInsertionPoint(prompt: string): number {
  const lines = prompt.split('\n');

  // Strategy 1: First "## " header after line 5
  for (let i = 5; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      return lines.slice(0, i).join('\n').length;
    }
  }

  // Strategy 2: First "---" separator after line 5
  for (let i = 5; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(0, i).join('\n').length;
    }
  }

  // Strategy 3: Midpoint
  return Math.floor(prompt.length / 3);
}

// ============================================================
// Convenience: Quick check if knowledge base is loaded
// ============================================================

export function isKnowledgeAvailable(): boolean {
  try {
    const stats = getKnowledgeStats();
    return stats.totalDocuments > 0;
  } catch {
    return false;
  }
}

export function getKnowledgeSummary(): string {
  try {
    const stats = getKnowledgeStats();
    return `Knowledge base: ${stats.totalDocuments} documents, ${(stats.totalWords / 1000).toFixed(1)}K words, ${(stats.totalTokens / 1000).toFixed(1)}K tokens across ${Object.keys(stats.byCategory).length} categories`;
  } catch {
    return 'Knowledge base: not available';
  }
}
