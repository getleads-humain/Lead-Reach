'use client';

import { useState, useCallback, useRef } from 'react';
import { safeFetchJSON } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface ChatAction {
  type: string;
  label: string;
  success: boolean;
  data?: Record<string, unknown>;
  navigateTo?: string;
}

export interface ChatData {
  totalCampaigns: number;
  totalLeads: number;
  leadCountByStage: Record<string, number>;
  pipelineCampaignId: string | null;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    industry: string | null;
    location: string | null;
    leadsFound: number;
    leadsQualified: number;
  }>;
}

export interface SmartChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** AI thinking/reasoning content (when available) */
  thinking?: string;
  /** Detected intent */
  intent?: string;
  /** Actions triggered by this message */
  actions?: ChatAction[];
  /** Real data snapshot from the database */
  data?: ChatData;
  /** Whether this is an error message */
  isError?: boolean;
  /** Whether this message is still loading */
  isLoading?: boolean;
}

interface UseSmartChatOptions {
  /** System prompt override */
  systemPrompt?: string;
  /** Max messages in history */
  maxHistory?: number;
  /** Current page context */
  currentPage?: string;
}

interface UseSmartChatReturn {
  messages: SmartChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<SmartChatMessage | null>;
  clearMessages: () => void;
  lastResponse: SmartChatMessage | null;
}

/**
 * Enhanced AI chat hook with smart-chat backend.
 * Uses /api/ai-assistant/smart-chat which provides:
 * - Real database context
 * - Deep thinking mode
 * - Action execution (campaigns, pipelines, outreach)
 * - Structured response with data snapshots
 */
export function useSmartChat(options: UseSmartChatOptions = {}): UseSmartChatReturn {
  const {
    maxHistory = 50,
    currentPage = 'Dashboard',
  } = options;

  const [messages, setMessages] = useState<SmartChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<SmartChatMessage | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  const sendMessage = useCallback(async (
    content: string
  ): Promise<SmartChatMessage | null> => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: SmartChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev.slice(-(maxHistory - 1)), userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build messages array for API (only role + content, no extra fields)
      const apiMessages = [...messages, userMessage]
        .slice(-(maxHistory - 1))
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await safeFetchJSON<{
        response?: string;
        error?: string;
        intent?: string;
        confidence?: number;
        actions?: ChatAction[];
        data?: ChatData;
      }>('/api/ai-assistant/smart-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          currentPage,
        }),
        signal: controller.signal,
      });

      if (data.error && !data.response) {
        setError(data.error);
        const errorMessage: SmartChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.error,
          timestamp: Date.now(),
          isError: true,
          intent: data.intent,
          actions: data.actions,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return errorMessage;
      }

      const responseText = data.response || 'I was unable to generate a response. Please try again.';
      const assistantMessage: SmartChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        intent: data.intent,
        actions: data.actions || [],
        data: data.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastResponse(assistantMessage);
      return assistantMessage;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      const errMsg = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errMsg);

      const errorMessage: SmartChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: errMsg,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      return errorMessage;
    } finally {
      setIsLoading(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [messages, maxHistory, currentPage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastResponse(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    lastResponse,
  };
}
