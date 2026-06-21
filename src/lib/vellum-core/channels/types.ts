/**
 * Vellum Core — Enhanced Channel Type Definitions
 *
 * Adapted from Vellum Assistant's channel architecture and merged with
 * LeadReach's existing Agent-Reach bridge (17+ channel implementations).
 *
 * This module defines the unified type contract for the Enhanced
 * Multi-Channel Communication System, covering:
 *
 *   - Channel & Interface identifiers
 *   - Channel metadata (info) and runtime configuration
 *   - Standardized message format across all channels
 *   - Execution result type for channel operations
 *   - Trust & permission models per channel
 *   - Webhook payload types for inbound channels
 *   - Notification routing preferences
 *
 * Design Principles:
 *   1. Additive — does not replace existing vellum-core/types.ts ChannelId/ChannelConfig
 *   2. Compatible — integrates with agent-reach-bridge.ts ToolResult pattern
 *   3. Extensible — union types allow adding new channels without breaking changes
 */

// ============================================================
// Channel Identifiers
// ============================================================

/**
 * All supported channel identifiers in the Enhanced Multi-Channel system.
 *
 * Channels 1–8:  Existing Agent-Reach bridge channels (web, exa, linkedin,
 *                twitter, reddit, github, youtube, rss) — powered by
 *                Jina Reader, Exa, yt-dlp, gh CLI, etc.
 * Channels 9–14: New communication channels (slack, telegram, whatsapp,
 *                email, phone, sms, discord) — powered by external APIs
 *                and webhook integrations.
 */
export type ChannelId =
  | 'web'       // Jina Reader — zero-config web page reading
  | 'slack'     // Slack Bot API — workspace messaging
  | 'telegram'  // Telegram Bot API — chat messaging
  | 'whatsapp'  // WhatsApp Business API — messaging via Twilio/Meta
  | 'email'     // SMTP/IMAP — email sending and receiving
  | 'phone'     // Telephony — voice calls via Twilio/Vonage
  | 'sms'       // SMS — text messages via Twilio/SNS
  | 'linkedin'  // LinkedIn — professional profiles & outreach
  | 'twitter'   // Twitter/X — social intelligence
  | 'reddit'    // Reddit — community intelligence
  | 'github'    // GitHub — repository & developer intelligence
  | 'youtube'   // YouTube — video transcripts & metadata
  | 'rss'       // RSS/Atom — feed monitoring
  | 'exa'       // Exa Search — AI-powered semantic search
  | 'discord';  // Discord Bot API — community messaging

/**
 * Interface identifiers — the client surface through which a user
 * interacts with the LeadReach agent. Used for channel selection
 * heuristics (e.g., a Slack message should route replies to Slack,
 * not email).
 */
export type InterfaceId =
  | 'web'             // Browser-based chat interface
  | 'cli'             // Command-line interface
  | 'desktop'         // Desktop application (Electron, Tauri)
  | 'mobile'          // Mobile app (iOS/Android)
  | 'api'             // REST/GraphQL API consumer
  | 'chrome-extension'; // Browser extension

// ============================================================
// Channel Metadata & Configuration
// ============================================================

/**
 * Static metadata about a channel — describes its capabilities,
 * appearance, and conversation behavior. This does NOT change
 * at runtime; it is registered once and read many times.
 */
export interface ChannelInfo {
  /** Unique channel identifier */
  id: ChannelId;
  /** Human-readable display name */
  label: string;
  /** Short description of the channel's purpose */
  subtitle?: string;
  /** Lucide icon name for UI rendering (e.g., 'Globe', 'MessageSquare') */
  icon?: string;
  /** Tailwind color class for UI theming (e.g., 'text-emerald-600') */
  color: string;
  /** Whether this channel supports webhook signature verification */
  verificationSupported: boolean;
  /** Whether this channel can deliver outbound messages */
  deliveryEnabled: boolean;
  /**
   * How conversations are handled on this channel:
   * - 'start_new': Each interaction starts a fresh conversation
   * - 'continue_existing': Messages continue an existing thread/conversation
   * - 'not_deliverable': Channel is read-only (inbound only, no replies)
   * - 'push_only': Channel only receives notifications, no two-way chat
   */
  conversationStrategy: 'start_new' | 'continue_existing' | 'not_deliverable' | 'push_only';
}

/**
 * Runtime configuration for a channel — controls permissions,
 * rate limits, and feature flags. Can be updated at runtime
 * (e.g., by an admin adjusting rate limits).
 */
export interface ChannelConfig {
  /** The channel this config applies to */
  channelId: ChannelId;
  /** Whether this channel is currently enabled */
  enabled: boolean;
  /** Whether notification delivery is enabled for this channel */
  notificationEnabled: boolean;
  /**
   * Trust level for this channel — determines which tools
   * the agent can use when operating through this channel.
   * - 'guardian': Full access — internal UI, CLI, desktop
   * - 'trusted': Most tools allowed — Slack, Telegram, Discord
   * - 'unknown': Restricted access — new/unverified channels
   */
  trustLevel: 'guardian' | 'trusted' | 'unknown';
  /** Tool categories allowed on this channel (e.g., ['research', 'read']) */
  allowedToolCategories: string[];
  /** Specific tools blocked on this channel (overrides allowedToolCategories) */
  blockedTools: string[];
  /** Maximum operations per minute on this channel */
  rateLimitPerMinute: number;
}

// ============================================================
// Channel Messages
// ============================================================

/**
 * A standardized message that flows through the channel system.
 *
 * All inbound webhooks and outbound messages are normalized to this
 * format regardless of the source channel. This provides a uniform
 * processing pipeline for:
 *   - Permission checks
 *   - Rate limiting
 *   - Deduplication
 *   - Notification routing
 *   - Audit logging
 */
export interface ChannelMessage {
  /** Unique message identifier (UUID) */
  id: string;
  /** The channel this message originated from or is destined for */
  channelId: ChannelId;
  /** Message direction relative to the LeadReach system */
  direction: 'inbound' | 'outbound';
  /** The message body */
  content: string;
  /** Content format — determines rendering and processing */
  contentType: 'text' | 'html' | 'markdown';
  /**
   * Channel-specific metadata (e.g., Slack thread_ts, Telegram chat_id,
   * email subject, WhatsApp message_status).
   */
  metadata?: Record<string, unknown>;
  /** Unix timestamp (ms) when the message was created */
  timestamp: number;
}

// ============================================================
// Channel Execution Results
// ============================================================

/**
 * Result of executing an action on a channel.
 *
 * This is the unified return type for the channel executor.
 * It follows the same success/error pattern as agent-reach-bridge's
 * ToolResult, but with channel-specific metadata.
 */
export interface ChannelResult {
  /** Whether the execution succeeded */
  success: boolean;
  /** The channel that was targeted */
  channelId: ChannelId;
  /** The result data (type depends on the action) */
  data?: unknown;
  /** Error message if success is false */
  error?: string;
  /** Additional metadata about the execution */
  metadata?: Record<string, unknown>;
}

// ============================================================
// Webhook-Specific Types
// ============================================================

/**
 * Supported webhook source channels.
 * Only channels that support inbound webhooks are listed here.
 */
export type WebhookChannel = 'slack' | 'telegram' | 'whatsapp' | 'phone' | 'sms' | 'email' | 'discord';

/**
 * Result of processing a webhook payload.
 * Includes verification status and the standardized ChannelMessage.
 */
export interface WebhookResult {
  /** Whether the webhook signature was verified */
  verified: boolean;
  /** The channel that sent the webhook */
  channel: WebhookChannel;
  /** The standardized message extracted from the webhook payload */
  message: ChannelMessage;
  /** Raw webhook payload for audit/debugging */
  rawPayload?: unknown;
}

/**
 * Configuration for a webhook endpoint.
 * Used to store signing secrets and verify incoming payloads.
 */
export interface WebhookConfig {
  /** The channel this webhook config applies to */
  channel: WebhookChannel;
  /** HMAC signing secret for signature verification */
  signingSecret: string;
  /** Whether signature verification is enabled */
  verificationEnabled: boolean;
  /** Expected signature algorithm (e.g., 'sha256') */
  algorithm: 'sha256' | 'sha1' | 'sha512';
  /** Header name that contains the signature */
  signatureHeader: string;
}

// ============================================================
// Notification Routing Types
// ============================================================

/**
 * Urgency level for notification routing decisions.
 * Higher urgency channels are preferred for critical messages.
 */
export type NotificationUrgency = 'low' | 'normal' | 'high' | 'critical';

/**
 * User notification preferences that influence routing decisions.
 */
export interface NotificationPreferences {
  /** Default channel for notifications (user's preferred channel) */
  defaultChannel?: ChannelId;
  /** Channel preference by urgency level */
  urgencyChannelMap?: Partial<Record<NotificationUrgency, ChannelId>>;
  /** Quiet hours — suppress non-critical notifications during these hours */
  quietHours?: {
    /** Start hour (0-23, local time) */
    start: number;
    /** End hour (0-23, local time) */
    end: number;
    /** Timezone (IANA format, e.g., 'America/New_York') */
    timezone: string;
  };
  /** Channels the user has muted */
  mutedChannels?: ChannelId[];
  /** Whether to aggregate multiple notifications into a digest */
  digestEnabled?: boolean;
  /** How often to send digests (in minutes) */
  digestIntervalMinutes?: number;
}

/**
 * Result of a notification routing decision.
 */
export interface RoutingDecision {
  /** The channel the notification will be sent to */
  channelId: ChannelId;
  /** Why this channel was selected */
  reason: string;
  /** Whether the notification was rate-limited */
  rateLimited: boolean;
  /** Whether the notification was deduplicated */
  deduplicated: boolean;
  /** Timestamp of the routing decision */
  timestamp: number;
}

// ============================================================
// Rate Limiting (Channel-Specific)
// ============================================================

/**
 * Internal rate limit bucket for per-channel tracking.
 * Used by the notification router and channel executor.
 */
export interface ChannelRateLimitBucket {
  /** The channel this bucket tracks */
  channelId: ChannelId;
  /** Number of requests in the current window */
  count: number;
  /** Start of the current rate limit window (epoch ms) */
  windowStart: number;
  /** Duration of the rate limit window (ms) */
  windowMs: number;
  /** Maximum requests allowed per window */
  maxRequests: number;
}

// ============================================================
// Deduplication
// ============================================================

/**
 * Internal deduplication record.
 * Tracks recently processed messages to prevent duplicate delivery.
 */
export interface DeduplicationRecord {
  /** Content hash for detecting duplicate messages */
  contentHash: string;
  /** Channel the message was sent to */
  channelId: ChannelId;
  /** Timestamp when the message was first seen */
  firstSeenAt: number;
  /** Number of times this message content was seen */
  seenCount: number;
}
