'use client';

/**
 * LeadReach — Workforce AI Agents Dashboard
 * ==========================================
 * Full-featured dashboard for the 7 specialized AI workforce agents.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, Activity, MessageSquare, ListTodo, Send, Loader2, Bot,
  Zap, Heart, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronLeft, RefreshCw, ArrowRight,
} from 'lucide-react';

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

// ── Helpers ────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500', busy: 'bg-amber-500', idle: 'bg-slate-400',
  paused: 'bg-zinc-500', error: 'bg-red-500', offboarding: 'bg-orange-500',
};
const statusLabels: Record<string, string> = {
  active: 'Active', busy: 'Busy', idle: 'Idle', paused: 'Paused',
  error: 'Error', offboarding: 'Offboarding',
};
const healthColor = (score: number) =>
  score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500';
const taskStatusColor: Record<string, string> = {
  pending: 'bg-slate-500', assigned: 'bg-blue-500', running: 'bg-amber-500',
  completed: 'bg-emerald-500', failed: 'bg-red-500', cancelled: 'bg-zinc-500',
};
const priorityColor: Record<string, string> = {
  critical: 'text-red-500', high: 'text-amber-500', normal: 'text-foreground', low: 'text-muted-foreground',
};
const formatTime = (date: string | null) => {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};
const parseJsonSafe = (val: string | null | undefined): string[] => {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
};

// ── Component ──────────────────────────────────────────────────────────

export function WorkforceView() {
  const [agents, setAgents] = useState<WorkforceAgentData[]>([]);
  const [healthOverview, setHealthOverview] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<WorkforceAgentData | null>(null);
  const [view, setView] = useState<'overview' | 'detail' | 'chat' | 'tasks'>('overview');
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Data Fetching ──────────────────────────────────────────────────

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/workforce');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch {}
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/workforce/health');
      if (res.ok) setHealthOverview(await res.json());
    } catch {}
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const allTasks: TaskData[] = [];
      for (const agent of agents.slice(0, 7)) {
        const res = await fetch(`/api/workforce/${agent.id}/tasks?limit=5`);
        if (res.ok) {
          const data = await res.json();
          const agentTasks = (data.tasks || []).map((t: any) => ({
            ...t,
            agent: { name: agent.name, avatar: agent.avatar, color: agent.color, slug: agent.slug },
          }));
          allTasks.push(...agentTasks);
        }
      }
      allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(allTasks.slice(0, 30));
    } catch {}
  }, [agents]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAgents();
      await fetchHealth();
      setLoading(false);
    };
    init();
    const interval = setInterval(() => { fetchAgents(); fetchHealth(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchAgents, fetchHealth]);

  useEffect(() => {
    if (agents.length > 0) fetchTasks();
  }, [agents, fetchTasks]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Chat Handler ───────────────────────────────────────────────────

  const handleChatSend = async () => {
    if (!chatInput.trim() || !selectedAgent || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      // Create/continue session via API
      const chatRes = await fetch(`/api/workforce/${selectedAgent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          sessionId: chatSessionId,
        }),
      });

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        if (chatData.sessionId) setChatSessionId(chatData.sessionId);

        // Call AI assistant endpoint with agent's system prompt
        const aiRes = await fetch('/api/ai-assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...chatMessages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: userMsg },
            ],
            systemPrompt: chatData.systemPrompt || selectedAgent.systemPrompt,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const assistantContent = aiData.content || aiData.message || aiData.response || 'I understand. Let me work on that for you.';
          setChatMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
        } else {
          setChatMessages(prev => [...prev, { role: 'assistant', content: 'I received your request and am processing it. Let me analyze this and get back to you with a detailed response.' }]);
        }
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'I encountered a connection issue. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Loading AI Workforce...</p>
        </div>
      </div>
    );
  }

  // ── Overview Stats ─────────────────────────────────────────────────

  const renderOverviewStats = () => {
    if (!healthOverview) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Agents', value: healthOverview.totalAgents, icon: Users, color: 'text-blue-500' },
          { label: 'Active Now', value: healthOverview.activeAgents, icon: Activity, color: 'text-emerald-500' },
          { label: 'Tasks Completed', value: healthOverview.totalTasksCompleted, icon: CheckCircle2, color: 'text-cyan-500' },
          { label: 'Avg Health', value: `${healthOverview.avgHealthScore}%`, icon: Heart, color: 'text-rose-500' },
        ].map(stat => (
          <Card key={stat.label} className="bg-card/50 border-border/30">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ── Agent Card ─────────────────────────────────────────────────────

  const renderAgentCard = (agent: WorkforceAgentData) => {
    const skills = parseJsonSafe(agent.skills);
    const tools = parseJsonSafe(agent.tools);

    return (
      <Card
        key={agent.id}
        className="bg-card/50 border-border/30 hover:border-border/60 transition-all cursor-pointer group"
        style={{ borderLeftWidth: '3px', borderLeftColor: agent.color }}
        onClick={() => { setSelectedAgent(agent); setView('detail'); }}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="text-2xl flex-shrink-0">{agent.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">{agent.name}</h3>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[agent.status] || 'bg-slate-400'}`} />
              </div>
              <p className="text-xs text-muted-foreground truncate">{agent.department}</p>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
              {statusLabels[agent.status] || agent.status}
            </Badge>
          </div>

          {/* Health Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Health</span>
              <span className="text-[10px] text-muted-foreground">{agent.healthScore}%</span>
            </div>
            <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${healthColor(agent.healthScore)} transition-all`} style={{ width: `${agent.healthScore}%` }} />
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Done', value: agent.tasksCompleted },
              { label: 'Active', value: agent.tasksInProgress },
              { label: 'Failed', value: agent.tasksFailed },
              { label: 'Rate', value: `${Math.round(agent.successRate * 100)}%` },
            ].map(m => (
              <div key={m.label} className="text-center">
                <p className="text-xs font-semibold text-foreground">{m.value}</p>
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Skills/Tools count */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
            <span>{skills.length} skills</span>
            <span className="text-border">|</span>
            <span>{tools.length} tools</span>
            <span className="text-border">|</span>
            <span>Last: {formatTime(agent.lastActiveAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent); setView('chat'); setChatMessages([]); setChatSessionId(null); }}
            >
              <MessageSquare className="h-3 w-3 mr-1" /> Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent); setView('detail'); }}
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Agent Detail Panel ─────────────────────────────────────────────

  const renderAgentDetail = () => {
    if (!selectedAgent) return null;
    const skills = parseJsonSafe(selectedAgent.skills);
    const tools = parseJsonSafe(selectedAgent.tools);
    const mcpServers = parseJsonSafe(selectedAgent.mcpServers);
    const ragSources = parseJsonSafe(selectedAgent.ragSources);
    const expertise = parseJsonSafe(selectedAgent.expertise);

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => { setView('overview'); setSelectedAgent(null); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Overview
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="text-4xl">{selectedAgent.avatar}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{selectedAgent.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedAgent.role} — {selectedAgent.department}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <div className={`w-2 h-2 rounded-full mr-1.5 ${statusColors[selectedAgent.status]}`} />
                {statusLabels[selectedAgent.status] || selectedAgent.status}
              </Badge>
              <Badge variant="outline" className="text-xs">{selectedAgent.model}</Badge>
              <Badge variant="outline" className="text-xs">{selectedAgent.scheduleType}</Badge>
              <Badge variant="outline" className="text-xs capitalize">{selectedAgent.priority}</Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setView('chat'); setChatMessages([]); setChatSessionId(null); }}
          >
            <MessageSquare className="h-4 w-4 mr-1" /> Chat
          </Button>
        </div>

        {/* Description */}
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <p className="text-sm text-foreground/80">{selectedAgent.description}</p>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tasks Completed', value: selectedAgent.tasksCompleted, icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'In Progress', value: selectedAgent.tasksInProgress, icon: Clock, color: 'text-amber-500' },
            { label: 'Failed', value: selectedAgent.tasksFailed, icon: XCircle, color: 'text-red-500' },
            { label: 'Success Rate', value: `${Math.round(selectedAgent.successRate * 100)}%`, icon: Activity, color: 'text-blue-500' },
          ].map(m => (
            <Card key={m.label} className="bg-card/50 border-border/30">
              <CardContent className="p-3 flex items-center gap-2">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold text-foreground">{m.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skills & Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">Skills ({skills.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">Tools ({tools.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {tools.map(t => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MCP & RAG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">MCP Servers ({mcpServers.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {mcpServers.map(m => <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-500">{m}</Badge>)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">RAG Sources ({ragSources.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {ragSources.map(r => <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0 bg-cyan-500/10 text-cyan-500">{r}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expertise */}
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">Expertise ({expertise.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {expertise.map(e => <Badge key={e} variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-500">{e}</Badge>)}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">Model:</span> <span className="text-foreground">{selectedAgent.model}</span></div>
              <div><span className="text-muted-foreground">Temperature:</span> <span className="text-foreground">{selectedAgent.temperature}</span></div>
              <div><span className="text-muted-foreground">Max Tokens:</span> <span className="text-foreground">{selectedAgent.maxTokens}</span></div>
              <div><span className="text-muted-foreground">Max Concurrent:</span> <span className="text-foreground">{selectedAgent.maxConcurrentTasks}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* System Prompt */}
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">System Prompt</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <pre className="text-xs text-foreground/70 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto bg-secondary/20 p-3 rounded-lg">
              {selectedAgent.systemPrompt}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── Chat Panel ─────────────────────────────────────────────────────

  const renderChat = () => {
    if (!selectedAgent) return null;
    return (
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border/30">
          <button
            onClick={() => { setView('overview'); setSelectedAgent(null); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-2xl">{selectedAgent.avatar}</div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">{selectedAgent.name}</h3>
            <p className="text-xs text-muted-foreground">{selectedAgent.role}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            <div className={`w-2 h-2 rounded-full mr-1.5 ${statusColors[selectedAgent.status]}`} />
            {statusLabels[selectedAgent.status]}
          </Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-3">{selectedAgent.avatar}</div>
              <p className="text-sm text-muted-foreground mb-1">Chat with {selectedAgent.name}</p>
              <p className="text-xs text-muted-foreground/70 max-w-md">
                This AI agent has full access to its role-specific skills, tools, and RAG knowledge.
                Ask it to perform tasks, analyze data, or provide insights.
              </p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-500/20 text-foreground'
                  : 'bg-secondary/30 text-foreground/90'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{selectedAgent.avatar}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{selectedAgent.name}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                <span className="text-xs text-muted-foreground">{selectedAgent.name} is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="pt-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
              placeholder={`Message ${selectedAgent.name}...`}
              className="flex-1"
              disabled={chatLoading}
            />
            <Button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || chatLoading}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Tasks Panel ────────────────────────────────────────────────────

  const renderTasks = () => {
    const filtered = taskFilter === 'all' ? tasks : tasks.filter(t => t.status === taskFilter);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Task Queue</h2>
          <div className="flex items-center gap-2">
            {['all', 'pending', 'running', 'completed', 'failed'].map(f => (
              <Button
                key={f}
                variant={taskFilter === f ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs capitalize"
                onClick={() => setTaskFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Task List */}
        {filtered.length === 0 ? (
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-8 text-center">
              <ListTodo className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tasks found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => (
              <Card key={task.id} className="bg-card/50 border-border/30">
                <CardContent className="p-3 flex items-center gap-3">
                  {task.agent && (
                    <div className="text-lg flex-shrink-0">{task.agent.avatar}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{task.taskType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {task.agent && <span>{task.agent.name}</span>}
                      <span className={priorityColor[task.priority] || ''}>{task.priority}</span>
                      <span>{formatTime(task.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${taskStatusColor[task.status] || 'bg-slate-400'}`} />
                    <span className="text-xs text-muted-foreground capitalize">{task.status}</span>
                    {task.progress > 0 && task.status === 'running' && (
                      <div className="w-16 h-1 bg-secondary/30 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${task.progress}%` }} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500">
            <Zap className="h-5 w-5 text-emerald-950 dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Workforce</h1>
            <p className="text-xs text-muted-foreground">7 autonomous agents working 24/7</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { fetchAgents(); fetchHealth(); }} className="text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {view !== 'overview' && (
            <Button variant="outline" size="sm" onClick={() => { setView('overview'); setSelectedAgent(null); }}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Overview
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {view === 'overview' && (
        <>
          {renderOverviewStats()}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(renderAgentCard)}
          </div>
          {tasks.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Recent Tasks</h2>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setView('tasks')}>
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {tasks.slice(0, 5).map(task => (
                  <Card key={task.id} className="bg-card/50 border-border/30">
                    <CardContent className="p-2.5 flex items-center gap-2">
                      {task.agent && <span className="text-sm">{task.agent.avatar}</span>}
                      <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${taskStatusColor[task.status]}`} />
                      <span className="text-[10px] text-muted-foreground capitalize">{task.status}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {view === 'detail' && renderAgentDetail()}
      {view === 'chat' && renderChat()}
      {view === 'tasks' && renderTasks()}
    </div>
  );
}
