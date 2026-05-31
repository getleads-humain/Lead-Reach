/**
 * LeadReach — Auth Callback Route
 * ==================================
 * Handles OAuth redirect callbacks from Google and GitHub.
 *
 * When a user signs in with an OAuth provider, Supabase redirects
 * to this route with the auth code in the URL. We exchange the code
 * for a session, then redirect the user to the app.
 *
 * This is the missing piece that was causing OAuth flows to 404.
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // If user was redirected from a specific page, store it
  const next = searchParams.get('next') ?? '/app';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Exchange the auth code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful OAuth login — redirect to the app (or the stored next URL)
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('OAuth code exchange error:', error.message);
  }

  // If no code or exchange failed, redirect to login with an error
  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
}
