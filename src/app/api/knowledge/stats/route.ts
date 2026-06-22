/**
 * /api/knowledge/stats — Knowledge base statistics
 *
 * Returns aggregated stats: total docs, chunks, by category, by grade, freshness.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getKnowledgeIndex } from '@/lib/knowledge';

export async function GET() {
  try {
    const index = getKnowledgeIndex();
    const stats = index.stats();
    return Response.json({ ok: true, stats }, { status: 200 });
  } catch (err) {
    console.error('[/api/knowledge/stats] Error:', err);
    return Response.json(
      { ok: false, error: 'Failed to load knowledge stats' },
      { status: 500 }
    );
  }
}
