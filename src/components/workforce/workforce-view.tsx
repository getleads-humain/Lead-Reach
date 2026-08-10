'use client';

/**
 * LeadReach — Workforce AI Command Center
 * =========================================
 * Main entry point that routes between the Workforce Dashboard
 * (overview of all agents) and the Agent Workspace
 * (dedicated per-agent operating environment).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WorkforceDashboard } from './workforce-dashboard';
import { AgentWorkspace } from './agent-workspace';
import { Loader2, Zap } from 'lucide-react';

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
  agent?: { name: string; avatar: string; color: string; slug: string };
}

// ── Main Component ─────────────────────────────────────────────────────

export function WorkforceView() {
  const [agents, setAgents] = useState<WorkforceAgentData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAgent, setActiveAgent] = useState<WorkforceAgentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch agents and tasks ──────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [agentsRes, tasksRes] = await Promise.all([
        fetch('/api/workforce'),
        fetch('/api/workforce').then(r => r.json()).then(d => {
          // Get tasks from all agents
          return Promise.all(
            (d.agents || []).slice(0, 7).map((a: WorkforceAgentData) =>
              fetch(`/api/workforce/${a.id}/tasks?limit=10`)
                .then(r => r.json())
                .then(d => d.tasks || [])
                .catch(() => [])
            )
          );
        }),
      ]);

      if (!agentsRes.ok) throw new Error('Failed to fetch agents');

      const agentsData = await agentsRes.json();
      const allTasks = tasksRes.flat().sort(
        (a: TaskData, b: TaskData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  // ── Seed agents if none exist ───────────────────────────────────────

  useEffect(() => {
    if (!isLoading && agents.length === 0 && !error) {
      fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
        .then(r => r.json())
        .then(() => fetchData())
        .catch(err => console.error('[WorkforceView] Seed error:', err));
    }
  }, [isLoading, agents.length, error, fetchData]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20">
            <Zap className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Workforce Unavailable</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors"
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
      onOpenWorkspace={handleOpenWorkspace}
      onRefresh={fetchData}
      isLoading={isLoading}
    />
  );
}
