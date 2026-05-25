import { NextRequest, NextResponse } from 'next/server';
import { processAgentMessage } from '@/lib/prospect-agent/agent';
import type { ConversationContext, UserIntent } from '@/lib/prospect-agent/types';

// Set max duration for this API route to 5 minutes (production)
export const maxDuration = 300;

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

    // Process the message through the agent pipeline
    const result = await processAgentMessage(
      message.trim(),
      context,
      forceIntent,
    );

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
    );

    if (isHtmlOrGatewayError) {
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
