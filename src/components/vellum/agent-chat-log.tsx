'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Filter,
  ArrowRight,
  ArrowDownLeft,
  Radio,
  HandMetal as HandoffIcon,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AGENT_8_DISPLAY } from '@/lib/prospect-agent/orchestrator-types';
import type { AgentCommMessage } from '@/lib/prospect-agent/orchestrator-types';
import { useVellumStore } from './vellum-provider';

// ============================================================
// Agent Avatar
// ============================================================

function AgentAvatar({ agentKey, size = 'sm' }: { agentKey: string; size?: 'sm' | 'md' }) {
  const display = AGENT_8_DISPLAY[agentKey];
  if (!display) {
    return (
      <div className={`rounded-full bg-muted/30 flex items-center justify-center ${size === 'sm' ? 'h-5 w-5 text-[8px]' : 'h-7 w-7 text-[10px]'}`}>
        🤖
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/15 border-indigo-500/30',
    emerald: 'bg-emerald-500/15 border-emerald-500/30',
    cyan: 'bg-cyan-500/15 border-cyan-500/30',
    violet: 'bg-violet-500/15 border-violet-500/30',
    rose: 'bg-rose-500/15 border-rose-500/30',
    sky: 'bg-sky-500/15 border-sky-500/30',
    amber: 'bg-amber-500/15 border-amber-500/30',
    teal: 'bg-teal-500/15 border-teal-500/30',
  };

  const bgClass = colorMap[display.color] || colorMap.emerald;
  const sizeClass = size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-7 w-7 text-[11px]';

  return (
    <div className={`rounded-full border flex items-center justify-center ${bgClass} ${sizeClass}`}>
      {display.emoji}
    </div>
  );
}

// ============================================================
// Message Type Configuration
// ============================================================

const MSG_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  request: { color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-l-cyan-500/50', icon: ArrowRight, label: 'Request' },
  response: { color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-l-emerald-500/50', icon: ArrowDownLeft, label: 'Response' },
  broadcast: { color: 'text-violet-400', bg: 'bg-violet-500/5', border: 'border-l-violet-500/50', icon: Radio, label: 'Broadcast' },
  handoff: { color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-l-amber-500/50', icon: HandoffIcon, label: 'Handoff' },
  status: { color: 'text-amber-400/70', bg: 'bg-amber-500/5', border: 'border-l-amber-400/40', icon: Clock, label: 'Status' },
};

// ============================================================
// Single Message Bubble
// ============================================================

function CommMessageBubble({ msg, onExpand }: { msg: AgentCommMessage; onExpand?: (msg: AgentCommMessage) => void }) {
  const fromDisplay = msg.from === 'user' ? { emoji: '👤', name: 'You' } : AGENT_8_DISPLAY[msg.from] || { emoji: '🤖', name: msg.from };
  const toDisplay = msg.to === 'all' ? { emoji: '📢', name: 'All' } : AGENT_8_DISPLAY[msg.to] || { emoji: '🤖', name: msg.to };
  const config = MSG_TYPE_CONFIG[msg.type] || MSG_TYPE_CONFIG.status;
  const TypeIcon = config.icon;
  const [expanded, setExpanded] = useState(false);

  const isLong = msg.content.length > 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`rounded-md border-l-2 ${config.border} ${config.bg} px-2.5 py-2 group hover:bg-secondary/10 transition-colors cursor-pointer`}
      onClick={() => {
        setExpanded(!expanded);
        onExpand?.(msg);
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <AgentAvatar agentKey={msg.from} size="sm" />
        <span className="text-[10px] font-semibold text-foreground/70">{fromDisplay.name}</span>
        <TypeIcon className={`h-2.5 w-2.5 ${config.color} opacity-60`} />
        {msg.to !== 'user' && (
          <>
            <AgentAvatar agentKey={msg.to} size="sm" />
            <span className="text-[10px] font-medium text-muted-foreground/60">{toDisplay.name}</span>
          </>
        )}
        <Badge variant="outline" className={`text-[8px] h-4 px-1 ${config.color} border-current/20 ml-1`}>
          {config.label}
        </Badge>
        <span className="text-[8px] text-muted-foreground/30 ml-auto">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className={`text-[10px] text-foreground/70 leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
        {msg.content}
      </p>
      {isLong && (
        <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground/40">
          {expanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          {expanded ? 'Show less' : 'Show more'}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// Agent Chat Log Panel
// ============================================================

interface AgentChatLogProps {
  className?: string;
  maxHeight?: string;
}

export function AgentChatLog({ className = '', maxHeight = '400px' }: AgentChatLogProps) {
  const commLog = useVellumStore((s) => s.pipelineState.commLog);
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredMessages = commLog.filter((msg) => {
    if (filterAgent && msg.from !== filterAgent && msg.to !== filterAgent) return false;
    if (filterType && msg.type !== filterType) return false;
    return true;
  });

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">
            Agent Communication
          </span>
          {commLog.length > 0 && (
            <Badge variant="outline" className="text-[8px] h-4 px-1 border-border/30 text-muted-foreground/50">
              {commLog.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground/40 hover:text-foreground/70"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-2"
          >
            <div className="space-y-1.5 p-2 rounded-md bg-secondary/10 border border-border/20">
              <div>
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Agent</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-[8px] h-5 px-1.5 ${!filterAgent ? 'bg-violet-500/10 text-violet-400' : 'text-muted-foreground/50'}`}
                    onClick={() => setFilterAgent(null)}
                  >
                    All
                  </Button>
                  {Object.entries(AGENT_8_DISPLAY).map(([key, display]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className={`text-[8px] h-5 px-1.5 ${filterAgent === key ? 'bg-violet-500/10 text-violet-400' : 'text-muted-foreground/50'}`}
                      onClick={() => setFilterAgent(filterAgent === key ? null : key)}
                    >
                      {display.emoji} {display.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Type</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-[8px] h-5 px-1.5 ${!filterType ? 'bg-violet-500/10 text-violet-400' : 'text-muted-foreground/50'}`}
                    onClick={() => setFilterType(null)}
                  >
                    All
                  </Button>
                  {Object.entries(MSG_TYPE_CONFIG).map(([key, config]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className={`text-[8px] h-5 px-1.5 ${filterType === key ? 'bg-violet-500/10 text-violet-400' : 'text-muted-foreground/50'}`}
                      onClick={() => setFilterType(filterType === key ? null : key)}
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <div className="space-y-1.5">
          {filteredMessages.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/30 italic text-center py-4">
              {commLog.length === 0
                ? 'Agent messages will appear here during processing...'
                : 'No messages match your filter'}
            </p>
          ) : (
            filteredMessages.map((msg) => (
              <CommMessageBubble key={msg.id} msg={msg} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
