/**
 * Vellum Core — Enhanced Multi-Channel Communication System
 *
 * Main entry point that exports everything from the channels module.
 *
 * This system merges Vellum Assistant's channel architecture with
 * LeadReach's existing Agent-Reach bridge, providing a unified
 * interface for:
 *
 *   - Channel registration and configuration
 *   - Unified channel execution (14 channels)
 *   - Webhook processing with signature verification
 *   - Smart notification routing with rate limiting & deduplication
 *
 * Module Structure:
 *   types.ts               — All type definitions
 *   channel-registry.ts    — Channel metadata & config registry (singleton)
 *   channel-executor.ts    — Unified execution engine with permission checks
 *   webhooks.ts            — Webhook handlers with signature verification
 *   notification-router.ts — Smart notification routing
 *
 * Quick Start:
 * ```typescript
 * import {
 *   ChannelRegistry,
 *   executeOnChannel,
 *   routeNotification,
 *   handleWebhook,
 * } from '@/lib/vellum-core/channels';
 *
 * // Execute an action on a channel
 * const result = await executeOnChannel('exa', 'search', {
 *   query: 'B2B SaaS companies',
 *   numResults: 10,
 * });
 *
 * // Route a notification to the best channel
 * const decision = routeNotification(message, {
 *   defaultChannel: 'slack',
 * });
 *
 * // Process an inbound webhook
 * const webhookResult = handleSlackWebhook(payload);
 * ```
 */

// ============================================================
// Types
// ============================================================

export type {
  ChannelId,
  InterfaceId,
  ChannelInfo,
  ChannelConfig,
  ChannelMessage,
  ChannelResult,
  WebhookChannel,
  WebhookResult,
  WebhookConfig,
  NotificationUrgency,
  NotificationPreferences,
  RoutingDecision,
  ChannelRateLimitBucket,
  DeduplicationRecord,
} from './types';

// ============================================================
// Channel Registry
// ============================================================

export {
  ChannelRegistry,
} from './channel-registry';

// ============================================================
// Channel Executor
// ============================================================

export {
  executeOnChannel,
  getChannelRateLimitStatus,
  getSupportedActions,
} from './channel-executor';

// ============================================================
// Webhook Handlers
// ============================================================

export {
  // Slack
  verifySlackSignature,
  handleSlackWebhook,
  // Telegram
  verifyTelegramSignature,
  handleTelegramWebhook,
  // WhatsApp
  verifyWhatsAppSignature,
  handleWhatsAppWebhook,
  // Twilio (Phone + SMS)
  verifyTwilioSignature,
  handleTwilioWebhook,
  // Email
  verifyEmailSignature,
  handleEmailWebhook,
  // Discord
  verifyDiscordSignature,
  handleDiscordWebhook,
  // Generic
  handleWebhook,
} from './webhooks';

// ============================================================
// Notification Router
// ============================================================

export {
  routeNotification,
  routeNotificationBatch,
  rateLimit,
  deduplicate,
  classifyUrgency,
  addToDigest,
  flushDigests,
  getCandidateChannels,
  resetRouterState,
} from './notification-router';
