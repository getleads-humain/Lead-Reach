'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAIChat, type ChatMessage } from '@/hooks/use-ai-chat';
import type { ViewType } from '@/lib/types';
import { cn } from '@/lib/utils';

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

const QUICK_ACTIONS: Record<string, Array<{ label: string; prompt: string; icon: React.ElementType }>> = {
  dashboard: [
    { label: 'Analyze pipeline', prompt: 'Analyze my current pipeline and suggest improvements', icon: BarChart3 },
    { label: 'Key insights', prompt: 'What are the key insights from my current dashboard data?', icon: Lightbulb },
  ],
  leads: [
    { label: 'Score leads', prompt: 'Help me understand how to improve lead scores across my pipeline', icon: Target },
    { label: 'Prioritize outreach', prompt: 'Which leads should I prioritize for outreach today?', icon: Mail },
  ],
  outreach: [
    { label: 'Generate sequence', prompt: 'Help me generate an outreach sequence for my top leads', icon: Mail },
    { label: 'Improve messaging', prompt: 'How can I improve my outreach messaging to get better response rates?', icon: Sparkles },
  ],
  campaigns: [
    { label: 'Find new leads', prompt: 'I want to find new leads. Help me start a prospect discovery campaign.', icon: Search },
    { label: 'Campaign health', prompt: 'Analyze the health of my active campaigns and suggest improvements', icon: BarChart3 },
  ],
  reports: [
    { label: 'Executive summary', prompt: 'Generate an executive summary of my lead generation performance', icon: BarChart3 },
    { label: 'Trend analysis', prompt: 'What trends do you see in my lead data?', icon: Lightbulb },
  ],
  messaging: [
    { label: 'Draft reply', prompt: 'Help me draft a reply to my most active conversation', icon: Mail },
    { label: 'Follow-up tips', prompt: 'Give me follow-up messaging tips to improve engagement', icon: Lightbulb },
  ],
  'prospect-discovery': [
    { label: 'Research industry', prompt: 'Research the top companies in my target industry', icon: Search },
    { label: 'Find decision makers', prompt: 'Help me find decision makers at target companies', icon: Target },
  ],
  icp: [
    { label: 'Refine ICP', prompt: 'Help me refine my Ideal Customer Profile based on my best-performing leads', icon: Target },
    { label: 'ICP analysis', prompt: 'Analyze my current ICP and suggest improvements', icon: Lightbulb },
  ],
};

const DEFAULT_ACTIONS = [
  { label: 'Find leads', prompt: 'I want to discover new leads for my business', icon: Search },
  { label: 'Get insights', prompt: 'Give me insights about my lead generation performance', icon: Lightbulb },
];

const SYSTEM_PROMPT = `You are LeadReach AI, an intelligent assistant for the LeadReach B2B lead generation platform. You help users with:

1. **Lead Discovery** — Multi-channel search across the web, LinkedIn, Twitter, GitHub, Reddit
2. **Data Enrichment** — Deep website reading, contact extraction, firmographic data
3. **Lead Qualification** — AI-powered scoring with intent signal detection
4. **Outreach** — Personalized messages crafted from real company intelligence using frameworks like BANT, Observation-Ask, Problem-Proof-Ask
5. **Pipeline Management** — Track leads through stages from discovery to close
6. **Reports & Analytics** — Campaign analytics and pipeline insights
7. **ICP Building** — Define and refine Ideal Customer Profiles
8. **Multi-channel Messaging** — SMS, WhatsApp, Instagram, Facebook, Email

You are currently on the {currentPage} page. Tailor your responses to be context-aware. If the user asks to do something that belongs on a different page (e.g., "research Stripe" while on Dashboard), suggest navigating to the appropriate page.

Be concise, actionable, and helpful. Use bullet points for lists. If you don't know something, say so honestly.`;

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { activeView, setActiveView } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentViewLabel = VIEW_LABELS[activeView] || 'Dashboard';
  const systemPromptWithCtx = SYSTEM_PROMPT.replace('{currentPage}', currentViewLabel);
  const quickActions = QUICK_ACTIONS[activeView] || DEFAULT_ACTIONS;

  const {
    messages,
    isLoading,
    error,
    sendMessageWithContext,
    clearMessages,
  } = useAIChat({
    systemPrompt: systemPromptWithCtx,
    maxHistory: 30,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await sendMessageWithContext(msg, systemPromptWithCtx);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (prompt: string) => {
    setInput('');
    await sendMessageWithContext(prompt, systemPromptWithCtx);
  };

  const handleNavigate = (view: ViewType) => {
    setActiveView(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/20 transition-all duration-300 animate-in slide-in-from-bottom-4 sm:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground/90">LeadReach AI</div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">On {currentViewLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={clearMessages}
                title="Clear chat"
              >
                <ChevronUp className="h-3.5 w-3.5" />
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
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10">
                  <Sparkles className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/80">How can I help you?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask about leads, outreach, pipeline, or anything else
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/15 px-3 py-2 text-left text-xs text-muted-foreground transition-all hover:bg-secondary/25 hover:text-foreground hover:border-emerald-500/20"
                      >
                        <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="line-clamp-1">{action.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Suggestions */}
                <div className="w-full mt-2 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">Navigate to</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(['prospect-discovery', 'leads', 'outreach', 'reports', 'icp'] as ViewType[]).map((view) => (
                      <button
                        key={view}
                        onClick={() => handleNavigate(view)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border border-border/25 bg-secondary/10 px-2.5 py-1 text-[10px] text-muted-foreground transition-all hover:bg-secondary/20 hover:text-foreground hover:border-emerald-500/20",
                          activeView === view && "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                        )}
                      >
                        {VIEW_LABELS[view]}
                        {activeView !== view && <ArrowRight className="h-2.5 w-2.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10">
                  <Bot className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="rounded-xl bg-secondary/20 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 text-emerald-400 animate-spin" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border/40 px-4 py-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your leads..."
                  rows={1}
                  className="resize-none bg-secondary/20 border-border/30 text-sm min-h-[38px] max-h-[80px] focus:border-emerald-500/30 pr-2"
                />
              </div>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-[38px] w-[38px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">Press Enter to send, Shift+Enter for new line</span>
              <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                <Zap className="h-2.5 w-2.5 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-2.5', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-secondary/30'
            : 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10'
        )}
      >
        {isUser ? (
          <span className="text-xs font-bold text-foreground/60">U</span>
        ) : (
          <Bot className="h-3.5 w-3.5 text-emerald-400" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-3 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-emerald-500/10 text-foreground/90 border border-emerald-500/10'
            : 'bg-secondary/20 text-foreground/80'
        )}
      >
        {message.content.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line.startsWith('## ') ? (
              <strong className="text-foreground/90">{line.replace('## ', '')}</strong>
            ) : line.startsWith('- ') ? (
              <div className="flex gap-1.5 ml-1">
                <span className="text-emerald-400 shrink-0">•</span>
                <span>{line.replace('- ', '')}</span>
              </div>
            ) : line.startsWith('**') && line.endsWith('**') ? (
              <strong className="text-foreground/90">{line.replace(/\*\*/g, '')}</strong>
            ) : (
              <span>{line}</span>
            )}
            {i < message.content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
