/**
 * HumAIn Spark — Billing Engine
 * 
 * Operational Logic Matrix:
 * ┌──────────────┬─────────────────────────────────────┬────────────────────────────────────────────────────┐
 * │ Client Type  │ Billing Mechanism                    │ System Action on User Event                         │
 * ├──────────────┼─────────────────────────────────────┼────────────────────────────────────────────────────┤
 * │ B2B          │ Recurring Fixed Cycle                │ Stop: Flags cancel at period end                    │
 * │ (Enterprise) │ (Monthly / Annual)                   │ Restart: Pro-rated charge + reactivate API keys     │
 * ├──────────────┼─────────────────────────────────────┼────────────────────────────────────────────────────┤
 * │ B2C          │ Consumption / Pay-as-you-go          │ API Trigger: Counts actions/tokens/operations       │
 * │ (Consumer)   │                                     │ Billing Event: Auto-debits at preset thresholds     │
 * └──────────────┴─────────────────────────────────────┴────────────────────────────────────────────────────┘
 */

import { db } from '@/lib/db';

// ============================================================
// Plan Definitions — Industry-Graded Pricing
// ============================================================

export const SPARK_PLANS = [
  // ── B2B Enterprise Plans ──────────────────────────────────
  {
    name: 'spark-starter',
    displayName: 'Starter',
    clientType: 'b2b',
    billingCycle: 'monthly',
    basePrice: 97,
    annualPrice: 970,
    setupFee: 0,
    pricePerApiCall: 0, pricePerToken: 0, pricePerLead: 0, pricePerEnrichment: 0,
    billingThreshold: 0,
    includedApiCalls: 1000,
    includedLeads: 200,
    includedEnrichments: 100,
    includedTokens: 500,
    maxCampaigns: 3,
    maxSetters: 1,
    maxTeamMembers: 2,
    features: JSON.stringify(['prospect-discovery', 'icp-builder', 'lead-scoring', 'email-outreach', 'basic-enrichment']),
    grade: 'standard',
    description: 'For solo founders and small teams starting their outbound journey',
    highlight: false,
    badge: null,
    sortOrder: 1,
  },
  {
    name: 'spark-growth',
    displayName: 'Growth',
    clientType: 'b2b',
    billingCycle: 'monthly',
    basePrice: 297,
    annualPrice: 2970,
    setupFee: 0,
    pricePerApiCall: 0, pricePerToken: 0, pricePerLead: 0, pricePerEnrichment: 0,
    billingThreshold: 0,
    includedApiCalls: 5000,
    includedLeads: 1000,
    includedEnrichments: 500,
    includedTokens: 2000,
    maxCampaigns: 10,
    maxSetters: 3,
    maxTeamMembers: 5,
    features: JSON.stringify(['prospect-discovery', 'icp-builder', 'lead-scoring', 'email-outreach', 'linkedin-outreach', 'full-enrichment', 'ai-setter', 'market-analysis', 'competitive-intel', 'reports']),
    grade: 'professional',
    description: 'For growing teams scaling outbound with AI-powered automation',
    highlight: true,
    badge: 'Most Popular',
    sortOrder: 2,
  },
  {
    name: 'spark-enterprise',
    displayName: 'Enterprise',
    clientType: 'b2b',
    billingCycle: 'annual',
    basePrice: 997,
    annualPrice: 9970,
    setupFee: 500,
    pricePerApiCall: 0, pricePerToken: 0, pricePerLead: 0, pricePerEnrichment: 0,
    billingThreshold: 0,
    includedApiCalls: -1, // unlimited
    includedLeads: -1,
    includedEnrichments: -1,
    includedTokens: -1,
    maxCampaigns: -1,
    maxSetters: -1,
    maxTeamMembers: -1,
    features: JSON.stringify(['prospect-discovery', 'icp-builder', 'lead-scoring', 'email-outreach', 'linkedin-outreach', 'phone-outreach', 'full-enrichment', 'ai-setter', 'market-analysis', 'competitive-intel', 'reports', 'custom-agents', 'api-access', 'priority-support', 'dedicated-csm', 'sso', 'audit-logs']),
    grade: 'enterprise',
    description: 'For enterprises requiring unlimited scale, custom agents, and dedicated support',
    highlight: false,
    badge: 'Unlimited',
    sortOrder: 3,
  },
  // ── B2C Consumer Plans ────────────────────────────────────
  {
    name: 'spark-paygo',
    displayName: 'Pay-as-you-go',
    clientType: 'b2c',
    billingCycle: 'consumption',
    basePrice: 0,
    annualPrice: 0,
    setupFee: 0,
    pricePerApiCall: 0.02,
    pricePerToken: 0.003,
    pricePerLead: 1.50,
    pricePerEnrichment: 0.75,
    billingThreshold: 10,
    includedApiCalls: 50,
    includedLeads: 10,
    includedEnrichments: 5,
    includedTokens: 50,
    maxCampaigns: 1,
    maxSetters: 0,
    maxTeamMembers: 1,
    features: JSON.stringify(['prospect-discovery', 'icp-builder', 'lead-scoring', 'basic-enrichment']),
    grade: 'standard',
    description: 'For individuals and freelancers — only pay for what you use, auto-billed at $10 thresholds',
    highlight: true,
    badge: 'Flexible',
    sortOrder: 4,
  },
  {
    name: 'spark-creator',
    displayName: 'Creator',
    clientType: 'b2c',
    billingCycle: 'consumption',
    basePrice: 29,
    annualPrice: 0,
    setupFee: 0,
    pricePerApiCall: 0.015,
    pricePerToken: 0.002,
    pricePerLead: 1.00,
    pricePerEnrichment: 0.50,
    billingThreshold: 15,
    includedApiCalls: 500,
    includedLeads: 100,
    includedEnrichments: 50,
    includedTokens: 250,
    maxCampaigns: 3,
    maxSetters: 0,
    maxTeamMembers: 1,
    features: JSON.stringify(['prospect-discovery', 'icp-builder', 'lead-scoring', 'email-outreach', 'basic-enrichment', 'market-analysis']),
    grade: 'professional',
    description: 'For creators and consultants with a base plan + reduced consumption rates',
    highlight: false,
    badge: null,
    sortOrder: 5,
  },
] as const;

// ============================================================
// Seed Plans into DB
// ============================================================

export async function seedBillingPlans(): Promise<{ seeded: number; existing: number }> {
  let seeded = 0;
  let existing = 0;

  for (const plan of SPARK_PLANS) {
    const found = await db.billingPlan.findUnique({ where: { name: plan.name } });
    if (found) {
      existing++;
    } else {
      await db.billingPlan.create({ data: { ...plan } });
      seeded++;
    }
  }

  return { seeded, existing };
}

// ============================================================
// B2B: Stop Command — Flag subscription to cancel at period end
// ============================================================

export async function stopSubscription(subscriptionId: string): Promise<{
  success: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  message: string;
}> {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } });

  if (!sub) {
    return { success: false, cancelAtPeriodEnd: false, currentPeriodEnd: null, message: 'Subscription not found' };
  }

  if (sub.clientType !== 'b2b') {
    return { success: false, cancelAtPeriodEnd: false, currentPeriodEnd: null, message: 'Stop command is only available for B2B subscriptions' };
  }

  if (sub.cancelAtPeriodEnd) {
    return { success: true, cancelAtPeriodEnd: true, currentPeriodEnd: sub.currentPeriodEnd, message: 'Subscription is already flagged for cancellation at period end' };
  }

  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      cancelAtPeriodEnd: true,
      cancelledAt: new Date(),
    },
  });

  await db.billingEvent.create({
    data: {
      subscriptionId,
      eventType: 'subscription_cancelled',
      amount: 0,
      description: `Stop command: Subscription flagged to cancel at end of current period (${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'})`,
      metadata: JSON.stringify({ cancelAtPeriodEnd: true, periodEnd: sub.currentPeriodEnd }),
    },
  });

  return {
    success: true,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: sub.currentPeriodEnd,
    message: `Subscription will remain active until ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'end of current period'}. No further charges after that.`,
  };
}

// ============================================================
// B2B: Restart Command — Pro-rated charge + reactivate API keys
// ============================================================

export async function restartSubscription(subscriptionId: string): Promise<{
  success: boolean;
  proRatedCharge: number;
  apiEnabled: boolean;
  message: string;
}> {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } });

  if (!sub) {
    return { success: false, proRatedCharge: 0, apiEnabled: false, message: 'Subscription not found' };
  }

  if (sub.clientType !== 'b2b') {
    return { success: false, proRatedCharge: 0, apiEnabled: false, message: 'Restart command is only available for B2B subscriptions' };
  }

  if (!sub.cancelAtPeriodEnd && sub.status === 'active') {
    return { success: true, proRatedCharge: 0, apiEnabled: true, message: 'Subscription is already active' };
  }

  // Calculate pro-rated charge based on remaining days in period
  let proRated = 0;
  const now = new Date();
  const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;

  if (periodEnd && periodEnd > now) {
    const periodStart = sub.currentPeriodStart ? new Date(sub.currentPeriodStart) : now;
    const totalDays = Math.max(1, (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(1, (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const monthlyPrice = sub.billingCycle === 'annual' ? (sub.plan.annualPrice / 12) : sub.plan.basePrice;
    proRated = Math.round((monthlyPrice * (remainingDays / totalDays)) * 100) / 100;
  }

  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'active',
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      restartedAt: now,
      proRatedCharge: proRated,
      apiEnabled: true,
      totalBilled: { increment: proRated },
    },
  });

  await db.billingEvent.create({
    data: {
      subscriptionId,
      eventType: 'subscription_restarted',
      amount: proRated,
      description: `Restart command: Subscription reactivated with pro-rated charge of $${proRated.toFixed(2)}`,
      metadata: JSON.stringify({ proRatedCharge: proRated, restartedAt: now.toISOString() }),
    },
  });

  return {
    success: true,
    proRatedCharge: proRated,
    apiEnabled: true,
    message: `Subscription reactivated! Pro-rated charge of $${proRated.toFixed(2)} applied. API keys are now active.`,
  };
}

// ============================================================
// B2C: API Trigger Event — Count actions/tokens/operations
// ============================================================

export async function recordConsumption(
  subscriptionId: string,
  resourceType: 'api_call' | 'token' | 'lead' | 'enrichment' | 'setter_conversation',
  quantity: number = 1,
  description?: string,
  metadata?: Record<string, unknown>,
): Promise<{
  recorded: boolean;
  currentSpend: number;
  thresholdReached: boolean;
  message: string;
}> {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } });

  if (!sub) {
    return { recorded: false, currentSpend: 0, thresholdReached: false, message: 'Subscription not found' };
  }

  // Determine unit price based on resource type
  const priceMap: Record<string, number> = {
    api_call: sub.plan.pricePerApiCall,
    token: sub.plan.pricePerToken,
    lead: sub.plan.pricePerLead,
    enrichment: sub.plan.pricePerEnrichment,
    setter_conversation: 0.50, // Default rate
  };

  const unitPrice = priceMap[resourceType] || 0;
  const totalCost = Math.round(unitPrice * quantity * 100) / 100;

  // Create consumption record
  await db.consumptionRecord.create({
    data: {
      subscriptionId,
      resourceType,
      quantity,
      unitPrice,
      totalCost,
      description: description || `${resourceType} consumed`,
      metadata: metadata ? JSON.stringify(metadata) : null,
      billingPeriodStart: sub.currentPeriodStart,
      billingPeriodEnd: sub.currentPeriodEnd,
      billed: false,
    },
  });

  // Update subscription counters
  const counterMap: Record<string, string> = {
    api_call: 'apiCallsUsed',
    token: 'tokensUsed',
    lead: 'leadsProcessed',
    enrichment: 'enrichmentsProcessed',
  };
  const counterField = counterMap[resourceType];
  const updateData: Record<string, unknown> = {
    currentSpend: { increment: totalCost },
  };
  if (counterField) {
    updateData[counterField] = { increment: quantity };
  }

  await db.subscription.update({
    where: { id: subscriptionId },
    data: updateData,
  });

  // Check if billing threshold is reached (B2C)
  const newSpend = sub.currentSpend + totalCost;
  const threshold = sub.plan.billingThreshold;
  const thresholdReached = sub.clientType === 'b2c' && threshold > 0 && newSpend >= threshold;

  if (thresholdReached) {
    await processThresholdDebit(subscriptionId, newSpend);
  }

  return {
    recorded: true,
    currentSpend: newSpend,
    thresholdReached,
    message: thresholdReached
      ? `Threshold of $${threshold} reached. Auto-debit of $${newSpend.toFixed(2)} processed.`
      : `Consumption recorded. Current spend: $${newSpend.toFixed(2)}`,
  };
}

// ============================================================
// B2C: Billing Event — Auto-debit at preset data thresholds
// ============================================================

async function processThresholdDebit(subscriptionId: string, amount: number): Promise<void> {
  // Create billing event for the threshold debit
  await db.billingEvent.create({
    data: {
      subscriptionId,
      eventType: 'threshold_debit',
      amount,
      description: `Auto-debit: Spend reached threshold. Debited $${amount.toFixed(2)}`,
      metadata: JSON.stringify({ thresholdDebit: true, amount }),
    },
  });

  // Mark unbilled consumption records as billed
  await db.consumptionRecord.updateMany({
    where: { subscriptionId, billed: false },
    data: { billed: true },
  });

  // Reset current spend after billing
  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      currentSpend: 0,
      lastBillingEvent: new Date(),
      lastPaymentDate: new Date(),
      totalPaid: { increment: amount },
    },
  });
}

// ============================================================
// Create Subscription
// ============================================================

export async function createSubscription(data: {
  planName: string;
  clientName?: string;
  clientEmail?: string;
  billingCycle?: 'monthly' | 'annual' | 'consumption';
}): Promise<{ subscription: Record<string, unknown>; apiKey: string }> {
  const plan = await db.billingPlan.findUnique({ where: { name: data.planName } });
  if (!plan) throw new Error(`Plan "${data.planName}" not found`);

  const cycle = data.billingCycle || plan.billingCycle;
  const now = new Date();
  const periodEnd = new Date(now);
  if (cycle === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
  else if (cycle === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const apiKey = `sk_spark_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;

  const subscription = await db.subscription.create({
    data: {
      planId: plan.id,
      clientType: plan.clientType,
      clientName: data.clientName || null,
      clientEmail: data.clientEmail || null,
      billingCycle: cycle,
      currentPeriodStart: now,
      currentPeriodEnd: cycle !== 'consumption' ? periodEnd : null,
      nextBillingDate: cycle !== 'consumption' ? periodEnd : null,
      apiKey,
      apiEnabled: true,
    },
  });

  await db.billingEvent.create({
    data: {
      subscriptionId: subscription.id,
      eventType: 'subscription_created',
      amount: cycle === 'annual' ? plan.annualPrice : plan.basePrice,
      description: `New ${plan.clientType.toUpperCase()} subscription on ${plan.displayName} plan (${cycle})`,
      metadata: JSON.stringify({ planName: plan.name, billingCycle: cycle }),
    },
  });

  return { subscription, apiKey };
}

// ============================================================
// Get Dashboard Stats
// ============================================================

export async function getBillingDashboardStats() {
  const [
    totalB2B,
    totalB2C,
    activeSubscriptions,
    mrr,
    consumptionSpend,
    recentEvents,
    planDistribution,
  ] = await Promise.all([
    db.subscription.count({ where: { clientType: 'b2b', status: 'active' } }),
    db.subscription.count({ where: { clientType: 'b2c', status: 'active' } }),
    db.subscription.count({ where: { status: 'active' } }),
    db.subscription.aggregate({ where: { clientType: 'b2b', status: 'active' }, _sum: { totalBilled: true } }),
    db.subscription.aggregate({ where: { clientType: 'b2c', status: 'active' }, _sum: { currentSpend: true } }),
    db.billingEvent.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { subscription: { include: { plan: true } } } }),
    db.subscription.groupBy({ by: ['planId'], _count: true, where: { status: 'active' } }),
  ]);

  return {
    totalB2B,
    totalB2C,
    activeSubscriptions,
    mrr: mrr._sum.totalBilled || 0,
    consumptionSpend: consumptionSpend._sum.currentSpend || 0,
    recentEvents,
    planDistribution,
  };
}
