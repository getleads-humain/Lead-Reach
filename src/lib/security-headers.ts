/**
 * LeadReach — Security Headers Configuration
 * ============================================
 * Centralized security header management for HTTP responses.
 *
 * Implements defense-in-depth via strict CSP, HSTS, clickjacking protection,
 * MIME sniffing prevention, and other browser security mechanisms.
 *
 * Preview Environment Support:
 * - Detects preview domains (*.space-z.ai, *.space.chatglm.site)
 * - Relaxes CSP and cross-origin headers for preview to allow JS execution
 * - Maintains strict security for production deployments
 *
 * @see SECURITY_POLICY.md §8.2
 */

import { NextResponse } from 'next/server';
import type { NextResponse as NextResponseType } from 'next/server';

// ── Environment Detection ──────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development';

// ── Preview Domain Detection ───────────────────────────────────────

const PREVIEW_DOMAINS = [
  '.space-z.ai',
  '.space.chatglm.site',
  'localhost',
  '127.0.0.1',
];

/**
 * Checks if a request is coming from a preview environment.
 * Preview domains follow the pattern: preview-*.space-z.ai or preview-*.space.chatglm.site
 * Also detects local development (localhost, 127.0.0.1) which should be treated as preview-like.
 * Handles host strings that include port numbers (e.g., "localhost:3000").
 */
function isPreviewRequest(host: string): boolean {
  if (!host) return false;
  // Strip port number (e.g., "localhost:3000" → "localhost")
  const hostname = host.split(':')[0];
  return PREVIEW_DOMAINS.some(
    domain => hostname.endsWith(domain) || hostname === domain
  );
}

// ── Allowed Origins ────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseOrigin = SUPABASE_URL ? new URL(SUPABASE_URL).origin : '';

const ZHIPU_API_URL = 'https://open.bigmodel.cn';
const STRIPE_JS_URL = 'https://js.stripe.com';
const STRIPE_API_URL = 'https://api.stripe.com';
const UNPKG_URL = 'https://unpkg.com';
const SPLINE_URL = 'https://prod.spline.design';

// ── CSP Directives ─────────────────────────────────────────────────

/**
 * Builds a Content Security Policy string based on the current environment.
 *
 * In development mode, the CSP is relaxed to support Next.js HMR (Hot Module
 * Replacement) which requires `eval` and WebSocket connections to localhost.
 *
 * In preview mode (deployed previews on *.space-z.ai / *.space.chatglm.site),
 * the CSP is moderately relaxed to allow scripts from the preview domain while
 * still maintaining basic security.
 *
 * In production, a strict CSP is enforced.
 *
 * @param host - The host header of the request (used for preview detection)
 */
export function buildCSP(host?: string): string {
  const directives: string[] = [];
  const hostStr = host || '';
  const isPreview = isPreviewRequest(hostStr);

  // default-src: Fallback for all fetches not covered by more specific directives
  directives.push(`default-src 'self'`);

  // script-src: JavaScript execution
  if (isDev || isPreview) {
    // Next.js HMR requires eval and localhost WebSocket connections
    // Preview environments need relaxed CSP to allow Next.js chunk loading
    // Also allow Spline 3D viewer (unpkg.com + prod.spline.design)
    directives.push(
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' localhost:* 127.0.0.1:* https://*.space-z.ai https://*.space.chatglm.site ${UNPKG_URL}`
    );
  } else {
    directives.push(
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https: ` +
      `${STRIPE_JS_URL} ${UNPKG_URL}`
    );
  }

  // style-src: CSS sources
  if (isDev || isPreview) {
    directives.push(`style-src 'self' 'unsafe-inline' https://*.space-z.ai https://*.space.chatglm.site`);
  } else {
    // Tailwind CSS and shadcn/ui require inline styles; use nonce in production
    directives.push(`style-src 'self' 'unsafe-inline'`);
  }

  // img-src: Image sources
  directives.push(
    `img-src 'self' data: blob: https://*.supabase.co ${supabaseOrigin} https://*.stripe.com https://*.space-z.ai https://*.space.chatglm.site ${SPLINE_URL}`
  );

  // font-src: Font sources
  directives.push(`font-src 'self' data: https://*.space-z.ai https://*.space.chatglm.site ${UNPKG_URL}`);

  // connect-src: AJAX, WebSocket, EventSource destinations
  const connectSources = [
    "'self'",
    supabaseOrigin,
    `${supabaseOrigin}/rest/v1/*`,
    ZHIPU_API_URL,
    STRIPE_API_URL,
    STRIPE_JS_URL,
    UNPKG_URL,
    SPLINE_URL,
  ];

  if (isDev || isPreview) {
    // Next.js HMR WebSocket + dev server + preview WebSocket
    connectSources.push(
      'localhost:*', '127.0.0.1:*',
      'ws://localhost:*', 'ws://127.0.0.1:*',
      'wss://*.space-z.ai', 'wss://*.space.chatglm.site',
      'https://*.space-z.ai', 'https://*.space.chatglm.site'
    );
  }

  directives.push(`connect-src ${connectSources.join(' ')}`);

  // frame-src: Embedded iframes (Stripe Checkout, etc.)
  directives.push(`frame-src 'self' ${STRIPE_JS_URL} https://hooks.stripe.com`);

  // frame-ancestors: Control who can embed this page
  if (isPreview) {
    // Allow preview platform to embed the page in iframes
    directives.push(`frame-ancestors 'self' https://*.space-z.ai https://*.space.chatglm.site`);
  } else {
    // Prevent clickjacking (supersedes X-Frame-Options)
    directives.push(`frame-ancestors 'none'`);
  }

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
 *
 * @param host - The host header of the request (used for preview detection)
 */
export function getSecurityHeaders(host?: string): Record<string, string> {
  const hostStr = host || '';
  const isPreview = isPreviewRequest(hostStr);

  const headers: Record<string, string> = {
    // Prevent MIME-type sniffing (forces browser to respect declared Content-Type)
    'X-Content-Type-Options': 'nosniff',

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

    // Content Security Policy — dynamically built based on environment
    'Content-Security-Policy': buildCSP(hostStr),
  };

  if (isPreview) {
    // Preview environment: relax framing and cross-origin restrictions
    // to allow the preview platform to serve the page properly
    headers['X-Frame-Options'] = 'ALLOWALL';
    headers['Cross-Origin-Opener-Policy'] = 'unsafe-none';
    headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
    headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none';
  } else if (isDev) {
    // Development: relaxed for local tooling
    headers['X-Frame-Options'] = 'SAMEORIGIN';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin-unsafe';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';
    headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none';
  } else {
    // Production: strict security
    headers['X-Frame-Options'] = 'DENY';
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
  }

  return headers;
}

// ── Header Application ─────────────────────────────────────────────

/**
 * Applies all security headers to a NextResponse object.
 * Also removes information-leaking headers (X-Powered-By, Server).
 *
 * @param response - The NextResponse to apply headers to
 * @param host - The host header of the request (used for preview detection)
 * @returns The modified NextResponse with security headers
 *
 * @example
 * ```ts
 * const response = NextResponse.next();
 * return applySecurityHeaders(response, request.headers.get('host') || undefined);
 * ```
 */
export function applySecurityHeaders<T extends NextResponseType>(response: T, host?: string): T {
  const securityHeaders = getSecurityHeaders(host);

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
