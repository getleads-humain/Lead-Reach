// ============================================================
// Auto-Enrich Lead — One-shot full enrichment pipeline
// ============================================================
// POST /api/leads/[id]/auto-enrich
//
// Performs a complete enrichment cycle on a lead:
// 1. Web research (search + website scrape)
// 2. Fill all missing fields via LLM
// 3. Compute & persist all 5 dimension scores
// 4. Compute & persist overall lead score + tier
// 5. Update stage if appropriate
// 6. Return the fully updated lead
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLM, callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

interface EnrichmentStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  result?: string;
  fieldsFilled?: string[];
}

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

  const steps: EnrichmentStep[] = [];
  let updatedLead = lead;

  try {
    // ─── STEP 1: Web Research ─────────────────────────────────────
    let webData = '';
    steps.push({ step: 'web_research', status: 'running' });

    try {
      const zai = await (await import('z-ai-web-dev-sdk')).default.create();

      // Search for company information
      const searchQuery = `${lead.companyName} ${lead.industry || ''} company information revenue employees`;
      const searchResults = await zai.functions.invoke('web_search', {
        query: searchQuery.slice(0, 200),
        num: 5,
      });

      if (Array.isArray(searchResults) && searchResults.length > 0) {
        webData = searchResults
          .slice(0, 4)
          .map((r: { name?: string; snippet?: string; url?: string }) =>
            `${r.name || ''}: ${r.snippet || ''}`
          )
          .join('\n');
      }

      // Try to read the company website
      if (lead.website) {
        try {
          const webReadResult = await zai.functions.invoke('page_reader', {
            url: lead.website,
          }) as { content?: string } | null;
          if (webReadResult && typeof webReadResult === 'object' && 'content' in webReadResult) {
            webData += '\n' + (webReadResult as { content: string }).content.slice(0, 3000);
          }
        } catch {
          // Website read failed, continue
        }
      }

      steps[0].status = 'completed';
      steps[0].result = `Found ${Array.isArray(searchResults) ? searchResults.length : 0} search results`;
    } catch (err) {
      console.warn('[auto-enrich] Web research failed:', err);
      steps[0].status = 'failed';
      steps[0].result = 'Web research unavailable — proceeding with LLM knowledge';
    }

    // ─── STEP 2: Fill Missing Fields ──────────────────────────────
    steps.push({ step: 'fill_fields', status: 'running' });

    const fillableFields = [
      'industry', 'subIndustry', 'website', 'hqAddress', 'city', 'stateProvince',
      'country', 'postalCode', 'phoneMain', 'generalEmail', 'supportEmail',
      'ceoName', 'ceoEmail', 'keyContactName', 'keyContactTitle', 'keyContactEmail',
      'employeeCount', 'revenueEstimate', 'foundingYear', 'ownershipType',
      'linkedinUrl', 'techStack', 'naicsCode', 'sicCode',
    ];

    const emptyFields = fillableFields.filter(
      field => !(updatedLead as Record<string, unknown>)[field]
    );

    if (emptyFields.length > 0) {
      try {
        const enrichedData = await callLLMForJSON<Record<string, unknown>>(
          `You are a B2B data enrichment specialist for a lead generation platform. Fill in the missing fields for this company using the provided web research data and your knowledge. Return ONLY a valid JSON object with the field names as keys. Use null for fields you absolutely cannot determine. Be factual — do NOT make up data.`,
          `COMPANY: ${lead.companyName}
CURRENT DATA:
${fillableFields.filter(f => (updatedLead as Record<string, unknown>)[f]).map(f => `${f}: ${(updatedLead as Record<string, unknown>)[f]}`).join('\n')}

WEB RESEARCH:
${webData || 'No web data available — use your training knowledge'}

MISSING FIELDS TO FILL:
${emptyFields.join(', ')}

Return a JSON object with ONLY these missing fields as keys. Example: {"industry": "Software", "employeeCount": "500-1000", ...}`,
          { temperature: 0.2, maxTokens: 3000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
        );

        if (enrichedData) {
          const updateData: Record<string, unknown> = {
            enrichedAt: new Date(),
          };
          const fieldsFilled: string[] = [];

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
            });
          }

          steps[1].status = 'completed';
          steps[1].fieldsFilled = fieldsFilled;
          steps[1].result = `Filled ${fieldsFilled.length} fields: ${fieldsFilled.join(', ')}`;
        } else {
          steps[1].status = 'failed';
          steps[1].result = 'LLM returned no data';
        }
      } catch (err) {
        console.error('[auto-enrich] Fill fields failed:', err);
        steps[1].status = 'failed';
        steps[1].result = 'Failed to fill fields via AI';
      }
    } else {
      steps[1].status = 'skipped';
      steps[1].result = 'All fields already populated';
    }

    // ─── STEP 3: Compute Dimension Scores ─────────────────────────
    steps.push({ step: 'score_dimensions', status: 'running' });

    try {
      const scoringResult = await callLLMForJSON<{
        firmographicScore: number;
        intentScore: number;
        reachabilityScore: number;
        strategicScore: number;
        dataCompleteness: number;
      }>(
        `You are a B2B lead scoring expert. Score this lead across 5 dimensions on a 0-100 scale. Return ONLY valid JSON.`,
        `Score this lead:
Company: ${updatedLead.companyName}
Industry: ${updatedLead.industry || 'Unknown'}
City: ${updatedLead.city || 'Unknown'}, State: ${updatedLead.stateProvince || ''}, Country: ${updatedLead.country || 'Unknown'}
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

Return JSON with these 5 fields (each 0-100):
- firmographicScore: How well does this company match a B2B buyer profile? (industry fit, company size, revenue)
- intentScore: How likely is this company to buy? (based on tech stack signals, industry trends, growth indicators)
- reachabilityScore: How easy is it to contact them? (available contact info, channels, LinkedIn presence)
- strategicScore: How strategically valuable is this account? (market position, growth potential, deal size potential)
- dataCompleteness: How complete is the lead data? (percentage of fields filled with real data)`,
        { temperature: 0.2, maxTokens: 1000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );

      if (scoringResult) {
        // Clamp all scores to 0-100
        const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

        const firmographicScore = clamp(scoringResult.firmographicScore ?? 0);
        const intentScore = clamp(scoringResult.intentScore ?? 0);
        const reachabilityScore = clamp(scoringResult.reachabilityScore ?? 0);
        const strategicScore = clamp(scoringResult.strategicScore ?? 0);
        const dataCompleteness = clamp(scoringResult.dataCompleteness ?? 0);

        // Compute overall score (weighted)
        const leadScore = Math.round(
          firmographicScore * 0.25 +
          intentScore * 0.20 +
          reachabilityScore * 0.20 +
          strategicScore * 0.20 +
          dataCompleteness * 0.15
        );

        // Determine tier
        const leadTier = leadScore >= 70 ? 'hot' : leadScore >= 40 ? 'warm' : 'cold';

        // Update stage
        let newStage = updatedLead.stage;
        if (updatedLead.stage === 'new') newStage = 'enriched';
        if (updatedLead.stage === 'enriched' && leadScore >= 50) newStage = 'qualified';

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
        });

        steps[2].status = 'completed';
        steps[2].result = `Scored: ${leadScore}/100 (${leadTier}) — Firm:${firmographicScore} Intent:${intentScore} Reach:${reachabilityScore} Strat:${strategicScore} Data:${dataCompleteness}`;
      } else {
        // Fallback: compute data completeness from actual field population
        const filledCount = fillableFields.filter(f => (updatedLead as Record<string, unknown>)[f]).length;
        const dataCompleteness = Math.round((filledCount / fillableFields.length) * 100);

        updatedLead = await db.lead.update({
          where: { id: leadId },
          data: {
            dataCompleteness,
            leadScore: dataCompleteness,
            leadTier: dataCompleteness >= 70 ? 'hot' : dataCompleteness >= 40 ? 'warm' : 'cold',
            enrichedAt: new Date(),
            stage: updatedLead.stage === 'new' ? 'enriched' : updatedLead.stage,
          },
        });

        steps[2].status = 'completed';
        steps[2].result = `Basic scoring: ${dataCompleteness}/100 (data completeness based)`;
      }
    } catch (err) {
      console.error('[auto-enrich] Scoring failed:', err);
      steps[2].status = 'failed';
      steps[2].result = 'AI scoring failed — basic completeness score applied';

      // Fallback: compute basic data completeness
      const filledCount = fillableFields.filter(f => (updatedLead as Record<string, unknown>)[f]).length;
      const dataCompleteness = Math.round((filledCount / fillableFields.length) * 100);
      updatedLead = await db.lead.update({
        where: { id: leadId },
        data: { dataCompleteness, enrichedAt: new Date() },
      });
    }

    // ─── STEP 4: Generate AI Summary & Notes ──────────────────────
    steps.push({ step: 'ai_summary', status: 'running' });

    try {
      const summary = await callLLM({
        systemPrompt: 'You are a B2B sales analyst. Write a concise 2-3 sentence summary of this lead highlighting their fit, potential, and key action items. Be specific and actionable.',
        userMessage: `Lead: ${updatedLead.companyName} | Industry: ${updatedLead.industry || 'Unknown'} | Employees: ${updatedLead.employeeCount || 'Unknown'} | Revenue: ${updatedLead.revenueEstimate || 'Unknown'} | City: ${updatedLead.city || 'Unknown'} | Score: ${updatedLead.leadScore}/100 | Tier: ${updatedLead.leadTier} | Key Contact: ${updatedLead.keyContactName || 'Unknown'} | Website: ${updatedLead.website || 'Unknown'}`,
        temperature: 0.4,
        maxTokens: 300,
        model: MODEL_PRIMARY,
      });

      if (summary) {
        const currentNotes = updatedLead.notes || '';
        const summaryNote = `[AI Enrichment Summary — ${new Date().toLocaleDateString()}]\n${summary}`;
        updatedLead = await db.lead.update({
          where: { id: leadId },
          data: {
            notes: currentNotes ? `${currentNotes}\n\n${summaryNote}` : summaryNote,
          },
        });
        steps[3].status = 'completed';
        steps[3].result = summary;
      } else {
        steps[3].status = 'skipped';
        steps[3].result = 'AI summary unavailable';
      }
    } catch {
      steps[3].status = 'failed';
      steps[3].result = 'AI summary generation failed';
    }

    // Return the fully updated lead with steps
    return NextResponse.json({
      success: true,
      lead: JSON.parse(JSON.stringify(updatedLead)),
      steps,
      totalFieldsFilled: steps.find(s => s.step === 'fill_fields')?.fieldsFilled?.length || 0,
    });
  } catch (error) {
    console.error('[auto-enrich] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Auto-enrichment failed', steps },
      { status: 500 }
    );
  }
}
