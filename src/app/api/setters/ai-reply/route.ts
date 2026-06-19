/**
 * /api/setters/ai-reply
 *
 * AI Setter conversation reply endpoint.
 *
 * Simulates the AI Setter persona that handles inbound lead conversations
 * across SMS, WhatsApp, Instagram, Messenger, and Email. The AI:
 *   1. Reads the setter persona (name, language, channels, qualification rules)
 *   2. Reads the conversation history
 *   3. Generates the next reply in the setter's voice, with:
 *      - Qualification question (if not yet asked)
 *      - Booking link (if lead is qualified)
 *      - Objection handling (if lead pushed back)
 *      - Graceful exit (if lead is disqualified)
 *
 * Returns:
 *   {
 *     reply: string,           // the AI setter's next message
 *     action: 'qualify' | 'book' | 'objection' | 'disqualify' | 'nurture',
 *     qualificationScore: number (0-100),
 *     nextQuestionToAsk?: string,
 *     bookingSuggested?: boolean
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 90;
export const dynamic = 'force-dynamic';

interface ConversationMessage {
  role: 'lead' | 'setter' | 'system';
  content: string;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      setterId,
      conversationHistory = [],
      leadName,
      leadChannel,
      leadContext,
      userInstruction,
    } = body as {
      setterId?: string;
      conversationHistory?: ConversationMessage[];
      leadName?: string;
      leadChannel?: string;
      leadContext?: Record<string, unknown>;
      userInstruction?: string;
    };

    if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
      return NextResponse.json({ error: 'conversationHistory array is required' }, { status: 400 });
    }

    // Load setter persona if provided
    let setter: Awaited<ReturnType<typeof db.aISetter.findUnique>> = null;
    if (setterId) {
      try {
        setter = await db.aISetter.findUnique({ where: { id: setterId } });
      } catch {
        // Setter not found — proceed with defaults
      }
    }

    const setterName = setter?.name || 'AI Setter';
    const setterLanguage = setter?.language || 'en';
    const setterDescription = setter?.description || 'A professional B2B AI setter that qualifies leads and books meetings.';
    let qualificationRules: Record<string, unknown> | null = null;
    if (setter?.qualificationRules) {
      try {
        qualificationRules = JSON.parse(setter.qualificationRules);
      } catch { /* not valid JSON */ }
    }
    const calendarLink = setter?.calendarLink || '';

    const lastLeadMessage = [...conversationHistory].reverse().find(m => m.role === 'lead');
    if (!lastLeadMessage) {
      return NextResponse.json({ error: 'No lead message found in conversation history' }, { status: 400 });
    }

    const systemPrompt = `You are ${setterName}, an AI setter for a B2B sales team.

Persona:
${setterDescription}

Language: ${setterLanguage === 'en' ? 'English' : setterLanguage}
Channel: ${leadChannel || 'sms'}

${qualificationRules ? `Qualification rules: ${JSON.stringify(qualificationRules)}` : 'Qualification rules: qualify based on budget, authority, need, and timeline.'}

${calendarLink ? `Booking link (use when lead is qualified): ${calendarLink}` : 'No booking link configured — suggest scheduling a call.'}

Your job is to:
1. Qualify the lead using BANT (Budget, Authority, Need, Timeline) or the rules above
2. Handle objections empathetically
3. Move qualified leads toward booking a meeting
4. Disqualify unqualified leads gracefully
5. Nurture uncertain leads with a follow-up question

You ALWAYS respond in English (or the setter's language if non-English).
You NEVER make up information about the company or product.
You ALWAYS keep replies under 100 words (SMS-friendly) unless the channel is email.

Return JSON with this EXACT shape:
{
  "reply": "The next message the AI setter should send to the lead",
  "action": "qualify" | "book" | "objection" | "disqualify" | "nurture",
  "qualificationScore": number (0-100, where 100 = perfect fit),
  "nextQuestionToAsk": "Optional: the next qualification question to ask later (or null)",
  "bookingSuggested": boolean,
  "reasoning": "1-2 sentence internal reasoning (not shown to lead)"
}

Return ONLY valid JSON.`;

    const userMessage = `LEAD CONTEXT:
- Name: ${leadName || 'Unknown'}
- Channel: ${leadChannel || 'sms'}
${leadContext ? `- Additional context: ${JSON.stringify(leadContext)}` : ''}

CONVERSATION HISTORY (oldest → newest):
${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

${userInstruction ? `USER INSTRUCTION: ${userInstruction}\n\n` : ''}Generate the next reply as ${setterName}.`;

    const result = await callLLMForJSON<{
      reply?: string;
      action?: string;
      qualificationScore?: number;
      nextQuestionToAsk?: string | null;
      bookingSuggested?: boolean;
      reasoning?: string;
    }>(systemPrompt, userMessage, {
      temperature: 0.5,
      maxTokens: 1500,
      model: MODEL_PRIMARY,
      thinkingBudget: 'standard',
    });

    if (!result || !result.reply) {
      return NextResponse.json({
        reply: getDefaultReply(lastLeadMessage.content, leadChannel || 'sms'),
        action: 'nurture',
        qualificationScore: 50,
        nextQuestionToAsk: null,
        bookingSuggested: false,
        reasoning: 'AI setter failed — using fallback reply.',
      });
    }

    // Normalize action
    const validActions = new Set(['qualify', 'book', 'objection', 'disqualify', 'nurture']);
    if (!validActions.has(result.action || '')) {
      result.action = 'nurture';
    }

    return NextResponse.json({
      reply: result.reply,
      action: result.action,
      qualificationScore: typeof result.qualificationScore === 'number' ? result.qualificationScore : 50,
      nextQuestionToAsk: result.nextQuestionToAsk || null,
      bookingSuggested: result.bookingSuggested === true,
      reasoning: result.reasoning || '',
    });
  } catch (error) {
    console.error('[setters/ai-reply] Error:', error);
    return NextResponse.json(
      { error: 'AI setter reply failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDefaultReply(lastLeadMessage: string, channel: string): string {
  const trimmed = lastLeadMessage.slice(0, 100);
  if (channel === 'email') {
    return `Thanks for your reply! Could you share a bit more about what you're looking to accomplish? That'll help me point you in the right direction. — AI Setter`;
  }
  return `Thanks for the message! Quick question — what's prompting you to look into this right now?`;
}
