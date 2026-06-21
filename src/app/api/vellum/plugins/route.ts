/**
 * /api/vellum/plugins — Plugin Management
 *
 * GET:  List registered plugins
 * POST: Register a new plugin
 */

import { NextRequest } from 'next/server';
import { pluginManager } from '@/lib/vellum-core/plugins';
import type { Plugin, PluginManifest } from '@/lib/vellum-core/plugins';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/vellum/plugins
 *
 * List all registered plugins and their manifests.
 */
export async function GET() {
  try {
    const plugins = pluginManager.getPlugins();
    const manifests = pluginManager.getManifests();
    const tools = pluginManager.getAllTools();

    return Response.json(
      {
        success: true,
        plugins: plugins.map(p => ({
          manifest: {
            name: p.manifest.name,
            version: p.manifest.version,
            description: p.manifest.description,
            requiresCredential: p.manifest.requiresCredential,
            requiresFlag: p.manifest.requiresFlag,
          },
          hooks: Object.keys(p.hooks),
          toolCount: p.tools?.length ?? 0,
          injectorCount: p.injectors?.length ?? 0,
        })),
        manifests: manifests.map(m => ({
          name: m.name,
          version: m.version,
          description: m.description,
          requiresCredential: m.requiresCredential,
          requiresFlag: m.requiresFlag,
        })),
        tools: tools.map(t => ({
          pluginName: t.pluginName,
          toolName: t.tool.name,
          description: t.tool.description,
        })),
        totalPlugins: plugins.length,
        totalTools: tools.length,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumPlugins] GET error:', error);
    return Response.json(
      { error: 'Failed to list plugins', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * POST /api/vellum/plugins
 *
 * Register a new plugin.
 * Body: { manifest, hooks?, tools?, injectors? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manifest, hooks, tools } = body as {
      manifest: PluginManifest;
      hooks?: Record<string, unknown>;
      tools?: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
    };

    if (!manifest || !manifest.name || !manifest.version) {
      return Response.json(
        { error: 'manifest with name and version is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Build the plugin object
    const plugin: Plugin = {
      manifest,
      hooks: {},
      tools: tools?.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        handler: async (input: Record<string, unknown>) => {
          // Default handler — returns the input as a passthrough
          return { input, passthrough: true };
        },
      })),
    };

    pluginManager.registerPlugin(plugin);

    return Response.json(
      {
        success: true,
        plugin: {
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          hookCount: Object.keys(hooks || {}).length,
          toolCount: tools?.length ?? 0,
        },
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumPlugins] POST error:', error);
    return Response.json(
      { error: 'Failed to register plugin', details: error instanceof Error ? error.message : 'Unknown' },
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
