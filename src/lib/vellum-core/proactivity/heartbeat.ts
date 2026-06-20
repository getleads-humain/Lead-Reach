/**
 * Proactivity Engine — Heartbeat System
 * =======================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The heartbeat system periodically "pings" the agent, giving it
 * an opportunity to review the current state and take proactive action.
 *
 * On each heartbeat tick, the agent:
 *   1. Re-reads its memory (recent tasks, follow-ups, pipeline state)
 *   2. Checks for pending tasks or signals that need attention
 *   3. Decides whether proactive action is warranted
 *   4. If so, sends a proactive message via the configured channel
 *
 * Active hours enforcement ensures the agent only acts during
 * business hours (configurable). Run limits prevent the agent
 * from being too aggressive with proactive outreach.
 *
 * Integration points:
 *   - Uses `@/lib/llm` for decision-making LLM calls
 *   - Uses `@/lib/db` for reading pipeline state
 *   - Works with `followups.ts` for overdue detection
 *   - Works with `scheduler.ts` for schedule-driven heartbeats
 */

import { callLLM } from '@/lib/llm';
import { db } from '@/lib/db';
import {
  type HeartbeatConfig,
  type HeartbeatResult,
  type HeartbeatState,
  type ProactiveMessage,
} from './types';

// ── Heartbeat Manager ───────────────────────────────────────────

/**
 * Manages the proactive heartbeat for the agent system.
 * Only one heartbeat instance is active at a time.
 */
class HeartbeatManager {
  private config: HeartbeatConfig | null = null;
  private scopeId: string = 'default';
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private state: HeartbeatState = {
    consecutiveRuns: 0,
    dailyRuns: 0,
    lastDailyResetDate: '',
    lastHeartbeatAt: 0,
  };
  private isRunning = false;

  /**
   * Start the heartbeat with the given configuration.
   * If a heartbeat is already running, it will be stopped first.
   */
  startHeartbeat(config: HeartbeatConfig, scopeId: string): void {
    // Stop existing heartbeat if running
    this.stopHeartbeat();

    // Resource-exhaustion guard: validate `intervalMs` against a reasonable
    // bound before passing to `setInterval`. Without this, a caller-controlled
    // `intervalMs` could be set to 1ms (DoS) or to a multi-year value
    // (effectively disabling cleanup). (CodeQL: Resource exhaustion —
    // unbounded setInterval delay.)
    const MIN_INTERVAL_MS = 30 * 1000;       // 30 seconds
    const MAX_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
    if (!Number.isFinite(config.intervalMs) ||
        config.intervalMs < MIN_INTERVAL_MS ||
        config.intervalMs > MAX_INTERVAL_MS) {
      throw new Error(
        `Invalid heartbeat intervalMs ${config.intervalMs} — must be between ` +
        `${MIN_INTERVAL_MS}ms and ${MAX_INTERVAL_MS}ms`,
      );
    }
    const safeIntervalMs = Math.floor(config.intervalMs);

    this.config = { ...config, intervalMs: safeIntervalMs };
    this.scopeId = scopeId;
    this.isRunning = true;
    this.state = {
      consecutiveRuns: 0,
      dailyRuns: 0,
      lastDailyResetDate: new Date().toISOString().slice(0, 10),
      lastHeartbeatAt: 0,
    };

    console.log(`[Heartbeat] Starting heartbeat for scope="${scopeId}" (interval=${safeIntervalMs}ms)`);

    this.intervalHandle = setInterval(() => {
      this.tick().catch(err => {
        console.error('[Heartbeat] Tick error:', err);
      });
    }, safeIntervalMs);

    // Run first tick after a short delay
    setTimeout(() => {
      this.tick().catch(err => {
        console.error('[Heartbeat] Initial tick error:', err);
      });
    }, 5000);
  }

  /**
   * Stop the currently running heartbeat.
   */
  stopHeartbeat(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.isRunning = false;
    console.log('[Heartbeat] Stopped');
  }

  /**
   * Check if the heartbeat is currently running.
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the current heartbeat state.
   */
  getState(): HeartbeatState {
    return { ...this.state };
  }

  /**
   * Execute a single heartbeat tick.
   * This is the core logic that determines if proactive action is needed.
   */
  private async tick(): Promise<HeartbeatResult> {
    if (!this.config) {
      return { acted: false, timestamp: Date.now() };
    }

    const now = Date.now();
    const config = this.config;

    // Reset daily counter if day has changed
    const today = new Date().toISOString().slice(0, 10);
    if (this.state.lastDailyResetDate !== today) {
      this.state.dailyRuns = 0;
      this.state.lastDailyResetDate = today;
    }

    // Check active hours
    if (!this.isActiveHours(config)) {
      this.state.consecutiveRuns = 0;
      return { acted: false, timestamp: now };
    }

    // Check run limits
    if (this.state.consecutiveRuns >= config.maxConsecutiveRuns) {
      this.state.consecutiveRuns = 0; // Reset for next window
      return {
        acted: false,
        timestamp: now,
        reasoning: `Max consecutive runs reached (${config.maxConsecutiveRuns}), resetting`,
      };
    }

    if (this.state.dailyRuns >= config.maxDailyRuns) {
      return {
        acted: false,
        timestamp: now,
        reasoning: `Max daily runs reached (${config.maxDailyRuns})`,
      };
    }

    // ── Gather Context ─────────────────────────────────────────
    const context = await this.gatherContext();

    // ── LLM Decision ───────────────────────────────────────────
    const decision = await this.decideAction(context);

    // ── Execute Decision ────────────────────────────────────────
    if (decision.acted) {
      this.state.consecutiveRuns++;
      this.state.dailyRuns++;
      this.state.lastHeartbeatAt = now;

      // Log the proactive action
      try {
        await db.agentLog.create({
          data: {
            agentName: 'pipeline-manager',
            level: 'info',
            category: 'execution',
            message: `Heartbeat: proactive action taken — ${decision.action ?? 'unknown'}`,
            metadata: JSON.stringify({
              scopeId: this.scopeId,
              action: decision.action,
              reasoning: decision.reasoning,
            }),
          },
        });
      } catch {
        // Logging failure is non-critical
      }
    } else {
      // No action — reset consecutive counter
      this.state.consecutiveRuns = 0;
      this.state.lastHeartbeatAt = now;
    }

    return decision;
  }

  /**
   * Gather context from the database for the heartbeat decision.
   * Includes: pending tasks, overdue follow-ups, pipeline state, recent activity.
   */
  private async gatherContext(): Promise<string> {
    const parts: string[] = [];

    try {
      // Pending tasks
      const pendingTasks = await db.agentTask.count({
        where: { status: 'pending' },
      });
      if (pendingTasks > 0) {
        parts.push(`- ${pendingTasks} pending tasks in the queue`);
      }

      // Failed tasks
      const failedTasks = await db.agentTask.findMany({
        where: { status: 'failed' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      if (failedTasks.length > 0) {
        parts.push(`- ${failedTasks.length} recently failed tasks`);
      }

      // Leads without follow-up (contacted but no next follow-up)
      const staleLeads = await db.lead.count({
        where: {
          stage: 'contacted',
          nextFollowUp: null,
        },
      });
      if (staleLeads > 0) {
        parts.push(`- ${staleLeads} contacted leads without scheduled follow-up`);
      }

      // Hot leads not yet contacted
      const hotLeads = await db.lead.count({
        where: {
          leadTier: 'hot',
          stage: { in: ['new', 'enriched', 'qualified'] },
        },
      });
      if (hotLeads > 0) {
        parts.push(`- ${hotLeads} hot leads not yet contacted`);
      }

      // Recent lead activity (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLeads = await db.lead.count({
        where: { createdAt: { gte: yesterday } },
      });
      parts.push(`- ${recentLeads} new leads in the last 24 hours`);

      // Active campaigns
      const activeCampaigns = await db.campaign.count({
        where: { status: 'active' },
      });
      parts.push(`- ${activeCampaigns} active campaigns`);

    } catch (error) {
      parts.push(`- Error gathering context: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    return parts.length > 0
      ? `Current system state:\n${parts.join('\n')}`
      : 'No significant signals detected — system appears stable.';
  }

  /**
   * Use the LLM to decide whether to take proactive action.
   * The "disposition" prompt guides the agent's personality and priorities.
   */
  private async decideAction(context: string): Promise<HeartbeatResult> {
    if (!this.config) {
      return { acted: false, timestamp: Date.now() };
    }

    const timestamp = Date.now();

    try {
      const response = await callLLM({
        systemPrompt: `You are a proactive B2B sales agent in the LeadReach AI platform. Your disposition:

${this.config.disposition}

Based on the context below, decide if you should take any proactive action. Possible actions:
- Schedule a follow-up with a hot lead
- Notify the user about stale leads
- Trigger a re-engagement sequence
- Flag failed tasks for attention
- Do nothing if everything is running smoothly

Respond in JSON format:
{
  "acted": true/false,
  "action": "description of action taken (if any)",
  "reasoning": "why you decided this"
}`,
        userMessage: context,
        temperature: 0.3,
        maxTokens: 500,
        thinkingBudget: 'quick',
      });

      if (!response) {
        return { acted: false, timestamp, reasoning: 'LLM returned no response' };
      }

      // Parse the LLM response
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            acted: boolean;
            action?: string;
            reasoning?: string;
          };
          return {
            acted: parsed.acted ?? false,
            action: parsed.action,
            reasoning: parsed.reasoning,
            timestamp,
          };
        }
      } catch {
        // JSON parse failed — treat as non-action
      }

      // If the response mentions action keywords, assume action was taken
      const actionKeywords = ['schedule', 'notify', 'flag', 'trigger', 'follow up', 'reach out'];
      const hasAction = actionKeywords.some(kw => response.toLowerCase().includes(kw));

      return {
        acted: hasAction,
        action: hasAction ? response.slice(0, 200) : undefined,
        reasoning: response.slice(0, 500),
        timestamp,
      };
    } catch (error) {
      console.error('[Heartbeat] LLM decision error:', error);
      return {
        acted: false,
        timestamp,
        reasoning: `LLM error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Check if the current time is within active hours.
   */
  private isActiveHours(config: HeartbeatConfig): boolean {
    const hour = new Date().getHours();
    return hour >= config.activeHoursStart && hour < config.activeHoursEnd;
  }
}

/**
 * Singleton heartbeat manager instance.
 */
export const heartbeatManager = new HeartbeatManager();

/**
 * Convenience function: Start the heartbeat.
 */
export function startHeartbeat(config: HeartbeatConfig, scopeId: string): void {
  heartbeatManager.startHeartbeat(config, scopeId);
}

/**
 * Convenience function: Stop the heartbeat.
 */
export function stopHeartbeat(): void {
  heartbeatManager.stopHeartbeat();
}
