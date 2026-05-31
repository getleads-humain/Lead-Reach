import { NextRequest, NextResponse } from 'next/server';
import { callLLM, MODEL_PRIMARY, MODEL_VISION, notifyRateLimitHit } from '@/lib/llm';

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

    // Build the combined prompt for the centralized LLM utility
    const combinedSystem = systemPrompt || 'You are a helpful AI assistant.';
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
    const userContent = lastUserMessage?.content || '';

    const result = await callLLM({
      systemPrompt: combinedSystem,
      userMessage: userContent,
      temperature: 0.7,
      model: MODEL_PRIMARY,
      useFallback: true,
    });

    if (result === null) {
      // Return a more helpful error message instead of a generic 503
      return NextResponse.json(
        {
          error: 'AI service is currently busy. Please wait a moment and try again.',
          retryable: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ response: result, models: [MODEL_PRIMARY, MODEL_VISION] });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);

    // Check if it's a rate limit error
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('429') || msg.includes('rate limit')) {
      notifyRateLimitHit();
      return NextResponse.json(
        {
          error: 'The AI service is currently experiencing high demand. Please wait about 10 seconds and try again.',
          retryable: true,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'AI chat request failed. Please try again.' },
      { status: 500 }
    );
  }
}
