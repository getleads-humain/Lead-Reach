/**
 * Vellum Core — Webhook Handlers
 *
 * Handles inbound webhook payloads from external communication channels
 * (Slack, Telegram, WhatsApp, Twilio, Email) and normalizes them into
 * the standard ChannelMessage format.
 *
 * Security Features:
 *   - HMAC signature verification for each channel
 *   - Replay attack prevention via timestamp validation
 *   - Payload sanitization before processing
 *   - Channel-specific signature header handling
 *
 * Integration:
 *   - API routes receive raw webhook requests and delegate to these handlers
 *   - The notification-router.ts consumes the standardized ChannelMessage output
 *   - The channel-executor.ts may be called for outbound replies
 *
 * Usage (in an API route):
 * ```typescript
 * import { handleSlackWebhook, verifySlackSignature } from './webhooks';
 *
 * export async function POST(request: Request) {
 *   const body = await request.text();
 *   const signature = request.headers.get('X-Slack-Signature');
 *   const timestamp = request.headers.get('X-Slack-Request-Timestamp');
 *
 *   if (!verifySlackSignature(body, signature, timestamp)) {
 *     return new Response('Invalid signature', { status: 401 });
 *   }
 *
 *   const result = handleSlackWebhook(JSON.parse(body));
 *   // Process result.message...
 * }
 * ```
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { ChannelMessage, WebhookResult, WebhookChannel } from './types';

// ============================================================
// Utility Functions
// ============================================================

/**
 * Generate a unique message ID.
 * Format: `wh_{channel}_{timestamp}_{random}`
 */
function generateMessageId(channel: string): string {
  return `wh_${channel}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Safely extract a string from an unknown value.
 * Returns empty string if the value is not a string.
 */
function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Safely extract a number from an unknown value.
 * Returns the fallback if the value is not a number.
 */
function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

/**
 * Verify an HMAC signature using timing-safe comparison.
 * Prevents timing attacks during signature verification.
 *
 * @param payload - The raw payload string (body)
 * @param signature - The signature to verify
 * @param secret - The HMAC signing secret
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns Whether the signature is valid
 */
function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' | 'sha512' = 'sha256',
): boolean {
  try {
    const expectedSig = createHmac(algorithm, secret).update(payload).digest('hex');

    // Prefix handling: some channels prefix signatures (e.g., "sha256=...")
    const receivedSig = signature.startsWith(`${algorithm}=`)
      ? signature.slice(algorithm.length + 1)
      : signature;

    // Timing-safe comparison to prevent timing attacks
    const expected = Buffer.from(expectedSig, 'hex');
    const received = Buffer.from(receivedSig, 'hex');

    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

// ============================================================
// Slack Webhook Handler
// ============================================================

/**
 * Verify a Slack webhook request signature.
 *
 * Slack signs all requests using HMAC-SHA256 with the signing secret.
 * The signature is computed over the concatenation of the version prefix,
 * timestamp, and raw body.
 *
 * @see https://api.slack.com/authentication/verifying-requests-from-slack
 *
 * @param body - Raw request body string
 * @param signature - X-Slack-Signature header value
 * @param timestamp - X-Slack-Request-Timestamp header value
 * @param signingSecret - Slack app signing secret (defaults to env var)
 * @returns Whether the signature is valid
 */
export function verifySlackSignature(
  body: string,
  signature: string | null,
  timestamp: string | null,
  signingSecret?: string,
): boolean {
  const secret = signingSecret || process.env.SLACK_SIGNING_SECRET;
  if (!secret || !signature || !timestamp) return false;

  // Replay attack prevention: reject requests older than 5 minutes
  const requestTime = Number(timestamp) * 1000; // Slack uses Unix seconds
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  if (requestTime < fiveMinutesAgo) {
    console.warn('[Webhooks] Slack signature rejected: timestamp too old (possible replay attack)');
    return false;
  }

  // Slack signature format: v0=hex_digest
  const sigBaseString = `v0:${timestamp}:${body}`;
  const mySignature = `v0=${createHmac('sha256', secret).update(sigBaseString).digest('hex')}`;

  try {
    return timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

/**
 * Process a Slack webhook payload into a standardized ChannelMessage.
 *
 * Handles Slack Events API payloads including:
 *   - message events (user messages in channels/DMs)
 *   - app_mention events (bot is mentioned)
 *   - reaction_added events
 *
 * @param payload - The parsed Slack webhook payload
 * @returns WebhookResult with the standardized message
 */
export function handleSlackWebhook(payload: unknown): WebhookResult {
  const p = payload as Record<string, unknown>;
  const event = p.event as Record<string, unknown> | undefined;

  // Extract the relevant event data
  const eventType = safeString(event?.type);
  const userId = safeString(event?.user);
  const botId = safeString(event?.bot_id);
  const text = safeString(event?.text);
  const channel = safeString(event?.channel);
  const threadTs = safeString(event?.thread_ts);
  const eventTs = safeString(event?.ts);
  const teamId = safeString(p.team_id);

  // Skip bot messages to prevent loops
  const isBotMessage = botId.length > 0;
  const messageSubtype = safeString(event?.subtype);

  const message: ChannelMessage = {
    id: generateMessageId('slack'),
    channelId: 'slack',
    direction: 'inbound',
    content: text,
    contentType: 'markdown', // Slack uses mrkdwn
    metadata: {
      eventType,
      userId,
      botId: isBotMessage ? botId : undefined,
      channel,
      threadTs: threadTs || undefined,
      eventTs,
      teamId,
      isBotMessage,
      subtype: messageSubtype || undefined,
      // Include the raw event type for routing decisions
      isMention: eventType === 'app_mention',
    },
    timestamp: eventTs ? parseFloat(eventTs) * 1000 : Date.now(),
  };

  return {
    verified: false, // Verification is done separately before calling this
    channel: 'slack',
    message,
    rawPayload: payload,
  };
}

// ============================================================
// Telegram Webhook Handler
// ============================================================

/**
 * Verify a Telegram webhook request.
 *
 * Telegram Bot API uses a secret token sent in the X-Telegram-Bot-Api-Secret-Token
 * header. If configured, this token is compared against the expected value.
 *
 * @see https://core.telegram.org/bots/api#setwebhook
 *
 * @param receivedToken - The secret token from the request header
 * @param expectedToken - The expected token (defaults to env var)
 * @returns Whether the token matches
 */
export function verifyTelegramSignature(
  receivedToken: string | null,
  expectedToken?: string,
): boolean {
  const expected = expectedToken || process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || !receivedToken) return false;

  try {
    return timingSafeEqual(
      Buffer.from(receivedToken),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/**
 * Process a Telegram webhook payload into a standardized ChannelMessage.
 *
 * Handles Telegram Update objects including:
 *   - message: regular text messages
 *   - edited_message: edited messages
 *   - callback_query: inline button callbacks
 *
 * @see https://core.telegram.org/bots/api#update
 *
 * @param payload - The parsed Telegram Update object
 * @returns WebhookResult with the standardized message
 */
export function handleTelegramWebhook(payload: unknown): WebhookResult {
  const p = payload as Record<string, unknown>;
  const message = p.message as Record<string, unknown> | undefined;
  const editedMessage = p.edited_message as Record<string, unknown> | undefined;
  const callbackQuery = p.callback_query as Record<string, unknown> | undefined;

  const updateId = safeString(p.update_id);

  // Process the message (prefer live message over edited)
  const msg = message || editedMessage;
  const from = msg?.from as Record<string, unknown> | undefined;
  const chat = msg?.chat as Record<string, unknown> | undefined;
  const isEdited = !!editedMessage;

  // Handle callback queries (inline button presses)
  if (callbackQuery) {
    const cbFrom = callbackQuery.from as Record<string, unknown> | undefined;
    const cbData = safeString(callbackQuery.data);
    const cbMessage = callbackQuery.message as Record<string, unknown> | undefined;
    const cbChat = cbMessage?.chat as Record<string, unknown> | undefined;

    const channelMessage: ChannelMessage = {
      id: generateMessageId('telegram'),
      channelId: 'telegram',
      direction: 'inbound',
      content: cbData,
      contentType: 'text',
      metadata: {
        eventType: 'callback_query',
        userId: safeString(cbFrom?.id),
        username: safeString(cbFrom?.username),
        firstName: safeString(cbFrom?.first_name),
        chatId: safeString(cbChat?.id),
        chatType: safeString(cbChat?.type),
        callbackQueryId: safeString(callbackQuery.id),
        updateId,
      },
      timestamp: Date.now(),
    };

    return {
      verified: false,
      channel: 'telegram',
      message: channelMessage,
      rawPayload: payload,
    };
  }

  // Process text message
  const text = safeString(msg?.text);
  const chatId = safeString(chat?.id);
  const chatType = safeString(chat?.type);
  const userId = safeString(from?.id);
  const username = safeString(from?.username);
  const firstName = safeString(from?.first_name);
  const messageId = safeString(msg?.message_id);
  const date = safeNumber(msg?.date);

  const channelMessage: ChannelMessage = {
    id: generateMessageId('telegram'),
    channelId: 'telegram',
    direction: 'inbound',
    content: text,
    contentType: 'text',
    metadata: {
      eventType: isEdited ? 'edited_message' : 'message',
      userId,
      username,
      firstName,
      chatId,
      chatType,
      messageId,
      updateId,
      isEdited,
      // Detect if this is a command (/start, /help, etc.)
      isCommand: text.startsWith('/'),
      command: text.startsWith('/') ? text.split(' ')[0] : undefined,
    },
    timestamp: date ? date * 1000 : Date.now(),
  };

  return {
    verified: false,
    channel: 'telegram',
    message: channelMessage,
    rawPayload: payload,
  };
}

// ============================================================
// WhatsApp Webhook Handler
// ============================================================

/**
 * Verify a WhatsApp (Meta Cloud API) webhook signature.
 *
 * Meta signs all webhook payloads with the App Secret using HMAC-SHA256.
 * The signature is sent in the X-Hub-Signature-256 header.
 *
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 *
 * @param body - Raw request body string
 * @param signature - X-Hub-Signature-256 header value
 * @param appSecret - Meta App Secret (defaults to env var)
 * @returns Whether the signature is valid
 */
export function verifyWhatsAppSignature(
  body: string,
  signature: string | null,
  appSecret?: string,
): boolean {
  const secret = appSecret || process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signature) return false;

  // Meta signature format: sha256=hex_digest
  return verifyHmacSignature(body, signature, secret, 'sha256');
}

/**
 * Process a WhatsApp webhook payload into a standardized ChannelMessage.
 *
 * Handles WhatsApp Business API webhook payloads including:
 *   - messages: incoming text/media messages
 *   - statuses: message delivery/read status updates
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 *
 * @param payload - The parsed WhatsApp webhook payload
 * @returns WebhookResult with the standardized message
 */
export function handleWhatsAppWebhook(payload: unknown): WebhookResult {
  const p = payload as Record<string, unknown>;
  const entry = (p.entry as Array<Record<string, unknown>>)?.[0];
  const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
  const value = changes?.value as Record<string, unknown> | undefined;
  const metadata = value?.metadata as Record<string, unknown> | undefined;

  const businessPhoneNumberId = safeString(metadata?.phone_number_id);

  // Check if this is a message or a status update
  const messages = value?.messages as Array<Record<string, unknown>> | undefined;
  const statuses = value?.statuses as Array<Record<string, unknown>> | undefined;

  if (messages && messages.length > 0) {
    // Process inbound message
    const msg = messages[0];
    const from = safeString(msg.from);
    const messageId = safeString(msg.id);
    const timestamp = safeString(msg.timestamp);
    const msgType = safeString(msg.type);
    const text = msg.text as Record<string, unknown> | undefined;

    const channelMessage: ChannelMessage = {
      id: generateMessageId('whatsapp'),
      channelId: 'whatsapp',
      direction: 'inbound',
      content: safeString(text?.body),
      contentType: 'text',
      metadata: {
        eventType: 'message',
        from,
        messageId,
        msgType,
        businessPhoneNumberId,
        isText: msgType === 'text',
        isMedia: ['image', 'video', 'audio', 'document'].includes(msgType),
        // Contact info
        contactName: (() => {
          const contacts = value?.contacts as Array<Record<string, unknown>> | undefined;
          if (!contacts || contacts.length === 0) return undefined;
          const contact = contacts[0];
          const profile = contact.profile as Record<string, unknown> | undefined;
          return safeString(profile?.name) || safeString(contact.wa_id) || undefined;
        })(),
      },
      timestamp: timestamp ? parseInt(timestamp, 10) * 1000 : Date.now(),
    };

    return {
      verified: false,
      channel: 'whatsapp',
      message: channelMessage,
      rawPayload: payload,
    };
  }

  if (statuses && statuses.length > 0) {
    // Process status update (delivered, read, etc.)
    const status = statuses[0];
    const channelMessage: ChannelMessage = {
      id: generateMessageId('whatsapp'),
      channelId: 'whatsapp',
      direction: 'inbound',
      content: `Message status: ${safeString(status.status)}`,
      contentType: 'text',
      metadata: {
        eventType: 'status',
        status: safeString(status.status),
        messageId: safeString(status.id),
        recipientId: safeString(status.recipient_id),
        timestamp: safeString(status.timestamp),
        businessPhoneNumberId,
      },
      timestamp: Date.now(),
    };

    return {
      verified: false,
      channel: 'whatsapp',
      message: channelMessage,
      rawPayload: payload,
    };
  }

  // Unknown webhook type
  const channelMessage: ChannelMessage = {
    id: generateMessageId('whatsapp'),
    channelId: 'whatsapp',
    direction: 'inbound',
    content: '',
    contentType: 'text',
    metadata: {
      eventType: 'unknown',
      businessPhoneNumberId,
    },
    timestamp: Date.now(),
  };

  return {
    verified: false,
    channel: 'whatsapp',
    message: channelMessage,
    rawPayload: payload,
  };
}

// ============================================================
// Twilio Webhook Handler (Phone + SMS)
// ============================================================

/**
 * Verify a Twilio webhook request signature.
 *
 * Twilio signs all webhook requests using the Auth Token and the
 * full URL of the request. The signature is sent in the
 * X-Twilio-Signature header.
 *
 * @see https://www.twilio.com/docs/usage/security
 *
 * @param url - The full URL of the webhook endpoint
 * @param params - The parsed form parameters from the request body
 * @param signature - X-Twilio-Signature header value
 * @param authToken - Twilio Auth Token (defaults to env var)
 * @returns Whether the signature is valid
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
  authToken?: string,
): boolean {
  const secret = authToken || process.env.TWILIO_AUTH_TOKEN;
  if (!secret || !signature) return false;

  try {
    // Twilio signature: HMAC-SHA1 of URL + sorted params
    let data = url;
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      data += key + params[key];
    }

    const expectedSig = createHmac('sha1', secret).update(data).digest('base64');

    return timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

/**
 * Process a Twilio webhook payload (SMS or Voice) into a standardized ChannelMessage.
 *
 * Handles:
 *   - SMS inbound messages
 *   - Voice call status updates
 *   - Voice call transcripts
 *
 * @see https://www.twilio.com/docs/messaging/guides/webhook-request
 *
 * @param payload - The parsed Twilio form parameters
 * @returns WebhookResult with the standardized message
 */
export function handleTwilioWebhook(payload: unknown): WebhookResult {
  const p = payload as Record<string, string>;

  const from = safeString(p.From);
  const to = safeString(p.To);
  const body = safeString(p.Body);
  const messageSid = safeString(p.MessageSid);
  const callSid = safeString(p.CallSid);
  const callStatus = safeString(p.CallStatus);
  const accountSid = safeString(p.AccountSid);
  const smsStatus = safeString(p.SmsStatus);
  const numMedia = safeString(p.NumMedia);

  // Determine if this is SMS or Voice
  const isVoice = !!callSid;
  const isSms = !!messageSid || !!body;

  const channel: WebhookChannel = isVoice ? 'phone' : 'sms';
  const channelId = isVoice ? 'phone' as const : 'sms' as const;

  const channelMessage: ChannelMessage = {
    id: generateMessageId(channel),
    channelId,
    direction: 'inbound',
    content: isVoice
      ? `Call from ${from} to ${to} — Status: ${callStatus}`
      : body,
    contentType: 'text',
    metadata: {
      eventType: isVoice ? 'voice_call' : 'sms',
      from,
      to,
      accountSid,
      // SMS-specific
      messageSid: isSms ? messageSid : undefined,
      smsStatus: isSms ? smsStatus : undefined,
      numMedia: isSms ? numMedia : undefined,
      hasMedia: isSms && parseInt(numMedia || '0', 10) > 0,
      // Voice-specific
      callSid: isVoice ? callSid : undefined,
      callStatus: isVoice ? callStatus : undefined,
      // Common
      fromCity: safeString(p.FromCity),
      fromState: safeString(p.FromState),
      fromCountry: safeString(p.FromCountry),
    },
    timestamp: Date.now(),
  };

  return {
    verified: false,
    channel,
    message: channelMessage,
    rawPayload: payload,
  };
}

// ============================================================
// Email Webhook Handler
// ============================================================

/**
 * Verify an email webhook signature.
 *
 * Email services (Resend, SendGrid, Postmark) use HMAC-SHA256
 * signatures to verify webhook authenticity.
 *
 * @param body - Raw request body string
 * @param signature - The signature header value
 * @param secret - Webhook signing secret (defaults to env var)
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns Whether the signature is valid
 */
export function verifyEmailSignature(
  body: string,
  signature: string | null,
  secret?: string,
  algorithm: 'sha256' | 'sha1' | 'sha512' = 'sha256',
): boolean {
  const signingSecret = secret || process.env.EMAIL_WEBHOOK_SECRET;
  if (!signingSecret || !signature) return false;

  return verifyHmacSignature(body, signature, signingSecret, algorithm);
}

/**
 * Process an email webhook payload into a standardized ChannelMessage.
 *
 * Handles inbound email events from services like Resend, SendGrid,
 * and Postmark. These services forward received emails as webhook payloads.
 *
 * @param payload - The parsed email webhook payload
 * @returns WebhookResult with the standardized message
 */
export function handleEmailWebhook(payload: unknown): WebhookResult {
  const p = payload as Record<string, unknown>;

  // Handle different email service formats
  // Resend format
  const data = p.data as Record<string, unknown> | undefined;

  // Generic format fallback
  const from = safeString(data?.from || p.from);
  const to = safeString(data?.to || p.to);
  const subject = safeString(data?.subject || p.subject);
  const textBody = safeString(data?.text || p.text);
  const htmlBody = safeString(data?.html || p.html);
  const emailId = safeString(data?.id || p.id || p.message_id);
  const eventType = safeString(p.type || p.event || 'email.received');

  // Extract reply context if available
  const inReplyTo = safeString(data?.in_reply_to || p.in_reply_to);
  const references = safeString(data?.references || p.references);

  // Extract headers for threading
  const headers = data?.headers as Record<string, unknown> | undefined;

  const channelMessage: ChannelMessage = {
    id: generateMessageId('email'),
    channelId: 'email',
    direction: 'inbound',
    content: textBody || htmlBody,
    contentType: htmlBody ? 'html' : 'text',
    metadata: {
      eventType,
      from,
      to,
      subject,
      emailId,
      inReplyTo: inReplyTo || undefined,
      references: references || undefined,
      hasHtml: !!htmlBody,
      hasText: !!textBody,
      // Headers for threading
      messageId: safeString(headers?.['message-id'] || p.message_id),
      isReply: !!(inReplyTo || references),
    },
    timestamp: Date.now(),
  };

  return {
    verified: false,
    channel: 'email',
    message: channelMessage,
    rawPayload: payload,
  };
}

// ============================================================
// Discord Webhook Handler
// ============================================================

/**
 * Verify a Discord webhook request signature.
 *
 * Discord uses Ed25519 signatures for webhook verification,
 * but for simplicity, we verify the bot token approach.
 * For production, use the discord-interactions package for
 * proper Ed25519 verification.
 *
 * @param body - Raw request body string
 * @param signature - X-Signature-Ed25519 header value
 * @param timestamp - X-Signature-Timestamp header value
 * @param publicKey - Discord application public key (defaults to env var)
 * @returns Whether the signature is valid (basic check)
 */
export function verifyDiscordSignature(
  body: string,
  signature: string | null,
  timestamp: string | null,
  publicKey?: string,
): boolean {
  const key = publicKey || process.env.DISCORD_PUBLIC_KEY;
  if (!key || !signature || !timestamp) return false;

  // Replay attack prevention: reject requests older than 5 minutes
  const requestTime = new Date(timestamp).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  if (requestTime < fiveMinutesAgo) return false;

  // Note: Full Ed25519 verification requires the tweetnacl package.
  // This is a simplified check — production should use proper Ed25519.
  // For now, return true if we have all required components.
  // TODO: Implement full Ed25519 verification with nacl
  console.warn('[Webhooks] Discord signature verification is simplified — implement Ed25519 for production');
  return signature.length > 0 && timestamp.length > 0;
}

/**
 * Process a Discord interaction webhook payload.
 *
 * Handles Discord Interaction Create events including:
 *   - APPLICATION_COMMAND: Slash command invocations
 *   - MESSAGE_COMPONENT: Button/select menu interactions
 *
 * @param payload - The parsed Discord interaction payload
 * @returns WebhookResult with the standardized message
 */
export function handleDiscordWebhook(payload: unknown): WebhookResult {
  const p = payload as Record<string, unknown>;
  const type = safeNumber(p.type);
  const data = p.data as Record<string, unknown> | undefined;
  const member = p.member as Record<string, unknown> | undefined;
  const user = member?.user as Record<string, unknown> | undefined;
  const discordChannelId = safeString(p.channel_id);

  // Discord interaction types
  const isPing = type === 1;
  const isCommand = type === 2;
  const isComponent = type === 3;

  // Extract command/interaction content
  let content = '';
  let eventType = 'unknown';

  if (isPing) {
    eventType = 'ping';
    content = 'Discord ping';
  } else if (isCommand) {
    eventType = 'application_command';
    const commandName = safeString(data?.name);
    const options = data?.options as Array<Record<string, unknown>> | undefined;
    content = commandName;
    if (options && options.length > 0) {
      const args = options
        .map((opt) => `${safeString(opt.name)}:${safeString(opt.value)}`)
        .join(' ');
      content += ` ${args}`;
    }
  } else if (isComponent) {
    eventType = 'message_component';
    const customId = safeString(data?.custom_id);
    const componentType = safeString(data?.component_type);
    content = customId || componentType;
  }

  const channelMessage: ChannelMessage = {
    id: generateMessageId('discord'),
    channelId: 'discord',
    direction: 'inbound',
    content,
    contentType: 'text',
    metadata: {
      eventType,
      interactionType: type,
      userId: safeString(user?.id),
      username: safeString(user?.username),
      channelId: discordChannelId,
      guildId: safeString(p.guild_id),
      commandName: isCommand ? safeString(data?.name) : undefined,
      customId: isComponent ? safeString(data?.custom_id) : undefined,
      isPing,
      isCommand,
      isComponent,
    },
    timestamp: Date.now(),
  };

  return {
    verified: false,
    channel: 'discord',
    message: channelMessage,
    rawPayload: payload,
  };
}

// ============================================================
// Generic Webhook Processor
// ============================================================

/**
 * Process a webhook from any supported channel.
 * Dispatches to the appropriate handler based on the channel parameter.
 *
 * @param channel - The webhook source channel
 * @param payload - The parsed webhook payload
 * @returns WebhookResult with the standardized message
 */
export function handleWebhook(
  channel: WebhookChannel,
  payload: unknown,
): WebhookResult {
  switch (channel) {
    case 'slack':
      return handleSlackWebhook(payload);
    case 'telegram':
      return handleTelegramWebhook(payload);
    case 'whatsapp':
      return handleWhatsAppWebhook(payload);
    case 'phone':
    case 'sms':
      return handleTwilioWebhook(payload);
    case 'email':
      return handleEmailWebhook(payload);
    case 'discord':
      return handleDiscordWebhook(payload);
    default:
      // Fallback for unknown channels
      return {
        verified: false,
        channel,
        message: {
          id: generateMessageId(channel),
          channelId: channel as import('./types').ChannelId,
          direction: 'inbound',
          content: JSON.stringify(payload).slice(0, 1000),
          contentType: 'text',
          metadata: { eventType: 'unknown_channel', rawChannel: channel },
          timestamp: Date.now(),
        },
        rawPayload: payload,
      };
  }
}
