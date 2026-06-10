// ============================================================
// Chat Session Storage API
// ============================================================
// Persists Prospect Discovery chat sessions and messages
// for logged-in users. Falls back gracefully for anonymous users.

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const maxDuration = 30;

/**
 * GET /api/prospect-discovery/sessions
 * List all sessions for a user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await prisma.discoverySession.findMany({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    return NextResponse.json({
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        context: JSON.parse(s.context || '{}'),
        messageCount: s.messageCount,
        lastIntent: s.lastIntent,
        lastPersona: s.lastPersona,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messages: s.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          persona: m.persona,
          intent: m.intent,
          thinking: m.thinking ? JSON.parse(m.thinking) : null,
          actions: m.actions ? JSON.parse(m.actions) : [],
          prospectData: m.prospectData ? JSON.parse(m.prospectData) : null,
          icpData: m.icpData ? JSON.parse(m.icpData) : null,
          outreachData: m.outreachData ? JSON.parse(m.outreachData) : null,
          marketData: m.marketData ? JSON.parse(m.marketData) : null,
          scoreData: m.scoreData ? JSON.parse(m.scoreData) : null,
          insights: m.insights ? JSON.parse(m.insights) : null,
          pipelineState: m.pipelineState ? JSON.parse(m.pipelineState) : null,
          thinkTimeMs: m.thinkTimeMs,
          converted: m.converted,
          leadId: m.leadId,
          createdAt: m.createdAt,
        })),
      })),
    });
  } catch (error) {
    console.error('[SessionsAPI] GET error:', error);
    return NextResponse.json({ sessions: [] });
  }
}

/**
 * POST /api/prospect-discovery/sessions
 * Create a new session or save a message to an existing session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || body.userId;

    if (!userId) {
      // Anonymous user — just acknowledge, don't persist
      return NextResponse.json({ success: true, persisted: false, reason: 'anonymous' });
    }

    // Create new session
    if (body.action === 'create_session') {
      const session = await prisma.discoverySession.create({
        data: {
          userId,
          title: body.title || 'New Discovery Session',
          context: JSON.stringify(body.context || {}),
        },
      });
      return NextResponse.json({ success: true, sessionId: session.id });
    }

    // Save a message to an existing session
    if (body.action === 'save_message' && body.sessionId && body.message) {
      const msg = body.message;

      // Upsert the session
      const session = await prisma.discoverySession.upsert({
        where: { id: body.sessionId },
        create: {
          id: body.sessionId,
          userId,
          title: body.title || 'Discovery Session',
          context: JSON.stringify(body.context || {}),
          messageCount: 1,
          lastIntent: msg.intent || null,
          lastPersona: msg.persona || null,
        },
        update: {
          messageCount: { increment: 1 },
          lastIntent: msg.intent || undefined,
          lastPersona: msg.persona || undefined,
          context: body.context ? JSON.stringify(body.context) : undefined,
          updatedAt: new Date(),
        },
      });

      // Create the message
      const savedMsg = await prisma.discoveryMessage.create({
        data: {
          sessionId: session.id,
          userId,
          role: msg.role || 'user',
          content: msg.content || '',
          persona: msg.persona || null,
          intent: msg.intent || null,
          thinking: msg.thinking ? JSON.stringify(msg.thinking) : null,
          actions: msg.actions ? JSON.stringify(msg.actions) : null,
          prospectData: msg.prospectData ? JSON.stringify(msg.prospectData) : null,
          icpData: msg.icpData ? JSON.stringify(msg.icpData) : null,
          outreachData: msg.outreachData ? JSON.stringify(msg.outreachData) : null,
          marketData: msg.marketData ? JSON.stringify(msg.marketData) : null,
          scoreData: msg.scoreData ? JSON.stringify(msg.scoreData) : null,
          insights: msg.insights ? JSON.stringify(msg.insights) : null,
          pipelineState: msg.pipelineState ? JSON.stringify(msg.pipelineState) : null,
          thinkTimeMs: msg.thinkTimeMs || null,
          converted: msg.converted || false,
          leadId: msg.leadId || null,
        },
      });

      return NextResponse.json({ success: true, messageId: savedMsg.id });
    }

    // Update session title
    if (body.action === 'update_session' && body.sessionId) {
      await prisma.discoverySession.update({
        where: { id: body.sessionId },
        data: {
          title: body.title || undefined,
          context: body.context ? JSON.stringify(body.context) : undefined,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[SessionsAPI] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/prospect-discovery/sessions
 * Delete a session
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id');

    if (!userId || !body.sessionId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete — mark as inactive
    await prisma.discoverySession.update({
      where: { id: body.sessionId, userId },
      data: { isActive: false, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SessionsAPI] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
  }
}
