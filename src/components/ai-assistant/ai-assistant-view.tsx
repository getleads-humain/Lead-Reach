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
  const [showActions, setShowActions] = useState(false);
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

  return (
    <div
      className={cn('group flex gap-4 py-4', isUser ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl shrink-0',
          isUser
            ? 'bg-emerald-500/15 border border-emerald-500/20'
            : message.isError
            ? 'bg-red-500/10 border border-red-500/20'
            : message.isResearchReport || actionConfig
            ? 'bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/20'
            : 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/15',
        )}
      >
        {isUser ? (
          <span className="text-xs font-bold text-emerald-400">U</span>
        ) : message.isError ? (
          <AlertCircle className="h-4 w-4 text-red-400" />
        ) : message.isResearchReport || actionConfig ? (
          <Sparkles className="h-4 w-4 text-violet-400" />
        ) : (
          <Bot className="h-4 w-4 text-emerald-400" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', isUser ? 'flex flex-col items-end' : 'flex flex-col items-start')}>
        {/* Name & time */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-xs font-medium', isUser ? 'text-emerald-400' : 'text-foreground/60')}>
            {isUser ? 'You' : 'LeadReach AI'}
          </span>
          <span className="text-[10px] text-muted-foreground/30">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Action Badge */}
        {actionConfig && !message.isLoading && (
          <div className={cn(
            'flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full border text-[10px] font-semibold',
            actionConfig.bgColor, actionConfig.color, actionConfig.borderColor
          )}>
            <span>{actionConfig.emoji}</span>
            <span>{message.actionLabel}</span>
            {message.isStreaming && (
              <Loader2 className="h-2.5 w-2.5 animate-spin ml-1" />
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'max-w-[90%] rounded-2xl px-4 py-3',
            isUser
              ? 'bg-emerald-500/10 border border-emerald-500/15 text-foreground/90 rounded-tr-md'
              : message.isError
              ? 'bg-red-500/5 border border-red-500/15 text-red-300/80 rounded-tl-md'
              : message.isResearchReport || actionConfig
              ? 'bg-secondary/10 border border-violet-500/10 rounded-tl-md'
              : 'text-foreground/85 rounded-tl-md',
            !isUser && !message.isError && !message.isResearchReport && !actionConfig && 'bg-transparent',
          )}
        >
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
          <div className="w-full max-w-[90%] mt-1">
            <ToolNavChips actionType={message.actionType} onNavigate={onNavigate} />
          </div>
        )}

        {/* Action Results Section */}
        {!message.isLoading && hasActionData && (
          <div className="w-full max-w-[90%] mt-1">
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

        {/* Action buttons */}
        {!message.isLoading && showActions && (
          <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20 transition-all"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
              {copied && <span className="text-emerald-400">Copied!</span>}
            </button>
            {!isUser && (
              <>
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20 transition-all"
                  title="Regenerate"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onFeedback(message.id, 'up')}
                  className={cn(
                    'p-1 rounded-md transition-all',
                    message.feedback === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20'
                  )}
                  title="Good response"
                >
                  <ThumbsUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onFeedback(message.id, 'down')}
                  className={cn(
                    'p-1 rounded-md transition-all',
                    message.feedback === 'down' ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20'
                  )}
                  title="Bad response"
                >
                  <ThumbsDown className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Conversation Sidebar
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.pinned);
  const recentConversations = filteredConversations.filter(c => !c.pinned);

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNew}
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-xs border-border/30 hover:border-emerald-500/20 hover:bg-emerald-500/5"
        >
          <Plus className="h-3.5 w-3.5" />
          New Conversation
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="h-8 text-[11px] pl-8 bg-secondary/10 border-border/20 focus:border-emerald-500/20"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <Pin className="h-2.5 w-2.5 text-amber-400/60" />
              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">Pinned</span>
            </div>
            {pinnedConversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                isHovered={conv.id === hoveredId}
                onSelect={onSelect}
                onDelete={onDelete}
                onPin={onPin}
                onHover={setHoveredId}
              />
            ))}
          </div>
        )}

        {/* Recent Section */}
        {recentConversations.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-2 py-1">
              <Clock className="h-2.5 w-2.5 text-muted-foreground/30" />
              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">Recent</span>
            </div>
            {recentConversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                isHovered={conv.id === hoveredId}
                onSelect={onSelect}
                onDelete={onDelete}
                onPin={onPin}
                onHover={setHoveredId}
              />
            ))}
          </div>
        )}

        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/30">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-xs">No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  isHovered,
  onSelect,
  onDelete,
  onPin,
  onHover,
}: {
  conversation: Conversation;
  isActive: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-all duration-200 relative',
        isActive
          ? 'bg-emerald-500/10 border border-emerald-500/20'
          : 'hover:bg-secondary/20 border border-transparent',
      )}
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => onHover(conversation.id)}
      onMouseLeave={() => onHover(null)}
    >
      <MessageSquare
        className={cn(
          'h-3.5 w-3.5 shrink-0 mt-0.5',
          isActive ? 'text-emerald-400' : 'text-muted-foreground/40',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-[11px] font-medium truncate flex-1',
              isActive ? 'text-emerald-400' : 'text-foreground/70',
            )}
          >
            {conversation.title}
          </span>
          {conversation.pinned && <Star className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
        </div>
        <p className="text-[10px] text-muted-foreground/40 truncate mt-0.5">
          {conversation.lastMessage || 'No messages yet'}
        </p>
        <span className="text-[9px] text-muted-foreground/25 mt-0.5 block">
          {new Date(conversation.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          {' '}
          {new Date(conversation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Hover actions */}
      {isHovered && (
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onPin(conversation.id)}
            className="p-0.5 rounded hover:bg-secondary/20 text-muted-foreground/40 hover:text-amber-400 transition-colors"
            title={conversation.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(conversation.id)}
            className="p-0.5 rounded hover:bg-secondary/20 text-muted-foreground/40 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tool Navigation Panel (right sidebar)
// ============================================================

function ToolNavigationPanel({
  currentActionType,
  onNavigate,
}: {
  currentActionType: string | undefined;
  onNavigate: (view: ViewType) => void;
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
      <div className="p-3 border-b border-border/15">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-foreground/80">Tool Navigation</span>
        </div>
      </div>

      {/* Quick Navigate — Primary */}
      {primaryNav && (
        <div className="p-3 border-b border-border/15">
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Active Tool</span>
            <button
              onClick={() => onNavigate(primaryNav.view)}
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
        <div className="p-3 border-b border-border/15">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Related Tools</span>
          <div className="space-y-1.5 mt-2">
            {relatedTools.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.view}
                  onClick={() => onNavigate(tool.view)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-left transition-all duration-200',
                    'bg-secondary/5 border-border/15 text-foreground/70',
                    'hover:bg-secondary/10 hover:border-border/25 hover:text-foreground/90',
                  )}
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
      <div className="p-3 border-b border-border/15">
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">All Tools</span>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {Object.entries(ACTION_NAV_MAP).map(([key, tool]) => {
            const ToolIcon = tool.icon;
            const isActive = key === currentActionType;
            const isRelated = relatedTools.some(r => r.view === tool.view);
            return (
              <button
                key={key}
                onClick={() => onNavigate(tool.view)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-center transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : isRelated
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/70'
                    : 'bg-secondary/5 border-border/10 text-muted-foreground/50',
                  !isActive && 'hover:bg-secondary/10 hover:text-foreground/70',
                )}
              >
                <ToolIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[9px] font-medium leading-tight">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform Tips */}
      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Tips</span>
        </div>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[10px] text-muted-foreground/50 leading-relaxed"
            >
              <div className="h-1 w-1 rounded-full bg-emerald-400/40 mt-1.5 shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main View
// ============================================================

export function AIAssistantView() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { activeView, setActiveView } = useAppStore();
  const engine = useChatEngine();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    textarea.style.height = Math.min(textarea.scrollHeight, 168) + 'px';
  };

  // Build system prompt with context
  const systemPromptWithCtx = useMemo(() => {
    const currentViewLabel = VIEW_LABELS[activeView] || 'Dashboard';
    let prompt = SYSTEM_PROMPT.replace('{currentPage}', currentViewLabel);
    if (deepResearchEnabled) {
      prompt += '\n\nDEEP RESEARCH MODE: The user has enabled deep research. Perform comprehensive multi-stage research with detailed analysis, exhaustive data gathering, and thorough synthesis. Take your time and be thorough.';
    }
    return prompt;
  }, [activeView, deepResearchEnabled]);

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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-4 md:-m-6 lg:-m-8 relative">
      {/* Left Sidebar — Conversations */}
      <div
        className={cn(
          'shrink-0 border-r border-border/20 bg-card/50 backdrop-blur-sm transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden',
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
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/15 shrink-0 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/15">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground/90">LeadReach AI</h2>
              <p className="text-[10px] text-muted-foreground/40">
                Powered by GLM-4{deepResearchEnabled ? ' — Deep Research Active' : ' — Ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Deep Research Toggle */}
            <button
              onClick={() => setDeepResearchEnabled(!deepResearchEnabled)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all duration-200',
                deepResearchEnabled
                  ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                  : 'bg-secondary/5 border-border/15 text-muted-foreground/40 hover:text-muted-foreground/60 hover:border-border/25'
              )}
            >
              <FlaskConical className="h-3 w-3" />
              Deep Research
            </button>

            <Badge
              className={cn(
                'h-5 px-2 text-[9px] border',
                engine.isThinking || engine.isStreaming
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              )}
            >
              {engine.isThinking || engine.isStreaming ? (
                <>
                  <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                  {engine.researchStages.length > 0 ? 'Researching...' : 'Thinking...'}
                </>
              ) : (
                <>
                  <Zap className="h-2.5 w-2.5 mr-1" />
                  Online
                </>
              )}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={engine.createConversation}
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              title={rightPanelOpen ? 'Hide tools panel' : 'Show tools panel'}
            >
              {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto px-4">
            {engine.messages.length === 0 ? (
              /* Welcome Screen */
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 py-8">
                {/* Logo */}
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
                  <Sparkles className="h-10 w-10 text-emerald-400" />
                </div>

                <div className="text-center">
                  <h1 className="text-2xl font-bold text-foreground/90 mb-2">How can I help you today?</h1>
                  <p className="text-sm text-muted-foreground/50 max-w-md">
                    I can help you find leads, research companies, draft outreach, analyze your pipeline, and more.
                  </p>
                </div>

                {/* Deep Research Notice */}
                {deepResearchEnabled && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-500/20 bg-violet-500/5 text-[11px] text-violet-400">
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>Deep Research mode is active — responses will be more thorough and detailed</span>
                  </div>
                )}

                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt, i) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={i}
                        className="flex items-start gap-3 p-4 rounded-xl border border-border/15 bg-secondary/5 hover:bg-secondary/10 hover:border-emerald-500/20 transition-all duration-200 text-left group"
                        onClick={() => handlePromptClick(prompt.prompt)}
                      >
                        <Icon className="h-5 w-5 text-emerald-400/60 group-hover:text-emerald-400 shrink-0 mt-0.5 transition-colors" />
                        <div>
                          <div className="text-xs font-medium text-foreground/80 group-hover:text-foreground/90 transition-colors">{prompt.label}</div>
                          <div className="text-[11px] text-muted-foreground/40 mt-0.5">{prompt.description}</div>
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
                  <div className="flex gap-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/15 shrink-0">
                      <Bot className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3">
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
                    <Separator className="bg-border/15 my-4" />
                    <div className="space-y-3 pb-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-semibold text-foreground/60">Suggested prompts</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => {
                          const Icon = prompt.icon;
                          return (
                            <button
                              key={i}
                              className="flex items-start gap-2.5 p-3 rounded-lg border border-border/15 bg-secondary/5 hover:bg-secondary/10 hover:border-emerald-500/20 transition-all duration-200 text-left group"
                              onClick={() => handlePromptClick(prompt.prompt)}
                            >
                              <Icon className="h-4 w-4 text-emerald-400/50 group-hover:text-emerald-400 shrink-0 mt-0.5" />
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
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-card/90 border border-border/30 shadow-lg hover:bg-secondary/20 transition-all text-xs text-muted-foreground backdrop-blur-sm"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Scroll to bottom
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border/15 px-4 py-4 shrink-0 bg-card/30 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            {/* Research stages indicator */}
            {engine.researchStages.length > 0 && (
              <div className="mb-3 rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-3">
                <ResearchProgress stages={engine.researchStages} />
              </div>
            )}

            {/* Context chips */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[9px] border-emerald-500/15 text-emerald-400/60 bg-emerald-500/5 h-5 px-2">
                <Zap className="h-2.5 w-2.5 mr-1" />
                AI Powered
              </Badge>
              {deepResearchEnabled && (
                <Badge variant="outline" className="text-[9px] border-violet-500/15 text-violet-400/60 bg-violet-500/5 h-5 px-2">
                  <FlaskConical className="h-2.5 w-2.5 mr-1" />
                  Deep Research
                </Badge>
              )}
              {currentActionType && ACTION_NAV_MAP[currentActionType] && ACTION_CONFIG[currentActionType] && (
                <Badge variant="outline" className="text-[9px] border-emerald-500/15 text-emerald-400/60 bg-emerald-500/5 h-5 px-2">
                  {ACTION_CONFIG[currentActionType].emoji} {ACTION_NAV_MAP[currentActionType].label}
                </Badge>
              )}
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                {/* Attachment hint */}
                <div className="absolute left-3 bottom-3 z-10">
                  <button className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" title="Attach file (coming soon)">
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={deepResearchEnabled ? 'Message LeadReach AI (deep research mode)...' : 'Message LeadReach AI...'}
                  rows={1}
                  className="w-full resize-none bg-secondary/10 border border-border/20 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground/90 placeholder:text-muted-foreground/30 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 min-h-[48px] max-h-[168px] transition-colors"
                />
              </div>
              {engine.isStreaming || engine.isThinking ? (
                <Button
                  size="icon"
                  onClick={engine.stopStreaming}
                  className="h-12 w-12 rounded-xl bg-red-500/80 hover:bg-red-500 text-white shrink-0 transition-colors"
                  title="Stop generating"
                >
                  <Square className="h-4 w-4" fill="currentColor" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="h-12 w-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black shrink-0 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/25">
                  {inputValue.length > 0 ? `${inputValue.length} chars` : 'Shift+Enter for new line'}
                </span>
                <button
                  onClick={() => setDeepResearchEnabled(!deepResearchEnabled)}
                  className={cn(
                    'flex items-center gap-1 text-[10px] transition-colors',
                    deepResearchEnabled ? 'text-violet-400/80' : 'text-muted-foreground/25 hover:text-muted-foreground/50',
                  )}
                >
                  <FlaskConical className="h-3 w-3" />
                  Deep Research
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground/20">
                LeadReach AI can make mistakes. Verify important info.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar — Tool Navigation Panel */}
      <div
        className={cn(
          'shrink-0 border-l border-border/20 bg-card/50 backdrop-blur-sm transition-all duration-300 flex flex-col',
          rightPanelOpen ? 'w-[280px]' : 'w-0 overflow-hidden',
        )}
      >
        <ToolNavigationPanel
          currentActionType={currentActionType}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
