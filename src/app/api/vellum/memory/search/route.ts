/**
 * POST /api/vellum/memory/search
 *
 * Memory search using the hybrid retrieval pipeline.
 * Combines keyword matching with significance scoring.
 *
 * Body: { query: string, scopeId: string, limit?: number }
 * Returns: ScoredMemory[] from the retriever
 */

import { NextRequest } from 'next/server';
import { loadContextMemory } from '@/lib/vellum-core/memory';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * POST handler — search memories using hybrid retrieval.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, scopeId, limit } = body as {
      query: string;
      scopeId: string;
      limit?: number;
    };

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return Response.json(
        { error: 'query is required and must be a non-empty string' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (!scopeId || typeof scopeId !== 'string') {
      return Response.json(
        { error: 'scopeId is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const maxResults = Math.min(limit || 20, 100);

    const results = await loadContextMemory(scopeId, query.trim(), {
      maxResults,
      minScore: 0.1,
      significanceWeight: 0.3,
      confidenceWeight: 0.2,
      recencyWeight: 0.2,
      relevanceWeight: 0.3,
      recencyHalfLifeHours: 24,
    });

    return Response.json(
      {
        success: true,
        results: results.map(r => ({
          node: {
            id: r.node.id,
            content: r.node.content,
            type: r.node.type,
            fidelity: r.node.fidelity,
            confidence: r.node.confidence,
            significance: r.node.significance,
            stability: r.node.stability,
            scopeId: r.node.scopeId,
            sourceType: r.node.sourceType,
            createdAt: r.node.createdAt,
            updatedAt: r.node.updatedAt,
            lastAccessedAt: r.node.lastAccessedAt,
          },
          score: r.score,
          scoreBreakdown: r.scoreBreakdown,
        })),
        total: results.length,
        query: query.trim(),
        scopeId,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumMemorySearch] POST error:', error);
    return Response.json(
      { error: 'Failed to search memories', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
