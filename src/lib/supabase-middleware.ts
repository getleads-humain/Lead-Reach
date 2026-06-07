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
  // Gracefully handle missing Supabase env vars (e.g., during first setup)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[LeadReach] Supabase env vars missing — skipping auth middleware');
    return NextResponse.next({ request });
  }

  // Accumulate all cookies across multiple setAll calls instead of
  // creating a new NextResponse each time (which discards previous cookies).
  // This fixes session refresh failures when Supabase calls setAll more than once.
  const allCookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request object so subsequent getUser() sees them
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Accumulate cookies instead of replacing the response
          cookiesToSet.forEach(({ name, value, options }) => {
            allCookiesToSet.push({ name, value, options: options as Record<string, unknown> });
          });
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

  // Build response AFTER getUser() so all cookies from session refresh are included
  let supabaseResponse = NextResponse.next({ request });

  // Apply ALL accumulated cookies to the response in one pass
  for (const { name, value, options } of allCookiesToSet) {
    supabaseResponse.cookies.set(name, value, options);
  }

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
    '/api/prospect-discovery/search',  // Allow unauthenticated search for testing
    '/api/prospect-discovery/chat',    // Allow unauthenticated chat for testing
    '/api/ai-assistant/chat',          // AI chat endpoint
    '/api/ai-assistant/deep-research', // AI deep research endpoint
    '/api/ai-assistant/smart-chat',    // AI smart chat endpoint
    '/api/ai-assistant/save',          // AI save results endpoint
    '/api/identity',                   // Identity profile save/load
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
    // Apply session cookies to the redirect response too
    const redirectResponse = NextResponse.redirect(url);
    for (const { name, value, options } of allCookiesToSet) {
      redirectResponse.cookies.set(name, value, options);
    }
    return redirectResponse;
  }

  // If user IS signed in and trying to access login/signup, redirect to portal
  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Check for redirect loop: if redirect param points to login/signup, break the loop
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const targetPath = redirectParam && !['/login', '/signup'].includes(redirectParam)
      ? redirectParam
      : '/portal';
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    url.searchParams.delete('redirect');
    // Apply session cookies to the redirect response too
    const redirectResponse = NextResponse.redirect(url);
    for (const { name, value, options } of allCookiesToSet) {
      redirectResponse.cookies.set(name, value, options);
    }
    return redirectResponse;
  }

  return supabaseResponse;
}
