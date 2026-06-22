/**
 * Agentic Eval Datasets
 * =====================
 *
 * Curated test fixtures for evaluating the agentic pipeline.
 * Each fixture has:
 *   - A user query (the input)
 *   - The expected intent (what Atlas should classify)
 *   - The expected SOP variant (which pipeline should run)
 *   - The expected agents (which agents should execute)
 *   - Acceptance criteria (what the output must contain / not contain)
 *
 * Used by the eval runner (eval-runner.ts) and the CI workflow
 * (`.github/workflows/agentic-evals.yml`).
 *
 * Datasets are intentionally SMALL (10-20 fixtures per category) so the
 * full eval suite runs in under 5 minutes in CI.
 */

import type { UserIntent } from '@/lib/prospect-agent/types';
import type { SOPVariant } from '../sop/sop-spec';

// ============================================================
// Types
// ============================================================

export interface EvalFixture {
  id: string;
  category: 'intent_classification' | 'sop_selection' | 'output_quality' | 'safety';
  description: string;
  input: string;
  expected: {
    intent?: UserIntent;
    sopVariant?: SOPVariant;
    agents?: string[];
    outputContains?: string[];
    outputNotContains?: string[];
    maxDurationMs?: number;
  };
}

// ============================================================
// Intent Classification Fixtures
// ============================================================

export const INTENT_FIXTURES: EvalFixture[] = [
  {
    id: 'int_001',
    category: 'intent_classification',
    description: 'Company research query',
    input: 'Find B2B SaaS companies in San Francisco',
    expected: { intent: 'research_company', sopVariant: 'discovery' },
  },
  {
    id: 'int_002',
    category: 'intent_classification',
    description: 'URL research query',
    input: 'Research the company at https://stripe.com',
    expected: { intent: 'research_url', sopVariant: 'discovery' },
  },
  {
    id: 'int_003',
    category: 'intent_classification',
    description: 'Person research query',
    input: 'Find the CEO of OpenAI and their contact info',
    expected: { intent: 'research_person', sopVariant: 'enrichment' },
  },
  {
    id: 'int_004',
    category: 'intent_classification',
    description: 'Market analysis query',
    input: 'Analyze the competitive landscape of the CRM market',
    expected: { intent: 'analyze_market', sopVariant: 'analysis' },
  },
  {
    id: 'int_005',
    category: 'intent_classification',
    description: 'Outreach composition query',
    input: 'Compose a cold email to the VP of Engineering at Datadog',
    expected: { intent: 'compose_outreach', sopVariant: 'outreach' },
  },
  {
    id: 'int_006',
    category: 'intent_classification',
    description: 'Clarification query (fast path)',
    input: 'What can you do?',
    expected: { intent: 'clarify', sopVariant: 'conversation' },
  },
  {
    id: 'int_007',
    category: 'intent_classification',
    description: 'Lead scoring query',
    input: 'Score this lead: Stripe, fintech, 5000+ employees',
    expected: { intent: 'score_lead', sopVariant: 'qualification' },
  },
  {
    id: 'int_008',
    category: 'intent_classification',
    description: 'Refine search query',
    input: 'Show me more results like Stripe but smaller',
    expected: { intent: 'refine_search', sopVariant: 'discovery' },
  },
];

// ============================================================
// SOP Selection Fixtures
// ============================================================

export const SOP_FIXTURES: EvalFixture[] = [
  {
    id: 'sop_001',
    category: 'sop_selection',
    description: 'Discovery SOP runs Scout+Forge',
    input: 'Find SaaS companies in NYC',
    expected: {
      sopVariant: 'discovery',
      agents: ['atlas', 'scout', 'forge', 'judge', 'flow', 'echo'],
    },
  },
  {
    id: 'sop_002',
    category: 'sop_selection',
    description: 'Conversation SOP skips Scout/Forge',
    input: 'Hello, how are you?',
    expected: {
      sopVariant: 'conversation',
      agents: ['atlas', 'echo'],
    },
  },
  {
    id: 'sop_003',
    category: 'sop_selection',
    description: 'Qualification SOP runs Judge+Flow',
    input: 'Score this lead against my ICP',
    expected: {
      sopVariant: 'qualification',
      agents: ['atlas', 'judge', 'flow', 'echo'],
    },
  },
];

// ============================================================
// Output Quality Fixtures
// ============================================================

export const OUTPUT_FIXTURES: EvalFixture[] = [
  {
    id: 'out_001',
    category: 'output_quality',
    description: 'Output should mention the company name',
    input: 'Research Stripe',
    expected: {
      outputContains: ['Stripe'],
      outputNotContains: ['I cannot help', 'I don\'t know'],
      maxDurationMs: 120_000,
    },
  },
  {
    id: 'out_002',
    category: 'output_quality',
    description: 'Outreach should reference the company',
    input: 'Compose a cold email to the CEO of Acme Corp',
    expected: {
      outputContains: ['Acme'],
      maxDurationMs: 30_000,
    },
  },
];

// ============================================================
// All Fixtures Combined
// ============================================================

export const ALL_FIXTURES: EvalFixture[] = [
  ...INTENT_FIXTURES,
  ...SOP_FIXTURES,
  ...OUTPUT_FIXTURES,
];

export function getFixturesByCategory(category: EvalFixture['category']): EvalFixture[] {
  return ALL_FIXTURES.filter(f => f.category === category);
}
