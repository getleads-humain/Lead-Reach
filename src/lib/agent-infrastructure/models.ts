/**
 * Agent Model Management
 * =======================
 * Manages GLM model selection, routing, and configuration for each agent.
 * 
 * Supported models (strictly):
 *   - glm-4.7-flash   (primary — fast, high-quality text generation)
 *   - glm-4.6v-flash  (secondary — vision-capable, text fallback)
 *
 * Each agent can have its preferred model configured via AgentProfile.
 * The model router selects the right model based on:
 *   - Agent's preferred model
 *   - Task type (vision tasks → glm-4.6v-flash)
 *   - Fallback chain (primary → secondary on failure)
 *   - Load balancing (optional round-robin for high-volume agents)
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';
import { MODEL_PRIMARY, MODEL_VISION, type LLMModel } from '@/lib/llm';

// ── Types ──────────────────────────────────────────────────────

export type GLMModel = 'glm-4.7-flash' | 'glm-4.6v-flash';

export interface ModelConfig {
  modelId: GLMModel;
  displayName: string;
  description: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
  rateLimitRPM: number; // requests per minute
  costPer1kTokens: number; // approximate relative cost
}

export interface ModelRoutingDecision {
  model: GLMModel;
  fallback: GLMModel;
  reason: string;
  temperature: number;
  maxTokens: number;
}

// ── Model Definitions ──────────────────────────────────────────

export const MODEL_DEFINITIONS: Record<GLMModel, ModelConfig> = {
  'glm-4.7-flash': {
    modelId: 'glm-4.7-flash',
    displayName: 'GLM-4.7 Flash',
    description: 'Primary model — fast, high-quality text generation with strong reasoning capabilities. Optimal for all text-based agent tasks including extraction, scoring, composition, and analysis.',
    maxTokens: 4096,
    supportsVision: false,
    supportsStreaming: true,
    rateLimitRPM: 20,
    costPer1kTokens: 1.0,
  },
  'glm-4.6v-flash': {
    modelId: 'glm-4.6v-flash',
    displayName: 'GLM-4.6V Flash',
    description: 'Vision-capable model — supports multimodal inputs (text + images) with strong text generation. Used as secondary/fallback and for tasks requiring image understanding (e.g., screenshot analysis, logo extraction).',
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
    rateLimitRPM: 15,
    costPer1kTokens: 1.2,
  },
};

export const ALL_MODELS: GLMModel[] = ['glm-4.7-flash', 'glm-4.6v-flash'];

// ── Model Router ───────────────────────────────────────────────

/**
 * Determine the best model for an agent task.
 * Considers agent profile preferences, task requirements, and fallback chain.
 */
export async function routeModel(
  agentName: AgentName,
  taskType: string,
  options?: { requiresVision?: boolean; preferSpeed?: boolean }
): Promise<ModelRoutingDecision> {
  // Load agent profile for model preferences
  const profile = await db.agentProfile.findUnique({ where: { agentName } });

  const preferredModel = (profile?.preferredModel as GLMModel) || MODEL_PRIMARY;
  const fallbackModel = (profile?.fallbackModel as GLMModel) || MODEL_VISION;
  const temperature = profile?.temperature ?? 0.3;
  const maxTokens = profile?.maxTokens ?? 4096;

  // Vision tasks must use glm-4.6v-flash
  if (options?.requiresVision) {
    return {
      model: 'glm-4.6v-flash',
      fallback: 'glm-4.7-flash',
      reason: 'Vision capability required — routing to glm-4.6v-flash',
      temperature,
      maxTokens,
    };
  }

  // Speed preference — glm-4.7-flash is faster for pure text
  if (options?.preferSpeed) {
    return {
      model: 'glm-4.7-flash',
      fallback: 'glm-4.6v-flash',
      reason: 'Speed preferred — routing to glm-4.7-flash',
      temperature,
      maxTokens,
    };
  }

  // Default: use agent's preferred model with its configured fallback
  return {
    model: preferredModel,
    fallback: fallbackModel,
    reason: `Using agent profile preference: ${preferredModel}`,
    temperature,
    maxTokens,
  };
}

/**
 * Get the model configuration for a given model ID.
 */
export function getModelConfig(modelId: GLMModel): ModelConfig {
  return MODEL_DEFINITIONS[modelId];
}

/**
 * Check if a model supports vision inputs.
 */
export function modelSupportsVision(modelId: string): boolean {
  return modelId === 'glm-4.6v-flash';
}

/**
 * Record model usage for analytics and rate limiting.
 */
export async function recordModelUsage(
  agentName: AgentName,
  modelId: GLMModel,
  tokensIn: number,
  tokensOut: number,
  durationMs: number,
  success: boolean
): Promise<void> {
  try {
    await db.agentLog.create({
      data: {
        agentName,
        level: success ? 'info' : 'warn',
        category: 'model',
        message: `Model ${modelId} call ${success ? 'succeeded' : 'failed'}`,
        metadata: JSON.stringify({ modelId, tokensIn, tokensOut, durationMs, success }),
        durationMs,
        tokensIn,
        tokensOut,
      },
    });
  } catch {
    // Non-critical — logging failure should not break execution
  }
}
