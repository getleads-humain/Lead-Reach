/**
 * Lead Scoring Module
 * 
 * BANT, MEDDIC, and Prospect scoring frameworks for lead qualification.
 */

// ============================================================
// BANT Scoring
// ============================================================

export interface BANTInput {
  budget: number;       // 0-25
  authority: number;    // 0-25
  need: number;         // 0-25
  timeline: number;     // 0-25
  notes?: string;
}

export interface BANTScore {
  budget: number;
  authority: number;
  need: number;
  timeline: number;
  total: number;        // 0-100
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    budget: { score: number; label: string; description: string };
    authority: { score: number; label: string; description: string };
    need: { score: number; label: string; description: string };
    timeline: { score: number; label: string; description: string };
  };
}

function getBANTBreakdown(key: string, score: number): { label: string; description: string } {
  const ranges: Record<string, Record<string, { label: string; description: string }>> = {
    budget: {
      high: { label: 'Strong Budget', description: 'Confirmed budget allocation for this solution' },
      medium: { label: 'Likely Budget', description: 'Budget likely available but not yet confirmed' },
      low: { label: 'Uncertain Budget', description: 'Budget status unknown or being discussed' },
      none: { label: 'No Budget', description: 'No budget available or allocated' },
    },
    authority: {
      high: { label: 'Decision Maker', description: 'Direct authority to make purchasing decisions' },
      medium: { label: 'Influencer', description: 'Strong influence on the decision process' },
      low: { label: 'Champion', description: 'Internal advocate but not a decision maker' },
      none: { label: 'No Authority', description: 'No influence on purchasing decisions' },
    },
    need: {
      high: { label: 'Critical Need', description: 'Urgent business problem requiring immediate solution' },
      medium: { label: 'Strong Need', description: 'Recognized problem actively seeking solutions' },
      low: { label: 'Mild Need', description: 'Aware of problem but not actively solving' },
      none: { label: 'No Need', description: 'No identified need for this solution' },
    },
    timeline: {
      high: { label: 'Immediate', description: 'Looking to implement within 30 days' },
      medium: { label: 'Near-term', description: 'Planning to implement within 1-3 months' },
      low: { label: 'Future', description: 'Considering implementation in 3-6+ months' },
      none: { label: 'No Timeline', description: 'No timeline or interest in implementing' },
    },
  };

  const level = score >= 20 ? 'high' : score >= 13 ? 'medium' : score >= 6 ? 'low' : 'none';
  return ranges[key]?.[level] ?? { label: 'Unknown', description: 'Insufficient data' };
}

function getGrade(total: number): 'A' | 'B' | 'C' | 'D' {
  if (total >= 75) return 'A';
  if (total >= 50) return 'B';
  if (total >= 25) return 'C';
  return 'D';
}

/**
 * Score a lead using BANT framework
 */
export function scoreBANT(input: BANTInput): BANTScore {
  const budget = Math.min(25, Math.max(0, input.budget));
  const authority = Math.min(25, Math.max(0, input.authority));
  const need = Math.min(25, Math.max(0, input.need));
  const timeline = Math.min(25, Math.max(0, input.timeline));
  const total = budget + authority + need + timeline;

  return {
    budget,
    authority,
    need,
    timeline,
    total,
    grade: getGrade(total),
    breakdown: {
      budget: { score: budget, ...getBANTBreakdown('budget', budget) },
      authority: { score: authority, ...getBANTBreakdown('authority', authority) },
      need: { score: need, ...getBANTBreakdown('need', need) },
      timeline: { score: timeline, ...getBANTBreakdown('timeline', timeline) },
    },
  };
}

// ============================================================
// MEDDIC Scoring
// ============================================================

export interface MEDDICInput {
  metrics: number;           // 0-100: Measurable business impact
  economicBuyer: number;     // 0-100: Access to economic buyer
  decisionCriteria: number;  // 0-100: Understanding of decision criteria
  decisionProcess: number;   // 0-100: Understanding of decision process
  identifyPain: number;      // 0-100: Identified pain points
  champion: number;          // 0-100: Internal champion identified
}

export interface MEDDICScore {
  metrics: number;
  economicBuyer: number;
  decisionCriteria: number;
  decisionProcess: number;
  identifyPain: number;
  champion: number;
  totalPercentage: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    metrics: { score: number; percentage: number; label: string };
    economicBuyer: { score: number; percentage: number; label: string };
    decisionCriteria: { score: number; percentage: number; label: string };
    decisionProcess: { score: number; percentage: number; label: string };
    identifyPain: { score: number; percentage: number; label: string };
    champion: { score: number; percentage: number; label: string };
  };
}

function getMEDDICLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Moderate';
  if (score >= 30) return 'Weak';
  return 'Missing';
}

/**
 * Score a lead using MEDDIC framework
 */
export function scoreMEDDIC(input: MEDDICInput): MEDDICScore {
  const metrics = Math.min(100, Math.max(0, input.metrics));
  const economicBuyer = Math.min(100, Math.max(0, input.economicBuyer));
  const decisionCriteria = Math.min(100, Math.max(0, input.decisionCriteria));
  const decisionProcess = Math.min(100, Math.max(0, input.decisionProcess));
  const identifyPain = Math.min(100, Math.max(0, input.identifyPain));
  const champion = Math.min(100, Math.max(0, input.champion));

  const totalPercentage = Math.round(
    (metrics + economicBuyer + decisionCriteria + decisionProcess + identifyPain + champion) / 6
  );

  return {
    metrics,
    economicBuyer,
    decisionCriteria,
    decisionProcess,
    identifyPain,
    champion,
    totalPercentage,
    grade: totalPercentage >= 75 ? 'A' : totalPercentage >= 50 ? 'B' : totalPercentage >= 25 ? 'C' : 'D',
    breakdown: {
      metrics: { score: metrics, percentage: metrics, label: getMEDDICLabel(metrics) },
      economicBuyer: { score: economicBuyer, percentage: economicBuyer, label: getMEDDICLabel(economicBuyer) },
      decisionCriteria: { score: decisionCriteria, percentage: decisionCriteria, label: getMEDDICLabel(decisionCriteria) },
      decisionProcess: { score: decisionProcess, percentage: decisionProcess, label: getMEDDICLabel(decisionProcess) },
      identifyPain: { score: identifyPain, percentage: identifyPain, label: getMEDDICLabel(identifyPain) },
      champion: { score: champion, percentage: champion, label: getMEDDICLabel(champion) },
    },
  };
}

// ============================================================
// Prospect Scoring (5-Dimension Weighted Composite)
// ============================================================

export interface ProspectScoreInput {
  sizeFit: number;           // 0-100: Company size alignment with ICP
  industryFit: number;       // 0-100: Industry alignment
  growth: number;            // 0-100: Company growth signals
  techSophistication: number; // 0-100: Technology stack sophistication
  budgetSignals: number;     // 0-100: Signals of budget availability
  decisionMakers: number;    // 0-100: Access to decision makers
  contactQuality: number;    // 0-100: Quality of contact information
  personalization: number;   // 0-100: Ability to personalize outreach
  warmPaths: number;         // 0-100: Existing warm connections
  timing: number;            // 0-100: Timing alignment / trigger events
}

export interface ProspectScore {
  dimensions: {
    sizeFit: { score: number; weight: number; weighted: number };
    industryFit: { score: number; weight: number; weighted: number };
    growth: { score: number; weight: number; weighted: number };
    techSophistication: { score: number; weight: number; weighted: number };
    budgetSignals: { score: number; weight: number; weighted: number };
    decisionMakers: { score: number; weight: number; weighted: number };
    contactQuality: { score: number; weight: number; weighted: number };
    personalization: { score: number; weight: number; weighted: number };
    warmPaths: { score: number; weight: number; weighted: number };
    timing: { score: number; weight: number; weighted: number };
  };
  totalScore: number; // 0-100
  tier: 'hot' | 'warm' | 'cold' | 'unqualified';
  recommendation: string;
}

const PROSPECT_WEIGHTS = {
  sizeFit: 0.15,
  industryFit: 0.10,
  growth: 0.15,
  techSophistication: 0.10,
  budgetSignals: 0.15,
  decisionMakers: 0.10,
  contactQuality: 0.10,
  personalization: 0.05,
  warmPaths: 0.05,
  timing: 0.05,
};

function getProspectTier(totalScore: number): 'hot' | 'warm' | 'cold' | 'unqualified' {
  if (totalScore >= 70) return 'hot';
  if (totalScore >= 45) return 'warm';
  if (totalScore >= 25) return 'cold';
  return 'unqualified';
}

function getProspectRecommendation(totalScore: number, dimensions: ProspectScore['dimensions']): string {
  const weakest: string[] = [];
  const strongest: string[] = [];

  const entries = Object.entries(dimensions) as [string, { score: number }][];
  for (const [key, val] of entries) {
    if (val.score < 30) weakest.push(key);
    if (val.score >= 70) strongest.push(key);
  }

  if (totalScore >= 70) {
    return `High-priority lead. Strong in: ${strongest.join(', ')}. Pursue immediately with personalized outreach.`;
  }
  if (totalScore >= 45) {
    return `Good potential. Needs nurturing. Weak in: ${weakest.join(', ')}. Consider enrichment before outreach.`;
  }
  if (totalScore >= 25) {
    return `Low priority. Significant gaps in: ${weakest.join(', ')}. Add to nurture pipeline.`;
  }
  return `Not a fit at this time. Major gaps across: ${weakest.join(', ')}. Consider disqualifying.`;
}

/**
 * Score a prospect using the 10-dimension weighted composite
 */
export function scoreProspect(input: ProspectScoreInput): ProspectScore {
  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const dimensions = {
    sizeFit: { score: clamp(input.sizeFit), weight: PROSPECT_WEIGHTS.sizeFit, weighted: clamp(input.sizeFit) * PROSPECT_WEIGHTS.sizeFit },
    industryFit: { score: clamp(input.industryFit), weight: PROSPECT_WEIGHTS.industryFit, weighted: clamp(input.industryFit) * PROSPECT_WEIGHTS.industryFit },
    growth: { score: clamp(input.growth), weight: PROSPECT_WEIGHTS.growth, weighted: clamp(input.growth) * PROSPECT_WEIGHTS.growth },
    techSophistication: { score: clamp(input.techSophistication), weight: PROSPECT_WEIGHTS.techSophistication, weighted: clamp(input.techSophistication) * PROSPECT_WEIGHTS.techSophistication },
    budgetSignals: { score: clamp(input.budgetSignals), weight: PROSPECT_WEIGHTS.budgetSignals, weighted: clamp(input.budgetSignals) * PROSPECT_WEIGHTS.budgetSignals },
    decisionMakers: { score: clamp(input.decisionMakers), weight: PROSPECT_WEIGHTS.decisionMakers, weighted: clamp(input.decisionMakers) * PROSPECT_WEIGHTS.decisionMakers },
    contactQuality: { score: clamp(input.contactQuality), weight: PROSPECT_WEIGHTS.contactQuality, weighted: clamp(input.contactQuality) * PROSPECT_WEIGHTS.contactQuality },
    personalization: { score: clamp(input.personalization), weight: PROSPECT_WEIGHTS.personalization, weighted: clamp(input.personalization) * PROSPECT_WEIGHTS.personalization },
    warmPaths: { score: clamp(input.warmPaths), weight: PROSPECT_WEIGHTS.warmPaths, weighted: clamp(input.warmPaths) * PROSPECT_WEIGHTS.warmPaths },
    timing: { score: clamp(input.timing), weight: PROSPECT_WEIGHTS.timing, weighted: clamp(input.timing) * PROSPECT_WEIGHTS.timing },
  };

  const totalScore = Math.round(
    Object.values(dimensions).reduce((sum, d) => sum + d.weighted, 0)
  );

  return {
    dimensions,
    totalScore,
    tier: getProspectTier(totalScore),
    recommendation: getProspectRecommendation(totalScore, dimensions),
  };
}

// ============================================================
// Combined Opportunity Quality Score
// ============================================================

/**
 * Calculate combined opportunity quality score from BANT and MEDDIC
 */
export function calculateOpportunityQualityScore(
  bant: BANTScore,
  meddic: MEDDICScore
): number {
  // Normalize BANT to 0-100 scale (it's already 0-100)
  const bantNormalized = bant.total; // 0-100

  // MEDDIC is already 0-100 percentage
  const meddicNormalized = meddic.totalPercentage; // 0-100

  // Weight: BANT 40%, MEDDIC 60% (MEDDIC is more comprehensive)
  const combined = bantNormalized * 0.4 + meddicNormalized * 0.6;

  return Math.round(Math.min(100, Math.max(0, combined)));
}
