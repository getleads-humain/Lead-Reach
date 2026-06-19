/**
 * /api/leads/[id]/ai-score
 *
 * AI-powered lead scoring endpoint.
 *
 * Loads the lead (with related campaign, outreach, and enrichment data),
 * hands it to glm-4.6v-flash / glm-4.7-flash, and returns:
 *
 *   - Overall fit score (0-100)
 *   - Tier classification (hot / warm / cold)
 *   - Per-dimension scoring: firmographic, technographic, behavioral, situational, economic
 *   - Recommended next actions
 *   - Risk factors
 *   - Confidence level
 *
 * Optionally updates the lead's leadScore + leadTier in the database
 * when body.applyUpdate === true.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const applyUpdate = body?.applyUpdate === true;
    const icpCriteria = (body?.icpCriteria as Record<string, unknown> | undefined) || undefined;

    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        campaign: {
          select: { id: true, name: true, targetIndustry: true, targetLocation: true, targetCompanySize: true },
        },
        outreach: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: { id: true, channel: true, type: true, status: true, subject: true, createdAt: true },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const leadSnapshot = {
      company: {
        name: lead.companyName,
        industry: lead.industry,
        subIndustry: lead.subIndustry,
        website: lead.website,
        location: { city: lead.city, state: lead.stateProvince, country: lead.country },
        employeeCount: lead.employeeCount,
        revenueEstimate: lead.revenueEstimate,
        foundingYear: lead.foundingYear,
        ownershipType: lead.ownershipType,
        techStack: lead.techStack,
        linkedinUrl: lead.linkedinUrl,
      },
      contact: {
        name: lead.keyContactName,
        title: lead.keyContactTitle,
        email: lead.keyContactEmail,
        linkedin: lead.linkedinUrl,
      },
      campaign: lead.campaign,
      currentStage: lead.stage,
      currentTier: lead.leadTier,
      currentScore: lead.leadScore,
      notes: lead.notes,
      outreachHistory: lead.outreach.map(o => ({
        channel: o.channel,
        type: o.type,
        status: o.status,
        subject: o.subject,
        when: o.createdAt,
      })),
      icpCriteria,
    };

    const systemPrompt = `You are a senior B2B lead qualification expert. Given a lead snapshot (company, contact, campaign context, outreach history, and optional ICP criteria), score the lead and produce structured qualification analysis as JSON with this EXACT shape:

{
  "overallScore": number (0-100),
  "tier": "hot" | "warm" | "cold",
  "confidence": number (0-1),
  "dimensions": {
    "firmographic": { "score": 0-100, "rationale": "1-2 sentences with specific data" },
    "technographic": { "score": 0-100, "rationale": "1-2 sentences" },
    "behavioral": { "score": 0-100, "rationale": "1-2 sentences" },
    "situational": { "score": 0-100, "rationale": "1-2 sentences" },
    "economic": { "score": 0-100, "rationale": "1-2 sentences" }
  },
  "signals": {
    "positive": ["Signal 1", "Signal 2"],
    "negative": ["Signal 1"],
    "missing": ["Data point we don't have but should"]
  },
  "recommendedActions": [
    "Concrete action 1",
    "Concrete action 2",
    "Concrete action 3"
  ],
  "riskFactors": [
    "Risk 1 with specific data reference"
  ],
  "nextBestChannel": "email" | "linkedin" | "phone",
  "outreachAngle": "1-2 sentence recommended angle for outreach"
}

Rules:
- Use 50 as the neutral midpoint when data is missing — don't default to 0.
- Reference specific data points (revenue, industry, employee count, outreach status) in rationales.
- Make recommendedActions concrete and specific (e.g. "Send LinkedIn connection request to {contact}").
- Always respond in English.
- Return ONLY valid JSON.`;

    const userMessage = `LEAD SNAPSHOT:\n${JSON.stringify(leadSnapshot, null, 2)}\n\nScore this lead now.`;

    const scoring = await callLLMForJSON<{
      overallScore?: number;
      tier?: string;
      confidence?: number;
      dimensions?: Record<string, { score: number; rationale: string }>;
      signals?: { positive: string[]; negative: string[]; missing: string[] };
      recommendedActions?: string[];
      riskFactors?: string[];
      nextBestChannel?: string;
      outreachAngle?: string;
    }>(systemPrompt, userMessage, {
      temperature: 0.3,
      maxTokens: 3000,
      model: MODEL_PRIMARY,
      thinkingBudget: 'standard',
    });

    if (!scoring) {
      return NextResponse.json({
        scoring: getDefaultScoring(leadSnapshot),
      });
    }

    // Normalize tier
    const validTiers = new Set(['hot', 'warm', 'cold']);
    if (!validTiers.has(scoring.tier || '')) {
      const score = scoring.overallScore ?? 50;
      scoring.tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
    }

    // Optionally persist the updated score/tier
    if (applyUpdate) {
      try {
        await db.lead.update({
          where: { id: leadId },
          data: {
            leadScore: typeof scoring.overallScore === 'number' ? scoring.overallScore : lead.leadScore,
            leadTier: scoring.tier as 'hot' | 'warm' | 'cold',
            stage: lead.stage === 'new' ? 'qualified' : lead.stage,
          },
        });
      } catch (updateError) {
        console.warn('[ai-score] Failed to persist update:', updateError);
      }
    }

    return NextResponse.json({ scoring, applied: applyUpdate });
  } catch (error) {
    console.error('[leads/ai-score] Error:', error);
    return NextResponse.json(
      { error: 'Failed to score lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDefaultScoring(snapshot: { currentScore: number | null; currentTier: string | null; company: { industry: string | null; revenueEstimate: string | null; employeeCount: string | null } }) {
  const score = snapshot.currentScore ?? 50;
  const tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
  return {
    overallScore: score,
    tier,
    confidence: 0.4,
    dimensions: {
      firmographic: { score, rationale: `Based on industry: ${snapshot.company.industry || 'unknown'}.` },
      technographic: { score: 50, rationale: 'Limited technographic data available.' },
      behavioral: { score: 50, rationale: 'No behavioral signals captured yet.' },
      situational: { score: 50, rationale: 'No situational triggers identified.' },
      economic: { score, rationale: `Revenue estimate: ${snapshot.company.revenueEstimate || 'unknown'}.` },
    },
    signals: {
      positive: [],
      negative: [],
      missing: ['Tech stack data', 'Recent news', 'Trigger events'],
    },
    recommendedActions: ['Enrich lead with more data', 'Research company news', 'Identify trigger events'],
    riskFactors: ['AI scoring failed — using baseline fallback score.'],
    nextBestChannel: 'email' as const,
    outreachAngle: 'Reference their industry context and offer a quick discovery call.',
  };
}
