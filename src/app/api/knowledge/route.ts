// ============================================================
// Knowledge Base API Endpoint
// ============================================================
// GET /api/knowledge?action=stats
//   Returns knowledge base statistics
//
// GET /api/knowledge?action=search&q=<query>&agent=<agent>&topK=<n>
//   Searches the knowledge base and returns matching documents
//
// GET /api/knowledge?action=list&category=<category>
//   Lists all knowledge documents, optionally filtered by category
//
// GET /api/knowledge?action=document&slug=<slug>
//   Returns a single knowledge document by slug
//
// POST /api/knowledge { action: "reload" }
//   Clears the cache and re-indexes (admin only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  retrieveKnowledge,
  getKnowledgeStats,
  listAllKnowledge,
  listKnowledgeByCategory,
  getKnowledgeBySlug,
  clearKnowledgeCache,
  formatRetrievedKnowledge,
  type KnowledgeCategory,
} from '@/lib/knowledge/loader';
import { retrieveKnowledgeSemantic } from '@/lib/knowledge/semantic';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// GET handler
// ============================================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'stats';

  try {
    switch (action) {
      case 'stats':
        return NextResponse.json({
          ok: true,
          stats: getKnowledgeStats(),
        });

      case 'search': {
        const q = searchParams.get('q') || '';
        const agent = searchParams.get('agent') || undefined;
        const category = searchParams.get('category') as KnowledgeCategory | null;
        const topK = parseInt(searchParams.get('topK') || '5', 10);
        const maxTokens = parseInt(searchParams.get('maxTokens') || '4000', 10);
        const minScore = parseFloat(searchParams.get('minScore') || '0.05');
        const semantic = searchParams.get('semantic') !== 'false'; // default true

        if (!q) {
          return NextResponse.json(
            { ok: false, error: 'Missing q parameter' },
            { status: 400 }
          );
        }

        // Use semantic retrieval by default (falls back to TF-IDF if unavailable)
        const results = semantic
          ? await retrieveKnowledgeSemantic({
              query: q,
              agent,
              category: category || undefined,
              topK,
              maxTokens,
              minScore,
              semantic: true,
            })
          : retrieveKnowledge({
              query: q,
              agent,
              category: category || undefined,
              topK,
              maxTokens,
              minScore,
            });

        return NextResponse.json({
          ok: true,
          query: q,
          agent,
          category,
          semantic,
          results: results.map((r) => ({
            title: r.document.title,
            slug: r.document.slug,
            category: r.document.category,
            score: r.score,
            matchedOn: r.matchedOn,
            tokens: r.includedTokens,
            priority: r.document.priority,
            path: r.document.relativePath,
            preview: r.document.body.slice(0, 300) + (r.document.body.length > 300 ? '...' : ''),
            // Semantic-only fields (undefined if TF-IDF only)
            semanticScore: (r as any).semanticScore,
            tfidfScore: (r as any).tfidfScore,
          })),
          formatted: formatRetrievedKnowledge(results as any, { includeMetadata: true, includeBody: true }),
        });
      }

      case 'list': {
        const category = searchParams.get('category') as KnowledgeCategory | null;
        const docs = category ? listKnowledgeByCategory(category) : listAllKnowledge();
        return NextResponse.json({
          ok: true,
          count: docs.length,
          documents: docs.map((d) => ({
            title: d.title,
            slug: d.slug,
            category: d.category,
            tags: d.tags,
            agents: d.agents,
            industries: d.industries,
            regions: d.regions,
            intent_types: d.intent_types,
            priority: d.priority,
            version: d.version,
            updated: d.updated,
            summary: d.summary,
            wordCount: d.wordCount,
            tokenEstimate: d.tokenEstimate,
            path: d.relativePath,
          })),
        });
      }

      case 'document': {
        const slug = searchParams.get('slug');
        if (!slug) {
          return NextResponse.json(
            { ok: false, error: 'Missing slug parameter' },
            { status: 400 }
          );
        }
        const doc = getKnowledgeBySlug(slug);
        if (!doc) {
          return NextResponse.json(
            { ok: false, error: `Document not found: ${slug}` },
            { status: 404 }
          );
        }
        return NextResponse.json({
          ok: true,
          document: {
            title: doc.title,
            slug: doc.slug,
            category: doc.category,
            tags: doc.tags,
            agents: doc.agents,
            industries: doc.industries,
            regions: doc.regions,
            intent_types: doc.intent_types,
            priority: doc.priority,
            version: doc.version,
            updated: doc.updated,
            summary: doc.summary,
            author: doc.author,
            wordCount: doc.wordCount,
            tokenEstimate: doc.tokenEstimate,
            path: doc.relativePath,
            body: doc.body,
          },
        });
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('[api/knowledge] Error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST handler — reload cache (admin only)
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'reload') {
      clearKnowledgeCache();
      const stats = getKnowledgeStats();
      return NextResponse.json({
        ok: true,
        message: 'Knowledge base cache cleared and re-indexed',
        stats,
      });
    }
    return NextResponse.json(
      { ok: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[api/knowledge] POST error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
