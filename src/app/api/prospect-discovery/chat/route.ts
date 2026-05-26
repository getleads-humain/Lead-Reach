import { NextRequest, NextResponse } from 'next/server';
import { processAgentMessage } from '@/lib/prospect-agent/agent';
import type { ConversationContext, UserIntent } from '@/lib/prospect-agent/types';

// Set max duration for this API route to 5 minutes (production)
export const maxDuration = 300;

/**
 * Maximum time the agent pipeline is allowed to run before we return
 * a partial/graceful response.  Kept well under typical reverse-proxy
 * timeouts (60-120s) so the client always receives a JSON response.
 */
const PIPELINE_TIMEOUT_MS = 55_000; // 55 seconds

/**
 * POST /api/prospect-discovery/chat
 *
 * The main agent chat endpoint. Processes user messages through the
 * intelligent agent pipeline:
 * 1. Classifies user intent
 * 2. Dispatches to the appropriate specialist agent
 * 3. Executes research actions
 * 4. Returns conversational response with structured data
 *
 * The entire pipeline is wrapped in a timeout guard so we always
 * return a valid JSON response — even if the LLM or search APIs
 * are slow or returning 502 errors.
 *
 * Request body:
 * {
 *   message: string;
 *   conversationHistory: Array<{ role: string; content: string }>;
 *   context?: ConversationContext;
 *   forceIntent?: UserIntent;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory, context, forceIntent } = body as {
      message: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      context?: ConversationContext;
      forceIntent?: UserIntent;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      );
    }

    // Process the message through the agent pipeline with an overall timeout
    const result = await Promise.race([
      processAgentMessage(message.trim(), context, forceIntent),
      new Promise<null>((resolve) =>
        setTimeout(() => {
          console.warn('[AgentChat] Pipeline timed out after 55s — returning partial response');
          resolve(null);
        }, PIPELINE_TIMEOUT_MS)
      ),
    ]);

    if (result === null) {
      // Pipeline timed out — return a graceful response so the client
      // doesn't see a 502 from the reverse proxy
      return NextResponse.json({
        success: true,
        message: {
          id: `agent-timeout-${Date.now()}`,
          role: 'assistant',
          content: "I'm still working on your request — the research is taking longer than expected because the AI services are under heavy load. Your query has been processed partially. Please try again or rephrase your question for a quicker response.\n\nTip: Simpler, more specific queries (like \"Research Stripe\") tend to get faster results.",
          timestamp: new Date().toISOString(),
          persona: 'navigator',
          thinking: {
            persona: 'navigator',
            intent: 'converse',
            reasoning: 'Pipeline timed out',
            plan: ['Research is taking longer than expected'],
            confidence: 0.5,
          },
          actions: [{ type: 'converse', label: 'Timeout', status: 'failed', message: 'Research took too long' }],
        },
        updatedContext: context || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
        suggestedActions: [
          { label: 'Try Again', prompt: message.trim(), icon: 'RefreshCw' },
          { label: 'Simpler Query', prompt: `Research ${message.trim().split(' ').slice(0, 2).join(' ')}`, icon: 'Search' },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      updatedContext: result.updatedContext,
      suggestedActions: result.suggestedActions,
    });
  } catch (error) {
    console.error('[AgentChat] Unhandled error:', error);

    const msg = error instanceof Error ? error.message : 'Unknown error';

    // Detect specific error types for better error messages
    const isHtmlOrGatewayError = (
      msg.includes('Unexpected token')
      || msg.includes('SyntaxError')
      || msg.includes('is not valid JSON')
      || msg.includes('502')
      || msg.includes('Bad Gateway')
      || msg.includes('gateway error')
      || msg.includes('HTML instead')
    );

    const isRateLimitError = (
      msg.includes('429')
      || msg.includes('Too many requests')
      || msg.includes('rate limit')
    );

    if (isHtmlOrGatewayError || isRateLimitError) {
      return NextResponse.json({
        success: false,
        error: 'The AI service is temporarily busy. Please try again in a few seconds.',
        retryable: true,
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: 'The agent encountered an error. Please try again.',
      details: msg.slice(0, 300),
    }, { status: 500 });
  }
}
