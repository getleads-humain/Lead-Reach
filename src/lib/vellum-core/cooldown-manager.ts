/**
 * Vellum Core — Cooldown Buffer Manager
 *
 * Manages per-model cooldown periods for Z.AI API calls to respect
 * the concurrency limit of 1 per model (glm-4.7-flash, glm-4.6v-flash).
 *
 * Design adapted from LeadReach's existing rate limiter in llm.ts,
 * but structured as a standalone, reusable service with:
 *   - Per-model tracking (independent cooldown for each model)
 *   - Queue system for pending requests
 *   - Configurable minimum intervals and cooldown buffers
 *   - Jitter to prevent thundering herd
 *   - waitForKey(model) / releaseKey(model) API
 *
 * Usage:
 *   const manager = new CooldownManager();
 *   await manager.waitForKey('glm-4.7-flash');
 *   try {
 *     const result = await callAPI(...);
 *   } finally {
 *     manager.releaseKey('glm-4.7-flash');
 *   }
 */

// ============================================================
// Configuration
// ============================================================

/** Default minimum interval between consecutive API calls (2s) */
const DEFAULT_MIN_INTERVAL_MS = 2000;

/** Default cooldown buffer after each call completes (2s) */
const DEFAULT_COOLDOWN_BUFFER_MS = 2000;

/** Default random jitter range to avoid thundering herd (0-1000ms) */
const DEFAULT_JITTER_MS = 1000;

/** Default maximum concurrency per model */
const DEFAULT_MAX_CONCURRENCY = 1;

// ============================================================
// Internal Types
// ============================================================

/** Per-model state tracked by the cooldown manager */
interface ModelCooldownState {
  /** Timestamp of the last API call initiation */
  lastCallTime: number;
  /** Number of currently in-flight requests */
  inFlight: number;
  /** Queue of pending request resolvers, FIFO */
  pendingQueue: Array<{
    resolve: () => void;
    enqueuedAt: number;
  }>;
}

/** Configuration for the cooldown manager */
export interface CooldownManagerConfig {
  /** Minimum interval between consecutive calls per model (default: 2000ms) */
  minIntervalMs?: number;
  /** Cooldown buffer after each call completes (default: 2000ms) */
  cooldownBufferMs?: number;
  /** Random jitter to avoid thundering herd (default: 1000ms) */
  jitterMs?: number;
  /** Maximum concurrent requests per model (default: 1) */
  maxConcurrency?: number;
}

// ============================================================
// CooldownManager Class
// ============================================================

/**
 * Manages per-model cooldown periods for API rate limiting.
 *
 * Provides a waitForKey/releaseKey pattern that ensures only one
 * in-flight request per model at a time, with minimum intervals
 * and cooldown buffers between calls.
 *
 * This is a singleton-capable manager — you can create one instance
 * and share it across the application, or create separate instances
 * for different services.
 */
export class CooldownManager {
  private readonly minIntervalMs: number;
  private readonly cooldownBufferMs: number;
  private readonly jitterMs: number;
  private readonly maxConcurrency: number;

  /** Per-model cooldown state */
  private readonly modelStates: Map<string, ModelCooldownState> = new Map();

  /** Timer references for cleanup tracking */
  private readonly cooldownTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(config?: CooldownManagerConfig) {
    this.minIntervalMs = config?.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
    this.cooldownBufferMs = config?.cooldownBufferMs ?? DEFAULT_COOLDOWN_BUFFER_MS;
    this.jitterMs = config?.jitterMs ?? DEFAULT_JITTER_MS;
    this.maxConcurrency = config?.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY;
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Wait until a cooldown slot is available for the given model.
   * Resolves when it's safe to make an API call for that model.
   *
   * This method:
   * 1. Checks if the concurrency limit has been reached (waits if so)
   * 2. Ensures the minimum interval + cooldown buffer since the last call
   * 3. Adds random jitter to prevent thundering herd
   *
   * IMPORTANT: You MUST call releaseKey(model) after your API call
   * completes (success or failure), otherwise the slot remains locked.
   */
  async waitForKey(model: string): Promise<void> {
    const state = this.getOrCreateState(model);

    // 1. Wait for concurrency slot if at capacity
    if (state.inFlight >= this.maxConcurrency) {
      await new Promise<void>((resolve) => {
        state.pendingQueue.push({ resolve, enqueuedAt: Date.now() });
      });
    }

    // 2. Wait for minimum interval + cooldown buffer since last call
    const now = Date.now();
    const elapsed = now - state.lastCallTime;
    const requiredWait = this.minIntervalMs + this.cooldownBufferMs;
    const jitter = Math.random() * this.jitterMs;
    const waitTime = requiredWait - elapsed + jitter;

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // 3. Mark as in-flight
    state.inFlight++;
    state.lastCallTime = Date.now();
  }

  /**
   * Release the cooldown slot for the given model after an API call completes.
   * Starts the cooldown timer and wakes the next queued request if any.
   *
   * Should be called in a finally block to ensure cleanup:
   *   await manager.waitForKey('model');
   *   try { await apiCall(); } finally { manager.releaseKey('model'); }
   */
  releaseKey(model: string): void {
    const state = this.modelStates.get(model);
    if (!state) {
      console.warn(`[CooldownManager] releaseKey called for unknown model: ${model}`);
      return;
    }

    // Decrement in-flight count (floor at 0)
    state.inFlight = Math.max(0, state.inFlight - 1);

    // Start cooldown timer (clear any existing one)
    const existingTimer = this.cooldownTimers.get(model);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const cooldownTimer = setTimeout(() => {
      this.cooldownTimers.delete(model);
      // Wake the next queued request if any
      this.wakeNext(model);
    }, this.cooldownBufferMs);

    this.cooldownTimers.set(model, cooldownTimer);
  }

  /**
   * Check if a model currently has available slots without waiting.
   * Useful for health checks and status monitoring.
   */
  isAvailable(model: string): boolean {
    const state = this.modelStates.get(model);
    if (!state) return true;
    return state.inFlight < this.maxConcurrency;
  }

  /**
   * Get the number of currently in-flight requests for a model.
   */
  getInFlightCount(model: string): number {
    const state = this.modelStates.get(model);
    return state?.inFlight ?? 0;
  }

  /**
   * Get the number of pending (queued) requests for a model.
   */
  getPendingCount(model: string): number {
    const state = this.modelStates.get(model);
    return state?.pendingQueue.length ?? 0;
  }

  /**
   * Get the estimated wait time before a slot becomes available
   * for the given model, in milliseconds.
   */
  getEstimatedWaitMs(model: string): number {
    const state = this.modelStates.get(model);
    if (!state) return 0;
    if (state.inFlight < this.maxConcurrency && state.pendingQueue.length === 0) {
      // Check if we're still in cooldown
      const elapsed = Date.now() - state.lastCallTime;
      const remaining = (this.minIntervalMs + this.cooldownBufferMs) - elapsed;
      return Math.max(0, remaining);
    }
    // Rough estimate: each pending request takes ~minInterval + cooldownBuffer
    const queuePosition = state.pendingQueue.length;
    const perSlotTime = this.minIntervalMs + this.cooldownBufferMs;
    return queuePosition * perSlotTime;
  }

  /**
   * Reset all cooldown state. Useful for testing or when
   * restarting a service after a long pause.
   */
  reset(): void {
    // Clear all cooldown timers
    Array.from(this.cooldownTimers.values()).forEach(timer => {
      clearTimeout(timer);
    });
    this.cooldownTimers.clear();

    // Resolve all pending queue entries (they'll get errors downstream)
    Array.from(this.modelStates.values()).forEach(state => {
      state.pendingQueue.forEach(entry => {
        entry.resolve();
      });
      state.pendingQueue = [];
      state.inFlight = 0;
    });
    this.modelStates.clear();
  }

  /**
   * Dispose of all resources. Call when shutting down.
   */
  dispose(): void {
    this.reset();
  }

  // ── Private Helpers ────────────────────────────────────────

  /**
   * Get or create the cooldown state for a model.
   */
  private getOrCreateState(model: string): ModelCooldownState {
    let state = this.modelStates.get(model);
    if (!state) {
      state = {
        lastCallTime: 0,
        inFlight: 0,
        pendingQueue: [],
      };
      this.modelStates.set(model, state);
    }
    return state;
  }

  /**
   * Wake the next queued request for a model.
   * Called after a cooldown timer expires.
   */
  private wakeNext(model: string): void {
    const state = this.modelStates.get(model);
    if (!state || state.pendingQueue.length === 0) return;

    const next = state.pendingQueue.shift();
    if (next) {
      next.resolve();
    }
  }
}

// ============================================================
// Global Singleton
// ============================================================

/**
 * Global cooldown manager instance shared across the Vellum Core module.
 * Uses the same concurrency=1 per model strategy as LeadReach's existing
 * rate limiter in llm.ts, but as a dedicated, reusable service.
 */
let globalInstance: CooldownManager | null = null;

/**
 * Get the global CooldownManager singleton.
 * Creates one on first access with default configuration.
 */
export function getCooldownManager(): CooldownManager {
  if (!globalInstance) {
    globalInstance = new CooldownManager();
  }
  return globalInstance;
}

/**
 * Reset the global CooldownManager (primarily for testing).
 */
export function resetCooldownManager(): void {
  if (globalInstance) {
    globalInstance.dispose();
    globalInstance = null;
  }
}
