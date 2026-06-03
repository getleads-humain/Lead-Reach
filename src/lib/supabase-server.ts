/**
 * LeadReach — Supabase Server Client
 * =====================================
 * Server-side Supabase client for use in API routes and server components.
 *
 * CRITICAL DESIGN DECISION:
 * This module NEVER throws. When Supabase is not configured (missing env vars),
 * createClient() returns null instead of throwing. All callers must handle null.
 *
 * With middleware.ts handling session refresh via cookie updates, the `setAll`
 * catch block is no longer needed for session persistence. The middleware
 * ensures cookies are always fresh before any server component or API route runs.
 */

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from '@/lib/env';

/**
 * Create a Supabase server client.
 * Returns null when Supabase is not configured (env vars missing/placeholder).
 *
 * Usage:
 *   const supabase = await createClient();
 *   if (!supabase) {
 *     return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
 *   }
 *   // Use supabase normally
 */
export async function createClient(): Promise<SupabaseClient | null> {
  // Check env vars before calling createServerClient to avoid the
  // "@supabase/ssr: Your project's URL and API key are required" error
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored since middleware.ts now handles
              // refreshing sessions by updating cookies on every request.
            }
          },
        },
      }
    );
  } catch (error) {
    // Defensive: catch any unexpected error from @supabase/ssr
    console.error('[LeadReach] Failed to create Supabase server client:', error);
    return null;
  }
}

/**
 * Create a Supabase service-role client for admin operations.
 * Returns null when service role key is not configured.
 *
 * ⚠️  ONLY use this in secure server-side API routes.
 *     The service role key bypasses Row Level Security.
 */
export function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  // Reject placeholder values
  if (url.includes('placeholder') || url.includes('your-project')) return null;
  if (serviceKey.includes('placeholder') || serviceKey.includes('your-')) return null;

  try {
    // Dynamic import to avoid bundling supabase-js in client code
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    return createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (error) {
    console.error('[LeadReach] Failed to create Supabase service client:', error);
    return null;
  }
}

/**
 * Re-export isSupabaseConfigured for convenience.
 */
export { isSupabaseConfigured };
