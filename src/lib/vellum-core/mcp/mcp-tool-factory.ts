/**
 * MCP Integration — Tool Factory
 * ================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The tool factory creates Tool objects from MCP server metadata.
 * These tools can be used by the agent pipeline just like native
 * tools — they're indistinguishable from built-in tools to the agent.
 *
 * Key features:
 *   - Creates Tool objects from MCP tool metadata
 *   - Namespaced tool names prevent collisions
 *   - Risk level from server configuration applied to tools
 *   - Execution delegated to the MCP client
 *   - Input validation against the tool's JSON Schema
 *
 * Integration points:
 *   - Tools integrate with the Plugin System's tool provisioning
 *   - Compatible with the agent executor's tool dispatch
 *   - Works with the existing Agent-Reach tool bridge
 */

import {
  type McpToolMetadata,
  type McpServerConfig,
  type McpToolResult,
  createNamespacedToolName,
} from './types';
import type { McpClient } from './mcp-client';

// ── Tool Interface ──────────────────────────────────────────────

/**
 * A tool that can be used by the agent pipeline.
 * This is the unified tool interface that both native and MCP tools implement.
 */
export interface Tool {
  /** Unique tool name (namespaced for MCP tools) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Risk level: low, medium, or high */
  riskLevel: 'low' | 'medium' | 'high';
  /** JSON Schema for input validation */
  inputSchema: Record<string, unknown>;
  /** Execute the tool with the given input */
  execute(input: Record<string, unknown>): Promise<ToolExecutionResult>;
  /** Source of this tool (e.g., "mcp:server-id") */
  source: string;
}

/**
 * Result of a tool execution.
 */
export interface ToolExecutionResult {
  /** Whether the execution succeeded */
  success: boolean;
  /** The result data */
  data?: unknown;
  /** Error message if failed */
  error?: string;
  /** Execution duration in ms */
  durationMs: number;
}

// ── Tool Factory Functions ──────────────────────────────────────

/**
 * Create a Tool object from MCP tool metadata.
 *
 * The tool is namespaced as: mcp__<serverId>__<toolName>
 * and delegates execution to the MCP client.
 *
 * @param metadata  Tool metadata from the MCP server
 * @param serverId  The MCP server's ID
 * @param config    The server configuration (for risk level, etc.)
 * @param client    The MCP client to delegate execution to
 * @returns A Tool object that can be used by the agent pipeline
 */
export function createMcpTool(
  metadata: McpToolMetadata,
  serverId: string,
  config: McpServerConfig,
  client: McpClient
): Tool {
  const namespacedName = createNamespacedToolName(serverId, metadata.name);

  return {
    name: namespacedName,
    description: metadata.description,
    riskLevel: config.defaultRiskLevel,
    inputSchema: metadata.inputSchema,
    source: `mcp:${serverId}`,

    async execute(input: Record<string, unknown>): Promise<ToolExecutionResult> {
      const startTime = Date.now();

      try {
        // Validate input against schema (basic validation)
        const validationError = validateInput(input, metadata.inputSchema);
        if (validationError) {
          return {
            success: false,
            error: `Input validation failed: ${validationError}`,
            durationMs: Date.now() - startTime,
          };
        }

        // Delegate to MCP client
        const result: McpToolResult = await client.callTool(serverId, metadata.name, input);

        return {
          success: result.success,
          data: result.data,
          error: result.error,
          durationMs: result.durationMs,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown execution error',
          durationMs: Date.now() - startTime,
        };
      }
    },
  };
}

/**
 * Create Tool objects from all tools provided by an MCP server.
 *
 * @param tools     Array of tool metadata from the server
 * @param serverId  The MCP server's ID
 * @param config    The server configuration
 * @param client    The MCP client for execution
 * @returns Array of Tool objects
 */
export function createMcpToolsFromServer(
  tools: McpToolMetadata[],
  serverId: string,
  config: McpServerConfig,
  client: McpClient
): Tool[] {
  return tools.map(metadata => createMcpTool(metadata, serverId, config, client));
}

/**
 * Create Tool objects from all connected MCP servers.
 * This is the convenience function that scans all servers
 * and creates tools for every available tool.
 *
 * @param client The MCP client with active connections
 * @param serverConfigs Map of server ID to server config
 * @returns Array of all available Tool objects
 */
export function createAllMcpTools(
  client: McpClient,
  serverConfigs: Map<string, McpServerConfig>
): Tool[] {
  const allTools: Tool[] = [];

  for (const [serverId, config] of serverConfigs) {
    const serverTools = client.listTools(serverId);
    const tools = createMcpToolsFromServer(serverTools, serverId, config, client);
    allTools.push(...tools);
  }

  return allTools;
}

// ── Input Validation ────────────────────────────────────────────

/**
 * Basic input validation against a JSON Schema.
 * Only validates required fields and top-level types.
 * Full JSON Schema validation would require a library like ajv.
 */
function validateInput(input: Record<string, unknown>, schema: Record<string, unknown>): string | null {
  if (!schema || schema.type !== 'object') return null; // Skip non-object schemas

  const required = schema.required as string[] | undefined;
  const properties = schema.properties as Record<string, { type?: string }> | undefined;

  // Check required fields
  if (required && Array.isArray(required)) {
    for (const field of required) {
      if (input[field] === undefined || input[field] === null) {
        return `Missing required field: "${field}"`;
      }
    }
  }

  // Check types of provided fields
  if (properties) {
    for (const [key, value] of Object.entries(input)) {
      const propSchema = properties[key];
      if (!propSchema) continue; // Extra fields are allowed

      if (propSchema.type && value !== undefined && value !== null) {
        const actualType = typeof value;
        const expectedType = propSchema.type;

        const typeMap: Record<string, string> = {
          string: 'string',
          number: 'number',
          integer: 'number',
          boolean: 'boolean',
          object: 'object',
          array: 'object', // Arrays are typeof 'object' in JS
        };

        const mappedExpected = typeMap[expectedType];
        if (mappedExpected && actualType !== mappedExpected) {
          return `Field "${key}" expected type "${expectedType}" but got "${actualType}"`;
        }

        // Special case: array check
        if (expectedType === 'array' && !Array.isArray(value)) {
          return `Field "${key}" expected type "array" but got "${actualType}"`;
        }
      }
    }
  }

  return null; // Validation passed
}

// ── Tool Registry Helper ────────────────────────────────────────

/**
 * A simple tool registry that collects tools from all sources
 * (native, MCP, plugins) and provides a unified lookup interface.
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool.
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Tool "${tool.name}" is already registered — replacing`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool by name.
   */
  unregister(name: string): void {
    this.tools.delete(name);
  }

  /**
   * Get a tool by name.
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools.
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by risk level.
   */
  getByRiskLevel(level: 'low' | 'medium' | 'high'): Tool[] {
    return Array.from(this.tools.values()).filter(t => t.riskLevel === level);
  }

  /**
   * Get tools by source.
   */
  getBySource(source: string): Tool[] {
    return Array.from(this.tools.values()).filter(t => t.source.startsWith(source));
  }

  /**
   * Execute a tool by name.
   */
  async execute(name: string, input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${name}`,
        durationMs: 0,
      };
    }
    return tool.execute(input);
  }

  /**
   * Check if a tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get the number of registered tools.
   */
  get size(): number {
    return this.tools.size;
  }
}

/**
 * Singleton tool registry instance.
 */
export const toolRegistry = new ToolRegistry();
