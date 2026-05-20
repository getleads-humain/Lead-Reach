/**
 * ICP Builder (Ideal Customer Profile)
 * 
 * Build and score against Ideal Customer Profiles across
 * 6 dimensions: Firmographic, Technographic, Psychographic,
 * Behavioral, Situational, and Economic.
 */

// ============================================================
// Types
// ============================================================

export interface ICPDimensionScore {
  score: number;      // 0-100
  weight: number;     // 0-1
  weighted: number;   // score * weight
  details: string;
}

export interface ICP {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  firmographic: {
    industries: string[];
    companySizes: string[];
    locations: string[];
    revenueRange?: { min?: string; max?: string };
    ownershipTypes?: string[];
  };
  technographic: {
    requiredTech: string[];
    excludedTech: string[];
    techSophisticationLevel: 'low' | 'medium' | 'high';
    digitalMaturityScore?: number;
  };
  psychographic: {
    values: string[];
    challenges: string[];
    goals: string[];
    cultureTypes: string[];
  };
  behavioral: {
    buyingSignals: string[];
    contentEngagement: string[];
    eventAttendance: string[];
    socialActivity: string[];
  };
  situational: {
    triggerEvents: string[];
    contractEndDates?: string;
    leadershipChanges?: boolean;
    expansionSignals: string[];
    complianceNeeds: string[];
  };
  economic: {
    budgetRange?: { min?: number; max?: number };
    purchasingCycle: string;
    decisionSpeed: 'slow' | 'moderate' | 'fast';
    lifetimeValuePotential: 'low' | 'medium' | 'high';
    priceSensitivity: 'low' | 'medium' | 'high';
  };
}

export interface ICPScoreResult {
  icpId: string;
  leadId?: string;
  leadName?: string;
  companyName?: string;
  overallFit: number; // 0-100
  tier: 'ideal' | 'strong' | 'moderate' | 'weak' | 'poor';
  dimensions: {
    firmographic: ICPDimensionScore;
    technographic: ICPDimensionScore;
    psychographic: ICPDimensionScore;
    behavioral: ICPDimensionScore;
    situational: ICPDimensionScore;
    economic: ICPDimensionScore;
  };
  recommendations: string[];
}

export interface ICPCriteria {
  name: string;
  description?: string;
  firmographic?: Partial<ICP['firmographic']>;
  technographic?: Partial<ICP['technographic']>;
  psychographic?: Partial<ICP['psychographic']>;
  behavioral?: Partial<ICP['behavioral']>;
  situational?: Partial<ICP['situational']>;
  economic?: Partial<ICP['economic']>;
}

// ============================================================
// Dimension Weights
// ============================================================

const DIMENSION_WEIGHTS = {
  firmographic: 0.25,
  technographic: 0.15,
  psychographic: 0.15,
  behavioral: 0.15,
  situational: 0.15,
  economic: 0.15,
};

// ============================================================
// Build ICP
// ============================================================

/**
 * Build an Ideal Customer Profile from campaign criteria
 */
export function buildICP(criteria: ICPCriteria): ICP {
  return {
    id: `icp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name: criteria.name,
    description: criteria.description || `ICP for ${criteria.name}`,
    createdAt: new Date().toISOString(),
    firmographic: {
      industries: criteria.firmographic?.industries || [],
      companySizes: criteria.firmographic?.companySizes || [],
      locations: criteria.firmographic?.locations || [],
      revenueRange: criteria.firmographic?.revenueRange,
      ownershipTypes: criteria.firmographic?.ownershipTypes || [],
    },
    technographic: {
      requiredTech: criteria.technographic?.requiredTech || [],
      excludedTech: criteria.technographic?.excludedTech || [],
      techSophisticationLevel: criteria.technographic?.techSophisticationLevel || 'medium',
      digitalMaturityScore: criteria.technographic?.digitalMaturityScore,
    },
    psychographic: {
      values: criteria.psychographic?.values || [],
      challenges: criteria.psychographic?.challenges || [],
      goals: criteria.psychographic?.goals || [],
      cultureTypes: criteria.psychographic?.cultureTypes || [],
    },
    behavioral: {
      buyingSignals: criteria.behavioral?.buyingSignals || [],
      contentEngagement: criteria.behavioral?.contentEngagement || [],
      eventAttendance: criteria.behavioral?.eventAttendance || [],
      socialActivity: criteria.behavioral?.socialActivity || [],
    },
    situational: {
      triggerEvents: criteria.situational?.triggerEvents || [],
      contractEndDates: criteria.situational?.contractEndDates,
      leadershipChanges: criteria.situational?.leadershipChanges,
      expansionSignals: criteria.situational?.expansionSignals || [],
      complianceNeeds: criteria.situational?.complianceNeeds || [],
    },
    economic: {
      budgetRange: criteria.economic?.budgetRange,
      purchasingCycle: criteria.economic?.purchasingCycle || 'quarterly',
      decisionSpeed: criteria.economic?.decisionSpeed || 'moderate',
      lifetimeValuePotential: criteria.economic?.lifetimeValuePotential || 'medium',
      priceSensitivity: criteria.economic?.priceSensitivity || 'medium',
    },
  };
}

// ============================================================
// Score Lead Against ICP
// ============================================================

interface LeadData {
  industry?: string;
  employeeCount?: string;
  city?: string;
  country?: string;
  revenueEstimate?: string;
  ownershipType?: string;
  techStack?: string;
  leadScore?: number;
  stage?: string;
  leadTier?: string;
  companyName?: string;
  keyContactName?: string;
  notes?: string;
  [key: string]: unknown;
}

/**
 * Score a lead against an ICP
 */
export function scoreLeadAgainstICP(lead: LeadData, icp: ICP): ICPScoreResult {
  const firmographicScore = scoreFirmographic(lead, icp);
  const technographicScore = scoreTechnographic(lead, icp);
  const psychographicScore = scorePsychographic(lead, icp);
  const behavioralScore = scoreBehavioral(lead, icp);
  const situationalScore = scoreSituational(lead, icp);
  const economicScore = scoreEconomic(lead, icp);

  const dimensions = {
    firmographic: { ...firmographicScore, weight: DIMENSION_WEIGHTS.firmographic, weighted: firmographicScore.score * DIMENSION_WEIGHTS.firmographic },
    technographic: { ...technographicScore, weight: DIMENSION_WEIGHTS.technographic, weighted: technographicScore.score * DIMENSION_WEIGHTS.technographic },
    psychographic: { ...psychographicScore, weight: DIMENSION_WEIGHTS.psychographic, weighted: psychographicScore.score * DIMENSION_WEIGHTS.psychographic },
    behavioral: { ...behavioralScore, weight: DIMENSION_WEIGHTS.behavioral, weighted: behavioralScore.score * DIMENSION_WEIGHTS.behavioral },
    situational: { ...situationalScore, weight: DIMENSION_WEIGHTS.situational, weighted: situationalScore.score * DIMENSION_WEIGHTS.situational },
    economic: { ...economicScore, weight: DIMENSION_WEIGHTS.economic, weighted: economicScore.score * DIMENSION_WEIGHTS.economic },
  };

  const overallFit = Math.round(
    Object.values(dimensions).reduce((sum, d) => sum + d.weighted, 0)
  );

  const tier = overallFit >= 80 ? 'ideal' : overallFit >= 65 ? 'strong' : overallFit >= 45 ? 'moderate' : overallFit >= 25 ? 'weak' : 'poor';

  const recommendations = generateRecommendations(dimensions, tier);

  return {
    icpId: icp.id,
    leadName: lead.keyContactName || undefined,
    companyName: lead.companyName || undefined,
    overallFit,
    tier,
    dimensions,
    recommendations,
  };
}

// ============================================================
// Dimension Scoring
// ============================================================

function scoreFirmographic(lead: LeadData, icp: ICP): { score: number; details: string } {
  let score = 50; // Base score
  const matches: string[] = [];
  const gaps: string[] = [];

  // Industry match
  if (icp.firmographic.industries.length > 0) {
    if (lead.industry && icp.firmographic.industries.some(i => lead.industry?.toLowerCase().includes(i.toLowerCase()))) {
      score += 20;
      matches.push('industry');
    } else {
      score -= 15;
      gaps.push('industry');
    }
  }

  // Company size match
  if (icp.firmographic.companySizes.length > 0 && lead.employeeCount) {
    if (icp.firmographic.companySizes.includes(lead.employeeCount)) {
      score += 15;
      matches.push('company size');
    } else {
      score -= 10;
      gaps.push('company size');
    }
  }

  // Location match
  if (icp.firmographic.locations.length > 0) {
    const leadLocation = [lead.city, lead.country].filter(Boolean).join(', ');
    if (leadLocation && icp.firmographic.locations.some(l => leadLocation.toLowerCase().includes(l.toLowerCase()))) {
      score += 10;
      matches.push('location');
    } else {
      gaps.push('location');
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    details: matches.length > 0 ? `Matches: ${matches.join(', ')}` : gaps.length > 0 ? `Gaps: ${gaps.join(', ')}` : 'No firmographic criteria specified',
  };
}

function scoreTechnographic(lead: LeadData, icp: ICP): { score: number; details: string } {
  let score = 50;
  const matches: string[] = [];

  if (icp.technographic.requiredTech.length > 0 && lead.techStack) {
    try {
      const techs: string[] = JSON.parse(lead.techStack);
      for (const req of icp.technographic.requiredTech) {
        if (techs.some(t => t.toLowerCase().includes(req.toLowerCase()))) {
          score += 15;
          matches.push(req);
        }
      }
      if (matches.length === 0) score -= 10;
    } catch {
      // techStack not valid JSON
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    details: matches.length > 0 ? `Tech matches: ${matches.join(', ')}` : 'No technographic data available',
  };
}

function scorePsychographic(_lead: LeadData, icp: ICP): { score: number; details: string } {
  // Psychographic is harder to score from structured data
  // Base on available signals
  let score = 50;

  if (icp.psychographic.challenges.length > 0) score += 10;
  if (icp.psychographic.goals.length > 0) score += 10;

  return {
    score: Math.min(100, Math.max(0, score)),
    details: 'Psychographic fit estimated from campaign criteria',
  };
}

function scoreBehavioral(lead: LeadData, icp: ICP): { score: number; details: string } {
  let score = 40;

  // Use lead score and stage as behavioral proxies
  if (lead.leadScore && lead.leadScore > 50) score += 20;
  if (lead.stage === 'engaged' || lead.stage === 'negotiating') score += 20;
  if (lead.leadTier === 'hot') score += 15;
  if (lead.leadTier === 'warm') score += 10;

  if (icp.behavioral.buyingSignals.length > 0) score += 5;

  return {
    score: Math.min(100, Math.max(0, score)),
    details: `Behavioral signals from lead score (${lead.leadScore || 0}) and stage (${lead.stage || 'new'})`,
  };
}

function scoreSituational(lead: LeadData, icp: ICP): { score: number; details: string } {
  let score = 40;

  if (icp.situational.triggerEvents.length > 0) score += 10;
  if (icp.situational.leadershipChanges) score += 5;
  if (lead.notes) {
    const notesLower = lead.notes.toLowerCase();
    if (notesLower.includes('expanding') || notesLower.includes('growing') || notesLower.includes('hiring')) {
      score += 20;
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    details: lead.notes ? 'Situational signals from lead notes' : 'Limited situational data',
  };
}

function scoreEconomic(lead: LeadData, icp: ICP): { score: number; details: string } {
  let score = 50;

  if (lead.revenueEstimate) {
    if (icp.economic.budgetRange) {
      score += 15;
    }
    score += 10;
  }

  if (icp.economic.lifetimeValuePotential === 'high') score += 10;
  if (icp.economic.priceSensitivity === 'low') score += 10;

  return {
    score: Math.min(100, Math.max(0, score)),
    details: lead.revenueEstimate ? `Revenue estimate available: ${lead.revenueEstimate}` : 'Limited economic data',
  };
}

// ============================================================
// Recommendations
// ============================================================

function generateRecommendations(dimensions: Record<string, ICPDimensionScore>, tier: string): string[] {
  const recs: string[] = [];

  // Find weakest dimensions
  const sorted = Object.entries(dimensions).sort((a, b) => a[1].score - b[1].score);
  const weakest = sorted.slice(0, 2);

  for (const [name, dim] of weakest) {
    if (dim.score < 40) {
      recs.push(`Low ${name} fit — consider enriching ${name} data before outreach`);
    }
  }

  if (tier === 'ideal') {
    recs.push('Ideal fit — prioritize for immediate personalized outreach');
  } else if (tier === 'strong') {
    recs.push('Strong fit — pursue with targeted messaging');
  } else if (tier === 'moderate') {
    recs.push('Moderate fit — nurture and gather more data before direct outreach');
  } else {
    recs.push('Weak fit — add to long-term nurture pipeline');
  }

  return recs;
}
