/**
 * MCP Integration — MCP Client
 * ==============================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The McpClient manages connections to MCP (Model Context Protocol)
 * servers. It handles:
 *   - Connection lifecycle (connect, disconnect, reconnect)
 *   - Tool discovery (listing available tools from servers)
 *   - Tool execution (calling tools on remote servers)
 *   - Health checking and automatic reconnection
 *   - Namespaced tool naming to prevent collisions
 *
 * Transport support:
 *   - stdio:  For local CLI-based MCP servers
 *   - sse:    For HTTP-based servers with Server-Sent Events
 *   - streamable-http: For modern HTTP streaming servers
 *
 * IMPORTANT: In the LeadReach sandbox environment, only HTTP-based
 * transports (sse, streamable-http) are fully supported. STDIO
 * transport requires local process execution which may be restricted.
 *
 * Integration points:
 *   - Uses `@/lib/agent-infrastructure/logs` patterns for logging
 *   - Works with `mcp-tool-factory.ts` for tool creation
 *   - Compatible with the Plugin System's tool provisioning
 */

import {
  type McpServerConfig,
  type McpToolMetadata,
  type McpConnectionState,
  type McpServerHealth,
  type McpToolResult,
  type McpTransport,
  createNamespacedToolName,
} from './types';
import { assertSafeUrl } from '@/lib/url-guard';

// ── HTTP Client for MCP ─────────────────────────────────────────

/**
 * Make an HTTP request to an MCP server.
 * Handles SSE and streamable-http transports.
 *
 * SSRF protection: every outbound URL is validated via `assertSafeUrl`
 * before the request is dispatched — this prevents the MCP client from
 * being abused to reach internal services (cloud metadata, RFC1918
 * ranges, loopback, link-local, etc.).
 */
async function mcpHttpRequest(
  url: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<Record<string, unknown>> {
  // SSRF guard — refuse internal/disallowed URLs before fetching.
  await assertSafeUrl(url);

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers ?? {}),
  };

  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000), // 30s timeout
    redirect: 'manual', // re-validate every redirect hop
  });

  // Manually follow redirects so each hop is SSRF-checked.
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      const next = new URL(location, url).toString();
      return mcpHttpRequest(next, method, body, headers);
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`MCP server returned ${response.status}: ${errorText.slice(0, 200)}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

// ── MCP Server Connection ───────────────────────────────────────

/**
 * Represents a connection to a single MCP server.
 * Manages the connection lifecycle and tool caching.
 */
class McpServerConnection {
  readonly config: McpServerConfig;
  state: McpConnectionState = 'disconnected';
  tools: McpToolMetadata[] = [];
  lastError?: string;
  connectedAt?: number;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: McpServerConfig) {
    this.config = config;
  }

  /**
   * Get the base URL for HTTP-based transports.
   */
  private getBaseUrl(): string | null {
    if (this.config.transport.type === 'sse') {
      return this.config.transport.url;
    }
    if (this.config.transport.type === 'streamable-http') {
      return this.config.transport.url;
    }
    return null;
  }

  /**
   * Get HTTP headers from the transport config.
   */
  private getHeaders(): Record<string, string> {
    if (this.config.transport.type === 'sse') {
      return this.config.transport.headers ?? {};
    }
    if (this.config.transport.type === 'streamable-http') {
      return this.config.transport.headers ?? {};
    }
    return {};
  }

  /**
   * Connect to the MCP server.
   */
  async connect(): Promise<void> {
    if (this.state === 'connected') return;

    this.state = 'connecting';
    console.log(`[McpClient] Connecting to "${this.config.name}" (id=${this.config.id})`);

    try {
      // For HTTP-based transports, discover tools immediately
      const baseUrl = this.getBaseUrl();
      if (baseUrl) {
        // Test connection by listing tools
        await this.discoverTools();
      } else if (this.config.transport.type === 'stdio') {
        // STDIO transport — simulate connection for now
        // In a full implementation, this would spawn a child process
        console.warn(`[McpClient] STDIO transport for "${this.config.name}" — using simulated connection`);
        this.tools = [];
      }

      this.state = 'connected';
      this.connectedAt = Date.now();
      this.lastError = undefined;

      // Start health checking
      this.startHealthCheck();

      console.log(`[McpClient] Connected to "${this.config.name}" — ${this.tools.length} tools available`);
    } catch (error) {
      this.state = 'error';
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[McpClient] Failed to connect to "${this.config.name}": ${this.lastError}`);
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server.
   */
  disconnect(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.state = 'disconnected';
    this.tools = [];
    this.connectedAt = undefined;
    console.log(`[McpClient] Disconnected from "${this.config.name}" (id=${this.config.id})`);
  }

  /**
   * Discover available tools from the MCP server.
   * Calls the server's tools/list endpoint.
   */
  async discoverTools(): Promise<McpToolMetadata[]> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      // STDIO or unsupported transport
      return [];
    }

    try {
      const headers = this.getHeaders();
      const listUrl = `${baseUrl.replace(/\/$/, '')}/tools/list`;

      const response = await mcpHttpRequest(listUrl, 'GET', undefined, headers);

      // Parse the tools from the response
      const rawTools = (response.tools ?? []) as Array<{
        name: string;
        description?: string;
        inputSchema?: Record<string, unknown>;
      }>;

      this.tools = rawTools
        .filter(tool => {
          // Apply allowlist/blocklist
          if (this.config.blockedTools?.includes(tool.name)) return false;
          if (this.config.allowedTools && this.config.allowedTools.length > 0) {
            return this.config.allowedTools.includes(tool.name);
          }
          return true;
        })
        .slice(0, this.config.maxTools)
        .map(tool => ({
          name: tool.name,
          description: tool.description ?? '',
          inputSchema: tool.inputSchema ?? { type: 'object', properties: {} },
        }));

      return this.tools;
    } catch (error) {
      console.warn(`[McpClient] Tool discovery failed for "${this.config.name}": ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.tools; // Return cached tools
    }
  }

  /**
   * Call a tool on the MCP server.
   */
  async callTool(toolName: string, input: Record<string, unknown>): Promise<McpToolResult> {
    const startTime = Date.now();

    if (this.state !== 'connected') {
      return {
        success: false,
        error: `Server "${this.config.name}" is not connected (state=${this.state})`,
        durationMs: Date.now() - startTime,
        serverId: this.config.id,
        toolName,
      };
    }

    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      return {
        success: false,
        error: `Transport type "${this.config.transport.type}" does not support remote tool calls`,
        durationMs: Date.now() - startTime,
        serverId: this.config.id,
        toolName,
      };
    }

    try {
      const headers = this.getHeaders();
      const callUrl = `${baseUrl.replace(/\/$/, '')}/tools/call`;

      const response = await mcpHttpRequest(callUrl, 'POST', {
        name: toolName,
        arguments: input,
      }, headers);

      return {
        success: true,
        data: response,
        durationMs: Date.now() - startTime,
        serverId: this.config.id,
        toolName,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.lastError = errorMsg;

      return {
        success: false,
        error: errorMsg,
        durationMs: Date.now() - startTime,
        serverId: this.config.id,
        toolName,
      };
    }
  }

  /**
   * Check the health of the MCP server connection.
   */
  async checkHealth(): Promise<McpServerHealth> {
    const health: McpServerHealth = {
      serverId: this.config.id,
      state: this.state,
      toolCount: this.tools.length,
      lastHealthCheckAt: Date.now(),
      lastError: this.lastError,
      uptimeMs: this.connectedAt ? Date.now() - this.connectedAt : 0,
    };

    // Try to reconnect if in error state
    if (this.state === 'error') {
      try {
        await this.connect();
      } catch {
        // Reconnection failed — state is already 'error'
      }
    }

    return health;
  }

  /**
   * Start periodic health checking.
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.discoverTools();
      } catch {
        // Health check failed — mark as error
        if (this.state === 'connected') {
          this.state = 'error';
          console.warn(`[McpClient] Health check failed for "${this.config.name}"`);
        }
      }
    }, 60000); // Check every minute
  }
}

// ── MCP Client Manager ──────────────────────────────────────────

/**
 * Central MCP client that manages connections to multiple MCP servers.
 * Provides a unified API for tool discovery and execution across servers.
 */
export class McpClient {
  /** Active server connections, keyed by server ID */
  private connections: Map<string, McpServerConnection> = new Map();

  /**
   * Connect to an MCP server.
   * If already connected, this is a no-op.
   */
  async connect(serverConfig: McpServerConfig): Promise<void> {
    let conn = this.connections.get(serverConfig.id);
    if (!conn) {
      conn = new McpServerConnection(serverConfig);
      this.connections.set(serverConfig.id, conn);
    }
    await conn.connect();
  }

  /**
   * Disconnect from an MCP server by ID.
   */
  disconnect(serverId: string): void {
    const conn = this.connections.get(serverId);
    if (conn) {
      conn.disconnect();
      this.connections.delete(serverId);
    }
  }

  /**
   * Disconnect from all MCP servers.
   */
  disconnectAll(): void {
    for (const [id, conn] of this.connections) {
      conn.disconnect();
    }
    this.connections.clear();
  }

  /**
   * List tools available from a specific MCP server.
   * Returns the tool metadata with namespaced names.
   */
  listTools(serverId: string): McpToolMetadata[] {
    const conn = this.connections.get(serverId);
    if (!conn || conn.state !== 'connected') return [];

    return conn.tools.map(tool => ({
      ...tool,
      // Provide namespaced name in the description for clarity
      description: `[${createNamespacedToolName(serverId, tool.name)}] ${tool.description}`,
    }));
  }

  /**
   * List all tools across all connected MCP servers.
   * Tools are namespaced to prevent collisions.
   */
  listAllTools(): Array<McpToolMetadata & { serverId: string; namespacedName: string }> {
    const allTools: Array<McpToolMetadata & { serverId: string; namespacedName: string }> = [];

    for (const [serverId, conn] of this.connections) {
      if (conn.state !== 'connected') continue;

      for (const tool of conn.tools) {
        const namespacedName = createNamespacedToolName(serverId, tool.name);
        allTools.push({
          ...tool,
          serverId,
          namespacedName,
        });
      }
    }

    return allTools;
  }

  /**
   * Call a tool on an MCP server.
   * The tool name should be the original (non-namespaced) name.
   */
  async callTool(serverId: string, toolName: string, input: Record<string, unknown>): Promise<McpToolResult> {
    const conn = this.connections.get(serverId);
    if (!conn) {
      return {
        success: false,
        error: `No connection found for server ID: ${serverId}`,
        durationMs: 0,
        serverId,
        toolName,
      };
    }

    return conn.callTool(toolName, input);
  }

  /**
   * Call a tool by its namespaced name (mcp__<serverId>__<toolName>).
   */
  async callNamespacedTool(namespacedName: string, input: Record<string, unknown>): Promise<McpToolResult> {
    const parts = namespacedName.split('__');
    if (parts.length !== 3 || parts[0] !== 'mcp') {
      return {
        success: false,
        error: `Invalid namespaced tool name: ${namespacedName}`,
        durationMs: 0,
        serverId: '',
        toolName: namespacedName,
      };
    }

    const [, serverId, toolName] = parts;
    return this.callTool(serverId, toolName, input);
  }

  /**
   * Get the health status of a specific MCP server.
   */
  async getServerHealth(serverId: string): Promise<McpServerHealth | null> {
    const conn = this.connections.get(serverId);
    if (!conn) return null;
    return conn.checkHealth();
  }

  /**
   * Get the health status of all connected MCP servers.
   */
  async getAllServerHealth(): Promise<McpServerHealth[]> {
    const healths: McpServerHealth[] = [];
    for (const conn of this.connections.values()) {
      healths.push(await conn.checkHealth());
    }
    return healths;
  }

  /**
   * Get a server connection by ID.
   */
  getConnection(serverId: string): McpServerConnection | undefined {
    return this.connections.get(serverId);
  }

  /**
   * Get all connected server IDs.
   */
  getConnectedServerIds(): string[] {
    return Array.from(this.connections.entries())
      .filter(([, conn]) => conn.state === 'connected')
      .map(([id]) => id);
  }
}

/**
 * Singleton MCP client instance.
 */
export const mcpClient = new McpClient();
