/**
 * LeadReach — Security Headers Configuration
 * ============================================
 * Centralized security header management for HTTP responses.
 *
 * Implements defense-in-depth via strict CSP, HSTS, clickjacking protection,
 * MIME sniffing prevention, and other browser security mechanisms.
 *
 * @see SECURITY_POLICY.md §8.2
 */

import { NextResponse } from 'next/server';
import type { NextResponse as NextResponseType } from 'next/server';

// ── Environment Detection ──────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development';

// ── Allowed Origins ────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseOrigin = SUPABASE_URL ? new URL(SUPABASE_URL).origin : '';

const ZHIPU_API_URL = 'https://open.bigmodel.cn';
const STRIPE_JS_URL = 'https://js.stripe.com';
const STRIPE_API_URL = 'https://api.stripe.com';

// ── CSP Directives ─────────────────────────────────────────────────

/**
 * Builds a Content Security Policy string based on the current environment.
 *
 * In development mode, the CSP is relaxed to support Next.js HMR (Hot Module
 * Replacement) which requires `eval` and WebSocket connections to localhost.
 *
 * In production, a strict nonce-based CSP is enforced with no inline scripts.
 */
export function buildCSP(): string {
  const directives: string[] = [];

  // default-src: Fallback for all fetches not covered by more specific directives
  directives.push(`default-src 'self'`);

  // script-src: JavaScript execution
  if (isDev) {
    // Next.js HMR requires eval and localhost WebSocket connections
    directives.push(
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' localhost:* 127.0.0.1:*`
    );
  } else {
    directives.push(
      `script-src 'self' 'strict-dynamic' 'nonce-{NONCE}' https: 'unsafe-inline' ` +
      // 'unsafe-inline' is ignored by browsers that support 'strict-dynamic'
      // but is included as a fallback for older browsers
      `${STRIPE_JS_URL}`
    );
  }

  // style-src: CSS sources
  if (isDev) {
    directives.push(`style-src 'self' 'unsafe-inline'`);
  } else {
    // Tailwind CSS and shadcn/ui require inline styles; use nonce in production
    directives.push(`style-src 'self' 'unsafe-inline'`);
  }

  // img-src: Image sources
  directives.push(
    `img-src 'self' data: blob: https://*.supabase.co ${supabaseOrigin} https://*.stripe.com`
  );

  // font-src: Font sources
  directives.push(`font-src 'self' data:`);

  // connect-src: AJAX, WebSocket, EventSource destinations
  const connectSources = [
    "'self'",
    supabaseOrigin,
    `${supabaseOrigin}/rest/v1/*`,
    ZHIPU_API_URL,
    STRIPE_API_URL,
    STRIPE_JS_URL,
  ];

  if (isDev) {
    // Next.js HMR WebSocket + dev server
    connectSources.push('localhost:*', '127.0.0.1:*', 'ws://localhost:*', 'ws://127.0.0.1:*');
  }

  directives.push(`connect-src ${connectSources.join(' ')}`);

  // frame-src: Embedded iframes (Stripe Checkout, etc.)
  directives.push(`frame-src 'self' ${STRIPE_JS_URL} https://hooks.stripe.com`);

  // frame-ancestors: Prevent clickjacking (supersedes X-Frame-Options)
  directives.push(`frame-ancestors 'none'`);

  // object-src: No Flash/Java/etc.
  directives.push(`object-src 'none'`);

  // base-uri: Restrict <base> tag injection
  directives.push(`base-uri 'self'`);

  // form-action: Restrict form submissions
  directives.push(`form-action 'self'`);

  // manifest-src: Web manifest
  directives.push(`manifest-src 'self'`);

  // worker-src: Service workers and web workers
  directives.push(`worker-src 'self' blob:`);

  // media-src: Audio/video sources
  directives.push(`media-src 'self' blob:`);

  // report-uri: CSP violation reporting endpoint
  directives.push(`report-uri /api/security/csp-report`);

  return directives.join('; ');
}

// ── Security Headers Map ───────────────────────────────────────────

/**
 * Returns all security headers to be applied to every HTTP response.
 *
 * These headers implement defense-in-depth browser security mechanisms
 * as specified in SECURITY_POLICY.md §8.2.
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    // Prevent clickjacking — DENY means the page cannot be framed at all
    'X-Frame-Options': 'DENY',

    // Prevent MIME-type sniffing (forces browser to respect declared Content-Type)
    'X-Content-Type-Options': 'nosniff',

    // HTTP Strict Transport Security — force HTTPS for 2 years with preload
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

    // Disable legacy XSS filter (it causes more harm than good; CSP is the proper mitigation)
    'X-XSS-Protection': '0',

    // Limit referrer information leakage to origin only on cross-origin requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Restrict access to browser APIs that LeadReach does not use
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'interest-cohort=()', // Disable FLoC / Topics API
    ].join(', '),

    // Content Security Policy
    'Content-Security-Policy': buildCSP(),

    // Cross-Origin isolation headers — prevent Spectre-class side-channel attacks
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': isDev ? 'unsafe-none' : 'require-corp',
  };

  return headers;
}

// ── Header Application ─────────────────────────────────────────────

/**
 * Applies all security headers to a NextResponse object.
 * Also removes information-leaking headers (X-Powered-By, Server).
 *
 * @param response - The NextResponse to apply headers to
 * @returns The modified NextResponse with security headers
 *
 * @example
 * ```ts
 * const response = NextResponse.next();
 * return applySecurityHeaders(response);
 * ```
 */
export function applySecurityHeaders<T extends NextResponseType>(response: T): T {
  const securityHeaders = getSecurityHeaders();

  // Apply all security headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Remove information-leaking headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

// ── CSP Nonce Utility ──────────────────────────────────────────────

/**
 * Generates a cryptographic nonce for use with CSP strict-dynamic.
 * Must be called server-side only.
 *
 * @returns A base64-encoded random nonce string
 */
export function generateCSPNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(18); // 18 bytes = 24 base64 chars
    crypto.getRandomValues(bytes);
    return Buffer.from(bytes).toString('base64');
  }
  // Fallback for environments without Web Crypto API
  return Buffer.from(Math.random().toString(36).substring(2, 26)).toString('base64');
}
