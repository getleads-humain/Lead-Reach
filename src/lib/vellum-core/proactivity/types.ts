/**
 * Proactivity Engine — Type Definitions
 * =======================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The Proactivity Engine enables agents to act autonomously through:
 *   - Scheduled jobs (cron/rrule) that trigger agent actions
 *   - Heartbeat monitoring that detects when proactive intervention is needed
 *   - Follow-up tracking that ensures no lead falls through the cracks
 *   - Multi-step sequences that orchestrate outreach campaigns
 *
 * All types are designed to integrate with the existing agent infrastructure
 * at @/lib/agent-infrastructure/ and the LLM layer at @/lib/llm.
 */

// ── Schedule Types ─────────────────────────────────────────────

/**
 * Schedule mode determines what happens when a schedule fires.
 * - notify:  Send a notification/alert to the user
 * - script:  Execute a predefined script/function
 * - wake:    Wake the agent to analyze context and decide action
 * - execute: Run an LLM prompt and act on the result
 */
export type ScheduleMode = 'notify' | 'script' | 'wake' | 'execute';

/**
 * Configuration for a proactive schedule.
 * Supports cron expressions and RRULE recurrence patterns.
 */
export interface ScheduleConfig {
  /** Unique identifier for this schedule */
  id: string;
  /** Human-readable name */
  name: string;
  /** How the schedule fires: notify, script, wake, execute */
  mode: ScheduleMode;
  /** Whether this schedule is currently active */
  enabled: boolean;

  // ── Recurrence ──────────────────────────────────────────────
  /** Cron expression (e.g., "0 9 * * 1-5" for weekdays at 9am) */
  cron?: string;
  /** RRULE recurrence rule (RFC 5545) as alternative to cron */
  rrule?: string;
  /** IANA timezone (e.g., "America/New_York") */
  timezone: string;

  // ── Active Hours ────────────────────────────────────────────
  /** Start of active hours (0-23), default 8 */
  activeHoursStart?: number;
  /** End of active hours (0-23), default 22 */
  activeHoursEnd?: number;

  // ── Limits ──────────────────────────────────────────────────
  /** Max consecutive runs without a break, default 3 */
  maxConsecutiveRuns: number;
  /** Max runs per calendar day, default 2 */
  maxDailyRuns: number;

  // ── Retry ───────────────────────────────────────────────────
  /** Max retries on failure, default 3 */
  maxRetries: number;
  /** Base retry backoff in ms, default 5000 */
  retryBackoffMs: number;

  // ── Content ─────────────────────────────────────────────────
  /** LLM prompt for execute/wake modes */
  prompt?: string;
  /** Script/function name for script mode */
  script?: string;

  // ── Context ─────────────────────────────────────────────────
  /** Scope ID (e.g., campaign ID, user ID) */
  scopeId: string;
  /** Optional conversation ID to continue */
  conversationId?: string;

  // ── Runtime State ───────────────────────────────────────────
  /** Last time this schedule ran (epoch ms) */
  lastRunAt?: number;
  /** Computed next run time (epoch ms) */
  nextRunAt?: number;
  /** Total number of completed runs */
  runCount: number;
}

// ── Heartbeat Types ────────────────────────────────────────────

/**
 * Configuration for the proactive heartbeat.
 * The heartbeat periodically checks the system state and decides
 * whether the agent should take proactive action.
 */
export interface HeartbeatConfig {
  /** Whether the heartbeat is active */
  enabled: boolean;
  /** Interval between heartbeats in ms, default 3600000 (1 hour) */
  intervalMs: number;
  /** Optional cron expression overriding intervalMs */
  cronExpression?: string;
  /** IANA timezone for cron evaluation */
  timezone: string;
  /** Start of active hours (0-23), default 8 */
  activeHoursStart: number;
  /** End of active hours (0-23), default 22 */
  activeHoursEnd: number;
  /** Max consecutive runs without a break, default 3 */
  maxConsecutiveRuns: number;
  /** Max runs per calendar day, default 2 */
  maxDailyRuns: number;
  /** The "inner monologue" prompt that guides the heartbeat's decision-making */
  disposition: string;
}

/**
 * Result of a heartbeat tick — what the agent decided to do.
 */
export interface HeartbeatResult {
  /** Whether a proactive action was taken */
  acted: boolean;
  /** Human-readable description of what was done */
  action?: string;
  /** The LLM reasoning behind the decision */
  reasoning?: string;
  /** Timestamp of this heartbeat tick */
  timestamp: number;
}

/**
 * Internal state tracked by the heartbeat system.
 */
export interface HeartbeatState {
  /** Number of consecutive runs (reset on skip) */
  consecutiveRuns: number;
  /** Number of runs today */
  dailyRuns: number;
  /** Date of the last daily reset (ISO date string) */
  lastDailyResetDate: string;
  /** Last heartbeat timestamp */
  lastHeartbeatAt: number;
}

// ── Follow-Up Types ────────────────────────────────────────────

/**
 * Status of a follow-up item.
 */
export type FollowUpStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

/**
 * A follow-up item represents a pending action or reminder
 * that an agent or user needs to address.
 */
export interface FollowUp {
  /** Unique identifier */
  id: string;
  /** Short title */
  title: string;
  /** Detailed description */
  description?: string;
  /** Due date (epoch ms) */
  dueAt?: number;
  /** Channel to deliver the follow-up (e.g., "email", "slack") */
  channelId?: string;
  /** Conversation this follow-up belongs to */
  conversationId?: string;
  /** Scope this follow-up is scoped to */
  scopeId: string;
  /** Current status */
  status: FollowUpStatus;
  /** Creation timestamp */
  createdAt: number;
  /** Completion timestamp */
  completedAt?: number;
}

// ── Sequence Types ─────────────────────────────────────────────

/**
 * Status of a multi-step sequence.
 */
export type SequenceStatus = 'active' | 'paused' | 'completed';

/**
 * Status of an individual sequence step.
 */
export type SequenceStepStatus = 'pending' | 'executing' | 'completed' | 'failed';

/**
 * A single step within a multi-step sequence.
 */
export interface SequenceStep {
  /** Unique identifier for this step */
  id: string;
  /** Delay before this step executes (ms from previous step) */
  delayMs: number;
  /** LLM prompt or instruction for this step */
  prompt: string;
  /** Channel to deliver through (e.g., "email", "linkedin") */
  channelId?: string;
  /** Current status of this step */
  status: SequenceStepStatus;
}

/**
 * A multi-step outreach or engagement sequence.
 */
export interface Sequence {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Ordered list of steps */
  steps: SequenceStep[];
  /** Number of currently enrolled leads/contacts */
  enrolledCount: number;
  /** Scope this sequence belongs to */
  scopeId: string;
  /** Current status */
  status: SequenceStatus;
}

/**
 * An enrollment of a scope (lead/contact) into a sequence.
 * Tracks which step the enrollment is currently on.
 */
export interface SequenceEnrollment {
  /** Unique identifier */
  id: string;
  /** The sequence this enrollment belongs to */
  sequenceId: string;
  /** The scope (lead/contact) enrolled */
  scopeId: string;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** When this enrollment was created */
  enrolledAt: number;
  /** When the current step started */
  currentStepStartedAt: number;
  /** Status of the enrollment */
  status: 'active' | 'completed' | 'paused' | 'failed';
}

// ── Retry Decision Types ───────────────────────────────────────

/**
 * Decision about whether to retry a failed schedule run.
 */
export interface RetryDecision {
  /** Whether to retry */
  shouldRetry: boolean;
  /** Delay before the next retry (ms) */
  delayMs: number;
  /** Reason for the decision */
  reason: string;
}

// ── Proactive Message Types ────────────────────────────────────

/**
 * A proactive message generated by the engine.
 */
export interface ProactiveMessage {
  /** Unique identifier */
  id: string;
  /** Source of the message (schedule ID, heartbeat, follow-up, etc.) */
  source: string;
  /** The agent that produced this message */
  agentName: string;
  /** Scope (campaign, lead, etc.) */
  scopeId: string;
  /** The message content */
  content: string;
  /** Channel for delivery */
  channel?: string;
  /** Priority (1-10, 10 highest) */
  priority: number;
  /** Timestamp */
  createdAt: number;
}
