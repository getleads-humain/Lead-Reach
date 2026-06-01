'use client';

import { useState, useCallback, useRef } from 'react';
import { safeFetchJSON } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface UseAIChatOptions {
  /** System prompt to prepend to every conversation */
  systemPrompt?: string;
  /** API endpoint — defaults to /api/ai-assistant/chat */
  endpoint?: string;
  /** Max messages to keep in history (default 50) */
  maxHistory?: number;
}

interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<string | null>;
  sendMessageWithContext: (content: string, contextOverride: string) => Promise<string | null>;
  clearMessages: () => void;
  lastResponse: string | null;
}

/**
 * Reusable hook for AI chat interactions across any component.
 *
 * Uses `/api/ai-assistant/chat` by default which accepts:
 * { messages: [{ role, content }], systemPrompt?: string }
 * Returns { response: string, models: string[] }
 */
export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const {
    systemPrompt = 'You are a helpful AI assistant for LeadReach, a B2B lead generation platform.',
    endpoint = '/api/ai-assistant/chat',
    maxHistory = 50,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  const sendMessageWithContext = useCallback(async (
    content: string,
    contextOverride: string
  ): Promise<string | null> => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev.slice(-(maxHistory - 1)), userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build the messages array for the API
      const apiMessages = [...messages, userMessage]
        .slice(-(maxHistory - 1))
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await safeFetchJSON<{ response?: string; error?: string }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemPrompt: contextOverride,
        }),
        signal: controller.signal,
      });

      if (data.error) {
        setError(data.error);
        return null;
      }

      const responseText = data.response || 'No response from AI.';
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastResponse(responseText);
      return responseText;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      const errMsg = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errMsg);
      return null;
    } finally {
      setIsLoading(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [messages, endpoint, maxHistory]);

  const sendMessage = useCallback(async (content: string): Promise<string | null> => {
    return sendMessageWithContext(content, systemPrompt);
  }, [systemPrompt, sendMessageWithContext]);

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
    sendMessageWithContext,
    clearMessages,
    lastResponse,
  };
}

/**
 * Simpler hook for one-shot AI calls (no conversation history).
 * Useful for generating insights, suggestions, summaries.
 */
export function useAIOneShot() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string | null>(null);

  const generate = useCallback(async (
    prompt: string,
    systemPrompt?: string
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await safeFetchJSON<{ response?: string; error?: string }>('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
        }),
      });

      if (result.error) {
        setError(result.error);
        return null;
      }

      const responseText = result.response || '';
      setData(responseText);
      return responseText;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'AI request failed';
      setError(errMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { generate, data, isLoading, error, reset };
}
