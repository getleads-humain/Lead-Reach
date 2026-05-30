import { updateSession } from '@/lib/supabase-middleware'

export async function middleware(request: import('next/server').NextRequest) {
  return await updateSession(request)
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
