import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  listWorkforceAgents,
  seedWorkforceAgents,
  createWorkforceAgentFromDefinition,
  recalculateAgentHealth,
} from '@/lib/workforce/engine';
import { seedWorkforceActivity } from '@/lib/workforce/activity-seeder';
import type { WorkforceAgentDefinition } from '@/lib/workforce/definitions';

/**
 * GET /api/workforce — List all workforce agents with stats
 * Optional query: ?includeStats=false — skip _count aggregation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') !== 'false';
    const agents = await listWorkforceAgents(includeStats);
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
 * POST /api/workforce — Multiple orchestration actions
 *
 * Supported bodies:
 *   { action: 'seed' }                              — Seed all platform-managed agents
 *   { action: 'deploy_all' }                        — Activate every agent (status: 'active')
 *   { action: 'health_check_all' }                  — Recompute health score for every agent
 *   { action: 'pause_all' }                         — Pause every agent (status: 'paused')
 *   { agent: WorkforceAgentDefinition }              — Create/upsert a single agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Action: Seed all platform-managed agents ─────────────────────────
    if (body.action === 'seed') {
      const results = await seedWorkforceAgents();
      return NextResponse.json(
        { seeded: results, count: results.length },
        { status: 201 }
      );
    }

    // ── Action: Deploy all agents (set status: active) ──────────────────
    if (body.action === 'deploy_all') {
      const agents = await db.workforceAgent.findMany({
        where: { isManaged: true },
        select: { id: true, name: true, slug: true },
      });

      const updated: Array<{ id: string; name: string; slug: string }> = [];
      for (const a of agents) {
        await db.workforceAgent.update({
          where: { id: a.id },
          data: {
            status: 'active',
            lastActiveAt: new Date(),
          },
        });
        updated.push({ id: a.id, name: a.name, slug: a.slug });
      }
      return NextResponse.json(
        { deployed: updated, count: updated.length },
        { status: 200 }
      );
    }

    // ── Action: Pause all agents (set status: paused) ───────────────────
    if (body.action === 'pause_all') {
      const agents = await db.workforceAgent.findMany({
        where: { isManaged: true },
        select: { id: true, name: true, slug: true },
      });

      const updated: Array<{ id: string; name: string; slug: string }> = [];
      for (const a of agents) {
        await db.workforceAgent.update({
          where: { id: a.id },
          data: { status: 'paused' },
        });
        updated.push({ id: a.id, name: a.name, slug: a.slug });
      }
      return NextResponse.json(
        { paused: updated, count: updated.length },
        { status: 200 }
      );
    }

    // ── Action: Health check all agents ─────────────────────────────────
    if (body.action === 'health_check_all') {
      const agents = await db.workforceAgent.findMany({
        where: { isManaged: true },
        select: { id: true, name: true, slug: true },
      });

      const results: Array<{
        id: string;
        name: string;
        slug: string;
        healthScore: number;
        health: string;
      }> = [];

      for (const a of agents) {
        const result = await recalculateAgentHealth(a.id);
        results.push({
          id: a.id,
          name: a.name,
          slug: a.slug,
          healthScore: result?.healthScore ?? 0,
          health: result?.health ?? 'unknown',
        });
      }

      return NextResponse.json(
        { checked: results, count: results.length },
        { status: 200 }
      );
    }

    // ── Action: Seed activity (chat messages + work logs) ────────────
    if (body.action === 'seed_activity') {
      const days = Math.min(30, Math.max(1, body.days || 7));
      const result = await seedWorkforceActivity(days);
      return NextResponse.json(
        { ...result, days },
        { status: 201 }
      );
    }

    // ── Action: Create/upsert a single agent ────────────────────────────
    if (body.agent) {
      const agent = await createWorkforceAgentFromDefinition(
        body.agent as WorkforceAgentDefinition
      );
      return NextResponse.json({ agent }, { status: 201 });
    }

    return NextResponse.json(
      {
        error:
          'Invalid request. Provide one of: { action: "seed" | "deploy_all" | "pause_all" | "health_check_all" | "seed_activity" } or { agent: WorkforceAgentDefinition }',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Workforce API] Error processing action:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
