import { NextResponse } from 'next/server';
import { getWorkforceHealthOverview } from '@/lib/workforce/engine';

/**
 * GET /api/workforce/health — Health overview for all workforce agents
 */
export async function GET() {
  try {
    const overview = await getWorkforceHealthOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error('[Workforce API] Error fetching health overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workforce health overview' },
      { status: 500 }
    );
  }
}
