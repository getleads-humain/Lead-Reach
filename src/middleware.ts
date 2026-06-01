/**
 * LeadReach — Middleware
 * =======================
 * Combines Supabase Auth session management with enterprise-grade
 * security headers on every response.
 *
 * Security headers per SECURITY_POLICY.md Sections 8.3 and 8.4:
 *   - Content-Security-Policy (CSP)
 *   - Strict-Transport-Security (HSTS)
 *   - X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
 */

import { updateSession } from '@/lib/supabase-middleware'
import { applySecurityHeaders } from '@/lib/security-headers'
import { NextResponse } from 'next/server'

export async function middleware(request: import('next/server').NextRequest) {
  // 1. Run Supabase Auth session management (redirects, cookie refresh)
  const response = await updateSession(request)

  // 2. Apply security headers to all responses
  applySecurityHeaders(response as NextResponse)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo, robots.txt, etc.)
     * - api routes (we handle auth per-route in API handlers)
     *
     * This protects /portal, /onboarding, /app, /login, /signup, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|logo\\.svg|logo\\.png|robots\\.txt|api).*)',
  ],
}
