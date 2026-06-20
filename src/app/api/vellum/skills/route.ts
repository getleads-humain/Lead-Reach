/**
 * GET /api/vellum/skills
 *
 * List all available skills with optional query search.
 * Returns: SkillSummary[]
 */

import { NextRequest } from 'next/server';
import { listAllSkills, searchSkills, invalidateCatalogCache } from '@/lib/vellum-core/skills';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/vellum/skills?q=search+query&refresh=true
 *
 * List all skills, optionally filtered by search query.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const refresh = searchParams.get('refresh') === 'true';

    // Optionally refresh the catalog cache
    if (refresh) {
      invalidateCatalogCache();
    }

    let skills;

    if (query && query.trim().length > 0) {
      // Search skills by query
      skills = await searchSkills(query.trim());
    } else {
      // List all skills
      skills = await listAllSkills();
    }

    return Response.json(
      {
        success: true,
        skills: skills.map(s => ({
          id: s.id,
          name: s.name,
          displayName: s.displayName,
          description: s.description,
          directoryPath: s.directoryPath,
          bundled: s.bundled,
          icon: s.icon,
          emoji: s.emoji,
          source: s.source,
          owner: s.owner,
          toolManifest: s.toolManifest ? {
            present: s.toolManifest.present,
            valid: s.toolManifest.valid,
            toolCount: s.toolManifest.toolCount,
            toolNames: s.toolManifest.toolNames,
          } : undefined,
          includes: s.includes,
          featureFlag: s.featureFlag,
          activationHints: s.activationHints,
          avoidWhen: s.avoidWhen,
        })),
        total: skills.length,
        query: query || null,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumSkills] GET error:', error);
    return Response.json(
      { error: 'Failed to list skills', details: error instanceof Error ? error.message : 'Unknown' },
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
