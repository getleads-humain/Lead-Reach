/**
 * LeadReach — Next.js Proxy (formerly Middleware)
 * =================================================
 * Refreshes Supabase auth sessions on every request and protects routes.
 *
 * In Next.js 16+, the "middleware" file convention is renamed to "proxy".
 * The function export name also changes from `middleware` to `proxy`.
 * Both are supported for backward compatibility, but using `proxy` avoids
 * the deprecation warning.
 *
 * This proxy:
 * 1. Refreshes the Supabase auth session cookie on every request
 *    (keeping the JWT fresh without requiring a page reload)
 * 2. Protects authenticated routes — redirects to /login if not signed in
 * 3. Redirects logged-in users away from /login and /signup to /portal
 * 4. Handles the JWKS-based JWT verification dynamically via @supabase/ssr
 * 5. Applies environment-aware security headers to all responses
 *    (relaxed for preview domains, strict for production)
 *
 * Error Handling:
 * - All errors are caught and logged — the proxy NEVER crashes the server
 * - If the auth check fails, the request still proceeds (fail-open for safety)
 * - Security headers are applied to all responses, even error responses
 *
 * Preview Environment:
 * - Detects *.space-z.ai and *.space.chatglm.site domains
 * - Relaxes CSP and cross-origin headers to allow JS execution and framing
 * - This ensures the preview platform can properly render the application
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';
import { applySecurityHeaders } from '@/lib/security-headers';

export async function proxy(request: NextRequest) {
  try {
    const response = await updateSession(request);

    // Pass the request host to security headers for preview detection
    const host = request.headers.get('host') || undefined;
    return applySecurityHeaders(response, host);
  } catch (error) {
    // CRITICAL: Never let the proxy crash the server.
    // If anything goes wrong, continue the request without auth checks.
    console.error('[LeadReach] Proxy error (fail-open):', error);

    const fallbackResponse = NextResponse.next({ request });
    const host = request.headers.get('host') || undefined;
    return applySecurityHeaders(fallbackResponse, host);
  }
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
     * This ensures the proxy runs on all pages and API routes,
     * which is required for Supabase auth session refresh.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
