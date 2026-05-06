'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  Search,
  Database,
  Globe,
  Target,
  Mail,
  GitBranch,
  BarChart3,
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
  Zap,
  RefreshCw,
  Play,
  Radio,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { AgentName } from '@/lib/types';
import { AGENT_DEFINITIONS } from '@/lib/types';
import { getChannelStatusColor, getChannelStatusLabel, getTierLabel, mapAgentToChannels } from '@/lib/agent-reach';

interface AgentTask {
  id: string;
  agentName: string;
  taskType: string;
  status: string;
  progress: number;
  priority: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  input: string | null;
  output: string | null;
  error: string | null;
}

interface AgentStats {
  completed: number;
  running: number;
  failed: number;
  pending: number;
}

interface Channel {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  status: string;
  tier: number;
  backend: string | null;
  message: string | null;
  lastChecked: string | null;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  orchestrator: Brain,
  'prospect-discovery': Search,
  'data-enrichment': Database,
  'web-research': Globe,
  'lead-qualification': Target,
  'outreach-composer': Mail,
  'pipeline-manager': GitBranch,
  'report-generator': BarChart3,
};

export function AgentsView() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [agentStats, setAgentStats] = useState<Record<string, AgentStats>>({});
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorRunning, setDoctorRunning] = useState(false);
  const [executingTask, setExecutingTask] = useState<string | null>(null);
  const [executionLog, setExecutionLog] = useState<Array<{ taskId: string; agentName: string; status: string; channels: string[] }>>([]);

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 seconds to catch running task updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, channelsRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/agent-reach'),
      ]);
      const tasksData = await tasksRes.json();
      const channelsData = await channelsRes.json();

      setTasks(tasksData.tasks || []);
      setAgentStats(tasksData.agentStats || {});
      setChannels(channelsData);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const runDoctor = async () => {
    setDoctorRunning(true);
    try {
      const res = await fetch('/api/agent-reach', { method: 'POST' });
      const data = await res.json();
      setChannels(data);
    } catch (error) {
      console.error('Error running doctor:', error);
    } finally {
      setDoctorRunning(false);
    }
  };

  const executePendingTasks = async () => {
    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'all' }),
      });
      const data = await res.json();

      // Update execution log
      if (data.results) {
        setExecutionLog(prev => [
          ...data.results.map((r: { taskId: string; agentName: string; success: boolean }) => ({
            taskId: r.taskId,
            agentName: r.agentName,
            status: r.success ? 'completed' : 'failed',
            channels: [],
          })),
          ...prev,
        ].slice(0, 20));
      }

      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error executing tasks:', error);
    }
  };

  const executeSingleTask = async (taskId: string) => {
    setExecutingTask(taskId);
    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'single', taskId }),
      });
      const data = await res.json();

      setExecutionLog(prev => [{
        taskId,
        agentName: tasks.find(t => t.id === taskId)?.agentName || 'unknown',
        status: data.success ? 'completed' : 'failed',
        channels: data.channelActivity?.filter((c: { success: boolean }) => c.success).map((c: { channel: string }) => c.channel) || [],
      }, ...prev].slice(0, 20));

      await loadData();
    } catch (error) {
      console.error('Error executing task:', error);
    } finally {
      setExecutingTask(null);
    }
  };

  const getAgentStatus = (name: AgentName): 'active' | 'idle' | 'processing' | 'error' => {
    const stats = agentStats[name];
    if (!stats) return 'idle';
    if (stats.running > 0) return 'processing';
    if (stats.failed > 0 && stats.completed === 0) return 'error';
    if (stats.completed > 0) return 'active';
    return 'idle';
  };

  const getAgentCurrentTask = (name: AgentName): string | null => {
    const running = tasks.find((t) => t.agentName === name && t.status === 'running');
    if (running) {
      try {
        const input = running.input ? JSON.parse(running.input) : {};
        return input.query || input.description || input.action || `${running.taskType} in progress`;
      } catch {
        return `${running.taskType} in progress`;
      }
    }
    return null;
  };

  const getAgentRunningProgress = (name: AgentName): number | null => {
    const running = tasks.find((t) => t.agentName === name && t.status === 'running');
    return running ? running.progress : null;
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const runningTasks = tasks.filter(t => t.status === 'running');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-secondary/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Agents</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage your agentic workforce — powered by Agent-Reach
          </p>
        </div>
        <div className="flex items-center gap-2">
          {runningTasks.length > 0 && (
            <Badge variant="outline" className="gap-1.5 border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
              <Radio className="h-3 w-3 animate-pulse" />
              {runningTasks.length} running
            </Badge>
          )}
          {pendingTasks.length > 0 && (
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={executePendingTasks}
              disabled={!!executingTask}
            >
              <Play className="h-3.5 w-3.5" />
              Execute All ({pendingTasks.length})
            </Button>
          )}
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {AGENT_DEFINITIONS.map((def) => {
          const Icon = AGENT_ICONS[def.name] || Brain;
          const status = getAgentStatus(def.name);
          const stats = agentStats[def.name] || { completed: 0, running: 0, failed: 0, pending: 0 };
          const currentTask = getAgentCurrentTask(def.name);
          const progress = getAgentRunningProgress(def.name);
          const agentChannels = mapAgentToChannels(def.name);
          const activeChannels = agentChannels.filter(ch => {
            const channel = channels.find(c => c.name === ch);
            return channel && (channel.status === 'ok' || channel.status === 'warn');
          });

          return (
            <Card key={def.name} className="card-premium border-border/30 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: def.color }}
              />
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `${def.color}12`, color: def.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        status === 'processing'
                          ? 'bg-cyan-400 animate-pulse'
                          : status === 'active'
                          ? 'bg-emerald-400'
                          : status === 'error'
                          ? 'bg-red-400'
                          : 'bg-gray-600'
                      }`}
                    />
                    <span className="text-[10px] capitalize text-muted-foreground">
                      {status}
                    </span>
                  </div>
                </div>

                <h3 className="mt-3 font-semibold text-sm text-foreground/90">{def.displayName}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {def.description}
                </p>

                {/* Agent-Reach Channels Indicator */}
                {agentChannels.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <Wifi className="h-3 w-3 text-emerald-400/60" />
                    {agentChannels.slice(0, 4).map(ch => (
                      <span
                        key={ch}
                        className={`text-[9px] px-1.5 py-0.5 rounded ${
                          activeChannels.includes(ch)
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                        }`}
                      >
                        {ch}
                      </span>
                    ))}
                    {agentChannels.length > 4 && (
                      <span className="text-[9px] text-muted-foreground">+{agentChannels.length - 4}</span>
                    )}
                  </div>
                )}

                {agentChannels.length === 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <WifiOff className="h-3 w-3 text-gray-500/60" />
                    <span className="text-[9px] text-muted-foreground">DB-only agent</span>
                  </div>
                )}

                {currentTask && (
                  <div className="mt-3 rounded-md bg-cyan-500/5 border border-cyan-500/10 p-2">
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
                      <span className="text-xs text-cyan-400 font-medium truncate">
                        {currentTask}
                      </span>
                    </div>
                    {progress !== null && (
                      <Progress value={progress} className="h-1 mt-1.5 bg-secondary/40" />
                    )}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                  <div className="rounded bg-emerald-500/8 p-1.5">
                    <div className="text-xs font-bold text-emerald-400">{stats.completed}</div>
                    <div className="text-[9px] text-muted-foreground">Done</div>
                  </div>
                  <div className="rounded bg-cyan-500/8 p-1.5">
                    <div className="text-xs font-bold text-cyan-400">{stats.running}</div>
                    <div className="text-[9px] text-muted-foreground">Active</div>
                  </div>
                  <div className="rounded bg-red-500/8 p-1.5">
                    <div className="text-xs font-bold text-red-400">{stats.failed}</div>
                    <div className="text-[9px] text-muted-foreground">Failed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Execution Engine Status */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <Activity className="h-4 w-4 text-cyan-400" />
              Execution Engine
            </CardTitle>
            <div className="flex items-center gap-2">
              {runningTasks.length > 0 ? (
                <Badge variant="outline" className="gap-1 border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Processing
                </Badge>
              ) : pendingTasks.length > 0 ? (
                <Badge variant="outline" className="gap-1 border-amber-500/20 text-amber-400 bg-amber-500/5 text-[10px]">
                  {pendingTasks.length} queued
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-[10px]">
                  Idle
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-center">
              <div className="text-lg font-bold text-amber-400">{pendingTasks.length}</div>
              <div className="text-[10px] text-muted-foreground">Queued</div>
            </div>
            <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-3 text-center">
              <div className="text-lg font-bold text-cyan-400">{runningTasks.length}</div>
              <div className="text-[10px] text-muted-foreground">Running</div>
            </div>
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">{tasks.filter(t => t.status === 'completed').length}</div>
              <div className="text-[10px] text-muted-foreground">Completed</div>
            </div>
            <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3 text-center">
              <div className="text-lg font-bold text-red-400">{tasks.filter(t => t.status === 'failed').length}</div>
              <div className="text-[10px] text-muted-foreground">Failed</div>
            </div>
          </div>

          {/* Recent Execution Log */}
          {executionLog.length > 0 && (
            <div className="space-y-1.5 mt-3">
              <div className="text-xs font-medium text-muted-foreground">Recent Executions</div>
              {executionLog.slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {log.status === 'completed' ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                  )}
                  <span className="text-foreground/80">{log.agentName.replace(/-/g, ' ')}</span>
                  {log.channels.length > 0 && (
                    <span className="text-muted-foreground">
                      via {log.channels.join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent-Reach Panel */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <Zap className="h-4 w-4 text-amber-400" />
              Agent-Reach Channels
              <span className="text-[10px] font-normal text-muted-foreground ml-1">
                ({channels.filter(c => c.status === 'ok').length}/{channels.length} active)
              </span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 transition-all"
              onClick={runDoctor}
              disabled={doctorRunning}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${doctorRunning ? 'animate-spin' : ''}`} />
              Run Doctor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center gap-3 rounded-lg border border-border/25 bg-secondary/10 p-3 transition-colors hover:bg-secondary/15"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${getChannelStatusColor(channel.status as Parameters<typeof getChannelStatusColor>[0])}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground/90">{channel.displayName}</span>
                    <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                      {getTierLabel(channel.tier)}
                    </Badge>
                    {/* Show which agents use this channel */}
                    {AGENT_DEFINITIONS.filter(def => mapAgentToChannels(def.name).includes(channel.name)).length > 0 && (
                      <span className="text-[9px] text-cyan-400/70">
                        → {AGENT_DEFINITIONS.filter(def => mapAgentToChannels(def.name).includes(channel.name)).map(def => def.displayName).join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {channel.description || channel.message}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      channel.status === 'ok'
                        ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                        : channel.status === 'warn'
                        ? 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                        : channel.status === 'off'
                        ? 'border-gray-500/20 text-gray-500 bg-gray-500/5'
                        : 'border-red-500/20 text-red-400 bg-red-500/5'
                    }`}
                  >
                    {getChannelStatusLabel(channel.status as Parameters<typeof getChannelStatusLabel>[0])}
                  </Badge>
                  {channel.backend && (
                    <div className="text-[9px] text-muted-foreground mt-1">
                      {channel.backend}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Queue */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground/90">Task Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No tasks yet</p>
                <p className="text-xs mt-1">Use the AI chat to create tasks, or visit Campaigns to start a new campaign</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-border/25 bg-secondary/10 p-2.5 transition-colors hover:bg-secondary/15"
                >
                  <div className="shrink-0">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : task.status === 'running' ? (
                      <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                    ) : task.status === 'failed' ? (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground/90 truncate">
                      {task.agentName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      <span className="text-muted-foreground"> • {task.taskType}</span>
                    </div>
                    {task.status === 'running' && (
                      <div className="mt-1">
                        <Progress value={task.progress} className="h-1 bg-secondary/40" />
                        <span className="text-[9px] text-cyan-400/60">{task.progress}%</span>
                      </div>
                    )}
                    {task.error && (
                      <div className="text-[10px] text-red-400/70 mt-0.5 truncate">{task.error}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        onClick={() => executeSingleTask(task.id)}
                        disabled={!!executingTask}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    )}
                    <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">P{task.priority}</Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        task.status === 'completed'
                          ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                          : task.status === 'running'
                          ? 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5'
                          : task.status === 'failed'
                          ? 'border-red-500/20 text-red-400 bg-red-500/5'
                          : 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                      }`}
                    >
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
