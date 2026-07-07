/**
 * GET /api/llm/key-pool
 * ======================
 * Returns the current status of the Z.AI API key pool.
 * Used by the frontend monitoring dashboard to display:
 *   - Number of active/healthy keys
 *   - Per-key health stats (429 count, success rate, cooldown)
 *   - Overall pool capacity
 */
import { NextResponse } from 'next/server';
import { getZhipuToken } from '@/lib/zhipu-jwt';

export async function GET() {
  try {
    const token = getZhipuToken();
    const status = { active: !!token, hasKey: !!token, poolSize: token ? 1 : 0 };
    return NextResponse.json(status);
  } catch (error) {
    console.error('[KeyPoolAPI] Error getting key pool status:', error);
    return NextResponse.json(
      { error: 'Failed to get key pool status' },
      { status: 500 }
    );
  }
}
