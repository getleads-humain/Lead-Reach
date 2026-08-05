/**
 * /api/connectors — CRUD + List for Custom Connectors
 * Full lifecycle: list, create, search, filter, health overview
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConnectorsHealthOverview } from '@/lib/connectors/engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const enabled = searchParams.get('enabled');
    const search = searchParams.get('search');
    const overview = searchParams.get('overview') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Health overview mode
    if (overview) {
      const healthOverview = await getConnectorsHealthOverview();
      return NextResponse.json(healthOverview);
    }

    // Build where clause
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (provider) where.provider = provider;
    if (enabled !== null && enabled !== undefined) where.enabled = enabled === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { provider: { contains: search } },
        { description: { contains: search } },
        { connectorKey: { contains: search } },
      ];
    }

    const [connectors, total] = await Promise.all([
      db.connector.findMany({
        where,
        include: {
          _count: { select: { events: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.connector.count({ where }),
    ]);

    return NextResponse.json({ connectors, total, limit, offset });
  } catch (error) {
    console.error('[Connectors API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch connectors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      connectorKey,
      type,
      provider,
      version,
      description,
      category,
      icon,
      color,
      documentationUrl,
      authType,
      endpoint,
      config,
      secrets,
      scopes,
      headers,
      autoReconnect,
      maxRetries,
      retryDelayMs,
      rateLimitPerMin,
      timeoutMs,
      webhookUrl,
      webhookSecret,
      eventSubscriptions,
      syncSchedule,
      syncIntervalMs,
      fieldMappings,
      dataTransform,
      inboundSchema,
      outboundSchema,
      tags,
      ownerId,
      environment,
      priority,
    } = body;

    // Validate required fields
    if (!name || !connectorKey || !type || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: name, connectorKey, type, provider' },
        { status: 400 }
      );
    }

    // Check for duplicate key
    const existing = await db.connector.findUnique({ where: { connectorKey } });
    if (existing) {
      return NextResponse.json(
        { error: `Connector key "${connectorKey}" already exists` },
        { status: 409 }
      );
    }

    const connector = await db.connector.create({
      data: {
        name,
        connectorKey,
        type,
        provider,
        version: version || '1.0.0',
        description: description || null,
        category: category || null,
        icon: icon || null,
        color: color || null,
        documentationUrl: documentationUrl || null,
        authType: authType || 'api_key',
        endpoint: endpoint || null,
        config: config ? JSON.stringify(config) : null,
        secrets: secrets ? JSON.stringify(secrets) : null,
        scopes: scopes ? JSON.stringify(scopes) : null,
        headers: headers ? JSON.stringify(headers) : null,
        autoReconnect: autoReconnect ?? true,
        maxRetries: maxRetries ?? 3,
        retryDelayMs: retryDelayMs ?? 1000,
        rateLimitPerMin: rateLimitPerMin ?? 60,
        timeoutMs: timeoutMs ?? 30000,
        webhookUrl: webhookUrl || null,
        webhookSecret: webhookSecret || null,
        eventSubscriptions: eventSubscriptions ? JSON.stringify(eventSubscriptions) : null,
        syncSchedule: syncSchedule || null,
        syncIntervalMs: syncIntervalMs || null,
        fieldMappings: fieldMappings ? JSON.stringify(fieldMappings) : null,
        dataTransform: dataTransform ? JSON.stringify(dataTransform) : null,
        inboundSchema: inboundSchema ? JSON.stringify(inboundSchema) : null,
        outboundSchema: outboundSchema ? JSON.stringify(outboundSchema) : null,
        tags: tags ? JSON.stringify(tags) : null,
        ownerId: ownerId || null,
        environment: environment || 'production',
        priority: priority || 'normal',
      },
    });

    // Log creation event
    await db.connectorEvent.create({
      data: {
        connectorId: connector.id,
        eventType: 'config_change',
        severity: 'info',
        message: `Connector "${name}" created`,
        source: 'user',
      },
    });

    return NextResponse.json(connector, { status: 201 });
  } catch (error) {
    console.error('[Connectors API] POST error:', error);
    return NextResponse.json({ error: 'Failed to create connector' }, { status: 500 });
  }
}
