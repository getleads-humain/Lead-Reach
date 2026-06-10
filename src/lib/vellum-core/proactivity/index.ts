/**
 * Proactivity Engine — Main Entry Point
 * ========================================
 * Unified exports for all proactivity engine modules.
 *
 * The Proactivity Engine provides three core capabilities:
 *   1. **Scheduling** — Cron-based triggers that fire agent actions
 *   2. **Heartbeat** — Periodic context review and proactive decision-making
 *   3. **Follow-ups** — Tracking and enforcing action items
 *   4. **Sequences** — Multi-step outreach campaigns
 *
 * Usage:
 *   import { scheduleManager, startHeartbeat, createFollowUp, createSequence } from '@/lib/vellum-core/proactivity';
 */

// ── Types ───────────────────────────────────────────────────────
export type {
  ScheduleMode,
  ScheduleConfig,
  HeartbeatConfig,
  HeartbeatResult,
  HeartbeatState,
  FollowUpStatus,
  FollowUp,
  SequenceStatus,
  SequenceStepStatus,
  SequenceStep,
  Sequence,
  SequenceEnrollment,
  RetryDecision,
  ProactiveMessage,
} from './types';

// ── Scheduler ───────────────────────────────────────────────────
export {
  ScheduleManager,
  scheduleManager,
  computeNextRunAt,
  matchesCron,
  decideRetry,
  applyRetryDecision,
} from './scheduler';

// ── Heartbeat ───────────────────────────────────────────────────
export {
  heartbeatManager,
  startHeartbeat,
  stopHeartbeat,
} from './heartbeat';

// ── Follow-ups ──────────────────────────────────────────────────
export {
  createFollowUp,
  listFollowUps,
  getFollowUp,
  resolveFollowUp,
  cancelFollowUp,
  checkOverdue,
  getOverdueFollowUps,
  getPendingFollowUps,
  getFollowUpStats,
  loadFollowUpsFromDB,
} from './followups';

// ── Sequences ───────────────────────────────────────────────────
export {
  createSequence,
  getSequence,
  listSequences,
  updateSequence,
  pauseSequence,
  resumeSequence,
  deleteSequence,
  enrollInSequence,
  advanceSequence,
  pauseEnrollment,
  resumeEnrollment,
  getSequenceEnrollments,
  getEnrollment,
  executeSequenceStep,
  processDueSteps,
  getSequenceStats,
} from './sequences';
