/**
 * Network Helpers — IPv4-Forced Fetch + Rate-Limit-Aware Queue
 * ============================================================
 *
 * WHY THIS EXISTS
 * ===============
 * The server's runtime environment has broken IPv6 connectivity.
 * Node.js's native `fetch()` and `http/https` modules try IPv6 first
 * via the OS resolver, and when that fails the entire request fails
 * with "fetch failed" — even though the IPv4 path works perfectly.
 *
 * This module resolves hostnames to IPv4 addresses via
 * `dns.promises.lookup(hostname, { family: 4 })` BEFORE making the
 * HTTP request, then connects directly to the IPv4 address with
 * the original `Host` header and `servername` (for TLS SNI) preserved.
 *
 * In addition, Z.AI's glm-4.7-flash and glm-4.6v-flash models both
 * enforce a strict per-account rate limit (concurrency = 1). When the
 * limit is hit (HTTP 429), we need to:
 *   1. Wait long enough for the limit to reset (60+ seconds)
 *   2. Queue subsequent requests so they don't pile up
 *   3. Back off exponentially on repeated 429s
 *
 * PUBLIC API
 * ==========
 *   fetchIPv4(url, init?)              — fetch with IPv4-only DNS
 *   fetchJsonIPv4(url, init?)          — same + auto JSON parsing
 *   withRateLimit(fn, opts?)           — wrap any async fn with queue
 *   isInRateLimitCooldown(host)        — check if host is in cooldown
 *   markHostRateLimited(host, ms)      — mark host as rate-limited
 *   exponentialBackoff(attempt, ...)   — calc backoff with jitter
 *   withTimeout(promise, ms, label)    — race against timeout
 *   testIPv4Connectivity(url)          — health check
 */

import { promises as dnsPromises } from 'dns';
import http from 'http';
import https from 'https';

// ─── IPv4 Resolution Cache ───────────────────────────────────────

interface DnsCacheEntry {
  address: string;
  expiresAt: number;
}

const DNS_CACHE = new Map<string, DnsCacheEntry>();
const DNS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve a hostname to an IPv4 address.
 * Uses a 5-minute cache to avoid repeated DNS lookups.
 */
async function resolveIPv4(hostname: string): Promise<string> {
  const cached = DNS_CACHE.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.address;
  }

  try {
    const { address } = await dnsPromises.lookup(hostname, { family: 4 });
    DNS_CACHE.set(hostname, {
      address,
      expiresAt: Date.now() + DNS_CACHE_TTL_MS,
    });
    return address;
  } catch (err) {
    // Fallback: try default lookup (any family)
    try {
      const { address } = await dnsPromises.lookup(hostname);
      // If we somehow got an IPv6, try to coerce to IPv4 via direct resolution
      if (address.includes(':')) {
        // IPv6 — try one more time with explicit family
        const r = await dnsPromises.lookup(hostname, { family: 4 });
        DNS_CACHE.set(hostname, {
          address: r.address,
          expiresAt: Date.now() + DNS_CACHE_TTL_MS,
        });
        return r.address;
      }
      DNS_CACHE.set(hostname, {
        address,
        expiresAt: Date.now() + DNS_CACHE_TTL_MS,
      });
      return address;
    } catch (err2) {
      throw new Error(
        `DNS lookup failed for ${hostname}: ${err2 instanceof Error ? err2.message : err2}`,
      );
    }
  }
}

// ─── Fetch Wrapper (IPv4-only) ───────────────────────────────────

export interface FetchIPv4Init extends RequestInit {
  /** Override timeout (ms). Default 90s. */
  timeoutMs?: number;
}

/**
 * Fetch a URL using IPv4-only DNS resolution.
 *
 * Resolves the hostname to an IPv4 address first, then connects
 * directly to that IP while preserving the original `Host` header
 * and TLS servername. This works around broken IPv6 connectivity.
 *
 * Same API as the global `fetch()`.
 */
export async function fetchIPv4(
  url: string | URL,
  init: FetchIPv4Init = {},
): Promise<Response> {
  const urlStr = typeof url === 'string' ? url : url.toString();
  const parsedUrl = new URL(urlStr);
  const isHttps = parsedUrl.protocol === 'https:';
  const timeoutMs = init.timeoutMs ?? 90_000;

  // Resolve IPv4 address
  const ipv4 = await resolveIPv4(parsedUrl.hostname);
  const port = parsedUrl.port || (isHttps ? 443 : 80);
  const path = parsedUrl.pathname + parsedUrl.search;

  // Build headers, preserving Host header for the original hostname
  const headers: Record<string, string> = {};
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      for (const [k, v] of init.headers) {
        headers[k] = v;
      }
    } else {
      for (const [k, v] of Object.entries(init.headers)) {
        headers[k] = String(v);
      }
    }
  }
  // Always set Host header to original hostname (not the IP)
  headers['Host'] = parsedUrl.host;
  if (init.body && !headers['Content-Length']) {
    const bodyStr = typeof init.body === 'string'
      ? init.body
      : (init.body instanceof Uint8Array ? Buffer.from(init.body).toString() : '');
    if (bodyStr) headers['Content-Length'] = String(Buffer.byteLength(bodyStr));
  }

  const options: https.RequestOptions = {
    method: (init.method as string) || 'GET',
    hostname: ipv4,
    port: port as unknown as number,
    path,
    headers,
    timeout: timeoutMs,
    // For TLS: preserve original hostname for SNI and cert validation
    ...(isHttps ? { servername: parsedUrl.hostname } : {}),
  };

  const lib = isHttps ? https : http;

  return new Promise<Response>((resolve, reject) => {
    const req = lib.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        const responseHeaders = new Headers();
        for (const [k, v] of Object.entries(res.headers || {})) {
          if (Array.isArray(v)) {
            for (const item of v) responseHeaders.append(k, item);
          } else if (v != null) {
            responseHeaders.set(k, v);
          }
        }
        const response = new Response(body, {
          status: res.statusCode || 200,
          statusText: res.statusMessage || '',
          headers: responseHeaders,
        });
        resolve(response);
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms: ${urlStr.slice(0, 100)}`));
    });

    if (init.body) {
      if (typeof init.body === 'string') {
        req.write(init.body);
      } else if (init.body instanceof Uint8Array) {
        req.write(init.body);
      } else if (init.body instanceof ArrayBuffer) {
        req.write(new Uint8Array(init.body));
      }
      // Other body types (FormData, ReadableStream) not supported — caller should serialize
    }
    req.end();
  });
}

/**
 * Fetch JSON from a URL using IPv4-only DNS.
 * Returns parsed JSON or throws on non-2xx response.
 */
export async function fetchJsonIPv4<T = unknown>(
  url: string,
  init: FetchIPv4Init = {},
): Promise<T> {
  const response = await fetchIPv4(url, init);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
  }
  return response.json() as Promise<T>;
}

// ─── Rate-Limit-Aware Queue ──────────────────────────────────────

interface QueueEntry {
  fn: () => Promise<unknown>;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  retryCount: number;
  priority: number;
}

interface HostRateLimitState {
  /** Per-host in-flight count */
  inFlight: number;
  /** Per-host min interval between requests (ms) */
  minIntervalMs: number;
  /** Last request time (ms since epoch) */
  lastRequestAt: number;
  /** Cooldown until (ms since epoch) — set when 429 received */
  cooldownUntil: number;
  /** Pending queue */
  queue: QueueEntry[];
  /** Current queue processor active */
  processorActive: boolean;
}

const HOST_STATES = new Map<string, HostRateLimitState>();

function getHostState(host: string): HostRateLimitState {
  let state = HOST_STATES.get(host);
  if (!state) {
    state = {
      inFlight: 0,
      minIntervalMs: 1500,
      lastRequestAt: 0,
      cooldownUntil: 0,
      queue: [],
      processorActive: false,
    };
    HOST_STATES.set(host, state);
  }
  return state;
}

function extractHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'default';
  }
}

/**
 * Check if a host is currently in rate-limit cooldown.
 */
export function isInRateLimitCooldown(host: string): boolean {
  const state = HOST_STATES.get(host);
  if (!state) return false;
  return Date.now() < state.cooldownUntil;
}

/**
 * Get the cooldown remaining time (ms) for a host, or 0 if not in cooldown.
 */
export function getRateLimitCooldownRemaining(host: string): number {
  const state = HOST_STATES.get(host);
  if (!state) return 0;
  return Math.max(0, state.cooldownUntil - Date.now());
}

/**
 * Mark a host as rate-limited for the given duration.
 * Subsequent calls to `withRateLimit` for this host will wait
 * until the cooldown expires before executing.
 */
export function markHostRateLimited(host: string, cooldownMs: number): void {
  const state = getHostState(host);
  state.cooldownUntil = Math.max(state.cooldownUntil, Date.now() + cooldownMs);
  console.warn(`[RateLimitQueue] Host ${host} in cooldown for ${Math.round(cooldownMs / 1000)}s`);
}

/**
 * Wrap an async function with rate-limit-aware queuing.
 *
 * - Limits concurrency to 1 in-flight request per host (Z.AI's limit)
 * - Enforces a minimum interval between requests per host
 * - On 429, marks the host as rate-limited for `cooldownMs` (default 60s)
 * - Retries up to `maxRetries` times with exponential backoff
 *
 * @param url The URL that will be fetched (used to extract host)
 * @param fn The async function to execute
 * @param opts Configuration
 */
export async function withRateLimit<T>(
  url: string,
  fn: () => Promise<T>,
  opts: {
    maxRetries?: number;
    cooldownMs?: number;
    minIntervalMs?: number;
    priority?: number;
  } = {},
): Promise<T> {
  const host = extractHost(url);
  const state = getHostState(host);
  const {
    maxRetries = 2,
    cooldownMs = 60_000,
    minIntervalMs,
    priority = 0,
  } = opts;

  if (minIntervalMs && minIntervalMs > state.minIntervalMs) {
    state.minIntervalMs = minIntervalMs;
  }

  return new Promise<T>((resolve, reject) => {
    const entry: QueueEntry = {
      fn: fn as () => Promise<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
      retryCount: 0,
      priority,
    };
    state.queue.push(entry);
    // Sort by priority (higher first)
    state.queue.sort((a, b) => b.priority - a.priority);
    processQueue(host).catch(reject);
  });

  async function processQueue(host: string): Promise<void> {
    const state = getHostState(host);
    if (state.processorActive) return;
    state.processorActive = true;

    try {
      while (state.queue.length > 0) {
        // Wait for cooldown
        const cooldownRemaining = state.cooldownUntil - Date.now();
        if (cooldownRemaining > 0) {
          await sleep(cooldownRemaining);
        }

        // Wait for in-flight to drain (max 1 concurrent)
        while (state.inFlight >= 1) {
          await sleep(50);
        }

        // Wait for min interval
        const intervalRemaining = state.lastRequestAt + state.minIntervalMs - Date.now();
        if (intervalRemaining > 0) {
          await sleep(intervalRemaining);
        }

        const entry = state.queue.shift();
        if (!entry) break;

        state.inFlight++;
        state.lastRequestAt = Date.now();

        try {
          const result = await entry.fn();
          entry.resolve(result);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const is429 = errMsg.includes('429') || errMsg.includes('Too Many Requests') || errMsg.includes('rate limit') || errMsg.includes('Rate limit');

          if (is429 && entry.retryCount < maxRetries) {
            entry.retryCount++;
            // Exponential backoff: 60s, 120s
            const backoff = cooldownMs * entry.retryCount;
            console.warn(`[RateLimitQueue] ${host} 429 — backing off ${Math.round(backoff / 1000)}s before retry ${entry.retryCount}/${maxRetries}`);
            markHostRateLimited(host, backoff);
            // Re-queue at the front
            state.queue.unshift(entry);
            state.inFlight--;
            continue;
          }

          entry.reject(err);
        } finally {
          state.inFlight--;
        }
      }
    } finally {
      state.processorActive = false;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Backoff Helper ──────────────────────────────────────────────

/**
 * Calculate exponential backoff with jitter.
 *
 * @param attempt 0-indexed retry attempt
 * @param baseMs Base backoff in ms
 * @param maxMs Maximum backoff cap
 * @returns Backoff time in ms
 */
export function exponentialBackoff(
  attempt: number,
  baseMs = 2000,
  maxMs = 60_000,
): number {
  const exp = Math.pow(2, attempt);
  const backoff = Math.min(maxMs, baseMs * exp);
  // Add 0-25% jitter to avoid thundering herd
  const jitter = Math.random() * backoff * 0.25;
  return Math.round(backoff + jitter);
}

// ─── Timeout Helper ──────────────────────────────────────────────

/**
 * Race a promise against a timeout.
 * Returns null on timeout (does NOT reject — caller decides how to handle).
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'operation',
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>(resolve => {
      setTimeout(() => {
        console.warn(`[Timeout] "${label}" timed out after ${ms}ms`);
        resolve(null);
      }, ms);
    }),
  ]);
}

// ─── Health Check ────────────────────────────────────────────────

/**
 * Test if a URL is reachable via IPv4.
 * Returns latency in ms or null if failed.
 */
export async function testIPv4Connectivity(url: string): Promise<{ ok: boolean; latencyMs: number; status?: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetchIPv4(url, { method: 'HEAD', timeoutMs: 10_000 });
    return { ok: true, latencyMs: Date.now() - start, status: res.status };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
