'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Plus,
  Brain,
  MemoryStick,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RotateCcw,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { AGENT_8_DISPLAY } from '@/lib/prospect-agent/orchestrator-types';
import { useVellumStore, useVellum, type VellumChatMessage, type ToolExecution } from './vellum-provider';
import { ThinkingIndicator } from './thinking-indicator';

// ============================================================
// Agent Badge for Chat Messages
// ============================================================

function AgentBadge({ agentKey }: { agentKey: string }) {
  const display = AGENT_8_DISPLAY[agentKey];
  if (!display) return null;

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };

  return (
    <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 font-medium gap-0.5 ${colorMap[display.color] || colorMap.emerald}`}>
      <span>{display.emoji}</span>
      <span>{display.name}</span>
    </Badge>
  );
}

// ============================================================
// Tool Execution Display
// ============================================================

function ToolExecutionItem({ tool }: { tool: ToolExecution }) {
  const statusConfig = {
    running: { icon: Loader2, color: 'text-cyan-400', bg: 'bg-cyan-500/5', spin: true },
    complete: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/5', spin: false },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/5', spin: false },
  };
  const config = statusConfig[tool.status];

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${config.bg} text-xs`}>
      <config.icon className={`h-3 w-3 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
      <span className={`font-medium ${config.color}`}>{tool.name}</span>
      <span className="text-[10px] text-muted-foreground/50 flex-1 truncate">{tool.result || tool.status}</span>
    </div>
  );
}

// ============================================================
// Memory Indicator
// ============================================================

function MemoryIndicator() {
  return (
    <div className="flex items-center gap-1" title="Response used stored memories">
      <MemoryStick className="h-3 w-3 text-amber-400/70" />
      <span className="text-[8px] text-amber-400/50">memory</span>
    </div>
  );
}

// ============================================================
// Chat Message Component
// ============================================================

function ChatMessage({ message }: { message: VellumChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'ml-8' : 'mr-8'}`}>
        {/* Message metadata */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            {message.agent && <AgentBadge agentKey={message.agent} />}
            {message.usedMemory && <MemoryIndicator />}
            {message.thinkingTimeMs != null && (
              <div className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5 text-muted-foreground/30" />
                <span className="text-[8px] text-muted-foreground/40">
                  {(message.thinkingTimeMs / 1000).toFixed(1)}s
                </span>
              </div>
            )}
            <span className="text-[8px] text-muted-foreground/25 ml-auto">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-xl px-3.5 py-2.5 ${
            isUser
              ? 'bg-emerald-500/15 border border-emerald-500/20 text-foreground/90'
              : isSystem
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200/80 text-center text-xs italic'
              : 'bg-secondary/30 border border-border/20 text-foreground/85'
          }`}
        >
          {/* Thinking indicator shown before content */}
          {message.isStreaming && message.content === '' && (
            <ThinkingIndicator
              agent={message.agent}
              startTime={message.timestamp}
              compact
            />
          )}

          {/* Content */}
          {message.content && (
            <div className={`text-sm leading-relaxed markdown-content ${message.isStreaming ? 'streaming-cursor' : ''}`}>
              {message.content.split('\n').map((line, i) => {
                // Simple markdown: bold
                const rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                if (line.startsWith('• ') || line.startsWith('- ')) {
                  return (
                    <div key={i} className="flex items-start gap-2 ml-2">
                      <div className="h-1 w-1 rounded-full bg-emerald-400/60 mt-2 shrink-0" />
                      <span dangerouslySetInnerHTML={{ __html: rendered.slice(2) }} />
                    </div>
                  );
                }
                if (line === '') return <div key={i} className="h-1.5" />;
                return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
              })}
            </div>
          )}
        </div>

        {/* Tool executions */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tool) => (
              <ToolExecutionItem key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* User message timestamp */}
        {isUser && (
          <div className="text-right mt-1">
            <span className="text-[8px] text-muted-foreground/25">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Chat Input Component
// ============================================================

function ChatInput({ onSend, disabled }: { onSend: (content: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border/20">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask anything — research companies, find people, analyze markets, build ICPs..."
        disabled={disabled}
        className="flex-1 h-9 text-sm bg-secondary/20 border-border/30 placeholder:text-muted-foreground/30 focus-visible:ring-emerald-500/30"
      />
      <Button
        type="submit"
        size="sm"
        disabled={disabled || !value.trim()}
        className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-30"
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}

// ============================================================
// Main Chat Panel
// ============================================================

interface VellumChatPanelProps {
  className?: string;
}

export function VellumChatPanel({ className = '' }: VellumChatPanelProps) {
  const messages = useVellumStore((s) => s.messages);
  const isStreaming = useVellumStore((s) => s.isStreaming);
  const pipelineState = useVellumStore((s) => s.pipelineState);
  const { sendChatMessage, newSession } = useVellum();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    setShowWelcome(false);
    sendChatMessage(content);
  };

  return (
    <Card className={`flex flex-col border-border/30 bg-card/50 h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-emerald-500/10">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground/90">Vellum Chat</h3>
            <p className="text-[10px] text-muted-foreground/50">Powered by AgentLoop</p>
          </div>
          {pipelineState.phase !== 'idle' && (
            <Badge variant="outline" className="text-[8px] h-5 px-1.5 ml-2 border-violet-500/20 text-violet-400">
              {pipelineState.phase === 'thinking' ? '🧠 Thinking' :
               pipelineState.phase === 'executing' ? '⚡ Executing' :
               pipelineState.phase === 'complete' ? '✅ Complete' : pipelineState.phase}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-foreground/70"
            onClick={newSession}
            title="New session"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-foreground/70"
            onClick={() => { useVellumStore.getState().resetSession(); setShowWelcome(true); }}
            title="Reset session"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome State */}
        {showWelcome && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="rounded-2xl p-4 bg-emerald-500/10 mb-4"
            >
              <MessageSquare className="h-8 w-8 text-emerald-400" />
            </motion.div>
            <h4 className="text-base font-semibold text-foreground/80 mb-2">
              What would you like to discover?
            </h4>
            <p className="text-xs text-muted-foreground/50 max-w-md mb-6">
              Ask me to research companies, find decision makers, analyze markets, or build your ideal customer profile.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {[
                { emoji: '🏢', text: 'Research TechCorp competitors' },
                { emoji: '👤', text: 'Find CTOs at mid-market SaaS' },
                { emoji: '🎯', text: 'Build an ICP for fintech' },
                { emoji: '📊', text: 'Analyze the CRM market' },
              ].map((item) => (
                <Button
                  key={item.text}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-8 justify-start gap-2 border-border/30 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors"
                  onClick={() => handleSend(item.text)}
                >
                  <span>{item.emoji}</span>
                  {item.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Thinking mode indicator at top of messages */}
        {pipelineState.phase === 'thinking' && pipelineState.thinkStartTime && (
          <ThinkingIndicator
            agent="atlas"
            startTime={pipelineState.thinkStartTime}
          />
        )}

        {/* Messages list */}
        <AnimatePresence>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Streaming indicator */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 pl-2"
          >
            <Brain className="h-3 w-3 text-violet-400 animate-pulse" />
            <span className="text-[10px] text-violet-400/60">Generating response...</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </Card>
  );
}
