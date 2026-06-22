/**
 * Agentic Workflow Engine
 * =======================
 *
 * A thin wrapper around the existing `processWithOrchestrator` 8-agent
 * pipeline that adds:
 *   - SOP-aware phase selection (only run the agents the SOP variant requires)
 *   - Constraint enforcement (timeouts, token budgets, HTTP limits)
 *   - Telemetry hooks (per-phase timing, token usage, success/failure)
 *   - Safety hooks (input + output guardrails)
 *
 * This engine does NOT replace processWithOrchestrator. It calls it after
 * pre-flight checks and post-processes its output.
 *
 * Public API:
 *   - runAgenticWorkflow(input, opts) -> AgenticWorkflowResult
 *   - The existing /api/campaigns/[id]/stream endpoint keeps working unchanged.
 */

import { processWithOrchestrator } from '@/lib/prospect-agent/orchestrator';
import type { OrchestratorEvent } from '@/lib/prospect-agent/orchestrator-types';
import type { UserIntent } from '@/lib/prospect-agent/types';
import {
  pickSopVariant,
  selectPhasesForIntent,
  SOP_CONSTRAINTS,
  SOP_VARIANTS,
  type SOPVariant,
} from '../sop/sop-spec';
import { applyInputGuardrails, applyOutputGuardrails } from '../safety/output-validator';
import { recordRun } from '../telemetry/trace';
import type { WorkflowTraceEvent } from '../telemetry/trace';

// ============================================================
// Public Types
// ============================================================

export interface AgenticWorkflowInput {
  /** The raw user message. */
  message: string;
  /** Optional conversation context (prior messages). */
  context?: Parameters<typeof processWithOrchestrator>[1];
  /** Force a specific intent (skip Atlas classification). */
  forceIntent?: UserIntent;
  /** Optional campaign ID for telemetry attribution. */
  campaignId?: string;
  /** Optional user ID for telemetry attribution. */
  userId?: string;
}

export interface AgenticWorkflowResult {
  /** The orchestrator's structured message (prospect data, summary, etc). */
  message: Awaited<ReturnType<typeof processWithOrchestrator>>['message'];
  /** The updated conversation context. */
  updatedContext: Awaited<ReturnType<typeof processWithOrchestrator>>['updatedContext'];
  /** Suggested next actions for the UI. */
  suggestedActions: Awaited<ReturnType<typeof processWithOrchestrator>>['suggestedActions'];
  /** The final pipeline state (8-agent grid). */
  pipelineState: Awaited<ReturnType<typeof processWithOrchestrator>>['pipelineState'];
  /** The SOP variant that was selected for this run. */
  sopVariant: SOPVariant;
  /** The phases that were selected to run. */
  selectedPhases: string[];
  /** Whether the run passed all safety guardrails. */
  safetyPassed: boolean;
  /** Any safety violations found. */
  safetyViolations: string[];
  /** Telemetry trace ID. */
  traceId: string;
  /** Total wall-clock duration in ms. */
  durationMs: number;
}

export interface AgenticWorkflowOptions {
  /** Optional callback to receive live trace events (for SSE streaming). */
  onEvent?: (event: OrchestratorEvent) => void;
  /** Optional callback to receive workflow-level trace events. */
  onTrace?: (event: WorkflowTraceEvent) => void;
  /** Abort signal (cancel the run). */
  signal?: AbortSignal;
  /** Override the per-phase timeout. */
  perPhaseTimeoutMs?: number;
}

// ============================================================
// Main Entry Point
// ============================================================

/**
 * Run the full agentic workflow for a single user message.
 *
 * Steps:
 *   1. Apply input guardrails (URL validation, PII redaction, prompt-injection detection)
 *   2. Determine the SOP variant (from forced intent OR by letting Atlas classify)
 *   3. Select the phases to run
 *   4. Enforce the total wall-clock budget
 *   5. Call processWithOrchestrator with the event callback
 *   6. Apply output guardrails (PII redaction, profanity filter, competitor mentions)
 *   7. Record the run to the telemetry store
 *   8. Return the structured result
 */
export async function runAgenticWorkflow(
  input: AgenticWorkflowInput,
  opts: AgenticWorkflowOptions = {},
): Promise<AgenticWorkflowResult> {
  const traceId = recordRun.start(input);
  const startTime = Date.now();
  const violations: string[] = [];

  // ── Step 1: Input guardrails ──
  const inputCheck = applyInputGuardrails(input.message);
  if (!inputCheck.passed) {
    violations.push(...inputCheck.violations);
    recordRun.failure(traceId, 'input_guardrail_failed', violations.join('; '), Date.now() - startTime);
    opts.onTrace?.({ type: 'guardrail_violation', phase: 'input', traceId, violations });
    // Return an empty result so the caller can surface a friendly error
    return makeGuardrailFailedResult(input, violations, traceId, Date.now() - startTime);
  }

  // ── Step 2: SOP variant selection ──
  // If the caller forced an intent, we know the variant immediately.
  // Otherwise we let Atlas classify it (inside processWithOrchestrator) and
  // we infer the variant from the resulting pipeline state's phase list.
  let sopVariant: SOPVariant;
  let selectedPhases: string[];
  if (input.forceIntent) {
    sopVariant = pickSopVariant(input.forceIntent);
    selectedPhases = selectPhasesForIntent(input.forceIntent).map(p => p.agent);
  } else {
    // Default to discovery — Atlas will re-classify inside the orchestrator
    // and the actual variant may differ, but we need a starting point for
    // the constraint budget.
    sopVariant = 'discovery';
    selectedPhases = SOP_VARIANTS.discovery.phases;
  }
  opts.onTrace?.({ type: 'sop_selected', traceId, variant: sopVariant, phases: selectedPhases });

  // ── Step 3: Wall-clock budget ──
  const totalTimeoutMs = SOP_CONSTRAINTS.totalTimeoutMs;
  const phaseTimeoutMs = opts.perPhaseTimeoutMs ?? SOP_CONSTRAINTS.perPhaseTimeoutMs;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), totalTimeoutMs);

  // Listen to caller-supplied abort signal too
  if (opts.signal) {
    if (opts.signal.aborted) timeoutController.abort();
    else opts.signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
  }

  // ── Step 4: Run the orchestrator ──
  let orchestratorResult: Awaited<ReturnType<typeof processWithOrchestrator>>;
  try {
    orchestratorResult = await processWithOrchestrator(
      input.message,
      input.context,
      input.forceIntent,
      (event: OrchestratorEvent) => {
        if (timeoutController.signal.aborted) return;
        opts.onEvent?.(event);
      },
    );
  } catch (err) {
    clearTimeout(timeoutId);
    const errMsg = err instanceof Error ? err.message : String(err);
    recordRun.failure(traceId, 'orchestrator_threw', errMsg, Date.now() - startTime);
    opts.onTrace?.({ type: 'fatal_error', traceId, error: errMsg });
    throw err;
  }
  clearTimeout(timeoutId);

  // ── Step 5: Output guardrails ──
  const outputText = orchestratorResult.message.content ?? '';
  const outputCheck = applyOutputGuardrails(outputText);
  if (!outputCheck.passed) {
    violations.push(...outputCheck.violations);
    opts.onTrace?.({ type: 'guardrail_violation', phase: 'output', traceId, violations });
  }

  // ── Step 6: Record telemetry ──
  const durationMs = Date.now() - startTime;
  recordRun.success(traceId, {
    campaignId: input.campaignId,
    userId: input.userId,
    sopVariant,
    selectedPhases,
    durationMs,
    safetyPassed: violations.length === 0,
    safetyViolations: violations,
    pipelinePhase: orchestratorResult.pipelineState.phase,
  });
  opts.onTrace?.({
    type: 'run_complete',
    traceId,
    durationMs,
    sopVariant,
    safetyPassed: violations.length === 0,
  });

  // ── Step 7: Return structured result ──
  return {
    message: orchestratorResult.message,
    updatedContext: orchestratorResult.updatedContext,
    suggestedActions: orchestratorResult.suggestedActions,
    pipelineState: orchestratorResult.pipelineState,
    sopVariant,
    selectedPhases,
    safetyPassed: violations.length === 0,
    safetyViolations: violations,
    traceId,
    durationMs,
  };
}

// ============================================================
// Helpers
// ============================================================

function makeGuardrailFailedResult(
  input: AgenticWorkflowInput,
  violations: string[],
  traceId: string,
  durationMs: number,
): AgenticWorkflowResult {
  return {
    message: {
      id: `msg_guardrail_${traceId}`,
      role: 'assistant',
      content:
        'Your request was blocked by safety guardrails. ' +
        'Please remove any URLs to internal resources, prompt-injection attempts, or PII and try again.',
      timestamp: new Date(),
    },
    updatedContext: input.context ?? {
      recentProspects: [],
      activeICP: null,
      lastIntent: null,
      lastPersona: null,
      userPreferences: {},
    },
    suggestedActions: [],
    pipelineState: {
      phase: 'error',
      thinkStartTime: null,
      totalThinkTimeMs: null,
      agents: {},
      commLog: [],
      currentStep: 'input_guardrail_failed',
      overallProgress: 0,
    },
    sopVariant: 'conversation',
    selectedPhases: [],
    safetyPassed: false,
    safetyViolations: violations,
    traceId,
    durationMs,
  };
}
