/**
 * LeadReach — Guest Rate Limiter
 * =================================
 * Lightweight in-memory rate limiter for guest (unauthenticated) users
 * of the AI Activation Hub. Tracks usage per IP address.
 *
 * - Guest users get full access for 24 hours (configurable)
 * - Rate limit: 50 calls per guest per 24h window (generous for demo)
 * - Authenticated users are not rate-limited by this module
 *
 * The limiter uses a sliding window approach. Old entries are pruned
 * automatically when they expire.
 */

interface GuestUsage {
  /** Timestamp of first request in the current window */
  windowStart: number;
  /** Number of requests in the current window */
  count: number;
}

/** Map of IP → usage data */
const guestStore = new Map<string, GuestUsage>();

/** Window duration in ms (24 hours) */
const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Maximum requests per guest per window */
const MAX_REQUESTS_PER_WINDOW = 50;

/** Prune entries older than this (run every N checks) */
const PRUNE_INTERVAL = 100;
let pruneCounter = 0;

function pruneExpiredEntries() {
  const now = Date.now();
  for (const [ip, usage] of guestStore) {
    if (now - usage.windowStart > WINDOW_MS) {
      guestStore.delete(ip);
    }
  }
}

export interface GuestRateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** Total limit for the window */
  limit: number;
  /** Seconds until the window resets */
  resetInSeconds: number;
  /** Whether this is a guest (unauthenticated) request */
  isGuest: boolean;
}

/**
 * Check guest rate limit for a given IP address.
 * Returns the result and updates the counter if allowed.
 *
 * For authenticated users, skip rate limiting entirely —
 * just return { allowed: true, isGuest: false }.
 */
export function checkGuestRateLimit(
  ip: string | null,
  isAuthenticated: boolean
): GuestRateLimitResult {
  // Authenticated users bypass guest rate limits entirely
  if (isAuthenticated) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      resetInSeconds: 0,
      isGuest: false,
    };
  }

  // Periodically prune expired entries
  pruneCounter++;
  if (pruneCounter >= PRUNE_INTERVAL) {
    pruneCounter = 0;
    pruneExpiredEntries();
  }

  const now = Date.now();
  const clientIp = ip || 'unknown';

  const usage = guestStore.get(clientIp);

  // No existing entry or expired window → start fresh
  if (!usage || now - usage.windowStart > WINDOW_MS) {
    guestStore.set(clientIp, { windowStart: now, count: 1 });
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      limit: MAX_REQUESTS_PER_WINDOW,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
      isGuest: true,
    };
  }

  // Within current window — check limit
  if (usage.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetInSeconds = Math.ceil((usage.windowStart + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      limit: MAX_REQUESTS_PER_WINDOW,
      resetInSeconds,
      isGuest: true,
    };
  }

  // Increment and allow
  usage.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - usage.count,
    limit: MAX_REQUESTS_PER_WINDOW,
    resetInSeconds: Math.ceil((usage.windowStart + WINDOW_MS - now) / 1000),
    isGuest: true,
  };
}
