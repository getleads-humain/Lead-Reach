/**
 * LeadReach — Token-Bucket Rate Limiter
 * =======================================
 * In-memory token-bucket rate limiting for API endpoints.
 *
 * Rate limit tiers are defined per SECURITY_POLICY.md §8.3.
 *
 * WARNING: This is an in-memory implementation suitable for single-instance
 * deployments. For multi-instance / serverless deployments, replace the
 * MemoryStore with a Redis-backed store.
 *
 * @see SECURITY_POLICY.md §8.3
 */

// ── Rate Limit Tiers ───────────────────────────────────────────────

export enum RateLimitTier {
  /** Authentication endpoints: login, signup, password reset */
  AUTH = 'AUTH',
  /** AI/LLM endpoints: chat, agent execution */
  AI_LLM = 'AI_LLM',
  /** Read-only API endpoints: data retrieval */
  API_READ = 'API_READ',
  /** Mutation API endpoints: create, update, delete */
  API_WRITE = 'API_WRITE',
  /** Inbound webhook endpoints */
  WEBHOOK = 'WEBHOOK',
  /** Public pages and assets */
  PUBLIC = 'PUBLIC',
}

interface RateLimitConfig {
  /** Maximum number of tokens in the bucket */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Human-readable description */
  description: string;
}

const TIER_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  [RateLimitTier.AUTH]: {
    limit: 5,
    windowSeconds: 60,
    description: 'Authentication endpoints (5 req/min)',
  },
  [RateLimitTier.AI_LLM]: {
    limit: 20,
    windowSeconds: 60,
    description: 'AI/LLM endpoints (20 req/min)',
  },
  [RateLimitTier.API_READ]: {
    limit: 100,
    windowSeconds: 60,
    description: 'Read-only API endpoints (100 req/min)',
  },
  [RateLimitTier.API_WRITE]: {
    limit: 30,
    windowSeconds: 60,
    description: 'Mutation API endpoints (30 req/min)',
  },
  [RateLimitTier.WEBHOOK]: {
    limit: 1000,
    windowSeconds: 60,
    description: 'Inbound webhook endpoints (1000 req/min)',
  },
  [RateLimitTier.PUBLIC]: {
    limit: 200,
    windowSeconds: 60,
    description: 'Public pages and assets (200 req/min)',
  },
};

// ── Token Bucket Store ─────────────────────────────────────────────

interface TokenBucket {
  /** Current number of tokens available */
  tokens: number;
  /** Timestamp of the last refill (epoch ms) */
  lastRefill: number;
}

class MemoryStore {
  private buckets: Map<string, TokenBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60_000; // 1 minute
  private readonly MAX_ENTRY_AGE_MS = 300_000; // 5 minutes (max window + buffer)

  constructor() {
    // Periodically clean up stale entries to prevent memory leaks
    this.cleanupInterval = setInterval(
      () => this.cleanup(),
      this.CLEANUP_INTERVAL_MS
    );

    // Don't prevent Node.js process from exiting
    if (this.cleanupInterval && typeof this.cleanupInterval === 'object' && 'unref' in this.cleanupInterval) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Get or create a token bucket for the given key.
   */
  private getBucket(key: string, config: RateLimitConfig): TokenBucket {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        tokens: config.limit,
        lastRefill: Date.now(),
      };
      this.buckets.set(key, bucket);
    }
    return bucket;
  }

  /**
   * Refill tokens based on elapsed time since last refill.
   */
  private refill(bucket: TokenBucket, config: RateLimitConfig): void {
    const now = Date.now();
    const elapsedMs = now - bucket.lastRefill;
    const elapsedSeconds = elapsedMs / 1000;

    // Calculate tokens to add based on elapsed time
    const tokensToAdd = (elapsedSeconds / config.windowSeconds) * config.limit;
    bucket.tokens = Math.min(config.limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Check if a request is allowed and consume a token if so.
   */
  check(key: string, tier: RateLimitTier): {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetMs: number;
  } {
    const config = TIER_CONFIGS[tier];
    const bucket = this.getBucket(key, config);

    // Refill tokens based on time elapsed
    this.refill(bucket, config);

    const config_key = key; // for reset calculation
    const now = Date.now();
    const resetMs = bucket.lastRefill + config.windowSeconds * 1000;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        limit: config.limit,
        resetMs,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      limit: config.limit,
      resetMs,
    };
  }

  /**
   * Remove stale entries to prevent unbounded memory growth.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > this.MAX_ENTRY_AGE_MS) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Destroy the store and clear the cleanup interval.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
  }
}

// Singleton store instance
const store = new MemoryStore();

// ── Public API ─────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining tokens in the bucket */
  remaining: number;
  /** Maximum tokens for this tier */
  limit: number;
  /** Epoch ms when the bucket will reset */
  resetMs: number;
  /** The tier that was checked */
  tier: RateLimitTier;
}

/**
 * Check the rate limit for a given identifier and tier.
 *
 * @param identifier - A unique key for the client (IP, user ID, etc.)
 * @param tier - The rate limit tier to check against
 * @returns Rate limit result with allowed status and metadata
 *
 * @example
 * ```ts
 * const result = checkRateLimit('192.168.1.1', RateLimitTier.AUTH);
 * if (!result.allowed) {
 *   return rateLimitResponse(result);
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  tier: RateLimitTier
): RateLimitResult {
  const key = `${tier}:${identifier}`;
  const result = store.check(key, tier);

  return {
    ...result,
    tier,
  };
}

/**
 * Generate standard rate limit HTTP headers.
 *
 * These headers follow the IETF draft specification:
 * https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
 *
 * @param result - The rate limit result to generate headers for
 * @returns Object with rate limit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetSeconds = Math.max(0, Math.ceil((result.resetMs - Date.now()) / 1000));

  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetMs),
    'Retry-After': result.allowed ? '' : String(resetSeconds),
  };
}

/**
 * Create a Next.js-compatible HTTP 429 Too Many Requests response.
 *
 * @param result - The rate limit result that triggered the limit
 * @returns A Response object with 429 status and rate limit headers
 *
 * @example
 * ```ts
 * const result = checkRateLimit(clientId, RateLimitTier.AI_LLM);
 * if (!result.allowed) {
 *   return rateLimitResponse(result);
 * }
 * ```
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const headers = getRateLimitHeaders(result);
  const resetSeconds = Math.max(0, Math.ceil((result.resetMs - Date.now()) / 1000));

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded for ${result.tier}. Try again in ${resetSeconds} seconds.`,
      retryAfter: resetSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetSeconds),
        'X-RateLimit-Limit': headers['X-RateLimit-Limit'],
        'X-RateLimit-Remaining': headers['X-RateLimit-Remaining'],
        'X-RateLimit-Reset': headers['X-RateLimit-Reset'],
      },
    }
  );
}

/**
 * Get the configuration for a given rate limit tier.
 * Useful for documentation and debugging.
 */
export function getTierConfig(tier: RateLimitTier): RateLimitConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Get all tier configurations.
 * Useful for documentation and status endpoints.
 */
export function getAllTierConfigs(): Record<RateLimitTier, RateLimitConfig> {
  return { ...TIER_CONFIGS };
}
