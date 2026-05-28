'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Crosshair,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Building2,
  Users,
  MapPin,
  Zap,
  Target,
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
  Send,
  Shield,
  BarChart3,
  Calendar,
  Star,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { safeFetchJSON } from '@/lib/utils';
import type { ICPResult, ConversationContext, SuggestedAction } from '@/lib/prospect-agent/types';
import { PERSONA_META } from '@/lib/prospect-agent/types';

// ============================================================
// Types
// ============================================================

interface ICPProfile {
  id: string;
  name: string;
  description: string | null;
  industries: string[];
  companySizes: string[];
  locations: string[];
  revenueRange: string | null;
  requiredTech: string[];
  preferredTech: string[];
  techSophisticationLevel: string;
  digitalMaturityScore: number;
  values: string[];
  challenges: string[];
  goals: string[];
  cultureTypes: string[];
  buyingSignals: string[];
  engagementPatterns: string[];
  triggerEvents: string[];
  expansionSignals: string[];
  complianceNeeds: string[];
  budgetRange: string | null;
  decisionTimeline: string | null;
  priceSensitivity: string;
  lifetimeValuePotential: string;
  criteria: Record<string, unknown>;
  leadsScored: number;
  avgFitScore: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  icpData?: ICPResult | null;
}

// ============================================================
// Helpers
// ============================================================

function safeFormatTime(timestamp: Date | string | number | undefined | null): string {
  try {
    if (!timestamp) return '';
    const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString();
  } catch {
    return '';
  }
}

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  firmographic: Building2,
  technographic: Zap,
  psychographic: Target,
  behavioral: TrendingUp,
  situational: AlertCircle,
  economic: DollarSign,
};

const DIMENSION_LABELS: Record<string, string> = {
  firmographic: 'Firmographic',
  technographic: 'Technographic',
  psychographic: 'Psychographic',
  behavioral: 'Behavioral',
  situational: 'Situational',
  economic: 'Economic',
};

const DIMENSION_COLORS: Record<string, string> = {
  firmographic: 'emerald',
  technographic: 'amber',
  psychographic: 'violet',
  behavioral: 'cyan',
  situational: 'rose',
  economic: 'sky',
};

// ============================================================
// Sub-components
// ============================================================

function TagList({ items, color = 'cyan' }: { items: string[]; color?: string }) {
  if (!items || items.length === 0) return null;
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <Badge key={i} variant="outline" className={`text-[9px] ${colorMap[color] || colorMap.cyan}`}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, defaultOpen = true, color = 'cyan' }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; color?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400', amber: 'text-amber-400', violet: 'text-violet-400',
    cyan: 'text-cyan-400', rose: 'text-rose-400', sky: 'text-sky-400',
  };
  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 bg-secondary/20 hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${colorMap[color] || 'text-muted-foreground'}`} />
          <span className="text-xs font-medium text-foreground/80">{title}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-3 py-2 space-y-1.5">{children}</div>}
    </div>
  );
}

function DimensionScoreBar({ label, score, icon: Icon, color }: {
  label: string; score: number; icon: React.ElementType; color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: '[&>div]:bg-emerald-400', amber: '[&>div]:bg-amber-400', violet: '[&>div]:bg-violet-400',
    cyan: '[&>div]:bg-cyan-400', rose: '[&>div]:bg-rose-400', sky: '[&>div]:bg-sky-400',
  };
  const textColorMap: Record<string, string> = {
    emerald: 'text-emerald-400', amber: 'text-amber-400', violet: 'text-violet-400',
    cyan: 'text-cyan-400', rose: 'text-rose-400', sky: 'text-sky-400',
  };
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Icon className={`h-4 w-4 ${textColorMap[color] || 'text-muted-foreground'} shrink-0`} />
      <span className="text-xs text-foreground/70 w-28 shrink-0">{label}</span>
      <Progress value={score} className={`h-1.5 flex-1 bg-secondary/40 ${colorMap[color] || ''}`} />
      <span className={`text-xs font-bold w-8 text-right ${textColorMap[color] || 'text-foreground'}`}>{score}</span>
    </div>
  );
}

// ============================================================
// ICP Detail View
// ============================================================

function ICPDetailView({ profile, onBack, onDelete }: {
  profile: ICPProfile; onBack: () => void; onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const { setActiveView } = useAppStore();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await safeFetchJSON<{ success: boolean }>('/api/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: profile.id }),
      });
      onDelete(profile.id);
    } catch {
      setDeleting(false);
    }
  };

  // Calculate dimension completeness scores
  const getDimensionScore = (fields: (string[] | string | null | undefined | number)[]): number => {
    const total = fields.length;
    const filled = fields.filter((f) => {
      if (Array.isArray(f)) return f.length > 0;
      if (typeof f === 'string') return f.length > 0;
      if (typeof f === 'number') return f > 0;
      return false;
    }).length;
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  const firmoScore = getDimensionScore([profile.industries, profile.companySizes, profile.locations, profile.revenueRange]);
  const technoScore = getDimensionScore([profile.requiredTech, profile.preferredTech, profile.techSophisticationLevel, profile.digitalMaturityScore]);
  const psychoScore = getDimensionScore([profile.values, profile.challenges, profile.goals, profile.cultureTypes]);
  const behavScore = getDimensionScore([profile.buyingSignals, profile.engagementPatterns]);
  const situScore = getDimensionScore([profile.triggerEvents, profile.expansionSignals, profile.complianceNeeds]);
  const econScore = getDimensionScore([profile.budgetRange, profile.decisionTimeline, profile.priceSensitivity, profile.lifetimeValuePotential]);
  const overallScore = Math.round((firmoScore + technoScore + psychoScore + behavScore + situScore + econScore) / 6);

  const tier = overallScore >= 80 ? 'Comprehensive' : overallScore >= 60 ? 'Well-Defined' : overallScore >= 40 ? 'Developing' : 'Basic';
  const tierColor = overallScore >= 80 ? 'text-emerald-400' : overallScore >= 60 ? 'text-cyan-400' : overallScore >= 40 ? 'text-amber-400' : 'text-orange-400';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground mb-2 -ml-2 gap-1 text-xs" onClick={onBack}>
            <ChevronUp className="h-3 w-3 rotate-[-90deg]" /> Back to ICPs
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
              <Crosshair className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{profile.name}</h3>
              {profile.description && <p className="text-xs text-muted-foreground">{profile.description}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-2xl font-bold text-foreground">{overallScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <Badge variant="outline" className={`text-[10px] ${tierColor}`}>{tier}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 gap-1 text-xs h-8"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </Button>
        </div>
      </div>

      {/* Overall Score Bar */}
      <div className="rounded-xl border border-border/30 bg-card/50 p-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Profile Completeness</h4>
        <div className="space-y-2">
          <DimensionScoreBar label="Firmographic" score={firmoScore} icon={Building2} color="emerald" />
          <DimensionScoreBar label="Technographic" score={technoScore} icon={Zap} color="amber" />
          <DimensionScoreBar label="Psychographic" score={psychoScore} icon={Target} color="violet" />
          <DimensionScoreBar label="Behavioral" score={behavScore} icon={TrendingUp} color="cyan" />
          <DimensionScoreBar label="Situational" score={situScore} icon={AlertCircle} color="rose" />
          <DimensionScoreBar label="Economic" score={econScore} icon={DollarSign} color="sky" />
        </div>
      </div>

      {/* Dimension Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Firmographic */}
        <SectionCard title="Firmographic" icon={Building2} color="emerald">
          {profile.industries.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Industries</span>
              <TagList items={profile.industries} color="emerald" />
            </div>
          )}
          {profile.companySizes.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Company Sizes</span>
              <TagList items={profile.companySizes} color="cyan" />
            </div>
          )}
          {profile.locations.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Locations</span>
              <TagList items={profile.locations} color="violet" />
            </div>
          )}
          {profile.revenueRange && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-foreground/80">Revenue: {profile.revenueRange}</span>
            </div>
          )}
          {profile.industries.length === 0 && profile.companySizes.length === 0 && profile.locations.length === 0 && !profile.revenueRange && (
            <p className="text-xs text-muted-foreground/50 italic">No firmographic criteria defined yet</p>
          )}
        </SectionCard>

        {/* Technographic */}
        <SectionCard title="Technographic" icon={Zap} color="amber">
          {profile.requiredTech.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Required Tech</span>
              <TagList items={profile.requiredTech} color="amber" />
            </div>
          )}
          {profile.preferredTech.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Preferred Tech</span>
              <TagList items={profile.preferredTech} color="cyan" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-xs text-foreground/80">Sophistication: {profile.techSophisticationLevel}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3 w-3 text-amber-400" />
            <span className="text-xs text-foreground/80">Digital Maturity: {profile.digitalMaturityScore}/100</span>
          </div>
          {profile.requiredTech.length === 0 && profile.preferredTech.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic">No technographic criteria defined yet</p>
          )}
        </SectionCard>

        {/* Psychographic */}
        <SectionCard title="Psychographic" icon={Target} color="violet">
          {profile.values.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Values</span>
              <TagList items={profile.values} color="emerald" />
            </div>
          )}
          {profile.challenges.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Challenges</span>
              <TagList items={profile.challenges} color="rose" />
            </div>
          )}
          {profile.goals.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Goals</span>
              <TagList items={profile.goals} color="violet" />
            </div>
          )}
          {profile.cultureTypes.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Culture Types</span>
              <TagList items={profile.cultureTypes} color="sky" />
            </div>
          )}
          {profile.values.length === 0 && profile.challenges.length === 0 && profile.goals.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic">No psychographic criteria defined yet</p>
          )}
        </SectionCard>

        {/* Behavioral */}
        <SectionCard title="Behavioral" icon={TrendingUp} color="cyan">
          {profile.buyingSignals.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Buying Signals</span>
              <TagList items={profile.buyingSignals} color="emerald" />
            </div>
          )}
          {profile.engagementPatterns.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Engagement Patterns</span>
              <TagList items={profile.engagementPatterns} color="cyan" />
            </div>
          )}
          {profile.buyingSignals.length === 0 && profile.engagementPatterns.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic">No behavioral criteria defined yet</p>
          )}
        </SectionCard>

        {/* Situational */}
        <SectionCard title="Situational" icon={AlertCircle} color="rose">
          {profile.triggerEvents.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Trigger Events</span>
              <TagList items={profile.triggerEvents} color="rose" />
            </div>
          )}
          {profile.expansionSignals.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Expansion Signals</span>
              <TagList items={profile.expansionSignals} color="amber" />
            </div>
          )}
          {profile.complianceNeeds.length > 0 && (
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Compliance Needs</span>
              <TagList items={profile.complianceNeeds} color="violet" />
            </div>
          )}
          {profile.triggerEvents.length === 0 && profile.expansionSignals.length === 0 && profile.complianceNeeds.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic">No situational criteria defined yet</p>
          )}
        </SectionCard>

        {/* Economic */}
        <SectionCard title="Economic" icon={DollarSign} color="sky">
          {profile.budgetRange && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-sky-400" />
              <span className="text-xs text-foreground/80">Budget: {profile.budgetRange}</span>
            </div>
          )}
          {profile.decisionTimeline && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-sky-400" />
              <span className="text-xs text-foreground/80">Decision Timeline: {profile.decisionTimeline}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-sky-400" />
            <span className="text-xs text-foreground/80">Price Sensitivity: {profile.priceSensitivity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-3 w-3 text-sky-400" />
            <span className="text-xs text-foreground/80">LTV Potential: {profile.lifetimeValuePotential}</span>
          </div>
          {!profile.budgetRange && !profile.decisionTimeline && (
            <p className="text-xs text-muted-foreground/50 italic">No economic criteria defined yet</p>
          )}
        </SectionCard>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-border/30 bg-card/50 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Leads Scored</span>
            <span className="text-sm font-bold text-foreground">{profile.leadsScored}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Avg Fit Score</span>
            <span className="text-sm font-bold text-foreground">{profile.avgFitScore.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-muted-foreground">Created</span>
            <span className="text-xs text-foreground/70">{new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 text-xs"
          onClick={() => setActiveView('prospect-discovery')}
        >
          <Sparkles className="h-3.5 w-3.5" /> Refine with AI
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-xs border-border/40 hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400"
          onClick={() => setActiveView('leads')}
        >
          <Users className="h-3.5 w-3.5" /> Score Leads
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-xs border-border/40 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400"
          onClick={() => setActiveView('campaigns')}
        >
          <Target className="h-3.5 w-3.5" /> Use in Campaign
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ICP List Item
// ============================================================

function ICPListItem({ profile, isSelected, onClick }: {
  profile: ICPProfile; isSelected: boolean; onClick: () => void;
}) {
  const totalCriteria = [
    profile.industries, profile.companySizes, profile.locations,
    profile.requiredTech, profile.challenges, profile.goals,
    profile.buyingSignals, profile.triggerEvents,
  ].filter((arr) => arr.length > 0).length;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 ${
        isSelected
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-border/30 bg-card/30 hover:bg-card/60 hover:border-border/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Crosshair className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-muted-foreground/60'}`} />
          <span className={`text-sm font-medium truncate ${isSelected ? 'text-amber-400' : 'text-foreground/80'}`}>
            {profile.name}
          </span>
        </div>
        <Badge variant="outline" className="text-[8px] shrink-0 border-amber-500/20 text-amber-400">
          {totalCriteria} criteria
        </Badge>
      </div>
      {profile.description && (
        <p className="text-[10px] text-muted-foreground/60 mt-1 line-clamp-1 pl-5.5">
          {profile.description}
        </p>
      )}
      <div className="flex items-center gap-3 mt-1.5 pl-5.5">
        {profile.industries.length > 0 && (
          <span className="text-[9px] text-emerald-400/70">{profile.industries.length} industries</span>
        )}
        {profile.companySizes.length > 0 && (
          <span className="text-[9px] text-cyan-400/70">{profile.companySizes.length} sizes</span>
        )}
        {profile.buyingSignals.length > 0 && (
          <span className="text-[9px] text-violet-400/70">{profile.buyingSignals.length} signals</span>
        )}
      </div>
    </button>
  );
}

// ============================================================
// Main ICP View
// ============================================================

export function ICPView() {
  const [profiles, setProfiles] = useState<ICPProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [builderICP, setBuilderICP] = useState<ICPResult | null>(null);
  const [saveNotification, setSaveNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isBuilding]);

  // Auto-hide notification
  useEffect(() => {
    if (saveNotification) {
      const t = setTimeout(() => setSaveNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [saveNotification]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const result = await safeFetchJSON<{ profiles: ICPProfile[] }>('/api/icp', { method: 'GET' });
      if (result.profiles) {
        setProfiles(result.profiles);
      }
    } catch (error) {
      console.error('Failed to fetch ICP profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = (id: string) => {
    setSelectedId(id);
    setShowBuilder(false);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleStartBuilder = () => {
    setShowBuilder(true);
    setSelectedId(null);
    setChatMessages([]);
    setBuilderICP(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ============================================================
  // AI Builder Chat
  // ============================================================

  const handleSendBuilderMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || chatInput).trim();
    if (!text || isBuilding) return;
    setChatInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsBuilding(true);

    try {
      const result = await safeFetchJSON<{
        success: boolean;
        message: { content: string; icpData?: ICPResult };
        updatedContext?: ConversationContext;
        error?: string;
      }>('/api/prospect-discovery/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: chatMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          context: {
            recentProspects: [],
            activeICP: builderICP,
            lastIntent: null,
            lastPersona: null,
            userPreferences: {},
          },
        }),
      });

      if (result.success && result.message) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.message.content,
          timestamp: new Date(),
          icpData: result.message.icpData || null,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        if (result.message.icpData) {
          setBuilderICP(result.message.icpData);
        }
      } else {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: result.error || 'The agent encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Agent error: ${msg}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    }

    setIsBuilding(false);
    inputRef.current?.focus();
  }, [chatInput, isBuilding, chatMessages, builderICP]);

  // ============================================================
  // Save ICP to database
  // ============================================================

  const handleSaveICP = async (icp: ICPResult) => {
    try {
      const profileData = {
        name: icp.name,
        description: icp.description,
        firmographic: {
          industries: icp.firmographic.industries,
          companySizes: icp.firmographic.companySizes,
          locations: icp.firmographic.locations,
          revenueRange: icp.firmographic.revenueRange || null,
        },
        technographic: {
          requiredTech: icp.technographic.requiredTech,
          preferredTech: icp.technographic.preferredTech,
        },
        psychographic: {
          values: icp.psychographic.values,
          challenges: icp.psychographic.challenges,
          goals: icp.psychographic.goals,
        },
        behavioral: {
          buyingSignals: icp.behavioral.buyingSignals,
          engagementPatterns: icp.behavioral.engagementPatterns,
        },
        economic: {
          budgetRange: icp.economic.budgetRange || null,
          decisionTimeline: icp.economic.decisionTimeline || null,
        },
        criteria: icp.criteria,
      };

      const result = await safeFetchJSON<{ id: string; profile: ICPProfile }>('/api/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', profile: profileData }),
      });

      if (result.id) {
        setSaveNotification({ type: 'success', message: `ICP "${icp.name}" saved successfully!` });
        setShowBuilder(false);
        setChatMessages([]);
        setBuilderICP(null);
        await fetchProfiles();
        setSelectedId(result.id);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setSaveNotification({ type: 'error', message: `Failed to save ICP: ${msg}` });
    }
  };

  const selectedProfile = profiles.find((p) => p.id === selectedId);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crosshair className="h-6 w-6 text-amber-400" />
            ICP Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define, refine, and manage your Ideal Customer Profiles across 6 strategic dimensions
          </p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2 text-xs"
          onClick={handleStartBuilder}
        >
          <Plus className="h-3.5 w-3.5" /> Build New ICP
        </Button>
      </div>

      {/* Notification */}
      {saveNotification && (
        <div className={`mb-2 rounded-lg px-3 py-2 text-xs font-medium ${
          saveNotification.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {saveNotification.message}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Left Panel — ICP List */}
        <div className="w-72 shrink-0 rounded-xl border border-border/30 bg-card/50 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border/20">
            <span className="text-xs font-medium text-muted-foreground">Your Profiles ({profiles.length})</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-3">
                    <Crosshair className="h-7 w-7 text-amber-400" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    No ICP profiles yet. Click &ldquo;Build New ICP&rdquo; to create one with AI assistance.
                  </p>
                </div>
              ) : (
                profiles.map((profile) => (
                  <ICPListItem
                    key={profile.id}
                    profile={profile}
                    isSelected={selectedId === profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel — Detail or Builder */}
        <div className="flex-1 min-h-0 rounded-xl border border-border/30 bg-card/50 overflow-hidden flex flex-col">
          {showBuilder ? (
            /* ========== AI Builder ========== */
            <div className="flex flex-col h-full">
              {/* Builder Header */}
              <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <Brain className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">AI ICP Builder</span>
                    <span className="text-[9px] text-muted-foreground ml-2">Architect Persona</span>
                  </div>
                </div>
                {builderICP && (
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 text-xs h-8"
                    onClick={() => handleSaveICP(builderICP)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Save ICP
                  </Button>
                )}
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="p-4 space-y-4">
                  {/* Empty state */}
                  {chatMessages.length === 0 && !isBuilding && (
                    <div className="flex flex-col items-center justify-center py-10 px-4">
                      <div className="relative mb-4">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                          <Crosshair className="h-10 w-10 text-amber-400" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground/90 mb-2">ICP Architect Ready</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-md mb-5">
                        Tell me about your ideal customer. I&apos;ll help you build a comprehensive profile across firmographic, technographic, psychographic, behavioral, situational, and economic dimensions.
                      </p>
                      <div className="grid grid-cols-2 gap-2.5 max-w-lg w-full">
                        {[
                          { emoji: '🏢', label: 'By Industry', example: 'Build an ICP for B2B SaaS companies', color: 'emerald' },
                          { emoji: '🌍', label: 'By Market', example: 'ICP for fintech startups in Europe', color: 'cyan' },
                          { emoji: '🎯', label: 'By Product', example: 'Who needs a CRM automation tool?', color: 'amber' },
                          { emoji: '📊', label: 'By Size', example: 'ICP for mid-market enterprises 200-500 employees', color: 'violet' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => handleSendBuilderMessage(item.example)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/30 bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer text-left"
                          >
                            <span className="text-lg">{item.emoji}</span>
                            <span className="text-[10px] font-medium text-foreground/70">{item.label}</span>
                            <span className="text-[8px] text-muted-foreground/60 text-center">{item.example}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message List */}
                  {chatMessages.map((msg) => (
                    <div key={msg.id}>
                      {/* User Message */}
                      {msg.role === 'user' && (
                        <div className="flex justify-end">
                          <div className="max-w-md rounded-2xl rounded-br-md bg-amber-500/15 border border-amber-500/20 px-4 py-2.5">
                            <p className="text-sm text-foreground/90">{msg.content}</p>
                            <p className="text-[9px] text-muted-foreground/50 mt-1">{safeFormatTime(msg.timestamp)}</p>
                          </div>
                        </div>
                      )}

                      {/* System Error */}
                      {msg.role === 'system' && (
                        <div className="flex justify-center">
                          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 max-w-md">
                            <p className="text-xs text-red-400">{msg.content}</p>
                          </div>
                        </div>
                      )}

                      {/* Assistant Message */}
                      {msg.role === 'assistant' && (
                        <div className="flex justify-start">
                          <div className="max-w-3xl w-full space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                              </div>
                              <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium gap-1">
                                Architect
                              </Badge>
                              <span className="text-[9px] text-muted-foreground/50">{safeFormatTime(msg.timestamp)}</span>
                            </div>

                            {/* Response text */}
                            <div className="ml-9 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </div>

                            {/* ICP Data Card inline */}
                            {msg.icpData && (
                              <div className="ml-9">
                                <Card className="border-amber-500/20">
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Target className="h-4 w-4 text-amber-400" />
                                      <h4 className="text-sm font-bold text-foreground/90">{msg.icpData.name}</h4>
                                    </div>
                                    {msg.icpData.description && <p className="text-xs text-muted-foreground">{msg.icpData.description}</p>}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {msg.icpData.firmographic.industries.length > 0 && (
                                        <SectionCard title="Industries" icon={Briefcase} color="emerald">
                                          <TagList items={msg.icpData.firmographic.industries} color="emerald" />
                                        </SectionCard>
                                      )}
                                      {msg.icpData.firmographic.companySizes.length > 0 && (
                                        <SectionCard title="Company Sizes" icon={Users} color="cyan">
                                          <TagList items={msg.icpData.firmographic.companySizes} color="cyan" />
                                        </SectionCard>
                                      )}
                                      {msg.icpData.firmographic.locations.length > 0 && (
                                        <SectionCard title="Locations" icon={MapPin} color="violet">
                                          <TagList items={msg.icpData.firmographic.locations} color="violet" />
                                        </SectionCard>
                                      )}
                                      {msg.icpData.technographic.requiredTech.length > 0 && (
                                        <SectionCard title="Required Tech" icon={Zap} color="amber">
                                          <TagList items={msg.icpData.technographic.requiredTech} color="amber" />
                                        </SectionCard>
                                      )}
                                      {msg.icpData.psychographic.challenges.length > 0 && (
                                        <SectionCard title="Challenges" icon={AlertCircle} color="rose">
                                          <TagList items={msg.icpData.psychographic.challenges} color="rose" />
                                        </SectionCard>
                                      )}
                                      {msg.icpData.psychographic.goals.length > 0 && (
                                        <SectionCard title="Goals" icon={Target} color="violet">
                                          <TagList items={msg.icpData.psychographic.goals} color="violet" />
                                        </SectionCard>
                                      )}
                                      {msg.icpData.behavioral.buyingSignals.length > 0 && (
                                        <SectionCard title="Buying Signals" icon={TrendingUp} color="emerald">
                                          <TagList items={msg.icpData.behavioral.buyingSignals} color="emerald" />
                                        </SectionCard>
                                      )}
                                      {msg.icpData.economic.budgetRange && (
                                        <SectionCard title="Economic" icon={DollarSign} color="sky">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <DollarSign className="h-3 w-3 text-sky-400" />
                                              <span className="text-xs text-foreground/80">Budget: {msg.icpData.economic.budgetRange}</span>
                                            </div>
                                            {msg.icpData.economic.decisionTimeline && (
                                              <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-sky-400" />
                                                <span className="text-xs text-foreground/80">Timeline: {msg.icpData.economic.decisionTimeline}</span>
                                              </div>
                                            )}
                                          </div>
                                        </SectionCard>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Building indicator */}
                  {isBuilding && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 ml-9">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">Building your ICP...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Bar */}
              <div className="px-4 py-3 border-t border-border/20">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Describe your ideal customer..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendBuilderMessage();
                      }
                    }}
                    className="flex-1 bg-secondary/20 border-border/30 text-sm"
                    disabled={isBuilding}
                  />
                  <Button
                    onClick={() => handleSendBuilderMessage()}
                    disabled={isBuilding || !chatInput.trim()}
                    className="bg-amber-500 hover:bg-amber-400 text-black gap-2 text-xs h-9"
                  >
                    {isBuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedProfile ? (
            /* ========== Detail View ========== */
            <ScrollArea className="flex-1">
              <div className="p-4">
                <ICPDetailView
                  profile={selectedProfile}
                  onBack={() => setSelectedId(null)}
                  onDelete={handleDeleteProfile}
                />
              </div>
            </ScrollArea>
          ) : (
            /* ========== Empty State ========== */
            <ScrollArea className="flex-1">
              <div className="p-4 flex items-center justify-center min-h-full">
                <div className="text-center px-8">
                  <div className="relative mb-5 mx-auto w-fit">
                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                      <Crosshair className="h-12 w-12 text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground/90 mb-2">Ideal Customer Profiles</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
                    Define your perfect customer across 6 dimensions: firmographic, technographic, psychographic, behavioral, situational, and economic. Use AI to build and refine profiles, then score leads against them.
                  </p>
                  <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
                    {[
                      { icon: Building2, label: 'Firmographic', desc: 'Industry, size, location', color: 'emerald' },
                      { icon: Zap, label: 'Technographic', desc: 'Tech stack, maturity', color: 'amber' },
                      { icon: Target, label: 'Psychographic', desc: 'Values, challenges', color: 'violet' },
                      { icon: TrendingUp, label: 'Behavioral', desc: 'Buying signals, engagement', color: 'cyan' },
                      { icon: AlertCircle, label: 'Situational', desc: 'Triggers, expansion', color: 'rose' },
                      { icon: DollarSign, label: 'Economic', desc: 'Budget, LTV potential', color: 'sky' },
                    ].map((dim) => {
                      const Icon = dim.icon;
                      const colorMap: Record<string, string> = {
                        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                        violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                        sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                      };
                      return (
                        <div key={dim.label} className={`rounded-lg border p-3 text-center ${colorMap[dim.color]}`}>
                          <Icon className="h-5 w-5 mx-auto mb-1.5" />
                          <p className="text-[10px] font-medium">{dim.label}</p>
                          <p className="text-[8px] opacity-60">{dim.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2"
                    onClick={handleStartBuilder}
                  >
                    <Sparkles className="h-4 w-4" /> Build Your First ICP
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
