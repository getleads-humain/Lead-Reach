/**
 * Proactivity Engine — Job Scheduler
 * =====================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The ScheduleManager manages proactive schedules that trigger agent actions
 * on a recurring or one-time basis. It supports:
 *   - Cron expressions for precise scheduling
 *   - Active hours enforcement (only run during business hours)
 *   - Consecutive and daily run limits
 *   - Exponential backoff retry on failures
 *   - Integration with the LLM layer for execute/wake modes
 *   - Persistent schedule storage via Prisma/SQLite
 *
 * Integration points:
 *   - Uses `@/lib/llm` for execute/wake mode LLM calls
 *   - Uses `@/lib/agent-infrastructure/logs` for structured logging
 *   - Uses `@/lib/db` for persistent schedule state
 *   - Compatible with `@/lib/agent-infrastructure/cron` for coordination
 */

import { callLLM } from '@/lib/llm';
import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';
import {
  type ScheduleConfig,
  type ScheduleMode,
  type RetryDecision,
  type ProactiveMessage,
} from './types';

// ── Cron Expression Parser ─────────────────────────────────────

/**
 * Simplified cron expression parser.
 * Supports standard 5-field cron: minute hour day-of-month month day-of-week
 *
 * Supported patterns:
 *   - asterisk (any)
 *   - asterisk/N (every N)
 *   - N (specific value)
 *   - N-M (range)
 *   - N,M,Z (list)
 *   - N-M/S (range with step)
 */
function matchesCronField(field: string, value: number, min: number, max: number): boolean {
  if (field === '*') return true;

  // Handle step patterns (*/N or N-M/S)
  if (field.includes('/')) {
    const [rangeStr, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step <= 0) return false;

    let rangeStart = min;
    let rangeEnd = max;

    if (rangeStr !== '*') {
      if (rangeStr.includes('-')) {
        const [rs, re] = rangeStr.split('-').map(Number);
        rangeStart = rs;
        rangeEnd = re;
      } else {
        rangeStart = parseInt(rangeStr, 10);
        rangeEnd = max;
      }
    }

    if (value < rangeStart || value > rangeEnd) return false;
    return (value - rangeStart) % step === 0;
  }

  // Handle list patterns (N,M,Z)
  if (field.includes(',')) {
    return field.split(',').some(part => matchesCronField(part.trim(), value, min, max));
  }

  // Handle range patterns (N-M)
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number);
    return value >= start && value <= end;
  }

  // Single value
  const num = parseInt(field, 10);
  return !isNaN(num) && value === num;
}

/**
 * Check if a given date matches a cron expression.
 */
export function matchesCron(cronExpr: string, date: Date): boolean {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) {
    console.warn(`[Scheduler] Invalid cron expression (expected 5 fields): "${cronExpr}"`);
    return false;
  }

  const [minuteField, hourField, domField, monthField, dowField] = parts;

  return (
    matchesCronField(minuteField, date.getMinutes(), 0, 59) &&
    matchesCronField(hourField, date.getHours(), 0, 23) &&
    matchesCronField(domField, date.getDate(), 1, 31) &&
    matchesCronField(monthField, date.getMonth() + 1, 1, 12) &&
    matchesCronField(dowField, date.getDay(), 0, 6)
  );
}

// ── Next Run Computation ────────────────────────────────────────

/**
 * Compute the next run time for a schedule configuration.
 * Scans forward in time up to 366 days to find the next matching time.
 */
export function computeNextRunAt(config: ScheduleConfig): number {
  const now = Date.now();

  if (config.cron) {
    // Scan forward in 1-minute increments up to 366 days
    const maxScanMs = 366 * 24 * 60 * 60 * 1000;
    const stepMs = 60 * 1000; // 1 minute steps

    for (let t = now + stepMs; t < now + maxScanMs; t += stepMs) {
      const candidate = new Date(t);

      // Check active hours
      const hour = candidate.getHours();
      const startHour = config.activeHoursStart ?? 8;
      const endHour = config.activeHoursEnd ?? 22;
      if (hour < startHour || hour >= endHour) continue;

      // Check cron match
      if (matchesCron(config.cron, candidate)) {
        return t;
      }
    }

    // Fallback: 1 hour from now
    return now + 3600000;
  }

  // No cron/rrule specified — default to 1 hour from now
  return now + 3600000;
}

// ── Active Hours Check ──────────────────────────────────────────

/**
 * Check if the current time is within the schedule's active hours.
 * Uses the schedule's timezone setting.
 */
function isActiveHours(config: ScheduleConfig): boolean {
  const now = new Date();
  const hour = now.getHours(); // Simplified: uses local time; production would use timezone library
  const startHour = config.activeHoursStart ?? 8;
  const endHour = config.activeHoursEnd ?? 22;
  return hour >= startHour && hour < endHour;
}

// ── Run Limit Checks ────────────────────────────────────────────

/**
 * Check if the schedule has exceeded its run limits.
 * Uses in-memory tracking with daily reset logic.
 */
const dailyRunCounts = new Map<string, { date: string; count: number }>();
const consecutiveRunCounts = new Map<string, number>();

function checkRunLimits(config: ScheduleConfig): { allowed: boolean; reason?: string } {
  // Check consecutive runs
  const consecutive = consecutiveRunCounts.get(config.id) ?? 0;
  if (consecutive >= config.maxConsecutiveRuns) {
    return { allowed: false, reason: `Max consecutive runs reached (${config.maxConsecutiveRuns})` };
  }

  // Check daily runs
  const today = new Date().toISOString().slice(0, 10);
  const dailyRecord = dailyRunCounts.get(config.id);
  const dailyCount = dailyRecord?.date === today ? dailyRecord.count : 0;

  if (dailyCount >= config.maxDailyRuns) {
    return { allowed: false, reason: `Max daily runs reached (${config.maxDailyRuns})` };
  }

  return { allowed: true };
}

/**
 * Increment run counters after a successful run.
 */
function incrementRunCounts(scheduleId: string): void {
  // Increment consecutive
  const consecutive = consecutiveRunCounts.get(scheduleId) ?? 0;
  consecutiveRunCounts.set(scheduleId, consecutive + 1);

  // Increment daily
  const today = new Date().toISOString().slice(0, 10);
  const dailyRecord = dailyRunCounts.get(scheduleId);
  if (dailyRecord?.date === today) {
    dailyRecord.count++;
  } else {
    dailyRunCounts.set(scheduleId, { date: today, count: 1 });
  }
}

/**
 * Reset consecutive counter (called when a schedule is skipped).
 */
function resetConsecutiveCount(scheduleId: string): void {
  consecutiveRunCounts.delete(scheduleId);
}

// ── Retry Logic ─────────────────────────────────────────────────

/**
 * Decide whether to retry a failed schedule run.
 * Uses exponential backoff with the configured base delay.
 */
export function decideRetry(
  config: ScheduleConfig,
  attemptNumber: number,
  error?: Error
): RetryDecision {
  // Non-retryable conditions
  if (attemptNumber >= config.maxRetries) {
    return {
      shouldRetry: false,
      delayMs: 0,
      reason: `Max retries reached (${config.maxRetries})`,
    };
  }

  // Rate limit errors — use longer backoff
  const errorMsg = error?.message?.toLowerCase() ?? '';
  const isRateLimit = errorMsg.includes('429') || errorMsg.includes('rate limit');

  // Exponential backoff: base * 2^attempt with jitter
  const baseMs = config.retryBackoffMs;
  const exponentialDelay = baseMs * Math.pow(2, attemptNumber);
  const jitter = Math.random() * 1000;
  const delayMs = isRateLimit
    ? exponentialDelay * 3 + jitter // 3x backoff for rate limits
    : exponentialDelay + jitter;

  return {
    shouldRetry: true,
    delayMs: Math.min(delayMs, 300000), // Cap at 5 minutes
    reason: isRateLimit
      ? `Rate limited, backing off (attempt ${attemptNumber + 1}/${config.maxRetries})`
      : `Error occurred, retrying (attempt ${attemptNumber + 1}/${config.maxRetries})`,
  };
}

/**
 * Apply a retry decision — wait the specified delay and return whether to proceed.
 */
export async function applyRetryDecision(decision: RetryDecision): Promise<boolean> {
  if (!decision.shouldRetry) return false;
  await new Promise(resolve => setTimeout(resolve, decision.delayMs));
  return true;
}

// ── Schedule Execution ──────────────────────────────────────────

/**
 * Execute a schedule based on its mode.
 * Returns a proactive message if the schedule produced output.
 */
async function executeSchedule(config: ScheduleConfig): Promise<ProactiveMessage | null> {
  const timestamp = Date.now();

  switch (config.mode) {
    case 'notify': {
      return {
        id: `proactive-${config.id}-${timestamp}`,
        source: `schedule:${config.id}`,
        agentName: 'pipeline-manager',
        scopeId: config.scopeId,
        content: config.prompt ?? `Scheduled notification: ${config.name}`,
        priority: 5,
        createdAt: timestamp,
      };
    }

    case 'script': {
      if (!config.script) {
        console.warn(`[Scheduler] Schedule "${config.name}" has no script defined`);
        return null;
      }

      // Execute a named script/handler — look up from agent infrastructure
      try {
        // Script names map to agent task types for execution
        const task = await db.agentTask.create({
          data: {
            agentName: 'pipeline-manager' as AgentName,
            taskType: config.script,
            status: 'pending',
            priority: 5,
            input: JSON.stringify({
              source: 'proactivity-scheduler',
              scheduleId: config.id,
              scheduleName: config.name,
              scopeId: config.scopeId,
              conversationId: config.conversationId,
            }),
          },
        });

        return {
          id: `proactive-${config.id}-${timestamp}`,
          source: `schedule:${config.id}`,
          agentName: 'pipeline-manager',
          scopeId: config.scopeId,
          content: `Script "${config.script}" queued as task ${task.id}`,
          priority: 5,
          createdAt: timestamp,
        };
      } catch (error) {
        console.error(`[Scheduler] Failed to create task for script "${config.script}":`, error);
        return null;
      }
    }

    case 'wake': {
      // Wake the agent — it will analyze context and decide what to do
      const wakePrompt = config.prompt ?? 'Review current pipeline state and identify any actions needed.';

      const response = await callLLM({
        systemPrompt: `You are a proactive agent in the LeadReach AI platform. You have been woken by a scheduled trigger. Analyze the current context and decide if any action is needed.

Current scope: ${config.scopeId}
Schedule name: ${config.name}

${wakePrompt}`,
        userMessage: `Current time: ${new Date().toISOString()}. Review the pipeline and determine if any proactive action is warranted.`,
        temperature: 0.3,
        maxTokens: 1000,
        thinkingBudget: 'standard',
      });

      if (!response) {
        console.warn(`[Scheduler] Wake mode for "${config.name}" — LLM returned no response`);
        return null;
      }

      return {
        id: `proactive-${config.id}-${timestamp}`,
        source: `schedule:${config.id}`,
        agentName: 'pipeline-manager',
        scopeId: config.scopeId,
        content: response,
        priority: 6,
        createdAt: timestamp,
      };
    }

    case 'execute': {
      // Execute an LLM prompt and act on the result
      if (!config.prompt) {
        console.warn(`[Scheduler] Schedule "${config.name}" has no prompt defined for execute mode`);
        return null;
      }

      const response = await callLLM({
        systemPrompt: `You are a proactive agent in the LeadReach AI platform. Execute the following instruction and provide a clear, actionable response.

Scope: ${config.scopeId}
Schedule: ${config.name}`,
        userMessage: config.prompt,
        temperature: 0.3,
        maxTokens: 2000,
        thinkingBudget: 'deep',
      });

      if (!response) {
        console.warn(`[Scheduler] Execute mode for "${config.name}" — LLM returned no response`);
        return null;
      }

      return {
        id: `proactive-${config.id}-${timestamp}`,
        source: `schedule:${config.id}`,
        agentName: 'pipeline-manager',
        scopeId: config.scopeId,
        content: response,
        priority: 7,
        createdAt: timestamp,
      };
    }

    default:
      console.warn(`[Scheduler] Unknown schedule mode: ${(config as ScheduleConfig).mode}`);
      return null;
  }
}

// ── Schedule Manager ────────────────────────────────────────────

/**
 * Central schedule manager for the Proactivity Engine.
 * Manages the lifecycle of all proactive schedules, including:
 *   - Adding/removing schedules
 *   - Tick loop for checking due schedules
 *   - Execution with run limits and retry logic
 *   - Persistent storage of schedule state
 */
export class ScheduleManager {
  private schedules: Map<string, ScheduleConfig> = new Map();
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly TICK_INTERVAL_MS = 15000; // 15-second tick

  /**
   * Add a new schedule to the manager.
   * Computes the next run time if not already set.
   */
  addSchedule(config: ScheduleConfig): void {
    if (!config.nextRunAt) {
      config.nextRunAt = computeNextRunAt(config);
    }
    this.schedules.set(config.id, config);
    console.log(`[ScheduleManager] Added schedule "${config.name}" (id=${config.id}, nextRun=${new Date(config.nextRunAt).toISOString()})`);
  }

  /**
   * Remove a schedule by ID.
   */
  removeSchedule(id: string): void {
    this.schedules.delete(id);
    dailyRunCounts.delete(id);
    consecutiveRunCounts.delete(id);
    console.log(`[ScheduleManager] Removed schedule id=${id}`);
  }

  /**
   * Get a schedule by ID.
   */
  getSchedule(id: string): ScheduleConfig | undefined {
    return this.schedules.get(id);
  }

  /**
   * Get all registered schedules.
   */
  getAllSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Update an existing schedule's configuration.
   */
  updateSchedule(id: string, updates: Partial<ScheduleConfig>): void {
    const existing = this.schedules.get(id);
    if (!existing) {
      console.warn(`[ScheduleManager] Cannot update non-existent schedule id=${id}`);
      return;
    }

    const updated = { ...existing, ...updates };

    // Recompute next run if schedule expression changed
    if (updates.cron !== undefined || updates.rrule !== undefined) {
      updated.nextRunAt = computeNextRunAt(updated);
    }

    this.schedules.set(id, updated);
    console.log(`[ScheduleManager] Updated schedule "${updated.name}" (id=${id})`);
  }

  /**
   * Start the scheduler tick loop.
   * Runs every 15 seconds to check for due schedules.
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[ScheduleManager] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[ScheduleManager] Starting tick loop (interval=${this.TICK_INTERVAL_MS}ms)`);

    this.tickInterval = setInterval(() => {
      this.runScheduleDueWorkOnce().catch(err => {
        console.error('[ScheduleManager] Tick error:', err);
      });
    }, this.TICK_INTERVAL_MS);

    // Run first tick immediately
    this.runScheduleDueWorkOnce().catch(err => {
      console.error('[ScheduleManager] Initial tick error:', err);
    });
  }

  /**
   * Stop the scheduler tick loop.
   */
  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.isRunning = false;
    console.log('[ScheduleManager] Stopped tick loop');
  }

  /**
   * Check all schedules and run any that are due.
   * This is the main tick function called by the interval.
   *
   * Returns the number of schedules that were executed.
   */
  async runScheduleDueWorkOnce(): Promise<number> {
    const now = Date.now();
    let executed = 0;

    for (const [id, config] of this.schedules) {
      // Skip disabled schedules
      if (!config.enabled) continue;

      // Check if the schedule is due
      if (!config.nextRunAt || now < config.nextRunAt) continue;

      // Check active hours
      if (!isActiveHours(config)) {
        // Reschedule to the next active window
        config.nextRunAt = computeNextRunAt(config);
        resetConsecutiveCount(id);
        continue;
      }

      // Check run limits
      const limitCheck = checkRunLimits(config);
      if (!limitCheck.allowed) {
        // Skip this run and reschedule
        config.nextRunAt = computeNextRunAt(config);
        resetConsecutiveCount(id);
        console.log(`[ScheduleManager] Schedule "${config.name}" skipped: ${limitCheck.reason}`);
        continue;
      }

      // Execute the schedule
      try {
        console.log(`[ScheduleManager] Executing schedule "${config.name}" (mode=${config.mode})`);
        const result = await this.executeWithRetry(config);

        if (result) {
          incrementRunCounts(id);
          config.lastRunAt = now;
          config.runCount++;
          executed++;

          // Log the execution
          try {
            await db.agentLog.create({
              data: {
                agentName: 'pipeline-manager',
                level: 'info',
                category: 'cron',
                message: `Proactive schedule "${config.name}" executed successfully`,
                metadata: JSON.stringify({
                  scheduleId: id,
                  mode: config.mode,
                  scopeId: config.scopeId,
                  runCount: config.runCount,
                }),
                durationMs: Date.now() - now,
              },
            });
          } catch {
            // Logging failure is non-critical
          }
        }
      } catch (error) {
        console.error(`[ScheduleManager] Schedule "${config.name}" failed:`, error);
        resetConsecutiveCount(id);
      }

      // Compute next run time
      config.nextRunAt = computeNextRunAt(config);
    }

    return executed;
  }

  /**
   * Execute a schedule with retry logic.
   * On failure, applies exponential backoff and retries up to maxRetries.
   */
  private async executeWithRetry(config: ScheduleConfig): Promise<ProactiveMessage | null> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await executeSchedule(config);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < config.maxRetries) {
          const decision = decideRetry(config, attempt, lastError);
          console.warn(`[ScheduleManager] Retry decision for "${config.name}": ${decision.reason} (delay=${decision.delayMs}ms)`);

          const shouldProceed = await applyRetryDecision(decision);
          if (!shouldProceed) break;
        }
      }
    }

    // All retries exhausted
    console.error(`[ScheduleManager] Schedule "${config.name}" failed after ${config.maxRetries} retries: ${lastError?.message}`);

    // Log the failure
    try {
      await db.agentLog.create({
        data: {
          agentName: 'pipeline-manager',
          level: 'error',
          category: 'cron',
          message: `Proactive schedule "${config.name}" failed after ${config.maxRetries} retries`,
          metadata: JSON.stringify({
            scheduleId: config.id,
            mode: config.mode,
            error: lastError?.message,
          }),
        },
      });
    } catch {
      // Logging failure is non-critical
    }

    return null;
  }

  /**
   * Persist the current schedule state to the database.
   * Allows schedules to survive server restarts.
   */
  async persistSchedules(): Promise<void> {
    for (const config of this.schedules.values()) {
      try {
        await db.agentCronJob.upsert({
          where: { id: config.id },
          create: {
            id: config.id,
            agentName: 'pipeline-manager',
            name: config.name,
            schedule: config.cron ?? '',
            scheduleType: 'cron',
            timezone: config.timezone,
            nextRunAt: config.nextRunAt ? new Date(config.nextRunAt) : new Date(),
            taskType: `proactive_${config.mode}`,
            taskInput: JSON.stringify({
              mode: config.mode,
              prompt: config.prompt,
              script: config.script,
              scopeId: config.scopeId,
              conversationId: config.conversationId,
              activeHoursStart: config.activeHoursStart,
              activeHoursEnd: config.activeHoursEnd,
              maxConsecutiveRuns: config.maxConsecutiveRuns,
              maxDailyRuns: config.maxDailyRuns,
              maxRetries: config.maxRetries,
              retryBackoffMs: config.retryBackoffMs,
            }),
            runCount: config.runCount,
            status: config.enabled ? 'active' : 'paused',
          },
          update: {
            nextRunAt: config.nextRunAt ? new Date(config.nextRunAt) : new Date(),
            runCount: config.runCount,
            status: config.enabled ? 'active' : 'paused',
            lastRunAt: config.lastRunAt ? new Date(config.lastRunAt) : undefined,
          },
        });
      } catch (error) {
        console.error(`[ScheduleManager] Failed to persist schedule "${config.name}":`, error);
      }
    }
  }

  /**
   * Load schedules from the database.
   * Restores schedules that were persisted before a server restart.
   */
  async loadSchedules(): Promise<number> {
    try {
      const cronJobs = await db.agentCronJob.findMany({
        where: {
          taskType: { startsWith: 'proactive_' },
          status: 'active',
        },
      });

      let loaded = 0;
      for (const job of cronJobs) {
        try {
          const taskInput = job.taskInput ? JSON.parse(job.taskInput) : {};
          const config: ScheduleConfig = {
            id: job.id,
            name: job.name,
            mode: (taskInput.mode ?? 'notify') as ScheduleMode,
            enabled: job.status === 'active',
            cron: job.schedule || undefined,
            timezone: job.timezone || 'UTC',
            activeHoursStart: taskInput.activeHoursStart ?? 8,
            activeHoursEnd: taskInput.activeHoursEnd ?? 22,
            maxConsecutiveRuns: taskInput.maxConsecutiveRuns ?? 3,
            maxDailyRuns: taskInput.maxDailyRuns ?? 2,
            maxRetries: taskInput.maxRetries ?? 3,
            retryBackoffMs: taskInput.retryBackoffMs ?? 5000,
            prompt: taskInput.prompt,
            script: taskInput.script,
            scopeId: taskInput.scopeId ?? 'default',
            conversationId: taskInput.conversationId,
            lastRunAt: job.lastRunAt?.getTime(),
            nextRunAt: job.nextRunAt?.getTime(),
            runCount: job.runCount,
          };
          this.addSchedule(config);
          loaded++;
        } catch (error) {
          console.error(`[ScheduleManager] Failed to load schedule ${job.id}:`, error);
        }
      }

      console.log(`[ScheduleManager] Loaded ${loaded} schedules from database`);
      return loaded;
    } catch (error) {
      console.error('[ScheduleManager] Failed to load schedules:', error);
      return 0;
    }
  }
}

/**
 * Singleton instance of the ScheduleManager.
 * Import and use: `import { scheduleManager } from '@/lib/vellum-core/proactivity';`
 */
export const scheduleManager = new ScheduleManager();
