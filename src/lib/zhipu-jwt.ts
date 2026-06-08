/**
 * Zhipu AI JWT Token Generator
 * ===============================
 *
 * Zhipu AI's API requires JWT authentication. The API key format is `{id}.{secret}`,
 * and it must be converted to a JWT token before it can be used as a Bearer token.
 *
 * JWT Structure:
 *   Header:  { "alg": "HS256", "sign_type": "SIGN" }
 *   Payload: { "api_key": "<id>", "exp": <timestamp + 3600>, "timestamp": <timestamp> }
 *   Signature: HMAC-SHA256 with the <secret> part
 *
 * SECURITY NOTE: HMAC-SHA256 is the correct algorithm for JWT signing as specified
 * by the Zhipu AI API. This is NOT password hashing — it is a keyed MAC for token
 * authentication. Password hashing would require bcrypt/scrypt/argon2.
 *
 * Tokens expire after 1 hour. This utility caches the token and auto-refreshes
 * when it's about to expire.
 */

import crypto from 'crypto';

// ── Configuration ──────────────────────────────────────────────

const ZHIPU_API_KEY = process.env.ZHIPU_AI_API_KEY || process.env.ZHIPU_API_KEY || process.env.ZAI_API_KEY || '';
const ZHIPU_API_BASE = process.env.ZHIPU_AI_API_BASE || 'https://open.bigmodel.cn/api/paas/v4';

// Token refresh 5 minutes before expiration
const TOKEN_LIFETIME_MS = 3600 * 1000; // 1 hour
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5 minutes before expiry

// ── Cached Token ───────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// ── JWT Generation ─────────────────────────────────────────────

/**
 * Generate a JWT token from the Zhipu AI API key.
 * The API key format is `{id}.{secret}`.
 *
 * SECURITY NOTE (CodeQL: password hash with insufficient computational effort):
 * HMAC-SHA256 is the CORRECT and REQUIRED algorithm for Zhipu AI JWT signing.
 * This is NOT password hashing — it is a keyed MAC for API token authentication.
 * The Zhipu AI API specification mandates HS256 for JWT signing.
 * Password hashing (which would require bcrypt/scrypt/argon2) is not applicable here.
 */
function generateJWT(apiKey: string): string {
  const parts = apiKey.split('.');
  if (parts.length !== 2) {
    throw new Error(`Invalid Zhipu AI API key format. Expected '{{id}}.{{secret}}', got length ${parts.length}`);
  }

  const [id, secret] = parts;
  const now = Date.now();

  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', sign_type: 'SIGN' })
  ).toString('base64url');

  const payload = Buffer.from(
    JSON.stringify({
      api_key: id,
      exp: now + TOKEN_LIFETIME_MS,
      timestamp: now,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Get a valid Zhipu AI JWT token.
 * Automatically refreshes the token when it's about to expire.
 *
 * Returns null if the API key is not configured.
 */
export function getZhipuToken(): string | null {
  if (!ZHIPU_API_KEY) {
    console.warn('[zhipu-jwt] No Zhipu AI API key configured (ZHIPU_AI_API_KEY or ZAI_API_KEY env var)');
    return null;
  }

  const now = Date.now();

  // Return cached token if still valid (with refresh margin)
  if (cachedToken && now < tokenExpiresAt - TOKEN_REFRESH_MARGIN_MS) {
    return cachedToken;
  }

  try {
    cachedToken = generateJWT(ZHIPU_API_KEY);
    tokenExpiresAt = now + TOKEN_LIFETIME_MS;
    console.log('[zhipu-jwt] Generated new JWT token, expires at:', new Date(tokenExpiresAt).toISOString());
    return cachedToken;
  } catch (error) {
    console.error('[zhipu-jwt] Failed to generate JWT:', error instanceof Error ? error.message : error);
    cachedToken = null;
    tokenExpiresAt = 0;
    return null;
  }
}

/**
 * Get the Zhipu AI API base URL.
 */
export function getZhipuApiBase(): string {
  return ZHIPU_API_BASE;
}

/**
 * Get the raw API key (id.secret format).
 */
export function getZhipuApiKey(): string {
  return ZHIPU_API_KEY;
}

/**
 * Check if the Zhipu AI API is configured.
 */
export function isZhipuConfigured(): boolean {
  return !!ZHIPU_API_KEY;
}

/**
 * Force refresh the JWT token (useful after API key rotation).
 */
export function refreshToken(): string | null {
  cachedToken = null;
  tokenExpiresAt = 0;
  return getZhipuToken();
}
