/**
 * Eval Metrics
 * ============
 *
 * Computes metrics for eval results:
 *   - Intent accuracy: did Atlas classify the intent correctly?
 *   - SOP selection accuracy: did the right SOP variant run?
 *   - Agent set precision/recall: did the right agents execute?
 *   - Output containment: did the output contain the expected strings?
 *   - Latency: was the run within the time budget?
 *   - Safety: did the run pass all guardrails?
 */

import type { EvalFixture } from './eval-datasets';
import type { AgenticWorkflowResult } from '../workflow/workflow-engine';

// ============================================================
// Types
// ============================================================

export interface FixtureEvalResult {
  fixtureId: string;
  passed: boolean;
  metrics: {
    intentCorrect?: boolean;
    sopVariantCorrect?: boolean;
    agentSetCorrect?: boolean;
    outputContainsAll?: boolean;
    outputNotContainsAny?: boolean;
    withinLatencyBudget?: boolean;
    safetyPassed?: boolean;
  };
  reasons: string[];
  durationMs: number;
}

export interface EvalSuiteReport {
  totalFixtures: number;
  passed: number;
  failed: number;
  passRate: number;
  byCategory: Record<string, { total: number; passed: number; passRate: number }>;
  results: FixtureEvalResult[];
  runAt: string;
  totalDurationMs: number;
}

// ============================================================
// Per-Fixture Evaluation
// ============================================================

export function evaluateFixture(
  fixture: EvalFixture,
  result: AgenticWorkflowResult,
): FixtureEvalResult {
  const metrics: FixtureEvalResult['metrics'] = {};
  const reasons: string[] = [];

  // Intent check
  if (fixture.expected.intent) {
    // We don't have direct access to the classified intent in the result,
    // but the SOP variant implies it. Check the variant instead.
    if (fixture.expected.sopVariant) {
      metrics.sopVariantCorrect = result.sopVariant === fixture.expected.sopVariant;
      if (!metrics.sopVariantCorrect) {
        reasons.push(`Expected SOP variant ${fixture.expected.sopVariant}, got ${result.sopVariant}`);
      }
    }
  }

  // SOP variant check
  if (fixture.expected.sopVariant) {
    metrics.sopVariantCorrect = result.sopVariant === fixture.expected.sopVariant;
    if (!metrics.sopVariantCorrect) {
      reasons.push(`SOP variant mismatch: expected ${fixture.expected.sopVariant}, got ${result.sopVariant}`);
    }
  }

  // Agent set check (subset — expected agents must all be present)
  if (fixture.expected.agents && fixture.expected.agents.length > 0) {
    const actualAgents = new Set(result.selectedPhases);
    const missing = fixture.expected.agents.filter(a => !actualAgents.has(a));
    metrics.agentSetCorrect = missing.length === 0;
    if (missing.length > 0) {
      reasons.push(`Missing agents: ${missing.join(', ')}`);
    }
  }

  // Output containment
  const outputText = result.message.content ?? '';
  if (fixture.expected.outputContains && fixture.expected.outputContains.length > 0) {
    metrics.outputContainsAll = fixture.expected.outputContains.every(s =>
      outputText.toLowerCase().includes(s.toLowerCase()),
    );
    if (!metrics.outputContainsAll) {
      const missing = fixture.expected.outputContains.filter(s =>
        !outputText.toLowerCase().includes(s.toLowerCase()),
      );
      reasons.push(`Output missing expected strings: ${missing.join(', ')}`);
    }
  }
  if (fixture.expected.outputNotContains && fixture.expected.outputNotContains.length > 0) {
    metrics.outputNotContainsAny = !fixture.expected.outputNotContains.some(s =>
      outputText.toLowerCase().includes(s.toLowerCase()),
    );
    if (!metrics.outputNotContainsAny) {
      const found = fixture.expected.outputNotContains.filter(s =>
        outputText.toLowerCase().includes(s.toLowerCase()),
      );
      reasons.push(`Output contains forbidden strings: ${found.join(', ')}`);
    }
  }

  // Latency check
  if (fixture.expected.maxDurationMs) {
    metrics.withinLatencyBudget = result.durationMs <= fixture.expected.maxDurationMs;
    if (!metrics.withinLatencyBudget) {
      reasons.push(`Latency ${result.durationMs}ms exceeded budget ${fixture.expected.maxDurationMs}ms`);
    }
  }

  // Safety check
  metrics.safetyPassed = result.safetyPassed;
  if (!result.safetyPassed) {
    reasons.push(`Safety violations: ${result.safetyViolations.join(', ')}`);
  }

  const passed = Object.values(metrics).every(v => v === true || v === undefined);
  return {
    fixtureId: fixture.id,
    passed,
    metrics,
    reasons,
    durationMs: result.durationMs,
  };
}

// ============================================================
// Suite Report Builder
// ============================================================

export function buildSuiteReport(results: FixtureEvalResult[]): EvalSuiteReport {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const byCategory: Record<string, { total: number; passed: number; passRate: number }> = {};

  for (const r of results) {
    // Infer category from fixture ID prefix
    let category = 'unknown';
    if (r.fixtureId.startsWith('int_')) category = 'intent_classification';
    else if (r.fixtureId.startsWith('sop_')) category = 'sop_selection';
    else if (r.fixtureId.startsWith('out_')) category = 'output_quality';
    else if (r.fixtureId.startsWith('safe_')) category = 'safety';

    if (!byCategory[category]) {
      byCategory[category] = { total: 0, passed: 0, passRate: 0 };
    }
    byCategory[category].total++;
    if (r.passed) byCategory[category].passed++;
  }
  for (const cat of Object.keys(byCategory)) {
    const c = byCategory[cat];
    c.passRate = c.total > 0 ? c.passed / c.total : 0;
  }

  return {
    totalFixtures: results.length,
    passed,
    failed,
    passRate: results.length > 0 ? passed / results.length : 0,
    byCategory,
    results,
    runAt: new Date().toISOString(),
    totalDurationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
  };
}
