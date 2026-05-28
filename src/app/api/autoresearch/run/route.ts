import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Allow long-running autoresearch tasks
export const maxDuration = 300;

// ============================================================
// Lazy Import Helpers
// ============================================================

/**
 * Lazy-import the autoresearch engine to avoid Turbopack crash
 * caused by eagerly importing z-ai-web-dev-sdk at module level.
 */
async function getEngine() {
  return await import('@/lib/autoresearch/engine');
}

/**
 * Lazy-import callLLM from @/lib/llm.
 * Avoids top-level import that would trigger z-ai-web-dev-sdk bundling.
 */
async function callLLM(options: {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}) {
  const mod = await import('@/lib/llm');
  return mod.callLLM(options);
}

// ============================================================
// Safe Serialization Helper
// ============================================================

function safeSerialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// POST — Execute autoresearch steps
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'baseline':
        return await handleBaseline(body);
      case 'step':
        return await handleStep(body);
      case 'full-run':
        return await handleFullRun(body);
      case 'chat':
        return await handleChat(body);
      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[Autoresearch Run POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}

// ============================================================
// BASELINE — Run the baseline experiment (no harness) for a job
// ============================================================

async function handleBaseline(body: { jobId: string }) {
  const { jobId } = body;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const job = await db.autoresearchJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Mark job as running before executing
  await db.autoresearchJob.update({
    where: { id: jobId },
    data: { status: 'running', currentStrategy: 'baseline', currentIteration: 0 },
  });

  try {
    const engine = await getEngine();
    await engine.runBaselineExperiment(jobId);

    // Fetch updated job state after execution
    const updatedJob = await db.autoresearchJob.findUnique({ where: { id: jobId } });
    return NextResponse.json({
      jobId,
      action: 'baseline',
      status: updatedJob?.status ?? 'running',
      baselineScore: updatedJob?.baselineScore ?? 0,
      totalExperiments: updatedJob?.totalExperiments ?? 0,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Autoresearch baseline] Failed for job ${jobId}: ${errorMessage}`);

    await db.autoresearchJob.update({
      where: { id: jobId },
      data: { status: 'failed', errorMessage },
    });

    return NextResponse.json(
      { error: `Baseline experiment failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}

// ============================================================
// STEP — Run one step of the autoresearch loop
// ============================================================

async function handleStep(body: { jobId: string }) {
  const { jobId } = body;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const job = await db.autoresearchJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status === 'completed') {
    return NextResponse.json({ error: 'Job already completed' }, { status: 400 });
  }

  if (job.status === 'failed' && !body.force) {
    return NextResponse.json(
      { error: 'Job has failed. Use force=true to retry, or create a new job.' },
      { status: 400 },
    );
  }

  // If job is in draft state, mark as running first
  if (job.status === 'draft' || job.status === 'failed') {
    await db.autoresearchJob.update({
      where: { id: jobId },
      data: { status: 'running', errorMessage: null },
    });
  }

  try {
    const engine = await getEngine();
    await engine.runAutoresearchStep(jobId);

    // Fetch updated job state after execution
    const updatedJob = await db.autoresearchJob.findUnique({
      where: { id: jobId },
      include: {
        experiments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json(safeSerialize({
      jobId,
      action: 'step',
      status: updatedJob?.status ?? 'running',
      currentStrategy: updatedJob?.currentStrategy ?? null,
      currentIteration: updatedJob?.currentIteration ?? 0,
      bestScore: updatedJob?.bestScore ?? 0,
      baselineScore: updatedJob?.baselineScore ?? 0,
      totalExperiments: updatedJob?.totalExperiments ?? 0,
      recentExperiments: updatedJob?.experiments ?? [],
    }));
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Autoresearch step] Failed for job ${jobId}: ${errorMessage}`);

    // Try to update the job status to failed
    try {
      await db.autoresearchJob.update({
        where: { id: jobId },
        data: { status: 'failed', errorMessage },
      });
    } catch {
      // Job may have been deleted or already updated
    }

    return NextResponse.json(
      { error: `Step execution failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}

// ============================================================
// FULL-RUN — Run the complete autoresearch loop for a job
// ============================================================

async function handleFullRun(body: { jobId: string }) {
  const { jobId } = body;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const job = await db.autoresearchJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status === 'running') {
    return NextResponse.json({ error: 'Job is already running' }, { status: 400 });
  }

  if (job.status === 'completed') {
    return NextResponse.json({ error: 'Job already completed' }, { status: 400 });
  }

  // Mark job as running
  await db.autoresearchJob.update({
    where: { id: jobId },
    data: { status: 'running', errorMessage: null },
  });

  try {
    const engine = await getEngine();
    await engine.runAutoresearchJob(jobId);

    // Fetch updated job state after full execution
    const updatedJob = await db.autoresearchJob.findUnique({
      where: { id: jobId },
      include: {
        experiments: {
          orderBy: { score: 'desc' },
          take: 10,
        },
        fragments: {
          orderBy: { score: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json(safeSerialize({
      jobId,
      action: 'full-run',
      status: updatedJob?.status ?? 'completed',
      bestScore: updatedJob?.bestScore ?? 0,
      baselineScore: updatedJob?.baselineScore ?? 0,
      totalExperiments: updatedJob?.totalExperiments ?? 0,
      topExperiments: updatedJob?.experiments ?? [],
      topFragments: updatedJob?.fragments ?? [],
    }));
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Autoresearch full-run] Failed for job ${jobId}: ${errorMessage}`);

    // Try to update the job status to failed
    try {
      await db.autoresearchJob.update({
        where: { id: jobId },
        data: { status: 'failed', errorMessage },
      });
    } catch {
      // Job may have been deleted or already updated
    }

    return NextResponse.json(
      { error: `Full run failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}

// ============================================================
// CHAT — Send a chat message about the research job context
// ============================================================

async function handleChat(body: { jobId: string; message: string }) {
  const { jobId, message } = body;

  if (!jobId || !message) {
    return NextResponse.json(
      { error: 'Missing required fields: jobId, message' },
      { status: 400 },
    );
  }

  const job = await db.autoresearchJob.findUnique({
    where: { id: jobId },
    include: {
      experiments: {
        orderBy: { score: 'desc' },
        take: 5,
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Parse existing chat history
  const chatHistory: Array<{ role: string; content: string; timestamp: string }> =
    JSON.parse(job.chatHistory);

  // Add user message
  chatHistory.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  });

  // Build context for the AI assistant
  const experimentsSummary = job.experiments.length > 0
    ? job.experiments
        .map(
          (e) =>
            `- Strategy: ${e.strategy}, Score: ${e.score.toFixed(3)}, Name: ${e.candidateName}`,
        )
        .join('\n')
    : 'No experiments yet.';

  const contextPrompt = `You are an AI research assistant helping with an autoresearch job. This job tests prompt harnesses against a fixed body text to find the most effective framing.

Job: "${job.name}"
Status: ${job.status}
Body text (first 200 chars): ${job.bodyText.slice(0, 200)}
Verifier: ${job.verifierText}
Best score: ${job.bestScore.toFixed(3)}
Baseline score: ${job.baselineScore.toFixed(3)}
Total experiments: ${job.totalExperiments}
Current strategy: ${job.currentStrategy || 'none'}
Strategies: ${job.strategies}

Top experiments:
${experimentsSummary}

Help the user understand the research results, suggest improvements, or explain the strategies. Keep responses concise and actionable.`;

  try {
    const aiResponse = await callLLM({
      systemPrompt: contextPrompt,
      userMessage: message,
      temperature: 0.5,
      maxTokens: 1000,
    });

    chatHistory.push({
      role: 'assistant',
      content: aiResponse || 'I\'m having trouble processing your request. Please try again.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Autoresearch chat] LLM call failed:', err);
    chatHistory.push({
      role: 'assistant',
      content: 'I\'m having trouble responding right now. Please try again in a moment.',
      timestamp: new Date().toISOString(),
    });
  }

  // Update chat history in DB
  await db.autoresearchJob.update({
    where: { id: jobId },
    data: { chatHistory: JSON.stringify(chatHistory) },
  });

  return NextResponse.json({
    chatHistory,
    jobStatus: job.status,
    bestScore: job.bestScore,
    totalExperiments: job.totalExperiments,
  });
}
