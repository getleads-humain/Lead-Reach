/**
 * Plugin System — Plugin Manager
 * ================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The PluginManager is the central registry and executor for all
 * Vellum-style plugins. It handles:
 *   - Plugin registration and unregistration
 *   - Hook execution (firing events to all registered plugins)
 *   - Injector execution (producing context injections)
 *   - Plugin ordering and dependency management
 *
 * This manager is complementary to the existing DB-driven plugin
 * system at @/lib/agent-infrastructure/plugins. Both coexist:
 *   - DB plugins: Simple event-driven integrations stored in DB
 *   - Vellum plugins: Runtime plugins with typed hooks and injectors
 *
 * Usage:
 *   import { pluginManager } from '@/lib/vellum-core/plugins';
 *   pluginManager.registerPlugin(myPlugin);
 *   const injections = await pluginManager.runInjectors(turnContext);
 */

import {
  type Plugin,
  type PluginHook,
  type PluginHookFn,
  type PluginManifest,
  type TurnContext,
  type InjectionBlock,
  type Injector,
} from './types';

// ── Plugin Manager Class ────────────────────────────────────────

/**
 * Central plugin manager — singleton pattern.
 */
class PluginManager {
  /** Registered plugins, keyed by manifest name */
  private plugins: Map<string, Plugin> = new Map();

  /** Ordered list of all injectors across all plugins */
  private injectorOrder: Injector[] = [];

  /** Whether the manager has been initialized */
  private initialized = false;

  // ── Registration ───────────────────────────────────────────

  /**
   * Register a plugin with the manager.
   * Validates the manifest, checks requirements, and indexes
   * the plugin's hooks and injectors.
   */
  registerPlugin(plugin: Plugin): void {
    const { manifest } = plugin;

    // Validate manifest
    if (!manifest.name) {
      throw new Error('Plugin manifest must have a name');
    }
    if (!manifest.version) {
      throw new Error(`Plugin "${manifest.name}" manifest must have a version`);
    }

    // Check for conflicts
    if (this.plugins.has(manifest.name)) {
      console.warn(`[PluginManager] Plugin "${manifest.name}" is already registered — replacing`);
      this.unregisterPlugin(manifest.name);
    }

    // Check required credentials
    if (manifest.requiresCredential) {
      const credValue = process.env[manifest.requiresCredential];
      if (!credValue) {
        console.warn(
          `[PluginManager] Plugin "${manifest.name}" requires credential "${manifest.requiresCredential}" which is not set. Plugin will be registered but may not function correctly.`
        );
      }
    }

    // Check required feature flags
    if (manifest.requiresFlag) {
      const flagValue = process.env[manifest.requiresFlag];
      if (flagValue !== 'true' && flagValue !== '1') {
        console.warn(
          `[PluginManager] Plugin "${manifest.name}" requires flag "${manifest.requiresFlag}" which is not enabled. Plugin will be registered but may not function correctly.`
        );
      }
    }

    // Register the plugin
    this.plugins.set(manifest.name, plugin);

    // Index injectors
    if (plugin.injectors) {
      for (const injector of plugin.injectors) {
        this.injectorOrder.push(injector);
      }
      // Re-sort injectors by order
      this.injectorOrder.sort((a, b) => a.order - b.order);
    }

    console.log(
      `[PluginManager] Registered plugin "${manifest.name}" v${manifest.version}` +
        (plugin.hooks ? ` (hooks: ${Object.keys(plugin.hooks).join(', ')})` : '') +
        (plugin.tools?.length ? ` (tools: ${plugin.tools.length})` : '') +
        (plugin.injectors?.length ? ` (injectors: ${plugin.injectors.length})` : '')
    );
  }

  /**
   * Unregister a plugin by name.
   * Removes the plugin and its injectors from the manager.
   */
  unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`[PluginManager] Cannot unregister non-existent plugin "${name}"`);
      return;
    }

    // Remove injectors
    if (plugin.injectors) {
      const injectorNames = new Set(plugin.injectors.map(i => i.name));
      this.injectorOrder = this.injectorOrder.filter(i => !injectorNames.has(i.name));
    }

    this.plugins.delete(name);
    console.log(`[PluginManager] Unregistered plugin "${name}"`);
  }

  // ── Hook Execution ─────────────────────────────────────────

  /**
   * Run a hook across all registered plugins.
   * Returns all injection blocks produced by the hook handlers.
   *
   * @param hook The hook to fire
   * @param context The context to pass to the hook handlers
   * @returns Array of injection blocks from all handlers
   */
  async runHook(hook: PluginHook, context: unknown): Promise<InjectionBlock[]> {
    const allBlocks: InjectionBlock[] = [];

    for (const [name, plugin] of this.plugins) {
      const hookFn = plugin.hooks[hook];
      if (!hookFn) continue;

      try {
        const result = await hookFn(context);
        if (result && Array.isArray(result)) {
          allBlocks.push(...result);
        }
      } catch (error) {
        console.error(
          `[PluginManager] Hook "${hook}" failed in plugin "${name}":`,
          error instanceof Error ? error.message : error
        );
        // Continue running other plugins — one failure shouldn't block the pipeline
      }
    }

    return allBlocks;
  }

  // ── Injector Execution ─────────────────────────────────────

  /**
   * Run all injectors for the given turn context.
   * Injectors are executed in order (by their `order` field).
   * Returns all injection blocks produced.
   *
   * @param context The current turn context
   * @returns Array of injection blocks from all injectors
   */
  async runInjectors(context: TurnContext): Promise<InjectionBlock[]> {
    const allBlocks: InjectionBlock[] = [];

    for (const injector of this.injectorOrder) {
      try {
        const blocks = await injector.produce(context);
        if (blocks && Array.isArray(blocks)) {
          allBlocks.push(...blocks);
        }
      } catch (error) {
        console.error(
          `[PluginManager] Injector "${injector.name}" failed:`,
          error instanceof Error ? error.message : error
        );
        // Continue running other injectors
      }
    }

    return allBlocks;
  }

  // ── Query Methods ──────────────────────────────────────────

  /**
   * Get all registered plugins.
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin by name.
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all tools provided by all plugins.
   */
  getAllTools(): Array<{ pluginName: string; tool: import('./types').ToolDefinition }> {
    const tools: Array<{ pluginName: string; tool: import('./types').ToolDefinition }> = [];
    for (const [name, plugin] of this.plugins) {
      if (plugin.tools) {
        for (const tool of plugin.tools) {
          tools.push({ pluginName: name, tool });
        }
      }
    }
    return tools;
  }

  /**
   * Get all plugin manifests.
   */
  getManifests(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(p => p.manifest);
  }

  /**
   * Check if a plugin is registered.
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  // ── Lifecycle ──────────────────────────────────────────────

  /**
   * Initialize all registered plugins by firing the 'init' hook.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(`[PluginManager] Initializing ${this.plugins.size} plugins...`);

    await this.runHook('init', {
      timestamp: Date.now(),
      pluginCount: this.plugins.size,
    });

    this.initialized = true;
    console.log('[PluginManager] All plugins initialized');
  }

  /**
   * Shutdown all registered plugins by firing the 'shutdown' hook.
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    console.log(`[PluginManager] Shutting down ${this.plugins.size} plugins...`);

    await this.runHook('shutdown', {
      timestamp: Date.now(),
    });

    this.initialized = false;
    console.log('[PluginManager] All plugins shut down');
  }
}

/**
 * Singleton plugin manager instance.
 */
export const pluginManager = new PluginManager();
