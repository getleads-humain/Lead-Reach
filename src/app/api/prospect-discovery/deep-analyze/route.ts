import { NextRequest, NextResponse } from 'next/server';
import { callLLM, callLLMForJSON } from '@/lib/llm';

export const maxDuration = 300;

interface DeepAnalysisResult {
  success: boolean;
  query: string;
  companyName: string;
  analysis: {
    businessOverview: string;
    coreServiceLines: Array<{ segment: string; services: string; target: string }>;
    uniqueSolutions: Array<{ title: string; problem: string; solution: string; whyUnique: string }>;
    keyMetrics: Array<{ metric: string; value: string }>;
    industrySectors: string[];
    competitiveDifferentiation: string[];
    targetCustomerSegments: string[];
    suggestedPromptSnippets: Array<{ id: string; title: string; description: string; icon: string; prompt: string }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const targetUrl = url.trim();

    // Step 1: Read the website content using z-ai-web-dev-sdk
    let pageContent = '';
    let pageTitle = '';
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const pageResult = await zai.functions.invoke('page_reader', { url: targetUrl });
      if (pageResult && typeof pageResult === 'object') {
        const result = pageResult as { title?: string; content?: string; text?: string };
        pageContent = result.content || result.text || '';
        pageTitle = result.title || '';
      } else if (typeof pageResult === 'string') {
        pageContent = pageResult;
      }
    } catch (err) {
      console.warn('[deep-analyze] page_reader failed, continuing with search:', err instanceof Error ? err.message : 'Unknown');
    }

    // Step 2: Supplement with web search
    let searchContext = '';
    let companyName = pageTitle || '';
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      // Extract a company name hint from URL
      const urlHost = new URL(targetUrl).hostname.replace('www.', '');
      const searchResult = await zai.functions.invoke('web_search', {
        query: `${urlHost} company overview services products`,
        num: 10,
      });
      if (Array.isArray(searchResult) && searchResult.length > 0) {
        const snippets = searchResult.slice(0, 5).map((r: { name?: string; snippet?: string; url?: string }) =>
          `${r.name || ''}: ${r.snippet || ''}`
        ).join('\n');
        searchContext = snippets;
      }
    } catch (err) {
      console.warn('[deep-analyze] web_search failed:', err instanceof Error ? err.message : 'Unknown');
    }

    // Step 3: Use LLM in "thinking mode" to deeply analyze the business
    const combinedContent = [
      pageContent ? `=== WEBSITE CONTENT ===\n${pageContent.slice(0, 15000)}` : '',
      searchContext ? `=== WEB SEARCH RESULTS ===\n${searchContext}` : '',
    ].filter(Boolean).join('\n\n');

    if (!combinedContent) {
      return NextResponse.json({
        success: false,
        error: 'Could not retrieve any content from the URL or web search. Please try a different URL.',
      }, { status: 422 });
    }

    const analysis = await callLLMForJSON<DeepAnalysisResult['analysis']>(
      `You are a senior B2B business analyst and strategic consultant. You are analyzing a company's website and web presence to build a comprehensive prospect profile for a B2B lead generation platform called LeadReach AI.

Your task is to deeply analyze this business and produce a structured JSON output. Think carefully about:

1. What the company ACTUALLY does — not just marketing fluff, but the real value proposition
2. Their service lines and which customer segments each targets
3. Unique solutions they offer — what makes them different from competitors
4. Key metrics that define their business (revenue, employees, market position, etc.)
5. Industry sectors they operate in
6. Their competitive differentiation — what truly sets them apart
7. Target customer segments — who are their ideal clients
8. Smart next-prompt suggestions for a B2B lead generation workflow

For suggestedPromptSnippets, generate 4-5 contextual prompts that would be useful next steps in a B2B prospecting workflow. Each should have:
- id: a short kebab-case identifier
- title: A clear action-oriented title
- description: One line description of what this prompt does
- icon: An emoji or lucide icon name
- prompt: The actual prompt text to execute

Example snippets for a financial services firm:
- { id: "generate-icps", title: "Develop ICPs", description: "Generate Ideal Customer Profiles based on the analysis", icon: "Users", prompt: "Generate all relevant Ideal Customer Profiles (ICPs) for this company based on the business analysis" }
- { id: "icp-table", title: "Build ICP Table", description: "Create a detailed ICP table with KPIs and metrics", icon: "Table", prompt: "Build a comprehensive ICP table with KPIs, decision triggers, and buying journeys" }
- { id: "agent-training", title: "Agent Swarm Training", description: "Define focus areas for AI agent training", icon: "Bot", prompt: "Define agent swarm training focus areas based on this company's target segments" }
- { id: "competitive-analysis", title: "Competitive Landscape", description: "Analyze the competitive landscape and positioning", icon: "Swords", prompt: "Perform a competitive landscape analysis for this company" }

Return ONLY a JSON object with this exact structure:
{
  "businessOverview": "3-5 sentences about what the company does, their market position, and their core value proposition",
  "coreServiceLines": [
    { "segment": "Segment name", "services": "Description of services offered", "target": "Target customer type" }
  ],
  "uniqueSolutions": [
    { "title": "Solution name", "problem": "Problem it solves", "solution": "How it solves it", "whyUnique": "Why it's unique" }
  ],
  "keyMetrics": [
    { "metric": "Metric name", "value": "Value or estimate" }
  ],
  "industrySectors": ["Sector1", "Sector2"],
  "competitiveDifferentiation": ["Differentiator 1", "Differentiator 2"],
  "targetCustomerSegments": ["Segment 1", "Segment 2"],
  "suggestedPromptSnippets": [
    { "id": "snippet-id", "title": "Title", "description": "Description", "icon": "IconName", "prompt": "Full prompt text" }
  ]
}`,
      `Analyze the following business information from URL: ${targetUrl}

${combinedContent}

Provide a comprehensive, deeply researched business analysis. Be specific and insightful — go beyond surface-level observations. If the company name is not clear from the content, try to infer it from the URL or search results.`,
      { temperature: 0.3, maxTokens: 4096 }
    );

    if (!analysis) {
      return NextResponse.json({
        success: false,
        error: 'AI analysis failed. Please try again.',
      }, { status: 500 });
    }

    // Extract company name from the analysis or URL
    if (!companyName) {
      companyName = new URL(targetUrl).hostname.replace('www.', '').split('.')[0];
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    }

    // Try to extract company name from the analysis content
    const overviewMatch = analysis.businessOverview?.match(/([A-Z][a-zA-Z0-9]+(?:\s[A-Z][a-zA-Z0-9]+)*)/);
    if (overviewMatch && overviewMatch[1].length > 2) {
      // Use the first capitalized entity in the overview as the company name
      // But only if it seems like a real company name (not common words)
      const commonWords = ['The', 'This', 'Our', 'Their', 'These', 'Those', 'With', 'From', 'They'];
      if (!commonWords.includes(overviewMatch[1])) {
        companyName = overviewMatch[1];
      }
    }

    const result: DeepAnalysisResult = {
      success: true,
      query: targetUrl,
      companyName,
      analysis,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[deep-analyze] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: `Deep analysis failed: ${msg}`,
    }, { status: 500 });
  }
}
