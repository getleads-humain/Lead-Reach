/**
 * /api/knowledge/search — Hybrid BM25 + embeddings search
 *
 * Query params:
 *   q        — search query (required)
 *   topK     — number of results (default 10, max 50)
 *   category — filter by category (industry | region | playbook | tool | training-data | gap-report)
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { hybridSearch, type KnowledgeChunk } from '@/lib/knowledge';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const topK = Math.min(parseInt(url.searchParams.get('topK') || '10', 10) || 10, 50);
    const category = url.searchParams.get('category') as KnowledgeChunk['category'] | null;

    if (!q) {
      return Response.json(
        { ok: false, error: 'Missing required query parameter: q' },
        { status: 400 }
      );
    }

    const results = await hybridSearch(q, topK, category ?? undefined);
    return Response.json({
      ok: true,
      query: q,
      topK,
      category: category ?? null,
      results: results.map(r => ({
        chunkId: r.chunk.id,
        filePath: r.chunk.filePath,
        category: r.chunk.category,
        title: r.chunk.title,
        section: r.chunk.section,
        contentPreview: r.chunk.content.slice(0, 300) + (r.chunk.content.length > 300 ? '...' : ''),
        score: r.score,
        matchedTokens: r.matchedTokens,
        retrievalMethod: r.retrievalMethod,
        grade: r.chunk.grade,
        lastReviewed: r.chunk.lastReviewed,
        tags: r.chunk.tags,
      })),
    }, { status: 200 });
  } catch (err) {
    console.error('[/api/knowledge/search] Error:', err);
    return Response.json(
      { ok: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
