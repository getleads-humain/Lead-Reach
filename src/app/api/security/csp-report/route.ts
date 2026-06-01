/**
 * LeadReach — CSP Violation Report Endpoint
 * ===========================================
 * Receives Content Security Policy violation reports from browsers
 * and logs them for security monitoring and investigation.
 *
 * Per SECURITY_POLICY.md Section 8.3:
 * "CSP violations are reported to the security monitoring endpoint
 *  and trigger alerts for investigation."
 */

import { NextRequest, NextResponse } from 'next/server'

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string
    'referrer': string
    'violated-directive': string
    'effective-directive': string
    'original-policy': string
    'disposition': string
    'blocked-uri': string
    'line-number'?: number
    'column-number'?: number
    'source-file'?: string
    'status-code'?: number
    'script-sample'?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CSPViolationReport = await request.json()
    const report = body['csp-report']

    if (!report) {
      return NextResponse.json({ error: 'Invalid CSP report format' }, { status: 400 })
    }

    // Determine severity based on the violated directive
    const severity = classifyViolation(report)

    // Log the violation — in production, this would go to a SIEM
    if (severity === 'high') {
      console.error('[SECURITY][CSP][HIGH]', {
        timestamp: new Date().toISOString(),
        violatedDirective: report['violated-directive'],
        blockedUri: report['blocked-uri'],
        documentUri: report['document-uri'],
        sourceFile: report['source-file'],
        scriptSample: report['script-sample']?.substring(0, 100), // Truncate for safety
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      })
    } else {
      console.warn('[SECURITY][CSP][LOW]', {
        timestamp: new Date().toISOString(),
        violatedDirective: report['violated-directive'],
        blockedUri: report['blocked-uri'],
        documentUri: report['document-uri'],
      })
    }

    // Acknowledge receipt — do not reveal internal details
    return NextResponse.json({ received: true }, { status: 204 })

  } catch (error) {
    // Do not expose internal errors
    console.error('[SECURITY][CSP] Error processing report:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

/**
 * Classify CSP violation severity.
 * Script-src and object-src violations are high severity (potential XSS).
 * Other violations (img-src, style-src, etc.) are low severity.
 */
function classifyViolation(report: CSPViolationReport['csp-report']): 'high' | 'low' {
  const directive = report['violated-directive']?.toLowerCase() || ''
  if (directive.startsWith('script-src') || directive.startsWith('object-src') || directive.startsWith('connect-src')) {
    return 'high'
  }
  return 'low'
}
