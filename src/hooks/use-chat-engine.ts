'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ViewType } from '@/lib/types';

// ============================================================
// Types
// ============================================================

export interface ResearchStageInfo {
  stage: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail?: string;
}

export interface LeadDataItem {
  name: string;
  company: string;
  title: string;
  email?: string;
  phone?: string;
  score?: number;
  tier?: 'hot' | 'warm' | 'cold';
  source?: string;
  reason?: string;
  website?: string;
  linkedin?: string;
}

export interface ICPData {
  industry?: string[];
  companySize?: string[];
  location?: string[];
  role?: string[];
  painPoints?: string[];
  signals?: string[];
  budgetRange?: string;
  decisionTimeline?: string;
  description?: string;
}

export interface OutreachMessage {
  channel: string;
  subject: string;
  body: string;
  tone: string;
}

export interface SaveTarget {
  id: string;
  type: 'leads' | 'icp' | 'outreach' | 'campaign' | 'report';
  label: string;
  viewTarget: ViewType;
  data: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isLoading?: boolean;
  isError?: boolean;
  isStreaming?: boolean;
  pipelineTriggered?: {
    started: boolean;
    campaignId?: string;
    status?: string;
  } | null;
  researchStages?: ResearchStageInfo[];
  isResearchReport?: boolean;
  leadScore?: number;
  leadTier?: 'hot' | 'warm' | 'cold';
  feedback?: 'up' | 'down' | null;
  // New smart-chat fields
  actionType?: string;
  actionLabel?: string;
  saveTargets?: SaveTarget[];
  savedTargets?: string[];
  leadData?: LeadDataItem[];
  icpData?: ICPData;
  outreachData?: OutreachMessage[];
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  pinned: boolean;
  messages: ChatMessage[];
}

export interface ChatEngine {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  isThinking: boolean;
  streamingContent: string;
  error: string | null;
  researchStages: ResearchStageInfo[];
  sendMessage: (content: string, systemPrompt?: string, currentPage?: string) => Promise<void>;
  stopStreaming: () => void;
  regenerateLastMessage: (systemPrompt?: string, currentPage?: string) => Promise<void>;
  createConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  pinConversation: (id: string) => void;
  clearActiveConversation: () => void;
  copyMessage: (messageId: string) => void;
  feedbackMessage: (messageId: string, type: 'up' | 'down') => void;
  saveToSection: (messageId: string, saveTarget: SaveTarget) => Promise<void>;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'leadreach-chat-conversations';
const MAX_CONVERSATIONS = 50;

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================
// Hook
// ============================================================

export function useChatEngine(): ChatEngine {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const loaded = loadConversations();
    if (loaded.length > 0) return loaded;
    const initial: Conversation = {
      id: generateId(),
      title: 'New Conversation',
      lastMessage: '',
      timestamp: Date.now(),
      pinned: false,
      messages: [],
    };
    return [initial];
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const loaded = loadConversations();
    return loaded.length > 0 ? loaded[0].id : conversations[0].id;
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [researchStages, setResearchStages] = useState<ResearchStageInfo[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  // Get active messages
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Persist conversations whenever they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ============================================================
  // Update a specific message in the active conversation
  // ============================================================

  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== activeConversationId) return c;
      return {
        ...c,
        messages: c.messages.map(m =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      };
    }));
  }, [activeConversationId]);

  // ============================================================
  // Send Message — calls /api/ai-assistant/smart-chat with SSE
  // ============================================================

  const sendMessage = useCallback(async (content: string, systemPrompt?: string, currentPage?: string) => {
    if (!content.trim() || isStreaming) return;

    const convId = activeConversationId;
    if (!convId) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const thinkingMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isLoading: true,
    };

    // Add user message + thinking indicator
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const updatedMessages = [...c.messages, userMessage, thinkingMessage];
      return {
        ...c,
        messages: updatedMessages,
        lastMessage: content.trim().slice(0, 60),
        timestamp: Date.now(),
        title: c.messages.length === 0
          ? content.trim().slice(0, 40) + (content.trim().length > 40 ? '...' : '')
          : c.title,
      };
    }));

    setIsThinking(true);
    setIsStreaming(true);
    setError(null);
    setResearchStages([]);

    // Cancel any existing request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build conversation history
      const currentConv = conversations.find(c => c.id === convId);
      const historyMessages = [
        ...(currentConv?.messages || []).filter(m => !m.isLoading && !m.isError).map(m => ({
          role: m.role,
          content: m.content,
        })),
        { role: userMessage.role, content: userMessage.content },
      ];

      const response = await fetch('/api/ai-assistant/smart-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyMessages,
          systemPrompt: systemPrompt || 'You are LeadReach AI, an intelligent assistant for B2B lead generation.',
          currentPage: currentPage || '',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      if (controller.signal.aborted) return;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let actionType = '';
      let actionLabel = '';
      const collectedSaveTargets: SaveTarget[] = [];
      const collectedLeads: LeadDataItem[] = [];
      let collectedICP: ICPData | undefined;
      const collectedOutreach: OutreachMessage[] = [];
      const collectedStages: ResearchStageInfo[] = [];

      // Transition from loading to streaming
      updateMessage(thinkingMessage.id, {
        isLoading: false,
        isStreaming: true,
        content: '',
      });

      setIsThinking(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }

          if (!eventData) continue;

          try {
            const data = JSON.parse(eventData);

            switch (eventType) {
              case 'thinking': {
                updateMessage(thinkingMessage.id, {
                  content: data.content || 'Thinking...',
                });
                break;
              }

              case 'action_detected': {
                actionType = data.action || '';
                actionLabel = data.label || '';
                updateMessage(thinkingMessage.id, {
                  actionType,
                  actionLabel,
                  content: '',
                });
                break;
              }

              case 'progress': {
                const stageInfo: ResearchStageInfo = {
                  stage: data.stage || '',
                  label: data.label || '',
                  status: 'completed' as const,
                  detail: data.detail,
                };
                const existingIdx = collectedStages.findIndex(s => s.stage === data.stage);
                if (existingIdx >= 0) collectedStages[existingIdx] = stageInfo;
                else collectedStages.push(stageInfo);

                setResearchStages(prev => {
                  const existing = prev.findIndex(s => s.stage === data.stage);
                  if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = stageInfo;
                    return updated;
                  }
                  return [...prev, stageInfo];
                });
                break;
              }

              case 'content': {
                accumulatedContent += data.chunk || '';
                updateMessage(thinkingMessage.id, {
                  content: accumulatedContent,
                  isStreaming: true,
                  actionType: actionType || undefined,
                  actionLabel: actionLabel || undefined,
                  researchStages: [...collectedStages],
                });
                break;
              }

              case 'lead_data': {
                const leads = (data.leads || []) as LeadDataItem[];
                collectedLeads.push(...leads);
                updateMessage(thinkingMessage.id, {
                  leadData: [...collectedLeads],
                });
                break;
              }

              case 'icp_data': {
                collectedICP = data.icp as ICPData;
                updateMessage(thinkingMessage.id, {
                  icpData: collectedICP,
                });
                break;
              }

              case 'outreach_data': {
                const outreachMsgs = (data.messages || []) as OutreachMessage[];
                collectedOutreach.push(...outreachMsgs);
                updateMessage(thinkingMessage.id, {
                  outreachData: [...collectedOutreach],
                });
                break;
              }

              case 'action_result': {
                const saveTarget = data.saveTarget as ViewType | null;
                const action = data.action as string;
                const resultData = data.data;

                if (saveTarget) {
                  const targetId = generateId();
                  let type: SaveTarget['type'] = 'report';
                  let label = 'Save Results';

                  if (action === 'discover_leads') {
                    type = 'leads';
                    label = `Save ${collectedLeads.length} Lead${collectedLeads.length !== 1 ? 's' : ''}`;
                  } else if (action === 'build_icp') {
                    type = 'icp';
                    label = 'Save ICP Profile';
                  } else if (action === 'compose_outreach') {
                    type = 'outreach';
                    label = 'Save Outreach Templates';
                  } else if (action === 'enrich_data') {
                    type = 'report';
                    label = 'Save Enrichment Data';
                  }

                  const st: SaveTarget = {
                    id: targetId,
                    type,
                    label,
                    viewTarget: saveTarget,
                    data: resultData,
                  };
                  collectedSaveTargets.push(st);
                }

                updateMessage(thinkingMessage.id, {
                  saveTargets: [...collectedSaveTargets],
                  leadData: collectedLeads.length > 0 ? [...collectedLeads] : undefined,
                  icpData: collectedICP,
                  outreachData: collectedOutreach.length > 0 ? [...collectedOutreach] : undefined,
                });
                break;
              }

              case 'done': {
                // Finalize the message
                updateMessage(thinkingMessage.id, {
                  isStreaming: false,
                  isLoading: false,
                  content: accumulatedContent,
                  actionType: actionType || undefined,
                  actionLabel: actionLabel || undefined,
                  saveTargets: collectedSaveTargets.length > 0 ? [...collectedSaveTargets] : undefined,
                  leadData: collectedLeads.length > 0 ? [...collectedLeads] : undefined,
                  icpData: collectedICP,
                  outreachData: collectedOutreach.length > 0 ? [...collectedOutreach] : undefined,
                  researchStages: [...collectedStages],
                  isResearchReport: collectedStages.length > 0,
                });
                break;
              }

              case 'error': {
                updateMessage(thinkingMessage.id, {
                  isStreaming: false,
                  isLoading: false,
                  isError: true,
                  content: data.message || 'An error occurred during processing.',
                });
                break;
              }
            }
          } catch {
            // Ignore JSON parse errors for individual events
          }
        }
      }

      // Ensure message is finalized
      updateMessage(thinkingMessage.id, {
        isStreaming: false,
        isLoading: false,
        content: accumulatedContent,
        actionType: actionType || undefined,
        actionLabel: actionLabel || undefined,
        saveTargets: collectedSaveTargets.length > 0 ? [...collectedSaveTargets] : undefined,
        leadData: collectedLeads.length > 0 ? [...collectedLeads] : undefined,
        icpData: collectedICP,
        outreachData: collectedOutreach.length > 0 ? [...collectedOutreach] : undefined,
        researchStages: [...collectedStages],
      });

      setStreamingContent('');
      setIsStreaming(false);
      setResearchStages([]);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;

      const errMsg = err instanceof Error ? err.message : 'Failed to get AI response';
      const isRateLimitError = errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('high demand');
      const errorContent = isRateLimitError
        ? 'The AI service is currently experiencing high demand. Please wait a moment and try again.'
        : `I encountered an error: ${errMsg}. Please try again.`;

      setError(errorContent);

      // Replace thinking message with error
      updateMessage(thinkingMessage.id, {
        content: errorContent,
        isLoading: false,
        isStreaming: false,
        isError: true,
      });

      setIsThinking(false);
      setIsStreaming(false);
    }
  }, [activeConversationId, conversations, isStreaming, updateMessage]);

  // ============================================================
  // Stop Streaming
  // ============================================================

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsThinking(false);
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  // ============================================================
  // Regenerate Last Message
  // ============================================================

  const regenerateLastMessage = useCallback(async (systemPrompt?: string, currentPage?: string) => {
    const conv = conversations.find(c => c.id === activeConversationId);
    if (!conv) return;

    // Find last user message
    const lastUserMsg = [...conv.messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove all messages after the last user message
    const lastUserIdx = conv.messages.findIndex(m => m.id === lastUserMsg.id);
    const trimmedMessages = conv.messages.slice(0, lastUserIdx);

    setConversations(prev => prev.map(c => {
      if (c.id !== activeConversationId) return c;
      return { ...c, messages: trimmedMessages };
    }));

    // Re-send
    await sendMessage(lastUserMsg.content, systemPrompt, currentPage);
  }, [conversations, activeConversationId, sendMessage]);

  // ============================================================
  // Save To Section
  // ============================================================

  const saveToSection = useCallback(async (messageId: string, saveTarget: SaveTarget): Promise<void> => {
    try {
      const response = await fetch('/api/ai-assistant/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: saveTarget.type,
          data: saveTarget.data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(errorData.error || `Save failed with status ${response.status}`);
      }

      const result = await response.json();

      // Update the message's savedTargets
      setConversations(prev => prev.map(c => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId
              ? {
                  ...m,
                  savedTargets: [...(m.savedTargets || []), saveTarget.id],
                  saveTargets: m.saveTargets?.filter(st => st.id !== saveTarget.id),
                }
              : m
          ),
        };
      }));

      return result;
    } catch (error) {
      console.error('[saveToSection] Error:', error);
      throw error;
    }
  }, [activeConversationId]);

  // ============================================================
  // Conversation Management
  // ============================================================

  const createConversation = useCallback(() => {
    const newConv: Conversation = {
      id: generateId(),
      title: 'New Conversation',
      lastMessage: '',
      timestamp: Date.now(),
      pinned: false,
      messages: [],
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setError(null);
    setResearchStages([]);
  }, []);

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setError(null);
    setResearchStages([]);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const newConv: Conversation = {
          id: generateId(),
          title: 'New Conversation',
          lastMessage: '',
          timestamp: Date.now(),
          pinned: false,
          messages: [],
        };
        setActiveConversationId(newConv.id);
        return [newConv];
      }
      if (id === activeConversationId) {
        setActiveConversationId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeConversationId]);

  const pinConversation = useCallback((id: string) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    ));
  }, []);

  const clearActiveConversation = useCallback(() => {
    setConversations(prev => prev.map(c => {
      if (c.id !== activeConversationId) return c;
      return { ...c, messages: [], lastMessage: '', title: 'New Conversation' };
    }));
    setError(null);
    setResearchStages([]);
  }, [activeConversationId]);

  // ============================================================
  // Message Actions
  // ============================================================

  const copyMessage = useCallback((messageId: string) => {
    const conv = conversations.find(c => c.id === activeConversationId);
    const msg = conv?.messages.find(m => m.id === messageId);
    if (msg) {
      navigator.clipboard.writeText(msg.content).catch(() => {});
    }
  }, [conversations, activeConversationId]);

  const feedbackMessage = useCallback((messageId: string, type: 'up' | 'down') => {
    setConversations(prev => prev.map(c => {
      if (c.id !== activeConversationId) return c;
      return {
        ...c,
        messages: c.messages.map(m =>
          m.id === messageId ? { ...m, feedback: m.feedback === type ? null : type } : m
        ),
      };
    }));
  }, [activeConversationId]);

  return {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    isThinking,
    streamingContent,
    error,
    researchStages,
    sendMessage,
    stopStreaming,
    regenerateLastMessage,
    createConversation,
    switchConversation,
    deleteConversation,
    pinConversation,
    clearActiveConversation,
    copyMessage,
    feedbackMessage,
    saveToSection,
  };
}
