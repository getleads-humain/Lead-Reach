/**
 * Agent Memory System
 * 
 * Episodic, semantic, and procedural memory for AI agents.
 * Uses in-memory store with periodic persistence to AgentTask records.
 */

import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

export interface Episode {
  id: string;
  agentName: string;
  type: 'episodic';
  event: string;
  context: string;
  outcome: string;
  timestamp: string;
  tags: string[];
}

export interface Insight {
  id: string;
  agentName: string;
  type: 'semantic';
  category: string;
  insight: string;
  confidence: number; // 0-1
  source: string;
  timestamp: string;
}

export interface Procedure {
  id: string;
  agentName: string;
  type: 'procedural';
  name: string;
  steps: string[];
  triggerCondition: string;
  successRate: number; // 0-1
  timestamp: string;
}

export type MemoryEntry = Episode | Insight | Procedure;

// ============================================================
// In-Memory Store
// ============================================================

const memoryStore: Map<string, MemoryEntry[]> = new Map();

function getAgentMemories(agentName: string): MemoryEntry[] {
  if (!memoryStore.has(agentName)) {
    memoryStore.set(agentName, []);
  }
  return memoryStore.get(agentName)!;
}

function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================
// Episodic Memory
// ============================================================

/**
 * Store an agent experience/episode
 */
export async function storeEpisode(
  agentName: string,
  episode: Omit<Episode, 'id' | 'type' | 'timestamp' | 'agentName'>
): Promise<Episode> {
  const entry: Episode = {
    id: generateId(),
    agentName,
    type: 'episodic',
    timestamp: new Date().toISOString(),
    ...episode,
  };

  const memories = getAgentMemories(agentName);
  memories.push(entry);

  // Persist to database as an agent task output for durability
  try {
    await db.agentTask.create({
      data: {
        agentName,
        taskType: 'memory_episodic',
        status: 'completed',
        input: JSON.stringify({ type: 'episodic', event: episode.event }),
        output: JSON.stringify(entry),
        completedAt: new Date(),
      },
    });
  } catch {
    // Non-critical - memory is still in-memory
    console.warn(`[AgentMemory] Failed to persist episode for ${agentName}`);
  }

  return entry;
}

// ============================================================
// Semantic Memory
// ============================================================

/**
 * Store a learned insight
 */
export async function storeInsight(
  agentName: string,
  category: string,
  insight: Omit<Insight, 'id' | 'type' | 'timestamp' | 'agentName' | 'category'>
): Promise<Insight> {
  const entry: Insight = {
    id: generateId(),
    agentName,
    type: 'semantic',
    category,
    timestamp: new Date().toISOString(),
    ...insight,
  };

  const memories = getAgentMemories(agentName);
  memories.push(entry);

  // Persist to database
  try {
    await db.agentTask.create({
      data: {
        agentName,
        taskType: 'memory_semantic',
        status: 'completed',
        input: JSON.stringify({ type: 'semantic', category }),
        output: JSON.stringify(entry),
        completedAt: new Date(),
      },
    });
  } catch {
    console.warn(`[AgentMemory] Failed to persist insight for ${agentName}`);
  }

  return entry;
}

// ============================================================
// Procedural Memory
// ============================================================

/**
 * Store a learned procedure/workflow
 */
export async function storeProcedure(
  agentName: string,
  procedure: Omit<Procedure, 'id' | 'type' | 'timestamp' | 'agentName'>
): Promise<Procedure> {
  const entry: Procedure = {
    id: generateId(),
    agentName,
    type: 'procedural',
    timestamp: new Date().toISOString(),
    ...procedure,
  };

  const memories = getAgentMemories(agentName);
  memories.push(entry);

  try {
    await db.agentTask.create({
      data: {
        agentName,
        taskType: 'memory_procedural',
        status: 'completed',
        input: JSON.stringify({ type: 'procedural', name: procedure.name }),
        output: JSON.stringify(entry),
        completedAt: new Date(),
      },
    });
  } catch {
    console.warn(`[AgentMemory] Failed to persist procedure for ${agentName}`);
  }

  return entry;
}

// ============================================================
// Retrieval
// ============================================================

/**
 * Retrieve agent context (memories filtered by category/type)
 */
export async function getAgentContext(
  agentName: string,
  category?: string,
  limit: number = 20
): Promise<MemoryEntry[]> {
  let memories = getAgentMemories(agentName);

  // If in-memory is empty, try loading from DB
  if (memories.length === 0) {
    try {
      const dbTasks = await db.agentTask.findMany({
        where: {
          agentName,
          taskType: { startsWith: 'memory_' },
          status: 'completed',
        },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
      });

      for (const task of dbTasks) {
        if (task.output) {
          try {
            const entry = JSON.parse(task.output) as MemoryEntry;
            memories.push(entry);
          } catch {
            // Skip malformed entries
          }
        }
      }

      memoryStore.set(agentName, memories);
    } catch {
      // DB unavailable, return empty
    }
  }

  if (category) {
    memories = memories.filter((m) => {
      if (m.type === 'semantic') return (m as Insight).category === category;
      if (m.type === 'episodic') return (m as Episode).tags?.includes(category);
      if (m.type === 'procedural') return (m as Procedure).name.toLowerCase().includes(category.toLowerCase());
      return false;
    });
  }

  return memories.slice(-limit);
}

/**
 * Query across memory types with a text query
 */
export async function queryMemory(
  agentName: string,
  query: string
): Promise<MemoryEntry[]> {
  const memories = await getAgentContext(agentName, undefined, 100);
  const queryLower = query.toLowerCase();

  return memories.filter((m) => {
    const searchable = JSON.stringify(m).toLowerCase();
    return searchable.includes(queryLower);
  }).slice(0, 20);
}

/**
 * Clear all memories for an agent
 */
export async function clearAgentMemory(agentName: string): Promise<void> {
  memoryStore.delete(agentName);
  try {
    await db.agentTask.deleteMany({
      where: {
        agentName,
        taskType: { startsWith: 'memory_' },
      },
    });
  } catch {
    // Non-critical
  }
}
