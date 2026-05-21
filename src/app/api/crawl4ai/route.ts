import { NextRequest, NextResponse } from 'next/server';
import { webRead } from '@/lib/agent-reach-bridge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, extractSchema, format = 'markdown' } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Read the page using webRead (Jina Reader)
    const readResult = await webRead(url, format === 'text' ? 'text' : 'markdown');

    if (!readResult.success) {
      return NextResponse.json(
        { success: false, error: readResult.error || 'Failed to crawl URL' },
        { status: 500 }
      );
    }

    let content = readResult.data.content || '';
    const title = readResult.data.title || '';
    const wordCount = readResult.data.wordCount || 0;

    // If format is 'text', strip markdown
    if (format === 'text') {
      content = content
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').trim())
        .trim();
    }

    // If extractSchema is provided, use LLM to extract structured data
    let extracted: Record<string, unknown> | undefined;

    if (extractSchema && typeof extractSchema === 'object' && Object.keys(extractSchema).length > 0) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const zai = await ZAI.create();

        const schemaDescription = Object.entries(extractSchema)
          .map(([key, description]) => `"${key}": ${description}`)
          .join(', ');

        const extractResult = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a data extraction assistant. Extract structured data from the provided web page content according to the given schema. Return ONLY a valid JSON object matching the schema. If a field cannot be found, set it to null.`,
            },
            {
              role: 'user',
              content: `Extract the following fields from this page:\n${schemaDescription}\n\nPage content:\n${content.slice(0, 10000)}`,
            },
          ],
          temperature: 0.1,
        });

        const rawText = extractResult.choices?.[0]?.message?.content || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extracted = JSON.parse(jsonMatch[0]);
        }
      } catch (llmError) {
        console.error('LLM extraction failed:', llmError);
        // Return without extracted data
      }
    }

    // Format output based on requested format
    let outputContent = content;
    if (format === 'json') {
      outputContent = JSON.stringify({
        title,
        content,
        wordCount,
        url,
        ...(extracted && { extracted }),
      }, null, 2);
    }

    return NextResponse.json({
      success: true,
      content: outputContent,
      title,
      extracted,
      wordCount,
    });
  } catch (error) {
    console.error('Error in crawl4ai endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Crawling failed' },
      { status: 500 }
    );
  }
}
