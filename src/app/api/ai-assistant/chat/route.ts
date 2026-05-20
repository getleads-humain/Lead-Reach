import { NextRequest, NextResponse } from 'next/server';

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

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const chatMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const result = await zai.chat.completions.create({
      messages: chatMessages,
      temperature: 0.7,
    });

    if (!result || !result.choices || !Array.isArray(result.choices)) {
      return NextResponse.json(
        { error: 'LLM API returned an invalid response structure' },
        { status: 502 }
      );
    }

    const response = result.choices?.[0]?.message?.content || '';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return NextResponse.json(
      { error: 'AI chat request failed' },
      { status: 500 }
    );
  }
}
