// ============================================================
// SSE Streaming Endpoint for Prospect Discovery
// Uses the 8-Agent Orchestrator for real multi-agent processing
// ============================================================

import { NextRequest } from 'next/server';
import { processWithOrchestrator } from '@/lib/prospect-agent/orchestrator';
import type { OrchestratorEvent, PipelineState } from '@/lib/prospect-agent/orchestrator-types';
import type { ConversationContext, UserIntent, AgentMessage, SuggestedAction, PipelineCheckpoint } from '@/lib/prospect-agent/types';

export const maxDuration = 300;

/**
 * POST /api/prospect-discovery/stream
 *
 * SSE streaming version of the agent chat endpoint.
 * Uses the 8-agent orchestrator pipeline that shows:
 *   - Real-time thinking mode with timer
 *   - Agent-to-agent communication
 *   - Step-by-step pipeline progress
 *   - Each agent's status and work
 */
export async function POST(request: NextRequest) {
  let body: { message?: string; context?: ConversationContext; forceIntent?: UserIntent; resumeFrom?: PipelineCheckpoint };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, context, forceIntent, resumeFrom } = body as {
    message: string;
    context?: ConversationContext;
    forceIntent?: UserIntent;
    resumeFrom?: PipelineCheckpoint;
  };

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let keepaliveInterval: NodeJS.Timeout | null = null;
      let thinkingInterval: NodeJS.Timeout | null = null;
      let thinkStartTime: number | null = null;

      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream may have been closed
        }
      };

      // Keepalive to prevent proxy timeouts
      keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          if (keepaliveInterval) clearInterval(keepaliveInterval);
        }
      }, 10_000);

      // Thinking timer — emit tick events every second while in thinking phase
      const startThinkingTimer = () => {
        thinkStartTime = Date.now();
        thinkingInterval = setInterval(() => {
          if (thinkStartTime) {
            const elapsed = Date.now() - thinkStartTime;
            send('thinking_tick', { elapsedMs: elapsed, phase: 'Thinking' });
          }
        }, 1000);
      };

      const stopThinkingTimer = () => {
        if (thinkingInterval) {
          clearInterval(thinkingInterval);
          thinkingInterval = null;
        }
      };

      // Orchestrator event callback
      const onEvent = (event: OrchestratorEvent) => {
        switch (event.type) {
          case 'thinking_start':
            startThinkingTimer();
            send('thinking_start', event.data);
            break;

          case 'thinking_tick':
            // Forward thinking ticks to the client
            send('thinking_tick', event.data);
            break;

          case 'thinking_end':
            stopThinkingTimer();
            send('thinking_end', event.data);
            break;

          case 'agent_status':
            send('agent_status', event.data);
            break;

          case 'agent_comm':
            send('agent_comm', event.data);
            break;

          case 'cooldown':
            send('cooldown', event.data);
            break;

          case 'step_start':
            send('step_start', event.data);
            break;

          case 'step_progress':
            send('step_progress', event.data);
            break;

          case 'step_complete':
            send('step_complete', event.data);
            break;

          case 'data_update':
            send('data_update', event.data);
            break;

          case 'insight':
            send('insight', event.data);
            break;

          case 'pipeline_progress':
            send('pipeline_progress', event.data);
            break;

          case 'pipeline_resumed':
            send('pipeline_resumed', event.data);
            break;

          case 'error':
            send('error', event.data);
            break;
        }
      };

      processWithOrchestrator(message.trim(), context, forceIntent, onEvent, resumeFrom)
        .then((result) => {
          stopThinkingTimer();
          send('done', {
            message: serializeAgentMessage(result.message),
            updatedContext: result.updatedContext,
            suggestedActions: result.suggestedActions,
            pipelineState: result.pipelineState,
          });
        })
        .catch((error) => {
          stopThinkingTimer();
          console.error('[StreamRoute] Fatal error:', error);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          send('error', { message: errorMsg, recoverable: true });

          // ─── GRACEFUL DEGRADE: same pattern as the orchestrator's outer
          // catch. Parse the user's query, build a fallback prospect from
          // any pre-supplied data, and return that instead of an empty
          // error message. Fixes "Pipeline Error: Both stream and chat API
          // failed" with no data shown.
          let fallbackProspect: Record<string, unknown> | undefined;
          let fallbackContent = `I encountered an error during discovery: ${errorMsg.slice(0, 200)}. Please try again.`;

          try {
            // Inline import to avoid circular deps
            const { parseQuery } = require('@/lib/prospect-agent/query-parser');
            const parsed = parseQuery(message.trim());

            if (parsed.signalsProvided > 0 && parsed.prepopulatedProspect) {
              fallbackProspect = parsed.prepopulatedProspect;
              const filledFields: string[] = [];
              if (parsed.personName) filledFields.push(`**Name:** ${parsed.personName}`);
              if (parsed.title) filledFields.push(`**Title:** ${parsed.title}`);
              if (parsed.companyName) filledFields.push(`**Company:** ${parsed.companyName}`);
              if (parsed.email) filledFields.push(`**Email:** ${parsed.email}`);
              if (parsed.linkedinPersonUrl) filledFields.push(`**LinkedIn:** ${parsed.linkedinPersonUrl}`);
              const loc = [parsed.city, parsed.country].filter(Boolean).join(', ');
              if (loc) filledFields.push(`**Location:** ${loc}`);
              if (parsed.industry) filledFields.push(`**Industry:** ${parsed.industry}`);

              fallbackContent = `I encountered an error during discovery: ${errorMsg.slice(0, 150)}.\n\nHowever, I extracted the following information from your query:\n\n${filledFields.join('\n')}\n\nYou can use this data as-is, or try running your query again in a moment.`;
            }
          } catch (parseErr) {
            console.error('[StreamRoute] Fallback parser failed:', parseErr);
          }

          send('done', {
            message: {
              id: `agent-error-${Date.now()}`,
              role: 'assistant',
              content: fallbackContent,
              timestamp: new Date().toISOString(),
              persona: 'navigator',
              actions: [],
              prospectData: fallbackProspect,
            },
            updatedContext: context || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
            suggestedActions: [
              { label: 'Try Again', prompt: message.trim(), icon: 'RefreshCw' },
            ],
            pipelineState: null,
          });
        })
        .finally(() => {
          stopThinkingTimer();
          if (keepaliveInterval) clearInterval(keepaliveInterval);
          try { controller.close(); } catch { /* already closed */ }
        });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * Serialize an AgentMessage for SSE transport.
 * Converts Date objects to ISO strings so JSON.stringify works correctly.
 */
function serializeAgentMessage(msg: AgentMessage): Record<string, unknown> {
  return {
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
    thinking: msg.thinking ? { ...msg.thinking } : undefined,
    actions: msg.actions?.map(a => ({ ...a })) || [],
    prospectData: msg.prospectData ? { ...msg.prospectData } : undefined,
    icpData: msg.icpData ? { ...msg.icpData } : undefined,
    outreachData: msg.outreachData ? { ...msg.outreachData } : undefined,
    marketData: msg.marketData ? { ...msg.marketData } : undefined,
    scoreData: msg.scoreData ? { ...msg.scoreData } : undefined,
    insights: msg.insights?.map(i => ({ ...i })) || undefined,
    navigation: msg.navigation?.map(n => ({ ...n })) || undefined,
  };
}
