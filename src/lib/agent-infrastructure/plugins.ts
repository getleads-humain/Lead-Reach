/**
 * Agent Plugin Management
 * ========================
 * Manages extensible plugins for each agent.
 * Plugins are integrations, automations, or enhancements that hook
 * into agent lifecycle events.
 *
 * Plugin types:
 *   - integration: External service connections (GHL, HubSpot, Slack)
 *   - enrichment: Additional data sources for lead enrichment
 *   - notification: Alerting and notification handlers
 *   - automation: Workflow triggers and custom AI tasks
 *   - analytics: Custom reporting and metrics collection
 *
 * Plugins respond to hooks (events) and execute configured actions.
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export type PluginType = 'integration' | 'enrichment' | 'notification' | 'automation' | 'analytics';

export interface PluginDefinition {
  agentName: AgentName;
  name: string;
  displayName: string;
  description: string;
  version?: string;
  type: PluginType;
  provider?: string;
  config?: Record<string, unknown>;
  hooks?: string[];
  enabled?: boolean;
}

// ── CRUD ───────────────────────────────────────────────────────

/**
 * Register a plugin for an agent.
 */
export async function registerPlugin(plugin: PluginDefinition) {
  return db.agentPlugin.create({
    data: {
      agentName: plugin.agentName,
      name: plugin.name,
      displayName: plugin.displayName,
      description: plugin.description,
      version: plugin.version || '1.0.0',
      type: plugin.type,
      provider: plugin.provider || null,
      config: plugin.config ? JSON.stringify(plugin.config) : null,
      hooks: plugin.hooks ? JSON.stringify(plugin.hooks) : null,
      enabled: plugin.enabled !== false,
      status: 'active',
    },
  });
}

/**
 * List plugins for an agent.
 */
export async function listPlugins(agentName: AgentName, type?: PluginType) {
  return db.agentPlugin.findMany({
    where: {
      agentName,
      ...(type ? { type } : {}),
      enabled: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all plugins that handle a specific event hook.
 */
export async function getPluginsForHook(agentName: AgentName, hook: string) {
  const plugins = await db.agentPlugin.findMany({
    where: { agentName, enabled: true, status: 'active' },
  });

  return plugins.filter(p => {
    const hooks: string[] = p.hooks ? JSON.parse(p.hooks) : [];
    return hooks.includes(hook);
  });
}

/**
 * Execute a plugin hook — triggers all plugins subscribed to an event.
 * Each plugin receives the event data and can perform actions.
 */
export async function executePluginHook(
  agentName: AgentName,
  hook: string,
  eventData: Record<string, unknown>
): Promise<number> {
  const plugins = await getPluginsForHook(agentName, hook);
  let executed = 0;

  for (const plugin of plugins) {
    try {
      const config = plugin.config ? JSON.parse(plugin.config) : {};

      // Plugin execution is logged for observability
      await db.agentLog.create({
        data: {
          agentName,
          level: 'info',
          category: 'plugin',
          message: `Plugin ${plugin.name} triggered by hook: ${hook}`,
          metadata: JSON.stringify({ pluginId: plugin.id, hook, eventDataKeys: Object.keys(eventData) }),
          pluginId: plugin.id,
        },
      });

      // Update plugin metrics
      await db.agentPlugin.update({
        where: { id: plugin.id },
        data: {
          invocationsCount: { increment: 1 },
          lastInvokedAt: new Date(),
        },
      });

      executed++;
    } catch (error) {
      await db.agentPlugin.update({
        where: { id: plugin.id },
        data: {
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  return executed;
}

/**
 * Enable a plugin.
 */
export async function enablePlugin(id: string) {
  return db.agentPlugin.update({ where: { id }, data: { enabled: true, status: 'active' } });
}

/**
 * Disable a plugin.
 */
export async function disablePlugin(id: string) {
  return db.agentPlugin.update({ where: { id }, data: { enabled: false, status: 'disabled' } });
}

/**
 * Update plugin configuration.
 */
export async function updatePluginConfig(id: string, config: Record<string, unknown>) {
  return db.agentPlugin.update({
    where: { id },
    data: { config: JSON.stringify(config) },
  });
}
