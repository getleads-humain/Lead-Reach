/**
 * Sales Enablement Engine
 *
 * Comprehensive sales enablement capabilities for the LeadReach platform:
 * playbooks, battle cards, proposal generation, content library, and training.
 *
 * Uses centralized callLLMForJSON for rate limiting, retries, and model fallback.
 * Includes realistic fallback data for when LLM is unavailable.
 */

import { callLLMForJSON } from '@/lib/llm';
import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

export interface PlaybookStage {
  name: string;
  description: string;
  actions: string[];
  scripts: string[];
  collateral: string[];
}

export interface SalesPlaybook {
  id: string;
  name: string;
  industry: string;
  stages: PlaybookStage[];
  objectives: string[];
  tactics: string[];
  kpis: string[];
  createdFrom: 'ai' | 'manual' | 'template';
  createdAt?: string;
  updatedAt?: string;
}

export interface BattleCard {
  id: string;
  competitorName: string;
  overview: string;
  strengths: string[];
  weaknesses: string[];
  positioning: string;
  talkingPoints: string[];
  objectionResponses: { objection: string; response: string }[];
  pricingIntel: string;
  winStrategies: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProposalPricingOption {
  tier: 'starter' | 'professional' | 'enterprise';
  label: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export interface SalesProposal {
  id: string;
  leadId: string;
  companyName: string;
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  pricing: ProposalPricingOption[];
  timeline: string;
  roiProjection: string;
  nextSteps: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type SalesCollateralType =
  | 'case-study'
  | 'whitepaper'
  | 'one-pager'
  | 'demo-script'
  | 'email-template'
  | 'slide-deck'
  | 'roi-calculator'
  | 'comparison-sheet';

export interface SalesCollateral {
  id: string;
  type: SalesCollateralType;
  title: string;
  description: string;
  content: string;
  tags: string[];
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesTrainingQuiz {
  questions: { question: string; options: string[]; correctIndex: number }[];
}

export interface SalesTraining {
  id: string;
  module: string;
  topic: string;
  content: string;
  quiz: SalesTrainingQuiz;
  completionRate: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// Lead data shape (reused across functions)
// ============================================================

interface LeadContext {
  leadId?: string;
  companyName?: string;
  contactName?: string;
  industry?: string;
  employeeCount?: string;
  revenueEstimate?: string;
  painPoints?: string[];
  currentTools?: string[];
  stage?: string;
  notes?: string;
  [key: string]: unknown;
}

interface DealContext {
  dealSize?: string;
  timeline?: string;
  competitorsConsidered?: string[];
  decisionMakers?: string[];
  budget?: string;
  urgency?: 'low' | 'medium' | 'high';
  additionalContext?: string;
}

// ============================================================
// ID generator (matches db-supabase CUID style)
// ============================================================

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${timestamp}${randomPart}`;
}

// ============================================================
// PLAYBOOK ENGINE
// ============================================================

/**
 * Generate a complete sales playbook for an industry using LLM.
 * Includes 6 stages: prospecting, discovery, qualification,
 * proposal, negotiation, closing — each with actions, scripts,
 * and collateral recommendations.
 */
export async function generatePlaybook(
  industry: string,
  productContext?: string
): Promise<SalesPlaybook> {
  const systemPrompt = `You are an expert B2B sales strategist who creates detailed, actionable sales playbooks. Generate a complete sales playbook tailored to the specified industry. Each stage must include specific actions, talk scripts, and recommended collateral. Return ONLY valid JSON.`;

  const userMessage = `INDUSTRY: ${industry}
${productContext ? `PRODUCT/SERVICE CONTEXT: ${productContext}` : 'PRODUCT/SERVICE CONTEXT: LeadReach — an AI-powered B2B lead generation and sales intelligence platform'}

Generate a comprehensive sales playbook with exactly 6 stages (prospecting, discovery, qualification, proposal, negotiation, closing) as JSON:
{
  "name": "Descriptive playbook name",
  "objectives": ["Primary objective", "Secondary objective", "Tertiary objective"],
  "tactics": ["Tactic 1", "Tactic 2", "Tactic 3", "Tactic 4", "Tactic 5"],
  "kpis": ["KPI 1", "KPI 2", "KPI 3", "KPI 4", "KPI 5"],
  "stages": [
    {
      "name": "Prospecting",
      "description": "Identify and research potential customers in the ${industry} sector",
      "actions": ["Action 1", "Action 2", "Action 3", "Action 4"],
      "scripts": ["Opening script for initial outreach", "Follow-up script"],
      "collateral": ["Recommended content piece 1", "Recommended content piece 2"]
    },
    {
      "name": "Discovery",
      "description": "Understand prospect needs, pain points, and buying process",
      "actions": ["Action 1", "Action 2", "Action 3", "Action 4"],
      "scripts": ["Discovery call opening", "Key discovery questions script"],
      "collateral": ["Recommended content piece 1", "Recommended content piece 2"]
    },
    {
      "name": "Qualification",
      "description": "Validate fit using BANT/MEDDIC criteria",
      "actions": ["Action 1", "Action 2", "Action 3", "Action 4"],
      "scripts": ["Qualification conversation script", "Budget discussion script"],
      "collateral": ["Recommended content piece 1", "Recommended content piece 2"]
    },
    {
      "name": "Proposal",
      "description": "Present a tailored solution and pricing",
      "actions": ["Action 1", "Action 2", "Action 3", "Action 4"],
      "scripts": ["Proposal presentation script", "Value articulation script"],
      "collateral": ["Recommended content piece 1", "Recommended content piece 2"]
    },
    {
      "name": "Negotiation",
      "description": "Address objections and negotiate terms",
      "actions": ["Action 1", "Action 2", "Action 3", "Action 4"],
      "scripts": ["Objection handling script", "Pricing negotiation script"],
      "collateral": ["Recommended content piece 1", "Recommended content piece 2"]
    },
    {
      "name": "Closing",
      "description": "Secure commitment and begin onboarding",
      "actions": ["Action 1", "Action 2", "Action 3", "Action 4"],
      "scripts": ["Closing script", "Next steps script"],
      "collateral": ["Recommended content piece 1", "Recommended content piece 2"]
    }
  ]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      id: generateId('pb'),
      name: (parsed?.name as string) || `${industry} Sales Playbook`,
      industry,
      stages: parsed && Array.isArray(parsed.stages)
        ? (parsed.stages as Record<string, unknown>[]).map(mapPlaybookStage)
        : getDefaultPlaybookStages(industry),
      objectives: parsed && Array.isArray(parsed.objectives)
        ? (parsed.objectives as string[])
        : getDefaultObjectives(industry),
      tactics: parsed && Array.isArray(parsed.tactics)
        ? (parsed.tactics as string[])
        : getDefaultTactics(industry),
      kpis: parsed && Array.isArray(parsed.kpis)
        ? (parsed.kpis as string[])
        : getDefaultKPIs(),
      createdFrom: 'ai',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SalesEnablement] Playbook generation failed, using defaults:', error);
    return {
      id: generateId('pb'),
      name: `${industry} Sales Playbook`,
      industry,
      stages: getDefaultPlaybookStages(industry),
      objectives: getDefaultObjectives(industry),
      tactics: getDefaultTactics(industry),
      kpis: getDefaultKPIs(),
      createdFrom: 'ai',
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Use LLM to customize a playbook for a specific lead.
 * Adjusts stages, scripts, and collateral based on lead data.
 */
export async function customizePlaybookForLead(
  playbook: SalesPlaybook,
  leadData: LeadContext
): Promise<SalesPlaybook> {
  const systemPrompt = `You are an expert B2B sales strategist. Customize an existing sales playbook for a specific prospect. Adjust the actions, scripts, and collateral recommendations to match the prospect's industry, size, pain points, and current situation. Return ONLY valid JSON.`;

  const userMessage = `EXISTING PLAYBOOK: ${playbook.name}
INDUSTRY: ${playbook.industry}
CURRENT STAGES: ${playbook.stages.map(s => s.name).join(', ')}

PROSPECT DATA:
- Company: ${leadData.companyName || 'Unknown'}
- Contact: ${leadData.contactName || 'Unknown'}
- Industry: ${leadData.industry || playbook.industry}
- Size: ${leadData.employeeCount || 'Unknown'}
- Revenue: ${leadData.revenueEstimate || 'Unknown'}
- Pain Points: ${leadData.painPoints?.join(', ') || 'Unknown'}
- Current Tools: ${leadData.currentTools?.join(', ') || 'Unknown'}
- Stage: ${leadData.stage || 'Unknown'}
${leadData.notes ? `- Notes: ${leadData.notes}` : ''}

Customize each stage for this specific prospect. Return the FULL playbook as JSON:
{
  "name": "Customized playbook name for this prospect",
  "stages": [
    {
      "name": "Stage name",
      "description": "Tailored description for this prospect",
      "actions": ["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4"],
      "scripts": ["Tailored script 1", "Tailored script 2"],
      "collateral": ["Specific collateral 1", "Specific collateral 2"]
    }
  ],
  "objectives": ["Customized objective 1", "Customized objective 2", "Customized objective 3"],
  "tactics": ["Customized tactic 1", "Customized tactic 2", "Customized tactic 3", "Customized tactic 4", "Customized tactic 5"],
  "kpis": ["KPI 1", "KPI 2", "KPI 3", "KPI 4", "KPI 5"]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      ...playbook,
      id: generateId('pb'),
      name: (parsed?.name as string) || `${playbook.name} — ${leadData.companyName || 'Custom'}`,
      stages: parsed && Array.isArray(parsed.stages)
        ? (parsed.stages as Record<string, unknown>[]).map(mapPlaybookStage)
        : playbook.stages,
      objectives: parsed && Array.isArray(parsed.objectives)
        ? (parsed.objectives as string[])
        : playbook.objectives,
      tactics: parsed && Array.isArray(parsed.tactics)
        ? (parsed.tactics as string[])
        : playbook.tactics,
      kpis: parsed && Array.isArray(parsed.kpis)
        ? (parsed.kpis as string[])
        : playbook.kpis,
      createdFrom: 'ai',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SalesEnablement] Playbook customization failed, using original:', error);
    return {
      ...playbook,
      id: generateId('pb'),
      name: `${playbook.name} — ${leadData.companyName || 'Custom'}`,
      createdFrom: 'ai',
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get saved playbooks from DB, optionally filtered by industry.
 */
export async function getPlaybooks(industry?: string): Promise<SalesPlaybook[]> {
  try {
    const where = industry ? { industry } : {};
    const results = await db.prospectReport.findMany({
      where: { ...where, type: 'sales_playbook' } as Record<string, unknown>,
      orderBy: { createdAt: 'desc' },
    });
    return results.map((row: Record<string, unknown>) => {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      return {
        id: (row.id as string) || generateId('pb'),
        name: (data?.name as string) || 'Untitled Playbook',
        industry: (data?.industry as string) || 'Unknown',
        stages: Array.isArray(data?.stages) ? data.stages.map(mapPlaybookStage) : [],
        objectives: Array.isArray(data?.objectives) ? data.objectives : [],
        tactics: Array.isArray(data?.tactics) ? data.tactics : [],
        kpis: Array.isArray(data?.kpis) ? data.kpis : [],
        createdFrom: (data?.createdFrom as SalesPlaybook['createdFrom']) || 'manual',
        createdAt: (row.createdAt as string) || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.warn('[SalesEnablement] Failed to fetch playbooks from DB:', error);
    return [];
  }
}

/**
 * Save a playbook to DB.
 */
export async function savePlaybook(playbook: SalesPlaybook): Promise<SalesPlaybook> {
  try {
    const now = new Date().toISOString();
    await db.prospectReport.create({
      data: {
        type: 'sales_playbook',
        title: playbook.name,
        data: JSON.stringify(playbook),
        createdAt: now,
        updatedAt: now,
      } as Record<string, unknown>,
    });
    return { ...playbook, createdAt: playbook.createdAt || now, updatedAt: now };
  } catch (error) {
    console.warn('[SalesEnablement] Failed to save playbook to DB:', error);
    return playbook;
  }
}

// ============================================================
// BATTLE CARD GENERATOR
// ============================================================

/**
 * Generate competitive intelligence battle card using LLM.
 * Includes: competitor overview, strengths/weaknesses vs our platform,
 * positioning statements, talking points, objection responses,
 * pricing intelligence, and win strategies.
 */
export async function generateBattleCard(
  competitorName: string,
  context?: string
): Promise<BattleCard> {
  const systemPrompt = `You are an expert competitive intelligence analyst for LeadReach — an AI-powered B2B lead generation and sales intelligence platform. Create a detailed, actionable battle card that helps sales reps compete against the specified competitor. Be specific, factual, and strategic. Return ONLY valid JSON.`;

  const userMessage = `COMPETITOR: ${competitorName}
OUR PLATFORM: LeadReach — AI-powered B2B lead generation, prospecting, multi-channel outreach, and sales intelligence
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Generate a comprehensive battle card as JSON:
{
  "overview": "2-3 sentence overview of the competitor and their market position",
  "strengths": ["Their strength 1", "Their strength 2", "Their strength 3", "Their strength 4"],
  "weaknesses": ["Their weakness 1", "Their weakness 2", "Their weakness 3", "Their weakness 4"],
  "positioning": "How LeadReach should position against this competitor — 2-3 sentences",
  "talkingPoints": ["Talk track 1", "Talk track 2", "Talk track 3", "Talk track 4", "Talk track 5"],
  "objectionResponses": [
    { "objection": "Prospect says they are already using ${competitorName}", "response": "How to respond" },
    { "objection": "Prospect says ${competitorName} is cheaper", "response": "How to respond" },
    { "objection": "Prospect says ${competitorName} has feature X that you don't", "response": "How to respond" },
    { "objection": "Prospect says they have a long-term contract with ${competitorName}", "response": "How to respond" }
  ],
  "pricingIntel": "What is known about their pricing model, tiers, and typical deal sizes",
  "winStrategies": ["Strategy 1", "Strategy 2", "Strategy 3", "Strategy 4", "Strategy 5"]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      id: generateId('bc'),
      competitorName,
      overview: (parsed?.overview as string) || `${competitorName} is a competitor in the B2B sales intelligence space.`,
      strengths: parsed && Array.isArray(parsed.strengths)
        ? (parsed.strengths as string[])
        : ['Established market presence', 'Brand recognition'],
      weaknesses: parsed && Array.isArray(parsed.weaknesses)
        ? (parsed.weaknesses as string[])
        : ['Limited AI capabilities', 'Weaker multi-channel support'],
      positioning: (parsed?.positioning as string) || 'Position LeadReach as the AI-native, more comprehensive alternative with superior automation and intelligence.',
      talkingPoints: parsed && Array.isArray(parsed.talkingPoints)
        ? (parsed.talkingPoints as string[])
        : ['LeadReach offers AI-powered prospecting', 'Multi-channel outreach from a single platform', 'Superior lead scoring and enrichment'],
      objectionResponses: parsed && Array.isArray(parsed.objectionResponses)
        ? (parsed.objectionResponses as Record<string, string>[]).map(o => ({
            objection: o.objection || '',
            response: o.response || '',
          }))
        : getDefaultObjectionResponses(competitorName),
      pricingIntel: (parsed?.pricingIntel as string) || `${competitorName} typically offers tiered SaaS pricing. Emphasize LeadReach's superior ROI.`,
      winStrategies: parsed && Array.isArray(parsed.winStrategies)
        ? (parsed.winStrategies as string[])
        : ['Focus on AI differentiation', 'Highlight customer success stories', 'Offer a competitive migration program'],
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SalesEnablement] Battle card generation failed, using defaults:', error);
    return {
      id: generateId('bc'),
      competitorName,
      overview: `${competitorName} is a competitor in the B2B sales technology space. Research their specific capabilities and market positioning for a complete comparison.`,
      strengths: ['Established market presence', 'Brand recognition', 'Existing customer base'],
      weaknesses: ['May lack AI-native capabilities', 'Potentially limited multi-channel support', 'Legacy architecture constraints'],
      positioning: 'Position LeadReach as the AI-native, more comprehensive alternative with superior automation, intelligence, and multi-channel capabilities.',
      talkingPoints: [
        'LeadReach offers AI-powered prospecting that learns and improves over time',
        'Unified multi-channel outreach across email, LinkedIn, phone, and more',
        'Superior lead scoring with behavioral and intent signals',
        'Faster time-to-value with automated workflows',
        'Real-time competitive intelligence and battle cards',
      ],
      objectionResponses: getDefaultObjectionResponses(competitorName),
      pricingIntel: `Pricing information for ${competitorName} should be researched prior to sales conversations. Focus on total cost of ownership and ROI comparison.`,
      winStrategies: [
        'Differentiate on AI-native architecture vs bolt-on AI features',
        'Highlight customer success stories with measurable ROI',
        'Offer a competitive displacement program or pilot',
        'Focus on integration breadth and workflow automation',
        'Emphasize faster implementation and time-to-value',
      ],
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Generate a comparison matrix across multiple competitors.
 */
export async function compareCompetitors(competitors: string[]): Promise<{
  competitors: BattleCard[];
  comparisonMatrix: { dimension: string; entries: { competitor: string; rating: string; notes: string }[] }[];
}> {
  if (competitors.length === 0) {
    return { competitors: [], comparisonMatrix: [] };
  }

  // Generate individual battle cards in parallel
  const battleCards = await Promise.all(
    competitors.map(name => generateBattleCard(name))
  );

  // Build a comparison matrix using LLM
  const systemPrompt = `You are an expert competitive analyst. Create a comparison matrix across the listed competitors from the perspective of LeadReach (our platform). Rate each competitor on key dimensions. Return ONLY valid JSON.`;

  const userMessage = `OUR PLATFORM: LeadReach — AI-powered B2B lead generation and sales intelligence
COMPETITORS TO COMPARE: ${competitors.join(', ')}

Generate a comparison matrix as JSON:
{
  "dimensions": [
    {
      "dimension": "AI & Automation",
      "entries": [
        { "competitor": "${competitors[0]}", "rating": "Strong/Moderate/Weak", "notes": "Brief note" },
        ...
      ]
    },
    {
      "dimension": "Multi-Channel Outreach",
      "entries": [ ... ]
    },
    {
      "dimension": "Lead Scoring & Enrichment",
      "entries": [ ... ]
    },
    {
      "dimension": "Ease of Use",
      "entries": [ ... ]
    },
    {
      "dimension": "Pricing Value",
      "entries": [ ... ]
    },
    {
      "dimension": "Customer Support",
      "entries": [ ... ]
    },
    {
      "dimension": "Integration Ecosystem",
      "entries": [ ... ]
    }
  ]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    const dimensions = parsed && Array.isArray(parsed.dimensions)
      ? (parsed.dimensions as Record<string, unknown>[]).map(d => ({
          dimension: (d.dimension as string) || 'Unknown',
          entries: Array.isArray(d.entries)
            ? (d.entries as Record<string, string>[]).map(e => ({
                competitor: e.competitor || '',
                rating: e.rating || 'Unknown',
                notes: e.notes || '',
              }))
            : [],
        }))
      : getDefaultComparisonDimensions(competitors);

    return { competitors: battleCards, comparisonMatrix: dimensions };
  } catch (error) {
    console.warn('[SalesEnablement] Comparison matrix generation failed, using defaults:', error);
    return {
      competitors: battleCards,
      comparisonMatrix: getDefaultComparisonDimensions(competitors),
    };
  }
}

/**
 * Get all battle cards from DB.
 */
export async function getBattleCards(): Promise<BattleCard[]> {
  try {
    const results = await db.prospectReport.findMany({
      where: { type: 'battle_card' } as Record<string, unknown>,
      orderBy: { createdAt: 'desc' },
    });
    return results.map((row: Record<string, unknown>) => {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      return {
        id: (row.id as string) || generateId('bc'),
        competitorName: (data?.competitorName as string) || 'Unknown',
        overview: (data?.overview as string) || '',
        strengths: Array.isArray(data?.strengths) ? data.strengths : [],
        weaknesses: Array.isArray(data?.weaknesses) ? data.weaknesses : [],
        positioning: (data?.positioning as string) || '',
        talkingPoints: Array.isArray(data?.talkingPoints) ? data.talkingPoints : [],
        objectionResponses: Array.isArray(data?.objectionResponses) ? data.objectionResponses : [],
        pricingIntel: (data?.pricingIntel as string) || '',
        winStrategies: Array.isArray(data?.winStrategies) ? data.winStrategies : [],
        createdAt: (row.createdAt as string) || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.warn('[SalesEnablement] Failed to fetch battle cards from DB:', error);
    return [];
  }
}

/**
 * Save a battle card to DB.
 */
export async function saveBattleCard(card: BattleCard): Promise<BattleCard> {
  try {
    const now = new Date().toISOString();
    await db.prospectReport.create({
      data: {
        type: 'battle_card',
        title: `Battle Card: ${card.competitorName}`,
        data: JSON.stringify(card),
        createdAt: now,
        updatedAt: now,
      } as Record<string, unknown>,
    });
    return { ...card, createdAt: card.createdAt || now, updatedAt: now };
  } catch (error) {
    console.warn('[SalesEnablement] Failed to save battle card to DB:', error);
    return card;
  }
}

// ============================================================
// PROPOSAL GENERATOR
// ============================================================

/**
 * Generate a full sales proposal using LLM.
 * Includes: executive summary, problem statement, proposed solution,
 * pricing options (starter/professional/enterprise), implementation timeline,
 * ROI projections, and next steps.
 */
export async function generateProposal(
  leadData: LeadContext,
  dealContext?: DealContext
): Promise<SalesProposal> {
  const systemPrompt = `You are an expert B2B sales proposal writer for LeadReach — an AI-powered B2B lead generation and sales intelligence platform. Create a compelling, professional proposal that addresses the prospect's specific needs and demonstrates clear ROI. Return ONLY valid JSON.`;

  const userMessage = `PROSPECT:
- Company: ${leadData.companyName || 'Unknown'}
- Contact: ${leadData.contactName || 'Unknown'}
- Industry: ${leadData.industry || 'Unknown'}
- Size: ${leadData.employeeCount || 'Unknown'}
- Revenue: ${leadData.revenueEstimate || 'Unknown'}
- Pain Points: ${leadData.painPoints?.join(', ') || 'Unknown'}
- Current Tools: ${leadData.currentTools?.join(', ') || 'Unknown'}
- Stage: ${leadData.stage || 'Unknown'}
${leadData.notes ? `- Notes: ${leadData.notes}` : ''}

DEAL CONTEXT:
- Deal Size: ${dealContext?.dealSize || 'Not specified'}
- Timeline: ${dealContext?.timeline || 'Not specified'}
- Competitors Considered: ${dealContext?.competitorsConsidered?.join(', ') || 'None'}
- Decision Makers: ${dealContext?.decisionMakers?.join(', ') || 'Unknown'}
- Budget: ${dealContext?.budget || 'Not specified'}
- Urgency: ${dealContext?.urgency || 'medium'}
${dealContext?.additionalContext ? `- Additional Context: ${dealContext.additionalContext}` : ''}

Generate a complete sales proposal as JSON:
{
  "executiveSummary": "2-3 paragraph executive summary tailored to this prospect",
  "problemStatement": "2-3 paragraph problem statement based on their pain points and industry challenges",
  "proposedSolution": "3-4 paragraph solution description mapping features to their needs",
  "pricing": [
    {
      "tier": "starter",
      "label": "Starter",
      "price": "$X/month",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "recommended": false
    },
    {
      "tier": "professional",
      "label": "Professional",
      "price": "$X/month",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
      "recommended": true
    },
    {
      "tier": "enterprise",
      "label": "Enterprise",
      "price": "Custom",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6", "Feature 7"],
      "recommended": false
    }
  ],
  "timeline": "Implementation timeline with key milestones",
  "roiProjection": "Detailed ROI projection with specific metrics and timeframes",
  "nextSteps": ["Step 1", "Step 2", "Step 3", "Step 4"]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      id: generateId('prop'),
      leadId: leadData.leadId || generateId('lead'),
      companyName: leadData.companyName || 'Unknown',
      executiveSummary: (parsed?.executiveSummary as string) || getDefaultExecutiveSummary(leadData),
      problemStatement: (parsed?.problemStatement as string) || getDefaultProblemStatement(leadData),
      proposedSolution: (parsed?.proposedSolution as string) || getDefaultSolution(leadData),
      pricing: parsed && Array.isArray(parsed.pricing)
        ? (parsed.pricing as Record<string, unknown>[]).map(mapPricingOption)
        : getDefaultPricing(),
      timeline: (parsed?.timeline as string) || getDefaultTimeline(),
      roiProjection: (parsed?.roiProjection as string) || getDefaultROI(leadData),
      nextSteps: parsed && Array.isArray(parsed.nextSteps)
        ? (parsed.nextSteps as string[])
        : ['Schedule a demo', 'Review proposal with stakeholders', 'Align on implementation timeline', 'Sign agreement and begin onboarding'],
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SalesEnablement] Proposal generation failed, using defaults:', error);
    return {
      id: generateId('prop'),
      leadId: leadData.leadId || generateId('lead'),
      companyName: leadData.companyName || 'Unknown',
      executiveSummary: getDefaultExecutiveSummary(leadData),
      problemStatement: getDefaultProblemStatement(leadData),
      proposedSolution: getDefaultSolution(leadData),
      pricing: getDefaultPricing(),
      timeline: getDefaultTimeline(),
      roiProjection: getDefaultROI(leadData),
      nextSteps: [
        'Schedule a detailed demo with your team',
        'Review the proposal with key stakeholders',
        'Align on implementation timeline and requirements',
        'Sign agreement and begin onboarding',
      ],
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Iterate on a proposal based on feedback.
 */
export async function customizeProposal(
  proposal: SalesProposal,
  feedback: string
): Promise<SalesProposal> {
  const systemPrompt = `You are an expert B2B sales proposal writer. Revise and improve a sales proposal based on stakeholder feedback. Address all concerns and adjust the proposal accordingly. Return ONLY valid JSON.`;

  const userMessage = `CURRENT PROPOSAL:
- Company: ${proposal.companyName}
- Executive Summary: ${proposal.executiveSummary.slice(0, 500)}
- Problem Statement: ${proposal.problemStatement.slice(0, 500)}
- Solution: ${proposal.proposedSolution.slice(0, 500)}
- Current Pricing Tiers: ${proposal.pricing.map(p => `${p.label}: ${p.price}`).join(', ')}
- Timeline: ${proposal.timeline.slice(0, 300)}
- ROI: ${proposal.roiProjection.slice(0, 300)}

STAKEHOLDER FEEDBACK:
${feedback}

Revise the proposal as JSON:
{
  "executiveSummary": "Revised executive summary",
  "problemStatement": "Revised problem statement",
  "proposedSolution": "Revised solution",
  "pricing": [
    { "tier": "starter|professional|enterprise", "label": "Tier label", "price": "Price", "features": ["F1", "F2"], "recommended": true/false }
  ],
  "timeline": "Revised timeline",
  "roiProjection": "Revised ROI projection",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      ...proposal,
      executiveSummary: (parsed?.executiveSummary as string) || proposal.executiveSummary,
      problemStatement: (parsed?.problemStatement as string) || proposal.problemStatement,
      proposedSolution: (parsed?.proposedSolution as string) || proposal.proposedSolution,
      pricing: parsed && Array.isArray(parsed.pricing)
        ? (parsed.pricing as Record<string, unknown>[]).map(mapPricingOption)
        : proposal.pricing,
      timeline: (parsed?.timeline as string) || proposal.timeline,
      roiProjection: (parsed?.roiProjection as string) || proposal.roiProjection,
      nextSteps: parsed && Array.isArray(parsed.nextSteps)
        ? (parsed.nextSteps as string[])
        : proposal.nextSteps,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SalesEnablement] Proposal customization failed, using original:', error);
    return { ...proposal, updatedAt: new Date().toISOString() };
  }
}

/**
 * Get saved proposals from DB, optionally filtered by leadId.
 */
export async function getProposals(leadId?: string): Promise<SalesProposal[]> {
  try {
    const where: Record<string, unknown> = { type: 'sales_proposal' };
    if (leadId) {
      where.leadId = leadId;
    }
    const results = await db.prospectReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return results.map((row: Record<string, unknown>) => {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      return {
        id: (row.id as string) || generateId('prop'),
        leadId: (data?.leadId as string) || '',
        companyName: (data?.companyName as string) || 'Unknown',
        executiveSummary: (data?.executiveSummary as string) || '',
        problemStatement: (data?.problemStatement as string) || '',
        proposedSolution: (data?.proposedSolution as string) || '',
        pricing: Array.isArray(data?.pricing) ? data.pricing.map(mapPricingOption) : getDefaultPricing(),
        timeline: (data?.timeline as string) || '',
        roiProjection: (data?.roiProjection as string) || '',
        nextSteps: Array.isArray(data?.nextSteps) ? data.nextSteps : [],
        createdAt: (row.createdAt as string) || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.warn('[SalesEnablement] Failed to fetch proposals from DB:', error);
    return [];
  }
}

/**
 * Save a proposal to DB.
 */
export async function saveProposal(proposal: SalesProposal): Promise<SalesProposal> {
  try {
    const now = new Date().toISOString();
    await db.prospectReport.create({
      data: {
        type: 'sales_proposal',
        title: `Proposal: ${proposal.companyName}`,
        leadId: proposal.leadId,
        data: JSON.stringify(proposal),
        createdAt: now,
        updatedAt: now,
      } as Record<string, unknown>,
    });
    return { ...proposal, createdAt: proposal.createdAt || now, updatedAt: now };
  } catch (error) {
    console.warn('[SalesEnablement] Failed to save proposal to DB:', error);
    return proposal;
  }
}

// ============================================================
// CONTENT LIBRARY
// ============================================================

/**
 * Use LLM to recommend relevant content based on lead's industry,
 * stage, and needs.
 */
export async function recommendContent(
  leadData: LeadContext,
  stage: string
): Promise<SalesCollateral[]> {
  const systemPrompt = `You are an expert sales content strategist for LeadReach — an AI-powered B2B lead generation platform. Recommend the most relevant sales content for the given prospect and deal stage. Return ONLY valid JSON.`;

  const userMessage = `PROSPECT:
- Company: ${leadData.companyName || 'Unknown'}
- Industry: ${leadData.industry || 'Unknown'}
- Size: ${leadData.employeeCount || 'Unknown'}
- Pain Points: ${leadData.painPoints?.join(', ') || 'Unknown'}
- Current Tools: ${leadData.currentTools?.join(', ') || 'Unknown'}

DEAL STAGE: ${stage}

Recommend 4-6 pieces of sales content as JSON:
{
  "recommendations": [
    {
      "type": "case-study|whitepaper|one-pager|demo-script|email-template|slide-deck|roi-calculator|comparison-sheet",
      "title": "Content title",
      "description": "Why this content is relevant for this prospect at this stage",
      "content": "Outline or key points of the content, 3-5 sentences",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed && Array.isArray(parsed.recommendations)) {
      return (parsed.recommendations as Record<string, unknown>[]).map(rec => ({
        id: generateId('col'),
        type: (['case-study', 'whitepaper', 'one-pager', 'demo-script', 'email-template', 'slide-deck', 'roi-calculator', 'comparison-sheet'].includes(rec.type as string)
          ? rec.type : 'one-pager') as SalesCollateralType,
        title: (rec.title as string) || 'Recommended Content',
        description: (rec.description as string) || '',
        content: (rec.content as string) || '',
        tags: Array.isArray(rec.tags) ? (rec.tags as string[]) : [leadData.industry || 'general', stage],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      }));
    }

    return getDefaultContentRecommendations(leadData, stage);
  } catch (error) {
    console.warn('[SalesEnablement] Content recommendation failed, using defaults:', error);
    return getDefaultContentRecommendations(leadData, stage);
  }
}

/**
 * Get content library items, optionally filtered by type and/or tags.
 */
export async function getContentLibrary(
  type?: SalesCollateralType,
  tags?: string[]
): Promise<SalesCollateral[]> {
  try {
    const where: Record<string, unknown> = { type: 'sales_collateral' };
    const results = await db.prospectReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let items = results.map((row: Record<string, unknown>) => {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      return {
        id: (row.id as string) || generateId('col'),
        type: (data?.type as SalesCollateralType) || 'one-pager',
        title: (data?.title as string) || 'Untitled',
        description: (data?.description as string) || '',
        content: (data?.content as string) || '',
        tags: Array.isArray(data?.tags) ? data.tags : [],
        usageCount: (data?.usageCount as number) || 0,
        createdAt: (row.createdAt as string) || new Date().toISOString(),
      } as SalesCollateral;
    });

    // Filter client-side for type and tags
    if (type) {
      items = items.filter(item => item.type === type);
    }
    if (tags && tags.length > 0) {
      items = items.filter(item =>
        tags.some(tag => item.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())))
      );
    }

    return items;
  } catch (error) {
    console.warn('[SalesEnablement] Failed to fetch content library from DB:', error);
    return [];
  }
}

/**
 * Track when content is used/shared.
 */
export async function trackContentUsage(contentId: string): Promise<void> {
  try {
    // Find the content item
    const row = await db.prospectReport.findUnique({
      where: { id: contentId },
    });

    if (!row) {
      console.warn('[SalesEnablement] Content item not found for usage tracking:', contentId);
      return;
    }

    const data = typeof (row as Record<string, unknown>).data === 'string'
      ? JSON.parse((row as Record<string, unknown>).data as string)
      : (row as Record<string, unknown>).data as Record<string, unknown>;

    const currentCount = (data?.usageCount as number) || 0;

    await db.prospectReport.update({
      where: { id: contentId },
      data: {
        data: JSON.stringify({ ...data, usageCount: currentCount + 1 }),
        updatedAt: new Date().toISOString(),
      } as Record<string, unknown>,
    });
  } catch (error) {
    console.warn('[SalesEnablement] Failed to track content usage:', error);
  }
}

/**
 * Get content usage and effectiveness metrics.
 */
export async function getContentPerformance(): Promise<{
  totalItems: number;
  totalUsage: number;
  byType: Record<SalesCollateralType, { count: number; totalUsage: number }>;
  topContent: SalesCollateral[];
}> {
  try {
    const items = await getContentLibrary();
    const byType = {} as Record<SalesCollateralType, { count: number; totalUsage: number }>;

    let totalUsage = 0;
    for (const item of items) {
      if (!byType[item.type]) {
        byType[item.type] = { count: 0, totalUsage: 0 };
      }
      byType[item.type].count++;
      byType[item.type].totalUsage += item.usageCount;
      totalUsage += item.usageCount;
    }

    const topContent = [...items]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    return {
      totalItems: items.length,
      totalUsage,
      byType,
      topContent,
    };
  } catch (error) {
    console.warn('[SalesEnablement] Failed to get content performance:', error);
    return {
      totalItems: 0,
      totalUsage: 0,
      byType: {} as Record<SalesCollateralType, { count: number; totalUsage: number }>,
      topContent: [],
    };
  }
}

// ============================================================
// SALES TRAINING MODULE
// ============================================================

/**
 * Generate training content using LLM for a given topic and experience level.
 */
export async function generateTrainingModule(
  topic: string,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<SalesTraining> {
  const systemPrompt = `You are an expert B2B sales trainer and curriculum designer for LeadReach — an AI-powered B2B lead generation and sales intelligence platform. Create a comprehensive training module that is practical, actionable, and includes a quiz to test understanding. Tailor the content depth to the experience level. Return ONLY valid JSON.`;

  const userMessage = `TOPIC: ${topic}
EXPERIENCE LEVEL: ${experienceLevel}

Generate a training module as JSON:
{
  "module": "Module name",
  "topic": "${topic}",
  "content": "Comprehensive training content — 4-6 paragraphs covering key concepts, best practices, common mistakes, and practical tips appropriate for ${experienceLevel} level. Include specific examples.",
  "quiz": {
    "questions": [
      {
        "question": "A relevant question about ${topic}",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0
      },
      {
        "question": "Another question about ${topic}",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 1
      },
      {
        "question": "Third question about ${topic}",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 2
      },
      {
        "question": "Fourth question about ${topic}",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0
      },
      {
        "question": "Fifth question about ${topic}",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 1
      }
    ]
  }
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      id: generateId('train'),
      module: (parsed?.module as string) || `${topic} Training`,
      topic,
      content: (parsed?.content as string) || getDefaultTrainingContent(topic, experienceLevel),
      quiz: parsed?.quiz && typeof parsed.quiz === 'object'
        ? {
            questions: Array.isArray((parsed.quiz as Record<string, unknown>).questions)
              ? ((parsed.quiz as Record<string, unknown>).questions as Record<string, unknown>[]).map(q => ({
                  question: (q.question as string) || '',
                  options: Array.isArray(q.options) ? (q.options as string[]) : ['A', 'B', 'C', 'D'],
                  correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                }))
              : getDefaultQuizQuestions(topic),
          }
        : { questions: getDefaultQuizQuestions(topic) },
      completionRate: 0,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[SalesEnablement] Training module generation failed, using defaults:', error);
    return {
      id: generateId('train'),
      module: `${topic} Training`,
      topic,
      content: getDefaultTrainingContent(topic, experienceLevel),
      quiz: { questions: getDefaultQuizQuestions(topic) },
      completionRate: 0,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get available training modules from DB.
 */
export async function getTrainingModules(): Promise<SalesTraining[]> {
  try {
    const results = await db.prospectReport.findMany({
      where: { type: 'sales_training' } as Record<string, unknown>,
      orderBy: { createdAt: 'desc' },
    });
    return results.map((row: Record<string, unknown>) => {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      return {
        id: (row.id as string) || generateId('train'),
        module: (data?.module as string) || 'Training Module',
        topic: (data?.topic as string) || 'Unknown',
        content: (data?.content as string) || '',
        quiz: data?.quiz || { questions: [] },
        completionRate: (data?.completionRate as number) || 0,
        createdAt: (row.createdAt as string) || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.warn('[SalesEnablement] Failed to fetch training modules from DB:', error);
    return [];
  }
}

/**
 * Track training completion for a user.
 */
export async function trackTrainingProgress(
  userId: string,
  moduleId: string
): Promise<{ completed: boolean; completionRate: number }> {
  try {
    // Find the training module
    const row = await db.prospectReport.findUnique({
      where: { id: moduleId },
    });

    if (!row) {
      console.warn('[SalesEnablement] Training module not found:', moduleId);
      return { completed: false, completionRate: 0 };
    }

    const data = typeof (row as Record<string, unknown>).data === 'string'
      ? JSON.parse((row as Record<string, unknown>).data as string)
      : (row as Record<string, unknown>).data as Record<string, unknown>;

    const currentRate = (data?.completionRate as number) || 0;
    const newRate = Math.min(100, currentRate + 25); // Increment by 25% per completion event

    await db.prospectReport.update({
      where: { id: moduleId },
      data: {
        data: JSON.stringify({
          ...data,
          completionRate: newRate,
          lastCompletedBy: userId,
          lastCompletedAt: new Date().toISOString(),
        }),
        updatedAt: new Date().toISOString(),
      } as Record<string, unknown>,
    });

    return { completed: newRate >= 100, completionRate: newRate };
  } catch (error) {
    console.warn('[SalesEnablement] Failed to track training progress:', error);
    return { completed: false, completionRate: 0 };
  }
}

// ============================================================
// Mapping Helpers
// ============================================================

function mapPlaybookStage(s: Record<string, unknown>): PlaybookStage {
  return {
    name: (s.name as string) || 'Unnamed Stage',
    description: (s.description as string) || '',
    actions: Array.isArray(s.actions) ? (s.actions as string[]) : [],
    scripts: Array.isArray(s.scripts) ? (s.scripts as string[]) : [],
    collateral: Array.isArray(s.collateral) ? (s.collateral as string[]) : [],
  };
}

function mapPricingOption(p: Record<string, unknown>): ProposalPricingOption {
  const validTiers = ['starter', 'professional', 'enterprise'];
  const tier = validTiers.includes(p.tier as string) ? p.tier as ProposalPricingOption['tier'] : 'professional';
  return {
    tier,
    label: (p.label as string) || tier.charAt(0).toUpperCase() + tier.slice(1),
    price: (p.price as string) || 'Contact for pricing',
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    recommended: typeof p.recommended === 'boolean' ? p.recommended : tier === 'professional',
  };
}

// ============================================================
// Comprehensive Fallback Data
// ============================================================

function getDefaultPlaybookStages(industry: string): PlaybookStage[] {
  return [
    {
      name: 'Prospecting',
      description: `Identify and research high-potential prospects in the ${industry} sector. Build targeted lists using firmographic, technographic, and intent data.`,
      actions: [
        'Build an ICP for the target segment within the industry',
        'Use LeadReach AI to discover prospects matching ICP criteria',
        'Enrich leads with company data, contact info, and intent signals',
        'Prioritize prospects using AI-powered lead scoring',
        'Set up automated prospecting alerts for new matches',
      ],
      scripts: [
        `Hi [First Name], I noticed [Company] is expanding in the ${industry} space. I work with ${industry} leaders to accelerate their pipeline using AI-powered prospecting. Would you be open to a 15-minute call to see how?`,
        `Hi [First Name], I saw [Company] was recently mentioned in [trigger event]. Companies like yours in ${industry} are using our platform to find and engage ideal prospects 3x faster. Worth a conversation?`,
      ],
      collateral: ['Industry-specific ICP template', 'Prospect discovery checklist', 'Lead scoring guide'],
    },
    {
      name: 'Discovery',
      description: `Conduct deep discovery calls to understand prospect challenges, goals, and buying process in the ${industry} space.`,
      actions: [
        'Prepare using LeadReach meeting prep with company research',
        'Ask open-ended discovery questions about current challenges',
        'Map the organizational structure and decision-making process',
        'Identify pain points, desired outcomes, and timeline',
        'Document findings and update lead profile in CRM',
      ],
      scripts: [
        `I'd love to understand more about how your team currently handles prospecting and lead generation. What's working well, and where are the biggest gaps?`,
        `Can you walk me through your current sales process from identifying a target to closing a deal? Where do you lose the most time or opportunities?`,
      ],
      collateral: ['Discovery call framework', 'Industry pain point guide', 'Competitive landscape summary'],
    },
    {
      name: 'Qualification',
      description: `Validate prospect fit using BANT/MEDDIC criteria. Ensure alignment between their needs and your solution capabilities.`,
      actions: [
        'Score the opportunity using LeadReach BANT/MEDDIC framework',
        'Confirm budget authority and timeline with the champion',
        'Identify and map all stakeholders in the buying committee',
        'Validate technical requirements and integration needs',
        'Determine competitive positioning and incumbent solutions',
      ],
      scripts: [
        `To make sure we're the right fit, can you help me understand your budget allocation for this type of solution and the timeline for making a decision?`,
        `Who else will be involved in evaluating and approving this decision? I want to make sure we address everyone's concerns.`,
      ],
      collateral: ['BANT qualification checklist', 'MEDDIC scorecard', 'ROI calculator worksheet'],
    },
    {
      name: 'Proposal',
      description: `Present a tailored proposal that maps LeadReach capabilities to the prospect's specific needs and demonstrates clear value.`,
      actions: [
        'Generate a customized proposal using LeadReach AI',
        'Include industry-specific case studies and social proof',
        'Present pricing options aligned with their budget and needs',
        'Schedule a proposal review meeting with key stakeholders',
        'Address any questions or concerns in real-time',
      ],
      scripts: [
        `Based on everything we've discussed, I've put together a proposal that addresses [specific pain points]. Let me walk you through how each component solves your challenges.`,
        `I've included three pricing tiers — the Professional plan is what most companies in your situation choose because it includes [key features they need].`,
      ],
      collateral: ['Case studies from similar companies', 'Product demo recording', 'Pricing comparison sheet'],
    },
    {
      name: 'Negotiation',
      description: `Handle objections, negotiate terms, and work toward a mutually beneficial agreement.`,
      actions: [
        'Prepare for common objections using battle cards',
        'Use the Feel-Felt-Realized framework for price objections',
        'Offer creative solutions (phased rollout, pilot program)',
        'Involve sales leadership for enterprise negotiations',
        'Document all agreed terms and concessions',
      ],
      scripts: [
        `I understand the pricing feels like a significant investment. Many of our clients felt the same way initially. What they realized was that the ROI typically pays for the platform within [X] months.`,
        `If budget timing is the concern, we could explore a phased approach — start with the core features now and expand in Q[Next]. Would that work better?`,
      ],
      collateral: ['Objection handling guide', 'Competitive battle cards', 'Customer reference list'],
    },
    {
      name: 'Closing',
      description: `Secure commitment, finalize contract terms, and ensure a smooth transition to onboarding.`,
      actions: [
        'Send the final contract for signature',
        'Coordinate with legal on any redlines',
        'Introduce the customer success team for onboarding',
        'Set up the initial onboarding kickoff meeting',
        'Celebrate the win and document lessons learned',
      ],
      scripts: [
        `We're excited to partner with [Company]. To get started, I'll need [signature/approval] on the agreement. Once that's in place, our customer success team will reach out to schedule your onboarding kickoff within 48 hours.`,
        `Is there anything else standing in the way of getting started? I want to make sure we address any remaining concerns before we move forward.`,
      ],
      collateral: ['Onboarding welcome guide', 'Implementation timeline', 'Success metrics checklist'],
    },
  ];
}

function getDefaultObjectives(industry: string): string[] {
  return [
    `Increase qualified pipeline from ${industry} prospects by 40% within 6 months`,
    `Reduce sales cycle length by 25% through AI-powered qualification and prioritization`,
    `Achieve 3x ROI within the first year through improved conversion rates`,
  ];
}

function getDefaultTactics(industry: string): string[] {
  return [
    `Leverage AI-driven prospecting to identify high-intent ${industry} buyers`,
    'Use multi-channel outreach sequences to increase engagement rates',
    'Deploy automated lead scoring to focus on highest-value opportunities',
    `Share industry-specific case studies and ROI data in every interaction`,
    'Run competitive displacement campaigns targeting incumbent tool users',
  ];
}

function getDefaultKPIs(): string[] {
  return [
    'Number of qualified opportunities created per month',
    'Lead-to-opportunity conversion rate',
    'Average sales cycle length (days)',
    'Win rate against competitive deals',
    'Pipeline value generated per rep per quarter',
  ];
}

function getDefaultObjectionResponses(competitor: string): { objection: string; response: string }[] {
  return [
    {
      objection: `We're already using ${competitor} and it works fine`,
      response: `That's great that you have a solution in place. Many of our current customers came from ${competitor} and found that LeadReach provided significantly better AI-driven insights and multi-channel capabilities. Would you be open to seeing a side-by-side comparison?`,
    },
    {
      objection: `${competitor} is cheaper`,
      response: `I understand price is an important factor. When we look at total cost of ownership, LeadReach often delivers 2-3x the ROI because of our superior automation and intelligence features. Let me show you some data from companies that switched from ${competitor}.`,
    },
    {
      objection: `${competitor} has a feature we need that you don't offer`,
      response: `I'd love to understand which specific feature you're referring to. In many cases, LeadReach addresses the same need through a different — and often more effective — approach. Can you tell me more about what you're trying to accomplish?`,
    },
    {
      objection: `We're locked into a long-term contract with ${competitor}`,
      response: `Contract commitments are understandable. We've worked with many customers in similar situations. We offer competitive displacement programs including buyout assistance and phased transitions that make switching seamless. Let me share how we've helped others make the move.`,
    },
  ];
}

function getDefaultComparisonDimensions(
  competitors: string[]
): { dimension: string; entries: { competitor: string; rating: string; notes: string }[] }[] {
  const dimensions = [
    'AI & Automation',
    'Multi-Channel Outreach',
    'Lead Scoring & Enrichment',
    'Ease of Use',
    'Pricing Value',
    'Customer Support',
    'Integration Ecosystem',
  ];

  const ratings = ['Strong', 'Moderate', 'Weak'];

  return dimensions.map(dimension => ({
    dimension,
    entries: competitors.map(comp => ({
      competitor: comp,
      rating: ratings[Math.floor(Math.random() * ratings.length)],
      notes: `Assessment pending detailed analysis for ${comp} on ${dimension.toLowerCase()}`,
    })),
  }));
}

function getDefaultExecutiveSummary(lead: LeadContext): string {
  const company = lead.companyName || 'your company';
  const industry = lead.industry || 'your industry';
  return `Thank you for the opportunity to present this proposal to ${company}. Based on our discussions and research, we understand that ${company} is looking to enhance its lead generation and sales intelligence capabilities within the ${industry} sector.\n\nLeadReach is an AI-powered B2B sales platform that combines intelligent prospecting, multi-channel outreach, and advanced analytics to help sales teams identify, engage, and convert high-value prospects more efficiently.\n\nWe believe our platform can deliver significant value to ${company} by addressing your key challenges around pipeline generation, prospect prioritization, and sales team productivity.`;
}

function getDefaultProblemStatement(lead: LeadContext): string {
  const painPoints = lead.painPoints?.join(', ') || 'pipeline generation and prospect engagement';
  return `Based on our analysis, ${lead.companyName || 'your company'} faces several challenges common to growing B2B organizations: ${painPoints}.\n\nSales teams today spend up to 67% of their time on non-revenue-generating activities, including manual prospecting, data entry, and researching leads. This inefficiency results in missed opportunities, longer sales cycles, and lower win rates.\n\nWithout an AI-powered platform to automate prospecting, enrich lead data, and prioritize outreach, teams are forced to rely on manual processes and gut instinct rather than data-driven insights.`;
}

function getDefaultSolution(lead: LeadContext): string {
  const industry = lead.industry || 'your industry';
  return `LeadReach provides a comprehensive AI-powered platform designed to address each of these challenges:\n\n**AI-Powered Prospecting**: Automatically discover and prioritize high-value prospects in the ${industry} sector using firmographic, technographic, and intent data. Our AI continuously learns from your winning patterns to improve targeting accuracy.\n\n**Multi-Channel Outreach**: Engage prospects across email, LinkedIn, phone, and other channels with personalized, automated sequences that maintain human authenticity while scaling your reach.\n\n**Intelligent Lead Scoring**: Score and prioritize leads based on behavioral signals, firmographic fit, and buying intent — ensuring your team focuses on the opportunities most likely to close.\n\n**Sales Intelligence**: Equip your team with real-time competitive intelligence, meeting preparation briefs, and objection handling guidance powered by AI.`;
}

function getDefaultPricing(): ProposalPricingOption[] {
  return [
    {
      tier: 'starter',
      label: 'Starter',
      price: '$299/month',
      features: [
        '1,000 AI prospecting credits/month',
        'Email outreach sequences',
        'Basic lead scoring',
        'CRM integration',
        'Email support',
      ],
      recommended: false,
    },
    {
      tier: 'professional',
      label: 'Professional',
      price: '$799/month',
      features: [
        '5,000 AI prospecting credits/month',
        'Multi-channel outreach (email + LinkedIn + phone)',
        'Advanced AI lead scoring & enrichment',
        'Competitive intelligence & battle cards',
        'Meeting prep & objection handling',
        'Priority support',
        'API access',
      ],
      recommended: true,
    },
    {
      tier: 'enterprise',
      label: 'Enterprise',
      price: 'Custom',
      features: [
        'Unlimited AI prospecting credits',
        'All channels + custom channel integrations',
        'Custom AI models trained on your data',
        'Dedicated customer success manager',
        'SSO & advanced security',
        'Custom integrations & workflows',
        'SLA guarantee',
        'On-premise deployment option',
      ],
      recommended: false,
    },
  ];
}

function getDefaultTimeline(): string {
  return `**Week 1-2: Onboarding & Setup**\n- Platform configuration and CRM integration\n- ICP definition and targeting criteria\n- Team training and workflow setup\n\n**Week 3-4: Launch & Optimize**\n- Activate AI prospecting and lead scoring\n- Launch initial outreach sequences\n- Monitor performance and refine targeting\n\n**Week 5-8: Scale & Measure**\n- Expand to multi-channel sequences\n- Deploy competitive intelligence tools\n- First ROI measurement and optimization\n\n**Month 3+: Growth & Expansion**\n- Full platform utilization across all reps\n- Advanced workflow automation\n- Quarterly business reviews and strategy alignment`;
}

function getDefaultROI(lead: LeadContext): string {
  const company = lead.companyName || 'Your company';
  return `Based on data from similar ${lead.industry || 'B2B'} companies using LeadReach:\n\n**Pipeline Impact**: Customers typically see a 40-60% increase in qualified pipeline within the first 6 months through AI-driven prospecting and better lead prioritization.\n\n**Efficiency Gains**: Sales reps save an average of 10-15 hours per week on manual prospecting and research tasks, redirecting that time to high-value selling activities.\n\n**Conversion Improvement**: AI-powered lead scoring and personalized outreach typically improve lead-to-opportunity conversion rates by 25-35%.\n\n**Financial ROI**: With an average deal size in your range, ${company} can expect to achieve full ROI within 3-5 months, with 3-5x return on investment within the first year.\n\n*Note: These projections are based on aggregate customer data and may vary based on implementation and team adoption.*`;
}

function getDefaultContentRecommendations(
  lead: LeadContext,
  stage: string
): SalesCollateral[] {
  const stageContentMap: Record<string, SalesCollateral[]> = {
    prospecting: [
      {
        id: generateId('col'),
        type: 'one-pager',
        title: 'AI-Powered Prospecting Overview',
        description: `Introductory one-pager on how LeadReach automates prospecting for ${lead.industry || 'B2B'} companies`,
        content: 'Covers AI-driven ICP matching, intent signals, and automated list building. Key differentiators: real-time enrichment, predictive scoring, and multi-source data aggregation.',
        tags: [lead.industry || 'general', 'prospecting', 'ai'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('col'),
        type: 'email-template',
        title: 'Cold Outreach Email Templates',
        description: 'Proven cold outreach templates with personalization variables',
        content: '5 email templates covering: initial outreach, follow-up, value proposition, social proof, and meeting request. Each includes personalization tokens and A/B test variations.',
        tags: ['email', 'outreach', 'templates'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    discovery: [
      {
        id: generateId('col'),
        type: 'demo-script',
        title: 'Discovery Call Script & Framework',
        description: 'Structured discovery call framework with key questions and talk tracks',
        content: 'Covers the SPIN selling framework adapted for B2B SaaS. Includes 15 discovery questions mapped to pain points, budget discussions, and timeline exploration.',
        tags: ['discovery', 'framework', 'questions'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    qualification: [
      {
        id: generateId('col'),
        type: 'one-pager',
        title: 'BANT/MEDDIC Qualification Guide',
        description: 'Quick reference guide for qualifying opportunities',
        content: 'Detailed breakdown of BANT (Budget, Authority, Need, Timeline) and MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion) frameworks with scoring rubrics.',
        tags: ['qualification', 'bant', 'meddic'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    proposal: [
      {
        id: generateId('col'),
        type: 'case-study',
        title: `Case Study: ${lead.industry || 'B2B'} Company Achieves 3x Pipeline Growth`,
        description: 'Real-world case study demonstrating measurable results',
        content: 'Documents how a similar company increased qualified pipeline by 3x, reduced sales cycle by 30%, and achieved 400% ROI within 12 months using LeadReach. Includes before/after metrics and customer quotes.',
        tags: [lead.industry || 'general', 'case-study', 'roi'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('col'),
        type: 'roi-calculator',
        title: 'LeadReach ROI Calculator',
        description: 'Interactive tool to project ROI based on your specific metrics',
        content: 'Input fields: current pipeline, team size, average deal value, current conversion rates. Output: projected pipeline increase, time savings, and ROI over 12 months.',
        tags: ['roi', 'calculator', 'business-case'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    negotiation: [
      {
        id: generateId('col'),
        type: 'comparison-sheet',
        title: 'LeadReach vs. Competitors Comparison',
        description: 'Feature-by-feature comparison highlighting LeadReach advantages',
        content: 'Side-by-side comparison across 20+ features including AI capabilities, channel support, integration depth, pricing transparency, and customer support quality.',
        tags: ['comparison', 'competitive', 'battle-card'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    closing: [
      {
        id: generateId('col'),
        type: 'slide-deck',
        title: 'Executive Summary Deck',
        description: 'C-suite ready presentation summarizing the business case',
        content: '10-slide deck covering: market context, challenges, LeadReach solution, customer success stories, implementation plan, pricing, ROI projection, and next steps.',
        tags: ['presentation', 'executive', 'closing'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  return stageContentMap[stage] || stageContentMap.proposing || [
    {
      id: generateId('col'),
      type: 'one-pager',
      title: 'LeadReach Platform Overview',
      description: 'General platform overview suitable for any stage',
      content: 'Covers the core capabilities of the LeadReach platform including AI prospecting, multi-channel outreach, lead scoring, and sales intelligence.',
      tags: ['overview', 'general'],
      usageCount: 0,
      createdAt: new Date().toISOString(),
    },
  ];
}

function getDefaultTrainingContent(
  topic: string,
  level: 'beginner' | 'intermediate' | 'advanced'
): string {
  const levelDesc = {
    beginner: 'foundational',
    intermediate: 'intermediate',
    advanced: 'advanced',
  }[level];

  return `This ${levelDesc} training module covers the essential concepts and best practices for ${topic} in B2B sales.\n\n**Key Concepts**: Understanding the fundamentals of ${topic} is critical for sales success. This module covers the core principles, frameworks, and practical techniques that top performers use.\n\n**Best Practices**: The most effective approach to ${topic} involves preparation, personalization, and persistence. Always research your prospect before engaging, tailor your messaging to their specific situation, and follow up consistently without being pushy.\n\n**Common Mistakes**: Many sales professionals struggle with ${topic} because they rely too heavily on generic templates, fail to listen actively, or give up too early. Avoid these pitfalls by staying curious, adapting your approach based on feedback, and maintaining a disciplined follow-up cadence.\n\n**Practical Tips**: Start by implementing one or two techniques from this module and gradually expand. Track your results and iterate on your approach. The key to mastery in ${topic} is consistent practice and continuous improvement.`;
}

function getDefaultQuizQuestions(topic: string): SalesTrainingQuiz['questions'] {
  return [
    {
      question: `What is the most important first step when approaching ${topic}?`,
      options: [
        'Research and understand the prospect\'s specific context',
        'Immediately present your product features',
        'Send a generic email template',
        'Wait for the prospect to reach out',
      ],
      correctIndex: 0,
    },
    {
      question: `How should you handle objections related to ${topic}?`,
      options: [
        'Dismiss the objection and move on',
        'Listen actively, acknowledge the concern, and address it with relevant evidence',
        'Immediately offer a discount',
        'End the conversation and follow up later',
      ],
      correctIndex: 1,
    },
    {
      question: `What metrics are most important to track for ${topic}?`,
      options: [
        'Only revenue generated',
        'Vanity metrics like social media likes',
        'Leading indicators like engagement rates, conversion rates, and pipeline velocity',
        'No metrics are needed — trust your gut',
      ],
      correctIndex: 2,
    },
    {
      question: `What differentiates top performers in ${topic} from average performers?`,
      options: [
        'They work longer hours',
        'They have larger territories',
        'They use a systematic, data-driven approach and continuously refine their process',
        'They have more experience',
      ],
      correctIndex: 2,
    },
    {
      question: `What is the recommended follow-up cadence after initial engagement on ${topic}?`,
      options: [
        'Once and wait indefinitely',
        'Aggressive daily follow-ups',
        'A structured sequence with value-add touchpoints spaced 2-5 days apart',
        'Only follow up when the prospect reaches out',
      ],
      correctIndex: 2,
    },
  ];
}
