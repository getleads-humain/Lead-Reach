'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Square,
  Paperclip,
  RotateCcw,
  ArrowDown,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Pin,
  X,
  Clock,
  Settings2,
  FlaskConical,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useChatEngine, type ChatMessage, type ResearchStageInfo, type Conversation } from '@/hooks/use-chat-engine';
import { MarkdownRenderer } from './markdown-renderer';
import type { ViewType } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// Constants
// ============================================================

const SUGGESTED_PROMPTS = [
  { icon: Users, label: 'Find high-intent leads', description: 'Discover leads matching your ICP', prompt: 'I want to find high-intent leads that match my Ideal Customer Profile. Help me discover new prospects.' },
  { icon: Mail, label: 'Draft outreach sequence', description: 'Create personalized email sequence', prompt: 'Help me draft a personalized outreach sequence for my top leads using best practices.' },
  { icon: BarChart3, label: 'Analyze campaign performance', description: 'Get insights on your campaigns', prompt: 'Analyze my campaign performance and suggest improvements to increase response rates.' },
  { icon: Target, label: 'Score my pipeline', description: 'Evaluate lead quality and priorities', prompt: 'Score my pipeline and help me prioritize which leads to contact first.' },
  { icon: TrendingUp, label: 'Suggest optimizations', description: 'Improve conversion rates', prompt: 'Suggest optimizations to improve my lead generation conversion rates.' },
  { icon: Search, label: 'Research a company', description: 'Deep dive into prospect data', prompt: 'Research a company for me. I want a deep dive into their business, tech stack, and key decision makers.' },
];

const SYSTEM_PROMPT = `You are LeadReach AI, an institutional-grade intelligence engine for B2B lead generation. You deliver production-ready data synthesis with domain-specific expertise.

1. **Lead Discovery** — Multi-channel search across 17+ channels (Web, LinkedIn, GitHub, Reddit, YouTube, Exa, etc.)
2. **Domain-Specific Intelligence** — 4-phase pipeline for specialized domains (VC/PE, hedge funds, real estate, government contracting, pharma/biotech, insurance, investment banking, energy, manufacturing, fintech, healthcare, edtech)
3. **Data Enrichment** — Deep website reading, contact extraction, firmographic data, financial metrics, regulatory filings
4. **Lead Qualification** — AI-powered scoring with domain-specific criteria and intent signal detection
5. **Outreach** — Personalized messages with stage-specific contact matrices (scouting → due diligence → IC approval → post-investment)
6. **Pipeline Management** — Track leads through stages from discovery to close
7. **Reports & Analytics** — Campaign analytics and pipeline insights
8. **ICP Building** — Define and refine Ideal Customer Profiles with multi-dimensional scoring
9. **Multi-channel Messaging** — SMS, WhatsApp, Instagram, Facebook, Email

DOMAIN EXPERTISE: Venture Capital (dry powder, TVPI/DPI/IRR, LP composition, SEC filings), Private Equity (EBITDA multiples, leverage ratios, operating partners), Hedge Funds (AUM, Sharpe, prime brokerage), Real Estate (cap rates, NOI, REITs), Government Contracting (NAICS, SAM.gov, procurement), and 9 more specialized domains.

OUTPUT STANDARDS: Structured JSON with uniform schemas, validated financial metrics, jurisdiction-matched legal entities, stage-specific contact matrices. Zero conversational padding for data queries. Financial consistency enforced (TVPI >= DPI, dry powder <= fund size).

Be concise, actionable, and data-rich. Use bullet points for lists. If you don't know something, say so honestly. Never fabricate data.`;

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
// Message Bubble
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

        {/* Bubble */}
        <div
          className={cn(
            'max-w-[90%] rounded-2xl px-4 py-3',
            isUser
              ? 'bg-emerald-500/10 border border-emerald-500/15 text-foreground/90 rounded-tr-md'
              : message.isError
              ? 'bg-red-500/5 border border-red-500/15 text-red-300/80 rounded-tl-md'
              : message.isResearchReport
              ? 'bg-secondary/10 border border-violet-500/10 rounded-tl-md'
              : 'text-foreground/85 rounded-tl-md',
            !isUser && !message.isError && !message.isResearchReport && 'bg-transparent',
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
      <div className="flex-1 overflow-y-auto px-2">
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
// Main View
// ============================================================

export function AIAssistantView() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);

  const { activeView } = useAppStore();
  const engine = useChatEngine();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 168) + 'px'; // max ~7 lines
  };

  const handleSend = async () => {
    if (!inputValue.trim() || engine.isStreaming || engine.isThinking) return;
    const msg = inputValue.trim();
    setInputValue('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await engine.sendMessage(msg, SYSTEM_PROMPT);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRegenerate = async (messageId: string) => {
    await engine.regenerateLastMessage(SYSTEM_PROMPT);
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-4 md:-m-6 lg:-m-8">
      {/* Left Sidebar — Conversations */}
      <div
        className={cn(
          'shrink-0 border-r border-border/20 bg-card/50 transition-all duration-300 flex flex-col',
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/15 shrink-0 bg-card/30">
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
              <p className="text-[10px] text-muted-foreground/40">Powered by GLM-4 — Deep Research Enabled</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={engine.clearActiveConversation}
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
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
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-card/90 border border-border/30 shadow-lg hover:bg-secondary/20 transition-all text-xs text-muted-foreground"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Scroll to bottom
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border/15 px-4 py-4 shrink-0 bg-card/30">
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
                  placeholder="Message LeadReach AI..."
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
              <span className="text-[10px] text-muted-foreground/20">LeadReach AI can make mistakes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
