/**
 * /api/connectors/[id]/events — Get connector event log
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const eventType = searchParams.get('eventType');

    const where: Record<string, unknown> = { connectorId: id };
    if (severity) where.severity = severity;
    if (eventType) where.eventType = eventType;

    const [events, total] = await Promise.all([
      db.connectorEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.connectorEvent.count({ where }),
    ]);

    return NextResponse.json({ events, total, limit, offset });
  } catch (error) {
    console.error('[Connectors API] Events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
