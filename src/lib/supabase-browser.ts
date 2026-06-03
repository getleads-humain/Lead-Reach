/**
 * LeadReach — Supabase Browser Client
 * ======================================
 * Client-side Supabase client for use in browser components.
 *
 * CRITICAL DESIGN DECISION:
 * This module NEVER throws. When Supabase is not configured (missing env vars),
 * createClient() returns null instead of throwing. All callers must handle null.
 *
 * This prevents the #1 preview crash:
 *   "@supabase/ssr: Your project's URL and API key are required to create a Supabase client!"
 *
 * The app renders in "demo mode" when Supabase is not configured — auth features
 * are simply disabled, but the UI still loads.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/env';

// Singleton pattern — only create the client once per browser session
let cachedClient: SupabaseClient | null | undefined = undefined;

/**
 * Create a Supabase browser client.
 * Returns null when Supabase is not configured (env vars missing/placeholder).
 *
 * Usage:
 *   const supabase = createClient();
 *   if (!supabase) {
 *     // Handle unconfigured state (show banner, disable auth, etc.)
 *     return;
 *   }
 *   // Use supabase normally
 */
export function createClient(): SupabaseClient | null {
  // Return cached client if already determined
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  // Check env vars before calling createBrowserClient to avoid the
  // "@supabase/ssr: Your project's URL and API key are required" error
  if (!isSupabaseConfigured()) {
    console.warn('[LeadReach] Supabase browser client not created — env vars missing');
    cachedClient = null;
    return null;
  }

  try {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    cachedClient = client;
    return client;
  } catch (error) {
    // Defensive: catch any unexpected error from @supabase/ssr
    console.error('[LeadReach] Failed to create Supabase browser client:', error);
    cachedClient = null;
    return null;
  }
}

/**
 * Reset the cached client (useful when env vars change during development).
 */
export function resetClient(): void {
  cachedClient = undefined;
}

/**
 * Re-export isSupabaseConfigured for convenience.
 * Consumers can check before calling createClient() to avoid null checks.
 */
export { isSupabaseConfigured };
