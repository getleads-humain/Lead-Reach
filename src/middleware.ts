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
 *
 * The JWKS endpoint is fetched automatically by the Supabase client:
 * https://ssaskkftdpidfwvpgdwl.supabase.co/auth/v1/.well-known/jwks.json
 * Key ID: ff84e55f-9852-4892-916f-4284fdcd67d6
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
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
