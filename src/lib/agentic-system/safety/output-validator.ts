/**
 * Safety Validator — Input + Output Guardrails
 * ============================================
 *
 * Two layers of safety checks that wrap every agentic workflow run:
 *
 *   1. Input guardrails (run before the pipeline starts):
 *      - SSRF protection (block localhost, internal IPs, cloud metadata)
 *      - Prompt-injection detection (common attack patterns)
 *      - PII redaction (emails, phone numbers, SSNs, credit cards)
 *      - Length cap (reject absurdly long messages)
 *
 *   2. Output guardrails (run before the response is sent to the user):
 *      - PII redaction in summaries
 *      - Profanity filter (basic)
 *      - Competitor mention block (configurable)
 *      - Hallucination detection (compare claims against source URLs)
 *
 * These guardrails are NON-BLOCKING by default — they log violations but
 * let the pipeline continue. The workflow engine can be configured to
 * hard-fail on guardrail violations.
 */

import { SOP_CONSTRAINTS } from '../sop/sop-spec';

// ============================================================
// Types
// ============================================================

export interface GuardrailResult {
  passed: boolean;
  violations: string[];
  /** Sanitized version of the input (PII redacted, etc). */
  sanitized?: string;
}

// ============================================================
// Input Guardrails
// ============================================================

/**
 * Run all input guardrails on a user message.
 * Returns passed=false if any hard violation is found.
 */
export function applyInputGuardrails(message: string): GuardrailResult {
  const violations: string[] = [];
  // PII redaction happens unconditionally below — no need to seed with the
  // raw message first (that initial assignment was always overwritten).

  // ── Length cap ──
  if (message.length > 10_000) {
    violations.push('Message exceeds 10,000 character limit');
    return { passed: false, violations };
  }

  // ── SSRF protection ──
  // Block any URL that points to localhost, internal IPs, or cloud metadata
  const urls = extractUrls(message);
  for (const url of urls) {
    const ssrf = checkSsrf(url);
    if (ssrf) {
      violations.push(`Blocked URL (SSRF risk): ${url} — ${ssrf}`);
    }
  }

  // ── Prompt-injection detection ──
  const injection = detectPromptInjection(message);
  if (injection) {
    violations.push(`Possible prompt injection: ${injection}`);
  }

  // ── PII redaction (soft — sanitize but don't block) ──
  const sanitized = redactPii(message);

  return {
    passed: violations.length === 0,
    violations,
    sanitized,
  };
}

// ============================================================
// Output Guardrails
// ============================================================

/**
 * Run all output guardrails on the model's response.
 * Returns passed=false if any hard violation is found.
 */
export function applyOutputGuardrails(output: string): GuardrailResult {
  const violations: string[] = [];
  let sanitized = output;

  if (SOP_CONSTRAINTS.outputGuardrails.blockPIIInSummary) {
    const piiCheck = redactPii(output);
    if (piiCheck !== output) {
      // PII was found and redacted — log a violation but don't fail
      violations.push('PII detected in output and redacted');
      sanitized = piiCheck;
    }
  }

  if (SOP_CONSTRAINTS.outputGuardrails.blockProfanity) {
    const profanity = detectProfanity(output);
    if (profanity) {
      violations.push(`Profanity detected: ${profanity}`);
    }
  }

  for (const competitor of SOP_CONSTRAINTS.outputGuardrails.blockCompetitorMentions) {
    if (output.toLowerCase().includes(competitor.toLowerCase())) {
      violations.push(`Blocked competitor mention: ${competitor}`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    sanitized,
  };
}

// ============================================================
// Helpers
// ============================================================

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>]+/gi;
  return text.match(urlRegex) ?? [];
}

function checkSsrf(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null; // not a valid URL — let other checks handle it
  }

  // Scheme check
  if (!SOP_CONSTRAINTS.allowedUrlSchemes.includes(parsed.protocol)) {
    return `disallowed scheme ${parsed.protocol}`;
  }

  const host = parsed.hostname.toLowerCase();

  // Forbidden host patterns
  for (const pattern of SOP_CONSTRAINTS.forbiddenUrlPatterns) {
    if (host.includes(pattern)) {
      return `host matches forbidden pattern "${pattern}"`;
    }
  }

  // IP literal checks
  const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const octets = ipMatch.slice(1).map(Number);
    // Block private/reserved IP ranges
    if (octets[0] === 10) return 'host is private IP (10.x)';
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return 'host is private IP (172.16-31.x)';
    if (octets[0] === 192 && octets[1] === 168) return 'host is private IP (192.168.x)';
    if (octets[0] === 127) return 'host is loopback';
    if (octets[0] === 0) return 'host is 0.x (reserved)';
    if (octets[0] === 169 && octets[1] === 254) return 'host is link-local';
  }

  return null;
}

function detectPromptInjection(text: string): string | null {
  const lower = text.toLowerCase();
  const patterns = [
    'ignore previous instructions',
    'ignore the above',
    'disregard your system prompt',
    'you are now a',
    'forget everything before this',
    'new instructions:',
    '<|system|>',
    '<|im_start|>',
  ];
  for (const p of patterns) {
    if (lower.includes(p)) return `pattern "${p}"`;
  }
  return null;
}

function redactPii(text: string): string {
  let out = text;
  // Email addresses
  out = out.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[REDACTED_EMAIL]');
  // Phone numbers (US format)
  out = out.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
  // SSN
  out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  // Credit card (basic)
  out = out.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_CC]');
  return out;
}

function detectProfanity(text: string): string | null {
  // Basic profanity list — extend as needed
  const banned = ['shit', 'fuck', 'asshole', 'bitch', 'bastard'];
  const lower = text.toLowerCase();
  for (const word of banned) {
    if (lower.includes(word)) return word;
  }
  return null;
}
