import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getWorkforceAgent,
  createWorkforceSession,
  addMessageToSession,
  retrieveContextForAgent,
} from '@/lib/workforce/engine';

/**
 * POST /api/workforce/[id]/chat — Chat with a workforce agent
 * Body: { message, sessionId? }
 *
 * Creates or continues a session, adds the user message, and returns
 * the session along with RAG context so the client can make the LLM call.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getWorkforceAgent(id);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${id}` },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Use existing session or create a new one
    let session;
    if (sessionId) {
      session = await db.workforceSession.findUnique({ where: { id: sessionId } });
      if (!session || session.agentId !== agent.id) {
        return NextResponse.json(
          { error: 'Session not found or does not belong to this agent' },
          { status: 404 }
        );
      }
    } else {
      session = await createWorkforceSession(agent.id, `Chat with ${agent.name}`);
    }

    // Add user message to session
    await addMessageToSession(session.id, 'user', message.trim());

    // Retrieve RAG context for the agent
    let ragContext = '';
    try {
      ragContext = await retrieveContextForAgent(agent.slug, message.trim());
    } catch (err) {
      console.warn('[Workforce Chat] RAG retrieval failed, continuing without context:', err);
    }

    // Parse existing messages for conversation history
    const sessionWithMessages = await db.workforceSession.findUnique({
      where: { id: session.id },
    });
    const messages = sessionWithMessages?.messages
      ? JSON.parse(sessionWithMessages.messages)
      : [];

    // Return session info + context for client-side LLM call
    return NextResponse.json({
      sessionId: session.id,
      agent: {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        systemPrompt: agent.systemPrompt,
      },
      ragContext,
      messages,
    });
  } catch (error) {
    console.error('[Workforce API] Error in chat:', error);
    const message = error instanceof Error ? error.message : 'Failed to process chat';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
