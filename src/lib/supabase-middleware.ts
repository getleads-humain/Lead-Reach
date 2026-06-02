/**
 * LeadReach — Supabase Middleware Client
 * ========================================
 * Creates a Supabase server client for use in Next.js middleware.
 * This is the critical piece that refreshes auth sessions on every request,
 * keeping cookies fresh without requiring a page reload.
 *
 * References the JWKS endpoint dynamically for JWT verification:
 * https://ssaskkftdpidfwvpgdwl.supabase.co/auth/v1/.well-known/jwks.json
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Gracefully handle missing Supabase env vars (e.g., during first setup)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[LeadReach] Supabase env vars missing — skipping auth middleware');
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─── Route Protection ─────────────────────────────────────────────────
  // Define which routes require authentication
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',           // Landing page
    '/login',
    '/signup',
    '/reset-password',
    '/auth/callback',
    '/about',
    '/blog',
    '/careers',
    '/contact',
    '/cookie-policy',
    '/docs',
    '/faq',
    '/press',
    '/pricing',
    '/privacy',
    '/support',
    '/terms',
    '/platform',
  ];

  // API routes that should be accessible without auth
  const publicApiRoutes = [
    '/api/auth',
    '/api/admin/fix-security',
  ];

  // Static assets and Next.js internals
  const isStaticOrInternal =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.includes('.') && !pathname.startsWith('/api');

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname === `${route}/`
  );
  const isPublicApiRoute = publicApiRoutes.some(
    (route) => pathname.startsWith(route)
  );

  // If it's a static asset or internal route, skip auth check
  if (isStaticOrInternal) {
    return supabaseResponse;
  }

  // If user is NOT signed in and the route is protected, redirect to login
  if (!user && !isPublicRoute && !isPublicApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Store the intended destination so we can redirect after login
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If user IS signed in and trying to access login/signup, redirect to app
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
