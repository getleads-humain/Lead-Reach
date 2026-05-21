import { NextRequest, NextResponse } from 'next/server';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import { callLLM, callLLMForJSON, MODEL_PRIMARY, MODEL_VISION } from '@/lib/llm';

export const maxDuration = 300;

interface ResearchStep {
  step: number;
  action: string;
  detail: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, depth = 'standard' } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const steps: ResearchStep[] = [];
    const sources: string[] = [];
    let allContent = '';

    // Step 1: Search the web
    steps.push({
      step: 1,
      action: 'search',
      detail: `Searching for: "${query}"`,
      timestamp: new Date().toISOString(),
    });

    const searchResult = await exaSearch(query, depth === 'deep' ? 15 : depth === 'standard' ? 10 : 5);

    if (!searchResult.success || searchResult.data.length === 0) {
      return NextResponse.json({
        success: false,
        query,
        findings: 'No results found for the given query.',
        sources: [],
        steps,
      });
    }

    const searchResults = searchResult.data;
    searchResults.forEach((r) => {
      if (r.url) sources.push(r.url);
    });

    steps.push({
      step: 2,
      action: 'search_results',
      detail: `Found ${searchResults.length} results`,
      timestamp: new Date().toISOString(),
    });

    // Step 2: Read top results
    const topN = depth === 'deep' ? 5 : depth === 'standard' ? 3 : 2;
    const topResults = searchResults.slice(0, topN);

    steps.push({
      step: 3,
      action: 'read',
      detail: `Reading top ${topN} results in detail`,
      timestamp: new Date().toISOString(),
    });

    const readPromises = topResults.map(async (r) => {
      try {
        const readResult = await webRead(r.url);
        if (readResult.success) {
          return { url: r.url, title: readResult.data.title, content: readResult.data.content };
        }
        return null;
      } catch {
        return null;
      }
    });

    const readResults = await Promise.all(readPromises);
    const validReads = readResults.filter((r): r is NonNullable<typeof r> => r !== null);

    for (const read of validReads) {
      allContent += `\n\n--- Source: ${read.title} (${read.url}) ---\n${read.content?.slice(0, 6000) || ''}`;
    }

    // Step 3: LLM synthesis (glm-4.7-flash + glm-4.6v-flash)
    steps.push({
      step: 4,
      action: 'synthesize',
      detail: `Synthesizing findings using AI (${MODEL_PRIMARY} + ${MODEL_VISION})`,
      timestamp: new Date().toISOString(),
    });

    let findings = (await callLLM({
      systemPrompt: 'You are a research analyst. Synthesize the following research findings into a comprehensive, well-structured analysis. Include key insights, trends, and actionable takeaways. Cite sources where appropriate.',
      userMessage: `Research query: "${query}"\n\nResearch findings:\n${allContent.slice(0, 15000)}`,
      temperature: 0.3,
      model: MODEL_PRIMARY,
      useFallback: true,
    })) || 'Unable to synthesize findings.';

    // Step 4: If deep, do a second round
    if (depth === 'deep') {
      steps.push({
        step: 5,
        action: 'follow_up',
        detail: 'Generating follow-up questions for deeper research',
        timestamp: new Date().toISOString(),
      });

      const followUpQueries = await callLLMForJSON<string[]>(
        'You are a research strategist. Based on the initial findings, suggest 2-3 specific follow-up search queries that would fill knowledge gaps. Return ONLY a JSON array of query strings.',
        `Original query: "${query}"\n\nInitial findings summary:\n${findings.slice(0, 4000)}`,
        { temperature: 0.5, model: MODEL_PRIMARY, useFallback: true }
      ) || [];

      // Execute follow-up searches
      for (const fq of followUpQueries.slice(0, 3)) {
        steps.push({
          step: steps.length + 1,
          action: 'follow_up_search',
          detail: `Follow-up search: "${fq}"`,
          timestamp: new Date().toISOString(),
        });

        const followUpSearchResult = await exaSearch(fq, 5);
        if (followUpSearchResult.success && followUpSearchResult.data.length > 0) {
          const fuTopResult = followUpSearchResult.data[0];
          sources.push(fuTopResult.url);

          const fuReadResult = await webRead(fuTopResult.url);
          if (fuReadResult.success) {
            allContent += `\n\n--- Follow-up Source: ${fuReadResult.data.title} (${fuTopResult.url}) ---\n${fuReadResult.data.content?.slice(0, 4000) || ''}`;
          }
        }
      }

      // Final synthesis with all content
      steps.push({
        step: steps.length + 1,
        action: 'final_synthesis',
        detail: `Producing final deep research synthesis (${MODEL_PRIMARY} + ${MODEL_VISION})`,
        timestamp: new Date().toISOString(),
      });

      const finalFindings = await callLLM({
        systemPrompt: 'You are a senior research analyst. Produce a comprehensive, detailed research report based on all gathered information. Include executive summary, key findings, detailed analysis, and recommendations. Cite sources.',
        userMessage: `Research query: "${query}"\n\nAll research content:\n${allContent.slice(0, 20000)}`,
        temperature: 0.3,
        model: MODEL_PRIMARY,
        useFallback: true,
      });

      if (finalFindings) findings = finalFindings;
    }

    return NextResponse.json({
      success: true,
      query,
      findings,
      sources: [...new Set(sources)],
      steps,
      models: [MODEL_PRIMARY, MODEL_VISION],
    });
  } catch (error) {
    console.error('Error in deep research endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Deep research failed', query: '', findings: '', sources: [], steps: [] },
      { status: 500 }
    );
  }
}
