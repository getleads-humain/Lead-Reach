/**
 * Enrichment Orchestrator — LeadReach
 * ==================================================
 *
 * Inspired by Relevance AI's AI Workforce pattern.
 * Coordinates all 9 enrichment capabilities as a multi-agent
 * pipeline that processes leads through:
 *
 *   1. Data Gathering → Web research + field inference
 *   2. BANT Analysis → Budget, Authority, Need, Timeline
 *   3. Deep Scoring → 5-dimension lead qualification
 *   4. Predictive Analytics → Conversion + Deal size prediction
 *   5. Behavioral Profiling → Engagement mapping
 *   6. Intelligence → Alerts + Risk assessment
 *   7. Action Planning → Next steps recommendation
 *   8. Company Research → Deep competitive analysis
 *   9. Synthesis → Unified lead intelligence summary
 *
 * Each step is designed to:
 *   - Always produce meaningful results (never empty/null)
 *   - Use LLM when available, fall back to rich heuristics
 *   - Persist results to the lead record
 *   - Cache results for instant re-access
 *   - Run sequentially with rate-limit awareness
 */

import { db } from '@/lib/db';
import { callLLM, callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';
import { cacheCapabilityResult, getCapabilityResult, invalidateLeadCache } from './cache';
import { generateCompanyIntelligence, inferIndustryFromName, INDUSTRY_DEAL_SIZES, INDUSTRY_TECH_STACKS } from './company-intel';

// ============================================================
// Types
// ============================================================

export type EnrichmentCapability =
  | 'bant'
  | 'web_enrich'
  | 'ai_score'
  | 'next_action'
  | 'predict_conversion'
  | 'predict_deal'
  | 'behavioral_profile'
  | 'generate_alerts'
  | 'research_company';

export interface EnrichmentStepResult {
  capability: EnrichmentCapability;
  status: 'completed' | 'failed' | 'skipped' | 'cached';
  result: unknown;
  durationMs: number;
  modelUsed?: string;
  fieldsUpdated?: string[];
  cached?: boolean;
}

export interface EnrichmentOrchestrationResult {
  leadId: string;
  steps: EnrichmentStepResult[];
  totalDurationMs: number;
  fieldsEnriched: string[];
  overallStatus: 'success' | 'partial' | 'failed';
  updatedLead: Record<string, unknown>;
}

// ============================================================
// Enrichment Pipeline Configuration
// ============================================================

/**
 * Pipeline execution order — earlier steps provide data for later steps.
 * Steps marked 'parallel' can run concurrently.
 */
const PIPELINE_ORDER: EnrichmentCapability[] = [
  'web_enrich',       // 1. Fill missing data first (provides context for everything else)
  'bant',             // 2. BANT analysis (uses enriched data)
  'ai_score',         // 3. Score based on enriched + BANT data
  'research_company', // 4. Deep company research (uses all enriched context)
  'predict_conversion', // 5. Predict conversion (uses score + profile)
  'predict_deal',     // 6. Predict deal size (uses score + company data)
  'behavioral_profile', // 7. Build behavioral profile
  'generate_alerts',  // 8. Generate alerts from all signals
  'next_action',      // 9. Recommend next action (uses ALL above)
];

// ============================================================
// Individual Enrichment Processors
// ============================================================

/**
 * 1. BANT Enrichment — Infer Budget, Authority, Need, Timeline signals
 */
export async function processBANT(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { capability: 'bant', status: 'failed', result: null, durationMs: Date.now() - start };

    // Check cache
    const cached = getCapabilityResult(leadId, 'bant', {
      companyName: lead.companyName,
      industry: lead.industry,
      employeeCount: lead.employeeCount,
      revenueEstimate: lead.revenueEstimate,
      leadScore: lead.leadScore,
    });
    if (cached) {
      return { capability: 'bant', status: 'cached', result: cached, durationMs: Date.now() - start, cached: true };
    }

    const inferredIndustry = lead.industry || inferIndustryFromName(lead.companyName || '');
    const isLargeCompany = /201-500|501-1000|1001-5000|5000+/.test(lead.employeeCount || '');

    // Build rich heuristic BANT first
    const heuristicResult = buildRichBANT(lead, inferredIndustry);

    // Try LLM enhancement
    let result = heuristicResult;

    try {
      const systemPrompt = `You are a senior B2B sales intelligence analyst specializing in BANT qualification. Analyze the given lead and produce detailed BANT attributes with specific evidence. Be SPECIFIC — reference the company name, industry, and any available data. Never return "unknown" — always infer from context. Return ONLY valid JSON.`;

      const userPrompt = `Analyze this lead's BANT attributes:

COMPANY: ${lead.companyName}
INDUSTRY: ${inferredIndustry}
WEBSITE: ${lead.website || 'Not available'}
EMPLOYEES: ${lead.employeeCount || 'Not disclosed'}
REVENUE: ${lead.revenueEstimate || 'Not disclosed'}
CITY: ${lead.city || 'Unknown'}, ${lead.stateProvince || ''} ${lead.country || ''}
KEY CONTACT: ${lead.keyContactName || 'Not identified'}${lead.keyContactTitle ? ` (${lead.keyContactTitle})` : ''}
CEO: ${lead.ceoName || 'Not identified'}
TECH STACK: ${lead.techStack || 'Not disclosed'}
CURRENT SCORE: ${lead.leadScore}/100
STAGE: ${lead.stage}
TIER: ${lead.leadTier}

Return JSON:
{
  "bant": {
    "budget": { "level": "low|medium|high", "evidence": "1-2 sentences with specific reasoning", "confidence": 0.0-1.0, "estimatedBudget": "approximate annual budget range" },
    "authority": { "level": "decision-maker|influencer|end-user|unknown", "evidence": "1-2 sentences", "confidence": 0.0-1.0, "approachStrategy": "how to reach the decision-maker" },
    "need": { "level": "low|medium|high", "evidence": "1-2 sentences", "confidence": 0.0-1.0, "painPoint": "primary pain point hypothesis", "urgency": "why they might need this now" },
    "timeline": { "level": "immediate|quarter|6months|exploratory", "evidence": "1-2 sentences", "confidence": 0.0-1.0, "triggerEvent": "what might accelerate their timeline" }
  },
  "inferredFields": { "field": "value" for any null fields you can infer },
  "talkingPoints": ["3-5 specific conversation hooks referencing THIS company"],
  "suggestedApproach": "2-3 sentence recommended outreach approach mentioning ${lead.companyName}",
  "riskFactors": ["2-3 specific risks"],
  "opportunitySignals": ["2-3 specific opportunities"]
}`;

      const llmResult = await callLLMForJSON<{
        bant?: Record<string, any>;
        inferredFields?: Record<string, unknown>;
        talkingPoints?: string[];
        suggestedApproach?: string;
        riskFactors?: string[];
        opportunitySignals?: string[];
      }>(systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: 3000,
        model: MODEL_PRIMARY,
        thinkingBudget: 'standard',
      });

      if (llmResult && llmResult.bant) {
        // Merge LLM result with heuristic — LLM takes precedence
        result = {
          bant: {
            budget: (llmResult.bant.budget?.level && llmResult.bant.budget.level !== 'unknown')
              ? llmResult.bant.budget : heuristicResult.bant.budget,
            authority: (llmResult.bant.authority?.level && llmResult.bant.authority.level !== 'unknown')
              ? llmResult.bant.authority : heuristicResult.bant.authority,
            need: (llmResult.bant.need?.level && llmResult.bant.need.level !== 'unknown')
              ? llmResult.bant.need : heuristicResult.bant.need,
            timeline: (llmResult.bant.timeline?.level && llmResult.bant.timeline.level !== 'unknown')
              ? llmResult.bant.timeline : heuristicResult.bant.timeline,
          },
          inferredFields: { ...heuristicResult.inferredFields, ...(llmResult.inferredFields || {}) },
          talkingPoints: llmResult.talkingPoints?.length ? llmResult.talkingPoints : heuristicResult.talkingPoints,
          suggestedApproach: llmResult.suggestedApproach || heuristicResult.suggestedApproach,
          riskFactors: llmResult.riskFactors?.length ? llmResult.riskFactors : heuristicResult.riskFactors,
          opportunitySignals: llmResult.opportunitySignals?.length ? llmResult.opportunitySignals : heuristicResult.opportunitySignals,
        };
      }
    } catch (llmErr) {
      console.warn('[orchestrator] BANT LLM failed, using rich heuristic:', llmErr);
    }

    // Persist inferred fields
    const fieldsUpdated: string[] = [];
    const updateData: Record<string, unknown> = { enrichedAt: new Date() };
    if (lead.stage === 'new') updateData.stage = 'enriched';

    if (result.inferredFields) {
      for (const [key, value] of Object.entries(result.inferredFields)) {
        if (value !== null && value !== undefined && value !== '' && !(lead as Record<string, unknown>)[key]) {
          updateData[key] = value;
          fieldsUpdated.push(key);
        }
      }
    }

    await db.lead.update({ where: { id: leadId }, data: updateData });

    // Cache the result
    cacheCapabilityResult(leadId, 'bant', result, {
      companyName: lead.companyName,
      industry: lead.industry,
      employeeCount: lead.employeeCount,
      revenueEstimate: lead.revenueEstimate,
      leadScore: lead.leadScore,
    });

    return { capability: 'bant', status: 'completed', result, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY, fieldsUpdated };
  } catch (err) {
    console.error('[orchestrator] BANT failed:', err);
    return { capability: 'bant', status: 'failed', result: null, durationMs: Date.now() - start };
  }
}

/**
 * 2. Web Data Enrichment — Search web & fill missing lead fields
 */
export async function processWebEnrich(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { capability: 'web_enrich', status: 'failed', result: null, durationMs: Date.now() - start };

    // Find empty fields
    const fillableFields = [
      'industry', 'subIndustry', 'website', 'hqAddress', 'city', 'stateProvince',
      'country', 'phoneMain', 'generalEmail', 'ceoName', 'keyContactName',
      'keyContactTitle', 'employeeCount', 'revenueEstimate', 'foundingYear',
      'ownershipType', 'linkedinUrl', 'techStack', 'sicCode', 'naicsCode',
    ];

    const emptyFields = fillableFields.filter(field => !(lead as Record<string, unknown>)[field]);

    // Gather web data via z-ai-web-dev-sdk
    let webData = '';
    let webDataFound = false;
    try {
      const zai = await (await import('z-ai-web-dev-sdk')).default.create();
      const searchQuery = `${lead.companyName} ${lead.industry || ''} company information revenue employees contact`;
      const searchResults = await zai.functions.invoke('web_search', {
        query: searchQuery.slice(0, 200),
        num: 5,
      });

      if (Array.isArray(searchResults) && searchResults.length > 0) {
        webData = searchResults
          .slice(0, 4)
          .map((r: { name?: string; snippet?: string }) => `${r.name || ''}: ${r.snippet || ''}`)
          .join('\n');
        webDataFound = true;
      }

      // Try to read company website
      if (lead.website) {
        try {
          const webReadResult = await zai.functions.invoke('page_reader', { url: lead.website }) as { content?: string } | null;
          if (webReadResult && typeof webReadResult === 'object' && 'content' in webReadResult) {
            webData += '\n' + (webReadResult as { content: string }).content.slice(0, 3000);
          }
        } catch { /* Website read failed */ }
      }
    } catch { /* Web search unavailable */ }

    // Build enrichment prompt
    const contextSection = webData
      ? `WEB RESEARCH DATA:\n${webData}\n\nUse the above web research data to fill fields accurately.`
      : `No web data was available. Use the company name "${lead.companyName}", website domain "${lead.website || 'N/A'}", and your training knowledge to make reasonable inferences.`;

    const fieldsToFill = emptyFields.length > 0 ? emptyFields : ['industry', 'subIndustry', 'employeeCount', 'revenueEstimate', 'techStack'];

    const inferredIndustry = lead.industry || inferIndustryFromName(lead.companyName || '');

    let enrichedData: Record<string, unknown> = {};

    try {
      const enriched = await callLLMForJSON<Record<string, unknown>>(
        `You are a B2B data enrichment specialist. Fill in missing company fields with accurate, specific data. Use web research data if provided, otherwise use your training knowledge. Return ONLY a valid JSON object. Never return null — always provide your best estimate.`,
        `COMPANY: ${lead.companyName}
INDUSTRY: ${inferredIndustry}
WEBSITE: ${lead.website || 'Unknown'}
CITY: ${lead.city || 'Unknown'}
COUNTRY: ${lead.country || 'Unknown'}
EMPLOYEES: ${lead.employeeCount || 'Unknown'}
REVENUE: ${lead.revenueEstimate || 'Unknown'}
TECH STACK: ${lead.techStack || 'Unknown'}
CEO: ${lead.ceoName || 'Unknown'}
KEY CONTACT: ${lead.keyContactName || 'Unknown'}

${contextSection}

FIELDS TO FILL:
${fieldsToFill.join(', ')}

IMPORTANT RULES:
1. For "industry" — be specific (e.g., "SaaS", "FinTech", "HealthTech" not just "Technology")
2. For "employeeCount" — use range format (e.g., "51-200", "201-500")
3. For "revenueEstimate" — use range format (e.g., "$10M-$50M", "$100M-$500M")
4. For "techStack" — list 5-8 likely technologies separated by commas
5. For "foundingYear" — provide your best estimate as a 4-digit year
6. Never return null — always provide reasonable estimates`,
        { temperature: 0.2, maxTokens: 3000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );

      if (enriched) enrichedData = enriched;
    } catch (llmErr) {
      console.warn('[orchestrator] Web enrich LLM failed, using heuristics:', llmErr);
      // Fill with rich heuristics
      if (!lead.industry) enrichedData.industry = inferredIndustry;
      if (!lead.subIndustry) enrichedData.subIndustry = inferredIndustry;
      if (!lead.employeeCount) enrichedData.employeeCount = inferCompanySize(lead.companyName || '', inferredIndustry);
      if (!lead.revenueEstimate) enrichedData.revenueEstimate = inferRevenue(lead.employeeCount || enrichedData.employeeCount as string);
      if (!lead.techStack) enrichedData.techStack = (INDUSTRY_TECH_STACKS[inferredIndustry] || INDUSTRY_TECH_STACKS['Business Services']).slice(0, 6).join(', ');
      if (!lead.ownershipType) enrichedData.ownershipType = 'Private';
    }

    // Persist enriched fields
    const updateData: Record<string, unknown> = { enrichedAt: new Date() };
    if (lead.stage === 'new') updateData.stage = 'enriched';

    const fieldsUpdated: string[] = [];
    for (const [key, value] of Object.entries(enrichedData)) {
      if (value !== null && value !== undefined && value !== '' && emptyFields.includes(key)) {
        updateData[key] = value;
        fieldsUpdated.push(key);
      }
    }

    if (fieldsUpdated.length > 0) {
      await db.lead.update({ where: { id: leadId }, data: updateData });
    } else {
      await db.lead.update({ where: { id: leadId }, data: { enrichedAt: new Date() } });
    }

    const updatedLead = await db.lead.findUnique({ where: { id: leadId } });

    const result = {
      lead: updatedLead ? JSON.parse(JSON.stringify(updatedLead)) : JSON.parse(JSON.stringify(lead)),
      fieldsEnriched: fieldsUpdated,
      dataPointsFound: fieldsUpdated.length,
      webDataFound,
    };

    return { capability: 'web_enrich', status: 'completed', result, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY, fieldsUpdated };
  } catch (err) {
    console.error('[orchestrator] Web enrich failed:', err);
    return { capability: 'web_enrich', status: 'failed', result: null, durationMs: Date.now() - start };
  }
}

/**
 * 3. AI Deep Scoring — 5-dimension scoring with risk analysis
 */
export async function processAIScoring(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        campaign: { select: { name: true, targetIndustry: true, targetLocation: true, targetCompanySize: true } },
        outreach: { take: 10, orderBy: { createdAt: 'desc' }, select: { channel: true, type: true, status: true, createdAt: true } },
      },
    });
    if (!lead) return { capability: 'ai_score', status: 'failed', result: null, durationMs: Date.now() - start };

    // Check cache
    const cached = getCapabilityResult(leadId, 'ai_score', { leadScore: lead.leadScore, stage: lead.stage });
    if (cached) {
      return { capability: 'ai_score', status: 'cached', result: cached, durationMs: Date.now() - start, cached: true };
    }

    const inferredIndustry = lead.industry || inferIndustryFromName(lead.companyName || '');
    const isLargeCompany = /201-500|501-1000|1001-5000|5000+/.test(lead.employeeCount || '');
    const hasWebsite = !!lead.website;
    const hasContact = !!lead.keyContactName;
    const hasEmail = !!(lead.keyContactEmail || lead.generalEmail);
    const hasTechStack = !!lead.techStack;

    // Rich heuristic scoring
    let firmographicScore = 35;
    if (['Technology', 'Finance', 'Healthcare', 'SaaS', 'AI'].some(i => inferredIndustry.toLowerCase().includes(i.toLowerCase()))) firmographicScore += 20;
    if (isLargeCompany) firmographicScore += 15;
    if (hasWebsite) firmographicScore += 10;
    firmographicScore = Math.min(100, firmographicScore);

    let technographicScore = 25;
    if (hasTechStack) technographicScore += 25;
    if (hasWebsite) technographicScore += 15;
    if (lead.linkedinUrl) technographicScore += 10;
    technographicScore = Math.min(100, technographicScore);

    const stageScores: Record<string, number> = { new: 25, enriched: 35, qualified: 50, contacted: 60, engaged: 72, negotiating: 85, closed_won: 95, nurture: 30 };
    let behavioralScore = stageScores[lead.stage] || 35;
    if (lead.lastContactDate) behavioralScore += 8;
    behavioralScore = Math.min(100, behavioralScore);

    let situationalScore = 30;
    if (lead.country) situationalScore += 10;
    if (lead.city) situationalScore += 5;
    if (inferredIndustry) situationalScore += 10;
    situationalScore = Math.min(100, situationalScore);

    let economicScore = 25;
    if (isLargeCompany) economicScore += 25;
    if (lead.employeeCount) economicScore += 10;
    if (lead.revenueEstimate) economicScore += 15;
    economicScore = Math.min(100, economicScore);

    const heuristicScoring = {
      overallScore: Math.round(firmographicScore * 0.25 + technographicScore * 0.15 + behavioralScore * 0.30 + situationalScore * 0.15 + economicScore * 0.15),
      tier: '' as string,
      confidence: 0.55,
      dimensions: {
        firmographic: { score: firmographicScore, rationale: `${lead.companyName} operates in ${inferredIndustry}${lead.country ? ` based in ${lead.country}` : ''}. ${lead.employeeCount ? `Estimated ${lead.employeeCount} employees.` : 'Employee count unknown.'} ${hasWebsite ? 'Has web presence.' : 'No website on file.'}` },
        technographic: { score: technographicScore, rationale: `${hasTechStack ? `Tech stack includes: ${String(lead.techStack).slice(0, 100)}` : 'No tech stack data available — inferred from industry patterns.'} ${hasWebsite ? `Website: ${lead.website}` : ''}` },
        behavioral: { score: behavioralScore, rationale: `Lead is in "${lead.stage}" stage. ${lead.lastContactDate ? `Last contacted on ${new Date(lead.lastContactDate).toLocaleDateString()}.` : 'No contact history yet.'}` },
        situational: { score: situationalScore, rationale: `${lead.country ? `Located in ${lead.country}` : 'Location unknown'}, operating in ${inferredIndustry}. ${lead.stage === 'new' ? 'Freshly discovered with enrichment potential.' : `Currently in ${lead.stage} stage.`}` },
        economic: { score: economicScore, rationale: `${lead.revenueEstimate ? `Revenue: ${lead.revenueEstimate}` : 'No revenue data.'} ${lead.employeeCount ? `${lead.employeeCount} employees.` : 'Company size unknown.'}` },
      },
      signals: {
        positive: [
          `${inferredIndustry} sector is a strong ICP match`,
          ...(hasWebsite ? [`${lead.companyName} has a web presence`] : []),
          ...(lead.stage !== 'new' ? ['Lead has been enriched with additional data'] : []),
        ].filter(Boolean),
        negative: [
          ...(!hasContact ? ['No key contact identified'] : []),
          ...(!hasEmail ? ['No email address on file'] : []),
          ...(!lead.phoneMain ? ['No phone number available'] : []),
        ],
        missing: [
          ...(!hasTechStack ? ['Tech stack data'] : []),
          ...(!lead.revenueEstimate ? ['Revenue information'] : []),
          ...(!lead.keyContactEmail ? ['Decision-maker email'] : []),
        ],
      },
      recommendedActions: [
        `Research ${lead.companyName}'s recent news and trigger events`,
        `Identify the key decision-maker in ${inferredIndustry}${lead.keyContactName ? ` (currently: ${lead.keyContactName})` : ''}`,
        `Send personalized outreach referencing their ${inferredIndustry} context`,
      ],
      riskFactors: [
        'Limited firmographic data — some scores are inferred',
        ...(lead.stage === 'new' ? ['New lead — no engagement history'] : []),
        ...(!hasEmail ? ['No verified contact channel'] : []),
      ],
      nextBestChannel: hasEmail ? 'email' : lead.linkedinUrl ? 'linkedin' : 'email',
      outreachAngle: `Reference ${lead.companyName}'s position in ${inferredIndustry} and offer a quick discovery call.`,
    };
    heuristicScoring.tier = heuristicScoring.overallScore >= 65 ? 'hot' : heuristicScoring.overallScore >= 40 ? 'warm' : 'cold';

    // Try LLM enhancement
    let scoring = heuristicScoring;

    try {
      const leadSnapshot = {
        company: { name: lead.companyName, industry: inferredIndustry, website: lead.website, location: { city: lead.city, country: lead.country }, employeeCount: lead.employeeCount, revenueEstimate: lead.revenueEstimate, techStack: lead.techStack },
        contact: { name: lead.keyContactName, title: lead.keyContactTitle, email: lead.keyContactEmail },
        currentStage: lead.stage, currentScore: lead.leadScore, currentTier: lead.leadTier,
        outreachHistory: lead.outreach?.map(o => ({ channel: o.channel, status: o.status, when: o.createdAt })),
      };

      const llmScoring = await callLLMForJSON<{
        overallScore?: number; tier?: string; confidence?: number;
        dimensions?: Record<string, { score: number; rationale: string }>;
        signals?: { positive: string[]; negative: string[]; missing: string[] };
        recommendedActions?: string[]; riskFactors?: string[];
        nextBestChannel?: string; outreachAngle?: string;
      }>(
        `You are a senior B2B lead qualification expert. Score this lead across 5 dimensions. NEVER score any dimension as 0 — use minimum 15. Return ONLY valid JSON.`,
        `LEAD SNAPSHOT:\n${JSON.stringify(leadSnapshot, null, 2)}\n\nScore this lead now. Never return 0 for any dimension.`,
        { temperature: 0.3, maxTokens: 3000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );

      if (llmScoring && llmScoring.overallScore && llmScoring.overallScore > 0) {
        scoring = {
          overallScore: Math.max(llmScoring.overallScore, 15),
          tier: ['hot', 'warm', 'cold'].includes(llmScoring.tier || '') ? llmScoring.tier! : heuristicScoring.tier,
          confidence: llmScoring.confidence || heuristicScoring.confidence,
          dimensions: Object.fromEntries(
            Object.entries(llmScoring.dimensions || {}).map(([key, val]) => [key, { score: Math.max(val.score || 30, 15), rationale: val.rationale || heuristicScoring.dimensions[key as keyof typeof heuristicScoring.dimensions]?.rationale || 'Based on available data.' }])
          ),
          signals: llmScoring.signals?.positive?.length ? llmScoring.signals : heuristicScoring.signals,
          recommendedActions: llmScoring.recommendedActions?.length ? llmScoring.recommendedActions : heuristicScoring.recommendedActions,
          riskFactors: llmScoring.riskFactors?.length ? llmScoring.riskFactors : heuristicScoring.riskFactors,
          nextBestChannel: llmScoring.nextBestChannel || heuristicScoring.nextBestChannel,
          outreachAngle: llmScoring.outreachAngle || heuristicScoring.outreachAngle,
        };
      }
    } catch (llmErr) {
      console.warn('[orchestrator] AI scoring LLM failed, using heuristics:', llmErr);
    }

    // Persist scores
    const fieldsUpdated: string[] = [];
    const completeness = computeDataCompleteness(lead);

    await db.lead.update({
      where: { id: leadId },
      data: {
        leadScore: scoring.overallScore,
        leadTier: scoring.tier as 'hot' | 'warm' | 'cold',
        firmographicScore: scoring.dimensions?.firmographic?.score ?? lead.firmographicScore,
        intentScore: Math.max(scoring.dimensions?.behavioral?.score ?? 0, scoring.dimensions?.situational?.score ?? 0),
        reachabilityScore: scoring.dimensions?.technographic?.score ?? lead.reachabilityScore,
        strategicScore: Math.max(scoring.dimensions?.economic?.score ?? 0, scoring.dimensions?.situational?.score ?? 0),
        dataCompleteness: completeness,
        stage: lead.stage === 'new' ? 'enriched' : lead.stage,
      },
    });
    fieldsUpdated.push('leadScore', 'leadTier', 'firmographicScore', 'intentScore', 'reachabilityScore', 'strategicScore', 'dataCompleteness');

    // Cache
    cacheCapabilityResult(leadId, 'ai_score', scoring, { leadScore: lead.leadScore, stage: lead.stage });

    return { capability: 'ai_score', status: 'completed', result: scoring, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY, fieldsUpdated };
  } catch (err) {
    console.error('[orchestrator] AI scoring failed:', err);
    return { capability: 'ai_score', status: 'failed', result: null, durationMs: Date.now() - start };
  }
}

/**
 * 4. Next Action Advisor
 */
export async function processNextAction(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { capability: 'next_action', status: 'failed', result: null, durationMs: Date.now() - start };

    const inferredIndustry = lead.industry || inferIndustryFromName(lead.companyName || '');
    const hasEmail = !!(lead.keyContactEmail || lead.generalEmail);

    // Rich heuristic action
    const heuristicAction = buildRichNextAction(lead, inferredIndustry);

    // Try LLM
    let result = heuristicAction;

    try {
      const llmResult = await callLLMForJSON<{
        action?: string; channel?: string; timing?: string; message?: string;
        rationale?: string; priority?: string; expectedOutcome?: string; fallbackAction?: string;
      }>(
        `You are a senior B2B sales cadence expert. Given a lead's full context, recommend the single best next action. Be specific and actionable. Return ONLY valid JSON.`,
        `COMPANY: ${lead.companyName}
INDUSTRY: ${inferredIndustry}
EMPLOYEES: ${lead.employeeCount || 'Unknown'}
KEY CONTACT: ${lead.keyContactName || 'Unknown'}${lead.keyContactTitle ? ` (${lead.keyContactTitle})` : ''}
SCORE: ${lead.leadScore}/100 | TIER: ${lead.leadTier} | STAGE: ${lead.stage}
FIRM: ${lead.firmographicScore}/100 | INTENT: ${lead.intentScore}/100 | REACH: ${lead.reachabilityScore}/100 | STRATEGIC: ${lead.strategicScore}/100

Return JSON: { "action": "specific action for ${lead.companyName}", "channel": "email|linkedin|phone|sms", "timing": "today|this-week|next-week", "message": "2-3 sentence personalized message mentioning ${lead.companyName}", "rationale": "why this is the right move NOW", "priority": "critical|high|medium|low", "expectedOutcome": "what happens if this succeeds", "fallbackAction": "alternative if primary fails" }`,
        { temperature: 0.4, maxTokens: 1500, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );

      if (llmResult && llmResult.action && !['Follow up', 'Follow up via email'].includes(llmResult.action)) {
        result = llmResult;
      }
    } catch (llmErr) {
      console.warn('[orchestrator] Next action LLM failed, using heuristics:', llmErr);
    }

    // Persist to notes
    try {
      const actionNote = [
        `Recommended: ${result.action}`,
        `Channel: ${result.channel} | Timing: ${result.timing}`,
        `Priority: ${result.priority}`,
        `Message: ${result.message}`,
        `Rationale: ${result.rationale}`,
      ].join('\n');
      const existing = (lead.notes as string) || '';
      const block = `\n\n[AI Next Action — ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}]\n${actionNote}`;
      await db.lead.update({ where: { id: leadId }, data: { notes: (existing + block).trim() } });
    } catch { /* persist failed */ }

    cacheCapabilityResult(leadId, 'next_action', result, { leadScore: lead.leadScore, stage: lead.stage });

    return { capability: 'next_action', status: 'completed', result, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY };
  } catch (err) {
    console.error('[orchestrator] Next action failed:', err);
    return { capability: 'next_action', status: 'failed', result: null, durationMs: Date.now() - start };
  }
}

/**
 * 5. Conversion Predictor
 */
export async function processConversionPrediction(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { capability: 'predict_conversion', status: 'failed', result: null, durationMs: Date.now() - start };

    const cached = getCapabilityResult(leadId, 'predict_conversion', { leadScore: lead.leadScore, stage: lead.stage });
    if (cached) return { capability: 'predict_conversion', status: 'cached', result: cached, durationMs: Date.now() - start, cached: true };

    const inferredIndustry = lead.industry || inferIndustryFromName(lead.companyName || '');
    const isLargeCompany = /201-500|501-1000|1001-5000|5000+/.test(lead.employeeCount || '');

    // Heuristic conversion prediction
    let prob = 0.10;
    const stageMultiplier: Record<string, number> = { new: 0.08, enriched: 0.12, qualified: 0.20, contacted: 0.28, engaged: 0.42, negotiating: 0.62, closed_won: 0.95, nurture: 0.05 };
    prob += (stageMultiplier[lead.stage] || 0.15) * 0.4;
    if (isLargeCompany) prob += 0.05;
    if (lead.keyContactEmail) prob += 0.05;
    if (lead.keyContactName) prob += 0.03;
    if (['Technology', 'Finance', 'Healthcare'].some(i => inferredIndustry.includes(i))) prob += 0.05;
    prob = Math.min(0.85, Math.max(0.05, prob));

    const dealConfig = INDUSTRY_DEAL_SIZES[inferredIndustry] || INDUSTRY_DEAL_SIZES['Business Services'];
    const baseDeal = isLargeCompany ? dealConfig.range[1] * 0.3 : dealConfig.base;

    const heuristicPrediction = {
      conversionProbability: Math.round(prob * 100) / 100,
      estimatedDealSize: Math.round(baseDeal),
      estimatedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confidenceLevel: Math.round((0.35 + prob * 0.5) * 100) / 100,
      keyFactors: [
        { factor: 'Pipeline stage', impact: prob > 0.2 ? 'positive' as const : 'neutral' as const, weight: 0.30, description: `Lead in "${lead.stage}" stage` },
        { factor: 'Industry fit', impact: 'positive' as const, weight: 0.25, description: `${inferredIndustry} sector shows strong demand` },
        { factor: 'Contact availability', impact: lead.keyContactName ? 'positive' as const : 'negative' as const, weight: 0.20, description: lead.keyContactName ? `Contact: ${lead.keyContactName}` : 'No contact identified' },
      ],
      riskFactors: [
        'Limited engagement history',
        ...(lead.keyContactEmail ? [] : ['No verified email for outreach']),
      ],
    };

    // Try LLM
    let prediction = heuristicPrediction;

    try {
      const llmResult = await callLLMForJSON<{
        conversionProbability?: number; estimatedDealSize?: number;
        estimatedCloseDate?: string; confidenceLevel?: number;
        keyFactors?: Array<{ factor: string; impact: string; weight: number; description: string }>;
        riskFactors?: string[];
      }>(
        `You are an expert B2B sales forecasting model. Predict conversion probability and deal size. Return ONLY valid JSON.`,
        `LEAD: ${lead.companyName} | Industry: ${inferredIndustry} | Employees: ${lead.employeeCount || 'Unknown'} | Revenue: ${lead.revenueEstimate || 'Unknown'} | Score: ${lead.leadScore}/100 | Stage: ${lead.stage} | Contact: ${lead.keyContactName || 'Unknown'} | Email: ${lead.keyContactEmail || 'None'} | Website: ${lead.website || 'None'}

Return: { "conversionProbability": 0.0-1.0, "estimatedDealSize": number, "estimatedCloseDate": "YYYY-MM-DD", "confidenceLevel": 0.0-1.0, "keyFactors": [{"factor":"string","impact":"positive|negative|neutral","weight":0.0-1.0,"description":"string"}], "riskFactors": ["string"] }`,
        { temperature: 0.3, maxTokens: 2000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );

      if (llmResult && typeof llmResult.conversionProbability === 'number' && llmResult.conversionProbability > 0) {
        prediction = {
          conversionProbability: Math.min(0.95, Math.max(0.02, llmResult.conversionProbability)),
          estimatedDealSize: Math.max(1000, llmResult.estimatedDealSize || heuristicPrediction.estimatedDealSize),
          estimatedCloseDate: llmResult.estimatedCloseDate || heuristicPrediction.estimatedCloseDate,
          confidenceLevel: Math.min(0.95, Math.max(0.15, llmResult.confidenceLevel || heuristicPrediction.confidenceLevel)),
          keyFactors: Array.isArray(llmResult.keyFactors) && llmResult.keyFactors.length > 0
            ? llmResult.keyFactors.slice(0, 6).map((f: any) => ({
                factor: String(f.factor || 'Unknown'),
                impact: (['positive', 'negative', 'neutral'].includes(f.impact) ? f.impact : 'neutral') as 'positive' | 'negative' | 'neutral',
                weight: Math.min(1, Math.max(0, Number(f.weight) || 0.5)),
                description: String(f.description || ''),
              }))
            : heuristicPrediction.keyFactors,
          riskFactors: Array.isArray(llmResult.riskFactors) && llmResult.riskFactors.length > 0
            ? llmResult.riskFactors.map(String) : heuristicPrediction.riskFactors,
        };
      }
    } catch (llmErr) {
      console.warn('[orchestrator] Conversion prediction LLM failed:', llmErr);
    }

    // Persist
    try {
      const newStrategicScore = Math.round(prediction.conversionProbability * 100);
      if (newStrategicScore > (lead.strategicScore || 0)) {
        await db.lead.update({ where: { id: leadId }, data: { strategicScore: newStrategicScore } });
      }
    } catch { /* persist failed */ }

    cacheCapabilityResult(leadId, 'predict_conversion', prediction, { leadScore: lead.leadScore, stage: lead.stage });

    return { capability: 'predict_conversion', status: 'completed', result: prediction, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY, fieldsUpdated: ['strategicScore'] };
  } catch (err) {
    console.error('[orchestrator] Conversion prediction failed:', err);
    return { capability: 'predict_conversion', status: 'failed', result: null, durationMs: Date.now() - start };
  }
}

/**
 * 6. Deal Size Predictor
 */
export async function processDealSize(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { capability: 'predict_deal', status: 'failed', result: null, durationMs: Date.now() - start };

    const inferredIndustry = lead.industry || inferIndustryFromName(lead.companyName || '');
    const isLargeCompany = /201-500|501-1000|1001-5000|5000+/.test(lead.employeeCount || '');

    const dealConfig = INDUSTRY_DEAL_SIZES[inferredIndustry] || INDUSTRY_DEAL_SIZES['Business Services'];
    let baseDeal = isLargeCompany ? dealConfig.range[1] * 0.3 : dealConfig.base;

    // Try LLM
    let dealSize = Math.round(baseDeal);
    let reasoning = `Based on ${lead.employeeCount || 'unknown'} employees in ${inferredIndustry}`;

    try {
      const llmResult = await callLLMForJSON<{ estimatedDealSize: number; reasoning: string }>(
        `You are a B2B deal sizing expert. Estimate the likely deal size. Return ONLY a JSON object.`,
        `COMPANY: ${lead.companyName} | Industry: ${inferredIndustry} | Employees: ${lead.employeeCount || 'Unknown'} | Revenue: ${lead.revenueEstimate || 'Unknown'} | Stage: ${lead.stage} | Score: ${lead.leadScore}/100`,
        { temperature: 0.3, maxTokens: 500, model: MODEL_PRIMARY, thinkingBudget: 'quick' }
      );

      if (llmResult && typeof llmResult.estimatedDealSize === 'number' && llmResult.estimatedDealSize > 0) {
        dealSize = Math.round(llmResult.estimatedDealSize);
        reasoning = llmResult.reasoning || reasoning;
      }
    } catch { /* use heuristic */ }

    const result = { dealSize, reasoning, industry: inferredIndustry, dealRange: dealConfig.range };

    // Persist
    try {
      const strategicBoost = dealSize >= 100000 ? 80 : dealSize >= 50000 ? 65 : dealSize >= 20000 ? 50 : 35;
      if (strategicBoost > (lead.strategicScore || 0)) {
        await db.lead.update({ where: { id: leadId }, data: { strategicScore: strategicBoost } });
      }
    } catch { /* persist failed */ }

    return { capability: 'predict_deal', status: 'completed', result, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY };
  } catch (err) {
    console.error('[orchestrator] Deal size prediction failed:', err);
    return { capability: 'predict_deal', status: 'failed', result: null, durationMs: Date.now() - start };
  }
}

/**
 * 7. Behavioral Profile
 */
export async function processBehavioralProfile(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { capability: 'behavioral_profile', status: 'failed', result: null, durationMs: Date.now() - start };

    const inferredIndustry = lead.industry || inferIndustryFromName(lead.companyName || '');

    // Build contextual profile from lead data (always produces results)
    const stageEngagement: Record<string, string> = {
      new: 'cold', enriched: 'cold', qualified: 'moderately_engaged',
      contacted: 'moderately_engaged', engaged: 'engaged', negotiating: 'highly_engaged',
      closed_won: 'highly_engaged', closed_lost: 'cold', nurture: 'dormant',
    };

    const industryInterests: Record<string, string[]> = {
      'Technology': ['Sales Automation', 'Lead Qualification', 'Pipeline Analytics', 'CRM Integration'],
      'Finance': ['Compliance', 'Risk Assessment', 'Client Acquisition', 'Regulatory Reporting'],
      'Healthcare': ['Patient Acquisition', 'Compliance', 'Multi-stakeholder Sales', 'Data Security'],
      'Manufacturing': ['Supply Chain Optimization', 'B2B Partnerships', 'Operational Efficiency', 'Quality Assurance'],
      'Retail & E-Commerce': ['Customer Acquisition Cost', 'Conversion Optimization', 'Omnichannel Sales', 'Data Analytics'],
      'Business Services': ['Client Acquisition', 'Service Delivery', 'Scalability', 'Pipeline Management'],
    };

    const stageTrend: Record<string, string> = {
      new: 'none', enriched: 'increasing', qualified: 'increasing',
      contacted: 'stable', engaged: 'increasing', negotiating: 'increasing',
      closed_won: 'stable', nurture: 'decreasing',
    };

    const engagementLevel = stageEngagement[lead.stage] || 'cold';
    const intentScoreMap: Record<string, number> = { highly_engaged: 85, engaged: 70, moderately_engaged: 50, dormant: 30, cold: 15 };
    const newIntentScore = intentScoreMap[engagementLevel] || 40;

    // Build timeline from lead dates
    const timeline: Array<{ timestamp: string; eventType: string; summary: string }> = [];
    if (lead.createdAt) timeline.push({ timestamp: new Date(lead.createdAt).toISOString(), eventType: 'discovery', summary: `Lead discovered — ${lead.companyName} added to pipeline` });
    if (lead.enrichedAt) timeline.push({ timestamp: new Date(lead.enrichedAt).toISOString(), eventType: 'enrichment', summary: 'Lead enriched with additional data' });

    const profile = {
      leadId,
      totalEvents: Math.max(timeline.length, 2), // At least 2 events (discovery + current stage)
      recentActivity: stageTrend[lead.stage] || 'none',
      engagementLevel,
      topInterests: industryInterests[inferredIndustry] || ['Sales Pipeline Optimization', 'Lead Generation', 'Business Development'],
      preferredChannels: lead.keyContactEmail ? ['email'] : lead.linkedinUrl ? ['linkedin'] : ['email', 'linkedin'],
      bestContactTime: 'Tuesday 9:00 AM (recommended)',
      activityTimeline: timeline,
    };

    // Try LLM enhancement for interests
    try {
      const llmInterests = await callLLMForJSON<string[]>(
        `You are a B2B sales intelligence analyst. Identify top interests for this company based on industry context. Return ONLY a JSON array of 3-5 interest strings.`,
        `COMPANY: ${lead.companyName} | INDUSTRY: ${inferredIndustry} | EMPLOYEES: ${lead.employeeCount || 'Unknown'} | STAGE: ${lead.stage}`,
        { temperature: 0.3, maxTokens: 300, model: MODEL_PRIMARY, thinkingBudget: 'quick' }
      );
      if (Array.isArray(llmInterests) && llmInterests.length > 0) {
        profile.topInterests = llmInterests.slice(0, 5);
      }
    } catch { /* keep heuristic interests */ }

    // Persist
    try {
      if (newIntentScore > (lead.intentScore || 0)) {
        await db.lead.update({ where: { id: leadId }, data: { intentScore: newIntentScore } });
      }
    } catch { /* persist failed */ }

    cacheCapabilityResult(leadId, 'behavioral_profile', profile, { leadScore: lead.leadScore, stage: lead.stage });

    return { capability: 'behavioral_profile', status: 'completed', result: profile, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY, fieldsUpdated: ['intentScore'] };
  } catch (err) {
    console.error('[orchestrator] Behavioral profile failed:', err);
    return { capability: 'behavioral_profile', status: 'failed', result: null, durationMs: Date.now() - start };
  }
}

/**
 * 8. Intelligence Alerts
 */
export async function processAlerts(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { capability: 'generate_alerts', status: 'failed', result: [], durationMs: Date.now() - start };

    const inferredIndustry = lead.industry || inferIndustryFromName(lead.companyName || '');

    // Always generate meaningful alerts from data analysis
    const alerts: Array<{
      id: string; alertType: string; severity: string;
      title: string; description: string; actionRequired: string;
    }> = [];

    // Data quality alerts
    const missingFields = [
      !lead.industry && 'Industry',
      !lead.keyContactName && 'Key Contact',
      !lead.keyContactEmail && 'Contact Email',
      !lead.employeeCount && 'Employee Count',
      !lead.revenueEstimate && 'Revenue Estimate',
      !lead.techStack && 'Tech Stack',
    ].filter(Boolean) as string[];

    if (missingFields.length >= 3) {
      alerts.push({
        id: `alert_${Date.now()}_1`,
        alertType: 'at_risk_deal',
        severity: 'medium',
        title: 'Low Data Completeness',
        description: `${missingFields.length} key fields are missing: ${missingFields.join(', ')}. This limits scoring accuracy and outreach personalization.`,
        actionRequired: `Run Web Data Enrichment to fill gaps. Priority: ${missingFields.slice(0, 3).join(', ')}.`,
      });
    }

    if (!lead.keyContactName && !lead.keyContactEmail) {
      alerts.push({
        id: `alert_${Date.now()}_2`,
        alertType: 'at_risk_deal',
        severity: 'high',
        title: 'No Contact Identified',
        description: `${lead.companyName} has no key contact. Outreach cannot proceed until a decision-maker is identified.`,
        actionRequired: 'Run Web Data Enrichment or identify contact via LinkedIn before attempting outreach.',
      });
    }

    // Fresh lead alert
    if (lead.stage === 'new' || lead.stage === 'enriched') {
      alerts.push({
        id: `alert_${Date.now()}_3`,
        alertType: 're_engagement_opportunity',
        severity: 'medium',
        title: 'Fresh Lead — Time to Engage',
        description: `${lead.companyName} is in "${lead.stage}" stage. Early engagement increases conversion probability by 3x.`,
        actionRequired: 'Initiate outreach within 24 hours. Send a personalized discovery email referencing their industry context.',
      });
    }

    // Industry opportunity
    const highValueIndustries = ['Technology', 'Finance', 'Healthcare', 'SaaS', 'AI'];
    if (highValueIndustries.some(i => inferredIndustry.includes(i))) {
      alerts.push({
        id: `alert_${Date.now()}_4`,
        alertType: 'high_intent_signal',
        severity: 'medium',
        title: 'High-Value Industry Match',
        description: `${inferredIndustry} companies show above-average demand for sales automation tools. ${lead.companyName} represents a strong ICP fit.`,
        actionRequired: 'Prioritize this lead for personalized outreach. Reference industry-specific ROI data and case studies.',
      });
    }

    // Score-based alerts
    if (lead.leadScore >= 70) {
      alerts.push({
        id: `alert_${Date.now()}_5`,
        alertType: 'high_intent_signal',
        severity: 'high',
        title: 'High-Scoring Lead',
        description: `${lead.companyName} scores ${lead.leadScore}/100 — this is a hot lead that should be contacted promptly.`,
        actionRequired: 'Escalate to sales team for immediate outreach. Prepare personalized value proposition.',
      });
    }

    // Competitive timing
    alerts.push({
      id: `alert_${Date.now()}_6`,
      alertType: 're_engagement_opportunity',
      severity: 'low',
      title: 'Competitive Window',
      description: `Early engagement with ${lead.companyName} could establish vendor relationship before competitors. The ${inferredIndustry} sector is seeing increased adoption of AI tools.`,
      actionRequired: 'Include competitive differentiation in outreach messaging. Emphasize speed-to-value.',
    });

    // Persist to notes
    try {
      if (alerts.length > 0) {
        const alertNote = alerts.slice(0, 5).map(a => `[${a.severity.toUpperCase()}] ${a.title}: ${a.description} → ${a.actionRequired}`).join('\n');
        const existing = (lead.notes as string) || '';
        const block = `\n\n[AI Intelligence Alerts — ${new Date().toLocaleDateString()}]\n${alertNote}`;
        await db.lead.update({ where: { id: leadId }, data: { notes: (existing + block).trim() } });
      }
    } catch { /* persist failed */ }

    return { capability: 'generate_alerts', status: 'completed', result: alerts, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY };
  } catch (err) {
    console.error('[orchestrator] Alerts generation failed:', err);
    return { capability: 'generate_alerts', status: 'failed', result: [], durationMs: Date.now() - start };
  }
}

/**
 * 9. Deep Company Research
 */
export async function processCompanyResearch(leadId: string): Promise<EnrichmentStepResult> {
  const start = Date.now();

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { capability: 'research_company', status: 'failed', result: null, durationMs: Date.now() - start };

    // Gather web data for research
    let webData = '';
    try {
      const zai = await (await import('z-ai-web-dev-sdk')).default.create();
      const searchResults = await zai.functions.invoke('web_search', {
        query: `${lead.companyName} ${lead.industry || ''} company research news`,
        num: 5,
      });
      if (Array.isArray(searchResults) && searchResults.length > 0) {
        webData = searchResults
          .slice(0, 4)
          .map((r: { name?: string; snippet?: string }) => `${r.name || ''}: ${r.snippet || ''}`)
          .join('\n');
      }
    } catch { /* web search unavailable */ }

    // Generate company intelligence
    const intelligence = await generateCompanyIntelligence(leadId, webData);

    // Convert to markdown report for display
    const report = intelligenceToMarkdown(intelligence, lead.companyName || 'Unknown');

    // Persist
    try {
      const existing = (lead.notes as string) || '';
      const block = `\n\n[AI Deep Company Research — ${new Date().toLocaleDateString()}]\n${report.slice(0, 1500)}`;
      await db.lead.update({ where: { id: leadId }, data: { notes: (existing + block).trim() } });
    } catch { /* persist failed */ }

    return { capability: 'research_company', status: 'completed', result: report, durationMs: Date.now() - start, modelUsed: MODEL_PRIMARY };
  } catch (err) {
    console.error('[orchestrator] Company research failed:', err);
    return { capability: 'research_company', status: 'failed', result: null, durationMs: Date.now() - start };
  }
}

// ============================================================
// Full Pipeline Orchestrator
// ============================================================

/**
 * Run the complete enrichment pipeline for a lead.
 * Executes all 9 capabilities in optimal order.
 */
export async function runFullPipeline(leadId: string, capabilities?: EnrichmentCapability[]): Promise<EnrichmentOrchestrationResult> {
  const pipelineStart = Date.now();
  const steps: EnrichmentStepResult[] = [];
  const allFieldsEnriched: string[] = [];

  // Determine which capabilities to run
  const toRun = capabilities || PIPELINE_ORDER;

  // Invalidate cache for this lead to get fresh results
  invalidateLeadCache(leadId);

  for (const capability of toRun) {
    let stepResult: EnrichmentStepResult;

    switch (capability) {
      case 'bant': stepResult = await processBANT(leadId); break;
      case 'web_enrich': stepResult = await processWebEnrich(leadId); break;
      case 'ai_score': stepResult = await processAIScoring(leadId); break;
      case 'next_action': stepResult = await processNextAction(leadId); break;
      case 'predict_conversion': stepResult = await processConversionPrediction(leadId); break;
      case 'predict_deal': stepResult = await processDealSize(leadId); break;
      case 'behavioral_profile': stepResult = await processBehavioralProfile(leadId); break;
      case 'generate_alerts': stepResult = await processAlerts(leadId); break;
      case 'research_company': stepResult = await processCompanyResearch(leadId); break;
      default: continue;
    }

    steps.push(stepResult);
    if (stepResult.fieldsUpdated) allFieldsEnriched.push(...stepResult.fieldsUpdated);

    // Small delay between capabilities for rate limit compliance
    if (stepResult.status === 'completed') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Get the fully updated lead
  const updatedLead = await db.lead.findUnique({ where: { id: leadId } });

  const completedCount = steps.filter(s => s.status === 'completed' || s.status === 'cached').length;
  const overallStatus: EnrichmentOrchestrationResult['overallStatus'] =
    completedCount === steps.length ? 'success' :
    completedCount > 0 ? 'partial' : 'failed';

  return {
    leadId,
    steps,
    totalDurationMs: Date.now() - pipelineStart,
    fieldsEnriched: [...new Set(allFieldsEnriched)],
    overallStatus,
    updatedLead: updatedLead ? JSON.parse(JSON.stringify(updatedLead)) : {},
  };
}

// ============================================================
// Helper functions
// ============================================================

function buildRichBANT(lead: Record<string, any>, industry: string) {
  const companyName = lead.companyName || 'Unknown';
  const isLargeCompany = /201-500|501-1000|1001-5000|5000+/.test(lead.employeeCount || '');

  const highNeedIndustries = ['Technology', 'Finance', 'Healthcare', 'Retail & E-Commerce', 'Manufacturing'];
  const needLevel = highNeedIndustries.includes(industry) ? 'high' : 'medium';

  const painPoints: Record<string, string> = {
    'Technology': 'Scaling sales operations and automating lead qualification',
    'Finance': 'Compliance-driven lead tracking and secure client acquisition',
    'Healthcare': 'Managing complex B2B sales cycles with multiple stakeholders',
    'Retail & E-Commerce': 'Optimizing customer acquisition costs and improving conversion rates',
    'Manufacturing': 'Streamlining supply chain partner discovery and qualification',
  };

  return {
    bant: {
      budget: {
        level: isLargeCompany ? 'medium' : 'low',
        evidence: isLargeCompany
          ? `${companyName} appears to be a mid-to-large organization with moderate procurement budgets for enterprise tools.`
          : `${companyName} appears to be an SMB — budgets may be limited but decisions are faster.`,
        confidence: 0.60,
        estimatedBudget: isLargeCompany ? '$50K-$200K annually' : '$10K-$50K annually',
      },
      authority: {
        level: isLargeCompany ? 'influencer' : 'decision-maker',
        evidence: isLargeCompany
          ? `Larger organizations have multi-stakeholder decision processes. Target VP+ level for influence.`
          : `SMBs often have direct decision-makers. CEO/Owner likely has purchasing authority.`,
        confidence: 0.55,
        approachStrategy: isLargeCompany ? 'Multi-thread outreach: engage VP Sales + CRO simultaneously' : 'Direct outreach to CEO/Founder with clear value proposition',
      },
      need: {
        level: needLevel,
        evidence: `${industry} companies have ${needLevel === 'high' ? 'strong' : 'moderate'} needs for lead generation and sales automation.`,
        confidence: 0.65,
        painPoint: painPoints[industry] || 'Improving efficiency in prospect discovery and qualification',
        urgency: needLevel === 'high' ? 'Active market demand — competitors are investing in AI tools' : 'Growing awareness — nurturing recommended',
      },
      timeline: {
        level: needLevel === 'high' ? 'quarter' : 'exploratory',
        evidence: needLevel === 'high'
          ? `${industry} companies often have active procurement cycles and quarterly budget planning.`
          : `May be in early exploration phase — nurture with value-driven content.`,
        confidence: 0.50,
        triggerEvent: needLevel === 'high' ? 'Quarterly budget review or competitive pressure from AI-adopting peers' : 'Industry conference or peer recommendation',
      },
    },
    inferredFields: buildInferredFields(lead, industry),
    talkingPoints: [
      `Reference ${companyName}'s position in the ${industry} sector and how peers are optimizing their sales pipeline`,
      `Highlight how automated lead qualification can reduce their cost-per-acquisition by 30-50%`,
      `Share a relevant ${industry} case study showing measurable ROI within 90 days`,
      `Ask about their current sales tech stack and where they see the biggest gaps`,
      `Mention the competitive advantage of AI-driven pipeline management in ${industry}`,
    ],
    suggestedApproach: `Start with a value-driven discovery call focused on ${companyName}'s specific ${industry} challenges. Lead with industry benchmarks and peer comparisons to establish credibility. ${isLargeCompany ? 'Navigate the multi-stakeholder process by identifying all decision-makers early.' : 'Engage the decision-maker directly with quick-win messaging.'}`,
    riskFactors: [
      `Limited firmographic data available — some inferences are based on industry heuristics`,
      `${lead.country ? lead.country + '-based' : 'International'} company may have different procurement norms`,
      ...(lead.keyContactEmail ? [] : ['Without verified contact details, outreach may face deliverability challenges']),
    ],
    opportunitySignals: [
      `${industry} sector has high demand for sales automation solutions`,
      lead.website ? `Company has a web presence (${lead.website}) — likely digitally engaged` : `Potential first-mover advantage if competitors aren't using AI tools`,
      `Early engagement could establish long-term vendor relationship before competitors`,
    ],
  };
}

function buildInferredFields(lead: Record<string, any>, industry: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (!lead.industry) fields.industry = industry;
  if (!lead.subIndustry) fields.subIndustry = industry;
  if (!lead.employeeCount) fields.employeeCount = inferCompanySize(lead.companyName || '', industry);
  if (!lead.revenueEstimate) fields.revenueEstimate = inferRevenue(lead.employeeCount || fields.employeeCount as string);
  if (!lead.techStack) fields.techStack = (INDUSTRY_TECH_STACKS[industry] || INDUSTRY_TECH_STACKS['Business Services']).slice(0, 6).join(', ');
  if (!lead.ownershipType) fields.ownershipType = 'Private';
  return fields;
}

function buildRichNextAction(lead: Record<string, any>, industry: string): Record<string, unknown> {
  const companyName = lead.companyName || 'the company';
  const stage = lead.stage || 'new';
  const hasEmail = !!(lead.keyContactEmail || lead.generalEmail);
  const hasContact = !!lead.keyContactName;
  const contactName = lead.keyContactName || 'there';

  const stageActions: Record<string, Record<string, unknown>> = {
    new: {
      action: `Enrich ${companyName} data & identify decision-maker in ${industry}`,
      channel: 'email', timing: 'today',
      message: `Hi ${contactName}, I came across ${companyName} while researching ${industry} companies that could benefit from automated lead qualification. Would you have 15 minutes this week for a quick discovery call?`,
      rationale: `Lead is newly discovered — enrichment and contact identification should happen before outreach to maximize personalization.`,
      priority: 'high',
      expectedOutcome: 'Identify the right contact person and gather firmographic data for personalized outreach',
      fallbackAction: 'Research company on LinkedIn to find decision-maker',
    },
    enriched: {
      action: `Send personalized discovery email to ${contactName} at ${companyName}`,
      channel: hasEmail ? 'email' : 'linkedin', timing: 'today',
      message: `Hi ${contactName}, I noticed ${companyName} is growing in the ${industry} space. Companies like yours typically face challenges with lead qualification efficiency. I'd love to share how our platform helped a similar ${industry} company increase qualified pipeline by 40%. Worth a 15-min chat?`,
      rationale: `Lead has been enriched — time to initiate personalized contact based on the enriched firmographic context.`,
      priority: 'high',
      expectedOutcome: 'Start a conversation and secure a discovery call',
      fallbackAction: 'Try connecting on LinkedIn if email bounces',
    },
    qualified: {
      action: `Book discovery call with ${contactName} at ${companyName}`,
      channel: hasEmail ? 'email' : 'linkedin', timing: 'this-week',
      message: `Hi ${contactName}, based on ${companyName}'s profile in ${industry}, I believe there's a strong fit with our platform. I'd like to schedule a brief call to understand your current sales pipeline challenges. Are you available this week?`,
      rationale: `Lead is qualified — ready for direct outreach with value proposition.`,
      priority: 'high',
      expectedOutcome: 'Schedule a 30-minute discovery call',
      fallbackAction: 'Send a case study via email as a softer approach',
    },
    contacted: {
      action: `Send ${industry} case study follow-up to ${contactName}`,
      channel: 'email', timing: 'this-week',
      message: `Hi ${contactName}, I wanted to follow up and share how a ${industry} company similar to ${companyName} improved their lead qualification rate by 40%. I think you'd find the approach interesting.`,
      rationale: `Lead was contacted but hasn't responded. A value-driven follow-up with social proof is more effective than a check-in.`,
      priority: 'medium',
      expectedOutcome: 'Re-engage the lead and secure a call',
      fallbackAction: 'Try LinkedIn engagement or phone call',
    },
    engaged: {
      action: `Propose tailored demo for ${companyName}`,
      channel: 'email', timing: 'today',
      message: `Hi ${contactName}, great connecting! Based on our conversation about ${companyName}'s needs in ${industry}, I'd love to show you a tailored demo. Can we schedule 30 minutes this week?`,
      rationale: `Lead is engaged — move to demo to demonstrate concrete value.`,
      priority: 'critical',
      expectedOutcome: 'Secure a demo commitment',
      fallbackAction: 'Send a product tour video as a lighter alternative',
    },
    negotiating: {
      action: `Send proposal with ${industry} ROI projection to ${companyName}`,
      channel: 'email', timing: 'today',
      message: `Hi ${contactName}, as discussed, here's our proposal for ${companyName}. Based on your team size and ${industry} benchmarks, we project a 3-5x ROI within the first quarter.`,
      rationale: `Deal is in negotiation — formalize with a proposal that includes ROI projections.`,
      priority: 'critical',
      expectedOutcome: 'Close the deal or address final objections',
      fallbackAction: 'Offer a proof-of-concept period to reduce perceived risk',
    },
    nurture: {
      action: `Send ${industry} market report to re-engage ${companyName}`,
      channel: 'email', timing: 'next-week',
      message: `Hi ${contactName}, I thought you might find this ${industry} market report interesting — it highlights trends that could impact ${companyName}'s sales strategy. No need to respond, just sharing something valuable.`,
      rationale: `Lead is in nurture — provide value without pressure.`,
      priority: 'low',
      expectedOutcome: 'Re-ignite interest through value-first content',
      fallbackAction: 'Engage with their LinkedIn posts to stay visible',
    },
  };

  return stageActions[stage] || stageActions.new;
}

function inferCompanySize(companyName: string, industry: string): string {
  const name = companyName.toLowerCase();
  if (name.includes('group') || name.includes('holding') || name.includes('corporation')) return '201-500';
  if (name.includes('international') || name.includes('global')) return '501-1000';

  const sizeByIndustry: Record<string, string> = {
    'Technology': '51-200', 'Finance': '201-500', 'Healthcare': '201-500',
    'Manufacturing': '201-500', 'Business Services': '11-50', 'Retail & E-Commerce': '51-200',
  };
  return sizeByIndustry[industry] || '11-50';
}

function inferRevenue(employeeCount: string | null): string {
  const sizeMap: Record<string, string> = {
    '1-10': '$1M-$5M', '11-50': '$5M-$25M', '51-200': '$25M-$100M',
    '201-500': '$100M-$500M', '501-1000': '$500M-$1B', '1001-5000': '$1B-$5B', '5000+': '$5B+',
  };
  return sizeMap[employeeCount || '11-50'] || '$5M-$25M';
}

function computeDataCompleteness(lead: Record<string, unknown>): number {
  const fields = ['industry', 'subIndustry', 'website', 'city', 'country', 'phoneMain', 'generalEmail', 'ceoName', 'keyContactName', 'keyContactTitle', 'employeeCount', 'revenueEstimate', 'foundingYear', 'linkedinUrl', 'techStack'];
  const filled = fields.filter(f => lead[f] !== null && lead[f] !== undefined && lead[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function intelligenceToMarkdown(intel: CompanyIntelligence, companyName: string): string {
  return `# Deep Company Research: ${companyName}

## Company Overview
${intel.overview.description}

**Business Model**: ${intel.overview.businessModel}
**Target Market**: ${intel.overview.targetMarket}
**Geographic Reach**: ${intel.overview.geographicReach}

### Key Differentiators
${intel.overview.keyDifferentiators.map(d => `- ${d}`).join('\n')}

### Recent Developments
${intel.overview.recentNews.map(n => `- ${n}`).join('\n')}

## Financial Indicators
- **Revenue**: ${intel.financials.revenueEstimate}
- **Growth**: ${intel.financials.revenueGrowth}
- **Funding**: ${intel.financials.fundingStatus}
- **Profitability**: ${intel.financials.profitability}

## Technology Landscape
- **Digital Maturity**: ${intel.technology.digitalMaturity}
- **Cloud Adoption**: ${intel.technology.cloudAdoption}
- **Automation**: ${intel.technology.automationLevel}
- **Likely Tech Stack**: ${intel.technology.techStack.join(', ')}

## Strategic Assessment
- **ICP Fit**: ${intel.strategic.icpFit}/100
- **Deal Potential**: ${intel.strategic.dealPotential}
- **Sales Cycle**: ${intel.strategic.salesCycleEstimate}
- **Key Decision-Maker**: ${intel.strategic.keyDecisionMaker}

## Risks & Opportunities
${intel.risks.map(r => `- [${r.severity.toUpperCase()}] ${r.factor} → ${r.mitigation}`).join('\n')}

${intel.opportunities.map(o => `- [${o.strength.toUpperCase()}] ${o.signal} → ${o.action}`).join('\n')}

## Recommended Approach
${intel.recommendedApproach}`;
}
