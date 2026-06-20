'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { AGENT_8_DISPLAY } from '@/lib/prospect-agent/orchestrator-types';

interface ThinkingIndicatorProps {
  agent?: string;
  startTime: number | null;
  endTime?: number | null;
  thinkingContent?: string;
  compact?: boolean;
  showProgress?: boolean;
}

export function ThinkingIndicator({
  agent = 'atlas',
  startTime,
  endTime,
  thinkingContent,
  compact = false,
  showProgress = true,
}: ThinkingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const isThinking = !endTime;
  const agentDisplay = AGENT_8_DISPLAY[agent];

  useEffect(() => {
    if (!startTime || endTime) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const displayMs = endTime ? endTime - (startTime || 0) : elapsed;
  const displaySeconds = (displayMs / 1000).toFixed(1);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="flex items-center gap-2 px-2 py-1 rounded-md bg-violet-500/5 border border-violet-500/20"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        >
          <Settings2 className="h-3 w-3 text-violet-400" />
        </motion.div>
        <span className="text-[10px] font-medium text-violet-400">
          {agentDisplay?.emoji} {agentDisplay?.name || agent}
        </span>
        <span className="text-[10px] text-violet-400/60">
          {isThinking ? 'thinking' : 'thought'} {displaySeconds}s
        </span>
        {isThinking && (
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1 w-1 rounded-full bg-violet-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-lg border border-violet-500/25 bg-violet-500/5 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-violet-500/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={isThinking ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <Brain className="h-4 w-4 text-violet-400" />
          </motion.div>
          <span className="text-xs font-semibold text-violet-400">
            {isThinking ? 'Thinking' : 'Thought'}
          </span>
          {agentDisplay && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400">
              {agentDisplay.emoji} {agentDisplay.name}
            </span>
          )}
          {isThinking && (
            <span className="flex gap-1 ml-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-violet-400"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.4,
                    delay: i * 0.25,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-violet-400/50" />
            <span className="text-xs font-mono text-violet-400">
              {displaySeconds}s
            </span>
            <span className="text-[9px] text-violet-400/40">({displayMs}ms)</span>
          </div>
          {thinkingContent && (
            expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-violet-400/40" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-violet-400/40" />
            )
          )}
        </div>
      </button>

      {/* Progress bar */}
      {showProgress && isThinking && (
        <div className="h-1 bg-violet-500/10">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500/60 to-violet-400"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(95, (displayMs / 30000) * 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Completed progress */}
      {showProgress && endTime && (
        <div className="h-1 bg-violet-500/10">
          <motion.div
            className="h-full bg-emerald-400/70"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Expanded thinking content */}
      <AnimatePresence>
        {expanded && thinkingContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-violet-500/15"
          >
            <div className="px-3 py-2.5">
              <p className="text-[11px] text-violet-300/70 leading-relaxed whitespace-pre-wrap">
                {thinkingContent}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-label */}
      {!expanded && isThinking && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-violet-400/50">
            {agentDisplay?.name || agent} is analyzing your query and planning the agent pipeline...
          </p>
        </div>
      )}
    </motion.div>
  );
}
