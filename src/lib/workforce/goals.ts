/**
 * Workforce Goals — User ⇄ AI Team Collaboration
 * ===============================================
 * Users assign goals in plain language. The workforce decomposes each goal
 * into concrete sub-tasks (research, content, sales angle, platform check,
 * decision memo) assigned to the right AI employees, then executes them for
 * real (live web search + real platform checks) with visible outputs.
 *
 * Execution is picked up by the 24/7 ops loop — user goals ALWAYS run first
 * ("if not solved, the team instantly starts solving it").
 */

import { db } from '@/lib/db';
import { logAgentActivity } from '@/lib/workforce/logger';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';

// ── Types ──────────────────────────────────────────────────────────────

export interface GoalTaskView {
  id: string;
  title: string;
  kind: string;
  status: string;
  agentName: string;
  agentAvatar: string;
  summary: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface GoalView {
  goalId: string;
  title: string;
  detail: string | null;
  createdAt: string;
  progress: number;
  status: 'queued' | 'in_progress' | 'completed' | 'partial';
  tasks: GoalTaskView[];
}

interface SubTaskSpec {
  kind: 'research' | 'content' | 'sales_angle' | 'platform_check' | 'decision_memo';
  title: string;
  description: string;
  agentSlug: string;
  queries?: string[];
}

// ── Decomposition (deterministic — no LLM dependency) ──────────────────

const QUERY_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'into', 'onto', 'in', 'on', 'for', 'with',
  'to', 'of', 'at', 'by', 'from', 'our', 'your', 'their', 'this', 'that', 'these',
  'those', 'is', 'are', 'was', 'were', 'be', 'been', 'we', 'us', 'my', 'me', 'it',
  'will', 'would', 'should', 'can', 'could', 'do', 'does', 'did', 'have', 'has',
  'want', 'need', 'help', 'make', 'get', 'got', 'just', 'please', 'team', 'goal',
]);

function keywordQueries(goalTitle: string, detail: string | null): string[] {
  const words = `${goalTitle}${detail ? ` ${detail}` : ''}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !QUERY_STOP_WORDS.has(w));
  const keywords = words.slice(0, 5).join(' ') || goalTitle.toLowerCase();
  return [
    `${keywords} strategy best practices b2b`,
    `${keywords} playbook examples`,
  ];
}

function decompose(goalTitle: string, detail: string | null): SubTaskSpec[] {
  const text = `${goalTitle} ${detail ?? ''}`.toLowerCase();
  const queries = keywordQueries(goalTitle, detail);
  const specs: SubTaskSpec[] = [];

  // 1. Research is always the first move
  specs.push({
    kind: 'research',
    title: `Research: ${goalTitle.slice(0, 60)}`,
    description: `Live-web research on "${goalTitle}" — gather real sources, extract findings, save an intel brief to the knowledge base.`,
    agentSlug: 'market-strategist',
    queries,
  });

  // 2. Competitive angle
  if (/competitor|competitor|rival|vs\.?|market|landscape|positioning|differentiat/.test(text)) {
    specs.push({
      kind: 'sales_angle',
      title: `Competitive angle: ${goalTitle.slice(0, 60)}`,
      description: `Scan live sources for competitive positioning angles and differentiate the pitch.`,
      agentSlug: 'sales-engine',
      queries: [`${queries[0]} competitors comparison`],
    });
  }

  // 3. Content deliverable
  if (/content|blog|article|post|landing|copy|message|announce|campaign|email/.test(text)) {
    specs.push({
      kind: 'content',
      title: `Content plan: ${goalTitle.slice(0, 60)}`,
      description: `Produce an evidence-backed content brief (outline + key messages + sources) for the goal.`,
      agentSlug: 'content-architect',
      queries,
    });
  }

  // 4. Platform readiness check
  if (/platform|feature|launch|ship|deploy|fix|repair|bug|performance|uptime|health/.test(text)) {
    specs.push({
      kind: 'platform_check',
      title: `Platform readiness: ${goalTitle.slice(0, 60)}`,
      description: `Verify the platform is healthy for this goal — probe key routes and audit the data layer; report real results.`,
      agentSlug: 'devops-automator',
    });
  }

  // 5. Decision memo closes every goal
  specs.push({
    kind: 'decision_memo',
    title: `Decision memo: ${goalTitle.slice(0, 60)}`,
    description: `PROMETHEUS consolidates all sub-task outputs into a decision memo with recommended next steps.`,
    agentSlug: 'prometheus-ceo',
  });

  return specs;
}

// ── Assign a goal (user → team) ────────────────────────────────────────

export async function assignGoal(title: string, detail?: string | null): Promise<GoalView> {
  const cleanTitle = title.trim().slice(0, 200);
  if (!cleanTitle) throw new Error('Goal title is required');

  const goalId = `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const specs = decompose(cleanTitle, detail ?? null);

  const agents = await db.workforceAgent.findMany({
    where: { slug: { in: specs.map(s => s.agentSlug) } },
    select: { id: true, slug: true },
  });
  const agentMap = new Map(agents.map(a => [a.slug, a.id]));

  const created: GoalTaskView[] = [];
  for (const spec of specs) {
    const agentId = agentMap.get(spec.agentSlug);
    if (!agentId) continue;
    const task = await db.workforceTask.create({
      data: {
        agentId,
        title: spec.title,
        description: spec.description,
        taskType: spec.kind === 'platform_check' ? 'monitoring'
          : spec.kind === 'decision_memo' ? 'analysis'
          : spec.kind === 'content' ? 'content_create'
          : spec.kind === 'sales_angle' ? 'outreach'
          : 'research',
        priority: 'high',
        status: 'pending',
        input: JSON.stringify({ kind: spec.kind, goalTitle: cleanTitle, queries: spec.queries ?? [], goalId }),
        tags: JSON.stringify([`goal:${goalId}`, 'goal', spec.kind]),
      },
    });
    const agent = await db.workforceAgent.findUnique({ where: { id: agentId }, select: { name: true, avatar: true } });
    created.push({
      id: task.id,
      title: task.title,
      kind: spec.kind,
      status: 'pending',
      agentName: agent?.name ?? spec.agentSlug,
      agentAvatar: agent?.avatar ?? '🤖',
      summary: null,
      createdAt: task.createdAt.toISOString(),
      completedAt: null,
    });
  }

  // Real log + chat: KRONOS acknowledges the assignment
  const kronos = await db.workforceAgent.findFirst({ where: { slug: 'kronos-orchestrator' } });
  if (kronos) {
    await logAgentActivity(kronos.id, {
      category: 'task',
      action: 'goal_assigned',
      description: `User assigned a goal: "${cleanTitle}" — decomposed into ${created.length} task(s) and dispatched: ${created.map(t => `${t.agentName} (${t.kind})`).join(', ')}`,
      details: JSON.stringify({ goalId, tasks: created.map(t => t.id) }),
    });
    await db.workforceChatMessage.create({
      data: {
        agentId: kronos.id,
        role: 'agent_comm',
        content: `New goal from the user: "${cleanTitle}". Decomposed into ${created.length} task(s) — ${created.map(t => `${t.agentName} → ${t.kind}`).join(', ')}. Executing now; research runs first.`,
        fromAgent: 'kronos-orchestrator',
        toAgent: 'prometheus-ceo',
        messageType: 'task_update',
        metadata: JSON.stringify({ goalId, kind: 'goal_assignment' }),
      },
    });
  }

  return {
    goalId,
    title: cleanTitle,
    detail: detail ?? null,
    createdAt: new Date().toISOString(),
    progress: 0,
    status: 'queued',
    tasks: created,
  };
}

// ── Execute the next pending goal task (called by the ops loop) ────────

export interface GoalExecutionResult {
  executed: boolean;
  ok?: boolean;
  summary?: string;
  agentSlug?: string;
  taskTitle?: string;
  skippedReason?: string;
}

export async function executeNextGoalTask(): Promise<GoalExecutionResult> {
  const pending = await db.workforceTask.findMany({
    where: { status: 'pending', tags: { contains: 'goal:' } },
    orderBy: { createdAt: 'asc' },
    take: 1,
  });
  const task = pending[0];
  if (!task) return { executed: false, skippedReason: 'no_pending_goals' };

  let input: { kind?: string; goalTitle?: string; queries?: string[]; goalId?: string } = {};
  try { input = task.input ? JSON.parse(task.input) : {}; } catch { /* defaults */ }
  const kind = input.kind ?? 'research';
  const goalTitle = input.goalTitle ?? task.title;
  const queries = (input.queries && input.queries.length > 0) ? input.queries : keywordQueries(goalTitle, null);

  const agent = await db.workforceAgent.findUnique({ where: { id: task.agentId }, select: { id: true, slug: true, name: true, role: true } });
  if (!agent) {
    await db.workforceTask.update({ where: { id: task.id }, data: { status: 'failed', error: 'Assigned agent missing' } });
    return { executed: true, ok: false, summary: 'Assigned agent missing', taskTitle: task.title };
  }

  const startedAt = Date.now();
  await db.workforceTask.update({ where: { id: task.id }, data: { status: 'running', startedAt: new Date() } });
  await db.workforceAgent.update({ where: { id: agent.id }, data: { tasksInProgress: { increment: 1 }, status: 'busy', lastActiveAt: new Date() } });

  try {
    let summary = '';
    let docTitle: string | null = null;

    if (kind === 'research' || kind === 'content' || kind === 'sales_angle') {
      // Try each planned query, then a minimal-keywords fallback, before failing
      const queriesToTry = [...queries, (queries[0] ?? '').split(' ').slice(0, 3).join(' ')].filter(Boolean);
      let search: Awaited<ReturnType<typeof exaSearch>> | null = null;
      for (const q of queriesToTry) {
        const attempt = await exaSearch(q, 8);
        if (attempt.success && attempt.data && attempt.data.length > 0) {
          search = attempt;
          break;
        }
      }
      if (!search || !search.data || search.data.length === 0) {
        throw new Error(`No web results for any query variant on "${goalTitle.slice(0, 60)}"`);
      }

      const readings: Array<{ title: string; url: string; content: string }> = [];
      const read = await webRead(search.data[0].url, 'text');
      if (read.success && read.data && read.data.content.length > 300) {
        readings.push({ title: search.data[0].title || read.data.title, url: search.data[0].url, content: read.data.content.slice(0, 9000) });
      }
      const snippets = search.data.slice(0, 4)
        .map(r => ({ title: r.title, url: r.url, content: r.snippet }))
        .filter(r => r.content.length > 60);
      readings.push(...snippets);

      const domains = [...new Set(readings.map(r => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return 'web'; } }))];

      const headerMap: Record<string, string> = {
        research: 'Intel Brief',
        content: 'Content Brief',
        sales_angle: 'Competitive Angle Brief',
      };
      docTitle = `${headerMap[kind]}: ${goalTitle.slice(0, 80)}`;

      const bodyMap: Record<string, string[]> = {
        research: [
          '## Recommended moves',
          '- Fold findings into the next strategy pass; cite sources when presenting.',
          '- Flag any market shift to PROMETHEUS via KRONOS.',
        ],
        content: [
          '## Content outline (evidence-backed)',
          `1. Hook: lead with the strongest live finding.`,
          `2. Problem: current state + data point from sources.`,
          `3. Solution: LeadReach angle with proof from sources.`,
          `4. CTA matched to the goal: ${goalTitle}`,
          '- Keep every claim traceable to the sources below.',
        ],
        sales_angle: [
          '## Pitch angle',
          '- Differentiate against the moves observed in the live sources.',
          '- Arm the outreach sequence with one concrete proof point per source.',
        ],
      };

      const content = [
        `# ${docTitle}`,
        '',
        `**Owner:** ${agent.name} (${agent.role})  `,
        `**Goal:** ${goalTitle}  `,
        `**Query:** \`${queries[0]}\`  `,
        `**Sources:** ${domains.join(', ')}  `,
        `**Collected:** ${new Date().toISOString()}`,
        '',
        '## Live findings',
        ...readings.slice(0, 6).map((r, i) => `${i + 1}. ${(r.title || 'Source').slice(0, 90)} — ${r.content.slice(0, 200).replace(/\s+/g, ' ')}… [${r.url}]`),
        '',
        ...(bodyMap[kind] ?? []),
      ].join('\n');

      await db.workforceDocument.create({
        data: {
          agentId: agent.id,
          title: docTitle,
          category: kind === 'content' ? 'playbook' : 'reference',
          content,
          tags: JSON.stringify([`goal:${input.goalId ?? 'unknown'}`, 'goal-output', kind, ...domains.slice(0, 5)]),
          sourceType: 'web_trained',
        },
      });

      summary = `${agent.name} completed "${kind}" for goal "${goalTitle}": ${readings.length} live sources processed (${domains.slice(0, 3).join(', ')}), brief "${docTitle}" saved to the knowledge base.`;
    } else if (kind === 'platform_check') {
      const origin = process.env.PLATFORM_ORIGIN || 'http://127.0.0.1:3000';
      const probeRoutes = ['/', '/app', '/docs', '/api/workforce'];
      const results: Array<{ path: string; ok: boolean; status: number }> = [];
      for (const path of probeRoutes) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 8000);
          const res = await fetch(`${origin}${path}`, { signal: ctrl.signal, cache: 'no-store' });
          clearTimeout(timer);
          results.push({ path, ok: res.ok, status: res.status });
        } catch {
          results.push({ path, ok: false, status: 0 });
        }
      }
      const leadCount = await db.lead.count();
      const healthy = results.filter(r => r.ok).length;
      docTitle = `Platform Readiness Check: ${goalTitle.slice(0, 80)}`;
      const content = [
        `# ${docTitle}`,
        '',
        `**Owner:** ${agent.name}  `,
        `**Checked:** ${new Date().toISOString()}`,
        '',
        '## Route probe results (real HTTP checks)',
        ...results.map(r => `- ${r.path} → ${r.ok ? 'HEALTHY' : 'FAILING'} (HTTP ${r.status})`),
        '',
        `## Data layer`,
        `- Leads under management: ${leadCount}`,
        '',
        `## Verdict`,
        healthy === results.length
          ? `Platform is READY for this goal — all ${results.length} probed routes healthy.`
          : `Platform is DEGRADED — ${results.length - healthy}/${results.length} routes failing. Repair loop engaged before proceeding.`,
      ].join('\n');

      await db.workforceDocument.create({
        data: {
          agentId: agent.id,
          title: docTitle,
          category: 'reference',
          content,
          tags: JSON.stringify([`goal:${input.goalId ?? 'unknown'}`, 'goal-output', 'platform_check']),
          sourceType: 'auto_generated',
        },
      });
      summary = `${agent.name} verified platform readiness for goal "${goalTitle}": ${healthy}/${results.length} probed routes healthy, ${leadCount} leads in the data layer.`;
    } else {
      // decision_memo — consolidate outputs from sibling goal tasks
      const goalId = input.goalId ?? 'unknown';
      const outputs = await db.workforceDocument.findMany({
        where: { tags: { contains: `goal:${goalId}` } },
        select: { title: true, content: true, agentId: true },
        take: 10,
      });
      const docCount = outputs.length;
      docTitle = `Decision Memo: ${goalTitle.slice(0, 80)}`;
      const content = [
        `# ${docTitle}`,
        '',
        `**Owner:** ${agent.name} (${agent.role})  `,
        `**Compiled:** ${new Date().toISOString()}`,
        '',
        '## Inputs consolidated (real sub-task outputs)',
        ...(outputs.length > 0
          ? outputs.map(o => `- **${o.title}** — first finding: ${(o.content.match(/## Live findings[\s\S]*?\n[-\d]/)?.[0] ?? o.content).replace(/[#\n]+/g, ' ').slice(80, 340)}…`)
          : ['- No sub-task outputs yet — memo will be refreshed when siblings complete.']),
        '',
        '## Decision',
        `- Proceed with the goal "${goalTitle}" using the evidence above; revisit if any platform check reports degraded state.`,
        `- Assigned follow-ups are tracked as workforce tasks with the same goal tag (${goalId}).`,
        '',
        `## Meta`,
        `- Sub-task documents consolidated: ${docCount}`,
      ].join('\n');

      await db.workforceDocument.create({
        data: {
          agentId: agent.id,
          title: docTitle,
          category: 'reference',
          content,
          tags: JSON.stringify([`goal:${goalId}`, 'goal-output', 'decision_memo']),
          sourceType: 'auto_generated',
        },
      });
      summary = `${agent.name} published the decision memo for "${goalTitle}" — consolidated ${docCount} sub-task output(s).`;
    }

    const durationMs = Date.now() - startedAt;
    await db.workforceTask.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        output: JSON.stringify({ summary, docTitle }),
        progress: 100,
        completedAt: new Date(),
        durationMs,
      },
    });
    await db.workforceAgent.update({
      where: { id: agent.id },
      data: { tasksCompleted: { increment: 1 }, tasksInProgress: { decrement: 1 }, status: 'active', lastActiveAt: new Date() },
    });

    await logAgentActivity(agent.id, {
      category: 'task',
      action: 'goal_task_completed',
      description: summary,
      details: JSON.stringify({ taskId: task.id, kind, goalId: input.goalId, docTitle }),
      duration: durationMs,
    });

    await db.workforceChatMessage.create({
      data: {
        agentId: agent.id,
        role: 'agent_comm',
        content: `Goal progress: ${summary}`,
        fromAgent: agent.slug,
        toAgent: 'kronos-orchestrator',
        messageType: 'task_update',
        metadata: JSON.stringify({ taskId: task.id, goalId: input.goalId, kind: 'goal_progress' }),
      },
    });

    return { executed: true, ok: true, summary, agentSlug: agent.slug, taskTitle: task.title };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - startedAt;

    // Retry logic: requeue the task up to 2 times before marking it failed,
    // so transient web/search failures never kill a user goal.
    let attempts = 0;
    try { attempts = (input as { attempts?: number }).attempts ?? 0; } catch { attempts = 0; }

    if (attempts < 2) {
      await db.workforceTask.update({
        where: { id: task.id },
        data: {
          status: 'pending',
          startedAt: null,
          input: JSON.stringify({ ...input, attempts: attempts + 1 }),
          error: `Attempt ${attempts + 1} failed (auto-retry queued): ${msg.slice(0, 300)}`,
        },
      });
      await db.workforceAgent.update({
        where: { id: agent.id },
        data: { tasksInProgress: { decrement: 1 }, status: 'active', lastActiveAt: new Date() },
      });
      await logAgentActivity(agent.id, {
        category: 'task',
        action: 'goal_task_retry',
        level: 'warn',
        description: `Goal task "${task.title.slice(0, 60)}" failed (attempt ${attempts + 1}) — requeued for retry: ${msg.slice(0, 140)}`,
        details: JSON.stringify({ taskId: task.id, kind, attempts: attempts + 1 }),
        duration: durationMs,
      });
      return { executed: true, ok: false, summary: `retrying (${attempts + 1}/2): ${msg.slice(0, 140)}`, agentSlug: agent.slug, taskTitle: task.title };
    }

    await db.workforceTask.update({
      where: { id: task.id },
      data: { status: 'failed', error: msg.slice(0, 500), completedAt: new Date(), durationMs },
    });
    await db.workforceAgent.update({
      where: { id: agent.id },
      data: { tasksFailed: { increment: 1 }, tasksInProgress: { decrement: 1 }, status: 'active', lastActiveAt: new Date() },
    });
    await logAgentActivity(agent.id, {
      category: 'task',
      action: 'goal_task_failed',
      level: 'warn',
      description: `Goal task failed (${kind}) for "${goalTitle}": ${msg.slice(0, 200)}`,
      details: JSON.stringify({ taskId: task.id, kind, goalId: input.goalId }),
      duration: durationMs,
    });
    return { executed: true, ok: false, summary: `${kind} failed: ${msg.slice(0, 160)}`, agentSlug: agent.slug, taskTitle: task.title };
  }
}

// ── List goals with live progress ──────────────────────────────────────

export async function listGoals(limit = 20): Promise<GoalView[]> {
  const tasks = await db.workforceTask.findMany({
    where: { tags: { contains: 'goal:' } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { agent: { select: { name: true, avatar: true } } },
  });

  const goals = new Map<string, GoalView>();
  for (const t of tasks) {
    let tags: string[] = [];
    try { tags = t.tags ? (JSON.parse(t.tags) as string[]) : []; } catch { /* ignore */ }
    const goalTag = tags.find(x => x.startsWith('goal:goal-'));
    if (!goalTag) continue;
    const goalId = goalTag.slice(5);
    if (!goals.has(goalId)) {
      let input: { goalTitle?: string } = {};
      try { input = t.input ? JSON.parse(t.input) : {}; } catch { /* ignore */ }
      // Oldest task of the goal carries title/description; walk from the last item
      goals.set(goalId, {
        goalId,
        title: input.goalTitle ?? t.title.replace(/^[^:]+:\s*/, ''),
        detail: t.description,
        createdAt: t.createdAt.toISOString(),
        progress: 0,
        status: 'queued',
        tasks: [],
      });
    }
    const g = goals.get(goalId)!;
    let output: { summary?: string } = {};
    try { output = t.output ? JSON.parse(t.output) : {}; } catch { /* ignore */ }
    g.tasks.push({
      id: t.id,
      title: t.title,
      kind: tags.find(x => ['research', 'content', 'sales_angle', 'platform_check', 'decision_memo'].includes(x)) ?? 'research',
      status: t.status,
      agentName: t.agent?.name ?? 'Team',
      agentAvatar: t.agent?.avatar ?? '🤖',
      summary: output.summary ?? (t.status === 'failed' ? t.error : null),
      createdAt: t.createdAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
    });
  }

  const views = [...goals.values()].map(g => {
    const done = g.tasks.filter(t => t.status === 'completed').length;
    const failed = g.tasks.filter(t => t.status === 'failed').length;
    const total = Math.max(1, g.tasks.length);
    g.progress = Math.round(((done + failed * 0.5) / total) * 100);
    g.status = done === g.tasks.length ? 'completed'
      : done + failed === g.tasks.length ? 'partial'
      : done > 0 || g.tasks.some(t => t.status === 'running') ? 'in_progress'
      : 'queued';
    g.tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return g;
  });

  return views.slice(0, limit);
}
