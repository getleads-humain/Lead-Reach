import { NextResponse } from 'next/server';
import { getWorkforceAgent, recalculateAgentHealth } from '@/lib/workforce/engine';

/**
 * POST /api/workforce/[id]/health — Recalculate health for a specific agent
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getWorkforceAgent(id);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${id}` },
        { status: 404 }
      );
    }

    const result = await recalculateAgentHealth(agent.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Health recalculation returned no result' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      agentId: agent.id,
      healthScore: result.healthScore,
      health: result.health,
    });
  } catch (error) {
    console.error('[Workforce API] Error recalculating health:', error);
    const message = error instanceof Error ? error.message : 'Failed to recalculate agent health';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
