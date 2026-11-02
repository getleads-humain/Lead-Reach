/**
 * Live Enrich Lead — Real-time enrichment pipeline with tier upgrade targeting
 * ==============================================================================
 * POST /api/leads/[id]/live-enrich
 *
 * The core engine for the "Live Enrich" feature. It:
 * 1. Runs a multi-step enrichment pipeline live
 * 2. At each step, returns intermediate results for real-time UI updates
 * 3. Targets "super_hot" tier as the final goal
 * 4. Applies smart tier upgrades based on enrichment results
 * 5. Tracks pipeline health metrics
 *
 * Pipeline Steps:
 *   Phase 1: Data Gathering (web research + field inference)
 *   Phase 2: BANT Analysis (Budget, Authority, Need, Timeline)
 *   Phase 3: Deep Scoring (5-dimension qualification)
 *   Phase 4: Tier Upgrade Engine (analyzes gaps & applies upgrades)
 *   Phase 5: Action Synthesis (generates next steps + outreach)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

// ============================================================
// Types
// ============================================================

interface LiveEnrichStep {
  step: string;
  phase: number;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  result?: string;
  data?: Record<string, unknown>;
  fieldsUpdated?: string[];
  scoreImpact?: { dimension: string; before: number; after: number };
  timestamp?: string;
}

interface TierUpgradeResult {
  previousTier: string;
  newTier: string;
  previousScore: number;
  newScore: number;
  upgradeReason: string;
  upgradePath: string[];
  confidence: number;
  remainingGaps: string[];
  recommendedActions: string[];
}

interface LiveEnrichResult {
  leadId: string;
  steps: LiveEnrichStep[];
  tierUpgrade: TierUpgradeResult;
  finalLead: Record<string, unknown>;
  pipelineHealth: {
    dataCompletenessBefore: number;
    dataCompletenessAfter: number;
    fieldsEnriched: number;
    scoreImprovement: number;
    tierUpgradeAchieved: boolean;
    pipelineEfficiency: number;
  };
}

// ============================================================
// Tier Upgrade Logic
// ============================================================

const TIER_ORDER = ['unqualified', 'cold', 'warm', 'hot', 'super_hot'];

function getTierForScore(score: number): string {
  if (score >= 88) return 'super_hot';
  if (score >= 70) return 'hot';
  if (score >= 45) return 'warm';
  if (score >= 25) return 'cold';
  return 'unqualified';
}

function getUpgradePath(currentTier: string, targetTier: string): string[] {
  const startIdx = TIER_ORDER.indexOf(currentTier);
  const endIdx = TIER_ORDER.indexOf(targetTier);
  if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return [];
  return TIER_ORDER.slice(startIdx + 1, endIdx + 1);
}

// ============================================================
// Main Handler
// ============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params;
  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({})) as {
    targetTier?: string;
    phases?: number[];
  };

  const targetTier = body.targetTier || 'super_hot';
  const steps: LiveEnrichStep[] = [];
  let updatedLead = lead as Record<string, unknown>;

  const dataCompletenessBefore = lead.dataCompleteness || 0;
  const scoreBefore = lead.leadScore || 0;
  const tierBefore = lead.leadTier || 'unqualified';

  try {
    // ─── PHASE 1: Data Gathering ────────────────────────────────
    const step1: LiveEnrichStep = {
      step: 'data_gathering',
      phase: 1,
      label: 'Data Gathering & Web Research',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
    steps.push(step1);

    let webData = '';
    try {
      const zai = await (await import('z-ai-web-dev-sdk')).default.create();

      const searchQuery = `${lead.companyName} ${lead.industry || ''} company revenue employees contacts decision makers`;
      const searchResults = await zai.functions.invoke('web_search', {
        query: searchQuery.slice(0, 200),
        num: 8,
      });

      if (Array.isArray(searchResults) && searchResults.length > 0) {
        webData = searchResults
          .slice(0, 6)
          .map((r: { name?: string; snippet?: string; url?: string }) =>
            `${r.name || ''}: ${r.snippet || ''}`
          )
          .join('\n');
      }

      if (lead.website) {
        try {
          const webReadResult = await zai.functions.invoke('page_reader', {
            url: lead.website,
          }) as { content?: string } | null;
          if (webReadResult && typeof webReadResult === 'object' && 'content' in webReadResult) {
            webData += '\n' + (webReadResult as { content: string }).content.slice(0, 4000);
          }
        } catch { /* continue */ }
      }

      const contactSearch = await zai.functions.invoke('web_search', {
        query: `${lead.companyName} CEO CTO VP director contact email linkedin`,
        num: 5,
      });
      if (Array.isArray(contactSearch) && contactSearch.length > 0) {
        webData += '\n\n--- Contact Intelligence ---\n' +
          contactSearch.slice(0, 3)
            .map((r: { name?: string; snippet?: string }) => `${r.name || ''}: ${r.snippet || ''}`)
            .join('\n');
      }

      step1.status = 'completed';
      step1.result = `Gathered data from ${Array.isArray(searchResults) ? searchResults.length : 0}+ sources`;
      step1.data = { searchResultsCount: Array.isArray(searchResults) ? searchResults.length : 0 };
    } catch (err) {
      console.warn('[live-enrich] Web research failed:', err);
      step1.status = 'completed';
      step1.result = 'Web research partially unavailable — using AI knowledge';
    }

    // ─── Fill Missing Fields ──────────────────────────────────
    const fillableFields = [
      'industry', 'subIndustry', 'website', 'hqAddress', 'city', 'stateProvince',
      'country', 'postalCode', 'phoneMain', 'generalEmail', 'supportEmail',
      'ceoName', 'ceoEmail', 'keyContactName', 'keyContactTitle', 'keyContactEmail',
      'employeeCount', 'revenueEstimate', 'foundingYear', 'ownershipType',
      'linkedinUrl', 'techStack', 'naicsCode', 'sicCode',
      'legalName', 'twitterHandle', 'facebookPage',
    ];

    const emptyFields = fillableFields.filter(
      field => !updatedLead[field]
    );

    let fieldsFilled: string[] = [];
    if (emptyFields.length > 0) {
      try {
        const enrichedData = await callLLMForJSON<Record<string, unknown>>(
          `You are a B2B data enrichment specialist for a lead generation platform. Fill in the missing fields for this company using the provided web research data and your knowledge. Return ONLY a valid JSON object with the field names as keys. Use null for fields you absolutely cannot determine. Be factual — do NOT make up data. Prioritize contact information, decision-maker names, and firmographic details.`,
          `COMPANY: ${lead.companyName}
CURRENT DATA:
${fillableFields.filter(f => updatedLead[f]).map(f => `${f}: ${updatedLead[f]}`).join('\n')}

WEB RESEARCH:
${webData || 'No web data available — use your training knowledge'}

MISSING FIELDS TO FILL:
${emptyFields.join(', ')}

IMPORTANT: For contact information, prioritize finding C-level executives (CEO, CTO, VP Sales, VP Marketing) and their email patterns. Include LinkedIn URLs when possible.

Return a JSON object with ONLY these missing fields as keys.`,
          { temperature: 0.2, maxTokens: 3000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
        );

        if (enrichedData) {
          const updateData: Record<string, unknown> = { enrichedAt: new Date() };

          for (const [key, value] of Object.entries(enrichedData)) {
            if (value !== null && value !== undefined && value !== '' && emptyFields.includes(key)) {
              updateData[key] = value;
              fieldsFilled.push(key);
            }
          }

          if (fieldsFilled.length > 0) {
            updatedLead = await db.lead.update({
              where: { id: leadId },
              data: updateData,
            }) as Record<string, unknown>;
          }

          step1.fieldsUpdated = fieldsFilled;
          step1.result = `Gathered data + filled ${fieldsFilled.length} fields: ${fieldsFilled.join(', ')}`;
        }
      } catch (err) {
        console.warn('[live-enrich] Fill fields failed:', err);
      }
    }

    // ─── PHASE 2: BANT Analysis ────────────────────────────────
    const step2: LiveEnrichStep = {
      step: 'bant_analysis',
      phase: 2,
      label: 'BANT Qualification Analysis',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
    steps.push(step2);

    try {
      const bantResult = await callLLMForJSON<{
        budget: { score: number; evidence: string; gap: string };
        authority: { score: number; evidence: string; gap: string };
        need: { score: number; evidence: string; gap: string };
        timeline: { score: number; evidence: string; gap: string };
        overallBANTScore: number;
        keyInsight: string;
        upgradePotential: string;
      }>(
        `You are a B2B sales qualification expert. Analyze this lead using the BANT framework. Be thorough and insightful — identify specific signals that could upgrade this lead to a higher tier. Return ONLY valid JSON.`,
        `LEAD PROFILE:
Company: ${updatedLead.companyName}
Industry: ${updatedLead.industry || 'Unknown'}
Employees: ${updatedLead.employeeCount || 'Unknown'}
Revenue: ${updatedLead.revenueEstimate || 'Unknown'}
Key Contact: ${updatedLead.keyContactName || 'Unknown'}${updatedLead.keyContactTitle ? ` (${updatedLead.keyContactTitle})` : ''}
CEO: ${updatedLead.ceoName || 'Unknown'}
Website: ${updatedLead.website || 'Unknown'}
Tech Stack: ${updatedLead.techStack || 'Unknown'}
City: ${updatedLead.city || 'Unknown'}, ${updatedLead.country || 'Unknown'}
Current Score: ${updatedLead.leadScore}/100
Current Tier: ${updatedLead.leadTier}

For each BANT dimension, provide:
- score (0-100)
- evidence (specific signals found)
- gap (what's missing to reach a higher score)
- upgradePotential: Specific actions that could upgrade this lead to super_hot tier

Return JSON with: budget, authority, need, timeline (each with score/evidence/gap), overallBANTScore, keyInsight, upgradePotential`,
        { temperature: 0.3, maxTokens: 2000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );

      if (bantResult) {
        step2.status = 'completed';
        step2.result = `BANT Score: ${bantResult.overallBANTScore}/100 — ${bantResult.keyInsight}`;
        step2.data = { bant: bantResult };
      } else {
        step2.status = 'failed';
        step2.result = 'BANT analysis unavailable';
      }
    } catch (err) {
      console.warn('[live-enrich] BANT analysis failed:', err);
      step2.status = 'failed';
      step2.result = 'BANT analysis failed — continuing pipeline';
    }

    // ─── PHASE 3: Deep Scoring ─────────────────────────────────
    const step3: LiveEnrichStep = {
      step: 'deep_scoring',
      phase: 3,
      label: '5-Dimension Deep Scoring',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
    steps.push(step3);

    try {
      const scoringResult = await callLLMForJSON<{
        firmographicScore: number;
        intentScore: number;
        reachabilityScore: number;
        strategicScore: number;
        dataCompleteness: number;
        scoreRationale: string;
        upgradePath: string[];
        superHotGap: string;
      }>(
        `You are a B2B lead scoring expert. Score this lead across 5 dimensions on a 0-100 scale. Be generous but accurate — if a lead has strong signals, score them high. The goal is to identify leads that can reach "super_hot" tier (88+). Return ONLY valid JSON.`,
        `Score this lead aggressively based on ALL available signals:
Company: ${updatedLead.companyName}
Industry: ${updatedLead.industry || 'Unknown'}
City: ${updatedLead.city || 'Unknown'}, Country: ${updatedLead.country || 'Unknown'}
Employees: ${updatedLead.employeeCount || 'Unknown'}
Revenue: ${updatedLead.revenueEstimate || 'Unknown'}
Website: ${updatedLead.website || 'Unknown'}
Key Contact: ${updatedLead.keyContactName || 'Unknown'}${updatedLead.keyContactTitle ? ` (${updatedLead.keyContactTitle})` : ''}
Key Contact Email: ${updatedLead.keyContactEmail || 'Unknown'}
CEO: ${updatedLead.ceoName || 'Unknown'}
Phone: ${updatedLead.phoneMain || 'Unknown'}
Email: ${updatedLead.generalEmail || 'Unknown'}
LinkedIn: ${updatedLead.linkedinUrl || 'Unknown'}
Tech Stack: ${updatedLead.techStack || 'Unknown'}
Stage: ${updatedLead.stage}

Return JSON with:
- firmographicScore, intentScore, reachabilityScore, strategicScore, dataCompleteness (each 0-100)
- scoreRationale: Brief explanation
- upgradePath: Specific actions to boost each dimension
- superHotGap: What's needed to reach super_hot (88+ overall)`,
        { temperature: 0.2, maxTokens: 1500, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );

      if (scoringResult) {
        const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

        const firmographicScore = clamp(scoringResult.firmographicScore ?? 0);
        const intentScore = clamp(scoringResult.intentScore ?? 0);
        const reachabilityScore = clamp(scoringResult.reachabilityScore ?? 0);
        const strategicScore = clamp(scoringResult.strategicScore ?? 0);
        const dataCompleteness = clamp(scoringResult.dataCompleteness ?? 0);

        const leadScore = Math.round(
          firmographicScore * 0.25 +
          intentScore * 0.22 +
          reachabilityScore * 0.20 +
          strategicScore * 0.20 +
          dataCompleteness * 0.13
        );

        const leadTier = getTierForScore(leadScore);

        let newStage = updatedLead.stage as string;
        if (newStage === 'new') newStage = 'enriched';
        if (newStage === 'enriched' && leadScore >= 50) newStage = 'qualified';
        if (newStage === 'qualified' && leadScore >= 70) newStage = 'engaged';

        updatedLead = await db.lead.update({
          where: { id: leadId },
          data: {
            firmographicScore,
            intentScore,
            reachabilityScore,
            strategicScore,
            dataCompleteness,
            leadScore,
            leadTier,
            stage: newStage,
            ...(updatedLead.enrichedAt ? {} : { enrichedAt: new Date() }),
            ...(newStage === 'qualified' && !updatedLead.qualifiedAt ? { qualifiedAt: new Date() } : {}),
          },
        }) as Record<string, unknown>;

        step3.status = 'completed';
        step3.result = `Scored: ${leadScore}/100 (${leadTier}) — Firm:${firmographicScore} Intent:${intentScore} Reach:${reachabilityScore} Strat:${strategicScore} Data:${dataCompleteness}`;
        step3.scoreImpact = { dimension: 'overall', before: scoreBefore, after: leadScore };
        step3.data = {
          scores: { firmographicScore, intentScore, reachabilityScore, strategicScore, dataCompleteness },
          rationale: scoringResult.scoreRationale,
          upgradePath: scoringResult.upgradePath,
          superHotGap: scoringResult.superHotGap,
        };
      } else {
        step3.status = 'failed';
        step3.result = 'Deep scoring unavailable';
      }
    } catch (err) {
      console.error('[live-enrich] Deep scoring failed:', err);
      step3.status = 'failed';
      step3.result = 'Deep scoring failed';
    }

    // ─── PHASE 4: Tier Upgrade Engine ──────────────────────────
    const step4: LiveEnrichStep = {
      step: 'tier_upgrade',
      phase: 4,
      label: 'Tier Upgrade Engine',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
    steps.push(step4);

    const currentScore = (updatedLead.leadScore as number) || 0;
    const currentTier = (updatedLead.leadTier as string) || 'unqualified';

    try {
      if (currentTier !== 'super_hot' && currentScore < 88) {
        const upgradeAnalysis = await callLLMForJSON<{
          canUpgrade: boolean;
          suggestedTier: string;
          suggestedScore: number;
          reasoning: string;
          bonusSignals: string[];
          actions: string[];
          confidence: number;
        }>(
          `You are a B2B lead tier upgrade specialist. Analyze this lead and determine if strategic signals justify a tier upgrade. Be aggressive but fair — if there are strong signals, the lead deserves a higher tier. The goal is to get every lead to "super_hot" if possible. Return ONLY valid JSON.`,
          `LEAD CURRENT STATE:
Company: ${updatedLead.companyName}
Industry: ${updatedLead.industry || 'Unknown'}
Current Score: ${currentScore}/100
Current Tier: ${currentTier}
Target Tier: ${targetTier}

Firmographic: ${updatedLead.firmographicScore}/100
Intent: ${updatedLead.intentScore}/100
Reachability: ${updatedLead.reachabilityScore}/100
Strategic: ${updatedLead.strategicScore}/100
Data Quality: ${updatedLead.dataCompleteness}/100

Key Contact: ${updatedLead.keyContactName || 'Unknown'}${updatedLead.keyContactTitle ? ` (${updatedLead.keyContactTitle})` : ''}
Key Contact Email: ${updatedLead.keyContactEmail || 'Unknown'}
CEO: ${updatedLead.ceoName || 'Unknown'}
Employees: ${updatedLead.employeeCount || 'Unknown'}
Revenue: ${updatedLead.revenueEstimate || 'Unknown'}
Website: ${updatedLead.website || 'Unknown'}
Tech Stack: ${updatedLead.techStack || 'Unknown'}
LinkedIn: ${updatedLead.linkedinUrl || 'Unknown'}

Analyze:
1. Can this lead be upgraded? Consider compound signals
2. What tier should they be? (super_hot = 88+, hot = 70+, warm = 45+)
3. What score adjustment is justified? (add 0-20 bonus points based on compound signals)
4. What specific signals justify the upgrade?
5. What actions are still needed to reach super_hot?

Return JSON with: canUpgrade, suggestedTier, suggestedScore, reasoning, bonusSignals, actions, confidence (0-1)`,
          { temperature: 0.3, maxTokens: 1500, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
        );

        if (upgradeAnalysis && upgradeAnalysis.canUpgrade) {
          const adjustedScore = Math.min(100, Math.round(upgradeAnalysis.suggestedScore));
          const adjustedTier = getTierForScore(adjustedScore);

          updatedLead = await db.lead.update({
            where: { id: leadId },
            data: {
              leadScore: adjustedScore,
              leadTier: adjustedTier,
              notes: `${updatedLead.notes || ''}\n\n[Tier Upgrade — ${new Date().toLocaleDateString()}]\nUpgraded from ${currentTier} to ${adjustedTier} (${currentScore} → ${adjustedScore})\nReason: ${upgradeAnalysis.reasoning}\nSignals: ${upgradeAnalysis.bonusSignals.join(', ')}`,
            },
          }) as Record<string, unknown>;

          step4.status = 'completed';
          step4.result = `Tier upgraded: ${currentTier} → ${adjustedTier} (${currentScore} → ${adjustedScore})`;
          step4.data = {
            upgrade: {
              previousTier: currentTier,
              newTier: adjustedTier,
              previousScore: currentScore,
              newScore: adjustedScore,
              reasoning: upgradeAnalysis.reasoning,
              bonusSignals: upgradeAnalysis.bonusSignals,
              actions: upgradeAnalysis.actions,
              confidence: upgradeAnalysis.confidence,
            },
          };
        } else {
          step4.status = 'completed';
          step4.result = `Tier remains ${currentTier} (${currentScore}/100) — insufficient signals for upgrade`;
          step4.data = {
            upgrade: {
              previousTier: currentTier,
              newTier: currentTier,
              previousScore: currentScore,
              newScore: currentScore,
              reasoning: 'No upgrade justified at this time',
              bonusSignals: [],
              actions: upgradeAnalysis?.actions || ['Enrich more contact data', 'Identify decision makers', 'Research company growth signals'],
              confidence: 0,
            },
          };
        }
      } else {
        step4.status = 'completed';
        step4.result = `Already at ${currentTier} tier (${currentScore}/100) — target achieved!`;
        step4.data = {
          upgrade: {
            previousTier: currentTier,
            newTier: currentTier,
            previousScore: currentScore,
            newScore: currentScore,
            reasoning: 'Already at or above target tier',
            bonusSignals: [],
            actions: [],
            confidence: 1,
          },
        };
      }
    } catch (err) {
      console.error('[live-enrich] Tier upgrade failed:', err);
      step4.status = 'failed';
      step4.result = 'Tier upgrade analysis failed';
    }

    // ─── PHASE 5: Action Synthesis ─────────────────────────────
    const step5: LiveEnrichStep = {
      step: 'action_synthesis',
      phase: 5,
      label: 'Action Synthesis & Outreach Strategy',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
    steps.push(step5);

    try {
      const actionResult = await callLLMForJSON<{
        nextActions: Array<{ action: string; priority: string; impact: string; timeline: string }>;
        outreachStrategy: { channel: string; angle: string; subject: string; keyPoints: string[] };
        superHotRoadmap: string[];
        estimatedDealSize: string;
        conversionProbability: string;
      }>(
        `You are a B2B sales strategy expert. Based on the enriched lead data, provide a comprehensive action plan. The goal is to make this lead super_hot and drive conversion. Return ONLY valid JSON.`,
        `ENRICHED LEAD:
Company: ${updatedLead.companyName}
Industry: ${updatedLead.industry || 'Unknown'}
Current Score: ${updatedLead.leadScore}/100
Current Tier: ${updatedLead.leadTier}
Employees: ${updatedLead.employeeCount || 'Unknown'}
Revenue: ${updatedLead.revenueEstimate || 'Unknown'}
Key Contact: ${updatedLead.keyContactName || 'Unknown'}${updatedLead.keyContactTitle ? ` (${updatedLead.keyContactTitle})` : ''}
Key Contact Email: ${updatedLead.keyContactEmail || 'Unknown'}
CEO: ${updatedLead.ceoName || 'Unknown'}
Website: ${updatedLead.website || 'Unknown'}
Tech Stack: ${updatedLead.techStack || 'Unknown'}
LinkedIn: ${updatedLead.linkedinUrl || 'Unknown'}

Firmographic: ${updatedLead.firmographicScore}/100
Intent: ${updatedLead.intentScore}/100
Reachability: ${updatedLead.reachabilityScore}/100
Strategic: ${updatedLead.strategicScore}/100

Provide:
1. nextActions: 3-5 specific next actions (with priority, impact, timeline)
2. outreachStrategy: Recommended outreach approach (channel, angle, subject, keyPoints)
3. superHotRoadmap: Steps to reach super_hot if not already there
4. estimatedDealSize: Estimated deal size range
5. conversionProbability: Estimated conversion probability percentage`,
        { temperature: 0.4, maxTokens: 2000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );

      if (actionResult) {
        const synthesisNote = `\n\n[Action Synthesis — ${new Date().toLocaleDateString()}]\nNext Actions: ${actionResult.nextActions.map(a => a.action).join('; ')}\nOutreach: ${actionResult.outreachStrategy.channel} — ${actionResult.outreachStrategy.angle}\nDeal Size: ${actionResult.estimatedDealSize}\nConversion: ${actionResult.conversionProbability}`;

        updatedLead = await db.lead.update({
          where: { id: leadId },
          data: {
            notes: `${updatedLead.notes || ''}${synthesisNote}`,
          },
        }) as Record<string, unknown>;

        step5.status = 'completed';
        step5.result = `Synthesized ${actionResult.nextActions.length} actions — ${actionResult.outreachStrategy.channel} outreach recommended`;
        step5.data = { actions: actionResult };
      } else {
        step5.status = 'failed';
        step5.result = 'Action synthesis unavailable';
      }
    } catch (err) {
      console.error('[live-enrich] Action synthesis failed:', err);
      step5.status = 'failed';
      step5.result = 'Action synthesis failed';
    }

    // ─── Compute Pipeline Health ────────────────────────────────
    const finalLead = await db.lead.findUnique({ where: { id: leadId } });
    const dataCompletenessAfter = finalLead?.dataCompleteness || 0;
    const scoreAfter = finalLead?.leadScore || 0;
    const tierAfter = finalLead?.leadTier || 'unqualified';

    const pipelineHealth = {
      dataCompletenessBefore,
      dataCompletenessAfter,
      fieldsEnriched: fieldsFilled.length,
      scoreImprovement: scoreAfter - scoreBefore,
      tierUpgradeAchieved: TIER_ORDER.indexOf(tierAfter) > TIER_ORDER.indexOf(tierBefore),
      pipelineEfficiency: Math.round(
        (steps.filter(s => s.status === 'completed').length / steps.length) * 100
      ),
    };

    const tierUpgrade: TierUpgradeResult = {
      previousTier: tierBefore,
      newTier: tierAfter,
      previousScore: scoreBefore,
      newScore: scoreAfter,
      upgradeReason: (step4.data?.upgrade as { reasoning?: string })?.reasoning || 'Pipeline enrichment applied',
      upgradePath: getUpgradePath(tierBefore, tierAfter),
      confidence: (step4.data?.upgrade as { confidence?: number })?.confidence || 0,
      remainingGaps: (step4.data?.upgrade as { actions?: string[] })?.actions || [],
      recommendedActions: (step5.data?.actions as { nextActions?: Array<{ action: string }> })?.nextActions?.map(a => a.action) || [],
    };

    return NextResponse.json({
      leadId,
      steps,
      tierUpgrade,
      finalLead: JSON.parse(JSON.stringify(finalLead)),
      pipelineHealth,
    } as LiveEnrichResult);

  } catch (error) {
    console.error('[live-enrich] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Live enrichment failed', steps },
      { status: 500 }
    );
  }
}
