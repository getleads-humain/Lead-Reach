'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Share2,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  Mail,
  BarChart3,
  Globe,
  Lock,
  FileCheck,
  Activity,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthRecord {
  type: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

interface SpamTest {
  id: string;
  provider: string;
  result: 'inbox' | 'spam' | 'promotions';
  score: number;
}

const authRecords: AuthRecord[] = [
  { type: 'SPF', status: 'pass', detail: 'v=spf1 include:_spf.google.com ~all' },
  { type: 'DKIM', status: 'pass', detail: '1024-bit RSA key, active since Jan 2024' },
  { type: 'DMARC', status: 'warn', detail: 'p=none policy — recommend upgrading to p=quarantine' },
];

const spamTests: SpamTest[] = [
  { id: '1', provider: 'Gmail', result: 'inbox', score: 95 },
  { id: '2', provider: 'Outlook', result: 'inbox', score: 92 },
  { id: '3', provider: 'Yahoo', result: 'inbox', score: 88 },
  { id: '4', provider: 'Apple Mail', result: 'promotions', score: 72 },
  { id: '5', provider: 'ProtonMail', result: 'inbox', score: 90 },
];

const deliveryStats = [
  { title: 'Delivered', value: '12,847', percentage: 94.2, color: 'bg-emerald-400' },
  { title: 'Opened', value: '5,395', percentage: 42.0, color: 'bg-cyan-400' },
  { title: 'Bounced', value: '423', percentage: 3.1, color: 'bg-red-400' },
  { title: 'Spam Complaints', value: '12', percentage: 0.09, color: 'bg-amber-400' },
];

const authStatusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pass: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  warn: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  fail: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
};

export function DeliverabilityView() {
  const deliverabilityScore = 87;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { title: 'Deliverability Score', value: '87%', change: 'Good', icon: Shield, accent: 'emerald' },
          { title: 'Inbox Placement', value: '92%', change: '+3% this week', icon: Mail, accent: 'cyan' },
          { title: 'Bounce Rate', value: '3.1%', change: 'Below threshold', icon: Activity, accent: 'violet' },
          { title: 'Spam Rate', value: '0.09%', change: 'Well under 0.3%', icon: AlertCircle, accent: 'amber' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="card-premium border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn('h-4 w-4', `text-${stat.accent}-400`)} />
                  <Badge variant="outline" className="text-[9px] border-border/20 text-muted-foreground/50">
                    <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground/50 mt-0.5">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Deliverability Score Gauge */}
        <Card className="card-premium border-border/30">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex items-center justify-center mb-4">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-secondary/30" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={deliverabilityScore >= 80 ? '#10b981' : deliverabilityScore >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - deliverabilityScore / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground/90">{deliverabilityScore}</span>
                  <span className="text-[10px] text-muted-foreground/50">out of 100</span>
                </div>
              </div>
            </div>

            {/* Delivery Breakdown */}
            <div className="space-y-3">
              {deliveryStats.map((stat) => (
                <div key={stat.title} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground/60">{stat.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground/70">{stat.value}</span>
                      <span className="text-[9px] text-muted-foreground/40">({stat.percentage}%)</span>
                    </div>
                  </div>
                  <Progress value={stat.percentage} className="h-1.5 bg-secondary/30" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Authentication & Spam Tests */}
        <div className="lg:col-span-2 space-y-4">
          {/* Authentication Status */}
          <Card className="card-premium border-border/30">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-cyan-400" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-3">
                {authRecords.map((record) => {
                  const config = authStatusConfig[record.status];
                  const StatusIcon = config.icon;
                  return (
                    <div key={record.type} className={cn('rounded-lg border border-border/15 p-3', config.bg)}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <StatusIcon className={cn('h-4 w-4', config.color)} />
                          <span className="text-sm font-semibold text-foreground/80">{record.type}</span>
                        </div>
                        <Badge variant="outline" className={cn('text-[9px]', config.color, 'border-current/20')}>
                          {record.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground/50 ml-6.5">{record.detail}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Spam Test Results */}
          <Card className="card-premium border-border/30">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-violet-400" />
                  Spam Test Results
                </CardTitle>
                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1.5">
                  Run Test
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                {spamTests.map((test) => (
                  <div key={test.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/10 transition-colors">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                      test.result === 'inbox' ? 'bg-emerald-500/10' :
                      test.result === 'promotions' ? 'bg-amber-500/10' : 'bg-red-500/10'
                    )}>
                      {test.result === 'inbox' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                       test.result === 'promotions' ? <AlertTriangle className="h-4 w-4 text-amber-400" /> :
                       <XCircle className="h-4 w-4 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground/80">{test.provider}</div>
                      <div className="text-[10px] text-muted-foreground/40">Last tested 2 hours ago</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        'text-[9px]',
                        test.result === 'inbox' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        test.result === 'promotions' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        {test.result === 'inbox' ? 'Inbox' : test.result === 'promotions' ? 'Promotions' : 'Spam'}
                      </Badge>
                      <span className="text-[10px] font-bold text-foreground/50">{test.score}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sending Reputation */}
      <Card className="card-premium border-border/30">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-amber-400" />
            Sending Reputation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Domain Age', value: '2+ years', status: 'good' },
              { label: 'Sending Volume', value: '1,200/day', status: 'good' },
              { label: 'Consistency', value: 'Steady', status: 'good' },
              { label: 'Complaint Rate', value: '0.09%', status: 'good' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/15 p-3 text-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1.5" />
                <div className="text-sm font-semibold text-foreground/80">{item.value}</div>
                <div className="text-[10px] text-muted-foreground/40">{item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
