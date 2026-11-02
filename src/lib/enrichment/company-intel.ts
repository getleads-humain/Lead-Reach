/**
 * Company Intelligence Provider — LeadReach
 * ==================================================
 *
 * Inspired by Relevance AI's Agent + Knowledge patterns.
 * Provides deep company intelligence by combining:
 *   - Web search data (via z-ai-web-dev-sdk)
 *   - LLM analysis and inference
 *   - Industry benchmarking databases
 *   - Cross-lead intelligence patterns
 *
 * This is the "Research Agent" in our multi-agent workforce,
 * analogous to Relevance AI's Account Researcher agent.
 */

import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';
import { db } from '@/lib/db';
import { cacheCapabilityResult, getCapabilityResult } from './cache';

// ============================================================
// Types
// ============================================================

export interface CompanyIntelligence {
  // Basic profile
  overview: CompanyOverview;
  // Financial indicators
  financials: FinancialIndicators;
  // Technology landscape
  technology: TechnologyLandscape;
  // Competitive position
  competitive: CompetitivePosition;
  // Strategic assessment
  strategic: StrategicAssessment;
  // Risk factors
  risks: RiskFactor[];
  // Opportunity signals
  opportunities: OpportunitySignal[];
  // Recommended approach
  recommendedApproach: string;
}

export interface CompanyOverview {
  description: string;
  businessModel: string;
  targetMarket: string;
  geographicReach: string;
  keyDifferentiators: string[];
  recentNews: string[];
}

export interface FinancialIndicators {
  revenueEstimate: string;
  revenueGrowth: string;
  fundingStatus: string;
  profitability: string;
  keyFinancialRatios: string[];
}

export interface TechnologyLandscape {
  techStack: string[];
  digitalMaturity: 'low' | 'medium' | 'high' | 'very_high';
  cloudAdoption: string;
  automationLevel: string;
  techPainPoints: string[];
}

export interface CompetitivePosition {
  marketPosition: string;
  mainCompetitors: string[];
  competitiveAdvantage: string;
  marketTrends: string[];
  threats: string[];
}

export interface StrategicAssessment {
  icpFit: number; // 0-100
  dealPotential: 'small' | 'medium' | 'large' | 'enterprise';
  salesCycleEstimate: string;
  keyDecisionMaker: string;
  buyingSignals: string[];
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export interface OpportunitySignal {
  signal: string;
  strength: 'weak' | 'moderate' | 'strong';
  action: string;
}

// ============================================================
// Industry benchmark databases
// ============================================================

const INDUSTRY_TECH_STACKS: Record<string, string[]> = {
  'Technology': ['AWS/Azure/GCP', 'React/Node.js', 'Salesforce', 'HubSpot', 'Slack', 'Jira', 'GitHub', 'Datadog'],
  'Finance': ['AWS', 'Java/Spring', 'Bloomberg Terminal', 'Salesforce', 'SAP', 'Oracle', 'ServiceNow', 'Tableau'],
  'Healthcare': ['Epic/Cerner', 'AWS', 'HIPAA-compliant tools', 'SAP', 'Oracle Health', 'ServiceNow', 'Power BI'],
  'Manufacturing': ['SAP', 'Oracle ERP', 'AWS/Azure IoT', 'ServiceNow', 'Power BI', 'Siemens', 'Rockwell'],
  'Retail & E-Commerce': ['Shopify/Magento', 'AWS', 'Google Analytics', 'Salesforce Commerce', 'Klaviyo', 'Stripe'],
  'Education': ['Canvas/Blackboard', 'Google Workspace', 'AWS', 'Zoom', 'Salesforce', 'Microsoft 365'],
  'Business Services': ['Salesforce', 'HubSpot', 'AWS', 'Slack', 'Microsoft 365', 'Zoom', 'QuickBooks'],
  'Energy': ['SAP', 'OSIsoft PI', 'AWS/Azure', 'ServiceNow', 'Power BI', 'Oracle', 'Schneider Electric'],
  'Agriculture & Food': ['SAP', 'John Deere Ops Center', 'AWS', 'Microsoft 365', 'Power BI', 'Salesforce'],
  'Real Estate': ['Salesforce', 'CoStar', 'Yardi', 'AWS', 'Microsoft 365', 'Zoom', 'QuickBase'],
  'Legal Services': ['Clio/MyCase', 'Microsoft 365', 'AWS', 'Zoom', 'DocuSign', 'Salesforce'],
  'Logistics & Transportation': ['SAP TM', 'Oracle TMS', 'AWS', 'ServiceNow', 'Power BI', 'Salesforce'],
};

const INDUSTRY_DEAL_SIZES: Record<string, { base: number; range: [number, number] }> = {
  'Technology': { base: 45000, range: [15000, 200000] },
  'Finance': { base: 60000, range: [25000, 300000] },
  'Healthcare': { base: 55000, range: [20000, 250000] },
  'Manufacturing': { base: 40000, range: [15000, 150000] },
  'Retail & E-Commerce': { base: 35000, range: [10000, 120000] },
  'Education': { base: 20000, range: [8000, 60000] },
  'Business Services': { base: 30000, range: [10000, 100000] },
  'Energy': { base: 50000, range: [20000, 200000] },
  'Agriculture & Food': { base: 25000, range: [8000, 80000] },
  'Real Estate': { base: 35000, range: [12000, 120000] },
  'Legal Services': { base: 25000, range: [8000, 80000] },
  'Logistics & Transportation': { base: 35000, range: [12000, 120000] },
};

const INDUSTRY_SALES_CYCLES: Record<string, string> = {
  'Technology': '30-60 days',
  'Finance': '60-90 days',
  'Healthcare': '60-120 days',
  'Manufacturing': '45-90 days',
  'Retail & E-Commerce': '30-45 days',
  'Education': '60-90 days',
  'Business Services': '30-60 days',
  'Energy': '60-120 days',
  'Agriculture & Food': '45-90 days',
  'Real Estate': '30-60 days',
  'Legal Services': '30-60 days',
  'Logistics & Transportation': '45-90 days',
};

const INDUSTRY_DIGITAL_MATURITY: Record<string, 'low' | 'medium' | 'high' | 'very_high'> = {
  'Technology': 'very_high',
  'Finance': 'high',
  'Healthcare': 'medium',
  'Manufacturing': 'medium',
  'Retail & E-Commerce': 'high',
  'Education': 'medium',
  'Business Services': 'medium',
  'Energy': 'medium',
  'Agriculture & Food': 'low',
  'Real Estate': 'medium',
  'Legal Services': 'low',
  'Logistics & Transportation': 'medium',
};

const INDUSTRY_BUSINESS_MODELS: Record<string, string> = {
  'Technology': 'SaaS / Platform — recurring revenue from software subscriptions and usage-based pricing',
  'Finance': 'Fee-based / Spread — revenue from transaction fees, interest spreads, and advisory services',
  'Healthcare': 'Service-based — revenue from patient services, insurance reimbursements, and pharmaceutical sales',
  'Manufacturing': 'Product-based — revenue from manufacturing and selling physical goods, with OEM relationships',
  'Retail & E-Commerce': 'D2C / Marketplace — revenue from direct sales, commissions, and advertising',
  'Education': 'Enrollment-based — revenue from tuition, grants, and educational technology licensing',
  'Business Services': 'Project / Retainer — revenue from consulting engagements and managed services',
  'Energy': 'Commodity / Contract — revenue from energy production, trading, and long-term supply contracts',
  'Agriculture & Food': 'Production / Processing — revenue from crop yields, food processing, and distribution',
  'Real Estate': 'Commission / Asset — revenue from property sales, rentals, and management fees',
  'Legal Services': 'Billable Hours / Retainer — revenue from hourly billing and ongoing client retainers',
  'Logistics & Transportation': 'Volume-based — revenue from shipping volume, freight contracts, and logistics services',
};

const INDUSTRY_KEY_DIFFERENTIATORS: Record<string, string[]> = {
  'Technology': ['Proprietary algorithms', 'Developer talent', 'Platform network effects', 'IP portfolio'],
  'Finance': ['Regulatory compliance', 'Capital access', 'Risk management', 'Client relationships'],
  'Healthcare': ['Clinical expertise', 'Regulatory approvals', 'Patient outcomes data', 'Research capabilities'],
  'Manufacturing': ['Production efficiency', 'Supply chain control', 'Quality certifications', 'Scale advantages'],
  'Retail & E-Commerce': ['Brand recognition', 'Customer data', 'Distribution network', 'Pricing power'],
  'Education': ['Accreditation', 'Faculty expertise', 'Alumni network', 'Research output'],
  'Business Services': ['Domain expertise', 'Client relationships', 'Methodology', 'Talent quality'],
  'Energy': ['Resource access', 'Regulatory permits', 'Infrastructure', 'Technology partnerships'],
  'Agriculture & Food': ['Land/resources', 'Distribution network', 'Brand recognition', 'Sustainability practices'],
  'Real Estate': ['Location portfolio', 'Market knowledge', 'Capital relationships', 'Development expertise'],
  'Legal Services': ['Specialization depth', 'Case track record', 'Client roster', 'Partner expertise'],
  'Logistics & Transportation': ['Network coverage', 'Fleet capacity', 'Technology platform', 'Reliability track record'],
};

// ============================================================
// Main function: Deep Company Research
// ============================================================

/**
 * Generate comprehensive company intelligence using web data + LLM analysis + benchmarks.
 * Always produces rich results — even without web data, uses industry knowledge + benchmarks.
 */
export async function generateCompanyIntelligence(
  leadId: string,
  webData?: string,
): Promise<CompanyIntelligence> {
  // Check cache first
  const cached = getCapabilityResult<CompanyIntelligence>(leadId, 'company_intelligence');
  if (cached) return cached;

  // Get lead data
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return buildFallbackIntelligence({ companyName: 'Unknown', industry: '' });
  }

  const industry = lead.industry || inferIndustryFromName(lead.companyName || '');
  const companyName = lead.companyName || 'Unknown';

  // Build from benchmarks + LLM
  const intelligence = await buildIntelligenceFromContext(lead, industry, webData);

  // Cache the result
  cacheCapabilityResult(leadId, 'company_intelligence', intelligence, {
    companyName,
    industry,
    employeeCount: lead.employeeCount,
    revenueEstimate: lead.revenueEstimate,
    leadScore: lead.leadScore,
    stage: lead.stage,
  });

  return intelligence;
}

// ============================================================
// Build intelligence from context (benchmarks + LLM)
// ============================================================

async function buildIntelligenceFromContext(
  lead: Record<string, any>,
  industry: string,
  webData?: string,
): Promise<CompanyIntelligence> {
  const companyName = lead.companyName || 'Unknown';
  const country = lead.country || 'Global';
  const employees = lead.employeeCount || '';
  const revenue = lead.revenueEstimate || '';

  // Build the benchmark-based fallback first
  const benchmark = buildBenchmarkIntelligence(lead, industry);

  // Try to enhance with LLM
  try {
    const contextSection = webData
      ? `WEB RESEARCH DATA:\n${webData.slice(0, 4000)}\n\nUse the above web data to enhance your analysis.`
      : 'No web data available — use your training knowledge and industry expertise.';

    const systemPrompt = `You are a senior B2B competitive intelligence analyst. Provide a comprehensive company intelligence report for a sales team. Be specific, factual, and actionable. Return ONLY valid JSON.`;

    const userPrompt = `Analyze this company for B2B sales intelligence:

COMPANY: ${companyName}
INDUSTRY: ${industry}
COUNTRY: ${country}
EMPLOYEES: ${employees || 'Unknown'}
REVENUE: ${revenue || 'Unknown'}
WEBSITE: ${lead.website || 'Unknown'}
TECH STACK: ${lead.techStack || 'Unknown'}
KEY CONTACT: ${lead.keyContactName || 'Unknown'}${lead.keyContactTitle ? ` (${lead.keyContactTitle})` : ''}
CEO: ${lead.ceoName || 'Unknown'}
STAGE: ${lead.stage}
SCORE: ${lead.leadScore}/100

${contextSection}

Return JSON with this EXACT structure:
{
  "overview": {
    "description": "1-2 sentence company description",
    "businessModel": "Their primary revenue model",
    "targetMarket": "Who they sell to",
    "geographicReach": "Where they operate",
    "keyDifferentiators": ["2-3 differentiators"],
    "recentNews": ["1-3 recent developments or likely developments for this type of company"]
  },
  "financials": {
    "revenueEstimate": "Estimated revenue range",
    "revenueGrowth": "Growth trajectory assessment",
    "fundingStatus": "Funding stage or ownership type",
    "profitability": "Profitability assessment",
    "keyFinancialRatios": ["1-3 relevant ratios"]
  },
  "technology": {
    "techStack": ["List of likely technologies"],
    "digitalMaturity": "low|medium|high|very_high",
    "cloudAdoption": "Cloud adoption level",
    "automationLevel": "Automation sophistication",
    "techPainPoints": ["1-3 pain points"]
  },
  "competitive": {
    "marketPosition": "Their market position description",
    "mainCompetitors": ["2-3 competitor names"],
    "competitiveAdvantage": "Their key advantage",
    "marketTrends": ["1-3 relevant trends"],
    "threats": ["1-3 competitive threats"]
  },
  "strategic": {
    "icpFit": 0-100,
    "dealPotential": "small|medium|large|enterprise",
    "salesCycleEstimate": "Estimated cycle length",
    "keyDecisionMaker": "Likely decision-maker title",
    "buyingSignals": ["1-3 buying signals"]
  },
  "risks": [
    { "factor": "risk description", "severity": "low|medium|high|critical", "mitigation": "how to address" }
  ],
  "opportunities": [
    { "signal": "opportunity description", "strength": "weak|moderate|strong", "action": "recommended action" }
  ],
  "recommendedApproach": "1-2 sentence outreach strategy"
}`;

    const llmResult = await callLLMForJSON<CompanyIntelligence>(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 4000,
      model: MODEL_PRIMARY,
      thinkingBudget: 'deep',
    });

    if (llmResult && llmResult.overview) {
      // Merge LLM result with benchmarks — LLM takes precedence for filled fields
      return {
        overview: llmResult.overview?.description ? llmResult.overview : benchmark.overview,
        financials: llmResult.financials?.revenueEstimate ? llmResult.financials : benchmark.financials,
        technology: llmResult.technology?.techStack?.length ? llmResult.technology : benchmark.technology,
        competitive: llmResult.competitive?.marketPosition ? llmResult.competitive : benchmark.competitive,
        strategic: llmResult.strategic?.icpFit ? llmResult.strategic : benchmark.strategic,
        risks: llmResult.risks?.length ? llmResult.risks : benchmark.risks,
        opportunities: llmResult.opportunities?.length ? llmResult.opportunities : benchmark.opportunities,
        recommendedApproach: llmResult.recommendedApproach || benchmark.recommendedApproach,
      };
    }
  } catch (err) {
    console.warn('[company-intelligence] LLM failed, using benchmark intelligence:', err);
  }

  return benchmark;
}

// ============================================================
// Benchmark-based intelligence (always produces results)
// ============================================================

function buildBenchmarkIntelligence(lead: Record<string, any>, industry: string): CompanyIntelligence {
  const companyName = lead.companyName || 'Unknown';
  const country = lead.country || 'Global';
  const employees = lead.employeeCount || '';
  const revenue = lead.revenueEstimate || '';

  const isLargeCompany = /201-500|501-1000|1001-5000|5000+/.test(employees);
  const isSMB = /1-10|11-50/.test(employees);

  // Calculate ICP fit
  let icpFit = 40;
  const highValueIndustries = ['Technology', 'Finance', 'Healthcare', 'SaaS', 'AI', 'Cybersecurity'];
  if (highValueIndustries.some(i => industry.toLowerCase().includes(i.toLowerCase()))) icpFit += 25;
  if (isLargeCompany) icpFit += 15;
  if (country) icpFit += 5;
  if (lead.website) icpFit += 5;
  if (lead.techStack) icpFit += 10;
  icpFit = Math.min(95, icpFit);

  return {
    overview: {
      description: `${companyName} is a ${isLargeCompany ? 'mid-to-large' : isSMB ? 'small-to-mid' : ''} company operating in the ${industry} sector${country !== 'Global' ? `, based in ${country}` : ''}. ${employees ? `With approximately ${employees} employees` : 'While the exact size is not disclosed'}, the company plays a notable role in its market segment.`,
      businessModel: INDUSTRY_BUSINESS_MODELS[industry] || 'Diversified revenue streams from core business operations',
      targetMarket: isLargeCompany
        ? 'Enterprise and mid-market B2B clients across multiple verticals'
        : 'SMB and mid-market clients, with potential for enterprise expansion',
      geographicReach: country !== 'Global'
        ? `Primarily serving the ${country} market with potential for regional expansion`
        : 'Operating across multiple international markets',
      keyDifferentiators: INDUSTRY_KEY_DIFFERENTIATORS[industry] || ['Domain expertise', 'Client relationships', 'Market positioning'],
      recentNews: [
        `The ${industry} sector is experiencing digital transformation, creating new opportunities for ${companyName}`,
        `Industry trends indicate growing investment in automation and data-driven decision-making within ${industry}`,
        `${country !== 'Global' ? country + '-based' : 'International'} companies in ${industry} are increasingly adopting cloud and AI solutions`,
      ],
    },
    financials: {
      revenueEstimate: revenue || (isLargeCompany ? '$50M-$500M' : isSMB ? '$1M-$25M' : '$10M-$100M'),
      revenueGrowth: isLargeCompany ? 'Steady growth trajectory typical of established companies in this sector' : 'Growth phase — likely investing in market expansion and capability building',
      fundingStatus: isLargeCompany ? 'Established — likely privately held or publicly traded with stable capital base' : 'Likely bootstrapped or venture-backed depending on growth stage',
      profitability: isLargeCompany ? 'Likely profitable with established revenue streams' : 'May be prioritizing growth over profitability',
      keyFinancialRatios: [
        `Revenue per employee: ${isLargeCompany ? '$150K-$300K' : '$75K-$200K'} (industry estimate)`,
        `Gross margin: ${industry === 'Technology' ? '70-85%' : industry === 'Finance' ? '60-80%' : '30-50%'} (industry average)`,
        `Growth rate: ${industry === 'Technology' ? '15-30%' : '5-15%'} (sector average)`,
      ],
    },
    technology: {
      techStack: INDUSTRY_TECH_STACKS[industry] || INDUSTRY_TECH_STACKS['Business Services'],
      digitalMaturity: INDUSTRY_DIGITAL_MATURITY[industry] || 'medium',
      cloudAdoption: INDUSTRY_DIGITAL_MATURITY[industry] === 'very_high' || INDUSTRY_DIGITAL_MATURITY[industry] === 'high'
        ? 'High — likely running core workloads on cloud infrastructure (AWS/Azure/GCP)'
        : 'Moderate — likely in cloud migration phase with hybrid infrastructure',
      automationLevel: INDUSTRY_DIGITAL_MATURITY[industry] === 'very_high'
        ? 'Advanced — significant investment in workflow automation and AI-driven processes'
        : 'Growing — increasing adoption of automation tools but manual processes still prevalent',
      techPainPoints: [
        `Integration complexity between legacy systems and modern ${industry} platforms`,
        `Data silos across departments limiting unified customer view`,
        `Security and compliance requirements driving need for better tooling`,
      ],
    },
    competitive: {
      marketPosition: isLargeCompany
        ? `Established player in ${industry} with significant market share and brand recognition`
        : `Growing competitor in ${industry}, likely focused on niche segments or geographic advantage`,
      mainCompetitors: inferCompetitors(industry, companyName),
      competitiveAdvantage: isLargeCompany
        ? 'Scale, established client base, and institutional knowledge in their domain'
        : 'Agility, specialized expertise, and ability to deliver personalized service',
      marketTrends: [
        `Digital transformation accelerating across ${industry}`,
        `Consolidation through M&A activity in the ${industry} sector`,
        `Growing demand for AI-powered solutions and data-driven decision making`,
      ],
      threats: [
        'Market disruption from tech-forward competitors',
        'Economic uncertainty affecting B2B purchasing decisions',
        'Talent competition in key technical and sales roles',
      ],
    },
    strategic: {
      icpFit,
      dealPotential: isLargeCompany ? 'enterprise' : isSMB ? 'small' : 'medium',
      salesCycleEstimate: INDUSTRY_SALES_CYCLES[industry] || '30-90 days',
      keyDecisionMaker: isLargeCompany ? 'VP of Sales / Chief Revenue Officer' : 'CEO / Founder / Head of Growth',
      buyingSignals: [
        `${industry} companies increasingly investing in sales automation and pipeline tools`,
        `Growing awareness of AI-driven lead qualification benefits in ${industry}`,
        lead.website ? `Active web presence suggests digital readiness for new tools` : `Potential first-mover advantage if competitors aren't using AI tools`,
      ],
    },
    risks: [
      {
        factor: `Limited firmographic data available for ${companyName} — some assessments are based on industry heuristics`,
        severity: 'medium',
        mitigation: 'Run Web Data Enrichment and Deep Company Research to fill gaps before outreach',
      },
      {
        factor: `${country !== 'Global' ? country + '-based' : 'International'} company may have different procurement norms and budget cycles`,
        severity: 'low',
        mitigation: 'Research regional procurement patterns and adjust outreach timing accordingly',
      },
      {
        factor: 'No verified contact information for decision-maker',
        severity: lead.keyContactEmail ? 'low' : 'high',
        mitigation: lead.keyContactEmail ? 'Contact information available' : 'Run contact identification before outreach to maximize deliverability',
      },
    ],
    opportunities: [
      {
        signal: `${industry} sector shows strong demand for sales automation and pipeline management tools`,
        strength: 'strong',
        action: 'Lead outreach with industry-specific value proposition and ROI projections',
      },
      {
        signal: `Early engagement with ${companyName} could establish long-term vendor relationship before competitors`,
        strength: 'moderate',
        action: 'Prioritize personalized outreach emphasizing competitive advantage and industry expertise',
      },
      {
        signal: isLargeCompany ? 'Large organization likely has budget allocated for sales technology' : 'SMBs can make faster purchasing decisions',
        strength: 'moderate',
        action: isLargeCompany ? 'Target VP+ level with enterprise value proposition' : 'Engage CEO/owner directly with quick-win messaging',
      },
    ],
    recommendedApproach: `Start with a value-driven discovery call focused on ${companyName}'s specific ${industry} challenges. Lead with industry benchmarks and peer comparisons to establish credibility. ${isLargeCompany ? 'Navigate multi-stakeholder process by identifying and engaging all decision-makers.' : 'Engage the decision-maker directly with a clear, concise value proposition.'}`,
  };
}

function buildFallbackIntelligence(lead: { companyName: string; industry: string }): CompanyIntelligence {
  const industry = lead.industry || 'General Business';
  return buildBenchmarkIntelligence(lead, industry);
}

// ============================================================
// Helper: Infer industry from company name
// ============================================================

function inferIndustryFromName(companyName: string): string {
  const name = companyName.toLowerCase();

  const patterns: [RegExp, string][] = [
    [/it |tech|software|digital|data|cloud|cyber|ai |ml /i, 'Technology'],
    [/bank|financ|invest|insuranc|fintech|capital|fund/i, 'Finance'],
    [/health|medic|pharma|bio|clinic|hospital|diagnostic/i, 'Healthcare'],
    [/energy|solar|wind|oil|gas|power|renewable/i, 'Energy'],
    [/agri|farm|crop|food|beverage|fishery/i, 'Agriculture & Food'],
    [/educ|school|university|academy|train|learn/i, 'Education'],
    [/manufact|industr|factory|steel|metal|chemic/i, 'Manufacturing'],
    [/construct|build|architect|engineer|infrastructure/i, 'Construction & Engineering'],
    [/retail|shop|store|ecommerce|market|commerce/i, 'Retail & E-Commerce'],
    [/logistic|transport|shipping|freight|supply chain/i, 'Logistics & Transportation'],
    [/consult|advisory|service|solution|management/i, 'Business Services'],
    [/telecom|communic|media|broadcast/i, 'Telecommunications & Media'],
    [/real estate|property|develop|housing/i, 'Real Estate'],
    [/legal|law|attorney/i, 'Legal Services'],
  ];

  for (const [regex, industry] of patterns) {
    if (regex.test(name)) return industry;
  }

  return 'General Business';
}

// ============================================================
// Helper: Infer likely competitors
// ============================================================

function inferCompetitors(industry: string, companyName: string): string[] {
  const competitors: Record<string, string[]> = {
    'Technology': ['Salesforce', 'HubSpot', 'Microsoft Dynamics', 'Zoho'],
    'Finance': ['Bloomberg', 'Refinitiv', 'FIS', 'Temenos'],
    'Healthcare': ['Epic Systems', 'Cerner', 'Veeva Systems', 'Medidata'],
    'Manufacturing': ['Siemens', 'Honeywell', 'Rockwell Automation', 'ABB'],
    'Retail & E-Commerce': ['Shopify', 'BigCommerce', 'Magento/Adobe Commerce', 'WooCommerce'],
    'Education': ['Canvas/Instructure', 'Blackboard', 'Coursera', 'Udemy'],
    'Business Services': ['Deloitte Digital', 'Accenture', 'McKinsey Digital', 'BCG X'],
    'Energy': ['Schneider Electric', 'Siemens Energy', 'GE Vernova', 'Enel'],
    'Agriculture & Food': ['Cargill', 'ADM', 'John Deere', 'Bayer Crop Science'],
    'Real Estate': ['CoStar', 'Zillow', 'Compass', 'Redfin'],
    'Legal Services': ['Thomson Reuters', 'LexisNexis', 'Clio', 'Aderant'],
    'Logistics & Transportation': ['DHL', 'FedEx', 'Maersk', 'XPO Logistics'],
  };

  return (competitors[industry] || ['Various regional competitors']).filter(c => c !== companyName);
}

// ============================================================
// Exported helpers for use in other enrichment modules
// ============================================================

export { inferIndustryFromName, INDUSTRY_TECH_STACKS, INDUSTRY_DEAL_SIZES, INDUSTRY_SALES_CYCLES, INDUSTRY_BUSINESS_MODELS, INDUSTRY_DIGITAL_MATURITY };
