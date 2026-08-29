/**
 * Knowledge Base — Index
 * ======================
 * Combines the curated full-length documents for all 14 AI workforce
 * agents into a single map keyed by agent slug.
 *
 * Used by:
 *   - seedWorkforceDocuments() in engine.ts to populate the DB.
 *   - The Knowledge Base UI tab to display real documents.
 *
 * Each agent has 5 documents, one per category: SOP, Runbook,
 * Playbook, Reference, Training.
 */

import type { KnowledgeDocContent } from './types';

import { PROMETHEUS_KB, KRONOS_KB } from './executive';
import {
  MARKET_STRATEGIST_KB,
  CONTENT_ARCHITECT_KB,
  MEDIA_BUYER_KB,
  SALES_ENGINE_KB,
} from './growth';
import {
  CORE_ARCHITECT_KB,
  FEATURE_DEVELOPER_KB,
  QA_TESTER_KB,
  DEVOPS_AUTOMATOR_KB,
  CYBER_GUARDIAN_KB,
} from './technology';
import {
  CFO_LEDGER_KB,
  COMPLIANCE_LEGAL_KB,
  SYNTHETIC_HR_KB,
} from './operations';

export type { KnowledgeDocContent } from './types';

/**
 * Master map: agent slug → curated knowledge documents.
 *
 * Keys MUST match the slug in WorkforceAgentDefinition (definitions.ts).
 */
export const KNOWLEDGE_BASE: Record<string, KnowledgeDocContent[]> = {
  // Executive
  'prometheus-ceo': PROMETHEUS_KB,
  'kronos-orchestrator': KRONOS_KB,

  // Growth
  'market-strategist': MARKET_STRATEGIST_KB,
  'content-architect': CONTENT_ARCHITECT_KB,
  'media-buyer': MEDIA_BUYER_KB,
  'sales-engine': SALES_ENGINE_KB,

  // Technology
  'core-architect': CORE_ARCHITECT_KB,
  'feature-developer': FEATURE_DEVELOPER_KB,
  'qa-tester': QA_TESTER_KB,
  'devops-automator': DEVOPS_AUTOMATOR_KB,
  'cyber-guardian': CYBER_GUARDIAN_KB,

  // Operations
  'cfo-ledger': CFO_LEDGER_KB,
  'compliance-legal': COMPLIANCE_LEGAL_KB,
  'synthetic-hr': SYNTHETIC_HR_KB,
};

/**
 * Returns the curated documents for an agent, or an empty array if none.
 */
export function getKnowledgeDocsForAgent(slug: string): KnowledgeDocContent[] {
  return KNOWLEDGE_BASE[slug] ?? [];
}

/**
 * Returns the total document count across all agents.
 */
export function getTotalKnowledgeDocCount(): number {
  return Object.values(KNOWLEDGE_BASE).reduce(
    (sum, docs) => sum + docs.length,
    0
  );
}

// Re-export department-specific arrays for testing / inspection
export {
  PROMETHEUS_KB,
  KRONOS_KB,
  MARKET_STRATEGIST_KB,
  CONTENT_ARCHITECT_KB,
  MEDIA_BUYER_KB,
  SALES_ENGINE_KB,
  CORE_ARCHITECT_KB,
  FEATURE_DEVELOPER_KB,
  QA_TESTER_KB,
  DEVOPS_AUTOMATOR_KB,
  CYBER_GUARDIAN_KB,
  CFO_LEDGER_KB,
  COMPLIANCE_LEGAL_KB,
  SYNTHETIC_HR_KB,
};
