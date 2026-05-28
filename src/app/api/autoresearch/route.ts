import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Allow long-running autoresearch tasks
export const maxDuration = 300;

// ============================================================
// Safe Serialization Helper
// ============================================================

/**
 * Prisma objects contain non-serializable internals (e.g., BigInt, Decimal).
 * Use JSON.parse/stringify to strip them before returning via NextResponse.
 */
function safeSerialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// GET — List all autoresearch jobs or get a specific job
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id');

    if (jobId) {
      // Get specific job with experiments and fragments
      const job = await db.autoresearchJob.findUnique({
        where: { id: jobId },
        include: {
          experiments: {
            orderBy: { createdAt: 'desc' },
          },
          fragments: {
            orderBy: { score: 'desc' },
          },
        },
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      // Safe serialization — Prisma objects have non-serializable internals
      const safeJob = safeSerialize(job);
      return NextResponse.json(safeJob);
    }

    // List all jobs (most recent first) with basic fields only
    const jobs = await db.autoresearchJob.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        bodyName: true,
        status: true,
        currentStrategy: true,
        currentIteration: true,
        totalExperiments: true,
        bestScore: true,
        baselineScore: true,
        maxIterations: true,
        strategies: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ jobs: safeSerialize(jobs) });
  } catch (error) {
    console.error('[Autoresearch GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch jobs' },
      { status: 500 },
    );
  }
}

// ============================================================
// POST — Create, update, delete, pause, resume jobs
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return await handleCreate(body);
      case 'update':
        return await handleUpdate(body);
      case 'delete':
        return await handleDelete(body);
      case 'pause':
        return await handlePause(body);
      case 'resume':
        return await handleResume(body);
      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[Autoresearch POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}

// ============================================================
// CREATE — Create a new autoresearch job
// ============================================================

async function handleCreate(body: {
  name: string;
  bodyText: string;
  verifierText: string;
  strategies?: string[];
  maxIterations?: number;
}) {
  const { name, bodyText, verifierText, strategies, maxIterations } = body;

  if (!name || !bodyText || !verifierText) {
    return NextResponse.json(
      { error: 'Missing required fields: name, bodyText, verifierText' },
      { status: 400 },
    );
  }

  const defaultStrategies = ['baseline', 'seeded', 'evolve-best', 'recombine'];
  const jobStrategies = strategies && strategies.length > 0 ? strategies : defaultStrategies;

  const job = await db.autoresearchJob.create({
    data: {
      name,
      bodyText,
      verifierText,
      strategies: JSON.stringify(jobStrategies),
      maxIterations: maxIterations ?? 3,
      status: 'draft',
      chatHistory: JSON.stringify([]),
    },
  });

  return NextResponse.json({
    id: job.id,
    name: job.name,
    status: job.status,
    strategies: JSON.parse(job.strategies),
    maxIterations: job.maxIterations,
    createdAt: job.createdAt,
  });
}

// ============================================================
// UPDATE — Update job fields
// ============================================================

async function handleUpdate(body: {
  id: string;
  name?: string;
  bodyText?: string;
  verifierText?: string;
  strategies?: string[];
  maxIterations?: number;
}) {
  const { id, name, bodyText, verifierText, strategies, maxIterations } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
  }

  const existing = await db.autoresearchJob.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Only allow updates on draft or paused jobs
  if (existing.status === 'running') {
    return NextResponse.json(
      { error: 'Cannot update a running job. Pause it first.' },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = {};

  if (name !== undefined) updateData.name = name;
  if (bodyText !== undefined) updateData.bodyText = bodyText;
  if (verifierText !== undefined) updateData.verifierText = verifierText;
  if (maxIterations !== undefined) updateData.maxIterations = maxIterations;
  if (strategies !== undefined) {
    updateData.strategies = JSON.stringify(strategies);
  }

  const updated = await db.autoresearchJob.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(safeSerialize({
    id: updated.id,
    name: updated.name,
    status: updated.status,
    strategies: JSON.parse(updated.strategies),
    maxIterations: updated.maxIterations,
    updatedAt: updated.updatedAt,
  }));
}

// ============================================================
// DELETE — Delete a job by id
// ============================================================

async function handleDelete(body: { id?: string; jobId?: string }) {
  const id = body.id || body.jobId;

  if (!id) {
    return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
  }

  const existing = await db.autoresearchJob.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Cascade delete will remove experiments and fragments
  await db.autoresearchJob.delete({ where: { id } });

  return NextResponse.json({ id, deleted: true });
}

// ============================================================
// PAUSE — Pause a running job
// ============================================================

async function handlePause(body: { id?: string; jobId?: string }) {
  const id = body.id || body.jobId;

  if (!id) {
    return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
  }

  const existing = await db.autoresearchJob.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (existing.status !== 'running') {
    return NextResponse.json(
      { error: `Cannot pause job in '${existing.status}' state. Only running jobs can be paused.` },
      { status: 400 },
    );
  }

  await db.autoresearchJob.update({
    where: { id },
    data: { status: 'paused' },
  });

  return NextResponse.json({ id, status: 'paused' });
}

// ============================================================
// RESUME — Resume a paused job
// ============================================================

async function handleResume(body: { id?: string; jobId?: string }) {
  const id = body.id || body.jobId;

  if (!id) {
    return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
  }

  const existing = await db.autoresearchJob.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (existing.status !== 'paused') {
    return NextResponse.json(
      { error: `Cannot resume job in '${existing.status}' state. Only paused jobs can be resumed.` },
      { status: 400 },
    );
  }

  await db.autoresearchJob.update({
    where: { id },
    data: { status: 'running' },
  });

  return NextResponse.json({ id, status: 'running' });
}
