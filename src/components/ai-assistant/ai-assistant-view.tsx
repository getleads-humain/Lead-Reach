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

// Related tools for each action type — used in the right panel
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
      {/* Save Buttons */}
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

      {/* Lead Cards */}
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

      {/* ICP Card */}
      {message.icpData && (
        <ICPSummaryCard icp={message.icpData} />
      )}

      {/* Outreach Previews */}
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
// Tool Navigation Chips (inside message bubbles)
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
      {/* Primary navigation chip */}
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

      {/* Related tools chips */}
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
// Message Bubble
// ============================================================

function MessageBubble({
  message,
  onCopy,
  onFeedback,
  onRegenerate,
  onSaveTarget,
  onNavigate,
}: {
  message: ChatMessage;
  onCopy: (id: string) => void;
  onFeedback: (id: string, type: 'up' | 'down') => void;
  onRegenerate: (id: string) => void;
  onSaveTarget: (messageId: string, saveTarget: SaveTarget) => void;
  onNavigate: (view: ViewType) => void;
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showResults, setShowResults] = useState(true);

  const handleCopy = () => {
    onCopy(message.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actionConfig = message.actionType ? ACTION_CONFIG[message.actionType] : null;

  const hasActionData = (message.leadData && message.leadData.length > 0) ||
    message.icpData ||
    (message.outreachData && message.outreachData.length > 0) ||
    (message.saveTargets && message.saveTargets.length > 0);

  // ChatGPT-style layout: AI messages have icon on left with name above content, user messages are right-aligned pills
  if (isUser) {
    return (
      <div className="flex justify-end py-3">
        <div className="max-w-[85%] bg-emerald-500/15 text-foreground/90 rounded-3xl px-5 py-3 leading-relaxed">
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
      </div>
    );
  }

  // AI message - ChatGPT style with avatar on left, name above, content below
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

        {/* Content area */}
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

              {/* Thinking toggle */}
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

              {/* Pipeline triggered */}
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

        {/* Action buttons - always visible like modern ChatGPT */}
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
// Conversation Item (ChatGPT-style)
// ============================================================

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onPin,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 relative',
        isActive
          ? 'bg-secondary/30 text-foreground/90'
          : 'text-foreground/60 hover:bg-secondary/15 hover:text-foreground/80',
      )}
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-sm truncate flex-1">{conversation.title}</span>

      {/* Hover-reveal actions */}
      {isHovered && (
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
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
      {!isHovered && conversation.pinned && (
        <Pin className="h-3 w-3 text-amber-400/50 shrink-0" />
      )}
    </div>
  );
}

// ============================================================
// Conversation Sidebar (ChatGPT-style)
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
}: {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}) {
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by time period
  const now = Date.now();
  const oneDay = 86400000;
  const sevenDays = 7 * oneDay;
  const thirtyDays = 30 * oneDay;

  const pinnedConvs = filteredConversations.filter(c => c.pinned);
  const unpinnedConvs = filteredConversations.filter(c => !c.pinned);

  const todayConvs = unpinnedConvs.filter(c => now - c.timestamp < oneDay);
  const yesterdayConvs = unpinnedConvs.filter(c => now - c.timestamp >= oneDay && now - c.timestamp < 2 * oneDay);
  const previous7Convs = unpinnedConvs.filter(c => now - c.timestamp >= 2 * oneDay && now - c.timestamp < sevenDays);
  const previous30Convs = unpinnedConvs.filter(c => now - c.timestamp >= sevenDays && now - c.timestamp < thirtyDays);
  const olderConvs = unpinnedConvs.filter(c => now - c.timestamp >= thirtyDays);

  const renderSection = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="px-3 py-1.5">
          <span className="text-[11px] font-medium text-muted-foreground/40">{label}</span>
        </div>
        {items.map(conv => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeId}
            onSelect={onSelect}
            onDelete={onDelete}
            onPin={onPin}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card/80">
      {/* New Chat Button */}
      <div className="p-2">
        <button
          onClick={onNew}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-border/20 hover:bg-secondary/20 transition-all text-foreground/70 hover:text-foreground/90 text-sm"
        >
          <Plus className="h-5 w-5" />
          <span>New chat</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-2 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="h-8 text-xs pl-9 bg-secondary/5 border-border/15 focus:border-emerald-500/20 rounded-lg"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
        {pinnedConvs.length > 0 && renderSection('Pinned', pinnedConvs)}
        {renderSection('Today', todayConvs)}
        {renderSection('Yesterday', yesterdayConvs)}
        {renderSection('Previous 7 Days', previous7Convs)}
        {renderSection('Previous 30 Days', previous30Convs)}
        {renderSection('Older', olderConvs)}

        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/25">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-xs">No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Tool Navigation Panel (expandable overlay panel)
// ============================================================

function ToolNavigationPanel({
  currentActionType,
  onNavigate,
  onClose,
}: {
  currentActionType: string | undefined;
  onNavigate: (view: ViewType) => void;
  onClose: () => void;
}) {
  // Determine related tools based on current action
  const relatedTools = useMemo(() => {
    if (!currentActionType) return [];
    const keys = RELATED_TOOLS[currentActionType] || [];
    return keys.map(key => ACTION_NAV_MAP[key]).filter(Boolean);
  }, [currentActionType]);

  // Get contextual tips
  const tips = useMemo(() => {
    if (!currentActionType) return [
      'Use specific prompts for better results',
      'Try Deep Research for comprehensive analysis',
      'Save results to relevant sections for easy access',
      'Navigate to tools to take action on AI insights',
    ];
    return PLATFORM_TIPS[currentActionType] || PLATFORM_TIPS.general_chat || [];
  }, [currentActionType]);

  // Primary nav item for current action
  const primaryNav = currentActionType ? ACTION_NAV_MAP[currentActionType] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/15">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-foreground/80">Tool Navigation</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground/70 hover:bg-secondary/20 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Quick Navigate — Primary */}
        {primaryNav && (
          <div className="p-4 border-b border-border/10">
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Active Tool</span>
              <button
                onClick={() => { onNavigate(primaryNav.view); onClose(); }}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border text-left transition-all duration-200',
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                  'hover:bg-emerald-500/15 hover:border-emerald-500/30',
                )}
              >
                <primaryNav.icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium">{primaryNav.label}</div>
                  <div className="text-[9px] text-emerald-400/60 truncate">{primaryNav.description}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
              </button>
            </div>
          </div>
        )}

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="p-4 border-b border-border/10">
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Related Tools</span>
            <div className="space-y-1.5 mt-2">
              {relatedTools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    key={tool.view}
                    onClick={() => { onNavigate(tool.view); onClose(); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-left transition-all duration-200 bg-secondary/5 border-border/10 text-foreground/70 hover:bg-secondary/10 hover:border-border/20 hover:text-foreground/90"
                  >
                    <ToolIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium">{tool.label}</div>
                      <div className="text-[9px] text-muted-foreground/40 truncate">{tool.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* All Platform Tools */}
        <div className="p-4 border-b border-border/10">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">All Tools</span>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {Object.entries(ACTION_NAV_MAP).map(([key, tool]) => {
              const ToolIcon = tool.icon;
              const isActive = key === currentActionType;
              const isRelated = relatedTools.some(r => r.view === tool.view);
              return (
                <button
                  key={key}
                  onClick={() => { onNavigate(tool.view); onClose(); }}
                  className={cn(
                    'flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all duration-200',
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : isRelated
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/70'
                      : 'bg-secondary/5 border-border/10 text-muted-foreground/50',
                    !isActive && 'hover:bg-secondary/10 hover:text-foreground/70',
                  )}
                >
                  <ToolIcon className="h-4 w-4 shrink-0" />
                  <span className="text-[9px] font-medium leading-tight">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Tips */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Tips</span>
          </div>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[11px] text-muted-foreground/50 leading-relaxed"
              >
                <div className="h-1 w-1 rounded-full bg-emerald-400/40 mt-1.5 shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Model Selector Dropdown
// ============================================================

function ModelSelector({
  selectedModel,
  onSelect,
}: {
  selectedModel: string;
  onSelect: (model: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const models = [
    { id: 'standard', label: 'Standard', description: 'Fast, balanced responses', icon: Zap },
    { id: 'deep-research', label: 'Deep Research', description: 'Thorough multi-stage analysis', icon: FlaskConical },
    { id: 'quick', label: 'Quick', description: 'Concise, to-the-point answers', icon: BoltIcon },
  ];

  const current = models.find(m => m.id === selectedModel) || models[0];
  const CurrentIcon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-secondary/15 transition-colors text-foreground/70 hover:text-foreground/90"
      >
        <CurrentIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{current.label}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 w-56 rounded-xl border border-border/20 bg-card/95 backdrop-blur-md shadow-xl z-50 overflow-hidden">
          {models.map(model => {
            const ModelIcon = model.icon;
            return (
              <button
                key={model.id}
                onClick={() => { onSelect(model.id); setOpen(false); }}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors',
                  model.id === selectedModel ? 'bg-emerald-500/10 text-emerald-400' : 'text-foreground/70 hover:bg-secondary/10'
                )}
              >
                <ModelIcon className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">{model.label}</div>
                  <div className="text-[10px] text-muted-foreground/50">{model.description}</div>
                </div>
                {model.id === selectedModel && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Bolt icon component for Quick model
function BoltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}

// ============================================================
// Main View (ChatGPT-style)
// ============================================================

export function AIAssistantView() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [selectedModel, setSelectedModel] = useState('standard');
  const [inputValue, setInputValue] = useState('');

  const { activeView, setActiveView } = useAppStore();
  const engine = useChatEngine();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Derive deep research from model selector
  const deepResearchEnabled = selectedModel === 'deep-research';

  // Determine the current action type from the last assistant message
  const currentActionType = useMemo(() => {
    const lastAssistantMsg = [...engine.messages].reverse().find(m => m.role === 'assistant' && m.actionType);
    return lastAssistantMsg?.actionType;
  }, [engine.messages]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [engine.messages, engine.isStreaming, engine.isThinking, engine.researchStages, scrollToBottom]);

  // Detect scroll position
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (el) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setShowScrollBtn(!isNearBottom);
    }
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  // Build system prompt with context
  const systemPromptWithCtx = useMemo(() => {
    const currentViewLabel = VIEW_LABELS[activeView] || 'Dashboard';
    let prompt = SYSTEM_PROMPT.replace('{currentPage}', currentViewLabel);
    if (deepResearchEnabled) {
      prompt += '\n\nDEEP RESEARCH MODE: The user has enabled deep research. Perform comprehensive multi-stage research with detailed analysis, exhaustive data gathering, and thorough synthesis. Take your time and be thorough.';
    }
    if (selectedModel === 'quick') {
      prompt += '\n\nQUICK MODE: The user prefers concise, direct responses. Keep answers brief and to-the-point. Use bullet points and avoid lengthy explanations.';
    }
    return prompt;
  }, [activeView, deepResearchEnabled, selectedModel]);

  const handleSend = async () => {
    if (!inputValue.trim() || engine.isStreaming || engine.isThinking) return;
    let msg = inputValue.trim();
    if (deepResearchEnabled) {
      msg += ' Use deep research mode.';
    }
    setInputValue('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await engine.sendMessage(msg, systemPromptWithCtx, VIEW_LABELS[activeView] || 'Dashboard');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRegenerate = async (_messageId: string) => {
    await engine.regenerateLastMessage(systemPromptWithCtx, VIEW_LABELS[activeView] || 'Dashboard');
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveTarget = async (messageId: string, saveTarget: SaveTarget) => {
    try {
      await engine.saveToSection(messageId, saveTarget);
      setActiveView(saveTarget.viewTarget);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleNavigate = (view: ViewType) => {
    setActiveView(view);
  };

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6 lg:-m-8 relative bg-background">
      {/* Sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar — Conversations (ChatGPT-style slide-in) */}
      <div
        className={cn(
          'fixed lg:relative z-50 lg:z-auto h-full transition-all duration-300 ease-in-out',
          'w-[280px] border-r border-border/15',
          sidebarOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:opacity-0',
        )}
      >
        <ConversationSidebar
          conversations={engine.conversations}
          activeId={engine.activeConversationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={(id) => { engine.switchConversation(id); setSidebarOpen(false); }}
          onNew={() => { engine.createConversation(); setSidebarOpen(false); }}
          onDelete={engine.deleteConversation}
          onPin={engine.pinConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header (ChatGPT-style minimal) */}
        <div className="flex items-center justify-between px-3 py-2.5 shrink-0 border-b border-border/10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground/60 hover:text-foreground/80 hover:bg-secondary/15"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
            <ModelSelector selectedModel={selectedModel} onSelect={handleModelSelect} />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Status indicator */}
            {engine.isThinking || engine.isStreaming ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/15">
                <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                <span className="text-[10px] font-medium text-amber-400">
                  {engine.researchStages.length > 0 ? 'Researching' : 'Thinking'}
                </span>
              </div>
            ) : null}

            {/* New chat */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground/60 hover:text-foreground/80 hover:bg-secondary/15"
              onClick={engine.createConversation}
              title="New chat"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Tools panel toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9 transition-colors',
                toolsPanelOpen
                  ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15'
                  : 'text-muted-foreground/60 hover:text-foreground/80 hover:bg-secondary/15'
              )}
              onClick={() => setToolsPanelOpen(!toolsPanelOpen)}
              title={toolsPanelOpen ? 'Hide tools panel' : 'Show tools panel'}
            >
              <Compass className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {engine.messages.length === 0 ? (
              /* Welcome Screen (ChatGPT-style) */
              <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 py-12">
                {/* Logo */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/15">
                  <Sparkles className="h-8 w-8 text-emerald-400" />
                </div>

                <div className="text-center">
                  <h1 className="text-2xl font-semibold text-foreground/90 mb-2">What can I help you with?</h1>
                  <p className="text-sm text-muted-foreground/50 max-w-md">
                    Find leads, research companies, draft outreach, analyze your pipeline, and more.
                  </p>
                </div>

                {/* Deep Research Notice */}
                {deepResearchEnabled && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-500/20 bg-violet-500/5 text-[11px] text-violet-400">
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>Deep Research mode is active — responses will be more thorough</span>
                  </div>
                )}

                {/* Prompt Suggestion Cards (2x2 grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                  {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={i}
                        className="flex items-start gap-3 p-4 rounded-xl border border-border/15 bg-secondary/[0.03] hover:bg-secondary/10 hover:border-emerald-500/20 transition-all duration-200 text-left group"
                        onClick={() => handlePromptClick(prompt.prompt)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors shrink-0">
                          <Icon className="h-4 w-4 text-emerald-400/70 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground/80 group-hover:text-foreground/90 transition-colors">{prompt.label}</div>
                          <div className="text-xs text-muted-foreground/40 mt-0.5 leading-relaxed">{prompt.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Messages */
              <>
                {engine.messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onCopy={engine.copyMessage}
                    onFeedback={engine.feedbackMessage}
                    onRegenerate={handleRegenerate}
                    onSaveTarget={handleSaveTarget}
                    onNavigate={handleNavigate}
                  />
                ))}

                {/* Thinking indicator */}
                {engine.isThinking && !engine.messages.some(m => m.isLoading) && (
                  <div className="flex gap-3 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/15 shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:0ms]" />
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/40 animate-bounce [animation-delay:150ms]" />
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/20 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-sm text-muted-foreground/50">Thinking...</span>
                    </div>
                  </div>
                )}

                {/* Suggested prompts (show when few messages) */}
                {engine.messages.length <= 2 && !engine.isThinking && !engine.isStreaming && (
                  <>
                    <Separator className="bg-border/10 my-2" />
                    <div className="space-y-3 pb-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-400/60" />
                        <span className="text-xs font-medium text-foreground/50">Suggested prompts</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => {
                          const Icon = prompt.icon;
                          return (
                            <button
                              key={i}
                              className="flex items-start gap-2.5 p-3 rounded-xl border border-border/10 bg-secondary/[0.03] hover:bg-secondary/10 hover:border-emerald-500/20 transition-all duration-200 text-left group"
                              onClick={() => handlePromptClick(prompt.prompt)}
                            >
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/15 shrink-0">
                                <Icon className="h-3.5 w-3.5 text-emerald-400/60 group-hover:text-emerald-400" />
                              </div>
                              <div>
                                <div className="text-xs font-medium text-foreground/70 group-hover:text-foreground/80">{prompt.label}</div>
                                <div className="text-[10px] text-muted-foreground/40 mt-0.5">{prompt.description}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={scrollToBottom}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-card/90 border border-border/25 shadow-lg hover:bg-secondary/20 transition-all text-muted-foreground/60 backdrop-blur-sm"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input Area (ChatGPT-style pill input) */}
        <div className="shrink-0 px-3 sm:px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            {/* Research stages indicator */}
            {engine.researchStages.length > 0 && (
              <div className="mb-3 rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-3">
                <ResearchProgress stages={engine.researchStages} />
              </div>
            )}

            {/* The pill input container */}
            <div className="relative flex items-end rounded-2xl border border-border/25 bg-secondary/[0.06] shadow-sm focus-within:border-border/40 focus-within:shadow-md transition-all">
              {/* Attachment button (left inside) */}
              <div className="pl-3 pb-3 pt-3">
                <button className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" title="Attach file (coming soon)">
                  <Paperclip className="h-5 w-5" />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={deepResearchEnabled ? 'Message LeadReach AI (deep research)...' : 'Message LeadReach AI...'}
                rows={1}
                className="flex-1 resize-none bg-transparent pl-3 pr-2 py-3 text-sm text-foreground/90 placeholder:text-muted-foreground/30 focus:outline-none min-h-[52px] max-h-[200px] leading-relaxed"
              />

              {/* Send / Stop button (right inside) */}
              <div className="pr-3 pb-3 pt-3">
                {engine.isStreaming || engine.isThinking ? (
                  <button
                    onClick={engine.stopStreaming}
                    className="flex items-center justify-center h-8 w-8 rounded-lg bg-foreground/80 hover:bg-foreground text-background transition-colors"
                    title="Stop generating"
                  >
                    <Square className="h-3.5 w-3.5" fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className={cn(
                      'flex items-center justify-center h-8 w-8 rounded-lg transition-all',
                      inputValue.trim()
                        ? 'bg-foreground text-background hover:opacity-90'
                        : 'bg-foreground/10 text-foreground/20 cursor-not-allowed'
                    )}
                    title="Send message"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Below-input row: Deep Research toggle + hints */}
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedModel(deepResearchEnabled ? 'standard' : 'deep-research')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium transition-all',
                    deepResearchEnabled
                      ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                      : 'border-border/15 text-muted-foreground/30 hover:text-muted-foreground/50 hover:border-border/25'
                  )}
                >
                  <FlaskConical className="h-3 w-3" />
                  Deep Research
                </button>
                {currentActionType && ACTION_NAV_MAP[currentActionType] && ACTION_CONFIG[currentActionType] && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/10 text-[10px] text-muted-foreground/30">
                    {ACTION_CONFIG[currentActionType].emoji} {ACTION_NAV_MAP[currentActionType].label}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/20">
                LeadReach AI can make mistakes. Verify important info.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Panel (expandable overlay from right) */}
      {toolsPanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setToolsPanelOpen(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-[320px] z-50 bg-card/95 backdrop-blur-md border-l border-border/15 shadow-2xl animate-in slide-in-from-right duration-200">
            <ToolNavigationPanel
              currentActionType={currentActionType}
              onNavigate={handleNavigate}
              onClose={() => setToolsPanelOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
