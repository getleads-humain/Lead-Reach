import { NextRequest, NextResponse } from 'next/server';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import { callLLM, callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 300;

interface ProspectData {
  companyName: string;
  website?: string;
  industry?: string;
  description?: string;
  location?: string;
  employeeCount?: string;
  revenueEstimate?: string;
  keyContacts?: { name: string; title: string }[];
  competitivePosition?: string;
  techStack?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Step 1: Search for company information
    const searchResult = await exaSearch(`"${companyName}" company profile business`, 10);

    let companyContent = '';
    const sources: string[] = [];

    if (searchResult.success && searchResult.data.length > 0) {
      // Read the top results for detailed company info
      const topResults = searchResult.data.slice(0, 3);
      const readPromises = topResults.map(async (r) => {
        sources.push(r.url);
        try {
          const readResult = await webRead(r.url);
          if (readResult.success) {
            return { title: readResult.data.title, content: readResult.data.content };
          }
          return null;
        } catch {
          return null;
        }
      });

      const readResults = await Promise.all(readPromises);
      for (const read of readResults) {
        if (read) {
          companyContent += `\n\n--- ${read.title} ---\n${read.content?.slice(0, 5000) || ''}`;
        }
      }
    }

    // Step 2: Search for competitive analysis
    const competitiveResult = await exaSearch(`"${companyName}" competitors alternatives market`, 5);
    let competitiveContent = '';

    if (competitiveResult.success && competitiveResult.data.length > 0) {
      for (const r of competitiveResult.data.slice(0, 2)) {
        sources.push(r.url);
        try {
          const readResult = await webRead(r.url);
          if (readResult.success) {
            competitiveContent += `\n\n--- ${readResult.data.title} ---\n${readResult.data.content?.slice(0, 3000) || ''}`;
          }
        } catch {
          // Skip failed reads
        }
      }
    }

    // Step 3: Use LLM to analyze and synthesize
    let company: ProspectData = { companyName };
    try {
      const parsed = await callLLMForJSON<ProspectData>(
        `You are a sales intelligence analyst. Analyze the provided company information and return a JSON object with this structure: { "companyName": string, "website": string|null, "industry": string|null, "description": string, "location": string|null, "employeeCount": string|null, "revenueEstimate": string|null, "keyContacts": [{name, title}], "competitivePosition": string, "techStack": [string] }. Return ONLY valid JSON. Always respond in English.`,
        `Company: "${companyName}"\n\nResearch content:\n${companyContent.slice(0, 12000)}`,
        { temperature: 0.2, maxTokens: 4000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );
      if (parsed && parsed.companyName) company = parsed;
    } catch {
      // Fallback to basic company data
    }

    // Step 4: Competitive analysis
    const competitiveAnalysis = (await callLLM({
      systemPrompt: `You are a competitive intelligence analyst. Provide a brief competitive analysis based on the provided information. Focus on market position, strengths, weaknesses, and competitive threats. Be concise but insightful. Always respond in English.`,
      userMessage: `Company: "${companyName}"\nCompany data: ${JSON.stringify(company).slice(0, 2000)}\n\nCompetitive landscape:\n${competitiveContent.slice(0, 8000)}`,
      temperature: 0.3,
      maxTokens: 2000,
      model: MODEL_PRIMARY,
      thinkingBudget: 'standard',
    })) || 'Competitive analysis unavailable.';

    // Step 5: Identify opportunities
    let opportunities: string[] = [];
    try {
      const oppParsed = await callLLMForJSON<string[]>(
        `You are a sales strategist. Based on the company information and competitive analysis, identify 3-5 specific sales opportunities or angles. Return ONLY a JSON array of strings, each describing a specific opportunity. Always respond in English.`,
        `Company: "${companyName}"\nCompany data: ${JSON.stringify(company).slice(0, 2000)}\nCompetitive analysis: ${competitiveAnalysis.slice(0, 3000)}`,
        { temperature: 0.4, maxTokens: 1500, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
      );
      if (Array.isArray(oppParsed)) opportunities = oppParsed;
    } catch {
      opportunities = ['Unable to identify specific opportunities'];
    }

    return NextResponse.json({
      company,
      competitiveAnalysis,
      opportunities,
    });
  } catch (error) {
    console.error('Error in company intelligence endpoint:', error);
    return NextResponse.json(
      { error: 'Company intelligence analysis failed' },
      { status: 500 }
    );
  }
}
