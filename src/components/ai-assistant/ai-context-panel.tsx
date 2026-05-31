'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  Send,
  Loader2,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { useAIChat } from '@/hooks/use-ai-chat';
import { cn } from '@/lib/utils';

interface AIContextPanelProps {
  /** Title of the panel */
  title?: string;
  /** System prompt with view-specific context */
  systemPrompt: string;
  /** Suggested prompts to show as chips */
  suggestions?: Array<{ label: string; prompt: string }>;
  /** Optional pre-loaded insight to display */
  initialInsight?: string | null;
  /** Whether the initial insight is loading */
  initialLoading?: boolean;
  /** Compact mode - smaller height, fewer features */
  compact?: boolean;
  /** Optional className */
  className?: string;
}

export function AIContextPanel({
  title = 'AI Assistant',
  systemPrompt,
  suggestions = [],
  initialInsight,
  initialLoading = false,
  compact = false,
  className,
}: AIContextPanelProps) {
  const [input, setInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const {
    messages,
    isLoading,
    error,
    sendMessageWithContext,
    clearMessages,
  } = useAIChat({
    systemPrompt,
    maxHistory: 15,
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    setShowChat(true);
    await sendMessageWithContext(msg, systemPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = async (prompt: string) => {
    setShowChat(true);
    await sendMessageWithContext(prompt, systemPrompt);
  };

  return (
    <Card className={cn('card-premium border-border/40 relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <div className="rounded-md p-1.5 bg-emerald-500/10">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          {title}
          <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 ml-auto">
            <Zap className="h-2.5 w-2.5 mr-1" />
            AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-3">
        {/* Initial Insight (auto-loaded) */}
        {initialLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-secondary/30" />
            <Skeleton className="h-4 w-4/5 bg-secondary/30" />
            {!compact && <Skeleton className="h-4 w-3/5 bg-secondary/30" />}
          </div>
        )}

        {initialInsight && !showChat && (
          <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 text-sm text-foreground/80 leading-relaxed">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="whitespace-pre-wrap">{initialInsight}</div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {showChat && messages.length > 0 && (
          <div className={cn('space-y-2 overflow-y-auto', compact ? 'max-h-32' : 'max-h-48')}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-secondary/20 text-foreground/70 ml-4'
                    : 'bg-emerald-500/5 border border-emerald-500/10 text-foreground/80 mr-4'
                )}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-1.5 px-3 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 text-emerald-400 animate-spin" />
                Thinking...
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {!showChat && suggestions.length > 0 && !initialLoading && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSuggestion(s.prompt)}
                className="rounded-full border border-border/25 bg-secondary/10 px-2.5 py-1 text-[10px] text-muted-foreground transition-all hover:bg-secondary/20 hover:text-foreground hover:border-emerald-500/20"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Chat controls when visible */}
        {showChat && (
          <button
            onClick={() => { clearMessages(); setShowChat(false); }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset conversation
          </button>
        )}

        {/* Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI about your data..."
              rows={1}
              className="resize-none bg-secondary/20 border-border/30 text-xs min-h-[32px] max-h-[60px] focus:border-emerald-500/30"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-[32px] w-[32px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
