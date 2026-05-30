/**
 * LeadReach — Supabase Browser Client (Auth-enabled)
 * ====================================================
 * Client-side Supabase client that uses @supabase/ssr for
 * proper cookie-based session management in Next.js App Router.
 *
 * This replaces the old supabaseAnon client for any auth-aware operations.
 * For server components and API routes, use createServerClient() instead.
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
