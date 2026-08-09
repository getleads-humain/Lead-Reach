import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkforceAgent, addWorkforceDocument } from '@/lib/workforce/engine';

/**
 * GET /api/workforce/[id]/documents — List documents for an agent
 * Query: ?category=sop&page=1&limit=20
 */
export async function GET(
  request: Request,
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { agentId: agent.id, isLatest: true };
    if (category) where.category = category;

    const [documents, total] = await Promise.all([
      db.workforceDocument.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          category: true,
          tags: true,
          sourceType: true,
          chunkCount: true,
          embeddingStatus: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.workforceDocument.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Workforce API] Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list workforce documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workforce/[id]/documents — Add a document for an agent
 * Body: { title, category, content, tags?, sourceType? }
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
    const { title, category, content, tags, sourceType } = body;

    if (!title || !category || !content) {
      return NextResponse.json(
        { error: 'title, category, and content are required' },
        { status: 400 }
      );
    }

    const document = await addWorkforceDocument({
      agentId: agent.id,
      title,
      category,
      content,
      tags,
      sourceType,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('[Workforce API] Error adding document:', error);
    const message = error instanceof Error ? error.message : 'Failed to add document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
