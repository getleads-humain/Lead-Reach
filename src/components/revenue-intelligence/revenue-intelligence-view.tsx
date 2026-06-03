'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Target,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Clock,
  PieChart,
  Activity,
  Zap,
  Award,
  GitBranch,
  Layers,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface RevenueDashboard {
  mrr: number;
  arr: number;
  pipelineValue: number;
  forecastValue: number;
  mrrGrowth: number;
  arrGrowth: number;
  avgDealSize: number;
  winRate: number;
}

interface PipelineStage {
  stage: string;
  label: string;
  value: number;
  count: number;
  probability: number;
  weightedValue: number;
}

interface DealVelocity {
  avgSalesCycle: number;
  avgTimeInStage: Record<string, number>;
  conversionRate: number;
  velocity: number;
}

interface RevenueAttribution {
  source: string;
  revenue: number;
  deals: number;
  roi: number;
  percentage: number;
}

interface ForecastScenario {
  name: string;
  value: number;
  probability: number;
  description: string;
}

const defaultDashboard: RevenueDashboard = {
  mrr: 0, arr: 0, pipelineValue: 0, forecastValue: 0,
  mrrGrowth: 0, arrGrowth: 0, avgDealSize: 0, winRate: 0,
};

const stageColors: Record<string, string> = {
  new: 'bg-slate-400',
  enriched: 'bg-cyan-400',
  qualified: 'bg-emerald-400',
  contacted: 'bg-blue-400',
  engaged: 'bg-violet-400',
  negotiating: 'bg-amber-400',
  closed_won: 'bg-emerald-500',
  closed_lost: 'bg-red-400',
  nurture: 'bg-orange-400',
};

const stageLabels: Record<string, string> = {
  new: 'New', enriched: 'Enriched', qualified: 'Qualified',
  contacted: 'Contacted', engaged: 'Engaged', negotiating: 'Negotiating',
  closed_won: 'Closed Won', closed_lost: 'Closed Lost', nurture: 'Nurture',
};

export function RevenueIntelligenceView() {
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<RevenueDashboard>(defaultDashboard);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [velocity, setVelocity] = useState<DealVelocity | null>(null);
  const [attribution, setAttribution] = useState<RevenueAttribution[]>([]);
  const [forecastScenarios, setForecastScenarios] = useState<ForecastScenario[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [forecasting, setForecasting] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState('quarter');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [dashRes, pipelineRes, velocityRes, attrRes] = await Promise.all([
        fetch('/api/revenue?action=dashboard', { method: 'GET' }),
        fetch('/api/revenue?action=pipeline_value', { method: 'GET' }),
        fetch('/api/revenue?action=deal_velocity', { method: 'GET' }),
        fetch('/api/revenue?action=attribution', { method: 'GET' }),
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        if (data.dashboard) setDashboard(data.dashboard);
      }
      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        if (data.pipelineValue?.stages) setPipeline(data.pipelineValue.stages);
        else if (Array.isArray(data.pipelineValue)) setPipeline(data.pipelineValue);
      }
      if (velocityRes.ok) {
        const data = await velocityRes.json();
        if (data.dealVelocity) setVelocity(data.dealVelocity);
      }
      if (attrRes.ok) {
        const data = await attrRes.json();
        if (data.attribution) setAttribution(data.attribution);
      }

      // Default forecast scenarios
      setForecastScenarios([
        { name: 'Committed', value: dashboard.mrr * 3, probability: 90, description: 'Deals with signed contracts or verbal commitment' },
        { name: 'Best Case', value: dashboard.mrr * 4.5, probability: 60, description: 'Committed plus deals in late-stage negotiation' },
        { name: 'Upside', value: dashboard.mrr * 6, probability: 30, description: 'All pipeline including early-stage opportunities' },
      ]);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForecast = async () => {
    setForecasting(true);
    try {
      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forecast', period: forecastPeriod }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.forecast) {
          if (data.forecast.scenarios) {
            setForecastScenarios(data.forecast.scenarios);
          }
          addNotification({ type: 'success', title: 'Forecast Generated', message: 'Revenue forecast has been updated' });
        }
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
      addNotification({ type: 'error', title: 'Forecast Failed', message: 'Could not generate revenue forecast' });
    } finally {
      setForecasting(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-secondary/30" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-400" />
            Revenue Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered revenue forecasting, pipeline analytics, and deal intelligence
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="MRR"
          value={formatCurrency(dashboard.mrr)}
          icon={DollarSign}
          trend={`${dashboard.mrrGrowth > 0 ? '+' : ''}${dashboard.mrrGrowth}% growth`}
          accent="emerald"
        />
        <StatCard
          title="ARR"
          value={formatCurrency(dashboard.arr)}
          icon={TrendingUp}
          trend={`${dashboard.arrGrowth > 0 ? '+' : ''}${dashboard.arrGrowth}% growth`}
          accent="cyan"
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(dashboard.pipelineValue)}
          icon={Target}
          trend={`${pipeline.length} stages active`}
          accent="amber"
        />
        <StatCard
          title="Forecast"
          value={formatCurrency(dashboard.forecastValue)}
          icon={BarChart3}
          trend={`${dashboard.winRate}% win rate`}
          accent="violet"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/30">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Activity className="h-3.5 w-3.5 mr-1.5" />Dashboard
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <GitBranch className="h-3.5 w-3.5 mr-1.5" />Pipeline
          </TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Calculator className="h-3.5 w-3.5 mr-1.5" />Forecast
          </TabsTrigger>
          <TabsTrigger value="attribution" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <PieChart className="h-3.5 w-3.5 mr-1.5" />Attribution
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Revenue Forecast Chart */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecastScenarios.map((scenario) => (
                    <div key={scenario.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{scenario.name}</span>
                        <span className="text-foreground/80 font-medium">
                          {formatCurrency(scenario.value)} ({scenario.probability}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            scenario.name === 'Committed' ? 'bg-emerald-400' :
                            scenario.name === 'Best Case' ? 'bg-cyan-400' :
                            'bg-violet-400'
                          }`}
                          style={{ width: `${scenario.probability}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deal Velocity Metrics */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  Deal Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/30 bg-secondary/20 p-3 text-center">
                    <div className="text-2xl font-bold text-foreground/90">
                      {velocity?.avgSalesCycle ?? 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Cycle (days)</div>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-secondary/20 p-3 text-center">
                    <div className="text-2xl font-bold text-foreground/90">
                      {velocity?.conversionRate ?? 0}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Conversion Rate</div>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-secondary/20 p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(dashboard.avgDealSize)}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg Deal Size</div>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-secondary/20 p-3 text-center">
                    <div className="text-2xl font-bold text-foreground/90">
                      {velocity?.velocity ?? 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Velocity Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card className="card-premium border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <GitBranch className="h-4 w-4 text-emerald-400" />
                Pipeline Value by Stage
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Weighted pipeline values with deal probability scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipeline.length > 0 ? pipeline.map((stage) => {
                const maxVal = Math.max(...pipeline.map(s => s.value), 1);
                return (
                  <div key={stage.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${stageColors[stage.stage] || 'bg-gray-400'}`} />
                        <span className="text-foreground/80 font-medium">
                          {stageLabels[stage.stage] || stage.label || stage.stage}
                        </span>
                        <span className="text-muted-foreground">({stage.count} deals)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{stage.probability}% probability</span>
                        <span className="text-foreground/80 font-semibold">{formatCurrency(stage.value)}</span>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-secondary/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stageColors[stage.stage] || 'bg-gray-400'} transition-all duration-700`}
                        style={{ width: `${(stage.value / maxVal) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-end text-[10px] text-muted-foreground">
                      Weighted: {formatCurrency(stage.weightedValue)}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No pipeline data available. Add deals to see pipeline analysis.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-premium border-border/30 bg-gradient-to-br from-emerald-500/8 to-emerald-500/2">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Total Pipeline</span>
                </div>
                <div className="text-2xl font-bold text-foreground/95">
                  {formatCurrency(pipeline.reduce((sum, s) => sum + s.value, 0))}
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium border-border/30 bg-gradient-to-br from-cyan-500/8 to-cyan-500/2">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-cyan-400" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Weighted Pipeline</span>
                </div>
                <div className="text-2xl font-bold text-foreground/95">
                  {formatCurrency(pipeline.reduce((sum, s) => sum + s.weightedValue, 0))}
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium border-border/30 bg-gradient-to-br from-amber-500/8 to-amber-500/2">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Total Deals</span>
                </div>
                <div className="text-2xl font-bold text-foreground/95">
                  {pipeline.reduce((sum, s) => sum + s.count, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground/90">Revenue Forecast Scenarios</h3>
              <p className="text-xs text-muted-foreground">AI-generated revenue projections</p>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                <SelectTrigger className="w-32 bg-secondary/30 border-border/40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60">
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="half">Half Year</SelectItem>
                  <SelectItem value="year">Full Year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleForecast}
                disabled={forecasting}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all"
              >
                {forecasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Forecast
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forecastScenarios.map((scenario) => (
              <Card
                key={scenario.name}
                className={`card-premium border-border/30 hover:border-emerald-500/20 transition-colors overflow-hidden relative`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  scenario.name === 'Committed' ? 'from-emerald-500/5 via-transparent to-emerald-500/2' :
                  scenario.name === 'Best Case' ? 'from-cyan-500/5 via-transparent to-cyan-500/2' :
                  'from-violet-500/5 via-transparent to-violet-500/2'
                } pointer-events-none`} />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        scenario.name === 'Committed' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                        scenario.name === 'Best Case' ? 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5' :
                        'border-violet-500/20 text-violet-400 bg-violet-500/5'
                      }`}
                    >
                      {scenario.probability}% probability
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{scenario.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 relative">
                  <div className="text-3xl font-bold text-foreground/95 mb-2">
                    {formatCurrency(scenario.value)}
                  </div>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                  <Progress
                    value={scenario.probability}
                    className="h-1.5 bg-secondary/40 mt-3"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-4">
          <Card className="card-premium border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <PieChart className="h-4 w-4 text-emerald-400" />
                Revenue by Source
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Channel attribution and ROI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {attribution.length > 0 ? attribution.map((channel) => {
                const maxRev = Math.max(...attribution.map(c => c.revenue), 1);
                return (
                  <div key={channel.source} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground/80 font-medium">{channel.source}</span>
                        <span className="text-muted-foreground">({channel.deals} deals)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400">{channel.roi > 0 ? `${channel.roi}% ROI` : ''}</span>
                        <span className="text-foreground/80 font-semibold">{formatCurrency(channel.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                        style={{ width: `${(channel.revenue / maxRev) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No attribution data yet. Close deals to see source ROI.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attribution Summary Cards */}
          {attribution.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attribution.slice(0, 3).map((channel) => (
                <Card key={channel.source} className="card-premium border-border/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        {channel.source}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                        {channel.percentage}% of revenue
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-foreground/95">{formatCurrency(channel.revenue)}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{channel.deals} deals</span>
                      {channel.roi > 0 && <span className="text-emerald-400">{channel.roi}% ROI</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
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
  value: string;
  icon: React.ElementType;
  trend: string;
  accent: string;
}) {
  const accentStyles: Record<string, { icon: string; glow: string; text: string; bg: string }> = {
    emerald: { icon: 'text-emerald-400', glow: 'from-emerald-500/8 to-emerald-500/2', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    cyan: { icon: 'text-cyan-400', glow: 'from-cyan-500/8 to-cyan-500/2', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    amber: { icon: 'text-amber-400', glow: 'from-amber-500/8 to-amber-500/2', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    violet: { icon: 'text-violet-400', glow: 'from-violet-500/8 to-violet-500/2', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  };

  const style = accentStyles[accent] || accentStyles.emerald;

  return (
    <Card className={`card-premium border-border/30 bg-gradient-to-br ${style.glow}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
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
