/**
 * LeadReach — CSP Violation Report Endpoint
 * ===========================================
 * Receives and processes Content Security Policy violation reports.
 *
 * Browsers send reports to this endpoint when a CSP directive is violated,
 * enabling detection of XSS attempts, injection attacks, and misconfigurations.
 *
 * Per SECURITY_POLICY.md §8.1, CSP violations are classified by severity:
 * - HIGH: script-src or object-src violations (potential XSS/injection)
 * - LOW: all other directive violations (possible misconfiguration)
 *
 * @see SECURITY_POLICY.md §8.1, §14.1
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Severity Classification ────────────────────────────────────────

type CspSeverity = 'HIGH' | 'LOW';

/**
 * Classifies a CSP violation based on the violated directive.
 *
 * script-src and object-src violations are classified as HIGH severity
 * because they may indicate active XSS or plugin injection attempts.
 * All other violations are classified as LOW (likely misconfigurations).
 */
function classifySeverity(violatedDirective: string): CspSeverity {
  const highSeverityDirectives = ['script-src', 'script-src-elem', 'script-src-attr', 'object-src'];

  const baseDirective = violatedDirective.split(' ')[0]; // e.g., "script-src" from "script-src 'self'"

  return highSeverityDirectives.includes(baseDirective) ? 'HIGH' : 'LOW';
}

// ── CSP Report Types ───────────────────────────────────────────────

interface CspReportBody {
  'csp-report': {
    'document-uri'?: string;
    'referrer'?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'disposition'?: string;
    'blocked-uri'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code'?: number;
    'script-sample'?: string;
  };
}

interface CspReportDeprecated {
  type?: string;
  url?: string;
  body?: {
    documentURL?: string;
    referrer?: string;
    blockedURL?: string;
    effectiveDirective?: string;
    violatedDirective?: string;
    originalPolicy?: string;
    disposition?: string;
    statusCode?: number;
    lineNumber?: number;
    columnNumber?: number;
    sourceFile?: string;
    sample?: string;
  };
}

// ── POST Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') || '';
    let violatedDirective = 'unknown';
    let blockedUri = 'unknown';
    let documentUri = 'unknown';
    let sourceFile: string | undefined;
    let lineNumber: number | undefined;
    let scriptSample: string | undefined;

    if (contentType.includes('application/csp-report') || contentType.includes('application/json')) {
      const body = await request.json() as CspReportBody | CspReportDeprecated;

      // Handle standard CSP report format
      if ('csp-report' in body && body['csp-report']) {
        const report = body['csp-report'];
        violatedDirective = report['violated-directive'] || report['effective-directive'] || 'unknown';
        blockedUri = report['blocked-uri'] || 'unknown';
        documentUri = report['document-uri'] || 'unknown';
        sourceFile = report['source-file'];
        lineNumber = report['line-number'];
        scriptSample = report['script-sample'];
      }
      // Handle newer Reporting API format
      else if (body && typeof body === 'object' && 'body' in body) {
        const deprecatedBody = body as CspReportDeprecated;
        const reportBody = deprecatedBody.body;
        if (reportBody) {
          violatedDirective = reportBody.violatedDirective || reportBody.effectiveDirective || 'unknown';
          blockedUri = reportBody.blockedURL || 'unknown';
          documentUri = reportBody.documentURL || deprecatedBody.url || 'unknown';
          sourceFile = reportBody.sourceFile;
          lineNumber = reportBody.lineNumber;
          scriptSample = reportBody.sample;
        }
      }
    }

    // Classify severity
    const severity = classifySeverity(violatedDirective);

    // Log with structured format for SIEM ingestion
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity,
      violatedDirective,
      blockedUri,
      documentUri,
      sourceFile,
      lineNumber,
      scriptSample: scriptSample ? scriptSample.substring(0, 100) : undefined, // Truncate to prevent log injection
    };

    if (severity === 'HIGH') {
      console.error(
        `[SECURITY][CSP][HIGH] CSP violation indicates potential XSS/injection attempt:`,
        JSON.stringify(logEntry)
      );
    } else {
      console.warn(
        `[SECURITY][CSP][LOW] CSP violation (possible misconfiguration):`,
        JSON.stringify(logEntry)
      );
    }

    // Return 204 No Content — the browser expects no body for CSP reports
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Don't leak error details in the response
    console.error('[SECURITY][CSP] Error processing CSP report:', error);
    return new NextResponse(null, { status: 204 }); // Still return 204 to prevent browser retries
  }
}

// Reject all other HTTP methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
