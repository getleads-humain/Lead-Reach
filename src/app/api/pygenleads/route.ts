import { NextRequest, NextResponse } from 'next/server';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';

export const maxDuration = 300;

interface GeneratedLead {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, location, source = 'web', limit = 20 } = body;

    if (!keyword || !location) {
      return NextResponse.json(
        { error: 'Keyword and location are required' },
        { status: 400 }
      );
    }

    // Build search queries based on source
    const queries: string[] = [];

    switch (source) {
      case 'google-maps':
        queries.push(`"${keyword}" in ${location} business address phone`);
        queries.push(`${keyword} ${location} company directory`);
        break;
      case 'yelp':
        queries.push(`site:yelp.com ${keyword} ${location}`);
        break;
      case 'web':
      default:
        queries.push(`"${keyword}" in ${location} business`);
        queries.push(`${keyword} companies ${location} contact`);
        break;
    }

    const leads: GeneratedLead[] = [];
    const seenNames = new Set<string>();

    for (const query of queries) {
      if (leads.length >= limit) break;

      const searchResult = await exaSearch(query, Math.min(limit - leads.length, 15));

      if (!searchResult.success || searchResult.data.length === 0) continue;

      // Read top search results to extract business details
      const topResults = searchResult.data.slice(0, 5);
      const readPromises = topResults.map(async (r) => {
        try {
          const readResult = await webRead(r.url);
          if (readResult.success) {
            return { url: r.url, title: r.title, content: readResult.data.content };
          }
          return null;
        } catch {
          return null;
        }
      });

      const readResults = await Promise.all(readPromises);

      // Use LLM to extract structured business data from content
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const zai = await ZAI.create();

        const combinedContent = readResults
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map((r) => `--- ${r.title} (${r.url}) ---\n${r.content?.slice(0, 3000) || ''}`)
          .join('\n\n');

        if (!combinedContent) continue;

        const extractResult = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a business data extraction assistant. Extract business listings from the provided web content. For each business found, provide: name, phone (if available), email (if available), address (if available), and website URL. Return ONLY a JSON array of objects with these fields: name, phone, email, address, url. If a field is not found, omit it or set to null. Only include real businesses, not ads or navigation elements.`,
            },
            {
              role: 'user',
              content: `Extract ${keyword} businesses in ${location} from:\n\n${combinedContent.slice(0, 10000)}`,
            },
          ],
          temperature: 0.1,
        });

        const rawText = extractResult.choices?.[0]?.message?.content || '[]';
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const extracted: GeneratedLead[] = JSON.parse(jsonMatch[0]);
          for (const lead of extracted) {
            if (lead.name && !seenNames.has(lead.name.toLowerCase())) {
              seenNames.add(lead.name.toLowerCase());
              leads.push({
                name: lead.name,
                phone: lead.phone || undefined,
                email: lead.email || undefined,
                address: lead.address || undefined,
                url: lead.url || undefined,
              });
            }
          }
        }
      } catch (llmError) {
        console.error('LLM extraction failed for query:', query, llmError);

        // Fallback: use search result titles as basic leads
        for (const r of topResults) {
          const name = r.title.replace(/[-|–—].*/, '').trim();
          if (name && !seenNames.has(name.toLowerCase()) && name.length > 2 && name.length < 100) {
            seenNames.add(name.toLowerCase());
            leads.push({
              name,
              url: r.url,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      leads: leads.slice(0, limit),
    });
  } catch (error) {
    console.error('Error in pygenleads endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Lead generation failed' },
      { status: 500 }
    );
  }
}
