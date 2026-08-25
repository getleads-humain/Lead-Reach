import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkforceAgent } from '@/lib/workforce/engine';
import { logAgentActivity } from '@/lib/workforce/logger';

/**
 * GET /api/workforce/[id]/messages — List chat messages for an agent
 * Query: ?limit=50&since=ISO8601&role=user|assistant|system|agent_comm
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getWorkforceAgent(id);
    if (!agent) {
      return NextResponse.json({ error: `Agent not found: ${id}` }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const since = searchParams.get('since');
    const role = searchParams.get('role');

    const where: Record<string, unknown> = { agentId: agent.id };
    if (since) {
      where.createdAt = { gt: new Date(since) };
    }
    if (role) {
      where.role = role;
    }

    const messages = await db.workforceChatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      messages: messages.reverse(),
      count: messages.length,
    });
  } catch (error) {
    console.error('[Workforce API] Error listing messages:', error);
    return NextResponse.json({ error: 'Failed to list messages' }, { status: 500 });
  }
}

/**
 * POST /api/workforce/[id]/messages — Create a chat message
 * Body: { role, content, fromAgent?, toAgent?, messageType?, metadata? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getWorkforceAgent(id);
    if (!agent) {
      return NextResponse.json({ error: `Agent not found: ${id}` }, { status: 404 });
    }

    const body = await request.json();
    const { role, content, fromAgent, toAgent, messageType, metadata } = body;

    if (!role || !content) {
      return NextResponse.json({ error: 'role and content are required' }, { status: 400 });
    }

    const message = await db.workforceChatMessage.create({
      data: {
        agentId: agent.id,
        role,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        fromAgent: fromAgent || null,
        toAgent: toAgent || null,
        messageType: messageType || 'text',
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Also log this as a chat activity
    await logAgentActivity(agent.id, {
      category: 'chat',
      action: `sent_${role}_message`,
      description: `${agent.name} ${role === 'user' ? 'received' : 'sent'} message: ${typeof content === 'string' ? content.slice(0, 100) : '[structured data]'}`,
      level: 'info',
      details: JSON.stringify({ messageId: message.id, role, messageType: messageType || 'text' }),
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('[Workforce API] Error creating message:', error);
    const message = error instanceof Error ? error.message : 'Failed to create message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
