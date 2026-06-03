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
  Building2,
  Target,
  Eye,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Plus,
  ListFilter,
  Signal,
  Crown,
  Medal,
  Award,
  MessageSquare,
  TrendingUp,
  Users,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface AccountList {
  id: string;
  name: string;
  criteria: string;
  accountCount: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  createdAt: string;
}

interface TargetAccount {
  id: string;
  companyName: string;
  industry: string;
  tier: number;
  intentScore: number;
  engagementLevel: string;
  revenue: string;
  employees: string;
}

interface IntentSignal {
  id: string;
  accountId: string;
  companyName: string;
  signalType: string;
  intensity: number;
  detectedAt: string;
  description: string;
}

interface ContentStrategy {
  id: string;
  accountId: string;
  companyName: string;
  strategy: string;
  channels: string[];
  messaging: string;
  contentTypes: string[];
}

const tierConfig: Record<number, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  1: { label: 'Tier 1', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  2: { label: 'Tier 2', icon: Medal, color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  3: { label: 'Tier 3', icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
};

export function AbmView() {
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [accountLists, setAccountLists] = useState<AccountList[]>([]);
  const [targetAccounts, setTargetAccounts] = useState<TargetAccount[]>([]);
  const [intentSignals, setIntentSignals] = useState<IntentSignal[]>([]);
  const [contentStrategies, setContentStrategies] = useState<ContentStrategy[]>([]);
  const [activeTab, setActiveTab] = useState('account-lists');

  // Create list dialog
  const [createListDialogOpen, setCreateListDialogOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [listCriteria, setListCriteria] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const listsRes = await fetch('/api/abm?action=get_lists', { method: 'GET' });
      if (listsRes.ok) {
        const data = await listsRes.json();
        if (data.lists) setAccountLists(data.lists);
      }

      const highIntentRes = await fetch('/api/abm?action=high_intent&threshold=50', { method: 'GET' });
      if (highIntentRes.ok) {
        const data = await highIntentRes.json();
        if (data.accounts) {
          setIntentSignals(
            data.accounts.slice(0, 8).map((a: any, i: number) => ({
              id: `sig-${i}`,
              accountId: a.id || a.accountId,
              companyName: a.companyName || a.name,
              signalType: ['Website Visit', 'Content Download', 'Pricing Page', 'Demo Request', 'Competitor Research'][i % 5],
              intensity: a.intentScore || Math.floor(Math.random() * 40 + 60),
              detectedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
              description: `High-intent activity detected for ${a.companyName || a.name}`,
            }))
          );
        }
      }

      // Mock target accounts for demo
      setTargetAccounts([
        { id: 'a1', companyName: 'Acme Corp', industry: 'Technology', tier: 1, intentScore: 92, engagementLevel: 'high', revenue: '$50M', employees: '500' },
        { id: 'a2', companyName: 'GlobalTech Inc', industry: 'SaaS', tier: 1, intentScore: 85, engagementLevel: 'high', revenue: '$120M', employees: '2000' },
        { id: 'a3', companyName: 'DataFlow Systems', industry: 'Data', tier: 2, intentScore: 72, engagementLevel: 'medium', revenue: '$25M', employees: '150' },
        { id: 'a4', companyName: 'CloudBase', industry: 'Cloud', tier: 2, intentScore: 68, engagementLevel: 'medium', revenue: '$40M', employees: '300' },
        { id: 'a5', companyName: 'InnoVate Labs', industry: 'Biotech', tier: 2, intentScore: 55, engagementLevel: 'low', revenue: '$15M', employees: '80' },
        { id: 'a6', companyName: 'NextGen Solutions', industry: 'Consulting', tier: 3, intentScore: 45, engagementLevel: 'low', revenue: '$8M', employees: '50' },
        { id: 'a7', companyName: 'TechStart AI', industry: 'AI', tier: 3, intentScore: 38, engagementLevel: 'low', revenue: '$5M', employees: '30' },
        { id: 'a8', companyName: 'Pinnacle Group', industry: 'Finance', tier: 3, intentScore: 32, engagementLevel: 'low', revenue: '$200M', employees: '5000' },
      ]);

      setContentStrategies([
        { id: 'cs1', accountId: 'a1', companyName: 'Acme Corp', strategy: 'Personalized demo experience', channels: ['Email', 'LinkedIn', 'Webinar'], messaging: 'Focus on ROI and integration capabilities', contentTypes: ['Case Study', 'Demo Video', 'ROI Calculator'] },
        { id: 'cs2', accountId: 'a2', companyName: 'GlobalTech Inc', strategy: 'Executive engagement program', channels: ['Email', 'Direct Mail', 'Event'], messaging: 'Enterprise scale and security narrative', contentTypes: ['White Paper', 'Executive Brief', 'Security Audit'] },
        { id: 'cs3', accountId: 'a3', companyName: 'DataFlow Systems', strategy: 'Technical deep-dive nurture', channels: ['Email', 'Webinar', 'LinkedIn'], messaging: 'Data pipeline efficiency and automation', contentTypes: ['Technical Guide', 'Webinar', 'API Docs'] },
      ]);
    } catch (error) {
      console.error('Error loading ABM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!listName || !listCriteria) return;
    setCreating(true);
    try {
      const res = await fetch('/api/abm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_list', name: listName, criteria: listCriteria }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.list) {
          setAccountLists((prev) => [data.list, ...prev]);
          addNotification({ type: 'success', title: 'List Created', message: `"${listName}" has been created` });
        }
      }
    } catch (error) {
      console.error('Error creating list:', error);
      addNotification({ type: 'error', title: 'Creation Failed', message: 'Could not create account list' });
    } finally {
      setCreating(false);
      setCreateListDialogOpen(false);
      setListName('');
      setListCriteria('');
    }
  };

  const tierCounts = {
    1: targetAccounts.filter(a => a.tier === 1).length,
    2: targetAccounts.filter(a => a.tier === 2).length,
    3: targetAccounts.filter(a => a.tier === 3).length,
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
            <Building2 className="h-6 w-6 text-emerald-400" />
            Account-Based Marketing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Target high-value accounts with personalized campaigns and intent signals
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Account Lists"
          value={accountLists.length.toString()}
          icon={ListFilter}
          trend={`${accountLists.reduce((sum, l) => sum + (l.accountCount || 0), 0)} total accounts`}
          accent="emerald"
        />
        <StatCard
          title="Tier 1 Accounts"
          value={tierCounts[1].toString()}
          icon={Crown}
          trend="Highest priority"
          accent="amber"
        />
        <StatCard
          title="High Intent"
          value={intentSignals.length.toString()}
          icon={Signal}
          trend="Active signals"
          accent="cyan"
        />
        <StatCard
          title="Active Strategies"
          value={contentStrategies.length.toString()}
          icon={Sparkles}
          trend="Personalized"
          accent="violet"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/30">
          <TabsTrigger value="account-lists" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <ListFilter className="h-3.5 w-3.5 mr-1.5" />Account Lists
          </TabsTrigger>
          <TabsTrigger value="target-accounts" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />Target Accounts
          </TabsTrigger>
          <TabsTrigger value="intent-signals" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Signal className="h-3.5 w-3.5 mr-1.5" />Intent Signals
          </TabsTrigger>
          <TabsTrigger value="content-strategy" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />Content Strategy
          </TabsTrigger>
        </TabsList>

        {/* Account Lists Tab */}
        <TabsContent value="account-lists" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setCreateListDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
            >
              <Plus className="h-4 w-4" /> Create List
            </Button>
          </div>

          {/* Tier Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((tier) => {
              const config = tierConfig[tier];
              const TierIcon = config.icon;
              return (
                <Card key={tier} className="card-premium border-border/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2.5 ${config.bg}`}>
                        <TierIcon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          {config.label}
                        </div>
                        <div className="text-2xl font-bold text-foreground/95">
                          {tierCounts[tier as keyof typeof tierCounts]}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tier === 1 ? 'bg-amber-400' : tier === 2 ? 'bg-gray-300' : 'bg-orange-400'
                          }`}
                          style={{ width: `${targetAccounts.length > 0 ? (tierCounts[tier as keyof typeof tierCounts] / targetAccounts.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountLists.map((list) => (
              <Card key={list.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                      {list.accountCount || 0} accounts
                    </Badge>
                    <ListFilter className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{list.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/60 line-clamp-2">{list.criteria}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-amber-400" />{list.tier1Count || 0}</span>
                    <span className="flex items-center gap-1"><Medal className="h-3 w-3 text-gray-300" />{list.tier2Count || 0}</span>
                    <span className="flex items-center gap-1"><Award className="h-3 w-3 text-orange-400" />{list.tier3Count || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {accountLists.length === 0 && (
              <div className="col-span-full text-center py-16">
                <ListFilter className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No account lists yet</h3>
                <p className="text-sm text-muted-foreground">Create your first target account list</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Target Accounts Tab */}
        <TabsContent value="target-accounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {targetAccounts.map((account) => {
              const config = tierConfig[account.tier];
              const TierIcon = config.icon;
              return (
                <Card key={account.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] ${config.border} ${config.color} ${config.bg}`}>
                        <TierIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Signal className={`h-3 w-3 ${account.intentScore > 70 ? 'text-emerald-400' : account.intentScore > 40 ? 'text-amber-400' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-medium text-foreground/80">{account.intentScore}</span>
                      </div>
                    </div>
                    <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{account.companyName}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">{account.industry}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Revenue: </span>
                        <span className="text-foreground/80 font-medium">{account.revenue}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size: </span>
                        <span className="text-foreground/80 font-medium">{account.employees}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Intent Score</span>
                        <span className={`font-medium ${account.intentScore > 70 ? 'text-emerald-400' : account.intentScore > 40 ? 'text-amber-400' : 'text-gray-400'}`}>
                          {account.intentScore}%
                        </span>
                      </div>
                      <Progress
                        value={account.intentScore}
                        className="h-1.5 bg-secondary/40"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Intent Signals Tab */}
        <TabsContent value="intent-signals" className="space-y-4">
          <Card className="card-premium border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Signal className="h-4 w-4 text-emerald-400" />
                Detected Intent Signals
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                High-intent accounts showing buying signals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {intentSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-start gap-3 rounded-lg border border-border/25 bg-secondary/10 p-3 transition-colors hover:bg-secondary/20"
                >
                  <div className={`shrink-0 mt-0.5 rounded-full p-1.5 ${
                    signal.intensity > 80 ? 'bg-emerald-500/10' :
                    signal.intensity > 60 ? 'bg-amber-500/10' : 'bg-gray-500/10'
                  }`}>
                    <Zap className={`h-3.5 w-3.5 ${
                      signal.intensity > 80 ? 'text-emerald-400' :
                      signal.intensity > 60 ? 'text-amber-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground/90">{signal.companyName}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          signal.intensity > 80 ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                          signal.intensity > 60 ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                          'border-gray-500/20 text-gray-400 bg-gray-500/5'
                        }`}
                      >
                        {signal.intensity}% intensity
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">{signal.signalType}</span>
                      {' — '}{signal.description}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(signal.detectedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {intentSignals.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No intent signals detected yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Strategy Tab */}
        <TabsContent value="content-strategy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentStrategies.map((cs) => (
              <Card key={cs.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                      <Sparkles className="h-3 w-3 mr-1" />AI Strategy
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{cs.companyName}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/60">{cs.strategy}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Messaging</div>
                    <p className="text-xs text-muted-foreground">{cs.messaging}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Channels</div>
                    <div className="flex flex-wrap gap-1">
                      {cs.channels.map((ch, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
                          {ch}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Content Types</div>
                    <div className="flex flex-wrap gap-1">
                      {cs.contentTypes.map((ct, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                          {ct}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {contentStrategies.length === 0 && (
              <div className="col-span-full text-center py-16">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No content strategies yet</h3>
                <p className="text-sm text-muted-foreground">AI strategies will be generated for target accounts</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create List Dialog */}
      <Dialog open={createListDialogOpen} onOpenChange={setCreateListDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Plus className="h-5 w-5 text-emerald-400" />
              Create Account List
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">List Name</label>
              <Input
                placeholder="e.g., Enterprise SaaS Prospects"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Targeting Criteria</label>
              <Textarea
                placeholder="Describe the ICP criteria, industry, company size, revenue..."
                value={listCriteria}
                onChange={(e) => setListCriteria(e.target.value)}
                rows={4}
                className="resize-none bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateListDialogOpen(false)} className="border-border/40">Cancel</Button>
            <Button onClick={handleCreateList} disabled={!listName || !listCriteria || creating} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
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
