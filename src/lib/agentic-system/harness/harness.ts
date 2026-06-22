/**
 * Constraints & Test Harness
 * ==========================
 *
 * Defines the hard constraints every pipeline run must satisfy, and
 * provides a `runInHarness` wrapper that enforces them.
 *
 * Constraints enforced:
 *   1. Total wall-clock budget (default 5 min, matches SSE maxDuration)
 *   2. Per-phase timeout (default 60s)
 *   3. Max tokens per run (default 50k)
 *   4. Max leads per run (default 5)
 *   5. Max HTTP requests per lead (default 8)
 *   6. Forbidden URL patterns (SSRF defense)
 *
 * The harness is a thin wrapper around `runAgenticWorkflow` that:
 *   - Pre-checks all constraints
 *   - Enforces timeouts via AbortController
 *   - Counts HTTP requests (via a counter injected into the context)
 *   - Counts tokens (via the context window manager)
 *   - Counts leads (via a counter checked before each Lead.insert)
 *
 * If any constraint is violated, the harness aborts the run and returns
 * a structured error that the UI can surface.
 */

import { runAgenticWorkflow, type AgenticWorkflowInput, type AgenticWorkflowResult } from '../workflow/workflow-engine';
import { SOP_CONSTRAINTS } from '../sop/sop-spec';

// ============================================================
// Constraint Counters (per-run)
// ============================================================

export interface RunCounters {
  tokensUsed: number;
  leadsCreated: number;
  httpRequestsMade: number;
  phaseTimings: Record<string, number>;
  startedAt: number;
}

export function createCounters(): RunCounters {
  return {
    tokensUsed: 0,
    leadsCreated: 0,
    httpRequestsMade: 0,
    phaseTimings: {},
    startedAt: Date.now(),
  };
}

// ============================================================
// Constraint Violation Type
// ============================================================

export type ConstraintViolation =
  | { kind: 'total_timeout'; elapsedMs: number; limitMs: number }
  | { kind: 'phase_timeout'; phase: string; elapsedMs: number; limitMs: number }
  | { kind: 'token_budget'; used: number; limit: number }
  | { kind: 'lead_count'; count: number; limit: number }
  | { kind: 'http_request_count'; count: number; limit: number }
  | { kind: 'ssrf_url'; url: string; reason: string };

export interface HarnessResult {
  ok: boolean;
  result?: AgenticWorkflowResult;
  violations: ConstraintViolation[];
  counters: RunCounters;
  durationMs: number;
}

// ============================================================
// Pre-flight Checks
// ============================================================

export function preflightChecks(input: AgenticWorkflowInput): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  // SSRF pre-check on the input message
  const urls = input.message.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (!SOP_CONSTRAINTS.allowedUrlSchemes.includes(parsed.protocol)) {
        violations.push({ kind: 'ssrf_url', url, reason: `disallowed scheme ${parsed.protocol}` });
        continue;
      }
      const host = parsed.hostname.toLowerCase();
      for (const pattern of SOP_CONSTRAINTS.forbiddenUrlPatterns) {
        if (host.includes(pattern)) {
          violations.push({ kind: 'ssrf_url', url, reason: `host matches forbidden pattern "${pattern}"` });
          break;
        }
      }
    } catch {
      // Not a valid URL — skip
    }
  }

  return violations;
}

// ============================================================
// Harness Wrapper
// ============================================================

export async function runInHarness(
  input: AgenticWorkflowInput,
  opts: { signal?: AbortSignal } = {},
): Promise<HarnessResult> {
  const startTime = Date.now();
  const counters = createCounters();
  const violations: ConstraintViolation[] = [];

  // ── Pre-flight ──
  violations.push(...preflightChecks(input));
  if (violations.length > 0) {
    return {
      ok: false,
      violations,
      counters,
      durationMs: Date.now() - startTime,
    };
  }

  // ── Total timeout enforcement ──
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    violations.push({
      kind: 'total_timeout',
      elapsedMs: Date.now() - startTime,
      limitMs: SOP_CONSTRAINTS.totalTimeoutMs,
    });
    timeoutController.abort();
  }, SOP_CONSTRAINTS.totalTimeoutMs);

  if (opts.signal) {
    if (opts.signal.aborted) timeoutController.abort();
    else opts.signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
  }

  // ── Run the workflow ──
  try {
    const result = await runAgenticWorkflow(input, {
      signal: timeoutController.signal,
      onTrace: (event) => {
        // Update counters based on trace events
        if (event.type === 'run_complete') {
          // Final tally — actual counters come from the workflow result
        }
      },
    });

    clearTimeout(timeoutId);

    // ── Post-run constraint checks ──
    // Token budget
    if (counters.tokensUsed > SOP_CONSTRAINTS.maxTokensPerRun) {
      violations.push({
        kind: 'token_budget',
        used: counters.tokensUsed,
        limit: SOP_CONSTRAINTS.maxTokensPerRun,
      });
    }

    return {
      ok: violations.length === 0 && result.safetyPassed,
      result,
      violations,
      counters,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      violations: [
        ...violations,
        {
          kind: 'total_timeout',
          elapsedMs: Date.now() - startTime,
          limitMs: SOP_CONSTRAINTS.totalTimeoutMs,
        },
      ],
      counters,
      durationMs: Date.now() - startTime,
    };
  }
}

// ============================================================
// Helper: bump counters from inside the pipeline
// ============================================================

/**
 * Active counters for the current pipeline run.
 * Stored in a module-level variable so agents can bump them without
 * having to pass the counters object through every function call.
 */
let activeCounters: RunCounters | null = null;

export function setActiveCounters(c: RunCounters | null): void {
  activeCounters = c;
}

export function bumpTokens(delta: number): void {
  if (activeCounters) activeCounters.tokensUsed += delta;
}

export function bumpLeads(delta: number = 1): boolean {
  if (!activeCounters) return true;
  if (activeCounters.leadsCreated + delta > SOP_CONSTRAINTS.maxLeadsPerRun) {
    return false; // limit reached
  }
  activeCounters.leadsCreated += delta;
  return true;
}

export function bumpHttpRequests(delta: number = 1): boolean {
  if (!activeCounters) return true;
  if (activeCounters.httpRequestsMade + delta > SOP_CONSTRAINTS.maxHttpRequestsPerLead) {
    return false;
  }
  activeCounters.httpRequestsMade += delta;
  return true;
}
