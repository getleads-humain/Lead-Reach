/**
 * /api/exa/status — Exa Search configuration status
 *
 * Returns whether Exa Search is configured and which backend will be used
 * when exaSearch() is called. Designed to be surfaced in the Agent Reach
 * admin UI so operators can see at a glance whether semantic search is live.
 *
 * Response shape:
 *   {
 *     ok: true,
 *     configured: boolean,
 *     backend: 'exa-api' | 'fallback',   // 'exa-api' when EXA_API_KEY set
 *     capabilities: string[],             // human-readable list of capabilities
 *     note?: string                       // helpful note when not configured
 *   }
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { isExaConfigured } from '@/lib/env';

export async function GET() {
  try {
    const configured = isExaConfigured();
    return Response.json({
      ok: true,
      configured,
      backend: configured ? 'exa-api' : 'fallback',
      capabilities: configured
        ? [
            'Neural/semantic web search (auto/keyword/neural/fast/deep)',
            'Category filters: company, people, news, github, linkedin profile, research paper, pdf',
            'Content retrieval: full text, highlights, AI summaries',
            'Domain filtering: include/exclude specific domains',
            'Date filtering: by crawl date and published date',
            'Subpage crawling and findSimilar',
            'Structured outputs with grounding citations (outputSchema)',
            'Used by: Prospect Discovery, Data Enrichment, Web Research, Lead Qualification, Outreach Composer',
          ]
        : [
            'DuckDuckGo HTML (direct)',
            'DuckDuckGo via Jina Reader',
            'z-ai-web-dev-sdk web_search',
            'mcporter Exa (if installed)',
            'Jina Search API (if key set)',
          ],
      note: configured
        ? undefined
        : 'EXA_API_KEY not set. Set it in .env to enable semantic web search. Get a key at https://dashboard.exa.ai/api-keys',
    }, { status: 200 });
  } catch (err) {
    console.error('[/api/exa/status] Error:', err);
    return Response.json(
      { ok: false, error: 'Failed to fetch Exa status' },
      { status: 500 }
    );
  }
}
