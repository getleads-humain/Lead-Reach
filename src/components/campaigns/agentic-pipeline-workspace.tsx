'use client';

/**
 * AgenticPipelineWorkspace
 * ========================
 * A transparent, live workspace that makes the entire 8-agent pipeline
 * process visible to users. Replaces the basic agent grid + log with
 * a rich, multi-panel workspace showing:
 *
 *   1. Pipeline Architecture — visual flow diagram of the 8 agents
 *   2. Agent Details — per-agent expandable cards with I/O, thinking, status
 *   3. Event Stream — structured, color-coded, filterable event log
 *   4. Lead Tracker — track each lead through the pipeline stages
 *   5. Agent Comms — inter-agent communication messages
 *
 * All data flows from SSE events consumed by CampaignDetailView.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  Database,
  Globe,
  Scale,
  Mail,
  GitBranch,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Activity,
  ArrowRight,
  Filter,
  X,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Radio,
  MessageSquare,
  Layers,
  Cpu,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AGENT_8_DISPLAY } from '@/lib/prospect-agent/orchestrator-types';

// ── Types ──────────────────────────────────────────────────────────

type WorkspaceTab = 'architecture' | 'agents' | 'events' | 'leads' | 'comms';
type AgentStatus = 'idle' | 'thinking' | 'working' | 'completed' | 'failed' | 'skipped' | 'waiting';

interface AgentState {
  persona: string;
  status: AgentStatus;
  currentStep: string;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  thinkTimeMs?: number | null;
}

interface CommMessage {
  from: string;
  to: string;
  type: string;
  content: string;
  timestamp: string;
}

interface PipelineLogEntry {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface LiveLead {
  id: string;
  companyName: string;
  website: string | null;
  stage: 'new' | 'enriched' | 'failed';
  dataCompleteness: number;
  snippet?: string;
  processingAgent?: string;
}

interface PipelineWorkspaceProps {
  pipelineRunning: boolean;
  pipelineState: {
    phase: string;
    overallProgress: number;
    agents: Record<string, AgentState>;
    commLog: CommMessage[];
  } | null;
  pipelineLog: PipelineLogEntry[];
  liveLeads: LiveLead[];
  currentEnrichmentIdx: number;
  enrichmentTotal: number;
  thinkingMs: number;
  campaignName: string;
  discoveryQuery?: string;
  pipelineSummary?: { discovered: number; enriched: number; failed: number; skipped: number } | null;
}

// ── Agent Icon Mapping ─────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ElementType> = {
  atlas: Brain,
  scout: Search,
  forge: Database,
  sage: Globe,
  judge: Scale,
  bard: Mail,
  flow: GitBranch,
  echo: BarChart3,
};

const AGENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string; ring: string }> = {
  atlas:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/40',  text: 'text-indigo-400',  glow: 'shadow-indigo-500/20', ring: 'ring-indigo-500/50' },
  scout:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', ring: 'ring-emerald-500/50' },
  forge:  { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/40',    text: 'text-cyan-400',    glow: 'shadow-cyan-500/20', ring: 'ring-cyan-500/50' },
  sage:   { bg: 'bg-violet-500/10',  border: 'border-violet-500/40',  text: 'text-violet-400',  glow: 'shadow-violet-500/20', ring: 'ring-violet-500/50' },
  judge:  { bg: 'bg-rose-500/10',    border: 'border-rose-500/40',    text: 'text-rose-400',    glow: 'shadow-rose-500/20', ring: 'ring-rose-500/50' },
  bard:   { bg: 'bg-sky-500/10',     border: 'border-sky-500/40',     text: 'text-sky-400',     glow: 'shadow-sky-500/20', ring: 'ring-sky-500/50' },
  flow:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   text: 'text-amber-400',   glow: 'shadow-amber-500/20', ring: 'ring-amber-500/50' },
  echo:   { bg: 'bg-teal-500/10',    border: 'border-teal-500/40',    text: 'text-teal-400',    glow: 'shadow-teal-500/20', ring: 'ring-teal-500/50' },
};

const STATUS_STYLES: Record<AgentStatus, { bg: string; text: string; icon: React.ElementType }> = {
  idle:     { bg: 'bg-zinc-500/10', text: 'text-zinc-400', icon: Clock },
  thinking: { bg: 'bg-violet-500/10', text: 'text-violet-400', icon: Brain },
  working:  { bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: Loader2 },
  waiting:  { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
  completed:{ bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
  failed:   { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertTriangle },
  skipped:  { bg: 'bg-zinc-500/5', text: 'text-zinc-500', icon: EyeOff },
};

// ── Pipeline Architecture Flow ─────────────────────────────────────

function PipelineArchitecture({ agents, pipelineRunning, pipelinePhase, overallProgress, discoveryQuery }: {
  agents: Record<string, AgentState>;
  pipelineRunning: boolean;
  pipelinePhase: string;
  overallProgress: number;
  discoveryQuery?: string;
}) {
  const agentKeys = Object.keys(AGENT_8_DISPLAY);

  return (
    <div className="space-y-4">
      {/* Discovery Query Banner */}
      {discoveryQuery && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <Search className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="text-xs text-cyan-300 truncate">{discoveryQuery}</span>
        </div>
      )}

      {/* Pipeline Flow Diagram */}
      <div className="relative">
        {/* Phase Indicators */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${
            pipelinePhase === 'discovery' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-500/10 text-zinc-500'
          }`}>
            {pipelinePhase === 'discovery' && <Radio className="h-2.5 w-2.5 animate-pulse" />}
            Phase 1: Discovery
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-600" />
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${
            pipelinePhase === 'enrichment' || pipelinePhase === 'executing' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-500/10 text-zinc-500'
          }`}>
            {(pipelinePhase === 'enrichment' || pipelinePhase === 'executing') && <Radio className="h-2.5 w-2.5 animate-pulse" />}
            Phase 2: Enrichment
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-600" />
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${
            pipelinePhase === 'complete' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-500/10 text-zinc-500'
          }`}>
            {pipelinePhase === 'complete' && <CheckCircle2 className="h-2.5 w-2.5" />}
            Complete
          </div>
        </div>

        {/* Agent Flow - Visual Pipeline */}
        <div className="grid grid-cols-4 gap-2">
          {agentKeys.map((key, idx) => {
            const display = AGENT_8_DISPLAY[key];
            const state = agents[key];
            const status: AgentStatus = state?.status || 'idle';
            const colors = AGENT_COLORS[key];
            const Icon = AGENT_ICONS[key];
            const StatusIcon = STATUS_STYLES[status].icon;
            const isActive = status === 'working' || status === 'thinking';
            const isDone = status === 'completed';

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative flex flex-col items-center p-2.5 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow} ring-1 ${colors.ring}`
                    : isDone
                    ? `${colors.bg} ${colors.border}`
                    : 'bg-zinc-800/30 border-zinc-700/30'
                }`}
              >
                {/* Active pulse ring */}
                {isActive && (
                  <div className={`absolute inset-0 rounded-xl ${colors.ring} ring-2 animate-pulse opacity-30`} />
                )}

                {/* Agent Icon */}
                <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-lg mb-1.5 ${
                  isActive ? colors.bg : isDone ? colors.bg : 'bg-zinc-700/30'
                }`}>
                  {isActive ? (
                    <StatusIcon className={`h-[18px] w-[18px] ${colors.text} ${status === 'working' ? 'animate-spin' : 'animate-pulse'}`} />
                  ) : (
                    <Icon className={`h-[18px] w-[18px] ${isDone ? colors.text : 'text-zinc-500'}`} />
                  )}
                </div>

                {/* Agent Name */}
                <div className={`text-[10px] font-semibold text-center ${isActive ? colors.text : isDone ? colors.text : 'text-zinc-400'}`}>
                  {display.name}
                </div>

                {/* Role */}
                <div className="text-[8px] text-zinc-500 text-center mt-0.5">{display.role}</div>

                {/* Status Badge */}
                <div className={`mt-1.5 px-1.5 py-0.5 rounded text-[8px] font-medium capitalize ${STATUS_STYLES[status].bg} ${STATUS_STYLES[status].text}`}>
                  {status}
                </div>

                {/* Progress bar for active agent */}
                {isActive && state?.progress > 0 && (
                  <div className="w-full mt-1.5 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${colors.text === 'text-cyan-400' ? 'from-cyan-500 to-cyan-300' : colors.text === 'text-emerald-400' ? 'from-emerald-500 to-emerald-300' : 'from-violet-500 to-violet-300'}`}
                      animate={{ width: `${state.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Current step */}
                {state?.currentStep && isActive && (
                  <div className="mt-1 text-[8px] text-zinc-400 text-center truncate w-full px-1">
                    {state.currentStep}
                  </div>
                )}

                {/* Flow Arrow (between agents) */}
                {idx < 7 && (
                  <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-20">
                    <ArrowRight className={`h-3 w-3 ${isDone ? 'text-emerald-500/50' : 'text-zinc-600'}`} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Data Flow Description */}
        <div className="mt-3 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Layers className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] font-medium text-zinc-300">Pipeline Methodology</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] text-zinc-400">
            <div className="flex items-center gap-1"><span className="text-indigo-400">Atlas</span> classifies intent & orchestrates agent sequence</div>
            <div className="flex items-center gap-1"><span className="text-emerald-400">Scout</span> discovers & researches company data via web search</div>
            <div className="flex items-center gap-1"><span className="text-cyan-400">Forge</span> enriches with deep crawl & firmographics</div>
            <div className="flex items-center gap-1"><span className="text-violet-400">Sage</span> analyzes market & competitive intelligence</div>
            <div className="flex items-center gap-1"><span className="text-rose-400">Judge</span> qualifies leads & scores against ICP</div>
            <div className="flex items-center gap-1"><span className="text-sky-400">Bard</span> composes personalized outreach messages</div>
            <div className="flex items-center gap-1"><span className="text-amber-400">Flow</span> manages pipeline routing & session state</div>
            <div className="flex items-center gap-1"><span className="text-teal-400">Echo</span> generates insights, reports & recommendations</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Agent Details Panel ────────────────────────────────────────────

function AgentDetailsPanel({ agents, pipelineLog }: {
  agents: Record<string, AgentState>;
  pipelineLog: PipelineLogEntry[];
}) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const agentEvents = useMemo(() => {
    const map: Record<string, PipelineLogEntry[]> = {};
    Object.keys(AGENT_8_DISPLAY).forEach(key => {
      map[key] = pipelineLog.filter(e =>
        e.data.agent === key || e.data.leadId === undefined && e.type === 'agent_status' && e.data.agent === key
      ).slice(-10);
    });
    return map;
  }, [pipelineLog]);

  return (
    <div className="space-y-2">
      {Object.entries(AGENT_8_DISPLAY).map(([key, display]) => {
        const state = agents[key];
        const status: AgentStatus = state?.status || 'idle';
        const colors = AGENT_COLORS[key];
        const Icon = AGENT_ICONS[key];
        const isExpanded = expandedAgent === key;
        const isActive = status === 'working' || status === 'thinking';
        const events = agentEvents[key] || [];

        return (
          <motion.div
            key={key}
            layout
            className={`rounded-lg border transition-all ${
              isActive ? `${colors.border} ${colors.bg}` : status === 'completed' ? `${colors.border} ${colors.bg}` : 'border-zinc-700/30'
            }`}
          >
            {/* Agent Header - Clickable */}
            <button
              onClick={() => setExpandedAgent(isExpanded ? null : key)}
              className="w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-white/[0.02] dark:hover:bg-white/[0.04] transition-colors"
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-md ${isActive ? colors.bg : 'bg-zinc-700/30'}`}>
                <Icon className={`h-3.5 w-3.5 ${isActive || status === 'completed' ? colors.text : 'text-zinc-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isActive ? colors.text : status === 'completed' ? colors.text : 'text-zinc-300'}`}>
                    {display.name}
                  </span>
                  <span className="text-[9px] text-zinc-500">{display.role}</span>
                </div>
                {state?.currentStep && (
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{state.currentStep}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isActive && state?.progress > 0 && (
                  <div className="w-12 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
                    <div className={`h-full ${colors.bg.replace('/10', '')} rounded-full`} style={{ width: `${state.progress}%` }} />
                  </div>
                )}
                <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${STATUS_STYLES[status].bg} ${STATUS_STYLES[status].text} border-0`}>
                  {status}
                </Badge>
                {isExpanded ? <ChevronDown className="h-3 w-3 text-zinc-500" /> : <ChevronRight className="h-3 w-3 text-zinc-500" />}
              </div>
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-2.5 pb-2.5 space-y-2">
                    {/* Agent Capabilities */}
                    <div className="p-2 rounded bg-zinc-800/40 border border-zinc-700/20">
                      <div className="text-[9px] font-medium text-zinc-400 mb-1">Capabilities</div>
                      <div className="text-[9px] text-zinc-300">{getAgentCapabilities(key)}</div>
                    </div>

                    {/* Timing */}
                    {state?.startedAt && (
                      <div className="flex items-center gap-3 text-[9px] text-zinc-400">
                        <span>Started: {new Date(state.startedAt).toLocaleTimeString()}</span>
                        {state.completedAt && <span>Completed: {new Date(state.completedAt).toLocaleTimeString()}</span>}
                        {state.thinkTimeMs != null && <span>Think: {(state.thinkTimeMs / 1000).toFixed(1)}s</span>}
                      </div>
                    )}

                    {/* Recent Events */}
                    {events.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] font-medium text-zinc-400">Recent Activity</div>
                        {events.slice(-5).map((entry, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[9px]">
                            <span className="text-zinc-500 shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                            <span className={`shrink-0 ${getEventColor(entry.type)}`}>{entry.type}</span>
                            <span className="text-zinc-300 truncate">
                              {typeof entry.data.message === 'string' ? entry.data.message.slice(0, 100) : JSON.stringify(entry.data).slice(0, 80)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Event Stream Panel ─────────────────────────────────────────────

function EventStreamPanel({ pipelineLog }: { pipelineLog: PipelineLogEntry[] }) {
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const eventTypes = useMemo(() => {
    const types = new Set(pipelineLog.map(e => e.type));
    return ['all', ...Array.from(types).sort()];
  }, [pipelineLog]);

  const filteredLog = useMemo(() => {
    if (filter === 'all') return pipelineLog;
    return pipelineLog.filter(e => e.type === filter);
  }, [pipelineLog, filter]);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLog, autoScroll]);

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <Filter className="h-3 w-3 text-zinc-500" />
        {eventTypes.slice(0, 12).map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-medium transition-colors ${
              filter === type ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-700/30 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            {type}
          </button>
        ))}
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')} className="px-1 py-0.5 text-[8px] text-zinc-500 hover:text-zinc-300">
            <X className="h-2.5 w-2.5" />
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] ${autoScroll ? 'text-cyan-400' : 'text-zinc-500'}`}
        >
          {autoScroll ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
          Auto-scroll
        </button>
      </div>

      {/* Event Log */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-0.5 font-mono text-[9px] min-h-0"
      >
        {filteredLog.length === 0 && (
          <div className="text-zinc-500 text-center py-4">Waiting for events...</div>
        )}
        {filteredLog.map((entry, i) => (
          <EventRow key={i} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function EventRow({ entry }: { entry: PipelineLogEntry }) {
  const eventColor = getEventColor(entry.type);
  const eventLabel = getEventLabel(entry.data);

  return (
    <div className="flex items-start gap-1.5 py-0.5 px-1 rounded hover:bg-white/[0.02] dark:hover:bg-white/[0.04] group">
      <span className="text-zinc-600 shrink-0 tabular-nums">{new Date(entry.timestamp).toLocaleTimeString()}</span>
      <span className={`shrink-0 font-medium ${eventColor}`}>{entry.type.padEnd(18)}</span>
      <span className="text-zinc-300 truncate">{eventLabel}</span>
    </div>
  );
}

// ── Lead Tracker Panel ─────────────────────────────────────────────

function LeadTrackerPanel({ liveLeads, currentEnrichmentIdx, enrichmentTotal }: {
  liveLeads: LiveLead[];
  currentEnrichmentIdx: number;
  enrichmentTotal: number;
}) {
  const pipelineStages = ['Discovered', 'Data Saved', 'Scout Research', 'Forge Enrich', 'Judge Score', 'Enriched'];

  return (
    <div className="space-y-3">
      {/* Enrichment Progress */}
      {enrichmentTotal > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[10px] text-cyan-300">
            Enriching candidate {currentEnrichmentIdx} of {enrichmentTotal}
          </span>
          <div className="flex-1" />
          <div className="w-20 h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${(currentEnrichmentIdx / enrichmentTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Lead Cards with Pipeline Progress */}
      {liveLeads.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 text-xs">
          No leads discovered yet. Pipeline will show leads here as they are found.
        </div>
      ) : (
        <div className="space-y-2">
          {liveLeads.map((lead, idx) => {
            const currentStageIdx = lead.stage === 'enriched' ? 5 : lead.stage === 'failed' ? -1 : Math.min(1, idx);

            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-2.5 rounded-lg border ${
                  lead.stage === 'enriched'
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : lead.stage === 'failed'
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-zinc-800/30 border-zinc-700/30'
                }`}
              >
                {/* Lead Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      lead.stage === 'enriched' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/40 text-zinc-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">{lead.companyName}</div>
                      {lead.website && (
                        <div className="text-[9px] text-zinc-500 truncate">{lead.website.replace(/^https?:\/\//, '')}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[8px] ${
                    lead.stage === 'enriched' ? 'border-emerald-500/30 text-emerald-400' :
                    lead.stage === 'failed' ? 'border-red-500/30 text-red-400' :
                    'border-cyan-500/30 text-cyan-400'
                  }`}>
                    {lead.stage === 'enriched' ? 'ENRICHED' : lead.stage === 'failed' ? 'FAILED' : 'DISCOVERED'}
                  </Badge>
                </div>

                {/* Pipeline Stage Progress */}
                <div className="flex items-center gap-0.5">
                  {pipelineStages.map((stage, stageIdx) => {
                    const isCompleted = stageIdx <= currentStageIdx;
                    const isCurrent = stageIdx === currentStageIdx && lead.stage !== 'enriched' && lead.stage !== 'failed';
                    return (
                      <div key={stageIdx} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className={`w-full h-1 rounded-full ${
                          isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-cyan-500/50 animate-pulse' : 'bg-zinc-700/40'
                        }`} />
                        <span className={`text-[7px] ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-cyan-400' : 'text-zinc-600'}`}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Data Completeness */}
                <div className="flex items-center justify-between mt-1.5 text-[9px]">
                  <span className="text-zinc-500">Data completeness</span>
                  <span className={lead.dataCompleteness >= 60 ? 'text-emerald-400' : lead.dataCompleteness >= 30 ? 'text-amber-400' : 'text-zinc-400'}>
                    {lead.dataCompleteness}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Agent Communications Panel ─────────────────────────────────────

function AgentCommsPanel({ commLog }: { commLog: CommMessage[] }) {
  return (
    <div className="space-y-1.5">
      {commLog.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 text-xs">
          No inter-agent communications yet. Messages will appear as agents coordinate.
        </div>
      ) : (
        commLog.map((msg, i) => {
          const fromColors = AGENT_COLORS[msg.from] || AGENT_COLORS.atlas;
          const toColors = AGENT_COLORS[msg.to] || AGENT_COLORS.atlas;
          const isBroadcast = msg.to === 'all';

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 rounded-lg bg-zinc-800/30 border border-zinc-700/20"
            >
              {/* Header: From → To */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[9px] font-semibold ${fromColors.text}`}>{msg.from}</span>
                <ArrowRight className="h-2.5 w-2.5 text-zinc-600" />
                <span className={`text-[9px] font-semibold ${isBroadcast ? 'text-zinc-300' : toColors.text}`}>
                  {isBroadcast ? 'ALL' : msg.to}
                </span>
                <Badge variant="outline" className="text-[7px] px-1 py-0 border-zinc-600/30 text-zinc-500">
                  {msg.type}
                </Badge>
                <span className="text-[8px] text-zinc-600 ml-auto">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {/* Content */}
              <div className="text-[10px] text-zinc-300 leading-relaxed pl-1">
                {msg.content.slice(0, 200)}
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// ── Main Workspace Component ───────────────────────────────────────

export function AgenticPipelineWorkspace({
  pipelineRunning,
  pipelineState,
  pipelineLog,
  liveLeads,
  currentEnrichmentIdx,
  enrichmentTotal,
  thinkingMs,
  campaignName,
  discoveryQuery,
  pipelineSummary,
}: PipelineWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('architecture');
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const agents = pipelineState?.agents || {};
  const commLog = pipelineState?.commLog || [];
  const phase = pipelineState?.phase || 'idle';
  const overallProgress = pipelineState?.overallProgress || 0;

  // Auto-detect interesting tab based on state
  useEffect(() => {
    if (commLog.length > 3 && activeTab === 'architecture') {
      // Switch to comms when agents start talking
    }
  }, [commLog.length, activeTab]);

  const tabs: { key: WorkspaceTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { key: 'architecture', label: 'Architecture', icon: Layers },
    { key: 'agents', label: 'Agents', icon: Cpu, badge: Object.values(agents).filter(a => a.status === 'working' || a.status === 'thinking').length || undefined },
    { key: 'events', label: 'Events', icon: Activity, badge: pipelineLog.length || undefined },
    { key: 'leads', label: 'Leads', icon: Database, badge: liveLeads.length || undefined },
    { key: 'comms', label: 'Comms', icon: MessageSquare, badge: commLog.length || undefined },
  ];

  return (
    <motion.div
      ref={containerRef}
      layout
      className={`rounded-xl border transition-all duration-300 ${
        pipelineRunning
          ? 'border-cyan-500/30 bg-zinc-900/80 shadow-lg shadow-cyan-500/5'
          : pipelineSummary
          ? 'border-emerald-500/30 bg-zinc-900/80'
          : 'border-zinc-700/30 bg-zinc-900/60'
      } ${isExpanded ? 'col-span-full' : ''}`}
    >
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700/30">
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center justify-center w-6 h-6 rounded-md ${pipelineRunning ? 'bg-cyan-500/20' : 'bg-zinc-700/30'}`}>
            {pipelineRunning ? (
              <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            ) : pipelineSummary ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Cpu className="h-3.5 w-3.5 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-200">Agentic Pipeline Workspace</span>
              {pipelineRunning && (
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                  LIVE
                </Badge>
              )}
              {pipelineSummary && !pipelineRunning && (
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  COMPLETE
                </Badge>
              )}
            </div>
            <div className="text-[9px] text-zinc-500">
              {pipelineRunning
                ? `${campaignName} — ${phase === 'discovery' ? 'Discovering candidates...' : phase === 'enrichment' ? `Enriching (${currentEnrichmentIdx}/${enrichmentTotal})` : phase === 'complete' ? 'Complete' : 'Initializing...'}`
                : pipelineSummary
                ? `Done: ${pipelineSummary.discovered} discovered, ${pipelineSummary.enriched} enriched`
                : 'Pipeline not started'
              }
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Overall Progress */}
          {pipelineRunning && (
            <div className="flex items-center gap-2">
              {thinkingMs > 0 && (
                <span className="text-[9px] text-violet-400 flex items-center gap-1">
                  <Brain className="h-2.5 w-2.5" />
                  {(thinkingMs / 1000).toFixed(1)}s
                </span>
              )}
              <div className="w-24 h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[9px] text-zinc-400 tabular-nums">{Math.round(overallProgress)}%</span>
            </div>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-zinc-700/30 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-zinc-700/20 bg-zinc-900/50">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
              {tab.badge != null && (
                <span className={`px-1 py-0 rounded text-[7px] ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/30 text-zinc-500'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={`p-3 ${isExpanded ? 'max-h-[600px]' : 'max-h-[350px]'} overflow-y-auto`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'architecture' && (
              <PipelineArchitecture
                agents={agents}
                pipelineRunning={pipelineRunning}
                pipelinePhase={phase}
                overallProgress={overallProgress}
                discoveryQuery={discoveryQuery}
              />
            )}
            {activeTab === 'agents' && (
              <AgentDetailsPanel agents={agents} pipelineLog={pipelineLog} />
            )}
            {activeTab === 'events' && (
              <EventStreamPanel pipelineLog={pipelineLog} />
            )}
            {activeTab === 'leads' && (
              <LeadTrackerPanel liveLeads={liveLeads} currentEnrichmentIdx={currentEnrichmentIdx} enrichmentTotal={enrichmentTotal} />
            )}
            {activeTab === 'comms' && (
              <AgentCommsPanel commLog={commLog} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function getAgentCapabilities(key: string): string {
  const caps: Record<string, string> = {
    atlas: 'Intent classification, pipeline orchestration, agent coordination, error recovery, routing decisions',
    scout: 'Web search (DuckDuckGo, Exa), LinkedIn company search, company discovery, person research, URL analysis',
    forge: 'Deep website crawling, firmographic enrichment, contact data extraction, tech stack detection, social profile discovery',
    sage: 'Market analysis, competitive intelligence, industry trends, SWOT analysis, strategic insights',
    judge: 'Lead qualification, ICP matching, BANT scoring, conversion prediction, deal size estimation',
    bard: 'Email composition, LinkedIn message crafting, personalization, follow-up sequences, A/B variants',
    flow: 'Pipeline state management, session persistence, lead routing, stage transitions, workflow automation',
    echo: 'Insight generation, report compilation, data synthesis, trend analysis, recommendation engine',
  };
  return caps[key] || 'General purpose agent';
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    stream_open: 'text-cyan-400',
    pipeline_progress: 'text-cyan-400',
    step_start: 'text-emerald-400',
    step_progress: 'text-emerald-300',
    step_complete: 'text-emerald-400',
    agent_status: 'text-violet-400',
    agent_comm: 'text-amber-400',
    thinking_start: 'text-violet-400',
    thinking_tick: 'text-violet-300',
    thinking_end: 'text-violet-400',
    cooldown: 'text-zinc-500',
    data_update: 'text-sky-400',
    insight: 'text-amber-400',
    lead_created: 'text-cyan-400',
    lead_enriched: 'text-emerald-400',
    enrichment_start: 'text-cyan-400',
    error: 'text-red-400',
    done: 'text-emerald-400',
  };
  return colors[type] || 'text-zinc-400';
}

function getEventLabel(data: Record<string, unknown>): string {
  if (typeof data.message === 'string') return data.message.slice(0, 120);
  if (typeof data.companyName === 'string') {
    const stage = data.stage ? ` (${data.stage})` : '';
    return `${data.companyName}${stage}`;
  }
  if (typeof data.label === 'string') return data.label;
  if (typeof data.phase === 'string') return `Phase: ${data.phase} — ${data.overallProgress ?? 0}%`;
  if (typeof data.agent === 'string') return `Agent: ${data.agent}`;
  const preview = JSON.stringify(data).slice(0, 100);
  return preview;
}
