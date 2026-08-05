/**
 * /api/connectors/[id] — Single connector CRUD + update
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connector = await db.connector.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!connector) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    return NextResponse.json(connector);
  } catch (error) {
    console.error('[Connectors API] GET [id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch connector' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check existence
    const existing = await db.connector.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    // Prevent editing managed connectors (except enable/disable)
    if (existing.isManaged && !('enabled' in body)) {
      return NextResponse.json({ error: 'Cannot modify platform-managed connector' }, { status: 403 });
    }

    // Build update data — only include fields that are present
    const updateData: Record<string, unknown> = {};
    const simpleFields = [
      'name', 'type', 'provider', 'version', 'description', 'category',
      'icon', 'color', 'documentationUrl', 'authType', 'endpoint',
      'webhookUrl', 'webhookSecret', 'syncSchedule', 'environment', 'priority',
    ];
    const jsonFields = [
      'config', 'secrets', 'scopes', 'headers', 'eventSubscriptions',
      'fieldMappings', 'dataTransform', 'inboundSchema', 'outboundSchema', 'tags',
    ];
    const numericFields = ['maxRetries', 'retryDelayMs', 'rateLimitPerMin', 'timeoutMs', 'syncIntervalMs'];
    const booleanFields = ['enabled', 'autoReconnect'];

    for (const field of simpleFields) {
      if (field in body) updateData[field] = body[field] ?? null;
    }
    for (const field of jsonFields) {
      if (field in body) updateData[field] = body[field] ? JSON.stringify(body[field]) : null;
    }
    for (const field of numericFields) {
      if (field in body) updateData[field] = body[field] ?? null;
    }
    for (const field of booleanFields) {
      if (field in body) updateData[field] = body[field];
    }

    // Handle connectorKey uniqueness check
    if ('connectorKey' in body && body.connectorKey !== existing.connectorKey) {
      const duplicate = await db.connector.findUnique({ where: { connectorKey: body.connectorKey } });
      if (duplicate) {
        return NextResponse.json({ error: `Connector key "${body.connectorKey}" already exists` }, { status: 409 });
      }
      updateData.connectorKey = body.connectorKey;
    }

    const connector = await db.connector.update({
      where: { id },
      data: updateData,
    });

    // Log update event
    await db.connectorEvent.create({
      data: {
        connectorId: id,
        eventType: 'config_change',
        severity: 'info',
        message: `Connector "${connector.name}" updated`,
        details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
        source: 'user',
      },
    });

    return NextResponse.json(connector);
  } catch (error) {
    console.error('[Connectors API] PATCH [id] error:', error);
    return NextResponse.json({ error: 'Failed to update connector' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.connector.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    if (existing.isManaged) {
      return NextResponse.json({ error: 'Cannot delete platform-managed connector' }, { status: 403 });
    }

    // Delete cascade (events will be auto-deleted)
    await db.connector.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Connector "${existing.name}" deleted` });
  } catch (error) {
    console.error('[Connectors API] DELETE [id] error:', error);
    return NextResponse.json({ error: 'Failed to delete connector' }, { status: 500 });
  }
}
