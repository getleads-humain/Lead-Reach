/**
 * /api/knowledge/list — List all knowledge docs
 *
 * Returns a flat list of files in the knowledge base with metadata
 * (path, category, title, grade, lastReviewed, tags).
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getKnowledgeIndex } from '@/lib/knowledge';

export async function GET() {
  try {
    const index = getKnowledgeIndex();
    const files = index.listFiles();
    return Response.json({ ok: true, files, total: files.length }, { status: 200 });
  } catch (err) {
    console.error('[/api/knowledge/list] Error:', err);
    return Response.json(
      { ok: false, error: 'Failed to list knowledge files' },
      { status: 500 }
    );
  }
}
