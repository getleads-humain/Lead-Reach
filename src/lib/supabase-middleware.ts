/**
 * LeadReach — Supabase Middleware Client
 * ========================================
 * Used in middleware.ts to refresh auth sessions on every request.
 * This ensures the session is always fresh and avoids stale tokens.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Protected routes ──────────────────────────────────────────────────
  // /portal, /onboarding, and /app require authentication
  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isAppRoute = request.nextUrl.pathname.startsWith('/app')

  if ((isPortalRoute || isOnboardingRoute || isAppRoute) && !user) {
    // No user, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // ── Auth pages redirect ───────────────────────────────────────────────
  // If user is logged in, redirect auth pages to portal
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password')

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/portal'
    return NextResponse.redirect(url)
  }

  // ── Onboarding check ──────────────────────────────────────────────────
  // If user is authenticated but hasn't completed onboarding,
  // redirect to onboarding (except if already on onboarding page)
  if (user && isPortalRoute) {
    // We'll do a lightweight check via the profile onboarding_complete flag
    // For middleware, we check a cookie to avoid DB calls on every request
    const onboardingDone = request.cookies.get('lr_onboarding_done')?.value
    if (onboardingDone !== 'true' && !isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
