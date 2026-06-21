/**
 * Vellum Core — Smart Notification Router
 *
 * Routes notifications to the optimal channel based on urgency,
 * user preferences, active hours, and channel availability.
 *
 * Decision Pipeline:
 *   1. Evaluate message urgency → map to candidate channels
 *   2. Check user preferences → filter preferred/available channels
 *   3. Apply quiet hours → suppress or delay non-critical notifications
 *   4. Check channel availability → skip disabled/unconfigured channels
 *   5. Rate limit check → enforce per-channel limits
 *   6. Deduplication → skip duplicate notifications
 *   7. Select best channel → return routing decision
 *
 * The router is designed to be fast and synchronous for the routing
 * decision itself, while the actual delivery is handled asynchronously
 * by the channel-executor.
 *
 * Integration:
 *   - Channel Registry: checks channel availability and config
 *   - Channel Executor: delivers the notification after routing
 *   - Webhook Handlers: inbound messages may trigger outbound notifications
 */

import type {
  ChannelId,
  ChannelMessage,
  NotificationUrgency,
  NotificationPreferences,
  RoutingDecision,
  DeduplicationRecord,
} from './types';
import { ChannelRegistry } from './channel-registry';

// ============================================================
// Urgency-Based Channel Mapping
// ============================================================

/**
 * Default channel priority per urgency level.
 * Higher-priority channels are tried first for each urgency.
 *
 * The ordering balances:
 *   - Immediacy: Phone/SMS are fastest for critical alerts
 *   - Richness: Email/Slack support formatting and links
 *   - Non-intrusiveness: RSS/push for low-urgency updates
 */
const URGENCY_CHANNEL_PRIORITY: Record<NotificationUrgency, ChannelId[]> = {
  critical: ['phone', 'sms', 'slack', 'email', 'whatsapp'],
  high: ['slack', 'email', 'sms', 'telegram', 'whatsapp'],
  normal: ['email', 'slack', 'telegram', 'discord'],
  low: ['email', 'discord', 'rss'],
};

/**
 * Classify the urgency of a message based on its content and metadata.
 *
 * Uses keyword detection and metadata signals to assign an urgency level.
 * This is a heuristic — callers can override with explicit urgency.
 *
 * Detection signals:
 *   - Metadata.urgency: explicit urgency tag (highest priority)
 *   - Content keywords: "urgent", "critical", "ASAP" → high/critical
 *   - Metadata.isMention: bot mentioned → high
 *   - Metadata.isReply: email reply → normal
 *   - Default: normal
 */
export function classifyUrgency(message: ChannelMessage): NotificationUrgency {
  // Step 1: Check explicit urgency in metadata
  const explicitUrgency = message.metadata?.urgency as NotificationUrgency | undefined;
  if (explicitUrgency && ['low', 'normal', 'high', 'critical'].includes(explicitUrgency)) {
    return explicitUrgency;
  }

  // Step 2: Keyword detection in content
  const contentLower = message.content.toLowerCase();

  // Critical keywords — require immediate attention
  const criticalKeywords = [
    'outage', 'down', 'emergency', 'security breach', 'data loss',
    'system failure', 'critical error', 'service unavailable',
  ];
  if (criticalKeywords.some((kw) => contentLower.includes(kw))) {
    return 'critical';
  }

  // High urgency keywords — important but not emergency
  const highKeywords = [
    'urgent', 'asap', 'important', 'deadline', 'action required',
    'time-sensitive', 'please review', 'needs attention',
  ];
  if (highKeywords.some((kw) => contentLower.includes(kw))) {
    return 'high';
  }

  // Step 3: Check metadata signals
  if (message.metadata?.isMention) return 'high';
  if (message.metadata?.isCommand) return 'high';
  if (message.metadata?.isReply) return 'normal';

  // Step 4: Default urgency
  return 'normal';
}

// ============================================================
// Quiet Hours
// ============================================================

/**
 * Check if the current time falls within the user's quiet hours.
 *
 * Quiet hours are defined in the user's local timezone.
 * During quiet hours, only critical and high-urgency notifications
 * are routed; normal and low notifications are suppressed.
 *
 * @param preferences - User notification preferences with quiet hours config
 * @returns Whether we are currently in quiet hours
 */
function isInQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHours) return false;

  const now = new Date();
  const localHour = getLocalHour(now, preferences.quietHours.timezone);
  const { start, end } = preferences.quietHours;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return localHour >= start || localHour < end;
  }
  return localHour >= start && localHour < end;
}

/**
 * Get the current hour in the specified timezone.
 */
function getLocalHour(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    });
    return parseInt(formatter.format(date), 10);
  } catch {
    // Fallback to UTC if timezone is invalid
    return date.getUTCHours();
  }
}

// ============================================================
// In-Memory Rate Limiting
// ============================================================

/**
 * Per-channel rate limit tracking for notification routing.
 * Uses a fixed-window algorithm with configurable window size.
 *
 * This is separate from the channel-executor's rate limiting —
 * the router checks limits BEFORE dispatching to prevent
 * unnecessary executor calls.
 */
const ROUTER_RATE_WINDOWS = new Map<ChannelId, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute

/**
 * Check and consume a rate limit slot for a notification channel.
 *
 * @param channelId - The target channel
 * @param maxPerMinute - Maximum notifications per minute
 * @returns Whether the notification is allowed (true) or rate-limited (false)
 */
function checkRouterRateLimit(channelId: ChannelId, maxPerMinute: number): boolean {
  const now = Date.now();
  let bucket = ROUTER_RATE_WINDOWS.get(channelId);

  if (!bucket || (now - bucket.windowStart) >= RATE_WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    ROUTER_RATE_WINDOWS.set(channelId, bucket);
  }

  if (bucket.count >= maxPerMinute) {
    return false;
  }

  bucket.count++;
  return true;
}

/**
 * Public rate limit check for the notification router.
 *
 * @param message - The message to check
 * @param channelId - The target channel
 * @returns Whether the notification passes rate limiting
 */
export function rateLimit(message: ChannelMessage, channelId: ChannelId): boolean {
  const registry = ChannelRegistry.getInstance();
  const config = registry.getConfig(channelId);
  if (!config) return false;

  return checkRouterRateLimit(channelId, config.rateLimitPerMinute);
}

// ============================================================
// Deduplication
// ============================================================

/**
 * In-memory deduplication store.
 * Tracks content hashes per channel to prevent duplicate delivery.
 *
 * Records expire after 5 minutes to prevent unbounded memory growth.
 */
const DEDUP_STORE = new Map<string, DeduplicationRecord>();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEDUP_MAX_ENTRIES = 10_000; // Safety cap

/**
 * Compute a simple content hash for deduplication.
 * Uses a fast hash algorithm suitable for short strings.
 *
 * Note: This is NOT cryptographically secure — it's only used
 * for deduplication, not security.
 */
function computeContentHash(content: string, channelId: ChannelId): string {
  // Simple DJB2 hash — fast and sufficient for dedup
  let hash = 5381;
  const combined = `${channelId}:${content}`;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Periodically clean up expired deduplication records.
 * Runs on each dedup check (self-cleaning).
 */
function cleanupDedupStore(): void {
  const now = Date.now();
  if (DEDUP_STORE.size > DEDUP_MAX_ENTRIES) {
    // Emergency cleanup: remove all expired records
    for (const [key, record] of Array.from(DEDUP_STORE.entries())) {
      if (now - record.firstSeenAt > DEDUP_TTL_MS) {
        DEDUP_STORE.delete(key);
      }
    }
  }
}

/**
 * Check if a message has already been sent to a channel (deduplication).
 *
 * Returns true if the message is a DUPLICATE (should be skipped),
 * false if it's a NEW message (should be delivered).
 *
 * @param message - The message to check
 * @param channelId - The target channel
 * @returns Whether the message is a duplicate (true = skip it)
 */
export function deduplicate(message: ChannelMessage, channelId: ChannelId): boolean {
  const hash = computeContentHash(message.content, channelId);
  const now = Date.now();

  cleanupDedupStore();

  const existing = DEDUP_STORE.get(hash);
  if (existing && (now - existing.firstSeenAt) < DEDUP_TTL_MS) {
    // Duplicate found within the TTL window
    existing.seenCount++;
    return true; // This is a duplicate
  }

  // Not a duplicate — record it
  DEDUP_STORE.set(hash, {
    contentHash: hash,
    channelId,
    firstSeenAt: now,
    seenCount: 1,
  });

  return false; // Not a duplicate
}

// ============================================================
// Channel Availability Check
// ============================================================

/**
 * Check if a channel is available for notification delivery.
 *
 * A channel is available if:
 *   1. It's registered in the ChannelRegistry
 *   2. It's enabled in the config
 *   3. It supports delivery (ChannelInfo.deliveryEnabled)
 *   4. It's not muted in user preferences
 *
 * @param channelId - The channel to check
 * @param preferences - User notification preferences
 * @returns Whether the channel is available
 */
function isChannelAvailable(
  channelId: ChannelId,
  preferences: NotificationPreferences,
): boolean {
  const registry = ChannelRegistry.getInstance();

  // Must be registered
  const info = registry.getChannel(channelId);
  if (!info) return false;

  // Must be enabled
  const config = registry.getConfig(channelId);
  if (!config || !config.enabled) return false;

  // Must support delivery
  if (!info.deliveryEnabled) return false;

  // Must not be muted
  if (preferences.mutedChannels?.includes(channelId)) return false;

  return true;
}

/**
 * Check if a channel has the required API credentials configured.
 * For communication channels, checks for environment variables.
 */
function hasChannelCredentials(channelId: ChannelId): boolean {
  switch (channelId) {
    case 'slack':
      return !!process.env.SLACK_BOT_TOKEN;
    case 'telegram':
      return !!process.env.TELEGRAM_BOT_TOKEN;
    case 'whatsapp':
      return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER);
    case 'email':
      return !!process.env.EMAIL_API_KEY;
    case 'phone':
      return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    case 'sms':
      return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    case 'discord':
      return !!process.env.DISCORD_BOT_TOKEN;
    default:
      // Research channels don't need credentials for routing decisions
      return true;
  }
}

// ============================================================
// Main Routing Function
// ============================================================

/**
 * Route a notification to the best available channel.
 *
 * This is the primary entry point for the notification router.
 * It evaluates the message, user preferences, and channel availability
 * to select the optimal delivery channel.
 *
 * @param message - The notification message to route
 * @param userPreferences - User's notification preferences
 * @returns RoutingDecision with the selected channel and reasoning
 *
 * @example
 * ```typescript
 * const decision = routeNotification(
 *   {
 *     id: 'msg_1',
 *     channelId: 'email',
 *     direction: 'inbound',
 *     content: 'New lead: Acme Corp wants a demo!',
 *     contentType: 'text',
 *     timestamp: Date.now(),
 *     metadata: { urgency: 'high' },
 *   },
 *   {
 *     defaultChannel: 'slack',
 *     mutedChannels: ['discord'],
 *   }
 * );
 * // decision.channelId → 'slack' (user's preferred channel)
 * // decision.reason → 'User default channel is available and not muted'
 * ```
 */
export function routeNotification(
  message: ChannelMessage,
  userPreferences: Record<string, unknown> = {},
): RoutingDecision {
  const now = Date.now();
  const prefs = normalizePreferences(userPreferences);

  // ── Step 1: Classify urgency ───────────────────────────────
  const urgency = classifyUrgency(message);

  // ── Step 2: Check quiet hours ──────────────────────────────
  const inQuietHours = isInQuietHours(prefs);

  // During quiet hours, suppress non-critical notifications
  if (inQuietHours && (urgency === 'low' || urgency === 'normal')) {
    return {
      channelId: prefs.defaultChannel || 'email',
      reason: `Suppressed during quiet hours (urgency: ${urgency})`,
      rateLimited: false,
      deduplicated: false,
      timestamp: now,
    };
  }

  // ── Step 3: Build candidate channel list ───────────────────
  let candidates: ChannelId[];

  // If user has an urgency-specific channel preference, try that first
  if (prefs.urgencyChannelMap?.[urgency]) {
    candidates = [prefs.urgencyChannelMap[urgency]!];
    // Fall back to default priority list if the preferred channel is unavailable
    candidates.push(...URGENCY_CHANNEL_PRIORITY[urgency]);
  } else if (prefs.defaultChannel) {
    // Try the user's default channel first
    candidates = [prefs.defaultChannel, ...URGENCY_CHANNEL_PRIORITY[urgency]];
  } else {
    // Use urgency-based priority
    candidates = [...URGENCY_CHANNEL_PRIORITY[urgency]];
  }

  // ── Step 4: Filter candidates ──────────────────────────────
  for (const channelId of candidates) {
    // Check availability (registered, enabled, delivery-capable, not muted)
    if (!isChannelAvailable(channelId, prefs)) continue;

    // Check if credentials are configured
    if (!hasChannelCredentials(channelId)) continue;

    // Check rate limit
    const registry = ChannelRegistry.getInstance();
    const config = registry.getConfig(channelId);
    const rateLimitPerMin = config?.rateLimitPerMinute ?? 0;

    const isRateLimited = !checkRouterRateLimit(channelId, rateLimitPerMin);
    if (isRateLimited) {
      // Continue to next candidate instead of returning immediately
      continue;
    }

    // Check deduplication
    const isDuplicate = deduplicate(message, channelId);
    if (isDuplicate) {
      return {
        channelId,
        reason: 'Duplicate notification — already sent to this channel',
        rateLimited: false,
        deduplicated: true,
        timestamp: now,
      };
    }

    // ── Step 5: Selected channel ──────────────────────────────
    let reason = '';
    if (prefs.urgencyChannelMap?.[urgency] === channelId) {
      reason = `User preference for ${urgency} urgency → ${channelId}`;
    } else if (prefs.defaultChannel === channelId) {
      reason = `User default channel (${channelId}) selected for ${urgency} urgency notification`;
    } else {
      reason = `Best available channel for ${urgency} urgency: ${channelId}`;
    }

    return {
      channelId,
      reason,
      rateLimited: false,
      deduplicated: false,
      timestamp: now,
    };
  }

  // ── Fallback: All candidates failed ────────────────────────
  // Try email as a last resort (most universally available)
  if (isChannelAvailable('email', prefs) && hasChannelCredentials('email')) {
    return {
      channelId: 'email',
      reason: 'Fallback: all preferred channels unavailable or rate-limited, routing to email',
      rateLimited: true,
      deduplicated: false,
      timestamp: now,
    };
  }

  // Absolute fallback — return the first candidate even if it's rate-limited
  const fallbackChannel = candidates[0] || 'email';
  return {
    channelId: fallbackChannel,
    reason: `All channels rate-limited or unavailable. Fallback to ${fallbackChannel}.`,
    rateLimited: true,
    deduplicated: false,
    timestamp: now,
  };
}

// ============================================================
// Preference Normalization
// ============================================================

/**
 * Normalize raw user preferences into a typed NotificationPreferences object.
 * Handles missing fields, invalid values, and provides defaults.
 */
function normalizePreferences(
  raw: Record<string, unknown>,
): NotificationPreferences {
  const prefs: NotificationPreferences = {};

  // Default channel
  if (typeof raw.defaultChannel === 'string') {
    prefs.defaultChannel = raw.defaultChannel as ChannelId;
  }

  // Urgency channel map
  if (raw.urgencyChannelMap && typeof raw.urgencyChannelMap === 'object') {
    prefs.urgencyChannelMap = raw.urgencyChannelMap as Partial<Record<NotificationUrgency, ChannelId>>;
  }

  // Quiet hours
  if (raw.quietHours && typeof raw.quietHours === 'object') {
    const qh = raw.quietHours as Record<string, unknown>;
    prefs.quietHours = {
      start: typeof qh.start === 'number' ? qh.start : 22,
      end: typeof qh.end === 'number' ? qh.end : 8,
      timezone: typeof qh.timezone === 'string' ? qh.timezone : 'UTC',
    };
  }

  // Muted channels
  if (Array.isArray(raw.mutedChannels)) {
    prefs.mutedChannels = raw.mutedChannels as ChannelId[];
  }

  // Digest settings
  if (typeof raw.digestEnabled === 'boolean') {
    prefs.digestEnabled = raw.digestEnabled;
  }
  if (typeof raw.digestIntervalMinutes === 'number') {
    prefs.digestIntervalMinutes = raw.digestIntervalMinutes;
  }

  return prefs;
}

// ============================================================
// Digest Aggregation
// ============================================================

/**
 * Aggregated notifications for digest delivery.
 * Groups notifications by channel and delivers them in batches
 * at the configured digest interval.
 */
interface DigestBucket {
  channelId: ChannelId;
  messages: ChannelMessage[];
  lastDeliveredAt: number;
}

const DIGEST_BUCKETS = new Map<string, DigestBucket>();

/**
 * Add a message to the digest bucket for a user.
 * If the bucket is full or the interval has elapsed, returns the
 * messages to be delivered immediately.
 *
 * @param userId - The user to aggregate for
 * @param message - The notification message
 * @param channelId - The target channel
 * @param intervalMinutes - Digest interval in minutes
 * @returns Messages to deliver now, or empty array if buffered
 */
export function addToDigest(
  userId: string,
  message: ChannelMessage,
  channelId: ChannelId,
  intervalMinutes: number,
): ChannelMessage[] {
  const key = `${userId}:${channelId}`;
  const now = Date.now();
  const intervalMs = intervalMinutes * 60_000;

  let bucket = DIGEST_BUCKETS.get(key);
  if (!bucket) {
    bucket = { channelId, messages: [], lastDeliveredAt: now };
    DIGEST_BUCKETS.set(key, bucket);
  }

  bucket.messages.push(message);

  // Deliver if interval has elapsed or bucket has 10+ messages
  if (
    (now - bucket.lastDeliveredAt) >= intervalMs ||
    bucket.messages.length >= 10
  ) {
    const toDeliver = [...bucket.messages];
    bucket.messages = [];
    bucket.lastDeliveredAt = now;
    return toDeliver;
  }

  return []; // Still buffering
}

/**
 * Flush all pending digest messages for a user.
 * Used when a user comes online or explicitly requests pending notifications.
 *
 * @param userId - The user to flush digests for
 * @returns Map of channelId → messages to deliver
 */
export function flushDigests(userId: string): Map<ChannelId, ChannelMessage[]> {
  const result = new Map<ChannelId, ChannelMessage[]>();

  for (const [key, bucket] of Array.from(DIGEST_BUCKETS.entries())) {
    if (key.startsWith(`${userId}:`) && bucket.messages.length > 0) {
      result.set(bucket.channelId, [...bucket.messages]);
      bucket.messages = [];
      bucket.lastDeliveredAt = Date.now();
    }
  }

  return result;
}

// ============================================================
// Batch Routing
// ============================================================

/**
 * Route multiple notifications in batch, respecting rate limits
 * and deduplication across the batch.
 *
 * @param messages - Array of messages to route
 * @param userPreferences - User notification preferences
 * @returns Array of routing decisions, one per message
 */
export function routeNotificationBatch(
  messages: ChannelMessage[],
  userPreferences: Record<string, unknown> = {},
): RoutingDecision[] {
  return messages.map((message) => routeNotification(message, userPreferences));
}

// ============================================================
// Utility Exports
// ============================================================

/**
 * Get the list of channels that would be considered for a given urgency level.
 * Useful for UI display of notification routing preferences.
 */
export function getCandidateChannels(urgency: NotificationUrgency): ChannelId[] {
  return [...URGENCY_CHANNEL_PRIORITY[urgency]];
}

/**
 * Reset all router state (rate limits, dedup store, digest buckets).
 * Useful for testing.
 */
export function resetRouterState(): void {
  ROUTER_RATE_WINDOWS.clear();
  DEDUP_STORE.clear();
  DIGEST_BUCKETS.clear();
}
