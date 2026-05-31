import { NextRequest, NextResponse } from 'next/server';
import { processAgentMessage } from '@/lib/prospect-agent/agent';
import type { ConversationContext, UserIntent } from '@/lib/prospect-agent/types';

// Set max duration for this API route to 5 minutes (production)
export const maxDuration = 300;

/**
 * Maximum time the agent pipeline is allowed to run before we return
 * a partial/graceful response.  Kept well under typical reverse-proxy
 * timeouts (60-120s) so the client always receives a JSON response.
 *
 * Increased from 55s to 90s because the research pipeline makes
 * multiple sequential LLM and web-search calls that can legitimately
 * take 60-90 seconds for complex queries.
 */
const PIPELINE_TIMEOUT_MS = 90_000; // 90 seconds

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
          console.warn('[AgentChat] Pipeline timed out after 90s — returning partial response');
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
      || msg.includes('访问量过大')
    );

    // IMPORTANT: Always return HTTP 200 with the message.
    // Returning 503/502 causes the reverse proxy to return its own error page,
    // which the frontend can't parse as JSON — leading to the "HTTP 502" user error.
    if (isRateLimitError) {
      // Rate limit — give specific guidance
      return NextResponse.json({
        success: true, // Return success so the UI can display the message
        message: {
          id: `agent-rate-${Date.now()}`,
          role: 'assistant',
          content: "The AI service is currently experiencing high demand. Your request was received but couldn't be fully processed right now. Please wait about 10 seconds and try again — your message will be processed freshly.\n\n**Tip:** If you're making a complex query (like \"Find accounting firms in Dubai\"), try a simpler version first (like \"Research Deloitte\") to get faster results.",
          timestamp: new Date().toISOString(),
          persona: 'navigator',
          thinking: {
            persona: 'navigator',
            intent: 'converse',
            reasoning: 'AI service rate limited — user should wait and retry',
            plan: ['Wait 10 seconds', 'Retry the same or a simpler query'],
            confidence: 0.3,
          },
          actions: [{ type: 'converse', label: 'Rate Limited', status: 'failed', message: 'AI service busy — try again shortly' }],
        },
        updatedContext: context || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
        suggestedActions: [
          { label: 'Try Again', prompt: message?.trim() || 'Hello', icon: 'RefreshCw' },
          { label: 'Help', prompt: 'What can you do?', icon: 'Lightbulb' },
        ],
        retryable: true,
      });
    }

    if (isHtmlOrGatewayError) {
      // Gateway error — different message
      return NextResponse.json({
        success: true,
        message: {
          id: `agent-gateway-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting to the AI service right now. The servers may be temporarily overloaded. Please try again in a few seconds — your message will be processed freshly.",
          timestamp: new Date().toISOString(),
          persona: 'navigator',
          thinking: {
            persona: 'navigator',
            intent: 'converse',
            reasoning: 'AI service gateway error — retryable',
            plan: ['Retry in a few seconds'],
            confidence: 0.3,
          },
          actions: [{ type: 'converse', label: 'Retry', status: 'failed', message: 'AI service busy' }],
        },
        updatedContext: context || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
        suggestedActions: [
          { label: 'Try Again', prompt: message?.trim() || 'Hello', icon: 'RefreshCw' },
          { label: 'Help', prompt: 'What can you do?', icon: 'Lightbulb' },
        ],
        retryable: true,
      });
    }

    // For non-gateway errors, still return 200 with error info
    return NextResponse.json({
      success: true,
      message: {
        id: `agent-error-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error processing your request. Please try again or rephrase your question.`,
        timestamp: new Date().toISOString(),
        persona: 'navigator',
        thinking: {
          persona: 'navigator',
          intent: 'converse',
          reasoning: `Error: ${msg.slice(0, 100)}`,
          plan: ['Error recovery'],
          confidence: 0.1,
        },
        actions: [{ type: 'converse', label: 'Error', status: 'failed', message: msg.slice(0, 100) }],
      },
      updatedContext: context || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
      suggestedActions: [
        { label: 'Try Again', prompt: message?.trim() || 'Hello', icon: 'RefreshCw' },
        { label: 'Help', prompt: 'What can you do?', icon: 'Lightbulb' },
      ],
    });
  }
}
