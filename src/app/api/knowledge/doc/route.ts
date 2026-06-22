/**
 * /api/knowledge/doc — Read a single knowledge doc
 *
 * Query params:
 *   path — relative path within /knowledge (e.g., "industries/saas-b2b.md")
 *
 * Returns the raw content (Markdown or JSONL) of the doc.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getKnowledgeIndex } from '@/lib/knowledge';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filePath = url.searchParams.get('path')?.trim();

    if (!filePath) {
      return Response.json(
        { ok: false, error: 'Missing required query parameter: path' },
        { status: 400 }
      );
    }

    const index = getKnowledgeIndex();
    const content = index.readRaw(filePath);
    if (content === null) {
      return Response.json(
        { ok: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      path: filePath,
      content,
      size: content.length,
    }, { status: 200 });
  } catch (err) {
    console.error('[/api/knowledge/doc] Error:', err);
    return Response.json(
      { ok: false, error: 'Failed to read doc' },
      { status: 500 }
    );
  }
}
