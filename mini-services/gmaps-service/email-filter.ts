/**
 * Email Filtering — Junk / Disposable / Example Domain Filter
 * ============================================================
 *
 * Provides proper domain-suffix matching for filtering extracted email
 * addresses. Replaces naive substring checks (`email.includes('example.com')`)
 * which CodeQL flags as "Incomplete URL substring sanitization" — substring
 * matching can be bypassed by crafted inputs and is not a safe pattern for
 * domain validation.
 *
 * The fix uses `email.slice(after '@')` to extract the domain, then checks
 * exact equality OR proper subdomain matching via `endsWith('.' + domain)`.
 */

/**
 * Common non-business / example / documentation email domains that should
 * be filtered out of any extracted email list. These are domains that
 * appear frequently in web page boilerplate (Sentry, Wix, Google APIs,
 * documentation examples) and never represent real prospect emails.
 */
export const JUNK_EMAIL_DOMAINS: readonly string[] = [
  'example.com',
  'example.org',
  'example.net',
  'email.com',
  'domain.com',
  'test.com',
  'test.org',
  'sentry.io',
  'sentry-next.wixpress.com',
  'wixpress.com',
  'googleapis.com',
  'gitbook.io',
  'schema.org',
  'w3.org',
  'mozilla.org',
];

/**
 * File extensions that, when present as the "TLD" of an extracted email,
 * indicate the regex matched an image asset URL rather than a real email.
 * Example: `logo@example.png` is not a valid email.
 */
const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|svg|gif|webp|bmp|ico|tiff?|avif)$/i;

/**
 * Returns the domain part of an email address (lowercased), or `null` if
 * the input does not contain a valid `@` separator.
 *
 * Uses `lastIndexOf('@')` to handle edge cases where the local-part might
 * contain quoted `@` characters (rare but RFC-legal).
 */
export function extractEmailDomain(email: string): string | null {
  if (typeof email !== 'string' || email.length === 0) return null;
  const atIdx = email.lastIndexOf('@');
  if (atIdx === -1 || atIdx === email.length - 1) return null;
  return email.slice(atIdx + 1).toLowerCase();
}

/**
 * Returns `true` if the email address should be filtered out as junk.
 *
 * Checks:
 *   1. Domain is in the JUNK_EMAIL_DOMAINS blocklist (exact match).
 *   2. Domain is a subdomain of a blocked domain (e.g. `foo.example.com`).
 *   3. Domain ends with an image file extension (matched an asset URL).
 *   4. Domain is empty / malformed.
 *
 * This is a proper domain-suffix check (not substring matching), so it
 * satisfies CodeQL's "Incomplete URL substring sanitization" requirement.
 */
export function isJunkEmail(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain) return true;
  if (IMAGE_EXTENSION_REGEX.test(domain)) return true;
  for (const blocked of JUNK_EMAIL_DOMAINS) {
    if (domain === blocked) return true;
    // Subdomain match: `foo.example.com` ends with `.example.com`
    if (domain.endsWith('.' + blocked)) return true;
  }
  return false;
}

/**
 * Filter an array of email addresses, removing junk entries. De-duplicates
 * the result. Preserves the order of first occurrence.
 */
export function filterJunkEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of emails) {
    if (typeof e !== 'string' || e.length === 0) continue;
    if (isJunkEmail(e)) continue;
    const lower = e.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(e);
  }
  return out;
}
