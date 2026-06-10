/**
 * MCP Integration — Main Entry Point
 * =====================================
 * Unified exports for the MCP (Model Context Protocol) integration.
 *
 * MCP allows LeadReach agents to connect to external tool servers
 * and dynamically discover and use their capabilities. Tools from
 * MCP servers are namespaced as: mcp__<serverId>__<toolName>
 *
 * Usage:
 *   import { mcpClient, toolRegistry, createMcpTool } from '@/lib/vellum-core/mcp';
 *   await mcpClient.connect(serverConfig);
 *   const tools = createMcpToolsFromServer(metadata, 'my-server', config, mcpClient);
 *   tools.forEach(t => toolRegistry.register(t));
 */

// ── Types ───────────────────────────────────────────────────────
export type {
  McpTransport,
  StdioTransport,
  SseTransport,
  StreamableHttpTransport,
  McpServerConfig,
  McpToolMetadata,
  McpConnectionState,
  McpServerHealth,
  McpToolResult,
} from './types';

export {
  createNamespacedToolName,
  parseNamespacedToolName,
} from './types';

// ── MCP Client ──────────────────────────────────────────────────
export {
  McpClient,
  mcpClient,
} from './mcp-client';

// ── Tool Factory ────────────────────────────────────────────────
export {
  createMcpTool,
  createMcpToolsFromServer,
  createAllMcpTools,
  ToolRegistry,
  toolRegistry,
} from './mcp-tool-factory';

export type {
  Tool,
  ToolExecutionResult,
} from './mcp-tool-factory';
