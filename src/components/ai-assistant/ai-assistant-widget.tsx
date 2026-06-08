'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronUp,
  Lightbulb,
  Search,
  Mail,
  BarChart3,
  Target,
  Zap,
  ArrowRight,
  Square,
  Paperclip,
  Maximize2,
  RotateCcw,
  ArrowDown,
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Building2,
  UserCheck,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Users,
  MessageSquare,
  TrendingUp,
  Save,
  CheckCircle,
  ExternalLink,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Tag,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  useChatEngine,
  type ChatMessage,
  type ResearchStageInfo,
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

const SUGGESTED_PROMPTS = [
  { icon: Search, label: 'Find SaaS companies in NYC', prompt: 'Find SaaS companies in New York City that would be good prospects', color: 'from-emerald-500/10 to-cyan-500/10 border-emerald-500/15', action: 'discover_leads' },
  { icon: Mail, label: 'Draft cold emails', prompt: 'Draft cold emails for my top leads', color: 'from-pink-500/10 to-rose-500/10 border-pink-500/15', action: 'compose_outreach' },
  { icon: Target, label: 'Build my ICP', prompt: 'Build my ideal customer profile for a B2B SaaS product', color: 'from-amber-500/10 to-orange-500/10 border-amber-500/15', action: 'build_icp' },
  { icon: Globe, label: 'Research fintech market', prompt: 'Research the fintech market and key trends for 2025', color: 'from-cyan-500/10 to-teal-500/10 border-cyan-500/15', action: 'research_market' },
  { icon: BarChart3, label: 'Analyze pipeline', prompt: 'Analyze my pipeline performance and suggest improvements', color: 'from-red-500/10 to-orange-500/10 border-red-500/15', action: 'analyze_pipeline' },
  { icon: Building2, label: 'Enrich lead data', prompt: 'Help me enrich my lead data with more contact and firmographic information', color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/15', action: 'enrich_data' },
];

const SYSTEM_PROMPT = `You are LeadReach AI, an institutional-grade intelligence engine for B2B lead generation. You deliver production-ready data synthesis with domain-specific expertise.

1. **Lead Discovery** — Multi-channel search across 17+ channels (Web, LinkedIn, GitHub, Reddit, YouTube, Exa, etc.)
2. **Domain-Specific Intelligence** — 4-phase pipeline for specialized domains (VC/PE, hedge funds, real estate, government contracting, pharma/biotech, insurance, investment banking, energy, manufacturing, fintech, healthcare, edtech)
3. **Data Enrichment** — Deep website reading, contact extraction, firmographic data, financial metrics, regulatory filings
4. **Lead Qualification** — AI-powered scoring with domain-specific criteria and intent signal detection
5. **Outreach** — Personalized messages with stage-specific contact matrices using BANT, Observation-Ask, Problem-Proof-Ask
6. **Pipeline Management** — Track leads through stages from discovery to close
7. **Reports & Analytics** — Campaign analytics and pipeline insights
8. **ICP Building** — Define and refine Ideal Customer Profiles with multi-dimensional scoring
9. **Multi-channel Messaging** — SMS, WhatsApp, Instagram, Facebook, Email

You are currently on the {currentPage} page. Tailor your responses to be context-aware.

Be concise, actionable, and helpful. Use bullet points for lists. If you don't know something, say so honestly.`;

// Action badge config
const ACTION_CONFIG: Record<string, { emoji: string; color: string; bgColor: string; borderColor: string }> = {
  discover_leads: { emoji: '🔍', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  enrich_data: { emoji: '📊', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  compose_outreach: { emoji: '✉️', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
  build_icp: { emoji: '🎯', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  analyze_pipeline: { emoji: '📈', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  research_market: { emoji: '🌐', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  general_chat: { emoji: '💡', color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
};

// Stage icons for research progress
const stageIcons: Record<string, React.ElementType> = {
  'intent_analysis': Brain,
  'website_read': Globe,
  'company_search': Building2,
  'people_search': UserCheck,
  'news_social': MessageSquare,
  'tech_analysis': Zap,
  'intent_signals': Target,
  'synthesis': Sparkles,
  'complete': CheckCircle2,
};

// ============================================================
// Research Progress Component
// ============================================================

function ResearchProgress({ stages }: { stages: ResearchStageInfo[] }) {
  const [expanded, setExpanded] = useState(false);

  if (stages.length === 0) return null;

  const activeStage = stages.find(s => s.status === 'running');
  const completedCount = stages.filter(s => s.status === 'completed').length;

  return (
    <div className="mt-3 pt-3 border-t border-border/15">
      <button
        className="flex items-center gap-2 w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <Brain className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider flex-1">
          Research Pipeline ({completedCount}/{stages.length})
        </span>
        <ChevronDown className={cn('h-3 w-3 text-violet-400/60 transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="space-y-1 mt-2">
          {stages.map((stage, i) => {
            const Icon = stageIcons[stage.stage] || Loader2;
            const isActive = stage.status === 'running';
            const isDone = stage.status === 'completed';

            return (
              <div
                key={`${stage.stage}-${i}`}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-300',
                  isActive && 'bg-violet-500/10 border border-violet-500/20',
                  isDone && 'bg-emerald-500/5 border border-emerald-500/10',
                  stage.status === 'pending' && 'opacity-40',
                )}
              >
                {isActive ? (
                  <Loader2 className="h-3 w-3 text-violet-400 animate-spin shrink-0" />
                ) : isDone ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : (
                  <Icon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                )}
                <span className={cn(
                  'text-[10px] font-medium flex-1',
                  isActive && 'text-violet-300',
                  isDone && 'text-emerald-300/80',
                  stage.status === 'pending' && 'text-muted-foreground/50',
                )}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {activeStage && !expanded && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Loader2 className="h-2.5 w-2.5 text-violet-400 animate-spin" />
          <span className="text-[10px] text-violet-400/80">{activeStage.label}...</span>
        </div>
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
    <div className="flex items-center gap-2">
      <div className={cn('px-2 py-0.5 rounded-md border text-[10px] font-bold', config.color)}>
        {config.label}
      </div>
      <div className="flex-1 max-w-[100px]">
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
// Lead Card Component
// ============================================================

function LeadCard({ lead, onSave }: { lead: LeadDataItem; onSave?: () => void }) {
  return (
    <div className="rounded-lg border border-border/25 bg-secondary/10 p-3 space-y-2">
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
      {onSave && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          className="h-6 text-[10px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <Save className="h-2.5 w-2.5 mr-1" />
          Save Lead
        </Button>
      )}
    </div>
  );
}

// ============================================================
// ICP Summary Card
// ============================================================

function ICPSummaryCard({ icp, onSave }: { icp: ICPData; onSave?: () => void }) {
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
      {onSave && (
        <Button
          size="sm"
          className="w-full h-7 text-[11px] bg-amber-500 hover:bg-amber-400 text-black"
          onClick={onSave}
        >
          <Save className="h-3 w-3 mr-1" />
          Save ICP Profile
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Outreach Preview Component
// ============================================================

function OutreachPreview({ message, onSave }: { message: OutreachMessage; onSave?: () => void }) {
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
      {onSave && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] border-pink-500/20 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"
          onClick={onSave}
        >
          <Save className="h-2.5 w-2.5 mr-1" />
          Save Template
        </Button>
      )}
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
}: {
  saveTarget: SaveTarget;
  isSaved: boolean;
  isSaving: boolean;
  onSave: (st: SaveTarget) => void;
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
  };
  const Icon = viewIconMap[saveTarget.viewTarget] || Save;

  return (
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
  );
}

// ============================================================
// Action Results Section
// ============================================================

function ActionResultsSection({
  message,
  onSaveTarget,
}: {
  message: ChatMessage;
  onSaveTarget: (messageId: string, saveTarget: SaveTarget) => void;
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
          <div className="grid gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
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
          <div className="grid gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
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
// Message Bubble Component
// ============================================================

function MessageBubble({
  message,
  onCopy,
  onFeedback,
  onRegenerate,
  onSaveTarget,
}: {
  message: ChatMessage;
  onCopy: (id: string) => void;
  onFeedback: (id: string, type: 'up' | 'down') => void;
  onRegenerate: (id: string) => void;
  onSaveTarget: (messageId: string, saveTarget: SaveTarget) => void;
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
      className={cn('group flex gap-3 px-4 py-2', isUser ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5',
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

      {/* Message Content */}
      <div className={cn('max-w-[85%] flex flex-col', isUser ? 'items-end' : 'items-start')}>
        {/* Name label */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-[11px] font-medium', isUser ? 'text-emerald-400' : 'text-foreground/60')}>
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
            'rounded-2xl px-4 py-3 relative',
            isUser
              ? 'bg-emerald-500/10 border border-emerald-500/15 text-foreground/90 rounded-tr-md'
              : message.isError
              ? 'bg-red-500/5 border border-red-500/15 text-red-300/80 rounded-tl-md'
              : message.isResearchReport || actionConfig
              ? 'bg-secondary/15 border border-violet-500/10 rounded-tl-md'
              : 'bg-secondary/15 border border-border/15 rounded-tl-md',
          )}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:0ms]" />
                <div className="h-2 w-2 rounded-full bg-emerald-400/40 animate-bounce [animation-delay:150ms]" />
                <div className="h-2 w-2 rounded-full bg-emerald-400/20 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-muted-foreground/50">
                {message.content || 'Thinking...'}
              </span>
            </div>
          ) : (
            <>
              {message.isResearchReport && message.leadScore !== undefined && (
                <LeadScoreBadge score={message.leadScore} tier={message.leadTier || 'cold'} />
              )}

              {/* Thinking/reasoning toggle for research reports */}
              {message.researchStages && message.researchStages.length > 0 && (
                <div className="mb-2">
                  <button
                    onClick={() => setShowThinking(!showThinking)}
                    className="flex items-center gap-1.5 text-[10px] text-violet-400/70 hover:text-violet-400 transition-colors"
                  >
                    <Brain className="h-3 w-3" />
                    <span>{showThinking ? 'Hide' : 'View'} thinking process</span>
                    <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', showThinking && 'rotate-180')} />
                  </button>
                  {showThinking && <ResearchProgress stages={message.researchStages} />}
                </div>
              )}

              <MarkdownRenderer content={message.content} isStreaming={message.isStreaming} />

              {/* Pipeline triggered indicator */}
              {message.pipelineTriggered?.started && (
                <div className="mt-3 pt-2 border-t border-border/15">
                  <div className="flex items-center gap-2 text-[10px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Pipeline launched!</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Results Section (below the bubble) */}
        {!message.isLoading && hasActionData && (
          <div className="w-full mt-2">
            <button
              onClick={() => setShowResults(!showResults)}
              className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 hover:text-emerald-400 transition-colors mb-2"
            >
              <ChevronDown className={cn('h-2.5 w-2.5 transition-transform', showResults && 'rotate-180')} />
              <span>{showResults ? 'Hide' : 'Show'} results & actions</span>
            </button>
            {showResults && (
              <ActionResultsSection message={message} onSaveTarget={onSaveTarget} />
            )}
          </div>
        )}

        {/* Action buttons */}
        {!message.isLoading && showActions && !isUser && (
          <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20 transition-all"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
              {copied && <span className="text-emerald-400">Copied!</span>}
            </button>
            <button
              onClick={() => onRegenerate(message.id)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20 transition-all"
              title="Regenerate"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              onClick={() => onFeedback(message.id, 'up')}
              className={cn(
                'p-0.5 rounded-md transition-all',
                message.feedback === 'up' ? 'text-emerald-400' : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20'
              )}
              title="Good response"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => onFeedback(message.id, 'down')}
              className={cn(
                'p-0.5 rounded-md transition-all',
                message.feedback === 'down' ? 'text-red-400' : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20'
              )}
              title="Bad response"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}

        {!message.isLoading && showActions && isUser && (
          <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/20 transition-all"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Widget
// ============================================================

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const { activeView, setActiveView } = useAppStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentViewLabel = VIEW_LABELS[activeView] || 'Dashboard';
  const systemPromptWithCtx = SYSTEM_PROMPT.replace('{currentPage}', currentViewLabel);

  const engine = useChatEngine();

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
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollBtn(!isNearBottom);
    }
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 144) + 'px';
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

  const handleQuickAction = async (prompt: string) => {
    setInput('');
    await engine.sendMessage(prompt, systemPromptWithCtx, currentViewLabel);
  };

  const handleNavigate = (view: ViewType) => {
    setActiveView(view);
    setIsOpen(false);
  };

  const handleRegenerate = async (messageId: string) => {
    await engine.regenerateLastMessage(systemPromptWithCtx, currentViewLabel);
  };

  const handleSaveTarget = async (messageId: string, saveTarget: SaveTarget) => {
    try {
      await engine.saveToSection(messageId, saveTarget);
      // Navigate to the target view after saving
      setActiveView(saveTarget.viewTarget);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleExpand = () => {
    setIsOpen(false);
    setActiveView('ai-assistant' as ViewType);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300',
          'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white',
          'shadow-lg shadow-emerald-500/25',
          'hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/35 active:scale-95',
          isOpen && 'scale-0 opacity-0 pointer-events-none',
        )}
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Panel — slides in from right */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full flex flex-col',
          'bg-card/95 backdrop-blur-xl border-l border-border/30',
          'shadow-2xl shadow-black/30',
          'transition-transform duration-300 ease-out',
          'w-full md:w-[480px]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground/90">LeadReach AI</span>
                <Badge
                  className={cn(
                    'h-4 px-1.5 text-[8px] border',
                    engine.isThinking || engine.isStreaming
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  )}
                >
                  {engine.isThinking || engine.isStreaming ? (
                    <>
                      <span className="h-1 w-1 rounded-full bg-amber-400 animate-pulse mr-1" />
                      {engine.researchStages.length > 0 ? 'Researching' : 'Thinking'}
                    </>
                  ) : (
                    <>
                      <span className="h-1 w-1 rounded-full bg-emerald-400 mr-1" />
                      Online
                    </>
                  )}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground/50">On {currentViewLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={engine.clearActiveConversation}
              title="New chat"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleExpand}
              title="Expand"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-2 custom-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {engine.messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
              {/* Logo */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <Sparkles className="h-8 w-8 text-emerald-400" />
              </div>

              {/* Heading */}
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground/90">How can I help you today?</h2>
                <p className="text-xs text-muted-foreground/50 mt-1">Ask about leads, outreach, pipeline, or anything else</p>
              </div>

              {/* Suggested Prompts Grid */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {SUGGESTED_PROMPTS.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={prompt.label}
                      onClick={() => handleQuickAction(prompt.prompt)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200',
                        'bg-gradient-to-br hover:scale-[1.02] hover:shadow-md',
                        prompt.color,
                        'hover:border-emerald-500/25',
                      )}
                    >
                      <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-medium text-foreground/70">{prompt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Navigate */}
              <div className="w-full space-y-2">
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider px-1">Navigate to</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['prospect-discovery', 'leads', 'outreach', 'reports', 'icp'] as ViewType[]).map((view) => (
                    <button
                      key={view}
                      onClick={() => handleNavigate(view)}
                      className={cn(
                        'flex items-center gap-1 rounded-full border border-border/20 bg-secondary/10 px-2.5 py-1 text-[10px] text-muted-foreground/60 transition-all hover:bg-secondary/20 hover:text-foreground hover:border-emerald-500/20',
                        activeView === view && 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
                      )}
                    >
                      {VIEW_LABELS[view]}
                      {activeView !== view && <ArrowRight className="h-2.5 w-2.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Messages List */
            <>
              {engine.messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onCopy={engine.copyMessage}
                  onFeedback={engine.feedbackMessage}
                  onRegenerate={handleRegenerate}
                  onSaveTarget={handleSaveTarget}
                />
              ))}

              {/* Thinking indicator (shown below messages when not loading) */}
              {engine.isThinking && !engine.messages.some(m => m.isLoading) && (
                <div className="flex gap-3 px-4 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/15 shrink-0">
                    <Bot className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md bg-secondary/15 border border-border/15 px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:0ms]" />
                      <div className="h-2 w-2 rounded-full bg-emerald-400/40 animate-bounce [animation-delay:150ms]" />
                      <div className="h-2 w-2 rounded-full bg-emerald-400/20 animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs text-muted-foreground/50">Thinking...</span>
                  </div>
                </div>
              )}

              {/* Error display */}
              {engine.error && !engine.messages.some(m => m.isError) && (
                <div className="mx-4 my-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-xs text-red-400">{engine.error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <div className="absolute bottom-24 right-4">
            <button
              onClick={scrollToBottom}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-card/90 border border-border/30 shadow-lg hover:bg-secondary/20 transition-all"
            >
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border/20 px-4 py-3 shrink-0">
          {/* Research stages indicator */}
          {engine.researchStages.length > 0 && (
            <div className="mb-2 rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2">
              <ResearchProgress stages={engine.researchStages} />
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              {/* Attachment hint */}
              <div className="absolute left-3 bottom-2.5 z-10">
                <button className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" title="Attach file (coming soon)">
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your leads..."
                rows={1}
                className="w-full resize-none bg-secondary/15 border border-border/25 rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground/90 placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 min-h-[42px] max-h-[144px] transition-colors"
              />
            </div>
            {engine.isStreaming || engine.isThinking ? (
              <Button
                size="icon"
                onClick={engine.stopStreaming}
                className="h-[42px] w-[42px] rounded-xl bg-red-500/80 hover:bg-red-500 text-white shrink-0 transition-colors"
                title="Stop generating"
              >
                <Square className="h-4 w-4" fill="currentColor" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-[42px] w-[42px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-[10px] text-muted-foreground/30">
              {input.length > 0 && `${input.length} chars`}
              {input.length === 0 && 'Shift+Enter for new line'}
            </span>
            <Badge variant="outline" className="text-[8px] border-emerald-500/15 text-emerald-400/60 bg-emerald-500/5 h-4 px-1.5">
              <Zap className="h-2 w-2 mr-0.5" />
              Smart AI
            </Badge>
          </div>
        </div>
      </div>
    </>
  );
}
