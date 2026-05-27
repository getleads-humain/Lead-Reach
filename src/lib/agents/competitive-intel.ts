/**
 * Competitive Intelligence Module
 * 
 * Analyzes competitive landscape and generates battle cards using LLM.
 * Uses centralized callLLMForJSON for rate limiting, retries, and model fallback.
 */

import { callLLMForJSON } from '@/lib/llm';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';

// ============================================================
// Types
// ============================================================

export interface CompetitiveLandscape {
  company: string;
  industry: string;
  marketPosition: {
    segment: string;
    rank: string;
    marketShare: string;
  };
  competitors: CompetitorInfo[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  marketTrends: string[];
  analyzedAt: string;
}

export interface CompetitorInfo {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  marketPosition: string;
  pricing: string;
  keyDifferentiator: string;
}

export interface BattleCard {
  yourCompany: string;
  competitor: string;
  date: string;
  overview: string;
  featureMatrix: {
    feature: string;
    you: string;
    competitor: string;
    advantage: 'you' | 'competitor' | 'neutral';
  }[];
  displacementStrategy: {
    approach: string;
    keyMessages: string[];
    caseStudyAngles: string[];
    riskMitigations: string[];
  };
  commonObjections: {
    objection: string;
    response: string;
  }[];
  winThemes: string[];
  pricingComparison: {
    yourPosition: string;
    competitorPosition: string;
    valueMessage: string;
  };
}

// ============================================================
// Competitive Landscape Analysis
// ============================================================

/**
 * Analyze the competitive landscape for a company/industry
 */
export async function analyzeCompetitiveLandscape(
  company: string,
  industry: string
): Promise<CompetitiveLandscape> {
  // First, gather web data
  let searchData = '';
  try {
    const searchResult = await exaSearch(`${company} ${industry} competitors alternatives`, 5);
    if (searchResult.success && searchResult.data.length > 0) {
      searchData = searchResult.data.map(r => `${r.title}: ${r.snippet}`).join('\n');
    }
  } catch {
    // Search failed, continue with LLM only
  }

  const systemPrompt = `You are an expert competitive intelligence analyst. Analyze the competitive landscape and return a comprehensive analysis as JSON. Return ONLY valid JSON.`;

  const userMessage = `COMPANY: ${company}
INDUSTRY: ${industry}

${searchData ? `WEB RESEARCH DATA:\n${searchData}\n\n` : ''}Generate a comprehensive competitive analysis as JSON:
{
  "marketPosition": {
    "segment": "Market segment description",
    "rank": "Leader/Challenger/Niche/Emerging",
    "marketShare": "Estimated share"
  },
  "competitors": [
    {
      "name": "Competitor name",
      "description": "Brief description",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "marketPosition": "Their position",
      "pricing": "Pricing model/tier",
      "keyDifferentiator": "Main differentiator"
    }
  ],
  "strengths": ["Company strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "threats": ["Threat 1", "Threat 2"],
  "marketTrends": ["Trend 1", "Trend 2"]
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      company,
      industry,
      marketPosition: (parsed?.marketPosition as CompetitiveLandscape['marketPosition']) || { segment: industry, rank: 'Emerging', marketShare: 'Unknown' },
      competitors: parsed && Array.isArray(parsed.competitors) ? parsed.competitors.map((c: Record<string, unknown>) => ({
        name: (c.name as string) || 'Unknown',
        description: (c.description as string) || '',
        strengths: Array.isArray(c.strengths) ? (c.strengths as string[]) : [],
        weaknesses: Array.isArray(c.weaknesses) ? (c.weaknesses as string[]) : [],
        marketPosition: (c.marketPosition as string) || 'Unknown',
        pricing: (c.pricing as string) || 'Unknown',
        keyDifferentiator: (c.keyDifferentiator as string) || 'Unknown',
      })) : [],
      strengths: parsed && Array.isArray(parsed.strengths) ? (parsed.strengths as string[]) : [],
      weaknesses: parsed && Array.isArray(parsed.weaknesses) ? (parsed.weaknesses as string[]) : [],
      opportunities: parsed && Array.isArray(parsed.opportunities) ? (parsed.opportunities as string[]) : [],
      threats: parsed && Array.isArray(parsed.threats) ? (parsed.threats as string[]) : [],
      marketTrends: parsed && Array.isArray(parsed.marketTrends) ? (parsed.marketTrends as string[]) : [],
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[CompetitiveIntel] LLM failed, using defaults:', error);
    return {
      company,
      industry,
      marketPosition: { segment: industry, rank: 'Unknown', marketShare: 'Unknown' },
      competitors: [],
      strengths: ['Competitive analysis pending'],
      weaknesses: ['Requires deeper analysis'],
      opportunities: ['Market research needed'],
      threats: ['Competitive intelligence gathering in progress'],
      marketTrends: ['Analysis incomplete — LLM unavailable'],
      analyzedAt: new Date().toISOString(),
    };
  }
}

// ============================================================
// Battle Card Generation
// ============================================================

/**
 * Generate a battle card comparing your company against a competitor
 */
export async function generateBattleCard(
  company: string,
  competitor: string
): Promise<BattleCard> {
  // Gather data about both companies
  let competitorData = '';
  try {
    const searchResult = await exaSearch(`${competitor} product features pricing reviews`, 5);
    if (searchResult.success && searchResult.data.length > 0) {
      competitorData = searchResult.data.map(r => `${r.title}: ${r.snippet}`).join('\n');
    }
  } catch {
    // Search failed
  }

  const systemPrompt = `You are an expert sales enablement strategist. Create a detailed battle card. Include 6-8 features in the feature matrix and 4-6 common objections. Return ONLY valid JSON.`;

  const userMessage = `YOUR COMPANY: ${company}
COMPETITOR: ${competitor}

${competitorData ? `COMPETITOR RESEARCH DATA:\n${competitorData}\n\n` : ''}Generate a battle card as JSON:
{
  "overview": "Brief overview of the competitive situation",
  "featureMatrix": [
    {
      "feature": "Feature name",
      "you": "Your company's capability",
      "competitor": "Competitor's capability",
      "advantage": "you|competitor|neutral"
    }
  ],
  "displacementStrategy": {
    "approach": "Overall displacement approach",
    "keyMessages": ["Message 1", "Message 2"],
    "caseStudyAngles": ["Angle 1", "Angle 2"],
    "riskMitigations": ["Risk mitigation 1", "Risk mitigation 2"]
  },
  "commonObjections": [
    {
      "objection": "Objection text",
      "response": "Response to the objection"
    }
  ],
  "winThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "pricingComparison": {
    "yourPosition": "Your pricing position",
    "competitorPosition": "Competitor pricing position",
    "valueMessage": "Value proposition message"
  }
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      yourCompany: company,
      competitor,
      date: new Date().toISOString(),
      overview: (parsed?.overview as string) || `Competitive comparison: ${company} vs ${competitor}`,
      featureMatrix: parsed && Array.isArray(parsed.featureMatrix) ? (parsed.featureMatrix as Record<string, string>[]).map((f) => ({
        feature: f.feature || 'Unknown',
        you: f.you || 'Unknown',
        competitor: f.competitor || 'Unknown',
        advantage: (['you', 'competitor', 'neutral'].includes(f.advantage) ? f.advantage : 'neutral') as 'you' | 'competitor' | 'neutral',
      })) : [],
      displacementStrategy: parsed?.displacementStrategy ? {
        approach: ((parsed.displacementStrategy as Record<string, unknown>).approach as string) || 'Focus on unique value proposition',
        keyMessages: Array.isArray((parsed.displacementStrategy as Record<string, unknown>).keyMessages) ? (parsed.displacementStrategy as Record<string, unknown>).keyMessages as string[] : [],
        caseStudyAngles: Array.isArray((parsed.displacementStrategy as Record<string, unknown>).caseStudyAngles) ? (parsed.displacementStrategy as Record<string, unknown>).caseStudyAngles as string[] : [],
        riskMitigations: Array.isArray((parsed.displacementStrategy as Record<string, unknown>).riskMitigations) ? (parsed.displacementStrategy as Record<string, unknown>).riskMitigations as string[] : [],
      } : {
        approach: 'Focus on unique value proposition and customer success',
        keyMessages: ['Superior technology', 'Better support', 'Proven results'],
        caseStudyAngles: ['ROI improvement', 'Time to value', 'Customer satisfaction'],
        riskMitigations: ['Pilot program', 'Money-back guarantee', 'Gradual migration'],
      },
      commonObjections: parsed && Array.isArray(parsed.commonObjections) ? (parsed.commonObjections as Record<string, string>[]).map((o) => ({
        objection: o.objection || '',
        response: o.response || '',
      })) : [],
      winThemes: parsed && Array.isArray(parsed.winThemes) ? (parsed.winThemes as string[]) : ['Superior product', 'Better customer support', 'Proven track record'],
      pricingComparison: parsed?.pricingComparison ? {
        yourPosition: ((parsed.pricingComparison as Record<string, string>).yourPosition) || 'Competitive',
        competitorPosition: ((parsed.pricingComparison as Record<string, string>).competitorPosition) || 'Market rate',
        valueMessage: ((parsed.pricingComparison as Record<string, string>).valueMessage) || 'Higher value for investment',
      } : {
        yourPosition: 'Competitive pricing with superior value',
        competitorPosition: 'Market rate',
        valueMessage: 'More value per dollar invested',
      },
    };
  } catch (error) {
    console.warn('[CompetitiveIntel] Battle card generation failed:', error);
    return {
      yourCompany: company,
      competitor,
      date: new Date().toISOString(),
      overview: `Competitive comparison: ${company} vs ${competitor}`,
      featureMatrix: [],
      displacementStrategy: {
        approach: 'Focus on unique value proposition',
        keyMessages: ['Superior technology', 'Better support'],
        caseStudyAngles: ['ROI improvement'],
        riskMitigations: ['Pilot program available'],
      },
      commonObjections: [],
      winThemes: ['Product differentiation', 'Customer success'],
      pricingComparison: {
        yourPosition: 'Competitive',
        competitorPosition: 'Market rate',
        valueMessage: 'Better value for investment',
      },
    };
  }
}
