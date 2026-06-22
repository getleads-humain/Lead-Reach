/**
 * Agentic Telemetry & Tracing
 * ===========================
 *
 * Records every pipeline run to the database (AgentLog table) and to an
 * in-process ring buffer for the admin UI's live view.
 *
 * Public API:
 *   - recordRun.start(input) -> traceId
 *   - recordRun.success(traceId, summary)
 *   - recordRun.failure(traceId, error, durationMs)
 *   - getRecentRuns(limit) -> RunSummary[]
 *   - getRunStats() -> aggregate stats
 *
 * The trace events are also forwarded to the workflow engine's onTrace
 * callback for live SSE streaming.
 */

import { db } from '@/lib/db';
import type { SOPVariant } from '../sop/sop-spec';

// ============================================================
// Types
// ============================================================

export interface RunSummary {
  traceId: string;
  startedAt: number;
  durationMs: number;
  sopVariant: SOPVariant | null;
  success: boolean;
  safetyPassed: boolean;
  safetyViolations: string[];
  campaignId?: string;
  userId?: string;
  errorMessage?: string;
  pipelinePhase?: string;
  selectedPhases: string[];
}

export interface WorkflowTraceEvent {
  type: 'sop_selected' | 'run_complete' | 'fatal_error' | 'guardrail_violation';
  traceId: string;
  [key: string]: unknown;
}

export interface RunStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDurationMs: number;
  successRate: number;
  safetyPassRate: number;
  byVariant: Record<string, { total: number; successRate: number }>;
}

// ============================================================
// In-Process Ring Buffer (for admin UI live view)
// ============================================================

const RING_BUFFER_SIZE = 100;
const ringBuffer: RunSummary[] = [];

function pushToRingBuffer(summary: RunSummary): void {
  if (ringBuffer.length >= RING_BUFFER_SIZE) {
    ringBuffer.shift();
  }
  ringBuffer.push(summary);
}

// ============================================================
// recordRun — fluent API for recording a run
// ============================================================

let runCounter = 0;

export const recordRun = {
  start(input: { message: string; campaignId?: string; userId?: string }): string {
    const traceId = `trace_${Date.now()}_${++runCounter}`;
    const summary: RunSummary = {
      traceId,
      startedAt: Date.now(),
      durationMs: 0,
      sopVariant: null,
      success: false,
      safetyPassed: true,
      safetyViolations: [],
      campaignId: input.campaignId,
      userId: input.userId,
      selectedPhases: [],
    };
    // Pre-populate the ring buffer so the admin UI can see in-flight runs
    pushToRingBuffer(summary);
    return traceId;
  },

  success(
    traceId: string,
    summary: {
      campaignId?: string;
      userId?: string;
      sopVariant: SOPVariant;
      selectedPhases: string[];
      durationMs: number;
      safetyPassed: boolean;
      safetyViolations: string[];
      pipelinePhase?: string;
    },
  ): void {
    const runSummary: RunSummary = {
      traceId,
      startedAt: Date.now() - summary.durationMs,
      durationMs: summary.durationMs,
      sopVariant: summary.sopVariant,
      success: true,
      safetyPassed: summary.safetyPassed,
      safetyViolations: summary.safetyViolations,
      campaignId: summary.campaignId,
      userId: summary.userId,
      pipelinePhase: summary.pipelinePhase,
      selectedPhases: summary.selectedPhases,
    };
    updateRingBuffer(runSummary);
    persistLog(runSummary).catch(() => {});
  },

  failure(
    traceId: string,
    errorType: string,
    errorMessage: string,
    durationMs: number,
  ): void {
    const runSummary: RunSummary = {
      traceId,
      startedAt: Date.now() - durationMs,
      durationMs,
      sopVariant: null,
      success: false,
      safetyPassed: false,
      safetyViolations: [],
      errorMessage: `${errorType}: ${errorMessage}`,
      selectedPhases: [],
    };
    updateRingBuffer(runSummary);
    persistLog(runSummary).catch(() => {});
  },
};

function updateRingBuffer(summary: RunSummary): void {
  const idx = ringBuffer.findIndex(r => r.traceId === summary.traceId);
  if (idx >= 0) {
    ringBuffer[idx] = summary;
  } else {
    pushToRingBuffer(summary);
  }
}

// ============================================================
// Persistence (AgentLog table)
// ============================================================

async function persistLog(summary: RunSummary): Promise<void> {
  try {
    await db.agentLog.create({
      data: {
        agentName: 'agentic-system',
        level: summary.success ? 'info' : 'error',
        category: 'execution',
        message: `Run ${summary.traceId} ${summary.success ? 'succeeded' : 'failed'} in ${summary.durationMs}ms`,
        metadata: JSON.stringify({
          traceId: summary.traceId,
          sopVariant: summary.sopVariant,
          selectedPhases: summary.selectedPhases,
          safetyPassed: summary.safetyPassed,
          safetyViolations: summary.safetyViolations,
          campaignId: summary.campaignId,
          userId: summary.userId,
          errorMessage: summary.errorMessage,
          pipelinePhase: summary.pipelinePhase,
          durationMs: summary.durationMs,
        }),
      },
    });
  } catch (err) {
    // Telemetry is best-effort — don't fail the pipeline
    console.warn('[Telemetry] Failed to persist log:', err);
  }
}

// ============================================================
// Query API (for admin UI)
// ============================================================

export function getRecentRuns(limit = 20): RunSummary[] {
  return [...ringBuffer].reverse().slice(0, limit);
}

export function getRunStats(): RunStats {
  const total = ringBuffer.length;
  const successful = ringBuffer.filter(r => r.success).length;
  const failed = total - successful;
  const avgDuration = total > 0
    ? Math.round(ringBuffer.reduce((sum, r) => sum + r.durationMs, 0) / total)
    : 0;
  const safetyPassed = ringBuffer.filter(r => r.safetyPassed).length;

  const byVariant: Record<string, { total: number; successRate: number }> = {};
  for (const run of ringBuffer) {
    const v = run.sopVariant ?? 'unknown';
    if (!byVariant[v]) byVariant[v] = { total: 0, successRate: 0 };
    byVariant[v].total++;
  }
  for (const v of Object.keys(byVariant)) {
    const runs = ringBuffer.filter(r => (r.sopVariant ?? 'unknown') === v);
    const succ = runs.filter(r => r.success).length;
    byVariant[v].successRate = runs.length > 0 ? succ / runs.length : 0;
  }

  return {
    totalRuns: total,
    successfulRuns: successful,
    failedRuns: failed,
    avgDurationMs: avgDuration,
    successRate: total > 0 ? successful / total : 0,
    safetyPassRate: total > 0 ? safetyPassed / total : 0,
    byVariant,
  };
}
