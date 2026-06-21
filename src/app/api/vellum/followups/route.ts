/**
 * /api/vellum/followups — Follow-Up Management
 *
 * GET:    List follow-ups (with optional status filter)
 * POST:   Create a follow-up
 * PUT:    Resolve a follow-up
 * DELETE: Cancel a follow-up
 */

import { NextRequest } from 'next/server';
import {
  listFollowUps,
  createFollowUp,
  resolveFollowUp,
  cancelFollowUp,
  getFollowUpStats,
  checkOverdue,
} from '@/lib/vellum-core/proactivity';
import type { FollowUp, FollowUpStatus } from '@/lib/vellum-core/proactivity';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/vellum/followups?scopeId=xxx&status=pending
 *
 * List follow-ups, optionally filtered by scope and status.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeId = searchParams.get('scopeId') || undefined;
    const status = searchParams.get('status') as FollowUpStatus | null;
    const includeStats = searchParams.get('includeStats') === 'true';

    // Check for overdue follow-ups first
    await checkOverdue();

    const followUps = listFollowUps(
      scopeId,
      status ? status : undefined,
    );

    const response: Record<string, unknown> = {
      success: true,
      followUps,
      total: followUps.length,
    };

    if (includeStats) {
      response.stats = getFollowUpStats(scopeId);
    }

    return Response.json(response, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[VellumFollowups] GET error:', error);
    return Response.json(
      { error: 'Failed to list follow-ups', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * POST /api/vellum/followups
 *
 * Create a new follow-up.
 * Body: { title, description?, dueAt?, channelId?, scopeId, conversationId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, dueAt, channelId, scopeId, conversationId } = body as {
      title: string;
      description?: string;
      dueAt?: number;
      channelId?: string;
      scopeId: string;
      conversationId?: string;
    };

    if (!title || !scopeId) {
      return Response.json(
        { error: 'title and scopeId are required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const followUp: FollowUp = {
      id: `followup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description,
      dueAt,
      channelId,
      conversationId,
      scopeId,
      status: 'pending',
      createdAt: Date.now(),
    };

    await createFollowUp(followUp);

    return Response.json(
      { success: true, followUp },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumFollowups] POST error:', error);
    return Response.json(
      { error: 'Failed to create follow-up', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * PUT /api/vellum/followups
 *
 * Resolve a follow-up.
 * Body: { id, action: 'resolve' }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body as { id: string; action: 'resolve' };

    if (!id) {
      return Response.json(
        { error: 'id is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (action === 'resolve') {
      await resolveFollowUp(id);
      return Response.json(
        { success: true, message: `Follow-up ${id} resolved` },
        { headers: CORS_HEADERS },
      );
    }

    return Response.json(
      { error: `Unknown action: ${action}. Valid action: resolve` },
      { status: 400, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumFollowups] PUT error:', error);
    return Response.json(
      { error: 'Failed to resolve follow-up', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * DELETE /api/vellum/followups?id=xxx
 *
 * Cancel a follow-up by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'id query parameter is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    cancelFollowUp(id);

    return Response.json(
      { success: true, cancelled: id },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumFollowups] DELETE error:', error);
    return Response.json(
      { error: 'Failed to cancel follow-up', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
