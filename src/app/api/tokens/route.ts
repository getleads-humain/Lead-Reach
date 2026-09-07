import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/tokens — List all platform tokens
 * Query: ?category=api&subcategory=workforce&status=active&limit=100&page=1&search=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const status = searchParams.get('status');
    const owner = searchParams.get('owner');
    const search = searchParams.get('search');
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (status) where.status = status;
    if (owner) where.owner = owner;
    if (search) {
      where.OR = [
        { tokenKey: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [tokens, total] = await Promise.all([
      db.platformToken.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { audits: true } } },
      }),
      db.platformToken.count({ where }),
    ]);

    // Get category breakdown
    const categoryBreakdown = await db.platformToken.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
    });

    return NextResponse.json({
      tokens,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      categoryBreakdown: Object.fromEntries(categoryBreakdown.map(c => [c.category, c._count])),
    });
  } catch (error) {
    console.error('[Tokens API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}

/**
 * POST /api/tokens — Create or scan tokens
 * Body: { action: 'scan' } to run the tokenizer
 *       { tokenKey, name, category, ... } to create a single token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Action: Scan codebase ──
    if (body.action === 'scan') {
      const { tokenizeCodebase } = await import('@/lib/tokenizer');
      const result = await tokenizeCodebase();
      return NextResponse.json({ success: true, ...result }, { status: 201 });
    }

    // ── Create single token ──
    if (body.tokenKey) {
      const existing = await db.platformToken.findUnique({ where: { tokenKey: body.tokenKey } });
      if (existing) {
        return NextResponse.json({ error: 'Token already exists', token: existing }, { status: 409 });
      }

      const token = await db.platformToken.create({
        data: {
          tokenKey: body.tokenKey,
          name: body.name,
          category: body.category,
          subcategory: body.subcategory || null,
          description: body.description || null,
          filePath: body.filePath || null,
          route: body.route || null,
          prismaModel: body.prismaModel || null,
          tags: body.tags ? JSON.stringify(body.tags) : null,
          businessValue: body.businessValue || null,
          owner: body.owner || null,
          priority: body.priority || 'normal',
        },
      });

      await db.platformTokenAudit.create({
        data: {
          tokenId: token.id,
          action: 'created',
          description: `Token created manually: ${body.tokenKey}`,
          changedBy: body.changedBy || 'user',
          version: 1,
        },
      });

      return NextResponse.json({ token }, { status: 201 });
    }

    return NextResponse.json({ error: 'Provide { action: "scan" } or { tokenKey, name, category, ... }' }, { status: 400 });
  } catch (error) {
    console.error('[Tokens API] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

/**
 * PATCH /api/tokens — Update a token
 * Body: { tokenKey, ...fieldsToUpdate, changedBy? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenKey, changedBy, ...updates } = body;

    if (!tokenKey) {
      return NextResponse.json({ error: 'tokenKey is required' }, { status: 400 });
    }

    const existing = await db.platformToken.findUnique({ where: { tokenKey } });
    if (!existing) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = { version: { increment: 1 } };
    const changedFields: string[] = [];

    for (const [field, value] of Object.entries(updates)) {
      if (field === 'tags' && Array.isArray(value)) {
        updateData[field] = JSON.stringify(value);
        changedFields.push(field);
      } else if (existing[field as keyof typeof existing] !== value && value !== undefined) {
        updateData[field] = value;
        changedFields.push(field);
      }
    }

    if (changedFields.length === 0) {
      return NextResponse.json({ token: existing, message: 'No changes detected' });
    }

    const updated = await db.platformToken.update({
      where: { tokenKey },
      data: updateData,
    });

    // Create audit entry
    await db.platformTokenAudit.create({
      data: {
        tokenId: updated.id,
        action: 'updated',
        fieldChanged: changedFields.join(', '),
        description: `Updated fields: ${changedFields.join(', ')}`,
        changedBy: changedBy || 'user',
        version: updated.version,
      },
    });

    return NextResponse.json({ token: updated });
  } catch (error) {
    console.error('[Tokens API] Error updating:', error);
    return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
  }
}
