import { NextRequest, NextResponse } from 'next/server';
import { getTrainingStatus, trainAgentOnce, trainAllOnce, TRAINING_CURRICULUM, CURRICULUM_TOTAL } from '@/lib/workforce/training';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * GET /api/workforce/train — Training status for the whole fleet
 * (curriculum size, learned units, last trained time, learned topics).
 */
export async function GET() {
  try {
    const status = await getTrainingStatus();
    const totalLearned = status.reduce((s, a) => s + a.learned, 0);
    const totalCurriculum = status.reduce((s, a) => s + a.curriculumTotal, 0) || CURRICULUM_TOTAL;
    return NextResponse.json({
      status,
      totals: {
        curriculum: totalCurriculum,
        learned: totalLearned,
        percent: totalCurriculum > 0 ? Math.round((totalLearned / totalCurriculum) * 100) : 0,
      },
      curriculumPreview: Object.fromEntries(
        Object.entries(TRAINING_CURRICULUM).map(([slug, topics]) => [slug, topics.map(t => ({ id: t.id, title: t.title }))] )
      ),
    });
  } catch (error) {
    console.error('[Workforce Train API] GET error:', error);
    return NextResponse.json({ error: 'Failed to load training status' }, { status: 500 });
  }
}

/**
 * POST /api/workforce/train
 * Body: { slug?: string } — train one agent on its next curriculum unit,
 * or omit slug to train every agent once (round-robin).
 * The training is REAL: live web search + page reads + distilled, cited
 * knowledge docs + training-record logs.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body?.slug === 'string' ? body.slug : null;

    if (slug) {
      const result = await trainAgentOnce(slug);
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    }

    const results = await trainAllOnce();
    const okCount = results.filter(r => r.ok).length;
    return NextResponse.json({
      trained: results,
      okCount,
      total: results.length,
      summary: `Trained ${okCount}/${results.length} agents on their next curriculum unit from live web sources.`,
    });
  } catch (error) {
    console.error('[Workforce Train API] POST error:', error);
    const message = error instanceof Error ? error.message : 'Training failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
