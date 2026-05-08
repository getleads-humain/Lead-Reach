'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart,
  TrendingUp,
  DollarSign,
  Zap,
  Plus,
  MessageSquare,
  Calendar,
  Globe,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Star,
  Activity,
} from 'lucide-react';
import { AI_SETTER_METRICS, SUPPORTED_LANGUAGES } from '@/lib/types';
import { safeFetchJSON } from '@/lib/utils';

interface SetterData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  avatar: string | null;
  conversationsHandled: number;
  leadsQualified: number;
  leadsBooked: number;
  conversionRate: number;
  avgResponseTime: number;
  language: string;
  channels: string | null;
  followUpEnabled: boolean;
}

interface ConversationData {
  id: string;
  leadName: string;
  leadChannel: string;
  status: string;
  qualificationScore: number;
  bookedAppointment: boolean;
  painPoints: string | null;
  createdAt: string;
}

const DEMO_SETTERS: SetterData[] = [
  {
    id: '1', name: 'Sales Setter Pro', description: 'Qualifies and books leads for coaching & consulting', status: 'active',
    avatar: '🤖', conversationsHandled: 1247, leadsQualified: 489, leadsBooked: 198, conversionRate: 38.2,
    avgResponseTime: 3, language: 'en', channels: '["sms","whatsapp","email"]', followUpEnabled: true,
  },
  {
    id: '2', name: 'Agency Setter', description: 'Multi-channel setter for agency lead qualification', status: 'active',
    avatar: '💼', conversationsHandled: 892, leadsQualified: 312, leadsBooked: 145, conversionRate: 34.7,
    avgResponseTime: 5, language: 'en', channels: '["sms","instagram","messenger"]', followUpEnabled: true,
  },
  {
    id: '3', name: 'Global Setter', description: 'Multilingual setter for international markets', status: 'active',
    avatar: '🌍', conversationsHandled: 2103, leadsQualified: 756, leadsBooked: 289, conversionRate: 31.5,
    avgResponseTime: 4, language: 'es', channels: '["whatsapp","sms","email"]', followUpEnabled: true,
  },
  {
    id: '4', name: 'Follow-up Specialist', description: 'Nurture and re-engage cold leads', status: 'paused',
    avatar: '🔄', conversationsHandled: 534, leadsQualified: 178, leadsBooked: 67, conversionRate: 29.8,
    avgResponseTime: 8, language: 'en', channels: '["email","sms"]', followUpEnabled: true,
  },
];

const DEMO_CONVERSATIONS: ConversationData[] = [
  { id: '1', leadName: 'Sarah Johnson', leadChannel: 'whatsapp', status: 'qualified', qualificationScore: 85, bookedAppointment: true, painPoints: '["Need faster onboarding","Budget constraints"]', createdAt: new Date().toISOString() },
  { id: '2', leadName: 'Mike Chen', leadChannel: 'sms', status: 'active', qualificationScore: 62, bookedAppointment: false, painPoints: '["Time management"]', createdAt: new Date().toISOString() },
  { id: '3', leadName: 'Emma Wilson', leadChannel: 'instagram', status: 'booked', qualificationScore: 92, bookedAppointment: true, painPoints: '["Scaling operations","Hiring"]', createdAt: new Date().toISOString() },
  { id: '4', leadName: 'David Park', leadChannel: 'messenger', status: 'active', qualificationScore: 45, bookedAppointment: false, painPoints: null, createdAt: new Date().toISOString() },
  { id: '5', leadName: 'Lisa Rodriguez', leadChannel: 'sms', status: 'disqualified', qualificationScore: 20, bookedAppointment: false, painPoints: null, createdAt: new Date().toISOString() },
];

export function SetterView() {
  const [setters, setSetters] = useState<SetterData[]>(DEMO_SETTERS);
  const [conversations, setConversations] = useState<ConversationData[]>(DEMO_CONVERSATIONS);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLang, setFormLang] = useState('en');

  useEffect(() => {
    // Try to load from API, fall back to demo data
    const loadData = async () => {
      try {
        const data = await safeFetchJSON<SetterData[]>('/api/setters');
        if (data && data.length > 0) setSetters(data);
      } catch { /* use demo data */ }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl bg-secondary/30" />)}
        </div>
      </div>
    );
  }

  const totalConversations = setters.reduce((a, s) => a + s.conversationsHandled, 0);
  const avgConversion = setters.length > 0 ? setters.reduce((a, s) => a + s.conversionRate, 0) / setters.length : 0;
  const totalBooked = setters.reduce((a, s) => a + s.leadsBooked, 0);
  const costSavings = AI_SETTER_METRICS.humanSetterCost - AI_SETTER_METRICS.aiSetterCostPro;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Setter</h2>
          <p className="text-sm text-muted-foreground">
            The #1 AI Setter for Agencies, Coaches & Consultants
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Setter
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Setters" value={setters.filter(s => s.status === 'active').length} icon={Heart} trend="All running 24/7" accent="emerald" />
        <StatCard title="Avg Conversion" value={`${avgConversion.toFixed(1)}%`} icon={TrendingUp} trend="vs 10-20% human" accent="cyan" />
        <StatCard title="Monthly Savings" value={`$${costSavings.toLocaleString()}+`} icon={DollarSign} trend="vs human setter" accent="amber" />
        <StatCard title="Daily Capacity" value="10,000+" icon={Zap} trend="vs 150 human" accent="violet" />
      </div>

      {/* Setter Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {setters.map((setter) => {
          const channels = setter.channels ? JSON.parse(setter.channels) : [];
          return (
            <Card key={setter.id} className="card-premium border-border/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{setter.avatar}</span>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground/90">{setter.name}</h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{setter.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${
                    setter.status === 'active' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                    setter.status === 'paused' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                    'border-blue-500/20 text-blue-400 bg-blue-500/5'
                  }`}>
                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                      setter.status === 'active' ? 'bg-emerald-400 animate-pulse' :
                      setter.status === 'paused' ? 'bg-amber-400' : 'bg-blue-400'
                    }`} />
                    {setter.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conversion</span>
                    <span className="font-bold text-emerald-400">{setter.conversionRate}%</span>
                  </div>
                  <Progress value={setter.conversionRate} className="h-1.5 bg-secondary/40" />
                </div>

                <div className="grid grid-cols-3 gap-1 mt-3 text-center">
                  <div className="rounded bg-emerald-500/8 p-1.5">
                    <div className="text-xs font-bold text-emerald-400">{setter.conversationsHandled}</div>
                    <div className="text-[8px] text-muted-foreground">Chats</div>
                  </div>
                  <div className="rounded bg-cyan-500/8 p-1.5">
                    <div className="text-xs font-bold text-cyan-400">{setter.leadsQualified}</div>
                    <div className="text-[8px] text-muted-foreground">Qualified</div>
                  </div>
                  <div className="rounded bg-amber-500/8 p-1.5">
                    <div className="text-xs font-bold text-amber-400">{setter.leadsBooked}</div>
                    <div className="text-[8px] text-muted-foreground">Booked</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <Globe className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[9px] text-muted-foreground">
                    {SUPPORTED_LANGUAGES.find(l => l.code === setter.language)?.name || setter.language}
                  </span>
                  <span className="text-muted-foreground/30 mx-0.5">|</span>
                  {channels.slice(0, 3).map((ch: string) => (
                    <span key={ch} className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {ch}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 mt-2 text-[9px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Avg response: {setter.avgResponseTime}s
                  {setter.followUpEnabled && <span className="ml-1 text-emerald-400">+ Follow-ups</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Conversations */}
      <Card className="card-premium border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <Activity className="h-4 w-4 text-emerald-400" />
              Live Conversations
              <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                {conversations.filter(c => c.status === 'active').length} active
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {conversations.map((conv) => (
              <div key={conv.id} className="flex items-center gap-3 rounded-lg border border-border/25 bg-secondary/10 p-3 hover:bg-secondary/15 transition-colors">
                <div className="shrink-0">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {conv.leadName.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground/90">{conv.leadName}</span>
                    <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                      {conv.leadChannel}
                    </Badge>
                  </div>
                  {conv.painPoints && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Pain points: {JSON.parse(conv.painPoints).join(', ')}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-10 rounded-full bg-secondary/40 overflow-hidden">
                      <div className={`h-full rounded-full ${
                        conv.qualificationScore >= 70 ? 'bg-emerald-400' :
                        conv.qualificationScore >= 40 ? 'bg-amber-400' : 'bg-red-400'
                      }`} style={{ width: `${conv.qualificationScore}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80">{conv.qualificationScore}</span>
                  </div>
                  <Badge variant="outline" className={`text-[9px] mt-1 ${
                    conv.status === 'booked' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                    conv.status === 'qualified' ? 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5' :
                    conv.status === 'active' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                    'border-red-500/20 text-red-400 bg-red-500/5'
                  }`}>
                    {conv.status === 'booked' && <Calendar className="h-2.5 w-2.5 mr-0.5" />}
                    {conv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Comparison */}
      <Card className="card-premium border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Human vs AI Setter — The $23,000 Annual Raise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversions</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-400">Human Setter</span>
                  <span className="text-sm font-bold text-red-400">10-20%</span>
                </div>
                <Progress value={15} className="h-2 bg-secondary/40" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-400">AI Setter</span>
                  <span className="text-sm font-bold text-emerald-400">30-40%</span>
                </div>
                <Progress value={35} className="h-2 bg-secondary/40" />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Cost</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-400">1 Human Setter</span>
                  <span className="text-sm font-bold text-red-400">$2,000/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-400">Unlimited AI</span>
                  <span className="text-sm font-bold text-emerald-400">$97-297/mo</span>
                </div>
              </div>
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
                <div className="text-lg font-bold text-emerald-400">$1,700+/mo saved</div>
                <div className="text-[9px] text-muted-foreground">That's $23,000+ per year back in your pocket</div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Capacity</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-400">Human</span>
                  <span className="text-sm font-bold text-red-400">150 leads/day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-400">AI Setter</span>
                  <span className="text-sm font-bold text-emerald-400">10,000+ leads/day</span>
                </div>
              </div>
              <div className="rounded-md bg-cyan-500/10 border border-cyan-500/20 p-2 text-center">
                <div className="text-lg font-bold text-cyan-400">66x more capacity</div>
                <div className="text-[9px] text-muted-foreground">Never miss a lead again — 24/7/365</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Setter Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Heart className="h-5 w-5 text-emerald-400" />
              Create AI Setter
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Configure your AI setter to nurture, qualify, and book leads on autopilot across every channel.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">Setter Name *</Label>
              <Input placeholder="e.g., Sales Setter Pro" value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-secondary/30 border-border/40 focus:border-emerald-500/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Description</Label>
              <Textarea placeholder="Describe what this setter specializes in..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} className="bg-secondary/30 border-border/40 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground/80">Language</Label>
                <Select value={formLang} onValueChange={setFormLang}>
                  <SelectTrigger className="bg-secondary/30 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/60">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">Calendar Link</Label>
                <Input placeholder="https://cal.com/..." className="bg-secondary/30 border-border/40 focus:border-emerald-500/30" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Channels</Label>
              <div className="flex flex-wrap gap-2">
                {['SMS', 'WhatsApp', 'Instagram', 'Messenger', 'Email'].map((ch) => (
                  <Badge key={ch} variant="outline" className="cursor-pointer border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                    {ch}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Qualification Rules</Label>
              <Textarea placeholder="Must have: Budget > $5K/mo, Decision maker&#10;Nice to have: Tech company, US-based&#10;Disqualify: No budget, Student" rows={3} className="bg-secondary/30 border-border/40 resize-none text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-border/40">Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2" disabled={!formName.trim()}>
              <Zap className="h-4 w-4" />
              Create Setter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, accent }: {
  title: string; value: number | string; icon: React.ElementType; trend: string; accent: string;
}) {
  const styles: Record<string, { icon: string; glow: string; text: string; bg: string }> = {
    emerald: { icon: 'text-emerald-400', glow: 'from-emerald-500/8 to-emerald-500/2', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    cyan: { icon: 'text-cyan-400', glow: 'from-cyan-500/8 to-cyan-500/2', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    amber: { icon: 'text-amber-400', glow: 'from-amber-500/8 to-amber-500/2', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    violet: { icon: 'text-violet-400', glow: 'from-violet-500/8 to-violet-500/2', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  };
  const s = styles[accent] || styles.emerald;
  return (
    <Card className={`card-premium border-border/30 bg-gradient-to-br ${s.glow}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
            <p className="mt-1.5 text-2xl font-bold text-foreground/95">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${s.bg}`}><Icon className={`h-5 w-5 ${s.icon}`} /></div>
        </div>
        <p className={`mt-2.5 text-xs ${s.text} flex items-center gap-1 font-medium`}>
          <ArrowUpRight className="h-3 w-3" />{trend}
        </p>
      </CardContent>
    </Card>
  );
}
