/**
 * /api/messaging/ai-compose
 *
 * AI message composer for multi-channel messaging.
 *
 * Generates channel-appropriate messages (SMS, WhatsApp, Instagram, Messenger, Email)
 * based on:
 *   - Channel (affects tone, length, format)
 *   - Conversation context (lead name, last message, status)
 *   - User's intent (reply, outreach, follow-up)
 *   - Optional setter persona
 *
 * Returns:
 *   {
 *     message: string,
 *     subject?: string,           // for email
 *     callToAction: string,
 *     toneAnalysis: string,
 *     channelOptimized: boolean
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 90;
export const dynamic = 'force-dynamic';

const CHANNEL_PROFILES: Record<string, { maxLength: number; tone: string; format: string }> = {
  sms: { maxLength: 160, tone: 'casual, concise, friendly', format: 'plain text, no formatting' },
  whatsapp: { maxLength: 300, tone: 'casual but professional, supports emojis', format: 'plain text, light emojis OK' },
  instagram: { maxLength: 220, tone: 'friendly, approachable, brand-aligned', format: 'plain text, 1 emoji max' },
  messenger: { maxLength: 250, tone: 'conversational, helpful', format: 'plain text' },
  email: { maxLength: 1500, tone: 'professional, personalized', format: 'subject + body, structured' },
  linkedin: { maxLength: 300, tone: 'professional, peer-to-peer', format: 'plain text, no emojis' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      channel,
      intent = 'reply',
      leadName,
      leadContext,
      conversationHistory = [],
      userInstruction,
      brandVoice,
    } = body as {
      channel: string;
      intent?: 'reply' | 'outreach' | 'follow_up' | 'nurture' | 'booking';
      leadName?: string;
      leadContext?: Record<string, unknown>;
      conversationHistory?: Array<{ role: string; content: string }>;
      userInstruction?: string;
      brandVoice?: string;
    };

    if (!channel) {
      return NextResponse.json({ error: 'channel is required (sms, whatsapp, instagram, messenger, email, linkedin)' }, { status: 400 });
    }

    const profile = CHANNEL_PROFILES[channel] || CHANNEL_PROFILES.sms;

    const systemPrompt = `You are an expert B2B messaging strategist for a lead generation platform. Generate a ${channel} message that is channel-optimized.

Channel profile for ${channel}:
- Max length: ${profile.maxLength} characters
- Tone: ${profile.tone}
- Format: ${profile.format}

Intent: ${intent}
${brandVoice ? `Brand voice: ${brandVoice}` : 'Brand voice: professional but approachable, customer-centric'}

${intent === 'booking' ? 'Include a clear call-to-action to book a meeting (offer a time window).' : ''}
${intent === 'follow_up' ? 'Reference prior context and add new value — do not just say "following up".' : ''}
${intent === 'nurture' ? 'Be valuable, low-pressure, and offer help without asking for anything.' : ''}
${intent === 'outreach' ? 'Hook with a specific observation, offer value, end with a low-friction ask.' : ''}

Return JSON with this EXACT shape:
{
  "message": "The full message body (under ${profile.maxLength} chars)",
  "subject": ${channel === 'email' ? '"Email subject line (under 60 chars)"' : 'null'},
  "callToAction": "The specific CTA used in the message",
  "toneAnalysis": "1 sentence describing the tone used and why it fits the channel",
  "channelOptimized": true
}

Rules:
- Always respond in English.
- Make the message feel personal and specific — no generic templates.
- Reference the lead's name, context, or last message where possible.
- Match the channel's character limit and formatting conventions.
- Return ONLY valid JSON.`;

    const userMessage = `LEAD CONTEXT:
- Name: ${leadName || 'Unknown'}
- Channel: ${channel}
- Intent: ${intent}
${leadContext ? `- Additional context: ${JSON.stringify(leadContext)}` : ''}

${conversationHistory.length > 0 ? `CONVERSATION HISTORY:\n${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n\n` : ''}${userInstruction ? `USER INSTRUCTION: ${userInstruction}\n\n` : ''}Generate the ${channel} message now.`;

    const result = await callLLMForJSON<{
      message?: string;
      subject?: string | null;
      callToAction?: string;
      toneAnalysis?: string;
      channelOptimized?: boolean;
    }>(systemPrompt, userMessage, {
      temperature: 0.6,
      maxTokens: 1200,
      model: MODEL_PRIMARY,
      thinkingBudget: 'standard',
    });

    if (!result || !result.message) {
      return NextResponse.json({
        message: getDefaultMessage(channel, intent, leadName || 'there'),
        subject: channel === 'email' ? `Following up — ${leadName || 'quick question'}` : null,
        callToAction: 'Reply with your availability',
        toneAnalysis: `Default ${channel} tone (AI composer unavailable).`,
        channelOptimized: false,
      });
    }

    return NextResponse.json({
      message: result.message,
      subject: result.subject || (channel === 'email' ? `Following up — ${leadName || 'quick question'}` : null),
      callToAction: result.callToAction || 'Reply with your availability',
      toneAnalysis: result.toneAnalysis || '',
      channelOptimized: true,
    });
  } catch (error) {
    console.error('[messaging/ai-compose] Error:', error);
    return NextResponse.json(
      { error: 'AI message composition failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDefaultMessage(channel: string, intent: string, leadName: string): string {
  if (channel === 'email') {
    return `Hi ${leadName},\n\nThanks for your interest. I'd love to learn more about what you're hoping to accomplish and see if we can help.\n\nAre you open to a quick 15-minute call this week?\n\nBest regards`;
  }
  if (intent === 'booking') {
    return `Hi ${leadName}! Would Tuesday at 2pm or Wednesday at 11am work for a quick 15-min call?`;
  }
  return `Hi ${leadName}! Quick question — what's prompting you to look into this right now?`;
}
