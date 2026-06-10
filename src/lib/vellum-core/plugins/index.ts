/**
 * Plugin System — Main Entry Point
 * ==================================
 * Unified exports for the Vellum-style plugin system.
 *
 * The Plugin System provides a hook-based extension mechanism for
 * the agent pipeline. Plugins can react to lifecycle events, inject
 * context into prompts, and provide additional tools.
 *
 * Usage:
 *   import { pluginManager, registerDefaultPlugins } from '@/lib/vellum-core/plugins';
 *   registerDefaultPlugins(pluginManager);
 *   await pluginManager.initialize();
 */

// ── Types ───────────────────────────────────────────────────────
export type {
  PluginHook,
  TrustLevel,
  TurnMode,
  TurnContext,
  InjectionPlacement,
  InjectionBlock,
  Injector,
  ToolDefinition,
  PluginHookFn,
  Plugin,
  PluginManifest,
} from './types';

// ── Plugin Manager ──────────────────────────────────────────────
export { pluginManager } from './plugin-manager';

// ── Default Plugins ─────────────────────────────────────────────
export {
  CompactionPlugin,
  MemoryRetrievalPlugin,
  TitleGeneratePlugin,
  ToolErrorPlugin,
  HistoryRepairPlugin,
  EmptyResponsePlugin,
  DEFAULT_PLUGINS,
  registerDefaultPlugins,
} from './default-plugins';
