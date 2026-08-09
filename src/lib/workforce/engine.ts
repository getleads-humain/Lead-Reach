/**
 * LeadReach — Workforce Engine
 * ==============================
 * Core execution engine for the AI workforce.
 * Handles task execution, RAG retrieval, MCP tool invocation,
 * health monitoring, and inter-agent coordination.
 */

import { db } from '@/lib/db';
import { WORKFORCE_AGENT_MAP, type WorkforceAgentDefinition } from './definitions';

// ── Types ──────────────────────────────────────────────────────────────

export interface WorkforceExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  tokensUsed: number;
  durationMs: number;
}

export interface WorkforceHealthOverview {
  totalAgents: number;
  activeAgents: number;
  busyAgents: number;
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  totalTasksFailed: number;
  avgHealthScore: number;
  agents: Array<{
    slug: string;
    name: string;
    status: string;
    health: string;
    healthScore: number;
    tasksCompleted: number;
    tasksInProgress: number;
  }>;
}

// ── Agent CRUD ─────────────────────────────────────────────────────────

export async function getWorkforceAgent(slugOrId: string) {
  // Try by slug first, then by id
  let agent = await db.workforceAgent.findFirst({ where: { slug: slugOrId } });
  if (!agent) {
    agent = await db.workforceAgent.findUnique({ where: { id: slugOrId } });
  }
  return agent;
}

export async function listWorkforceAgents(includeStats = true) {
  const agents = await db.workforceAgent.findMany({
    orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    include: includeStats ? {
      _count: { select: { tasks: true, sessions: true, documents: true } },
    } : undefined,
  });
  return agents;
}

export async function createWorkforceAgentFromDefinition(def: WorkforceAgentDefinition) {
  return db.workforceAgent.upsert({
    where: { slug: def.slug },
    update: {
      name: def.name,
      role: def.role,
      department: def.department,
      description: def.description,
      persona: JSON.stringify(def.persona),
      avatar: def.avatar,
      color: def.color,
      skills: JSON.stringify(def.skills),
      tools: JSON.stringify(def.tools),
      mcpServers: JSON.stringify(def.mcpServers),
      ragSources: JSON.stringify(def.ragSources),
      permissions: JSON.stringify(def.permissions),
      expertise: JSON.stringify(def.expertise),
      model: def.model,
      temperature: def.temperature,
      maxTokens: def.maxTokens,
      systemPrompt: def.systemPrompt,
      scheduleType: def.scheduleType,
      maxConcurrentTasks: def.maxConcurrentTasks,
      priority: def.priority,
      isManaged: true,
    },
    create: {
      slug: def.slug,
      name: def.name,
      role: def.role,
      department: def.department,
      description: def.description,
      persona: JSON.stringify(def.persona),
      avatar: def.avatar,
      color: def.color,
      skills: JSON.stringify(def.skills),
      tools: JSON.stringify(def.tools),
      mcpServers: JSON.stringify(def.mcpServers),
      ragSources: JSON.stringify(def.ragSources),
      permissions: JSON.stringify(def.permissions),
      expertise: JSON.stringify(def.expertise),
      model: def.model,
      temperature: def.temperature,
      maxTokens: def.maxTokens,
      systemPrompt: def.systemPrompt,
      scheduleType: def.scheduleType,
      maxConcurrentTasks: def.maxConcurrentTasks,
      priority: def.priority,
      isManaged: true,
    },
  });
}

// ── Task Management ────────────────────────────────────────────────────

export async function createWorkforceTask(params: {
  agentId: string;
  title: string;
  description?: string;
  taskType: string;
  priority?: string;
  input?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  dueDate?: Date;
}) {
  const agent = await db.workforceAgent.findUnique({ where: { id: params.agentId } });
  if (!agent) throw new Error(`Agent not found: ${params.agentId}`);

  // Check capacity
  if (agent.tasksInProgress >= agent.maxConcurrentTasks) {
    throw new Error(`Agent ${agent.name} is at capacity (${agent.tasksInProgress}/${agent.maxConcurrentTasks} tasks)`);
  }

  const task = await db.workforceTask.create({
    data: {
      agentId: params.agentId,
      title: params.title,
      description: params.description,
      taskType: params.taskType,
      priority: params.priority || 'normal',
      input: params.input,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      dueDate: params.dueDate,
      status: 'pending',
    },
  });

  // Update agent's in-progress count
  await db.workforceAgent.update({
    where: { id: params.agentId },
    data: { tasksInProgress: { increment: 1 }, lastActiveAt: new Date() },
  });

  return task;
}

export async function startWorkforceTask(taskId: string) {
  return db.workforceTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date() },
  });
}

export async function completeWorkforceTask(taskId: string, output: string, tokensUsed = 0) {
  const task = await db.workforceTask.update({
    where: { id: taskId },
    data: {
      status: 'completed',
      output,
      tokensUsed,
      progress: 100,
      completedAt: new Date(),
    },
  });

  // Update agent metrics
  await db.workforceAgent.update({
    where: { id: task.agentId },
    data: {
      tasksCompleted: { increment: 1 },
      tasksInProgress: { decrement: 1 },
      totalTokensUsed: { increment: tokensUsed },
      lastActiveAt: new Date(),
    },
  });

  return task;
}

export async function failWorkforceTask(taskId: string, error: string) {
  const task = await db.workforceTask.update({
    where: { id: taskId },
    data: { status: 'failed', error, completedAt: new Date() },
  });

  await db.workforceAgent.update({
    where: { id: task.agentId },
    data: {
      tasksFailed: { increment: 1 },
      tasksInProgress: { decrement: 1 },
      lastActiveAt: new Date(),
    },
  });

  return task;
}

// ── Session Management ─────────────────────────────────────────────────

export async function createWorkforceSession(agentId: string, purpose: string) {
  return db.workforceSession.create({
    data: { agentId, purpose, status: 'active' },
  });
}

export async function addMessageToSession(sessionId: string, role: 'user' | 'assistant' | 'system', content: string) {
  const session = await db.workforceSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const messages = session.messages ? JSON.parse(session.messages) : [];
  messages.push({ role, content, timestamp: new Date().toISOString() });

  return db.workforceSession.update({
    where: { id: sessionId },
    data: {
      messages: JSON.stringify(messages),
      messageCount: { increment: 1 },
      lastActivityAt: new Date(),
    },
  });
}

// ── Health & Metrics ───────────────────────────────────────────────────

export async function getWorkforceHealthOverview(): Promise<WorkforceHealthOverview> {
  const agents = await db.workforceAgent.findMany({
    orderBy: [{ priority: 'desc' }, { name: 'asc' }],
  });

  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const totalTasksInProgress = agents.reduce((sum, a) => sum + a.tasksInProgress, 0);
  const totalTasksFailed = agents.reduce((sum, a) => sum + a.tasksFailed, 0);
  const avgHealthScore = agents.length > 0 ? Math.round(agents.reduce((sum, a) => sum + a.healthScore, 0) / agents.length) : 0;

  return {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active' || a.status === 'busy').length,
    busyAgents: agents.filter(a => a.status === 'busy').length,
    totalTasksCompleted,
    totalTasksInProgress,
    totalTasksFailed,
    avgHealthScore,
    agents: agents.map(a => ({
      slug: a.slug,
      name: a.name,
      status: a.status,
      health: a.health,
      healthScore: a.healthScore,
      tasksCompleted: a.tasksCompleted,
      tasksInProgress: a.tasksInProgress,
    })),
  };
}

export async function recalculateAgentHealth(agentId: string) {
  const agent = await db.workforceAgent.findUnique({ where: { id: agentId } });
  if (!agent) return;

  // Health score based on success rate and recent activity
  const totalTasks = agent.tasksCompleted + agent.tasksFailed;
  const successRate = totalTasks > 0 ? agent.tasksCompleted / totalTasks : 1.0;

  let healthScore = 100;
  healthScore -= (1 - successRate) * 50; // Up to -50 for failures
  if (agent.status === 'error') healthScore -= 20;
  if (!agent.lastActiveAt || Date.now() - agent.lastActiveAt.getTime() > 3600000) healthScore -= 10; // -10 for idle > 1hr
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  const health = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : healthScore >= 40 ? 'unhealthy' : 'critical';

  await db.workforceAgent.update({
    where: { id: agentId },
    data: { healthScore, health, successRate },
  });

  return { healthScore, health };
}

// ── Document / Knowledge Management ────────────────────────────────────

export async function addWorkforceDocument(params: {
  agentId: string;
  title: string;
  category: string;
  content: string;
  tags?: string[];
  sourceType?: string;
}) {
  return db.workforceDocument.create({
    data: {
      agentId: params.agentId,
      title: params.title,
      category: params.category,
      content: params.content,
      tags: params.tags ? JSON.stringify(params.tags) : null,
      sourceType: params.sourceType || 'manual',
    },
  });
}

export async function searchWorkforceDocuments(agentId: string, query: string) {
  // Simple text search (BM25-style keyword matching)
  const documents = await db.workforceDocument.findMany({
    where: {
      agentId,
      isLatest: true,
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { tags: { contains: query } },
      ],
    },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  });
  return documents;
}

// ── RAG Retrieval ──────────────────────────────────────────────────────

export async function retrieveContextForAgent(agentSlug: string, query: string): Promise<string> {
  const agent = await db.workforceAgent.findFirst({ where: { slug: agentSlug } });
  if (!agent) return '';

  // Get agent-specific documents
  const docs = await searchWorkforceDocuments(agent.id, query);

  // Build context from top documents
  const contextParts: string[] = [];

  if (docs.length > 0) {
    contextParts.push('## Relevant Knowledge Base Documents\n');
    for (const doc of docs.slice(0, 5)) {
      contextParts.push(`### ${doc.title} (${doc.category})\n${doc.content.slice(0, 2000)}\n`);
    }
  }

  // Include agent's RAG sources as hints
  const ragSources = agent.ragSources ? JSON.parse(agent.ragSources) : [];
  if (ragSources.length > 0) {
    contextParts.push(`\n## Available Knowledge Sources: ${ragSources.join(', ')}`);
  }

  return contextParts.join('\n');
}

// ── Seed All Agents ────────────────────────────────────────────────────

export async function seedWorkforceAgents() {
  const { ALL_WORKFORCE_AGENTS } = await import('./definitions');
  const results = [];

  for (const def of ALL_WORKFORCE_AGENTS) {
    const agent = await createWorkforceAgentFromDefinition(def);
    results.push({ slug: def.slug, id: agent.id, created: true });
  }

  return results;
}
