/**
 * Vellum Core — Typed Event Bus
 *
 * Adapted from Vellum Assistant's EventBus class for LeadReach AI.
 * Provides a type-safe, generic event bus for inter-module communication.
 *
 * Features:
 *   - Generic EventBus<TEvents> class with full type safety
 *   - on(type, listener) → Subscription handle with dispose()
 *   - onAny(listener) → catch-all listener for all events
 *   - emit(type, payload) → async emission with error aggregation
 *   - dispose() → cleanup all listeners and subscriptions
 *   - LeadReach domain events type definitions
 *
 * This is a standalone utility with no dependencies on other Vellum
 * Core modules, making it safe to use anywhere in the codebase.
 */

// ============================================================
// Core EventBus Types
// ============================================================

/** Constraint: event map values must be objects */
export type EventMap = Record<string, object>;

/** Helper to enforce that event values are objects */
type EventShape<TEvents> = Record<keyof TEvents & string, object>;

/** Listener function for a specific event type */
export type EventListener<TPayload extends object> = (
  payload: TPayload,
) => void | Promise<void>;

/** Envelope for catch-all listeners — includes type and timestamp */
export type AnyEventEnvelope<TEvents extends EventShape<TEvents>> = {
  [K in keyof TEvents & string]: {
    type: K;
    payload: TEvents[K];
    emittedAtMs: number;
  };
}[keyof TEvents & string];

/** Catch-all listener function */
export type AnyEventListener<TEvents extends EventShape<TEvents>> = (
  event: AnyEventEnvelope<TEvents>,
) => void | Promise<void>;

/** Subscription handle returned by on() and onAny() */
export interface Subscription {
  /** Whether this subscription is still active */
  readonly active: boolean;
  /** Dispose of this subscription — removes the listener */
  dispose(): void;
}

// ============================================================
// Internal Types
// ============================================================

interface DirectListenerEntry {
  listener: EventListener<object>;
}

interface AnyListenerEntry<TEvents extends EventShape<TEvents>> {
  listener: AnyEventListener<TEvents>;
}

/** Simple Subscription implementation */
class BasicSubscription implements Subscription {
  private _active = true;
  private readonly disposer: () => void;

  constructor(disposer: () => void) {
    this.disposer = disposer;
  }

  get active(): boolean {
    return this._active;
  }

  dispose(): void {
    if (!this._active) return;
    this._active = false;
    this.disposer();
  }
}

// ============================================================
// EventBus Class
// ============================================================

/** Error thrown when trying to use a disposed EventBus */
export class EventBusDisposedError extends Error {
  constructor() {
    super('Event bus has been disposed');
    this.name = 'EventBusDisposedError';
  }
}

/**
 * Type-safe, generic event bus for inter-module communication.
 *
 * Usage:
 *   interface MyEvents {
 *     user_action: { userId: string; action: string };
 *     data_updated: { table: string; recordId: string };
 *   }
 *
 *   const bus = new EventBus<MyEvents>();
 *   const sub = bus.on('user_action', (payload) => {
 *     console.log(`User ${payload.userId} did ${payload.action}`);
 *   });
 *
 *   await bus.emit('user_action', { userId: '123', action: 'click' });
 *
 *   sub.dispose(); // Unsubscribe
 *   bus.dispose(); // Clean up everything
 */
export class EventBus<TEvents extends EventShape<TEvents>> {
  /** Direct listeners keyed by event type */
  private readonly listeners = new Map<
    keyof TEvents & string,
    Set<DirectListenerEntry>
  >();

  /** Catch-all listeners that receive every event */
  private readonly anyListeners = new Set<AnyListenerEntry<TEvents>>();

  /** Active subscriptions for cleanup tracking */
  private readonly subscriptions = new Set<BasicSubscription>();

  /** Whether this bus has been disposed */
  private disposed = false;

  /**
   * Subscribe to a specific event type.
   *
   * @param type - The event type to listen for
   * @param listener - Callback function invoked when the event is emitted
   * @returns Subscription handle — call dispose() to unsubscribe
   */
  on<K extends keyof TEvents & string>(
    type: K,
    listener: EventListener<TEvents[K]>,
  ): Subscription {
    this.ensureActive();
    const set = this.getOrCreateSet(type);
    const entry: DirectListenerEntry = {
      listener: listener as EventListener<object>,
    };
    set.add(entry);

    return this.createSubscription(() => {
      set.delete(entry);
      if (set.size === 0) this.listeners.delete(type);
    });
  }

  /**
   * Subscribe to all events on this bus.
   *
   * @param listener - Callback function invoked for every emitted event
   * @returns Subscription handle — call dispose() to unsubscribe
   */
  onAny(listener: AnyEventListener<TEvents>): Subscription {
    this.ensureActive();
    const entry: AnyListenerEntry<TEvents> = { listener };
    this.anyListeners.add(entry);

    return this.createSubscription(() => {
      this.anyListeners.delete(entry);
    });
  }

  /**
   * Emit an event to all registered listeners.
   *
   * Listeners are invoked sequentially in registration order.
   * Errors from individual listeners are collected and thrown
   * as an AggregateError after all listeners have been invoked.
   *
   * @param type - The event type to emit
   * @param payload - The event payload
   */
  async emit<K extends keyof TEvents & string>(
    type: K,
    payload: TEvents[K],
  ): Promise<void> {
    this.ensureActive();

    const emittedAtMs = Date.now();
    const directListeners = Array.from(this.listeners.get(type) ?? []);
    const anyListeners = Array.from(this.anyListeners);
    const errors: unknown[] = [];

    // Invoke direct listeners
    for (const entry of directListeners) {
      try {
        await (entry.listener as EventListener<TEvents[K]>)(payload);
      } catch (err) {
        errors.push(err);
      }
    }

    // Invoke catch-all listeners
    if (anyListeners.length > 0) {
      const event = { type, payload, emittedAtMs } as AnyEventEnvelope<TEvents>;
      for (const entry of anyListeners) {
        try {
          await entry.listener(event);
        } catch (err) {
          errors.push(err);
        }
      }
    }

    // Throw aggregated errors if any listener failed
    if (errors.length > 0) {
      const aggregateErr = new Error(
        `One or more listeners failed for event "${String(type)}"`,
      );
      (aggregateErr as Error & { errors: unknown[] }).errors = errors;
      throw aggregateErr;
    }
  }

  /**
   * Get the number of direct listeners for a specific event type.
   * If no type is provided, returns the total across all types.
   */
  listenerCount(type?: keyof TEvents & string): number {
    if (type) return this.listeners.get(type)?.size ?? 0;
    let total = 0;
    Array.from(this.listeners.values()).forEach(set => { total += set.size; });
    return total;
  }

  /**
   * Get the number of catch-all listeners.
   */
  anyListenerCount(): number {
    return this.anyListeners.size;
  }

  /**
   * Dispose of the event bus — removes all listeners and subscriptions.
   * After disposal, calling on(), onAny(), or emit() throws EventBusDisposedError.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    Array.from(this.subscriptions).forEach(subscription => {
      subscription.dispose();
    });
    this.listeners.clear();
    this.anyListeners.clear();
    this.subscriptions.clear();
  }

  // ── Private Helpers ────────────────────────────────────────

  private ensureActive(): void {
    if (this.disposed) throw new EventBusDisposedError();
  }

  private getOrCreateSet(
    type: keyof TEvents & string,
  ): Set<DirectListenerEntry> {
    const existing = this.listeners.get(type);
    if (existing) return existing;
    const created = new Set<DirectListenerEntry>();
    this.listeners.set(type, created);
    return created;
  }

  private createSubscription(disposer: () => void): BasicSubscription {
    const subscription = new BasicSubscription(() => {
      disposer();
      this.subscriptions.delete(subscription);
    });
    this.subscriptions.add(subscription);
    return subscription;
  }
}

// ============================================================
// LeadReach Domain Events
// ============================================================

/**
 * LeadReach-specific domain events for the Vellum Core module.
 * These are the events that flow through the system during
 * pipeline execution, tool use, memory updates, etc.
 */
export interface LeadReachEvents {
  // ── Agent Events ───────────────────────────────────────
  /** An agent has started working on a task */
  agent_started: { agentId: string; task: string; timestamp: number };
  /** An agent has completed its task */
  agent_completed: { agentId: string; task: string; durationMs: number; timestamp: number };
  /** An agent has failed its task */
  agent_failed: { agentId: string; task: string; error: string; timestamp: number };
  /** An agent's progress has been updated */
  agent_progress: { agentId: string; step: string; progress: number; timestamp: number };

  // ── Tool Events ────────────────────────────────────────
  /** A tool is about to be executed */
  tool_invoked: { toolName: string; input: Record<string, unknown>; requestId: string };
  /** A tool has completed execution */
  tool_completed: { toolName: string; output: string; isError: boolean; durationMs: number };
  /** A tool execution requires approval */
  tool_approval_required: { toolName: string; riskLevel: string; reason: string };

  // ── Memory Events ──────────────────────────────────────
  /** A memory node has been added */
  memory_node_added: { nodeId: string; type: string; content: string };
  /** A memory node has been updated */
  memory_node_updated: { nodeId: string; changes: Record<string, unknown> };
  /** A memory node has been deleted */
  memory_node_deleted: { nodeId: string };
  /** A memory edge has been created */
  memory_edge_created: { sourceId: string; targetId: string; relation: string };

  // ── Pipeline Events ────────────────────────────────────
  /** A pipeline step has started */
  pipeline_step_started: { stepId: string; agent: string; action: string };
  /** A pipeline step has completed */
  pipeline_step_completed: { stepId: string; status: string; durationMs: number };
  /** The pipeline phase has changed */
  pipeline_phase_changed: { phase: string; overallProgress: number };
  /** The pipeline has completed */
  pipeline_completed: { totalDurationMs: number; stepsCompleted: number; stepsFailed: number };
}

/**
 * Convenience type alias for a LeadReach event bus.
 */
export type LeadReachEventBus = EventBus<LeadReachEvents>;

// ============================================================
// Global Singleton
// ============================================================

let globalBus: LeadReachEventBus | null = null;

/**
 * Get the global LeadReach event bus singleton.
 * Creates one on first access.
 */
export function getLeadReachEventBus(): LeadReachEventBus {
  if (!globalBus) {
    globalBus = new EventBus<LeadReachEvents>();
  }
  return globalBus;
}

/**
 * Reset the global event bus (primarily for testing).
 */
export function resetLeadReachEventBus(): void {
  if (globalBus) {
    globalBus.dispose();
    globalBus = null;
  }
}
