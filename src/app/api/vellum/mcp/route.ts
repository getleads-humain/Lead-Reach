/**
 * /api/vellum/mcp — MCP Server Management
 *
 * GET:    List connected MCP servers and their tools
 * POST:   Connect to a new MCP server
 * DELETE: Disconnect from an MCP server
 */

import { NextRequest } from 'next/server';
import { mcpClient } from '@/lib/vellum-core/mcp';
import type { McpServerConfig, McpTransport } from '@/lib/vellum-core/mcp';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/vellum/mcp
 *
 * List connected MCP servers and their available tools.
 * Optional query param: serverId (to get details for one server)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (serverId) {
      // Get details for a specific server
      const health = await mcpClient.getServerHealth(serverId);
      const tools = mcpClient.listTools(serverId);

      if (!health) {
        return Response.json(
          { error: `Server ${serverId} not found` },
          { status: 404, headers: CORS_HEADERS },
        );
      }

      return Response.json(
        {
          success: true,
          server: {
            serverId: health.serverId,
            state: health.state,
            toolCount: health.toolCount,
            lastHealthCheckAt: health.lastHealthCheckAt,
            lastError: health.lastError,
            uptimeMs: health.uptimeMs,
          },
          tools,
        },
        { headers: CORS_HEADERS },
      );
    }

    // List all servers
    const allHealths = await mcpClient.getAllServerHealth();
    const allTools = mcpClient.listAllTools();

    return Response.json(
      {
        success: true,
        servers: allHealths.map(h => ({
          serverId: h.serverId,
          state: h.state,
          toolCount: h.toolCount,
          lastHealthCheckAt: h.lastHealthCheckAt,
          lastError: h.lastError,
          uptimeMs: h.uptimeMs,
        })),
        tools: allTools,
        totalServers: allHealths.length,
        totalTools: allTools.length,
        connectedServers: allHealths.filter(h => h.state === 'connected').length,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumMCP] GET error:', error);
    return Response.json(
      { error: 'Failed to list MCP servers', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * POST /api/vellum/mcp
 *
 * Connect to a new MCP server.
 * Body: { id, name, transport, enabled?, defaultRiskLevel?, maxTools?, allowedTools?, blockedTools? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      transport,
      enabled,
      defaultRiskLevel,
      maxTools,
      allowedTools,
      blockedTools,
    } = body as {
      id: string;
      name: string;
      transport: McpTransport;
      enabled?: boolean;
      defaultRiskLevel?: 'low' | 'medium' | 'high';
      maxTools?: number;
      allowedTools?: string[];
      blockedTools?: string[];
    };

    if (!id || !name || !transport) {
      return Response.json(
        { error: 'id, name, and transport are required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (!transport.type || !['stdio', 'sse', 'streamable-http'].includes(transport.type)) {
      return Response.json(
        { error: 'transport.type must be "stdio", "sse", or "streamable-http"' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Validate transport has required fields
    if ((transport.type === 'sse' || transport.type === 'streamable-http') && !transport.url) {
      return Response.json(
        { error: `transport.url is required for ${transport.type} transport` },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (transport.type === 'stdio' && !transport.command) {
      return Response.json(
        { error: 'transport.command is required for stdio transport' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const config: McpServerConfig = {
      id,
      name,
      transport,
      enabled: enabled ?? true,
      defaultRiskLevel: defaultRiskLevel ?? 'medium',
      maxTools: maxTools ?? 50,
      allowedTools,
      blockedTools,
    };

    await mcpClient.connect(config);

    const tools = mcpClient.listTools(id);

    return Response.json(
      {
        success: true,
        message: `Connected to MCP server "${name}"`,
        server: {
          id: config.id,
          name: config.name,
          transportType: transport.type,
          defaultRiskLevel: config.defaultRiskLevel,
        },
        toolCount: tools.length,
        tools,
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumMCP] POST error:', error);
    return Response.json(
      { error: 'Failed to connect to MCP server', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * DELETE /api/vellum/mcp?serverId=xxx
 *
 * Disconnect from an MCP server.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return Response.json(
        { error: 'serverId query parameter is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const health = await mcpClient.getServerHealth(serverId);
    if (!health) {
      return Response.json(
        { error: `Server ${serverId} not found` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    mcpClient.disconnect(serverId);

    return Response.json(
      { success: true, disconnected: serverId },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumMCP] DELETE error:', error);
    return Response.json(
      { error: 'Failed to disconnect from MCP server', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
