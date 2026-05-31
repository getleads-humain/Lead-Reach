/**
 * LeadReach — Supabase Browser Client
 * ======================================
 * Client-side Supabase client for use in browser components.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
