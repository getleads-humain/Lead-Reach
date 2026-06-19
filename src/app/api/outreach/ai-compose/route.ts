/**
 * /api/outreach/ai-compose
 *
 * Quick single-message outreach composer (simpler than /api/agents/outreach
 * which builds a full multi-step sequence).
 *
 * Generates ONE personalized outreach message based on:
 *   - Lead data (company, contact, industry, pain points)
 *   - Channel (email / linkedin / phone script)
 *   - Framework (observation-ask / problem-proof-ask / trigger-event / mutual-connection)
 *   - Optional user instruction
 *
 * Optionally persists the message as a draft Outreach record when body.save === true.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 90;
export const dynamic = 'force-dynamic';

const FRAMEWORK_DESCRIPTIONS: Record<string, string> = {
  'observation-ask': 'Lead with a specific observation about their company → ask one focused question.',
  'problem-proof-ask': 'State a relevant problem → prove you solved it for a similar company → ask for a call.',
  'trigger-event': 'Reference a specific trigger event (funding, hiring, news) → connect to a relevant need → ask.',
  'mutual-connection': 'Lead with a mutual connection or referral → add context → ask for an intro call.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leadId,
      leadName,
      companyName,
      industry,
      title,
      painPoints,
      triggerEvent,
      mutualConnection,
      channel = 'email',
      framework = 'observation-ask',
      userInstruction,
      save = false,
    } = body as {
      leadId?: string;
      leadName?: string;
      companyName?: string;
      industry?: string;
      title?: string;
      painPoints?: string[];
      triggerEvent?: string;
      mutualConnection?: string;
      channel?: 'email' | 'linkedin' | 'phone';
      framework?: string;
      userInstruction?: string;
      save?: boolean;
    };

    if (!leadName && !companyName) {
      return NextResponse.json({ error: 'leadName or companyName is required' }, { status: 400 });
    }

    // If leadId is provided, hydrate from DB
    let lead: Awaited<ReturnType<typeof db.lead.findUnique>> = null;
    if (leadId) {
      try {
        lead = await db.lead.findUnique({ where: { id: leadId } });
      } catch { /* not found */ }
    }

    const resolvedLeadName = leadName || lead?.keyContactName || 'there';
    const resolvedCompany = companyName || lead?.companyName || 'your company';
    const resolvedIndustry = industry || lead?.industry || '';
    const resolvedTitle = title || lead?.keyContactTitle || '';
    const resolvedPainPoints = painPoints || (lead?.notes ? [lead.notes] : []);
    const resolvedWebsite = lead?.website || '';

    const frameworkDesc = FRAMEWORK_DESCRIPTIONS[framework] || FRAMEWORK_DESCRIPTIONS['observation-ask'];

    const systemPrompt = `You are an expert B2B outreach copywriter. Generate ONE personalized ${channel} message using the ${framework} framework.

Framework: ${frameworkDesc}

Channel conventions:
- email: subject (max 60 chars) + body (max 150 words). Professional, personalized.
- linkedin: connection request or DM (max 300 chars). Peer-to-peer, no subject.
- phone: short call script (max 200 words) with opener, value prop, and ask.

Return JSON with this EXACT shape:
{
  "subject": ${channel === 'email' ? '"Subject line"' : 'null'},
  "body": "The full message body",
  "personalization": ["Specific personalization 1 used", "Specific personalization 2"],
  "callToAction": "The specific CTA in the message",
  "wordCount": number
}

Rules:
- Reference specific data points (company name, industry, pain points, trigger events).
- Keep email body under 150 words.
- End with a clear, low-friction call-to-action.
- Always respond in English.
- Return ONLY valid JSON.`;

    const userMessage = `OUTREACH CONTEXT:
- Contact: ${resolvedLeadName}${resolvedTitle ? ` (${resolvedTitle})` : ''}
- Company: ${resolvedCompany}
- Industry: ${resolvedIndustry || 'Unknown'}
${resolvedWebsite ? `- Website: ${resolvedWebsite}` : ''}
${resolvedPainPoints.length > 0 ? `- Known pain points: ${resolvedPainPoints.join(', ')}` : ''}
${triggerEvent ? `- Trigger event: ${triggerEvent}` : ''}
${mutualConnection ? `- Mutual connection: ${mutualConnection}` : ''}
- Channel: ${channel}
- Framework: ${framework}

${userInstruction ? `USER INSTRUCTION: ${userInstruction}\n\n` : ''}Generate the outreach message now.`;

    const result = await callLLMForJSON<{
      subject?: string | null;
      body?: string;
      personalization?: string[];
      callToAction?: string;
      wordCount?: number;
    }>(systemPrompt, userMessage, {
      temperature: 0.5,
      maxTokens: 1500,
      model: MODEL_PRIMARY,
      thinkingBudget: 'standard',
    });

    if (!result || !result.body) {
      return NextResponse.json({
        subject: channel === 'email' ? `Quick question about ${resolvedCompany}` : null,
        body: getDefaultMessage(resolvedLeadName, resolvedCompany, resolvedIndustry, framework),
        personalization: [],
        callToAction: 'Book a 15-min call',
        wordCount: 80,
      });
    }

    // Optionally save as draft
    let savedOutreachId: string | null = null;
    if (save && leadId) {
      try {
        const saved = await db.outreach.create({
          data: {
            leadId,
            channel,
            type: framework,
            subject: result.subject || null,
            body: result.body,
            status: 'draft',
          },
        });
        savedOutreachId = saved.id;
      } catch (saveError) {
        console.warn('[outreach/ai-compose] Failed to save draft:', saveError);
      }
    }

    return NextResponse.json({
      subject: result.subject || null,
      body: result.body,
      personalization: Array.isArray(result.personalization) ? result.personalization : [],
      callToAction: result.callToAction || 'Book a 15-min call',
      wordCount: typeof result.wordCount === 'number' ? result.wordCount : result.body.split(/\s+/).length,
      savedOutreachId,
    });
  } catch (error) {
    console.error('[outreach/ai-compose] Error:', error);
    return NextResponse.json(
      { error: 'AI outreach composition failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDefaultMessage(leadName: string, companyName: string, industry: string, framework: string): string {
  if (framework === 'trigger-event') {
    return `Hi ${leadName},\n\nSaw the recent news about ${companyName} — congratulations! Companies in ${industry || 'your space'} often need help scaling operations after events like this.\n\nWorth a 15-min chat?\n\nBest`;
  }
  if (framework === 'mutual-connection') {
    return `Hi ${leadName},\n\nOur mutual contact suggested I reach out. They mentioned ${companyName} might be exploring solutions in ${industry || 'your space'}.\n\nOpen to a brief intro call?\n\nBest`;
  }
  return `Hi ${leadName},\n\nI noticed ${companyName} has been growing in the ${industry || 'technology'} space. I had a quick observation about how companies like yours handle pipeline scaling — mind if I share?\n\nBest`;
}
