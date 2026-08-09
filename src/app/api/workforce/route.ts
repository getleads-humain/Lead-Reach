import { NextRequest, NextResponse } from 'next/server';
import {
  listWorkforceAgents,
  seedWorkforceAgents,
  createWorkforceAgentFromDefinition,
} from '@/lib/workforce/engine';
import type { WorkforceAgentDefinition } from '@/lib/workforce/definitions';

/**
 * GET /api/workforce — List all workforce agents with stats
 */
export async function GET() {
  try {
    const agents = await listWorkforceAgents(true);
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('[Workforce API] Error listing agents:', error);
    return NextResponse.json(
      { error: 'Failed to list workforce agents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workforce — Seed all agents or create a single agent
 * Body: { action: 'seed' } | { agent: WorkforceAgentDefinition }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'seed') {
      const results = await seedWorkforceAgents();
      return NextResponse.json({ seeded: results }, { status: 201 });
    }

    if (body.agent) {
      const agent = await createWorkforceAgentFromDefinition(
        body.agent as WorkforceAgentDefinition
      );
      return NextResponse.json({ agent }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide { action: "seed" } or { agent: WorkforceAgentDefinition }' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Workforce API] Error creating/seeding agents:', error);
    const message = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
