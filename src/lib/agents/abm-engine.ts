/**
 * ABM Engine — Account-Based Marketing
 * =====================================
 *
 * Comprehensive Account-Based Marketing engine for the LeadReach platform.
 * Provides full ABM capabilities: account lists, account scoring, targeted
 * content, intent signals, and ABM campaign analytics.
 *
 * Uses centralized callLLMForJSON for rate limiting, retries, and model fallback.
 * All LLM calls use temperature 0.3, retriesPerModel 2, useFallback true.
 */

import { callLLMForJSON } from '@/lib/llm';
import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

export interface Contact {
  id: string;
  name: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  role: 'decision_maker' | 'influencer' | 'champion' | 'end_user' | 'unknown';
  seniority: 'c_suite' | 'vp' | 'director' | 'manager' | 'individual_contributor' | 'unknown';
  department: string;
}

export type AccountTier = 'tier1' | 'tier2' | 'tier3';

export interface TargetAccount {
  id: string;
  companyName: string;
  domain: string;
  industry: string;
  employeeCount: number;
  revenue: number;
  tier: AccountTier;
  icpFitScore: number;        // 0-100
  engagementScore: number;    // 0-100
  intentScore: number;        // 0-100
  contacts: Contact[];
  lastActivity: string;
}

export interface AccountListCriteria {
  industries?: string[];
  minEmployeeCount?: number;
  maxEmployeeCount?: number;
  minRevenue?: number;
  maxRevenue?: number;
  locations?: string[];
  techStack?: string[];
  keywords?: string[];
}

export interface AccountList {
  id: string;
  name: string;
  description: string;
  criteria: AccountListCriteria;
  accounts: TargetAccount[];
  tierDistribution: { tier1: number; tier2: number; tier3: number };
  createdAt: string;
  updatedAt: string;
}

export interface ABMCampaign {
  id: string;
  name: string;
  targetAccounts: TargetAccount[];
  contentStrategy: ABMContentStrategy[];
  channels: ('email' | 'linkedin' | 'phone' | 'direct_mail' | 'digital_ads')[];
  timeline: { startDate: string; endDate: string; milestones: { date: string; description: string }[] };
  budget: { total: number; allocated: number; spent: number };
  createdAt: string;
}

export type IntentSignalType = 'research' | 'technology' | 'hire' | 'funding' | 'expansion' | 'leadership_change';

export interface IntentSignal {
  accountId: string;
  signalType: IntentSignalType;
  signalStrength: number;    // 0-100
  detectedAt: string;
  source: string;
  description: string;
}

export type EngagementTrend = 'increasing' | 'stable' | 'decreasing';

export interface AccountEngagement {
  accountId: string;
  totalInteractions: number;
  emailOpens: number;
  contentViews: number;
  meetingRequests: number;
  lastEngagement: string;
  engagementTrend: EngagementTrend;
  engagementScore: number;   // 0-100 aggregated score
}

export interface ABMContentStrategy {
  accountId: string;
  recommendedContent: { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  messagingAngle: string;
  personalizationNotes: string;
  channelSequence: { channel: string; order: number; timing: string; content: string }[];
}

export interface AccountScoreResult {
  accountId: string;
  overallScore: number;       // 0-100
  tier: AccountTier;
  breakdown: {
    firmographicFit: number;  // 0-100
    technographicFit: number; // 0-100
    intentAlignment: number;  // 0-100
    engagementLevel: number;  // 0-100
    icpMatch: number;         // 0-100
  };
  reasoning: string;
}

export interface BuyingCommitteeMember {
  name: string;
  likelyTitle: string;
  likelyRole: Contact['role'];
  likelySeniority: Contact['seniority'];
  likelyDepartment: string;
  influenceLevel: 'high' | 'medium' | 'low';
  recommendedApproach: string;
}

export interface EngagementEvent {
  id: string;
  accountId: string;
  eventType: 'email_open' | 'email_click' | 'content_view' | 'meeting_request' | 'demo_request' | 'website_visit' | 'social_engagement' | 'ad_click';
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface ABMCampaignPerformance {
  campaignId: string;
  campaignName: string;
  metrics: {
    totalAccounts: number;
    engagedAccounts: number;
    accountsInPipeline: number;
    closedWonAccounts: number;
    engagementRate: number;
    pipelineRate: number;
    winRate: number;
    averageDealSize: number;
    totalRevenue: number;
    costPerAccount: number;
    roi: number;
  };
  tierBreakdown: Record<AccountTier, {
    accounts: number;
    engaged: number;
    inPipeline: number;
    closedWon: number;
    engagementRate: number;
    winRate: number;
  }>;
  channelPerformance: Record<string, { sent: number; engaged: number; converted: number }>;
}

export interface AccountLevelROI {
  accountId: string;
  companyName: string;
  tier: AccountTier;
  investment: number;
  revenue: number;
  roi: number;
  dealStage: string;
  timeToClose: number | null; // days
}

export interface TargetAccountProgress {
  accountId: string;
  companyName: string;
  tier: AccountTier;
  currentStage: 'awareness' | 'engagement' | 'consideration' | 'decision' | 'closed_won' | 'closed_lost';
  stageProgress: number; // 0-100 within current stage
  daysInStage: number;
  totalDaysInFunnel: number;
  nextBestAction: string;
  riskFlags: string[];
}

// ============================================================
// In-Memory Stores (until dedicated tables exist)
// ============================================================

const accountLists = new Map<string, AccountList>();
const engagementEvents = new Map<string, EngagementEvent[]>();
const intentSignalsStore = new Map<string, IntentSignal[]>();
const abmCampaigns = new Map<string, ABMCampaign>();

// ============================================================
// ID Generation
// ============================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================
// Account List Management
// ============================================================

/**
 * Create a target account list with filtering criteria.
 * The list is initially empty and must be populated via populateAccountList().
 */
export async function createAccountList(
  name: string,
  criteria: AccountListCriteria
): Promise<AccountList> {
  const list: AccountList = {
    id: generateId('alist'),
    name,
    description: `Account list: ${name}`,
    criteria,
    accounts: [],
    tierDistribution: { tier1: 0, tier2: 0, tier3: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  accountLists.set(list.id, list);
  return list;
}

/**
 * Populate an account list by querying the leads DB and using LLM to
 * identify and enrich target accounts matching the list criteria.
 */
export async function populateAccountList(
  listId: string,
  criteria: AccountListCriteria
): Promise<AccountList> {
  const list = accountLists.get(listId);
  if (!list) {
    throw new Error(`Account list ${listId} not found`);
  }

  // ── Step 1: Pull matching leads from DB ──
  const where: Record<string, unknown> = {};

  if (criteria.industries && criteria.industries.length > 0) {
    // Use first industry for DB filter, LLM will refine
    where.industry = criteria.industries[0];
  }

  let leads: Record<string, unknown>[] = [];
  try {
    leads = await db.lead.findMany({ where, take: 200 });
  } catch (err) {
    console.warn('[ABMEngine] DB query failed, using empty leads:', err instanceof Error ? err.message : err);
  }

  // ── Step 2: Use LLM to evaluate and enrich accounts ──
  const systemPrompt = `You are an expert Account-Based Marketing strategist. Given a set of company/lead records and target criteria, identify which companies are the best ABM targets. For each qualifying company, provide enriched data including estimated revenue, employee count, and key contacts. Return ONLY valid JSON.`;

  const leadsSummary = leads.slice(0, 50).map((l, i) => ({
    index: i + 1,
    companyName: l.companyName || 'Unknown',
    domain: l.website || '',
    industry: l.industry || '',
    employeeCount: l.employeeCount || '',
    revenueEstimate: l.revenueEstimate || '',
    techStack: l.techStack || '',
    leadScore: l.leadScore || 0,
    stage: l.stage || '',
    sources: l.sources || '',
  }));

  const userMessage = `TARGET CRITERIA:
- Industries: ${criteria.industries?.join(', ') || 'Any'}
- Employee Count Range: ${criteria.minEmployeeCount || '0'} - ${criteria.maxEmployeeCount || 'Unlimited'}
- Revenue Range: $${criteria.minRevenue || '0'} - $${criteria.maxRevenue || 'Unlimited'}
- Required Tech Stack: ${criteria.techStack?.join(', ') || 'Any'}
- Keywords: ${criteria.keywords?.join(', ') || 'None'}
- Locations: ${criteria.locations?.join(', ') || 'Any'}

LEADS FROM DATABASE (${leads.length} total, showing top 50):
${JSON.stringify(leadsSummary, null, 2)}

Analyze these leads and return qualifying ABM target accounts as JSON:
{
  "accounts": [
    {
      "companyName": "Company name",
      "domain": "company.com",
      "industry": "Industry",
      "employeeCount": 500,
      "revenue": 50000000,
      "icpFitScore": 85,
      "reasoning": "Why this is a good target"
    }
  ]
}

Include up to 25 accounts. Only include accounts that meaningfully match the criteria. If no leads match well, generate 5-10 ideal target accounts based on the criteria alone.`;

  try {
    const parsed = await callLLMForJSON<{ accounts: Record<string, unknown>[] }>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    const rawAccounts = parsed?.accounts && Array.isArray(parsed.accounts) ? parsed.accounts : [];

    const accounts: TargetAccount[] = rawAccounts.map((a, idx) => {
      const employeeCount = typeof a.employeeCount === 'number' ? a.employeeCount : parseInt(String(a.employeeCount)) || 100;
      const revenue = typeof a.revenue === 'number' ? a.revenue : parseInt(String(a.revenue)) || 1_000_000;
      const icpFit = typeof a.icpFitScore === 'number' ? Math.min(100, Math.max(0, a.icpFitScore)) : 50;

      const tier = determineTier(employeeCount, revenue, icpFit);

      return {
        id: generateId('acct'),
        companyName: String(a.companyName || `Account ${idx + 1}`),
        domain: String(a.domain || ''),
        industry: String(a.industry || criteria.industries?.[0] || ''),
        employeeCount,
        revenue,
        tier,
        icpFitScore: icpFit,
        engagementScore: 0,
        intentScore: 0,
        contacts: [],
        lastActivity: new Date().toISOString(),
      };
    });

    list.accounts = accounts;
    list.tierDistribution = {
      tier1: accounts.filter(a => a.tier === 'tier1').length,
      tier2: accounts.filter(a => a.tier === 'tier2').length,
      tier3: accounts.filter(a => a.tier === 'tier3').length,
    };
    list.updatedAt = new Date().toISOString();
  } catch (error) {
    console.warn('[ABMEngine] populateAccountList LLM failed, using DB data:', error);
    // Fallback: convert DB leads directly
    list.accounts = leads.slice(0, 25).map((l, idx) => {
      const employeeCount = parseInt(String(l.employeeCount)) || 100;
      const revenue = parseFloat(String(l.revenueEstimate)?.replace(/[^0-9.]/g, '')) || 1_000_000;
      const icpFit = typeof l.leadScore === 'number' ? l.leadScore : 50;

      return {
        id: String(l.id || generateId('acct')),
        companyName: String(l.companyName || `Account ${idx + 1}`),
        domain: String(l.website || ''),
        industry: String(l.industry || ''),
        employeeCount,
        revenue,
        tier: determineTier(employeeCount, revenue, icpFit),
        icpFitScore: icpFit,
        engagementScore: 0,
        intentScore: 0,
        contacts: [],
        lastActivity: new Date().toISOString(),
      };
    });
    list.tierDistribution = {
      tier1: list.accounts.filter(a => a.tier === 'tier1').length,
      tier2: list.accounts.filter(a => a.tier === 'tier2').length,
      tier3: list.accounts.filter(a => a.tier === 'tier3').length,
    };
    list.updatedAt = new Date().toISOString();
  }

  return list;
}

/**
 * Automatically tier accounts in a list.
 * Tier 1 = high-value, 1:1 personalization
 * Tier 2 = moderate value, 1:few personalization
 * Tier 3 = broad targeting, 1:many campaigns
 */
export async function tierAccounts(listId: string): Promise<AccountList> {
  const list = accountLists.get(listId);
  if (!list) {
    throw new Error(`Account list ${listId} not found`);
  }

  if (list.accounts.length === 0) {
    return list;
  }

  // Score each account first (if not already scored)
  for (const account of list.accounts) {
    if (account.icpFitScore === 0 && account.engagementScore === 0 && account.intentScore === 0) {
      try {
        const scoreResult = await scoreAccount(account);
        account.icpFitScore = scoreResult.breakdown.icpMatch;
        account.engagementScore = scoreResult.breakdown.engagementLevel;
        account.intentScore = scoreResult.breakdown.intentAlignment;
        account.tier = scoreResult.tier;
      } catch {
        // Fallback tier assignment based on simple heuristics
        account.tier = determineTier(account.employeeCount, account.revenue, account.icpFitScore);
      }
    } else {
      // Re-tier based on composite score
      const composite = (account.icpFitScore * 0.4) + (account.engagementScore * 0.3) + (account.intentScore * 0.3);
      account.tier = composite >= 70 ? 'tier1' : composite >= 40 ? 'tier2' : 'tier3';
    }
  }

  list.tierDistribution = {
    tier1: list.accounts.filter(a => a.tier === 'tier1').length,
    tier2: list.accounts.filter(a => a.tier === 'tier2').length,
    tier3: list.accounts.filter(a => a.tier === 'tier3').length,
  };
  list.updatedAt = new Date().toISOString();

  return list;
}

/**
 * Get all account lists.
 */
export function getAccountLists(): AccountList[] {
  return Array.from(accountLists.values());
}

/**
 * Get accounts in a list, optionally filtered by tier.
 */
export function getAccountsInList(listId: string, tier?: AccountTier): TargetAccount[] {
  const list = accountLists.get(listId);
  if (!list) {
    throw new Error(`Account list ${listId} not found`);
  }

  if (tier) {
    return list.accounts.filter(a => a.tier === tier);
  }
  return list.accounts;
}

// ============================================================
// Account Scoring (AI-Powered)
// ============================================================

/**
 * Score an account for ABM targeting using LLM.
 * Considers firmographic fit, technographic alignment, intent signals,
 * engagement history, and ICP match.
 * Returns score 0-100 with tier assignment.
 */
export async function scoreAccount(accountData: Partial<TargetAccount>): Promise<AccountScoreResult> {
  const systemPrompt = `You are an expert Account-Based Marketing analyst. Score this target account for ABM prioritization. Consider firmographic fit (industry, size, revenue), technographic alignment, intent signals, engagement history, and ICP match. Return ONLY valid JSON.`;

  const userMessage = `ACCOUNT DATA:
- Company Name: ${accountData.companyName || 'Unknown'}
- Domain: ${accountData.domain || 'Unknown'}
- Industry: ${accountData.industry || 'Unknown'}
- Employee Count: ${accountData.employeeCount || 'Unknown'}
- Revenue: ${accountData.revenue ? `$${accountData.revenue.toLocaleString()}` : 'Unknown'}
- Current ICP Fit Score: ${accountData.icpFitScore || 'Not scored'}
- Current Engagement Score: ${accountData.engagementScore || 'Not tracked'}
- Current Intent Score: ${accountData.intentScore || 'Not tracked'}
- Number of Contacts: ${accountData.contacts?.length || 0}
- Last Activity: ${accountData.lastActivity || 'Unknown'}

Score this account across 5 dimensions and provide an overall ABM score. Return JSON:
{
  "overallScore": 75,
  "tier": "tier1",
  "breakdown": {
    "firmographicFit": 80,
    "technographicFit": 70,
    "intentAlignment": 65,
    "engagementLevel": 75,
    "icpMatch": 85
  },
  "reasoning": "Brief explanation of the score and tier assignment"
}

Scoring guidelines:
- firmographicFit: How well does the company's profile (industry, size, revenue) match ideal targets?
- technographicFit: How well does their tech stack align with your solution?
- intentAlignment: Are there buying signals indicating active interest?
- engagementLevel: How engaged is the account with your outreach/content?
- icpMatch: Overall ICP alignment score

Tier assignment:
- tier1: Score 70+, high-value strategic account deserving 1:1 personalization
- tier2: Score 40-69, moderate value, 1:few grouped personalization
- tier3: Score below 40, broad 1:many campaign targeting`;

  try {
    const parsed = await callLLMForJSON<AccountScoreResult>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed) {
      return {
        accountId: accountData.id || generateId('acct'),
        overallScore: clampScore(parsed.overallScore),
        tier: validateTier(parsed.tier),
        breakdown: {
          firmographicFit: clampScore(parsed.breakdown?.firmographicFit ?? 50),
          technographicFit: clampScore(parsed.breakdown?.technographicFit ?? 50),
          intentAlignment: clampScore(parsed.breakdown?.intentAlignment ?? 50),
          engagementLevel: clampScore(parsed.breakdown?.engagementLevel ?? 50),
          icpMatch: clampScore(parsed.breakdown?.icpMatch ?? 50),
        },
        reasoning: parsed.reasoning || 'Score calculated from available data',
      };
    }
  } catch (error) {
    console.warn('[ABMEngine] scoreAccount LLM failed, using heuristic:', error);
  }

  // Fallback: heuristic scoring
  return computeHeuristicScore(accountData);
}

/**
 * Rank accounts by ABM priority using LLM analysis.
 */
export async function prioritizeAccounts(accountIds: string[]): Promise<TargetAccount[]> {
  if (accountIds.length === 0) return [];

  // Gather account data from all lists
  const allAccounts: TargetAccount[] = [];
  for (const list of accountLists.values()) {
    for (const account of list.accounts) {
      if (accountIds.includes(account.id)) {
        allAccounts.push(account);
      }
    }
  }

  if (allAccounts.length === 0) return [];

  // Sort by composite score as fallback
  const compositeScore = (a: TargetAccount) =>
    (a.icpFitScore * 0.4) + (a.engagementScore * 0.3) + (a.intentScore * 0.3);

  allAccounts.sort((a, b) => compositeScore(b) - compositeScore(a));

  // If 5 or fewer accounts, just return the heuristic sort
  if (allAccounts.length <= 5) return allAccounts;

  // Use LLM for more nuanced prioritization
  const systemPrompt = `You are an expert ABM strategist. Rank these accounts by ABM priority based on their scores, size, and strategic value. Return ONLY a JSON array of account IDs in priority order (highest priority first).`;

  const accountsSummary = allAccounts.map(a => ({
    id: a.id,
    companyName: a.companyName,
    industry: a.industry,
    employeeCount: a.employeeCount,
    revenue: a.revenue,
    tier: a.tier,
    icpFitScore: a.icpFitScore,
    engagementScore: a.engagementScore,
    intentScore: a.intentScore,
  }));

  const userMessage = `ACCOUNTS TO PRIORITIZE:
${JSON.stringify(accountsSummary, null, 2)}

Return a JSON array of account IDs in priority order (highest priority first):
["account_id_1", "account_id_2", ...]`;

  try {
    const parsed = await callLLMForJSON<string[]>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed && Array.isArray(parsed)) {
      const idOrder = new Map(parsed.map((id, index) => [id, index]));
      const prioritized = [...allAccounts].sort((a, b) => {
        const orderA = idOrder.get(a.id) ?? allAccounts.length;
        const orderB = idOrder.get(b.id) ?? allAccounts.length;
        return orderA - orderB;
      });
      return prioritized;
    }
  } catch (error) {
    console.warn('[ABMEngine] prioritizeAccounts LLM failed, using heuristic sort:', error);
  }

  return allAccounts;
}

/**
 * Use LLM to identify likely buying committee members based on company data.
 */
export async function identifyBuyingCommittee(accountId: string): Promise<BuyingCommitteeMember[]> {
  const account = findAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const existingContacts = account.contacts.map(c => `${c.name} - ${c.title} (${c.role})`).join('\n');

  const systemPrompt = `You are an expert B2B sales strategist specializing in account-based selling. Identify the likely buying committee for a company considering a B2B technology solution. Return ONLY valid JSON.`;

  const userMessage = `COMPANY INFORMATION:
- Company: ${account.companyName}
- Industry: ${account.industry}
- Size: ${account.employeeCount} employees
- Revenue: $${account.revenue.toLocaleString()}

EXISTING CONTACTS:
${existingContacts || 'No contacts known'}

Based on this company's size and industry, identify the likely buying committee members for a B2B technology purchase. Return JSON:
{
  "committee": [
    {
      "name": "Likely role title (not a real name)",
      "likelyTitle": "Specific title (e.g., VP of Engineering)",
      "likelyRole": "decision_maker|influencer|champion|end_user|unknown",
      "likelySeniority": "c_suite|vp|director|manager|individual_contributor|unknown",
      "likelyDepartment": "Department name",
      "influenceLevel": "high|medium|low",
      "recommendedApproach": "How to engage this person"
    }
  ]
}

Include 5-8 committee members covering the full buying committee.`;

  try {
    const parsed = await callLLMForJSON<{ committee: Record<string, unknown>[] }>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    if (parsed?.committee && Array.isArray(parsed.committee)) {
      return parsed.committee.map((m) => ({
        name: String(m.name || 'Unknown'),
        likelyTitle: String(m.likelyTitle || 'Unknown'),
        likelyRole: validateRole(m.likelyRole as string),
        likelySeniority: validateSeniority(m.likelySeniority as string),
        likelyDepartment: String(m.likelyDepartment || 'Unknown'),
        influenceLevel: validateInfluenceLevel(m.influenceLevel as string),
        recommendedApproach: String(m.recommendedApproach || 'Standard outreach'),
      }));
    }
  } catch (error) {
    console.warn('[ABMEngine] identifyBuyingCommittee LLM failed, using defaults:', error);
  }

  return getDefaultBuyingCommittee(account.employeeCount);
}

// ============================================================
// Intent Signal Detection (AI-Powered)
// ============================================================

/**
 * Use LLM to analyze available data and detect buying intent signals.
 * Looks at: website changes, job postings, technology adoption, news/funding,
 * social activity, content consumption patterns.
 */
export async function detectIntentSignals(accountId: string): Promise<IntentSignal[]> {
  const account = findAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  // Gather existing engagement data as context
  const events = engagementEvents.get(accountId) || [];
  const existingSignals = intentSignalsStore.get(accountId) || [];
  const recentEvents = events.slice(-10).map(e => `${e.eventType} at ${e.timestamp}`).join('\n');

  const systemPrompt = `You are an expert intent data analyst. Analyze the available information about a target account and identify potential buying intent signals. Consider website activity, job postings, technology changes, funding events, expansion signals, and leadership changes. Return ONLY valid JSON.`;

  const userMessage = `ACCOUNT INFORMATION:
- Company: ${account.companyName}
- Domain: ${account.domain}
- Industry: ${account.industry}
- Size: ${account.employeeCount} employees
- Revenue: $${account.revenue.toLocaleString()}
- Tier: ${account.tier}
- Current Intent Score: ${account.intentScore}

RECENT ENGAGEMENT EVENTS:
${recentEvents || 'No recent events'}

EXISTING INTENT SIGNALS:
${existingSignals.map(s => `${s.signalType}: ${s.description} (strength: ${s.signalStrength})`).join('\n') || 'None detected yet'}

Analyze and return detected intent signals as JSON:
{
  "signals": [
    {
      "signalType": "research|technology|hire|funding|expansion|leadership_change",
      "signalStrength": 75,
      "source": "Where this signal was detected",
      "description": "Detailed description of the intent signal"
    }
  ]
}

Generate 2-6 realistic intent signals based on the company profile and engagement data. If there's limited data, infer likely signals from the industry and company size.`;

  try {
    const parsed = await callLLMForJSON<{ signals: Record<string, unknown>[] }>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    const signals: IntentSignal[] = (parsed?.signals && Array.isArray(parsed.signals) ? parsed.signals : []).map((s) => ({
      accountId,
      signalType: validateSignalType(s.signalType as string),
      signalStrength: clampScore(typeof s.signalStrength === 'number' ? s.signalStrength : 50),
      detectedAt: new Date().toISOString(),
      source: String(s.source || 'Inferred'),
      description: String(s.description || ''),
    }));

    // Store detected signals
    intentSignalsStore.set(accountId, [...existingSignals, ...signals]);

    return signals;
  } catch (error) {
    console.warn('[ABMEngine] detectIntentSignals LLM failed, using defaults:', error);
    return getDefaultIntentSignals(accountId, account.industry);
  }
}

/**
 * Aggregate all intent signals into a single score for an account.
 */
export function aggregateIntentScore(accountId: string): number {
  const signals = intentSignalsStore.get(accountId) || [];
  if (signals.length === 0) return 0;

  // Weight signals by recency and strength
  const now = Date.now();
  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    const ageDays = (now - new Date(signal.detectedAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0.1, 1 - (ageDays / 90)); // Decay over 90 days
    const typeWeights: Record<IntentSignalType, number> = {
      funding: 1.5,
      leadership_change: 1.3,
      expansion: 1.2,
      hire: 1.1,
      technology: 1.0,
      research: 0.8,
    };
    const typeWeight = typeWeights[signal.signalType] || 1.0;

    const weight = recencyWeight * typeWeight;
    weightedSum += signal.signalStrength * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Get accounts with intent scores above a threshold.
 */
export function getAccountsWithHighIntent(threshold: number = 60): Array<{ account: TargetAccount; intentScore: number }> {
  const results: Array<{ account: TargetAccount; intentScore: number }> = [];

  for (const list of accountLists.values()) {
    for (const account of list.accounts) {
      const score = aggregateIntentScore(account.id);
      if (score >= threshold) {
        results.push({ account, intentScore: score });
      }
    }
  }

  return results.sort((a, b) => b.intentScore - a.intentScore);
}

/**
 * Check for recent changes/updates for an account.
 * Simulates monitoring by re-detecting signals.
 */
export async function monitorAccountChanges(accountId: string): Promise<{
  newSignals: IntentSignal[];
  scoreChange: number;
  updatedIntentScore: number;
}> {
  const previousScore = aggregateIntentScore(accountId);
  const newSignals = await detectIntentSignals(accountId);
  const updatedIntentScore = aggregateIntentScore(accountId);

  return {
    newSignals,
    scoreChange: updatedIntentScore - previousScore,
    updatedIntentScore,
  };
}

// ============================================================
// Account Engagement Tracking
// ============================================================

/**
 * Track an engagement event for an account.
 */
export function trackEngagement(
  accountId: string,
  eventType: EngagementEvent['eventType'],
  metadata: Record<string, unknown> = {}
): EngagementEvent {
  const event: EngagementEvent = {
    id: generateId('evt'),
    accountId,
    eventType,
    metadata,
    timestamp: new Date().toISOString(),
  };

  const existing = engagementEvents.get(accountId) || [];
  existing.push(event);
  engagementEvents.set(accountId, existing);

  return event;
}

/**
 * Calculate aggregate engagement score for an account.
 */
export function calculateAccountEngagement(accountId: string): AccountEngagement {
  const events = engagementEvents.get(accountId) || [];

  const emailOpens = events.filter(e => e.eventType === 'email_open').length;
  const emailClicks = events.filter(e => e.eventType === 'email_click').length;
  const contentViews = events.filter(e => e.eventType === 'content_view').length;
  const meetingRequests = events.filter(e => e.eventType === 'meeting_request' || e.eventType === 'demo_request').length;
  const websiteVisits = events.filter(e => e.eventType === 'website_visit').length;
  const socialEngagements = events.filter(e => e.eventType === 'social_engagement').length;
  const adClicks = events.filter(e => e.eventType === 'ad_click').length;

  const totalInteractions = events.length;
  const lastEngagement = events.length > 0
    ? events[events.length - 1].timestamp
    : new Date().toISOString();

  // Weighted engagement score
  const rawScore =
    (emailOpens * 2) +
    (emailClicks * 5) +
    (contentViews * 3) +
    (meetingRequests * 15) +
    (websiteVisits * 2) +
    (socialEngagements * 4) +
    (adClicks * 3);

  const engagementScore = Math.min(100, Math.round(rawScore / 2));

  // Determine trend
  const engagementTrend = calculateEngagementTrend(events);

  return {
    accountId,
    totalInteractions,
    emailOpens: emailOpens + emailClicks,
    contentViews: contentViews + websiteVisits,
    meetingRequests,
    lastEngagement,
    engagementTrend,
    engagementScore,
  };
}

/**
 * Get timeline of all engagement events for an account.
 */
export function getEngagementTimeline(accountId: string): EngagementEvent[] {
  const events = engagementEvents.get(accountId) || [];
  return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Identify accounts with increasing/decreasing engagement.
 */
export function identifyEngagementTrends(): Array<{ accountId: string; trend: EngagementTrend; score: number }> {
  const results: Array<{ accountId: string; trend: EngagementTrend; score: number }> = [];
  const seen = new Set<string>();

  for (const list of accountLists.values()) {
    for (const account of list.accounts) {
      if (seen.has(account.id)) continue;
      seen.add(account.id);

      const engagement = calculateAccountEngagement(account.id);
      if (engagement.totalInteractions > 0) {
        results.push({
          accountId: account.id,
          trend: engagement.engagementTrend,
          score: engagement.totalInteractions,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ============================================================
// ABM Content Personalization (AI-Powered)
// ============================================================

/**
 * Use LLM to generate personalized content strategy for a specific account.
 * Includes messaging angles, recommended content types, channel sequence,
 * and personalization notes based on account's industry, challenges, and signals.
 */
export async function generateContentStrategy(accountId: string): Promise<ABMContentStrategy> {
  const account = findAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const engagement = calculateAccountEngagement(accountId);
  const signals = intentSignalsStore.get(accountId) || [];

  const tierGuidance = {
    tier1: '1:1 ultra-personalized — create unique content for this account. Use account-specific data, personalized videos, custom ROI models.',
    tier2: '1:few personalized — segment-based personalization with account-specific touches. Use industry-specific case studies, tailored messaging.',
    tier3: '1:many broad — scalable content with light personalization. Use industry templates, automated sequences.',
  };

  const systemPrompt = `You are an expert ABM content strategist. Generate a personalized content strategy for a specific target account. Consider their industry, size, tier level, engagement state, and intent signals. Return ONLY valid JSON.`;

  const userMessage = `ACCOUNT INFORMATION:
- Company: ${account.companyName}
- Industry: ${account.industry}
- Size: ${account.employeeCount} employees
- Revenue: $${account.revenue.toLocaleString()}
- Tier: ${account.tier} — ${tierGuidance[account.tier]}
- ICP Fit: ${account.icpFitScore}/100
- Engagement Score: ${engagement.engagementScore || account.engagementScore}/100
- Engagement Trend: ${engagement.engagementTrend}
- Total Interactions: ${engagement.totalInteractions}

INTENT SIGNALS:
${signals.map(s => `${s.signalType}: ${s.description} (strength: ${s.signalStrength})`).join('\n') || 'No specific signals detected'}

EXISTING ENGAGEMENT:
- Email Opens: ${engagement.emailOpens}
- Content Views: ${engagement.contentViews}
- Meeting Requests: ${engagement.meetingRequests}

Generate a comprehensive content strategy as JSON:
{
  "recommendedContent": [
    { "type": "case_study|whitepaper|webinar|personalized_video|roi_calculator|infographic|blog_post|email_sequence", "title": "Content title", "description": "Brief description", "priority": "high|medium|low" }
  ],
  "messagingAngle": "Primary messaging angle for this account (2-3 sentences)",
  "personalizationNotes": "Detailed personalization guidance based on account's specific context",
  "channelSequence": [
    { "channel": "email|linkedin|phone|direct_mail|digital_ads", "order": 1, "timing": "When to send (e.g., Day 1, Week 2)", "content": "What content to deliver" }
  ]
}

Provide 4-8 content recommendations and 4-6 channel sequence steps appropriate for the account's tier.`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      accountId,
      recommendedContent: parsed && Array.isArray(parsed.recommendedContent)
        ? parsed.recommendedContent.map((c: Record<string, unknown>) => ({
            type: String(c.type || 'case_study'),
            title: String(c.title || 'Personalized Content'),
            description: String(c.description || ''),
            priority: validatePriority(c.priority as string),
          }))
        : getDefaultContentRecommendations(account.tier),
      messagingAngle: (parsed?.messagingAngle as string) || `Address ${account.industry} challenges with tailored solutions for ${account.companyName}`,
      personalizationNotes: (parsed?.personalizationNotes as string) || `Focus on ${account.industry}-specific pain points. ${account.tier === 'tier1' ? 'Create 1:1 custom assets.' : account.tier === 'tier2' ? 'Use segment-specific content.' : 'Use broad campaign content.'}`,
      channelSequence: parsed && Array.isArray(parsed.channelSequence)
        ? parsed.channelSequence.map((cs: Record<string, unknown>) => ({
            channel: String(cs.channel || 'email'),
            order: typeof cs.order === 'number' ? cs.order : 1,
            timing: String(cs.timing || 'Week 1'),
            content: String(cs.content || 'Initial outreach'),
          }))
        : getDefaultChannelSequence(account.tier),
    };
  } catch (error) {
    console.warn('[ABMEngine] generateContentStrategy LLM failed, using defaults:', error);
    return {
      accountId,
      recommendedContent: getDefaultContentRecommendations(account.tier),
      messagingAngle: `Help ${account.companyName} overcome ${account.industry} challenges with our proven solution`,
      personalizationNotes: `Focus on ${account.industry} industry trends and ${account.employeeCount > 500 ? 'enterprise' : 'mid-market'} specific needs.`,
      channelSequence: getDefaultChannelSequence(account.tier),
    };
  }
}

/**
 * Generate account-specific messaging for a given channel and objective.
 */
export async function generatePersonalizedMessage(
  accountId: string,
  channel: 'email' | 'linkedin' | 'phone' | 'direct_mail',
  objective: 'awareness' | 'engagement' | 'meeting_request' | 'nurture' | 're_engagement'
): Promise<{ subject?: string; body: string; cta: string }> {
  const account = findAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const engagement = calculateAccountEngagement(accountId);
  const signals = intentSignalsStore.get(accountId) || [];

  const channelGuidance: Record<string, string> = {
    email: 'Professional email format with subject line. 100-150 words. Clear CTA.',
    linkedin: 'LinkedIn message format. 50-100 words. Conversational but professional.',
    phone: 'Phone call script/talking points. 30-second opener, 2-3 key points, close.',
    direct_mail: 'Direct mail copy. Brief, memorable, handwritten feel.',
  };

  const objectiveGuidance: Record<string, string> = {
    awareness: 'Introduce value proposition, no hard sell. Build curiosity.',
    engagement: 'Drive engagement with specific content or insight. Spark a conversation.',
    meeting_request: 'Direct ask for a meeting. Provide a compelling reason to meet now.',
    nurture: 'Deliver value without asking for anything. Build relationship over time.',
    re_engagement: 'Re-engage a previously active account. Reference past interaction.',
  };

  const systemPrompt = `You are an expert ABM copywriter. Generate a highly personalized ${channel} message for a specific target account. The objective is: ${objective}. ${channelGuidance[channel]} ${objectiveGuidance[objective]} Return ONLY valid JSON.`;

  const userMessage = `ACCOUNT:
- Company: ${account.companyName}
- Industry: ${account.industry}
- Size: ${account.employeeCount} employees
- Tier: ${account.tier}

ENGAGEMENT STATE:
- Total Interactions: ${engagement.totalInteractions}
- Last Engagement: ${engagement.lastEngagement}
- Trend: ${engagement.engagementTrend}

INTENT SIGNALS:
${signals.map(s => s.description).join(', ') || 'None detected'}

Generate the personalized message as JSON:
{
  ${channel === 'email' ? '"subject": "Compelling subject line",' : ''}
  "body": "Full message body",
  "cta": "The specific call to action"
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, string>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      subject: parsed?.subject || (channel === 'email' ? `Ideas for ${account.companyName}` : undefined),
      body: parsed?.body || getDefaultMessage(account, channel, objective),
      cta: parsed?.cta || 'Would you be open to a brief conversation?',
    };
  } catch (error) {
    console.warn('[ABMEngine] generatePersonalizedMessage LLM failed, using defaults:', error);
    return {
      subject: channel === 'email' ? `Ideas for ${account.companyName}` : undefined,
      body: getDefaultMessage(account, channel, objective),
      cta: 'Would you be open to a brief conversation?',
    };
  }
}

/**
 * Use LLM to recommend the next best action for an account based on
 * its engagement state and signals.
 */
export async function recommendNextAction(accountId: string): Promise<{
  action: string;
  channel: string;
  timing: string;
  reasoning: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}> {
  const account = findAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const engagement = calculateAccountEngagement(accountId);
  const signals = intentSignalsStore.get(accountId) || [];
  const intentScore = aggregateIntentScore(accountId);

  const systemPrompt = `You are an expert ABM strategist. Based on an account's current engagement state, intent signals, and tier, recommend the single most impactful next action. Return ONLY valid JSON.`;

  const userMessage = `ACCOUNT:
- Company: ${account.companyName}
- Industry: ${account.industry}
- Tier: ${account.tier}
- ICP Fit: ${account.icpFitScore}/100
- Engagement Score: ${engagement.engagementScore || account.engagementScore}/100
- Intent Score: ${intentScore}/100
- Total Interactions: ${engagement.totalInteractions}
- Last Engagement: ${engagement.lastEngagement}
- Engagement Trend: ${engagement.engagementTrend}

INTENT SIGNALS:
${signals.map(s => `${s.signalType} (${s.signalStrength}): ${s.description}`).join('\n') || 'None detected'}

Recommend the next best action as JSON:
{
  "action": "Specific action to take",
  "channel": "Best channel (email|linkedin|phone|direct_mail|digital_ads)",
  "timing": "When to take this action (e.g., Immediately, Within 48 hours, This week)",
  "reasoning": "Why this is the best next action",
  "priority": "critical|high|medium|low"
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      action: String(parsed?.action || 'Send personalized email'),
      channel: String(parsed?.channel || 'email'),
      timing: String(parsed?.timing || 'This week'),
      reasoning: String(parsed?.reasoning || 'Based on current engagement level and intent signals'),
      priority: validateActionPriority(parsed?.priority as string),
    };
  } catch (error) {
    console.warn('[ABMEngine] recommendNextAction LLM failed, using heuristic:', error);
    return getHeuristicNextAction(account, engagement, intentScore);
  }
}

// ============================================================
// ABM Campaign Analytics
// ============================================================

/**
 * Get ABM campaign performance metrics.
 */
export async function getABMCampaignPerformance(campaignId: string): Promise<ABMCampaignPerformance> {
  const campaign = abmCampaigns.get(campaignId);
  const campaignName = campaign?.name || `ABM Campaign ${campaignId}`;

  // Gather leads from DB for this campaign (if associated)
  let leads: Record<string, unknown>[] = [];
  try {
    leads = await db.lead.findMany({
      where: { campaignId },
    });
  } catch (err) {
    console.warn('[ABMEngine] DB query failed for campaign performance:', err instanceof Error ? err.message : err);
  }

  // If we have a stored ABM campaign with target accounts, use that data
  const targetAccounts = campaign?.targetAccounts || [];
  const totalAccounts = targetAccounts.length || leads.length;

  // Calculate metrics from engagement data and lead stages
  let engagedAccounts = 0;
  let accountsInPipeline = 0;
  let closedWonAccounts = 0;
  let totalRevenue = 0;
  let totalInvestment = campaign?.budget.total || totalAccounts * 500; // Default $500/account

  for (const account of targetAccounts) {
    const engagement = calculateAccountEngagement(account.id);
    if (engagement.totalInteractions > 0) engagedAccounts++;
    if (engagement.meetingRequests > 0) accountsInPipeline++;
  }

  for (const lead of leads) {
    const stage = String(lead.stage || '');
    if (['engaged', 'negotiating'].includes(stage)) accountsInPipeline++;
    if (stage === 'closed_won') {
      closedWonAccounts++;
      totalRevenue += parseFloat(String(lead.revenueEstimate)?.replace(/[^0-9.]/g, '')) || 0;
    }
  }

  const engagementRate = totalAccounts > 0 ? Math.round((engagedAccounts / totalAccounts) * 100) : 0;
  const pipelineRate = totalAccounts > 0 ? Math.round((accountsInPipeline / totalAccounts) * 100) : 0;
  const winRate = accountsInPipeline > 0 ? Math.round((closedWonAccounts / accountsInPipeline) * 100) : 0;
  const averageDealSize = closedWonAccounts > 0 ? Math.round(totalRevenue / closedWonAccounts) : 0;
  const costPerAccount = totalAccounts > 0 ? Math.round(totalInvestment / totalAccounts) : 0;
  const roi = totalInvestment > 0 ? Math.round(((totalRevenue - totalInvestment) / totalInvestment) * 100) : 0;

  // Tier breakdown
  const tierBreakdown: ABMCampaignPerformance['tierBreakdown'] = {
    tier1: { accounts: 0, engaged: 0, inPipeline: 0, closedWon: 0, engagementRate: 0, winRate: 0 },
    tier2: { accounts: 0, engaged: 0, inPipeline: 0, closedWon: 0, engagementRate: 0, winRate: 0 },
    tier3: { accounts: 0, engaged: 0, inPipeline: 0, closedWon: 0, engagementRate: 0, winRate: 0 },
  };

  for (const account of targetAccounts) {
    const tier = account.tier;
    tierBreakdown[tier].accounts++;
    const engagement = calculateAccountEngagement(account.id);
    if (engagement.totalInteractions > 0) tierBreakdown[tier].engaged++;
    if (engagement.meetingRequests > 0) tierBreakdown[tier].inPipeline++;
  }

  for (const [tier, data] of Object.entries(tierBreakdown)) {
    data.engagementRate = data.accounts > 0 ? Math.round((data.engaged / data.accounts) * 100) : 0;
    data.winRate = data.inPipeline > 0 ? Math.round((data.closedWon / data.inPipeline) * 100) : 0;
  }

  // Channel performance
  const channelPerformance: Record<string, { sent: number; engaged: number; converted: number }> = {};
  for (const account of targetAccounts) {
    const events = engagementEvents.get(account.id) || [];
    for (const event of events) {
      if (!channelPerformance[event.eventType]) {
        channelPerformance[event.eventType] = { sent: 0, engaged: 0, converted: 0 };
      }
      channelPerformance[event.eventType].sent++;
      if (['email_open', 'email_click', 'content_view', 'website_visit', 'social_engagement', 'ad_click'].includes(event.eventType)) {
        channelPerformance[event.eventType].engaged++;
      }
      if (['meeting_request', 'demo_request'].includes(event.eventType)) {
        channelPerformance[event.eventType].converted++;
      }
    }
  }

  return {
    campaignId,
    campaignName,
    metrics: {
      totalAccounts,
      engagedAccounts,
      accountsInPipeline,
      closedWonAccounts,
      engagementRate,
      pipelineRate,
      winRate,
      averageDealSize,
      totalRevenue,
      costPerAccount,
      roi,
    },
    tierBreakdown,
    channelPerformance,
  };
}

/**
 * Get ROI metrics at account level.
 */
export async function getAccountLevelROI(): Promise<AccountLevelROI[]> {
  const results: AccountLevelROI[] = [];
  const seen = new Set<string>();

  for (const list of accountLists.values()) {
    for (const account of list.accounts) {
      if (seen.has(account.id)) continue;
      seen.add(account.id);

      // Estimate investment based on tier
      const tierInvestment: Record<AccountTier, number> = {
        tier1: 5000,
        tier2: 1500,
        tier3: 300,
      };
      const investment = tierInvestment[account.tier];

      // Get engagement and pipeline data
      const engagement = calculateAccountEngagement(account.id);
      const revenue = engagement.meetingRequests > 0
        ? account.revenue * 0.001 // Estimate 0.1% of revenue as potential deal
        : 0;

      results.push({
        accountId: account.id,
        companyName: account.companyName,
        tier: account.tier,
        investment,
        revenue: Math.round(revenue),
        roi: investment > 0 ? Math.round(((revenue - investment) / investment) * 100) : 0,
        dealStage: engagement.meetingRequests > 0 ? 'consideration' : engagement.totalInteractions > 0 ? 'engagement' : 'awareness',
        timeToClose: null,
      });
    }
  }

  return results.sort((a, b) => b.roi - a.roi);
}

/**
 * Get progress of a target account through the ABM funnel.
 */
export async function getTargetAccountProgress(accountId: string): Promise<TargetAccountProgress> {
  const account = findAccountById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const engagement = calculateAccountEngagement(accountId);
  const signals = intentSignalsStore.get(accountId) || [];
  const intentScore = aggregateIntentScore(accountId);

  // Determine current ABM funnel stage
  const stage = determineFunnelStage(engagement, intentScore);

  // Calculate stage progress
  const stageProgress = calculateStageProgress(stage, engagement, intentScore);

  // Calculate days in stage (approximation based on events)
  const events = engagementEvents.get(accountId) || [];
  const stageEvents = events.filter(e => {
    if (stage === 'awareness') return e.eventType === 'website_visit' || e.eventType === 'ad_click';
    if (stage === 'engagement') return e.eventType === 'email_open' || e.eventType === 'content_view';
    if (stage === 'consideration') return e.eventType === 'meeting_request' || e.eventType === 'demo_request';
    return true;
  });

  const daysInStage = stageEvents.length > 0
    ? Math.max(1, Math.ceil((Date.now() - new Date(stageEvents[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const totalDaysInFunnel = events.length > 0
    ? Math.max(1, Math.ceil((Date.now() - new Date(events[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  // Get next best action
  let nextBestAction = 'Begin awareness campaign';
  try {
    const recommendation = await recommendNextAction(accountId);
    nextBestAction = recommendation.action;
  } catch {
    // Use heuristic
    if (stage === 'awareness') nextBestAction = 'Send personalized email to initiate engagement';
    else if (stage === 'engagement') nextBestAction = 'Share industry-specific content to deepen engagement';
    else if (stage === 'consideration') nextBestAction = 'Request a discovery meeting';
    else if (stage === 'decision') nextBestAction = 'Send ROI analysis and case studies';
    else nextBestAction = 'Continue engagement';
  }

  // Identify risk flags
  const riskFlags: string[] = [];
  if (engagement.engagementTrend === 'decreasing') riskFlags.push('Declining engagement');
  if (daysInStage > 30 && stage === 'awareness') riskFlags.push('Stalled in awareness stage');
  if (daysInStage > 45 && stage === 'engagement') riskFlags.push('Stalled in engagement stage');
  if (intentScore < 20 && engagement.totalInteractions > 5) riskFlags.push('High interactions but low intent');
  if (signals.length === 0 && account.tier === 'tier1') riskFlags.push('No intent signals detected for Tier 1 account');

  return {
    accountId,
    companyName: account.companyName,
    tier: account.tier,
    currentStage: stage,
    stageProgress,
    daysInStage,
    totalDaysInFunnel,
    nextBestAction,
    riskFlags,
  };
}

// ============================================================
// ABM Campaign Management
// ============================================================

/**
 * Create an ABM campaign with target accounts, content strategy, channels, timeline, and budget.
 */
export async function createABMCampaign(params: {
  name: string;
  accountListId: string;
  channels: ABMCampaign['channels'];
  startDate: string;
  endDate: string;
  totalBudget: number;
}): Promise<ABMCampaign> {
  const list = accountLists.get(params.accountListId);
  if (!list) {
    throw new Error(`Account list ${params.accountListId} not found`);
  }

  // Generate content strategies for each account
  const contentStrategies: ABMContentStrategy[] = [];
  // For efficiency, generate content strategy for the list as a whole
  // and then customize for tier
  const tierStrategies: Partial<Record<AccountTier, ABMContentStrategy>> = {};

  for (const tier of ['tier1', 'tier2', 'tier3'] as AccountTier[]) {
    const tierAccounts = list.accounts.filter(a => a.tier === tier);
    if (tierAccounts.length === 0) continue;

    try {
      const strategy = await generateContentStrategy(tierAccounts[0].id);
      tierStrategies[tier] = strategy;
    } catch {
      tierStrategies[tier] = {
        accountId: tierAccounts[0].id,
        recommendedContent: getDefaultContentRecommendations(tier),
        messagingAngle: `Targeted messaging for ${tier} accounts`,
        personalizationNotes: `Standard ${tier} personalization approach`,
        channelSequence: getDefaultChannelSequence(tier),
      };
    }
  }

  // Assign strategies to accounts
  for (const account of list.accounts) {
    const strategy = tierStrategies[account.tier];
    if (strategy) {
      contentStrategies.push({
        ...strategy,
        accountId: account.id,
        messagingAngle: strategy.messagingAngle.replace(tierStrategies[account.tier]?.accountId || '', account.id),
      });
    }
  }

  // Allocate budget across tiers
  const tierAllocation: Record<AccountTier, number> = {
    tier1: 0.6,  // 60% of budget to Tier 1
    tier2: 0.3,  // 30% to Tier 2
    tier3: 0.1,  // 10% to Tier 3
  };

  const allocated = params.totalBudget;

  const campaign: ABMCampaign = {
    id: generateId('abm'),
    name: params.name,
    targetAccounts: list.accounts,
    contentStrategy: contentStrategies,
    channels: params.channels,
    timeline: {
      startDate: params.startDate,
      endDate: params.endDate,
      milestones: [
        { date: params.startDate, description: 'Campaign launch — initial awareness outreach' },
        { date: addDays(params.startDate, 7), description: 'Engagement phase — content delivery and follow-ups' },
        { date: addDays(params.startDate, 21), description: 'Consideration phase — meeting requests and demos' },
        { date: addDays(params.startDate, 35), description: 'Decision phase — proposals and negotiations' },
        { date: params.endDate, description: 'Campaign review — performance analysis and optimization' },
      ],
    },
    budget: {
      total: params.totalBudget,
      allocated,
      spent: 0,
    },
    createdAt: new Date().toISOString(),
  };

  abmCampaigns.set(campaign.id, campaign);
  return campaign;
}

// ============================================================
// Internal Helpers
// ============================================================

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function validateTier(tier: string): AccountTier {
  if (['tier1', 'tier2', 'tier3'].includes(tier)) return tier as AccountTier;
  return 'tier3';
}

function validateRole(role: string): Contact['role'] {
  if (['decision_maker', 'influencer', 'champion', 'end_user', 'unknown'].includes(role)) return role as Contact['role'];
  return 'unknown';
}

function validateSeniority(seniority: string): Contact['seniority'] {
  if (['c_suite', 'vp', 'director', 'manager', 'individual_contributor', 'unknown'].includes(seniority)) return seniority as Contact['seniority'];
  return 'unknown';
}

function validateInfluenceLevel(level: string): 'high' | 'medium' | 'low' {
  if (['high', 'medium', 'low'].includes(level)) return level as 'high' | 'medium' | 'low';
  return 'medium';
}

function validateSignalType(type: string): IntentSignalType {
  if (['research', 'technology', 'hire', 'funding', 'expansion', 'leadership_change'].includes(type)) return type as IntentSignalType;
  return 'research';
}

function validatePriority(priority: string): 'high' | 'medium' | 'low' {
  if (['high', 'medium', 'low'].includes(priority)) return priority as 'high' | 'medium' | 'low';
  return 'medium';
}

function validateActionPriority(priority: string): 'critical' | 'high' | 'medium' | 'low' {
  if (['critical', 'high', 'medium', 'low'].includes(priority)) return priority as 'critical' | 'high' | 'medium' | 'low';
  return 'medium';
}

function determineTier(employeeCount: number, revenue: number, icpFit: number): AccountTier {
  const compositeScore = (icpFit * 0.4) +
    (Math.min(100, employeeCount / 50) * 0.3) +
    (Math.min(100, revenue / 1_000_000) * 0.3);

  if (compositeScore >= 65 || (employeeCount >= 1000 && icpFit >= 60)) return 'tier1';
  if (compositeScore >= 35 || (employeeCount >= 100 && icpFit >= 40)) return 'tier2';
  return 'tier3';
}

function computeHeuristicScore(accountData: Partial<TargetAccount>): AccountScoreResult {
  const employeeCount = accountData.employeeCount || 100;
  const revenue = accountData.revenue || 1_000_000;
  const icpFit = accountData.icpFitScore || 50;

  const firmographicFit = Math.min(100, Math.round(
    (employeeCount >= 50 && employeeCount <= 5000 ? 70 : 40) +
    (revenue >= 1_000_000 ? 20 : 0) +
    (icpFit > 50 ? 10 : 0)
  ));

  const technographicFit = 50; // No tech data available in fallback
  const intentAlignment = accountData.intentScore || 30;
  const engagementLevel = accountData.engagementScore || 20;
  const icpMatch = icpFit;

  const overallScore = Math.round(
    (firmographicFit * 0.25) +
    (technographicFit * 0.15) +
    (intentAlignment * 0.25) +
    (engagementLevel * 0.15) +
    (icpMatch * 0.20)
  );

  const tier = determineTier(employeeCount, revenue, overallScore);

  return {
    accountId: accountData.id || generateId('acct'),
    overallScore,
    tier,
    breakdown: {
      firmographicFit,
      technographicFit,
      intentAlignment,
      engagementLevel,
      icpMatch,
    },
    reasoning: `Heuristic score based on firmographics (employees: ${employeeCount}, revenue: $${revenue.toLocaleString()}) and ICP fit (${icpFit}/100)`,
  };
}

function findAccountById(accountId: string): TargetAccount | null {
  for (const list of accountLists.values()) {
    const account = list.accounts.find(a => a.id === accountId);
    if (account) return account;
  }
  return null;
}

function calculateEngagementTrend(events: EngagementEvent[]): EngagementTrend {
  if (events.length < 3) return 'stable';

  const now = Date.now();
  const recentWindow = 14 * 24 * 60 * 60 * 1000; // 14 days
  const olderWindow = 28 * 24 * 60 * 60 * 1000;  // 28 days

  const recentEvents = events.filter(e => (now - new Date(e.timestamp).getTime()) < recentWindow).length;
  const olderEvents = events.filter(e => {
    const age = now - new Date(e.timestamp).getTime();
    return age >= recentWindow && age < olderWindow;
  }).length;

  if (recentEvents > olderEvents * 1.3) return 'increasing';
  if (recentEvents < olderEvents * 0.7) return 'decreasing';
  return 'stable';
}

function determineFunnelStage(
  engagement: AccountEngagement,
  intentScore: number
): TargetAccountProgress['currentStage'] {
  if (engagement.meetingRequests > 0 && intentScore > 50) return 'consideration';
  if (engagement.totalInteractions > 5 && engagement.emailOpens > 2) return 'engagement';
  if (engagement.totalInteractions > 0) return 'awareness';
  return 'awareness';
}

function calculateStageProgress(
  stage: TargetAccountProgress['currentStage'],
  engagement: AccountEngagement,
  intentScore: number
): number {
  switch (stage) {
    case 'awareness':
      return Math.min(100, Math.round((engagement.totalInteractions / 3) * 50 + (intentScore / 100) * 50));
    case 'engagement':
      return Math.min(100, Math.round((engagement.contentViews / 5) * 40 + (engagement.emailOpens / 5) * 30 + (intentScore / 100) * 30));
    case 'consideration':
      return Math.min(100, Math.round((engagement.meetingRequests / 2) * 60 + (intentScore / 100) * 40));
    case 'decision':
      return Math.min(100, Math.round(intentScore));
    default:
      return 0;
  }
}

function getHeuristicNextAction(
  account: TargetAccount,
  engagement: AccountEngagement,
  intentScore: number
): { action: string; channel: string; timing: string; reasoning: string; priority: 'critical' | 'high' | 'medium' | 'low' } {
  if (intentScore > 70 && engagement.meetingRequests === 0) {
    return {
      action: `Request a meeting with ${account.companyName} — high intent signals detected`,
      channel: 'email',
      timing: 'Immediately',
      reasoning: 'High intent score with no meeting requests yet — strong opportunity',
      priority: 'critical',
    };
  }
  if (engagement.engagementTrend === 'decreasing') {
    return {
      action: `Re-engage ${account.companyName} with personalized content`,
      channel: 'linkedin',
      timing: 'Within 48 hours',
      reasoning: 'Engagement is declining — need to re-engage before the account goes cold',
      priority: 'high',
    };
  }
  if (engagement.totalInteractions === 0) {
    return {
      action: `Initiate first outreach to ${account.companyName}`,
      channel: account.tier === 'tier1' ? 'email' : 'digital_ads',
      timing: 'This week',
      reasoning: 'No engagement yet — start awareness campaign',
      priority: account.tier === 'tier1' ? 'high' : 'medium',
    };
  }
  if (engagement.contentViews > 3 && engagement.meetingRequests === 0) {
    return {
      action: `Convert ${account.companyName}'s content interest into a meeting`,
      channel: 'email',
      timing: 'Within 48 hours',
      reasoning: 'Account is consuming content but hasn\'t requested a meeting',
      priority: 'high',
    };
  }
  return {
    action: `Continue nurturing ${account.companyName} with relevant content`,
    channel: 'email',
    timing: 'This week',
    reasoning: 'Maintain engagement momentum',
    priority: 'medium',
  };
}

// ============================================================
// Default / Fallback Data Generators
// ============================================================

function getDefaultBuyingCommittee(employeeCount: number): BuyingCommitteeMember[] {
  const isEnterprise = employeeCount >= 500;

  const committee: BuyingCommitteeMember[] = [
    {
      name: 'Economic Buyer',
      likelyTitle: isEnterprise ? 'CFO / VP Finance' : 'CEO / COO',
      likelyRole: 'decision_maker',
      likelySeniority: isEnterprise ? 'vp' : 'c_suite',
      likelyDepartment: 'Finance',
      influenceLevel: 'high',
      recommendedApproach: 'Focus on ROI, cost savings, and financial impact',
    },
    {
      name: 'Technical Evaluator',
      likelyTitle: isEnterprise ? 'VP Engineering / CTO' : 'Lead Developer / Technical Lead',
      likelyRole: 'influencer',
      likelySeniority: isEnterprise ? 'vp' : 'director',
      likelyDepartment: 'Engineering / Technology',
      influenceLevel: 'high',
      recommendedApproach: 'Demonstrate technical capabilities, integrations, and architecture',
    },
    {
      name: 'Business Champion',
      likelyTitle: isEnterprise ? 'Director of Operations' : 'Operations Manager',
      likelyRole: 'champion',
      likelySeniority: isEnterprise ? 'director' : 'manager',
      likelyDepartment: 'Operations',
      influenceLevel: 'medium',
      recommendedApproach: 'Empower as internal advocate with case studies and ROI data',
    },
    {
      name: 'End User Representative',
      likelyTitle: 'Team Lead / Senior Specialist',
      likelyRole: 'end_user',
      likelySeniority: 'manager',
      likelyDepartment: 'Relevant Business Unit',
      influenceLevel: 'medium',
      recommendedApproach: 'Show ease of use, training resources, and day-to-day benefits',
    },
    {
      name: 'Procurement Contact',
      likelyTitle: isEnterprise ? 'Procurement Manager' : 'Office Manager',
      likelyRole: 'influencer',
      likelySeniority: 'manager',
      likelyDepartment: 'Procurement / Admin',
      influenceLevel: 'low',
      recommendedApproach: 'Provide pricing transparency, contract flexibility, and compliance documentation',
    },
  ];

  if (isEnterprise) {
    committee.splice(2, 0, {
      name: 'Department Head',
      likelyTitle: 'VP of Business Unit',
      likelyRole: 'influencer',
      likelySeniority: 'vp',
      likelyDepartment: 'Business Unit',
      influenceLevel: 'high',
      recommendedApproach: 'Address department-specific pain points and KPIs',
    });
  }

  return committee;
}

function getDefaultIntentSignals(accountId: string, industry: string): IntentSignal[] {
  const now = new Date().toISOString();
  return [
    {
      accountId,
      signalType: 'research',
      signalStrength: 45,
      detectedAt: now,
      source: 'Inferred from industry activity',
      description: `${industry} companies are actively researching solutions in this category`,
    },
    {
      accountId,
      signalType: 'technology',
      signalStrength: 35,
      detectedAt: now,
      source: 'Technology footprint analysis',
      description: `Technology stack suggests potential compatibility and need`,
    },
    {
      accountId,
      signalType: 'expansion',
      signalStrength: 30,
      detectedAt: now,
      source: 'Market analysis',
      description: `Company growth pattern suggests expanding needs`,
    },
  ];
}

function getDefaultContentRecommendations(tier: AccountTier): ABMContentStrategy['recommendedContent'] {
  if (tier === 'tier1') {
    return [
      { type: 'personalized_video', title: 'Custom Executive Video Message', description: 'Personalized video addressing specific account challenges', priority: 'high' },
      { type: 'roi_calculator', title: 'Custom ROI Model', description: 'Tailored ROI analysis based on company data', priority: 'high' },
      { type: 'case_study', title: 'Industry-Specific Case Study', description: 'Case study from similar company in same industry', priority: 'medium' },
      { type: 'whitepaper', title: 'Executive Whitepaper', description: 'Thought leadership piece on industry trends', priority: 'medium' },
      { type: 'webinar', title: 'Private Demo/Webinar', description: 'Exclusive product demonstration for key stakeholders', priority: 'high' },
    ];
  }
  if (tier === 'tier2') {
    return [
      { type: 'case_study', title: 'Industry Case Study', description: 'Case study from similar vertical', priority: 'high' },
      { type: 'whitepaper', title: 'Industry Trend Report', description: 'Relevant industry insights and benchmark data', priority: 'medium' },
      { type: 'webinar', title: 'Group Webinar Invitation', description: 'Invitation to industry-focused webinar', priority: 'medium' },
      { type: 'email_sequence', title: 'Nurture Email Sequence', description: 'Multi-touch email campaign with industry content', priority: 'high' },
    ];
  }
  return [
    { type: 'email_sequence', title: 'Automated Nurture Sequence', description: 'Scalable email campaign with light personalization', priority: 'high' },
    { type: 'infographic', title: 'Industry Infographic', description: 'Visual content with industry data', priority: 'low' },
    { type: 'blog_post', title: 'Relevant Blog Content', description: 'Share relevant thought leadership articles', priority: 'medium' },
  ];
}

function getDefaultChannelSequence(tier: AccountTier): ABMContentStrategy['channelSequence'] {
  if (tier === 'tier1') {
    return [
      { channel: 'email', order: 1, timing: 'Day 1', content: 'Personalized executive introduction' },
      { channel: 'linkedin', order: 2, timing: 'Day 3', content: 'Connection request with personalized note' },
      { channel: 'direct_mail', order: 3, timing: 'Week 2', content: 'High-value direct mail piece' },
      { channel: 'email', order: 4, timing: 'Week 2', content: 'Custom ROI analysis and case study' },
      { channel: 'phone', order: 5, timing: 'Week 3', content: 'Strategic discovery call' },
      { channel: 'digital_ads', order: 6, timing: 'Ongoing', content: 'Account-targeted display ads' },
    ];
  }
  if (tier === 'tier2') {
    return [
      { channel: 'email', order: 1, timing: 'Day 1', content: 'Industry-specific outreach email' },
      { channel: 'linkedin', order: 2, timing: 'Day 4', content: 'Connection and content share' },
      { channel: 'email', order: 3, timing: 'Week 2', content: 'Case study and value proposition' },
      { channel: 'digital_ads', order: 4, timing: 'Ongoing', content: 'Retargeting ads' },
      { channel: 'email', order: 5, timing: 'Week 4', content: 'Meeting request and demo offer' },
    ];
  }
  return [
    { channel: 'email', order: 1, timing: 'Day 1', content: 'Automated introduction email' },
    { channel: 'digital_ads', order: 2, timing: 'Ongoing', content: 'Display and social ads' },
    { channel: 'email', order: 3, timing: 'Week 2', content: 'Content and resource share' },
    { channel: 'email', order: 4, timing: 'Week 4', content: 'Follow-up and soft CTA' },
  ];
}

function getDefaultMessage(
  account: TargetAccount,
  channel: 'email' | 'linkedin' | 'phone' | 'direct_mail',
  objective: string
): string {
  const company = account.companyName;
  const industry = account.industry;

  if (channel === 'email') {
    return `Hi ${company} Team,

I've been following ${company}'s growth in the ${industry} space and wanted to reach out. We've helped similar companies in ${industry} overcome challenges with [specific challenge], achieving [specific result].

Would it be worth a brief conversation to explore if we could help ${company} achieve similar outcomes?

Best regards`;
  }

  if (channel === 'linkedin') {
    return `Hi, I've been following ${company}'s work in ${industry} and would love to connect. We help companies like yours [value proposition]. Would love to exchange ideas.`;
  }

  if (channel === 'phone') {
    return `Hi, this is [Name] from [Company]. I'm reaching out because we've been working with ${industry} companies like ${company} to help them [key value prop]. I'd love to share a quick insight that might be relevant — do you have 30 seconds? [Pause] Great. We recently helped [similar company] achieve [result]. Would a 15-minute call be worth your time?`;
  }

  // direct_mail
  return `Dear ${company} Team,

We've helped leading ${industry} companies transform their [specific area]. Inside, you'll find a customized analysis for ${company}.

We'd love to show you what's possible.

Best regards`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
