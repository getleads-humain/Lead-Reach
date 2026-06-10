'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Bot,
  Timer,
  Zap,
} from 'lucide-react';
import { AGENT_8_DISPLAY } from '@/lib/prospect-agent/orchestrator-types';
import type { AgentState } from '@/lib/prospect-agent/orchestrator-types';
import { useVellumStore } from './vellum-provider';
import { AgentChatLog } from './agent-chat-log';

// ============================================================
// Pipeline Agent Node
// ============================================================

const AGENT_ORDER = ['atlas', 'scout', 'forge', 'sage', 'judge', 'bard', 'flow', 'echo'];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  idle: { bg: 'bg-muted/10', border: 'border-muted/30', text: 'text-muted-foreground/50', glow: '' },
  thinking: { bg: 'bg-violet-500/8', border: 'border-violet-500/30', text: 'text-violet-400', glow: 'shadow-violet-500/10' },
  working: { bg: 'bg-cyan-500/8', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/10' },
  waiting: { bg: 'bg-amber-500/8', border: 'border-amber-500/30', text: 'text-amber-400', glow: '' },
  completed: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: '' },
  failed: { bg: 'bg-red-500/8', border: 'border-red-500/30', text: 'text-red-400', glow: '' },
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  idle: Bot,
  thinking: Clock,
  working: Loader2,
  waiting: Clock,
  completed: CheckCircle2,
  failed: AlertCircle,
};

function AgentNode({
  agentKey,
  state,
  isActive,
  onClick,
}: {
  agentKey: string;
  state?: AgentState;
  isActive: boolean;
  onClick: () => void;
}) {
  const display = AGENT_8_DISPLAY[agentKey];
  if (!display) return null;

  const status = state?.status || 'idle';
  const colors = STATUS_COLORS[status] || STATUS_COLORS.idle;
  const StatusIcon = STATUS_ICONS[status] || Bot;

  const isAnimating = status === 'thinking' || status === 'working';

  return (
    <motion.button
      onClick={onClick}
      className={`relative rounded-xl border ${colors.border} ${colors.bg} p-3 transition-all hover:border-emerald-500/30 w-full text-left ${isActive ? 'ring-1 ring-emerald-500/20' : ''}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active pulse ring */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-violet-400/20"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
      )}

      <div className="flex items-center gap-2.5">
        <div className="text-xl">{display.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${colors.text}`}>{display.name}</span>
            <StatusIcon className={`h-3 w-3 ${colors.text} ${isAnimating ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-[9px] text-muted-foreground/50">{display.role}</span>
        </div>
      </div>

      {/* Progress bar */}
      {state && state.progress > 0 && status !== 'idle' && (
        <div className="mt-2">
          <Progress value={state.progress} className="h-1 bg-secondary/30 [&>div]:bg-emerald-400" />
        </div>
      )}

      {/* Step label */}
      {state?.currentStep && status !== 'idle' && (
        <p className="text-[9px] text-muted-foreground/50 mt-1 truncate">{state.currentStep}</p>
      )}

      {/* Timing */}
      {state?.thinkTimeMs && (
        <div className="flex items-center gap-1 mt-1">
          <Timer className="h-2.5 w-2.5 text-muted-foreground/30" />
          <span className="text-[8px] text-muted-foreground/40">{(state.thinkTimeMs / 1000).toFixed(1)}s</span>
        </div>
      )}
    </motion.button>
  );
}

// ============================================================
// Animated Connection Line
// ============================================================

function ConnectionLine({ active, index }: { active: boolean; index: number }) {
  return (
    <div className="flex items-center justify-center py-0.5">
      <div className="relative w-0.5 h-4">
        {/* Base line */}
        <div className="absolute inset-0 bg-border/20" />
        {/* Animated line */}
        {active && (
          <motion.div
            className="absolute inset-0 bg-emerald-400/60"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            style={{ transformOrigin: 'top' }}
          />
        )}
        {/* Flowing dot */}
        {active && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ top: ['0%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.2, ease: 'easeInOut' }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Agent Output Preview
// ============================================================

function AgentOutputPreview({ agentKey, state }: { agentKey: string; state?: AgentState }) {
  const display = AGENT_8_DISPLAY[agentKey];
  if (!display || !state) return null;

  const elapsed = state.startedAt && state.completedAt
    ? ((state.completedAt - state.startedAt) / 1000).toFixed(1) + 's'
    : state.startedAt
    ? ((Date.now() - state.startedAt) / 1000).toFixed(1) + 's (running)'
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-lg border border-border/20 bg-secondary/5 p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{display.emoji}</span>
          <span className="text-xs font-semibold text-foreground/80">{display.name} Output</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[8px] h-4 px-1 ${
            state.status === 'completed' ? 'border-emerald-500/20 text-emerald-400' :
            state.status === 'failed' ? 'border-red-500/20 text-red-400' :
            'border-violet-500/20 text-violet-400'
          }`}>
            {state.status}
          </Badge>
          <div className="flex items-center gap-1">
            <Timer className="h-2.5 w-2.5 text-muted-foreground/30" />
            <span className="text-[9px] text-muted-foreground/50">{elapsed}</span>
          </div>
        </div>
      </div>
      {state.currentStep ? (
        <p className="text-[10px] text-muted-foreground/60">{state.currentStep}</p>
      ) : (
        <p className="text-[10px] text-muted-foreground/30 italic">No output yet</p>
      )}
      {state.progress > 0 && (
        <Progress value={state.progress} className="h-1 bg-secondary/20 [&>div]:bg-emerald-400" />
      )}
    </motion.div>
  );
}

// ============================================================
// Pipeline Timeline
// ============================================================

function PipelineTimeline({ agents }: { agents: Record<string, AgentState> }) {
  const activeAgents = AGENT_ORDER.filter((key) => {
    const state = agents[key];
    return state && state.status !== 'idle';
  });

  if (activeAgents.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/20 bg-secondary/5 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Timer className="h-3 w-3 text-emerald-400" />
        <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Timeline</span>
      </div>
      <div className="space-y-1.5">
        {activeAgents.map((key) => {
          const state = agents[key];
          const display = AGENT_8_DISPLAY[key];
          if (!state || !display) return null;

          const elapsed = state.startedAt
            ? ((state.completedAt || Date.now()) - state.startedAt) / 1000
            : 0;

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px]">{display.emoji}</span>
              <span className="text-[9px] font-medium text-foreground/60 w-12">{display.name}</span>
              <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-400/60"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(100, (elapsed / 15) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground/40 w-12 text-right">{elapsed.toFixed(1)}s</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Main Pipeline Workspace
// ============================================================

interface PipelineWorkspaceProps {
  className?: string;
}

export function PipelineWorkspace({ className = '' }: PipelineWorkspaceProps) {
  const pipelineState = useVellumStore((s) => s.pipelineState);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showCommLog, setShowCommLog] = useState(false);

  const isProcessing = pipelineState.phase !== 'idle' && pipelineState.phase !== 'complete';
  const activeAgentKey = AGENT_ORDER.find((key) => {
    const state = pipelineState.agents[key];
    return state && (state.status === 'thinking' || state.status === 'working');
  });

  return (
    <Card className={`flex flex-col border-border/30 bg-card/50 h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-cyan-500/10">
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground/90">Pipeline Workspace</h3>
              <p className="text-[10px] text-muted-foreground/50">8-Agent orchestration</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] h-5 px-1.5 ${
            pipelineState.phase === 'thinking' ? 'border-violet-500/20 text-violet-400' :
            pipelineState.phase === 'executing' ? 'border-cyan-500/20 text-cyan-400' :
            pipelineState.phase === 'complete' ? 'border-emerald-500/20 text-emerald-400' :
            'border-border/30 text-muted-foreground/40'
          }`}>
            {pipelineState.phase === 'idle' ? 'Ready' :
             pipelineState.phase === 'thinking' ? '🧠 Thinking' :
             pipelineState.phase === 'executing' ? '⚡ Executing' :
             pipelineState.phase === 'synthesizing' ? '🔄 Synthesizing' :
             pipelineState.phase === 'complete' ? '✅ Complete' :
             pipelineState.phase === 'error' ? '❌ Error' : pipelineState.phase}
          </Badge>
        </div>

        {/* Overall progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground/50">Overall Progress</span>
            <span className="text-[9px] font-mono text-muted-foreground/50">{pipelineState.overallProgress}%</span>
          </div>
          <Progress value={pipelineState.overallProgress} className="h-1.5 bg-secondary/30 [&>div]:bg-emerald-400" />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Agent nodes in a vertical flow */}
          <div className="space-y-0">
            {AGENT_ORDER.map((key, index) => (
              <React.Fragment key={key}>
                <AgentNode
                  agentKey={key}
                  state={pipelineState.agents[key]}
                  isActive={selectedAgent === key || activeAgentKey === key}
                  onClick={() => setSelectedAgent(selectedAgent === key ? null : key)}
                />
                {index < AGENT_ORDER.length - 1 && (
                  <ConnectionLine
                    active={isProcessing && index < AGENT_ORDER.indexOf(activeAgentKey || '') + 1}
                    index={index}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Selected agent output */}
          <AnimatePresence>
            {selectedAgent && (
              <AgentOutputPreview
                agentKey={selectedAgent}
                state={pipelineState.agents[selectedAgent]}
              />
            )}
          </AnimatePresence>

          {/* Timeline */}
          <PipelineTimeline agents={pipelineState.agents} />

          {/* Communication log toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[10px] h-7 gap-1.5 border-border/30 hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400 transition-colors"
            onClick={() => setShowCommLog(!showCommLog)}
          >
            <Zap className="h-3 w-3" />
            {showCommLog ? 'Hide' : 'Show'} Agent Communication
            {pipelineState.commLog.length > 0 && (
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-border/30 text-muted-foreground/50 ml-1">
                {pipelineState.commLog.length}
              </Badge>
            )}
          </Button>

          <AnimatePresence>
            {showCommLog && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <AgentChatLog maxHeight="300px" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  );
}
