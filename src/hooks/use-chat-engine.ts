'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { safeFetchJSON } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface ResearchStageInfo {
  stage: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail?: string;
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
  sendMessage: (content: string, systemPrompt?: string) => Promise<void>;
  stopStreaming: () => void;
  regenerateLastMessage: (systemPrompt?: string) => Promise<void>;
  createConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  pinConversation: (id: string) => void;
  clearActiveConversation: () => void;
  copyMessage: (messageId: string) => void;
  feedbackMessage: (messageId: string, type: 'up' | 'down') => void;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'leadreach-chat-conversations';
const MAX_CONVERSATIONS = 50;
const STREAMING_SPEED = 12; // ms per character for typewriter effect
const STREAMING_CHUNK_SIZE = 3; // characters per tick

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
    // Create initial conversation
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
  const streamingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingFullContentRef = useRef('');

  // Get active messages
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Persist conversations whenever they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) clearTimeout(streamingTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ============================================================
  // Simulated streaming typewriter effect
  // ============================================================

  const startStreamingEffect = useCallback((fullContent: string, messageId: string) => {
    streamingFullContentRef.current = fullContent;
    let currentIndex = 0;

    const tick = () => {
      currentIndex = Math.min(currentIndex + STREAMING_CHUNK_SIZE, fullContent.length);
      const currentContent = fullContent.slice(0, currentIndex);
      setStreamingContent(currentContent);

      // Also update the message in conversations
      setConversations(prev => prev.map(c => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId
              ? { ...m, content: currentContent, isStreaming: currentIndex < fullContent.length }
              : m
          ),
        };
      }));

      if (currentIndex < fullContent.length) {
        streamingTimerRef.current = setTimeout(tick, STREAMING_SPEED);
      } else {
        // Streaming complete
        setIsStreaming(false);
        setStreamingContent('');
        setConversations(prev => prev.map(c => {
          if (c.id !== activeConversationId) return c;
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === messageId ? { ...m, isStreaming: false } : m
            ),
          };
        }));
      }
    };

    setIsStreaming(true);
    tick();
  }, [activeConversationId]);

  const stopStreamingEffect = useCallback(() => {
    if (streamingTimerRef.current) {
      clearTimeout(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    // Finalize the message with full content
    const fullContent = streamingFullContentRef.current;
    setStreamingContent('');
    setIsStreaming(false);
    return fullContent;
  }, []);

  // ============================================================
  // Send Message
  // ============================================================

  const sendMessage = useCallback(async (content: string, systemPrompt?: string) => {
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

      const data = await safeFetchJSON<{ response?: string; error?: string; deepResearch?: boolean; researchQuery?: string; pipeline?: any }>(
        '/api/ai-assistant/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historyMessages,
            systemPrompt: systemPrompt || 'You are LeadReach AI, an intelligent assistant for B2B lead generation.',
          }),
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) return;

      // Check for deep research trigger
      if (data.deepResearch) {
        const researchQuery = data.researchQuery || content.trim();
        setConversations(prev => prev.map(c => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === thinkingMessage.id
                ? { ...m, content: 'Initiating deep research pipeline...', isLoading: true }
                : m
            ),
          };
        }));
        await executeDeepResearch(researchQuery, thinkingMessage.id, convId, controller);
        return;
      }

      const responseText = data.response || data.error || 'No response received.';

      // Remove thinking message and add real AI message with streaming
      const aiMessageId = generateId();
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;
        const filtered = c.messages.filter(m => m.id !== thinkingMessage.id);
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isError: !!data.error,
          isStreaming: true,
          pipelineTriggered: data.pipeline || null,
        };
        return { ...c, messages: [...filtered, aiMessage] };
      }));

      setIsThinking(false);
      startStreamingEffect(responseText, aiMessageId);

    } catch (err) {
      if ((err as Error).name === 'AbortError') return;

      const errMsg = err instanceof Error ? err.message : 'Failed to get AI response';
      const isRateLimitError = errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('high demand');
      const errorContent = isRateLimitError
        ? 'The AI service is currently experiencing high demand. Please wait a moment and try again.'
        : `I encountered an error: ${errMsg}. Please try again.`;

      setError(errorContent);

      // Replace thinking message with error
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === thinkingMessage.id
              ? { ...m, content: errorContent, isLoading: false, isError: true }
              : m
          ),
        };
      }));
      setIsThinking(false);
    }
  }, [activeConversationId, conversations, isStreaming, startStreamingEffect]);

  // ============================================================
  // Deep Research SSE Handler
  // ============================================================

  const executeDeepResearch = useCallback(async (
    query: string,
    loadingMessageId: string,
    convId: string,
    parentController: AbortController,
    retryCount = 0,
  ) => {
    let finalMarkdown = '';
    let finalLeadScore = 0;
    let finalLeadTier: 'hot' | 'warm' | 'cold' = 'cold';
    const collectedStages: ResearchStageInfo[] = [];
    const MAX_RETRIES = 2;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180_000);

      const response = await fetch('/api/ai-assistant/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = `Deep research API returned ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error) errorDetail = errorBody.error;
          if (errorBody.details) errorDetail += ` — ${errorBody.details}`;
        } catch {
          errorDetail = `Deep research API returned ${response.status}: ${response.statusText}`;
        }

        if ((response.status === 502 || response.status === 503) && retryCount < MAX_RETRIES) {
          const delay = (retryCount + 1) * 2000;
          setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map(m =>
                m.id === loadingMessageId
                  ? { ...m, content: `Retrying research pipeline (attempt ${retryCount + 2})...` }
                  : m
              ),
            };
          }));
          await new Promise(r => setTimeout(r, delay));
          return executeDeepResearch(query, loadingMessageId, convId, parentController, retryCount + 1);
        }
        throw new Error(errorDetail);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith(':')) continue;
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'progress') {
                const stageInfo: ResearchStageInfo = {
                  stage: data.stage,
                  label: data.label,
                  status: data.status,
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

                setConversations(prev => prev.map(c => {
                  if (c.id !== convId) return c;
                  return {
                    ...c,
                    messages: c.messages.map(m =>
                      m.id === loadingMessageId
                        ? { ...m, content: `Researching: ${data.label}...` }
                        : m
                    ),
                  };
                }));
              }

              if (data.type === 'report') {
                finalMarkdown = data.markdown;
                finalLeadScore = data.leadScore || 0;
                finalLeadTier = data.leadTier || 'cold';
              }

              if (data.type === 'error') {
                throw new Error(data.message || 'Deep research failed');
              }
            } catch (parseError) {
              if (parseError instanceof Error && !parseError.message.includes('JSON')) {
                throw parseError;
              }
            }
          }
        }
      }

      // Replace loading message with streamed report
      const aiMessageId = generateId();
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;
        const filtered = c.messages.filter(m => m.id !== loadingMessageId);
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
          researchStages: collectedStages,
          isResearchReport: true,
          leadScore: finalLeadScore,
          leadTier: finalLeadTier,
        };
        return { ...c, messages: [...filtered, aiMessage] };
      }));

      setResearchStages([]);
      setIsThinking(false);
      startStreamingEffect(
        finalMarkdown || 'Research completed but no report was generated. Please try again.',
        aiMessageId,
      );

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      let userMessage: string;

      if (error instanceof DOMException && error.name === 'AbortError') {
        userMessage = 'The research pipeline timed out. Try being more specific with your query.';
      } else if (errMsg.includes('502') || errMsg.includes('503')) {
        userMessage = 'The research service is temporarily unavailable. Please try again.';
      } else {
        userMessage = `Deep research encountered an error: ${errMsg}`;
      }

      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === loadingMessageId
              ? { ...m, content: userMessage, isLoading: false, isError: true }
              : m
          ),
        };
      }));
      setResearchStages([]);
      setIsThinking(false);
    }
  }, [startStreamingEffect]);

  // ============================================================
  // Stop Streaming
  // ============================================================

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    stopStreamingEffect();
    setIsThinking(false);
  }, [stopStreamingEffect]);

  // ============================================================
  // Regenerate Last Message
  // ============================================================

  const regenerateLastMessage = useCallback(async (systemPrompt?: string) => {
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
    await sendMessage(lastUserMsg.content, systemPrompt);
  }, [conversations, activeConversationId, sendMessage]);

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
  };
}
