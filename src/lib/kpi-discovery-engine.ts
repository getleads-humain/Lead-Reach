/**
 * KPI Discovery Engine — Step-by-Step Progressive Lead Intelligence
 * =========================================================================
 *
 * This module implements a multi-stage progressive enrichment pipeline that
 * uncovers real KPIs about a lead step-by-step, rather than trying to get
 * everything at once. Each stage builds on the previous one's findings.
 *
 * The engine answers the critical question:
 * "Are we able to find all exact info related to the lead and more KPIs
 *  are uncovered step-by-step to curate the lead as per our company's
 *  products or services?"
 *
 * Pipeline Stages:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Stage 1: BASIC DISCOVERY                                          │
 * │   → Company name, service, B2B score, emails, website content     │
 * │   → Sources: PythonGenLeads, Jina Reader                          │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Stage 2: FIRMOGRAPHIC & TECHNOLOGY SIGNALS                        │
 * │   → Tech stack detection, hiring signals, expansion signals       │
 * │   → Sources: Website content analysis, Exa /contents              │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Stage 3: FINANCIAL & INTENT ANALYSIS                              │
 * │   → Revenue signals, funding stage, buying intent, pain points    │
 * │   → Sources: About/team pages, Exa deep search, web search       │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Stage 4: COMPETITIVE LANDSCAPE & PARTNERSHIPS                     │
 * │   → Competitor mentions, partner ecosystem, integration signals   │
 * │   → Sources: Partners/integrations pages, Exa search              │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Stage 5: PRODUCT/SERVICE MATCH SCORING                            │
 * │   → Match lead capabilities against your products/services        │
 * │   → Generate outreach angles, recommendations, fit scores        │
 * │   → Sources: All previous stages + Company Match Engine           │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Used by:
 *   - Data Enrichment agent: Progressive enrichment with KPI discovery
 *   - Lead Qualification agent: Score based on uncovered KPIs
 *   - AI Assistant: Answer questions about lead intelligence
 */

import {
  webRead,
  exaSearch,
  exaSearchDeep,
  exaSearchPeople,
  exaGetContents,
  exaSearchCompaniesStructured,
  exaSearchIntentSignals,
  exaCategorySearch,
  enrichCompanyData,
  type ToolResult,
  type SearchResult,
  type EnrichedSearchResult,
} from './agent-reach-bridge';
import { isPyGenLeadsAvailable } from './pygenleads';
import { isExaConfigured } from './exa-sdk';

// ============================================================
// Types
// ============================================================

export interface KPISignal {
  category: string;
  signal: string;
  confidence: number; // 0-100
  source: string;
  data?: Record<string, unknown>;
}

export interface KPIDiscoveryResult {
  leadId: string;
  companyName: string;
  website: string;
  stages: {
    basic?: BasicDiscoveryResult;
    firmographicTech?: FirmographicTechResult;
    financialIntent?: FinancialIntentResult;
    competitiveLandscape?: CompetitiveLandscapeResult;
    productMatch?: ProductMatchResult;
  };
  allSignals: KPISignal[];
  overallConfidence: number;
  recommendations: KPIRecommendation[];
  meta: {
    stagesCompleted: string[];
    totalElapsedMs: number;
    sourcesUsed: string[];
  };
}

export interface BasicDiscoveryResult {
  b2bScore: number; // 0-10
  qualified: boolean;
  serviceCategory: string;
  emails: string[];
  websiteContent: string;
  companyDescription: string;
}

export interface FirmographicTechResult {
  techStack: string[];
  hiringSignals: string[];
  expansionSignals: string[];
  industrySignals: string[];
  officeLocations: string[];
}

export interface FinancialIntentResult {
  revenueSignals: string[];
  fundingStage: string | null;
  customerCount: string | null;
  growthSignals: string[];
  buyingIntent: string[];
  painPoints: string[];
  intentScore: number; // 0-100
}

export interface CompetitiveLandscapeResult {
  competitors: string[];
  partners: string[];
  integrations: string[];
  marketPosition: string;
}

export interface ProductMatchResult {
  yourProducts: string[];
  matchScores: Record<string, {
    score: number; // 0-100
    tier: 'critical' | 'high' | 'moderate' | 'low';
    matchingSignals: string[];
    outreachAngle: string;
  }>;
  overallFitScore: number; // 0-100
  overallTier: 'hot' | 'warm' | 'cold';
  recommendedProducts: string[];
}

export interface KPIRecommendation {
  type: 'outreach_angle' | 'timing_signal' | 'risk_factor' | 'data_gap';
  signal: string;
  recommendation: string;
  priority: 'critical' | 'high' | 'moderate' | 'low';
  confidence: number;
}

// ============================================================
// Configuration
// ============================================================

const PYGENLEADS_URL = process.env.PYGENLEADS_URL || 'http://localhost:5310';

// ============================================================
// Stage 1: Basic Discovery
// ============================================================

async function runBasicDiscovery(
  leadId: string,
  companyName: string,
  website: string,
): Promise<BasicDiscoveryResult & { signals: KPISignal[]; elapsedMs: number }> {
  const start = Date.now();
  const signals: KPISignal[] = [];
  let websiteContent = '';
  let b2bScore = 0;
  let qualified = false;
  let serviceCategory = 'Unknown';
  let emails: string[] = [];
  let companyDescription = '';

  // Method 1: PythonGenLeads KPI Discovery (deepest)
  if (await isPyGenLeadsAvailable()) {
    try {
      const response = await fetch(`${PYGENLEADS_URL}/kpi-discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: website, company_name: companyName, depth: 1 }),
        signal: AbortSignal.timeout(30000),
      });
      if (response.ok) {
        const data = await response.json() as { success: boolean; discovery: Record<string, unknown> };
        if (data.success && data.discovery) {
          const kpis = data.discovery.kpis as Record<string, Record<string, unknown>> | undefined;
          if (kpis?.basic) {
            b2bScore = (kpis.basic.b2b_score as number) || 0;
            qualified = (kpis.basic.qualified as boolean) || false;
            serviceCategory = (kpis.basic.service_category as string) || 'Unknown';
            emails = (kpis.basic.emails_found as string[]) || [];
            signals.push({
              category: 'basic',
              signal: 'b2b_score',
              confidence: (kpis.basic.email_count as number) > 0 ? 85 : 50,
              source: 'pygenleads',
              data: kpis.basic,
            });
          }
        }
      }
    } catch (e) {
      console.warn(`[KPIDiscovery] PythonGenLeads basic discovery failed:`, e instanceof Error ? e.message : e);
    }
  }

  // Method 2: Exa /contents or Jina Reader for website content
  if (!websiteContent && website) {
    if (isExaConfigured()) {
      try {
        const contentsResult = await exaGetContents([website], {
          text: { maxCharacters: 15000 },
          highlights: true,
          summary: { query: `${companyName} company overview services products contact` },
        });
        if (contentsResult.success && contentsResult.data.length > 0) {
          const first = contentsResult.data[0];
          websiteContent = [first.summary, first.text, ...(first.highlights || [])].filter(Boolean).join('\n\n').slice(0, 15000);
          signals.push({
            category: 'basic',
            signal: 'website_content',
            confidence: 80,
            source: 'exa-contents',
          });
        }
      } catch (e) {
        console.warn(`[KPIDiscovery] Exa /contents failed:`, e instanceof Error ? e.message : e);
      }
    }

    if (!websiteContent) {
      const webResult = await enrichCompanyData(website);
      if (webResult.success) {
        websiteContent = webResult.data.content?.slice(0, 15000) || '';
        signals.push({
          category: 'basic',
          signal: 'website_content',
          confidence: 65,
          source: 'jina-reader',
        });
      }
    }
  }

  // Extract company description from content
  if (websiteContent) {
    const firstParagraph = websiteContent.split('\n\n')[0] || '';
    companyDescription = firstParagraph.slice(0, 500);
  }

  return {
    b2bScore,
    qualified,
    serviceCategory,
    emails,
    websiteContent,
    companyDescription,
    signals,
    elapsedMs: Date.now() - start,
  };
}

// ============================================================
// Stage 2: Firmographic & Technology Signals
// ============================================================

async function runFirmographicTechDiscovery(
  companyName: string,
  website: string,
  websiteContent: string,
): Promise<FirmographicTechResult & { signals: KPISignal[]; elapsedMs: number }> {
  const start = Date.now();
  const signals: KPISignal[] = [];
  const techStack: string[] = [];
  const hiringSignals: string[] = [];
  const expansionSignals: string[] = [];
  const industrySignals: string[] = [];
  const officeLocations: string[] = [];

  // Use PythonGenLeads depth 2 for firmographic/tech signals
  if (await isPyGenLeadsAvailable()) {
    try {
      const response = await fetch(`${PYGENLEADS_URL}/kpi-discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: website, company_name: companyName, depth: 2 }),
        signal: AbortSignal.timeout(45000),
      });
      if (response.ok) {
        const data = await response.json() as { success: boolean; discovery: Record<string, unknown> };
        if (data.success && data.discovery) {
          const kpis = data.discovery.kpis as Record<string, Record<string, unknown>> | undefined;
          if (kpis?.firmographic_tech) {
            const ft = kpis.firmographic_tech;
            techStack.push(...(ft.tech_stack_detected as string[] || []));
            
            const firmSignals = ft.firmographic_signals as Record<string, string[]> || {};
            if (firmSignals.hiring) hiringSignals.push(...firmSignals.hiring);
            if (firmSignals.expansion) expansionSignals.push(...firmSignals.expansion);
            
            signals.push({
              category: 'firmographic',
              signal: 'tech_stack',
              confidence: min(85, 40 + techStack.length * 8),
              source: 'pygenleads',
              data: ft,
            });
          }
          
          // Also capture signals_found from discovery
          const signalsFound = data.discovery.signals_found as Array<Record<string, unknown>> || [];
          for (const sig of signalsFound) {
            if (sig.category === 'hiring') {
              hiringSignals.push(...(sig.keywords_matched as string[] || []));
            } else if (sig.category === 'expansion') {
              expansionSignals.push(...(sig.keywords_matched as string[] || []));
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[KPIDiscovery] PythonGenLeads firmographic discovery failed:`, e instanceof Error ? e.message : e);
    }
  }

  // Supplement with Exa search for tech stack / hiring
  if (techStack.length === 0 && websiteContent) {
    // Detect tech from content patterns
    const techPatterns: Record<string, string[]> = {
      'React': ['react', 'react.js', 'reactjs'],
      'Angular': ['angular'],
      'Vue': ['vue.js', 'vuejs'],
      'Node.js': ['node.js', 'nodejs'],
      'Python': ['python', 'django', 'flask'],
      'AWS': ['aws', 'amazon web services'],
      'Azure': ['azure'],
      'GCP': ['google cloud', 'gcp'],
      'Salesforce': ['salesforce'],
      'HubSpot': ['hubspot'],
      'Shopify': ['shopify'],
      'Kubernetes': ['kubernetes', 'k8s'],
      'Docker': ['docker'],
    };
    
    const contentLower = websiteContent.toLowerCase();
    for (const [tech, patterns] of Object.entries(techPatterns)) {
      if (patterns.some(p => contentLower.includes(p))) {
        techStack.push(tech);
      }
    }
  }

  // Search for hiring signals via Exa
  if (hiringSignals.length === 0) {
    try {
      const searchResult = await exaSearch(`${companyName} hiring jobs careers 2025`, 3);
      if (searchResult.success && searchResult.data.length > 0) {
        hiringSignals.push(...searchResult.data.map(r => r.snippet).filter(Boolean).slice(0, 3));
        signals.push({
          category: 'firmographic',
          signal: 'hiring_search',
          confidence: 60,
          source: searchResult.source,
        });
      }
    } catch {
      // Search failed, continue with what we have
    }
  }

  return {
    techStack,
    hiringSignals,
    expansionSignals,
    industrySignals,
    officeLocations,
    signals,
    elapsedMs: Date.now() - start,
  };
}

// ============================================================
// Stage 3: Financial & Intent Analysis
// ============================================================

async function runFinancialIntentDiscovery(
  companyName: string,
  industry: string,
  city: string,
): Promise<FinancialIntentResult & { signals: KPISignal[]; elapsedMs: number }> {
  const start = Date.now();
  const signals: KPISignal[] = [];
  const revenueSignals: string[] = [];
  let fundingStage: string | null = null;
  let customerCount: string | null = null;
  const growthSignals: string[] = [];
  const buyingIntent: string[] = [];
  const painPoints: string[] = [];
  let intentScore = 0;

  // Use Exa intent signal search
  if (isExaConfigured()) {
    try {
      const intentResult = await exaSearchIntentSignals(companyName, industry, city);
      
      if (intentResult.structuredOutput?.content) {
        const structured = intentResult.structuredOutput.content as Record<string, unknown>;
        // Extract structured intent data
        if (structured.hiring_signals) {
          buyingIntent.push(...(structured.hiring_signals as string[] || []).slice(0, 3));
        }
        if (structured.expansion_signals) {
          growthSignals.push(...(structured.expansion_signals as string[] || []).slice(0, 3));
        }
        if (structured.funding_signals) {
          revenueSignals.push(...(structured.funding_signals as string[] || []).slice(0, 3));
        }
        signals.push({
          category: 'intent',
          signal: 'structured_intent',
          confidence: 80,
          source: 'exa-intent-signals',
          data: structured,
        });
      }
      
      if (intentResult.success && intentResult.data.length > 0) {
        // Extract signals from search results
        for (const result of intentResult.data.slice(0, 5)) {
          const snippet = (result as SearchResult).snippet?.toLowerCase() || '';
          if (snippet.includes('hiring') || snippet.includes('careers')) {
            buyingIntent.push(`Hiring activity detected: ${(result as SearchResult).snippet?.slice(0, 100)}`);
          }
          if (snippet.includes('funding') || snippet.includes('raised') || snippet.includes('series')) {
            revenueSignals.push(`Funding signal: ${(result as SearchResult).snippet?.slice(0, 100)}`);
          }
          if (snippet.includes('expand') || snippet.includes('new office') || snippet.includes('growth')) {
            growthSignals.push(`Growth signal: ${(result as SearchResult).snippet?.slice(0, 100)}`);
          }
        }
        signals.push({
          category: 'intent',
          signal: 'web_search_intent',
          confidence: 55,
          source: intentResult.source,
        });
      }
    } catch (e) {
      console.warn(`[KPIDiscovery] Exa intent signals failed:`, e instanceof Error ? e.message : e);
    }
  }

  // Fallback: Generic web search for intent signals
  if (buyingIntent.length === 0) {
    try {
      const searchResult = await exaSearch(`${companyName} hiring expanding funding new office partnership 2024 2025`, 5);
      if (searchResult.success && searchResult.data.length > 0) {
        for (const r of searchResult.data) {
          const snippet = r.snippet?.toLowerCase() || '';
          if (snippet.includes('hiring')) buyingIntent.push(r.snippet.slice(0, 100));
          if (snippet.includes('expand') || snippet.includes('growth')) growthSignals.push(r.snippet.slice(0, 100));
          if (snippet.includes('funding') || snippet.includes('raised')) revenueSignals.push(r.snippet.slice(0, 100));
        }
        signals.push({
          category: 'intent',
          signal: 'generic_intent_search',
          confidence: 40,
          source: searchResult.source,
        });
      }
    } catch {
      // Continue with what we have
    }
  }

  // Search for pain points
  try {
    const painResult = await exaSearch(`${companyName} challenges problems pain points bottleneck 2025`, 3);
    if (painResult.success && painResult.data.length > 0) {
      painPoints.push(...painResult.data.map(r => r.snippet).filter(Boolean).slice(0, 3));
      signals.push({
        category: 'intent',
        signal: 'pain_points',
        confidence: 50,
        source: painResult.source,
      });
    }
  } catch {
    // Continue
  }

  // Calculate intent score
  intentScore = min(100, 
    buyingIntent.length * 15 + 
    growthSignals.length * 12 + 
    revenueSignals.length * 10 + 
    painPoints.length * 20
  );

  return {
    revenueSignals,
    fundingStage,
    customerCount,
    growthSignals,
    buyingIntent,
    painPoints,
    intentScore,
    signals,
    elapsedMs: Date.now() - start,
  };
}

// ============================================================
// Stage 4: Competitive Landscape & Partnerships
// ============================================================

async function runCompetitiveLandscapeDiscovery(
  companyName: string,
  website: string,
): Promise<CompetitiveLandscapeResult & { signals: KPISignal[]; elapsedMs: number }> {
  const start = Date.now();
  const signals: KPISignal[] = [];
  const competitors: string[] = [];
  const partners: string[] = [];
  const integrations: string[] = [];
  let marketPosition = 'Unknown';

  // Search for competitive landscape
  try {
    const searchResult = await exaSearch(`${companyName} competitors alternatives vs similar companies`, 5);
    if (searchResult.success && searchResult.data.length > 0) {
      for (const r of searchResult.data) {
        const snippet = r.snippet?.toLowerCase() || '';
        // Look for competitor name patterns
        const altMatch = snippet.match(/alternative[s]?\s+to\s+([a-z0-9\s,]+)/i);
        if (altMatch) {
          competitors.push(...altMatch[1].split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 30));
        }
      }
      signals.push({
        category: 'competitive',
        signal: 'competitor_search',
        confidence: 45,
        source: searchResult.source,
      });
    }
  } catch {
    // Continue
  }

  // Look for integration/partner pages
  if (website) {
    try {
      const partnerUrls = [`${website}/integrations`, `${website}/partners`];
      for (const purl of partnerUrls.slice(0, 1)) {
        const webResult = await enrichCompanyData(purl);
        if (webResult.success && webResult.data.content) {
          const content = webResult.data.content.toLowerCase();
          // Look for integration patterns
          const integrationMatches = content.match(/integrat(?:e[s]?|ion)[^\n]*?([A-Z][a-zA-Z]+)/g);
          if (integrationMatches) {
            integrations.push(...integrationMatches.slice(0, 10));
          }
        }
      }
    } catch {
      // Continue
    }
  }

  // Determine market position based on signals
  if (competitors.length > 3) marketPosition = 'Established player';
  else if (competitors.length > 0) marketPosition = 'Niche player';
  else marketPosition = 'Emerging/Undiscovered';

  return {
    competitors: [...new Set(competitors)].slice(0, 10),
    partners: [...new Set(partners)].slice(0, 10),
    integrations: [...new Set(integrations)].slice(0, 10),
    marketPosition,
    signals,
    elapsedMs: Date.now() - start,
  };
}

// ============================================================
// Stage 5: Product/Service Match Scoring
// ============================================================

function runProductMatchScoring(
  companyName: string,
  industry: string,
  allSignals: KPISignal[],
  stages: KPIDiscoveryResult['stages'],
  yourProducts: string[],
  yourIndustry: string,
): ProductMatchResult & { signals: KPISignal[]; recommendations: KPIRecommendation[] } {
  const signals: KPISignal[] = [];
  const recommendations: KPIRecommendation[] = [];

  // Aggregate all discovered data about this lead
  const leadCapabilities: string[] = [];
  const leadPainPoints: string[] = [];
  const leadSignals: string[] = [];

  // From basic stage
  if (stages.basic?.serviceCategory) leadCapabilities.push(stages.basic.serviceCategory);

  // From firmographic stage
  if (stages.firmographicTech?.techStack) leadCapabilities.push(...stages.firmographicTech.techStack);
  if (stages.firmographicTech?.hiringSignals) leadSignals.push(...stages.firmographicTech.hiringSignals);
  if (stages.firmographicTech?.expansionSignals) leadSignals.push(...stages.firmographicTech.expansionSignals);

  // From financial/intent stage
  if (stages.financialIntent?.buyingIntent) leadSignals.push(...stages.financialIntent.buyingIntent);
  if (stages.financialIntent?.painPoints) leadPainPoints.push(...stages.financialIntent.painPoints);
  if (stages.financialIntent?.revenueSignals) leadSignals.push(...stages.financialIntent.revenueSignals);

  // From competitive stage
  if (stages.competitiveLandscape?.integrations) leadCapabilities.push(...stages.competitiveLandscape.integrations);

  const allLeadContext = [...leadCapabilities, ...leadPainPoints, ...leadSignals].join(' ').toLowerCase();

  // Score each product against lead data
  const matchScores: Record<string, {
    score: number;
    tier: 'critical' | 'high' | 'moderate' | 'low';
    matchingSignals: string[];
    outreachAngle: string;
  }> = {};

  let totalScore = 0;

  for (const product of yourProducts) {
    const productLower = product.toLowerCase();
    const productWords = new Set(productLower.split(/\s+/));

    let score = 0;
    const matchingSignals: string[] = [];

    // 1. Direct keyword match with capabilities
    for (const cap of leadCapabilities) {
      const capWords = new Set(cap.toLowerCase().split(/\s+/));
      const overlap = Array.from(productWords).filter(w => capWords.has(w) && w.length > 2);
      if (overlap.length > 0) {
        score += overlap.length * 15;
        matchingSignals.push(`Capability match: ${cap}`);
      }
    }

    // 2. Pain point alignment (highest value)
    for (const pain of leadPainPoints) {
      const painLower = pain.toLowerCase();
      if (Array.from(productWords).some(w => w.length > 3 && painLower.includes(w))) {
        score += 25;
        matchingSignals.push(`Pain point match: ${pain.slice(0, 80)}`);
      }
    }

    // 3. Industry fit
    if (yourIndustry && industry && yourIndustry.toLowerCase() === industry.toLowerCase()) {
      score += 20;
      matchingSignals.push(`Industry match: ${industry}`);
    }

    // 4. Intent signal alignment
    for (const sig of leadSignals) {
      const sigLower = sig.toLowerCase();
      if (Array.from(productWords).some(w => w.length > 3 && sigLower.includes(w))) {
        score += 12;
        matchingSignals.push(`Intent signal: ${sig.slice(0, 80)}`);
      }
    }

    // 5. Tech stack compatibility
    if (stages.firmographicTech?.techStack) {
      for (const tech of stages.firmographicTech.techStack) {
        if (productLower.includes(tech.toLowerCase())) {
          score += 10;
          matchingSignals.push(`Tech stack match: ${tech}`);
        }
      }
    }

    score = min(100, score);
    totalScore += score;

    const tier = score >= 70 ? 'critical' : score >= 50 ? 'high' : score >= 30 ? 'moderate' : 'low';

    matchScores[product] = {
      score,
      tier,
      matchingSignals,
      outreachAngle: generateOutreachAngle(product, companyName, tier, matchingSignals, leadPainPoints),
    };

    // Generate recommendations based on match
    if (tier === 'critical' || tier === 'high') {
      recommendations.push({
        type: 'outreach_angle',
        signal: `product_match_${product.replace(/\s+/g, '_')}`,
        recommendation: `Lead shows ${tier} alignment with ${product}. ${matchingSignals.slice(0, 2).join('; ')}. Prioritize outreach with personalized messaging.`,
        priority: tier === 'critical' ? 'critical' : 'high',
        confidence: min(90, score),
      });
    }
  }

  // Generate timing recommendations
  if (stages.firmographicTech?.hiringSignals && stages.firmographicTech.hiringSignals.length > 0) {
    recommendations.push({
      type: 'timing_signal',
      signal: 'hiring',
      recommendation: `${companyName} is actively hiring — position your product as enabling their growth or reducing onboarding overhead.`,
      priority: 'high',
      confidence: 75,
    });
  }
  if (stages.financialIntent?.revenueSignals && stages.financialIntent.revenueSignals.length > 0) {
    recommendations.push({
      type: 'timing_signal',
      signal: 'funding',
      recommendation: `${companyName} shows funding/revenue signals — they likely have budget for new solutions.`,
      priority: 'high',
      confidence: 65,
    });
  }
  if (stages.financialIntent?.painPoints && stages.financialIntent.painPoints.length > 0) {
    recommendations.push({
      type: 'outreach_angle',
      signal: 'pain_points',
      recommendation: `Lead mentions specific challenges — craft messaging that directly addresses: ${stages.financialIntent.painPoints[0]?.slice(0, 100)}`,
      priority: 'critical',
      confidence: 70,
    });
  }

  // Identify data gaps
  if (!stages.basic?.emails || stages.basic.emails.length === 0) {
    recommendations.push({
      type: 'data_gap',
      signal: 'missing_emails',
      recommendation: 'No direct emails found — consider using Exa people search or LinkedIn to find contacts.',
      priority: 'moderate',
      confidence: 90,
    });
  }
  if (!stages.firmographicTech?.techStack || stages.firmographicTech.techStack.length === 0) {
    recommendations.push({
      type: 'data_gap',
      signal: 'missing_tech_stack',
      recommendation: 'Tech stack not detected — try deeper website crawl or check GitHub presence.',
      priority: 'low',
      confidence: 80,
    });
  }

  const avgScore = yourProducts.length > 0 ? totalScore / yourProducts.length : 0;

  return {
    yourProducts,
    matchScores,
    overallFitScore: Math.round(avgScore),
    overallTier: avgScore >= 60 ? 'hot' : avgScore >= 35 ? 'warm' : 'cold',
    recommendedProducts: Object.keys(matchScores).sort((a, b) => matchScores[b].score - matchScores[a].score),
    signals,
    recommendations,
  };
}

// ============================================================
// Outreach Angle Generator
// ============================================================

function generateOutreachAngle(
  product: string,
  companyName: string,
  tier: string,
  matchingSignals: string[],
  painPoints: string[],
): string {
  if (tier === 'critical') {
    if (painPoints.length > 0) {
      return `${companyName} faces challenges your ${product} directly addresses. Lead with: "We help companies like ${companyName} solve [specific challenge]."`;
    }
    return `${companyName} shows strong alignment with ${product}. Lead with a personalized demo showing how ${product} fits their tech stack and workflow.`;
  }
  if (tier === 'high') {
    return `${companyName} has moderate alignment with ${product}. Focus on: ${matchingSignals[0] || 'their growth trajectory and how your solution scales with them.'}`;
  }
  if (tier === 'moderate') {
    return `${companyName} has some overlap with ${product}. Research their specific needs before reaching out to increase relevance.`;
  }
  return `${companyName} shows limited direct fit with ${product}, but explore indirect value or adjacent use cases.`;
}

// ============================================================
// Main Orchestrator: Run Full KPI Discovery Pipeline
// ============================================================

/**
 * Run the full step-by-step KPI discovery pipeline on a lead.
 *
 * This is the primary entry point for the KPI Discovery Engine.
 * It progressively uncovers KPIs across 5 stages, building on
 * each previous stage's findings.
 *
 * @param leadId - Lead ID from the database
 * @param companyName - Company name
 * @param website - Company website URL
 * @param industry - Company industry
 * @param city - Company city
 * @param yourProducts - Your company's products/services for matching
 * @param yourIndustry - Your company's industry
 * @param maxDepth - Maximum depth (1-5, default 3)
 * @returns Progressive KPI discovery results
 */
export async function discoverKPIs(
  leadId: string,
  companyName: string,
  website: string,
  industry: string = '',
  city: string = '',
  yourProducts: string[] = [],
  yourIndustry: string = '',
  maxDepth: number = 3,
): Promise<KPIDiscoveryResult> {
  const pipelineStart = Date.now();
  const allSignals: KPISignal[] = [];
  const recommendations: KPIRecommendation[] = [];
  const stagesCompleted: string[] = [];
  const sourcesUsed: Set<string> = new Set();

  const result: KPIDiscoveryResult = {
    leadId,
    companyName,
    website,
    stages: {},
    allSignals: [],
    overallConfidence: 0,
    recommendations: [],
    meta: {
      stagesCompleted: [],
      totalElapsedMs: 0,
      sourcesUsed: [],
    },
  };

  // ============================================================
  // Stage 1: Basic Discovery (always runs)
  // ============================================================
  console.log(`[KPIDiscovery] Stage 1/5: Basic Discovery for ${companyName}`);
  const basicResult = await runBasicDiscovery(leadId, companyName, website);
  result.stages.basic = {
    b2bScore: basicResult.b2bScore,
    qualified: basicResult.qualified,
    serviceCategory: basicResult.serviceCategory,
    emails: basicResult.emails,
    websiteContent: basicResult.websiteContent,
    companyDescription: basicResult.companyDescription,
  };
  allSignals.push(...basicResult.signals);
  basicResult.signals.forEach(s => sourcesUsed.add(s.source));
  stagesCompleted.push('basic_discovery');

  // ============================================================
  // Stage 2: Firmographic & Technology (depth >= 2)
  // ============================================================
  if (maxDepth >= 2) {
    console.log(`[KPIDiscovery] Stage 2/5: Firmographic & Technology for ${companyName}`);
    const firmResult = await runFirmographicTechDiscovery(
      companyName,
      website,
      basicResult.websiteContent,
    );
    result.stages.firmographicTech = {
      techStack: firmResult.techStack,
      hiringSignals: firmResult.hiringSignals,
      expansionSignals: firmResult.expansionSignals,
      industrySignals: firmResult.industrySignals,
      officeLocations: firmResult.officeLocations,
    };
    allSignals.push(...firmResult.signals);
    firmResult.signals.forEach(s => sourcesUsed.add(s.source));
    stagesCompleted.push('firmographic_tech');
  }

  // ============================================================
  // Stage 3: Financial & Intent (depth >= 3)
  // ============================================================
  if (maxDepth >= 3) {
    console.log(`[KPIDiscovery] Stage 3/5: Financial & Intent for ${companyName}`);
    const finResult = await runFinancialIntentDiscovery(companyName, industry, city);
    result.stages.financialIntent = {
      revenueSignals: finResult.revenueSignals,
      fundingStage: finResult.fundingStage,
      customerCount: finResult.customerCount,
      growthSignals: finResult.growthSignals,
      buyingIntent: finResult.buyingIntent,
      painPoints: finResult.painPoints,
      intentScore: finResult.intentScore,
    };
    allSignals.push(...finResult.signals);
    finResult.signals.forEach(s => sourcesUsed.add(s.source));
    stagesCompleted.push('financial_intent');
  }

  // ============================================================
  // Stage 4: Competitive Landscape (depth >= 4)
  // ============================================================
  if (maxDepth >= 4) {
    console.log(`[KPIDiscovery] Stage 4/5: Competitive Landscape for ${companyName}`);
    const compResult = await runCompetitiveLandscapeDiscovery(companyName, website);
    result.stages.competitiveLandscape = {
      competitors: compResult.competitors,
      partners: compResult.partners,
      integrations: compResult.integrations,
      marketPosition: compResult.marketPosition,
    };
    allSignals.push(...compResult.signals);
    compResult.signals.forEach(s => sourcesUsed.add(s.source));
    stagesCompleted.push('competitive_landscape');
  }

  // ============================================================
  // Stage 5: Product/Service Match (depth >= 5, or if products provided)
  // ============================================================
  if (maxDepth >= 5 || yourProducts.length > 0) {
    console.log(`[KPIDiscovery] Stage 5/5: Product/Service Match for ${companyName}`);
    const matchResult = runProductMatchScoring(
      companyName,
      industry,
      allSignals,
      result.stages,
      yourProducts,
      yourIndustry,
    );
    result.stages.productMatch = {
      yourProducts: matchResult.yourProducts,
      matchScores: matchResult.matchScores,
      overallFitScore: matchResult.overallFitScore,
      overallTier: matchResult.overallTier,
      recommendedProducts: matchResult.recommendedProducts,
    };
    allSignals.push(...matchResult.signals);
    recommendations.push(...matchResult.recommendations);
    stagesCompleted.push('product_match');
  }

  // ============================================================
  // Finalize
  // ============================================================

  // Calculate overall confidence (weighted average across stages)
  const confidenceValues = allSignals.map(s => s.confidence);
  result.overallConfidence = confidenceValues.length > 0
    ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
    : 0;

  result.allSignals = allSignals;
  result.recommendations = recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  result.meta = {
    stagesCompleted,
    totalElapsedMs: Date.now() - pipelineStart,
    sourcesUsed: Array.from(sourcesUsed),
  };

  console.log(`[KPIDiscovery] Complete for ${companyName}: ${stagesCompleted.length} stages, ${allSignals.length} signals, ${recommendations.length} recommendations, ${result.overallConfidence}% confidence`);

  return result;
}

// ============================================================
// Utility
// ============================================================

function min(a: number, b: number): number {
  return Math.min(a, b);
}

/**
 * Quick KPI check for a single URL using PythonGenLeads.
 * Useful for fast scoring without the full pipeline.
 */
export async function quickKPICheck(url: string): Promise<{
  b2bScore: number;
  qualified: boolean;
  serviceCategory: string;
  emails: string[];
  techStack: string[];
  signals: string[];
} | null> {
  if (!(await isPyGenLeadsAvailable())) {
    return null;
  }

  try {
    const response = await fetch(`${PYGENLEADS_URL}/kpi-discovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, depth: 2 }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;

    const data = await response.json() as { success: boolean; discovery: Record<string, unknown> };
    if (!data.success || !data.discovery) return null;

    const kpis = data.discovery.kpis as Record<string, Record<string, unknown>> | undefined;
    const signalsFound = data.discovery.signals_found as Array<Record<string, unknown>> | undefined;

    return {
      b2bScore: (kpis?.basic?.b2b_score as number) || 0,
      qualified: (kpis?.basic?.qualified as boolean) || false,
      serviceCategory: (kpis?.basic?.service_category as string) || 'Unknown',
      emails: (kpis?.basic?.emails_found as string[]) || [],
      techStack: (kpis?.firmographic_tech?.tech_stack_detected as string[]) || [],
      signals: (signalsFound || []).map(s => s.category as string).filter(Boolean),
    };
  } catch {
    return null;
  }
}
