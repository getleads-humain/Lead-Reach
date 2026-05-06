'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WalkingAvatar } from '@/components/avatar/walking-avatar';
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
  Play,
} from 'lucide-react';
import type { CampaignWithCounts } from '@/lib/types';
import { STAGE_LABELS, type LeadStage } from '@/lib/types';

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

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [campaignsRes, leadsRes, tasksRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/leads?limit=1000'),
        fetch('/api/agents'),
      ]);

      const campaignsData = await campaignsRes.json();
      const leadsData = await leadsRes.json();
      const tasksData = await tasksRes.json();

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

      // Build pipeline
      const stageOrder: LeadStage[] = ['new', 'enriched', 'qualified', 'contacted', 'engaged', 'negotiating', 'closed_won', 'closed_lost', 'nurture'];
      const stageColors: Record<string, string> = {
        new: 'bg-slate-500', enriched: 'bg-cyan-500', qualified: 'bg-emerald-500',
        contacted: 'bg-blue-500', engaged: 'bg-violet-500', negotiating: 'bg-amber-500',
        closed_won: 'bg-green-500', closed_lost: 'bg-red-500', nurture: 'bg-orange-500',
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
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
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
          color="emerald"
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          trend="+18 today"
          color="blue"
        />
        <StatCard
          title="Qualified Leads"
          value={stats.qualifiedLeads}
          icon={Award}
          trend={`${Math.round((stats.qualifiedLeads / Math.max(stats.totalLeads, 1)) * 100)}% rate`}
          color="amber"
        />
        <StatCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          icon={TrendingUp}
          trend="+5% vs last week"
          color="violet"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-emerald-500" />
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
                      <div className="h-7 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                          style={{
                            width: `${Math.max((stage.count / maxPipelineCount) * 100, 4)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-10 text-right text-sm font-semibold">
                      {stage.count}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Avatar & Brand */}
        <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5">
          <CardContent className="flex flex-col items-center gap-2 py-4">
            <WalkingAvatar size={120} />
            <div className="text-center">
              <h3 className="text-lg font-bold">
                LeadReach <span className="text-emerald-500">AI</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Agentic Lead Generation
              </p>
            </div>
            <Badge variant="outline" className="mt-1 border-emerald-500/30 text-emerald-600 text-xs">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              8 Agents Active
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns
              .filter((c) => c.status === 'active')
              .map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{campaign.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-emerald-500/30 text-emerald-600"
                      >
                        Active
                      </Badge>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">
                        {campaign.leadsFound}
                      </span>{' '}
                      found
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {campaign.leadsQualified}
                      </span>{' '}
                      qualified
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
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
                    className="h-1.5"
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Agent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5"
              >
                <div className="shrink-0">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : task.status === 'running' ? (
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : task.status === 'failed' ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
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
                      ? 'border-emerald-500/30 text-emerald-600'
                      : task.status === 'running'
                      ? 'border-blue-500/30 text-blue-600'
                      : task.status === 'failed'
                      ? 'border-red-500/30 text-red-600'
                      : 'border-amber-500/30 text-amber-600'
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
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-600',
    violet: 'from-violet-500/10 to-violet-500/5 text-violet-600',
  };

  const iconBgClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-600',
    blue: 'bg-blue-500/15 text-blue-600',
    amber: 'bg-amber-500/15 text-amber-600',
    violet: 'bg-violet-500/15 text-violet-600',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color] || colorClasses.emerald}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${iconBgClasses[color] || iconBgClasses.emerald}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3" />
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}
