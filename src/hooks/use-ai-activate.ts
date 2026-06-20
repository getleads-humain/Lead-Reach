'use client';

import { useState, useCallback } from 'react';
import { safeFetchJSON } from '@/lib/utils';

export interface AIActivateOptions {
  /** Show toast on success/error (default true) */
  showToast?: boolean;
  /** Custom loading label */
  loadingLabel?: string;
}

export interface AIActivateResult<T = unknown> {
  /** Call the AI action with a payload. Returns the result data or null on error. */
  activate: (action: string, payload: unknown) => Promise<T | null>;
  /** Last result data */
  data: T | null;
  /** True while a request is in flight */
  isLoading: boolean;
  /** Last error message */
  error: string | null;
  /** Clear data + error */
  reset: () => void;
}

/**
 * useAIActivate — unified hook for invoking any AI feature on the platform.
 *
 * Usage:
 *   const ai = useAIActivate<LeadScoreResult>();
 *   const result = await ai.activate('lead.score', { name: 'John', company: 'Acme' });
 *   if (result) { ... }
 *
 * Available actions: see /api/ai-activate (GET) for the full list.
 */
export function useAIActivate<T = unknown>(options: AIActivateOptions = {}): AIActivateResult<T> {
  const { showToast = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = useCallback(async (action: string, payload: unknown): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await safeFetchJSON<{ result?: T; error?: string; action?: string }>(
        '/api/ai-activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        }
      );

      if (response.error) {
        setError(response.error);
        if (showToast) {
          console.error(`[AI Activate] ${action} failed:`, response.error);
        }
        return null;
      }

      const resultData = (response.result ?? null) as T | null;
      setData(resultData);
      return resultData;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'AI request failed';
      setError(errMsg);
      if (showToast) {
        console.error(`[AI Activate] ${action} failed:`, errMsg);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { activate, data, isLoading, error, reset };
}

/**
 * useAIActivateOneShot — convenience hook for one-shot AI calls.
 *
 * Usage:
 *   const { generate, data, isLoading } = useAIActivateOneShot<LeadScoreResult>('lead.score');
 *   await generate({ name: 'John', company: 'Acme' });
 */
export function useAIActivateOneShot<T = unknown>(action: string) {
  const { activate, data, isLoading, error, reset } = useAIActivate<T>();
  const [lastPayload, setLastPayload] = useState<unknown>(null);

  const generate = useCallback(async (payload: unknown): Promise<T | null> => {
    setLastPayload(payload);
    return activate(action, payload);
  }, [action, activate]);

  return { generate, data, isLoading, error, reset, lastPayload, action };
}
