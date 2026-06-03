/**
 * Lead Scorer — BANT + MEDDIC Scoring Engine
 *
 * Ported from ai-sales-team-claude/scripts/lead_scorer.py
 * Implements the weighted BANT (0-100) + MEDDIC completeness scoring algorithm
 * for lead qualification, with grade assignment and recommended actions.
 *
 * Used by:
 * - /api/leads/bulk-enrich (auto-scoring after enrichment)
 * - /api/sales-intelligence/score (on-demand scoring)
 * - Agent pipeline (automatic scoring during qualification)
 */

// ─────────────────────────────────────────────────────────────
// BANT Scoring (each dimension 0-25, total 0-100)
// ─────────────────────────────────────────────────────────────

interface BudgetSignals {
  fundingAmount?: number;
  employeeCount?: number;
  pricingVisible?: boolean;
  techSpendIndicators?: string[];
}

interface AuthoritySignals {
  decisionMakersFound?: number;
  cSuiteIdentified?: boolean;
  orgChartMapped?: boolean;
}

interface NeedSignals {
  painPointsDetected?: number;
  jobPostsRelevant?: boolean;
  reviewsMentionPain?: boolean;
  competitorComplaints?: number;
}

interface TimelineSignals {
  hiringForRole?: boolean;
  recentFunding?: boolean;
  contractRenewal?: boolean;
  urgencyMentions?: number;
}

export interface ScoringInput {
  company: string;
  budgetSignals?: BudgetSignals;
  authoritySignals?: AuthoritySignals;
  needSignals?: NeedSignals;
  timelineSignals?: TimelineSignals;
}

export interface BANTBreakdown {
  budget: { score: number; max: number };
  authority: { score: number; max: number };
  need: { score: number; max: number };
  timeline: { score: number; max: number };
}

export interface MEDDICCompleteness {
  metrics: number;
  economicBuyer: number;
  decisionCriteria: number;
  decisionProcess: number;
  identifyPain: number;
  champion: number;
  overall: number;
}

export interface ScoringResult {
  company: string;
  bantScore: number;
  bantBreakdown: BANTBreakdown;
  meddicCompleteness: MEDDICCompleteness;
  leadGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  confidenceLevel: 'high' | 'medium' | 'low';
  recommendedAction: string;
  prospectScore: number; // Weighted composite (0-100)
}

function scoreBudget(signals: BudgetSignals): number {
  let score = 0;
  const funding = signals.fundingAmount || 0;
  if (funding >= 50_000_000) score += 10;
  else if (funding >= 10_000_000) score += 8;
  else if (funding >= 5_000_000) score += 6;
  else if (funding >= 1_000_000) score += 4;
  else if (funding > 0) score += 2;

  const empCount = signals.employeeCount || 0;
  if (empCount >= 500) score += 5;
  else if (empCount >= 100) score += 4;
  else if (empCount >= 50) score += 3;
  else if (empCount >= 10) score += 2;
  else if (empCount > 0) score += 1;

  if (signals.pricingVisible) score += 3;
  score += Math.min((signals.techSpendIndicators?.length || 0) * 2, 7);

  return Math.min(score, 25);
}

function scoreAuthority(signals: AuthoritySignals): number {
  let score = 0;
  const dmCount = signals.decisionMakersFound || 0;
  if (dmCount >= 5) score += 10;
  else if (dmCount >= 3) score += 8;
  else if (dmCount >= 1) score += 5;

  if (signals.cSuiteIdentified) score += 8;

  if (signals.orgChartMapped) score += 7;
  else if (dmCount > 1) score += 3;

  return Math.min(score, 25);
}

function scoreNeed(signals: NeedSignals): number {
  let score = 0;
  const painPoints = signals.painPointsDetected || 0;
  if (painPoints >= 5) score += 8;
  else if (painPoints >= 3) score += 6;
  else if (painPoints >= 1) score += 3;

  if (signals.jobPostsRelevant) score += 6;
  if (signals.reviewsMentionPain) score += 5;

  const complaints = signals.competitorComplaints || 0;
  if (complaints >= 3) score += 6;
  else if (complaints >= 1) score += 4;

  return Math.min(score, 25);
}

function scoreTimeline(signals: TimelineSignals): number {
  let score = 0;
  if (signals.hiringForRole) score += 7;
  if (signals.recentFunding) score += 7;
  if (signals.contractRenewal) score += 6;

  const urgency = signals.urgencyMentions || 0;
  if (urgency >= 3) score += 5;
  else if (urgency >= 1) score += 3;

  return Math.min(score, 25);
}

// ─────────────────────────────────────────────────────────────
// MEDDIC Completeness Assessment
// ─────────────────────────────────────────────────────────────

function assessMeddic(data: ScoringInput): MEDDICCompleteness {
  const budget = data.budgetSignals || {};
  const authority = data.authoritySignals || {};
  const need = data.needSignals || {};
  const timeline = data.timelineSignals || {};

  const metricsSignals = [
    (budget.fundingAmount || 0) > 0,
    (budget.employeeCount || 0) > 0,
    (need.painPointsDetected || 0) > 0,
  ];
  const metrics = Math.round((metricsSignals.filter(Boolean).length / metricsSignals.length) * 100);

  const econBuyerSignals = [
    authority.cSuiteIdentified || false,
    (authority.decisionMakersFound || 0) >= 1,
  ];
  const economicBuyer = Math.round((econBuyerSignals.filter(Boolean).length / econBuyerSignals.length) * 100);

  const decisionCriteriaSignals = [
    budget.pricingVisible || false,
    (budget.techSpendIndicators?.length || 0) > 0,
    need.reviewsMentionPain || false,
  ];
  const decisionCriteria = Math.round((decisionCriteriaSignals.filter(Boolean).length / decisionCriteriaSignals.length) * 100);

  const decisionProcessSignals = [
    authority.orgChartMapped || false,
    (authority.decisionMakersFound || 0) >= 2,
    timeline.contractRenewal || false,
  ];
  const decisionProcess = Math.round((decisionProcessSignals.filter(Boolean).length / decisionProcessSignals.length) * 100);

  const painSignals = [
    (need.painPointsDetected || 0) >= 1,
    need.jobPostsRelevant || false,
    (need.competitorComplaints || 0) >= 1,
  ];
  const identifyPain = Math.round((painSignals.filter(Boolean).length / painSignals.length) * 100);

  const championSignals = [
    (authority.decisionMakersFound || 0) >= 1,
    need.reviewsMentionPain || false,
    timeline.hiringForRole || false,
  ];
  const champion = Math.round((championSignals.filter(Boolean).length / championSignals.length) * 100);

  const overall = Math.round((metrics + economicBuyer + decisionCriteria + decisionProcess + identifyPain + champion) / 6);

  return { metrics, economicBuyer, decisionCriteria, decisionProcess, identifyPain, champion, overall };
}

// ─────────────────────────────────────────────────────────────
// Grading + Recommendations
// ─────────────────────────────────────────────────────────────

function computeGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 50) return 'B';
  if (score >= 25) return 'C';
  return 'D';
}

function computeConfidence(data: ScoringInput): 'high' | 'medium' | 'low' {
  let totalFields = 0;
  let filledFields = 0;

  for (const section of [data.budgetSignals, data.authoritySignals, data.needSignals, data.timelineSignals]) {
    if (!section) continue;
    for (const [, val] of Object.entries(section)) {
      totalFields++;
      if (typeof val === 'boolean' && val) filledFields++;
      else if (typeof val === 'number' && val > 0) filledFields++;
      else if (Array.isArray(val) && val.length > 0) filledFields++;
      else if (typeof val === 'string' && val) filledFields++;
    }
  }

  if (totalFields === 0) return 'low';
  const ratio = filledFields / totalFields;
  if (ratio >= 0.7) return 'high';
  if (ratio >= 0.4) return 'medium';
  return 'low';
}

function recommendAction(grade: string, meddic: MEDDICCompleteness): string {
  if (grade === 'A+' || grade === 'A') {
    return 'Schedule discovery call — high-priority prospect. Focus on confirming budget and timeline.';
  }
  if (grade === 'B') {
    const entries = Object.entries(meddic).filter(([k]) => k !== 'overall') as [string, number][];
    const weakest = entries.reduce((min, [k, v]) => v < min[1] ? [k, v] as [string, number] : min, entries[0]);
    return `Nurture with targeted content — strengthen ${weakest[0].replace(/_/g, ' ')} (${weakest[1]}% complete). Build champion relationship.`;
  }
  if (grade === 'C') {
    const gaps = Object.entries(meddic)
      .filter(([k, v]) => v < 50 && k !== 'overall')
      .map(([k]) => k.replace(/_/g, ' '))
      .slice(0, 3);
    return `Research needed — fill gaps in: ${gaps.join(', ')}. Consider multi-threaded outreach.`;
  }
  return 'Low priority — add to long-term nurture sequence. Revisit in 90 days.';
}

// ─────────────────────────────────────────────────────────────
// Weighted Composite Prospect Score (0-100)
// Based on the ai-sales-team-claude scoring methodology:
//   Company Fit (25%) + Contact Access (20%) +
//   Opportunity Quality (20%) + Competitive Position (15%) +
//   Outreach Readiness (20%)
// ─────────────────────────────────────────────────────────────

function computeProspectScore(bantScore: number, meddic: MEDDICCompleteness, data: ScoringInput): number {
  // Company Fit: derived from budget score + industry signals
  const companyFit = Math.min(100, (bantScore / 100) * 70 + (meddic.metrics / 100) * 30);

  // Contact Access: from authority signals
  const contactAccess = meddic.economicBuyer * 0.5 + meddic.champion * 0.3 +
    ((data.authoritySignals?.decisionMakersFound || 0) >= 2 ? 20 : 0);

  // Opportunity Quality: from need + timeline
  const opportunityQuality = meddic.identifyPain * 0.4 + meddic.decisionCriteria * 0.3 +
    (data.needSignals?.jobPostsRelevant ? 15 : 0) + (data.timelineSignals?.recentFunding ? 15 : 0);

  // Competitive Position: estimated from available signals
  const competitivePosition = meddic.decisionProcess * 0.4 +
    (data.authoritySignals?.orgChartMapped ? 30 : 0) +
    ((data.needSignals?.competitorComplaints || 0) > 0 ? 30 : 0);

  // Outreach Readiness: from personalization and channel readiness
  const outreachReadiness = meddic.overall * 0.3 +
    ((data.authoritySignals?.cSuiteIdentified ? 20 : 0)) +
    ((data.needSignals?.painPointsDetected || 0) > 0 ? 25 : 0) +
    (data.budgetSignals?.pricingVisible ? 25 : 0);

  return Math.round(
    companyFit * 0.25 +
    contactAccess * 0.20 +
    opportunityQuality * 0.20 +
    competitivePosition * 0.15 +
    outreachReadiness * 0.20
  );
}

// ─────────────────────────────────────────────────────────────
// Main Scoring Pipeline
// ─────────────────────────────────────────────────────────────

export function scoreLead(data: ScoringInput): ScoringResult {
  const bScore = scoreBudget(data.budgetSignals || {});
  const aScore = scoreAuthority(data.authoritySignals || {});
  const nScore = scoreNeed(data.needSignals || {});
  const tScore = scoreTimeline(data.timelineSignals || {});
  const total = bScore + aScore + nScore + tScore;

  const meddic = assessMeddic(data);
  const grade = computeGrade(total);
  const confidence = computeConfidence(data);
  const action = recommendAction(grade, meddic);
  const prospectScore = computeProspectScore(total, meddic, data);

  return {
    company: data.company,
    bantScore: total,
    bantBreakdown: {
      budget: { score: bScore, max: 25 },
      authority: { score: aScore, max: 25 },
      need: { score: nScore, max: 25 },
      timeline: { score: tScore, max: 25 },
    },
    meddicCompleteness: meddic,
    leadGrade: grade,
    confidenceLevel: confidence,
    recommendedAction: action,
    prospectScore,
  };
}

/**
 * Convert a Lead database record into ScoringInput by inferring
 * BANT/MEDDIC signals from the lead's enriched fields.
 */
export function leadToScoringInput(lead: Record<string, any>): ScoringInput {
  const empCount = parseInt(String(lead.employeeCount || '0'), 10) || 0;
  const revenueStr = String(lead.revenueEstimate || '');
  const revenueNum = parseFloat(revenueStr.replace(/[^0-9.]/g, '')) || 0;
  const revenueMultiplier = revenueStr.includes('M') ? 1_000_000 :
    revenueStr.includes('B') ? 1_000_000_000 : 1;

  return {
    company: lead.companyName || 'Unknown',
    budgetSignals: {
      fundingAmount: revenueNum * revenueMultiplier,
      employeeCount: empCount,
      pricingVisible: !!(lead.description && /pricing|plan|subscription/i.test(lead.description)),
      techSpendIndicators: lead.techStack ? JSON.parse(typeof lead.techStack === 'string' && lead.techStack.startsWith('[') ? lead.techStack : '[]') : [],
    },
    authoritySignals: {
      decisionMakersFound: [lead.ceoName, lead.keyContactName].filter(Boolean).length,
      cSuiteIdentified: !!lead.ceoName,
      orgChartMapped: !!(lead.ceoName && lead.keyContactName),
    },
    needSignals: {
      painPointsDetected: lead.intentKeywords ? JSON.parse(typeof lead.intentKeywords === 'string' && lead.intentKeywords.startsWith('[') ? lead.intentKeywords : '[]').length : 0,
      jobPostsRelevant: !!(lead.description && /hiring|career|job opening|we're looking/i.test(lead.description)),
      reviewsMentionPain: (lead.newsMentions || 0) > 2,
      competitorComplaints: 0,
    },
    timelineSignals: {
      hiringForRole: !!(lead.description && /hiring|career|job opening/i.test(lead.description)),
      recentFunding: !!(lead.description && /funding|raised|series|investment/i.test(lead.description)),
      contractRenewal: false,
      urgencyMentions: (lead.newsMentions || 0) > 5 ? 3 : (lead.newsMentions || 0),
    },
  };
}
