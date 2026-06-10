'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Telescope,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  ExternalLink,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Users,
  BarChart3,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Star,
  RefreshCw,
  Target,
  Brain,
  MessageSquare,
  Send,
  Lightbulb,
  TrendingUp,
  Shield,
  Clock,
  Eye,
  PanelRightOpen,
  PanelRightClose,
  Activity,
  Bot,
  MessagesSquare,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { safeFetchJSON } from '@/lib/utils';
import type {
  AgentPersona,
  AgentMessage,
  AgentThinking,
  AgentAction,
  ProspectResult,
  ICPResult,
  OutreachResult,
  MarketResult,
  ScoreResult,
  ConversationContext,
  SuggestedAction,
  InsightItem,
  NavigationSuggestion,
  ViewType,
} from '@/lib/prospect-agent/types';
import { PERSONA_META } from '@/lib/prospect-agent/types';
import { AGENT_8_DISPLAY, type AgentCommMessage, type PipelineState, type AgentState } from '@/lib/prospect-agent/orchestrator-types';

// ============================================================
// Icon mapping for dynamic icon rendering
// ============================================================

const ICON_MAP: Record<string, React.ElementType> = {
  Plus, Star, Mail, Search, Building2, Target, User, Globe,
  Telescope, Sparkles, Zap, Users, BarChart3, Briefcase,
  TrendingUp, AlertCircle, Send, Lightbulb, ArrowRight,
  Clock, Eye, Activity, Bot,
};

// ============================================================
// Safe timestamp formatter
// ============================================================

function safeFormatTime(timestamp: Date | string | number | undefined | null): string {
  try {
    if (!timestamp) return '';
    const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString();
  } catch { return ''; }
}

// ============================================================
// Agent Status Badge Component
// ============================================================

function Agent8Badge({ agentKey, state, compact = false }: { agentKey: string; state?: AgentState; compact?: boolean }) {
  const display = AGENT_8_DISPLAY[agentKey];
  if (!display) return null;

  const statusColors: Record<string, string> = {
    idle: 'bg-muted/20 text-muted-foreground border-muted/30',
    thinking: 'bg-violet-500/10 text-violet-400 border-violet-500/30 animate-pulse',
    working: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  const colorClass = statusColors[state?.status || 'idle'] || statusColors.idle;

  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${colorClass} ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
      <span>{display.emoji}</span>
      <span className="font-medium">{display.name}</span>
      {state?.status === 'thinking' && <Clock className="h-2.5 w-2.5 animate-spin" />}
      {state?.status === 'working' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {state?.status === 'completed' && <CheckCircle2 className="h-2.5 w-2.5" />}
      {state?.status === 'failed' && <AlertCircle className="h-2.5 w-2.5" />}
    </div>
  );
}

// ============================================================
// Thinking Mode Indicator with Timer
// ============================================================

function ThinkingModeIndicator({ thinkStartTime, totalThinkTimeMs, phase }: {
  thinkStartTime: number | null;
  totalThinkTimeMs: number | null;
  phase: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!thinkStartTime || totalThinkTimeMs) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - thinkStartTime);
    }, 100);
    return () => clearInterval(interval);
  }, [thinkStartTime, totalThinkTimeMs]);

  const displayMs = totalThinkTimeMs || elapsed;

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400 animate-pulse" />
          <span className="text-xs font-semibold text-violet-400">
            {totalThinkTimeMs ? 'Thought' : 'Thinking'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-violet-400/60" />
          <span className="text-xs font-mono text-violet-400">
            {totalThinkTimeMs ? 'Thought' : 'Thinking'} for {Math.round(displayMs / 1000)}s
          </span>
          <span className="text-[9px] text-violet-400/50">
            ({displayMs}ms)
          </span>
        </div>
      </div>
      <div className="h-1 rounded-full bg-violet-500/10 overflow-hidden">
        <div
          className="h-full bg-violet-400 rounded-full transition-all duration-200"
          style={{ width: totalThinkTimeMs ? '100%' : `${Math.min(95, (displayMs / 30000) * 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-violet-400/60">
        Atlas is analyzing your query and planning the agent pipeline...
      </p>
    </div>
  );
}

// ============================================================
// Agent Communication Message
// ============================================================

function CommMessageBubble({ msg }: { msg: AgentCommMessage }) {
  const fromDisplay = msg.from === 'user' ? { emoji: '👤', name: 'You' } : AGENT_8_DISPLAY[msg.from] || { emoji: '🤖', name: msg.from };
  const toDisplay = msg.to === 'all' ? { emoji: '📢', name: 'All' } : AGENT_8_DISPLAY[msg.to] || { emoji: '🤖', name: msg.to };

  const typeColors: Record<string, string> = {
    request: 'border-l-cyan-500/50 bg-cyan-500/5',
    response: 'border-l-emerald-500/50 bg-emerald-500/5',
    broadcast: 'border-l-violet-500/50 bg-violet-500/5',
    handoff: 'border-l-amber-500/50 bg-amber-500/5',
    status: 'border-l-muted-foreground/50 bg-secondary/10',
  };

  const typeLabels: Record<string, string> = {
    request: '→',
    response: '✓',
    broadcast: '📢',
    handoff: '⟶',
    status: 'ℹ',
  };

  return (
    <div className={`rounded-md border-l-2 ${typeColors[msg.type] || typeColors.status} px-2.5 py-1.5`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[9px]">{fromDisplay.emoji}</span>
        <span className="text-[9px] font-semibold text-foreground/70">{fromDisplay.name}</span>
        <span className="text-[8px] text-muted-foreground/50">{typeLabels[msg.type]}</span>
        {msg.to !== 'user' && (
          <>
            <span className="text-[9px]">{toDisplay.emoji}</span>
            <span className="text-[9px] font-medium text-muted-foreground/60">{toDisplay.name}</span>
          </>
        )}
        <span className="text-[8px] text-muted-foreground/30 ml-auto">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-[10px] text-foreground/70 leading-relaxed">{msg.content}</p>
    </div>
  );
}

// ============================================================
// Agent Workspace Panel (Right Side)
// ============================================================

function AgentWorkspacePanel({
  pipelineState,
  thinkingElapsed,
  isProcessing,
  isOpen,
  onToggle,
}: {
  pipelineState: PipelineState;
  thinkingElapsed: number;
  isProcessing: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-20 bg-card/90 border border-border/30 border-r-0 rounded-l-lg px-2 py-3 hover:bg-card transition-colors"
        title="Open Agent Workspace"
      >
        <PanelRightOpen className="h-4 w-4 text-emerald-400" />
      </button>
    );
  }

  return (
    <div className="w-80 shrink-0 border-l border-border/30 bg-card/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-foreground/80">Agent Workspace</span>
        </div>
        <button onClick={onToggle} className="text-muted-foreground/50 hover:text-foreground transition-colors">
          <PanelRightClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Thinking Mode */}
          {(pipelineState.phase === 'thinking' || pipelineState.totalThinkTimeMs) && (
            <ThinkingModeIndicator
              thinkStartTime={pipelineState.thinkStartTime}
              totalThinkTimeMs={pipelineState.totalThinkTimeMs}
              phase={pipelineState.phase}
            />
          )}

          {/* Pipeline Progress */}
          <div className="rounded-lg border border-border/30 bg-secondary/10 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Pipeline</span>
              <span className="text-[9px] font-mono text-muted-foreground/50">
                {pipelineState.phase === 'idle' ? 'Ready' :
                 pipelineState.phase === 'thinking' ? 'Thinking...' :
                 pipelineState.phase === 'executing' ? 'Executing...' :
                 pipelineState.phase === 'synthesizing' ? 'Synthesizing...' :
                 pipelineState.phase === 'complete' ? 'Complete' : 'Error'}
              </span>
            </div>
            <Progress value={pipelineState.overallProgress} className="h-1.5 bg-secondary/40 [&>div]:bg-emerald-400" />
            <span className="text-[9px] text-muted-foreground/50 mt-1 block">{pipelineState.overallProgress}%</span>
          </div>

          {/* 8-Agent Status Grid */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Bot className="h-3 w-3 text-cyan-400" />
              <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">8-Agent System</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(AGENT_8_DISPLAY).map(([key, display]) => {
                const agentPersona: AgentPersona = key === 'atlas' || key === 'flow' ? 'navigator' :
                  key === 'forge' ? 'scout' :
                  key === 'sage' || key === 'echo' ? 'analyst' :
                  key === 'bard' ? 'scribe' :
                  key as AgentPersona;
                const state = pipelineState.agents[agentPersona];
                const isRelevant = isProcessing && state && state.status !== 'idle';

                return (
                  <div key={key} className={`rounded-md border p-1.5 ${isRelevant ? 'border-border/40 bg-secondary/10' : 'border-border/20 bg-transparent opacity-40'}`}>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]">{display.emoji}</span>
                      <span className="text-[9px] font-medium text-foreground/70">{display.name}</span>
                    </div>
                    <div className="mt-0.5">
                      {state?.status === 'thinking' && (
                        <span className="text-[8px] text-violet-400 flex items-center gap-0.5">
                          <Clock className="h-2 w-2 animate-spin" /> Thinking...
                        </span>
                      )}
                      {state?.status === 'working' && (
                        <span className="text-[8px] text-cyan-400 flex items-center gap-0.5">
                          <Loader2 className="h-2 w-2 animate-spin" /> {state.currentStep || 'Working...'}
                        </span>
                      )}
                      {state?.status === 'completed' && (
                        <span className="text-[8px] text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="h-2 w-2" /> {state.currentStep?.slice(0, 25) || 'Done'}
                        </span>
                      )}
                      {state?.status === 'failed' && (
                        <span className="text-[8px] text-red-400 flex items-center gap-0.5">
                          <AlertCircle className="h-2 w-2" /> Failed
                        </span>
                      )}
                      {state?.status === 'idle' && (
                        <span className="text-[8px] text-muted-foreground/40">{display.role}</span>
                      )}
                    </div>
                    {isRelevant && state.progress > 0 && (
                      <Progress value={state.progress} className="h-0.5 mt-1 bg-secondary/20 [&>div]:bg-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Communication Log */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MessagesSquare className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">
                Agent Communication
              </span>
              {pipelineState.commLog.length > 0 && (
                <Badge variant="outline" className="text-[8px] h-4 px-1 border-border/30 text-muted-foreground/50">
                  {pipelineState.commLog.length}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {pipelineState.commLog.length === 0 ? (
                <p className="text-[9px] text-muted-foreground/40 italic">Agent messages will appear here during processing...</p>
              ) : (
                pipelineState.commLog.map((msg) => (
                  <CommMessageBubble key={msg.id} msg={msg} />
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// Persona Badge Component
// ============================================================

function PersonaBadge({ persona, size = 'sm' }: { persona: AgentPersona; size?: 'sm' | 'lg' }) {
  const meta = PERSONA_META[persona];
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };
  const colorClass = colorMap[meta.color] || colorMap.emerald;
  const sizeClass = size === 'lg' ? 'text-xs px-2.5 py-1' : 'text-[9px] px-1.5 py-0.5';

  return (
    <Badge variant="outline" className={`${colorClass} ${sizeClass} font-medium gap-1`}>
      <span>{meta.emoji}</span>
      <span>{meta.name}</span>
    </Badge>
  );
}

// ============================================================
// Thinking Indicator
// ============================================================

function ThinkingIndicator({ thinking }: { thinking: AgentThinking }) {
  const [expanded, setExpanded] = useState(true);
  const meta = PERSONA_META[thinking.persona];

  return (
    <div className="rounded-lg border border-border/30 bg-secondary/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[10px] font-medium text-violet-400">Agent Thinking</span>
          <PersonaBadge persona={thinking.persona} />
          <span className="text-[9px] text-muted-foreground/50">
            {Math.round(thinking.confidence * 100)}% confidence
          </span>
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 py-2 space-y-2 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/70">{thinking.reasoning}</p>
          <div className="space-y-1">
            {thinking.plan.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-violet-400/50" />
                <span className="text-[9px] text-muted-foreground/60">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Action Step Indicator
// ============================================================

function ActionStepIndicator({ action }: { action: AgentAction }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-secondary/20 text-xs">
      {action.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />}
      {action.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
      {action.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
      {action.status === 'pending' && <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />}
      <span className={`font-medium ${
        action.status === 'running' ? 'text-cyan-400' :
        action.status === 'completed' ? 'text-emerald-400' :
        'text-muted-foreground'
      }`}>
        {action.label}
      </span>
      <span className="text-muted-foreground/60 text-[10px] flex-1 truncate">{action.message}</span>
    </div>
  );
}

// ============================================================
// Data Field, Section Card, Tag List (reused from original)
// ============================================================

function DataField({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | null | undefined; href?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</span>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block text-xs text-cyan-400 hover:text-cyan-300 truncate">
            {value} <ExternalLink className="h-2.5 w-2.5 inline" />
          </a>
        ) : (
          <p className="text-xs text-foreground/90 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 bg-secondary/20 hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground/80">{title}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-3 py-2 space-y-0.5">{children}</div>}
    </div>
  );
}

function TagList({ items, color = 'cyan' }: { items: string[]; color?: string }) {
  if (!items || items.length === 0) return null;
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
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

function SuggestedActionButtons({ actions, onAction }: { actions: SuggestedAction[]; onAction: (prompt: string) => void }) {
  if (!actions || actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, i) => {
        const Icon = ICON_MAP[action.icon] || Sparkles;
        return (
          <Button key={i} variant="outline" size="sm"
            className="text-[10px] h-7 gap-1.5 border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors"
            onClick={() => onAction(action.prompt)}
          >
            <Icon className="h-3 w-3" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================
// Prospect Data Card
// ============================================================

function ProspectDataCard({ prospect, messageId, converted, leadId, onConvert, onViewLeads }: {
  prospect: ProspectResult; messageId: string; converted?: boolean; leadId?: string;
  onConvert: (msgId: string, p: ProspectResult) => void; onViewLeads: () => void;
}) {
  const completenessColor = (pct: number) => pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400';
  const completenessBarColor = (pct: number) => pct >= 70 ? '[&>div]:bg-emerald-400' : pct >= 40 ? '[&>div]:bg-amber-400' : '[&>div]:bg-red-400';

  return (
    <Card className="border-border/30 ml-9">
      <CardContent className="p-4 space-y-3">
        {prospect.companyName && (
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-bold text-foreground/90">{prospect.companyName}</h4>
              {prospect.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{prospect.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <Progress value={prospect.dataCompleteness} className={`h-1.5 w-16 bg-secondary/40 ${completenessBarColor(prospect.dataCompleteness)}`} />
              <span className={`text-xs font-bold ${completenessColor(prospect.dataCompleteness)}`}>{prospect.dataCompleteness}%</span>
            </div>
          </div>
        )}
        {prospect.personName && !prospect.companyName && (
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-bold text-foreground/90">{prospect.personName}</h4>
              {prospect.personTitle && <p className="text-xs text-cyan-400">{prospect.personTitle}</p>}
              {prospect.personBio && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{prospect.personBio}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <Progress value={prospect.dataCompleteness} className={`h-1.5 w-16 bg-secondary/40 ${completenessBarColor(prospect.dataCompleteness)}`} />
              <span className={`text-xs font-bold ${completenessColor(prospect.dataCompleteness)}`}>{prospect.dataCompleteness}%</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <SectionCard title="Contact" icon={Mail}>
            <DataField icon={Mail} label="Email" value={prospect.generalEmail} href={prospect.generalEmail ? `mailto:${prospect.generalEmail}` : null} />
            <DataField icon={Phone} label="Phone" value={prospect.phoneMain} href={prospect.phoneMain ? `tel:${prospect.phoneMain}` : null} />
            <DataField icon={Globe} label="Website" value={prospect.website} href={prospect.website} />
          </SectionCard>
          <SectionCard title="Location" icon={MapPin}>
            <DataField icon={MapPin} label="City" value={prospect.city} />
            <DataField icon={MapPin} label="Country" value={prospect.country} />
          </SectionCard>
          <SectionCard title="Firmographics" icon={BarChart3}>
            <DataField icon={Users} label="Employees" value={prospect.employeeCount} />
            <DataField icon={DollarSign} label="Revenue" value={prospect.revenueEstimate} />
            <DataField icon={Building2} label="Industry" value={prospect.industry} />
          </SectionCard>
          <SectionCard title="Key People" icon={Users}>
            <DataField icon={Star} label="CEO" value={prospect.ceoName} />
            <DataField icon={Mail} label="CEO Email" value={prospect.ceoEmail} href={prospect.ceoEmail ? `mailto:${prospect.ceoEmail}` : null} />
          </SectionCard>
          <SectionCard title="Digital" icon={Globe}>
            <DataField icon={Linkedin} label="LinkedIn" value={prospect.linkedinUrl} href={prospect.linkedinUrl} />
            <DataField icon={Twitter} label="Twitter/X" value={prospect.twitterHandle} />
          </SectionCard>
          <SectionCard title="Products & Tech" icon={FileText} defaultOpen={(prospect.productsServices?.length || 0) > 0}>
            <TagList items={prospect.productsServices || []} color="emerald" />
            {prospect.techStack?.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Tech Stack</span>
                <TagList items={prospect.techStack} color="violet" />
              </div>
            )}
            <DataField icon={DollarSign} label="Funding" value={prospect.fundingInfo} />
          </SectionCard>
        </div>
        {prospect.recentNews?.length > 0 && (
          <SectionCard title="Recent News" icon={FileText} defaultOpen={false}>
            {prospect.recentNews.map((news, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{news}</p>
              </div>
            ))}
          </SectionCard>
        )}
        {prospect.detectedDomain && prospect.detectedDomain !== 'general' && (
          <div className="rounded-md bg-violet-500/5 border border-violet-500/15 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400">
                {prospect.domainLabel || 'Domain Intelligence'} — 4-Phase Pipeline Active
              </span>
            </div>
            {prospect.domainData && prospect.domainData.length > 0 ? (
              <div className="space-y-2">
                {prospect.domainData.slice(0, 3).map((record, idx) => (
                  <div key={idx} className="rounded bg-background/50 border border-border/20 p-2">
                    {Object.entries(record).filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object').slice(0, 6).map(([key, val]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                        <span className="text-[11px] text-foreground/80 truncate">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">Domain-specific research completed.</p>
            )}
          </div>
        )}
        {prospect.sources?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] text-muted-foreground/50">Sources:</span>
            {prospect.sources.slice(0, 5).map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="text-[9px] text-cyan-400/70 hover:text-cyan-400 truncate max-w-[150px]">
                {src.replace(/^https?:\/\//, '').split('/')[0]}
              </a>
            ))}
            {prospect.sources.length > 5 && <span className="text-[9px] text-muted-foreground/50">+{prospect.sources.length - 5} more</span>}
          </div>
        )}
        <div className="flex items-center gap-2 pt-2">
          {converted ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Added to Leads</span>
              <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground hover:text-foreground gap-1 h-6" onClick={onViewLeads}>
                View in Leads <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => onConvert(messageId, prospect)} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all text-xs h-8">
              <Plus className="h-3.5 w-3.5" />Add to Leads
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ICP, Market, Score, Outreach, Insights Cards
// (Simplified from original — same functionality)
// ============================================================

function ICPDataCard({ icp }: { icp: ICPResult }) {
  return (
    <Card className="border-amber-500/20 ml-9">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-400" />
          <h4 className="text-sm font-bold text-foreground/90">{icp.name}</h4>
        </div>
        {icp.description && <p className="text-xs text-muted-foreground">{icp.description}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {icp.firmographic.industries.length > 0 && <SectionCard title="Industries" icon={Briefcase}><TagList items={icp.firmographic.industries} color="emerald" /></SectionCard>}
          {icp.firmographic.companySizes.length > 0 && <SectionCard title="Company Sizes" icon={Users}><TagList items={icp.firmographic.companySizes} color="cyan" /></SectionCard>}
          {icp.psychographic.challenges.length > 0 && <SectionCard title="Challenges" icon={AlertCircle}><TagList items={icp.psychographic.challenges} color="rose" /></SectionCard>}
          {icp.behavioral.buyingSignals.length > 0 && <SectionCard title="Buying Signals" icon={TrendingUp}><TagList items={icp.behavioral.buyingSignals} color="emerald" /></SectionCard>}
        </div>
      </CardContent>
    </Card>
  );
}

function MarketDataCard({ market }: { market: MarketResult }) {
  return (
    <Card className="border-violet-500/20 ml-9">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-violet-400" />
          <h4 className="text-sm font-bold text-foreground/90">Market Analysis: {market.query}</h4>
        </div>
        {market.summary && <p className="text-xs text-muted-foreground">{market.summary}</p>}
        {market.keyFindings.length > 0 && (
          <SectionCard title="Key Findings" icon={Lightbulb}>
            {market.keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                <p className="text-xs text-foreground/80">{f}</p>
              </div>
            ))}
          </SectionCard>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreDataCard({ score }: { score: ScoreResult }) {
  const tierColor: Record<string, string> = { ideal: 'text-emerald-400', strong: 'text-cyan-400', moderate: 'text-amber-400', weak: 'text-orange-400', poor: 'text-red-400' };
  return (
    <Card className="border-rose-500/20 ml-9">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-rose-400" /><h4 className="text-sm font-bold text-foreground/90">Lead Score</h4></div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${tierColor[score.tier] || 'text-foreground'}`}>{score.overallScore}</span>
            <Badge variant="outline" className={`text-[9px] ${tierColor[score.tier]}`}>{score.tier}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(score.dimensions).map(([key, dim]) => (
            <div key={key} className="rounded-lg border border-border/30 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground capitalize">{key}</span>
                <span className="text-xs font-medium text-foreground/80">{dim.score}</span>
              </div>
              <Progress value={dim.score} className="h-1 bg-secondary/40 [&>div]:bg-violet-400" />
              <p className="text-[9px] text-muted-foreground/60 mt-1 line-clamp-2">{dim.reasoning}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OutreachDataCard({ outreach }: { outreach: OutreachResult }) {
  return (
    <Card className="border-sky-500/20 ml-9">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-sky-400" />
          <h4 className="text-sm font-bold text-foreground/90 capitalize">{outreach.channel} Outreach</h4>
          <Badge variant="outline" className="text-[9px] border-sky-500/20 text-sky-400">{outreach.tone}</Badge>
        </div>
        {outreach.subject && <div><span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Subject</span><p className="text-sm font-medium text-foreground/90">{outreach.subject}</p></div>}
        <div><span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Message</span>
          <div className="rounded-lg bg-secondary/20 p-3 mt-1"><p className="text-xs text-foreground/80 whitespace-pre-wrap">{outreach.body}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightsPanel({ insights }: { insights: InsightItem[] }) {
  if (!insights || insights.length === 0) return null;
  const typeConfig: Record<string, { color: string; bg: string; border: string }> = {
    opportunity: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    alignment: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    risk: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    action: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    gap: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  };

  return (
    <div className="ml-9 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Actionable Insights</span>
      </div>
      {insights.map((insight) => {
        const config = typeConfig[insight.type] || typeConfig.opportunity;
        return (
          <div key={insight.id} className={`rounded-lg border ${config.border} ${config.bg} p-2.5 flex items-start gap-2.5`}>
            <Lightbulb className={`h-4 w-4 ${config.color} mt-0.5 shrink-0`} />
            <div className="min-w-0 flex-1">
              <span className={`text-xs font-semibold ${config.color}`}>{insight.title}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NavigationButtons({ suggestions, onNavigate }: { suggestions: NavigationSuggestion[]; onNavigate: (view: ViewType) => void }) {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="ml-9 flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion, i) => (
        <Button key={i} variant="outline" size="sm"
          className="text-[10px] h-7 gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 transition-all"
          onClick={() => onNavigate(suggestion.targetView)} title={suggestion.reason}
        >
          <ArrowRight className="h-3 w-3" />{suggestion.label}
        </Button>
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ProspectDiscoveryView() {
  const { setActiveView } = useAppStore();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {},
  });
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    phase: 'idle', thinkStartTime: null, totalThinkTimeMs: null,
    agents: {
      scout: { persona: 'scout', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
      hound: { persona: 'hound', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
      analyst: { persona: 'analyst', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
      architect: { persona: 'architect', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
      judge: { persona: 'judge', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
      scribe: { persona: 'scribe', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
      navigator: { persona: 'navigator', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
    },
    commLog: [], currentStep: '', overallProgress: 0,
  });
  const [thinkingElapsed, setThinkingElapsed] = useState(0);
  const [aiHealth, setAiHealth] = useState<'healthy' | 'degraded' | 'down' | 'checking' | 'unknown'>('unknown');
  const [saveNotification, setSaveNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check AI health on mount
  useEffect(() => {
    const checkHealth = async () => {
      setAiHealth('checking');
      try {
        const res = await fetch('/api/prospect-discovery/health');
        if (res.ok) { const data = await res.json(); setAiHealth(data.overall || 'unknown'); }
        else setAiHealth('unknown');
      } catch { setAiHealth('unknown'); }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 120_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSearching]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto-hide notification
  useEffect(() => {
    if (saveNotification) { const t = setTimeout(() => setSaveNotification(null), 4000); return () => clearTimeout(t); }
  }, [saveNotification]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || query).trim();
    if (!text || isSearching) return;
    setQuery('');

    // Add user message
    const userMsg: AgentMessage = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsSearching(true);

    // Reset pipeline state for new query
    setPipelineState({
      phase: 'thinking', thinkStartTime: Date.now(), totalThinkTimeMs: null,
      agents: {
        scout: { persona: 'scout', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
        hound: { persona: 'hound', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
        analyst: { persona: 'analyst', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
        architect: { persona: 'architect', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
        judge: { persona: 'judge', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
        scribe: { persona: 'scribe', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
        navigator: { persona: 'navigator', status: 'thinking', currentStep: 'Classifying intent', progress: 0, startedAt: Date.now(), completedAt: null, thinkTimeMs: null },
      },
      commLog: [], currentStep: 'Classifying intent', overallProgress: 5,
    });

    // Create a placeholder agent message
    const agentMsgId = `agent-${Date.now()}`;
    const liveAgentMsg: AgentMessage = {
      id: agentMsgId, role: 'assistant', content: '', timestamp: new Date(),
      persona: 'scout', thinking: undefined, actions: [], prospectData: undefined,
    };
    setMessages(prev => [...prev, liveAgentMsg]);

    // Merge helper
    const mergeProspectData = (existing: ProspectResult | undefined, partial: Partial<ProspectResult> | undefined): ProspectResult | undefined => {
      if (!partial) return existing;
      if (!existing) return partial as ProspectResult;
      const merged = { ...existing };
      for (const [key, value] of Object.entries(partial)) {
        if (value !== null && value !== undefined && value !== '') {
          const existingVal = (merged as Record<string, unknown>)[key];
          if (existingVal === null || existingVal === undefined || existingVal === '' || (Array.isArray(existingVal) && (existingVal as unknown[]).length === 0)) {
            (merged as Record<string, unknown>)[key] = value;
          }
        }
      }
      return merged;
    };

    try {
      // Try SSE streaming with the new orchestrator
      const response = await fetch('/api/prospect-discovery/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !response.body || (!contentType.includes('text/event-stream') && !contentType.includes('text/plain'))) {
        throw new Error(`Stream failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = '';
      const liveSteps: AgentAction[] = [];
      let liveProspect: ProspectResult | undefined;
      let liveInsights: InsightItem[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            let data: any;
            try { data = JSON.parse(line.slice(6)); } catch { continue; }

            // Handle all orchestrator events
            switch (currentEventType) {
              case 'thinking_start':
                setPipelineState(prev => ({ ...prev, phase: 'thinking', thinkStartTime: data.timestamp }));
                break;

              case 'thinking_tick':
                setThinkingElapsed(data.elapsedMs);
                break;

              case 'thinking_end':
                setPipelineState(prev => ({ ...prev, totalThinkTimeMs: data.totalMs }));
                if (data.classification) {
                  const thinking: AgentThinking = {
                    persona: data.classification.persona || 'scout',
                    intent: data.classification.intent || 'research_company',
                    reasoning: data.classification.reasoning || 'Classified',
                    plan: data.classification.plan || ['Execute research pipeline'],
                    confidence: data.classification.confidence || 0.8,
                  };
                  setMessages(prev => prev.map(m =>
                    m.id === agentMsgId ? { ...m, persona: thinking.persona, thinking } : m
                  ));
                }
                break;

              case 'agent_status':
                if (data.agent && data.state) {
                  setPipelineState(prev => ({
                    ...prev,
                    agents: { ...prev.agents, [data.agent]: data.state },
                  }));
                }
                break;

              case 'agent_comm':
                if (data) {
                  setPipelineState(prev => ({
                    ...prev,
                    commLog: [...prev.commLog, data],
                  }));
                }
                break;

              case 'thinking':
                if (data) {
                  setMessages(prev => prev.map(m =>
                    m.id === agentMsgId ? { ...m, persona: data.persona || 'scout', thinking: data } : m
                  ));
                }
                break;

              case 'step_start':
                if (data) {
                  liveSteps.push({ type: data.label || 'research', label: data.label || 'Research', status: 'running', message: data.message || 'Starting...' });
                  setMessages(prev => prev.map(m =>
                    m.id === agentMsgId ? { ...m, actions: [...liveSteps] } : m
                  ));
                }
                break;

              case 'step_progress':
                if (data) {
                  const stepIdx = data.stepIndex ?? (liveSteps.length - 1);
                  if (liveSteps[stepIdx]) {
                    liveSteps[stepIdx] = { ...liveSteps[stepIdx], message: data.message || liveSteps[stepIdx].message };
                    setMessages(prev => prev.map(m =>
                      m.id === agentMsgId ? { ...m, actions: [...liveSteps] } : m
                    ));
                  }
                }
                break;

              case 'step_complete':
                if (data) {
                  const stepIdx = data.stepIndex ?? (liveSteps.length - 1);
                  if (liveSteps[stepIdx]) {
                    liveSteps[stepIdx] = { ...liveSteps[stepIdx], status: data.status || 'completed', message: data.message || liveSteps[stepIdx].message };
                  }
                  if (data.partialData) {
                    liveProspect = mergeProspectData(liveProspect, data.partialData);
                  }
                  setMessages(prev => prev.map(m =>
                    m.id === agentMsgId ? { ...m, actions: [...liveSteps], prospectData: liveProspect } : m
                  ));
                }
                break;

              case 'data_update':
                if (data) {
                  liveProspect = mergeProspectData(liveProspect, data.prospect);
                  setMessages(prev => prev.map(m =>
                    m.id === agentMsgId ? { ...m, prospectData: liveProspect } : m
                  ));
                }
                break;

              case 'insight':
                if (data?.insight) {
                  liveInsights = [...liveInsights, data.insight];
                  setMessages(prev => prev.map(m =>
                    m.id === agentMsgId ? { ...m, insights: liveInsights.length > 0 ? liveInsights : undefined } : m
                  ));
                }
                break;

              case 'pipeline_progress':
                if (data) {
                  setPipelineState(prev => ({
                    ...prev,
                    phase: data.phase || prev.phase,
                    overallProgress: data.overallProgress ?? prev.overallProgress,
                  }));
                }
                break;

              case 'error':
                console.warn('[ProspectDiscovery] SSE error:', data?.message);
                break;

              case 'done':
                if (data?.message) {
                  setMessages(prev => prev.map(m => {
                    if (m.id !== agentMsgId) return m;
                    return { ...data.message, id: agentMsgId, converted: m.converted, leadId: m.leadId };
                  }));
                }
                if (data?.updatedContext) setContext(data.updatedContext);
                if (data?.suggestedActions) setSuggestedActions(data.suggestedActions);
                if (data?.pipelineState) setPipelineState(data.pipelineState);
                break;
            }
          }
          if (!line.startsWith('event: ') && !line.startsWith('data: ') && !line.startsWith(': ')) {
            currentEventType = '';
          }
        }
      }
    } catch (streamError) {
      console.warn('[ProspectDiscovery] SSE failed, falling back:', streamError instanceof Error ? streamError.message : 'Unknown');
      setMessages(prev => prev.filter(m => m.id !== agentMsgId));

      try {
        const result = await safeFetchJSON<{
          success: boolean; message: AgentMessage; updatedContext: ConversationContext;
          suggestedActions: SuggestedAction[]; error?: string;
        }>('/api/prospect-discovery/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, context }),
        });

        if (result.success && result.message) {
          setMessages(prev => [...prev, result.message]);
          setContext(result.updatedContext);
          setSuggestedActions(result.suggestedActions || []);
        } else {
          setMessages(prev => [...prev, {
            id: `error-${Date.now()}`, role: 'system',
            content: result.error || 'The agent encountered an error. Please try again.',
            timestamp: new Date(),
          }]);
        }
      } catch {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`, role: 'assistant',
          content: "I'm having trouble connecting to the AI service right now. Please try again in a few seconds.",
          timestamp: new Date(), persona: 'navigator',
          thinking: { persona: 'navigator', intent: 'converse', reasoning: 'Both stream and chat API failed', plan: ['Error recovery'], confidence: 0.3 },
        }]);
      }
    }

    setIsSearching(false);
    setPipelineState(prev => ({ ...prev, phase: 'complete', overallProgress: 100 }));
    inputRef.current?.focus();
  }, [query, isSearching, messages, context]);

  const handleConvertToLead = async (messageId: string, prospect: ProspectResult) => {
    try {
      const result = await safeFetchJSON<{ success: boolean; leadId: string; message: string; error?: string }>('/api/prospect-discovery/convert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prospect }),
      });
      if (result.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, converted: true, leadId: result.leadId } : m));
        setSaveNotification({ type: 'success', message: 'Prospect converted to lead!' });
      }
    } catch (error) {
      setSaveNotification({ type: 'error', message: `Failed: ${error instanceof Error ? error.message : 'Unknown'}` });
    }
  };

  const handleNavigate = useCallback((view: ViewType) => { setActiveView(view); }, [setActiveView]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Telescope className="h-6 w-6 text-emerald-400" />
              Prospect Discovery
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              8-Agent AI pipeline — research, enrich, analyze, qualify, and outreach
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/20" title={`AI: ${aiHealth}`}>
              {aiHealth === 'healthy' && <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
              {aiHealth === 'degraded' && <div className="h-2 w-2 rounded-full bg-amber-400" />}
              {aiHealth === 'down' && <div className="h-2 w-2 rounded-full bg-red-400" />}
              {aiHealth === 'unknown' && <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
              {aiHealth === 'checking' && <Loader2 className="h-2 w-2 animate-spin text-amber-400" />}
              <span className={`text-[9px] font-medium ${
                aiHealth === 'healthy' ? 'text-emerald-400' :
                aiHealth === 'degraded' ? 'text-amber-400' :
                aiHealth === 'down' ? 'text-red-400' : 'text-muted-foreground/50'
              }`}>
                {aiHealth === 'checking' ? 'Checking...' : aiHealth === 'healthy' ? 'AI Online' : aiHealth === 'degraded' ? 'AI Degraded' : aiHealth === 'down' ? 'AI Offline' : 'AI Status Unknown'}
              </span>
            </div>
            <Button variant="ghost" size="sm"
              className={`text-[10px] gap-1 ${workspaceOpen ? 'text-emerald-400' : 'text-muted-foreground'}`}
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
            >
              {workspaceOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
              {workspaceOpen ? 'Hide Workspace' : 'Show Workspace'}
            </Button>
          </div>
        </div>

        {/* Notification Toast */}
        {saveNotification && (
          <div className={`mb-2 rounded-lg px-3 py-2 text-xs font-medium ${saveNotification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {saveNotification.message}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 min-h-0 rounded-xl border border-border/30 bg-card/50 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
            <div className="p-4 space-y-4">
              {/* Empty State */}
              {messages.length === 0 && !isSearching && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="relative mb-5">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                      <Telescope className="h-10 w-10 text-emerald-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground/90 mb-2">8-Agent AI Pipeline Ready</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-5">
                    Atlas orchestrates Scout, Forge, Sage, Judge, Bard, Flow & Echo to research, enrich, analyze, qualify, and compose outreach — all in one conversation.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl w-full">
                    {[
                      { emoji: '🔍', label: 'Research Company', example: 'Tell me about Stripe', color: 'emerald' },
                      { emoji: '🐕', label: 'Find a Person', example: 'Find Patrick Collison', color: 'cyan' },
                      { emoji: '📊', label: 'Analyze Market', example: 'SaaS market trends 2026', color: 'violet' },
                      { emoji: '🏗️', label: 'Build an ICP', example: 'Build an ICP for B2B SaaS', color: 'amber' },
                      { emoji: '⚖️', label: 'Score a Lead', example: 'Is Stripe a good lead?', color: 'rose' },
                      { emoji: '✍️', label: 'Compose Outreach', example: 'Write an email to Stripe', color: 'sky' },
                      { emoji: '🧠', label: 'Compete Analysis', example: 'HubSpot vs Salesforce', color: 'indigo' },
                      { emoji: '🔗', label: 'Analyze Website', example: 'https://stripe.com', color: 'emerald' },
                    ].map((item) => (
                      <button key={item.label} onClick={() => handleSendMessage(item.example)}
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
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {msg.role === 'user' && (
                    <div className="flex justify-end">
                      <div className="max-w-md rounded-2xl rounded-br-md bg-emerald-500/15 border border-emerald-500/20 px-4 py-2.5">
                        <p className="text-sm text-foreground/90">{msg.content}</p>
                        <p className="text-[9px] text-muted-foreground/50 mt-1">{safeFormatTime(msg.timestamp)}</p>
                      </div>
                    </div>
                  )}

                  {msg.role === 'system' && (
                    <div className="flex justify-center">
                      <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 max-w-md">
                        <p className="text-xs text-red-400">{msg.content}</p>
                      </div>
                    </div>
                  )}

                  {msg.role === 'assistant' && (
                    <div className="flex justify-start">
                      <div className="max-w-3xl w-full space-y-3">
                        {/* Agent Header */}
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          </div>
                          <PersonaBadge persona={msg.persona || 'navigator'} size="lg" />
                          <span className="text-[9px] text-muted-foreground/50">{safeFormatTime(msg.timestamp)}</span>
                        </div>

                        {/* Thinking Indicator */}
                        {msg.thinking && <div className="ml-9"><ThinkingIndicator thinking={msg.thinking} /></div>}

                        {/* Discovery Progress Panel */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="ml-9 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Search className="h-3.5 w-3.5 text-cyan-400" />
                              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                                {isSearching && msg.id === messages[messages.length - 1]?.id ? 'Discovery in Progress' : 'Discovery Steps'}
                              </span>
                              {msg.prospectData && (
                                <span className={`text-[9px] font-bold ml-auto ${
                                  msg.prospectData.dataCompleteness >= 70 ? 'text-emerald-400' :
                                  msg.prospectData.dataCompleteness >= 40 ? 'text-amber-400' : 'text-red-400'
                                }`}>{msg.prospectData.dataCompleteness}% complete</span>
                              )}
                            </div>
                            {msg.actions.map((action, i) => <ActionStepIndicator key={i} action={action} />)}
                          </div>
                        )}

                        {/* Conversational Response */}
                        {msg.content && (
                          <div className="ml-9 rounded-2xl rounded-bl-md bg-secondary/20 border border-border/30 px-4 py-3">
                            <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        )}

                        {/* Streaming loading indicator */}
                        {isSearching && msg.id === messages[messages.length - 1]?.id && !msg.content && (!msg.prospectData || !msg.prospectData.companyName) && (
                          <div className="ml-9 flex items-center gap-2 text-muted-foreground/50">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-xs">Agent pipeline is processing...</span>
                          </div>
                        )}

                        {/* Data Cards */}
                        {msg.prospectData && <ProspectDataCard prospect={msg.prospectData} messageId={msg.id} converted={msg.converted} leadId={msg.leadId} onConvert={handleConvertToLead} onViewLeads={() => setActiveView('leads')} />}
                        {msg.icpData && <ICPDataCard icp={msg.icpData} />}
                        {msg.marketData && <MarketDataCard market={msg.marketData} />}
                        {msg.scoreData && <ScoreDataCard score={msg.scoreData} />}
                        {msg.outreachData && <OutreachDataCard outreach={msg.outreachData} />}
                        {msg.insights && msg.insights.length > 0 && <InsightsPanel insights={msg.insights} />}
                        {msg.navigation && msg.navigation.length > 0 && <NavigationButtons suggestions={msg.navigation} onNavigate={handleNavigate} />}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Searching State */}
              {isSearching && (
                <div className="flex justify-start">
                  <div className="max-w-md space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                      </div>
                      <span className="text-xs font-medium text-foreground/80">8-Agent Pipeline Active</span>
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-secondary/20 border border-border/30 px-4 py-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                        <span className="text-xs text-violet-400 font-medium">
                          {pipelineState.phase === 'thinking' ? `Thinking for ${Math.round(thinkingElapsed / 1000)}s...` :
                           pipelineState.phase === 'executing' ? 'Executing agent pipeline...' :
                           pipelineState.phase === 'synthesizing' ? 'Synthesizing response...' :
                           'Processing your request...'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin text-cyan-400" /><span className="text-xs text-muted-foreground">Atlas is coordinating agents...</span></div>
                        <div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin text-violet-400" style={{ animationDelay: '0.5s' }} /><span className="text-xs text-muted-foreground">Scout & Forge are researching...</span></div>
                        <div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin text-amber-400" style={{ animationDelay: '1s' }} /><span className="text-xs text-muted-foreground">Echo is generating insights...</span></div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 mt-3">Watch the Agent Workspace for real-time details →</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Actions Bar */}
          {suggestedActions.length > 0 && !isSearching && (
            <div className="border-t border-border/20 px-4 py-2 bg-card/60">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-[9px] text-muted-foreground/50 shrink-0">Next:</span>
                {suggestedActions.map((action, i) => {
                  const Icon = ICON_MAP[action.icon] || Sparkles;
                  return (
                    <Button key={i} variant="ghost" size="sm"
                      className="text-[10px] h-6 gap-1 text-muted-foreground hover:text-emerald-400 shrink-0"
                      onClick={() => handleSendMessage(action.prompt)}
                    >
                      <Icon className="h-3 w-3" />{action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="border-t border-border/30 p-3 bg-card/80">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input ref={inputRef}
                  placeholder="Ask anything — research companies, find people, analyze markets, build ICPs..."
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown} disabled={isSearching}
                  className="pl-10 pr-4 bg-secondary/20 border-border/40 focus:border-emerald-500/30 h-11 text-sm"
                />
              </div>
              <Button onClick={() => handleSendMessage()}
                disabled={!query.trim() || isSearching}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all h-11 px-6"
              >
                {isSearching ? <><Loader2 className="h-4 w-4 animate-spin" />Working...</> : <><Send className="h-4 w-4" />Send</>}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground/40 mt-1.5 text-center">
              Powered by 8 specialist AI agents — Atlas, Scout, Forge, Sage, Judge, Bard, Flow & Echo
            </p>
          </div>
        </div>
      </div>

      {/* Agent Workspace Panel (Right Side) */}
      <AgentWorkspacePanel
        pipelineState={pipelineState}
        thinkingElapsed={thinkingElapsed}
        isProcessing={isSearching}
        isOpen={workspaceOpen}
        onToggle={() => setWorkspaceOpen(!workspaceOpen)}
      />
    </div>
  );
}
