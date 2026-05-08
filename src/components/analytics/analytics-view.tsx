'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowRight,
  Zap,
  Star,
  Target,
  MessageSquare,
  CheckCircle2,
  FlaskConical,
  Heart,
} from 'lucide-react';

const FUNNEL_DATA = [
  { label: 'Leads', count: 2847, pct: 100, color: 'bg-blue-400' },
  { label: 'Engaged', count: 1523, pct: 53.5, color: 'bg-cyan-400' },
  { label: 'Qualified', count: 892, pct: 31.3, color: 'bg-amber-400' },
  { label: 'Booked', count: 287, pct: 10.1, color: 'bg-emerald-400' },
];

const AB_TESTS = [
  { name: 'Greeting Style A/B', variantA: '32.1%', variantB: '38.7%', impressions: 1247, winner: 'B', status: 'running' },
  { name: 'Booking Prompt', variantA: '18.4%', variantB: '22.1%', impressions: 892, winner: 'B', status: 'running' },
  { name: 'Follow-up Timing', variantA: '45.2%', variantB: '41.8%', impressions: 534, winner: 'A', status: 'completed' },
];

const CHANNEL_PERF = [
  { channel: 'SMS', response: 68, conversion: 12.3, volume: 1247 },
  { channel: 'WhatsApp', response: 74, conversion: 15.1, volume: 2891 },
  { channel: 'Instagram', response: 52, conversion: 8.7, volume: 534 },
  { channel: 'Messenger', response: 61, conversion: 10.2, volume: 892 },
  { channel: 'Email', response: 34, conversion: 6.8, volume: 3456 },
];

const SETTER_PERF = [
  { name: 'Sales Setter Pro', convRate: 38.2, bookRate: 15.9, avgTime: '3s' },
  { name: 'Agency Setter', convRate: 34.7, bookRate: 16.3, avgTime: '5s' },
  { name: 'Global Setter', convRate: 31.5, bookRate: 13.7, avgTime: '4s' },
  { name: 'Follow-up Specialist', convRate: 29.8, bookRate: 12.5, avgTime: '8s' },
];

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Advanced Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Get actionable data and insights instantly — conversion metrics, A/B tests, channel performance
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { title: 'Conversations', value: '4,776', icon: MessageSquare, accent: 'emerald', trend: '+247 this week' },
          { title: 'Qualification Rate', value: '31.3%', icon: Target, accent: 'cyan', trend: '+3.2% vs last week' },
          { title: 'Booking Rate', value: '10.1%', icon: Calendar, accent: 'amber', trend: '+1.8% vs last week' },
          { title: 'Avg Response', value: '4.2s', icon: Clock, accent: 'violet', trend: 'Under 5s target' },
          { title: 'Cost per Lead', value: '$0.89', icon: DollarSign, accent: 'emerald', trend: '-12% vs human' },
        ].map((kpi, i) => {
          const styles: Record<string, { icon: string; glow: string; bg: string }> = {
            emerald: { icon: 'text-emerald-400', glow: 'from-emerald-500/6 to-emerald-500/2', bg: 'bg-emerald-500/10' },
            cyan: { icon: 'text-cyan-400', glow: 'from-cyan-500/6 to-cyan-500/2', bg: 'bg-cyan-500/10' },
            amber: { icon: 'text-amber-400', glow: 'from-amber-500/6 to-amber-500/2', bg: 'bg-amber-500/10' },
            violet: { icon: 'text-violet-400', glow: 'from-violet-500/6 to-violet-500/2', bg: 'bg-violet-500/10' },
          };
          const s = styles[kpi.accent] || styles.emerald;
          const Icon = kpi.icon;
          return (
            <Card key={i} className={`card-premium border-border/30 bg-gradient-to-br ${s.glow}`}>
              <CardContent className="p-4">
                <div className={`rounded-lg p-1.5 inline-flex mb-2 ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.icon}`} />
                </div>
                <div className="text-xl font-bold text-foreground/90">{kpi.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.title}</div>
                <div className={`text-[10px] mt-1 ${s.icon} flex items-center gap-0.5`}>
                  <ArrowUpRight className="h-2.5 w-2.5" />{kpi.trend}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Conversion Funnel + A/B Tests */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Card className="card-premium border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {FUNNEL_DATA.map((stage, i) => (
                <div key={stage.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                      <span className="text-sm font-medium text-foreground/80">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground/90">{stage.count.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">({stage.pct}%)</span>
                    </div>
                  </div>
                  <div className="h-6 rounded-lg bg-secondary/30 overflow-hidden">
                    <div className={`h-full rounded-lg ${stage.color} transition-all duration-700`} style={{ width: `${stage.pct}%`, opacity: 0.8 }} />
                  </div>
                  {i < FUNNEL_DATA.length - 1 && (
                    <div className="flex items-center justify-center mt-1">
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                      <span className="text-[9px] text-muted-foreground/50 ml-1">
                        {FUNNEL_DATA[i + 1].pct}% conversion
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* A/B Tests */}
        <Card className="card-premium border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <FlaskConical className="h-4 w-4 text-cyan-400" />
              A/B Split Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {AB_TESTS.map((test, i) => (
                <div key={i} className="rounded-lg border border-border/25 bg-secondary/10 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground/90">{test.name}</span>
                    <Badge variant="outline" className={`text-[9px] ${
                      test.status === 'running' ? 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5' : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                    }`}>
                      {test.status === 'running' && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />}
                      {test.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md p-2 bg-secondary/20 text-center">
                      <div className="text-[9px] text-muted-foreground">Variant A</div>
                      <div className={`text-sm font-bold ${test.winner === 'A' ? 'text-emerald-400' : 'text-foreground/70'}`}>
                        {test.variantA}
                      </div>
                    </div>
                    <div className="rounded-md p-2 bg-secondary/20 text-center">
                      <div className="text-[9px] text-muted-foreground">Variant B</div>
                      <div className={`text-sm font-bold ${test.winner === 'B' ? 'text-emerald-400' : 'text-foreground/70'}`}>
                        {test.variantB}
                      </div>
                    </div>
                  </div>
                  {test.winner && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Winner: Variant {test.winner} ({test.impressions} impressions)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance + Setter Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Channel Performance */}
        <Card className="card-premium border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/90">Channel Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CHANNEL_PERF.map((ch, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/80">{ch.channel}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">Response: <span className="font-semibold text-foreground/80">{ch.response}%</span></span>
                      <span className="text-muted-foreground">Conv: <span className="font-semibold text-emerald-400">{ch.conversion}%</span></span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/30 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${ch.response}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setter Performance */}
        <Card className="card-premium border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/90">AI Setter Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SETTER_PERF.map((setter, i) => (
                <div key={i} className="rounded-lg border border-border/25 bg-secondary/10 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-foreground/90">{setter.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                      {setter.convRate}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs font-bold text-foreground/80">{setter.convRate}%</div>
                      <div className="text-[9px] text-muted-foreground">Conversion</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-cyan-400">{setter.bookRate}%</div>
                      <div className="text-[9px] text-muted-foreground">Booking</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-400">{setter.avgTime}</div>
                      <div className="text-[9px] text-muted-foreground">Response</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Analytics */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
            <Zap className="h-4 w-4 text-amber-400" />
            Follow-up Sequence Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { step: 1, label: 'Initial', responseRate: 34, sent: 1247 },
              { step: 2, label: 'Follow-up 1', responseRate: 22, sent: 823 },
              { step: 3, label: 'Follow-up 2', responseRate: 15, sent: 541 },
              { step: 4, label: 'Follow-up 3', responseRate: 8, sent: 312 },
              { step: 5, label: 'Break-up', responseRate: 5, sent: 187 },
            ].map((step) => (
              <div key={step.step} className="rounded-lg border border-border/25 bg-secondary/15 p-3 text-center">
                <div className="text-xs font-bold text-muted-foreground mb-1">Step {step.step}</div>
                <div className="text-[9px] text-muted-foreground mb-2">{step.label}</div>
                <div className="text-lg font-bold text-emerald-400">{step.responseRate}%</div>
                <div className="text-[9px] text-muted-foreground">Response Rate</div>
                <div className="text-xs text-muted-foreground mt-1">{step.sent} sent</div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${step.responseRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
