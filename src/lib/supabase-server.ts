/**
 * LeadReach — Supabase Server Client
 * =====================================
 * Server-side Supabase client for use in API routes and server components.
 *
 * IMPORTANT: With middleware.ts now handling session refresh via cookie
 * updates, the `setAll` catch block is no longer needed for session
 * persistence. The middleware ensures cookies are always fresh before
 * any server component or API route runs.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
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
}
