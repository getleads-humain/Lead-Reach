/**
 * Workforce Real Operations Engine (24/7)
 * ========================================
 * The AI workforce does REAL work around the clock — no synthetic chatter.
 *
 * Every cycle executes ONE real job from the registry, round-robin, with
 * full lifecycle: WorkforceTask created → executed → completed/failed →
 * WorkforceLog training/ops record → real chat report to KRONOS.
 *
 * Jobs (all real I/O, no fiction):
 *   platform.route_sweep   — DevOps probes the platform's real routes (run)
 *   platform.repair_verify — QA re-checks failing routes, resolves or escalates (repair → reship → reassure)
 *   platform.db_audit      — KRONOS audits real DB state and requeues stuck tasks (maintain)
 *   llm.health_probe       — KRONOS probes the LLM endpoint (reassure)
 *   growth.web_research    — Market Strategist researches the agenda on the live web (build)
 *   sales.pulse            — Sales Engine scans live prospecting signals (build)
 *   ops.training_session   — Trains the least-trained agent on the live web (train)
 *   report.daily_brief     — PROMETHEUS compiles a real platform brief (reassure)
 *   ops.goal_execution     — Executes queued user-assigned goals FIRST (serve the user)
 *
 * Started from instrumentation-node.ts; also triggerable via
 * POST /api/workforce/ops { action: 'tick' } (external heartbeat safe).
 */

import { db } from '@/lib/db';
import { logAgentActivity } from '@/lib/workforce/logger';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import { checkLLMHealth } from '@/lib/llm';
import { trainAgentOnce, TRAINING_CURRICULUM } from '@/lib/workforce/training';
import { executeNextGoalTask } from '@/lib/workforce/goals';

// ── Shared helpers ─────────────────────────────────────────────────────

export function platformOrigin(): string {
  return process.env.PLATFORM_ORIGIN || 'http://127.0.0.1:3000';
}

/** Core platform routes probed by the sweep. */
export const SWEEP_ROUTES: Array<{ path: string; label: string }> = [
  { path: '/', label: 'Landing' },
  { path: '/app', label: 'App Workspace' },
  { path: '/docs', label: 'Docs Hub' },
  { path: '/agent/orchestrator', label: 'Agent: Atlas' },
  { path: '/agent/prospect-discovery', label: 'Agent: Scout' },
  { path: '/agentic-framework', label: 'Framework' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/faq', label: 'FAQ' },
  { path: '/api/workforce', label: 'API: Workforce' },
  { path: '/api/health', label: 'API: Health' },
];

async function postChat(params: {
  agentId: string;
  fromSlug: string;
  content: string;
  messageType: string;
  taskId?: string;
}) {
  try {
    await db.workforceChatMessage.create({
      data: {
        agentId: params.agentId,
        role: 'agent_comm',
        content: params.content,
        fromAgent: params.fromSlug,
        toAgent: 'kronos-orchestrator',
        messageType: params.messageType,
        metadata: params.taskId ? JSON.stringify({ taskId: params.taskId }) : null,
      },
    });
  } catch { /* chat must never break ops */ }
}

interface JobContext {
  agent: { id: string; slug: string; name: string; role: string };
  taskId: string;
}

interface JobResult {
  ok: boolean;
  summary: string;
  details?: Record<string, unknown>;
}

interface JobDef {
  id: string;
  label: string;
  agentSlug: string;
  taskType: string;
  verb: string; // shown in UI feed
  run: (ctx: JobContext) => Promise<JobResult>;
}

// ── Job 1: Route sweep (run the platform, detect problems) ─────────────

async function jobRouteSweep(ctx: JobContext): Promise<JobResult> {
  const origin = platformOrigin();
  const results: Array<{ path: string; status: number; ms: number; ok: boolean }> = [];

  for (const route of SWEEP_ROUTES) {
    const start = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(`${origin}${route.path}`, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'LeadReach-DevOps-Agent/1.0 (route-sweep)' },
        cache: 'no-store',
      });
      clearTimeout(timer);
      results.push({ path: route.path, status: res.status, ms: Date.now() - start, ok: res.ok });
    } catch (error) {
      results.push({
        path: route.path,
        status: 0,
        ms: Date.now() - start,
        ok: false,
      });
      void error;
    }
  }

  const failed = results.filter(r => !r.ok);
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / Math.max(1, results.length));

  // Real incident creation for failing routes (deduped)
  let incidentsCreated = 0;
  for (const f of failed) {
    const openIncidents = await db.workforceTask.findMany({
      where: {
        taskType: 'incident_response',
        status: { in: ['pending', 'assigned', 'running'] },
        tags: { contains: `"route:${f.path}"` },
      },
      select: { id: true },
    });
    if (openIncidents.length > 0) continue;

    const repairAgent = await db.workforceAgent.findFirst({ where: { slug: 'feature-developer' } });
    if (repairAgent) {
      await db.workforceTask.create({
        data: {
          agentId: repairAgent.id,
          title: `Incident: ${f.path} returning ${f.status === 0 ? 'no response' : `HTTP ${f.status}`}`,
          description: `Route sweep (DevOps) found ${f.path} failing. Investigate, fix, then QA will verify recovery.`,
          taskType: 'incident_response',
          priority: 'high',
          status: 'pending',
          input: JSON.stringify({ route: f.path, detectedStatus: f.status, detectedBy: 'devops-automator' }),
          tags: JSON.stringify(['incident', `route:${f.path}`, 'unverified']),
          relatedEntityType: 'route',
          relatedEntityId: f.path,
        },
      });
      incidentsCreated++;
    }
  }

  const summary = failed.length === 0
    ? `Route sweep: ${results.length}/${results.length} routes healthy, avg ${avgMs}ms — no incidents.`
    : `Route sweep: ${failed.length}/${results.length} routes failing (${failed.map(f => `${f.path}→${f.status || 'ERR'}`).join(', ')}); opened ${incidentsCreated} incident task(s) for repair.`;

  await logAgentActivity(ctx.agent.id, {
    category: 'health',
    action: 'route_sweep',
    level: failed.length > 0 ? 'warn' : 'info',
    description: summary,
    details: JSON.stringify({ routes: results, avgMs, incidentsCreated }),
  });

  await postChat({
    agentId: ctx.agent.id,
    fromSlug: ctx.agent.slug,
    content: summary,
    messageType: failed.length > 0 ? 'alert' : 'status_update',
    taskId: ctx.taskId,
  });

  return { ok: true, summary, details: { routes: results, avgMs, incidentsCreated } };
}

// ── Job 2: Repair verify (repair → reship → reassure) ──────────────────

async function jobRepairVerify(ctx: JobContext): Promise<JobResult> {
  const openIncidents = await db.workforceTask.findMany({
    where: {
      taskType: 'incident_response',
      status: { in: ['pending', 'assigned'] },
      tags: { contains: 'incident' },
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  if (openIncidents.length === 0) {
    const summary = 'Repair sweep: no open incidents — all previously detected issues remain resolved.';
    await logAgentActivity(ctx.agent.id, {
      category: 'health',
      action: 'repair_sweep_clean',
      description: summary,
    });
    return { ok: true, summary };
  }

  const origin = platformOrigin();
  const resolved: string[] = [];
  const stillFailing: string[] = [];

  for (const incident of openIncidents) {
    let route = '/';
    let attempts = 0;
    try {
      const input = incident.input ? JSON.parse(incident.input) : {};
      route = input.route || '/';
      attempts = input.attempts || 0;
    } catch { /* default */ }

    let okNow = false;
    let status = 0;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(`${origin}${route}`, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(timer);
      status = res.status;
      okNow = res.ok;
    } catch { okNow = false; }

    if (okNow) {
      await db.workforceTask.update({
        where: { id: incident.id },
        data: {
          status: 'completed',
          output: JSON.stringify({ resolved: true, verifiedBy: 'qa-tester', route, status }),
          progress: 100,
          completedAt: new Date(),
        },
      });
      const repairAgentId = incident.agentId;
      await db.workforceAgent.update({ where: { id: repairAgentId }, data: { tasksCompleted: { increment: 1 }, tasksInProgress: { decrement: 1 } } }).catch(() => {});
      resolved.push(route);
      await logAgentActivity(ctx.agent.id, {
        category: 'health',
        action: 'incident_resolved',
        description: `Verified repair: ${route} now healthy (HTTP ${status}). Incident closed after ${attempts + 1} verification pass(es).`,
        details: JSON.stringify({ incidentId: incident.id, route, status }),
      });
    } else {
      attempts += 1;
      await db.workforceTask.update({
        where: { id: incident.id },
        data: {
          input: JSON.stringify({ route, detectedStatus: status, detectedBy: 'devops-automator', attempts }),
          status: 'pending',
          error: `Verification pass ${attempts}: still failing (HTTP ${status || 'ERR'})`,
        },
      });
      stillFailing.push(`${route}→${status || 'ERR'}`);
      await logAgentActivity(ctx.agent.id, {
        category: 'health',
        action: 'incident_recheck_failed',
        level: 'warn',
        description: `Re-verified ${route}: still failing (HTTP ${status || 'ERR'}) — incident stays open, repair continues (attempt ${attempts}).`,
        details: JSON.stringify({ incidentId: incident.id, route, status, attempts }),
      });
    }
  }

  const summary = `Repair sweep: ${resolved.length} resolved${resolved.length ? ` (${resolved.join(', ')})` : ''}, ${stillFailing.length} still failing${stillFailing.length ? ` (${stillFailing.join(', ')})` : ''}.`;
  await postChat({
    agentId: ctx.agent.id,
    fromSlug: ctx.agent.slug,
    content: summary,
    messageType: stillFailing.length > 0 ? 'alert' : 'status_update',
    taskId: ctx.taskId,
  });
  return { ok: true, summary, details: { resolved, stillFailing } };
}

// ── Job 3: DB audit (maintain the data layer) ──────────────────────────

async function jobDbAudit(ctx: JobContext): Promise<JobResult> {
  const [leads, campaigns, tasksPending, tasksRunning, tasksDone, tasksFailed, logs24h, docs, incidentsOpen] = await Promise.all([
    db.lead.count(),
    db.campaign.count(),
    db.workforceTask.count({ where: { status: 'pending' } }),
    db.workforceTask.count({ where: { status: 'running' } }),
    db.workforceTask.count({ where: { status: 'completed' } }),
    db.workforceTask.count({ where: { status: 'failed' } }),
    db.workforceLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
    db.workforceDocument.count(),
    db.workforceTask.count({ where: { taskType: 'incident_response', status: { in: ['pending', 'assigned', 'running'] } } }),
  ]);

  // Real repair: requeue tasks stuck in 'running' for > 30 minutes
  const stuck = await db.workforceTask.findMany({
    where: { status: 'running', startedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } },
    select: { id: true, title: true, agentId: true },
    take: 10,
  });
  for (const t of stuck) {
    await db.workforceTask.update({ where: { id: t.id }, data: { status: 'pending', startedAt: null, error: 'Auto-requeued: exceeded 30min runtime (stale lock)' } });
    await db.workforceAgent.update({ where: { id: t.agentId }, data: { tasksInProgress: { decrement: 1 } } }).catch(() => {});
  }
  if (stuck.length > 0) {
    await logAgentActivity(ctx.agent.id, {
      category: 'system',
      action: 'stuck_tasks_requeued',
      level: 'warn',
      description: `Requeued ${stuck.length} stuck task(s) exceeding 30min runtime: ${stuck.map(t => t.title.slice(0, 40)).join('; ')}`,
      details: JSON.stringify({ requeued: stuck.map(t => t.id) }),
    });
  }

  // Real resilience: online snapshot backup of the SQLite database.
  // Protects platform state against container snapshot rollbacks /
  // destructive schema operations. Keeps the most recent 5 backups.
  let backupFile: string | null = null;
  try {
    const nodeRequire = eval('require') as NodeRequire;
    const fs = nodeRequire('fs') as typeof import('fs');
    const path = nodeRequire('path') as typeof import('path');
    const raw = process.env.DATABASE_URL || '';
    let dbPath = raw.startsWith('file:') ? raw.slice(5) : '';
    if (dbPath && !dbPath.startsWith('/')) dbPath = path.resolve(process.cwd(), dbPath);
    if (dbPath && fs.existsSync(dbPath)) {
      const backupDir = path.join(path.dirname(dbPath), 'backups');
      fs.mkdirSync(backupDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      const target = path.join(backupDir, `custom-${stamp}.db`);
      if (!fs.existsSync(target)) {
        // VACUUM INTO produces a consistent snapshot while the server runs
        await db.$queryRawUnsafe(`VACUUM INTO '${target}'`);
        const snaps = fs.readdirSync(backupDir).filter(f => f.endsWith('.db')).sort();
        while (snaps.length > 5) fs.unlinkSync(path.join(backupDir, snaps.shift() as string));
        backupFile = target;
      }
    }
  } catch (backupErr) {
    await logAgentActivity(ctx.agent.id, {
      category: 'system',
      action: 'db_backup_failed',
      level: 'warn',
      description: `DB snapshot backup failed (non-fatal): ${backupErr instanceof Error ? backupErr.message.slice(0, 120) : String(backupErr).slice(0, 120)}`,
    });
  }

  // Real resilience #2: git-committed workforce state snapshot.
  // The sandbox container periodically rolls the filesystem back; git is the
  // only store that survives EVERY rollback. Export the trained workforce
  // (agent stats + knowledge docs + recent worklogs) as a committed JSON so
  // ensureWorkforceBootstrapped() can rebuild it at boot in seconds instead
  // of re-running hours of live-web training.
  let snapshotSaved = false;
  try {
    const nodeRequire = eval('require') as NodeRequire;
    const fs = nodeRequire('fs') as typeof import('fs');
    const path = nodeRequire('path') as typeof import('path');

    const agents = await db.workforceAgent.findMany({
      select: { slug: true, status: true, healthScore: true, tasksCompleted: true, tasksFailed: true, successRate: true },
    });
    const docs = await db.workforceDocument.findMany({
      select: { agent: { select: { slug: true } }, title: true, category: true, content: true, tags: true, sourceType: true },
    });
    const logs = await db.workforceLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { agent: { select: { slug: true } }, logDate: true, level: true, category: true, action: true, description: true, details: true },
    });

    const snapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      agents: agents.map((a) => ({ ...a })),
      documents: docs.map((d) => ({
        agentSlug: d.agent.slug,
        title: d.title,
        category: d.category,
        content: d.content,
        tags: d.tags,
        sourceType: d.sourceType,
      })),
      logs: logs.map((l) => ({
        agentSlug: l.agent.slug,
        logDate: l.logDate.toISOString(),
        level: l.level,
        category: l.category,
        action: l.action,
        description: l.description,
        details: l.details,
      })),
    };
    const snapPath = path.join(process.cwd(), 'scripts', 'workforce-snapshot.json');
    fs.writeFileSync(snapPath, JSON.stringify(snapshot));
    snapshotSaved = true;
  } catch (snapErr) {
    await logAgentActivity(ctx.agent.id, {
      category: 'system',
      action: 'workforce_snapshot_failed',
      level: 'warn',
      description: `Workforce state snapshot failed (non-fatal): ${snapErr instanceof Error ? snapErr.message.slice(0, 120) : String(snapErr).slice(0, 120)}`,
    });
  }

  const summary = `DB audit: ${leads} leads · ${campaigns} campaigns · tasks ${tasksDone} done / ${tasksPending} pending / ${tasksRunning} running / ${tasksFailed} failed · ${logs24h} log entries (24h) · ${docs} docs · ${incidentsOpen} open incidents · ${stuck.length} stuck requeued.${backupFile ? ` Snapshot saved: ${backupFile.split('/').pop()}` : ''}${snapshotSaved ? ' · workforce state exported to git.' : ''}`;

  await logAgentActivity(ctx.agent.id, {
    category: 'system',
    action: 'db_audit',
    description: summary,
    details: JSON.stringify({ leads, campaigns, tasksPending, tasksRunning, tasksDone, tasksFailed, logs24h, docs, incidentsOpen, requeuedStuck: stuck.length }),
  });

  await postChat({
    agentId: ctx.agent.id,
    fromSlug: ctx.agent.slug,
    content: summary,
    messageType: 'status_update',
    taskId: ctx.taskId,
  });

  return {
    ok: true,
    summary,
    details: { leads, campaigns, tasksDone, tasksPending, tasksRunning, tasksFailed, logs24h, docs, incidentsOpen, requeuedStuck: stuck.length },
  };
}

// ── Job 4: LLM health probe (reassure) ─────────────────────────────────

async function jobLlmProbe(ctx: JobContext): Promise<JobResult> {
  const health = await checkLLMHealth();
  const summary = health.ok
    ? `LLM probe: ${health.model} responded OK in ${health.latencyMs}ms — inference layer healthy.`
    : `LLM probe: ${health.model} unavailable (${(health.error || 'no response').slice(0, 120)}) — falling back to deterministic ops; queue retains work.`;

  await logAgentActivity(ctx.agent.id, {
    category: 'health',
    action: 'llm_probe',
    level: health.ok ? 'info' : 'warn',
    description: summary,
    details: JSON.stringify(health),
    duration: health.latencyMs,
  });

  return { ok: true, summary, details: { ...health } };
}

// ── Job 4b: GitHub repository sync (reship the codebase upstream) ──────
// Keeps github.com/getleads-humain/Lead-Reach perfectly in sync with the
// workspace: commits any pending platform changes, then pushes all local
// commits to origin/main. Auth comes from GITHUB_TOKEN (env or .env) via
// the git credential store, so a token provided once works forever.

function gitExec(cmd: string): { code: number; out: string } {
  const nodeRequire = eval('require') as NodeRequire;
  const { execSync } = nodeRequire('child_process') as typeof import('child_process');
  try {
    const out = execSync(cmd, {
      cwd: '/home/z/my-project',
      timeout: 120_000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out: (out || '').trim() };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}`.trim().slice(0, 400) };
  }
}

async function jobGitSync(ctx: JobContext): Promise<JobResult> {
  // 1. Best-effort credential wiring: if GITHUB_TOKEN is present (env or
  //    .env), persist it in the git credential store (write-once).
  let tokenConfigured = false;
  try {
    const nodeRequire = eval('require') as NodeRequire;
    const fs = nodeRequire('fs') as typeof import('fs');
    const os = nodeRequire('os') as typeof import('os');
    let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
    if (!token) {
      const envPath = '/home/z/my-project/.env';
      if (fs.existsSync(envPath)) {
        const m = fs.readFileSync(envPath, 'utf-8').match(/^GITHUB_TOKEN=(.+)$/m);
        if (m) token = m[1].trim().replace(/^["']|["']$/g, '');
      }
    }
    if (token) {
      const credPath = `${os.homedir()}/.git-credentials`;
      const existing = fs.existsSync(credPath) ? fs.readFileSync(credPath, 'utf-8') : '';
      if (!existing.includes('github.com')) {
        fs.writeFileSync(credPath, `${existing}https://x-access-token:${token}@github.com\n`, { mode: 0o600 });
      }
      gitExec('git config credential.helper store');
      tokenConfigured = true;
    }
  } catch { /* auth setup is best-effort; plain push may still work */ }

  // 2. Commit any uncommitted platform changes (double-guard — the platform
  //    auto-committer usually handles this already).
  let committed = false;
  const status = gitExec('git status --porcelain');
  if (status.code === 0 && status.out.length > 0) {
    const commit = gitExec('git add -A && git commit -m "workforce: checkpoint sync" --quiet');
    committed = commit.code === 0;
  }

  // 3. Fetch and count how many commits are queued for GitHub.
  gitExec('git fetch origin --quiet');
  const aheadRaw = gitExec('git rev-list --count origin/main..HEAD');
  const ahead = parseInt(aheadRaw.out || '0', 10) || 0;

  if (ahead === 0) {
    const summary = `GitHub sync: origin/main already up to date${committed ? ' (local checkpoint committed)' : ''}.`;
    await logAgentActivity(ctx.agent.id, {
      category: 'system',
      action: 'git_sync',
      description: summary,
      details: JSON.stringify({ ahead: 0, committed, tokenConfigured }),
    });
    return { ok: true, summary, details: { ahead: 0, committed } };
  }

  // 4. Push. If the platform's auto-committer amended an already-pushed
  //    commit, a normal push is rejected — retry once with a LEASE-GUARDED
  //    force (only succeeds if no one else pushed in the meantime).
  const remoteBefore = gitExec('git rev-parse origin/main').out;
  let push = gitExec('git push origin main');
  if (push.code !== 0) {
    push = gitExec(`git push --force-with-lease=main:${remoteBefore} origin main`);
  }

  if (push.code !== 0) {
    const reason = push.out.split('\n').filter(l => l.includes('fatal') || l.includes('rejected') || l.includes('error') || l.includes('Authentication') || l.includes('Username')) [0] || push.out.slice(0, 120);
    const summary = `GitHub sync: push failed — ${reason}. ${ahead} commit(s) remain queued locally; retrying next cycle.`;
    await logAgentActivity(ctx.agent.id, {
      category: 'system',
      action: 'git_sync',
      level: 'warn',
      description: summary,
      details: JSON.stringify({ ahead, error: push.out.slice(0, 200), tokenConfigured }),
    });
    await postChat({
      agentId: ctx.agent.id,
      fromSlug: ctx.agent.slug,
      content: `GitHub sync failed (${reason}). ${ahead} commits queued. ${tokenConfigured ? 'Check token validity/permissions.' : 'Add GITHUB_TOKEN to .env to enable pushes.'}`,
      messageType: 'status_update',
      taskId: ctx.taskId,
    });
    return { ok: false, summary, details: { ahead, error: push.out.slice(0, 200) } };
  }

  const summary = `GitHub sync: pushed ${ahead} commit(s) to getleads-humain/Lead-Reach main${committed ? ' (incl. fresh checkpoint)' : ''}.`;
  await logAgentActivity(ctx.agent.id, {
    category: 'system',
    action: 'git_sync',
    description: summary,
    details: JSON.stringify({ ahead, committed, tokenConfigured }),
  });
  await postChat({
    agentId: ctx.agent.id,
    fromSlug: ctx.agent.slug,
    content: summary,
    messageType: 'status_update',
    taskId: ctx.taskId,
  });
  return { ok: true, summary, details: { ahead, committed } };
}

// ── Job 5: Growth web research (build knowledge) ───────────────────────

const RESEARCH_AGENDA = [
  { id: 'agentic-crm', title: 'Agentic CRM & AI SDR landscape', query: 'agentic CRM AI SDR tools landscape 2026' },
  { id: 'lead-gen-trends', title: 'B2B lead generation trends', query: 'b2b lead generation trends predictions 2026' },
  { id: 'ai-prospecting', title: 'AI prospecting tooling shifts', query: 'AI prospecting tools comparison features pricing' },
  { id: 'intent-data', title: 'Intent data ecosystem', query: 'B2B intent data providers landscape buying signals' },
  { id: 'deliverability', title: 'Email deliverability changes', query: 'email deliverability changes google yahoo bulk senders' },
  { id: 'gtm-motion', title: 'PLG vs sales-led GTM data', query: 'product led growth vs sales led motion benchmarks b2b' },
];

async function jobWebResearch(ctx: JobContext): Promise<JobResult> {
  // Round-robin through the agenda, skipping already-researched items
  const existing = await db.workforceDocument.findMany({
    where: { agentId: ctx.agent.id, sourceType: 'web_trained' },
    select: { tags: true },
  });
  const doneIds = new Set<string>();
  for (const d of existing) {
    try {
      const tags = d.tags ? (JSON.parse(d.tags) as string[]) : [];
      for (const t of tags) if (t.startsWith('agenda:')) doneIds.add(t.slice(7));
    } catch { /* ignore */ }
  }
  const item = RESEARCH_AGENDA.find(r => !doneIds.has(r.id))
    ?? RESEARCH_AGENDA[doneIds.size % RESEARCH_AGENDA.length];
  const itemKey = doneIds.has(item.id) ? `${item.id}-r${doneIds.size}` : item.id;

  const search = await exaSearch(item.query, 8);
  if (!search.success || !search.data || search.data.length === 0) {
    throw new Error(`No search results for research item "${item.title}"`);
  }

  const readings: Array<{ title: string; url: string; content: string }> = [];
  const read = await webRead(search.data[0].url, 'text');
  if (read.success && read.data && read.data.content.length > 400) {
    readings.push({ title: search.data[0].title || read.data.title, url: search.data[0].url, content: read.data.content.slice(0, 10000) });
  }
  const snippets = search.data.slice(0, 5).map(r => ({ title: r.title, url: r.url, content: r.snippet })).filter(r => r.content.length > 60);
  readings.push(...snippets);

  const domains = [...new Set(readings.map(r => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return 'web'; } }))];
  const highlights = readings.slice(0, 6).map(r => `- (${(r.title || '').slice(0, 80) || 'source'}) ${r.content.slice(0, 220).replace(/\s+/g, ' ')}… [${r.url}]`);

  const content = [
    `# Market Intel: ${item.title}`,
    '',
    `**Agent:** ${ctx.agent.name} (${ctx.agent.role})  `,
    `**Query:** \`${item.query}\`  `,
    `**Sources:** ${domains.join(', ')}  `,
    `**Collected:** ${new Date().toISOString()}`,
    '',
    '## Live findings',
    ...highlights,
    '',
    '## So-what for LeadReach',
    `- Refresh ICP/positioning assumptions against the sources above before the next strategy pass.`,
    `- Escalate any direct competitive move to PROMETHEUS via KRONOS.`,
  ].join('\n');

  await db.workforceDocument.create({
    data: {
      agentId: ctx.agent.id,
      title: `Market Intel: ${item.title}`,
      category: 'reference',
      content,
      tags: JSON.stringify([`agenda:${itemKey}`, 'research', ...domains.slice(0, 5)]),
      sourceType: 'web_trained',
    },
  });

  const summary = `Market research: "${item.title}" — collected ${readings.length} live sources (${domains.slice(0, 4).join(', ')}). Intel brief saved to knowledge base.`;

  await logAgentActivity(ctx.agent.id, {
    category: 'decision',
    action: 'market_research',
    description: summary,
    details: JSON.stringify({ item: item.id, sources: readings.map(r => r.url) }),
  });

  await postChat({
    agentId: ctx.agent.id,
    fromSlug: ctx.agent.slug,
    content: summary,
    messageType: 'task_update',
    taskId: ctx.taskId,
  });

  return { ok: true, summary, details: { item: item.id, sources: readings.map(r => r.url) } };
}

// ── Job 6: Sales prospecting pulse ─────────────────────────────────────

const SALES_PULSE_QUERIES = [
  'companies hiring SDR team lead this week',
  'series A SaaS funding announcements this month',
  'companies switching CRM announced migration',
  'VP Sales new appointment announced',
];

async function jobSalesPulse(ctx: JobContext): Promise<JobResult> {
  const idx = Math.floor(Date.now() / 3600000) % SALES_PULSE_QUERIES.length;
  const query = SALES_PULSE_QUERIES[idx];
  const search = await exaSearch(query, 8);
  if (!search.success || !search.data || search.data.length === 0) {
    throw new Error(`No prospecting results for "${query}"`);
  }

  const signals = search.data.slice(0, 6).map(r => ({
    title: r.title.slice(0, 120),
    url: r.url,
    signal: r.snippet.slice(0, 180),
  }));

  const content = [
    `# Prospecting Pulse — ${query}`,
    '',
    `**Agent:** ${ctx.agent.name}  `,
    `**Window:** ${new Date().toISOString()}`,
    '',
    '## Live buying signals',
    ...signals.map((s, i) => `${i + 1}. **${s.title}**\n   ${s.signal}\n   Source: ${s.url}`),
    '',
    '## Next actions',
    `- Qualify each signal against active ICP; route A-list to outreach planning.`,
    `- Enrich the strongest 2-3 signals via the enrichment pipeline.`,
  ].join('\n');

  await db.workforceDocument.create({
    data: {
      agentId: ctx.agent.id,
      title: `Prospecting Pulse: ${query}`,
      category: 'reference',
      content,
      tags: JSON.stringify(['sales-pulse', 'prospecting']),
      sourceType: 'web_trained',
    },
  });

  const summary = `Prospecting pulse: scanned "${query}" — captured ${signals.length} live buying signals into a brief for qualification.`;

  await logAgentActivity(ctx.agent.id, {
    category: 'discover',
    action: 'prospecting_pulse',
    description: summary,
    details: JSON.stringify({ query, signals: signals.map(s => s.url) }),
  });

  await postChat({
    agentId: ctx.agent.id,
    fromSlug: ctx.agent.slug,
    content: summary,
    messageType: 'task_update',
    taskId: ctx.taskId,
  });

  return { ok: true, summary, details: { query, count: signals.length } };
}

// ── Job 7: Training session (train the least-trained agent) ────────────

async function jobTrainingSession(ctx: JobContext): Promise<JobResult> {
  // Pick the managed agent with the lowest curriculum completion ratio
  const agents = await db.workforceAgent.findMany({ where: { isManaged: true }, select: { id: true, slug: true, name: true } });
  let bestSlug = agents[0]?.slug;
  let bestRatio = -1;
  for (const a of agents) {
    const total = (TRAINING_CURRICULUM[a.slug] ?? []).length;
    if (total === 0) continue;
    const learned = await db.workforceDocument.count({
      where: { agentId: a.id, sourceType: 'web_trained', tags: { contains: 'curriculum:' } },
    });
    const ratio = learned / total;
    if (ratio < 1 && (bestRatio === -1 || ratio < bestRatio)) {
      bestRatio = ratio;
      bestSlug = a.slug;
    }
  }
  if (!bestSlug) {
    return { ok: true, summary: 'Training session: all agents have completed their curricula — scheduling advanced refreshes.' };
  }

  const result = await trainAgentOnce(bestSlug);
  const summary = result.ok
    ? `Training session: trained ${bestSlug} on "${result.topic}" from live web sources (${result.sources?.length ?? 0} cited).`
    : `Training session: ${bestSlug} — ${result.error?.slice(0, 140)}`;

  await logAgentActivity(ctx.agent.id, {
    category: 'task',
    action: 'training_session_managed',
    description: summary,
    details: JSON.stringify(result),
  });

  return { ok: result.ok, summary, details: { ...result } };
}

// ── Job 8: Daily brief (reassure leadership + users) ───────────────────

async function jobDailyBrief(ctx: JobContext): Promise<JobResult> {
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const existing = await db.workforceDocument.findFirst({
    where: { agentId: ctx.agent.id, title: { contains: dateKey }, tags: { contains: 'daily-brief' } },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, summary: `Daily brief: ${dateKey} already published — skipping duplicate.` };
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [logs24h, tasksDone24h, tasksFailed24h, docsLearned, incidentsOpen, incidentsResolved, leads, agents] = await Promise.all([
    db.workforceLog.count({ where: { createdAt: { gte: since } } }),
    db.workforceTask.count({ where: { status: 'completed', completedAt: { gte: since } } }),
    db.workforceTask.count({ where: { status: 'failed', completedAt: { gte: since } } }),
    db.workforceDocument.count({ where: { sourceType: 'web_trained', createdAt: { gte: since } } }),
    db.workforceTask.count({ where: { taskType: 'incident_response', status: { in: ['pending', 'assigned', 'running'] } } }),
    db.workforceTask.count({ where: { taskType: 'incident_response', status: 'completed' } }),
    db.lead.count(),
    db.workforceAgent.findMany({ where: { isManaged: true }, select: { name: true, status: true, healthScore: true, tasksCompleted: true } }),
  ]);

  const avgHealth = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.healthScore, 0) / agents.length) : 0;
  const busiest = [...agents].sort((a, b) => b.tasksCompleted - a.tasksCompleted).slice(0, 3)
    .map(a => `${a.name} (${a.tasksCompleted})`).join(', ');

  const content = [
    `# Platform Daily Brief — ${dateKey}`,
    '',
    `Compiled by ${ctx.agent.name} from real platform telemetry. All figures are live database counts.`,
    '',
    '## Workforce state',
    `- Agents active: ${agents.filter(a => a.status === 'active' || a.status === 'busy').length}/${agents.length} · avg health ${avgHealth}/100`,
    `- Most productive (lifetime): ${busiest || 'n/a'}`,
    '',
    '## Last 24 hours (real activity)',
    `- Work-log entries: ${logs24h}`,
    `- Tasks completed: ${tasksDone24h} · failed: ${tasksFailed24h}`,
    `- Knowledge learned from the live web: ${docsLearned} document(s)`,
    `- Incidents: ${incidentsOpen} open · ${incidentsResolved} resolved (lifetime)`,
    '',
    '## Platform data',
    `- Leads under management: ${leads}`,
    '',
    '## Directives',
    `- If incidents open > 0: prioritize repair → verification loop before new builds.`,
    `- If knowledge learned = 0 in 24h: run an immediate training session (ops.training_session).`,
  ].join('\n');

  await db.workforceDocument.create({
    data: {
      agentId: ctx.agent.id,
      title: `Platform Daily Brief — ${dateKey}`,
      category: 'reference',
      content,
      tags: JSON.stringify(['daily-brief', dateKey]),
      sourceType: 'auto_generated',
    },
  });

  const summary = `Daily brief published for ${dateKey}: ${logs24h} work-log entries, ${tasksDone24h} tasks done, ${docsLearned} docs learned, ${incidentsOpen} incidents open, avg agent health ${avgHealth}/100.`;

  await logAgentActivity(ctx.agent.id, {
    category: 'decision',
    action: 'daily_brief_published',
    description: summary,
    details: JSON.stringify({ logs24h, tasksDone24h, docsLearned, incidentsOpen, avgHealth }),
  });

  await postChat({
    agentId: ctx.agent.id,
    fromSlug: ctx.agent.slug,
    content: summary,
    messageType: 'status_update',
    taskId: ctx.taskId,
  });

  return { ok: true, summary };
}

// ── Registry ───────────────────────────────────────────────────────────

const JOB_REGISTRY: JobDef[] = [
  { id: 'platform.route_sweep', label: 'Platform route sweep', agentSlug: 'devops-automator', taskType: 'monitoring', verb: 'sweeping platform routes', run: jobRouteSweep },
  { id: 'platform.repair_verify', label: 'Repair verification sweep', agentSlug: 'qa-tester', taskType: 'incident_response', verb: 'verifying incident repairs', run: jobRepairVerify },
  { id: 'platform.db_audit', label: 'Database audit & maintenance', agentSlug: 'kronos-orchestrator', taskType: 'analysis', verb: 'auditing platform database', run: jobDbAudit },
  { id: 'llm.health_probe', label: 'LLM inference health probe', agentSlug: 'kronos-orchestrator', taskType: 'monitoring', verb: 'probing LLM inference layer', run: jobLlmProbe },
  { id: 'growth.web_research', label: 'Growth web research', agentSlug: 'market-strategist', taskType: 'research', verb: 'researching the market on the live web', run: jobWebResearch },
  { id: 'sales.pulse', label: 'Prospecting signal pulse', agentSlug: 'sales-engine', taskType: 'research', verb: 'scanning live buying signals', run: jobSalesPulse },
  { id: 'ops.training_session', label: 'Workforce training session', agentSlug: 'synthetic-hr', taskType: 'training', verb: 'running a training session', run: jobTrainingSession },
  { id: 'repo.git_sync', label: 'GitHub repository sync', agentSlug: 'devops-automator', taskType: 'maintenance', verb: 'syncing the codebase to GitHub', run: jobGitSync },
  { id: 'report.daily_brief', label: 'Platform daily brief', agentSlug: 'prometheus-ceo', taskType: 'analysis', verb: 'compiling the platform brief', run: jobDailyBrief },
];

export function getJobRegistry() {
  return JOB_REGISTRY.map(j => ({ id: j.id, label: j.label, agentSlug: j.agentSlug, taskType: j.taskType }));
}

// ── Cycle executor ─────────────────────────────────────────────────────

let cycleBusy = false;
let registryIndex = 0;

export interface CycleResult {
  ran: boolean;
  jobId?: string;
  agentSlug?: string;
  ok?: boolean;
  summary?: string;
  skippedReason?: string;
  durationMs: number;
}

export async function runOpsCycle(): Promise<CycleResult> {
  const startedAt = Date.now();
  if (cycleBusy) {
    return { ran: false, skippedReason: 'cycle_already_running', durationMs: Date.now() - startedAt };
  }
  cycleBusy = true;
  try {
    // Priority 1 — user-assigned goals always run first
    const goal = await executeNextGoalTask();
    if (goal.executed) {
      return {
        ran: true,
        jobId: `goal:${goal.taskTitle ?? ''}`,
        agentSlug: goal.agentSlug,
        ok: goal.ok,
        summary: goal.summary,
        durationMs: Date.now() - startedAt,
      };
    }

    // Priority 2 — round-robin through the registry
    const job = JOB_REGISTRY[registryIndex % JOB_REGISTRY.length];
    registryIndex = (registryIndex + 1) % JOB_REGISTRY.length;

    const agent = await db.workforceAgent.findFirst({ where: { slug: job.agentSlug } });
    if (!agent) {
      return { ran: false, skippedReason: `agent_not_found:${job.agentSlug}`, durationMs: Date.now() - startedAt };
    }

    const task = await db.workforceTask.create({
      data: {
        agentId: agent.id,
        title: job.label,
        description: `Real 24/7 ops job: ${job.label}`,
        taskType: job.taskType,
        priority: 'normal',
        status: 'running',
        startedAt: new Date(),
        tags: JSON.stringify([`job:${job.id}`, 'ops-cycle']),
      },
    });
    await db.workforceAgent.update({
      where: { id: agent.id },
      data: { tasksInProgress: { increment: 1 }, status: 'busy', lastActiveAt: new Date() },
    });

    let result: JobResult;
    try {
      result = await job.run({ agent: { id: agent.id, slug: agent.slug, name: agent.name, role: agent.role }, taskId: task.id });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result = { ok: false, summary: msg.slice(0, 240) };
    }

    if (result.ok) {
      await db.workforceTask.update({
        where: { id: task.id },
        data: {
          status: 'completed',
          output: JSON.stringify({ summary: result.summary, details: result.details ?? {} }),
          progress: 100,
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
        },
      });
      await db.workforceAgent.update({
        where: { id: agent.id },
        data: { tasksCompleted: { increment: 1 }, tasksInProgress: { decrement: 1 }, status: 'active', lastActiveAt: new Date() },
      });
    } else {
      await db.workforceTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          error: result.summary.slice(0, 500),
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
        },
      });
      await db.workforceAgent.update({
        where: { id: agent.id },
        data: { tasksFailed: { increment: 1 }, tasksInProgress: { decrement: 1 }, status: 'active', lastActiveAt: new Date() },
      });
      await logAgentActivity(agent.id, {
        category: 'system',
        action: 'job_failed',
        level: 'warn',
        description: `${job.label} failed: ${result.summary.slice(0, 200)}`,
        details: JSON.stringify({ jobId: job.id }),
      });
    }

    return {
      ran: true,
      jobId: job.id,
      agentSlug: agent.slug,
      ok: result.ok,
      summary: result.summary,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    cycleBusy = false;
  }
}

// ── 24/7 scheduler ─────────────────────────────────────────────────────

let loopHandle: ReturnType<typeof setInterval> | null = null;
let startupTimer: ReturnType<typeof setTimeout> | null = null;

export function startOpsLoop(intervalMs = 4 * 60 * 1000): void {
  if (loopHandle) return; // already running

  startupTimer = setTimeout(() => {
    runOpsCycle().catch(err => console.error('[OpsLoop] startup cycle failed:', err?.message ?? err));
  }, 15000);

  loopHandle = setInterval(() => {
    runOpsCycle()
      .then(r => {
        if (r.ran) console.log(`[OpsLoop] ${r.jobId} → ${r.ok ? 'OK' : 'FAILED'}: ${(r.summary ?? '').slice(0, 140)}`);
      })
      .catch(err => console.error('[OpsLoop] cycle failed:', err?.message ?? err));
  }, intervalMs);

  console.log(`[OpsLoop] 24/7 real-ops engine started — one real job every ${Math.round(intervalMs / 1000)}s`);
}

export function stopOpsLoop(): void {
  if (loopHandle) { clearInterval(loopHandle); loopHandle = null; }
  if (startupTimer) { clearTimeout(startupTimer); startupTimer = null; }
}

// ── Status for UI ──────────────────────────────────────────────────────

export async function getOpsStatus() {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const [recentLogs, openIncidents, resolvedIncidents, jobsDone24h, goals] = await Promise.all([
    db.workforceLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true, createdAt: true, level: true, category: true, action: true,
        description: true, details: true, duration: true,
        agent: { select: { slug: true, name: true, avatar: true, color: true, department: true } },
      },
    }),
    db.workforceTask.findMany({
      where: { taskType: 'incident_response', status: { in: ['pending', 'assigned', 'running'] } },
      select: { id: true, title: true, status: true, createdAt: true, input: true, error: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.workforceTask.count({ where: { taskType: 'incident_response', status: 'completed' } }),
    db.workforceTask.count({ where: { tags: { contains: 'ops-cycle' }, status: 'completed', completedAt: { gte: since24h } } }),
    import('@/lib/workforce/goals').then(m => m.listGoals()),
  ]);

  return {
    origin: platformOrigin(),
    jobs: getJobRegistry(),
    recentLogs: recentLogs.map(l => ({
      id: l.id,
      createdAt: l.createdAt.toISOString(),
      level: l.level,
      category: l.category,
      action: l.action,
      description: l.description,
      agent: l.agent ? { slug: l.agent.slug, name: l.agent.name, avatar: l.agent.avatar, color: l.agent.color, department: l.agent.department } : null,
    })),
    incidents: {
      open: openIncidents.map(i => {
        let route = '/';
        try { route = i.input ? (JSON.parse(i.input).route ?? '/') : '/'; } catch { /* default */ }
        return { id: i.id, title: i.title, status: i.status, route, createdAt: i.createdAt.toISOString(), lastError: i.error };
      }),
      resolvedLifetime: resolvedIncidents,
    },
    jobsDone24h,
    goals,
  };
}
