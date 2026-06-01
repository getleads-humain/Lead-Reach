'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Activity,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  DollarSign,
  Calendar,
  XCircle,
  Eye,
  Flame,
  Zap,
  LineChart,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface BehavioralEvent {
  id: string;
  leadId: string;
  leadName: string;
  eventType: string;
  source: string;
  timestamp: string;
  properties?: Record<string, string>;
}

interface DecayItem {
  id: string;
  leadName: string;
  company: string;
  currentScore: number;
  originalScore: number;
  decayPercent: number;
  lastActivity: string;
  reEngageEligible: boolean;
}

interface Prediction {
  id: string;
  leadName: string;
  company: string;
  dealProbability: number;
  estimatedDealSize: string;
  predictedCloseDate: string;
  confidence: number;
}

interface IntelligenceAlert {
  id: string;
  leadId: string;
  leadName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  timestamp: string;
  dismissed: boolean;
}

const severityConfig: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
  high: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: BellRing },
  medium: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Bell },
  low: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Eye },
};

const eventTypeConfig: Record<string, { color: string; icon: React.ElementType }> = {
  page_view: { color: 'text-blue-400', icon: Eye },
  email_open: { color: 'text-emerald-400', icon: Activity },
  email_click: { color: 'text-cyan-400', icon: Zap },
  form_submit: { color: 'text-amber-400', icon: Target },
  demo_request: { color: 'text-emerald-400', icon: Flame },
  pricing_view: { color: 'text-violet-400', icon: DollarSign },
  website_visit: { color: 'text-blue-400', icon: Activity },
  content_download: { color: 'text-cyan-400', icon: Activity },
  chat_interaction: { color: 'text-amber-400', icon: Activity },
};

export function LeadIntelligenceView() {
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<BehavioralEvent[]>([]);
  const [decayItems, setDecayItems] = useState<DecayItem[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([]);
  const [activeTab, setActiveTab] = useState('behavioral');
  const [applyingDecay, setApplyingDecay] = useState(false);

  // Engagement distribution
  const [engagementLevels, setEngagementLevels] = useState({
    high: 0, medium: 0, low: 0, none: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load alerts
      const alertsRes = await fetch('/api/lead-intelligence?action=alerts', { method: 'GET' });
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        if (data.alerts) {
          setAlerts(
            data.alerts.map((a: any, i: number) => ({
              id: a.id || `alert-${i}`,
              leadId: a.leadId || '',
              leadName: a.leadName || 'Unknown',
              severity: a.severity || 'medium',
              type: a.type || 'engagement',
              title: a.title || a.message || 'Intelligence Alert',
              description: a.description || a.message || '',
              timestamp: a.timestamp || new Date().toISOString(),
              dismissed: false,
            }))
          );
        }
      }

      // Load decay report
      const decayRes = await fetch('/api/lead-intelligence?action=decay_report', { method: 'GET' });
      if (decayRes.ok) {
        const data = await decayRes.json();
        if (data.report) {
          setDecayItems(
            (Array.isArray(data.report) ? data.report : []).map((item: any, i: number) => ({
              id: item.id || `decay-${i}`,
              leadName: item.leadName || item.name || 'Unknown',
              company: item.company || item.companyName || 'Unknown',
              currentScore: item.currentScore || item.score || Math.floor(Math.random() * 30 + 40),
              originalScore: item.originalScore || Math.floor(Math.random() * 30 + 60),
              decayPercent: item.decayPercent || Math.floor(Math.random() * 30 + 10),
              lastActivity: item.lastActivity || new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
              reEngageEligible: item.reEngageEligible ?? true,
            }))
          );
        }
      }

      // Load pipeline predictions
      const predRes = await fetch('/api/lead-intelligence?action=pipeline_predictions', { method: 'GET' });
      if (predRes.ok) {
        const data = await predRes.json();
        if (data.predictions) {
          setPredictions(
            (Array.isArray(data.predictions) ? data.predictions : []).map((p: any, i: number) => ({
              id: p.id || `pred-${i}`,
              leadName: p.leadName || p.name || 'Unknown',
              company: p.company || p.companyName || 'Unknown',
              dealProbability: p.dealProbability || p.probability || Math.floor(Math.random() * 60 + 20),
              estimatedDealSize: p.estimatedDealSize || p.dealSize || `$${Math.floor(Math.random() * 50 + 5)}K`,
              predictedCloseDate: p.predictedCloseDate || p.closeDate || new Date(Date.now() + Math.random() * 90 * 86400000).toISOString(),
              confidence: p.confidence || Math.floor(Math.random() * 30 + 60),
            }))
          );
        }
      }

      // Mock behavioral events
      setEvents([
        { id: 'e1', leadId: 'l1', leadName: 'Acme Corp', eventType: 'pricing_view', source: 'website', timestamp: new Date(Date.now() - 180000).toISOString() },
        { id: 'e2', leadId: 'l2', leadName: 'TechFlow Inc', eventType: 'demo_request', source: 'landing_page', timestamp: new Date(Date.now() - 600000).toISOString() },
        { id: 'e3', leadId: 'l3', leadName: 'DataSync', eventType: 'email_click', source: 'email', timestamp: new Date(Date.now() - 1200000).toISOString() },
        { id: 'e4', leadId: 'l4', leadName: 'CloudBase', eventType: 'form_submit', source: 'website', timestamp: new Date(Date.now() - 2400000).toISOString() },
        { id: 'e5', leadId: 'l5', leadName: 'InnoVate Labs', eventType: 'page_view', source: 'website', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'e6', leadId: 'l6', leadName: 'NextGen Solutions', eventType: 'email_open', source: 'email', timestamp: new Date(Date.now() - 5400000).toISOString() },
        { id: 'e7', leadId: 'l7', leadName: 'Pinnacle Group', eventType: 'content_download', source: 'website', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 'e8', leadId: 'l8', leadName: 'Quantum AI', eventType: 'chat_interaction', source: 'chat', timestamp: new Date(Date.now() - 9000000).toISOString() },
      ]);

      setEngagementLevels({ high: 12, medium: 28, low: 35, none: 15 });

      // Default alerts if empty
      if (alerts.length === 0) {
        setAlerts([
          { id: 'a1', leadId: 'l1', leadName: 'Acme Corp', severity: 'critical', type: 'intent', title: 'High-Intent Activity Detected', description: 'Pricing page viewed 3 times in 24h', timestamp: new Date(Date.now() - 300000).toISOString(), dismissed: false },
          { id: 'a2', leadId: 'l2', leadName: 'TechFlow Inc', severity: 'high', type: 'engagement', title: 'Demo Request Submitted', description: 'Contact requested a product demo', timestamp: new Date(Date.now() - 600000).toISOString(), dismissed: false },
          { id: 'a3', leadId: 'l3', leadName: 'DataSync', severity: 'medium', type: 'decay', title: 'Score Decaying', description: 'Lead score dropped 15 points in 7 days', timestamp: new Date(Date.now() - 1800000).toISOString(), dismissed: false },
          { id: 'a4', leadId: 'l4', leadName: 'CloudBase', severity: 'low', type: 'trend', title: 'Engagement Trending Down', description: 'Email open rate decreased 20%', timestamp: new Date(Date.now() - 3600000).toISOString(), dismissed: false },
        ]);
      }

      // Default predictions if empty
      if (predictions.length === 0) {
        setPredictions([
          { id: 'p1', leadName: 'Acme Corp', company: 'Technology', dealProbability: 78, estimatedDealSize: '$45K', predictedCloseDate: new Date(Date.now() + 21 * 86400000).toISOString(), confidence: 85 },
          { id: 'p2', leadName: 'GlobalTech Inc', company: 'SaaS', dealProbability: 62, estimatedDealSize: '$120K', predictedCloseDate: new Date(Date.now() + 45 * 86400000).toISOString(), confidence: 72 },
          { id: 'p3', leadName: 'DataFlow Systems', company: 'Data', dealProbability: 45, estimatedDealSize: '$28K', predictedCloseDate: new Date(Date.now() + 60 * 86400000).toISOString(), confidence: 65 },
          { id: 'p4', leadName: 'CloudBase', company: 'Cloud', dealProbability: 35, estimatedDealSize: '$55K', predictedCloseDate: new Date(Date.now() + 75 * 86400000).toISOString(), confidence: 55 },
        ]);
      }

      // Default decay if empty
      if (decayItems.length === 0) {
        setDecayItems([
          { id: 'd1', leadName: 'DataSync', company: 'Data', currentScore: 55, originalScore: 82, decayPercent: 33, lastActivity: new Date(Date.now() - 14 * 86400000).toISOString(), reEngageEligible: true },
          { id: 'd2', leadName: 'Pinnacle Group', company: 'Finance', currentScore: 42, originalScore: 71, decayPercent: 41, lastActivity: new Date(Date.now() - 21 * 86400000).toISOString(), reEngageEligible: true },
          { id: 'd3', leadName: 'TechStart AI', company: 'AI', currentScore: 38, originalScore: 65, decayPercent: 42, lastActivity: new Date(Date.now() - 28 * 86400000).toISOString(), reEngageEligible: true },
          { id: 'd4', leadName: 'InnoVate Labs', company: 'Biotech', currentScore: 50, originalScore: 68, decayPercent: 26, lastActivity: new Date(Date.now() - 10 * 86400000).toISOString(), reEngageEligible: false },
        ]);
      }
    } catch (error) {
      console.error('Error loading lead intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDecay = async () => {
    setApplyingDecay(true);
    try {
      const res = await fetch('/api/lead-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_decay' }),
      });
      if (res.ok) {
        const data = await res.json();
        addNotification({
          type: 'success',
          title: 'Decay Applied',
          message: `${data.result?.updated || 0} lead scores updated`,
        });
      }
    } catch (error) {
      console.error('Error applying decay:', error);
      addNotification({ type: 'error', title: 'Decay Failed', message: 'Could not apply score decay' });
    } finally {
      setApplyingDecay(false);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => a.id === alertId ? { ...a, dismissed: true } : a)
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const totalLeads = engagementLevels.high + engagementLevels.medium + engagementLevels.low + engagementLevels.none;
  const avgDealProbability = predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + p.dealProbability, 0) / predictions.length)
    : 0;

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
            <Brain className="h-6 w-6 text-emerald-400" />
            Lead Intelligence Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Behavioral tracking, score decay, predictions, and real-time alerts
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tracked Events"
          value={events.length.toString()}
          icon={Activity}
          trend="Last 24 hours"
          accent="emerald"
        />
        <StatCard
          title="Avg Deal Probability"
          value={`${avgDealProbability}%`}
          icon={Target}
          trend="Pipeline prediction"
          accent="cyan"
        />
        <StatCard
          title="Decaying Leads"
          value={decayItems.length.toString()}
          icon={TrendingDown}
          trend={`${decayItems.filter(d => d.reEngageEligible).length} re-engageable`}
          accent="amber"
        />
        <StatCard
          title="Active Alerts"
          value={activeAlerts.length.toString()}
          icon={Bell}
          trend={activeAlerts.filter(a => a.severity === 'critical').length > 0 ? `${activeAlerts.filter(a => a.severity === 'critical').length} critical` : 'No critical'}
          accent="violet"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/30">
          <TabsTrigger value="behavioral" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Activity className="h-3.5 w-3.5 mr-1.5" />Behavioral
          </TabsTrigger>
          <TabsTrigger value="score-decay" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <TrendingDown className="h-3.5 w-3.5 mr-1.5" />Score Decay
          </TabsTrigger>
          <TabsTrigger value="predictions" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />Predictions
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Bell className="h-3.5 w-3.5 mr-1.5" />Alerts
            {activeAlerts.length > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                {activeAlerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Behavioral Tab */}
        <TabsContent value="behavioral" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Events Timeline */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Behavioral Events Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event, index) => {
                  const config = eventTypeConfig[event.eventType] || { color: 'text-gray-400', icon: Activity };
                  const EventIcon = config.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3 relative">
                      {index < events.length - 1 && (
                        <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border/30" />
                      )}
                      <div className="shrink-0 mt-0.5 z-10 rounded-full p-1 bg-background">
                        <EventIcon className={`h-3.5 w-3.5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 rounded-lg border border-border/25 bg-secondary/10 p-2.5 transition-colors hover:bg-secondary/20">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-sm text-foreground/90">{event.leadName}</span>
                          <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground shrink-0">
                            {event.eventType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{event.source}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Engagement Distribution */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Engagement Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'High', value: engagementLevels.high, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
                  { label: 'Medium', value: engagementLevels.medium, color: 'bg-cyan-400', textColor: 'text-cyan-400' },
                  { label: 'Low', value: engagementLevels.low, color: 'bg-amber-400', textColor: 'text-amber-400' },
                  { label: 'None', value: engagementLevels.none, color: 'bg-gray-400', textColor: 'text-gray-400' },
                ].map((level) => (
                  <div key={level.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/80 font-medium">{level.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${level.textColor}`}>{level.value}</span>
                        <span className="text-muted-foreground">
                          ({totalLeads > 0 ? Math.round((level.value / totalLeads) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${level.color} transition-all duration-700`}
                        style={{ width: `${totalLeads > 0 ? (level.value / totalLeads) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Activity Trends */}
                <div className="mt-6 pt-4 border-t border-border/20">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity Trends</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md bg-secondary/20 p-2 text-center">
                      <div className="text-lg font-bold text-emerald-400">
                        {events.filter(e => ['demo_request', 'form_submit', 'pricing_view'].includes(e.eventType)).length}
                      </div>
                      <div className="text-[10px] text-muted-foreground">High-Intent</div>
                    </div>
                    <div className="rounded-md bg-secondary/20 p-2 text-center">
                      <div className="text-lg font-bold text-cyan-400">
                        {events.filter(e => ['email_click', 'email_open', 'content_download'].includes(e.eventType)).length}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Engaged</div>
                    </div>
                    <div className="rounded-md bg-secondary/20 p-2 text-center">
                      <div className="text-lg font-bold text-amber-400">
                        {events.filter(e => ['page_view', 'website_visit'].includes(e.eventType)).length}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Browsing</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Score Decay Tab */}
        <TabsContent value="score-decay" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground/90">Score Decay Report</h3>
              <p className="text-xs text-muted-foreground">Leads with declining engagement scores</p>
            </div>
            <Button
              onClick={handleApplyDecay}
              disabled={applyingDecay}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all"
            >
              {applyingDecay ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingDown className="h-4 w-4" />}
              Apply Decay Now
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {decayItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/25 bg-secondary/10 p-3 transition-colors hover:bg-secondary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className={`h-4 w-4 ${item.decayPercent > 30 ? 'text-red-400' : 'text-amber-400'}`} />
                    <span className="font-medium text-sm text-foreground/90">{item.leadName}</span>
                    <span className="text-xs text-muted-foreground">— {item.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.reEngageEligible && (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                        <Flame className="h-2.5 w-2.5 mr-1" />Re-engage
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        item.decayPercent > 30 ? 'border-red-500/20 text-red-400 bg-red-500/5' :
                        'border-amber-500/20 text-amber-400 bg-amber-500/5'
                      }`}
                    >
                      -{item.decayPercent}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Score: {item.currentScore} / {item.originalScore}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden relative">
                      <div className="h-full rounded-full bg-amber-400/40 absolute left-0 top-0" style={{ width: `${item.originalScore}%` }} />
                      <div className={`h-full rounded-full relative z-10 ${
                        item.currentScore > 60 ? 'bg-emerald-400' : item.currentScore > 40 ? 'bg-amber-400' : 'bg-red-400'
                      }`} style={{ width: `${item.currentScore}%` }} />
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    Last: {formatTimeAgo(item.lastActivity)}
                  </div>
                </div>
              </div>
            ))}
            {decayItems.length === 0 && (
              <div className="text-center py-16">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No Score Decay</h3>
                <p className="text-sm text-muted-foreground">All lead scores are healthy</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        prediction.dealProbability > 60 ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                        prediction.dealProbability > 30 ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                        'border-red-500/20 text-red-400 bg-red-500/5'
                      }`}
                    >
                      <Sparkles className="h-2.5 w-2.5 mr-1" />AI Prediction
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                      {prediction.confidence}% confidence
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{prediction.leadName}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/60">{prediction.company}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3 relative">
                  {/* Deal Probability */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Deal Probability</span>
                      <span className={`font-semibold ${
                        prediction.dealProbability > 60 ? 'text-emerald-400' :
                        prediction.dealProbability > 30 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {prediction.dealProbability}%
                      </span>
                    </div>
                    <Progress
                      value={prediction.dealProbability}
                      className="h-1.5 bg-secondary/40"
                    />
                  </div>
                  {/* Deal Size & Close Date */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-secondary/20 p-2">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Est. Deal Size</span>
                      </div>
                      <div className="font-bold text-foreground/90">{prediction.estimatedDealSize}</div>
                    </div>
                    <div className="rounded-md bg-secondary/20 p-2">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>Predicted Close</span>
                      </div>
                      <div className="font-bold text-foreground/90">
                        {new Date(prediction.predictedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {predictions.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No Predictions Yet</h3>
                <p className="text-sm text-muted-foreground">AI predictions will appear as leads progress</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="card-premium border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Bell className="h-4 w-4 text-emerald-400" />
                Active Intelligence Alerts
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {activeAlerts.length} active alerts — {alerts.filter(a => a.severity === 'critical' && !a.dismissed).length} critical
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const SeverityIcon = config.icon;
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
                      alert.dismissed
                        ? 'border-border/15 bg-secondary/5 opacity-50'
                        : `${config.border} ${config.bg} hover:bg-secondary/20`
                    }`}
                  >
                    <div className={`shrink-0 mt-0.5 rounded-full p-1.5 ${config.bg}`}>
                      <SeverityIcon className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-sm text-foreground/90">{alert.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${config.border} ${config.color}`}
                          >
                            {alert.severity}
                          </Badge>
                          {!alert.dismissed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => handleDismissAlert(alert.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">{alert.leadName}</span>
                        {' — '}{alert.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/60">
                        <span>{alert.type}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(alert.timestamp)}</span>
                        {alert.dismissed && <span className="text-emerald-400">• Dismissed</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No intelligence alerts
                </div>
              )}
            </CardContent>
          </Card>
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
