'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Send,
  Eye,
  MousePointerClick,
  Reply,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  Plus,
  Sparkles,
  Clock,
  FileText,
  Zap,
  ListOrdered,
  BarChart3,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface EmailAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  deliveryRate: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  openRate?: number;
  replyRate?: number;
  usageCount?: number;
}

interface EmailSequence {
  id: string;
  name: string;
  steps: number;
  enrolledLeads: number;
  status: string;
  completionRate: number;
}

interface TrackingEvent {
  id: string;
  emailId: string;
  event: string;
  timestamp: string;
  leadName?: string;
  subject?: string;
}

const defaultAnalytics: EmailAnalytics = {
  sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0,
  openRate: 0, clickRate: 0, replyRate: 0, bounceRate: 0, deliveryRate: 0,
};

export function EmailEngagementView() {
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<EmailAnalytics>(defaultAnalytics);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Template generation dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateContext, setTemplateContext] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, templatesRes] = await Promise.all([
        fetch('/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'analytics' }),
        }),
        fetch('/api/emails?action=get_templates', { method: 'GET' }),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data.analytics) setAnalytics(data.analytics);
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        if (data.templates) setTemplates(data.templates);
      }

      // Mock sequences & tracking for demo
      setSequences([
        { id: '1', name: 'Cold Outreach SaaS', steps: 5, enrolledLeads: 42, status: 'active', completionRate: 68 },
        { id: '2', name: 'Follow-Up Nurture', steps: 3, enrolledLeads: 28, status: 'active', completionRate: 45 },
        { id: '3', name: 'Re-engagement Blast', steps: 4, enrolledLeads: 15, status: 'paused', completionRate: 32 },
      ]);
      setTrackingEvents([
        { id: '1', emailId: 'e1', event: 'opened', timestamp: new Date(Date.now() - 300000).toISOString(), leadName: 'Acme Corp', subject: 'Quick question about your growth' },
        { id: '2', emailId: 'e2', event: 'clicked', timestamp: new Date(Date.now() - 900000).toISOString(), leadName: 'TechFlow Inc', subject: 'Your demo is ready' },
        { id: '3', emailId: 'e3', event: 'replied', timestamp: new Date(Date.now() - 1800000).toISOString(), leadName: 'DataSync', subject: 'Partnership opportunity' },
        { id: '4', emailId: 'e4', event: 'bounced', timestamp: new Date(Date.now() - 3600000).toISOString(), leadName: 'Unknown', subject: 'Special offer inside' },
        { id: '5', emailId: 'e5', event: 'opened', timestamp: new Date(Date.now() - 5400000).toISOString(), leadName: 'CloudBase', subject: 'Scaling your infrastructure' },
      ]);
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTemplate = async () => {
    if (!templateCategory) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_template', category: templateCategory, context: templateContext || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.template) {
          setTemplates((prev) => [data.template, ...prev]);
          addNotification({ type: 'success', title: 'Template Generated', message: `"${data.template.name}" has been created` });
        }
      }
    } catch (error) {
      console.error('Error generating template:', error);
      addNotification({ type: 'error', title: 'Generation Failed', message: 'Could not generate email template' });
    } finally {
      setGenerating(false);
      setTemplateDialogOpen(false);
      setTemplateCategory('');
      setTemplateContext('');
    }
  };

  const eventIcon = (event: string) => {
    switch (event) {
      case 'opened': return <Eye className="h-3.5 w-3.5 text-emerald-400" />;
      case 'clicked': return <MousePointerClick className="h-3.5 w-3.5 text-cyan-400" />;
      case 'replied': return <Reply className="h-3.5 w-3.5 text-emerald-400" />;
      case 'bounced': return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
      case 'sent': return <Send className="h-3.5 w-3.5 text-blue-400" />;
      case 'delivered': return <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />;
      default: return <Mail className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const eventBadge = (event: string) => {
    const styles: Record<string, string> = {
      opened: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
      clicked: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5',
      replied: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
      bounced: 'border-red-500/20 text-red-400 bg-red-500/5',
      sent: 'border-blue-500/20 text-blue-400 bg-blue-500/5',
      delivered: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5',
    };
    return styles[event] || 'border-border/30 text-muted-foreground';
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
            <Mail className="h-6 w-6 text-emerald-400" />
            Email Engagement Hub
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track email performance, manage templates, and optimize outreach sequences
          </p>
        </div>
        <Button
          onClick={() => setTemplateDialogOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Emails Sent"
          value={analytics.sent.toLocaleString()}
          icon={Send}
          trend={`${analytics.deliveryRate}% delivery rate`}
          accent="emerald"
        />
        <StatCard
          title="Open Rate"
          value={`${analytics.openRate}%`}
          icon={Eye}
          trend={`${analytics.opened} opened`}
          accent="cyan"
        />
        <StatCard
          title="Click Rate"
          value={`${analytics.clickRate}%`}
          icon={MousePointerClick}
          trend={`${analytics.clicked} clicked`}
          accent="amber"
        />
        <StatCard
          title="Reply Rate"
          value={`${analytics.replyRate}%`}
          icon={Reply}
          trend={`${analytics.replied} replied`}
          accent="violet"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />Overview
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <FileText className="h-3.5 w-3.5 mr-1.5" />Templates
          </TabsTrigger>
          <TabsTrigger value="sequences" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <ListOrdered className="h-3.5 w-3.5 mr-1.5" />Sequences
          </TabsTrigger>
          <TabsTrigger value="tracking" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Zap className="h-3.5 w-3.5 mr-1.5" />Tracking
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Email Analytics Breakdown */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Email Analytics Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Delivered', value: analytics.delivered, total: analytics.sent, color: 'bg-cyan-400', rate: analytics.deliveryRate },
                  { label: 'Opened', value: analytics.opened, total: analytics.sent, color: 'bg-emerald-400', rate: analytics.openRate },
                  { label: 'Clicked', value: analytics.clicked, total: analytics.sent, color: 'bg-amber-400', rate: analytics.clickRate },
                  { label: 'Replied', value: analytics.replied, total: analytics.sent, color: 'bg-violet-400', rate: analytics.replyRate },
                  { label: 'Bounced', value: analytics.bounced, total: analytics.sent, color: 'bg-red-400', rate: analytics.bounceRate },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-foreground/80 font-medium">{item.value.toLocaleString()} ({item.rate}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700`}
                        style={{ width: `${analytics.sent > 0 ? (item.value / analytics.sent) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Best Performing Templates */}
            <Card className="card-premium border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Best Performing Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                {templates.length > 0 ? templates.slice(0, 5).map((template) => (
                  <div
                    key={template.id}
                    className="rounded-lg border border-border/30 bg-secondary/15 p-3 transition-colors hover:bg-secondary/25"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground/90 truncate">{template.name}</span>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 shrink-0">
                        {template.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {template.openRate ?? 0}% opens</span>
                      <span className="flex items-center gap-1"><Reply className="h-3 w-3" /> {template.replyRate ?? 0}% replies</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No templates yet. Generate one to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="card-premium border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Clock className="h-4 w-4 text-emerald-400" />
                Recent Email Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {trackingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg border border-border/25 bg-secondary/10 p-2.5 transition-colors hover:bg-secondary/20"
                >
                  {eventIcon(event.event)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground/90 truncate">
                      {event.leadName} — {event.subject}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${eventBadge(event.event)}`}>
                    {event.event}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                      {template.category}
                    </Badge>
                    <FileText className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{template.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/60 truncate">{template.subject}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{template.body}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{template.openRate ?? 0}%</span>
                    <span className="flex items-center gap-1"><Reply className="h-3 w-3" />{template.replyRate ?? 0}%</span>
                    <span className="flex items-center gap-1"><Send className="h-3 w-3" />{template.usageCount ?? 0} uses</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {templates.length === 0 && (
              <div className="col-span-full text-center py-16">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No templates yet</h3>
                <p className="text-sm text-muted-foreground">Generate your first email template to get started</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Sequences Tab */}
        <TabsContent value="sequences" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sequences.map((seq) => (
              <Card key={seq.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        seq.status === 'active'
                          ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                          : 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                      }`}
                    >
                      {seq.status}
                    </Badge>
                    <ListOrdered className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{seq.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-secondary/20 p-2 text-center">
                      <div className="text-lg font-bold text-foreground/90">{seq.steps}</div>
                      <div className="text-muted-foreground">Steps</div>
                    </div>
                    <div className="rounded-md bg-secondary/20 p-2 text-center">
                      <div className="text-lg font-bold text-foreground/90">{seq.enrolledLeads}</div>
                      <div className="text-muted-foreground">Enrolled</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="text-foreground/80 font-medium">{seq.completionRate}%</span>
                    </div>
                    <Progress value={seq.completionRate} className="h-1.5 bg-secondary/40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          {/* Engagement Timeline */}
          <Card className="card-premium border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Zap className="h-4 w-4 text-emerald-400" />
                Real-Time Tracking Events
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Live feed of email engagement events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {trackingEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 relative"
                >
                  {index < trackingEvents.length - 1 && (
                    <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border/30" />
                  )}
                  <div className="shrink-0 mt-0.5 z-10 rounded-full p-1 bg-background">
                    {eventIcon(event.event)}
                  </div>
                  <div className="flex-1 min-w-0 rounded-lg border border-border/25 bg-secondary/10 p-3 transition-colors hover:bg-secondary/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground/90">{event.leadName}</span>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${eventBadge(event.event)}`}>
                        {event.event}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{event.subject}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {trackingEvents.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No tracking events yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Generate Email Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Category</label>
              <Select value={templateCategory} onValueChange={setTemplateCategory}>
                <SelectTrigger className="bg-secondary/30 border-border/40">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60">
                  <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="nurture">Nurture</SelectItem>
                  <SelectItem value="re_engagement">Re-engagement</SelectItem>
                  <SelectItem value="meeting_request">Meeting Request</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Context (optional)</label>
              <Textarea
                placeholder="Describe the target audience or context for this template..."
                value={templateContext}
                onChange={(e) => setTemplateContext(e.target.value)}
                rows={3}
                className="resize-none bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} className="border-border/40">
              Cancel
            </Button>
            <Button
              onClick={handleGenerateTemplate}
              disabled={!templateCategory || generating}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
