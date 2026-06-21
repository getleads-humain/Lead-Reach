/**
 * /api/bookings/ai-suggest
 *
 * AI-powered booking suggestions.
 *
 * Reviews booked and not-yet-booked conversations and produces:
 *   - List of leads most likely to book (with reasoning)
 *   - Suggested booking messages tailored to each lead
 *   - Optimal timing / channel recommendations
 *   - Risk factors that may prevent booking
 *
 * Returns:
 *   {
 *     suggestions: Array<{
 *       conversationId: string,
 *       leadName: string,
 *       channel: string,
 *       bookingProbability: number (0-100),
 *       suggestedMessage: string,
 *       bestTimeToSend: string,
 *       rationale: string
 *     }>,
 *     strategySummary: string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function GET() {
  return runSuggestions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    return runSuggestions(body?.filter as 'booked' | 'pending' | 'all' | undefined);
  } catch {
    return runSuggestions();
  }
}

async function runSuggestions(filter: 'booked' | 'pending' | 'all' = 'all') {
  try {
    // Load all recent conversations
    const conversations = await db.setterConversation.findMany({
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    // Apply filter
    const filtered = filter === 'booked'
      ? conversations.filter(c => c.bookedAppointment)
      : filter === 'pending'
        ? conversations.filter(c => !c.bookedAppointment && c.status !== 'disqualified')
        : conversations;

    if (filtered.length === 0) {
      return NextResponse.json({
        suggestions: [],
        strategySummary: 'No conversations match the filter. Start qualifying leads to generate booking suggestions.',
      });
    }

    const setters = await db.aISetter.findMany({ take: 20 });

    const snapshot = {
      filter,
      totalConversations: filtered.length,
      conversations: filtered.map(c => ({
        id: c.id,
        leadName: c.leadName,
        channel: c.leadChannel,
        status: c.status,
        qualificationScore: c.qualificationScore,
        booked: c.bookedAppointment,
        bookedAt: c.bookedAt,
        painPoints: c.painPoints,
        lastUpdated: c.updatedAt,
      })),
      setters: setters.map(s => ({
        name: s.name,
        calendarLink: s.calendarLink,
        conversionRate: s.conversionRate,
        avgResponseTime: s.avgResponseTime,
      })),
    };

    const systemPrompt = `You are a senior sales operations strategist. Given a list of conversations (with qualification scores, pain points, channels, and booking status), produce booking suggestions as JSON with this EXACT shape:

{
  "suggestions": [
    {
      "conversationId": "string",
      "leadName": "string",
      "channel": "string",
      "bookingProbability": number (0-100),
      "suggestedMessage": "Personalized booking message for this lead (1-3 sentences, channel-appropriate)",
      "bestTimeToSend": "Specific time window (e.g. 'Tuesday 10-11am local time')",
      "rationale": "1-2 sentence explanation referencing specific data points"
    }
  ],
  "strategySummary": "2-4 sentence overall booking strategy"
}

Rules:
- Only suggest leads who have NOT yet booked (booked === false) AND status is not 'disqualified'.
- Prioritize leads with qualificationScore >= 50 in the suggestions list.
- The suggestedMessage should reference their specific pain points or context.
- Best time should be a concrete time window, not "sometime this week".
- Always respond in English.
- Return ONLY valid JSON.
- If no leads are eligible for booking, return empty suggestions array with a strategySummary explaining why.`;

    const userMessage = `CONVERSATIONS SNAPSHOT:\n${JSON.stringify(snapshot, null, 2)}\n\nGenerate booking suggestions now.`;

    const result = await callLLMForJSON<{
      suggestions?: Array<{
        conversationId: string;
        leadName: string;
        channel: string;
        bookingProbability: number;
        suggestedMessage: string;
        bestTimeToSend: string;
        rationale: string;
      }>;
      strategySummary?: string;
    }>(systemPrompt, userMessage, {
      temperature: 0.4,
      maxTokens: 4000,
      model: MODEL_PRIMARY,
      thinkingBudget: 'standard',
    });

    if (!result || !Array.isArray(result.suggestions)) {
      return NextResponse.json({
        suggestions: [],
        strategySummary: 'Could not generate AI booking suggestions. Review pending conversations manually.',
      });
    }

    return NextResponse.json({
      suggestions: result.suggestions,
      strategySummary: result.strategySummary || `${result.suggestions.length} booking suggestions generated.`,
    });
  } catch (error) {
    console.error('[bookings/ai-suggest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate booking suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
