'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Target,
  Users,
  Award,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Sparkles,
  Send,
  Lightbulb,
} from 'lucide-react';
import type { CampaignWithCounts } from '@/lib/types';
import { STAGE_LABELS, type LeadStage } from '@/lib/types';
import { safeFetchJSON } from '@/lib/utils';
import { useAIOneShot } from '@/hooks/use-ai-chat';

interface DashboardStats {
  totalCampaigns: number;
  totalLeads: number;
  qualifiedLeads: number;
  responseRate: number;
}

interface PipelineStage {
  stage: string;
  label: string;
  count: number;
  color: string;
}

interface AgentTask {
  id: string;
  agentName: string;
  taskType: string;
  status: string;
  progress: number;
  createdAt: string;
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    totalLeads: 0,
    qualifiedLeads: 0,
    responseRate: 0,
  });
  const [campaigns, setCampaigns] = useState<CampaignWithCounts[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [recentTasks, setRecentTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Insights state
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const { generate: aiGenerate, isLoading: aiIsLoading } = useAIOneShot();
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: string; content: string }>>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const [campaignsData, leadsData, tasksData] = await Promise.all([
        safeFetchJSON<CampaignWithCounts[]>('/api/campaigns'),
        safeFetchJSON<{ leads: Array<{ stage: string }>; total: number }>('/api/leads?limit=1000'),
        safeFetchJSON<{ tasks: AgentTask[] }>('/api/agents'),
      ]);

      setCampaigns(campaignsData);

      const leads = leadsData.leads || [];
      const qualified = leads.filter((l: { stage: string }) =>
        ['qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)
      ).length;
      const contacted = leads.filter((l: { stage: string }) =>
        ['contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)
      ).length;
      const responded = leads.filter((l: { stage: string }) =>
        ['engaged', 'negotiating', 'closed_won'].includes(l.stage)
      ).length;

      setStats({
        totalCampaigns: campaignsData.length,
        totalLeads: leadsData.total || leads.length,
        qualifiedLeads: qualified,
        responseRate: contacted > 0 ? Math.round((responded / contacted) * 100) : 0,
      });

      const stageOrder: LeadStage[] = ['new', 'enriched', 'qualified', 'contacted', 'engaged', 'negotiating', 'closed_won', 'closed_lost', 'nurture'];
      const stageColors: Record<string, string> = {
        new: 'bg-slate-500', enriched: 'bg-cyan-400', qualified: 'bg-emerald-400',
        contacted: 'bg-blue-400', engaged: 'bg-violet-400', negotiating: 'bg-amber-400',
        closed_won: 'bg-emerald-500', closed_lost: 'bg-red-400', nurture: 'bg-orange-400',
      };

      const pipelineData = stageOrder.map((stage) => ({
        stage,
        label: STAGE_LABELS[stage],
        count: leads.filter((l: { stage: string }) => l.stage === stage).length,
        color: stageColors[stage],
      }));
      setPipeline(pipelineData);

      setRecentTasks((tasksData.tasks || []).slice(0, 8));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Load AI insight after dashboard data is loaded
  useEffect(() => {
    if (!loading && stats.totalLeads > 0 && !aiInsight && !aiInsightLoading) {
      loadAIInsight();
    }
  }, [loading, stats.totalLeads]);

  const loadAIInsight = async () => {
    setAiInsightLoading(true);
    try {
      const result = await aiGenerate(
        `Analyze this LeadReach dashboard data and provide 2-3 concise, actionable insights:
- Total Campaigns: ${stats.totalCampaigns}
- Total Leads: ${stats.totalLeads}
- Qualified Leads: ${stats.qualifiedLeads} (${Math.round((stats.qualifiedLeads / Math.max(stats.totalLeads, 1)) * 100)}% qualification rate)
- Response Rate: ${stats.responseRate}%
- Pipeline stages: ${pipeline.filter(p => p.count > 0).map(p => `${p.label}: ${p.count}`).join(', ')}
- Active campaigns: ${campaigns.filter(c => c.status === 'active').length}

Focus on actionable recommendations. Be specific and concise.`,
        'You are a B2B sales analytics expert. Provide concise, actionable insights about lead generation pipelines. Use specific numbers from the data. Keep responses under 100 words. Format with bullet points.'
      );
      if (result) setAiInsight(result);
    } catch {
      // Silently fail — insights are nice-to-have
    } finally {
      setAiInsightLoading(false);
    }
  };

  const handleAIChat = async () => {
    if (!aiChatInput.trim() || aiIsLoading) return;
    const msg = aiChatInput.trim();
    setAiChatInput('');
    setAiChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    const result = await aiGenerate(
      `Dashboard context: ${stats.totalCampaigns} campaigns, ${stats.totalLeads} leads, ${stats.qualifiedLeads} qualified (${Math.round((stats.qualifiedLeads / Math.max(stats.totalLeads, 1)) * 100)}% rate), ${stats.responseRate}% response rate.

User question: ${msg}`,
      'You are a B2B sales analytics expert helping a user understand their LeadReach dashboard data. Be concise and specific. Use numbers from the context.'
    );
    if (result) {
      setAiChatMessages(prev => [...prev, { role: 'assistant', content: result }]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-secondary/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl bg-secondary/30" />
          <Skeleton className="h-80 rounded-xl bg-secondary/30" />
        </div>
      </div>
    );
  }

  const maxPipelineCount = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          icon={Target}
          trend="+2 this week"
          accent="emerald"
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          trend="+18 today"
          accent="cyan"
        />
        <StatCard
          title="Qualified Leads"
          value={stats.qualifiedLeads}
          icon={Award}
          trend={`${Math.round((stats.qualifiedLeads / Math.max(stats.totalLeads, 1)) * 100)}% rate`}
          accent="amber"
        />
        <StatCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          icon={TrendingUp}
          trend="+5% vs last week"
          accent="violet"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <Card className="card-premium border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <Activity className="h-4 w-4 text-emerald-400" />
              Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pipeline
                .filter((p) => p.count > 0)
                .map((stage) => (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium text-muted-foreground truncate">
                      {stage.label}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage.color} transition-all duration-700 ease-out`}
                          style={{
                            width: `${Math.max((stage.count / maxPipelineCount) * 100, 4)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-10 text-right text-sm font-bold text-foreground/80">
                      {stage.count}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="card-premium border-border/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <Zap className="h-4 w-4 text-emerald-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Active Agents', value: '8', status: 'online', color: 'emerald' },
                { label: 'Channels', value: '17+', status: 'connected', color: 'cyan' },
                { label: 'Queue Tasks', value: recentTasks.filter(t => t.status === 'running').length.toString(), status: 'processing', color: 'blue' },
                { label: 'Uptime', value: '99.9%', status: 'healthy', color: 'emerald' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border/30 bg-secondary/20 p-3 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      item.color === 'emerald' ? 'bg-emerald-400' :
                      item.color === 'cyan' ? 'bg-cyan-400' :
                      'bg-blue-400'
                    } animate-pulse`} />
                  </div>
                  <span className="text-lg font-bold text-foreground/90">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px] bg-emerald-500/5">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Card */}
      <Card className="card-premium border-emerald-500/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            AI Insights
            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 ml-2">
              <Zap className="h-2.5 w-2.5 mr-1" />
              Auto-generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-3">
          {aiInsightLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-secondary/30" />
              <Skeleton className="h-4 w-4/5 bg-secondary/30" />
              <Skeleton className="h-4 w-3/5 bg-secondary/30" />
            </div>
          ) : aiInsight ? (
            <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 text-sm text-foreground/80 leading-relaxed">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="whitespace-pre-wrap">{aiInsight}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Insights will appear once your data loads
            </div>
          )}

          {/* Chat Messages */}
          {aiChatMessages.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {aiChatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-secondary/20 text-foreground/70 ml-4'
                      : 'bg-emerald-500/5 border border-emerald-500/10 text-foreground/80 mr-4'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {aiIsLoading && (
                <div className="flex items-center gap-1.5 px-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 text-emerald-400 animate-spin" />
                  Thinking...
                </div>
              )}
            </div>
          )}

          {/* Ask AI Input */}
          <div className="flex items-end gap-2">
            <Textarea
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAIChat();
                }
              }}
              placeholder="Ask about your data..."
              rows={1}
              className="resize-none bg-secondary/20 border-border/30 text-xs min-h-[32px] max-h-[60px] focus:border-emerald-500/30"
            />
            <Button
              size="icon"
              onClick={handleAIChat}
              disabled={!aiChatInput.trim() || aiIsLoading}
              className="h-[32px] w-[32px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black shrink-0"
            >
              {aiIsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Campaigns */}
        <Card className="card-premium border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/90">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns
              .filter((c) => c.status === 'active')
              .map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-lg border border-border/30 bg-secondary/15 p-3 space-y-2 transition-colors hover:bg-secondary/25"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground/90">{campaign.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                      >
                        Active
                      </Badge>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground/80">
                        {campaign.leadsFound}
                      </span>{' '}
                      found
                    </div>
                    <div>
                      <span className="font-semibold text-foreground/80">
                        {campaign.leadsQualified}
                      </span>{' '}
                      qualified
                    </div>
                    <div>
                      <span className="font-semibold text-foreground/80">
                        {campaign.leadsContacted}
                      </span>{' '}
                      contacted
                    </div>
                  </div>
                  <Progress
                    value={
                      campaign.leadsFound > 0
                        ? Math.round(
                            (campaign.leadsQualified / campaign.leadsFound) * 100
                          )
                        : 0
                    }
                    className="h-1 bg-secondary/40"
                  />
                </div>
              ))}
            {campaigns.filter((c) => c.status === 'active').length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No active campaigns yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Agent Activity */}
        <Card className="card-premium border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/90">Agent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-border/25 bg-secondary/10 p-2.5 transition-colors hover:bg-secondary/20"
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
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.taskType} • {new Date(task.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${
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
            ))}
            {recentTasks.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  accent,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend: string;
  accent: string;
}) {
  const accentStyles: Record<string, { icon: string; glow: string; text: string; bg: string }> = {
    emerald: {
      icon: 'text-emerald-400',
      glow: 'from-emerald-500/8 to-emerald-500/2',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    cyan: {
      icon: 'text-cyan-400',
      glow: 'from-cyan-500/8 to-cyan-500/2',
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    amber: {
      icon: 'text-amber-400',
      glow: 'from-amber-500/8 to-amber-500/2',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    violet: {
      icon: 'text-violet-400',
      glow: 'from-violet-500/8 to-violet-500/2',
      text: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  };

  const style = accentStyles[accent] || accentStyles.emerald;

  return (
    <Card className={`card-premium border-border/30 bg-gradient-to-br ${style.glow}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {title}
            </p>
            <p className="mt-1.5 text-2xl font-bold text-foreground/95">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${style.bg}`}>
            <Icon className={`h-5 w-5 ${style.icon}`} />
          </div>
        </div>
        <p className={`mt-2.5 text-xs ${style.text} flex items-center gap-1 font-medium`}>
          <ArrowUpRight className="h-3 w-3" />
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}
