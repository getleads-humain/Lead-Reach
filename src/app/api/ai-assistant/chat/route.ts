import { NextRequest, NextResponse } from 'next/server';
import { callLLM, MODEL_PRIMARY, MODEL_VISION } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, systemPrompt } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: 'Each message must have role and content' },
          { status: 400 }
        );
      }
    }

    // Build the system prompt — always instruct English responses
    const combinedSystem = (systemPrompt || 'You are a helpful AI assistant.') +
      '\n\nIMPORTANT: Always respond in English. Never respond in Chinese or any other language.';

    // Build conversation context from the full message history
    // Include recent messages for context, but use the last user message as the main prompt
    const recentMessages = messages.slice(-10); // Last 10 messages for context
    const conversationContext = recentMessages
      .slice(0, -1) // All messages except the last one (which becomes the user message)
      .map((m: { role: string; content: string }) => {
        const prefix = m.role === 'user' ? 'User' : 'Assistant';
        return `${prefix}: ${m.content}`;
      })
      .join('\n\n');

    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
    const userContent = lastUserMessage?.content || '';

    // If there's conversation context, include it in the user message
    const fullUserMessage = conversationContext
      ? `Conversation so far:\n${conversationContext}\n\nCurrent question: ${userContent}`
      : userContent;

    const result = await callLLM({
      systemPrompt: combinedSystem,
      userMessage: fullUserMessage,
      temperature: 0.7,
      model: MODEL_PRIMARY,
      useFallback: true,
    });

    if (result === null) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ response: result, models: [MODEL_PRIMARY, MODEL_VISION] });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return NextResponse.json(
      { error: 'AI chat request failed. Please try again.' },
      { status: 500 }
    );
  }
}
