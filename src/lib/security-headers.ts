/**
 * LeadReach — Security Headers & CSP Configuration
 * ==================================================
 * Centralizes all security header logic for the application.
 * Used by middleware.ts to inject headers on every response.
 *
 * Aligned with:
 * - OWASP Secure Headers Project
 * - NIST SP 800-53 Rev. 5 (SC-12, SC-23, SI-3)
 * - Mozilla Observatory A+ standards
 * - SECURITY_POLICY.md Section 8.3 and 8.4
 */

import { NextResponse, type NextRequest } from 'next/server'

// ============================================================
// Content Security Policy
// ============================================================

/**
 * Build CSP directive string.
 * In development, we relax some directives for hot-reload compatibility.
 */
function buildCSP(nonce?: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  const scriptSrc = [
    "'self'",
    isDev ? "'unsafe-inline'" : '', // dev: HMR needs inline scripts
    isDev ? "'unsafe-eval'" : '',   // dev: Next.js fast refresh
    'https://vercel.live',
    nonce ? `'nonce-${nonce}'` : '',
  ].filter(Boolean).join(' ')

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://*.supabase.co https://open.bigmodel.cn https://api.stripe.com wss://*.supabase.co${isDev ? ' http://localhost:* ws://localhost:*' : ''}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `media-src 'none'`,
    isDev ? '' : 'upgrade-insecure-requests',
  ].filter(Boolean).join('; ')

  return directives
}

// ============================================================
// Security Headers Map
// ============================================================

/**
 * Returns a map of security headers to apply to all responses.
 * These align with SECURITY_POLICY.md sections 8.3 and 8.4.
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  return {
    // ── Prevent clickjacking (SECURITY_POLICY 8.4) ──
    'X-Frame-Options': 'DENY',

    // ── Prevent MIME type sniffing ──
    'X-Content-Type-Options': 'nosniff',

    // ── HSTS: Force HTTPS for 2 years with preload ──
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

    // ── XSS protection: disabled in favor of CSP ──
    'X-XSS-Protection': '0',

    // ── Referrer policy: minimal leakage ──
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // ── Permissions policy: disable unnecessary browser features ──
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',

    // ── Content Security Policy (SECURITY_POLICY 8.3) ──
    'Content-Security-Policy': buildCSP(nonce),

    // ── Cross-Origin isolation headers ──
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'credentialless',
  }
}

// ============================================================
// Apply Headers to Response
// ============================================================

/**
 * Apply all security headers to a NextResponse object.
 * Mutates the response in place and returns it.
 */
export function applySecurityHeaders(
  response: NextResponse,
  nonce?: string
): NextResponse {
  const headers = getSecurityHeaders(nonce)

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }

  // Remove server identification header
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')

  return response
}

// ============================================================
// CSP Report Endpoint Path
// ============================================================

/** Path where CSP violation reports are sent */
export const CSP_REPORT_URI = '/api/security/csp-report'
