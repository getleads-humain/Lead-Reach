/**
 * POST /api/vellum/skills/execute
 *
 * Execute a skill by ID with the given input.
 * Includes permission checking before execution.
 *
 * Body: { skillId, input, context? }
 * Returns: ToolExecutionResult
 */

import { NextRequest } from 'next/server';
import { executeSkill } from '@/lib/vellum-core/skills';
import type { ToolContext } from '@/lib/vellum-core/skills';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * POST handler — execute a skill.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillId, input, context } = body as {
      skillId: string;
      input: Record<string, unknown>;
      context?: Record<string, unknown>;
    };

    if (!skillId || typeof skillId !== 'string') {
      return Response.json(
        { error: 'skillId is required and must be a string' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (!input || typeof input !== 'object') {
      return Response.json(
        { error: 'input is required and must be an object' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Build the tool context with permission level
    const toolContext: ToolContext = {
      agentName: (context?.agentName as string) || 'api-user',
      scopeId: (context?.scopeId as string) || 'default',
      campaignId: context?.campaignId as string | undefined,
      taskId: context?.taskId as string | undefined,
      conversationContext: context?.conversationContext as Record<string, unknown> | undefined,
      userPreferences: context?.userPreferences as Record<string, unknown> | undefined,
      permissionLevel: (context?.permissionLevel as ToolContext['permissionLevel']) || 'write',
      timeout: (context?.timeout as number) || 30000,
    };

    const result = await executeSkill(skillId, input, toolContext);

    if (result.success) {
      return Response.json(
        { success: true, result },
        { headers: CORS_HEADERS },
      );
    } else {
      // Determine appropriate HTTP status based on error type
      let status = 500;
      if (result.error?.includes('not found')) status = 404;
      else if (result.error?.includes('permission') || result.error?.includes('INSUFFICIENT')) status = 403;
      else if (result.error?.includes('required') || result.error?.includes('MISSING')) status = 400;

      return Response.json(
        { success: false, result },
        { status, headers: CORS_HEADERS },
      );
    }
  } catch (error) {
    console.error('[VellumSkillsExecute] POST error:', error);
    return Response.json(
      { error: 'Failed to execute skill', details: error instanceof Error ? error.message : 'Unknown' },
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
