/**
 * Agent Key Management
 * =====================
 * Manages API keys, OAuth tokens, and secrets for each agent.
 *
 * Key types:
 *   - api_key: Standard API keys (GLM, LinkedIn, Exa, Jina, etc.)
 *   - oauth: OAuth2 tokens with refresh capability
 *   - token: Bearer tokens
 *   - certificate: SSL/TLS certificates
 *
 * Keys are stored in the AgentKey table with:
 *   - Provider identification (z-ai, linkedin, exa, jina, etc.)
 *   - Environment scoping (development, staging, production)
 *   - Lifecycle tracking (rotation, expiration, revocation)
 *   - Usage tracking (last used timestamp)
 *
 * SECURITY: Key values are never logged. The `keyValue` field should
 * be encrypted at rest in production. For now, we store environment
 * variable references as a secure pattern — the actual key values
 * are read from process.env at runtime.
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export type KeyType = 'api_key' | 'oauth' | 'token' | 'certificate';
export type KeyStatus = 'active' | 'rotated' | 'revoked' | 'expired';
export type KeyEnvironment = 'development' | 'staging' | 'production';

export interface KeyDefinition {
  agentName: AgentName;
  keyName: string;
  provider: string;
  keyType?: KeyType;
  keyValue?: string;
  envVarName?: string; // Reference to environment variable
  environment?: KeyEnvironment;
  expiresAt?: Date;
}

// ── CRUD ───────────────────────────────────────────────────────

/**
 * Register an API key for an agent.
 */
export async function registerKey(keyDef: KeyDefinition) {
  return db.agentKey.create({
    data: {
      agentName: keyDef.agentName,
      keyName: keyDef.keyName,
      provider: keyDef.provider,
      keyType: keyDef.keyType || 'api_key',
      keyValue: keyDef.keyValue || keyDef.envVarName || null,
      environment: keyDef.environment || 'production',
      expiresAt: keyDef.expiresAt || null,
      status: 'active',
    },
  });
}

/**
 * Resolve a key value — returns the actual key from env vars or stored value.
 * Priority: environment variable > stored value.
 */
export async function resolveKey(agentName: AgentName, keyName: string): Promise<string | null> {
  const key = await db.agentKey.findFirst({
    where: { agentName, keyName, status: 'active' },
  });

  if (!key) return null;

  // Check if keyValue is an env var reference
  if (key.keyValue) {
    // If it looks like an env var name (uppercase, underscores), try to resolve from env
    const envValue = process.env[key.keyValue];
    if (envValue) {
      // Update last used
      await db.agentKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      });
      return envValue;
    }

    // If it's not an env var name, it might be the actual key value
    if (!key.keyValue.match(/^[A-Z_]+$/)) {
      await db.agentKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      });
      return key.keyValue;
    }
  }

  return null;
}

/**
 * List all keys for an agent (values masked).
 */
export async function listKeys(agentName: AgentName) {
  const keys = await db.agentKey.findMany({
    where: { agentName },
    orderBy: { provider: 'asc' },
  });

  return keys.map(k => ({
    id: k.id,
    agentName: k.agentName,
    keyName: k.keyName,
    provider: k.provider,
    keyType: k.keyType,
    environment: k.environment,
    status: k.status,
    expiresAt: k.expiresAt,
    lastUsedAt: k.lastUsedAt,
    lastRotatedAt: k.lastRotatedAt,
    // Mask key value for security
    keyValueMasked: k.keyValue ? `${k.keyValue.slice(0, 4)}...${k.keyValue.slice(-4)}` : null,
  }));
}

/**
 * Rotate a key — mark old as rotated, create new active entry.
 */
export async function rotateKey(agentName: AgentName, keyName: string, newKeyValue: string) {
  // Mark existing key as rotated
  const existing = await db.agentKey.findFirst({
    where: { agentName, keyName, status: 'active' },
  });

  if (existing) {
    await db.agentKey.update({
      where: { id: existing.id },
      data: { status: 'rotated', lastRotatedAt: new Date() },
    });
  }

  // Create new active key
  return db.agentKey.create({
    data: {
      agentName,
      keyName,
      provider: existing?.provider || 'unknown',
      keyType: existing?.keyType || 'api_key',
      keyValue: newKeyValue,
      environment: existing?.environment || 'production',
      status: 'active',
    },
  });
}

/**
 * Revoke a key.
 */
export async function revokeKey(id: string) {
  return db.agentKey.update({
    where: { id },
    data: { status: 'revoked' },
  });
}

/**
 * Seed default key references for all agents.
 * These reference environment variables that hold actual keys.
 * The actual key values are read from process.env at runtime.
 */
export async function seedDefaultKeys(): Promise<number> {
  const defaultKeys: KeyDefinition[] = [
    // GLM API keys — all agents share the z-ai-web-dev-sdk
    // The ZAI_API_KEY env var is read by both:
    //   1. The .z-ai-config file (for the SDK initialization)
    //   2. The resolveKey() function (for agent-level key tracking)
    ...(['orchestrator', 'prospect-discovery', 'data-enrichment', 'web-research', 'lead-qualification', 'outreach-composer', 'pipeline-manager', 'report-generator'] as AgentName[]).flatMap(agentName => [
      { agentName, keyName: 'glm_api_key', provider: 'z-ai', keyType: 'api_key' as KeyType, envVarName: 'ZAI_API_KEY' },
    ]),
  ];

  let created = 0;
  for (const keyDef of defaultKeys) {
    try {
      await registerKey(keyDef);
      created++;
    } catch {
      // Key may already exist (unique constraint)
    }
  }
  return created;
}

/**
 * Get the active GLM API key value from environment.
 * This is the centralized function for obtaining the API key
 * used by all agents through the z-ai-web-dev-sdk.
 */
export function getGLMApiKey(): string | null {
  return process.env.ZAI_API_KEY || null;
}
