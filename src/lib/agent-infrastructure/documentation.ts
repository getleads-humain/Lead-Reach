/**
 * Agent Documentation Management
 * ================================
 * Manages documentation for each agent — including getting started guides,
 * API references, skill docs, plugin docs, configuration guides,
 * and troubleshooting information.
 *
 * Documentation is stored as Markdown content in the AgentDocumentation
 * table and can be served via the API or rendered in the UI.
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export type DocCategory = 'getting_started' | 'api' | 'skill' | 'plugin' | 'config' | 'troubleshooting';
export type DocStatus = 'draft' | 'published' | 'archived';

export interface DocDefinition {
  agentName: AgentName;
  title: string;
  category: DocCategory;
  content: string;
  version?: string;
  examples?: string[];
  status?: DocStatus;
}

// ── CRUD ───────────────────────────────────────────────────────

/**
 * Create or update documentation.
 */
export async function upsertDoc(doc: DocDefinition) {
  // Find existing doc with same agentName + title + category
  const existing = await db.agentDocumentation.findFirst({
    where: { agentName: doc.agentName, title: doc.title, category: doc.category },
  });

  if (existing) {
    return db.agentDocumentation.update({
      where: { id: existing.id },
      data: {
        content: doc.content,
        version: doc.version || existing.version,
        examples: doc.examples ? JSON.stringify(doc.examples) : existing.examples,
        status: doc.status || 'published',
      },
    });
  }

  return db.agentDocumentation.create({
    data: {
      agentName: doc.agentName,
      title: doc.title,
      category: doc.category,
      content: doc.content,
      version: doc.version || '1.0.0',
      examples: doc.examples ? JSON.stringify(doc.examples) : null,
      status: doc.status || 'published',
    },
  });
}

/**
 * Get documentation for an agent.
 */
export async function getDocs(agentName: AgentName, category?: DocCategory) {
  return db.agentDocumentation.findMany({
    where: {
      agentName,
      ...(category ? { category } : {}),
      status: 'published',
    },
    orderBy: { category: 'asc' },
  });
}

/**
 * Get a single documentation entry.
 */
export async function getDoc(id: string) {
  return db.agentDocumentation.findUnique({ where: { id } });
}

/**
 * Search documentation across all agents.
 */
export async function searchDocs(query: string, limit: number = 20) {
  const allDocs = await db.agentDocumentation.findMany({
    where: { status: 'published' },
  });

  const queryLower = query.toLowerCase();
  return allDocs
    .filter(d => d.content.toLowerCase().includes(queryLower) || d.title.toLowerCase().includes(queryLower))
    .slice(0, limit);
}

/**
 * Delete documentation.
 */
export async function deleteDoc(id: string) {
  return db.agentDocumentation.delete({ where: { id } });
}

/**
 * Seed default documentation for all 8 agents.
 * Each agent gets a "Getting Started" doc with its persona and capabilities.
 */
export async function seedDefaultDocs(): Promise<number> {
  const docs: DocDefinition[] = [
    {
      agentName: 'orchestrator',
      title: 'Getting Started with Orchestrator',
      category: 'getting_started',
      content: `# Orchestrator Agent (Atlas)

## Overview
The Orchestrator Agent coordinates multi-agent workflows. It breaks complex requests into sub-tasks, assigns them to specialized agents, and monitors execution progress.

## Capabilities
- **Workflow Planning**: Decomposes complex requests into ordered sub-tasks
- **Agent Dispatch**: Routes tasks to the appropriate specialized agent
- **Dependency Management**: Handles task dependencies and execution ordering
- **Progress Monitoring**: Tracks overall workflow progress and reports status

## Model
- Primary: glm-4.7-flash
- Fallback: glm-4.6v-flash

## Usage
The Orchestrator is automatically invoked when you submit a complex request via the AI chat. It creates an execution plan and dispatches sub-tasks to other agents.

## Task Types
- \`coordinate\`: Plan and coordinate a multi-agent workflow

## Channels
The Orchestrator does not directly access Agent-Reach channels. It delegates all channel operations to specialized agents.`,
    },
    {
      agentName: 'prospect-discovery',
      title: 'Getting Started with Prospect Discovery',
      category: 'getting_started',
      content: `# Prospect Discovery Agent (Scout)

## Overview
The Prospect Discovery Agent searches across 17+ internet channels to find companies and decision-makers matching your ICP. It uses multi-round deep search strategies and never accepts zero results.

## Capabilities
- **Multi-Channel Search**: Simultaneously searches Web, LinkedIn, Exa, GitHub, Reddit, Twitter, YouTube
- **Deep Search**: Generates sub-queries for niche discovery beyond initial results
- **LLM Extraction**: Extracts structured company data from raw search results
- **Resilient Fallback**: LLM knowledge → hardcoded data ensures non-zero results

## Channels
- Web Search (z-ai-web-dev-sdk)
- LinkedIn (companies + people)
- Exa Semantic Search
- GitHub Repositories
- Reddit Discussions
- Twitter/X Posts
- YouTube Videos
- RSS Feeds

## Task Types
- \`search\`: Discover companies matching ICP criteria`,
    },
    {
      agentName: 'data-enrichment',
      title: 'Getting Started with Data Enrichment',
      category: 'getting_started',
      content: `# Data Enrichment Agent (Prism)

## Overview
The Data Enrichment Agent transforms sparse company data into rich, actionable intelligence by reading websites, extracting firmographics and technographics, and filling in missing data points.

## Capabilities
- **Web Reading**: Reads company websites via Jina Reader
- **LinkedIn Extraction**: Pulls employee counts, key contacts, org charts
- **Firmographic Enrichment**: Revenue, industry, size, location, founding year
- **Technographic Enrichment**: Technology stack, tools, infrastructure
- **Contact Discovery**: Key decision-maker names, titles, emails

## Channels
- Web (Jina Reader)
- LinkedIn (profiles + company pages)
- Exa Search
- Twitter
- GitHub

## Task Types
- \`enrich\`: Enrich leads with firmographic and technographic data`,
    },
    {
      agentName: 'web-research',
      title: 'Getting Started with Web Research',
      category: 'getting_started',
      content: `# Web Research Agent (DeepDive)

## Overview
The Web Research Agent conducts deep, multi-source research on companies, markets, and industries. It synthesizes information from news, social media, and financial data.

## Capabilities
- **Deep Research**: Multi-step research across all channels
- **News Synthesis**: Aggregates and summarizes recent news and press
- **Market Analysis**: Identifies trends, opportunities, and threats
- **Competitive Intelligence**: Monitors competitors and market positioning

## Channels
- Web (Jina Reader)
- Exa Search
- LinkedIn
- Twitter
- YouTube
- Reddit
- RSS Feeds`,
    },
    {
      agentName: 'lead-qualification',
      title: 'Getting Started with Lead Qualification',
      category: 'getting_started',
      content: `# Lead Qualification Agent (Judge)

## Overview
The Lead Qualification Agent applies rigorous multi-dimensional scoring frameworks to evaluate lead quality and prioritize outreach.

## Capabilities
- **BANT Scoring**: Budget, Authority, Need, Timeline
- **MEDDIC Evaluation**: Metrics, Economic Buyer, Decision, Decision Process, Identify Pain, Champion
- **Prospect Scoring**: Composite scoring across firmographic, intent, and strategic dimensions
- **ICP Matching**: Scores leads against Ideal Customer Profile criteria

## Scoring Dimensions
- Firmographic Score (0-100)
- Intent Score (0-100)
- Reachability Score (0-100)
- Strategic Score (0-100)
- Data Completeness (0-100)`,
    },
    {
      agentName: 'outreach-composer',
      title: 'Getting Started with Outreach Composer',
      category: 'getting_started',
      content: `# Outreach Composer Agent (Pen)

## Overview
The Outreach Composer Agent crafts hyper-personalized outreach messages using enriched lead data and proven copywriting frameworks.

## Capabilities
- **Multi-Framework**: AIDA, PAS, BAB, Champion frameworks
- **Channel-Specific**: Optimized for email and LinkedIn
- **Personalization**: Uses enriched data for contextual relevance
- **Sequence Design**: Multi-step outreach with follow-ups

## Copywriting Frameworks
1. **AIDA**: Attention → Interest → Desire → Action
2. **PAS**: Problem → Agitate → Solution
3. **BAB**: Before → After → Bridge
4. **Champion**: Strategic, relationship-first approach`,
    },
    {
      agentName: 'pipeline-manager',
      title: 'Getting Started with Pipeline Manager',
      category: 'getting_started',
      content: `# Pipeline Manager Agent (Flow)

## Overview
The Pipeline Manager Agent tracks every lead through the sales pipeline, automates stage transitions, and ensures no opportunity falls through the cracks.

## Capabilities
- **Stage Transitions**: Automatic progression through pipeline stages
- **Follow-Up Automation**: Scheduled follow-ups based on stage and engagement
- **CRM Sync**: Bidirectional sync with GHL and popular CRMs
- **Alert System**: Notifications for hot leads and stalled opportunities

## Pipeline Stages
New → Enriched → Qualified → Contacted → Engaged → Negotiating → Closed Won / Closed Lost / Nurture`,
    },
    {
      agentName: 'report-generator',
      title: 'Getting Started with Report Generator',
      category: 'getting_started',
      content: `# Report Generator Agent (Insight)

## Overview
The Report Generator Agent transforms raw pipeline data into actionable intelligence through performance reports, trend analysis, and optimization recommendations.

## Capabilities
- **Pipeline Reports**: Stage distribution, conversion rates, velocity metrics
- **Score Distribution**: Lead quality analysis across scoring dimensions
- **Campaign Performance**: Per-campaign ROI and effectiveness analysis
- **AI Insights**: Automated pattern detection and anomaly flagging
- **Action Items**: Prioritized recommendations based on data analysis

## Report Types
1. Pipeline Health Report
2. Lead Score Distribution
3. Campaign Performance Summary
4. AI-Generated Insights
5. Prioritized Action Items`,
    },
  ];

  let created = 0;
  for (const doc of docs) {
    try {
      await upsertDoc(doc);
      created++;
    } catch {
      // May already exist
    }
  }
  return created;
}
