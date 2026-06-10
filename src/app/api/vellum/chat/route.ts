/**
 * POST /api/vellum/chat
 *
 * Main Vellum-powered chat endpoint. Uses the AgentLoop from vellum-core
 * with the Z.AI provider to process user messages through the agent pipeline.
 *
 * Returns an SSE stream with AgentEvents (text_delta, thinking_delta,
 * tool_use, tool_result, etc.) for real-time streaming to the client.
 *
 * Integrates with:
 *   - Memory system (load context memory, store new memories)
 *   - Skills engine (skill resolution and execution)
 *   - Plugin system (run hooks)
 *   - Session management (create/continue sessions)
 */

import { NextRequest } from 'next/server';
import { createAgentLoop, createSSEStream, agentEventToSSE, type AgentEvent } from '@/lib/vellum-core';
import type { AgentMessage } from '@/lib/vellum-core';
import { loadContextMemory } from '@/lib/vellum-core/memory';
import { pluginManager } from '@/lib/vellum-core/plugins';
import { searchSkills } from '@/lib/vellum-core/skills';

// 5-minute timeout for long-running agent tasks
export const maxDuration = 300;

const CHAT_TIMEOUT_MS = 270_000; // 4.5 minutes (buffer before maxDuration)

/**
 * Build a system prompt enriched with memory context and skill hints.
 */
async function buildEnrichedSystemPrompt(
  sessionId: string,
  userMessage: string,
  context?: Record<string, unknown>,
): Promise<string> {
  const parts: string[] = [
    'You are LeadReach AI, a B2B lead generation assistant powered by the Vellum Core engine. Help users research companies, find contacts, analyze markets, build ICPs, score leads, and compose outreach messages.',
  ];

  // Load relevant memories for context
  try {
    const memories = await loadContextMemory(sessionId, userMessage);
    if (memories.length > 0) {
      parts.push('\n## Relevant Memory Context');
      for (const memory of memories.slice(0, 10)) {
        parts.push(`- [${memory.node.type}/${memory.node.fidelity}] ${memory.node.content}`);
      }
    }
  } catch {
    // Memory loading is non-critical
  }

  // Find relevant skills
  try {
    const skills = await searchSkills(userMessage);
    if (skills.length > 0) {
      parts.push('\n## Available Skills');
      for (const skill of skills.slice(0, 5)) {
        parts.push(`- **${skill.displayName}**: ${skill.description}`);
      }
    }
  } catch {
    // Skill search is non-critical
  }

  // Add user context if provided
  if (context && Object.keys(context).length > 0) {
    parts.push('\n## User Context');
    parts.push(JSON.stringify(context, null, 2));
  }

  return parts.join('\n');
}

/**
 * POST handler — processes a chat message through the Vellum AgentLoop
 * and returns an SSE stream of agent events.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, context } = body as {
      message: string;
      sessionId?: string;
      context?: Record<string, unknown>;
    };

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json(
        { error: 'message is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    const conversationId = sessionId || `vellum-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Run plugin hooks (pre-model-call)
    try {
      await pluginManager.runHook('user-prompt-submit', {
        message,
        conversationId,
        timestamp: Date.now(),
      });
    } catch {
      // Plugin hooks are non-critical
    }

    // Build the enriched system prompt
    const systemPrompt = await buildEnrichedSystemPrompt(conversationId, message.trim(), context);

    // Create the agent loop
    const agentLoop = createAgentLoop({
      systemPrompt,
      conversationId,
      config: {
        maxTokens: 8192,
        thinking: { enabled: true, budgetTokens: 2048 },
        effort: 'high',
        maxToolTurns: 20,
        emitThinkingEvents: true,
      },
    });

    // Create the user message
    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: Date.now(),
    };

    // Create an abort controller with timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, CHAT_TIMEOUT_MS);

    // Create the SSE stream
    const stream = createSSEStream(async (sender) => {
      try {
        // Run the agent loop
        const result = await agentLoop.run({
          messages: [userMessage],
          signal: abortController.signal,
          requestId: `vellum-chat-${Date.now()}`,
          onEvent: async (event: AgentEvent) => {
            if (!sender.isActive) return;

            const sseEvent = agentEventToSSE(event);
            if (sseEvent) {
              sender.send(sseEvent.type, sseEvent.data);
            }
          },
          compactInPlace: true,
        });

        // Send final summary event
        if (sender.isActive) {
          sender.send('done', {
            reason: result.exitReason || 'completed',
            sessionId: conversationId,
            totalTokensUsed: result.totalTokensUsed,
            toolUseTurns: result.toolUseTurns,
            durationMs: result.durationMs,
            messagesGenerated: result.newMessages.length,
          });
        }

        // Store conversation memory (async, non-blocking)
        storeConversationMemory(conversationId, message.trim(), result).catch(() => {
          // Memory storage is non-critical
        });
      } catch (error) {
        if (sender.isActive) {
          sender.error(
            error instanceof Error ? error.message : 'Unknown error during agent execution',
            true,
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }, request.signal);

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[VellumChat] Unhandled error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight.
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Store key memories from a conversation (non-blocking).
 */
async function storeConversationMemory(
  sessionId: string,
  _userMessage: string,
  result: { newMessages: AgentMessage[]; exitReason: string | null },
): Promise<void> {
  try {
    const { saveNode, generateNodeId } = await import('@/lib/vellum-core/memory');
    const assistantMessages = result.newMessages.filter(m => m.role === 'assistant' && m.content);

    if (assistantMessages.length > 0) {
      // Store a summary of the conversation as an episodic memory
      const summary = assistantMessages
        .map(m => m.content)
        .join(' | ')
        .slice(0, 500);

      await saveNode({
        id: generateNodeId(),
        content: `In session ${sessionId}: ${summary}`,
        type: 'episodic',
        fidelity: 'vivid',
        confidence: 0.8,
        significance: 0.7,
        stability: 0.3,
        sourceConversations: [sessionId],
        sourceType: 'direct',
        scopeId: sessionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      });
    }
  } catch {
    // Non-critical
  }
}
