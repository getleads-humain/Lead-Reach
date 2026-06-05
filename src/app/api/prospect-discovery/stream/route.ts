// ============================================================
// SSE Streaming Endpoint for Prospect Discovery
// ============================================================

import { NextRequest } from 'next/server';
import { processAgentMessage } from '@/lib/prospect-agent/agent';
import type { ConversationContext, UserIntent, AgentMessage, SuggestedAction } from '@/lib/prospect-agent/types';

export const maxDuration = 300;

/**
 * POST /api/prospect-discovery/stream
 *
 * SSE streaming version of the agent chat endpoint.
 * Sends real-time progress events as the discovery pipeline runs,
 * so the user sees each step visually as it happens.
 */
export async function POST(request: NextRequest) {
  let body: { message?: string; context?: ConversationContext; forceIntent?: UserIntent };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, context, forceIntent } = body as {
    message: string;
    context?: ConversationContext;
    forceIntent?: UserIntent;
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
      }, 15_000);

      const onProgress = (event: string, data: unknown) => {
        send(event, data);
      };

      processAgentMessage(message.trim(), context, forceIntent, onProgress)
        .then((result) => {
          send('done', {
            message: serializeAgentMessage(result.message),
            updatedContext: result.updatedContext,
            suggestedActions: result.suggestedActions,
          });
        })
        .catch((error) => {
          console.error('[StreamRoute] Fatal error:', error);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          send('error', { message: errorMsg });
          send('done', {
            message: {
              id: `agent-error-${Date.now()}`,
              role: 'assistant',
              content: `I encountered an error during discovery: ${errorMsg.slice(0, 200)}. Please try again.`,
              timestamp: new Date().toISOString(),
              persona: 'navigator',
              actions: [],
            },
            updatedContext: context || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
            suggestedActions: [
              { label: 'Try Again', prompt: message.trim(), icon: 'RefreshCw' },
            ],
          });
        })
        .finally(() => {
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
