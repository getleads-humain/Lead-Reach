'use client';

/**
 * Office Chat — Realistic Inter-Agent Communication
 * ================================================
 * Renders a chat interface that looks and feels like a real office
 * communication channel. Features:
 * - Realistic office background (CSS gradient evoking an office space)
 * - Live inter-agent messages (agent-to-agent communication)
 * - User-to-agent direct messaging
 * - Message types: text, status_update, task_update, alert, system
 * - Timestamps and agent avatars
 * - Auto-scroll to latest message
 * - Polls for new messages every 10 seconds
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Users,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Wifi,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  agentId: string;
  role: string; // user, assistant, system, agent_comm
  content: string;
  fromAgent: string | null;
  toAgent: string | null;
  messageType: string; // text, status_update, task_update, alert, system
  metadata: string | null;
  createdAt: string;
}

interface AgentInfo {
  id: string;
  name: string;
  avatar: string;
  color: string;
  slug: string;
  department: string;
}

interface OfficeChatProps {
  agent: AgentInfo;
}

// ── Agent display names (slug → readable name) ────────────────────────

const AGENT_NAMES: Record<string, { name: string; avatar: string; color: string }> = {
  'prometheus-ceo': { name: 'PROMETHEUS', avatar: '👑', color: '#f59e0b' },
  'kronos-orchestrator': { name: 'KRONOS', avatar: '⚙️', color: '#3b82f6' },
  'market-strategist': { name: 'Market Strategist', avatar: '📊', color: '#10b981' },
  'content-architect': { name: 'Content Architect', avatar: '✍️', color: '#8b5cf6' },
  'media-buyer': { name: 'Media Buyer', avatar: '📢', color: '#ec4899' },
  'sales-engine': { name: 'Sales Engine', avatar: '🎯', color: '#f97316' },
  'core-architect': { name: 'Core Architect', avatar: '🏗️', color: '#06b6d4' },
  'feature-developer': { name: 'Feature Dev', avatar: '💻', color: '#3b82f6' },
  'qa-tester': { name: 'QA Tester', avatar: '🧪', color: '#84cc16' },
  'devops-automator': { name: 'DevOps', avatar: '🚀', color: '#6366f1' },
  'cyber-guardian': { name: 'Cyber Guardian', avatar: '🛡️', color: '#ef4444' },
  'cfo-ledger': { name: 'CFO Ledger', avatar: '💰', color: '#84cc16' },
  'compliance-legal': { name: 'Compliance', avatar: '⚖️', color: '#a855f7' },
  'synthetic-hr': { name: 'HR', avatar: '🤝', color: '#14b8a6' },
};

function getAgentDisplay(slug: string | null): { name: string; avatar: string; color: string } {
  if (!slug) return { name: 'Unknown', avatar: '🤖', color: '#6b7280' };
  return AGENT_NAMES[slug] || { name: slug, avatar: '🤖', color: '#6b7280' };
}

function getMessageIcon(messageType: string) {
  switch (messageType) {
    case 'status_update': return <Activity className="h-3 w-3" />;
    case 'task_update': return <CheckCircle2 className="h-3 w-3" />;
    case 'alert': return <AlertCircle className="h-3 w-3" />;
    default: return null;
  }
}

function getMessageStyle(messageType: string): { bg: string; border: string; textColor: string } {
  switch (messageType) {
    case 'status_update':
      return { bg: 'bg-blue-500/5', border: 'border-blue-500/20', textColor: 'text-blue-400' };
    case 'task_update':
      return { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', textColor: 'text-emerald-400' };
    case 'alert':
      return { bg: 'bg-red-500/5', border: 'border-red-500/20', textColor: 'text-red-400' };
    case 'system':
      return { bg: 'bg-zinc-500/5', border: 'border-zinc-500/20', textColor: 'text-zinc-400' };
    default:
      return { bg: '', border: 'border-border/30', textColor: '' };
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────

export function OfficeChat({ agent }: OfficeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Fetch messages ──
  const fetchMessages = useCallback(async (since?: string) => {
    try {
      const url = `/api/workforce/${agent.id}/messages?limit=100${since ? `&since=${encodeURIComponent(since)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
          return [...prev, ...newMsgs].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        setLastFetch(new Date().toISOString());
      }
    } catch (err) {
      console.error('[OfficeChat] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [agent.id]);

  // ── Initial load ──
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setLastFetch(null);
    fetchMessages();
  }, [agent.id, fetchMessages]);

  // ── Poll for new messages every 10 seconds ──
  useEffect(() => {
    const timer = setInterval(() => {
      fetchMessages(lastFetch || undefined);
    }, 10000);
    return () => clearInterval(timer);
  }, [lastFetch, fetchMessages]);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Send message ──
  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/workforce/${agent.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: input.trim(),
          messageType: 'text',
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setInput('');
      }
    } catch (err) {
      console.error('[OfficeChat] Send error:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Group messages by date ──
  const messageGroups: Array<{ date: string; messages: ChatMessage[] }> = [];
  let currentDate = '';
  for (const msg of messages) {
    const dateLabel = formatDate(msg.createdAt);
    if (dateLabel !== currentDate) {
      currentDate = dateLabel;
      messageGroups.push({ date: dateLabel, messages: [msg] });
    } else {
      messageGroups[messageGroups.length - 1].messages.push(msg);
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Office Environment Header ── */}
      <div
        className="relative overflow-hidden rounded-xl border border-border/30"
        style={{
          background: `
            linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%),
            repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,255,255,0.02) 80px, rgba(255,255,255,0.02) 81px),
            repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(255,255,255,0.02) 80px, rgba(255,255,255,0.02) 81px)
          `,
        }}
      >
        {/* Office ambiance glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 20% 0%, ${agent.color}08 0%, transparent 50%),
                         radial-gradient(ellipse at 80% 100%, ${agent.color}05 0%, transparent 50%)`,
          }}
        />

        {/* Header bar */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-border/20">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <span className="text-xl">{agent.avatar}</span>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
                  style={{ backgroundColor: '#10b981' }}
                >
                  <span
                    className="absolute inset-0 animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: '#10b981' }}
                  />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground/90">{agent.name}</h3>
                <div className="flex items-center gap-1 text-[10px] text-foreground/40">
                  <Wifi className="h-2.5 w-2.5 text-emerald-400" />
                  <span>Online · Office Floor</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] border-border/30 text-foreground/40">
              <Users className="h-2.5 w-2.5 mr-1" />
              {messages.filter(m => m.role === 'agent_comm').length} inter-agent
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-foreground/40 hover:text-foreground"
              onClick={() => fetchMessages()}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ── Chat messages area with office background ── */}
        <div
          ref={scrollRef}
          className="relative h-[400px] sm:h-[500px] overflow-y-auto px-4 py-3"
          style={{
            background: `
              linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.3) 100%),
              radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.03) 0%, transparent 60%)
            `,
          }}
        >
          {loading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
              <p className="text-xs text-foreground/30">Loading office conversations…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="text-4xl opacity-30">{agent.avatar}</div>
              <p className="text-sm text-foreground/40">No messages yet</p>
              <p className="text-xs text-foreground/25">
                Start a conversation with {agent.name} or seed activity from the dashboard
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {messageGroups.map((group, gi) => (
                <div key={gi}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-3">
                    <div className="px-3 py-0.5 rounded-full bg-secondary/50 text-[10px] text-foreground/40 font-medium">
                      {group.date}
                    </div>
                  </div>

                  {/* Messages */}
                  {group.messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const fromAgentInfo = getAgentDisplay(msg.fromAgent);
                    const msgStyle = getMessageStyle(msg.messageType);
                    const msgIcon = getMessageIcon(msg.messageType);

                    if (isUser) {
                      // User message — right aligned
                      return (
                        <div key={msg.id} className="flex justify-end mb-2">
                          <div className="max-w-[75%]">
                            <div
                              className="rounded-xl rounded-tr-sm px-3 py-2 text-sm text-foreground/90"
                              style={{
                                backgroundColor: `${agent.color}20`,
                                border: `1px solid ${agent.color}30`,
                              }}
                            >
                              <p className="leading-relaxed">{msg.content}</p>
                              <span className="text-[9px] text-foreground/30 mt-1 block">
                                {formatTime(msg.createdAt)} · You
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (msg.role === 'agent_comm') {
                      // Inter-agent communication — styled differently
                      const isOutgoing = msg.fromAgent === agent.slug;
                      return (
                        <div key={msg.id} className={`flex mb-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[75%]">
                            <div className={`flex items-center gap-1.5 mb-0.5 ${isOutgoing ? 'justify-end' : ''}`}>
                              <span className="text-sm">{fromAgentInfo.avatar}</span>
                              <span className="text-[10px] font-medium" style={{ color: fromAgentInfo.color }}>
                                {fromAgentInfo.name}
                              </span>
                              {msgIcon && (
                                <span className={msgStyle.textColor}>{msgIcon}</span>
                              )}
                              <span className="text-[9px] text-foreground/30">
                                → {getAgentDisplay(msg.toAgent).name}
                              </span>
                            </div>
                            <div
                              className={`rounded-xl ${isOutgoing ? 'rounded-tr-sm' : 'rounded-tl-sm'} px-3 py-2 text-sm ${msgStyle.bg} border ${msgStyle.border}`}
                            >
                              <p className="leading-relaxed text-foreground/80">{msg.content}</p>
                              <span className="text-[9px] text-foreground/30 mt-1 block">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Assistant / system messages
                    return (
                      <div key={msg.id} className="flex justify-start mb-2">
                        <div className="max-w-[75%]">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm">{agent.avatar}</span>
                            <span className="text-[10px] font-medium" style={{ color: agent.color }}>
                              {agent.name}
                            </span>
                          </div>
                          <div
                            className="rounded-xl rounded-tl-sm px-3 py-2 text-sm border border-border/30"
                            style={{ backgroundColor: `${agent.color}10` }}
                          >
                            <p className="leading-relaxed text-foreground/80">{msg.content}</p>
                            <span className="text-[9px] text-foreground/30 mt-1 block">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="relative flex items-center gap-2 px-4 py-3 border-t border-border/20 bg-background/50">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${agent.name}…`}
            className="flex-1 bg-input/50 border-border/30 text-foreground text-sm placeholder:text-foreground/30"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="icon"
            style={{ backgroundColor: agent.color }}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            ) : (
              <Send className="h-4 w-4 text-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
