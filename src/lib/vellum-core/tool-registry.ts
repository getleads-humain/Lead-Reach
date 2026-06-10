/**
 * Vellum Core — Tool Registry System
 *
 * Adapted from Vellum Assistant's tool management architecture
 * for LeadReach AI's 8-agent pipeline.
 *
 * Provides:
 *   - Global singleton Map for tool registration
 *   - Ownership tracking (core/skill/plugin/mcp/workspace)
 *   - Reference counting for skill/plugin tools
 *   - Methods: registerTool(), registerSkillTools(), registerPluginTools(),
 *     registerMcpTools(), getTool(), getAllTools(), removeTool()
 *   - ToolDefinition → Tool resolution with full typing
 *
 * This module is ADDITIVE — it does not modify any existing
 * LeadReach tool or function registration systems.
 */

import type { ToolDefinition, Tool, ToolOwnership, ToolContext, ToolExecutionResult } from './types';

// ============================================================
// Internal Types
// ============================================================

/** Internal registry entry with metadata */
interface RegistryEntry {
  tool: Tool;
  registeredAt: number;
}

// ============================================================
// ToolRegistry Class
// ============================================================

/**
 * Global tool registry for the Vellum Core module.
 *
 * Manages the lifecycle of tools across the agent pipeline:
 *   - Core tools: Always available, registered at startup
 *   - Skill tools: Registered when a skill is loaded, reference-counted
 *   - Plugin tools: Registered when a plugin is loaded, reference-counted
 *   - MCP tools: Registered from MCP server connections
 *   - Workspace tools: User-defined custom tools
 *
 * Reference counting ensures that tools shared across multiple
 * skills/plugins are only removed when the last owner unregisters.
 */
export class ToolRegistry {
  /** Map of tool name → registry entry */
  private readonly tools = new Map<string, RegistryEntry>();

  /** Map of owner ref → set of tool names (for bulk unregister) */
  private readonly ownerTools = new Map<string, Set<string>>();

  /** Event listeners for registry changes */
  private readonly listeners = new Set<(event: RegistryEvent) => void>();

  constructor() {}

  // ── Registration Methods ──────────────────────────────────

  /**
   * Register a single tool in the registry.
   *
   * If a tool with the same name already exists, it will be
   * overwritten (with a warning) unless the existing tool has
   * a different owner and is still referenced.
   *
   * @param definition - The tool definition to register
   * @param ownership - Who owns this tool (core/skill/plugin/mcp/workspace)
   * @param ownerRef - Identifier for the owning entity (e.g., skill ID)
   * @returns The fully resolved Tool object
   */
  registerTool(
    definition: ToolDefinition,
    ownership: ToolOwnership,
    ownerRef: string,
  ): Tool {
    const existing = this.tools.get(definition.name);

    if (existing) {
      // If the same owner is re-registering, just update
      if (existing.tool.ownerRef === ownerRef) {
        const updatedTool: Tool = {
          ...existing.tool,
          name: definition.name,
          description: definition.description,
          input_schema: definition.input_schema,
          execute: definition.execute || (async () => ({ content: 'No execute function', isError: true })),
          defaultRiskLevel: definition.defaultRiskLevel || 'medium',
          category: definition.category || 'general',
          ownership,
          ownerRef,
          refCount: existing.tool.refCount,
        };

        this.tools.set(definition.name, {
          tool: updatedTool,
          registeredAt: Date.now(),
        });

        this.emitChange('tool_updated', definition.name, ownership, ownerRef);
        return updatedTool;
      }

      // Different owner — increment reference count
      const updatedTool: Tool = {
        ...existing.tool,
        refCount: existing.tool.refCount + 1,
      };

      this.tools.set(definition.name, {
        tool: updatedTool,
        registeredAt: existing.registeredAt,
      });

      // Track this owner's tools
      this.addOwnerTool(ownerRef, definition.name);

      this.emitChange('tool_ref_incremented', definition.name, ownership, ownerRef);
      return updatedTool;
    }

    // New tool registration
    const tool: Tool = {
      name: definition.name,
      description: definition.description,
      input_schema: definition.input_schema,
      execute: definition.execute || (async () => ({ content: 'No execute function', isError: true })),
      defaultRiskLevel: definition.defaultRiskLevel || 'medium',
      category: definition.category || 'general',
      ownership,
      ownerRef,
      refCount: 1,
    };

    this.tools.set(definition.name, {
      tool,
      registeredAt: Date.now(),
    });

    this.addOwnerTool(ownerRef, definition.name);
    this.emitChange('tool_registered', definition.name, ownership, ownerRef);

    return tool;
  }

  /**
   * Register multiple tools from a skill.
   * All tools are owned by the skill and share its lifecycle.
   *
   * @param skillId - The skill's unique identifier
   * @param definitions - Array of tool definitions from the skill
   * @returns Array of resolved Tool objects
   */
  registerSkillTools(
    skillId: string,
    definitions: ToolDefinition[],
  ): Tool[] {
    return definitions.map(def =>
      this.registerTool(def, 'skill', skillId),
    );
  }

  /**
   * Register multiple tools from a plugin.
   * All tools are owned by the plugin and share its lifecycle.
   *
   * @param pluginId - The plugin's unique identifier
   * @param definitions - Array of tool definitions from the plugin
   * @returns Array of resolved Tool objects
   */
  registerPluginTools(
    pluginId: string,
    definitions: ToolDefinition[],
  ): Tool[] {
    return definitions.map(def =>
      this.registerTool(def, 'plugin', pluginId),
    );
  }

  /**
   * Register tools from an MCP (Model Context Protocol) server.
   *
   * @param serverId - The MCP server's unique identifier
   * @param definitions - Array of tool definitions from the server
   * @returns Array of resolved Tool objects
   */
  registerMcpTools(
    serverId: string,
    definitions: ToolDefinition[],
  ): Tool[] {
    return definitions.map(def =>
      this.registerTool(def, 'mcp', serverId),
    );
  }

  // ── Lookup Methods ────────────────────────────────────────

  /**
   * Get a tool by name.
   *
   * @param name - The tool's unique name
   * @returns The Tool object, or undefined if not found
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name)?.tool;
  }

  /**
   * Get all registered tools.
   *
   * @returns Array of all Tool objects
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values()).map(entry => entry.tool);
  }

  /**
   * Get all tools belonging to a specific owner.
   *
   * @param ownerRef - The owner's unique identifier
   * @returns Array of Tool objects owned by the specified entity
   */
  getToolsByOwner(ownerRef: string): Tool[] {
    const toolNames = this.ownerTools.get(ownerRef);
    if (!toolNames) return [];
    return Array.from(toolNames)
      .map(name => this.tools.get(name)?.tool)
      .filter((t): t is Tool => t !== undefined);
  }

  /**
   * Get all tools of a specific ownership category.
   *
   * @param ownership - The ownership category to filter by
   * @returns Array of Tool objects with the specified ownership
   */
  getToolsByOwnership(ownership: ToolOwnership): Tool[] {
    return this.getAllTools().filter(tool => tool.ownership === ownership);
  }

  /**
   * Get tool definitions in the format expected by the Z.AI API.
   * Used when building the tools parameter for LLM calls.
   *
   * @returns Array of tool definitions in OpenAI function format
   */
  getToolDefinitionsForAPI(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }> {
    return this.getAllTools().map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));
  }

  /**
   * Check if a tool with the given name exists in the registry.
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get the number of registered tools.
   */
  get size(): number {
    return this.tools.size;
  }

  // ── Removal Methods ───────────────────────────────────────

  /**
   * Remove a tool from the registry.
   *
   * For reference-counted tools (skill, plugin, mcp), this decrements
   * the reference count. The tool is only actually removed when the
   * count reaches zero.
   *
   * @param name - The tool name to remove
   * @param ownerRef - The owner requesting removal
   * @returns true if the tool was actually removed, false if still referenced
   */
  removeTool(name: string, ownerRef: string): boolean {
    const entry = this.tools.get(name);
    if (!entry) return false;

    // Remove from owner's tool set
    this.removeOwnerTool(ownerRef, name);

    // Decrement reference count
    if (entry.tool.refCount > 1) {
      entry.tool.refCount -= 1;
      this.emitChange('tool_ref_decremented', name, entry.tool.ownership, ownerRef);
      return false; // Not fully removed
    }

    // Last reference — actually remove
    this.tools.delete(name);
    this.emitChange('tool_removed', name, entry.tool.ownership, ownerRef);
    return true;
  }

  /**
   * Remove all tools belonging to a specific skill.
   *
   * @param skillId - The skill's unique identifier
   * @returns Number of tools actually removed
   */
  removeSkillTools(skillId: string): number {
    return this.removeAllOwnerTools(skillId);
  }

  /**
   * Remove all tools belonging to a specific plugin.
   *
   * @param pluginId - The plugin's unique identifier
   * @returns Number of tools actually removed
   */
  removePluginTools(pluginId: string): number {
    return this.removeAllOwnerTools(pluginId);
  }

  /**
   * Remove all tools from an MCP server.
   *
   * @param serverId - The MCP server's unique identifier
   * @returns Number of tools actually removed
   */
  removeMcpTools(serverId: string): number {
    return this.removeAllOwnerTools(serverId);
  }

  // ── Execution Methods ─────────────────────────────────────

  /**
   * Execute a tool by name with the given input and context.
   *
   * @param name - The tool name to execute
   * @param input - The input parameters
   * @param context - The execution context
   * @returns ToolExecutionResult from the tool's execute function
   * @throws Error if the tool is not found or has no execute function
   */
  async executeTool(
    name: string,
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name)?.tool;
    if (!tool) {
      return {
        content: `Tool "${name}" not found in registry`,
        isError: true,
      };
    }

    try {
      const result = await tool.execute(input, context);
      return result;
    } catch (error) {
      return {
        content: `Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true,
        riskLevel: tool.defaultRiskLevel,
      };
    }
  }

  // ── Event Listener Methods ────────────────────────────────

  /**
   * Register a listener for registry change events.
   *
   * @param listener - Callback function for registry events
   * @returns Unsubscribe function
   */
  onRegistryChange(listener: (event: RegistryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── Cleanup ───────────────────────────────────────────────

  /**
   * Clear all tools from the registry.
   * Use with caution — typically only for testing.
   */
  clear(): void {
    this.tools.clear();
    this.ownerTools.clear();
    this.emitChange('registry_cleared', '', 'core', 'system');
  }

  // ── Private Helpers ───────────────────────────────────────

  private addOwnerTool(ownerRef: string, toolName: string): void {
    let toolSet = this.ownerTools.get(ownerRef);
    if (!toolSet) {
      toolSet = new Set();
      this.ownerTools.set(ownerRef, toolSet);
    }
    toolSet.add(toolName);
  }

  private removeOwnerTool(ownerRef: string, toolName: string): void {
    const toolSet = this.ownerTools.get(ownerRef);
    if (toolSet) {
      toolSet.delete(toolName);
      if (toolSet.size === 0) {
        this.ownerTools.delete(ownerRef);
      }
    }
  }

  private removeAllOwnerTools(ownerRef: string): number {
    const toolNames = this.ownerTools.get(ownerRef);
    if (!toolNames) return 0;

    let removedCount = 0;
    Array.from(toolNames).forEach(name => {
      const entry = this.tools.get(name);
      if (entry) {
        if (entry.tool.refCount <= 1) {
          this.tools.delete(name);
          removedCount++;
        } else {
          entry.tool.refCount -= 1;
        }
      }
    });

    this.ownerTools.delete(ownerRef);
    return removedCount;
  }

  private emitChange(
    action: RegistryEvent['action'],
    toolName: string,
    ownership: ToolOwnership,
    ownerRef: string,
  ): void {
    const event: RegistryEvent = {
      action,
      toolName,
      ownership,
      ownerRef,
      timestamp: Date.now(),
    };

    Array.from(this.listeners).forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('[ToolRegistry] Listener error:', error instanceof Error ? error.message : 'Unknown');
      }
    });
  }
}

// ============================================================
// Registry Event Type
// ============================================================

/** Event emitted when the tool registry changes */
export interface RegistryEvent {
  action:
    | 'tool_registered'
    | 'tool_updated'
    | 'tool_removed'
    | 'tool_ref_incremented'
    | 'tool_ref_decremented'
    | 'registry_cleared';
  toolName: string;
  ownership: ToolOwnership;
  ownerRef: string;
  timestamp: number;
}

// ============================================================
// Global Singleton
// ============================================================

let globalRegistry: ToolRegistry | null = null;

/**
 * Get the global ToolRegistry singleton.
 * Creates one on first access.
 */
export function getToolRegistry(): ToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new ToolRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global ToolRegistry (primarily for testing).
 */
export function resetToolRegistry(): void {
  if (globalRegistry) {
    globalRegistry.clear();
    globalRegistry = null;
  }
}

// ============================================================
// Core Tools — Registered at Startup
// ============================================================

/**
 * Register the core set of tools that are always available
 * in the LeadReach AI pipeline.
 */
export function registerCoreTools(registry: ToolRegistry = getToolRegistry()): void {
  // Web Search tool
  registry.registerTool(
    {
      name: 'web_search',
      description: 'Search the web for information about companies, people, or markets. Returns relevant search results with snippets.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
          maxResults: { type: 'number', description: 'Maximum number of results (1-10)', default: 5 },
        },
        required: ['query'],
      },
      defaultRiskLevel: 'low',
      category: 'research',
    },
    'core',
    'vellum-core',
  );

  // Company Research tool
  registry.registerTool(
    {
      name: 'company_research',
      description: 'Research a company by name. Returns company details including industry, size, revenue, and key contacts.',
      input_schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'The company name to research' },
          depth: { type: 'string', enum: ['quick', 'standard', 'deep'], description: 'Research depth level', default: 'standard' },
        },
        required: ['companyName'],
      },
      defaultRiskLevel: 'low',
      category: 'research',
    },
    'core',
    'vellum-core',
  );

  // Person Research tool
  registry.registerTool(
    {
      name: 'person_research',
      description: 'Research a person by name. Returns professional details including title, company, and contact information.',
      input_schema: {
        type: 'object',
        properties: {
          personName: { type: 'string', description: 'The person name to research' },
          company: { type: 'string', description: 'Optional company context for disambiguation' },
        },
        required: ['personName'],
      },
      defaultRiskLevel: 'low',
      category: 'research',
    },
    'core',
    'vellum-core',
  );

  // Market Analysis tool
  registry.registerTool(
    {
      name: 'market_analysis',
      description: 'Analyze a market or industry. Returns market size, trends, key players, and opportunities.',
      input_schema: {
        type: 'object',
        properties: {
          market: { type: 'string', description: 'The market or industry to analyze' },
          region: { type: 'string', description: 'Geographic region focus' },
        },
        required: ['market'],
      },
      defaultRiskLevel: 'low',
      category: 'analysis',
    },
    'core',
    'vellum-core',
  );

  // Lead Scoring tool
  registry.registerTool(
    {
      name: 'lead_score',
      description: 'Score a lead against an ICP (Ideal Customer Profile). Returns a numerical score and tier classification.',
      input_schema: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'The company to score' },
          icpName: { type: 'string', description: 'The ICP to score against' },
        },
        required: ['companyName'],
      },
      defaultRiskLevel: 'medium',
      category: 'scoring',
    },
    'core',
    'vellum-core',
  );

  // Outreach Composition tool
  registry.registerTool(
    {
      name: 'outreach_compose',
      description: 'Compose a personalized outreach message (email or LinkedIn). Uses research data for personalization.',
      input_schema: {
        type: 'object',
        properties: {
          targetName: { type: 'string', description: 'The recipient name' },
          channel: { type: 'string', enum: ['email', 'linkedin'], description: 'The outreach channel' },
          tone: { type: 'string', enum: ['professional', 'casual', 'formal'], description: 'Message tone', default: 'professional' },
        },
        required: ['targetName', 'channel'],
      },
      defaultRiskLevel: 'medium',
      category: 'outreach',
    },
    'core',
    'vellum-core',
  );

  // ICP Builder tool
  registry.registerTool(
    {
      name: 'icp_build',
      description: 'Build or refine an Ideal Customer Profile. Returns structured ICP criteria for lead scoring.',
      input_schema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Description of the target customer profile' },
          existingIcpId: { type: 'string', description: 'Optional existing ICP to refine' },
        },
        required: ['description'],
      },
      defaultRiskLevel: 'medium',
      category: 'strategy',
    },
    'core',
    'vellum-core',
  );
}
