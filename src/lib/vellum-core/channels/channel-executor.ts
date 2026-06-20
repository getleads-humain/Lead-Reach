/**
 * Vellum Core — Unified Channel Executor
 *
 * The central execution engine for the Enhanced Multi-Channel Communication System.
 * Routes actions to the appropriate handler based on channel, enforces permissions
 * and rate limits, and provides consistent error handling with fallbacks.
 *
 * Architecture:
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  executeOnChannel(channelId, action, input)                     │
 *   │   ├── 1. Permission check via ChannelRegistry                   │
 *   │   ├── 2. Rate limit check via in-memory bucket                  │
 *   │   ├── 3. Route to handler:                                      │
 *   │   │   ├── Agent-Reach Bridge (web, exa, linkedin, twitter,      │
 *   │   │   │   reddit, github, youtube, rss)                         │
 *   │   │   └── New Channel Handlers (slack, telegram, whatsapp,      │
 *   │   │       email, phone, sms, discord)                           │
 *   │   ├── 4. Error handling with fallback                           │
 *   │   └── 5. Return ChannelResult                                   │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Integration:
 *   - Agent-Reach Bridge: delegates to functions in agent-reach-bridge.ts
 *     (webRead, exaSearch, linkedInGetProfile, etc.)
 *   - Channel Registry: uses isToolAllowedInChannel for permission checks
 *   - Rate Limiter: per-channel token bucket (separate from global limiter)
 */

import type { ChannelId, ChannelResult } from './types';
import { ChannelRegistry } from './channel-registry';

// ── Agent-Reach Bridge Integration ───────────────────────────
//
// We import specific functions from the existing agent-reach-bridge
// to delegate research channel operations. These are the actual
// runtime execution functions that call Jina Reader, Exa, gh CLI, etc.

import {
  webRead,
  exaSearch,
  githubSearchRepos,
  githubViewRepo,
  redditSearch,
  redditSubreddit,
  youtubeGetInfo,
  youtubeGetSubtitles,
  youtubeSearch,
  linkedInGetProfile,
  linkedInSearchPeople,
  linkedInSearchCompanies,
  twitterSearch,
  twitterReadTweet,
  rssRead,
} from '@/lib/agent-reach-bridge';

// ============================================================
// Per-Channel Rate Limiting
// ============================================================

/**
 * In-memory token bucket for per-channel rate limiting.
 * Separate from the global rate-limiter.ts — this tracks execution
 * counts per channel to enforce ChannelConfig.rateLimitPerMinute.
 */
interface RateLimitBucket {
  /** Number of requests in the current window */
  count: number;
  /** Start of the current window (epoch ms) */
  windowStart: number;
}

const rateLimitBuckets = new Map<ChannelId, RateLimitBucket>();

/**
 * Check and consume a rate limit slot for a channel.
 * Returns true if the request is allowed, false if rate-limited.
 *
 * Uses a fixed-window algorithm: count requests within a 60-second
 * window and reset the window when it expires.
 */
function checkChannelRateLimit(channelId: ChannelId): boolean {
  const registry = ChannelRegistry.getInstance();
  const limit = registry.getRateLimit(channelId);
  if (limit <= 0) return false; // Channel not configured or blocked

  const now = Date.now();
  const WINDOW_MS = 60_000; // 1 minute

  let bucket = rateLimitBuckets.get(channelId);
  if (!bucket || (now - bucket.windowStart) >= WINDOW_MS) {
    // Start a new window
    bucket = { count: 0, windowStart: now };
    rateLimitBuckets.set(channelId, bucket);
  }

  if (bucket.count >= limit) {
    return false; // Rate limited
  }

  bucket.count++;
  return true;
}

/**
 * Get the current rate limit status for a channel.
 * Useful for UI display and debugging.
 */
export function getChannelRateLimitStatus(channelId: ChannelId): {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
} {
  const registry = ChannelRegistry.getInstance();
  const limit = registry.getRateLimit(channelId);
  const now = Date.now();
  const WINDOW_MS = 60_000;
  const bucket = rateLimitBuckets.get(channelId);

  if (!bucket || limit <= 0) {
    return { allowed: limit > 0, remaining: limit, limit, resetMs: now + WINDOW_MS };
  }

  const elapsed = now - bucket.windowStart;
  if (elapsed >= WINDOW_MS) {
    return { allowed: true, remaining: limit, limit, resetMs: now + WINDOW_MS };
  }

  return {
    allowed: bucket.count < limit,
    remaining: Math.max(0, limit - bucket.count),
    limit,
    resetMs: bucket.windowStart + WINDOW_MS,
  };
}

// ============================================================
// Helper Utilities
// ============================================================

/** Generate a unique ID for execution tracking */
function generateId(): string {
  return `ch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Create a successful ChannelResult */
function successResult(
  channelId: ChannelId,
  data: unknown,
  metadata?: Record<string, unknown>,
): ChannelResult {
  return {
    success: true,
    channelId,
    data,
    metadata: {
      executionId: generateId(),
      timestamp: Date.now(),
      ...metadata,
    },
  };
}

/** Create a failed ChannelResult */
function errorResult(
  channelId: ChannelId,
  error: string,
  metadata?: Record<string, unknown>,
): ChannelResult {
  return {
    success: false,
    channelId,
    error,
    metadata: {
      executionId: generateId(),
      timestamp: Date.now(),
      ...metadata,
    },
  };
}

// ============================================================
// Agent-Reach Bridge Handlers
// ============================================================

/**
 * Handler for the 'web' channel.
 * Delegates to agent-reach-bridge.ts webRead().
 *
 * Supported actions:
 *   - 'read': Read a webpage via Jina Reader
 *   - 'read_multiple': Read multiple web pages in parallel
 */
async function handleWebChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'web';

  try {
    switch (action) {
      case 'read': {
        const url = input.url as string;
        const format = (input.format as 'markdown' | 'text') || 'markdown';
        if (!url || typeof url !== 'string') {
          return errorResult(channelId, 'Missing or invalid "url" parameter');
        }
        const result = await webRead(url, format);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'Web read failed', { source: result.source });
      }

      case 'read_multiple': {
        const urls = input.urls as string[];
        if (!Array.isArray(urls) || urls.length === 0) {
          return errorResult(channelId, 'Missing or invalid "urls" parameter');
        }
        const results = await Promise.all(urls.map((url: string) => webRead(url)));
        return successResult(channelId, results.map((r: { success: boolean; data: unknown }) => r.data), {
          source: 'Jina Reader (parallel)',
          totalUrls: urls.length,
          successCount: results.filter((r: { success: boolean }) => r.success).length,
        });
      }

      default:
        return errorResult(channelId, `Unknown web action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Web channel error: ${msg}`);
  }
}

/**
 * Handler for the 'exa' channel.
 * Delegates to agent-reach-bridge.ts exaSearch().
 *
 * Supported actions:
 *   - 'search': AI-powered semantic web search
 */
async function handleExaChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'exa';

  try {
    switch (action) {
      case 'search': {
        const query = input.query as string;
        const numResults = (input.numResults as number) || 25;
        if (!query || typeof query !== 'string') {
          return errorResult(channelId, 'Missing or invalid "query" parameter');
        }
        const result = await exaSearch(query, numResults);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'Exa search failed', { source: result.source });
      }

      default:
        return errorResult(channelId, `Unknown exa action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Exa channel error: ${msg}`);
  }
}

/**
 * Handler for the 'linkedin' channel.
 * Delegates to agent-reach-bridge.ts LinkedIn functions.
 *
 * Supported actions:
 *   - 'get_profile': Get a LinkedIn profile by URL
 *   - 'search_people': Search for LinkedIn profiles
 *   - 'search_companies': Search for LinkedIn companies
 */
async function handleLinkedInChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'linkedin';

  try {
    switch (action) {
      case 'get_profile': {
        const url = input.url as string;
        if (!url || typeof url !== 'string') {
          return errorResult(channelId, 'Missing or invalid "url" parameter');
        }
        const result = await linkedInGetProfile(url);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'LinkedIn profile fetch failed');
      }

      case 'search_people': {
        const query = input.query as string;
        const limit = (input.limit as number) || 25;
        if (!query || typeof query !== 'string') {
          return errorResult(channelId, 'Missing or invalid "query" parameter');
        }
        const result = await linkedInSearchPeople(query, limit);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'LinkedIn people search failed');
      }

      case 'search_companies': {
        const query = input.query as string;
        const limit = (input.limit as number) || 25;
        if (!query || typeof query !== 'string') {
          return errorResult(channelId, 'Missing or invalid "query" parameter');
        }
        const result = await linkedInSearchCompanies(query, limit);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'LinkedIn company search failed');
      }

      default:
        return errorResult(channelId, `Unknown linkedin action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `LinkedIn channel error: ${msg}`);
  }
}

/**
 * Handler for the 'twitter' channel.
 * Delegates to agent-reach-bridge.ts Twitter functions.
 *
 * Supported actions:
 *   - 'search': Search tweets
 *   - 'read_tweet': Read a specific tweet
 */
async function handleTwitterChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'twitter';

  try {
    switch (action) {
      case 'search': {
        const query = input.query as string;
        const limit = (input.limit as number) || 25;
        if (!query || typeof query !== 'string') {
          return errorResult(channelId, 'Missing or invalid "query" parameter');
        }
        const result = await twitterSearch(query, limit);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'Twitter search failed');
      }

      case 'read_tweet': {
        const tweetUrl = input.tweetUrl as string;
        if (!tweetUrl || typeof tweetUrl !== 'string') {
          return errorResult(channelId, 'Missing or invalid "tweetUrl" parameter');
        }
        const result = await twitterReadTweet(tweetUrl);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'Tweet read failed');
      }

      default:
        return errorResult(channelId, `Unknown twitter action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Twitter channel error: ${msg}`);
  }
}

/**
 * Handler for the 'reddit' channel.
 * Delegates to agent-reach-bridge.ts Reddit functions.
 *
 * Supported actions:
 *   - 'search': Search Reddit posts
 *   - 'subreddit': Get hot posts from a subreddit
 */
async function handleRedditChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'reddit';

  try {
    switch (action) {
      case 'search': {
        const query = input.query as string;
        const limit = (input.limit as number) || 25;
        if (!query || typeof query !== 'string') {
          return errorResult(channelId, 'Missing or invalid "query" parameter');
        }
        const result = await redditSearch(query, limit);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'Reddit search failed');
      }

      case 'subreddit': {
        const subreddit = input.subreddit as string;
        const limit = (input.limit as number) || 25;
        if (!subreddit || typeof subreddit !== 'string') {
          return errorResult(channelId, 'Missing or invalid "subreddit" parameter');
        }
        const result = await redditSubreddit(subreddit, limit);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'Reddit subreddit fetch failed');
      }

      default:
        return errorResult(channelId, `Unknown reddit action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Reddit channel error: ${msg}`);
  }
}

/**
 * Handler for the 'github' channel.
 * Delegates to agent-reach-bridge.ts GitHub functions.
 *
 * Supported actions:
 *   - 'search_repos': Search GitHub repositories
 *   - 'view_repo': View a repository's details
 */
async function handleGithubChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'github';

  try {
    switch (action) {
      case 'search_repos': {
        const query = input.query as string;
        const limit = (input.limit as number) || 25;
        if (!query || typeof query !== 'string') {
          return errorResult(channelId, 'Missing or invalid "query" parameter');
        }
        const result = await githubSearchRepos(query, limit);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'GitHub search failed');
      }

      case 'view_repo': {
        const ownerRepo = input.ownerRepo as string;
        if (!ownerRepo || typeof ownerRepo !== 'string') {
          return errorResult(channelId, 'Missing or invalid "ownerRepo" parameter');
        }
        const result = await githubViewRepo(ownerRepo);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'GitHub repo view failed');
      }

      default:
        return errorResult(channelId, `Unknown github action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `GitHub channel error: ${msg}`);
  }
}

/**
 * Handler for the 'youtube' channel.
 * Delegates to agent-reach-bridge.ts YouTube functions.
 *
 * Supported actions:
 *   - 'get_info': Get video metadata
 *   - 'get_subtitles': Get video subtitles/transcript
 *   - 'search': Search YouTube videos
 */
async function handleYoutubeChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'youtube';

  try {
    switch (action) {
      case 'get_info': {
        const url = input.url as string;
        if (!url || typeof url !== 'string') {
          return errorResult(channelId, 'Missing or invalid "url" parameter');
        }
        const result = await youtubeGetInfo(url);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'YouTube info fetch failed');
      }

      case 'get_subtitles': {
        const url = input.url as string;
        const lang = (input.lang as string) || 'en';
        if (!url || typeof url !== 'string') {
          return errorResult(channelId, 'Missing or invalid "url" parameter');
        }
        const result = await youtubeGetSubtitles(url, lang);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'YouTube subtitles fetch failed');
      }

      case 'search': {
        const query = input.query as string;
        const limit = (input.limit as number) || 25;
        if (!query || typeof query !== 'string') {
          return errorResult(channelId, 'Missing or invalid "query" parameter');
        }
        const result = await youtubeSearch(query, limit);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'YouTube search failed');
      }

      default:
        return errorResult(channelId, `Unknown youtube action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `YouTube channel error: ${msg}`);
  }
}

/**
 * Handler for the 'rss' channel.
 * Delegates to agent-reach-bridge.ts rssRead().
 *
 * Supported actions:
 *   - 'read': Parse and read an RSS/Atom feed
 */
async function handleRssChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'rss';

  try {
    switch (action) {
      case 'read': {
        const feedUrl = input.feedUrl as string;
        const limit = (input.limit as number) || 25;
        if (!feedUrl || typeof feedUrl !== 'string') {
          return errorResult(channelId, 'Missing or invalid "feedUrl" parameter');
        }
        const result = await rssRead(feedUrl, limit);
        if (result.success) {
          return successResult(channelId, result.data, { source: result.source });
        }
        return errorResult(channelId, result.error || 'RSS feed read failed');
      }

      default:
        return errorResult(channelId, `Unknown rss action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `RSS channel error: ${msg}`);
  }
}

// ============================================================
// New Channel Handlers (Communication Channels)
// ============================================================

/**
 * Handler for the 'slack' channel.
 * Sends messages to Slack workspaces via the Bot API.
 *
 * Supported actions:
 *   - 'send_message': Send a message to a Slack channel or user
 *   - 'send_ephemeral': Send an ephemeral message visible only to one user
 *   - 'update_message': Update an existing message
 *   - 'list_channels': List public channels in the workspace
 *
 * Configuration required:
 *   - SLACK_BOT_TOKEN: Bot OAuth token (xoxb-...)
 *   - SLACK_SIGNING_SECRET: For webhook verification
 */
async function handleSlackChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'slack';
  const botToken = process.env.SLACK_BOT_TOKEN;

  try {
    switch (action) {
      case 'send_message': {
        const channel = input.channel as string;
        const text = input.text as string;
        const threadTs = input.thread_ts as string | undefined;

        if (!channel || typeof channel !== 'string') {
          return errorResult(channelId, 'Missing or invalid "channel" parameter');
        }
        if (!text || typeof text !== 'string') {
          return errorResult(channelId, 'Missing or invalid "text" parameter');
        }

        if (!botToken) {
          return errorResult(channelId, 'SLACK_BOT_TOKEN not configured');
        }

        const payload: Record<string, unknown> = {
          channel,
          text: text.slice(0, 40000), // Slack message limit
          mrkdwn: true,
        };
        if (threadTs) {
          payload.thread_ts = threadTs;
        }

        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });

        const data = await response.json() as Record<string, unknown>;
        if (data.ok) {
          return successResult(channelId, data, { source: 'Slack API' });
        }
        return errorResult(channelId, `Slack API error: ${data.error as string || 'Unknown'}`, { slackResponse: data });
      }

      case 'send_ephemeral': {
        const channel = input.channel as string;
        const user = input.user as string;
        const text = input.text as string;

        if (!channel || !user || !text) {
          return errorResult(channelId, 'Missing required parameters: channel, user, text');
        }
        if (!botToken) {
          return errorResult(channelId, 'SLACK_BOT_TOKEN not configured');
        }

        const response = await fetch('https://slack.com/api/chat.postEphemeral', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channel, user, text: text.slice(0, 40000) }),
          signal: AbortSignal.timeout(10000),
        });

        const data = await response.json() as Record<string, unknown>;
        if (data.ok) {
          return successResult(channelId, data, { source: 'Slack API' });
        }
        return errorResult(channelId, `Slack API error: ${data.error as string || 'Unknown'}`);
      }

      case 'update_message': {
        const channel = input.channel as string;
        const ts = input.ts as string;
        const text = input.text as string;

        if (!channel || !ts || !text) {
          return errorResult(channelId, 'Missing required parameters: channel, ts, text');
        }
        if (!botToken) {
          return errorResult(channelId, 'SLACK_BOT_TOKEN not configured');
        }

        const response = await fetch('https://slack.com/api/chat.update', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channel, ts, text: text.slice(0, 40000) }),
          signal: AbortSignal.timeout(10000),
        });

        const data = await response.json() as Record<string, unknown>;
        if (data.ok) {
          return successResult(channelId, data, { source: 'Slack API' });
        }
        return errorResult(channelId, `Slack API error: ${data.error as string || 'Unknown'}`);
      }

      case 'list_channels': {
        if (!botToken) {
          return errorResult(channelId, 'SLACK_BOT_TOKEN not configured');
        }

        const response = await fetch('https://slack.com/api/conversations.list?types=public_channel&limit=100', {
          headers: { 'Authorization': `Bearer ${botToken}` },
          signal: AbortSignal.timeout(10000),
        });

        const data = await response.json() as Record<string, unknown>;
        if (data.ok) {
          return successResult(channelId, data, { source: 'Slack API' });
        }
        return errorResult(channelId, `Slack API error: ${data.error as string || 'Unknown'}`);
      }

      default:
        return errorResult(channelId, `Unknown slack action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Slack channel error: ${msg}`);
  }
}

/**
 * Handler for the 'telegram' channel.
 * Sends messages via the Telegram Bot API.
 *
 * Supported actions:
 *   - 'send_message': Send a text message
 *   - 'send_markdown': Send a Markdown-formatted message
 *
 * Configuration required:
 *   - TELEGRAM_BOT_TOKEN: Bot API token (from @BotFather)
 */
async function handleTelegramChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'telegram';
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  try {
    if (!botToken) {
      return errorResult(channelId, 'TELEGRAM_BOT_TOKEN not configured');
    }

    const apiUrl = `https://api.telegram.org/bot${botToken}`;

    switch (action) {
      case 'send_message':
      case 'send_markdown': {
        const chatId = input.chat_id as string | number;
        const text = input.text as string;

        if (!chatId || !text) {
          return errorResult(channelId, 'Missing required parameters: chat_id, text');
        }

        const payload: Record<string, unknown> = {
          chat_id: chatId,
          text: text.slice(0, 4096), // Telegram message limit
          parse_mode: action === 'send_markdown' ? 'MarkdownV2' : undefined,
        };
        // For reply threading
        if (input.reply_to_message_id) {
          payload.reply_to_message_id = input.reply_to_message_id;
        }

        const response = await fetch(`${apiUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });

        const data = await response.json() as Record<string, unknown>;
        if (data.ok) {
          return successResult(channelId, data, { source: 'Telegram Bot API' });
        }
        return errorResult(channelId, `Telegram API error: ${data.description as string || 'Unknown'}`);
      }

      default:
        return errorResult(channelId, `Unknown telegram action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Telegram channel error: ${msg}`);
  }
}

/**
 * Handler for the 'whatsapp' channel.
 * Sends messages via the WhatsApp Business API (Twilio or Meta Cloud API).
 *
 * Supported actions:
 *   - 'send_message': Send a text message
 *   - 'send_template': Send a template message
 *
 * Configuration required (Twilio):
 *   - TWILIO_ACCOUNT_SID: Twilio Account SID
 *   - TWILIO_AUTH_TOKEN: Twilio Auth Token
 *   - TWILIO_WHATSAPP_NUMBER: Twilio WhatsApp-enabled number
 */
async function handleWhatsAppChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'whatsapp';
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  try {
    switch (action) {
      case 'send_message': {
        const to = input.to as string;
        const body = input.body as string;

        if (!to || !body) {
          return errorResult(channelId, 'Missing required parameters: to, body');
        }
        if (!accountSid || !authToken || !fromNumber) {
          return errorResult(channelId, 'Twilio WhatsApp credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER)');
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams({
          From: `whatsapp:${fromNumber}`,
          To: `whatsapp:${to}`,
          Body: body.slice(0, 1600), // WhatsApp text limit
        });

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Twilio WhatsApp API' });
        }
        const errorData = await response.json() as Record<string, unknown>;
        return errorResult(channelId, `Twilio API error: ${errorData.message as string || response.statusText}`);
      }

      case 'send_template': {
        const to = input.to as string;
        const templateName = input.template_name as string;
        const language = (input.language as string) || 'en';

        if (!to || !templateName) {
          return errorResult(channelId, 'Missing required parameters: to, template_name');
        }
        if (!accountSid || !authToken || !fromNumber) {
          return errorResult(channelId, 'Twilio WhatsApp credentials not configured');
        }

        // Template messages use the Twilio Content API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams({
          From: `whatsapp:${fromNumber}`,
          To: `whatsapp:${to}`,
          ContentSid: templateName,
          ContentVariables: JSON.stringify(input.parameters || {}),
          Language: language,
        });

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Twilio WhatsApp Template API' });
        }
        const errorData = await response.json() as Record<string, unknown>;
        return errorResult(channelId, `Twilio template API error: ${errorData.message as string || response.statusText}`);
      }

      default:
        return errorResult(channelId, `Unknown whatsapp action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `WhatsApp channel error: ${msg}`);
  }
}

/**
 * Handler for the 'email' channel.
 * Sends emails via an SMTP relay API (e.g., Resend, SendGrid, Postmark).
 *
 * Supported actions:
 *   - 'send': Send an email
 *   - 'send_template': Send a templated email
 *
 * Configuration required:
 *   - EMAIL_API_KEY: API key for the email service
 *   - EMAIL_FROM_ADDRESS: Default sender address
 *   - EMAIL_API_ENDPOINT: API endpoint (defaults to Resend)
 */
async function handleEmailChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'email';
  const apiKey = process.env.EMAIL_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@leadreach.ai';
  const apiEndpoint = process.env.EMAIL_API_ENDPOINT || 'https://api.resend.com/emails';

  try {
    switch (action) {
      case 'send': {
        const to = input.to as string | string[];
        const subject = input.subject as string;
        const html = input.html as string;
        const text = input.text as string | undefined;

        if (!to || !subject || (!html && !text)) {
          return errorResult(channelId, 'Missing required parameters: to, subject, and html or text');
        }
        if (!apiKey) {
          return errorResult(channelId, 'EMAIL_API_KEY not configured');
        }

        const payload: Record<string, unknown> = {
          from: input.from as string || fromAddress,
          to: Array.isArray(to) ? to : [to],
          subject: subject.slice(0, 998), // RFC 5321 subject limit
        };
        if (html) payload.html = html;
        if (text) payload.text = text;
        if (input.reply_to) payload.reply_to = input.reply_to;
        if (input.cc) payload.cc = input.cc;
        if (input.bcc) payload.bcc = input.bcc;

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Email API (Resend)' });
        }
        const errorData = await response.json() as Record<string, unknown>;
        return errorResult(channelId, `Email API error: ${errorData.message as string || response.statusText}`);
      }

      case 'send_template': {
        const to = input.to as string | string[];
        const templateId = input.template_id as string;
        const templateData = input.template_data as Record<string, unknown>;

        if (!to || !templateId) {
          return errorResult(channelId, 'Missing required parameters: to, template_id');
        }
        if (!apiKey) {
          return errorResult(channelId, 'EMAIL_API_KEY not configured');
        }

        const payload: Record<string, unknown> = {
          from: input.from as string || fromAddress,
          to: Array.isArray(to) ? to : [to],
          template_id: templateId,
          template_data: templateData || {},
        };

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Email Template API' });
        }
        const errorData = await response.json() as Record<string, unknown>;
        return errorResult(channelId, `Email template API error: ${errorData.message as string || response.statusText}`);
      }

      default:
        return errorResult(channelId, `Unknown email action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Email channel error: ${msg}`);
  }
}

/**
 * Handler for the 'phone' channel.
 * Initiates voice calls via Twilio.
 *
 * Supported actions:
 *   - 'call': Initiate a voice call
 *   - 'call_status': Get the status of a call
 *
 * Configuration required:
 *   - TWILIO_ACCOUNT_SID: Twilio Account SID
 *   - TWILIO_AUTH_TOKEN: Twilio Auth Token
 *   - TWILIO_PHONE_NUMBER: Twilio voice-enabled number
 */
async function handlePhoneChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'phone';
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  try {
    switch (action) {
      case 'call': {
        const to = input.to as string;
        const twimlUrl = input.twiml_url as string;
        const twiml = input.twiml as string;

        if (!to) {
          return errorResult(channelId, 'Missing required parameter: to');
        }
        if (!twimlUrl && !twiml) {
          return errorResult(channelId, 'Missing required parameter: twiml_url or twiml');
        }
        if (!accountSid || !authToken || !fromNumber) {
          return errorResult(channelId, 'Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
        const params = new URLSearchParams({
          From: fromNumber,
          To: to,
        });
        if (twimlUrl) {
          params.set('Url', twimlUrl);
        } else {
          params.set('Twiml', twiml as string);
        }

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Twilio Voice API' });
        }
        const errorData = await response.json() as Record<string, unknown>;
        return errorResult(channelId, `Twilio Voice API error: ${errorData.message as string || response.statusText}`);
      }

      case 'call_status': {
        const callSid = input.call_sid as string;
        if (!callSid) {
          return errorResult(channelId, 'Missing required parameter: call_sid');
        }
        if (!accountSid || !authToken) {
          return errorResult(channelId, 'Twilio credentials not configured');
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;
        const response = await fetch(twilioUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Twilio Voice API' });
        }
        return errorResult(channelId, `Failed to get call status: ${response.statusText}`);
      }

      default:
        return errorResult(channelId, `Unknown phone action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Phone channel error: ${msg}`);
  }
}

/**
 * Handler for the 'sms' channel.
 * Sends SMS messages via Twilio or AWS SNS.
 *
 * Supported actions:
 *   - 'send': Send an SMS message
 *   - 'send_bulk': Send SMS to multiple recipients (sequential)
 *
 * Configuration required:
 *   - TWILIO_ACCOUNT_SID: Twilio Account SID
 *   - TWILIO_AUTH_TOKEN: Twilio Auth Token
 *   - TWILIO_PHONE_NUMBER: Twilio SMS-enabled number
 */
async function handleSmsChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'sms';
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  try {
    switch (action) {
      case 'send': {
        const to = input.to as string;
        const body = input.body as string;

        if (!to || !body) {
          return errorResult(channelId, 'Missing required parameters: to, body');
        }
        if (!accountSid || !authToken || !fromNumber) {
          return errorResult(channelId, 'Twilio SMS credentials not configured');
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams({
          From: fromNumber,
          To: to,
          Body: body.slice(0, 1600), // SMS segment limit (10 segments)
        });

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Twilio SMS API' });
        }
        const errorData = await response.json() as Record<string, unknown>;
        return errorResult(channelId, `Twilio SMS API error: ${errorData.message as string || response.statusText}`);
      }

      case 'send_bulk': {
        const recipients = input.recipients as Array<{ to: string; body: string }>;
        if (!Array.isArray(recipients) || recipients.length === 0) {
          return errorResult(channelId, 'Missing or invalid "recipients" parameter');
        }
        if (!accountSid || !authToken || !fromNumber) {
          return errorResult(channelId, 'Twilio SMS credentials not configured');
        }

        // Send sequentially to respect rate limits
        const results: Array<{ to: string; success: boolean; sid?: string; error?: string }> = [];
        for (const recipient of recipients.slice(0, 50)) { // Cap at 50 recipients
          try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            const params = new URLSearchParams({
              From: fromNumber,
              To: recipient.to,
              Body: recipient.body.slice(0, 1600),
            });

            const response = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
              signal: AbortSignal.timeout(15000),
            });

            if (response.ok) {
              const data = await response.json() as Record<string, unknown>;
              results.push({ to: recipient.to, success: true, sid: data.sid as string });
            } else {
              const errorData = await response.json() as Record<string, unknown>;
              results.push({ to: recipient.to, success: false, error: errorData.message as string });
            }
          } catch (err) {
            results.push({ to: recipient.to, success: false, error: err instanceof Error ? err.message : 'Unknown' });
          }

          // Rate limit: 1 message per second
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const successCount = results.filter((r) => r.success).length;
        return successResult(channelId, results, {
          source: 'Twilio SMS Bulk API',
          totalRecipients: recipients.length,
          successCount,
          failureCount: results.length - successCount,
        });
      }

      default:
        return errorResult(channelId, `Unknown sms action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `SMS channel error: ${msg}`);
  }
}

/**
 * Handler for the 'discord' channel.
 * Sends messages via the Discord Bot API.
 *
 * Supported actions:
 *   - 'send_message': Send a message to a Discord channel
 *   - 'send_embed': Send a rich embed message
 *   - 'get_channel': Get channel info
 *
 * Configuration required:
 *   - DISCORD_BOT_TOKEN: Bot authentication token
 */
async function handleDiscordChannel(
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const channelId: ChannelId = 'discord';
  const botToken = process.env.DISCORD_BOT_TOKEN;

  try {
    if (!botToken) {
      return errorResult(channelId, 'DISCORD_BOT_TOKEN not configured');
    }

    const baseUrl = 'https://discord.com/api/v10';

    switch (action) {
      case 'send_message': {
        const channel = input.channel_id as string;
        const content = input.content as string;

        if (!channel || !content) {
          return errorResult(channelId, 'Missing required parameters: channel_id, content');
        }

        const response = await fetch(`${baseUrl}/channels/${channel}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: content.slice(0, 2000) }), // Discord message limit
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Discord Bot API' });
        }
        const errorData = await response.json() as Record<string, unknown>;
        return errorResult(channelId, `Discord API error: ${errorData.message as string || 'Unknown'}`);
      }

      case 'send_embed': {
        const channel = input.channel_id as string;
        const embed = input.embed as Record<string, unknown>;

        if (!channel || !embed) {
          return errorResult(channelId, 'Missing required parameters: channel_id, embed');
        }

        const response = await fetch(`${baseUrl}/channels/${channel}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ embeds: [embed] }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Discord Bot API (embed)' });
        }
        const errorData = await response.json() as Record<string, unknown>;
        return errorResult(channelId, `Discord embed API error: ${errorData.message as string || 'Unknown'}`);
      }

      case 'get_channel': {
        const channel = input.channel_id as string;
        if (!channel) {
          return errorResult(channelId, 'Missing required parameter: channel_id');
        }

        const response = await fetch(`${baseUrl}/channels/${channel}`, {
          headers: { 'Authorization': `Bot ${botToken}` },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json() as Record<string, unknown>;
          return successResult(channelId, data, { source: 'Discord Bot API' });
        }
        return errorResult(channelId, `Discord API error: ${response.statusText}`);
      }

      default:
        return errorResult(channelId, `Unknown discord action: "${action}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(channelId, `Discord channel error: ${msg}`);
  }
}

// ============================================================
// Channel → Handler Mapping
// ============================================================

/**
 * Map of channel IDs to their handler functions.
 * Each handler is a pure async function that takes an action and input,
 * and returns a ChannelResult.
 */
const CHANNEL_HANDLERS: Record<ChannelId, (action: string, input: Record<string, unknown>) => Promise<ChannelResult>> = {
  web: handleWebChannel,
  exa: handleExaChannel,
  linkedin: handleLinkedInChannel,
  twitter: handleTwitterChannel,
  reddit: handleRedditChannel,
  github: handleGithubChannel,
  youtube: handleYoutubeChannel,
  rss: handleRssChannel,
  slack: handleSlackChannel,
  telegram: handleTelegramChannel,
  whatsapp: handleWhatsAppChannel,
  email: handleEmailChannel,
  phone: handlePhoneChannel,
  sms: handleSmsChannel,
  discord: handleDiscordChannel,
};

// ============================================================
// Main Executor Function
// ============================================================

/**
 * Execute an action on a specific channel.
 *
 * This is the primary entry point for the channel execution system.
 * It performs the following steps in order:
 *
 *  1. **Channel validation** — ensure the channel is registered
 *  2. **Permission check** — verify the action is allowed on this channel
 *  3. **Rate limit check** — enforce per-channel rate limits
 *  4. **Handler dispatch** — route to the appropriate channel handler
 *  5. **Error handling** — catch and wrap any unhandled errors
 *
 * @param channelId - The target channel
 * @param action - The action to execute (e.g., 'send_message', 'search')
 * @param input - Input parameters for the action
 * @returns ChannelResult with success status and data or error
 *
 * @example
 * ```typescript
 * // Search the web via the Exa channel
 * const result = await executeOnChannel('exa', 'search', {
 *   query: 'B2B SaaS companies',
 *   numResults: 10,
 * });
 *
 * // Send a Slack message
 * const result = await executeOnChannel('slack', 'send_message', {
 *   channel: '#sales-leads',
 *   text: 'New lead qualified: Acme Corp',
 * });
 * ```
 */
export async function executeOnChannel(
  channelId: ChannelId,
  action: string,
  input: Record<string, unknown>,
): Promise<ChannelResult> {
  const registry = ChannelRegistry.getInstance();

  // ── Step 1: Channel validation ─────────────────────────────
  const channelInfo = registry.getChannel(channelId);
  if (!channelInfo) {
    return errorResult(channelId, `Channel "${channelId}" is not registered`);
  }

  const channelConfig = registry.getConfig(channelId);
  if (!channelConfig) {
    return errorResult(channelId, `No configuration found for channel "${channelId}"`);
  }

  // ── Step 2: Permission check ───────────────────────────────
  // Determine the tool category from the action name
  const toolCategory = inferToolCategory(channelId, action);
  const isAllowed = registry.isToolAllowedInChannel(channelId, action, toolCategory);

  if (!isAllowed) {
    return errorResult(channelId, `Action "${action}" is not allowed on channel "${channelId}" (category: ${toolCategory})`, {
      deniedReason: 'permission_check_failed',
      toolCategory,
      trustLevel: channelConfig.trustLevel,
    });
  }

  // ── Step 3: Rate limit check ───────────────────────────────
  if (!checkChannelRateLimit(channelId)) {
    const status = getChannelRateLimitStatus(channelId);
    return errorResult(channelId, `Rate limit exceeded for channel "${channelId}" (${channelConfig.rateLimitPerMinute} req/min)`, {
      deniedReason: 'rate_limit_exceeded',
      rateLimit: status,
    });
  }

  // ── Step 4: Handler dispatch ───────────────────────────────
  const handler = CHANNEL_HANDLERS[channelId];
  if (!handler) {
    return errorResult(channelId, `No handler registered for channel "${channelId}"`);
  }

  try {
    const result = await handler(action, input);
    return result;
  } catch (err) {
    // ── Step 5: Error handling with fallback ──────────────────
    const msg = err instanceof Error ? err.message : 'Unknown error';

    // For research channels, try a web fallback if the primary handler fails
    if (isResearchChannel(channelId) && action !== 'read') {
      console.warn(
        `[ChannelExecutor] Channel "${channelId}" action "${action}" failed: ${msg.slice(0, 200)}. ` +
        `Attempting web fallback...`
      );

      try {
        // Fallback: try to read the relevant URL from the input via web channel
        const fallbackUrl = input.url as string || input.feedUrl as string;
        if (fallbackUrl && typeof fallbackUrl === 'string') {
          const fallbackResult = await webRead(fallbackUrl);
          if (fallbackResult.success) {
            return successResult(channelId, fallbackResult.data, {
              source: 'Jina Reader (fallback)',
              fallbackReason: msg,
              originalChannel: channelId,
            });
          }
        }
      } catch {
        // Fallback also failed — return the original error
      }
    }

    return errorResult(channelId, `Unhandled error in channel "${channelId}": ${msg}`);
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Infer the tool category from the channel ID and action name.
 *
 * This is used by the permission check to determine if an action
 * is allowed on a given channel when no explicit category is provided.
 */
function inferToolCategory(channelId: ChannelId, action: string): string {
  // Research channels → their primary category
  const researchCategories: Partial<Record<ChannelId, string>> = {
    web: 'web',
    exa: 'search',
    linkedin: 'social',
    twitter: 'social',
    reddit: 'social',
    github: 'development',
    youtube: 'media',
    rss: 'monitoring',
  };

  // Communication channels → category based on action
  if (channelId in researchCategories) {
    return researchCategories[channelId] as string || 'research';
  }

  // Communication channel actions
  if (action.startsWith('send_') || action === 'call') {
    return 'communication';
  }
  if (action === 'search' || action === 'read') {
    return 'research';
  }
  if (action.startsWith('list_') || action.startsWith('get_')) {
    return 'read';
  }

  return 'communication'; // Default for comm channels
}

/** Set of research channels that can fall back to web reading on failure. */
const RESEARCH_CHANNELS = new Set<ChannelId>([
  'web', 'exa', 'linkedin', 'twitter', 'reddit', 'github', 'youtube', 'rss',
]);

/**
 * Check if a channel is primarily a research/data channel.
 * Research channels can fall back to web reading on failure.
 */
function isResearchChannel(channelId: ChannelId): boolean {
  return RESEARCH_CHANNELS.has(channelId);
}

/**
 * Get a list of all supported actions for a channel.
 * Useful for UI display and debugging.
 */
export function getSupportedActions(channelId: ChannelId): string[] {
  const actionMap: Record<ChannelId, string[]> = {
    web: ['read', 'read_multiple'],
    exa: ['search'],
    linkedin: ['get_profile', 'search_people', 'search_companies'],
    twitter: ['search', 'read_tweet'],
    reddit: ['search', 'subreddit'],
    github: ['search_repos', 'view_repo'],
    youtube: ['get_info', 'get_subtitles', 'search'],
    rss: ['read'],
    slack: ['send_message', 'send_ephemeral', 'update_message', 'list_channels'],
    telegram: ['send_message', 'send_markdown'],
    whatsapp: ['send_message', 'send_template'],
    email: ['send', 'send_template'],
    phone: ['call', 'call_status'],
    sms: ['send', 'send_bulk'],
    discord: ['send_message', 'send_embed', 'get_channel'],
  };
  return actionMap[channelId] || [];
}
