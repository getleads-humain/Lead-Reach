'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Clock,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface ResearchStageInfo {
  stage: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  pipelineTriggered?: {
    started: boolean;
    campaignId?: string;
    status?: string;
  } | null;
  researchStages?: ResearchStageInfo[];
  isResearchReport?: boolean;
  leadScore?: number;
  leadTier?: 'hot' | 'warm' | 'cold';
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned?: boolean;
  messages: Message[];
}

// ============================================================
// Constants
// ============================================================

const suggestedPrompts = [
  { icon: Users, label: 'Find high-intent leads', description: 'Discover leads matching your ICP' },
  { icon: Mail, label: 'Draft outreach sequence', description: 'Create personalized email sequence' },
  { icon: BarChart3, label: 'Analyze campaign performance', description: 'Get insights on your campaigns' },
  { icon: Target, label: 'Score my pipeline', description: 'Evaluate lead quality and priorities' },
  { icon: TrendingUp, label: 'Suggest optimizations', description: 'Improve conversion rates' },
  { icon: Search, label: 'Research a company', description: 'Deep dive into prospect data' },
];

const initialMessages: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: "Hello! I'm your **LeadReach AI assistant** — connected to your live platform data and 17+ research channels. I can help you:\n\n- **Find leads** across Exa, LinkedIn, Twitter, GitHub, Reddit & more\n- **Research** companies and markets with deep multi-stage analysis\n- **Analyze** your pipeline with real data\n- **Craft outreach** with company intelligence\n\nTry asking me to research a company by name or URL — I'll execute a full 7-stage deep research pipeline and deliver an industry-grade report!",
    timestamp: new Date(),
  },
];

// Stage icons for the progress display
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
// Markdown Renderer
// ============================================================

const renderMarkdown = (text: string) => {
  if (!text) return null;

  const lines = text.split('\n');
  const rendered: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    // Headers
    if (line.startsWith('### ')) {
      rendered.push(
        <h4 key={i} className="text-sm font-bold text-foreground/90 mt-3 mb-1">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      rendered.push(
        <h3 key={i} className="text-sm font-bold text-foreground/90 mt-4 mb-1 border-b border-border/20 pb-1">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      rendered.push(
        <h2 key={i} className="text-base font-bold text-foreground/90 mt-4 mb-2 border-b border-emerald-500/20 pb-2">
          {line.slice(2)}
        </h2>
      );
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      rendered.push(<Separator key={i} className="bg-border/20 my-3" />);
    }
    // Empty line
    else if (line.trim() === '') {
      rendered.push(<div key={i} className="h-1" />);
    }
    // Bullet lists with bold prefix
    else if (line.match(/^[-*] \*\*/)) {
      const content = line.replace(/^[-*] /, '');
      rendered.push(
        <div key={i} className="flex gap-2 ml-1 my-0.5">
          <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
          <span
            className="leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: content
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground/90">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code class="bg-secondary/30 px-1 rounded text-[11px] font-mono">$1</code>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-emerald-400 hover:text-emerald-300 underline">$1</a>'),
            }}
          />
        </div>
      );
    }
    // Bullet lists without bold
    else if (line.match(/^[-*] /)) {
      rendered.push(
        <div key={i} className="flex gap-2 ml-1 my-0.5">
          <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
          <span
            className="leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: line
                .slice(2)
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground/90">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code class="bg-secondary/30 px-1 rounded text-[11px] font-mono">$1</code>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-emerald-400 hover:text-emerald-300 underline">$1</a>'),
            }}
          />
        </div>
      );
    }
    // Numbered lists
    else if (line.match(/^\d+\. /)) {
      const match = line.match(/^(\d+)\. (.*)/);
      if (match) {
        rendered.push(
          <div key={i} className="flex gap-2 ml-1 my-0.5">
            <span className="text-emerald-400 shrink-0 font-medium text-xs mt-0.5">{match[1]}.</span>
            <span
              className="leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: match[2]
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground/90">$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
                  .replace(/`(.+?)`/g, '<code class="bg-secondary/30 px-1 rounded text-[11px] font-mono">$1</code>')
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-emerald-400 hover:text-emerald-300 underline">$1</a>'),
              }}
            />
          </div>
        );
      }
    }
    // Regular paragraph
    else {
      rendered.push(
        <p
          key={i}
          className="leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground/90">$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/`(.+?)`/g, '<code class="bg-secondary/30 px-1 rounded text-[11px] font-mono">$1</code>')
              .replace(/<!--.*?-->/g, '')
              .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-emerald-400 hover:text-emerald-300 underline">$1</a>'),
          }}
        />
      );
    }
  });

  return rendered;
};

// ============================================================
// Research Progress Display Component
// ============================================================

function ResearchProgress({ stages }: { stages: ResearchStageInfo[] }) {
  if (stages.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/15">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Research Pipeline</span>
      </div>
      <div className="space-y-1.5">
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
    </div>
  );
}

// ============================================================
// Lead Score Badge Component
// ============================================================

function LeadScoreBadge({ score, tier }: { score: number; tier: string }) {
  const tierConfig = {
    hot: { color: 'bg-red-500/15 text-red-400 border-red-500/20', label: 'HOT' },
    warm: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', label: 'WARM' },
    cold: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', label: 'COLD' },
  };
  
  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.cold;
  
  return (
    <div className="flex items-center gap-2 mt-2">
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
// Main AI Assistant View
// ============================================================

export function AIAssistantView() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'New Conversation',
      lastMessage: 'Start a new conversation...',
      timestamp: new Date(),
      pinned: true,
      messages: initialMessages,
    },
  ]);
  const [activeConversation, setActiveConversation] = useState<string>('1');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [researchStages, setResearchStages] = useState<ResearchStageInfo[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive or research stages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isTyping, researchStages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // ============================================================
  // Deep Research SSE Handler
  // ============================================================

  const executeDeepResearch = useCallback(async (query: string, loadingMessageId: string, retryCount = 0) => {
    // Track collected data outside the SSE loop so we can build the final message
    let finalMarkdown = '';
    let finalLeadScore = 0;
    let finalLeadTier: 'hot' | 'warm' | 'cold' = 'cold';
    let finalCompanyName = '';
    const collectedStages: ResearchStageInfo[] = [];
    const MAX_RETRIES = 2;

    try {
      // Use AbortController with a generous timeout (3 minutes) for the full pipeline
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180_000);

      const response = await fetch('/api/ai-assistant/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If the API returns a non-SSE error (e.g. 503 when engine unavailable)
      if (!response.ok) {
        let errorDetail = `Deep research API returned ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error) errorDetail = errorBody.error;
          if (errorBody.details) errorDetail += ` — ${errorBody.details}`;
        } catch {
          // Response wasn't JSON, use the status text
          errorDetail = `Deep research API returned ${response.status}: ${response.statusText}`;
        }

        // Auto-retry on 502/503 errors (proxy timeout / service unavailable)
        if ((response.status === 502 || response.status === 503) && retryCount < MAX_RETRIES) {
          const delay = (retryCount + 1) * 2000; // 2s, 4s backoff
          console.log(`[Deep Research] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          // Update loading message to show retry status
          setMessages(prev => prev.map(m => 
            m.id === loadingMessageId
              ? { ...m, content: `Retrying research pipeline (attempt ${retryCount + 2})...` }
              : m
          ));

          await new Promise(r => setTimeout(r, delay));
          return executeDeepResearch(query, loadingMessageId, retryCount + 1);
        }

        throw new Error(errorDetail);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream — your browser may not support streaming responses');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE spec: events are separated by double newlines
        // Each event can have multiple lines; we parse "data:" lines
        const events = buffer.split('\n\n');
        // Keep the last (potentially incomplete) chunk in the buffer
        buffer = events.pop() || '';

        for (const event of events) {
          // Process each line in the event
          const lines = event.split('\n');
          for (const line of lines) {
            // Skip comment lines (heartbeats)
            if (line.startsWith(':')) continue;
            // Only process data lines
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'progress') {
                // Update research stages
                const stageInfo: ResearchStageInfo = {
                  stage: data.stage,
                  label: data.label,
                  status: data.status,
                  detail: data.detail,
                };

                // Track in local array for final message
                const existingIdx = collectedStages.findIndex(s => s.stage === data.stage);
                if (existingIdx >= 0) {
                  collectedStages[existingIdx] = stageInfo;
                } else {
                  collectedStages.push(stageInfo);
                }

                setResearchStages(prev => {
                  const existing = prev.findIndex(s => s.stage === data.stage);
                  if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = stageInfo;
                    return updated;
                  }
                  return [...prev, stageInfo];
                });

                // Update the loading message with current stage info
                setMessages(prev => prev.map(m => 
                  m.id === loadingMessageId
                    ? { ...m, content: `Researching: ${data.label}...`, researchStages: undefined }
                    : m
                ));
              }

              if (data.type === 'report') {
                finalMarkdown = data.markdown;
                finalLeadScore = data.leadScore || 0;
                finalLeadTier = data.leadTier || 'cold';
                finalCompanyName = data.companyName || '';
              }

              if (data.type === 'error') {
                throw new Error(data.message || 'Deep research failed');
              }

              // data.type === 'done' — research complete, loop will end naturally
            } catch (parseError) {
              // Re-throw if it's our deliberate error from data.type === 'error'
              if (parseError instanceof Error && !parseError.message.includes('JSON')) {
                throw parseError;
              }
              // Otherwise it's a JSON parse error on a non-data line, skip it
            }
          }
        }
      }

      // Replace loading message with final report
      const aiMessage: Message = {
        id: `ai-research-${Date.now()}`,
        role: 'assistant',
        content: finalMarkdown || 'Research completed but no report was generated. Please try again.',
        timestamp: new Date(),
        researchStages: collectedStages,
        isResearchReport: true,
        leadScore: finalLeadScore,
        leadTier: finalLeadTier,
      };

      setMessages(prev => prev.filter(m => m.id !== loadingMessageId).concat(aiMessage));
      setResearchStages([]);
      setIsTyping(false);

    } catch (error) {
      console.error('[Deep Research] Error:', error);

      // Build a user-friendly error message
      let userMessage: string;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';

      if (error instanceof DOMException && error.name === 'AbortError') {
        userMessage = 'The research pipeline timed out (3 minutes). This can happen with very broad queries. Try being more specific — for example, include a company name or URL.';
      } else if (errMsg.includes('502') || errMsg.includes('503')) {
        // After all retries exhausted
        userMessage = 'The research service is temporarily unavailable. This usually resolves within a few seconds — please try again. You can also ask me a general question while the service recovers.';
      } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('fetch failed')) {
        userMessage = 'Could not connect to the research service. Please check your internet connection and try again.';
      } else if (errMsg.includes('No readable stream')) {
        userMessage = 'Your browser does not support streaming responses. Please try using a modern browser (Chrome, Firefox, Edge).';
      } else {
        userMessage = `Deep research encountered an error: ${errMsg}. Try asking again or rephrase your query — I can also help with general questions.`;
      }

      // If we collected partial data, include it in the error message
      if (collectedStages.length > 0) {
        const completedStages = collectedStages.filter(s => s.status === 'completed');
        if (completedStages.length > 0) {
          userMessage += `\n\n**Partial results:** ${completedStages.map(s => s.label).join(', ')} completed before the error occurred.`;
        }
      }

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: userMessage,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => prev.filter(m => m.id !== loadingMessageId).concat(errorMessage));
      setResearchStages([]);
      setIsTyping(false);
    }
  }, []);

  // ============================================================
  // Send Message Handler
  // ============================================================

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsTyping(true);
    setResearchStages([]);

    try {
      // Build the full conversation history for context
      const conversationHistory = [...messages, userMessage]
        .filter((m) => !m.isLoading && !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Check if this is a deep research trigger
      if (data.deepResearch) {
        // Start the deep research pipeline with SSE streaming
        const researchQuery = data.researchQuery || trimmedInput;
        
        // Update the loading message to indicate research mode
        setMessages(prev => prev.map(m => 
          m.id === loadingMessage.id
            ? { ...m, content: 'Initiating deep research pipeline...' }
            : m
        ));

        // Execute the deep research with streaming
        await executeDeepResearch(researchQuery, loadingMessage.id);
        return;
      }

      // Normal chat response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.error || 'No response received.',
        timestamp: new Date(),
        isError: !!data.error,
        pipelineTriggered: data.pipeline || null,
      };

      setMessages(prev => prev.filter(m => m.id !== loadingMessage.id).concat(aiMessage));

      // Update conversation title if it's the first user message
      if (messages.length <= 1) {
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConversation
              ? {
                  ...c,
                  title: trimmedInput.slice(0, 40) + (trimmedInput.length > 40 ? '...' : ''),
                  lastMessage: aiMessage.content.slice(0, 60) + '...',
                  messages: [...messages.filter(m => !m.isLoading), userMessage, aiMessage],
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error('AI Assistant error:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'I encountered a connection error. This could be due to a network issue or the AI service being temporarily unavailable. Please try again in a moment.',
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => prev.filter(m => m.id !== loadingMessage.id).concat(errorMessage));
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      lastMessage: 'Start a new conversation...',
      timestamp: new Date(),
      messages: [initialMessages[0]],
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv.id);
    setMessages(newConv.messages);
    setResearchStages([]);
  };

  const handleSelectConversation = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setActiveConversation(convId);
      setMessages(conv.messages);
    }
  };

  const handleClearChat = () => {
    setMessages(initialMessages);
    setResearchStages([]);
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex h-full gap-4">
      {/* Conversation Sidebar */}
      {sidebarOpen && (
        <Card className="card-premium border-border/30 w-72 shrink-0 flex flex-col">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-foreground/80">Conversations</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={handleNewConversation}
                title="New conversation"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <div className="flex-1 px-2 overflow-y-auto">
            <div className="space-y-0.5 pb-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  className={cn(
                    'w-full text-left p-2.5 rounded-lg transition-all duration-200',
                    activeConversation === conv.id
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'hover:bg-secondary/30 border border-transparent'
                  )}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 mt-0.5',
                        activeConversation === conv.id ? 'text-emerald-400' : 'text-muted-foreground/50'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-[11px] font-medium truncate',
                            activeConversation === conv.id ? 'text-emerald-400' : 'text-foreground/80'
                          )}
                        >
                          {conv.title}
                        </span>
                        {conv.pinned && <Star className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{conv.lastMessage}</p>
                      <span className="text-[9px] text-muted-foreground/30 mt-1 block">
                        {conv.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-border/20 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground/50 hover:text-red-400 h-7 text-[10px]"
              onClick={handleClearChat}
            >
              <Trash2 className="h-3 w-3" />
              Clear current chat
            </Button>
          </div>
        </Card>
      )}

      {/* Main Chat Area */}
      <Card className="card-premium border-border/30 flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/20">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground/90">AI Assistant</h2>
              <p className="text-[10px] text-muted-foreground/50">Powered by LeadReach AI — Deep Research Enabled</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              className={cn(
                'h-5 px-2 text-[9px] border',
                isTyping
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              )}
            >
              {isTyping ? (
                <>
                  <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                  {researchStages.length > 0 ? 'Researching...' : 'Thinking...'}
                </>
              ) : (
                <>
                  <Zap className="h-2.5 w-2.5 mr-1" />
                  Online
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Messages — Scrollable Area */}
        <div 
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto p-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-1',
                      msg.isError
                        ? 'bg-red-500/10 border border-red-500/20'
                        : msg.isResearchReport
                        ? 'bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/20'
                        : 'bg-violet-500/10 border border-violet-500/20'
                    )}
                  >
                    {msg.isError ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    ) : msg.isResearchReport ? (
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-violet-400" />
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-emerald-600/20 border border-emerald-500/20 text-foreground/90'
                      : msg.isError
                      ? 'bg-red-500/5 border border-red-500/20 text-red-300/80'
                      : msg.isResearchReport
                      ? 'bg-secondary/20 border border-violet-500/15 text-foreground/80'
                      : 'bg-secondary/30 border border-border/20 text-foreground/80',
                    msg.isLoading && 'min-w-[200px]'
                  )}
                >
                  {msg.isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-muted-foreground/60">
                          {msg.content || 'Analyzing your request...'}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="h-1 w-6 rounded-full bg-violet-400/30 animate-pulse" />
                          <div className="h-1 w-4 rounded-full bg-violet-400/20 animate-pulse [animation-delay:0.15s]" />
                          <div className="h-1 w-2 rounded-full bg-violet-400/10 animate-pulse [animation-delay:0.3s]" />
                        </div>
                        {/* Show research stages if available */}
                        {researchStages.length > 0 && (
                          <ResearchProgress stages={researchStages} />
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Lead score badge for research reports */}
                      {msg.isResearchReport && msg.leadScore !== undefined && (
                        <LeadScoreBadge score={msg.leadScore} tier={msg.leadTier || 'cold'} />
                      )}
                      
                      <div className="text-sm space-y-0.5 mt-1">{renderMarkdown(msg.content)}</div>

                      {/* Pipeline triggered indicator */}
                      {msg.pipelineTriggered?.started && (
                        <div className="mt-3 pt-2 border-t border-border/15">
                          <div className="flex items-center gap-2 text-[10px]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Pipeline launched!</span>
                            <span className="text-muted-foreground/40">
                              Campaign: {msg.pipelineTriggered.campaignId?.slice(0, 8)}...
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/40 mt-1 ml-5.5">
                            Check the Campaigns page for real-time progress.
                          </p>
                        </div>
                      )}

                      {/* Research stages (collapsible) for research reports */}
                      {msg.researchStages && msg.researchStages.length > 0 && (
                        <ResearchProgress stages={msg.researchStages} />
                      )}

                      <span className="text-[9px] text-muted-foreground/30 mt-1.5 block">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0 mt-1">
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Active research stages during streaming (shown below messages) */}
            {isTyping && researchStages.length > 0 && !messages.some(m => m.isLoading) && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0 mt-1">
                  <Brain className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                </div>
                <div className="max-w-[85%] bg-secondary/20 border border-violet-500/15 rounded-xl px-4 py-3">
                  <ResearchProgress stages={researchStages} />
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />

            {/* Suggested Prompts (show when few messages) */}
            {messages.length <= 2 && !isTyping && (
              <>
                <Separator className="bg-border/20 my-4" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold text-foreground/70">Suggested prompts</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedPrompts.map((prompt, i) => {
                      const Icon = prompt.icon;
                      return (
                        <button
                          key={i}
                          className="flex items-start gap-2.5 p-3 rounded-lg border border-border/20 bg-secondary/10 hover:bg-secondary/20 hover:border-emerald-500/20 transition-all duration-200 text-left group"
                          onClick={() => handlePromptClick(prompt.label)}
                        >
                          <Icon className="h-4 w-4 text-emerald-400/60 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-foreground/80 group-hover:text-foreground/90">
                              {prompt.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground/50 mt-0.5">{prompt.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border/20 p-3 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  placeholder="Ask AI anything — research a company, find leads, analyze data..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  disabled={isTyping}
                  className="h-10 text-sm bg-secondary/20 border-border/30 focus:border-emerald-500/30 pr-10 disabled:opacity-50"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className={cn(
                  'h-10 gap-1.5 px-4 transition-all',
                  isTyping
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                {isTyping ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">{researchStages.length > 0 ? 'Researching' : 'Thinking'}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="text-xs">Send</span>
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[9px] text-muted-foreground/30 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                Deep research enabled — 7-stage pipeline with real data
              </span>
              <span className="text-[9px] text-muted-foreground/20 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {isTyping ? 'Processing...' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
