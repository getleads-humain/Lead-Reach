/**
 * Agent Configuration Management
 * ===============================
 * Key-value configuration store for each agent.
 * Supports typed values (string, number, boolean, json, secret).
 * Secrets are flagged for secure handling (never logged in plain text).
 *
 * Config values are stored as JSON strings in the AgentConfig table.
 * Each agent can have its own config namespace.
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export type ConfigType = 'string' | 'number' | 'boolean' | 'json' | 'secret';
export type ConfigCategory = 'general' | 'model' | 'channel' | 'rate_limit' | 'memory' | 'skill';

export interface ConfigEntry {
  agentName: AgentName;
  key: string;
  value: unknown;
  type?: ConfigType;
  description?: string;
  category?: ConfigCategory;
  isSecret?: boolean;
  isRequired?: boolean;
}

// ── CRUD ───────────────────────────────────────────────────────

/**
 * Set a config value for an agent.
 */
export async function setConfig(entry: ConfigEntry) {
  return db.agentConfig.upsert({
    where: { agentName_key: { agentName: entry.agentName, key: entry.key } },
    create: {
      agentName: entry.agentName,
      key: entry.key,
      value: JSON.stringify(entry.value),
      type: entry.type || 'string',
      description: entry.description || null,
      category: entry.category || 'general',
      isSecret: entry.isSecret || false,
      isRequired: entry.isRequired || false,
    },
    update: {
      value: JSON.stringify(entry.value),
      type: entry.type || 'string',
      description: entry.description || null,
      category: entry.category || 'general',
      isSecret: entry.isSecret || false,
    },
  });
}

/**
 * Get a config value for an agent.
 * Returns the parsed value (not the JSON string).
 */
export async function getConfig<T = unknown>(agentName: AgentName, key: string, defaultValue?: T): Promise<T | undefined> {
  const entry = await db.agentConfig.findUnique({
    where: { agentName_key: { agentName, key } },
  });

  if (!entry) return defaultValue;

  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return entry.value as unknown as T;
  }
}

/**
 * Get all config values for an agent.
 * Secrets are masked in the response.
 */
export async function getAllConfig(agentName: AgentName) {
  const configs = await db.agentConfig.findMany({
    where: { agentName },
    orderBy: { category: 'asc' },
  });

  return configs.map(c => ({
    id: c.id,
    agentName: c.agentName,
    key: c.key,
    value: c.isSecret ? '********' : JSON.parse(c.value),
    type: c.type,
    description: c.description,
    category: c.category,
    isSecret: c.isSecret,
    isRequired: c.isRequired,
  }));
}

/**
 * Delete a config entry.
 */
export async function deleteConfig(agentName: AgentName, key: string) {
  return db.agentConfig.delete({
    where: { agentName_key: { agentName, key } },
  });
}

/**
 * Get config as a plain object (key → value) for an agent.
 * Useful for loading all config at once into agent context.
 */
export async function getConfigMap(agentName: AgentName): Promise<Record<string, unknown>> {
  const configs = await db.agentConfig.findMany({
    where: { agentName, isSecret: false },
  });

  const map: Record<string, unknown> = {};
  for (const c of configs) {
    try {
      map[c.key] = JSON.parse(c.value);
    } catch {
      map[c.key] = c.value;
    }
  }
  return map;
}
