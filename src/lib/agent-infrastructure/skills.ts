/**
 * Agent Skills Management
 * ========================
 * Manages the skill registry for each agent.
 * Skills are discrete capabilities that an agent can perform —
 * each mapped to a handler function and optional LLM prompt.
 *
 * Skills are stored in the AgentSkill DB model and can be:
 *   - Registered at startup (seeded from code)
 *   - Created dynamically via API
 *   - Enabled/disabled per agent
 *   - Tracked for execution metrics
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export type SkillCategory = 'search' | 'enrich' | 'qualify' | 'outreach' | 'report' | 'manage' | 'coordinate';
export type SkillStatus = 'active' | 'deprecated' | 'experimental';

export interface SkillDefinition {
  agentName: AgentName;
  name: string;
  displayName: string;
  description: string;
  version?: string;
  category: SkillCategory;
  handler: string;
  prompt?: string;
  channels?: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  status?: SkillStatus;
  priority?: number;
}

// ── CRUD ───────────────────────────────────────────────────────

/**
 * Register a skill for an agent.
 */
export async function registerSkill(skill: SkillDefinition) {
  return db.agentSkill.create({
    data: {
      agentName: skill.agentName,
      name: skill.name,
      displayName: skill.displayName,
      description: skill.description,
      version: skill.version || '1.0.0',
      category: skill.category,
      handler: skill.handler,
      prompt: skill.prompt || null,
      channels: skill.channels ? JSON.stringify(skill.channels) : null,
      inputSchema: skill.inputSchema ? JSON.stringify(skill.inputSchema) : null,
      outputSchema: skill.outputSchema ? JSON.stringify(skill.outputSchema) : null,
      status: skill.status || 'active',
      priority: skill.priority || 5,
    },
  });
}

/**
 * List skills for an agent.
 */
export async function listSkills(agentName: AgentName, category?: SkillCategory) {
  return db.agentSkill.findMany({
    where: {
      agentName,
      ...(category ? { category } : {}),
      status: 'active',
    },
    orderBy: { priority: 'desc' },
  });
}

/**
 * Get a specific skill.
 */
export async function getSkill(agentName: AgentName, name: string) {
  return db.agentSkill.findFirst({
    where: { agentName, name },
  });
}

/**
 * Update skill execution metrics.
 */
export async function updateSkillMetrics(skillId: string, durationMs: number, success: boolean) {
  const skill = await db.agentSkill.findUnique({ where: { id: skillId } });
  if (!skill) return;

  const newExecCount = skill.executionsCount + 1;
  const newAvgDuration = Math.round(
    (skill.avgDurationMs * skill.executionsCount + durationMs) / newExecCount
  );
  const newSuccessRate = success
    ? (skill.successRate * skill.executionsCount + 1) / newExecCount
    : (skill.successRate * skill.executionsCount) / newExecCount;

  return db.agentSkill.update({
    where: { id: skillId },
    data: {
      executionsCount: newExecCount,
      avgDurationMs: newAvgDuration,
      successRate: Math.round(newSuccessRate * 1000) / 1000,
      lastExecutedAt: new Date(),
    },
  });
}

/**
 * Deactivate a skill.
 */
export async function deactivateSkill(id: string) {
  return db.agentSkill.update({ where: { id }, data: { status: 'deprecated' } });
}
