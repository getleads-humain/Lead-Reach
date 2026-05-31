/**
 * Agent Session Management
 * =========================
 * Manages persistent agent sessions with context, state, and embedding storage.
 * Uses SQLite (via Prisma) for session persistence, with JSON-serialized embeddings
 * for semantic search (compatible with Supabase pgvector for future migration).
 *
 * Each session tracks:
 * - Conversation context and state
 * - Model usage (which GLM model powers this session)
 * - Token consumption and task metrics
 * - Embedding vector for semantic session retrieval
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export interface SessionContext {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; timestamp: string }>;
  state: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface SessionCreateOptions {
  agentName: AgentName;
  modelId?: string;
  campaignId?: string;
  context?: Partial<SessionContext>;
}

export interface SessionQuery {
  agentName?: AgentName;
  status?: string;
  campaignId?: string;
  limit?: number;
}

// ── Session CRUD ───────────────────────────────────────────────

/**
 * Create a new agent session with initialized context.
 */
export async function createSession(options: SessionCreateOptions) {
  const sessionId = `sess_${options.agentName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const context: SessionContext = {
    messages: [],
    state: {},
    metadata: { createdAt: new Date().toISOString() },
    ...options.context,
  };

  return db.agentSession.create({
    data: {
      agentName: options.agentName,
      sessionId,
      modelId: options.modelId || 'glm-4.7-flash',
      campaignId: options.campaignId || null,
      context: JSON.stringify(context),
      status: 'active',
    },
  });
}

/**
 * Get a session by its unique sessionId.
 */
export async function getSession(sessionId: string) {
  return db.agentSession.findUnique({ where: { sessionId } });
}

/**
 * Get the active session for an agent (most recently active).
 */
export async function getActiveSession(agentName: AgentName) {
  return db.agentSession.findFirst({
    where: { agentName, status: 'active' },
    orderBy: { lastActiveAt: 'desc' },
    include: { logs: { take: 50, orderBy: { createdAt: 'desc' } } },
  });
}

/**
 * List sessions with filtering.
 */
export async function listSessions(query: SessionQuery = {}) {
  return db.agentSession.findMany({
    where: {
      ...(query.agentName ? { agentName: query.agentName } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.campaignId ? { campaignId: query.campaignId } : {}),
    },
    orderBy: { lastActiveAt: 'desc' },
    take: query.limit || 50,
  });
}

/**
 * Update session context by appending a message and updating state.
 */
export async function updateSessionContext(
  sessionId: string,
  update: {
    message?: { role: 'system' | 'user' | 'assistant'; content: string };
    state?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    tokensUsed?: number;
    taskCompleted?: boolean;
    taskFailed?: boolean;
  }
) {
  const session = await db.agentSession.findUnique({ where: { sessionId } });
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const context: SessionContext = session.context ? JSON.parse(session.context) : { messages: [], state: {}, metadata: {} };

  if (update.message) {
    context.messages.push({ ...update.message, timestamp: new Date().toISOString() });
  }
  if (update.state) {
    context.state = { ...context.state, ...update.state };
  }
  if (update.metadata) {
    context.metadata = { ...context.metadata, ...update.metadata };
  }

  return db.agentSession.update({
    where: { sessionId },
    data: {
      context: JSON.stringify(context),
      messageCount: { increment: update.message ? 1 : 0 },
      tokensUsed: { increment: update.tokensUsed || 0 },
      tasksCompleted: { increment: update.taskCompleted ? 1 : 0 },
      tasksFailed: { increment: update.taskFailed ? 1 : 0 },
      lastActiveAt: new Date(),
    },
  });
}

/**
 * Store an embedding vector for semantic session search.
 * Embedding stored as JSON float array (SQLite-compatible).
 * For Supabase pgvector, migrate to native vector column.
 */
export async function storeSessionEmbedding(sessionId: string, embedding: number[]) {
  return db.agentSession.update({
    where: { sessionId },
    data: { embedding: JSON.stringify(embedding) },
  });
}

/**
 * Find sessions similar to a given embedding using cosine similarity.
 * For SQLite: loads sessions and computes similarity in-memory.
 * For Supabase: would use pgvector <=> operator for native search.
 */
export async function findSimilarSessions(
  agentName: AgentName,
  queryEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.7
) {
  const sessions = await db.agentSession.findMany({
    where: {
      agentName,
      status: { in: ['active', 'completed'] },
      embedding: { not: null },
    },
    take: 200, // Load candidates for in-memory similarity computation
  });

  const scored = sessions
    .map(session => {
      const embedding = session.embedding ? JSON.parse(session.embedding) as number[] : null;
      if (!embedding || embedding.length !== queryEmbedding.length) return null;
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return { session, similarity };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}

/**
 * End a session (mark as completed).
 */
export async function endSession(sessionId: string) {
  return db.agentSession.update({
    where: { sessionId },
    data: { status: 'completed', endedAt: new Date() },
  });
}

/**
 * Pause a session.
 */
export async function pauseSession(sessionId: string) {
  return db.agentSession.update({
    where: { sessionId },
    data: { status: 'paused' },
  });
}

/**
 * Resume a paused session.
 */
export async function resumeSession(sessionId: string) {
  return db.agentSession.update({
    where: { sessionId },
    data: { status: 'active', lastActiveAt: new Date() },
  });
}

// ── Utility ────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
