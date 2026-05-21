import { NextRequest, NextResponse } from 'next/server';
import { webRead } from '@/lib/agent-reach-bridge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, action = 'read', selectors } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    switch (action) {
      case 'read': {
        const result = await webRead(url);
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error || 'Failed to read URL' },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            content: result.data.content,
            title: result.data.title,
            wordCount: result.data.wordCount,
          },
        });
      }

      case 'extract': {
        const readResult = await webRead(url);
        if (!readResult.success) {
          return NextResponse.json(
            { success: false, error: readResult.error || 'Failed to read URL for extraction' },
            { status: 500 }
          );
        }

        // Use LLM to extract structured data
        try {
          const ZAI = (await import('z-ai-web-dev-sdk')).default;
          const zai = await ZAI.create();

          const extractPrompt = `You are a data extraction assistant. Extract the following information from the web page content.
${selectors ? `Focus on these selectors/fields: ${selectors.join(', ')}` : 'Extract key information like company name, contact details, addresses, phone numbers, and emails.'}

Page content:
${readResult.data.content?.slice(0, 8000) || ''}

Return a JSON object with the extracted data. Only include fields that were found in the content.`;

          const llmResult = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are a precise data extraction assistant. Always respond with valid JSON only.' },
              { role: 'user', content: extractPrompt },
            ],
            temperature: 0.1,
          });

          const extractedText = llmResult.choices?.[0]?.message?.content || '';

          return NextResponse.json({
            success: true,
            data: {
              content: readResult.data.content,
              title: readResult.data.title,
              wordCount: readResult.data.wordCount,
              extracted: extractedText,
            },
          });
        } catch (llmError) {
          console.error('LLM extraction failed, returning raw content:', llmError);
          return NextResponse.json({
            success: true,
            data: {
              content: readResult.data.content,
              title: readResult.data.title,
              wordCount: readResult.data.wordCount,
            },
          });
        }
      }

      case 'screenshot': {
        return NextResponse.json({
          success: false,
          error: 'Screenshot capture is not available in server environment. Use the "read" action to get page content as markdown.',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}. Supported actions: read, screenshot, extract` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in browser endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Browser operation failed' },
      { status: 500 }
    );
  }
}
