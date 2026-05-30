/**
 * Agent Profile Management
 * =========================
 * Manages the identity, personality, and configuration profiles
 * for each of the 8 AI agents.
 *
 * Profiles define:
 *   - Identity (name, icon, color, description)
 *   - Personality (persona, tone, expertise)
 *   - Capabilities (skills, channels)
 *   - Model preferences (preferred/fallback GLM model)
 *   - Rate limits
 *
 * Profiles are seeded at startup from AGENT_DEFINITIONS + enriched
 * with persona descriptions and model preferences.
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';
import { AGENT_DEFINITIONS } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export type AgentTone = 'professional' | 'friendly' | 'technical' | 'executive';

export interface ProfileData {
  agentName: AgentName;
  displayName: string;
  description: string;
  icon?: string;
  color?: string;
  persona?: string;
  tone?: AgentTone;
  expertise?: string[];
  capabilities?: string[];
  channels?: string[];
  preferredModel?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  maxConcurrentTasks?: number;
  rateLimitPerMin?: number;
}

// ── Agent Personas ─────────────────────────────────────────────

const AGENT_PERSONAS: Record<AgentName, { persona: string; tone: AgentTone; expertise: string[] }> = {
  orchestrator: {
    persona: 'You are Atlas, the Orchestrator Agent. You coordinate multi-agent workflows with precision and strategic planning. You break complex requests into sub-tasks, assign them to specialized agents, and monitor execution. You think in systems and dependencies.',
    tone: 'executive',
    expertise: ['workflow orchestration', 'task decomposition', 'dependency management', 'resource allocation'],
  },
  'prospect-discovery': {
    persona: 'You are Scout, the Prospect Discovery Agent. You search across 17+ internet channels to find companies and decision-makers matching your user\'s ICP. You are relentless in your search, using multi-round deep search strategies and never accepting zero results.',
    tone: 'professional',
    expertise: ['web search', 'LinkedIn research', 'company discovery', 'market mapping', 'semantic search'],
  },
  'data-enrichment': {
    persona: 'You are Prism, the Data Enrichment Agent. You transform sparse company data into rich, actionable intelligence. You read websites, extract firmographics and technographics, and fill in missing data points with precision. Every lead you touch becomes more valuable.',
    tone: 'professional',
    expertise: ['firmographic enrichment', 'technographic analysis', 'contact extraction', 'web scraping'],
  },
  'web-research': {
    persona: 'You are DeepDive, the Web Research Agent. You conduct deep, multi-source research on companies and markets. You synthesize information from news, social media, job postings, and financial data into comprehensive intelligence briefings.',
    tone: 'technical',
    expertise: ['deep web research', 'competitive analysis', 'market intelligence', 'news synthesis'],
  },
  'lead-qualification': {
    persona: 'You are Judge, the Lead Qualification Agent. You apply rigorous multi-dimensional scoring frameworks (BANT, MEDDIC, Prospect) to evaluate lead quality. You are objective, consistent, and data-driven in your assessments.',
    tone: 'professional',
    expertise: ['BANT scoring', 'MEDDIC evaluation', 'ICP matching', 'lead prioritization', 'predictive scoring'],
  },
  'outreach-composer': {
    persona: 'You are Pen, the Outreach Composer Agent. You craft hyper-personalized outreach messages that get replies. You use enriched lead data, company context, and proven copywriting frameworks to compose messages that resonate with each prospect.',
    tone: 'friendly',
    expertise: ['cold email composition', 'LinkedIn messaging', 'personalization', 'copywriting frameworks', 'sequence design'],
  },
  'pipeline-manager': {
    persona: 'You are Flow, the Pipeline Manager Agent. You track every lead through the sales pipeline, automate stage transitions, and ensure no opportunity falls through the cracks. You are organized, proactive, and relentless about follow-ups.',
    tone: 'professional',
    expertise: ['pipeline management', 'stage transitions', 'follow-up automation', 'CRM synchronization', 'deal tracking'],
  },
  'report-generator': {
    persona: 'You are Insight, the Report Generator Agent. You transform raw data into actionable intelligence. You generate performance reports, identify trends, surface anomalies, and recommend optimizations with clarity and precision.',
    tone: 'executive',
    expertise: ['data analytics', 'trend identification', 'KPI tracking', 'performance reporting', 'actionable insights'],
  },
};

// ── CRUD ───────────────────────────────────────────────────────

/**
 * Get an agent's profile. Returns null if not found.
 */
export async function getProfile(agentName: AgentName) {
  return db.agentProfile.findUnique({ where: { agentName } });
}

/**
 * Get all agent profiles.
 */
export async function listProfiles() {
  return db.agentProfile.findMany({ orderBy: { agentName: 'asc' } });
}

/**
 * Create or update an agent profile.
 */
export async function upsertProfile(data: ProfileData) {
  const personaData = AGENT_PERSONAS[data.agentName];

  return db.agentProfile.upsert({
    where: { agentName: data.agentName },
    create: {
      agentName: data.agentName,
      displayName: data.displayName,
      description: data.description,
      icon: data.icon || 'Bot',
      color: data.color || '#10B981',
      persona: data.persona || personaData?.persona || null,
      tone: data.tone || personaData?.tone || 'professional',
      expertise: JSON.stringify(data.expertise || personaData?.expertise || []),
      capabilities: JSON.stringify(data.capabilities || []),
      channels: JSON.stringify(data.channels || []),
      preferredModel: data.preferredModel || 'glm-4.7-flash',
      fallbackModel: data.fallbackModel || 'glm-4.6v-flash',
      temperature: data.temperature ?? 0.3,
      maxTokens: data.maxTokens ?? 4096,
      maxConcurrentTasks: data.maxConcurrentTasks ?? 3,
      rateLimitPerMin: data.rateLimitPerMin ?? 10,
    },
    update: {
      displayName: data.displayName,
      description: data.description,
      ...(data.icon ? { icon: data.icon } : {}),
      ...(data.color ? { color: data.color } : {}),
      ...(data.persona ? { persona: data.persona } : {}),
      ...(data.tone ? { tone: data.tone } : {}),
      ...(data.expertise ? { expertise: JSON.stringify(data.expertise) } : {}),
      ...(data.capabilities ? { capabilities: JSON.stringify(data.capabilities) } : {}),
      ...(data.channels ? { channels: JSON.stringify(data.channels) } : {}),
      ...(data.preferredModel ? { preferredModel: data.preferredModel } : {}),
      ...(data.fallbackModel ? { fallbackModel: data.fallbackModel } : {}),
      ...(data.temperature !== undefined ? { temperature: data.temperature } : {}),
      ...(data.maxTokens !== undefined ? { maxTokens: data.maxTokens } : {}),
    },
  });
}

/**
 * Seed all 8 agent profiles from AGENT_DEFINITIONS + personas.
 */
export async function seedAllProfiles(): Promise<number> {
  let created = 0;
  for (const def of AGENT_DEFINITIONS) {
    await upsertProfile({
      agentName: def.name,
      displayName: def.displayName,
      description: def.description,
      icon: def.icon,
      color: def.color,
    });
    created++;
  }
  return created;
}
