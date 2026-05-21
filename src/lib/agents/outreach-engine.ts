/**
 * Outreach Engine
 * 
 * Generates personalized outreach sequences using LLM.
 * Supports multiple frameworks and sequence types.
 */

import ZAI from 'z-ai-web-dev-sdk';

// ============================================================
// Types
// ============================================================

export type OutreachFramework = 'observation-ask' | 'problem-proof-ask' | 'trigger-event' | 'mutual-connection';

export type OutreachSequenceType = 'cold' | 'warm' | 'referral' | 'nurture';

export interface OutreachStep {
  stepNumber: number;
  channel: 'email' | 'linkedin' | 'phone';
  type: string;
  subject?: string;
  body: string;
  delayDays: number;
  tips: string[];
}

export interface OutreachSequence {
  framework: OutreachFramework;
  sequenceType: OutreachSequenceType;
  leadName: string;
  companyName: string;
  steps: OutreachStep[];
  overallStrategy: string;
  keyMessaging: string[];
  generatedAt: string;
}

export interface OutreachInput {
  leadId?: string;
  leadName: string;
  companyName: string;
  leadTitle?: string;
  industry?: string;
  website?: string;
  painPoints?: string[];
  triggerEvent?: string;
  mutualConnection?: string;
  framework: OutreachFramework;
  sequenceType: OutreachSequenceType;
  additionalContext?: string;
}

// ============================================================
// Framework descriptions for LLM prompt
// ============================================================

const FRAMEWORK_DESCRIPTIONS: Record<OutreachFramework, string> = {
  'observation-ask': `Observation → Ask Framework:
  1. Start with a specific observation about the prospect's company, role, or industry
  2. Connect the observation to a relevant problem or opportunity
  3. Ask a targeted question that invites dialogue`,
  
  'problem-proof-ask': `Problem → Proof → Ask Framework:
  1. Identify a specific problem the prospect likely faces
  2. Provide proof (case study, data point, or example) of how you've solved it
  3. Make a clear, low-friction ask`,
  
  'trigger-event': `Trigger Event Framework:
  1. Reference a specific trigger event (funding, expansion, leadership change, product launch)
  2. Connect the event to a relevant solution need
  3. Propose a timely conversation`,
  
  'mutual-connection': `Mutual Connection Framework:
  1. Reference a shared connection or referral
  2. Build credibility through the relationship
  3. Propose an introduction or conversation`,
};

const SEQUENCE_TYPE_GUIDANCE: Record<OutreachSequenceType, string> = {
  cold: `Cold outreach: The prospect has no prior relationship with you. Focus on personalization, relevance, and providing value. Use a 4-5 step sequence with increasing specificity.`,
  warm: `Warm outreach: There's some prior touchpoint (event attendee, content consumer, etc.). Reference the shared context. Use a 3-4 step sequence.`,
  referral: `Referral outreach: You have a mutual connection. Lead with the referral and build trust quickly. Use a 2-3 step sequence.`,
  nurture: `Nurture outreach: Long-term relationship building. Focus on value delivery and education. Use a 5-6 step sequence with more spacing.`,
};

// ============================================================
// Main Generation Function
// ============================================================

/**
 * Generate a personalized outreach sequence using LLM
 */
export async function generateOutreachSequence(input: OutreachInput): Promise<OutreachSequence> {
  const frameworkDesc = FRAMEWORK_DESCRIPTIONS[input.framework];
  const typeGuidance = SEQUENCE_TYPE_GUIDANCE[input.sequenceType];

  const prompt = `You are an expert B2B sales outreach strategist. Generate a personalized outreach sequence.

LEAD INFORMATION:
- Name: ${input.leadName}
- Title: ${input.leadTitle || 'Not specified'}
- Company: ${input.companyName}
- Industry: ${input.industry || 'Not specified'}
- Website: ${input.website || 'Not specified'}
- Pain Points: ${input.painPoints?.join(', ') || 'Not specified'}
- Trigger Event: ${input.triggerEvent || 'Not specified'}
- Mutual Connection: ${input.mutualConnection || 'Not specified'}
${input.additionalContext ? `- Additional Context: ${input.additionalContext}` : ''}

FRAMEWORK: ${frameworkDesc}

SEQUENCE TYPE: ${typeGuidance}

Generate a complete outreach sequence as JSON with this exact structure:
{
  "steps": [
    {
      "stepNumber": 1,
      "channel": "email",
      "type": "cold_email|connection_request|warm_intro|follow_up_1|follow_up_2|break_up",
      "subject": "Email subject line (for email channel)",
      "body": "Full message body - make it personal, specific, and compelling",
      "delayDays": 0,
      "tips": ["Tip 1 for this step", "Tip 2"]
    }
  ],
  "overallStrategy": "2-3 sentence strategy summary",
  "keyMessaging": ["Key message 1", "Key message 2", "Key message 3"]
}

Rules:
- Each message must be highly personalized to ${input.companyName}
- Keep emails under 150 words
- Include specific references to the company/industry
- End with a clear, low-friction call to action
- Vary channels (email, linkedin) across steps
- Return ONLY valid JSON, no markdown`;

  try {
    const zai = await ZAI.create();
    const result = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
    });

    const content = result.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    const steps = Array.isArray(parsed.steps) ? parsed.steps.map((step: Record<string, unknown>, i: number) => ({
      stepNumber: (step.stepNumber as number) || i + 1,
      channel: (['email', 'linkedin', 'phone'].includes(step.channel as string) ? step.channel : 'email') as 'email' | 'linkedin' | 'phone',
      type: (step.type as string) || 'cold_email',
      subject: (step.subject as string) || undefined,
      body: (step.body as string) || '',
      delayDays: (step.delayDays as number) || (i * 3),
      tips: Array.isArray(step.tips) ? (step.tips as string[]) : [],
    })) : getDefaultSteps(input);

    return {
      framework: input.framework,
      sequenceType: input.sequenceType,
      leadName: input.leadName,
      companyName: input.companyName,
      steps,
      overallStrategy: (parsed.overallStrategy as string) || `Outreach to ${input.companyName} using ${input.framework} framework`,
      keyMessaging: Array.isArray(parsed.keyMessaging) ? (parsed.keyMessaging as string[]) : ['Personalize based on company research'],
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[OutreachEngine] LLM failed, using defaults:', error);
    return {
      framework: input.framework,
      sequenceType: input.sequenceType,
      leadName: input.leadName,
      companyName: input.companyName,
      steps: getDefaultSteps(input),
      overallStrategy: `Personalized outreach to ${input.companyName} focusing on ${input.framework} approach`,
      keyMessaging: ['Focus on company-specific pain points', 'Provide clear value proposition', 'End with low-friction ask'],
      generatedAt: new Date().toISOString(),
    };
  }
}

function getDefaultSteps(input: OutreachInput): OutreachStep[] {
  const steps: OutreachStep[] = [];

  switch (input.framework) {
    case 'observation-ask':
      steps.push(
        { stepNumber: 1, channel: 'email', type: 'cold_email', subject: `Quick question about ${input.companyName}'s growth`, body: `Hi ${input.leadName},\n\nI noticed ${input.companyName} has been making moves in the ${input.industry || 'technology'} space. I had a quick observation and a question — mind if I share?\n\nBest`, delayDays: 0, tips: ['Reference a specific observation', 'Keep it under 3 sentences'] },
        { stepNumber: 2, channel: 'linkedin', type: 'connection_request', body: `Hi ${input.leadName}, I've been following ${input.companyName}'s work and would love to connect.`, delayDays: 2, tips: ['Keep connection request brief'] },
        { stepNumber: 3, channel: 'email', type: 'follow_up_1', subject: `Re: Quick question about ${input.companyName}'s growth`, body: `Hi ${input.leadName},\n\nJust bumping this up. The observation: companies like ${input.companyName} in ${input.industry || 'your space'} often face [specific challenge]. I'd love to hear if that resonates.\n\nBest`, delayDays: 4, tips: ['Add the observation you teased', 'Make the ask clearer'] },
        { stepNumber: 4, channel: 'email', type: 'break_up', subject: `Closing the loop`, body: `Hi ${input.leadName},\n\nI'll assume the timing isn't right. If things change, I'm here.\n\nBest of luck with everything at ${input.companyName}.`, delayDays: 10, tips: ['Keep it graceful', 'Leave the door open'] },
      );
      break;
    case 'problem-proof-ask':
      steps.push(
        { stepNumber: 1, channel: 'email', type: 'cold_email', subject: `How ${input.companyName} can solve [specific problem]`, body: `Hi ${input.leadName},\n\nCompanies in ${input.industry || 'your space'} often struggle with [specific problem]. We recently helped [similar company] achieve [specific result].\n\nWould a 15-min call be worth your time?\n\nBest`, delayDays: 0, tips: ['Lead with the problem', 'Provide concrete proof'] },
        { stepNumber: 2, channel: 'email', type: 'follow_up_1', subject: `Re: How ${input.companyName} can solve [specific problem]`, body: `Hi ${input.leadName},\n\nWanted to share a quick case study — [Company X] saw [specific metric improvement] after implementing our solution. Happy to share details.\n\nBest`, delayDays: 3, tips: ['Share proof point', 'Keep it brief'] },
        { stepNumber: 3, channel: 'email', type: 'follow_up_2', subject: `One more thing`, body: `Hi ${input.leadName},\n\nJust one more data point: [specific stat or insight relevant to ${input.companyName}].\n\nNo pressure either way.\n\nBest`, delayDays: 7, tips: ['Add one more proof point', 'Be low-pressure'] },
        { stepNumber: 4, channel: 'email', type: 'break_up', subject: `Last note`, body: `Hi ${input.leadName},\n\nI'll stop reaching out, but I'm confident we can help ${input.companyName} with [problem]. Feel free to reach out anytime.\n\nBest`, delayDays: 14, tips: ['Professional close', 'Restate the value'] },
      );
      break;
    case 'trigger-event':
      steps.push(
        { stepNumber: 1, channel: 'email', type: 'cold_email', subject: `Congrats on ${input.triggerEvent || 'the recent news'}, ${input.leadName}`, body: `Hi ${input.leadName},\n\nSaw the news about ${input.triggerEvent || 'your recent announcement'} — congratulations! This often creates [specific need]. We've helped companies in similar situations.\n\nWould love to chat if it's timely.\n\nBest`, delayDays: 0, tips: ['Acknowledge the trigger event', 'Connect to a relevant need'] },
        { stepNumber: 2, channel: 'linkedin', type: 'connection_request', body: `Hi ${input.leadName}, congrats on the ${input.triggerEvent || 'recent news'}! Would love to connect.`, delayDays: 1, tips: ['Quick follow-up on LinkedIn'] },
        { stepNumber: 3, channel: 'email', type: 'follow_up_1', subject: `Re: Congrats on ${input.triggerEvent || 'the recent news'}`, body: `Hi ${input.leadName},\n\nFollowing up — given ${input.companyName}'s ${input.triggerEvent || 'recent news'}, I thought you might find this relevant: [specific insight].\n\n15 min this week?\n\nBest`, delayDays: 3, tips: ['Tie back to the trigger event', 'Make a specific ask'] },
      );
      break;
    case 'mutual-connection':
      steps.push(
        { stepNumber: 1, channel: 'email', type: 'warm_intro', subject: `${input.mutualConnection || 'Our mutual contact'} suggested we connect`, body: `Hi ${input.leadName},\n\n${input.mutualConnection || 'Our mutual contact'} suggested I reach out. They mentioned ${input.companyName} might be interested in [specific value].\n\nWould you be open to a brief intro call?\n\nBest`, delayDays: 0, tips: ['Lead with the mutual connection', 'Build trust through the referral'] },
        { stepNumber: 2, channel: 'email', type: 'follow_up_1', subject: `Re: ${input.mutualConnection || 'Our mutual contact'} suggested we connect`, body: `Hi ${input.leadName},\n\nJust a quick follow-up. ${input.mutualConnection || 'Our contact'} also mentioned [additional context]. Happy to work around your schedule.\n\nBest`, delayDays: 4, tips: ['Add context from the mutual connection'] },
        { stepNumber: 3, channel: 'email', type: 'break_up', subject: `Re: ${input.mutualConnection || 'Our mutual contact'} suggested we connect`, body: `Hi ${input.leadName},\n\nI'll assume the timing isn't right. Feel free to reach out if things change — or let ${input.mutualConnection || 'our contact'} know and they can reconnect us.\n\nBest`, delayDays: 10, tips: ['Reference the mutual connection in the close'] },
      );
      break;
  }

  return steps;
}

// ============================================================
// Save to Database
// ============================================================

/**
 * Save an outreach sequence to the database
 */
export async function saveOutreachSequence(
  leadId: string,
  sequence: OutreachSequence
): Promise<void> {
  const { db } = await import('@/lib/db');
  
  for (const step of sequence.steps) {
    await db.outreach.create({
      data: {
        leadId,
        channel: step.channel,
        type: step.type,
        subject: step.subject || null,
        body: step.body,
        status: 'draft',
      },
    });
  }
}
