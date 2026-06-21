// ============================================================
// Knowledge Semantic Status & Prewarm API
// ============================================================
// GET /api/knowledge/semantic
//   Returns the semantic retrieval status (API configured, indexed
//   doc count, total doc count, ready flag, cache stats).
//
// POST /api/knowledge/semantic { action: "prewarm" }
//   Pre-warms the embeddings cache by embedding all knowledge docs.
//   Long-running operation (~2-3 min for 42 docs at 1 concurrent +
//   3.5s rate limit). Returns when complete.
//
// POST /api/knowledge/semantic { action: "clear" }
//   Clears the embeddings cache (admin operation).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getEmbeddingsCacheStats,
  prewarmEmbeddings,
  clearEmbeddingsCache,
} from '@/lib/knowledge/embeddings';
import { listAllKnowledge } from '@/lib/knowledge/loader';
import { getSemanticStatus, clearSemanticIndex } from '@/lib/knowledge/semantic';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min — prewarm can take a while

export async function GET() {
  try {
    const status = getSemanticStatus();
    const cacheStats = getEmbeddingsCacheStats();
    return NextResponse.json({
      ok: true,
      ...status,
      cache: cacheStats,
    });
  } catch (err) {
    console.error('[api/knowledge/semantic] GET error:', err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === 'prewarm') {
      const docs = listAllKnowledge();
      const result = await prewarmEmbeddings(
        docs.map((d) => ({ slug: d.slug, body: d.body })),
      );
      // Clear the in-memory semantic index so it rebuilds with fresh embeddings
      clearSemanticIndex();
      return NextResponse.json({
        ok: true,
        message: `Prewarm complete: ${result.embedded} embedded, ${result.cached} cached, ${result.failed} failed`,
        ...result,
        cacheStats: getEmbeddingsCacheStats(),
      });
    }

    if (body.action === 'clear') {
      clearEmbeddingsCache();
      clearSemanticIndex();
      return NextResponse.json({
        ok: true,
        message: 'Embeddings cache cleared',
        cacheStats: getEmbeddingsCacheStats(),
      });
    }

    return NextResponse.json({
      ok: false,
      error: `Unknown action: ${body.action}. Valid actions: prewarm, clear`,
    }, { status: 400 });
  } catch (err) {
    console.error('[api/knowledge/semantic] POST error:', err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
