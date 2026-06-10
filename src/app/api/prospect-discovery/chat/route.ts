import { NextRequest, NextResponse } from 'next/server';
import { processWithOrchestrator } from '@/lib/prospect-agent/orchestrator';
import type { ConversationContext, UserIntent } from '@/lib/prospect-agent/types';

// Set max duration for this API route to 5 minutes (production)
export const maxDuration = 300;

/**
 * Maximum time the agent pipeline is allowed to run before we return
 * a partial/graceful response.
 */
const PIPELINE_TIMEOUT_MS = 240_000; // 4 minutes (increased from 3min for reliability)

/**
 * POST /api/prospect-discovery/chat
 *
 * The main agent chat endpoint. Uses the 8-agent orchestrator pipeline.
 */
export async function POST(request: NextRequest) {
  let requestMessage = '';
  let requestContext: ConversationContext | undefined;
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

    requestMessage = message.trim();
    requestContext = context;

    // Process the message through the 8-agent orchestrator pipeline with timeout
    const result = await Promise.race([
      processWithOrchestrator(message.trim(), context, forceIntent),
      new Promise<null>((resolve) =>
        setTimeout(() => {
          console.warn('[AgentChat] Pipeline timed out after 3min — returning partial response');
          resolve(null);
        }, PIPELINE_TIMEOUT_MS)
      ),
    ]);

    if (result === null) {
      return NextResponse.json({
        success: true,
        message: {
          id: `agent-timeout-${Date.now()}`,
          role: 'assistant',
          content: "I'm still working on your request — the research is taking longer than expected because the AI services are under heavy load. Please try again or rephrase your question for a quicker response.\n\nTip: Simpler, more specific queries (like \"Research Stripe\") tend to get faster results.",
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
        updatedContext: requestContext || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
        suggestedActions: [
          { label: 'Try Again', prompt: requestMessage, icon: 'RefreshCw' },
          { label: 'Simpler Query', prompt: `Research ${requestMessage.split(' ').slice(0, 2).join(' ')}`, icon: 'Search' },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      updatedContext: result.updatedContext,
      suggestedActions: result.suggestedActions,
      pipelineState: result.pipelineState,
    });
  } catch (error) {
    console.error('[AgentChat] Unhandled error:', error);

    const msg = error instanceof Error ? error.message : 'Unknown error';

    const isGenuineGatewayError = (
      (msg.includes('502') || msg.includes('Bad Gateway'))
      && !msg.includes('search') && !msg.includes('exaSearch') && !msg.includes('DuckDuckGo')
    ) || (
      msg.includes('503') || msg.includes('Service Unavailable')
    );

    const isRateLimitError = (
      msg.includes('429')
      || msg.includes('Too many requests')
    );

    if (isGenuineGatewayError || isRateLimitError) {
      return NextResponse.json({
        success: false,
        error: 'The AI service is temporarily busy. Please try again in a few seconds.',
        retryable: true,
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: `agent-error-${Date.now()}`,
        role: 'assistant',
        content: "I encountered an issue while processing your request. This might be a temporary problem with one of my data sources.\n\nYou can try:\n• **Be more specific** — e.g., \"Research Stripe\"\n• **Ask a different question** — I can help with company research, person search, ICP building, lead scoring, and outreach\n• **Try again** — the issue may be temporary",
        timestamp: new Date().toISOString(),
        persona: 'navigator',
        thinking: {
          persona: 'navigator',
          intent: 'converse',
          reasoning: `Error handler: ${msg.slice(0, 80)}`,
          plan: ['Error recovery'],
          confidence: 0.3,
        },
        actions: [],
      },
      updatedContext: requestContext || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
      suggestedActions: [
        { label: 'Try Again', prompt: requestMessage || '', icon: 'RefreshCw' },
        { label: 'Help', prompt: 'What can you do?', icon: 'Lightbulb' },
      ],
    });
  }
}
