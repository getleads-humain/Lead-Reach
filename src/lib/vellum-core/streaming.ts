/**
 * Vellum Core — SSE Streaming for Next.js API Routes
 *
 * Provides Server-Sent Events (SSE) streaming utilities for
 * Next.js 16 App Router API routes. Converts AgentEvent objects
 * from the Vellum AgentLoop into SSE format suitable for
 * real-time streaming to the browser.
 *
 * Features:
 *   - createSSEStream() for Next.js Response objects
 *   - AgentEvent → SSE format conversion
 *   - Support for abort signals
 *   - Typed SSE event types
 *   - Helper utilities for common SSE patterns
 *
 * Usage in Next.js API route:
 *   export async function POST(request: Request) {
 *     const stream = createSSEStream(async (sender) => {
 *       sender.send('text_delta', { text: 'Hello' });
 *       sender.send('tool_use', { id: '1', name: 'search', input: {} });
 *       sender.complete();
 *     }, request.signal);
 *
 *     return new Response(stream, {
 *       headers: {
 *         'Content-Type': 'text/event-stream',
 *         'Cache-Control': 'no-cache',
 *         'Connection': 'keep-alive',
 *       },
 *     });
 *   }
 */

import type { AgentEvent, RiskLevel } from './types';

// ============================================================
// SSE Event Types
// ============================================================

/** All supported SSE event types for LeadReach streaming */
export type SSEEventType =
  | 'text_delta'
  | 'thinking_delta'
  | 'tool_use'
  | 'tool_result'
  | 'agent_progress'
  | 'pipeline_step'
  | 'memory_update'
  | 'usage'
  | 'error'
  | 'done'
  | 'heartbeat';

/** SSE event payload structure */
export interface SSEEvent {
  /** The event type */
  type: SSEEventType;
  /** The event data payload */
  data: Record<string, unknown>;
  /** Optional event ID for reconnection support */
  id?: string;
  /** Optional retry interval in milliseconds */
  retry?: number;
}

// ============================================================
// SSE Stream Sender
// ============================================================

/**
 * Sender object passed to the createSSEStream callback.
 * Provides methods for sending events and completing the stream.
 */
export class SSESender {
  private readonly controller: ReadableStreamDefaultController;
  private readonly encoder: TextEncoder;
  private eventId = 0;
  private aborted = false;

  constructor(controller: ReadableStreamDefaultController) {
    this.controller = controller;
    this.encoder = new TextEncoder();
  }

  /**
   * Send an SSE event to the client.
   *
   * @param type - The event type
   * @param data - The event data payload
   * @param options - Optional event ID and retry interval
   */
  send(type: SSEEventType, data: Record<string, unknown>, options?: { id?: string; retry?: number }): void {
    if (this.aborted) return;

    try {
      const id = options?.id || String(this.eventId++);
      const lines: string[] = [];

      if (options?.retry) {
        lines.push(`retry: ${options.retry}`);
      }

      lines.push(`id: ${id}`);
      lines.push(`event: ${type}`);
      lines.push(`data: ${JSON.stringify(data)}`);
      lines.push(''); // Empty line to end the event

      const chunk = lines.join('\n') + '\n';
      this.controller.enqueue(this.encoder.encode(chunk));
    } catch (error) {
      // Controller might be closed — ignore write errors
      console.warn('[SSESender] Failed to send event:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Send a heartbeat/keep-alive comment.
   * SSE comments start with a colon and are ignored by clients.
   */
  heartbeat(): void {
    if (this.aborted) return;
    try {
      this.controller.enqueue(this.encoder.encode(': heartbeat\n\n'));
    } catch { /* ignore */ }
  }

  /**
   * Complete the stream and close the connection.
   * Sends a 'done' event before closing.
   */
  complete(data?: Record<string, unknown>): void {
    if (this.aborted) return;
    this.send('done', data || { reason: 'completed' });
    try {
      this.controller.close();
    } catch { /* already closed */ }
    this.aborted = true;
  }

  /**
   * Send an error event and close the stream.
   */
  error(message: string, recoverable = false): void {
    if (this.aborted) return;
    this.send('error', { message, recoverable });
    try {
      this.controller.close();
    } catch { /* already closed */ }
    this.aborted = true;
  }

  /**
   * Mark the sender as aborted (e.g., when the client disconnects).
   */
  abort(): void {
    this.aborted = true;
    try {
      this.controller.close();
    } catch { /* already closed */ }
  }

  /**
   * Check if the sender is still active.
   */
  get isActive(): boolean {
    return !this.aborted;
  }
}

// ============================================================
// createSSEStream
// ============================================================

/**
 * Create an SSE ReadableStream for use with Next.js Response.
 *
 * @param handler - Async function that receives an SSESender and
 *                  produces events by calling sender.send()
 * @param signal - Optional AbortSignal for cancellation
 * @returns ReadableStream that can be passed to new Response()
 *
 * @example
 * ```typescript
 * const stream = createSSEStream(async (sender) => {
 *   for (const chunk of llmStream) {
 *     sender.send('text_delta', { text: chunk.text });
 *   }
 *   sender.complete();
 * }, request.signal);
 *
 * return new Response(stream, {
 *   headers: {
 *     'Content-Type': 'text/event-stream',
 *     'Cache-Control': 'no-cache',
 *     'Connection': 'keep-alive',
 *   },
 * });
 * ```
 */
export function createSSEStream(
  handler: (sender: SSESender) => Promise<void>,
  signal?: AbortSignal,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const sender = new SSESender(controller);

      // Handle abort signal
      const abortHandler = () => {
        sender.abort();
      };

      if (signal) {
        if (signal.aborted) {
          sender.abort();
          return;
        }
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      // Send initial headers comment
      try {
        controller.enqueue(encoder.encode(': LeadReach AI SSE Stream\n\n'));
      } catch { /* controller might be closed */ }

      // Run the handler
      handler(sender)
        .then(() => {
          if (sender.isActive) {
            sender.complete();
          }
        })
        .catch((error) => {
          if (sender.isActive) {
            sender.error(
              error instanceof Error ? error.message : 'Unknown streaming error',
              false,
            );
          }
        })
        .finally(() => {
          if (signal) {
            signal.removeEventListener('abort', abortHandler);
          }
        });
    },

    cancel() {
      // Client disconnected — cleanup is handled by the abort signal
    },
  });
}

// ============================================================
// AgentEvent → SSE Conversion
// ============================================================

/**
 * Convert an AgentEvent from the Vellum AgentLoop into an SSE event.
 *
 * Maps the AgentEvent discriminated union to the SSE event format,
 * filtering out internal events that shouldn't be sent to the client.
 *
 * @param event - The AgentEvent to convert
 * @returns SSEEvent object, or null if the event should be filtered
 */
export function agentEventToSSE(event: AgentEvent): SSEEvent | null {
  switch (event.type) {
    // ── Text & Thinking ────────────────────────────────────
    case 'text_delta':
      return { type: 'text_delta', data: { text: event.text } };

    case 'thinking_delta':
      return { type: 'thinking_delta', data: { thinking: event.thinking } };

    case 'message_complete':
      return { type: 'text_delta', data: { text: event.content, complete: true } };

    // ── Tool Execution ─────────────────────────────────────
    case 'tool_use':
      return {
        type: 'tool_use',
        data: {
          id: event.id,
          name: event.name,
          input: event.input,
        },
      };

    case 'tool_output_chunk':
      return {
        type: 'tool_result',
        data: {
          toolUseId: event.toolUseId,
          chunk: event.chunk,
        },
      };

    case 'tool_result':
      return {
        type: 'tool_result',
        data: {
          toolUseId: event.toolUseId,
          content: event.content,
          isError: event.isError,
          riskLevel: event.riskLevel,
          riskReason: event.riskReason,
        },
      };

    // ── Pipeline Progress ──────────────────────────────────
    case 'agent_progress':
      return {
        type: 'agent_progress',
        data: {
          agent: event.agent,
          step: event.step,
          progress: event.progress,
        },
      };

    case 'pipeline_step':
      return {
        type: 'pipeline_step',
        data: {
          step: event.step,
          phase: event.phase,
        },
      };

    // ── Context Management ─────────────────────────────────
    case 'context_compacting':
      return {
        type: 'pipeline_step',
        data: { action: 'compacting_context' },
      };

    case 'compaction_completed':
      return {
        type: 'pipeline_step',
        data: {
          action: 'compaction_completed',
          originalTokens: event.originalTokens,
          compactedTokens: event.compactedTokens,
        },
      };

    case 'compaction_circuit_open':
      return {
        type: 'pipeline_step',
        data: { action: 'compaction_paused', reason: event.reason },
      };

    case 'compaction_circuit_closed':
      return {
        type: 'pipeline_step',
        data: { action: 'compaction_resumed' },
      };

    // ── Memory Updates ─────────────────────────────────────
    case 'memory_update':
      return {
        type: 'memory_update',
        data: {
          operation: event.operation,
          node: event.node,
          edge: event.edge,
        },
      };

    // ── Usage Tracking ─────────────────────────────────────
    case 'usage':
      return {
        type: 'usage',
        data: {
          inputTokens: event.inputTokens,
          outputTokens: event.outputTokens,
          model: event.model,
          providerDurationMs: event.providerDurationMs,
        },
      };

    // ── Errors ─────────────────────────────────────────────
    case 'error':
      return {
        type: 'error',
        data: {
          message: event.error.message,
          recoverable: true,
        },
      };

    case 'provider_error':
      return {
        type: 'error',
        data: {
          message: event.error.message,
          provider: event.provider,
          recoverable: true,
        },
      };

    // ── Agent Loop Exit ────────────────────────────────────
    case 'agent_loop_exit':
      return {
        type: 'done',
        data: {
          reason: event.reason,
          completed: event.reason === 'completed' || event.reason === 'no_tool_calls',
        },
      };

    // ── Internal events (not sent to client) ───────────────
    case 'llm_call_started':
    case 'max_tokens_reached':
      return null; // Internal events — don't forward to client

    default:
      return null;
  }
}

// ============================================================
// SSE Response Helper
// ============================================================

/**
 * Create a Next.js Response object with SSE streaming headers.
 *
 * @param stream - The ReadableStream to wrap in a Response
 * @returns Response with proper SSE headers
 */
export function createSSEResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Create a complete SSE streaming response from an AgentEvent generator.
 *
 * This is the highest-level helper — pass an async generator of AgentEvents
 * and get back a Response ready to return from a Next.js API route.
 *
 * @param eventGenerator - Async generator that produces AgentEvents
 * @param signal - Optional AbortSignal for cancellation
 * @returns Response with SSE streaming
 */
export function createAgentEventStreamResponse(
  eventGenerator: AsyncGenerator<AgentEvent>,
  signal?: AbortSignal,
): Response {
  const stream = createSSEStream(async (sender) => {
    try {
      for await (const event of eventGenerator) {
        if (!sender.isActive) break;

        const sseEvent = agentEventToSSE(event);
        if (sseEvent) {
          sender.send(sseEvent.type, sseEvent.data);
        }
      }
    } catch (error) {
      if (sender.isActive) {
        sender.error(
          error instanceof Error ? error.message : 'Stream error',
          false,
        );
      }
    }
  }, signal);

  return createSSEResponse(stream);
}
