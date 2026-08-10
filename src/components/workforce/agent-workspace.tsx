'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  ArrowLeft,
  Bot,
  Activity,
  Cpu,
  Zap,
  Heart,
  Clock,
  RefreshCw,
  Wrench,
  Shield,
  Database,
  Globe,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  Send,
  Plus,
  Search,
  FileText,
  Brain,
  Settings,
  BarChart3,
  MessageSquare,
  Eye,
  Play,
  X,
  Sparkles,
  Terminal,
  Server,
  Lock,
  Unlock,
  FolderOpen,
  Upload,
  Timer,
  TrendingUp,
  AlertCircle,
  Pause,
  RotateCcw,
  Layers,
  Target,
  Workflow,
  Gauge,
  CalendarClock,
  Users,
  MessageCircle,
  BookOpen,
  Lightbulb,
  Rocket,
  ArrowRight,
  Power,
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

interface AgentWorkspaceProps {
  agent: WorkforceAgentData;
  onBack: () => void;
}

// ─── Chat Message Type ────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

// ─── Activity Entry Type ──────────────────────────────────────────────────────

interface ActivityEntry {
  id: string;
  timestamp: Date;
  actionType: string;
  description: string;
  result: 'success' | 'fail' | 'running';
}

// ─── Knowledge Document Type ──────────────────────────────────────────────────

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  tags: string[];
  contentPreview: string;
  lastUpdated: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function parseJsonField(field: string | null | undefined): string[] {
  if (!field) return [];
  try {
    const parsed = JSON.parse(field);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
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

function healthColor(score: number): string {
  if (score > 80) return '#10B981';
  if (score > 60) return '#F59E0B';
  if (score > 40) return '#F97316';
  return '#EF4444';
}

function permissionColor(perm: string): string {
  const lower = perm.toLowerCase();
  if (lower.includes('admin')) return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (lower.includes('deploy')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (lower.includes('write')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (lower.includes('read')) return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
  if (lower.includes('manage')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  return 'bg-secondary text-muted-foreground border-border';
}

function priorityBadgeStyle(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'low':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-secondary text-muted-foreground border-border';
  }
}

// ─── Simulated Data ───────────────────────────────────────────────────────────

function generateSimulatedTasks(agentId: string): TaskData[] {
  return [
    { id: 't1', title: 'Refactor authentication module', taskType: 'feature-development', status: 'running', priority: 'high', progress: 67, createdAt: new Date(Date.now() - 3600000).toISOString(), agentId },
    { id: 't2', title: 'Fix memory leak in worker pool', taskType: 'bug-fix', status: 'running', priority: 'critical', progress: 42, createdAt: new Date(Date.now() - 7200000).toISOString(), agentId },
    { id: 't3', title: 'Review PR #247 - API changes', taskType: 'code-review', status: 'pending', priority: 'medium', progress: 0, createdAt: new Date(Date.now() - 1800000).toISOString(), agentId },
    { id: 't4', title: 'Research GraphQL federation patterns', taskType: 'research', status: 'pending', priority: 'low', progress: 0, createdAt: new Date(Date.now() - 900000).toISOString(), agentId },
    { id: 't5', title: 'Update deployment pipeline docs', taskType: 'documentation', status: 'completed', priority: 'medium', progress: 100, createdAt: new Date(Date.now() - 86400000).toISOString(), agentId },
    { id: 't6', title: 'Analyze Q4 performance metrics', taskType: 'analysis', status: 'completed', priority: 'high', progress: 100, createdAt: new Date(Date.now() - 172800000).toISOString(), agentId },
    { id: 't7', title: 'Fix CORS headers on staging', taskType: 'bug-fix', status: 'failed', priority: 'high', progress: 30, createdAt: new Date(Date.now() - 43200000).toISOString(), agentId },
  ];
}

function generateSimulatedActivity(): ActivityEntry[] {
  const actions = [
    { actionType: 'task', description: 'Started task: Refactor authentication module', result: 'running' as const },
    { actionType: 'tool', description: 'Executed code_search tool for "auth patterns"', result: 'success' as const },
    { actionType: 'mcp', description: 'Queried MCP server: github-api for PR data', result: 'success' as const },
    { actionType: 'rag', description: 'Retrieved context from RAG: internal-docs', result: 'success' as const },
    { actionType: 'task', description: 'Completed task: Update deployment pipeline docs', result: 'success' as const },
    { actionType: 'chat', description: 'Responded to user query about API design', result: 'success' as const },
    { actionType: 'tool', description: 'Executed file_write tool for config update', result: 'success' as const },
    { actionType: 'task', description: 'Task failed: Fix CORS headers on staging', result: 'fail' as const },
    { actionType: 'permission', description: 'Checked deploy permission - granted', result: 'success' as const },
    { actionType: 'rag', description: 'Indexed new documents into knowledge base', result: 'success' as const },
  ];
  return actions.map((a, i) => ({
    id: `a${i}`,
    timestamp: new Date(Date.now() - i * 300000 - Math.random() * 120000),
    ...a,
  }));
}

function generateSimulatedDocuments(): KnowledgeDoc[] {
  return [
    { id: 'd1', title: 'Standard Operating Procedures', category: 'SOP', tags: ['operations', 'standard'], contentPreview: 'This document outlines the standard operating procedures for all automated workflows within the system. It covers error handling, retry logic, and escalation protocols...', lastUpdated: new Date(Date.now() - 86400000).toISOString() },
    { id: 'd2', title: 'Incident Response Runbook', category: 'Runbook', tags: ['incident', 'response', 'emergency'], contentPreview: 'When a critical incident is detected, follow these steps: 1) Assess severity, 2) Notify stakeholders, 3) Begin mitigation, 4) Document findings, 5) Implement prevention...', lastUpdated: new Date(Date.now() - 172800000).toISOString() },
    { id: 'd3', title: 'Code Review Playbook', category: 'Playbook', tags: ['review', 'quality', 'best-practices'], contentPreview: 'Effective code reviews require structured approach. Check for: security vulnerabilities, performance bottlenecks, test coverage, API compatibility, and documentation...', lastUpdated: new Date(Date.now() - 43200000).toISOString() },
    { id: 'd4', title: 'API Design Reference', category: 'Reference', tags: ['api', 'rest', 'graphql'], contentPreview: 'RESTful API design principles: resource naming, HTTP methods, status codes, pagination, filtering, versioning. GraphQL schema design: types, resolvers, mutations...', lastUpdated: new Date(Date.now() - 259200000).toISOString() },
    { id: 'd5', title: 'Onboarding Training Guide', category: 'Training', tags: ['onboarding', 'training'], contentPreview: 'Welcome to the AI Workforce. This guide covers: system architecture, tool usage, MCP connections, RAG sources, permission levels, and communication protocols...', lastUpdated: new Date(Date.now() - 345600000).toISOString() },
  ];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentWorkspace({ agent, onBack }: AgentWorkspaceProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState<TaskData[]>(() => generateSimulatedTasks(agent.id));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() => generateSimulatedActivity());
  const [documents] = useState<KnowledgeDoc[]>(() => generateSimulatedDocuments());
  const [uptime, setUptime] = useState(0);

  // Task creation form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('feature-development');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  // Training & Config
  const [editTemperature, setEditTemperature] = useState(agent.temperature);
  const [editMaxTokens, setEditMaxTokens] = useState(agent.maxTokens);
  const [editSystemPrompt, setEditSystemPrompt] = useState(agent.systemPrompt);
  const [promptSaved, setPromptSaved] = useState(false);

  // Activity filter
  const [activityFilter, setActivityFilter] = useState('all');

  // Knowledge search
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [knowledgeCategory, setKnowledgeCategory] = useState('all');

  // Collapsible completed tasks
  const [completedOpen, setCompletedOpen] = useState(false);

  // Chat session
  const [sessionId] = useState(() => `session-${Date.now()}`);

  // Doc search in training
  const [docSearch, setDocSearch] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Parsed agent data ──────────────────────────────────────────────────────
  const skills = parseJsonField(agent.skills);
  const tools = parseJsonField(agent.tools);
  const mcpServers = parseJsonField(agent.mcpServers);
  const ragSources = parseJsonField(agent.ragSources);
  const permissions = parseJsonField(agent.permissions);
  const expertiseList = parseJsonField(agent.expertise);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initial greeting from agent
  useEffect(() => {
    if (chatMessages.length === 0) {
      const timer = setTimeout(() => {
        setChatMessages([{
          id: 'greeting',
          role: 'agent',
          content: `Hello! I'm ${agent.name}, your ${agent.role}. I'm currently ${agent.status} and ready to assist you. I have ${skills.length} skills and ${tools.length} tools at my disposal. How can I help you today?`,
          timestamp: new Date(),
        }]);
      }, 800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulated activity feed auto-update
  useEffect(() => {
    const interval = setInterval(() => {
      const newActions = [
        { actionType: 'tool', description: `Executed ${tools[Math.floor(Math.random() * tools.length)] || 'system'} tool`, result: 'success' as const },
        { actionType: 'task', description: 'Processing queued task', result: 'running' as const },
        { actionType: 'rag', description: 'Retrieved context from knowledge base', result: 'success' as const },
        { actionType: 'mcp', description: `Synced with ${mcpServers[Math.floor(Math.random() * mcpServers.length)] || 'server'}`, result: 'success' as const },
      ];
      const chosen = newActions[Math.floor(Math.random() * newActions.length)];
      setActivityLog((prev) => [
        { id: `a-${Date.now()}`, timestamp: new Date(), ...chosen },
        ...prev.slice(0, 49),
      ]);
    }, 8000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulated task progress
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.status === 'running' && t.progress < 95) {
            return { ...t, progress: Math.min(t.progress + Math.random() * 3, 98) };
          }
          return t;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Simulated agent response
    setTimeout(() => {
      const responses = [
        `I've analyzed your request. Based on my ${skills.length} skills and access to ${ragSources.length} data sources, here's my assessment: I can handle this efficiently. Let me process it now.`,
        `Understood. I'll use my ${tools.length} available tools to work through this. My ${agent.model} model is well-suited for this type of task. Starting execution...`,
        `Good question. Let me check my knowledge base and cross-reference with my MCP connections. I have ${mcpServers.length} servers I can query for additional context.`,
        `I'm on it. With a success rate of ${agent.successRate}% across ${agent.tasksCompleted} completed tasks, I'm confident in delivering results. Let me break this down into steps.`,
        `Processing your request now. I'll leverage my expertise in ${expertiseList.slice(0, 2).join(' and ')} to deliver the best outcome. I'll keep you updated on progress.`,
      ];
      const agentMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, agentMsg]);
    }, 1200 + Math.random() * 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatInput]);

  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;
    const newTask: TaskData = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      taskType: newTaskType,
      status: 'pending',
      priority: newTaskPriority,
      progress: 0,
      createdAt: new Date().toISOString(),
      agentId: agent.id,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskType('feature-development');
    setNewTaskPriority('medium');
  }, [newTaskTitle, newTaskType, newTaskPriority, agent.id]);

  const handleExecuteTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: 'running', progress: 5 } : t)
    );
  }, []);

  const handleCancelTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: 'failed', progress: t.progress } : t)
    );
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeTasks = tasks.filter((t) => t.status === 'running' || t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'failed');
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const runningCount = tasks.filter((t) => t.status === 'running').length;
  const completedToday = tasks.filter((t) => t.status === 'completed' && Date.now() - new Date(t.createdAt).getTime() < 86400000).length;
  const failedToday = tasks.filter((t) => t.status === 'failed' && Date.now() - new Date(t.createdAt).getTime() < 86400000).length;

  const filteredActivity = activityFilter === 'all'
    ? activityLog
    : activityLog.filter((a) => a.actionType === activityFilter);

  const filteredDocs = documents.filter((d) => {
    const matchesSearch = knowledgeSearch === '' || d.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) || d.contentPreview.toLowerCase().includes(knowledgeSearch.toLowerCase());
    const matchesCategory = knowledgeCategory === 'all' || d.category === knowledgeCategory;
    return matchesSearch && matchesCategory;
  });

  // Success rate data for bar chart
  const successRateData = [65, 72, 78, 82, 85, 88, agent.successRate];

  // Tasks over time data
  const tasksOverTime = [3, 5, 4, 7, 6, 8, 5, 9, 7, 6, 8, agent.tasksCompleted > 12 ? 12 : agent.tasksCompleted];

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs = [
    { value: 'overview', label: 'Overview', icon: Eye },
    { value: 'superpowers', label: 'Superpowers', icon: Zap },
    { value: 'tasks', label: 'Live Tasks', icon: Activity },
    { value: 'chat', label: 'Chat', icon: MessageSquare },
    { value: 'config', label: 'Training & Config', icon: Settings },
    { value: 'activity', label: 'Activity', icon: BarChart3 },
    { value: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Workspace Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Top row: back + avatar + name */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ArrowLeft className="size-5" />
            </Button>

            {/* Agent avatar with glow ring */}
            <div className="relative shrink-0">
              <div
                className="size-14 rounded-full flex items-center justify-center text-2xl"
                style={{
                  boxShadow: `0 0 20px ${agent.color}40, 0 0 40px ${agent.color}20`,
                  border: `2px solid ${agent.color}60`,
                }}
              >
                {agent.avatar}
              </div>
              {/* Status dot */}
              <div
                className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background"
                style={{ backgroundColor: statusDotColor(agent.status) }}
              >
                {agent.status === 'active' && (
                  <div
                    className="size-full rounded-full animate-ping"
                    style={{ backgroundColor: statusDotColor(agent.status), opacity: 0.4 }}
                  />
                )}
              </div>
            </div>

            {/* Name + Role */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{agent.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{agent.role}</span>
                <span className="text-foreground/30">|</span>
                <span>{agent.department}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                  style={{
                    borderColor: `${agent.color}50`,
                    color: agent.color,
                  }}
                >
                  {agent.status}
                </Badge>
              </div>
            </div>

            {/* Health score */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Heart className="size-4" style={{ color: healthColor(agent.healthScore) }} />
              <div className="w-24">
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${agent.healthScore}%`,
                      backgroundColor: healthColor(agent.healthScore),
                    }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono" style={{ color: healthColor(agent.healthScore) }}>
                {agent.healthScore}%
              </span>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-foreground/50">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span className="text-foreground/70 font-medium">{formatNumber(agent.tasksCompleted)}</span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Loader2 className="size-3.5 text-amber-400" />
              <span className="text-foreground/70 font-medium">{agent.tasksInProgress}</span>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-sky-400" />
              <span className="text-foreground/70 font-medium">{agent.successRate}%</span>
              <span>Success</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="size-3.5 text-purple-400" />
              <span className="text-foreground/70 font-medium">{formatNumber(agent.totalTokensUsed)}</span>
              <span>Tokens</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Timer className="size-3.5" />
              <span className="font-mono text-foreground/70">{formatUptime(uptime)}</span>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="mt-3 -mx-4 px-4 overflow-x-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent h-auto p-0 gap-1 w-full justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium data-[state=active]:shadow-none border border-transparent transition-all whitespace-nowrap"
                    style={{
                      color: activeTab === tab.value ? agent.color : undefined,
                    }}
                    // Using inline styles for active state coloring via CSS vars isn't clean,
                    // so we use a data attribute approach with custom className
                  >
                    <tab.icon className="size-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* ── Tab 1: Overview ──────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Agent description */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Bot className="size-4" style={{ color: agent.color }} />
                  About {agent.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{agent.description}</p>
              </CardContent>
            </Card>

            {/* Persona + Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Persona */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                    <Brain className="size-4" style={{ color: agent.color }} />
                    Persona
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Tone', value: 'Professional yet approachable' },
                    { label: 'Work Style', value: 'Systematic and thorough' },
                    { label: 'Decision Framework', value: 'Data-driven with risk assessment' },
                    { label: 'Communication Style', value: 'Concise, actionable, context-aware' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className="text-xs text-foreground/40 w-32 shrink-0 pt-0.5">{item.label}</span>
                      <span className="text-sm text-foreground/70">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Configuration Details */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                    <Settings className="size-4" style={{ color: agent.color }} />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: <Layers className="size-3.5" />, label: 'Department', value: agent.department },
                    { icon: <CalendarClock className="size-3.5" />, label: 'Schedule', value: agent.scheduleType.replace('_', ' ') },
                    { icon: <Workflow className="size-3.5" />, label: 'Max Concurrent', value: String(agent.maxConcurrentTasks) },
                    { icon: <Target className="size-3.5" />, label: 'Priority', value: agent.priority },
                    { icon: <Cpu className="size-3.5" />, label: 'Model', value: agent.model },
                    { icon: <Gauge className="size-3.5" />, label: 'Temperature', value: String(agent.temperature) },
                    { icon: <Zap className="size-3.5" />, label: 'Max Tokens', value: formatNumber(agent.maxTokens) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="text-foreground/40">{item.icon}</div>
                      <span className="text-xs text-foreground/40 w-28 shrink-0">{item.label}</span>
                      <span className="text-sm text-foreground/70 font-medium">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Success Rate Over Time */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <TrendingUp className="size-4" style={{ color: agent.color }} />
                  Success Rate Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-32">
                  {successRateData.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative" style={{ height: '100px' }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t transition-all duration-500"
                          style={{
                            height: `${val}%`,
                            backgroundColor: i === successRateData.length - 1 ? agent.color : `${agent.color}60`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-foreground/40">
                        {['6d', '5d', '4d', '3d', '2d', '1d', 'Now'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Active */}
            <Card className="bg-card border-border">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Power className="size-5" style={{ color: agent.color }} />
                    <div>
                      <span className="text-sm text-foreground/80 font-medium">Active Uptime</span>
                      <span className="text-xs text-foreground/40 ml-2">
                        Last active: {formatRelativeTime(agent.lastActiveAt)}
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl font-mono font-bold" style={{ color: agent.color }}>
                    {formatUptime(uptime)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tab 2: Superpowers ───────────────────────────────────────── */}
        {activeTab === 'superpowers' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Skills */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Sparkles className="size-4" style={{ color: agent.color }} />
                  Skills
                  <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                    {skills.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:border-border"
                      style={{
                        backgroundColor: `${agent.color}15`,
                        borderColor: `${agent.color}30`,
                        color: agent.color,
                      }}
                    >
                      <Sparkles className="size-3" />
                      {skill}
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-xs text-foreground/40">No skills configured</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tools */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Wrench className="size-4" style={{ color: agent.color }} />
                  Tools
                  <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                    {tools.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {tools.map((tool, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-input hover:border-border transition-colors"
                    >
                      <Wrench className="size-3.5 text-foreground/50" />
                      <span className="text-xs text-foreground/70 font-medium truncate">{tool}</span>
                    </div>
                  ))}
                  {tools.length === 0 && (
                    <span className="text-xs text-foreground/40">No tools configured</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* MCP Connections */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Server className="size-4" style={{ color: agent.color }} />
                  MCP Connections
                  <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                    {mcpServers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mcpServers.map((server, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-input"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="size-4 text-foreground/50" />
                        <span className="text-sm text-foreground/70 font-medium">{server}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-emerald-400">
                          <div className="size-full rounded-full bg-emerald-400 animate-ping opacity-40" />
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
                      </div>
                    </div>
                  ))}
                  {mcpServers.length === 0 && (
                    <span className="text-xs text-foreground/40">No MCP servers configured</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* RAG Sources */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Database className="size-4" style={{ color: agent.color }} />
                  RAG Sources
                  <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                    {ragSources.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ragSources.map((source, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-input"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="size-4 text-foreground/50" />
                        <span className="text-sm text-foreground/70 font-medium">{source}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                      </div>
                    </div>
                  ))}
                  {ragSources.length === 0 && (
                    <span className="text-xs text-foreground/40">No RAG sources configured</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Shield className="size-4" style={{ color: agent.color }} />
                  Permissions
                  <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                    {permissions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${permissionColor(perm)}`}
                    >
                      <Shield className="size-3" />
                      {perm}
                    </span>
                  ))}
                  {permissions.length === 0 && (
                    <span className="text-xs text-foreground/40">No permissions configured</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expertise */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Lightbulb className="size-4" style={{ color: agent.color }} />
                  Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {expertiseList.map((exp, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/50 border border-border text-foreground/70 hover:border-border transition-colors"
                    >
                      <Target className="size-3" />
                      {exp}
                    </span>
                  ))}
                  {expertiseList.length === 0 && (
                    <span className="text-xs text-foreground/40">No expertise areas defined</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tab 3: Live Tasks ────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Task Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Pending', value: pendingCount, icon: <Clock className="size-4 text-foreground/50" />, color: '#6B7280' },
                { label: 'Running', value: runningCount, icon: <Loader2 className="size-4 text-foreground/50 animate-spin" />, color: '#3B82F6' },
                { label: 'Completed Today', value: completedToday, icon: <CheckCircle2 className="size-4 text-emerald-400" />, color: '#10B981' },
                { label: 'Failed Today', value: failedToday, icon: <XCircle className="size-4 text-red-400" />, color: '#EF4444' },
              ].map((stat) => (
                <div key={stat.label} className="px-4 py-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    {stat.icon}
                    <span className="text-xs text-foreground/40">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Create Task Form */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Plus className="size-4" style={{ color: agent.color }} />
                  Create Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/50">Title</Label>
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title..."
                      className="bg-input border-border text-foreground text-sm placeholder:text-foreground/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/50">Priority</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger className="bg-input border-border text-foreground text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-foreground/50">Task Type</Label>
                  <Select value={newTaskType} onValueChange={setNewTaskType}>
                    <SelectTrigger className="bg-input border-border text-foreground text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {['feature-development', 'bug-fix', 'code-review', 'research', 'analysis', 'documentation', 'outreach', 'campaign', 'deployment', 'monitoring', 'other'].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-foreground/50">Description</Label>
                  <Textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Describe the task..."
                    rows={2}
                    className="bg-input border-border text-foreground text-sm placeholder:text-foreground/30 resize-none"
                  />
                </div>
                <Button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="w-full sm:w-auto"
                  style={{
                    backgroundColor: agent.color,
                    color: '#fff',
                  }}
                >
                  <Plus className="size-4 mr-1" />
                  Assign to {agent.name.split(' ')[0]}
                </Button>
              </CardContent>
            </Card>

            {/* Active Tasks */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Activity className="size-4" style={{ color: agent.color }} />
                  Active Tasks
                  <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                    {activeTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTasks.length === 0 ? (
                  <div className="text-center py-8 text-foreground/40 text-sm">
                    No active tasks. Create one above to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-lg border border-border bg-input space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-foreground/90 truncate">{task.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-foreground/50">
                                {task.taskType.replace(/-/g, ' ')}
                              </Badge>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${priorityBadgeStyle(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.status === 'running' && (
                              <div className="flex items-center gap-1">
                                <div className="size-2 rounded-full bg-blue-400">
                                  <div className="size-full rounded-full bg-blue-400 animate-ping opacity-40" />
                                </div>
                                <span className="text-[10px] text-blue-400">Running</span>
                              </div>
                            )}
                            {task.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <div className="size-2 rounded-full bg-white/30" />
                                <span className="text-[10px] text-foreground/40">Pending</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-foreground/40">Progress</span>
                            <span className="text-muted-foreground font-mono">{Math.round(task.progress)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${task.progress}%`,
                                backgroundColor: task.status === 'running' ? '#3B82F6' : agent.color,
                              }}
                            />
                          </div>
                        </div>
                        {/* Meta + Actions */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-foreground/30">
                            Created {formatRelativeTime(task.createdAt)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {task.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                onClick={() => handleExecuteTask(task.id)}
                              >
                                <Play className="size-3 mr-1" />
                                Execute
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleCancelTask(task.id)}
                            >
                              <X className="size-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px] text-foreground/50 hover:text-foreground/70 hover:bg-secondary"
                            >
                              <Eye className="size-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Tasks (collapsible) */}
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CollapsibleTrigger asChild>
                    <CardTitle className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer select-none">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      Completed / Failed
                      <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                        {completedTasks.length}
                      </Badge>
                      <ChevronDown className={`size-4 text-foreground/40 ml-auto transition-transform ${completedOpen ? 'rotate-180' : ''}`} />
                    </CardTitle>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    {completedTasks.length === 0 ? (
                      <span className="text-xs text-foreground/40">No completed tasks yet</span>
                    ) : (
                      <div className="space-y-2">
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 bg-background"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="size-3.5 text-red-400 shrink-0" />
                              )}
                              <span className="text-xs text-muted-foreground truncate">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-medium ${task.status === 'completed' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {task.status}
                              </span>
                              <span className="text-[10px] text-foreground/30">{formatRelativeTime(task.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        )}

        {/* ── Tab 4: Chat ──────────────────────────────────────────────── */}
        {activeTab === 'chat' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                    <MessageSquare className="size-4" style={{ color: agent.color }} />
                    Direct Communication
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-border text-foreground/40">
                      {agent.model}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-border text-foreground/40">
                      Session: {sessionId.slice(-6)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Chat messages area */}
                <ScrollArea className="h-80 sm:h-96 pr-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                            msg.role === 'user'
                              ? 'bg-secondary text-foreground/90 border border-border'
                              : 'border border-border/50 text-foreground/80'
                          }`}
                          style={
                            msg.role === 'agent'
                              ? { backgroundColor: `${agent.color}15`, borderColor: `${agent.color}30` }
                              : undefined
                          }
                        >
                          {msg.role === 'agent' && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-sm">{agent.avatar}</span>
                              <span className="text-[10px] font-medium" style={{ color: agent.color }}>
                                {agent.name}
                              </span>
                            </div>
                          )}
                          <p className="leading-relaxed">{msg.content}</p>
                          <span className="text-[10px] text-foreground/30 mt-1 block">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${agent.name}...`}
                    className="flex-1 bg-input border-border text-foreground text-sm placeholder:text-foreground/30"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    size="icon"
                    style={{ backgroundColor: agent.color }}
                  >
                    <Send className="size-4 text-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Prompt Preview */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Terminal className="size-4" style={{ color: agent.color }} />
                  System Prompt Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <p className="text-xs text-foreground/40 font-mono leading-relaxed whitespace-pre-wrap">
                    {agent.systemPrompt || 'No system prompt configured'}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tab 5: Training & Config ─────────────────────────────────── */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Model Configuration */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <Cpu className="size-4" style={{ color: agent.color }} />
                  Model Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/50">Model</Label>
                    <div className="px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground/70">
                      {agent.model}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/50">Schedule Type</Label>
                    <Select defaultValue={agent.scheduleType}>
                      <SelectTrigger className="bg-input border-border text-foreground text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="always_on">Always On</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="on_demand">On Demand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-foreground/50">Temperature</Label>
                    <span className="text-xs font-mono" style={{ color: agent.color }}>
                      {editTemperature.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[editTemperature]}
                    onValueChange={([v]) => setEditTemperature(v)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/50">Max Tokens</Label>
                    <Input
                      type="number"
                      value={editMaxTokens}
                      onChange={(e) => setEditMaxTokens(Number(e.target.value))}
                      className="bg-input border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/50">Max Concurrent Tasks</Label>
                    <Input
                      type="number"
                      defaultValue={agent.maxConcurrentTasks}
                      className="bg-input border-border text-foreground text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Prompt */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                    <Terminal className="size-4" style={{ color: agent.color }} />
                    System Prompt
                  </CardTitle>
                  <span className="text-[10px] text-foreground/30 font-mono">
                    {editSystemPrompt.length} chars
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={editSystemPrompt}
                  onChange={(e) => { setEditSystemPrompt(e.target.value); setPromptSaved(false); }}
                  rows={8}
                  className="bg-input border-border text-foreground text-xs font-mono placeholder:text-foreground/30 resize-none"
                />
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setPromptSaved(true)}
                    size="sm"
                    style={{ backgroundColor: agent.color }}
                  >
                    <CheckCircle2 className="size-3.5 mr-1" />
                    Save Prompt
                  </Button>
                  {promptSaved && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      Saved
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Base (in training) */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                    <BookOpen className="size-4" style={{ color: agent.color }} />
                    Knowledge Base
                    <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                      {agent._count?.documents ?? 0} docs
                    </Badge>
                  </CardTitle>
                  <Button size="sm" variant="outline" className="h-7 text-[11px] border-border text-muted-foreground hover:bg-secondary/50">
                    <Upload className="size-3 mr-1" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/30" />
                  <Input
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search documents..."
                    className="pl-9 bg-input border-border text-foreground text-sm placeholder:text-foreground/30"
                  />
                </div>
                <div className="space-y-2">
                  {documents
                    .filter((d) => docSearch === '' || d.title.toLowerCase().includes(docSearch.toLowerCase()))
                    .map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50 bg-input">
                        <FileText className="size-4 text-foreground/40 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs text-foreground/70 font-medium truncate block">{doc.title}</span>
                          <span className="text-[10px] text-foreground/30">{doc.category}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Training Status */}
            <Card className="bg-card border-border">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Rocket className="size-5" style={{ color: agent.color }} />
                    <div>
                      <span className="text-sm text-foreground/80 font-medium">Training Status</span>
                      <span className="text-xs text-foreground/40 ml-2">
                        {agent.successRate > 80 ? 'Fully trained and operational' : 'Needs performance tuning'}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px]"
                    style={{
                      borderColor: agent.successRate > 80 ? '#10B98150' : '#F59E0B50',
                      color: agent.successRate > 80 ? '#10B981' : '#F59E0B',
                    }}
                  >
                    {agent.successRate > 80 ? 'Fully Trained' : 'Needs Update'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tab 6: Activity ──────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Tasks Today', value: String(runningCount + completedToday), icon: <Activity className="size-4" />, color: agent.color },
                { label: 'Avg Duration', value: '4.2m', icon: <Timer className="size-4" />, color: '#F59E0B' },
                { label: 'Token Usage', value: formatNumber(agent.totalTokensUsed), icon: <Cpu className="size-4" />, color: '#8B5CF6' },
                { label: 'Success Rate', value: `${agent.successRate}%`, icon: <TrendingUp className="size-4" />, color: '#10B981' },
              ].map((metric) => (
                <div key={metric.label} className="px-4 py-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div style={{ color: metric.color }}>{metric.icon}</div>
                    <span className="text-xs text-foreground/40">{metric.label}</span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: metric.color }}>{metric.value}</span>
                </div>
              ))}
            </div>

            {/* Tasks Over Time Bar Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <BarChart3 className="size-4" style={{ color: agent.color }} />
                  Tasks Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1.5 h-28">
                  {tasksOverTime.map((val, i) => {
                    const maxVal = Math.max(...tasksOverTime);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative" style={{ height: '80px' }}>
                          <div
                            className="absolute bottom-0 w-full rounded-t transition-all duration-300"
                            style={{
                              height: `${(val / maxVal) * 100}%`,
                              backgroundColor: i === tasksOverTime.length - 1 ? agent.color : `${agent.color}50`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-foreground/30">{`W${i + 1}`}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Live Activity Feed */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                    <Activity className="size-4" style={{ color: agent.color }} />
                    Live Activity Feed
                  </CardTitle>
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger className="h-7 w-28 text-[11px] bg-input border-border text-muted-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="task">Tasks</SelectItem>
                      <SelectItem value="tool">Tools</SelectItem>
                      <SelectItem value="mcp">MCP</SelectItem>
                      <SelectItem value="rag">RAG</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72">
                  <div className="space-y-1.5">
                    {filteredActivity.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <span className="text-[10px] text-foreground/30 font-mono w-14 shrink-0 pt-0.5">
                          {entry.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {entry.result === 'success' && <CheckCircle2 className="size-3 text-emerald-400" />}
                          {entry.result === 'fail' && <XCircle className="size-3 text-red-400" />}
                          {entry.result === 'running' && <Loader2 className="size-3 text-blue-400 animate-spin" />}
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-foreground/40 shrink-0">
                          {entry.actionType}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">{entry.description}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Session History */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground/80">
                  <MessageCircle className="size-4" style={{ color: agent.color }} />
                  Session History
                  <Badge variant="outline" className="ml-2 text-[10px] border-border text-foreground/40">
                    {agent._count?.sessions ?? 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { purpose: 'API design review discussion', messages: 12, created: '2h ago', last: '1h ago' },
                    { purpose: 'Bug triage for staging', messages: 8, created: '6h ago', last: '5h ago' },
                    { purpose: 'Onboarding walkthrough', messages: 24, created: '1d ago', last: '1d ago' },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/50 bg-input hover:border-border transition-colors cursor-pointer">
                      <div className="min-w-0">
                        <span className="text-xs text-foreground/70 font-medium block truncate">{session.purpose}</span>
                        <span className="text-[10px] text-foreground/30">{session.messages} messages</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-foreground/40 block">Created {session.created}</span>
                        <span className="text-[10px] text-foreground/30 block">Last {session.last}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tab 7: Knowledge Base ────────────────────────────────────── */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/30" />
                <Input
                  value={knowledgeSearch}
                  onChange={(e) => setKnowledgeSearch(e.target.value)}
                  placeholder="Search knowledge base..."
                  className="pl-10 bg-card border-border text-foreground text-sm placeholder:text-foreground/30"
                />
              </div>
              <Select value={knowledgeCategory} onValueChange={setKnowledgeCategory}>
                <SelectTrigger className="w-full sm:w-40 bg-card border-border text-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="SOP">SOP</SelectItem>
                  <SelectItem value="Runbook">Runbook</SelectItem>
                  <SelectItem value="Playbook">Playbook</SelectItem>
                  <SelectItem value="Reference">Reference</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-10"
                style={{ backgroundColor: agent.color }}
              >
                <Plus className="size-4 mr-1" />
                Add Document
              </Button>
            </div>

            {/* Document Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <Card key={doc.id} className="bg-card border-border hover:border-border transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0" style={{ color: agent.color }} />
                        <CardTitle className="text-sm text-foreground/80 leading-tight">{doc.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-foreground/40 shrink-0">
                        {doc.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-foreground/40 leading-relaxed line-clamp-3">
                      {doc.contentPreview}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-secondary/50 text-foreground/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-foreground/30">
                      <Clock className="size-3" />
                      Updated {formatRelativeTime(doc.lastUpdated)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDocs.length === 0 && (
              <div className="text-center py-12 text-foreground/40 text-sm">
                No documents found matching your search.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
