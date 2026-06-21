/**
 * Vellum Core — Channel Registry
 *
 * Singleton registry that manages all channel metadata (ChannelInfo) and
 * runtime configuration (ChannelConfig) for the Enhanced Multi-Channel
 * Communication System.
 *
 * Responsibilities:
 *   - Register channels with their info and default config
 *   - Look up channel info and config by ID
 *   - List all channels or only enabled ones
 *   - Determine whether a specific tool is allowed on a given channel
 *     based on trust level, allowed categories, and blocked tools
 *   - Pre-register all 14 channels with production-ready defaults
 *
 * Integration Points:
 *   - channel-executor.ts uses the registry for permission checks
 *   - notification-router.ts uses it for channel availability
 *   - UI components use it for channel listing and status display
 *   - API routes use it for channel configuration management
 */

import type { ChannelId, ChannelInfo, ChannelConfig } from './types';

// ============================================================
// Default Channel Definitions
// ============================================================

/**
 * Pre-defined ChannelInfo for all 14 supported channels.
 * This array mirrors the Agent-Reach channel definitions from
 * agent-reach.ts and extends them with Vellum-specific metadata
 * (conversation strategy, verification support, etc.).
 */
const DEFAULT_CHANNEL_INFOS: ChannelInfo[] = [
  // ── Existing Agent-Reach Channels ──────────────────────────
  {
    id: 'web',
    label: 'Web',
    subtitle: 'Read any webpage via Jina Reader — zero config',
    icon: 'Globe',
    color: 'text-emerald-600',
    verificationSupported: false,
    deliveryEnabled: false, // Web is read-only (inbound data)
    conversationStrategy: 'not_deliverable',
  },
  {
    id: 'exa',
    label: 'Exa Search',
    subtitle: 'AI-powered semantic web search',
    icon: 'Search',
    color: 'text-violet-600',
    verificationSupported: false,
    deliveryEnabled: false, // Search is read-only
    conversationStrategy: 'not_deliverable',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    subtitle: 'Professional profiles, companies, and outreach',
    icon: 'Linkedin',
    color: 'text-blue-600',
    verificationSupported: false,
    deliveryEnabled: true, // Can send connection requests / messages
    conversationStrategy: 'start_new',
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    subtitle: 'Tweet search, timelines, and social intelligence',
    icon: 'Twitter',
    color: 'text-sky-500',
    verificationSupported: false,
    deliveryEnabled: true, // Can post tweets / DMs
    conversationStrategy: 'start_new',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    subtitle: 'Subreddit posts, search, and community data',
    icon: 'MessageCircle',
    color: 'text-orange-600',
    verificationSupported: false,
    deliveryEnabled: false, // Read-only intelligence
    conversationStrategy: 'not_deliverable',
  },
  {
    id: 'github',
    label: 'GitHub',
    subtitle: 'Repository data, code search, and developer intelligence',
    icon: 'Github',
    color: 'text-gray-800',
    verificationSupported: false,
    deliveryEnabled: false, // Read-only intelligence
    conversationStrategy: 'not_deliverable',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    subtitle: 'Video transcripts, subtitles, and channel data',
    icon: 'Youtube',
    color: 'text-red-600',
    verificationSupported: false,
    deliveryEnabled: false, // Read-only intelligence
    conversationStrategy: 'not_deliverable',
  },
  {
    id: 'rss',
    label: 'RSS Feeds',
    subtitle: 'Parse and monitor any RSS/Atom feed',
    icon: 'Rss',
    color: 'text-amber-600',
    verificationSupported: false,
    deliveryEnabled: true, // Push notifications from feed updates
    conversationStrategy: 'push_only',
  },

  // ── New Communication Channels ─────────────────────────────
  {
    id: 'slack',
    label: 'Slack',
    subtitle: 'Workspace messaging via Slack Bot API',
    icon: 'Hash',
    color: 'text-purple-600',
    verificationSupported: true, // Slack signs requests with signing secret
    deliveryEnabled: true,
    conversationStrategy: 'continue_existing',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    subtitle: 'Chat messaging via Telegram Bot API',
    icon: 'Send',
    color: 'text-cyan-600',
    verificationSupported: true, // Telegram hash verification
    deliveryEnabled: true,
    conversationStrategy: 'continue_existing',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    subtitle: 'Business messaging via WhatsApp Business API',
    icon: 'Smartphone',
    color: 'text-green-600',
    verificationSupported: true, // Meta webhook signature
    deliveryEnabled: true,
    conversationStrategy: 'continue_existing',
  },
  {
    id: 'email',
    label: 'Email',
    subtitle: 'SMTP/IMAP email sending and receiving',
    icon: 'Mail',
    color: 'text-rose-600',
    verificationSupported: true, // DKIM/SPF verification
    deliveryEnabled: true,
    conversationStrategy: 'continue_existing',
  },
  {
    id: 'phone',
    label: 'Phone',
    subtitle: 'Voice calls via Twilio/Vonage',
    icon: 'Phone',
    color: 'text-indigo-600',
    verificationSupported: true, // Twilio signature validation
    deliveryEnabled: true,
    conversationStrategy: 'start_new',
  },
  {
    id: 'sms',
    label: 'SMS',
    subtitle: 'Text messages via Twilio/SNS',
    icon: 'MessageSquare',
    color: 'text-teal-600',
    verificationSupported: true, // Twilio signature validation
    deliveryEnabled: true,
    conversationStrategy: 'start_new',
  },
  {
    id: 'discord',
    label: 'Discord',
    subtitle: 'Community messaging via Discord Bot API',
    icon: 'MessagesSquare',
    color: 'text-indigo-500',
    verificationSupported: true, // Discord signature verification
    deliveryEnabled: true,
    conversationStrategy: 'continue_existing',
  },
];

/**
 * Pre-defined default ChannelConfig for all 14 channels.
 * Trust levels and rate limits are calibrated for B2B sales workflows:
 *   - Research channels (web, exa, github, etc.): higher limits, 'trusted'
 *   - Communication channels (slack, email, etc.): lower limits, 'trusted'
 *   - New/unverified channels: restricted, 'unknown'
 */
const DEFAULT_CHANNEL_CONFIGS: ChannelConfig[] = [
  // ── Agent-Reach Channels (Research) ────────────────────────
  {
    channelId: 'web',
    enabled: true,
    notificationEnabled: false,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'read', 'web'],
    blockedTools: [],
    rateLimitPerMinute: 60,
  },
  {
    channelId: 'exa',
    enabled: true,
    notificationEnabled: false,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'search', 'web'],
    blockedTools: [],
    rateLimitPerMinute: 30,
  },
  {
    channelId: 'linkedin',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'outreach', 'social', 'read'],
    blockedTools: ['bulk_operation', 'credential_access'],
    rateLimitPerMinute: 15,
  },
  {
    channelId: 'twitter',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'social', 'read'],
    blockedTools: ['email_send', 'bulk_operation'],
    rateLimitPerMinute: 30,
  },
  {
    channelId: 'reddit',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'read', 'social'],
    blockedTools: [],
    rateLimitPerMinute: 20,
  },
  {
    channelId: 'github',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'read', 'development'],
    blockedTools: ['file_write', 'file_delete'],
    rateLimitPerMinute: 40,
  },
  {
    channelId: 'youtube',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'read', 'media'],
    blockedTools: [],
    rateLimitPerMinute: 20,
  },
  {
    channelId: 'rss',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'read', 'monitoring'],
    blockedTools: [],
    rateLimitPerMinute: 30,
  },

  // ── Communication Channels ─────────────────────────────────
  {
    channelId: 'slack',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'outreach', 'communication', 'read'],
    blockedTools: ['credential_access', 'api_key_access'],
    rateLimitPerMinute: 20,
  },
  {
    channelId: 'telegram',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'communication', 'read'],
    blockedTools: ['credential_access', 'api_key_access', 'bulk_operation'],
    rateLimitPerMinute: 20,
  },
  {
    channelId: 'whatsapp',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['outreach', 'communication'],
    blockedTools: ['credential_access', 'api_key_access', 'bulk_operation'],
    rateLimitPerMinute: 10,
  },
  {
    channelId: 'email',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['outreach', 'communication', 'read'],
    blockedTools: ['credential_access', 'api_key_access', 'bulk_operation'],
    rateLimitPerMinute: 15,
  },
  {
    channelId: 'phone',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['outreach', 'communication'],
    blockedTools: ['credential_access', 'api_key_access', 'bulk_operation', 'data_export'],
    rateLimitPerMinute: 5,
  },
  {
    channelId: 'sms',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['outreach', 'communication', 'notification'],
    blockedTools: ['credential_access', 'api_key_access', 'bulk_operation'],
    rateLimitPerMinute: 10,
  },
  {
    channelId: 'discord',
    enabled: true,
    notificationEnabled: true,
    trustLevel: 'trusted',
    allowedToolCategories: ['research', 'communication', 'read'],
    blockedTools: ['credential_access', 'api_key_access'],
    rateLimitPerMinute: 30,
  },
];

// ============================================================
// Tool Category Definitions
// ============================================================

/**
 * Mapping of tool categories to the tools they contain.
 * Used by isToolAllowedInChannel to determine if a tool falls
 * within a channel's allowed categories.
 *
 * Categories align with the Vellum permissions system's
 * risk classification in vellum-core/permissions.ts.
 */
const TOOL_CATEGORIES: Record<string, Set<string>> = {
  research: new Set([
    'web_search', 'company_research', 'person_research',
    'market_analysis', 'competitive_analysis', 'icp_lookup',
    'lead_score_read', 'deep_crawl', 'contact_extract',
  ]),
  read: new Set([
    'web_read', 'file_read', 'pipeline_status', 'health_check',
    'list_tools', 'github_read', 'reddit_read', 'youtube_read',
    'linkedin_read', 'twitter_read', 'rss_read',
  ]),
  search: new Set([
    'web_search', 'exa_search', 'github_search', 'reddit_search',
    'linkedin_search', 'twitter_search', 'youtube_search',
  ]),
  web: new Set([
    'web_read', 'web_search', 'web_crawl', 'deep_crawl',
  ]),
  outreach: new Set([
    'outreach_compose', 'email_send', 'linkedin_message',
    'email_find', 'data_enrich',
  ]),
  communication: new Set([
    'slack_send', 'telegram_send', 'whatsapp_send', 'email_send',
    'sms_send', 'phone_call', 'discord_send',
  ]),
  social: new Set([
    'linkedin_search', 'linkedin_read', 'twitter_search',
    'twitter_read', 'reddit_read', 'reddit_search',
  ]),
  development: new Set([
    'github_read', 'github_search', 'github_code_search',
  ]),
  media: new Set([
    'youtube_read', 'youtube_search', 'youtube_subtitles',
  ]),
  monitoring: new Set([
    'rss_read', 'rss_monitor', 'web_monitor',
  ]),
  notification: new Set([
    'notification_send', 'sms_send', 'email_send',
    'slack_send', 'telegram_send', 'discord_send',
  ]),
  write: new Set([
    'file_write', 'pipeline_update', 'lead_score_write',
    'icp_build', 'outreach_compose',
  ]),
};

// ============================================================
// ChannelRegistry Class
// ============================================================

/**
 * Singleton registry for all channel metadata and configuration.
 *
 * Provides fast lookups, permission checks, and channel listing.
 * Pre-registered with all 14 channels on instantiation.
 *
 * Usage:
 * ```typescript
 * const registry = ChannelRegistry.getInstance();
 *
 * // Get channel info
 * const slack = registry.getChannel('slack');
 *
 * // Check if a tool is allowed
 * const allowed = registry.isToolAllowedInChannel('slack', 'web_search', 'research');
 *
 * // Get all enabled channels
 * const enabled = registry.getEnabledChannels();
 * ```
 */
export class ChannelRegistry {
  /** Channel info indexed by ChannelId for O(1) lookup */
  private channels: Map<ChannelId, ChannelInfo> = new Map();

  /** Channel config indexed by ChannelId for O(1) lookup */
  private configs: Map<ChannelId, ChannelConfig> = new Map();

  /** Singleton instance */
  private static instance: ChannelRegistry | null = null;

  // ── Singleton Access ──────────────────────────────────────

  private constructor() {
    // Pre-register all 14 channels with their defaults
    for (const info of DEFAULT_CHANNEL_INFOS) {
      this.channels.set(info.id, { ...info });
    }
    for (const config of DEFAULT_CHANNEL_CONFIGS) {
      this.configs.set(config.channelId, { ...config });
    }
  }

  /**
   * Get the singleton ChannelRegistry instance.
   * Creates the instance on first call with all default channels pre-registered.
   */
  static getInstance(): ChannelRegistry {
    if (!ChannelRegistry.instance) {
      ChannelRegistry.instance = new ChannelRegistry();
    }
    return ChannelRegistry.instance;
  }

  /**
   * Reset the singleton instance.
   * Useful for testing or when a full re-registration is needed.
   */
  static resetInstance(): void {
    ChannelRegistry.instance = null;
  }

  // ── Registration ──────────────────────────────────────────

  /**
   * Register a channel with its info and configuration.
   * If the channel is already registered, this overwrites both info and config.
   *
   * @param info - Channel metadata
   * @param config - Channel runtime configuration
   */
  registerChannel(info: ChannelInfo, config: ChannelConfig): void {
    if (info.id !== config.channelId) {
      throw new Error(
        `[ChannelRegistry] ChannelInfo.id ("${info.id}") must match ` +
        `ChannelConfig.channelId ("${config.channelId}")`
      );
    }
    this.channels.set(info.id, { ...info });
    this.configs.set(config.channelId, { ...config });
  }

  /**
   * Update the configuration for an existing channel.
   * Throws if the channel is not registered.
   *
   * @param channelId - The channel to update
   * @param updates - Partial config updates to merge
   */
  updateConfig(channelId: ChannelId, updates: Partial<ChannelConfig>): void {
    const existing = this.configs.get(channelId);
    if (!existing) {
      throw new Error(`[ChannelRegistry] Channel "${channelId}" is not registered`);
    }
    this.configs.set(channelId, {
      ...existing,
      ...updates,
      channelId, // Ensure channelId cannot be changed
    });
  }

  // ── Lookups ───────────────────────────────────────────────

  /**
   * Get the ChannelInfo for a channel.
   *
   * @param id - Channel identifier
   * @returns ChannelInfo or null if not registered
   */
  getChannel(id: ChannelId): ChannelInfo | null {
    return this.channels.get(id) ?? null;
  }

  /**
   * Get the ChannelConfig for a channel.
   *
   * @param id - Channel identifier
   * @returns ChannelConfig or null if not registered
   */
  getConfig(id: ChannelId): ChannelConfig | null {
    return this.configs.get(id) ?? null;
  }

  /**
   * Get all registered channels.
   *
   * @returns Array of all ChannelInfo objects
   */
  getAllChannels(): ChannelInfo[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get only enabled channels.
   * A channel is considered enabled if its config has `enabled: true`.
   *
   * @returns Array of ChannelInfo for enabled channels
   */
  getEnabledChannels(): ChannelInfo[] {
    return Array.from(this.channels.values()).filter(
      (info) => this.configs.get(info.id)?.enabled === true
    );
  }

  /**
   * Get channels that support delivery (outbound messages).
   *
   * @returns Array of ChannelInfo for delivery-capable channels
   */
  getDeliveryChannels(): ChannelInfo[] {
    return Array.from(this.channels.values()).filter(
      (info) => info.deliveryEnabled && this.configs.get(info.id)?.enabled === true
    );
  }

  /**
   * Get channels that support webhook verification.
   *
   * @returns Array of ChannelInfo for channels with verification support
   */
  getWebhookChannels(): ChannelInfo[] {
    return Array.from(this.channels.values()).filter(
      (info) => info.verificationSupported
    );
  }

  // ── Permission Checks ─────────────────────────────────────

  /**
   * Determine whether a specific tool is allowed on a given channel.
   *
   * Decision logic (evaluated in order):
   *  1. If the channel is not registered → denied
   *  2. If the channel is disabled → denied
   *  3. If the tool is in the blocked tools list → denied
   *  4. If the tool's category is in the allowed categories → allowed
   *  5. If the tool name itself is in any allowed category → allowed
   *  6. Otherwise → denied (deny-by-default)
   *
   * @param channelId - The channel to check
   * @param toolName - The tool name (e.g., 'web_search', 'email_send')
   * @param toolCategory - The tool's primary category (e.g., 'research')
   * @returns Whether the tool is allowed on this channel
   */
  isToolAllowedInChannel(
    channelId: ChannelId,
    toolName: string,
    toolCategory: string,
  ): boolean {
    const config = this.configs.get(channelId);

    // Step 1: Channel must be registered
    if (!config) return false;

    // Step 2: Channel must be enabled
    if (!config.enabled) return false;

    // Step 3: Check blocked tools list (explicit deny)
    if (config.blockedTools.includes(toolName)) return false;

    // Step 4: Check if the tool's category is allowed
    if (config.allowedToolCategories.includes(toolCategory)) return true;

    // Step 5: Check if the tool name exists in any allowed category's tool set
    for (const allowedCategory of config.allowedToolCategories) {
      const categoryTools = TOOL_CATEGORIES[allowedCategory];
      if (categoryTools && categoryTools.has(toolName)) return true;
    }

    // Step 6: Deny by default
    return false;
  }

  /**
   * Get all tools allowed on a given channel.
   * Useful for UI display and debugging.
   *
   * @param channelId - The channel to check
   * @returns Set of allowed tool names
   */
  getAllowedTools(channelId: ChannelId): Set<string> {
    const config = this.configs.get(channelId);
    if (!config || !config.enabled) return new Set();

    const blockedSet = new Set(config.blockedTools);
    const allowedTools = new Set<string>();

    for (const allowedCategory of config.allowedToolCategories) {
      const categoryTools = TOOL_CATEGORIES[allowedCategory];
      if (categoryTools) {
        for (const tool of Array.from(categoryTools)) {
          if (!blockedSet.has(tool)) {
            allowedTools.add(tool);
          }
        }
      }
    }

    return allowedTools;
  }

  // ── Utility ───────────────────────────────────────────────

  /**
   * Check if a channel is registered and enabled.
   */
  isChannelEnabled(channelId: ChannelId): boolean {
    return this.configs.get(channelId)?.enabled === true;
  }

  /**
   * Get the trust level for a channel.
   * Returns 'unknown' for unregistered channels.
   */
  getTrustLevel(channelId: ChannelId): 'guardian' | 'trusted' | 'unknown' {
    return this.configs.get(channelId)?.trustLevel ?? 'unknown';
  }

  /**
   * Get the rate limit (requests per minute) for a channel.
   * Returns 0 for unregistered channels (effectively blocked).
   */
  getRateLimit(channelId: ChannelId): number {
    return this.configs.get(channelId)?.rateLimitPerMinute ?? 0;
  }

  /**
   * Get the total number of registered channels.
   */
  get size(): number {
    return this.channels.size;
  }
}
