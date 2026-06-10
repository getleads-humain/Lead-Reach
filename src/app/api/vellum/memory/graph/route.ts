/**
 * /api/vellum/memory/graph — Knowledge Graph Operations
 *
 * GET:    Get node by ID, get neighbors, find paths
 * POST:   Add node, add edge
 * PUT:    Update node (activate, reinforce)
 * DELETE: Remove node/edge
 */

import { NextRequest } from 'next/server';
import {
  getNode,
  addNode,
  addEdge,
  getNeighbors,
  findPaths,
  activateNode,
  getGraphStats,
  generateNodeId,
  generateEdgeId,
  saveNode,
} from '@/lib/vellum-core/memory';
import type { MemoryNode, MemoryEdge, EdgeRelationship } from '@/lib/vellum-core/memory';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/vellum/memory/graph
 *
 * Query params:
 *   - action: 'node' | 'neighbors' | 'paths' | 'stats' (default: 'node')
 *   - id: Node ID (for node/neighbors/paths actions)
 *   - targetId: Target node ID (for paths action)
 *   - depth: Traversal depth for neighbors (default: 1)
 *   - scopeId: Scope ID for stats action
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'node';
    const id = searchParams.get('id');
    const targetId = searchParams.get('targetId');
    const depth = parseInt(searchParams.get('depth') || '1', 10);
    const scopeId = searchParams.get('scopeId');

    switch (action) {
      case 'node': {
        if (!id) {
          return Response.json(
            { error: 'id is required for node action' },
            { status: 400, headers: CORS_HEADERS },
          );
        }
        const node = await getNode(id);
        if (!node) {
          return Response.json(
            { error: `Node ${id} not found` },
            { status: 404, headers: CORS_HEADERS },
          );
        }
        return Response.json({ success: true, node }, { headers: CORS_HEADERS });
      }

      case 'neighbors': {
        if (!id) {
          return Response.json(
            { error: 'id is required for neighbors action' },
            { status: 400, headers: CORS_HEADERS },
          );
        }
        const neighbors = await getNeighbors(id, Math.min(depth, 5));
        return Response.json(
          { success: true, nodeId: id, depth, neighbors, count: neighbors.length },
          { headers: CORS_HEADERS },
        );
      }

      case 'paths': {
        if (!id || !targetId) {
          return Response.json(
            { error: 'id and targetId are required for paths action' },
            { status: 400, headers: CORS_HEADERS },
          );
        }
        const paths = await findPaths(id, targetId, 5);
        return Response.json(
          { success: true, fromId: id, toId: targetId, paths, pathCount: paths.length },
          { headers: CORS_HEADERS },
        );
      }

      case 'stats': {
        if (!scopeId) {
          return Response.json(
            { error: 'scopeId is required for stats action' },
            { status: 400, headers: CORS_HEADERS },
          );
        }
        const stats = await getGraphStats(scopeId);
        return Response.json({ success: true, stats }, { headers: CORS_HEADERS });
      }

      default:
        return Response.json(
          { error: `Unknown action: ${action}. Valid actions: node, neighbors, paths, stats` },
          { status: 400, headers: CORS_HEADERS },
        );
    }
  } catch (error) {
    console.error('[VellumGraph] GET error:', error);
    return Response.json(
      { error: 'Failed to query graph', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * POST /api/vellum/memory/graph
 *
 * Add a node or edge to the knowledge graph.
 * Body: { action: 'addNode' | 'addEdge', ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      case 'addNode': {
        const { scopeId, content, type, significance, confidence } = body as {
          scopeId: string;
          content: string;
          type: string;
          significance?: number;
          confidence?: number;
        };

        if (!scopeId || !content || !type) {
          return Response.json(
            { error: 'scopeId, content, and type are required' },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const now = Date.now();
        const node: MemoryNode = {
          id: generateNodeId(),
          content,
          type: type as MemoryNode['type'],
          fidelity: 'vivid',
          confidence: confidence ?? 0.8,
          significance: significance ?? 0.7,
          stability: 0.3,
          sourceConversations: [],
          sourceType: 'direct',
          scopeId,
          createdAt: now,
          updatedAt: now,
          lastAccessedAt: now,
        };

        await addNode(node);

        return Response.json(
          { success: true, node },
          { status: 201, headers: CORS_HEADERS },
        );
      }

      case 'addEdge': {
        const { sourceId, targetId, relationship, weight, scopeId } = body as {
          sourceId: string;
          targetId: string;
          relationship: EdgeRelationship;
          weight?: number;
          scopeId: string;
        };

        if (!sourceId || !targetId || !relationship || !scopeId) {
          return Response.json(
            { error: 'sourceId, targetId, relationship, and scopeId are required' },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const validRelationships: EdgeRelationship[] = [
          'caused-by', 'reminds-of', 'contradicts', 'depends-on', 'part-of', 'supersedes', 'resolved-by',
        ];
        if (!validRelationships.includes(relationship)) {
          return Response.json(
            { error: `Invalid relationship. Must be one of: ${validRelationships.join(', ')}` },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const edge: MemoryEdge = {
          id: generateEdgeId(),
          sourceId,
          targetId,
          relationship,
          weight: weight ?? 0.5,
          scopeId,
        };

        await addEdge(edge);

        return Response.json(
          { success: true, edge },
          { status: 201, headers: CORS_HEADERS },
        );
      }

      default:
        return Response.json(
          { error: `Unknown action: ${action}. Valid actions: addNode, addEdge` },
          { status: 400, headers: CORS_HEADERS },
        );
    }
  } catch (error) {
    console.error('[VellumGraph] POST error:', error);
    return Response.json(
      { error: 'Failed to add to graph', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * PUT /api/vellum/memory/graph
 *
 * Update a node (activate/reinforce).
 * Body: { action: 'activate' | 'reinforce', id, ... }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      case 'activate': {
        const { id, strength, decayFactor, maxHops } = body as {
          id: string;
          strength?: number;
          decayFactor?: number;
          maxHops?: number;
        };

        if (!id) {
          return Response.json(
            { error: 'id is required' },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        await activateNode(
          id,
          strength ?? 1.0,
          decayFactor ?? 0.5,
          maxHops ?? 3,
        );

        return Response.json(
          { success: true, message: `Node ${id} activated with spreading` },
          { headers: CORS_HEADERS },
        );
      }

      case 'reinforce': {
        const { id, significance, confidence } = body as {
          id: string;
          significance?: number;
          confidence?: number;
        };

        if (!id) {
          return Response.json(
            { error: 'id is required' },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const existing = await getNode(id);
        if (!existing) {
          return Response.json(
            { error: `Node ${id} not found` },
            { status: 404, headers: CORS_HEADERS },
          );
        }

        const updated: MemoryNode = {
          ...existing,
          significance: significance ?? existing.significance,
          confidence: confidence ?? existing.confidence,
          lastAccessedAt: Date.now(),
          updatedAt: Date.now(),
        };

        await saveNode(updated);

        return Response.json(
          { success: true, node: updated },
          { headers: CORS_HEADERS },
        );
      }

      default:
        return Response.json(
          { error: `Unknown action: ${action}. Valid actions: activate, reinforce` },
          { status: 400, headers: CORS_HEADERS },
        );
    }
  } catch (error) {
    console.error('[VellumGraph] PUT error:', error);
    return Response.json(
      { error: 'Failed to update graph', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * DELETE /api/vellum/memory/graph?action=removeNode&id=xxx
 * DELETE /api/vellum/memory/graph?action=removeEdge&edgeId=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'removeNode';
    const id = searchParams.get('id');
    const edgeId = searchParams.get('edgeId');

    switch (action) {
      case 'removeNode': {
        if (!id) {
          return Response.json(
            { error: 'id is required for removeNode action' },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const { deleteNode } = await import('@/lib/vellum-core/memory');
        await deleteNode(id);

        return Response.json(
          { success: true, deleted: id },
          { headers: CORS_HEADERS },
        );
      }

      case 'removeEdge': {
        if (!edgeId) {
          return Response.json(
            { error: 'edgeId is required for removeEdge action' },
            { status: 400, headers: CORS_HEADERS },
          );
        }

        const { deleteEdge } = await import('@/lib/vellum-core/memory');
        deleteEdge(edgeId);

        return Response.json(
          { success: true, deleted: edgeId },
          { headers: CORS_HEADERS },
        );
      }

      default:
        return Response.json(
          { error: `Unknown action: ${action}. Valid actions: removeNode, removeEdge` },
          { status: 400, headers: CORS_HEADERS },
        );
    }
  } catch (error) {
    console.error('[VellumGraph] DELETE error:', error);
    return Response.json(
      { error: 'Failed to remove from graph', details: error instanceof Error ? error.message : 'Unknown' },
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
