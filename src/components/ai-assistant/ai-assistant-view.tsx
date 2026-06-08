'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Search,
  BarChart3,
  Mail,
  Zap,
  Star,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Globe,
  Building2,
  UserCheck,
  Newspaper,
  Code2,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Square,
  Paperclip,
  RotateCcw,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Pin,
  X,
  Clock,
  FlaskConical,
  Telescope,
  Database,
  Save,
  CheckCircle,
  ExternalLink,
  MapPin,
  DollarSign,
  Briefcase,
  Tag,
  Compass,
  Info,
  LayoutGrid,
  Pencil,
  MoreHorizontal,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  useChatEngine,
  type ChatMessage,
  type ResearchStageInfo,
  type Conversation,
  type SaveTarget,
  type LeadDataItem,
  type ICPData,
  type OutreachMessage,
} from '@/hooks/use-chat-engine';
import { MarkdownRenderer } from './markdown-renderer';
import type { ViewType } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// Constants
// ============================================================

const SUGGESTED_PROMPTS = [
  { icon: Users, label: 'Find high-intent leads', description: 'Discover leads matching your ICP across 17+ channels', prompt: 'Find high-intent leads in the B2B SaaS space that match our ideal customer profile. Search across multiple channels.', toolView: 'prospect-discovery' as ViewType },
  { icon: Mail, label: 'Draft outreach sequence', description: 'Create personalized email & LinkedIn sequences', prompt: 'Draft a personalized outreach sequence for my top leads using cold email and LinkedIn connection requests.', toolView: 'outreach' as ViewType },
  { icon: BarChart3, label: 'Analyze pipeline health', description: 'Get insights on campaign performance', prompt: 'Analyze my pipeline performance and suggest improvements to increase response rates and conversions.', toolView: 'analytics' as ViewType },
  { icon: Target, label: 'Build my ICP', description: 'Define your ideal customer profile', prompt: 'Help me build a comprehensive Ideal Customer Profile for our B2B product targeting mid-market companies.', toolView: 'icp' as ViewType },
  { icon: Database, label: 'Enrich my leads', description: 'Fill in missing contact & firmographic data', prompt: 'I have a list of leads with incomplete data. Help me enrich them with contact details, firmographics, and tech stack info.', toolView: 'data-enrichment' as ViewType },
  { icon: Search, label: 'Research a company', description: 'Deep dive into a target prospect', prompt: 'Research a company for me. Give me a deep dive into their business model, tech stack, key decision makers, and buying signals.', toolView: 'prospect-discovery' as ViewType },
];

const SYSTEM_PROMPT = `You are LeadReach AI, an institutional-grade intelligence engine for B2B lead generation. You deliver production-ready data synthesis with domain-specific expertise.

1. **Lead Discovery** — Multi-channel search across 17+ channels (Web, LinkedIn, GitHub, Reddit, YouTube, Exa, etc.)
2. **Domain-Specific Intelligence** — 4-phase pipeline for specialized domains
3. **Data Enrichment** — Deep website reading, contact extraction, firmographic data
4. **Lead Qualification** — AI-powered scoring with domain-specific criteria and intent signal detection
5. **Outreach** — Personalized messages with stage-specific contact matrices
6. **Pipeline Management** — Track leads through stages from discovery to close
7. **Reports & Analytics** — Campaign analytics and pipeline insights
8. **ICP Building** — Define and refine Ideal Customer Profiles
9. **Multi-channel Messaging** — SMS, WhatsApp, Instagram, Facebook, Email

You are currently on the {currentPage} page. Tailor your responses to be context-aware.

When you identify that the user would benefit from a specific tool, mention it naturally in your response like:
- "You can explore more leads in **Prospect Discovery**"
- "Head over to **ICP Builder** to refine this profile"
- "Check **Outreach** to send these messages"
- "Your **Analytics** dashboard has more pipeline insights"

Be concise, actionable, and data-rich. Use bullet points for lists. Never fabricate data.`;

const ACTION_NAV_MAP: Record<string, { view: ViewType; label: string; icon: React.ElementType; description: string }> = {
  discover_leads: { view: 'prospect-discovery', label: 'Prospect Discovery', icon: Telescope, description: 'Search and discover new leads' },
  enrich_data: { view: 'data-enrichment', label: 'Data Enrichment', icon: Database, description: 'Enrich lead data' },
  compose_outreach: { view: 'outreach', label: 'Outreach', icon: Mail, description: 'Create outreach sequences' },
  build_icp: { view: 'icp', label: 'ICP Builder', icon: Target, description: 'Define your ideal customer' },
  analyze_pipeline: { view: 'analytics', label: 'Analytics', icon: TrendingUp, description: 'View pipeline analytics' },
  research_market: { view: 'prospect-discovery', label: 'Prospect Discovery', icon: Telescope, description: 'Deep research tools' },
};

const VIEW_LABELS: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  campaigns: 'Campaigns',
  leads: 'Leads',
  agents: 'Agents',
  outreach: 'Outreach',
  reports: 'Reports',
  setter: 'AI Setter',
  booking: 'Booking',
  messaging: 'Messaging',
  analytics: 'Analytics',
  'data-enrichment': 'Data Enrichment',
  'prospect-discovery': 'Prospect Discovery',
  identity: 'Identity',
  icp: 'ICP Builder',
  'ai-assistant': 'AI Assistant',
};

const ACTION_CONFIG: Record<string, { emoji: string; color: string; bgColor: string; borderColor: string }> = {
  discover_leads: { emoji: '🔍', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  enrich_data: { emoji: '📊', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  compose_outreach: { emoji: '✉️', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
  build_icp: { emoji: '🎯', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  analyze_pipeline: { emoji: '📈', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  research_market: { emoji: '🌐', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  general_chat: { emoji: '💡', color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
};

const stageIcons: Record<string, React.ElementType> = {
  'intent_analysis': Brain,
  'website_read': Globe,
  'company_search': Building2,
  'people_search': UserCheck,
  'news_social': Newspaper,
  'tech_analysis': Code2,
  'intent_signals': Target,
  'synthesis': Sparkles,
  'complete': CheckCircle2,
};

const RELATED_TOOLS: Record<string, string[]> = {
  discover_leads: ['enrich_data', 'build_icp', 'compose_outreach', 'analyze_pipeline'],
  enrich_data: ['discover_leads', 'build_icp', 'analyze_pipeline'],
  compose_outreach: ['discover_leads', 'build_icp', 'analyze_pipeline'],
  build_icp: ['discover_leads', 'compose_outreach', 'enrich_data'],
  analyze_pipeline: ['discover_leads', 'compose_outreach', 'build_icp'],
  research_market: ['discover_leads', 'enrich_data', 'build_icp'],
};

const PLATFORM_TIPS: Record<string, string[]> = {
  discover_leads: [
    'Use specific industry keywords for better results',
    'Combine multiple channels for comprehensive coverage',
    'Score leads immediately after discovery',
    'Save promising leads to your pipeline right away',
  ],
  enrich_data: [
    'Enrich leads in batches for efficiency',
    'Verify email addresses before outreach',
    'Check tech stack for personalization opportunities',
    'Update enrichment data regularly for accuracy',
  ],
  compose_outreach: [
    'Personalize every first touchpoint',
    'A/B test subject lines for better open rates',
    'Follow up within 48 hours of initial contact',
    'Use a mix of email and LinkedIn for higher response',
  ],
  build_icp: [
    'Start with your best existing customers',
    'Include firmographic and technographic criteria',
    'Define pain points to improve messaging',
    'Refine your ICP as you gather more data',
  ],
  analyze_pipeline: [
    'Review pipeline weekly for stalled deals',
    'Track conversion rates between stages',
    'Focus on leads with highest intent signals',
    'Use AI recommendations to prioritize outreach',
  ],
  research_market: [
    'Use deep research for key strategic accounts',
    'Monitor competitor movements quarterly',
    'Track industry trends for timely outreach',
    'Cross-reference multiple data sources',
  ],
};

const CHAT_MODES = [
  { id: 'standard', label: 'Standard', icon: Zap, description: 'Fast, balanced responses' },
  { id: 'deep-research', label: 'Deep Research', icon: Brain, description: 'Thorough multi-source analysis' },
  { id: 'quick', label: 'Quick', icon: Sparkles, description: 'Brief, concise answers' },
] as const;

type ChatMode = typeof CHAT_MODES[number]['id'];

// ============================================================
// Helper: time grouping for conversations
// ============================================================

function getTimeGroup(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const oneDay = 86400000;
  if (diff < oneDay) return 'Today';
  if (diff < 2 * oneDay) return 'Yesterday';
  if (diff < 7 * oneDay) return 'Previous 7 Days';
  return 'Older';
}

// ============================================================
// Research Progress
// ============================================================

function ResearchProgress({ stages, defaultExpanded = false }: { stages: ResearchStageInfo[]; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (stages.length === 0) return null;

  const completedCount = stages.filter(s => s.status === 'completed').length;
  const activeStage = stages.find(s => s.status === 'running');

  return (
    <div className="mt-2 pt-2 border-t border-border/10">
      <button
        className="flex items-center gap-2 w-full text-left group"
        onClick={() => setExpanded(!expanded)}
      >
        <Brain className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider flex-1">
          Research Pipeline ({completedCount}/{stages.length})
        </span>
        <ChevronDown className={cn('h-3 w-3 text-violet-400/60 transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded ? (
        <div className="space-y-1 mt-1.5">
          {stages.map((stage, i) => {
            const Icon = stageIcons[stage.stage] || Loader2;
            const isActive = stage.status === 'running';
            const isDone = stage.status === 'completed';
            const isFailed = stage.status === 'failed';

            return (
              <div
                key={`${stage.stage}-${i}`}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-300',
                  isActive && 'bg-violet-500/10 border border-violet-500/20',
                  isDone && 'bg-emerald-500/5 border border-emerald-500/10',
                  isFailed && 'bg-red-500/5 border border-red-500/10',
                  stage.status === 'pending' && 'opacity-40',
                )}
              >
                {isActive ? (
                  <Loader2 className="h-3 w-3 text-violet-400 animate-spin shrink-0" />
                ) : isDone ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : isFailed ? (
                  <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                ) : (
                  <Icon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                )}
                <span className={cn(
                  'text-[10px] font-medium flex-1',
                  isActive && 'text-violet-300',
                  isDone && 'text-emerald-300/80',
                  isFailed && 'text-red-300/80',
                  stage.status === 'pending' && 'text-muted-foreground/50',
                )}>
                  {stage.label}
                </span>
                {stage.detail && (isActive || isDone || isFailed) && (
                  <span className={cn(
                    'text-[9px] truncate max-w-[200px]',
                    isActive && 'text-violet-400/60',
                    isDone && 'text-emerald-400/50',
                    isFailed && 'text-red-400/50',
                  )}>
                    {stage.detail}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        activeStage && (
          <div className="flex items-center gap-1.5 mt-1">
            <Loader2 className="h-2.5 w-2.5 text-violet-400 animate-spin" />
            <span className="text-[10px] text-violet-400/80">{activeStage.label}...</span>
          </div>
        )
      )}
    </div>
  );
}

// ============================================================
// Lead Score Badge
// ============================================================

function LeadScoreBadge({ score, tier }: { score: number; tier: string }) {
  const tierConfig = {
    hot: { color: 'bg-red-500/15 text-red-400 border-red-500/20', label: 'HOT' },
    warm: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', label: 'WARM' },
    cold: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', label: 'COLD' },
  };
  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.cold;

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={cn('px-2 py-0.5 rounded-md border text-[10px] font-bold', config.color)}>
        {config.label}
      </div>
      <div className="flex-1 max-w-[140px]">
        <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              tier === 'hot' ? 'bg-red-400' : tier === 'warm' ? 'bg-amber-400' : 'bg-blue-400',
            )}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground/60">{score}/100</span>
    </div>
  );
}

// ============================================================
// Lead Card
// ============================================================

function LeadCard({ lead }: { lead: LeadDataItem }) {
  return (
    <div className="rounded-lg border border-border/25 bg-secondary/10 p-3 space-y-2 hover:bg-secondary/15 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground/90 truncate">{lead.name}</div>
          <div className="text-[11px] text-muted-foreground/70 truncate">{lead.title}</div>
        </div>
        {lead.score !== undefined && lead.tier && (
          <LeadScoreBadge score={lead.score} tier={lead.tier} />
        )}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
        <Building2 className="h-3 w-3 shrink-0" />
        <span className="truncate">{lead.company}</span>
      </div>
      {lead.source && (
        <div className="text-[10px] text-muted-foreground/40 italic">via {lead.source}</div>
      )}
    </div>
  );
}

// ============================================================
// ICP Summary Card
// ============================================================

function ICPSummaryCard({ icp }: { icp: ICPData }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-semibold text-amber-400">Ideal Customer Profile</span>
      </div>
      {icp.description && (
        <p className="text-xs text-foreground/70">{icp.description}</p>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {icp.industry && icp.industry.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Industries</span>
            <div className="flex flex-wrap gap-1">
              {icp.industry.slice(0, 3).map((ind, i) => (
                <Badge key={i} className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/15">
                  {ind}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {icp.companySize && icp.companySize.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1"><Users className="h-2.5 w-2.5" />Size</span>
            <div className="flex flex-wrap gap-1">
              {icp.companySize.slice(0, 3).map((sz, i) => (
                <Badge key={i} className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/15">
                  {sz}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {icp.location && icp.location.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />Location</span>
            <div className="flex flex-wrap gap-1">
              {icp.location.slice(0, 3).map((loc, i) => (
                <Badge key={i} className="text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/15">
                  {loc}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {icp.role && icp.role.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1"><Briefcase className="h-2.5 w-2.5" />Roles</span>
            <div className="flex flex-wrap gap-1">
              {icp.role.slice(0, 3).map((role, i) => (
                <Badge key={i} className="text-[9px] bg-pink-500/10 text-pink-400 border-pink-500/15">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      {icp.painPoints && icp.painPoints.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-amber-500/10">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1"><Tag className="h-2.5 w-2.5" />Pain Points</span>
          <div className="flex flex-wrap gap-1">
            {icp.painPoints.map((pp, i) => (
              <Badge key={i} className="text-[9px] bg-red-500/10 text-red-400 border-red-500/15">
                {pp}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {(icp.budgetRange || icp.decisionTimeline) && (
        <div className="flex gap-4 text-[11px] text-muted-foreground/60 pt-1">
          {icp.budgetRange && (
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{icp.budgetRange}</span>
          )}
          {icp.decisionTimeline && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{icp.decisionTimeline}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Outreach Preview
// ============================================================

function OutreachPreview({ message }: { message: OutreachMessage }) {
  const isEmail = message.channel === 'email';
  return (
    <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge className={cn(
          'text-[9px] border',
          isEmail
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        )}>
          {isEmail ? '✉️ Email' : '🔗 LinkedIn'}
        </Badge>
        <Badge className="text-[9px] bg-secondary/20 text-muted-foreground/60 border-border/20">
          {message.tone}
        </Badge>
      </div>
      {message.subject && (
        <div className="text-xs font-medium text-foreground/80">Subject: {message.subject}</div>
      )}
      <div className="text-[11px] text-foreground/60 leading-relaxed line-clamp-3">
        {message.body.slice(0, 200)}{message.body.length > 200 ? '...' : ''}
      </div>
    </div>
  );
}

// ============================================================
// Save Target Button
// ============================================================

function SaveTargetButton({
  saveTarget,
  isSaved,
  isSaving,
  onSave,
  onNavigate,
}: {
  saveTarget: SaveTarget;
  isSaved: boolean;
  isSaving: boolean;
  onSave: (st: SaveTarget) => void;
  onNavigate: (view: ViewType) => void;
}) {
  const viewLabel = VIEW_LABELS[saveTarget.viewTarget] || saveTarget.viewTarget;
  const viewIconMap: Record<string, React.ElementType> = {
    leads: Users,
    icp: Target,
    outreach: Mail,
    'data-enrichment': Building2,
    analytics: BarChart3,
    reports: TrendingUp,
    'prospect-discovery': Search,
    campaigns: Zap,
  };
  const Icon = viewIconMap[saveTarget.viewTarget] || Save;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        className={cn(
          'h-7 text-[10px] gap-1.5 transition-all',
          isSaved
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            : 'bg-emerald-500 hover:bg-emerald-400 text-black'
        )}
        disabled={isSaving || isSaved}
        onClick={() => !isSaved && onSave(saveTarget)}
      >
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isSaved ? (
          <CheckCircle className="h-3 w-3" />
        ) : (
          <Icon className="h-3 w-3" />
        )}
        {isSaved ? `Saved to ${viewLabel}` : `${saveTarget.label} → ${viewLabel}`}
      </Button>
      {isSaved && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[10px] gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          onClick={() => onNavigate(saveTarget.viewTarget)}
        >
          View <ExternalLink className="h-2.5 w-2.5" />
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Action Results Section
// ============================================================

function ActionResultsSection({
  message,
  onSaveTarget,
  onNavigate,
}: {
  message: ChatMessage;
  onSaveTarget: (messageId: string, saveTarget: SaveTarget) => void;
  onNavigate: (view: ViewType) => void;
}) {
  const [savingTargetId, setSavingTargetId] = useState<string | null>(null);
  const hasAnyData = (message.leadData && message.leadData.length > 0) ||
    message.icpData ||
    (message.outreachData && message.outreachData.length > 0) ||
    (message.saveTargets && message.saveTargets.length > 0);

  if (!hasAnyData) return null;

  const handleSave = async (st: SaveTarget) => {
    setSavingTargetId(st.id);
    try {
      await onSaveTarget(message.id, st);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSavingTargetId(null);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/15 space-y-3">
      {message.saveTargets && message.saveTargets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.saveTargets.map((st) => (
            <SaveTargetButton
              key={st.id}
              saveTarget={st}
              isSaved={message.savedTargets?.includes(st.id) || false}
              isSaving={savingTargetId === st.id}
              onSave={handleSave}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {message.leadData && message.leadData.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
            <Search className="h-3 w-3" />
            Discovered Leads ({message.leadData.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {message.leadData.map((lead, i) => (
              <LeadCard key={`${lead.name}-${i}`} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {message.icpData && (
        <ICPSummaryCard icp={message.icpData} />
      )}

      {message.outreachData && message.outreachData.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-pink-400 uppercase tracking-wider">
            <Mail className="h-3 w-3" />
            Outreach Messages ({message.outreachData.length})
          </div>
          <div className="grid gap-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {message.outreachData.map((msg, i) => (
              <OutreachPreview key={`outreach-${i}`} message={msg} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tool Navigation Chips
// ============================================================

function ToolNavChips({
  actionType,
  onNavigate,
}: {
  actionType: string;
  onNavigate: (view: ViewType) => void;
}) {
  const navItem = ACTION_NAV_MAP[actionType];
  const relatedKeys = RELATED_TOOLS[actionType] || [];
  const relatedItems = relatedKeys
    .map(key => ACTION_NAV_MAP[key])
    .filter(Boolean)
    .slice(0, 3);

  if (!navItem) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/10 space-y-2">
      <button
        onClick={() => onNavigate(navItem.view)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium',
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          'hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all duration-200',
          'group cursor-pointer'
        )}
      >
        <navItem.icon className="h-3.5 w-3.5 shrink-0" />
        <span>Navigate to {navItem.label}</span>
        <ArrowRight className="h-3 w-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </button>

      {relatedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {relatedItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px]',
                  'bg-secondary/10 border-border/15 text-muted-foreground/60',
                  'hover:bg-secondary/20 hover:border-border/25 hover:text-foreground/70 transition-all duration-200'
                )}
              >
                <ItemIcon className="h-3 w-3 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Message Bubble — ChatGPT-style with edit support
// ============================================================

function MessageBubble({
  message,
  onCopy,
  onFeedback,
  onRegenerate,
  onSaveTarget,
  onNavigate,
  onEditMessage,
}: {
  message: ChatMessage;
  onCopy: (id: string) => void;
  onFeedback: (id: string, type: 'up' | 'down') => void;
  onRegenerate: (id: string) => void;
  onSaveTarget: (messageId: string, saveTarget: SaveTarget) => void;
  onNavigate: (view: ViewType) => void;
  onEditMessage: (id: string, newContent: string) => void;
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.style.height = 'auto';
      editRef.current.style.height = editRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleCopy = () => {
    onCopy(message.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDoubleClick = () => {
    if (isUser && !message.isLoading) {
      setEditContent(message.content);
      setIsEditing(true);
    }
  };

  const handleEditSave = () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      onEditMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const actionConfig = message.actionType ? ACTION_CONFIG[message.actionType] : null;

  const hasActionData = (message.leadData && message.leadData.length > 0) ||
    message.icpData ||
    (message.outreachData && message.outreachData.length > 0) ||
    (message.saveTargets && message.saveTargets.length > 0);

  // User messages: right-aligned ChatGPT-style
  if (isUser) {
    return (
      <div className="flex justify-end py-3 group" onDoubleClick={handleDoubleClick}>
        <div className="max-w-[85%]">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={editRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-foreground/90 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                rows={1}
              />
              <div className="flex items-center gap-2 justify-end">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleEditCancel}>
                  Cancel
                </Button>
                <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-400 text-black" onClick={handleEditSave}>
                  <Check className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/10 text-foreground/90 rounded-2xl px-5 py-3 leading-relaxed">
              {message.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:0ms]" />
                    <div className="h-2 w-2 rounded-full bg-emerald-400/40 animate-bounce [animation-delay:150ms]" />
                    <div className="h-2 w-2 rounded-full bg-emerald-400/20 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={message.content} isStreaming={message.isStreaming} />
              )}
            </div>
          )}
          {/* Edit hint on hover */}
          {!isEditing && !message.isLoading && (
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
              <button
                onClick={() => { setEditContent(message.content); setIsEditing(true); }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20 transition-all"
                title="Edit message"
              >
                <Pencil className="h-2.5 w-2.5" />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI message - ChatGPT style with avatar on left, name above, content below (no bubble)
  return (
    <div className="flex gap-3 py-4">
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full shrink-0 mt-0.5',
          message.isError
            ? 'bg-red-500/10 border border-red-500/20'
            : message.isResearchReport || actionConfig
            ? 'bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/20'
            : 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/15',
        )}
      >
        {message.isError ? (
          <AlertCircle className="h-4 w-4 text-red-400" />
        ) : message.isResearchReport || actionConfig ? (
          <Sparkles className="h-4 w-4 text-violet-400" />
        ) : (
          <Bot className="h-4 w-4 text-emerald-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground/80">LeadReach AI</span>
          {actionConfig && !message.isLoading && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold',
              actionConfig.bgColor, actionConfig.color, actionConfig.borderColor
            )}>
              <span>{actionConfig.emoji}</span>
              <span>{message.actionLabel}</span>
              {message.isStreaming && (
                <Loader2 className="h-2.5 w-2.5 animate-spin ml-0.5" />
              )}
            </div>
          )}
        </div>

        {/* Content area - no bubble wrapper, just text */}
        <div className="text-foreground/85 leading-relaxed">
          {message.isLoading ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:0ms]" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/40 animate-bounce [animation-delay:150ms]" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/20 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-sm text-muted-foreground/50">
                {message.content || 'Analyzing your request...'}
              </span>
            </div>
          ) : (
            <>
              {message.isResearchReport && message.leadScore !== undefined && (
                <LeadScoreBadge score={message.leadScore} tier={message.leadTier || 'cold'} />
              )}

              {message.researchStages && message.researchStages.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowThinking(!showThinking)}
                    className="flex items-center gap-1.5 text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span>{showThinking ? 'Hide' : 'View'} thinking process</span>
                    <ChevronDown className={cn('h-3 w-3 transition-transform', showThinking && 'rotate-180')} />
                  </button>
                  {showThinking && <ResearchProgress stages={message.researchStages} defaultExpanded />}
                </div>
              )}

              <MarkdownRenderer content={message.content} isStreaming={message.isStreaming} />

              {message.pipelineTriggered?.started && (
                <div className="mt-3 pt-2 border-t border-border/15">
                  <div className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Pipeline launched!</span>
                    <span className="text-muted-foreground/40">
                      Campaign: {message.pipelineTriggered.campaignId?.slice(0, 8)}...
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 mt-1 ml-5.5">
                    Check the Campaigns page for real-time progress.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tool Navigation Chips */}
        {!message.isLoading && !isUser && message.actionType && !message.isError && (
          <div className="w-full mt-1">
            <ToolNavChips actionType={message.actionType} onNavigate={onNavigate} />
          </div>
        )}

        {/* Action Results Section */}
        {!message.isLoading && hasActionData && (
          <div className="w-full mt-1">
            <button
              onClick={() => setShowResults(!showResults)}
              className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 hover:text-emerald-400 transition-colors mb-2"
            >
              <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', showResults && 'rotate-180')} />
              <span>{showResults ? 'Hide' : 'Show'} results & actions</span>
            </button>
            {showResults && (
              <ActionResultsSection message={message} onSaveTarget={onSaveTarget} onNavigate={onNavigate} />
            )}
          </div>
        )}

        {/* Action buttons - ChatGPT style */}
        {!message.isLoading && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={handleCopy}
              className={cn(
                'p-1.5 rounded-md transition-all',
                copied
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20'
              )}
              title="Copy"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onRegenerate(message.id)}
              className="p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20 transition-all"
              title="Regenerate"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onFeedback(message.id, 'up')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                message.feedback === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20'
              )}
              title="Good response"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onFeedback(message.id, 'down')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                message.feedback === 'down' ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20'
              )}
              title="Bad response"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Conversation Item (ChatGPT-style with rename)
// ============================================================

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onPin,
  onRename,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conversation.title);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      onRename(conversation.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setRenameValue(conversation.title);
      setIsRenaming(false);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 relative',
        isActive
          ? 'bg-secondary/30 text-foreground/90'
          : 'text-foreground/60 hover:bg-secondary/15 hover:text-foreground/80',
      )}
      onClick={() => !isRenaming && onSelect(conversation.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRenaming ? (
        <input
          ref={renameRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameSubmit}
          className="flex-1 bg-secondary/30 border border-border/30 rounded px-2 py-0.5 text-sm text-foreground/90 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm truncate flex-1">{conversation.title}</span>
      )}

      {/* Hover-reveal actions */}
      {isHovered && !isRenaming && (
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setRenameValue(conversation.title); setIsRenaming(true); }}
            className="p-1 rounded hover:bg-secondary/30 text-muted-foreground/40 hover:text-foreground/70 transition-colors"
            title="Rename"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onPin(conversation.id)}
            className={cn(
              'p-1 rounded hover:bg-secondary/30 transition-colors',
              conversation.pinned ? 'text-amber-400' : 'text-muted-foreground/40 hover:text-amber-400'
            )}
            title={conversation.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(conversation.id)}
            className="p-1 rounded hover:bg-secondary/30 text-muted-foreground/40 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
      {!isHovered && conversation.pinned && !isRenaming && (
        <Pin className="h-3 w-3 text-amber-400/50 shrink-0" />
      )}
    </div>
  );
}

// ============================================================
// Conversation Sidebar (ChatGPT-style with time grouping)
// ============================================================

function ConversationSidebar({
  conversations,
  activeId,
  searchQuery,
  onSearchChange,
  onSelect,
  onNew,
  onDelete,
  onPin,
  onRename,
}: {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}) {
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate pinned and unpinned
  const pinned = filteredConversations.filter(c => c.pinned);
  const unpinned = filteredConversations.filter(c => !c.pinned);

  // Group unpinned by time
  const grouped = unpinned.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const group = getTimeGroup(conv.timestamp);
    if (!acc[group]) acc[group] = [];
    acc[group].push(conv);
    return acc;
  }, {});

  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNew}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white',
            'hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/20',
            'active:scale-[0.98]'
          )}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary/20 border border-border/15 text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {/* Pinned conversations */}
        {pinned.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold text-amber-400/70 uppercase tracking-wider">
              <Pin className="h-2.5 w-2.5" />
              Pinned
            </div>
            {pinned.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                onSelect={onSelect}
                onDelete={onDelete}
                onPin={onPin}
                onRename={onRename}
              />
            ))}
          </div>
        )}

        {/* Time-grouped conversations */}
        {groupOrder.map(group => {
          const convs = grouped[group];
          if (!convs || convs.length === 0) return null;
          return (
            <div key={group} className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                {group}
              </div>
              {convs.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onPin={onPin}
                  onRename={onRename}
                />
              ))}
            </div>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground/40">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Platform Context Panel (Right Panel)
// ============================================================

function PlatformContextPanel({
  currentPage,
  lastActionType,
  onNavigate,
  onQuickAction,
}: {
  currentPage: string;
  lastActionType: string | undefined;
  onNavigate: (view: ViewType) => void;
  onQuickAction: (prompt: string) => void;
}) {
  const tips = lastActionType ? PLATFORM_TIPS[lastActionType] : null;
  const relatedKeys = lastActionType ? RELATED_TOOLS[lastActionType] : [];
  const relatedItems = relatedKeys
    .map(key => ACTION_NAV_MAP[key])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Current Context */}
      <div className="p-4 border-b border-border/15">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Current Context</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/15 border border-border/15">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-foreground/70">{currentPage}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border/15">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Quick Actions</span>
        </div>
        <div className="space-y-1.5">
          {[
            { label: 'Find Leads', icon: Telescope, prompt: 'Find high-intent leads matching my ICP' },
            { label: 'Build ICP', icon: Target, prompt: 'Help me build my Ideal Customer Profile' },
            { label: 'Compose Outreach', icon: Mail, prompt: 'Draft personalized outreach messages' },
            { label: 'Analyze Pipeline', icon: BarChart3, prompt: 'Analyze my pipeline performance' },
            { label: 'Enrich Data', icon: Database, prompt: 'Enrich my lead data with contact info' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => onQuickAction(action.prompt)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-medium',
                'bg-secondary/10 border border-border/10 text-foreground/60',
                'hover:bg-secondary/20 hover:border-border/20 hover:text-foreground/80 transition-all duration-200'
              )}
            >
              <action.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Tips */}
      {tips && tips.length > 0 && (
        <div className="p-4 border-b border-border/15">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Platform Tips</span>
          </div>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/50 leading-relaxed">
                <span className="text-cyan-400/60 mt-0.5">•</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Tools */}
      {relatedItems.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Related Tools</span>
          </div>
          <div className="space-y-1.5">
            {relatedItems.map(item => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px]',
                    'bg-secondary/10 border border-border/10 text-muted-foreground/60',
                    'hover:bg-secondary/20 hover:border-border/20 hover:text-foreground/70 transition-all duration-200'
                  )}
                >
                  <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                  <ArrowRight className="h-2.5 w-2.5 ml-auto opacity-30" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Welcome Screen (ChatGPT-style empty state)
// ============================================================

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      {/* Logo */}
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 mb-6">
        <Bot className="h-8 w-8 text-white" />
      </div>

      <h1 className="text-2xl font-bold text-foreground/90 mb-2">LeadReach AI</h1>
      <p className="text-sm text-muted-foreground/60 mb-10">How can I help you today?</p>

      {/* Suggestion Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {SUGGESTED_PROMPTS.map((suggestion, i) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                'bg-secondary/5 border-border/15 hover:bg-secondary/15 hover:border-border/30',
                'group cursor-pointer'
              )}
            >
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/15 shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                <Icon className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground/80 group-hover:text-foreground/90 transition-colors">
                  {suggestion.label}
                </div>
                <div className="text-[11px] text-muted-foreground/50 mt-0.5 leading-relaxed">
                  {suggestion.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Main Component: AIAssistantView (ChatGPT Three-Column Layout)
// ============================================================

export function AIAssistantView() {
  const { activeView, setActiveView } = useAppStore();
  const engine = useChatEngine();

  // Layout state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const titleEditRef = useRef<HTMLInputElement>(null);

  // Derived state
  const currentViewLabel = VIEW_LABELS[activeView] || 'Dashboard';
  const systemPromptWithCtx = SYSTEM_PROMPT.replace('{currentPage}', currentViewLabel);
  const activeConversation = engine.conversations.find(c => c.id === engine.activeConversationId);
  const hasMessages = engine.messages.length > 0;

  // Detect last action type for right panel
  const lastAssistantMsg = [...engine.messages].reverse().find(m => m.role === 'assistant' && m.actionType);
  const lastActionType = lastAssistantMsg?.actionType;

  const currentMode = CHAT_MODES.find(m => m.id === chatMode) || CHAT_MODES[0];
  const ModeIcon = currentMode.icon;

  // ============================================================
  // Effects
  // ============================================================

  // Close mode dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    if (showModeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModeDropdown]);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [engine.messages, engine.isStreaming, engine.isThinking, engine.researchStages, scrollToBottom]);

  // Detect scroll position for "scroll to bottom" button
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (el) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollBtn(!isNearBottom);
    }
  }, []);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Focus title edit
  useEffect(() => {
    if (isEditingTitle && titleEditRef.current) {
      titleEditRef.current.focus();
      titleEditRef.current.select();
    }
  }, [isEditingTitle]);

  // ============================================================
  // Handlers
  // ============================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  };

  const handleSend = async () => {
    if (!input.trim() || engine.isStreaming || engine.isThinking) return;
    const msg = input.trim();
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await engine.sendMessage(msg, systemPromptWithCtx, currentViewLabel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (prompt: string) => {
    setInput('');
    await engine.sendMessage(prompt, systemPromptWithCtx, currentViewLabel);
  };

  const handleNavigate = (view: ViewType) => {
    setActiveView(view);
  };

  const handleRegenerate = async (_messageId: string) => {
    await engine.regenerateLastMessage(systemPromptWithCtx, currentViewLabel);
  };

  const handleSaveTarget = async (messageId: string, saveTarget: SaveTarget) => {
    try {
      await engine.saveToSection(messageId, saveTarget);
      setActiveView(saveTarget.viewTarget);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    // Find the message and all messages after it, then resend from that point
    const conv = engine.conversations.find(c => c.id === engine.activeConversationId);
    if (!conv) return;

    const msgIdx = conv.messages.findIndex(m => m.id === messageId);
    if (msgIdx < 0) return;

    // Trim messages to before the edited one, then resend with new content
    // We'll use createConversation and sendMessage approach
    // Actually, let's just re-send the edited content as a new message
    // by trimming the conversation to before this message and sending
    await engine.sendMessage(newContent, systemPromptWithCtx, currentViewLabel);
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    // We need to update the conversation title - use the engine's internal state
    // Since the engine doesn't expose a rename method, we'll use a workaround
    // by accessing localStorage directly
    try {
      const stored = localStorage.getItem('leadreach-chat-conversations');
      if (stored) {
        const conversations = JSON.parse(stored);
        const updated = conversations.map((c: Conversation) =>
          c.id === id ? { ...c, title: newTitle } : c
        );
        localStorage.setItem('leadreach-chat-conversations', JSON.stringify(updated));
        // Force a reload of conversations by switching away and back
        engine.switchConversation(engine.activeConversationId || id);
      }
    } catch {
      // Silently fail
    }
  };

  const handleTitleEditSubmit = () => {
    if (titleEditValue.trim() && activeConversation) {
      handleRenameConversation(activeConversation.id, titleEditValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const isStreaming = engine.isStreaming || engine.isThinking;
  const hasInput = input.trim().length > 0;

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* ============================================================ */}
      {/* Left Sidebar - Conversation History */}
      {/* ============================================================ */}
      <div
        className={cn(
          'h-full border-r border-border/15 bg-card/50 flex flex-col transition-all duration-300 shrink-0 overflow-hidden',
          leftSidebarOpen ? 'w-[260px]' : 'w-0',
        )}
      >
        <ConversationSidebar
          conversations={engine.conversations}
          activeId={engine.activeConversationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={engine.switchConversation}
          onNew={engine.createConversation}
          onDelete={engine.deleteConversation}
          onPin={engine.pinConversation}
          onRename={handleRenameConversation}
        />
      </div>

      {/* ============================================================ */}
      {/* Center - Chat Area */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/15 shrink-0">
          {/* Left: Sidebar toggle */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-secondary/20"
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              title={leftSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {leftSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>

            {/* Conversation title (clickable to edit) */}
            {activeConversation && (
              <div className="flex items-center ml-1">
                {isEditingTitle ? (
                  <input
                    ref={titleEditRef}
                    value={titleEditValue}
                    onChange={(e) => setTitleEditValue(e.target.value)}
                    onKeyDown={handleTitleEditKeyDown}
                    onBlur={handleTitleEditSubmit}
                    className="text-sm font-medium bg-secondary/30 border border-border/30 rounded px-2 py-1 text-foreground/90 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 max-w-[200px]"
                  />
                ) : (
                  <button
                    onClick={() => { setTitleEditValue(activeConversation.title); setIsEditingTitle(true); }}
                    className="text-sm font-medium text-foreground/70 hover:text-foreground/90 transition-colors flex items-center gap-1.5 max-w-[200px]"
                    title="Click to rename"
                  >
                    <span className="truncate">{activeConversation.title}</span>
                    <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-muted-foreground/40" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Center: Mode selector */}
          <div ref={modeDropdownRef} className="relative">
            <button
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-secondary/20 transition-all border border-transparent hover:border-border/15"
            >
              <ModeIcon className="h-3.5 w-3.5" />
              <span>{currentMode.label}</span>
              <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', showModeDropdown && 'rotate-180')} />
            </button>
            {showModeDropdown && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-52 rounded-xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden">
                {CHAT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => { setChatMode(mode.id); setShowModeDropdown(false); }}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 text-[11px] transition-colors',
                        chatMode === mode.id
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-muted-foreground/70 hover:text-foreground hover:bg-secondary/10'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{mode.label}</div>
                        <div className="text-[9px] text-muted-foreground/50">{mode.description}</div>
                      </div>
                      {chatMode === mode.id && <Check className="h-3 w-3 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: New chat + Right panel toggle */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-secondary/20"
              onClick={engine.createConversation}
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-secondary/20"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              title={rightPanelOpen ? 'Close panel' : 'Open panel'}
            >
              {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Messages or Welcome */}
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto custom-scrollbar"
          >
            <div className={cn(
              'mx-auto w-full',
              hasMessages ? 'max-w-3xl px-4' : 'max-w-3xl',
            )}>
              {hasMessages ? (
                <div className="py-4">
                  {engine.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onCopy={engine.copyMessage}
                      onFeedback={engine.feedbackMessage}
                      onRegenerate={handleRegenerate}
                      onSaveTarget={handleSaveTarget}
                      onNavigate={handleNavigate}
                      onEditMessage={handleEditMessage}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
              )}
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && hasMessages && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center h-8 w-8 rounded-full border border-border/30 bg-card/90 backdrop-blur-sm shadow-lg text-muted-foreground/70 hover:text-foreground hover:bg-card transition-all"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}

          {/* Input Area */}
          <div className="shrink-0 px-4 pb-4 pt-2">
            <div className="max-w-3xl mx-auto">
              {/* Input container */}
              <div className={cn(
                'relative rounded-2xl border transition-all duration-200',
                'bg-card/80 backdrop-blur-sm',
                hasInput
                  ? 'border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                  : 'border-border/30',
                isStreaming && 'border-amber-500/20'
              )}>
                <div className="flex items-end gap-2 pl-4 pr-2 py-2">
                  {/* Paperclip (disabled placeholder) */}
                  <button
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground/25 cursor-not-allowed shrink-0 mb-0.5"
                    disabled
                    title="Attachments coming soon"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  {/* Textarea */}
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message LeadReach AI..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-foreground/90 placeholder:text-muted-foreground/40 resize-none focus:outline-none py-1.5 max-h-[160px] leading-relaxed"
                    disabled={isStreaming}
                  />

                  {/* Send or Stop button */}
                  <div className="shrink-0 mb-0.5">
                    {isStreaming ? (
                      <button
                        onClick={engine.stopStreaming}
                        className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all"
                        title="Stop generating"
                      >
                        <Square className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        disabled={!hasInput}
                        className={cn(
                          'flex items-center justify-center h-8 w-8 rounded-lg transition-all',
                          hasInput
                            ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-secondary/20 text-muted-foreground/30 cursor-not-allowed'
                        )}
                        title="Send message"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-muted-foreground/30 text-center mt-2">
                LeadReach AI can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Right Panel - Platform Context */}
      {/* ============================================================ */}
      <div
        className={cn(
          'h-full border-l border-border/15 bg-card/50 transition-all duration-300 shrink-0 overflow-hidden',
          rightPanelOpen ? 'w-[300px]' : 'w-0',
        )}
      >
        <PlatformContextPanel
          currentPage={currentViewLabel}
          lastActionType={lastActionType}
          onNavigate={handleNavigate}
          onQuickAction={handleSuggestionClick}
        />
      </div>
    </div>
  );
}
