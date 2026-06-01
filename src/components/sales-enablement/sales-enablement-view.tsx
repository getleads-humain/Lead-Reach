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
  BookOpen,
  Shield,
  FileText,
  Library,
  ArrowUpRight,
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Award,
  Swords,
  Lightbulb,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface Playbook {
  id: string;
  name: string;
  industry: string;
  stages: string[];
  winRate: number;
  usageCount: number;
  status: string;
}

interface BattleCard {
  id: string;
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  positioning: string;
  winRate: number;
}

interface Proposal {
  id: string;
  title: string;
  leadName: string;
  dealValue: string;
  status: string;
  createdAt: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  tags: string[];
  usageCount: number;
  relevance: number;
}

export function SalesEnablementView() {
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [battleCards, setBattleCards] = useState<BattleCard[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contentLibrary, setContentLibrary] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState('playbooks');

  // Dialogs
  const [playbookDialogOpen, setPlaybookDialogOpen] = useState(false);
  const [battleCardDialogOpen, setBattleCardDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [playbookIndustry, setPlaybookIndustry] = useState('');
  const [playbookContext, setPlaybookContext] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [competitorContext, setCompetitorContext] = useState('');
  const [proposalLeadData, setProposalLeadData] = useState('');
  const [proposalDealContext, setProposalDealContext] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [playbooksRes, battleCardsRes, proposalsRes, contentRes] = await Promise.all([
        fetch('/api/sales-enablement?action=get_playbooks', { method: 'GET' }),
        fetch('/api/sales-enablement?action=get_battle_cards', { method: 'GET' }),
        fetch('/api/sales-enablement?action=get_proposals', { method: 'GET' }),
        fetch('/api/sales-enablement?action=get_content_library', { method: 'GET' }),
      ]);

      if (playbooksRes.ok) {
        const data = await playbooksRes.json();
        if (data.playbooks) setPlaybooks(data.playbooks);
      }
      if (battleCardsRes.ok) {
        const data = await battleCardsRes.json();
        if (data.battleCards) setBattleCards(data.battleCards);
      }
      if (proposalsRes.ok) {
        const data = await proposalsRes.json();
        if (data.proposals) setProposals(data.proposals);
      }
      if (contentRes.ok) {
        const data = await contentRes.json();
        if (data.contentLibrary) setContentLibrary(data.contentLibrary);
      }
    } catch (error) {
      console.error('Error loading sales enablement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlaybook = async () => {
    if (!playbookIndustry) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/sales-enablement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_playbook', industry: playbookIndustry, productContext: playbookContext || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.playbook) {
          setPlaybooks((prev) => [data.playbook, ...prev]);
          addNotification({ type: 'success', title: 'Playbook Generated', message: `"${data.playbook.name}" has been created` });
        }
      }
    } catch (error) {
      console.error('Error generating playbook:', error);
      addNotification({ type: 'error', title: 'Generation Failed', message: 'Could not generate playbook' });
    } finally {
      setGenerating(false);
      setPlaybookDialogOpen(false);
      setPlaybookIndustry('');
      setPlaybookContext('');
    }
  };

  const handleGenerateBattleCard = async () => {
    if (!competitorName) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/sales-enablement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_battle_card', competitorName, context: competitorContext || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.battleCard) {
          setBattleCards((prev) => [data.battleCard, ...prev]);
          addNotification({ type: 'success', title: 'Battle Card Generated', message: `Card for "${competitorName}" created` });
        }
      }
    } catch (error) {
      console.error('Error generating battle card:', error);
      addNotification({ type: 'error', title: 'Generation Failed', message: 'Could not generate battle card' });
    } finally {
      setGenerating(false);
      setBattleCardDialogOpen(false);
      setCompetitorName('');
      setCompetitorContext('');
    }
  };

  const handleGenerateProposal = async () => {
    if (!proposalLeadData) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/sales-enablement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_proposal', leadData: proposalLeadData, dealContext: proposalDealContext || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.proposal) {
          setProposals((prev) => [data.proposal, ...prev]);
          addNotification({ type: 'success', title: 'Proposal Generated', message: 'New proposal has been created' });
        }
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
      addNotification({ type: 'error', title: 'Generation Failed', message: 'Could not generate proposal' });
    } finally {
      setGenerating(false);
      setProposalDialogOpen(false);
      setProposalLeadData('');
      setProposalDealContext('');
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
            <Target className="h-6 w-6 text-emerald-400" />
            Sales Enablement
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered playbooks, battle cards, and proposals to close more deals
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Playbooks"
          value={playbooks.length.toString()}
          icon={BookOpen}
          trend={`${playbooks.filter(p => p.status === 'active').length} active`}
          accent="emerald"
        />
        <StatCard
          title="Battle Cards"
          value={battleCards.length.toString()}
          icon={Shield}
          trend="Competitive intel"
          accent="cyan"
        />
        <StatCard
          title="Proposals"
          value={proposals.length.toString()}
          icon={FileText}
          trend={`${proposals.filter(p => p.status === 'sent').length} sent`}
          accent="amber"
        />
        <StatCard
          title="Content Items"
          value={contentLibrary.length.toString()}
          icon={Library}
          trend="In library"
          accent="violet"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/30">
          <TabsTrigger value="playbooks" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />Playbooks
          </TabsTrigger>
          <TabsTrigger value="battle-cards" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Shield className="h-3.5 w-3.5 mr-1.5" />Battle Cards
          </TabsTrigger>
          <TabsTrigger value="proposals" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <FileText className="h-3.5 w-3.5 mr-1.5" />Proposals
          </TabsTrigger>
          <TabsTrigger value="content-library" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Library className="h-3.5 w-3.5 mr-1.5" />Content Library
          </TabsTrigger>
        </TabsList>

        {/* Playbooks Tab */}
        <TabsContent value="playbooks" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setPlaybookDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
            >
              <Plus className="h-4 w-4" /> Generate Playbook
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playbooks.map((playbook) => (
              <Card key={playbook.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                      {playbook.industry}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        playbook.status === 'active'
                          ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                          : 'border-border/30 text-muted-foreground'
                      }`}
                    >
                      {playbook.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{playbook.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {(playbook.stages || []).slice(0, 4).map((stage, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                        {stage}
                      </Badge>
                    ))}
                    {(playbook.stages || []).length > 4 && (
                      <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                        +{(playbook.stages || []).length - 4}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Award className="h-3 w-3" /> {playbook.winRate}% win rate
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {playbook.usageCount} uses
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {playbooks.length === 0 && (
              <div className="col-span-full text-center py-16">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No playbooks yet</h3>
                <p className="text-sm text-muted-foreground">Generate your first sales playbook by industry</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Battle Cards Tab */}
        <TabsContent value="battle-cards" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setBattleCardDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
            >
              <Plus className="h-4 w-4" /> Generate Battle Card
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {battleCards.map((card) => (
              <Card key={card.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
                      <Swords className="h-3 w-3 mr-1" />Competitor
                    </Badge>
                    <Shield className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{card.competitorName}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {card.positioning && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">&ldquo;{card.positioning}&rdquo;</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Strengths</div>
                      {(card.strengths || []).slice(0, 2).map((s, i) => (
                        <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />{s}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Weaknesses</div>
                      {(card.weaknesses || []).slice(0, 2).map((w, i) => (
                        <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5 text-amber-400 shrink-0" />{w}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Award className="h-3 w-3" /> {card.winRate}% win rate vs. {card.competitorName}
                  </div>
                </CardContent>
              </Card>
            ))}
            {battleCards.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No battle cards yet</h3>
                <p className="text-sm text-muted-foreground">Generate competitive battle cards to win more deals</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setProposalDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
            >
              <Plus className="h-4 w-4" /> Generate Proposal
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="card-premium border-border/30 hover:border-emerald-500/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        proposal.status === 'sent'
                          ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                          : proposal.status === 'draft'
                          ? 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                          : 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5'
                      }`}
                    >
                      {proposal.status}
                    </Badge>
                    <FileText className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground/90 mt-2">{proposal.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{proposal.leadName}</span>
                    <span className="font-medium text-foreground/80">{proposal.dealValue}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
            {proposals.length === 0 && (
              <div className="col-span-full text-center py-16">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground/80">No proposals yet</h3>
                <p className="text-sm text-muted-foreground">Generate AI-powered proposals for your deals</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Content Library Tab */}
        <TabsContent value="content-library" className="space-y-4">
          <Card className="card-premium border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <Library className="h-4 w-4 text-emerald-400" />
                Recommended Content
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                AI-curated content recommendations based on your deal context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {contentLibrary.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/30 bg-secondary/15 p-3 transition-colors hover:bg-secondary/25"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground/90">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground shrink-0">
                      {item.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {(item.tags || []).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{item.usageCount} uses</span>
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-emerald-400" />{item.relevance}% relevant
                    </span>
                  </div>
                </div>
              ))}
              {contentLibrary.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No content in library yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Playbook Dialog */}
      <Dialog open={playbookDialogOpen} onOpenChange={setPlaybookDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Generate Sales Playbook
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Industry</label>
              <Select value={playbookIndustry} onValueChange={setPlaybookIndustry}>
                <SelectTrigger className="bg-secondary/30 border-border/40">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60">
                  {['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Energy', 'Legal', 'Marketing'].map((ind) => (
                    <SelectItem key={ind} value={ind.toLowerCase()}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Product Context (optional)</label>
              <Textarea
                placeholder="Describe your product or service context..."
                value={playbookContext}
                onChange={(e) => setPlaybookContext(e.target.value)}
                rows={3}
                className="resize-none bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlaybookDialogOpen(false)} className="border-border/40">Cancel</Button>
            <Button onClick={handleGeneratePlaybook} disabled={!playbookIndustry || generating} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Battle Card Dialog */}
      <Dialog open={battleCardDialogOpen} onOpenChange={setBattleCardDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Generate Battle Card
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Competitor Name</label>
              <Input
                placeholder="e.g., Salesforce, HubSpot..."
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                className="bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Context (optional)</label>
              <Textarea
                placeholder="Any specific context about the competitive landscape..."
                value={competitorContext}
                onChange={(e) => setCompetitorContext(e.target.value)}
                rows={3}
                className="resize-none bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBattleCardDialogOpen(false)} className="border-border/40">Cancel</Button>
            <Button onClick={handleGenerateBattleCard} disabled={!competitorName || generating} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Proposal Dialog */}
      <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Generate Proposal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Lead Data</label>
              <Textarea
                placeholder="Describe the lead, their company, needs, and pain points..."
                value={proposalLeadData}
                onChange={(e) => setProposalLeadData(e.target.value)}
                rows={4}
                className="resize-none bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Deal Context (optional)</label>
              <Textarea
                placeholder="Any additional deal context, pricing, timeline..."
                value={proposalDealContext}
                onChange={(e) => setProposalDealContext(e.target.value)}
                rows={3}
                className="resize-none bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposalDialogOpen(false)} className="border-border/40">Cancel</Button>
            <Button onClick={handleGenerateProposal} disabled={!proposalLeadData || generating} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all">
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

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
