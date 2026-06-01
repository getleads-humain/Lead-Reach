/**
 * LeadReach — Rate Limiting Middleware
 * =====================================
 * Token-bucket rate limiter for API endpoint protection.
 * Prevents abuse, brute force, and resource exhaustion.
 *
 * Aligned with SECURITY_POLICY.md Section 8.5:
 *   - Authentication:    5 req/min
 *   - AI/LLM endpoints:  20 req/min
 *   - API data reads:    100 req/min
 *   - API data writes:   30 req/min
 *   - Webhook receivers: 1000 req/min
 *   - Public pages:      200 req/min
 */

// ============================================================
// Configuration
// ============================================================

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
  /** Key prefix for identification */
  prefix: string
}

/** Pre-configured rate limit tiers per SECURITY_POLICY.md */
export const RATE_LIMIT_TIERS = {
  AUTH:       { limit: 5,    windowSeconds: 60,  prefix: 'rl:auth' },
  AI_LLM:     { limit: 20,   windowSeconds: 60,  prefix: 'rl:ai' },
  API_READ:   { limit: 100,  windowSeconds: 60,  prefix: 'rl:read' },
  API_WRITE:  { limit: 30,   windowSeconds: 60,  prefix: 'rl:write' },
  WEBHOOK:    { limit: 1000, windowSeconds: 60,  prefix: 'rl:hook' },
  PUBLIC:     { limit: 200,  windowSeconds: 60,  prefix: 'rl:pub' },
} as const

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS

// ============================================================
// In-Memory Token Bucket Store
// ============================================================

interface Bucket {
  tokens: number
  lastRefill: number
}

/** In-memory store — suitable for single-instance deployments */
const store = new Map<string, Bucket>()

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of store.entries()) {
    // Remove buckets that haven't been used in 10 minutes
    if (now - bucket.lastRefill > 600_000) {
      store.delete(key)
    }
  }
}, 300_000)

// ============================================================
// Rate Limit Check
// ============================================================

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Remaining tokens in the current window */
  remaining: number
  /** Seconds until the bucket resets */
  resetIn: number
  /** Total limit for this tier */
  limit: number
}

/**
 * Check if a request is within rate limits using a token-bucket algorithm.
 *
 * @param tier - Pre-configured rate limit tier
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(
  tier: RateLimitTier,
  identifier: string
): RateLimitResult {
  const config = RATE_LIMIT_TIERS[tier]
  const key = `${config.prefix}:${identifier}`
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  let bucket = store.get(key)

  if (!bucket) {
    // First request — create bucket with full tokens minus one
    bucket = {
      tokens: config.limit - 1,
      lastRefill: now,
    }
    store.set(key, bucket)
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
      limit: config.limit,
    }
  }

  // Calculate how many tokens to refill based on elapsed time
  const elapsed = now - bucket.lastRefill
  const refillRate = config.limit / windowMs // tokens per ms
  const tokensToRefill = Math.floor(elapsed * refillRate)

  if (tokensToRefill > 0) {
    bucket.tokens = Math.min(config.limit, bucket.tokens + tokensToRefill)
    bucket.lastRefill = now
  }

  // Try to consume a token
  if (bucket.tokens > 0) {
    bucket.tokens -= 1
    return {
      allowed: true,
      remaining: bucket.tokens,
      resetIn: Math.ceil((windowMs - elapsed) / 1000),
      limit: config.limit,
    }
  }

  // Rate limit exceeded
  const resetIn = Math.ceil((windowMs - elapsed) / 1000)
  return {
    allowed: false,
    remaining: 0,
    resetIn: Math.max(1, resetIn),
    limit: config.limit,
  }
}

/**
 * Convenience: get rate limit headers for a response.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + result.resetIn),
  }
}

/**
 * Convenience: create a 429 Too Many Requests response.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.resetIn,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.resetIn),
        ...getRateLimitHeaders(result),
      },
    }
  )
}
