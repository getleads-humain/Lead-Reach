'use client';

/**
 * Workforce Mission Control
 * =========================
 * The live surface where the AI team's REAL work is visible and where the
 * user collaborates with the team:
 *
 *   1. LIVE OPS       — real 24/7 job feed (route sweeps, repairs, audits,
 *                       research, training), open incidents, "Run a real
 *                       ops cycle now" button, system health chips.
 *   2. TRAINING       — per-agent curriculum progress with "Train now";
 *                       every unit is learned from live web sources and
 *                       saved as a cited knowledge document.
 *   3. GOALS          — assign a goal in plain language; the team instantly
 *                       decomposes it into tasks and executes them (goals
 *                       always run first), with live progress + outputs.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, BadgeCheck, BookOpenCheck, BrainCircuit, CheckCircle2,
  ChevronDown, ChevronRight, Database, Globe, GraduationCap, Loader2, Radar,
  RefreshCw, Send, ShieldCheck, Target, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────

interface OpsLog {
  id: string;
  createdAt: string;
  level: string;
  category: string;
  action: string;
  description: string;
  agent: { slug: string; name: string; avatar: string; color: string; department: string } | null;
}

interface OpsIncident {
  id: string;
  title: string;
  status: string;
  route: string;
  createdAt: string;
  lastError: string | null;
}

interface GoalTask {
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

interface Goal {
  goalId: string;
  title: string;
  detail: string | null;
  createdAt: string;
  progress: number;
  status: 'queued' | 'in_progress' | 'completed' | 'partial';
  tasks: GoalTask[];
}

interface OpsStatus {
  origin: string;
  jobs: Array<{ id: string; label: string; agentSlug: string; taskType: string }>;
  recentLogs: OpsLog[];
  incidents: { open: OpsIncident[]; resolvedLifetime: number };
  jobsDone24h: number;
  goals: Goal[];
}

interface TrainingAgent {
  slug: string;
  name: string;
  curriculumTotal: number;
  learned: number;
  lastTrainedAt: string | null;
  learnedTopics: string[];
}

interface TrainingStatus {
  status: TrainingAgent[];
  totals: { curriculum: number; learned: number; percent: number };
}

// ── Helpers ────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function levelColor(level: string): string {
  switch (level) {
    case 'error':
    case 'critical':
      return '#EF4444';
    case 'warn':
      return '#F59E0B';
    default:
      return '#10B981';
  }
}

const KIND_LABELS: Record<string, string> = {
  research: 'Research',
  content: 'Content',
  sales_angle: 'Sales angle',
  platform_check: 'Platform check',
  decision_memo: 'Decision memo',
};

// ── Component ──────────────────────────────────────────────────────────

export function MissionControl() {
  const [ops, setOps] = useState<OpsStatus | null>(null);
  const [training, setTraining] = useState<TrainingStatus | null>(null);
  const [cycleRunning, setCycleRunning] = useState(false);
  const [trainingSlug, setTrainingSlug] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDetail, setGoalDetail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [panel, setPanel] = useState<'ops' | 'training' | 'goals'>('ops');
  const [tickInfo, setTickInfo] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // ── Data loading ──
  const loadOps = useCallback(async () => {
    try {
      const res = await fetch('/api/workforce?view=ops', { cache: 'no-store' });
      if (res.ok) setOps(await res.json());
    } catch { /* best effort */ }
  }, []);

  const loadTraining = useCallback(async () => {
    try {
      const res = await fetch('/api/workforce?view=training', { cache: 'no-store' });
      if (res.ok) setTraining(await res.json());
    } catch { /* best effort */ }
  }, []);

  useEffect(() => {
    loadOps();
    loadTraining();
    const timer = window.setInterval(() => {
      loadOps();
      loadTraining();
    }, 12000);
    pollRef.current = timer;
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [loadOps, loadTraining]);

  // ── Actions ──
  const runCycle = useCallback(async () => {
    setCycleRunning(true);
    setTickInfo(null);
    toast.info('Running a real ops cycle…', { description: 'The team executes its next real job (your goals always go first).' });
    try {
      const res = await fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ops_tick' }),
      });
      const data = await res.json();
      if (data.ran) {
        setTickInfo(`${data.ok ? '✓' : '✗'} ${data.jobId ?? 'job'} — ${data.summary ?? ''}`.slice(0, 240));
        toast[data.ok ? 'success' : 'error'](
          `Ops cycle ${data.ok ? 'completed' : 'failed'}`,
          { description: data.summary ?? '' }
        );
      } else {
        setTickInfo(`Skipped: ${data.skippedReason ?? 'unknown'}`);
        toast.info('Cycle skipped', { description: data.skippedReason ?? '' });
      }
      await loadOps();
    } catch {
      toast.error('Ops cycle failed to start');
    } finally {
      setCycleRunning(false);
    }
  }, [loadOps]);

  const trainAgent = useCallback(async (slug: string, name: string) => {
    setTrainingSlug(slug);
    toast.info(`Training ${name}…`, { description: 'Searching the live web and reading real sources.' });
    try {
      const res = await fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'train', slug }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`${name} learned: ${data.topic}`, {
          description: `Knowledge doc saved with ${data.sources?.length ?? 0} cited sources.`,
        });
      } else {
        toast.info('Training status', { description: data.error ?? 'No new topic to train.' });
      }
      await loadTraining();
      await loadOps();
    } catch {
      toast.error('Training failed');
    } finally {
      setTrainingSlug(null);
    }
  }, [loadOps, loadTraining]);

  const assignGoal = useCallback(async () => {
    if (!goalTitle.trim()) {
      toast.error('Describe what you need first');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_goal', title: goalTitle.trim(), detail: goalDetail.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to assign goal');
      toast.success('Goal assigned to the team', {
        description: `${data.goal.tasks.length} tasks dispatched: ${data.goal.tasks.map((t: GoalTask) => t.agentName).join(', ')}. Execution starts immediately.`,
      });
      setGoalTitle('');
      setGoalDetail('');
      setPanel('goals');
      await loadOps();
    } catch (err) {
      toast.error('Could not assign goal', { description: err instanceof Error ? err.message : undefined });
    } finally {
      setAssigning(false);
    }
  }, [goalTitle, goalDetail, loadOps]);

  // ── Derived ──
  const healthyRoutes = ops ? Math.max(0, 10 - ops.incidents.open.length) : 0;
  const openIncidents = ops?.incidents.open ?? [];

  return (
    <section
      aria-label="Workforce Mission Control"
      className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/15 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
            <Radar className="h-5 w-5 text-emerald-400" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              Mission Control — the team is working for real, 24/7
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {ops ? (
                <>
                  {ops.jobsDone24h} real jobs done in 24h · {ops.recentLogs.length} recent work-log entries ·{' '}
                  {openIncidents.length === 0 ? (
                    <span className="text-emerald-400">no open incidents</span>
                  ) : (
                    <span className="text-amber-400">{openIncidents.length} open incident{openIncidents.length === 1 ? '' : 's'} being repaired</span>
                  )}
                </>
              ) : (
                'Connecting to the live ops engine…'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runCycle}
            disabled={cycleRunning}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
            title="Run one real ops cycle immediately"
          >
            {cycleRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Run a real ops cycle
          </button>
          <button
            onClick={() => { loadOps(); loadTraining(); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground/70 transition hover:bg-secondary hover:text-foreground"
            title="Refresh live data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Panel tabs */}
      <div className="flex gap-1 border-b border-border/60 px-4 pt-2 sm:px-6">
        {([
          { id: 'ops', label: 'Live Ops', icon: Activity },
          { id: 'training', label: 'Training Academy', icon: GraduationCap },
          { id: 'goals', label: 'Goals & Collaboration', icon: Target },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPanel(id)}
            className={`inline-flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition ${
              panel === id
                ? 'border-b-2 border-emerald-400 text-emerald-300'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 sm:px-6">
        {/* ═══ 1. LIVE OPS ═══ */}
        {panel === 'ops' && (
          <div className="space-y-4">
            {/* Health chips */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HealthChip icon={<Globe className="h-3.5 w-3.5" />} label="Platform routes" value={`${healthyRoutes}/10 healthy`} ok={openIncidents.length === 0} />
              <HealthChip icon={<Database className="h-3.5 w-3.5" />} label="Data layer" value={ops ? `${ops.jobsDone24h} jobs / 24h` : '…'} ok={!!ops} />
              <HealthChip icon={<BrainCircuit className="h-3.5 w-3.5" />} label="Incidents" value={ops ? `${ops.incidents.open.length} open · ${ops.incidents.resolvedLifetime} resolved` : '…'} ok={openIncidents.length === 0} />
              <HealthChip icon={<BookOpenCheck className="h-3.5 w-3.5" />} label="Web knowledge" value={training ? `${training.totals.learned}/${training.totals.curriculum} units learned` : '…'} ok={(training?.totals.learned ?? 0) > 0} />
            </div>

            {/* Tick info */}
            {tickInfo && (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2 text-xs text-emerald-200/90">
                {tickInfo}
              </div>
            )}

            {/* Incidents */}
            {openIncidents.length > 0 && (
              <div className="space-y-1.5">
                {openIncidents.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{inc.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {inc.route} · detected {timeAgo(inc.createdAt)}{inc.lastError ? ` · ${inc.lastError.slice(0, 80)}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                      <ShieldCheck className="h-3 w-3" /> repair loop active
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Real work log feed */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Real work log — every entry is an actual action with real outputs
              </p>
              <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-xl border border-border/60 bg-background/40 p-2 [scrollbar-width:thin]">
                {!ops && (
                  <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading live activity…
                  </div>
                )}
                {ops && ops.recentLogs.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No real work logged yet — run a cycle above, or wait for the 24/7 heartbeat (every 4 min).
                  </div>
                )}
                {ops?.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-secondary/40">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: levelColor(log.level) }} />
                    {log.agent ? (
                      <span className="mt-0.5 text-base leading-none" title={log.agent.name}>{log.agent.avatar}</span>
                    ) : (
                      <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed text-foreground/90">{log.description}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {log.agent ? `${log.agent.name} · ` : ''}{log.category}/{log.action} · {timeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job registry */}
            <div className="flex flex-wrap gap-1.5">
              {ops?.jobs.map((j) => (
                <span key={j.id} className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500/70" /> {j.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ═══ 2. TRAINING ACADEMY ═══ */}
        {panel === 'training' && (
          <div className="space-y-4">
            {/* Fleet progress */}
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">Fleet curriculum — learned from the live internet</p>
                <span className="text-xs font-semibold text-emerald-400">
                  {training ? `${training.totals.learned}/${training.totals.curriculum} (${training.totals.percent}%)` : '…'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                  style={{ width: `${training?.totals.percent ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Every training unit runs a real web search, reads real pages, and saves a cited knowledge document to that
                employee&apos;s knowledge base. Training records are written to their work log automatically.
              </p>
            </div>

            {/* Per-agent progress */}
            <div className="grid gap-2 md:grid-cols-2">
              {!training && (
                <div className="flex items-center justify-center py-8 text-xs text-muted-foreground md:col-span-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading curriculum status…
                </div>
              )}
              {training?.status.map((agent) => {
                const pct = agent.curriculumTotal > 0 ? Math.round((agent.learned / agent.curriculumTotal) * 100) : 0;
                const isTraining = trainingSlug === agent.slug;
                return (
                  <div key={agent.slug} className="rounded-xl border border-border/60 bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{agent.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {agent.learned}/{agent.curriculumTotal} units
                          {agent.lastTrainedAt ? ` · last ${timeAgo(agent.lastTrainedAt)}` : ' · never trained'}
                        </p>
                      </div>
                      <button
                        onClick={() => trainAgent(agent.slug, agent.name)}
                        disabled={isTraining}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        {isTraining ? <Loader2 className="h-3 w-3 animate-spin" /> : <GraduationCap className="h-3 w-3" />}
                        {isTraining ? 'Learning…' : 'Train now'}
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-emerald-500/70 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    {agent.learnedTopics.length > 0 && (
                      <details className="mt-2 group">
                        <summary className="cursor-pointer list-none text-[11px] text-muted-foreground transition hover:text-foreground">
                          <span className="inline-flex items-center gap-1">
                            <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                            View {agent.learnedTopics.length} learned unit{agent.learnedTopics.length === 1 ? '' : 's'}
                          </span>
                        </summary>
                        <ul className="mt-1.5 space-y-1 pl-4">
                          {agent.learnedTopics.map((t, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/75">
                              <BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ 3. GOALS & COLLABORATION ═══ */}
        {panel === 'goals' && (
          <div className="space-y-4">
            {/* Assign form */}
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-xs font-semibold text-foreground">Assign a goal — the team starts solving it instantly</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Your goal is decomposed into real tasks (research → competitive angle / content / platform check → decision memo)
                and assigned to the right AI employees. Goals always run first in every ops cycle.
              </p>
              <div className="mt-3 space-y-2">
                <input
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); assignGoal(); } }}
                  placeholder="e.g. Break into fintech SaaS accounts in the US this quarter"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none"
                  aria-label="Goal title"
                />
                <textarea
                  value={goalDetail}
                  onChange={(e) => setGoalDetail(e.target.value)}
                  placeholder="Optional context — target segment, constraints, deadline…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:outline-none"
                  aria-label="Goal details"
                />
                <button
                  onClick={assignGoal}
                  disabled={assigning || !goalTitle.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Assign to the team
                </button>
              </div>
            </div>

            {/* Goal list */}
            {!ops && (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading goals…
              </div>
            )}
            {ops && ops.goals.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
                No goals assigned yet — give the team their first mission above.
              </div>
            )}
            <div className="space-y-3">
              {ops?.goals.map((goal) => (
                <GoalCard key={goal.goalId} goal={goal} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function HealthChip({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${ok ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : 'border-amber-500/25 bg-amber-500/[0.06]'}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className={ok ? 'text-emerald-400' : 'text-amber-400'}>{icon}</span>
        {label}
      </div>
      <p className="mt-0.5 text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const [open, setOpen] = useState(false);
  const statusStyle: Record<string, string> = {
    queued: 'text-muted-foreground border-border',
    in_progress: 'text-cyan-300 border-cyan-500/30',
    completed: 'text-emerald-300 border-emerald-500/30',
    partial: 'text-amber-300 border-amber-500/30',
  };

  return (
    <div className="rounded-xl border border-border/60 bg-background/40">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex min-w-0 items-center gap-3">
          <Target className="h-4 w-4 shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{goal.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {goal.tasks.length} task{goal.tasks.length === 1 ? '' : 's'} · {goal.progress}% complete · assigned {timeAgo(goal.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusStyle[goal.status]}`}>
            {goal.status.replace('_', ' ')}
          </span>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      <div className="mx-4 mb-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500" style={{ width: `${goal.progress}%` }} />
      </div>
      {open && (
        <div className="space-y-2 px-4 pb-4">
          {goal.tasks.map((t) => (
            <div key={t.id} className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-sm leading-none">{t.agentAvatar}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-foreground">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground">{t.agentName} · {KIND_LABELS[t.kind] ?? t.kind}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    t.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : t.status === 'failed'
                      ? 'bg-red-500/15 text-red-300'
                      : t.status === 'running'
                      ? 'bg-cyan-500/15 text-cyan-300'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {t.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                  {t.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {t.status}
                </span>
              </div>
              {t.summary && (
                <p className="mt-1.5 rounded-md bg-background/60 px-2 py-1.5 text-[11px] leading-relaxed text-foreground/75">
                  {t.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
