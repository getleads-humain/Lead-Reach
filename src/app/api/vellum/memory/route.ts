/**
 * /api/vellum/memory — Memory Management
 *
 * GET:    List memories for a scope (query params: scopeId, type?, limit?)
 * POST:   Create a new memory node
 * PUT:    Update a memory node (reinforce significance, update content)
 * DELETE: Delete a memory node
 */

import { NextRequest } from 'next/server';
import {
  getNodesByScope,
  saveNode,
  getNode,
  deleteNode,
  updateSignificance,
  generateNodeId,
} from '@/lib/vellum-core/memory';
import type { MemoryNode, MemoryType, Fidelity } from '@/lib/vellum-core/memory';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/vellum/memory?scopeId=xxx&type=xxx&limit=20
 *
 * List memories for a scope, optionally filtered by type.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeId = searchParams.get('scopeId');
    const type = searchParams.get('type') as MemoryType | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!scopeId) {
      return Response.json(
        { error: 'scopeId query parameter is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    let nodes = await getNodesByScope(scopeId);

    // Filter by type if specified
    if (type) {
      nodes = nodes.filter(n => n.type === type);
    }

    // Filter out 'gone' fidelity nodes
    nodes = nodes.filter(n => n.fidelity !== 'gone');

    // Sort by significance descending
    nodes.sort((a, b) => b.significance - a.significance);

    // Apply limit
    const limited = nodes.slice(0, limit);

    return Response.json(
      {
        success: true,
        memories: limited,
        total: nodes.length,
        returned: limited.length,
        scopeId,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumMemory] GET error:', error);
    return Response.json(
      { error: 'Failed to list memories', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * POST /api/vellum/memory
 *
 * Create a new memory node.
 * Body: { scopeId, content, type, significance?, confidence?, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scopeId, content, type, significance, confidence, sourceType, emotionalCharge, narrativeRole, tags } = body as {
      scopeId: string;
      content: string;
      type: MemoryType;
      significance?: number;
      confidence?: number;
      sourceType?: 'direct' | 'inferred' | 'observed' | 'told-by-other';
      emotionalCharge?: Record<string, number>;
      narrativeRole?: string;
      tags?: string[];
    };

    if (!scopeId || !content || !type) {
      return Response.json(
        { error: 'scopeId, content, and type are required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const validTypes: MemoryType[] = ['episodic', 'semantic', 'procedural', 'emotional', 'prospective', 'behavioral', 'narrative'];
    if (!validTypes.includes(type)) {
      return Response.json(
        { error: `Invalid memory type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const now = Date.now();
    const node: MemoryNode = {
      id: generateNodeId(),
      content,
      type,
      fidelity: 'vivid' as Fidelity,
      confidence: confidence ?? 0.8,
      significance: significance ?? 0.7,
      stability: 0.3,
      emotionalCharge,
      sourceConversations: [],
      sourceType: sourceType ?? 'direct',
      narrativeRole,
      scopeId,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    await saveNode(node);

    return Response.json(
      { success: true, memory: node },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumMemory] POST error:', error);
    return Response.json(
      { error: 'Failed to create memory', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * PUT /api/vellum/memory
 *
 * Update a memory node. Supports:
 *   - Reinforcing significance (Ebbinghaus reinforcement)
 *   - Updating content
 *   - Updating confidence
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, significance, confidence, reinforce } = body as {
      id: string;
      content?: string;
      significance?: number;
      confidence?: number;
      reinforce?: number; // Delta to add to significance
    };

    if (!id) {
      return Response.json(
        { error: 'id is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // If reinforce is provided, use the Ebbinghaus reinforcement path
    if (reinforce !== undefined) {
      await updateSignificance(id, reinforce);
      const updated = await getNode(id);
      return Response.json(
        { success: true, memory: updated },
        { headers: CORS_HEADERS },
      );
    }

    // Otherwise, update specific fields
    const existing = await getNode(id);
    if (!existing) {
      return Response.json(
        { error: `Memory node ${id} not found` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    const updatedNode: MemoryNode = {
      ...existing,
      content: content ?? existing.content,
      significance: significance ?? existing.significance,
      confidence: confidence ?? existing.confidence,
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    await saveNode(updatedNode);

    return Response.json(
      { success: true, memory: updatedNode },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumMemory] PUT error:', error);
    return Response.json(
      { error: 'Failed to update memory', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * DELETE /api/vellum/memory?id=xxx
 *
 * Delete a memory node by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'id query parameter is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const existing = await getNode(id);
    if (!existing) {
      return Response.json(
        { error: `Memory node ${id} not found` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    await deleteNode(id);

    return Response.json(
      { success: true, deleted: id },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumMemory] DELETE error:', error);
    return Response.json(
      { error: 'Failed to delete memory', details: error instanceof Error ? error.message : 'Unknown' },
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
