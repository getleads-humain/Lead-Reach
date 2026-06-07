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
  Newspaper,
  Code2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Users,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useChatEngine, type ChatMessage, type ResearchStageInfo } from '@/hooks/use-chat-engine';
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
};

const SUGGESTED_PROMPTS = [
  { icon: Search, label: 'Find leads', prompt: 'I want to discover new leads for my business', color: 'from-emerald-500/10 to-cyan-500/10 border-emerald-500/15' },
  { icon: Mail, label: 'Draft outreach', prompt: 'Help me draft personalized outreach messages for my top leads', color: 'from-violet-500/10 to-fuchsia-500/10 border-violet-500/15' },
  { icon: BarChart3, label: 'Analyze pipeline', prompt: 'Analyze my current pipeline and suggest improvements', color: 'from-amber-500/10 to-orange-500/10 border-amber-500/15' },
  { icon: Target, label: 'Score leads', prompt: 'Help me understand how to improve lead scores across my pipeline', color: 'from-rose-500/10 to-pink-500/10 border-rose-500/15' },
  { icon: Lightbulb, label: 'Get insights', prompt: 'Give me insights about my lead generation performance', color: 'from-sky-500/10 to-blue-500/10 border-sky-500/15' },
  { icon: TrendingUp, label: 'Optimize', prompt: 'Suggest optimizations to improve my conversion rates', color: 'from-teal-500/10 to-emerald-500/10 border-teal-500/15' },
];

const SYSTEM_PROMPT = `You are LeadReach AI, an institutional-grade intelligence engine for B2B lead generation. You deliver production-ready data synthesis with domain-specific expertise.

1. **Lead Discovery** — Multi-channel search across 17+ channels (Web, LinkedIn, GitHub, Reddit, YouTube, Exa, etc.)
2. **Domain-Specific Intelligence** — 4-phase pipeline for specialized domains (VC/PE, hedge funds, real estate, government contracting, pharma/biotech, insurance, investment banking, energy, manufacturing, fintech, healthcare, edtech)
3. **Data Enrichment** — Deep website reading, contact extraction, firmographic data, financial metrics, regulatory filings
4. **Lead Qualification** — AI-powered scoring with domain-specific criteria and intent signal detection
5. **Outreach** — Personalized messages with stage-specific contact matrices (scouting → due diligence → IC approval → post-investment) using BANT, Observation-Ask, Problem-Proof-Ask
6. **Pipeline Management** — Track leads through stages from discovery to close
7. **Reports & Analytics** — Campaign analytics and pipeline insights
8. **ICP Building** — Define and refine Ideal Customer Profiles with multi-dimensional scoring
9. **Multi-channel Messaging** — SMS, WhatsApp, Instagram, Facebook, Email

DOMAIN EXPERTISE: Venture Capital (dry powder, TVPI/DPI/IRR, LP composition, SEC filings), Private Equity (EBITDA multiples, leverage ratios, operating partners), Hedge Funds (AUM, Sharpe, prime brokerage), Real Estate (cap rates, NOI, REITs), Government Contracting (NAICS, SAM.gov, procurement), and 9 more specialized domains.

OUTPUT STANDARDS: Structured JSON with uniform schemas, validated financial metrics, jurisdiction-matched legal entities, stage-specific contact matrices. Zero conversational padding for data queries. Financial consistency enforced (TVPI >= DPI, dry powder <= fund size).

You are currently on the {currentPage} page. Tailor your responses to be context-aware. If the user asks to do something that belongs on a different page (e.g., "research Stripe" while on Dashboard), suggest navigating to the appropriate page.

Be concise, actionable, and helpful. Use bullet points for lists. If you don't know something, say so honestly.`;

// Stage icons for research progress
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
    <div className="flex items-center gap-2 mb-2">
      <div className={cn('px-2 py-0.5 rounded-md border text-[10px] font-bold', config.color)}>
        {config.label}
      </div>
      <div className="flex-1 max-w-[120px]">
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
// Message Bubble Component
// ============================================================

function MessageBubble({
  message,
  onCopy,
  onFeedback,
  onRegenerate,
}: {
  message: ChatMessage;
  onCopy: (id: string) => void;
  onFeedback: (id: string, type: 'up' | 'down') => void;
  onRegenerate: (id: string) => void;
}) {
  const isUser = message.role === 'user';
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const handleCopy = () => {
    onCopy(message.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            : message.isResearchReport
            ? 'bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/20'
            : 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/15',
        )}
      >
        {isUser ? (
          <span className="text-xs font-bold text-emerald-400">U</span>
        ) : message.isError ? (
          <AlertCircle className="h-4 w-4 text-red-400" />
        ) : message.isResearchReport ? (
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

        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 relative',
            isUser
              ? 'bg-emerald-500/10 border border-emerald-500/15 text-foreground/90 rounded-tr-md'
              : message.isError
              ? 'bg-red-500/5 border border-red-500/15 text-red-300/80 rounded-tl-md'
              : message.isResearchReport
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
    textarea.style.height = Math.min(textarea.scrollHeight, 144) + 'px'; // max ~6 lines
  };

  const handleSend = async () => {
    if (!input.trim() || engine.isStreaming || engine.isThinking) return;
    const msg = input.trim();
    setInput('');
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await engine.sendMessage(msg, systemPromptWithCtx);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (prompt: string) => {
    setInput('');
    await engine.sendMessage(prompt, systemPromptWithCtx);
  };

  const handleNavigate = (view: ViewType) => {
    setActiveView(view);
    setIsOpen(false);
  };

  const handleRegenerate = async (messageId: string) => {
    await engine.regenerateLastMessage(systemPromptWithCtx);
  };

  const handleExpand = () => {
    setActiveView('dashboard' as ViewType);
    // For now, just maximize the panel — in a real app, this would navigate to the full view
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
          'w-full md:w-[420px]',
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
          className="flex-1 overflow-y-auto py-2"
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
              AI
            </Badge>
          </div>
        </div>
      </div>
    </>
  );
}
