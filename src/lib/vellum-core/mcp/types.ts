/**
 * MCP Integration — Type Definitions
 * ====================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * MCP (Model Context Protocol) integration allows LeadReach agents
 * to connect to external tool servers and dynamically discover and
 * use their capabilities.
 *
 * Supported transports:
 *   - stdio:  Local process communication (for CLI-based MCP servers)
 *   - sse:    Server-Sent Events (for HTTP-based MCP servers)
 *   - streamable-http: Streaming HTTP (for modern MCP servers)
 *
 * Tools from MCP servers are namespaced as: mcp__<serverId>__<toolName>
 * This prevents naming collisions between servers.
 *
 * Integration points:
 *   - Works with the Plugin System for tool provisioning
 *   - Uses the agent infrastructure for logging and configuration
 *   - Compatible with the existing Agent-Reach tool bridge
 */

// ── Transport Types ─────────────────────────────────────────────

/**
 * MCP server transport configuration.
 * Each transport type has its own connection parameters.
 */
export type McpTransport =
  | StdioTransport
  | SseTransport
  | StreamableHttpTransport;

/**
 * STDIO transport — launches a local process and communicates
 * via stdin/stdout. Used for CLI-based MCP servers.
 */
export interface StdioTransport {
  type: 'stdio';
  /** Command to launch the MCP server process */
  command: string;
  /** Arguments to pass to the command */
  args?: string[];
  /** Environment variables to set for the process */
  env?: Record<string, string>;
}

/**
 * SSE transport — connects via Server-Sent Events.
 * Used for HTTP-based MCP servers that support SSE.
 */
export interface SseTransport {
  type: 'sse';
  /** URL of the MCP server's SSE endpoint */
  url: string;
  /** HTTP headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Streamable HTTP transport — connects via streaming HTTP.
 * Used for modern MCP servers that support streaming responses.
 */
export interface StreamableHttpTransport {
  type: 'streamable-http';
  /** URL of the MCP server's HTTP endpoint */
  url: string;
  /** HTTP headers to include in requests */
  headers?: Record<string, string>;
}

// ── Server Configuration ────────────────────────────────────────

/**
 * Configuration for an MCP server connection.
 */
export interface McpServerConfig {
  /** Unique identifier for this server */
  id: string;
  /** Human-readable name */
  name: string;
  /** Transport configuration */
  transport: McpTransport;
  /** Whether this server is enabled */
  enabled: boolean;
  /** Default risk level for tools from this server */
  defaultRiskLevel: 'low' | 'medium' | 'high';
  /** Maximum number of tools to expose from this server */
  maxTools: number;
  /** Allowlist of tool names (if set, only these tools are exposed) */
  allowedTools?: string[];
  /** Blocklist of tool names (these tools are never exposed) */
  blockedTools?: string[];
}

// ── Tool Metadata ───────────────────────────────────────────────

/**
 * Metadata describing an MCP tool.
 * This is the information returned by the MCP server's
 * tools/list endpoint.
 */
export interface McpToolMetadata {
  /** Tool name as defined by the MCP server */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** JSON Schema for the tool's input parameters */
  inputSchema: Record<string, unknown>;
}

// ── Connection State ────────────────────────────────────────────

/**
 * Connection state of an MCP server.
 */
export type McpConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Health status of an MCP server connection.
 */
export interface McpServerHealth {
  /** Server ID */
  serverId: string;
  /** Current connection state */
  state: McpConnectionState;
  /** Number of available tools */
  toolCount: number;
  /** Last successful health check timestamp */
  lastHealthCheckAt: number;
  /** Last error message (if any) */
  lastError?: string;
  /** Connection uptime in ms */
  uptimeMs: number;
}

// ── Tool Execution Result ───────────────────────────────────────

/**
 * Result of calling an MCP tool.
 */
export interface McpToolResult {
  /** Whether the call succeeded */
  success: boolean;
  /** The result data (if successful) */
  data?: unknown;
  /** Error message (if failed) */
  error?: string;
  /** Execution duration in ms */
  durationMs: number;
  /** Server that handled the call */
  serverId: string;
  /** Tool that was called */
  toolName: string;
}

// ── Namespaced Tool Name ────────────────────────────────────────

/**
 * Create a namespaced tool name: mcp__<serverId>__<toolName>
 * This prevents naming collisions between different MCP servers.
 */
export function createNamespacedToolName(serverId: string, toolName: string): string {
  return `mcp__${serverId}__${toolName}`;
}

/**
 * Parse a namespaced tool name into its components.
 * Returns null if the name doesn't match the expected format.
 */
export function parseNamespacedToolName(namespacedName: string): { serverId: string; toolName: string } | null {
  const parts = namespacedName.split('__');
  if (parts.length !== 3 || parts[0] !== 'mcp') return null;
  return { serverId: parts[1], toolName: parts[2] };
}
