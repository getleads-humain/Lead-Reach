/**
 * LeadReach — Next.js Middleware
 * ================================
 * Refreshes Supabase auth sessions on every request and protects routes.
 *
 * This middleware:
 * 1. Refreshes the Supabase auth session cookie on every request
 *    (keeping the JWT fresh without requiring a page reload)
 * 2. Protects authenticated routes — redirects to /login if not signed in
 * 3. Redirects logged-in users away from /login and /signup to /app
 * 4. Handles the JWKS-based JWT verification dynamically via @supabase/ssr
 * 5. Applies environment-aware security headers to all responses
 *    (relaxed for preview domains, strict for production)
 *
 * Preview Environment:
 * - Detects *.space-z.ai and *.space.chatglm.site domains
 * - Relaxes CSP and cross-origin headers to allow JS execution and framing
 * - This ensures the preview platform can properly render the application
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';
import { applySecurityHeaders } from '@/lib/security-headers';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Pass the request host to security headers for preview detection
  const host = request.headers.get('host') || undefined;
  return applySecurityHeaders(response, host);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (logo file)
     *
     * This ensures middleware runs on all pages and API routes,
     * which is required for Supabase auth session refresh.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
