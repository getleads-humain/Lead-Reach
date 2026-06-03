/**
 * Revenue Intelligence Engine — LeadReach
 * ========================================
 *
 * Comprehensive revenue intelligence capabilities:
 * - Revenue forecasting (AI-powered with committed/bestCase/upside scenarios)
 * - Deal velocity analytics with bottleneck detection
 * - Pipeline value analytics with stage-weighted probabilities
 * - Revenue attribution by lead source
 * - MRR/ARR tracking with churn and expansion metrics
 * - Deal probability scoring (AI-powered)
 *
 * Uses centralized callLLMForJSON for rate limiting, retries, and model fallback.
 */

import { db } from '@/lib/db';
import { callLLMForJSON } from '@/lib/llm';

// ============================================================
// Types
// ============================================================

export interface RevenueForecast {
  period: string;
  projectedRevenue: number;
  confidence: number;
  pipelineContribution: number;
  breakdown: {
    committed: number;
    bestCase: number;
    upside: number;
  };
}

export interface DealVelocity {
  stage: string;
  avgDaysInStage: number;
  conversionRate: number;
  bottleneckScore: number;
}

export interface PipelineMetrics {
  totalPipelineValue: number;
  weightedPipeline: number;
  stageValues: Record<string, { count: number; value: number; weightedValue: number }>;
  monthlyTrend: Array<{ month: string; pipelineValue: number; closedValue: number }>;
}

export interface RevenueAttribution {
  source: string;
  revenue: number;
  deals: number;
  conversionRate: number;
  avgDealSize: number;
  roi: number;
}

export interface MRRTracking {
  currentMRR: number;
  projectedMRR: number;
  churnRate: number;
  expansionRate: number;
  netRevenueRetention: number;
}

export interface DealProbability {
  leadId: string;
  probability: number;
  factors: {
    icpFit: number;
    engagementScore: number;
    budgetSignals: number;
    timingSignals: number;
    competitivePosition: number;
  };
}

export interface PipelineRiskAssessment {
  campaignId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    potentialImpact: string;
    action: string;
  }>;
  forecastConfidence: number;
}

// ============================================================
// Stage Probability Weights
// ============================================================

const STAGE_WEIGHTS: Record<string, number> = {
  new: 0.10,
  enriched: 0.20,
  qualified: 0.40,
  contacted: 0.50,
  engaged: 0.60,
  negotiating: 0.80,
  closed_won: 1.00,
  closed_lost: 0.00,
  nurture: 0.05,
};

const PIPELINE_STAGES = ['new', 'enriched', 'qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'];

// ============================================================
// Revenue Forecasting (AI-Powered)
// ============================================================

/**
 * Generate a revenue forecast for a given period using AI.
 * Considers pipeline stage distribution, historical conversion rates,
 * deal velocity, and seasonality.
 */
export async function generateRevenueForecast(
  period: string,
  historicalData?: Array<{ month: string; revenue: number }>
): Promise<RevenueForecast> {
  // Gather real pipeline data
  const leads = await db.lead.findMany({
    where: { stage: { not: 'closed_lost' } },
  });

  const totalLeads = leads.length;
  const stageDistribution: Record<string, number> = {};
  let weightedPipelineValue = 0;
  let totalRawValue = 0;

  for (const lead of leads) {
    const stage = (lead.stage as string) || 'new';
    stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;

    const dealSize = await estimateDealSizeFromLead(lead);
    const weight = STAGE_WEIGHTS[stage] ?? 0.10;
    weightedPipelineValue += dealSize * weight;
    totalRawValue += dealSize;
  }

  const avgLeadScore = totalLeads > 0
    ? Math.round((leads as Array<Record<string, unknown>>).reduce((sum, l) => sum + ((l.leadScore as number) || 0), 0) / totalLeads)
    : 0;

  const historicalContext = historicalData && historicalData.length > 0
    ? `HISTORICAL REVENUE:\n${historicalData.map(h => `${h.month}: $${h.revenue.toLocaleString()}`).join('\n')}`
    : 'No historical revenue data provided.';

  const systemPrompt = `You are an expert revenue forecaster for a B2B SaaS company. Generate a revenue forecast considering pipeline data, conversion probabilities, and seasonality. Return ONLY valid JSON.`;

  const userMessage = `FORECAST PERIOD: ${period}

CURRENT PIPELINE:
- Total Active Leads: ${totalLeads}
- Weighted Pipeline Value: $${Math.round(weightedPipelineValue).toLocaleString()}
- Total Raw Pipeline Value: $${Math.round(totalRawValue).toLocaleString()}
- Average Lead Score: ${avgLeadScore}/100
- Stage Distribution: ${JSON.stringify(stageDistribution)}

${historicalContext}

Generate a revenue forecast as JSON:
{
  "projectedRevenue": <number>,
  "confidence": <0-100>,
  "pipelineContribution": <percentage of forecast from existing pipeline>,
  "breakdown": {
    "committed": <revenue from deals in negotiating/closing stages>,
    "bestCase": <revenue if deals progress as expected>,
    "upside": <additional revenue from upside scenarios>
  }
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed) {
      return {
        period,
        projectedRevenue: typeof parsed.projectedRevenue === 'number' ? parsed.projectedRevenue : Math.round(weightedPipelineValue),
        confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 60,
        pipelineContribution: typeof parsed.pipelineContribution === 'number' ? parsed.pipelineContribution : 70,
        breakdown: {
          committed: typeof (parsed.breakdown as Record<string, unknown>)?.committed === 'number'
            ? (parsed.breakdown as Record<string, unknown>).committed as number
            : Math.round(weightedPipelineValue * 0.4),
          bestCase: typeof (parsed.breakdown as Record<string, unknown>)?.bestCase === 'number'
            ? (parsed.breakdown as Record<string, unknown>).bestCase as number
            : Math.round(weightedPipelineValue * 0.7),
          upside: typeof (parsed.breakdown as Record<string, unknown>)?.upside === 'number'
            ? (parsed.breakdown as Record<string, unknown>).upside as number
            : Math.round(weightedPipelineValue * 0.3),
        },
      };
    }
  } catch (error) {
    console.warn('[RevenueIntelligence] Forecast LLM failed, using computed fallback:', error instanceof Error ? error.message : error);
  }

  // Fallback: compute from pipeline data directly
  const committedStages = ['negotiating', 'closed_won'];
  const committedValue = leads
    .filter(l => committedStages.includes((l.stage as string) || ''))
    .reduce((sum, l) => sum + estimateDealSizeFromLeadSync(l), 0);
  const bestCaseValue = weightedPipelineValue;
  const upsideValue = Math.round(weightedPipelineValue * 0.25);

  return {
    period,
    projectedRevenue: Math.round(bestCaseValue),
    confidence: totalLeads > 0 ? Math.min(85, 40 + Math.round(avgLeadScore * 0.4)) : 30,
    pipelineContribution: 70,
    breakdown: {
      committed: Math.round(committedValue),
      bestCase: Math.round(bestCaseValue),
      upside: upsideValue,
    },
  };
}

/**
 * Update a forecast with real pipeline data, recalculating values
 * based on current lead states and estimated deal sizes.
 */
export async function updateForecastWithPipelineData(
  forecast: RevenueForecast
): Promise<RevenueForecast> {
  const leads = await db.lead.findMany({
    where: { stage: { not: 'closed_lost' } },
  });

  let committed = 0;
  let bestCase = 0;
  let upside = 0;

  for (const lead of leads) {
    const stage = (lead.stage as string) || 'new';
    const dealSize = estimateDealSizeFromLeadSync(lead);
    const weight = STAGE_WEIGHTS[stage] ?? 0.10;

    if (stage === 'negotiating' || stage === 'closed_won') {
      committed += dealSize;
    } else if (stage === 'engaged' || stage === 'contacted') {
      bestCase += dealSize * weight;
    } else {
      upside += dealSize * weight;
    }
  }

  const totalPipeline = committed + bestCase + upside;
  const pipelineContribution = forecast.projectedRevenue > 0
    ? Math.round((totalPipeline / forecast.projectedRevenue) * 100)
    : 100;

  return {
    ...forecast,
    pipelineContribution: Math.min(100, pipelineContribution),
    breakdown: {
      committed: Math.round(committed),
      bestCase: Math.round(bestCase),
      upside: Math.round(upside),
    },
  };
}

/**
 * Retrieve saved forecasts, optionally filtered by period.
 */
export async function getForecasts(period?: string): Promise<RevenueForecast[]> {
  try {
    // Retrieve forecasts from prospect_reports or derive from current pipeline
    const where = period ? { stage: 'closed_won' } : {};
    const leads = await db.lead.findMany({ where });

    if (leads.length === 0) {
      return period ? [await generateRevenueForecast(period)] : [await generateRevenueForecast('current_month')];
    }

    return [await generateRevenueForecast(period || 'current_month')];
  } catch (error) {
    console.warn('[RevenueIntelligence] getForecasts failed:', error instanceof Error ? error.message : error);
    return [{
      period: period || 'current_month',
      projectedRevenue: 0,
      confidence: 0,
      pipelineContribution: 0,
      breakdown: { committed: 0, bestCase: 0, upside: 0 },
    }];
  }
}

// ============================================================
// Deal Velocity Analytics
// ============================================================

/**
 * Calculate deal velocity — average time in each pipeline stage,
 * conversion rates between stages, and bottleneck identification.
 */
export async function calculateDealVelocity(campaignId?: string): Promise<DealVelocity[]> {
  const where = campaignId ? { campaignId } : {};
  const leads = await db.lead.findMany({ where });

  if (leads.length === 0) {
    return getDefaultDealVelocity();
  }

  const velocityData: DealVelocity[] = [];
  const stageOrder = ['new', 'enriched', 'qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'];

  for (let i = 0; i < stageOrder.length; i++) {
    const stage = stageOrder[i];
    const leadsInStage = leads.filter(l => hasReachedStage(l, stage));

    if (leadsInStage.length === 0) {
      velocityData.push({
        stage,
        avgDaysInStage: 0,
        conversionRate: 0,
        bottleneckScore: 0,
      });
      continue;
    }

    // Calculate average days in this stage
    const daysList: number[] = [];
    for (const lead of leadsInStage) {
      const days = computeDaysInStage(lead, stage, i, stageOrder);
      if (days > 0) daysList.push(days);
    }
    const avgDays = daysList.length > 0
      ? Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length)
      : 0;

    // Calculate conversion rate to next stage
    let conversionRate = 0;
    if (i < stageOrder.length - 1) {
      const nextStage = stageOrder[i + 1];
      const leadsReachedNext = leadsInStage.filter(l => hasReachedStage(l, nextStage));
      conversionRate = leadsInStage.length > 0
        ? Math.round((leadsReachedNext.length / leadsInStage.length) * 100)
        : 0;
    } else {
      conversionRate = 100; // closed_won is the final stage
    }

    // Bottleneck score: higher = more bottlenecked
    // Based on: long avg days + low conversion rate
    const expectedDays: Record<string, number> = {
      new: 2, enriched: 3, qualified: 5, contacted: 7, engaged: 10, negotiating: 14, closed_won: 0,
    };
    const daysRatio = avgDays / Math.max(1, expectedDays[stage] || 7);
    const conversionRatio = conversionRate > 0 ? (100 - conversionRate) / 100 : 1;
    const bottleneckScore = Math.round(Math.min(100, (daysRatio * 0.6 + conversionRatio * 0.4) * 50));

    velocityData.push({
      stage,
      avgDaysInStage: avgDays,
      conversionRate,
      bottleneckScore,
    });
  }

  return velocityData;
}

/**
 * Use LLM to analyze velocity data and identify bottlenecks with recommendations.
 */
export async function identifyBottlenecks(velocity: DealVelocity[]): Promise<{
  bottlenecks: Array<{
    stage: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  overallVelocityScore: number;
}> {
  const systemPrompt = `You are an expert sales operations analyst. Analyze deal velocity data to identify bottlenecks and provide actionable recommendations. Return ONLY valid JSON.`;

  const userMessage = `DEAL VELOCITY DATA:
${velocity.map(v => `Stage: ${v.stage} | Avg Days: ${v.avgDaysInStage} | Conversion: ${v.conversionRate}% | Bottleneck Score: ${v.bottleneckScore}/100`).join('\n')}

Analyze the pipeline velocity and identify bottlenecks. Return JSON:
{
  "bottlenecks": [
    {
      "stage": "stage_name",
      "severity": "low|medium|high",
      "description": "What is causing the bottleneck",
      "recommendation": "Specific action to resolve it"
    }
  ],
  "overallVelocityScore": <0-100, where 100 is optimal velocity>
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed) {
      const bottlenecks = Array.isArray(parsed.bottlenecks)
        ? (parsed.bottlenecks as Array<Record<string, unknown>>).map(b => ({
            stage: (b.stage as string) || 'unknown',
            severity: (['low', 'medium', 'high'].includes(b.severity as string) ? b.severity : 'medium') as 'low' | 'medium' | 'high',
            description: (b.description as string) || '',
            recommendation: (b.recommendation as string) || '',
          }))
        : getComputedBottlenecks(velocity);

      return {
        bottlenecks,
        overallVelocityScore: typeof parsed.overallVelocityScore === 'number'
          ? Math.min(100, Math.max(0, parsed.overallVelocityScore))
          : computeOverallVelocityScore(velocity),
      };
    }
  } catch (error) {
    console.warn('[RevenueIntelligence] Bottleneck LLM failed, using computed fallback:', error instanceof Error ? error.message : error);
  }

  return {
    bottlenecks: getComputedBottlenecks(velocity),
    overallVelocityScore: computeOverallVelocityScore(velocity),
  };
}

/**
 * Get conversion rates between each pipeline stage.
 */
export async function getStageConversionRates(): Promise<Record<string, number>> {
  const leads = await db.lead.findMany({});
  const stageOrder = ['new', 'enriched', 'qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'];
  const rates: Record<string, number> = {};

  for (let i = 0; i < stageOrder.length - 1; i++) {
    const currentStage = stageOrder[i];
    const nextStage = stageOrder[i + 1];
    const reachedCurrent = leads.filter(l => hasReachedStage(l, currentStage));
    const reachedNext = leads.filter(l => hasReachedStage(l, nextStage));

    const rate = reachedCurrent.length > 0
      ? Math.round((reachedNext.length / reachedCurrent.length) * 100)
      : 0;

    rates[`${currentStage}_to_${nextStage}`] = rate;
  }

  // Overall conversion: new → closed_won
  const reachedNew = leads.filter(l => hasReachedStage(l, 'new'));
  const reachedClosed = leads.filter(l => hasReachedStage(l, 'closed_won'));
  rates['new_to_closed_won'] = reachedNew.length > 0
    ? Math.round((reachedClosed.length / reachedNew.length) * 100)
    : 0;

  return rates;
}

// ============================================================
// Pipeline Value Analytics
// ============================================================

/**
 * Calculate total pipeline value using lead scores and estimated deal sizes.
 * Stage-weighted values provide realistic probability-adjusted pipeline value.
 */
export async function calculatePipelineValue(campaignId?: string): Promise<PipelineMetrics> {
  const where = campaignId ? { campaignId } : {};
  const leads = await db.lead.findMany({ where });

  let totalPipelineValue = 0;
  let weightedPipeline = 0;
  const stageValues: Record<string, { count: number; value: number; weightedValue: number }> = {};

  for (const stage of PIPELINE_STAGES) {
    const stageLeads = leads.filter(l => (l.stage as string) === stage);
    let stageValue = 0;
    let stageWeighted = 0;

    for (const lead of stageLeads) {
      const dealSize = estimateDealSizeFromLeadSync(lead);
      const weight = STAGE_WEIGHTS[stage] ?? 0.10;
      stageValue += dealSize;
      stageWeighted += dealSize * weight;
    }

    stageValues[stage] = {
      count: stageLeads.length,
      value: Math.round(stageValue),
      weightedValue: Math.round(stageWeighted),
    };

    totalPipelineValue += stageValue;
    weightedPipeline += stageWeighted;
  }

  // Monthly trend — compute from discoveredAt dates
  const monthlyTrend = computeMonthlyTrend(leads);

  return {
    totalPipelineValue: Math.round(totalPipelineValue),
    weightedPipeline: Math.round(weightedPipeline),
    stageValues,
    monthlyTrend,
  };
}

/**
 * Use LLM to estimate deal size based on company revenue, employee count, and industry.
 */
export async function estimateDealSize(leadData: Record<string, unknown>): Promise<number> {
  const systemPrompt = `You are an expert B2B deal sizing analyst. Estimate the annual contract value (ACV) for this potential customer. Return ONLY valid JSON.`;

  const userMessage = `LEAD DATA:
- Company: ${leadData.companyName || 'Unknown'}
- Industry: ${leadData.industry || 'Unknown'}
- Employee Count: ${leadData.employeeCount || 'Unknown'}
- Revenue Estimate: ${leadData.revenueEstimate || 'Unknown'}
- Lead Score: ${leadData.leadScore || 0}/100
- Stage: ${leadData.stage || 'new'}

Estimate the deal size (annual contract value) as JSON:
{
  "estimatedACV": <number in USD>,
  "confidence": <0-100>,
  "reasoning": "Brief explanation of the estimate"
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed && typeof parsed.estimatedACV === 'number') {
      return Math.max(0, Math.round(parsed.estimatedACV));
    }
  } catch (error) {
    console.warn('[RevenueIntelligence] Deal size LLM failed, using heuristic:', error instanceof Error ? error.message : error);
  }

  return estimateDealSizeFromLeadSync(leadData);
}

/**
 * Get full pipeline metrics dashboard data.
 */
export async function getPipelineMetrics(campaignId?: string): Promise<PipelineMetrics & {
  dealVelocity: DealVelocity[];
  conversionRates: Record<string, number>;
  topDeals: Array<{ leadId: string; company: string; value: number; stage: string; probability: number }>;
}> {
  const [pipelineMetrics, velocity, conversionRates] = await Promise.all([
    calculatePipelineValue(campaignId),
    calculateDealVelocity(campaignId),
    getStageConversionRates(),
  ]);

  // Get top deals by estimated value
  const where = campaignId ? { campaignId } : {};
  const leads = await db.lead.findMany({
    where,
    orderBy: { leadScore: 'desc' as const },
    take: 10,
  });

  const topDeals = leads.map(l => {
    const lead = l as Record<string, unknown>;
    const stage = (lead.stage as string) || 'new';
    return {
      leadId: (lead.id as string) || '',
      company: (lead.companyName as string) || 'Unknown',
      value: estimateDealSizeFromLeadSync(lead),
      stage,
      probability: Math.round((STAGE_WEIGHTS[stage] ?? 0.10) * 100),
    };
  }).sort((a, b) => b.value - a.value);

  return {
    ...pipelineMetrics,
    dealVelocity: velocity,
    conversionRates,
    topDeals,
  };
}

// ============================================================
// Revenue Attribution
// ============================================================

/**
 * Calculate revenue attribution by source.
 * Maps discovery sources to closed deals.
 */
export async function calculateRevenueAttribution(): Promise<RevenueAttribution[]> {
  const leads = await db.lead.findMany({});

  // Group leads by source
  const sourceMap: Record<string, { leads: Array<Record<string, unknown>>; closedWon: Array<Record<string, unknown>> }> = {};

  for (const rawLead of leads) {
    const lead = rawLead as Record<string, unknown>;
    const sources = parseSources(lead.sources);
    const primarySource = sources.length > 0 ? sources[0] : 'unknown';
    const stage = (lead.stage as string) || 'new';

    if (!sourceMap[primarySource]) {
      sourceMap[primarySource] = { leads: [], closedWon: [] };
    }

    sourceMap[primarySource].leads.push(lead);
    if (stage === 'closed_won') {
      sourceMap[primarySource].closedWon.push(lead);
    }
  }

  const attribution: RevenueAttribution[] = [];
  for (const [source, data] of Object.entries(sourceMap)) {
    const revenue = data.closedWon.reduce((sum, l) => sum + estimateDealSizeFromLeadSync(l), 0);
    const deals = data.closedWon.length;
    const totalLeads = data.leads.length;
    const conversionRate = totalLeads > 0 ? Math.round((deals / totalLeads) * 100) : 0;
    const avgDealSize = deals > 0 ? Math.round(revenue / deals) : 0;

    // ROI heuristic: revenue / estimated cost per lead by source
    const costPerLead: Record<string, number> = {
      web_search: 5, linkedin: 25, twitter: 8, exa: 10, manual: 50, unknown: 15,
    };
    const totalCost = totalLeads * (costPerLead[source] || 15);
    const roi = totalCost > 0 ? Math.round(((revenue - totalCost) / totalCost) * 100) : 0;

    attribution.push({
      source,
      revenue: Math.round(revenue),
      deals,
      conversionRate,
      avgDealSize,
      roi,
    });
  }

  return attribution.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Calculate ROI per lead source.
 */
export async function getSourceROI(): Promise<Array<{ source: string; roi: number; costPerLead: number; revenuePerLead: number }>> {
  const attribution = await calculateRevenueAttribution();

  const costPerLeadMap: Record<string, number> = {
    web_search: 5, linkedin: 25, twitter: 8, exa: 10, manual: 50, unknown: 15,
  };

  return attribution.map(a => {
    const cpl = costPerLeadMap[a.source] || 15;
    const totalLeads = a.deals > 0 && a.conversionRate > 0
      ? Math.round(a.deals / (a.conversionRate / 100))
      : 1;
    const revenuePerLead = totalLeads > 0 ? a.revenue / totalLeads : 0;

    return {
      source: a.source,
      roi: a.roi,
      costPerLead: cpl,
      revenuePerLead: Math.round(revenuePerLead),
    };
  }).sort((a, b) => b.roi - a.roi);
}

/**
 * Get performance metrics per acquisition channel.
 */
export async function getChannelPerformance(): Promise<Array<{
  channel: string;
  leads: number;
  qualifiedLeads: number;
  closedDeals: number;
  conversionToQualified: number;
  conversionToClosed: number;
  avgDealSize: number;
  totalRevenue: number;
}>> {
  const leads = await db.lead.findMany({});
  const channelMap: Record<string, Array<Record<string, unknown>>> = {};

  for (const rawLead of leads) {
    const lead = rawLead as Record<string, unknown>;
    const sources = parseSources(lead.sources);
    const primaryChannel = sources.length > 0 ? sources[0] : 'unknown';

    if (!channelMap[primaryChannel]) {
      channelMap[primaryChannel] = [];
    }
    channelMap[primaryChannel].push(lead);
  }

  const qualifiedStages = ['qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'];

  return Object.entries(channelMap).map(([channel, channelLeads]) => {
    const qualified = channelLeads.filter(l => qualifiedStages.includes((l.stage as string) || ''));
    const closed = channelLeads.filter(l => (l.stage as string) === 'closed_won');
    const totalRevenue = closed.reduce((sum, l) => sum + estimateDealSizeFromLeadSync(l), 0);

    return {
      channel,
      leads: channelLeads.length,
      qualifiedLeads: qualified.length,
      closedDeals: closed.length,
      conversionToQualified: channelLeads.length > 0
        ? Math.round((qualified.length / channelLeads.length) * 100)
        : 0,
      conversionToClosed: channelLeads.length > 0
        ? Math.round((closed.length / channelLeads.length) * 100)
        : 0,
      avgDealSize: closed.length > 0 ? Math.round(totalRevenue / closed.length) : 0,
      totalRevenue: Math.round(totalRevenue),
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// ============================================================
// MRR / ARR Tracking
// ============================================================

/**
 * Calculate current MRR based on plan subscriptions and tiers.
 */
export async function calculateMRR(): Promise<MRRTracking> {
  let activeSubscriptions: Record<string, unknown>[] = [];
  let cancelledSubscriptions: Record<string, unknown>[] = [];
  let allSubscriptions: Record<string, unknown>[] = [];

  try {
    // Get active B2B subscriptions
    const [active, cancelled, all] = await Promise.all([
      db.subscription.findMany({ where: { status: 'active', clientType: 'b2b' }, include: { plan: true } }),
      db.subscription.findMany({
        where: { status: 'active', cancelAtPeriodEnd: true, clientType: 'b2b' },
        include: { plan: true },
      }),
      db.subscription.findMany({ where: { clientType: 'b2b' }, include: { plan: true } }),
    ]);

    activeSubscriptions = active as Record<string, unknown>[];
    cancelledSubscriptions = cancelled as Record<string, unknown>[];
    allSubscriptions = all as Record<string, unknown>[];
  } catch (error) {
    console.warn('[RevenueIntelligence] Subscription tables unavailable, using lead-based estimates:', error instanceof Error ? error.message : error);
    return calculateMRRFromLeads();
  }

  // Calculate current MRR from active subscriptions
  let currentMRR = 0;
  let expansionMRR = 0;

  for (const sub of activeSubscriptions) {
    const plan = sub.plan as Record<string, unknown> | null;
    const billingCycle = sub.billingCycle as string;
    const basePrice = (plan?.basePrice as number) || 0;
    const annualPrice = (plan?.annualPrice as number) || 0;

    if (billingCycle === 'annual') {
      currentMRR += Math.round(annualPrice / 12);
    } else {
      currentMRR += basePrice;
    }
  }

  // Calculate churn: cancelled subscriptions MRR
  let churnedMRR = 0;
  for (const sub of cancelledSubscriptions) {
    const plan = sub.plan as Record<string, unknown> | null;
    const billingCycle = sub.billingCycle as string;
    const basePrice = (plan?.basePrice as number) || 0;
    const annualPrice = (plan?.annualPrice as number) || 0;

    if (billingCycle === 'annual') {
      churnedMRR += Math.round(annualPrice / 12);
    } else {
      churnedMRR += basePrice;
    }
  }

  // Churn rate
  const totalMRRBeforeChurn = currentMRR + churnedMRR;
  const churnRate = totalMRRBeforeChurn > 0
    ? Math.round((churnedMRR / totalMRRBeforeChurn) * 100 * 10) / 10
    : 0;

  // Expansion rate: estimate from upgrade events or leads pipeline
  expansionMRR = Math.round(currentMRR * 0.05); // 5% expansion estimate
  const expansionRate = currentMRR > 0
    ? Math.round((expansionMRR / currentMRR) * 100 * 10) / 10
    : 0;

  // Net Revenue Retention
  const netRevenueRetention = currentMRR > 0
    ? Math.round(((currentMRR + expansionMRR - churnedMRR) / currentMRR) * 100 * 10) / 10
    : 100;

  return {
    currentMRR,
    projectedMRR: Math.round(currentMRR + expansionMRR - churnedMRR),
    churnRate,
    expansionRate,
    netRevenueRetention: Math.max(0, netRevenueRetention),
  };
}

/**
 * Project MRR growth with LLM-generated insights.
 */
export async function projectMRR(months: number = 3): Promise<{
  projections: Array<{ month: string; mrr: number; growth: number }>;
  insights: string[];
  assumptions: string[];
}> {
  const mrrData = await calculateMRR();
  const pipelineMetrics = await calculatePipelineValue();

  const systemPrompt = `You are an expert SaaS revenue analyst. Project MRR growth based on current metrics and pipeline data. Return ONLY valid JSON.`;

  const userMessage = `CURRENT MRR METRICS:
- Current MRR: $${mrrData.currentMRR.toLocaleString()}
- Churn Rate: ${mrrData.churnRate}%
- Expansion Rate: ${mrrData.expansionRate}%
- Net Revenue Retention: ${mrrData.netRevenueRetention}%

PIPELINE:
- Weighted Pipeline Value: $${pipelineMetrics.weightedPipeline.toLocaleString()}
- Total Pipeline: $${pipelineMetrics.totalPipelineValue.toLocaleString()}

PROJECT FOR: ${months} months

Generate MRR projections as JSON:
{
  "projections": [
    { "month": "YYYY-MM", "mrr": <number>, "growth": <percentage> }
  ],
  "insights": ["insight1", "insight2", "insight3"],
  "assumptions": ["assumption1", "assumption2"]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed) {
      return {
        projections: Array.isArray(parsed.projections)
          ? (parsed.projections as Array<Record<string, unknown>>).map(p => ({
              month: (p.month as string) || '',
              mrr: typeof p.mrr === 'number' ? p.mrr : mrrData.currentMRR,
              growth: typeof p.growth === 'number' ? p.growth : 0,
            }))
          : computeMRRProjections(mrrData, months),
        insights: Array.isArray(parsed.insights) ? (parsed.insights as string[]) : getDefaultMRRInsights(mrrData),
        assumptions: Array.isArray(parsed.assumptions) ? (parsed.assumptions as string[]) : ['Historical growth rate continues', 'Churn remains stable', 'Pipeline converts at weighted rate'],
      };
    }
  } catch (error) {
    console.warn('[RevenueIntelligence] MRR projection LLM failed, using computed fallback:', error instanceof Error ? error.message : error);
  }

  return {
    projections: computeMRRProjections(mrrData, months),
    insights: getDefaultMRRInsights(mrrData),
    assumptions: ['Historical growth rate continues', 'Churn remains stable', 'Pipeline converts at weighted rate'],
  };
}

/**
 * Calculate churn rate, expansion rate, and net revenue retention.
 */
export async function calculateChurnMetrics(): Promise<{
  churnRate: number;
  expansionRate: number;
  netRevenueRetention: number;
  grossRevenueRetention: number;
  churnedMRR: number;
  expansionMRR: number;
  newMRR: number;
}> {
  const mrrData = await calculateMRR();

  // Calculate GRR (excludes expansion)
  const grossRevenueRetention = mrrData.currentMRR > 0
    ? Math.round(((mrrData.currentMRR - mrrData.currentMRR * mrrData.expansionRate / 100 + mrrData.currentMRR * mrrData.churnRate / 100) / mrrData.currentMRR) * 100 * 10) / 10
    : 100;

  // Estimate new MRR from pipeline
  const pipelineMetrics = await calculatePipelineValue();
  const newMRR = Math.round(pipelineMetrics.weightedPipeline * 0.08); // Assume 8% of weighted pipeline converts to new MRR monthly

  return {
    churnRate: mrrData.churnRate,
    expansionRate: mrrData.expansionRate,
    netRevenueRetention: mrrData.netRevenueRetention,
    grossRevenueRetention: Math.max(0, Math.min(100, grossRevenueRetention)),
    churnedMRR: Math.round(mrrData.currentMRR * mrrData.churnRate / 100),
    expansionMRR: Math.round(mrrData.currentMRR * mrrData.expansionRate / 100),
    newMRR,
  };
}

/**
 * Get full revenue dashboard data.
 */
export async function getRevenueDashboard(): Promise<{
  mrr: MRRTracking;
  arr: number;
  forecast: RevenueForecast;
  pipelineMetrics: PipelineMetrics;
  attribution: RevenueAttribution[];
  churnMetrics: Awaited<ReturnType<typeof calculateChurnMetrics>>;
}> {
  const [mrr, forecast, pipelineMetrics, attribution, churnMetrics] = await Promise.all([
    calculateMRR(),
    generateRevenueForecast('current_month'),
    calculatePipelineValue(),
    calculateRevenueAttribution(),
    calculateChurnMetrics(),
  ]);

  return {
    mrr,
    arr: mrr.currentMRR * 12,
    forecast,
    pipelineMetrics,
    attribution,
    churnMetrics,
  };
}

// ============================================================
// Deal Probability Scoring (AI-Powered)
// ============================================================

/**
 * Use LLM to score deal probability based on all available signals:
 * ICP fit score, engagement level, budget signals, timing, competitive position.
 */
export async function scoreDealProbability(leadId: string): Promise<DealProbability> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    return {
      leadId,
      probability: 0,
      factors: { icpFit: 0, engagementScore: 0, budgetSignals: 0, timingSignals: 0, competitivePosition: 0 },
    };
  }

  const leadData = lead as Record<string, unknown>;
  const stage = (leadData.stage as string) || 'new';
  const baseProbability = STAGE_WEIGHTS[stage] ?? 0.10;

  const systemPrompt = `You are an expert deal probability analyst. Score the probability of this deal closing based on all available signals. Return ONLY valid JSON.`;

  const userMessage = `LEAD DATA:
- Company: ${leadData.companyName || 'Unknown'}
- Industry: ${leadData.industry || 'Unknown'}
- Employee Count: ${leadData.employeeCount || 'Unknown'}
- Revenue Estimate: ${leadData.revenueEstimate || 'Unknown'}
- Lead Score: ${leadData.leadScore || 0}/100
- Lead Tier: ${leadData.leadTier || 'unqualified'}
- Stage: ${stage}
- Data Completeness: ${leadData.dataCompleteness || 0}%
- Days Since Discovery: ${leadData.discoveredAt ? Math.round((Date.now() - new Date(leadData.discoveredAt as string).getTime()) / (1000 * 60 * 60 * 24)) : 'Unknown'}

Score the deal probability as JSON:
{
  "probability": <0-100>,
  "factors": {
    "icpFit": <0-100: How well does this lead match the ideal customer profile?>,
    "engagementScore": <0-100: Level of engagement and responsiveness>,
    "budgetSignals": <0-100: Signals indicating budget availability>,
    "timingSignals": <0-100: Timing alignment and urgency signals>,
    "competitivePosition": <0-100: Competitive positioning strength>
  }
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed) {
      const factors = parsed.factors as Record<string, unknown> | undefined;
      return {
        leadId,
        probability: typeof parsed.probability === 'number'
          ? Math.min(100, Math.max(0, Math.round(parsed.probability)))
          : Math.round(baseProbability * 100),
        factors: {
          icpFit: clampScore(factors?.icpFit),
          engagementScore: clampScore(factors?.engagementScore),
          budgetSignals: clampScore(factors?.budgetSignals),
          timingSignals: clampScore(factors?.timingSignals),
          competitivePosition: clampScore(factors?.competitivePosition),
        },
      };
    }
  } catch (error) {
    console.warn('[RevenueIntelligence] Deal probability LLM failed, using heuristic:', error instanceof Error ? error.message : error);
  }

  // Fallback: compute from lead data
  const leadScore = (leadData.leadScore as number) || 0;
  const dataCompleteness = (leadData.dataCompleteness as number) || 0;

  return {
    leadId,
    probability: Math.round(baseProbability * 100 * (leadScore / 100) * (0.5 + dataCompleteness / 200)),
    factors: {
      icpFit: Math.round(leadScore * 0.8),
      engagementScore: Math.round(baseProbability * 100),
      budgetSignals: Math.round((leadData.revenueEstimate ? 60 : 20) + leadScore * 0.2),
      timingSignals: Math.round(50 + (stage === 'negotiating' || stage === 'engaged' ? 30 : 0)),
      competitivePosition: Math.round(40 + dataCompleteness * 0.3),
    },
  };
}

/**
 * Use LLM to assess overall pipeline risk for a campaign.
 */
export async function getPipelineRiskAssessment(campaignId: string): Promise<PipelineRiskAssessment> {
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });

  if (!campaign) {
    return {
      campaignId,
      overallRisk: 'high',
      riskFactors: [{ factor: 'Campaign not found', severity: 'high', description: 'The specified campaign does not exist', recommendation: 'Verify the campaign ID' }],
      opportunities: [],
      forecastConfidence: 0,
    };
  }

  const leads = await db.lead.findMany({ where: { campaignId } });
  const velocity = await calculateDealVelocity(campaignId);
  const pipelineMetrics = await calculatePipelineValue(campaignId);

  const totalLeads = leads.length;
  const closedWon = leads.filter(l => (l.stage as string) === 'closed_won').length;
  const closedLost = leads.filter(l => (l.stage as string) === 'closed_lost').length;
  const stalledLeads = leads.filter(l => (l.stage as string) === 'contacted' || (l.stage as string) === 'engaged').length;
  const newLeads = leads.filter(l => (l.stage as string) === 'new').length;
  const avgScore = totalLeads > 0
    ? Math.round((leads as Array<Record<string, unknown>>).reduce((sum, l) => sum + ((l.leadScore as number) || 0), 0) / totalLeads)
    : 0;

  const systemPrompt = `You are an expert sales pipeline risk analyst. Assess the overall pipeline risk and identify risk factors and opportunities. Return ONLY valid JSON.`;

  const userMessage = `CAMPAIGN: ${(campaign as Record<string, unknown>).name || 'Unknown'}

PIPELINE SUMMARY:
- Total Leads: ${totalLeads}
- Closed Won: ${closedWon}
- Closed Lost: ${closedLost}
- Stalled (contacted/engaged): ${stalledLeads}
- New Leads: ${newLeads}
- Average Lead Score: ${avgScore}/100
- Weighted Pipeline Value: $${pipelineMetrics.weightedPipeline.toLocaleString()}

VELOCITY:
${velocity.map(v => `${v.stage}: ${v.avgDaysInStage} days avg, ${v.conversionRate}% conversion, bottleneck: ${v.bottleneckScore}/100`).join('\n')}

Assess pipeline risk as JSON:
{
  "overallRisk": "low|medium|high|critical",
  "riskFactors": [
    {
      "factor": "Risk factor name",
      "severity": "low|medium|high",
      "description": "Description of the risk",
      "recommendation": "Action to mitigate"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Opportunity name",
      "potentialImpact": "Expected impact",
      "action": "Recommended action"
    }
  ],
  "forecastConfidence": <0-100>
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed) {
      return {
        campaignId,
        overallRisk: (['low', 'medium', 'high', 'critical'].includes(parsed.overallRisk as string)
          ? parsed.overallRisk : 'medium') as PipelineRiskAssessment['overallRisk'],
        riskFactors: Array.isArray(parsed.riskFactors)
          ? (parsed.riskFactors as Array<Record<string, unknown>>).map(rf => ({
              factor: (rf.factor as string) || '',
              severity: (['low', 'medium', 'high'].includes(rf.severity as string) ? rf.severity : 'medium') as 'low' | 'medium' | 'high',
              description: (rf.description as string) || '',
              recommendation: (rf.recommendation as string) || '',
            }))
          : computeRiskFactors(velocity, totalLeads, closedWon, stalledLeads),
        opportunities: Array.isArray(parsed.opportunities)
          ? (parsed.opportunities as Array<Record<string, unknown>>).map(opp => ({
              opportunity: (opp.opportunity as string) || '',
              potentialImpact: (opp.potentialImpact as string) || '',
              action: (opp.action as string) || '',
            }))
          : computeOpportunities(leads, pipelineMetrics),
        forecastConfidence: typeof parsed.forecastConfidence === 'number'
          ? Math.min(100, Math.max(0, parsed.forecastConfidence))
          : computeForecastConfidence(totalLeads, closedWon, avgScore),
      };
    }
  } catch (error) {
    console.warn('[RevenueIntelligence] Pipeline risk LLM failed, using computed fallback:', error instanceof Error ? error.message : error);
  }

  return {
    campaignId,
    overallRisk: computeOverallRisk(totalLeads, closedWon, stalledLeads, velocity),
    riskFactors: computeRiskFactors(velocity, totalLeads, closedWon, stalledLeads),
    opportunities: computeOpportunities(leads, pipelineMetrics),
    forecastConfidence: computeForecastConfidence(totalLeads, closedWon, avgScore),
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Estimate deal size from lead data synchronously (heuristic-based).
 */
function estimateDealSizeFromLeadSync(lead: Record<string, unknown>): number {
  const revenueEstimate = parseRevenueEstimate(lead.revenueEstimate as string | null);
  const employeeCount = parseEmployeeCount(lead.employeeCount as string | null);
  const leadScore = (lead.leadScore as number) || 0;
  const industry = (lead.industry as string) || '';

  // Base deal size from company revenue (typical SaaS spend is 0.5-2% of revenue)
  let dealSize = 0;
  if (revenueEstimate > 0) {
    const revenuePercentage = revenueEstimate > 100_000_000 ? 0.005
      : revenueEstimate > 10_000_000 ? 0.01
      : revenueEstimate > 1_000_000 ? 0.015
      : 0.02;
    dealSize = revenueEstimate * revenuePercentage;
  }

  // Adjust based on employee count if revenue is unavailable
  if (dealSize === 0 && employeeCount > 0) {
    dealSize = employeeCount * (employeeCount > 500 ? 50 : employeeCount > 100 ? 40 : 25);
  }

  // Industry multiplier
  const industryMultipliers: Record<string, number> = {
    'technology': 1.3, 'software': 1.4, 'saas': 1.5, 'fintech': 1.3,
    'healthcare': 1.1, 'finance': 1.2, 'banking': 1.2, 'insurance': 1.1,
    'manufacturing': 0.9, 'retail': 0.8, 'education': 0.7,
  };
  const industryLower = industry.toLowerCase();
  for (const [key, mult] of Object.entries(industryMultipliers)) {
    if (industryLower.includes(key)) {
      dealSize *= mult;
      break;
    }
  }

  // Adjust by lead score (higher score → larger likely deal)
  if (dealSize > 0) {
    const scoreMultiplier = 0.7 + (leadScore / 100) * 0.6; // 0.7x to 1.3x
    dealSize *= scoreMultiplier;
  }

  // Minimum deal size
  return Math.max(500, Math.round(dealSize));
}

/**
 * Async wrapper for deal size estimation from a lead record.
 */
async function estimateDealSizeFromLead(lead: Record<string, unknown>): Promise<number> {
  return estimateDealSizeFromLeadSync(lead);
}

/**
 * Parse revenue estimate string to number.
 */
function parseRevenueEstimate(value: string | null | undefined): number {
  if (!value) return 0;

  // Try direct number parse
  const direct = Number(value.replace(/[^0-9.-]/g, ''));
  if (!isNaN(direct) && direct > 0) return direct;

  // Try parsing common formats like "$10M", "5-10M", "$1B"
  const match = value.match(/\$?([\d.]+)\s*([KMBT]?)/i);
  if (match) {
    const num = parseFloat(match[1]);
    const multiplier = match[2].toUpperCase();
    switch (multiplier) {
      case 'K': return num * 1_000;
      case 'M': return num * 1_000_000;
      case 'B': return num * 1_000_000_000;
      case 'T': return num * 1_000_000_000_000;
      default: return num;
    }
  }

  return 0;
}

/**
 * Parse employee count string to number.
 */
function parseEmployeeCount(value: string | null | undefined): number {
  if (!value) return 0;

  // Try direct number parse
  const direct = Number(value.replace(/[^0-9-]/g, '').split('-')[0]);
  if (!isNaN(direct) && direct > 0) return direct;

  // Try parsing "50-200" range format
  const rangeMatch = value.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    return (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
  }

  // Try parsing "200+" format
  const plusMatch = value.match(/(\d+)\+/);
  if (plusMatch) {
    return parseInt(plusMatch[1]);
  }

  return 0;
}

/**
 * Parse the sources JSON field from a lead.
 */
function parseSources(sources: unknown): string[] {
  if (!sources) return [];
  if (Array.isArray(sources)) return sources.map(String);
  if (typeof sources === 'string') {
    try {
      const parsed = JSON.parse(sources);
      if (Array.isArray(parsed)) return parsed.map(String);
      return [String(parsed)];
    } catch {
      return sources.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Check if a lead has reached a given pipeline stage.
 */
function hasReachedStage(lead: Record<string, unknown>, stage: string): boolean {
  const currentStage = (lead.stage as string) || 'new';
  const stageIndex = PIPELINE_STAGES.indexOf(currentStage);
  const targetIndex = PIPELINE_STAGES.indexOf(stage);

  if (stageIndex === -1 || targetIndex === -1) return false;
  return stageIndex >= targetIndex;
}

/**
 * Compute the number of days a lead spent in a specific stage.
 */
function computeDaysInStage(
  lead: Record<string, unknown>,
  stage: string,
  stageIndex: number,
  stageOrder: string[]
): number {
  const timestampFields: Record<string, string> = {
    new: 'discoveredAt',
    enriched: 'enrichedAt',
    qualified: 'qualifiedAt',
    contacted: 'contactedAt',
  };

  const currentTimestamp = timestampFields[stage] ? lead[timestampFields[stage]] : null;
  const nextTimestamp = stageIndex < stageOrder.length - 1 && timestampFields[stageOrder[stageIndex + 1]]
    ? lead[timestampFields[stageOrder[stageIndex + 1]]]
    : null;

  if (currentTimestamp && nextTimestamp) {
    const start = new Date(currentTimestamp as string).getTime();
    const end = new Date(nextTimestamp as string).getTime();
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }

  // If we only have the start timestamp, estimate to now
  if (currentTimestamp) {
    const start = new Date(currentTimestamp as string).getTime();
    const now = Date.now();
    return Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24)));
  }

  // No timestamp available — use a default estimate
  const defaults: Record<string, number> = { new: 2, enriched: 3, qualified: 5, contacted: 7, engaged: 10, negotiating: 14, closed_won: 0 };
  return defaults[stage] || 5;
}

/**
 * Compute monthly pipeline trend from leads.
 */
function computeMonthlyTrend(leads: Record<string, unknown>[]): Array<{ month: string; pipelineValue: number; closedValue: number }> {
  const monthMap: Record<string, { pipeline: number; closed: number }> = {};
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { pipeline: 0, closed: 0 };
  }

  for (const lead of leads) {
    const dateField = lead.discoveredAt || lead.createdAt;
    if (!dateField) continue;

    const date = new Date(dateField as string);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap[key]) continue;

    const dealSize = estimateDealSizeFromLeadSync(lead);
    monthMap[key].pipeline += dealSize;

    if ((lead.stage as string) === 'closed_won') {
      monthMap[key].closed += dealSize;
    }
  }

  return Object.entries(monthMap).map(([month, data]) => ({
    month,
    pipelineValue: Math.round(data.pipeline),
    closedValue: Math.round(data.closed),
  }));
}

/**
 * Get default deal velocity data when no leads exist.
 */
function getDefaultDealVelocity(): DealVelocity[] {
  return [
    { stage: 'new', avgDaysInStage: 2, conversionRate: 60, bottleneckScore: 10 },
    { stage: 'enriched', avgDaysInStage: 3, conversionRate: 50, bottleneckScore: 15 },
    { stage: 'qualified', avgDaysInStage: 5, conversionRate: 45, bottleneckScore: 20 },
    { stage: 'contacted', avgDaysInStage: 7, conversionRate: 35, bottleneckScore: 35 },
    { stage: 'engaged', avgDaysInStage: 10, conversionRate: 40, bottleneckScore: 30 },
    { stage: 'negotiating', avgDaysInStage: 14, conversionRate: 60, bottleneckScore: 25 },
    { stage: 'closed_won', avgDaysInStage: 0, conversionRate: 100, bottleneckScore: 0 },
  ];
}

/**
 * Compute bottlenecks from velocity data when LLM is unavailable.
 */
function getComputedBottlenecks(velocity: DealVelocity[]): Array<{
  stage: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}> {
  return velocity
    .filter(v => v.bottleneckScore > 30)
    .map(v => ({
      stage: v.stage,
      severity: v.bottleneckScore > 70 ? 'high' : v.bottleneckScore > 50 ? 'medium' : 'low',
      description: `Average time in ${v.stage} stage is ${v.avgDaysInStage} days with ${v.conversionRate}% conversion rate`,
      recommendation: v.bottleneckScore > 70
        ? `Critical bottleneck in ${v.stage}. Review and optimize stage transition process. Consider additional outreach or qualification steps.`
        : `Monitor ${v.stage} stage. Consider process improvements to reduce time-to-conversion.`,
    }));
}

/**
 * Compute overall velocity score from velocity data.
 */
function computeOverallVelocityScore(velocity: DealVelocity[]): number {
  if (velocity.length === 0) return 50;
  const avgBottleneck = velocity.reduce((sum, v) => sum + v.bottleneckScore, 0) / velocity.length;
  const avgConversion = velocity.filter(v => v.conversionRate > 0).reduce((sum, v) => sum + v.conversionRate, 0) / Math.max(1, velocity.filter(v => v.conversionRate > 0).length);
  return Math.round(Math.min(100, Math.max(0, (100 - avgBottleneck) * 0.6 + avgConversion * 0.4)));
}

/**
 * Compute risk factors from pipeline data.
 */
function computeRiskFactors(
  velocity: DealVelocity[],
  totalLeads: number,
  closedWon: number,
  stalledLeads: number
): Array<{ factor: string; severity: 'low' | 'medium' | 'high'; description: string; recommendation: string }> {
  const risks: Array<{ factor: string; severity: 'low' | 'medium' | 'high'; description: string; recommendation: string }> = [];

  const highBottlenecks = velocity.filter(v => v.bottleneckScore > 60);
  if (highBottlenecks.length > 0) {
    risks.push({
      factor: 'Pipeline Bottlenecks',
      severity: 'high',
      description: `${highBottlenecks.length} stage(s) have significant bottlenecks: ${highBottlenecks.map(v => v.stage).join(', ')}`,
      recommendation: 'Focus on unblocking deals in bottleneck stages. Review and optimize handoff processes.',
    });
  }

  if (totalLeads > 0 && closedWon / totalLeads < 0.05) {
    risks.push({
      factor: 'Low Close Rate',
      severity: 'medium',
      description: `Only ${Math.round((closedWon / totalLeads) * 100)}% of leads have closed won. This may indicate targeting or qualification issues.`,
      recommendation: 'Review ICP targeting criteria and lead qualification process.',
    });
  }

  if (stalledLeads > totalLeads * 0.3) {
    risks.push({
      factor: 'High Stalled Lead Ratio',
      severity: 'medium',
      description: `${stalledLeads} leads (${Math.round((stalledLeads / totalLeads) * 100)}%) are in contacted/engaged stages without progressing.`,
      recommendation: 'Implement re-engagement campaigns or follow-up sequences for stalled leads.',
    });
  }

  if (risks.length === 0) {
    risks.push({
      factor: 'No Significant Risks',
      severity: 'low',
      description: 'Pipeline is progressing normally with no major bottlenecks identified.',
      recommendation: 'Continue monitoring pipeline health and conversion rates.',
    });
  }

  return risks;
}

/**
 * Compute opportunities from pipeline data.
 */
function computeOpportunities(
  leads: Record<string, unknown>[],
  pipelineMetrics: PipelineMetrics
): Array<{ opportunity: string; potentialImpact: string; action: string }> {
  const opportunities: Array<{ opportunity: string; potentialImpact: string; action: string }> = [];

  const hotLeads = leads.filter(l => (l.leadTier as string) === 'hot');
  if (hotLeads.length > 0) {
    const potentialValue = hotLeads.reduce((sum, l) => sum + estimateDealSizeFromLeadSync(l), 0);
    opportunities.push({
      opportunity: `${hotLeads.length} Hot Leads Ready for Outreach`,
      potentialImpact: `$${Math.round(potentialValue).toLocaleString()} in potential revenue`,
      action: 'Prioritize immediate personalized outreach to hot leads',
    });
  }

  const negotiatingLeads = leads.filter(l => (l.stage as string) === 'negotiating');
  if (negotiatingLeads.length > 0) {
    const dealValue = negotiatingLeads.reduce((sum, l) => sum + estimateDealSizeFromLeadSync(l), 0);
    opportunities.push({
      opportunity: `${negotiatingLeads.length} Deals in Negotiation`,
      potentialImpact: `$${Math.round(dealValue * 0.8).toLocaleString()} expected close value`,
      action: 'Provide deal support and accelerate closing process',
    });
  }

  if (pipelineMetrics.weightedPipeline > 0) {
    opportunities.push({
      opportunity: 'Pipeline Conversion Optimization',
      potentialImpact: `10% improvement = $${Math.round(pipelineMetrics.weightedPipeline * 0.1).toLocaleString()} additional revenue`,
      action: 'Focus on stage-to-stage conversion improvements through targeted interventions',
    });
  }

  return opportunities;
}

/**
 * Compute overall risk level.
 */
function computeOverallRisk(
  totalLeads: number,
  closedWon: number,
  stalledLeads: number,
  velocity: DealVelocity[]
): 'low' | 'medium' | 'high' | 'critical' {
  const avgBottleneck = velocity.length > 0
    ? velocity.reduce((sum, v) => sum + v.bottleneckScore, 0) / velocity.length
    : 50;
  const closeRate = totalLeads > 0 ? closedWon / totalLeads : 0;
  const stalledRate = totalLeads > 0 ? stalledLeads / totalLeads : 0;

  const riskScore = avgBottleneck * 0.4 + (1 - closeRate) * 100 * 0.3 + stalledRate * 100 * 0.3;

  if (riskScore > 75) return 'critical';
  if (riskScore > 55) return 'high';
  if (riskScore > 35) return 'medium';
  return 'low';
}

/**
 * Compute forecast confidence score.
 */
function computeForecastConfidence(totalLeads: number, closedWon: number, avgScore: number): number {
  if (totalLeads === 0) return 20;
  const dataVolume = Math.min(30, totalLeads);
  const closeRateConfidence = closedWon > 0 ? 30 : 10;
  const scoreConfidence = avgScore > 50 ? 25 : avgScore > 25 ? 15 : 5;
  return Math.min(90, Math.round(dataVolume + closeRateConfidence + scoreConfidence));
}

/**
 * Compute MRR projections from current data.
 */
function computeMRRProjections(mrrData: MRRTracking, months: number): Array<{ month: string; mrr: number; growth: number }> {
  const projections: Array<{ month: string; mrr: number; growth: number }> = [];
  let currentMRR = mrrData.currentMRR;
  const monthlyGrowthRate = (mrrData.expansionRate - mrrData.churnRate) / 100;

  const now = new Date();
  for (let i = 1; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const newMRR = Math.round(currentMRR * (1 + monthlyGrowthRate));
    const growth = currentMRR > 0 ? Math.round(((newMRR - currentMRR) / currentMRR) * 100 * 10) / 10 : 0;
    projections.push({ month: monthKey, mrr: newMRR, growth });
    currentMRR = newMRR;
  }

  return projections;
}

/**
 * Get default MRR insights when LLM is unavailable.
 */
function getDefaultMRRInsights(mrrData: MRRTracking): string[] {
  const insights: string[] = [];

  if (mrrData.churnRate > 5) {
    insights.push(`Churn rate of ${mrrData.churnRate}% is above the healthy threshold of 5%. Focus on customer retention strategies.`);
  }
  if (mrrData.netRevenueRetention > 100) {
    insights.push(`Net Revenue Retention of ${mrrData.netRevenueRetention}% indicates strong expansion revenue.`);
  }
  if (mrrData.expansionRate > 0) {
    insights.push(`Expansion rate of ${mrrData.expansionRate}% shows upsell/cross-sell opportunities.`);
  }
  if (mrrData.currentMRR > 0) {
    insights.push(`Current ARR run rate: $${(mrrData.currentMRR * 12).toLocaleString()}.`);
  }
  if (insights.length === 0) {
    insights.push('Insufficient data for MRR insights. Continue building pipeline to generate meaningful trends.');
  }

  return insights;
}

/**
 * Calculate MRR from lead pipeline when subscription data is unavailable.
 */
async function calculateMRRFromLeads(): Promise<MRRTracking> {
  const leads = await db.lead.findMany({
    where: { stage: { not: 'closed_lost' } },
  });

  const closedWonLeads = leads.filter(l => (l.stage as string) === 'closed_won');
  const currentMRR = closedWonLeads.reduce((sum, l) => {
    const dealSize = estimateDealSizeFromLeadSync(l as Record<string, unknown>);
    return sum + Math.round(dealSize / 12); // Annualize to monthly
  }, 0);

  // Estimate churn from closed_lost leads
  const closedLostLeads = await db.lead.findMany({ where: { stage: 'closed_lost' } });
  const churnedMRR = closedLostLeads.reduce((sum, l) => {
    const dealSize = estimateDealSizeFromLeadSync(l as Record<string, unknown>);
    return sum + Math.round(dealSize / 12);
  }, 0);

  const totalMRR = currentMRR + churnedMRR;
  const churnRate = totalMRR > 0 ? Math.round((churnedMRR / totalMRR) * 100 * 10) / 10 : 0;
  const expansionRate = currentMRR > 0 ? 5.0 : 0;
  const netRevenueRetention = currentMRR > 0
    ? Math.round(((currentMRR * 1.05 - churnedMRR) / currentMRR) * 100 * 10) / 10
    : 100;

  return {
    currentMRR,
    projectedMRR: Math.round(currentMRR * 1.05 - churnedMRR),
    churnRate,
    expansionRate,
    netRevenueRetention: Math.max(0, netRevenueRetention),
  };
}

/**
 * Clamp a score value to 0-100 range.
 */
function clampScore(value: unknown): number {
  if (typeof value === 'number') return Math.min(100, Math.max(0, Math.round(value)));
  return 0;
}
