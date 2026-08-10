'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  Activity,
  Cpu,
  Zap,
  Heart,
  Clock,
  RefreshCw,
  Rocket,
  Stethoscope,
  Sprout,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  Wrench,
  Shield,
  FolderOpen,
} from 'lucide-react';

// ─── Data Types ────────────────────────────────────────────────────────────────

interface WorkforceAgentData {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string;
  description: string;
  avatar: string;
  color: string;
  status: string;
  health: string;
  healthScore: number;
  skills: string;
  tools: string;
  mcpServers: string;
  ragSources: string;
  permissions: string;
  expertise: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  scheduleType: string;
  maxConcurrentTasks: number;
  priority: string;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  totalTokensUsed: number;
  successRate: number;
  lastActiveAt: string | null;
  _count?: { tasks: number; sessions: number; documents: number };
}

interface TaskData {
  id: string;
  title: string;
  taskType: string;
  status: string;
  priority: string;
  progress: number;
  createdAt: string;
  agentId: string;
  agent?: { name: string; avatar: string; color: string; slug: string };
}

interface WorkforceDashboardProps {
  agents: WorkforceAgentData[];
  tasks: TaskData[];
  onOpenWorkspace: (agent: WorkforceAgentData) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

// ─── Orchestration Feed Types ──────────────────────────────────────────────────

interface FeedEntry {
  id: string;
  timestamp: Date;
  agentName: string;
  agentAvatar: string;
  agentColor: string;
  department: string;
  action: string;
  status: 'running' | 'completed' | 'failed';
}

// ─── Utility Functions ─────────────────────────────────────────────────────────

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatFeedTimestamp(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function healthColor(score: number): string {
  if (score > 80) return '#10B981';
  if (score > 60) return '#F59E0B';
  if (score > 40) return '#F97316';
  return '#EF4444';
}

function healthLabel(score: number): string {
  if (score > 80) return 'Healthy';
  if (score > 60) return 'Fair';
  if (score > 40) return 'Degraded';
  return 'Critical';
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'active':
      return '#10B981';
    case 'busy':
      return '#F59E0B';
    case 'idle':
      return '#6B7280';
    case 'error':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

function departmentColor(dept: string): string {
  const colors: Record<string, string> = {
    Engineering: '#3B82F6',
    Sales: '#F59E0B',
    Marketing: '#EC4899',
    Operations: '#8B5CF6',
    Research: '#06B6D4',
    Finance: '#10B981',
    Support: '#F97316',
  };
  return colors[dept] || '#6B7280';
}

function countCommaList(value: string | undefined): number {
  if (!value || value.trim() === '') return 0;
  return value.split(',').filter((s) => s.trim() !== '').length;
}

// ─── Simulated Orchestration Feed ──────────────────────────────────────────────

const FEED_ACTIONS = [
  'executing task',
  'processing lead',
  'reviewing code',
  'writing documentation',
  'analyzing data',
  'generating report',
  'updating knowledge base',
  'running diagnostics',
  'syncing MCP server',
  'processing request',
  'training model',
  'deploying pipeline',
];

const FEED_STATUSES: Array<'running' | 'completed' | 'failed'> = [
  'running',
  'running',
  'running',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'failed',
];

function generateInitialFeed(agents: WorkforceAgentData[]): FeedEntry[] {
  if (agents.length === 0) return [];
  const now = Date.now();
  const entries: FeedEntry[] = [];
  for (let i = 0; i < 10; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    entries.push({
      id: `feed-init-${i}`,
      timestamp: new Date(now - Math.floor(Math.random() * 30 * 60 * 1000)),
      agentName: agent.name,
      agentAvatar: agent.avatar,
      agentColor: agent.color,
      department: agent.department,
      action: FEED_ACTIONS[Math.floor(Math.random() * FEED_ACTIONS.length)],
      status: FEED_STATUSES[Math.floor(Math.random() * FEED_STATUSES.length)],
    });
  }
  entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return entries;
}

function generateNextFeedEntry(
  agents: WorkforceAgentData[],
  counter: number
): FeedEntry {
  const agent = agents[Math.floor(Math.random() * agents.length)];
  return {
    id: `feed-${counter}`,
    timestamp: new Date(),
    agentName: agent.name,
    agentAvatar: agent.avatar,
    agentColor: agent.color,
    department: agent.department,
    action: FEED_ACTIONS[Math.floor(Math.random() * FEED_ACTIONS.length)],
    status: FEED_STATUSES[Math.floor(Math.random() * FEED_STATUSES.length)],
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function WorkforceDashboard({
  agents,
  tasks,
  onOpenWorkspace,
  onRefresh,
  isLoading = false,
}: WorkforceDashboardProps) {
  // ── State ──
  const [clock, setClock] = useState(new Date());
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [feedCounter, setFeedCounter] = useState(100);
  const [taskQueueOpen, setTaskQueueOpen] = useState(true);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // ── Clock ──
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Initialize feed ──
  useEffect(() => {
    if (agents.length > 0 && feedEntries.length === 0) {
      setFeedEntries(generateInitialFeed(agents));
    }
  }, [agents, feedEntries.length]);

  // ── Auto-scroll feed ──
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedEntries]);

  // ── Simulate new feed entries ──
  useEffect(() => {
    if (agents.length === 0) return;
    const timer = setInterval(() => {
      setFeedCounter((c) => {
        const next = c + 1;
        const entry = generateNextFeedEntry(agents, next);
        setFeedEntries((prev) => [...prev.slice(-50), entry]);
        return next;
      });
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(timer);
  }, [agents]);

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(
      (a) => a.status === 'active' || a.status === 'busy'
    ).length;
    const totalCompleted = agents.reduce((s, a) => s + a.tasksCompleted, 0);
    const avgSuccessRate =
      totalAgents > 0
        ? agents.reduce((s, a) => s + a.successRate, 0) / totalAgents
        : 0;
    const totalTokens = agents.reduce((s, a) => s + a.totalTokensUsed, 0);
    const avgHealth =
      totalAgents > 0
        ? agents.reduce((s, a) => s + a.healthScore, 0) / totalAgents
        : 0;
    const totalInProgress = agents.reduce(
      (s, a) => s + a.tasksInProgress,
      0
    );
    return {
      totalAgents,
      activeAgents,
      totalCompleted,
      avgSuccessRate,
      totalTokens,
      avgHealth,
      totalInProgress,
    };
  }, [agents]);

  // ── Department breakdown ──
  const departments = useMemo(() => {
    const map = new Map<
      string,
      { name: string; agents: WorkforceAgentData[] }
    >();
    agents.forEach((a) => {
      const existing = map.get(a.department);
      if (existing) {
        existing.agents.push(a);
      } else {
        map.set(a.department, { name: a.department, agents: [a] });
      }
    });
    return Array.from(map.values()).map((d) => ({
      name: d.name,
      agentCount: d.agents.length,
      avgHealth:
        d.agents.reduce((s, a) => s + a.healthScore, 0) / d.agents.length,
      totalTasks: d.agents.reduce(
        (s, a) => s + a.tasksCompleted + a.tasksInProgress,
        0
      ),
      color: departmentColor(d.name),
    }));
  }, [agents]);

  // ── Task status for current agents ──
  const agentTaskMap = useMemo(() => {
    const map = new Map<string, TaskData>();
    tasks.forEach((t) => {
      if (t.status === 'running' || t.status === 'in_progress') {
        if (!map.has(t.agentId)) map.set(t.agentId, t);
      }
    });
    return map;
  }, [tasks]);

  // ── Clock display ──
  const clockStr = clock.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ─── 1. Command Center Header ─── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Bot className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                AI Workforce Command Center
              </h1>
              <div
                className="h-0.5 w-36 rounded-full bg-emerald-500/60"
                style={{
                  boxShadow:
                    '0 0 12px 2px rgba(16,185,129,0.4), 0 0 24px 4px rgba(16,185,129,0.15)',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Clock */}
            <div className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-[#111118] px-3 py-1.5 font-mono text-sm text-emerald-400 sm:flex">
              <Clock className="h-3.5 w-3.5" />
              <span>{clockStr}</span>
            </div>

            {/* Quick actions */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-1.5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 sm:flex"
            >
              <Rocket className="h-3.5 w-3.5" />
              Deploy All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-1.5 text-white/70 hover:bg-white/10 hover:text-white sm:flex"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Health Check
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-1.5 text-white/70 hover:bg-white/10 hover:text-white sm:flex"
            >
              <Sprout className="h-3.5 w-3.5" />
              Seed Agents
            </Button>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
        {/* ─── 2. Global Metrics Bar ─── */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {/* Total Agents */}
          <Card className="border-white/10 bg-[#111118] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
                  <Bot className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center gap-0.5 text-xs text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Live</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">
                  {metrics.totalAgents}
                </p>
                <p className="mt-0.5 text-xs text-white/50">
                  {metrics.activeAgents} active / {metrics.totalAgents} total
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Completed */}
          <Card className="border-white/10 bg-[#111118] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex items-center gap-0.5 text-xs text-blue-400">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12%</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">
                  {formatNumber(metrics.totalCompleted)}
                </p>
                <p className="mt-0.5 text-xs text-white/50">
                  Tasks completed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="border-white/10 bg-[#111118] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15">
                  <Activity className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex items-center gap-0.5 text-xs text-violet-400">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+2.1%</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">
                  {metrics.avgSuccessRate.toFixed(1)}%
                </p>
                <p className="mt-0.5 text-xs text-white/50">
                  Avg success rate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Tokens */}
          <Card className="border-white/10 bg-[#111118] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="flex items-center gap-0.5 text-xs text-cyan-400">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>-8%</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">
                  {formatTokens(metrics.totalTokens)}
                </p>
                <p className="mt-0.5 text-xs text-white/50">
                  Total tokens used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Avg Health */}
          <Card className="col-span-2 border-white/10 bg-[#111118] shadow-none sm:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15">
                  <Heart className="h-4 w-4 text-rose-400" />
                </div>
                <div className="flex items-center gap-0.5 text-xs text-rose-400">
                  {metrics.avgHealth > 70 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3" />
                      <span>Stable</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3" />
                      <span>Alert</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">
                  {metrics.avgHealth.toFixed(0)}
                  <span className="text-sm font-normal text-white/40">
                    /100
                  </span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${metrics.avgHealth}%`,
                      backgroundColor: healthColor(metrics.avgHealth),
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── 3. Live Orchestration Feed ─── */}
        <section>
          <Card className="border-white/10 bg-[#111118] shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <Zap className="h-4 w-4 text-amber-400" />
                Live Orchestration Feed
                <span className="ml-1 inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ScrollArea className="h-48 w-full rounded-lg border border-white/5 bg-[#0a0a0f]">
                <div className="space-y-0.5 p-2">
                  {feedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
                    >
                      <span className="shrink-0 font-mono text-[11px] text-white/30">
                        {formatFeedTimestamp(entry.timestamp)}
                      </span>
                      <span className="shrink-0 text-base leading-none">
                        {entry.agentAvatar}
                      </span>
                      <span
                        className="shrink-0 text-xs font-medium"
                        style={{ color: entry.agentColor }}
                      >
                        {entry.agentName}
                      </span>
                      <span className="text-xs text-white/40">
                        {entry.action}
                      </span>
                      <span className="ml-auto shrink-0">
                        {entry.status === 'running' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            running
                          </span>
                        )}
                        {entry.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            done
                          </span>
                        )}
                        {entry.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                            <XCircle className="h-3 w-3" />
                            failed
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  <div ref={feedEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        {/* ─── 4. Agent Grid ─── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">
              Agent Workforce
            </h2>
            <Badge
              variant="secondary"
              className="border-white/10 bg-white/5 text-white/60"
            >
              {agents.length} agents
            </Badge>
          </div>

          {agents.length === 0 ? (
            <Card className="border-white/10 bg-[#111118] shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bot className="mb-3 h-10 w-10 text-white/20" />
                <p className="text-sm text-white/40">No agents deployed</p>
                <p className="mt-1 text-xs text-white/25">
                  Seed your workforce to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => {
                const currentTask = agentTaskMap.get(agent.id);
                const skillsCount = countCommaList(agent.skills);
                const toolsCount = countCommaList(agent.tools);
                const dotColor = statusDotColor(agent.status);
                const hColor = healthColor(agent.healthScore);
                const deptColor = departmentColor(agent.department);
                const isActive = agent.status === 'active';

                return (
                  <Card
                    key={agent.id}
                    className="group relative overflow-hidden border-white/10 bg-[#111118] shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      boxShadow: `inset 0 1px 0 0 ${agent.color}15, 0 0 0 0 transparent`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `inset 0 1px 0 0 ${agent.color}30, 0 4px 24px -4px ${agent.color}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `inset 0 1px 0 0 ${agent.color}15, 0 0 0 0 transparent`;
                    }}
                  >
                    {/* Top color accent line */}
                    <div
                      className="absolute inset-x-0 top-0 h-0.5"
                      style={{ backgroundColor: agent.color }}
                    />

                    <CardContent className="p-5">
                      {/* Row 1: Avatar + Name + Status */}
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          {agent.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-white">
                              {agent.name}
                            </h3>
                            {/* Status dot */}
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              {isActive && (
                                <span
                                  className="absolute inset-0 animate-ping rounded-full opacity-75"
                                  style={{ backgroundColor: dotColor }}
                                />
                              )}
                              <span
                                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: dotColor }}
                              />
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-white/50">
                            {agent.role}
                          </p>
                        </div>
                      </div>

                      {/* Row 2: Department badge + Health */}
                      <div className="mt-3 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="border-0 px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${deptColor}20`,
                            color: deptColor,
                          }}
                        >
                          {agent.department}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="border-0 bg-white/5 px-2 py-0.5 text-[10px] font-medium capitalize text-white/60"
                        >
                          {agent.status}
                        </Badge>
                      </div>

                      {/* Health bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-white/40">Health</span>
                          <span
                            className="font-medium"
                            style={{ color: hColor }}
                          >
                            {agent.healthScore} - {healthLabel(agent.healthScore)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${agent.healthScore}%`,
                              backgroundColor: hColor,
                            }}
                          />
                        </div>
                      </div>

                      {/* Current task */}
                      {currentTask && (
                        <div className="mt-3 rounded-lg border border-white/5 bg-[#0a0a0f] p-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                            <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                            Current Task
                          </div>
                          <p className="mt-1 truncate text-xs font-medium text-white/80">
                            {currentTask.title}
                          </p>
                          <div className="mt-2">
                            <Progress
                              value={currentTask.progress}
                              className="h-1 bg-white/10"
                            />
                          </div>
                        </div>
                      )}

                      {/* Quick stats */}
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-md bg-emerald-500/10 px-2 py-1.5 text-center">
                          <p className="text-xs font-bold text-emerald-400">
                            {agent.tasksCompleted}
                          </p>
                          <p className="text-[10px] text-white/40">Done</p>
                        </div>
                        <div className="rounded-md bg-amber-500/10 px-2 py-1.5 text-center">
                          <p className="text-xs font-bold text-amber-400">
                            {agent.tasksInProgress}
                          </p>
                          <p className="text-[10px] text-white/40">Active</p>
                        </div>
                        <div className="rounded-md bg-red-500/10 px-2 py-1.5 text-center">
                          <p className="text-xs font-bold text-red-400">
                            {agent.tasksFailed}
                          </p>
                          <p className="text-[10px] text-white/40">Failed</p>
                        </div>
                      </div>

                      {/* Skills / Tools counts */}
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-white/40">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {skillsCount} skills
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          {toolsCount} tools
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relativeTime(agent.lastActiveAt)}
                        </span>
                      </div>

                      {/* Open Workspace button */}
                      <Button
                        className="mt-3 w-full gap-1.5 border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenWorkspace(agent)}
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Open Workspace
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── 5. Global Task Queue Panel ─── */}
        <section>
          <Collapsible open={taskQueueOpen} onOpenChange={setTaskQueueOpen}>
            <Card className="border-white/10 bg-[#111118] shadow-none">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer select-none pb-2 transition-colors hover:bg-white/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white/80">
                      <Activity className="h-4 w-4 text-blue-400" />
                      Global Task Queue
                      <Badge
                        variant="secondary"
                        className="border-white/10 bg-white/5 text-[10px] text-white/50"
                      >
                        {tasks.length}
                      </Badge>
                    </CardTitle>
                    {taskQueueOpen ? (
                      <ChevronUp className="h-4 w-4 text-white/40" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white/40" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pb-4">
                  <ScrollArea className="h-64 w-full">
                    {tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Circle className="mb-2 h-8 w-8 text-white/15" />
                        <p className="text-xs text-white/30">
                          No tasks in queue
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-[11px] text-white/40">
                              Task
                            </TableHead>
                            <TableHead className="text-[11px] text-white/40">
                              Agent
                            </TableHead>
                            <TableHead className="text-[11px] text-white/40">
                              Status
                            </TableHead>
                            <TableHead className="text-[11px] text-white/40">
                              Priority
                            </TableHead>
                            <TableHead className="text-[11px] text-white/40">
                              Progress
                            </TableHead>
                            <TableHead className="text-[11px] text-white/40">
                              Created
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.slice(0, 20).map((task) => (
                            <TableRow
                              key={task.id}
                              className="border-white/5"
                            >
                              <TableCell className="max-w-[200px] truncate text-xs font-medium text-white/80">
                                {task.title}
                              </TableCell>
                              <TableCell className="text-xs text-white/60">
                                {task.agent ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span>{task.agent.avatar}</span>
                                    <span>{task.agent.name}</span>
                                  </span>
                                ) : (
                                  <span className="text-white/30">
                                    Unassigned
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <TaskStatusBadge status={task.status} />
                              </TableCell>
                              <TableCell>
                                <PriorityBadge priority={task.priority} />
                              </TableCell>
                              <TableCell className="text-xs text-white/60">
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={task.progress}
                                    className="h-1 w-16 bg-white/10"
                                  />
                                  <span className="text-[10px]">
                                    {task.progress}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] text-white/40">
                                {relativeTime(task.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </section>

        {/* ─── 6. Department Breakdown ─── */}
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-white/80">
              Department Breakdown
            </h2>
          </div>
          {departments.length === 0 ? (
            <Card className="border-white/10 bg-[#111118] shadow-none">
              <CardContent className="py-8 text-center text-xs text-white/30">
                No departments
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {departments.map((dept) => (
                <Card
                  key={dept.name}
                  className="border-white/10 bg-[#111118] shadow-none transition-all duration-300 hover:bg-[#1a1a24]"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                      <h3 className="text-xs font-semibold text-white/80">
                        {dept.name}
                      </h3>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/40">Agents</span>
                        <span className="font-medium text-white/70">
                          {dept.agentCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/40">Avg Health</span>
                        <span
                          className="font-medium"
                          style={{ color: healthColor(dept.avgHealth) }}
                        >
                          {dept.avgHealth.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/40">Total Tasks</span>
                        <span className="font-medium text-white/70">
                          {formatNumber(dept.totalTasks)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function TaskStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
        >
          completed
        </Badge>
      );
    case 'running':
    case 'in_progress':
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400"
        >
          <Loader2 className="mr-0.5 h-2.5 w-2.5 animate-spin" />
          running
        </Badge>
      );
    case 'failed':
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400"
        >
          failed
        </Badge>
      );
    case 'pending':
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50"
        >
          pending
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50"
        >
          {status}
        </Badge>
      );
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case 'critical':
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400"
        >
          critical
        </Badge>
      );
    case 'high':
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-orange-500/15 px-2 py-0.5 text-[10px] font-medium text-orange-400"
        >
          high
        </Badge>
      );
    case 'normal':
    case 'medium':
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400"
        >
          {priority}
        </Badge>
      );
    case 'low':
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50"
        >
          low
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="border-0 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50"
        >
          {priority}
        </Badge>
      );
  }
}
