'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FlaskConical,
  Play,
  Pause,
  Trash2,
  Plus,
  Send,
  Loader2,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageSquare,
  BarChart3,
  FileText,
  Beaker,
  Zap,
} from 'lucide-react';
import { safeFetchJSON } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

// ============================================================
// Types
// ============================================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface JobSummary {
  id: string;
  name: string;
  bodyName: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  currentStrategy: string | null;
  currentIteration: number;
  totalExperiments: number;
  bestScore: number;
  baselineScore: number;
  maxIterations: number;
  strategies: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AutoresearchExperiment {
  id: string;
  jobId: string;
  runId: string;
  strategy: string;
  iteration: number;
  candidateName: string;
  header: string;
  footer: string;
  messagesJson: string;
  turnCount: number;
  assistantTurnCount: number;
  targetModel: string;
  researcherModel: string;
  scorerModel: string;
  response: string;
  score: number;
  scorerRaw: string;
  isDryRun: boolean;
  maxTokens: number;
  temperature: number;
  createdAt: string;
}

interface AutoresearchFragment {
  id: string;
  jobId: string;
  sourceExperimentId: string | null;
  bodyName: string;
  kind: string;
  text: string;
  score: number;
  createdAt: string;
}

interface AutoresearchJob {
  id: string;
  name: string;
  bodyText: string;
  bodyName: string;
  verifierText: string;
  strategies: string;
  maxIterations: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  currentStrategy: string | null;
  currentIteration: number;
  totalExperiments: number;
  bestScore: number;
  baselineScore: number;
  researchContext: string | null;
  chatHistory: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  experiments: AutoresearchExperiment[];
  fragments: AutoresearchFragment[];
}

interface CreateJobForm {
  name: string;
  bodyText: string;
  verifierText: string;
  strategies: string[];
  maxIterations: number;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_STRATEGIES = ['baseline', 'seeded', 'evolve-best', 'recombine'];

const STRATEGY_CONFIG: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  baseline: {
    label: 'Baseline',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/20',
    description: 'No harness — measures raw model response',
  },
  seeded: {
    label: 'Seeded',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    description: 'Generates initial harness from prompt palette',
  },
  'evolve-best': {
    label: 'Evolve Best',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
    description: 'Evolves the best-scoring harness found so far',
  },
  recombine: {
    label: 'Recombine',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    description: 'Recombines top fragments from best experiments',
  },
};

const QUICK_CHAT_ACTIONS = [
  { label: 'How\'s it going?', prompt: 'Give me a summary of how the research is progressing so far.' },
  { label: 'Best strategy?', prompt: 'Which strategy is performing best and why?' },
  { label: 'Suggestions', prompt: 'What improvements would you suggest for the next iteration?' },
  { label: 'Explain scores', prompt: 'Explain what the scores mean and how the baseline compares to the best result.' },
];

// ============================================================
// Helper Functions
// ============================================================

function parseJsonSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function formatScore(score: number): string {
  return (score * 100).toFixed(1) + '%';
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 0.4) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 0.7) return 'bg-emerald-500/10';
  if (score >= 0.4) return 'bg-amber-500/10';
  return 'bg-red-500/10';
}

function getScoreProgressClass(score: number): string {
  if (score >= 0.7) return '[&>div]:bg-emerald-500';
  if (score >= 0.4) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return { variant: 'outline' as const, label: 'Draft', icon: FileText };
    case 'running':
      return { variant: 'default' as const, label: 'Running', icon: Loader2 };
    case 'paused':
      return { variant: 'secondary' as const, label: 'Paused', icon: Pause };
    case 'completed':
      return { variant: 'default' as const, label: 'Completed', icon: CheckCircle2 };
    case 'failed':
      return { variant: 'destructive' as const, label: 'Failed', icon: XCircle };
    default:
      return { variant: 'outline' as const, label: status, icon: FileText };
  }
}

function getStrategyBadge(strategy: string) {
  const config = STRATEGY_CONFIG[strategy];
  if (!config) return { label: strategy, color: 'text-gray-600', bgColor: 'bg-gray-500/10 border-gray-500/20' };
  return config;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================
// Component
// ============================================================

export function AutoresearchView() {
  const { navigateWithAction, addNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState<'jobs' | 'workspace' | 'results'>('jobs');
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [currentJob, setCurrentJob] = useState<AutoresearchJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [applyToOutreachLoading, setApplyToOutreachLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateJobForm>({
    name: '',
    bodyText: '',
    verifierText: '',
    strategies: [...DEFAULT_STRATEGIES],
    maxIterations: 3,
  });

  // Action-specific loading states
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [fullRunLoading, setFullRunLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // Load jobs on mount
  // ============================================================

  useEffect(() => {
    loadJobs();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentJob?.chatHistory]);

  // Poll for job updates when running
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (currentJob && currentJob.status === 'running') {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/autoresearch?id=${currentJob.id}`);
          if (res.ok) {
            const data = await res.json();
            setCurrentJob(data);
            // If job completed or failed, stop polling
            if (data.status === 'completed' || data.status === 'failed' || data.status === 'paused') {
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        } catch {
          // polling error, continue
        }
      }, 3000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [currentJob?.id, currentJob?.status]);

  // ============================================================
  // Data Loading
  // ============================================================

  const loadJobs = useCallback(async () => {
    try {
      const data = await safeFetchJSON<{ jobs: JobSummary[] }>('/api/autoresearch');
      setJobs(data.jobs || []);
    } catch {
      // Jobs unavailable
    }
  }, []);

  const loadJob = useCallback(async (jobId: string) => {
    try {
      const data = await safeFetchJSON<AutoresearchJob>(`/api/autoresearch?id=${jobId}`);
      setCurrentJob(data);
    } catch {
      // Job unavailable
    }
  }, []);

  // ============================================================
  // Job Management
  // ============================================================

  const createJob = useCallback(async () => {
    if (!createForm.name || !createForm.bodyText || !createForm.verifierText) return;
    setLoading(true);
    try {
      const res = await fetch('/api/autoresearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: createForm.name,
          bodyText: createForm.bodyText,
          verifierText: createForm.verifierText,
          strategies: createForm.strategies,
          maxIterations: createForm.maxIterations,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setShowCreateDialog(false);
        setCreateForm({ name: '', bodyText: '', verifierText: '', strategies: [...DEFAULT_STRATEGIES], maxIterations: 3 });
        await loadJobs();
        // Load the new job and switch to workspace
        const jobRes = await fetch(`/api/autoresearch?id=${data.id}`);
        if (jobRes.ok) {
          const fullJob = await jobRes.json();
          setCurrentJob(fullJob);
          setActiveTab('workspace');
        }
      }
    } catch (err) {
      console.error('Create job failed:', err);
    } finally {
      setLoading(false);
    }
  }, [createForm, loadJobs]);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      await fetch('/api/autoresearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: jobId }),
      });
      if (currentJob?.id === jobId) {
        setCurrentJob(null);
      }
      await loadJobs();
    } catch (err) {
      console.error('Delete job failed:', err);
    }
  }, [currentJob, loadJobs]);

  const pauseJob = useCallback(async () => {
    if (!currentJob) return;
    try {
      await fetch('/api/autoresearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', id: currentJob.id }),
      });
      await loadJob(currentJob.id);
    } catch (err) {
      console.error('Pause failed:', err);
    }
  }, [currentJob, loadJob]);

  const resumeJob = useCallback(async () => {
    if (!currentJob) return;
    try {
      await fetch('/api/autoresearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume', id: currentJob.id }),
      });
      await loadJob(currentJob.id);
    } catch (err) {
      console.error('Resume failed:', err);
    }
  }, [currentJob, loadJob]);

  // ============================================================
  // Run Actions
  // ============================================================

  const runBaseline = useCallback(async () => {
    if (!currentJob) return;
    setBaselineLoading(true);
    try {
      await fetch('/api/autoresearch/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'baseline', jobId: currentJob.id }),
      });
      await loadJob(currentJob.id);
    } catch (err) {
      console.error('Baseline run failed:', err);
    } finally {
      setBaselineLoading(false);
    }
  }, [currentJob, loadJob]);

  const runStep = useCallback(async () => {
    if (!currentJob) return;
    setStepLoading(true);
    try {
      await fetch('/api/autoresearch/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'step', jobId: currentJob.id }),
      });
      await loadJob(currentJob.id);
    } catch (err) {
      console.error('Step run failed:', err);
    } finally {
      setStepLoading(false);
    }
  }, [currentJob, loadJob]);

  const runFullJob = useCallback(async () => {
    if (!currentJob) return;
    setFullRunLoading(true);
    try {
      await fetch('/api/autoresearch/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-run', jobId: currentJob.id }),
      });
      await loadJob(currentJob.id);
    } catch (err) {
      console.error('Full run failed:', err);
    } finally {
      setFullRunLoading(false);
    }
  }, [currentJob, loadJob]);

  const sendChatMessage = useCallback(async () => {
    if (!currentJob || !chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/autoresearch/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', jobId: currentJob.id, message: msg }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentJob(prev => prev ? { ...prev, chatHistory: JSON.stringify(data.chatHistory) } : null);
      }
    } catch (err) {
      console.error('Chat failed:', err);
    } finally {
      setChatLoading(false);
    }
  }, [currentJob, chatInput]);

  const selectJob = useCallback(async (jobId: string) => {
    await loadJob(jobId);
    setActiveTab('workspace');
  }, [loadJob]);

  // ============================================================
  // Computed values
  // ============================================================

  const chatHistory: ChatMessage[] = currentJob
    ? parseJsonSafe<ChatMessage[]>(currentJob.chatHistory, [])
    : [];

  const jobStrategies: string[] = currentJob
    ? parseJsonSafe<string[]>(currentJob.strategies, [])
    : [];

  const scoreLift = currentJob ? currentJob.bestScore - currentJob.baselineScore : 0;
  const isJobRunning = currentJob?.status === 'running';
  const isJobBusy = baselineLoading || stepLoading || fullRunLoading;

  // Strategy stats for results tab
  const strategyStats = React.useMemo(() => {
    if (!currentJob?.experiments?.length) return [];
    const grouped: Record<string, { strategy: string; count: number; bestScore: number; avgScore: number; totalScore: number }> = {};
    for (const exp of currentJob.experiments) {
      if (!grouped[exp.strategy]) {
        grouped[exp.strategy] = { strategy: exp.strategy, count: 0, bestScore: 0, avgScore: 0, totalScore: 0 };
      }
      grouped[exp.strategy].count++;
      grouped[exp.strategy].totalScore += exp.score;
      grouped[exp.strategy].bestScore = Math.max(grouped[exp.strategy].bestScore, exp.score);
    }
    return Object.values(grouped).map(s => ({
      ...s,
      avgScore: s.count > 0 ? s.totalScore / s.count : 0,
    })).sort((a, b) => b.bestScore - a.bestScore);
  }, [currentJob?.experiments]);

  // Best experiment
  const bestExperiment = React.useMemo(() => {
    if (!currentJob?.experiments?.length) return null;
    return [...currentJob.experiments].sort((a, b) => b.score - a.score)[0];
  }, [currentJob?.experiments]);

  // Top fragments by kind
  const headerFragments = React.useMemo(() => {
    if (!currentJob?.fragments?.length) return [];
    return currentJob.fragments
      .filter(f => f.kind === 'header')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [currentJob?.fragments]);

  const footerFragments = React.useMemo(() => {
    if (!currentJob?.fragments?.length) return [];
    return currentJob.fragments
      .filter(f => f.kind === 'footer')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [currentJob?.fragments]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-violet-500" />
            Autoresearch Lab
          </h1>
          <p className="text-muted-foreground">
            AI-powered prompt harness research — find what moves the score
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-500 text-white">
          <Plus className="h-4 w-4 mr-1" />
          New Research
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'jobs' | 'workspace' | 'results')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs" className="gap-2">
            <Beaker className="h-4 w-4" />
            Jobs
            {jobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                {jobs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* ===== JOBS TAB ===== */}
        <TabsContent value="jobs" className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-violet-500/10 p-4">
                    <FlaskConical className="h-10 w-10 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No Research Jobs Yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      Create your first autoresearch job to discover which prompt harnesses
                      maximize your target model&apos;s score on any test body.
                    </p>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-500 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Research
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => {
                const statusInfo = getStatusBadge(job.status);
                const strategies = parseJsonSafe<string[]>(job.strategies, []);
                const lift = job.bestScore - job.baselineScore;

                return (
                  <Card
                    key={job.id}
                    className="cursor-pointer hover:border-violet-500/40 transition-all duration-200 group"
                    onClick={() => selectJob(job.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FlaskConical className="h-4 w-4 text-violet-500 shrink-0" />
                          <CardTitle className="text-sm font-semibold truncate">{job.name}</CardTitle>
                        </div>
                        <Badge
                          variant={statusInfo.variant}
                          className={`shrink-0 ml-2 ${
                            job.status === 'running' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' :
                            job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''
                          }`}
                        >
                          {job.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-3">
                        {/* Score comparison */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">Best Score</div>
                          <div className={`text-sm font-bold ${getScoreColor(job.bestScore)}`}>
                            {job.bestScore > 0 ? formatScore(job.bestScore) : '—'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">Baseline</div>
                          <div className="text-sm text-muted-foreground">
                            {job.baselineScore > 0 ? formatScore(job.baselineScore) : '—'}
                          </div>
                        </div>

                        {/* Score lift */}
                        {job.baselineScore > 0 && job.bestScore > 0 && (
                          <div className={`flex items-center gap-1 text-xs font-medium ${lift > 0 ? 'text-emerald-600 dark:text-emerald-400' : lift < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                            {lift > 0 ? <ArrowUpRight className="h-3 w-3" /> : lift < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                            {lift > 0 ? '+' : ''}{formatScore(Math.abs(lift))} lift
                          </div>
                        )}

                        <Separator />

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{job.totalExperiments} experiments</span>
                          <span>{timeAgo(job.createdAt)}</span>
                        </div>

                        {/* Strategy badges */}
                        <div className="flex flex-wrap gap-1">
                          {strategies.map((s) => {
                            const cfg = getStrategyBadge(s);
                            return (
                              <Badge key={s} variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.bgColor} ${cfg.color} border-0`}>
                                {cfg.label}
                              </Badge>
                            );
                          })}
                        </div>

                        {/* Error */}
                        {job.errorMessage && (
                          <div className="text-xs text-red-500 dark:text-red-400 truncate" title={job.errorMessage}>
                            {job.errorMessage}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== WORKSPACE TAB ===== */}
        <TabsContent value="workspace" className="space-y-4">
          {!currentJob ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-violet-500/10 p-4">
                    <FlaskConical className="h-10 w-10 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Select a Research Job</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      Choose a job from the Jobs tab to view its workspace with experiments,
                      chat, and control panel.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('jobs')}>
                    <Beaker className="h-4 w-4 mr-2" />
                    View Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Left Panel — Controls + Chat (2/5) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Job Status Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FlaskConical className="h-4 w-4 text-violet-500 shrink-0" />
                        <span className="font-medium text-sm truncate">{currentJob.name}</span>
                      </div>
                      <Badge
                        variant={getStatusBadge(currentJob.status).variant}
                        className={`shrink-0 ml-2 ${
                          currentJob.status === 'running' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' :
                          currentJob.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''
                        }`}
                      >
                        {currentJob.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        {getStatusBadge(currentJob.status).label}
                      </Badge>
                    </div>

                    {/* Strategy & Iteration */}
                    {currentJob.currentStrategy && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Strategy:</span>
                        <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getStrategyBadge(currentJob.currentStrategy).bgColor} ${getStrategyBadge(currentJob.currentStrategy).color} border-0`}>
                          {getStrategyBadge(currentJob.currentStrategy).label}
                        </Badge>
                        <span>Iter: {currentJob.currentIteration}/{currentJob.maxIterations}</span>
                      </div>
                    )}

                    {/* Score comparison */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Best Score</span>
                        <span className={`font-bold ${getScoreColor(currentJob.bestScore)}`}>
                          {currentJob.bestScore > 0 ? formatScore(currentJob.bestScore) : '—'}
                        </span>
                      </div>
                      <Progress
                        value={currentJob.bestScore * 100}
                        className={`h-2 ${getScoreProgressClass(currentJob.bestScore)}`}
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Baseline</span>
                        <span className="text-muted-foreground">
                          {currentJob.baselineScore > 0 ? formatScore(currentJob.baselineScore) : '—'}
                        </span>
                      </div>
                      {currentJob.baselineScore > 0 && (
                        <Progress
                          value={currentJob.baselineScore * 100}
                          className="h-1.5 [&>div]:bg-gray-400"
                        />
                      )}
                    </div>

                    {/* Score lift indicator */}
                    {currentJob.baselineScore > 0 && currentJob.bestScore > 0 && (
                      <div className={`flex items-center gap-2 p-2 rounded-md ${scoreLift > 0 ? 'bg-emerald-500/5 border border-emerald-500/20' : scoreLift < 0 ? 'bg-red-500/5 border border-red-500/20' : 'bg-muted/50'}`}>
                        {scoreLift > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : scoreLift < 0 ? (
                          <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
                        ) : null}
                        <div>
                          <div className={`text-sm font-bold ${scoreLift > 0 ? 'text-emerald-600 dark:text-emerald-400' : scoreLift < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                            {scoreLift > 0 ? '+' : ''}{formatScore(Math.abs(scoreLift))}
                          </div>
                          <div className="text-xs text-muted-foreground">Score lift vs baseline</div>
                        </div>
                        {scoreLift > 0 && (
                          <Trophy className="h-4 w-4 text-emerald-500 ml-auto shrink-0" />
                        )}
                      </div>
                    )}

                    {/* Total experiments */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Beaker className="h-3 w-3" />
                      <span>{currentJob.totalExperiments} experiments run</span>
                    </div>

                    {/* Error message */}
                    {currentJob.errorMessage && (
                      <div className="p-2 rounded-md bg-red-500/5 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                        {currentJob.errorMessage}
                      </div>
                    )}

                    <Separator />

                    {/* Control buttons */}
                    <div className="flex flex-wrap gap-2">
                      {currentJob.status === 'draft' && (
                        <>
                          <Button size="sm" onClick={runBaseline} disabled={isJobBusy} className="bg-violet-600 hover:bg-violet-500 text-white">
                            {baselineLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                            Run Baseline
                          </Button>
                          <Button size="sm" variant="outline" onClick={runStep} disabled={isJobBusy}>
                            {stepLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                            Run Step
                          </Button>
                        </>
                      )}
                      {(currentJob.status === 'draft' || currentJob.status === 'paused' || currentJob.status === 'failed') && (
                        <Button size="sm" variant="outline" onClick={runFullJob} disabled={isJobBusy}>
                          {fullRunLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                          Run Full
                        </Button>
                      )}
                      {currentJob.status === 'running' && !isJobRunning && (
                        <Button size="sm" variant="outline" onClick={runStep} disabled={isJobBusy}>
                          {stepLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                          Run Step
                        </Button>
                      )}
                      {currentJob.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={pauseJob}>
                          <Pause className="h-3.5 w-3.5 mr-1" />
                          Pause
                        </Button>
                      )}
                      {currentJob.status === 'paused' && (
                        <Button size="sm" onClick={resumeJob} className="bg-violet-600 hover:bg-violet-500 text-white">
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteJob(currentJob.id)}
                        className="text-red-500 hover:text-red-600 ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>

                    {/* Workflow: Apply to Outreach */}
                    {(currentJob.status === 'completed' || (currentJob.experiments && currentJob.experiments.length > 0)) && (
                      <div className="pt-2 mt-2 border-t border-border/20">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1.5 text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                          disabled={applyToOutreachLoading}
                          onClick={async () => {
                            setApplyToOutreachLoading(true);
                            try {
                              const result = await safeFetchJSON<{ success: boolean; outreachIds: string[]; researchSummary?: Record<string, unknown> }>('/api/workflow/bridge', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  action: 'autoresearch-to-outreach',
                                  jobId: currentJob.id,
                                }),
                              });
                              if (result.success) {
                                addNotification({ type: 'success', title: 'Research Applied', message: `Autoresearch findings applied to outreach (${result.outreachIds.length} messages created)` });
                                navigateWithAction('outreach', 'apply-research', { jobId: currentJob.id, outreachIds: result.outreachIds, researchSummary: result.researchSummary });
                              }
                            } catch (error) {
                              const errMsg = error instanceof Error ? error.message : 'Failed to apply research';
                              addNotification({ type: 'error', title: 'Apply Failed', message: errMsg });
                            } finally {
                              setApplyToOutreachLoading(false);
                            }
                          }}
                        >
                          {applyToOutreachLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5" />
                          )}
                          Apply to Outreach
                        </Button>
                        <p className="text-[9px] text-muted-foreground/60 mt-1 text-center">
                          Use research findings to generate improved outreach messages
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Chat Area */}
                <Card className="flex flex-col" style={{ height: '420px' }}>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-violet-500" />
                      <CardTitle className="text-sm">AI Research Assistant</CardTitle>
                    </div>
                  </CardHeader>
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-3 pb-2">
                      {chatHistory.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-4">
                          Ask questions about your research, get suggestions, or analyze results.
                        </div>
                      )}
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
                          <div
                            className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === 'user'
                                ? 'bg-violet-500 text-white'
                                : msg.role === 'system'
                                ? 'bg-muted text-muted-foreground text-xs italic'
                                : 'bg-muted/70'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted/70 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Thinking...
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Quick actions */}
                  {chatHistory.length === 0 && currentJob.status !== 'running' && (
                    <div className="px-4 pb-2">
                      <div className="text-xs text-muted-foreground mb-2">Quick actions:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_CHAT_ACTIONS.map((qa) => (
                          <Button
                            key={qa.label}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setChatInput(qa.prompt);
                            }}
                            disabled={chatLoading}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            {qa.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Input */}
                  <div className="border-t p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Ask about the research..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                        disabled={chatLoading}
                      />
                      <Button
                        size="sm"
                        onClick={sendChatMessage}
                        disabled={chatLoading || !chatInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Panel — Experiments + Fragments (3/5) */}
              <div className="lg:col-span-3 space-y-4">
                {/* Experiment Log */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Beaker className="h-4 w-4 text-violet-500" />
                        <CardTitle className="text-sm">Experiment Log</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {currentJob.experiments?.length || 0} experiments
                      </Badge>
                    </div>
                    <CardDescription>
                      Each row is a harness tested against the target model
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!currentJob.experiments?.length ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No experiments yet. Run a baseline or step to begin.
                      </div>
                    ) : (
                      <ScrollArea className="max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">#</TableHead>
                              <TableHead>Strategy</TableHead>
                              <TableHead>Candidate</TableHead>
                              <TableHead className="w-20">Score</TableHead>
                              <TableHead className="w-16">Turns</TableHead>
                              <TableHead className="w-48">Response Preview</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentJob.experiments.map((exp, i) => {
                              const isLatest = i === 0;
                              const stratCfg = getStrategyBadge(exp.strategy);
                              return (
                                <TableRow
                                  key={exp.id}
                                  className={isLatest ? 'bg-violet-500/5' : ''}
                                >
                                  <TableCell className="text-muted-foreground text-xs">
                                    {currentJob.experiments.length - i}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${stratCfg.bgColor} ${stratCfg.color} border-0`}>
                                      {stratCfg.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs max-w-[120px] truncate" title={exp.candidateName}>
                                    {exp.candidateName}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`text-xs font-bold ${getScoreColor(exp.score)}`}>
                                      {formatScore(exp.score)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {exp.turnCount}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={exp.response}>
                                    {exp.response.slice(0, 80)}...
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Top Fragments Panel */}
                {(headerFragments.length > 0 || footerFragments.length > 0) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-500" />
                        <CardTitle className="text-sm">Top Fragments</CardTitle>
                      </div>
                      <CardDescription>
                        Best header and footer fragments discovered by the research
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Headers */}
                        {headerFragments.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Headers</div>
                            {headerFragments.map((frag) => (
                              <div key={frag.id} className={`p-2 rounded-md border ${getScoreBgColor(frag.score)} border-violet-500/10`}>
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                                    header
                                  </Badge>
                                  <span className={`text-xs font-bold ${getScoreColor(frag.score)}`}>
                                    {formatScore(frag.score)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-3">{frag.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footers */}
                        {footerFragments.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Footers</div>
                            {footerFragments.map((frag) => (
                              <div key={frag.id} className={`p-2 rounded-md border ${getScoreBgColor(frag.score)} border-violet-500/10`}>
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                                    footer
                                  </Badge>
                                  <span className={`text-xs font-bold ${getScoreColor(frag.score)}`}>
                                    {formatScore(frag.score)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-3">{frag.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Running indicator */}
                {isJobRunning && (
                  <Card className="border-violet-500/30">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {currentJob.currentStrategy
                              ? `Running ${getStrategyBadge(currentJob.currentStrategy).label} strategy — iteration ${currentJob.currentIteration}`
                              : 'Research in progress...'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Testing harnesses against the target model • {currentJob.totalExperiments} experiments completed
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {currentJob.bestScore > 0 ? `Best: ${formatScore(currentJob.bestScore)}` : 'No score yet'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== RESULTS TAB ===== */}
        <TabsContent value="results" className="space-y-4">
          {!currentJob ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-violet-500/10 p-4">
                    <BarChart3 className="h-10 w-10 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No Results to Analyze</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      Select a research job from the Jobs or Workspace tab to view
                      detailed results and analysis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Score Distribution by Strategy */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-500" />
                    <CardTitle className="text-base">Score Distribution by Strategy</CardTitle>
                  </div>
                  <CardDescription>
                    Visual comparison of strategy performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {strategyStats.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">
                      No experiments yet — run some to see strategy performance.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {strategyStats.map((stat) => {
                        const cfg = getStrategyBadge(stat.strategy);
                        return (
                          <div key={stat.strategy} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${cfg.bgColor} ${cfg.color} border-0`}>
                                  {cfg.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {stat.count} experiments
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-muted-foreground">
                                  Avg: <span className={getScoreColor(stat.avgScore)}>{formatScore(stat.avgScore)}</span>
                                </span>
                                <span className="font-medium">
                                  Best: <span className={`font-bold ${getScoreColor(stat.bestScore)}`}>{formatScore(stat.bestScore)}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 items-center">
                              <Progress
                                value={stat.bestScore * 100}
                                className={`h-4 flex-1 ${getScoreProgressClass(stat.bestScore)}`}
                              />
                              <span className="text-xs text-muted-foreground w-12 text-right">
                                {(stat.bestScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Baseline reference line */}
                      {currentJob.baselineScore > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-3 h-0.5 bg-gray-400 inline-block" />
                            Baseline: {formatScore(currentJob.baselineScore)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strategy Comparison Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-500" />
                    <CardTitle className="text-base">Strategy Comparison</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {strategyStats.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground text-sm">No data yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Strategy</TableHead>
                          <TableHead className="text-right">Experiments</TableHead>
                          <TableHead className="text-right">Best Score</TableHead>
                          <TableHead className="text-right">Avg Score</TableHead>
                          <TableHead className="text-right">vs Baseline</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {strategyStats.map((stat) => {
                          const cfg = getStrategyBadge(stat.strategy);
                          const vsBaseline = stat.bestScore - currentJob.baselineScore;
                          return (
                            <TableRow key={stat.strategy}>
                              <TableCell>
                                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${cfg.bgColor} ${cfg.color} border-0`}>
                                  {cfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm">{stat.count}</TableCell>
                              <TableCell className={`text-right text-sm font-bold ${getScoreColor(stat.bestScore)}`}>
                                {formatScore(stat.bestScore)}
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {formatScore(stat.avgScore)}
                              </TableCell>
                              <TableCell className={`text-right text-sm font-medium ${vsBaseline > 0 ? 'text-emerald-600 dark:text-emerald-400' : vsBaseline < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                {vsBaseline > 0 ? '+' : ''}{formatScore(Math.abs(vsBaseline))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Best Harness Display */}
              {bestExperiment && (
                <Card className="border-violet-500/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-base">Best Harness Found</CardTitle>
                    </div>
                    <CardDescription>
                      The highest-scoring harness configuration across all experiments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getStrategyBadge(bestExperiment.strategy).bgColor} ${getStrategyBadge(bestExperiment.strategy).color} border-0`}>
                        {getStrategyBadge(bestExperiment.strategy).label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{bestExperiment.candidateName}</span>
                      <span className={`text-sm font-bold ml-auto ${getScoreColor(bestExperiment.score)}`}>
                        {formatScore(bestExperiment.score)}
                      </span>
                    </div>

                    {/* Header */}
                    {bestExperiment.header && (
                      <div>
                        <div className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">Header</div>
                        <div className="p-2 rounded-md bg-violet-500/5 border border-violet-500/10 text-sm text-muted-foreground whitespace-pre-wrap">
                          {bestExperiment.header}
                        </div>
                      </div>
                    )}

                    {/* Body */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Body Text</div>
                      <div className="p-2 rounded-md bg-muted/50 border border-border/50 text-sm text-muted-foreground whitespace-pre-wrap">
                        {currentJob.bodyText.slice(0, 500)}{currentJob.bodyText.length > 500 ? '...' : ''}
                      </div>
                    </div>

                    {/* Footer */}
                    {bestExperiment.footer && (
                      <div>
                        <div className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">Footer</div>
                        <div className="p-2 rounded-md bg-violet-500/5 border border-violet-500/10 text-sm text-muted-foreground whitespace-pre-wrap">
                          {bestExperiment.footer}
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Target Model Response (truncated)</div>
                      <div className="p-2 rounded-md bg-muted/50 border border-border/50 text-sm text-muted-foreground line-clamp-6">
                        {bestExperiment.response.slice(0, 600)}{bestExperiment.response.length > 600 ? '...' : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fragment Analysis */}
              {(headerFragments.length > 0 || footerFragments.length > 0) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      <CardTitle className="text-base">Fragment Analysis</CardTitle>
                    </div>
                    <CardDescription>
                      Top-performing header and footer fragments extracted from experiments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Header fragments */}
                      {headerFragments.length > 0 && (
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                            Header Fragments ({headerFragments.length})
                          </div>
                          <div className="space-y-2">
                            {headerFragments.map((frag, i) => (
                              <div key={frag.id} className="p-3 rounded-md border border-violet-500/10 bg-violet-500/5">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs font-bold ${getScoreColor(frag.score)}`}>
                                      {formatScore(frag.score)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-4">{frag.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer fragments */}
                      {footerFragments.length > 0 && (
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                            Footer Fragments ({footerFragments.length})
                          </div>
                          <div className="space-y-2">
                            {footerFragments.map((frag, i) => (
                              <div key={frag.id} className="p-3 rounded-md border border-violet-500/10 bg-violet-500/5">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs font-bold ${getScoreColor(frag.score)}`}>
                                      {formatScore(frag.score)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-4">{frag.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== CREATE JOB DIALOG ===== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-violet-500" />
              New Research Job
            </DialogTitle>
            <DialogDescription>
              Define a prompt body and scoring criteria. The AI will search for the most effective harness configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="job-name">Job Name</Label>
              <Input
                id="job-name"
                placeholder="e.g., GPT-4 Safety Test, Claude Alignment Check"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Body Text */}
            <div className="space-y-2">
              <Label htmlFor="body-text">Body Text (Prompt to Research)</Label>
              <Textarea
                id="body-text"
                placeholder="Enter the prompt text you want to test harnesses against..."
                value={createForm.bodyText}
                onChange={(e) => setCreateForm(prev => ({ ...prev, bodyText: e.target.value }))}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                This is the fixed text that will be sandwiched between header/footer harnesses during testing.
              </p>
            </div>

            {/* Verifier Text */}
            <div className="space-y-2">
              <Label htmlFor="verifier-text">Verifier Text (Scoring Criteria)</Label>
              <Textarea
                id="verifier-text"
                placeholder="Describe what a high-scoring response should look like..."
                value={createForm.verifierText}
                onChange={(e) => setCreateForm(prev => ({ ...prev, verifierText: e.target.value }))}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                The AI scorer will evaluate responses against this description. More specific = better scores.
              </p>
            </div>

            {/* Strategy Selection */}
            <div className="space-y-3">
              <Label>Strategies</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_STRATEGIES.map((strategy) => {
                  const cfg = STRATEGY_CONFIG[strategy];
                  const isChecked = createForm.strategies.includes(strategy);
                  return (
                    <div
                      key={strategy}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked ? 'border-violet-500/30 bg-violet-500/5' : 'border-border hover:border-violet-500/20'
                      }`}
                      onClick={() => {
                        setCreateForm(prev => ({
                          ...prev,
                          strategies: isChecked
                            ? prev.strategies.filter(s => s !== strategy)
                            : [...prev.strategies, strategy],
                        }));
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => {
                          setCreateForm(prev => ({
                            ...prev,
                            strategies: isChecked
                              ? prev.strategies.filter(s => s !== strategy)
                              : [...prev.strategies, strategy],
                          }));
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.bgColor} ${cfg.color} border-0`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{cfg.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Max Iterations Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Max Iterations</Label>
                <Badge variant="outline" className="text-xs">
                  {createForm.maxIterations} per strategy
                </Badge>
              </div>
              <Slider
                value={[createForm.maxIterations]}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, maxIterations: value[0] }))}
                min={1}
                max={10}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 (Quick)</span>
                <span>5 (Balanced)</span>
                <span>10 (Thorough)</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createJob}
              disabled={loading || !createForm.name || !createForm.bodyText || !createForm.verifierText || createForm.strategies.length === 0}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4 mr-1" />
                  Create Research Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
