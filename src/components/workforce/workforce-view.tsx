'use client';

/**
 * LeadReach — Workforce AI Command Center
 * =========================================
 * Main entry point that routes between the Workforce Dashboard
 * (overview of all agents) and the Agent Workspace
 * (dedicated per-agent operating environment).
 *
 * Provides orchestration actions (deploy / health check / seed / pause)
 * to all platform-managed agents and pushes real activity entries to the
 * Live Orchestration Feed.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkforceDashboard } from './workforce-dashboard';
import { AgentWorkspace } from './agent-workspace';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { safeFetchJSON } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface WorkforceAgentData {
  id: string; slug: string; name: string; role: string; department: string;
  description: string; avatar: string; color: string; status: string;
  health: string; healthScore: number; skills: string; tools: string;
  mcpServers: string; ragSources: string; permissions: string; expertise: string;
  model: string; temperature: number; maxTokens: number; systemPrompt: string;
  scheduleType: string; maxConcurrentTasks: number; priority: string;
  tasksCompleted: number; tasksInProgress: number; tasksFailed: number;
  totalTokensUsed: number; successRate: number; lastActiveAt: string | null;
  _count?: { tasks: number; sessions: number; documents: number };
}

interface TaskData {
  id: string; title: string; taskType: string; status: string; priority: string;
  progress: number; createdAt: string; agentId: string;
  agent?: { name: string; avatar: string; color: string; slug: string; department: string };
}

// ── Main Component ─────────────────────────────────────────────────────

export function WorkforceView() {
  const [agents, setAgents] = useState<WorkforceAgentData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAgent, setActiveAgent] = useState<WorkforceAgentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Action loading flags — keep track so the toolbar can show spinners
  const [actionLoading, setActionLoading] = useState<{
    deploy?: boolean;
    health?: boolean;
    seed?: boolean;
    pause?: boolean;
  }>({});

  // Live activity feed entries — pushed by actions and polling
  const [feedEntries, setFeedEntries] = useState<
    Array<{
      id: string;
      timestamp: string;
      agentName: string;
      agentAvatar: string;
      agentColor: string;
      department: string;
      action: string;
      status: 'running' | 'completed' | 'failed';
    }>
  >([]);

  const lastPollRef = useRef<Date>(new Date());
  const hasSeededRef = useRef(false);

  // ── Fetch agents and tasks ──────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      // Use the new global tasks endpoint to avoid N+1 requests
      const [agentsRes, tasksRes] = await Promise.all([
        fetch('/api/workforce'),
        safeFetchJSON<{ tasks: TaskData[] }>('/api/workforce/tasks?limit=50'),
      ]);

      if (!agentsRes.ok) throw new Error('Failed to fetch agents');

      const agentsData = await agentsRes.json();
      const allTasks = (tasksRes.tasks || []).sort(
        (a: TaskData, b: TaskData) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAgents(agentsData.agents || []);
      setTasks(allTasks);
    } catch (err) {
      console.error('[WorkforceView] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workforce data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Poll for new tasks every 15s to keep the feed fresh ─────────────

  useEffect(() => {
    if (agents.length === 0) return;

    const timer = setInterval(async () => {
      try {
        const since = lastPollRef.current.toISOString();
        lastPollRef.current = new Date();

        const fresh = await safeFetchJSON<{ tasks: TaskData[] }>(
          `/api/workforce/tasks?limit=20&since=${encodeURIComponent(since)}`
        );

        if (fresh.tasks && fresh.tasks.length > 0) {
          // Convert fresh tasks to feed entries
          const newEntries = fresh.tasks.map((t) => ({
            id: `task-${t.id}`,
            timestamp: t.createdAt,
            agentName: t.agent?.name ?? 'Unknown',
            agentAvatar: t.agent?.avatar ?? '🤖',
            agentColor: t.agent?.color ?? '#6B7280',
            department: t.agent?.department ?? 'Operations',
            action: actionFromTask(t),
            status:
              t.status === 'completed'
                ? ('completed' as const)
                : t.status === 'failed'
                ? ('failed' as const)
                : ('running' as const),
          }));

          setFeedEntries((prev) => {
            // Merge new entries, dedupe by id, keep most recent 60
            const merged = [...newEntries, ...prev];
            const seen = new Set<string>();
            const deduped = merged.filter((e) => {
              if (seen.has(e.id)) return false;
              seen.add(e.id);
              return true;
            });
            return deduped.slice(0, 60);
          });
        }
      } catch {
        // Silent fail — polling is best-effort
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [agents.length]);

  // ── Seed agents if none exist (one-shot, never auto-loop) ──────────

  useEffect(() => {
    if (!isLoading && agents.length === 0 && !error && !hasSeededRef.current) {
      hasSeededRef.current = true;
      handleSeedAgents(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, agents.length, error]);

  // ── Helpers ─────────────────────────────────────────────────────────

  function actionFromTask(t: TaskData): string {
    const verbMap: Record<string, string> = {
      code_review: 'reviewing code',
      feature_build: 'building feature',
      bug_fix: 'fixing bug',
      deploy: 'executing deployment',
      design: 'drafting design',
      content_create: 'creating content',
      research: 'researching',
      analysis: 'analyzing',
      outreach: 'composing outreach',
      support: 'handling support',
      monitoring: 'monitoring systems',
      incident_response: 'responding to incident',
    };
    const verb = verbMap[t.taskType] || `working on: ${t.title.toLowerCase().slice(0, 60)}`;
    return verb;
  }

  function pushFeedEntry(
    agentName: string,
    agentAvatar: string,
    agentColor: string,
    department: string,
    action: string,
    status: 'running' | 'completed' | 'failed'
  ) {
    const entry = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      agentName,
      agentAvatar,
      agentColor,
      department,
      action,
      status,
    };
    setFeedEntries((prev) => [entry, ...prev].slice(0, 60));
  }

  // ── Orchestration actions ────────────────────────────────────────────

  /** Activate every platform-managed agent */
  const handleDeployAll = useCallback(async () => {
    setActionLoading((s) => ({ ...s, deploy: true }));
    pushFeedEntry(
      'Command Center',
      '⚡',
      '#10B981',
      'Executive',
      'deploying all workforce agents',
      'running'
    );
    toast.info('Deploying all agents…', {
      description: 'Setting every managed agent to active status.',
    });

    try {
      const res = await fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deploy_all' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Deploy failed');

      const count = data.count ?? 0;
      toast.success(`Deployed ${count} agent${count === 1 ? '' : 's'}`, {
        description: 'All managed agents are now active.',
      });
      pushFeedEntry(
        'Command Center',
        '⚡',
        '#10B981',
        'Executive',
        `deployed ${count} agent${count === 1 ? '' : 's'} to active status`,
        'completed'
      );
      await fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Deploy failed';
      toast.error('Deploy failed', { description: msg });
      pushFeedEntry(
        'Command Center',
        '⚡',
        '#EF4444',
        'Executive',
        'deploy failed: ' + msg,
        'failed'
      );
    } finally {
      setActionLoading((s) => ({ ...s, deploy: false }));
    }
  }, [fetchData]);

  /** Pause every platform-managed agent */
  const handlePauseAll = useCallback(async () => {
    setActionLoading((s) => ({ ...s, pause: true }));
    pushFeedEntry(
      'Command Center',
      '⏸️',
      '#F59E0B',
      'Executive',
      'pausing all workforce agents',
      'running'
    );
    toast.info('Pausing all agents…');

    try {
      const res = await fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause_all' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Pause failed');

      const count = data.count ?? 0;
      toast.success(`Paused ${count} agent${count === 1 ? '' : 's'}`);
      pushFeedEntry(
        'Command Center',
        '⏸️',
        '#F59E0B',
        'Executive',
        `paused ${count} agent${count === 1 ? '' : 's'}`,
        'completed'
      );
      await fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pause failed';
      toast.error('Pause failed', { description: msg });
      pushFeedEntry(
        'Command Center',
        '⏸️',
        '#EF4444',
        'Executive',
        'pause failed: ' + msg,
        'failed'
      );
    } finally {
      setActionLoading((s) => ({ ...s, pause: false }));
    }
  }, [fetchData]);

  /** Recompute health scores for every agent */
  const handleHealthCheck = useCallback(async () => {
    setActionLoading((s) => ({ ...s, health: true }));
    pushFeedEntry(
      'Command Center',
      '🩺',
      '#3B82F6',
      'Executive',
      'running global health check',
      'running'
    );
    toast.info('Running health check…', {
      description: 'Recomputing health scores for every agent.',
    });

    try {
      const res = await fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check_all' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Health check failed');

      const checked = data.checked ?? [];
      const avg =
        checked.length > 0
          ? Math.round(
              checked.reduce(
                (s: number, a: { healthScore: number }) => s + a.healthScore,
                0
              ) / checked.length
            )
          : 0;

      toast.success(`Health check complete`, {
        description: `${checked.length} agents · avg health ${avg}/100`,
      });
      pushFeedEntry(
        'Command Center',
        '🩺',
        '#3B82F6',
        'Executive',
        `health check complete — ${checked.length} agents, avg ${avg}`,
        'completed'
      );
      await fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Health check failed';
      toast.error('Health check failed', { description: msg });
      pushFeedEntry(
        'Command Center',
        '🩺',
        '#EF4444',
        'Executive',
        'health check failed: ' + msg,
        'failed'
      );
    } finally {
      setActionLoading((s) => ({ ...s, health: false }));
    }
  }, [fetchData]);

  /** Seed the platform with the standard workforce agents */
  const handleSeedAgents = useCallback(
    async (silent = false) => {
      setActionLoading((s) => ({ ...s, seed: true }));
      if (!silent) {
        pushFeedEntry(
          'Command Center',
          '🌱',
          '#84CC16',
          'Executive',
          'seeding workforce agents',
          'running'
        );
        toast.info('Seeding agents…', {
          description: 'Creating the standard agent fleet.',
        });
      }

      try {
        const res = await fetch('/api/workforce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seed' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Seed failed');

        const count = data.count ?? 0;
        if (!silent) {
          toast.success(`Seeded ${count} agent${count === 1 ? '' : 's'}`, {
            description: 'Standard workforce fleet is ready.',
          });
          pushFeedEntry(
            'Command Center',
            '🌱',
            '#84CC16',
            'Executive',
            `seeded ${count} agents`,
            'completed'
          );
        }
        await fetchData();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Seed failed';
        if (!silent) toast.error('Seed failed', { description: msg });
        pushFeedEntry(
          'Command Center',
          '🌱',
          '#EF4444',
          'Executive',
          'seed failed: ' + msg,
          'failed'
        );
      } finally {
        setActionLoading((s) => ({ ...s, seed: false }));
      }
    },
    [fetchData]
  );

  // ── Handle opening agent workspace ──────────────────────────────────

  const handleOpenWorkspace = useCallback((agent: WorkforceAgentData) => {
    setActiveAgent(agent);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setActiveAgent(null);
    fetchData(); // Refresh data when returning
  }, [fetchData]);

  // ── Loading State ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 animate-pulse shadow-lg shadow-emerald-500/20">
            <Zap className="h-8 w-8 text-emerald-950 dark:text-foreground" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Initializing AI Workforce...
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────

  if (error && agents.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20">
            <Zap className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Workforce Unavailable</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Agent Workspace or Dashboard ─────────────────────────────

  if (activeAgent) {
    return <AgentWorkspace agent={activeAgent} onBack={handleBackToDashboard} />;
  }

  return (
    <WorkforceDashboard
      agents={agents}
      tasks={tasks}
      feedEntries={feedEntries}
      onOpenWorkspace={handleOpenWorkspace}
      onRefresh={fetchData}
      onDeployAll={handleDeployAll}
      onPauseAll={handlePauseAll}
      onHealthCheck={handleHealthCheck}
      onSeedAgents={() => handleSeedAgents(false)}
      actionLoading={actionLoading}
      isLoading={isLoading}
    />
  );
}
