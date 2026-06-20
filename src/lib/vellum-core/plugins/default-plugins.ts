/**
 * Plugin System — Built-in Default Plugins
 * ==========================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * These plugins provide essential functionality for the agent
 * pipeline. They are registered automatically on startup and
 * cannot be unregistered by users.
 *
 * Default plugins:
 *   1. CompactionPlugin      — Handles conversation compaction
 *   2. MemoryRetrievalPlugin — Injects memory into context
 *   3. TitleGeneratePlugin   — Generates conversation titles
 *   4. ToolErrorPlugin       — Handles tool execution errors
 *   5. HistoryRepairPlugin   — Repairs broken conversation history
 *   6. EmptyResponsePlugin   — Handles empty LLM responses
 *
 * Integration points:
 *   - Uses `@/lib/llm` for LLM-dependent operations
 *   - Uses `@/lib/db` for data access
 *   - Coordinates with the proactivity engine for follow-ups
 */

import { callLLM } from '@/lib/llm';
import { db } from '@/lib/db';
import {
  type Plugin,
  type PluginHook,
  type PluginHookFn,
  type InjectionBlock,
  type TurnContext,
  type Injector,
} from './types';

// ── 1. Compaction Plugin ────────────────────────────────────────

/**
 * Handles conversation compaction when the context gets too long.
 * Compresses older messages into a summary to stay within token limits.
 */
export const CompactionPlugin: Plugin = {
  manifest: {
    name: 'compaction',
    version: '1.0.0',
    description: 'Handles conversation compaction when context exceeds token limits',
  },
  hooks: {
    'post-compact': (async (context: { conversationId: string; messageCount: number; compactedCount: number }) => {
      console.log(
        `[CompactionPlugin] Compacted ${context.compactedCount} messages in conversation ${context.conversationId} (was ${context.messageCount} messages)`
      );

      // Log the compaction event
      try {
        await db.agentLog.create({
          data: {
            agentName: 'pipeline-manager',
            level: 'info',
            category: 'memory',
            message: `Conversation compacted: ${context.compactedCount} messages summarized`,
            metadata: JSON.stringify({
              conversationId: context.conversationId,
              messageCount: context.messageCount,
              compactedCount: context.compactedCount,
            }),
          },
        });
      } catch {
        // Non-critical
      }

      return [];
    }) as PluginHookFn,
  },
  injectors: [
    {
      name: 'compaction-hint',
      order: 200,
      produce: async (context: TurnContext) => {
        // Inject a hint about compaction if the conversation is getting long
        if (context.turnIndex > 50) {
          return [{
            id: `compaction-hint-${context.requestId}`,
            text: '[System: This conversation is getting long. Consider summarizing earlier context.]',
            placement: 'after-memory-prefix' as const,
          }];
        }
        return [];
      },
    },
  ],
};

// ── 2. Memory Retrieval Plugin ──────────────────────────────────

/**
 * Injects relevant memory/context into the agent's turn.
 * Retrieves recent activity, pipeline state, and user preferences.
 */
export const MemoryRetrievalPlugin: Plugin = {
  manifest: {
    name: 'memory-retrieval',
    version: '1.0.0',
    description: 'Injects relevant memory and context into agent turns',
  },
  hooks: {
    'user-prompt-submit': (async (context: TurnContext) => {
      // Pre-fetch memory for this conversation — no injection needed here
      // The injector will handle the actual injection
      return [];
    }) as PluginHookFn,
  },
  injectors: [
    {
      name: 'memory-context',
      order: 10, // Run early so other injectors can build on it
      produce: async (context: TurnContext) => {
        const memoryParts: string[] = [];

        try {
          // Retrieve recent leads for this scope
          const recentLeads = await db.lead.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: context.channelName === 'lead'
              ? { id: context.conversationId }
              : {},
          });

          if (recentLeads.length > 0) {
            memoryParts.push(`Recent leads: ${recentLeads.map(l => `${l.companyName} (${l.stage}/${l.leadTier})`).join(', ')}`);
          }

          // Retrieve active campaigns
          const activeCampaigns = await db.campaign.findMany({
            where: { status: 'active' },
            take: 3,
          });

          if (activeCampaigns.length > 0) {
            memoryParts.push(`Active campaigns: ${activeCampaigns.map(c => c.name).join(', ')}`);
          }

          // Retrieve user profile context
          const profile = await db.userProfile.findUnique({ where: { id: 'default' } });
          if (profile && profile.companyName) {
            memoryParts.push(`User company: ${profile.companyName} (${profile.companyIndustry || 'Unknown industry'})`);
          }
        } catch {
          // Memory retrieval failure should not block the agent
          memoryParts.push('[Memory retrieval partial — some context may be unavailable]');
        }

        if (memoryParts.length === 0) return [];

        return [{
          id: `memory-${context.requestId}`,
          text: `[Memory Context]\n${memoryParts.join('\n')}\n[End Memory Context]`,
          placement: 'after-memory-prefix' as const,
        }];
      },
    },
  ],
};

// ── 3. Title Generate Plugin ────────────────────────────────────

/**
 * Generates a title for new conversations.
 * Fires after the first user message in a conversation.
 */
export const TitleGeneratePlugin: Plugin = {
  manifest: {
    name: 'title-generate',
    version: '1.0.0',
    description: 'Generates conversation titles based on the first user message',
  },
  hooks: {
    'user-prompt-submit': (async (context: TurnContext & { userMessage?: string }) => {
      // Only generate title on the first turn
      if (context.turnIndex !== 0) return [];

      const userMessage = context.userMessage || '';
      if (!userMessage || userMessage.length < 5) return [];

      try {
        const title = await callLLM({
          systemPrompt: 'Generate a very short title (3-6 words) for a conversation that starts with the following message. Return ONLY the title, nothing else.',
          userMessage: userMessage.slice(0, 200),
          temperature: 0.3,
          maxTokens: 30,
          thinkingBudget: 'quick',
        });

        if (title) {
          // Update the discovery session title if applicable
          try {
            await db.discoverySession.update({
              where: { id: context.conversationId },
              data: { title: title.trim().replace(/^["']|["']$/g, '') },
            });
          } catch {
            // Session may not exist — non-critical
          }
        }
      } catch {
        // Title generation failure is non-critical
      }

      return [];
    }) as PluginHookFn,
  },
};

// ── 4. Tool Error Plugin ────────────────────────────────────────

/**
 * Handles tool execution errors gracefully.
 * Provides error context to the agent so it can decide how to recover.
 */
export const ToolErrorPlugin: Plugin = {
  manifest: {
    name: 'tool-error',
    version: '1.0.0',
    description: 'Handles tool execution errors and provides recovery context',
  },
  hooks: {
    'post-tool-use': (async (context: {
      toolName: string;
      success: boolean;
      error?: string;
      input?: Record<string, unknown>;
    }) => {
      if (context.success) return [];

      const errorMsg = context.error ?? 'Unknown error';

      // Log the tool error
      try {
        await db.agentLog.create({
          data: {
            agentName: 'pipeline-manager',
            level: 'warn',
            category: 'execution',
            message: `Tool "${context.toolName}" failed: ${errorMsg.slice(0, 200)}`,
            metadata: JSON.stringify({
              toolName: context.toolName,
              error: errorMsg,
              input: context.input,
            }),
          },
        });
      } catch {
        // Non-critical
      }

      // Return an injection block with error context
      return [{
        id: `tool-error-${Date.now()}`,
        text: `[Tool Error] The tool "${context.toolName}" failed with error: ${errorMsg.slice(0, 500)}. Consider retrying with different parameters or using an alternative approach.`,
        placement: 'append-user-tail' as const,
      }];
    }) as PluginHookFn,
  },
};

// ── 5. History Repair Plugin ────────────────────────────────────

/**
 * Repairs broken conversation history.
 * Detects and fixes common issues like:
 *   - Missing role fields
 *   - Consecutive messages with the same role
 *   - Empty messages
 */
export const HistoryRepairPlugin: Plugin = {
  manifest: {
    name: 'history-repair',
    version: '1.0.0',
    description: 'Repairs broken conversation history before LLM calls',
  },
  hooks: {
    'pre-model-call': (async (context: {
      messages: Array<{ role: string; content: string }>;
    }) => {
      if (!context.messages || !Array.isArray(context.messages)) return [];

      const repaired: Array<{ role: string; content: string }> = [];
      let repairedCount = 0;

      for (const msg of context.messages) {
        // Skip empty messages
        if (!msg.content || msg.content.trim().length === 0) {
          repairedCount++;
          continue;
        }

        // Ensure role is valid
        const validRoles = ['system', 'user', 'assistant'];
        const role = validRoles.includes(msg.role) ? msg.role : 'user';

        // Check for consecutive same-role messages
        const lastRole = repaired.length > 0 ? repaired[repaired.length - 1].role : null;
        if (role === lastRole && role === 'assistant') {
          // Merge consecutive assistant messages
          repaired[repaired.length - 1].content += '\n\n' + msg.content;
          repairedCount++;
          continue;
        }

        repaired.push({ role, content: msg.content });
      }

      // Ensure the conversation starts with a system message
      if (repaired.length > 0 && repaired[0].role !== 'system') {
        repaired.unshift({ role: 'system', content: 'You are a helpful B2B sales assistant.' });
        repairedCount++;
      }

      if (repairedCount > 0) {
        console.log(`[HistoryRepairPlugin] Repaired ${repairedCount} issues in conversation history`);

        // Return the repaired messages as an override
        return [{
          id: `history-repair-${Date.now()}`,
          text: '',
          placement: 'replace-run-messages' as const,
          messagesOverride: repaired,
        }];
      }

      return [];
    }) as PluginHookFn,
  },
};

// ── 6. Empty Response Plugin ────────────────────────────────────

/**
 * Handles empty LLM responses.
 * When the LLM returns an empty or whitespace-only response,
 * this plugin injects a retry hint.
 */
export const EmptyResponsePlugin: Plugin = {
  manifest: {
    name: 'empty-response',
    version: '1.0.0',
    description: 'Handles empty LLM responses by providing retry context',
  },
  hooks: {
    'post-model-call': (async (context: {
      response: string;
      model: string;
      requestId: string;
    }) => {
      const response = context.response ?? '';
      if (response.trim().length > 0) return [];

      console.warn(`[EmptyResponsePlugin] LLM returned empty response (model=${context.model}, requestId=${context.requestId})`);

      // Log the empty response
      try {
        await db.agentLog.create({
          data: {
            agentName: 'pipeline-manager',
            level: 'warn',
            category: 'model',
            message: 'LLM returned empty response',
            metadata: JSON.stringify({
              model: context.model,
              requestId: context.requestId,
            }),
          },
        });
      } catch {
        // Non-critical
      }

      return [{
        id: `empty-response-${Date.now()}`,
        text: '[System: The model returned an empty response. Please retry the request or rephrase the question.]',
        placement: 'append-user-tail' as const,
      }];
    }) as PluginHookFn,
  },
};

// ── All Default Plugins ─────────────────────────────────────────

/**
 * Array of all built-in default plugins.
 * These are registered automatically when the plugin manager initializes.
 */
export const DEFAULT_PLUGINS: Plugin[] = [
  CompactionPlugin,
  MemoryRetrievalPlugin,
  TitleGeneratePlugin,
  ToolErrorPlugin,
  HistoryRepairPlugin,
  EmptyResponsePlugin,
];

/**
 * Register all default plugins with the plugin manager.
 * Called during initialization.
 */
export function registerDefaultPlugins(manager: { registerPlugin: (plugin: Plugin) => void }): void {
  for (const plugin of DEFAULT_PLUGINS) {
    try {
      manager.registerPlugin(plugin);
    } catch (error) {
      console.error(
        `[DefaultPlugins] Failed to register "${plugin.manifest.name}":`,
        error instanceof Error ? error.message : error
      );
    }
  }
  console.log(`[DefaultPlugins] Registered ${DEFAULT_PLUGINS.length} default plugins`);
}
