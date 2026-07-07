#!/usr/bin/env python3
"""
Fix the LeadReach pipeline to produce accurate data.

Key changes:
1. Remove 60% early-return in executeCompanyResearch — always run AI extraction
2. Add AI-powered scoring function that uses LLM analysis
3. Integrate AI scoring into campaign stream and enrich routes
4. Strengthen industry classification prompts
"""

import re

# ── Fix 1: actions.ts — Remove early return, always run AI extraction ──

with open('/home/z/my-project/src/lib/prospect-agent/actions.ts', 'r') as f:
    content = f.read()

# Replace the FAST PATH EVALUATION block that skips AI extraction
# Find the block starting at "FAST PATH EVALUATION" and ending at the next step (STEP 4)
old_fast_path = '''  // ═══════════════════════════════════════════════════════════
  // FAST PATH EVALUATION: Return early ONLY if we have
  // genuinely rich data (>= 60% completeness). The old 20%
  // threshold was way too low — it meant companies with just a
  // phone number + website skipped AI extraction, resulting in
  // wrong industry classifications and empty fields.
  //
  // Now: AI extraction always runs unless we already have 60%+
  // completeness from regex alone (rare) or there's zero content
  // for the LLM to work with.
  // ═══════════════════════════════════════════════════════════
  const regexCompleteness = calculateCompleteness(prospect);
  const hasContentForLLM = allSnippets.length > 3 || webContents.length > 1;

  if (regexCompleteness >= 60 || !hasContentForLLM) {'''

new_fast_path = '''  // ═══════════════════════════════════════════════════════════
  // AI EXTRACTION: ALWAYS RUN
  // Previously, we skipped AI extraction if regex got >= 60%
  // completeness. This caused WRONG industry classifications
  // (e.g., "Song Nam ITD" -> "Media" instead of "Agriculture")
  // because regex can't understand what a company ACTUALLY does.
  //
  // Now: AI extraction always runs (unless there's zero content).
  // Only the deep crawl and gap fill are skipped when data is
  // sufficient after AI extraction completes.
  // ═══════════════════════════════════════════════════════════
  const regexCompleteness = calculateCompleteness(prospect);
  const hasContentForLLM = allSnippets.length > 2 || webContents.length > 0;

  if (!hasContentForLLM) {'''

content = content.replace(old_fast_path, new_fast_path)

# Now replace the early return block inside the if (!hasContentForLLM) block
# This is the content between "if (regexCompleteness >= 60 || !hasContentForLLM) {"
# and the closing "}" before "// STEP 4"
# Since we changed the condition, the inner block only handles the no-content case

old_early_return_inner = '''    // We have enough from regex, or there's not enough content for LLM to improve.
    // Mark remaining steps as skipped/optional.
    steps.push({ type: 'research_company', label: 'AI Deep Extraction', status: 'completed', message: regexCompleteness >= 60 ? 'Skipped — regex data sufficient (60%+)' : 'Skipped — limited content available' });'''

new_early_return_inner = '''    // No content for LLM to work with — skip AI extraction.
    // Mark remaining steps as skipped.
    steps.push({ type: 'research_company', label: 'AI Deep Extraction', status: 'completed', message: 'Skipped — no web content available for AI analysis' });'''

content = content.replace(old_early_return_inner, new_early_return_inner)

# Also fix the "Skipped — data sufficient" message for deep crawl (in the early return block)
# This is inside the if (!hasContentForLLM) block — change message to be accurate
content = content.replace(
    "steps.push({ type: 'research_company', label: 'Deep Site Crawl', status: 'completed', message: 'Skipped — data sufficient' });\n    stepIdx++;\n\n    // Quick LinkedIn search",
    "steps.push({ type: 'research_company', label: 'Deep Site Crawl', status: 'completed', message: 'Skipped — no content available' });\n    stepIdx++;\n\n    // Quick LinkedIn search"
)

# Also fix the "Skipped — data sufficient" for gap fill inside early return
content = content.replace(
    "steps.push({ type: 'research_company', label: 'Gap Fill', status: 'completed', message: 'Skipped — data sufficient' });",
    "steps.push({ type: 'research_company', label: 'Gap Fill', status: 'completed', message: 'Skipped — no content available' });"
)

# Fix the EARLY RETURN CHECK AFTER LLM (line 827-874)
# Change the threshold from 50 to 40 and make it less aggressive
old_post_llm_check = '''  // ═══════════════════════════════════════════════════════════
  // EARLY RETURN CHECK AFTER LLM: If data completeness > 50%,
  // skip deep crawl and gap fill — we have enough data
  // ═══════════════════════════════════════════════════════════
  if (calculateCompleteness(prospect) > 50) {'''

new_post_llm_check = '''  // ═══════════════════════════════════════════════════════════
  // POST-LLM CHECK: If data completeness > 40%, skip deep crawl
  // and gap fill — AI extraction filled most fields already.
  // We still run LinkedIn and news searches for completeness.
  // ═══════════════════════════════════════════════════════════
  if (calculateCompleteness(prospect) > 40) {'''

content = content.replace(old_post_llm_check, new_post_llm_check)

# Fix the extraction prompt to be even stronger about industry classification
old_prompt_rule2 = '''2. Industry classification MUST be based on what the company ACTUALLY DOES — read the website content carefully. If they sell agricultural products, the industry is "Agriculture" or "Food & Agriculture", NOT "Media" or "Technology".'''
new_prompt_rule2 = '''2. Industry classification MUST be based on what the company ACTUALLY DOES — read the website content carefully. If they sell agricultural products, the industry is "Agriculture" or "Food & Agriculture", NOT "Media" or "Technology". Look at the company's products/services, about page, and business description. A company's name does NOT determine its industry — its ACTUAL business activities do.'''

content = content.replace(old_prompt_rule2, new_prompt_rule2)

with open('/home/z/my-project/src/lib/prospect-agent/actions.ts', 'w') as f:
    f.write(content)

print("✅ actions.ts: Fixed early-return logic, AI extraction always runs")
print("✅ actions.ts: Strengthened industry classification prompt")

# ── Fix 2: Add AI-powered scoring function to actions.ts ──

# Read the file again to append
with open('/home/z/my-project/src/lib/prospect-agent/actions.ts', 'r') as f:
    content = f.read()

# Add AI-powered scoring function before executeLeadScoring
ai_scoring_function = '''
// ============================================================
// AI-Powered Lead Scoring (replaces field-completeness scoring)
// ============================================================

export interface AILeadScores {
  leadScore: number;
  leadTier: string;
  firmographicScore: number;
  intentScore: number;
  reachabilityScore: number;
  strategicScore: number;
  dataQualityScore: number;
  scoringReasoning: string;
}

/**
 * Score a lead using AI analysis instead of field-completeness counting.
 * Uses the LLM to analyze the actual data quality, industry fit, and
 * business value of the lead.
 *
 * Falls back to field-completeness scoring if the LLM is unavailable.
 */
export async function scoreLeadWithAI(
  prospect: ProspectResult,
  campaignContext?: { industry?: string; location?: string; companySize?: string },
): Promise<AILeadScores> {
  // Build the prompt with all available prospect data
  const prospectSummary = JSON.stringify({
    companyName: prospect.companyName,
    industry: prospect.industry,
    subIndustry: prospect.subIndustry,
    website: prospect.website,
    description: prospect.description,
    employeeCount: prospect.employeeCount,
    revenueEstimate: prospect.revenueEstimate,
    foundingYear: prospect.foundingYear,
    country: prospect.country,
    city: prospect.city,
    ceoName: prospect.ceoName,
    keyContactName: prospect.keyContactName,
    generalEmail: prospect.generalEmail,
    phoneMain: prospect.phoneMain,
    linkedinUrl: prospect.linkedinUrl,
    techStack: prospect.techStack,
    productsServices: prospect.productsServices,
    recentNews: prospect.recentNews,
    fundingInfo: prospect.fundingInfo,
  }, null, 2);

  const campaignCtx = campaignContext
    ? `Campaign Target: ${[campaignContext.industry, campaignContext.location, campaignContext.companySize].filter(Boolean).join(' / ') || 'General'}`
    : 'No specific campaign context';

  const scoringPrompt = `You are a B2B lead scoring expert. Analyze this prospect and provide DETAILED, ACCURATE scores based on the ACTUAL quality and relevance of the data — NOT just whether fields are filled.

${campaignCtx}

PROSPECT DATA:
${prospectSummary}

SCORING CRITERIA (each 0-100):

1. FIRMGRAPHIC SCORE: How well do we understand this company's profile?
   - 90-100: Industry, sub-industry, employees, revenue, founding year, location all verified
   - 70-89: Most firmographic data present and appears accurate
   - 50-69: Basic data present but may be incomplete or uncertain
   - 30-49: Only minimal data (name + website)
   - 0-29: Almost no firmographic data

2. INTENT SCORE: How likely is this company to be an active buyer?
   - 90-100: Recent funding, hiring surge, tech adoption signals, news of expansion
   - 70-89: Some buying signals (recent news, tech stack modernization)
   - 50-69: Mild signals (has a website, some digital presence)
   - 30-49: No clear signals but company exists and is reachable
   - 0-29: No signals at all

3. REACHABILITY SCORE: Can we actually contact decision-makers?
   - 90-100: Direct email + phone + LinkedIn + key contact identified
   - 70-89: Email or phone available, some contact paths
   - 50-69: Website or LinkedIn only
   - 30-49: Only company name, no direct contact
   - 0-29: Unreachable

4. STRATEGIC SCORE: How well does this lead match a typical B2B ICP?
   - 90-100: Perfect ICP fit (right industry, size, geography, has budget signals)
   - 70-89: Strong fit (matches most criteria)
   - 50-69: Moderate fit (matches some criteria)
   - 30-49: Weak fit (in some criteria)
   - 0-29: Poor fit

5. DATA QUALITY SCORE: How reliable is the data we have?
   - 90-100: All data verified from multiple sources, consistent
   - 70-89: Most data from reliable sources, some may need verification
   - 50-69: Mix of verified and unverified data
   - 30-49: Mostly unverified or auto-extracted data
   - 0-29: Data is unreliable or contradictory

CRITICAL RULES:
- Score based on DATA QUALITY and RELEVANCE, not just field completeness
- A company with verified industry "Agriculture" scores HIGHER on firmographic than one with wrong industry "Media"
- Having a real email address is worth more than having a phone number with wrong area code
- Recent news about expansion/funding is a strong intent signal
- Return ALL scores as integers 0-100

Return JSON:
{
  "firmographicScore": <0-100>,
  "intentScore": <0-100>,
  "reachabilityScore": <0-100>,
  "strategicScore": <0-100>,
  "dataQualityScore": <0-100>,
  "leadScore": <0-100, weighted composite: firmographic*0.20 + intent*0.20 + reachability*0.25 + strategic*0.25 + dataQuality*0.10>,
  "leadTier": "<hot if leadScore>=70, warm if >=40, cold otherwise>",
  "scoringReasoning": "<2-3 sentence explanation of key scoring factors>"
}`;

  try {
    const result = await withTimeout(
      () => callLLMForJSON<AILeadScores>(
        scoringPrompt,
        `Score lead: ${prospect.companyName || 'Unknown'}`,
        { thinkingBudget: 'standard', temperature: 0.15 },
      ),
      30_000, 'AI lead scoring',
    );

    if (result && typeof result.leadScore === 'number' && result.leadScore > 0) {
      // Validate and clamp all scores to 0-100
      const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
      return {
        leadScore: clamp(result.leadScore),
        leadTier: result.leadTier || (result.leadScore >= 70 ? 'hot' : result.leadScore >= 40 ? 'warm' : 'cold'),
        firmographicScore: clamp(result.firmographicScore),
        intentScore: clamp(result.intentScore),
        reachabilityScore: clamp(result.reachabilityScore),
        strategicScore: clamp(result.strategicScore),
        dataQualityScore: clamp(result.dataQualityScore || 50),
        scoringReasoning: result.scoringReasoning || 'AI-scored based on data analysis',
      };
    }
  } catch (err) {
    console.warn('[scoreLeadWithAI] AI scoring failed, using field-completeness fallback:', err instanceof Error ? err.message : 'Unknown');
  }

  // Fallback: field-completeness scoring (same formula as prospectToLeadUpdates)
  const firmFields = [prospect.industry, prospect.subIndustry, prospect.employeeCount,
    prospect.revenueEstimate, prospect.foundingYear, prospect.ownershipType,
    prospect.legalName, prospect.hqAddress, prospect.sector];
  const firmFilled = firmFields.filter(v => v !== null && v !== undefined && v !== '').length;
  const firmographicScore = Math.round((firmFilled / firmFields.length) * 100);

  const intentFields = [prospect.recentNews, prospect.fundingInfo, prospect.techStack, prospect.productsServices];
  const intentFilled = intentFields.filter(v => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)).length;
  const intentScore = Math.round((intentFilled / intentFields.length) * 70);

  const reachFields = [prospect.generalEmail, prospect.phoneMain, prospect.ceoEmail,
    prospect.keyContactEmail, prospect.supportEmail, prospect.linkedinUrl,
    prospect.keyContactName, prospect.twitterHandle];
  const reachFilled = reachFields.filter(v => v !== null && v !== undefined && v !== '').length;
  const reachabilityScore = Math.round((reachFilled / reachFields.length) * 100);

  const stratFields = [prospect.industry, prospect.employeeCount, prospect.revenueEstimate,
    prospect.country, prospect.ceoName, prospect.keyContactName, prospect.linkedinUrl];
  const stratFilled = stratFields.filter(v => v !== null && v !== undefined && v !== '').length;
  const strategicScore = Math.round((stratFilled / stratFields.length) * 100);

  const dataQualityScore = Math.round((firmographicScore + intentScore + reachabilityScore + strategicScore) / 4);

  const leadScore = Math.round(
    firmographicScore * 0.20 +
    intentScore * 0.20 +
    reachabilityScore * 0.25 +
    strategicScore * 0.25 +
    dataQualityScore * 0.10,
  );

  return {
    leadScore,
    leadTier: leadScore >= 70 ? 'hot' : leadScore >= 40 ? 'warm' : 'cold',
    firmographicScore,
    intentScore,
    reachabilityScore,
    strategicScore,
    dataQualityScore,
    scoringReasoning: 'Field-completeness scoring (AI unavailable)',
  };
}

'''

# Insert before executeLeadScoring
insert_marker = 'export async function executeLeadScoring('
if insert_marker in content:
    content = content.replace(insert_marker, ai_scoring_function + insert_marker)
    print("✅ actions.ts: Added AI-powered scoring function (scoreLeadWithAI)")
else:
    print("⚠️ Could not find insert marker for AI scoring function")

with open('/home/z/my-project/src/lib/prospect-agent/actions.ts', 'w') as f:
    f.write(content)

# ── Fix 3: Update campaign stream route to use AI scoring ──

with open('/home/z/my-project/src/app/api/campaigns/[id]/stream/route.ts', 'r') as f:
    stream_content = f.read()

# Add import for scoreLeadWithAI
old_import = "import { processWithOrchestrator } from '@/lib/prospect-agent/orchestrator';"
new_import = """import { processWithOrchestrator } from '@/lib/prospect-agent/orchestrator';
import { scoreLeadWithAI, type AILeadScores } from '@/lib/prospect-agent/actions';"""

stream_content = stream_content.replace(old_import, new_import)

# Update updateLeadWithProspect to use AI scoring
old_update_func = '''/**
 * Update an existing Lead row with enriched prospect data.
 */
async function updateLeadWithProspect(leadId: string, prospect: Record<string, unknown>): Promise<void> {
  try {
    const updates = prospectToLeadUpdates(prospect);
    await db.lead.update({
      where: { id: leadId },
      data: updates,
    });
  } catch (err) {
    console.error(`[CampaignStream] Failed to update lead ${leadId}:`, err);
  }
}'''

new_update_func = '''/**
 * Update an existing Lead row with enriched prospect data + AI scoring.
 * After applying field updates, calls the AI scoring function to produce
 * accurate, quality-based scores instead of just field-completeness counts.
 */
async function updateLeadWithProspect(
  leadId: string,
  prospect: Record<string, unknown>,
  campaignContext?: { industry?: string; location?: string; companySize?: string },
): Promise<void> {
  try {
    const updates = prospectToLeadUpdates(prospect);

    // ── AI-Powered Scoring ────────────────────────────────────────
    // Use the LLM to analyze the actual data quality and produce
    // accurate scores. This replaces the field-completeness scoring
    // that was producing inaccurate results (e.g., Intent=0 for
    // companies with real intent signals).
    try {
      const aiScores = await scoreLeadWithAI(
        prospect as any,
        campaignContext,
      );
      // Override field-completeness scores with AI-analyzed scores
      updates.leadScore = aiScores.leadScore;
      updates.leadTier = aiScores.leadTier;
      updates.firmographicScore = aiScores.firmographicScore;
      updates.intentScore = aiScores.intentScore;
      updates.reachabilityScore = aiScores.reachabilityScore;
      updates.strategicScore = aiScores.strategicScore;
      updates.dataQualityScore = aiScores.dataQualityScore;
      // Store AI reasoning in notes for transparency
      const existingNotes = (prospect.notes as string) || '';
      updates.notes = existingNotes
        ? `${existingNotes}\\nAI Scoring: ${aiScores.scoringReasoning}`
        : `AI Scoring: ${aiScores.scoringReasoning}`;
    } catch (scoringErr) {
      // AI scoring failed — fall back to field-completeness scores
      // (already computed in prospectToLeadUpdates)
      console.warn(`[CampaignStream] AI scoring failed for lead ${leadId}, using field-completeness fallback:`, scoringErr instanceof Error ? scoringErr.message : 'Unknown');
    }

    await db.lead.update({
      where: { id: leadId },
      data: updates,
    });
  } catch (err) {
    console.error(`[CampaignStream] Failed to update lead ${leadId}:`, err);
  }
}'''

stream_content = stream_content.replace(old_update_func, new_update_func)

# Update the call to updateLeadWithProspect to pass campaign context
old_call = 'await updateLeadWithProspect(lead.id, prospect);'
new_call = 'await updateLeadWithProspect(lead.id, prospect, { industry: campaign.targetIndustry || undefined, location: campaign.targetLocation || undefined, companySize: campaign.targetCompanySize || undefined });'

stream_content = stream_content.replace(old_call, new_call)

# Add dataQualityScore to prospectToLeadUpdates output
old_return_scores = '''    // Qualification
    stage: 'enriched',
    leadScore,
    leadTier,
    firmographicScore,
    intentScore,
    reachabilityScore,
    strategicScore,
    dataCompleteness: completeness,
    enrichedAt: new Date(),'''

new_return_scores = '''    // Qualification
    stage: 'enriched',
    leadScore,
    leadTier,
    firmographicScore,
    intentScore,
    reachabilityScore,
    strategicScore,
    dataQualityScore: Math.round((firmographicScore + intentScore + reachabilityScore + strategicScore) / 4),
    dataCompleteness: completeness,
    enrichedAt: new Date(),'''

stream_content = stream_content.replace(old_return_scores, new_return_scores)

with open('/home/z/my-project/src/app/api/campaigns/[id]/stream/route.ts', 'w') as f:
    f.write(stream_content)

print("✅ stream/route.ts: Added AI scoring integration")
print("✅ stream/route.ts: Added campaign context to scoring")
print("✅ stream/route.ts: Added dataQualityScore field")

# ── Fix 4: Update enrich route to use AI scoring ──

with open('/home/z/my-project/src/app/api/leads/enrich/route.ts', 'r') as f:
    enrich_content = f.read()

# Add import for scoreLeadWithAI
old_enrich_import = "import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';"
new_enrich_import = """import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';
import { scoreLeadWithAI } from '@/lib/prospect-agent/actions';"""

enrich_content = enrich_content.replace(old_enrich_import, new_enrich_import)

# Replace the field-completeness scoring block with AI scoring
old_scoring_block = '''    // Recalculate KPI scores based on updated data (UNIFIED with stream route formula)
    // Merge current lead data with enriched data for score calculation
    const merged = { ...lead, ...updateData };

    // Firmographic: how much company-profile data we have (industry,
    // employees, revenue, founding year, ownership, sub-industry, etc.)
    const firmFields = [
      merged.industry, merged.subIndustry, merged.employeeCount,
      merged.revenueEstimate, merged.foundingYear, merged.ownershipType,
      merged.legalName, merged.hqAddress, merged.sector,
      merged.naicsCode, merged.sicCode,
    ];
    const firmFilled = firmFields.filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length;
    const firmographicScore = Math.round(
      (firmFilled / firmFields.length) * 100,
    );

    // Intent: signals that the company is actively looking / growing
    // (hiring signals, recent news, funding, tech expansion)
    const intentFields = [
      merged.recentNews, merged.fundingInfo, merged.techStack,
      merged.productsServices,
    ];
    const intentExtras: unknown[] = Array.isArray(merged.intentSignals) ? merged.intentSignals : [];
    const intentFilled = intentFields.filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length;
    const intentBonus = Math.min(intentExtras.length * 15, 30);
    const intentScore = Math.min(
      100,
      Math.round((intentFilled / intentFields.length) * 70) + intentBonus,
    );

    // Reachability: do we have direct contact paths?
    const reachFields = [
      merged.generalEmail, merged.phoneMain, merged.ceoEmail,
      merged.keyContactEmail || merged.personEmail,
      merged.supportEmail, merged.linkedinUrl,
      merged.keyContactName || merged.personFullName,
      merged.twitterHandle, merged.facebookPage,
    ];
    const reachFilled = reachFields.filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length;
    const reachabilityScore = Math.round(
      (reachFilled / reachFields.length) * 100,
    );

    // Strategic: does this lead match ICP / high-value signals?
    const stratFields = [
      merged.industry,           // right sector
      merged.employeeCount,      // right size
      merged.revenueEstimate,    // right revenue bracket
      merged.country,            // right geography
      merged.ceoName,            // decision-maker identified
      merged.keyContactName || merged.personFullName,  // champion identified
      merged.linkedinUrl,        // digital presence
    ];
    const stratFilled = stratFields.filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length;
    const strategicScore = Math.round(
      (stratFilled / stratFields.length) * 100,
    );

    // Data completeness: percentage of all trackable fields that are filled
    const allTrackable = [
      'industry', 'subIndustry', 'website', 'hqAddress', 'city',
      'stateProvince', 'country', 'postalCode', 'phoneMain', 'generalEmail',
      'supportEmail', 'ceoName', 'ceoEmail', 'keyContactName', 'keyContactTitle',
      'keyContactEmail', 'employeeCount', 'revenueEstimate', 'foundingYear',
      'ownershipType', 'linkedinUrl', 'twitterHandle', 'facebookPage', 'techStack',
      'personFullName', 'jobTitle', 'personEmail', 'ticker', 'sector',
      'sicCode', 'naicsCode',
    ];
    const filledCount = allTrackable.filter(
      (f) =>
        (merged as Record<string, unknown>)[f] !== null &&
        (merged as Record<string, unknown>)[f] !== undefined &&
        String((merged as Record<string, unknown>)[f]).trim() !== '',
    ).length;
    const dataCompleteness = Math.round(
      (filledCount / allTrackable.length) * 100,
    );

    // Composite leadScore: weighted average
    const leadScore = Math.round(
      firmographicScore * 0.25 +
        intentScore * 0.2 +
        reachabilityScore * 0.25 +
        strategicScore * 0.3,
    );

    const leadTier =
      leadScore >= 75 ? 'hot' : leadScore >= 45 ? 'warm' : 'cold';

    updateData.firmographicScore = firmographicScore;
    updateData.intentScore = intentScore;
    updateData.reachabilityScore = reachabilityScore;
    updateData.strategicScore = strategicScore;
    updateData.dataCompleteness = dataCompleteness;
    updateData.leadScore = leadScore;
    updateData.leadTier = leadTier;'''

new_scoring_block = '''    // ── AI-Powered KPI Scoring ──────────────────────────────────────
    // Use AI to analyze the actual quality and relevance of lead data
    // instead of just counting filled fields. This produces accurate
    // scores that reflect data quality, not just data quantity.
    const merged = { ...lead, ...updateData };

    let leadScore: number;
    let leadTier: string;
    let firmographicScore: number;
    let intentScore: number;
    let reachabilityScore: number;
    let strategicScore: number;
    let dataQualityScore: number;
    let dataCompleteness: number;

    try {
      // Build a ProspectResult-like object for AI scoring
      const prospectForScoring = {
        companyName: merged.companyName,
        industry: merged.industry,
        subIndustry: merged.subIndustry,
        website: merged.website,
        description: merged.description || merged.notes,
        employeeCount: merged.employeeCount,
        revenueEstimate: merged.revenueEstimate,
        foundingYear: merged.foundingYear,
        ownershipType: merged.ownershipType,
        country: merged.country,
        city: merged.city,
        hqAddress: merged.hqAddress,
        ceoName: merged.ceoName,
        ceoEmail: merged.ceoEmail,
        keyContactName: merged.keyContactName || merged.personFullName,
        keyContactTitle: merged.keyContactTitle,
        keyContactEmail: merged.keyContactEmail || merged.personEmail,
        generalEmail: merged.generalEmail,
        supportEmail: merged.supportEmail,
        phoneMain: merged.phoneMain,
        linkedinUrl: merged.linkedinUrl,
        twitterHandle: merged.twitterHandle,
        techStack: typeof merged.techStack === 'string' ? JSON.parse(merged.techStack || '[]') : merged.techStack || [],
        productsServices: typeof merged.productsServices === 'string' ? JSON.parse(merged.productsServices || '[]') : merged.productsServices || [],
        recentNews: typeof merged.recentNews === 'string' ? JSON.parse(merged.recentNews || '[]') : merged.recentNews || [],
        fundingInfo: merged.fundingInfo,
        sector: merged.sector,
      };

      const aiScores = await scoreLeadWithAI(prospectForScoring as any);
      leadScore = aiScores.leadScore;
      leadTier = aiScores.leadTier;
      firmographicScore = aiScores.firmographicScore;
      intentScore = aiScores.intentScore;
      reachabilityScore = aiScores.reachabilityScore;
      strategicScore = aiScores.strategicScore;
      dataQualityScore = aiScores.dataQualityScore;

      // Data completeness: still calculate from field counts
      const allTrackable = [
        'industry', 'subIndustry', 'website', 'hqAddress', 'city',
        'stateProvince', 'country', 'postalCode', 'phoneMain', 'generalEmail',
        'supportEmail', 'ceoName', 'ceoEmail', 'keyContactName', 'keyContactTitle',
        'keyContactEmail', 'employeeCount', 'revenueEstimate', 'foundingYear',
        'ownershipType', 'linkedinUrl', 'twitterHandle', 'facebookPage', 'techStack',
        'personFullName', 'jobTitle', 'personEmail', 'ticker', 'sector',
        'sicCode', 'naicsCode',
      ];
      const filledCount = allTrackable.filter(
        (f) =>
          (merged as Record<string, unknown>)[f] !== null &&
          (merged as Record<string, unknown>)[f] !== undefined &&
          String((merged as Record<string, unknown>)[f]).trim() !== '',
      ).length;
      dataCompleteness = Math.round((filledCount / allTrackable.length) * 100);
    } catch (scoringErr) {
      // AI scoring failed — fall back to field-completeness scoring
      console.warn('[Enrich] AI scoring failed, using field-completeness fallback:', scoringErr instanceof Error ? scoringErr.message : 'Unknown');

      const firmFields = [
        merged.industry, merged.subIndustry, merged.employeeCount,
        merged.revenueEstimate, merged.foundingYear, merged.ownershipType,
        merged.legalName, merged.hqAddress, merged.sector,
        merged.naicsCode, merged.sicCode,
      ];
      const firmFilled = firmFields.filter((v) => v !== null && v !== undefined && v !== '').length;
      firmographicScore = Math.round((firmFilled / firmFields.length) * 100);

      const intentFields = [merged.recentNews, merged.fundingInfo, merged.techStack, merged.productsServices];
      const intentFilled = intentFields.filter((v) => v !== null && v !== undefined && v !== '').length;
      intentScore = Math.round((intentFilled / intentFields.length) * 70);

      const reachFields = [
        merged.generalEmail, merged.phoneMain, merged.ceoEmail,
        merged.keyContactEmail || merged.personEmail,
        merged.supportEmail, merged.linkedinUrl,
        merged.keyContactName || merged.personFullName,
        merged.twitterHandle, merged.facebookPage,
      ];
      const reachFilled = reachFields.filter((v) => v !== null && v !== undefined && v !== '').length;
      reachabilityScore = Math.round((reachFilled / reachFields.length) * 100);

      const stratFields = [
        merged.industry, merged.employeeCount, merged.revenueEstimate,
        merged.country, merged.ceoName, merged.keyContactName || merged.personFullName,
        merged.linkedinUrl,
      ];
      const stratFilled = stratFields.filter((v) => v !== null && v !== undefined && v !== '').length;
      strategicScore = Math.round((stratFilled / stratFields.length) * 100);

      dataQualityScore = Math.round((firmographicScore + intentScore + reachabilityScore + strategicScore) / 4);

      leadScore = Math.round(
        firmographicScore * 0.20 +
        intentScore * 0.20 +
        reachabilityScore * 0.25 +
        strategicScore * 0.25 +
        dataQualityScore * 0.10,
      );
      leadTier = leadScore >= 75 ? 'hot' : leadScore >= 45 ? 'warm' : 'cold';

      const allTrackable = [
        'industry', 'subIndustry', 'website', 'hqAddress', 'city',
        'stateProvince', 'country', 'postalCode', 'phoneMain', 'generalEmail',
        'supportEmail', 'ceoName', 'ceoEmail', 'keyContactName', 'keyContactTitle',
        'keyContactEmail', 'employeeCount', 'revenueEstimate', 'foundingYear',
        'ownershipType', 'linkedinUrl', 'twitterHandle', 'facebookPage', 'techStack',
        'personFullName', 'jobTitle', 'personEmail', 'ticker', 'sector',
        'sicCode', 'naicsCode',
      ];
      const filledCount = allTrackable.filter(
        (f) =>
          (merged as Record<string, unknown>)[f] !== null &&
          (merged as Record<string, unknown>)[f] !== undefined &&
          String((merged as Record<string, unknown>)[f]).trim() !== '',
      ).length;
      dataCompleteness = Math.round((filledCount / allTrackable.length) * 100);
    }

    updateData.firmographicScore = firmographicScore;
    updateData.intentScore = intentScore;
    updateData.reachabilityScore = reachabilityScore;
    updateData.strategicScore = strategicScore;
    updateData.dataQualityScore = dataQualityScore;
    updateData.dataCompleteness = dataCompleteness;
    updateData.leadScore = leadScore;
    updateData.leadTier = leadTier;'''

enrich_content = enrich_content.replace(old_scoring_block, new_scoring_block)

# Add dataQualityScore to the response
old_scores_response = '''      scores: {
        leadScore,
        leadTier,
        firmographicScore,
        intentScore,
        reachabilityScore,
        strategicScore,
        dataCompleteness,
      },'''

new_scores_response = '''      scores: {
        leadScore,
        leadTier,
        firmographicScore,
        intentScore,
        reachabilityScore,
        strategicScore,
        dataQualityScore,
        dataCompleteness,
      },'''

enrich_content = enrich_content.replace(old_scores_response, new_scores_response)

with open('/home/z/my-project/src/app/api/leads/enrich/route.ts', 'w') as f:
    f.write(enrich_content)

print("✅ enrich/route.ts: Added AI scoring integration")
print("✅ enrich/route.ts: Added dataQualityScore to response")

# ── Fix 5: Add dataQualityScore to Prisma schema if missing ──

with open('/home/z/my-project/prisma/schema.prisma', 'r') as f:
    schema_content = f.read()

if 'dataQualityScore' not in schema_content:
    # Add after strategicScore
    schema_content = schema_content.replace(
        'strategicScore    Int?',
        'strategicScore    Int?\n  dataQualityScore  Int?'
    )
    with open('/home/z/my-project/prisma/schema.prisma', 'w') as f:
        f.write(schema_content)
    print("✅ schema.prisma: Added dataQualityScore field")
else:
    print("✅ schema.prisma: dataQualityScore already exists")

print("\n🎉 All pipeline fixes applied!")
print("\nNext steps:")
print("1. Run: npx prisma db push (to update schema)")
print("2. Restart the dev server")
print("3. Test with a campaign that had wrong data")
