/**
 * URL Guard — SSRF Protection (mini-services edition)
 * ====================================================
 *
 * Self-contained SSRF defense for the standalone Node/Express services
 * under `mini-services/` (gmaps-service, browser-service). These services
 * don't have access to the Next.js `@/` path alias used by
 * `src/lib/url-guard.ts`, so we ship a local copy here.
 *
 * The implementation mirrors `src/lib/url-guard.ts` — please keep them
 * in sync if you change one.
 *
 * What this guards against
 * ------------------------
 *   1. Dangerous schemes — `file://`, `gopher://`, `ftp://`, `dict://`,
 *      `data:`, `javascript:`, etc. Only `http:` and `https:` are allowed.
 *   2. Internal / private IP literals — loopback, link-local, RFC1918,
 *      ULA IPv6, cloud metadata (169.254.169.254 etc.).
 *   3. DNS rebinding to internal IPs — hostname is resolved and refused
 *      if any resolved address is private.
 *   4. Hostname tricks — `localhost`, `*.internal`, `*.local`, IPv6
 *      bracketed forms, decimal/hex/octal IP encodings.
 *
 * Usage
 * -----
 *   import { assertSafeBrowserUrl, assertSafeUrl } from './url-guard';
 *
 *   await assertSafeUrl(userUrl);             // full DNS check (async)
 *   assertSafeBrowserUrl(userUrl);            // sync check before page.goto
 */

import { lookup } from 'node:dns/promises';
import { promisify } from 'node:util';
import { networkInterfaces } from 'node:os';

// ── Types ────────────────────────────────────────────────────────────────

export class UnsafeUrlError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
    public readonly url?: string,
  ) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

export interface UrlSafetyReport {
  safe: boolean;
  reason?: string;
  resolvedIp?: string;
  hostname?: string;
  scheme?: string;
  port?: number;
}

// ── Constants ────────────────────────────────────────────────────────────

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
const MAX_URL_LENGTH = 8192;
const DEFAULT_PORTS: Record<string, number> = { 'http:': 80, 'https:': 443 };

// ── Local Network Detection ──────────────────────────────────────────────

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0) return true;
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 192 && b === 88 && parts[2] === 99) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  if (a >= 224 && a <= 239) return true;
  if (a >= 240) return true;
  if (a === 255 && b === 255 && parts[2] === 255 && parts[3] === 255) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;
  if (lower === '::') return true;
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  if (lower.startsWith('ff')) return true;
  const v4MappedMatch = lower.match(/^::ffff:([0-9.]+)$/);
  if (v4MappedMatch) return isPrivateIPv4(v4MappedMatch[1]);
  if (lower.startsWith('64:ff9b:')) return true;
  if (lower.startsWith('100::')) return true;
  if (lower.startsWith('2001:db8:')) return true;
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) return isPrivateIPv6(ip);
  return isPrivateIPv4(ip);
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'ip6-localhost',
  'ip6-loopback',
  'broadcasthost',
  'metadata',
  'metadata.google.internal',
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  '.local',
  '.localdomain',
  '.internal',
  '.localhost',
  '.intranet',
  '.corp',
  '.home',
  '.lan',
  '.test',
  '.example',
  '.invalid',
];

const METADATA_HOSTNAMES = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  '100.100.100.200',
  'metadata.aliyuncs.com',
]);

let localAddressesCache: Set<string> | null = null;

function getLocalAddresses(): Set<string> {
  if (localAddressesCache) return localAddressesCache;
  const addrs = new Set<string>();
  try {
    const ifaces = networkInterfaces();
    for (const list of Object.values(ifaces)) {
      if (!list) continue;
      for (const iface of list) {
        addrs.add(iface.address);
      }
    }
  } catch {
    // ignore
  }
  addrs.add('127.0.0.1');
  addrs.add('::1');
  localAddressesCache = addrs;
  return addrs;
}

const dnsLookup = promisify(lookup) as (
  hostname: string,
  options?: { all?: boolean; family?: number },
) => Promise<{ address: string; family: number }[]>;

async function resolveHostIps(hostname: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const results = await dnsLookup(hostname, { all: true });
    if (Array.isArray(results)) {
      for (const r of results) {
        if (r && typeof r.address === 'string') out.push(r.address);
      }
    }
  } catch {
    // fall through
  }
  return out;
}

// ── Public API ───────────────────────────────────────────────────────────

export function checkUrlSafetySync(url: string): UrlSafetyReport {
  if (typeof url !== 'string') {
    return { safe: false, reason: 'URL is not a string' };
  }
  if (url.length === 0) {
    return { safe: false, reason: 'URL is empty' };
  }
  if (url.length > MAX_URL_LENGTH) {
    return { safe: false, reason: `URL exceeds ${MAX_URL_LENGTH} chars` };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, reason: 'Malformed URL' };
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return {
      safe: false,
      reason: `Scheme "${parsed.protocol}" not allowed (only http: and https:)`,
      scheme: parsed.protocol,
    };
  }

  let hostname = parsed.hostname;
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }
  hostname = hostname.toLowerCase();

  if (!hostname) {
    return { safe: false, reason: 'Empty hostname', scheme: parsed.protocol };
  }
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { safe: false, reason: `Hostname "${hostname}" is blocked`, hostname };
  }
  if (METADATA_HOSTNAMES.has(hostname)) {
    return { safe: false, reason: `Cloud metadata hostname blocked`, hostname };
  }
  for (const suffix of BLOCKED_HOSTNAME_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return { safe: false, reason: `Hostname suffix "${suffix}" is blocked`, hostname };
    }
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':')) {
    if (isPrivateIp(hostname)) {
      return { safe: false, reason: `IP literal "${hostname}" is private/reserved`, hostname };
    }
    if (getLocalAddresses().has(hostname)) {
      return { safe: false, reason: `IP "${hostname}" is a local interface`, hostname };
    }
  }
  if (parsed.username || parsed.password) {
    return { safe: false, reason: 'URL must not contain userinfo (user:pass@)' };
  }
  const port = parsed.port ? parseInt(parsed.port, 10) : DEFAULT_PORTS[parsed.protocol];
  if (!port || port < 1 || port > 65535) {
    return { safe: false, reason: `Invalid port "${parsed.port}"` };
  }
  return { safe: true, hostname, scheme: parsed.protocol, port };
}

export async function assertSafeUrl(url: string): Promise<void> {
  const sync = checkUrlSafetySync(url);
  if (!sync.safe) {
    throw new UnsafeUrlError(
      `Refused to load URL for SSRF safety: ${sync.reason}`,
      sync.reason ?? 'unknown',
      url,
    );
  }
  const hostname = sync.hostname!;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':')) {
    return;
  }
  const ips = await resolveHostIps(hostname);
  if (ips.length === 0) return;
  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      throw new UnsafeUrlError(
        `Refused to load URL for SSRF safety: hostname "${hostname}" resolves to private IP ${ip}`,
        'resolves-to-private-ip',
        url,
      );
    }
    if (getLocalAddresses().has(ip)) {
      throw new UnsafeUrlError(
        `Refused to load URL for SSRF safety: hostname "${hostname}" resolves to local interface ${ip}`,
        'resolves-to-local-interface',
        url,
      );
    }
  }
}

export function assertSafeUrlSync(url: string): void {
  const sync = checkUrlSafetySync(url);
  if (!sync.safe) {
    throw new UnsafeUrlError(
      `Refused to load URL for SSRF safety: ${sync.reason}`,
      sync.reason ?? 'unknown',
      url,
    );
  }
}

/**
 * Validate a URL for browser navigation (Puppeteer/Playwright). Synchronous
 * so it can be called right before `page.goto()`. Throws on refusal.
 */
export function assertSafeBrowserUrl(url: string): void {
  assertSafeUrlSync(url);
}

/**
 * Sanitize a URL for safe use in `fetch()` / `http.request()` calls.
 *
 * This is the recommended sanitizer barrier for SSRF defense. It:
 *   1. Parses the URL with `new URL()` (constructor recognized by CodeQL
 *      as a dataflow barrier for URL strings).
 *   2. Validates the protocol (only http/https allowed).
 *   3. Validates the hostname (blocks private/internal IPs and hostnames).
 *   4. Performs DNS resolution to block DNS-rebinding attacks.
 *   5. Returns the `.href` property of the parsed URL object — a fresh
 *      string derived from the parsed object, not the original input.
 *
 * CodeQL's dataflow analysis recognizes the return value of this function
 * as a separate value from the input (registered via data extension at
 * `.github/codeql/models/leadreach-sanitizers.yml`), cutting the taint flow
 * from user-controlled URL parameters to fetch()/http.request() sinks.
 *
 * @throws UnsafeUrlError if the URL is unsafe.
 * @returns A re-serialized, validated URL string safe for outbound requests.
 */
export async function sanitizeUrl(url: string): Promise<string> {
  // Step 1: Parse with new URL() — CodeQL recognizes this as a barrier
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeUrlError(
      `Refused to load URL for SSRF safety: malformed URL`,
      'malformed-url',
      url,
    );
  }

  // Step 2: Validate scheme — only http/https allowed
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UnsafeUrlError(
      `Refused to load URL for SSRF safety: scheme "${parsed.protocol}" not allowed`,
      'bad-scheme',
      url,
    );
  }

  // Step 3: Full safety check (hostname + IP + DNS resolution)
  await assertSafeUrl(url);

  // Step 4: Return .href from the parsed URL object — this is a NEW string
  // derived from the URL object, not the original `url` input. CodeQL
  // recognizes this as a sanitizer barrier.
  return parsed.href;
}

/**
 * Synchronous URL sanitizer for browser-based code paths (Puppeteer /
 * Playwright `page.goto()`). Performs syntactic + hostname validation
 * but skips DNS resolution (use `sanitizeUrl()` for full checks).
 *
 * Returns the `.href` property of the parsed URL object — a fresh string
 * derived from the parsed object, not the original input. CodeQL recognizes
 * this as a sanitizer barrier (registered via data extension).
 *
 * @throws UnsafeUrlError if the URL is unsafe.
 * @returns A re-serialized, validated URL string safe for `page.goto()`.
 */
export function sanitizeBrowserUrl(url: string): string {
  // Step 1: Parse with new URL() — CodeQL recognizes this as a barrier
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeUrlError(
      `Refused to load URL for SSRF safety: malformed URL`,
      'malformed-url',
      url,
    );
  }

  // Step 2: Validate scheme — only http/https allowed
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UnsafeUrlError(
      `Refused to load URL for SSRF safety: scheme "${parsed.protocol}" not allowed`,
      'bad-scheme',
      url,
    );
  }

  // Step 3: Full sync safety check (hostname + IP literal checks)
  assertSafeUrlSync(url);

  // Step 4: Return .href from the parsed URL object — this is a NEW string
  // derived from the URL object, not the original `url` input. CodeQL
  // recognizes this as a sanitizer barrier.
  return parsed.href;
}

/**
 * Navigate a Puppeteer/Playwright page to a URL with SSRF protection.
 *
 * This function performs BOTH the validation AND the navigation in the SAME
 * function scope. The validation throws before navigation can occur, so
 * CodeQL's dataflow analysis sees the URL as guarded before reaching the
 * `page.goto()` sink.
 *
 * @throws UnsafeUrlError if the URL is unsafe.
 */
export async function safeGoto(
  page: { goto: (url: string, options?: Record<string, unknown>) => Promise<unknown> },
  url: string,
  options?: Record<string, unknown>,
): Promise<unknown> {
  // Full sync SSRF validation (scheme, hostname, IP literal — no DNS).
  assertSafeUrlSync(url);

  // Native CodeQL dataflow barrier: re-parse the validated URL with `new URL()`
  // and use the parsed object's `.href` property as the navigation target.
  // CodeQL recognizes `new URL(x).href` as a fresh string derived from the
  // URL object, cutting the taint flow from the original user-supplied `url`
  // to the page.goto() sink.
  const safeUrl = new URL(url).href;
  return page.goto(safeUrl, options);
}
