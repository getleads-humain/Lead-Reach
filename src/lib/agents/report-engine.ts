/**
 * Report Engine
 * 
 * Generate pipeline reports, score distributions,
 * campaign performance metrics, AI insights, and action items.
 * 
 * Uses centralized callLLMForJSON for rate limiting, retries, and model fallback.
 */

import { db } from '@/lib/db';
import { callLLMForJSON } from '@/lib/llm';

// ============================================================
// Types
// ============================================================

export interface PipelineReport {
  campaignId: string;
  campaignName: string;
  generatedAt: string;
  summary: {
    totalLeads: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    unqualifiedLeads: number;
    averageScore: number;
    conversionRate: number;
  };
  stageBreakdown: Record<string, number>;
  tierBreakdown: Record<string, number>;
  industryBreakdown: Record<string, number>;
  topLeads: Array<{
    id: string;
    companyName: string;
    leadScore: number;
    leadTier: string;
    stage: string;
    industry: string | null;
  }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  enrichmentStatus: {
    totalEnriched: number;
    totalNew: number;
    averageDataCompleteness: number;
  };
}

export interface ScoreDistribution {
  campaignId: string;
  distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  statistics: {
    mean: number;
    median: number;
    mode: number;
    stdDev: number;
  };
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  metrics: {
    leadsFound: number;
    leadsQualified: number;
    leadsContacted: number;
    leadsResponded: number;
    qualificationRate: number;
    responseRate: number;
    averageScore: number;
    averageDataCompleteness: number;
  };
  trends: {
    leadsPerDay: number;
    qualificationTrend: 'up' | 'down' | 'stable';
    scoreTrend: 'up' | 'down' | 'stable';
  };
  agentPerformance: Array<{
    agentName: string;
    tasksCompleted: number;
    tasksFailed: number;
    successRate: number;
  }>;
}

export interface AIInsight {
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionRequired: boolean;
}

export interface ActionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// ============================================================
// Pipeline Report
// ============================================================

/**
 * Generate a pipeline dashboard data report
 */
export async function generatePipelineReport(campaignId: string): Promise<PipelineReport> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const leads = await db.lead.findMany({
    where: { campaignId },
  });

  // Summary
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.leadTier === 'hot').length;
  const warmLeads = leads.filter(l => l.leadTier === 'warm').length;
  const coldLeads = leads.filter(l => l.leadTier === 'cold').length;
  const unqualifiedLeads = leads.filter(l => l.leadTier === 'unqualified').length;
  const averageScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / totalLeads) : 0;

  const contactedLeads = leads.filter(l => ['contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage));
  const conversionRate = contactedLeads.length > 0
    ? Math.round((leads.filter(l => l.stage === 'closed_won').length / contactedLeads.length) * 100)
    : 0;

  // Stage breakdown
  const stageBreakdown: Record<string, number> = {};
  for (const lead of leads) {
    stageBreakdown[lead.stage] = (stageBreakdown[lead.stage] || 0) + 1;
  }

  // Tier breakdown
  const tierBreakdown: Record<string, number> = {};
  for (const lead of leads) {
    tierBreakdown[lead.leadTier] = (tierBreakdown[lead.leadTier] || 0) + 1;
  }

  // Industry breakdown
  const industryBreakdown: Record<string, number> = {};
  for (const lead of leads) {
    if (lead.industry) {
      industryBreakdown[lead.industry] = (industryBreakdown[lead.industry] || 0) + 1;
    }
  }

  // Top leads
  const topLeads = leads
    .sort((a, b) => b.leadScore - a.leadScore)
    .slice(0, 10)
    .map(l => ({
      id: l.id,
      companyName: l.companyName,
      leadScore: l.leadScore,
      leadTier: l.leadTier,
      stage: l.stage,
      industry: l.industry,
    }));

  // Score distribution
  const scoreRanges = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'];
  const scoreDistribution = scoreRanges.map(range => {
    const [min, max] = range.split('-').map(Number);
    const count = leads.filter(l => l.leadScore >= min && l.leadScore <= max).length;
    return { range, count };
  });

  // Enrichment status
  const totalEnriched = leads.filter(l => l.stage !== 'new').length;
  const totalNew = leads.filter(l => l.stage === 'new').length;
  const averageDataCompleteness = totalLeads > 0
    ? Math.round(leads.reduce((sum, l) => sum + l.dataCompleteness, 0) / totalLeads)
    : 0;

  return {
    campaignId,
    campaignName: campaign.name,
    generatedAt: new Date().toISOString(),
    summary: {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      unqualifiedLeads,
      averageScore,
      conversionRate,
    },
    stageBreakdown,
    tierBreakdown,
    industryBreakdown,
    topLeads,
    scoreDistribution,
    enrichmentStatus: {
      totalEnriched,
      totalNew,
      averageDataCompleteness,
    },
  };
}

// ============================================================
// Score Distribution
// ============================================================

/**
 * Generate score distribution for a campaign
 */
export async function generateScoreDistribution(campaignId: string): Promise<ScoreDistribution> {
  const leads = await db.lead.findMany({
    where: { campaignId },
    select: { leadScore: true },
  });

  const scores = leads.map(l => l.leadScore);
  const ranges = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'];

  const distribution = ranges.map(range => {
    const [min, max] = range.split('-').map(Number);
    const count = scores.filter(s => s >= min && s <= max).length;
    return {
      range,
      count,
      percentage: scores.length > 0 ? Math.round((count / scores.length) * 100) : 0,
    };
  });

  // Calculate statistics
  const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

  // Mode
  const freq: Record<number, number> = {};
  for (const s of scores) freq[s] = (freq[s] || 0) + 1;
  const mode = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0]
    ? parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])
    : 0;

  // Standard deviation
  const variance = scores.length > 0 ? scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length : 0;
  const stdDev = Math.sqrt(variance);

  return {
    campaignId,
    distribution,
    statistics: {
      mean: Math.round(mean * 10) / 10,
      median,
      mode,
      stdDev: Math.round(stdDev * 10) / 10,
    },
  };
}

// ============================================================
// Campaign Performance
// ============================================================

/**
 * Generate campaign performance metrics
 */
export async function generateCampaignPerformance(campaignId: string): Promise<CampaignPerformance> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const leads = await db.lead.findMany({
    where: { campaignId },
  });

  const tasks = await db.agentTask.findMany({
    where: { campaignId },
  });

  const totalLeads = leads.length;
  const leadsQualified = leads.filter(l => ['qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;
  const leadsContacted = leads.filter(l => ['contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;
  const leadsResponded = leads.filter(l => ['engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;

  const qualificationRate = totalLeads > 0 ? Math.round((leadsQualified / totalLeads) * 100) : 0;
  const responseRate = leadsContacted > 0 ? Math.round((leadsResponded / leadsContacted) * 100) : 0;
  const averageScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / totalLeads) : 0;
  const averageDataCompleteness = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + l.dataCompleteness, 0) / totalLeads) : 0;

  // Calculate leads per day
  const daysSinceCreation = Math.max(1, Math.ceil((Date.now() - campaign.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const leadsPerDay = Math.round((totalLeads / daysSinceCreation) * 10) / 10;

  // Agent performance
  const agentGroups: Record<string, { completed: number; failed: number }> = {};
  for (const task of tasks) {
    if (!agentGroups[task.agentName]) {
      agentGroups[task.agentName] = { completed: 0, failed: 0 };
    }
    if (task.status === 'completed') agentGroups[task.agentName].completed++;
    if (task.status === 'failed') agentGroups[task.agentName].failed++;
  }

  const agentPerformance = Object.entries(agentGroups).map(([name, stats]) => ({
    agentName: name,
    tasksCompleted: stats.completed,
    tasksFailed: stats.failed,
    successRate: stats.completed + stats.failed > 0
      ? Math.round((stats.completed / (stats.completed + stats.failed)) * 100)
      : 0,
  }));

  return {
    campaignId,
    campaignName: campaign.name,
    metrics: {
      leadsFound: totalLeads,
      leadsQualified,
      leadsContacted,
      leadsResponded,
      qualificationRate,
      responseRate,
      averageScore,
      averageDataCompleteness,
    },
    trends: {
      leadsPerDay,
      qualificationTrend: qualificationRate > 30 ? 'up' : qualificationRate > 15 ? 'stable' : 'down',
      scoreTrend: averageScore > 50 ? 'up' : averageScore > 30 ? 'stable' : 'down',
    },
    agentPerformance,
  };
}

// ============================================================
// AI Insights
// ============================================================

/**
 * Generate AI-powered insights from pipeline data
 */
export async function generateAIInsights(data: PipelineReport): Promise<AIInsight[]> {
  const systemPrompt = `You are an expert B2B sales analyst. Generate actionable insights from pipeline data.
Return ONLY a JSON array.`;

  const userMessage = `PIPELINE DATA:
- Total Leads: ${data.summary.totalLeads}
- Hot: ${data.summary.hotLeads}, Warm: ${data.summary.warmLeads}, Cold: ${data.summary.coldLeads}, Unqualified: ${data.summary.unqualifiedLeads}
- Average Score: ${data.summary.averageScore}
- Conversion Rate: ${data.summary.conversionRate}%
- Stage Breakdown: ${JSON.stringify(data.stageBreakdown)}
- Top Industries: ${JSON.stringify(Object.entries(data.industryBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5))}

Generate 4-6 insights as JSON array:
[{
  "type": "opportunity|risk|trend|recommendation",
  "title": "Insight title",
  "description": "Detailed description with specific data points",
  "impact": "high|medium|low",
  "actionRequired": true|false
}]`;

  try {
    const parsed = await callLLMForJSON<Array<Record<string, unknown>>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed && Array.isArray(parsed)) {
      return parsed.map((p) => ({
        type: (['opportunity', 'risk', 'trend', 'recommendation'].includes(p.type as string) ? p.type : 'recommendation') as AIInsight['type'],
        title: (p.title as string) || 'Insight',
        description: (p.description as string) || '',
        impact: (['high', 'medium', 'low'].includes(p.impact as string) ? p.impact : 'medium') as AIInsight['impact'],
        actionRequired: typeof p.actionRequired === 'boolean' ? p.actionRequired : false,
      }));
    }

    return getDefaultInsights(data);
  } catch {
    return getDefaultInsights(data);
  }
}

function getDefaultInsights(data: PipelineReport): AIInsight[] {
  const insights: AIInsight[] = [];

  if (data.summary.hotLeads > 0) {
    insights.push({
      type: 'opportunity',
      title: `${data.summary.hotLeads} hot leads ready for outreach`,
      description: `You have ${data.summary.hotLeads} hot leads with high scores. Prioritize personalized outreach to these leads.`,
      impact: 'high',
      actionRequired: true,
    });
  }

  if (data.summary.unqualifiedLeads > data.summary.totalLeads * 0.5) {
    insights.push({
      type: 'risk',
      title: 'High unqualified lead ratio',
      description: `${Math.round((data.summary.unqualifiedLeads / data.summary.totalLeads) * 100)}% of leads are unqualified. Consider refining your ICP targeting.`,
      impact: 'medium',
      actionRequired: true,
    });
  }

  if (data.enrichmentStatus.averageDataCompleteness < 50) {
    insights.push({
      type: 'recommendation',
      title: 'Low data completeness',
      description: `Average data completeness is ${data.enrichmentStatus.averageDataCompleteness}%. Run enrichment to improve lead quality scores.`,
      impact: 'medium',
      actionRequired: true,
    });
  }

  if (data.summary.conversionRate > 0) {
    insights.push({
      type: 'trend',
      title: `Conversion rate at ${data.summary.conversionRate}%`,
      description: `Current conversion rate from contacted to closed won is ${data.summary.conversionRate}%.`,
      impact: 'low',
      actionRequired: false,
    });
  }

  return insights;
}

// ============================================================
// Action Items
// ============================================================

/**
 * Generate action items from pipeline data
 */
export async function generateActionItems(data: PipelineReport): Promise<ActionItem[]> {
  const actions: ActionItem[] = [];
  let idCounter = 0;

  const makeId = () => `action_${Date.now()}_${++idCounter}`;

  // Hot leads outreach
  if (data.summary.hotLeads > 0) {
    actions.push({
      id: makeId(),
      priority: 'critical',
      title: `Follow up with ${data.summary.hotLeads} hot leads`,
      description: 'These leads have the highest scores and should be contacted immediately with personalized outreach.',
      assignedTo: 'outreach-composer',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });
  }

  // Warm leads nurture
  if (data.summary.warmLeads > 0) {
    actions.push({
      id: makeId(),
      priority: 'high',
      title: `Nurture ${data.summary.warmLeads} warm leads`,
      description: 'These leads show potential but need more engagement. Create nurturing sequences.',
      assignedTo: 'outreach-composer',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });
  }

  // Data enrichment
  if (data.enrichmentStatus.averageDataCompleteness < 60) {
    actions.push({
      id: makeId(),
      priority: 'high',
      title: 'Enrich lead data',
      description: `Average data completeness is ${data.enrichmentStatus.averageDataCompleteness}%. Run data enrichment to improve scoring accuracy.`,
      assignedTo: 'data-enrichment',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });
  }

  // New leads qualification
  if (data.enrichmentStatus.totalNew > 0) {
    actions.push({
      id: makeId(),
      priority: 'medium',
      title: `Qualify ${data.enrichmentStatus.totalNew} new leads`,
      description: 'New leads need qualification scoring to determine their tier and priority.',
      assignedTo: 'lead-qualification',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });
  }

  // Cold leads review
  if (data.summary.coldLeads > 5) {
    actions.push({
      id: makeId(),
      priority: 'low',
      title: `Review ${data.summary.coldLeads} cold leads`,
      description: 'Consider whether cold leads should be moved to nurture or disqualified to focus resources.',
      assignedTo: 'pipeline-manager',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });
  }

  return actions;
}
