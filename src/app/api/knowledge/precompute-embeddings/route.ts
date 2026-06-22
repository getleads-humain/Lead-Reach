/**
 * /api/knowledge/precompute-embeddings — Pre-compute knowledge base embeddings
 *
 * POST — Walks the knowledge base, batches chunk contents through the Z.AI
 *   embedding-3 API, and persists results to .knowledge-embeddings.cache.json.
 *
 * Returns:
 *   {
 *     ok: true,
 *     result: { total, generated, cached, failed }
 *   }
 *
 * Requires USE_KNOWLEDGE_EMBEDDINGS=true and ZHIPU_API_KEY in env.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;  // 5 minutes — long enough for ~250 chunks

import { getKnowledgeIndex } from '@/lib/knowledge';
import { isKnowledgeEmbeddingsEnabled } from '@/lib/env';

export async function POST() {
  try {
    if (!isKnowledgeEmbeddingsEnabled()) {
      return Response.json(
        {
          ok: false,
          error: 'USE_KNOWLEDGE_EMBEDDINGS is not true. Set it in .env to enable.',
        },
        { status: 400 }
      );
    }
    if (!process.env.ZHIPU_API_KEY) {
      return Response.json(
        {
          ok: false,
          error: 'ZHIPU_API_KEY is not set. Required for embedding-3 API.',
        },
        { status: 400 }
      );
    }

    const index = getKnowledgeIndex();
    index.load(true);
    const result = await index.precomputeEmbeddings();

    return Response.json({
      ok: true,
      result,
    }, { status: 200 });
  } catch (err) {
    console.error('[/api/knowledge/precompute-embeddings] Error:', err);
    return Response.json(
      { ok: false, error: 'Failed to pre-compute embeddings' },
      { status: 500 }
    );
  }
}

/**
 * GET — returns current embeddings coverage stats (no computation).
 */
export async function GET() {
  try {
    const index = getKnowledgeIndex();
    index.load();
    const coverage = index.embeddingsCoverage();
    return Response.json({
      ok: true,
      enabled: index.isEmbeddingsEnabled(),
      ...coverage,
    }, { status: 200 });
  } catch (err) {
    console.error('[/api/knowledge/precompute-embeddings GET] Error:', err);
    return Response.json(
      { ok: false, error: 'Failed to fetch embeddings coverage' },
      { status: 500 }
    );
  }
}
