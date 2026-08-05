/**
 * /api/connectors/[id]/toggle — Enable/disable connector
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logConnectorEvent } from '@/lib/connectors/engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connector = await db.connector.findUnique({ where: { id } });

    if (!connector) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const newEnabled = !connector.enabled;

    await db.connector.update({
      where: { id },
      data: {
        enabled: newEnabled,
        status: newEnabled ? 'disconnected' : 'disconnected',
        healthStatus: newEnabled ? connector.healthStatus : 'unknown',
      },
    });

    await logConnectorEvent({
      connectorId: id,
      eventType: newEnabled ? 'enable' : 'disable',
      severity: 'info',
      message: `Connector ${newEnabled ? 'enabled' : 'disabled'}`,
      source: 'user',
    });

    return NextResponse.json({ success: true, enabled: newEnabled });
  } catch (error) {
    console.error('[Connectors API] Toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle connector' }, { status: 500 });
  }
}
