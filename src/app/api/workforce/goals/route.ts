import { NextRequest, NextResponse } from 'next/server';
import { assignGoal, listGoals } from '@/lib/workforce/goals';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * GET /api/workforce/goals — All user-assigned goals with live
 * per-task progress (queued → research → content → memo → done).
 */
export async function GET() {
  try {
    const goals = await listGoals();
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('[Workforce Goals API] GET error:', error);
    return NextResponse.json({ error: 'Failed to load goals' }, { status: 500 });
  }
}

/**
 * POST /api/workforce/goals
 * Body: { title: string, detail?: string }
 * Assigns a goal to the AI team. The workforce instantly decomposes it
 * into real sub-tasks (research → angle/content/checks → decision memo),
 * assigns the right AI employees, and starts executing (goals run first
 * in every ops cycle).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const detail = typeof body?.detail === 'string' ? body.detail.trim() : null;

    if (!title) {
      return NextResponse.json({ error: 'Goal title is required' }, { status: 400 });
    }

    const goal = await assignGoal(title, detail);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('[Workforce Goals API] POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to assign goal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
