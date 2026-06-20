import { NextRequest, NextResponse } from 'next/server';
import { callLLM, callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import { filterJunkEmails } from '@/lib/email-filter';

export const maxDuration = 120;

// ============================================================
// Intent Classification
// ============================================================

type IntentType =
  | 'lead_discovery'
  | 'prospect_research'
  | 'outreach_generation'
  | 'pipeline_analysis'
  | 'icp_building'
  | 'campaign_creation'
  | 'lead_scoring'
  | 'data_enrichment'
  | 'general_question'
  | 'platform_navigation';

interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: Record<string, string>;
  targetView?: string;
  requiresRealData: boolean;
}

const INTENT_VIEW_MAP: Record<IntentType, string> = {
  lead_discovery: 'prospect-discovery',
  prospect_research: 'prospect-discovery',
  outreach_generation: 'outreach',
  pipeline_analysis: 'leads',
  icp_building: 'icp',
  campaign_creation: 'campaigns',
  lead_scoring: 'leads',
  data_enrichment: 'data-enrichment',
  general_question: 'dashboard',
  platform_navigation: 'dashboard',
};

async function classifyIntent(userMessage: string, conversationHistory: string): Promise<IntentResult> {
  const result = await callLLMForJSON<IntentResult>(
    `You are an intent classifier for LeadReach, a B2B lead generation platform. Classify the user's message into one of these intents:
- lead_discovery: User wants to find new leads, companies, or prospects
- prospect_research: User wants deep research on a specific company or person
- outreach_generation: User wants to draft outreach messages (email, LinkedIn, etc.)
- pipeline_analysis: User wants to analyze their pipeline or lead performance
- icp_building: User wants to define or refine their Ideal Customer Profile
- campaign_creation: User wants to create or plan a campaign
- lead_scoring: User wants to score or qualify leads
- data_enrichment: User wants to enrich lead data with more information
- platform_navigation: User is asking how to use the platform or navigate somewhere
- general_question: General questions not related to the above

Also extract entities like: industry, location, company_name, person_name, role, technology, size.

Return JSON: { "intent": "...", "confidence": 0.0-1.0, "entities": {}, "targetView": "...", "requiresRealData": true/false }`,
    `Conversation so far:\n${conversationHistory}\n\nCurrent message: ${userMessage}`,
    { temperature: 0.2, model: MODEL_PRIMARY, useFallback: true, thinkingBudget: 'quick' }
  );

  return result || {
    intent: 'general_question',
    confidence: 0.5,
    entities: {},
    targetView: 'dashboard',
    requiresRealData: false,
  };
}

// ============================================================
// Real Data Retrieval Functions
// ============================================================

interface DiscoveredLead {
  companyName: string;
  website?: string;
  description: string;
  industry?: string;
  location?: string;
  estimatedSize?: string;
  revenue?: string;
  techStack?: string[];
  relevanceScore: number;
  sourceUrl?: string;
  contactEmails?: string[];
  keyContacts?: string[];
}

async function discoverLeads(query: string, industry?: string, location?: string): Promise<DiscoveredLead[]> {
  const searchQuery = [query, industry, location].filter(Boolean).join(' ');
  const searchResult = await exaSearch(searchQuery, 10);

  if (!searchResult.success || !searchResult.data.length) {
    // If search fails entirely, use LLM to generate research-backed leads
    return generateLLMBackedLeads(query, industry, location);
  }

  const topResults = searchResult.data.slice(0, 5);
  const enrichedLeads: DiscoveredLead[] = [];

  for (const result of topResults) {
    let description = result.text || result.snippet || result.title || '';
    let contactEmails: string[] = [];
    let techStack: string[] = [];

    try {
      const readResult = await webRead(result.url);
      if (readResult.success && readResult.data?.content) {
        description = readResult.data.content.slice(0, 3000);

        // Extract emails from content
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = description.match(emailRegex) as string[] | null;
        if (foundEmails && foundEmails.length > 0) {
          // Proper domain-suffix filtering — uses `extractEmailDomain()` +
          // `isJunkEmail()` instead of substring `.includes()` checks,
          // which CodeQL flags as incomplete URL substring sanitization.
          contactEmails = filterJunkEmails([...new Set(foundEmails)]);
        }

        // Simple tech detection from content
        const techPatterns: Record<string, string> = {
          'React': 'react', 'Next.js': 'next.js', 'Vue.js': 'vue', 'Angular': 'angular',
          'Node.js': 'node.js', 'Python': 'python', 'AWS': 'aws', 'Google Cloud': 'google cloud',
          'Azure': 'azure', 'Shopify': 'shopify', 'WordPress': 'wordpress',
          'Stripe': 'stripe', 'HubSpot': 'hubspot', 'Salesforce': 'salesforce',
        };
        const lowerContent = description.toLowerCase();
        for (const [tech, pattern] of Object.entries(techPatterns)) {
          if (lowerContent.includes(pattern)) techStack.push(tech);
        }
      }
    } catch { /* fallback to search snippet */ }

    const leadData = await callLLMForJSON<DiscoveredLead>(
      `Extract company/lead information from this web content. Return JSON with these fields:
- companyName: The company name (string, required)
- website: Company website URL if found (string, optional)
- description: 2-3 sentence description of what the company does (string, required)
- industry: Primary industry (string, optional)
- location: HQ or primary location (string, optional)
- estimatedSize: Employee count range like "50-200" (string, optional)
- revenue: Revenue estimate if available (string, optional)
- relevanceScore: How relevant to the search query, 1-100 (number, required)

If the content is not about a real company, set companyName to "N/A".`,
      `Source URL: ${result.url}\nSource Title: ${result.title || ''}\n\nContent:\n${description.slice(0, 4000)}`,
      { temperature: 0.1, model: MODEL_PRIMARY, useFallback: true, thinkingBudget: 'quick' }
    );

    if (leadData && leadData.companyName && leadData.companyName !== 'N/A') {
      enrichedLeads.push({
        ...leadData,
        sourceUrl: result.url,
        relevanceScore: leadData.relevanceScore || 50,
        contactEmails: contactEmails.length > 0 ? contactEmails : undefined,
        techStack: techStack.length > 0 ? techStack : undefined,
      });
    }
  }

  // If we got no leads from web search, supplement with LLM-backed leads
  if (enrichedLeads.length === 0) {
    return generateLLMBackedLeads(query, industry, location);
  }

  return enrichedLeads.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate LLM-backed leads when web search fails or returns insufficient results.
 * These are research-grounded suggestions based on the LLM's knowledge.
 */
async function generateLLMBackedLeads(query: string, industry?: string, location?: string): Promise<DiscoveredLead[]> {
  const result = await callLLMForJSON<DiscoveredLead[]>(
    `You are a B2B lead generation analyst. Based on the user's search criteria, suggest 5 real, well-known companies that would be strong leads. These must be actual companies you have knowledge of.

For each company, provide:
- companyName: The actual company name
- website: Their website URL
- description: 2-3 sentence description of what they do and why they're a good lead
- industry: Their primary industry
- location: Their HQ location
- estimatedSize: Approximate employee count range
- revenue: Approximate revenue if known (e.g., "$100M-$500M")
- relevanceScore: How well they match the query, 1-100

Return a JSON array of objects. Only include real companies you are confident about.`,
    `Search query: "${query}"${industry ? `\nIndustry: ${industry}` : ''}${location ? `\nLocation: ${location}` : ''}`,
    { temperature: 0.3, model: MODEL_PRIMARY, useFallback: true, thinkingBudget: 'standard' }
  );

  if (result && Array.isArray(result)) {
    return result.filter(lead => lead.companyName && lead.companyName !== 'N/A').map(lead => ({
      ...lead,
      relevanceScore: lead.relevanceScore || 50,
    }));
  }

  return [];
}

// ============================================================
// Outreach Generation
// ============================================================

async function generateOutreach(
  targetDescription: string,
  senderIdentity: string,
  channel: string = 'email'
): Promise<string> {
  const result = await callLLM({
    systemPrompt: `You are an expert B2B outreach copywriter. Generate 3 personalized outreach messages for the described target.

Sender identity: ${senderIdentity || 'A B2B service provider'}
Channel: ${channel}

For each message, provide:
- Channel type
- Subject line (if email/LinkedIn)
- Body (personalized, value-driven, under 150 words)
- Tone (professional/friendly/bold)
- Call-to-action

Format as markdown with clear separators between each option. Make each message distinct in approach (e.g., pain-point focused, value-prop focused, social-proof focused).`,
    userMessage: `Target: ${targetDescription}`,
    temperature: 0.7,
    model: MODEL_PRIMARY,
    useFallback: true,
    thinkingBudget: 'standard',
  });

  return result || '';
}

// ============================================================
// ICP Building
// ============================================================

interface ICPProfile {
  industry: string;
  companySize: string;
  revenue: string;
  geography: string;
  technographic: string[];
  painPoints: string[];
  buyingSignals: string[];
  decisionMakerTitles: string[];
}

async function buildICP(description: string): Promise<ICPProfile | null> {
  return await callLLMForJSON<ICPProfile>(
    `You are an ICP (Ideal Customer Profile) analyst. Based on the user's description, create a detailed ICP profile.
Return JSON: { "industry": "...", "companySize": "...", "revenue": "...", "geography": "...", "technographic": [], "painPoints": [], "buyingSignals": [], "decisionMakerTitles": [] }`,
    `User description: ${description}`,
    { temperature: 0.3, model: MODEL_PRIMARY, useFallback: true, thinkingBudget: 'standard' }
  );
}

// ============================================================
// Lead Scoring
// ============================================================

interface LeadScore {
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  breakdown: {
    firmographic: number;
    technographic: number;
    intent: number;
    fit: number;
  };
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

async function scoreLead(leadDescription: string, icpDescription?: string): Promise<LeadScore | null> {
  return await callLLMForJSON<LeadScore>(
    `Score this lead based on the description${icpDescription ? ` and ICP: ${icpDescription}` : ''}.

Return JSON with EXACTLY these fields:
{
  "score": <number 1-100>,
  "tier": "hot"|"warm"|"cold",
  "breakdown": {
    "firmographic": <0-25>,
    "technographic": <0-25>,
    "intent": <0-25>,
    "fit": <0-25>
  },
  "reasoning": "<2-3 sentence explanation of the score>",
  "strengths": ["<array of 2-3 positive signals>"],
  "weaknesses": ["<array of 1-2 concerns or gaps>"]
}`,
    `Lead: ${leadDescription}`,
    { temperature: 0.2, model: MODEL_PRIMARY, useFallback: true, thinkingBudget: 'standard' }
  );
}

// ============================================================
// Action Button Type
// ============================================================

interface ActionButton {
  id: string;
  label: string;
  type: 'navigate' | 'save_leads' | 'save_outreach' | 'save_icp' | 'create_campaign' | 'deep_research' | 'enrich';
  targetView?: string;
  data?: any;
  variant?: 'primary' | 'secondary' | 'outline';
}

// ============================================================
// Main Handler
// ============================================================

interface PowerChatResponse {
  message: string;
  intent: IntentType;
  confidence: number;
  actions: ActionButton[];
  discoveredLeads?: DiscoveredLead[];
  outreachContent?: string;
  icpProfile?: ICPProfile;
  leadScore?: LeadScore;
  targetView?: string;
  deepResearchQuery?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, systemPrompt, currentPage } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    const userContent = lastUserMessage.content;

    // Build conversation context
    const recentMessages = messages.slice(-8);
    const conversationContext = recentMessages
      .slice(0, -1)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.slice(0, 500)}`)
      .join('\n');

    // Step 1: Classify intent
    const intent = await classifyIntent(userContent, conversationContext);
    const actions: ActionButton[] = [];
    let responseMessage = '';
    let discoveredLeads: DiscoveredLead[] | undefined;
    let outreachContent: string | undefined;
    let icpProfile: ICPProfile | undefined;
    let leadScore: LeadScore | undefined;
    let deepResearchQuery: string | undefined;

    // Step 2: Execute intent-specific logic
    switch (intent.intent) {
      case 'lead_discovery': {
        const { industry, location } = intent.entities;

        if (intent.requiresRealData || intent.confidence > 0.5) {
          const leads = await discoverLeads(userContent, industry, location);
          discoveredLeads = leads;

          if (leads.length > 0) {
            const leadsMarkdown = leads.map((lead, i) =>
              `### ${i + 1}. ${lead.companyName}${lead.website ? ` — [Website](${lead.website})` : ''}\n` +
              `${lead.description}\n` +
              `${lead.industry ? `**Industry:** ${lead.industry}  ` : ''}${lead.location ? `**Location:** ${lead.location}  ` : ''}${lead.estimatedSize ? `**Size:** ${lead.estimatedSize}` : ''}\n` +
              `${lead.revenue ? `**Revenue:** ${lead.revenue}  ` : ''}${lead.techStack?.length ? `**Tech:** ${lead.techStack.join(', ')}  ` : ''}${lead.contactEmails?.length ? `**Emails:** ${lead.contactEmails.join(', ')}  ` : ''}\n` +
              `**Relevance:** ${lead.relevanceScore}/100 ${lead.relevanceScore >= 75 ? '🔥' : lead.relevanceScore >= 50 ? '⚡' : '📌'}`
            ).join('\n\n');

            const isWebSourced = leads.some(l => l.sourceUrl);
            responseMessage = `## Discovered ${leads.length} Potential Leads\n\n${leadsMarkdown}\n\n---\n${isWebSourced
              ? '*I found these leads through live web research. Click "Save to Prospect Discovery" to add them to your pipeline, or "Deep Research" to investigate further.*'
              : '*These leads are based on industry knowledge. For real-time verified data, use Deep Research or Prospect Discovery.*'}`;

            actions.push({
              id: 'save-leads',
              label: 'Save to Prospect Discovery',
              type: 'save_leads',
              targetView: 'prospect-discovery',
              data: leads,
              variant: 'primary',
            });
            actions.push({
              id: 'deep-research',
              label: 'Deep Research',
              type: 'deep_research',
              targetView: 'prospect-discovery',
              variant: 'secondary',
            });
            actions.push({
              id: 'nav-prospects',
              label: 'Go to Prospect Discovery',
              type: 'navigate',
              targetView: 'prospect-discovery',
              variant: 'outline',
            });
          } else {
            responseMessage = `I searched for leads matching your criteria but couldn't find specific company results. Try:\n\n- **Be more specific**: Include industry, location, or company size\n- **Use Prospect Discovery**: Navigate to the dedicated search tool with 17+ channels\n- **Try Deep Research**: I can do a comprehensive investigation across multiple sources`;

            actions.push({
              id: 'nav-prospects',
              label: 'Go to Prospect Discovery',
              type: 'navigate',
              targetView: 'prospect-discovery',
              variant: 'primary',
            });
            actions.push({
              id: 'deep-research',
              label: 'Deep Research Instead',
              type: 'deep_research',
              variant: 'secondary',
            });
          }
        }
        break;
      }

      case 'outreach_generation': {
        const senderIdentity = systemPrompt?.includes('Identity') ? 'User of LeadReach' : '';
        const outreach = await generateOutreach(userContent, senderIdentity);
        outreachContent = outreach;

        if (outreach) {
          responseMessage = `## Generated Outreach Messages\n\n${outreach}\n\n---\n*Click "Save to Outreach" to add these to your campaigns, or tell me what to adjust.*`;

          actions.push({
            id: 'save-outreach',
            label: 'Save to Outreach',
            type: 'save_outreach',
            targetView: 'outreach',
            data: outreach,
            variant: 'primary',
          });
          actions.push({
            id: 'nav-outreach',
            label: 'Go to Outreach',
            type: 'navigate',
            targetView: 'outreach',
            variant: 'outline',
          });
        }
        break;
      }

      case 'icp_building': {
        const icp = await buildICP(userContent);
        icpProfile = icp;

        if (icp) {
          responseMessage = `## Ideal Customer Profile\n\n` +
            `**Industry:** ${icp.industry}\n` +
            `**Company Size:** ${icp.companySize}\n` +
            `**Revenue Range:** ${icp.revenue}\n` +
            `**Geography:** ${icp.geography}\n\n` +
            `**Technology Stack:** ${icp.technographic.join(', ')}\n\n` +
            `**Key Pain Points:**\n${icp.painPoints.map(p => `- ${p}`).join('\n')}\n\n` +
            `**Buying Signals:**\n${icp.buyingSignals.map(s => `- ${s}`).join('\n')}\n\n` +
            `**Decision Maker Titles:** ${icp.decisionMakerTitles.join(', ')}\n\n` +
            `---\n*Save this ICP to use it for lead scoring and campaign targeting.*`;

          actions.push({
            id: 'save-icp',
            label: 'Save ICP Profile',
            type: 'save_icp',
            targetView: 'icp',
            data: icp,
            variant: 'primary',
          });
          actions.push({
            id: 'nav-icp',
            label: 'Go to ICP Builder',
            type: 'navigate',
            targetView: 'icp',
            variant: 'outline',
          });
        }
        break;
      }

      case 'lead_scoring': {
        const score = await scoreLead(userContent);
        leadScore = score;

        if (score) {
          const emoji = score.tier === 'hot' ? '🔥' : score.tier === 'warm' ? '⚡' : '❄️';
          responseMessage = `## ${emoji} Lead Score: ${score.score}/100 (${score.tier.toUpperCase()})\n\n` +
            `**Breakdown:**\n` +
            `- Firmographic Fit: ${score.breakdown.firmographic}/25\n` +
            `- Technographic Fit: ${score.breakdown.technographic}/25\n` +
            `- Intent Signals: ${score.breakdown.intent}/25\n` +
            `- Overall Fit: ${score.breakdown.fit}/25\n\n` +
            `**Reasoning:** ${score.reasoning}\n\n` +
            (score.strengths?.length ? `**Strengths:** ${score.strengths.join(', ')}\n\n` : '') +
            (score.weaknesses?.length ? `**Concerns:** ${score.weaknesses.join(', ')}\n\n` : '') +
            `---\n*Navigate to your Leads to see all scored leads.*`;

          actions.push({
            id: 'nav-leads',
            label: 'Go to Leads',
            type: 'navigate',
            targetView: 'leads',
            variant: 'primary',
          });
        }
        break;
      }

      case 'prospect_research': {
        deepResearchQuery = userContent;
        responseMessage = `## Deep Research Required\n\nYour query needs comprehensive multi-source research. I'll search across the web, analyze company data, and compile a detailed report.\n\n**What I'll research:**\n- Company background and financials\n- Key decision makers and contacts\n- Technology stack and infrastructure\n- Recent news and activity\n- Competitive positioning\n- Buying intent signals\n\nClick **"Start Deep Research"** to begin the analysis pipeline.`;

        actions.push({
          id: 'deep-research',
          label: 'Start Deep Research',
          type: 'deep_research',
          targetView: 'prospect-discovery',
          data: { query: userContent },
          variant: 'primary',
        });
        actions.push({
          id: 'nav-prospects',
          label: 'Go to Prospect Discovery',
          type: 'navigate',
          targetView: 'prospect-discovery',
          variant: 'outline',
        });
        break;
      }

      case 'campaign_creation': {
        const campaignPlan = await callLLM({
          systemPrompt: `You are a B2B campaign strategist. Create a detailed campaign plan based on the user's description. Include:
1. Campaign Name
2. Target Audience
3. Channels (Email, LinkedIn, Multi-channel)
4. Messaging Strategy
5. Sequence Plan (3-5 touchpoints)
6. Success Metrics
7. Timeline

Format as clean markdown.`,
          userMessage: `Create a campaign plan for: ${userContent}`,
          temperature: 0.5,
          model: MODEL_PRIMARY,
          useFallback: true,
          thinkingBudget: 'standard',
        });

        responseMessage = campaignPlan
          ? `## Campaign Plan\n\n${campaignPlan}\n\n---\n*Navigate to Campaigns to set this up, or tell me what to adjust.*`
          : `## Campaign Creation\n\nI can help you plan a campaign! To create a targeted campaign, I need:\n1. **Target industry/niche** — Who are you going after?\n2. **Geographic focus** — Which markets?\n3. **Goal** — Meetings? Demo signups? Direct sales?\n4. **Channel preference** — Email, LinkedIn, multi-channel?\n\nTell me more details and I'll generate a complete campaign plan.`;

        actions.push({
          id: 'nav-campaigns',
          label: 'Go to Campaigns',
          type: 'navigate',
          targetView: 'campaigns',
          variant: 'primary',
        });
        actions.push({
          id: 'create-campaign',
          label: 'Create Campaign',
          type: 'create_campaign',
          targetView: 'campaigns',
          variant: 'secondary',
        });
        break;
      }

      case 'data_enrichment': {
        // Try to actually enrich data from the web
        const enrichmentResult = await callLLM({
          systemPrompt: `You are a data enrichment specialist for B2B leads. Based on the user's description, provide enriched company data including:
1. Company Overview (business model, value prop)
2. Firmographics (size, revenue, industry classification)
3. Technographics (technology stack, tools)
4. Key Contacts (decision maker titles and likely roles)
5. Social Signals (LinkedIn presence, recent activity)

Format as clean markdown with headers.`,
          userMessage: `Enrich this lead data: ${userContent}`,
          temperature: 0.3,
          model: MODEL_PRIMARY,
          useFallback: true,
          thinkingBudget: 'standard',
        });

        responseMessage = enrichmentResult
          ? `## Data Enrichment Results\n\n${enrichmentResult}\n\n---\n*Navigate to the Enrichment section to bulk-enrich your leads, or describe a specific company for deeper enrichment.*`
          : `## Data Enrichment\n\nI can help enrich your lead data with additional information including:\n\n- **Firmographics** — Company size, revenue, industry classification\n- **Technographics** — Technology stack, tools, platforms used\n- **Contact Data** — Key decision makers, email patterns\n- **Social Signals** — LinkedIn presence, recent activity\n\nNavigate to the Enrichment section to bulk-enrich your leads, or describe a specific company and I'll enrich it right here.`;

        actions.push({
          id: 'nav-enrichment',
          label: 'Go to Enrichment',
          type: 'navigate',
          targetView: 'data-enrichment',
          variant: 'primary',
        });
        break;
      }

      case 'pipeline_analysis': {
        const analysisResult = await callLLM({
          systemPrompt: `You are a B2B sales pipeline analyst. Analyze the described pipeline situation and provide:
1. Pipeline Health Assessment
2. Stage-by-Stage Analysis
3. Bottleneck Identification
4. Conversion Rate Insights
5. Recommendations for Improvement
6. Action Items

Format as clean markdown with headers.`,
          userMessage: `Analyze this pipeline: ${userContent}`,
          temperature: 0.3,
          model: MODEL_PRIMARY,
          useFallback: true,
          thinkingBudget: 'standard',
        });

        responseMessage = analysisResult
          ? `## Pipeline Analysis\n\n${analysisResult}\n\n---\n*Go to Leads or Analytics for more detailed pipeline data.*`
          : `## Pipeline Analysis\n\nTell me about your current pipeline — how many leads at each stage, your target industry, and any specific concerns. I'll provide a detailed analysis with recommendations.`;

        actions.push({
          id: 'nav-leads',
          label: 'Go to Leads',
          type: 'navigate',
          targetView: 'leads',
          variant: 'primary',
        });
        actions.push({
          id: 'nav-analytics',
          label: 'Go to Analytics',
          type: 'navigate',
          targetView: 'analytics',
          variant: 'outline',
        });
        break;
      }

      case 'platform_navigation': {
        const navResult = await callLLM({
          systemPrompt: `You are LeadReach AI, helping a user navigate the platform. The platform has these sections:
- Dashboard (overview of metrics and activity)
- Prospect Discovery (find and research leads across 17+ channels)
- ICP Builder (define Ideal Customer Profiles)
- Campaigns (create and manage lead generation campaigns)
- Leads (view, score, and manage discovered leads)
- Enrichment (enrich lead data with firmographics, contacts, etc.)
- Agents (view and manage 8 AI agents)
- AI Setter (automated lead qualification and booking)
- Booking (manage booked meetings)
- Messaging (multi-channel messaging: SMS, WhatsApp, Instagram, Facebook)
- Outreach (craft and send outreach messages)
- Analytics (performance dashboards)
- Reports (generate reports)

The user is currently on: ${currentPage || 'Dashboard'}. Help them navigate to what they need.`,
          userMessage: userContent,
          temperature: 0.3,
          model: MODEL_PRIMARY,
          useFallback: true,
          thinkingBudget: 'quick',
        });

        responseMessage = navResult || 'I can help you navigate the platform. What section are you looking for?';

        const viewMap: Record<string, string> = {
          'dashboard': 'dashboard',
          'prospect': 'prospect-discovery', 'leads': 'leads', 'discovery': 'prospect-discovery',
          'campaign': 'campaigns', 'outreach': 'outreach', 'icp': 'icp',
          'enrichment': 'data-enrichment', 'enrich': 'data-enrichment',
          'agents': 'agents', 'setter': 'setter', 'booking': 'booking',
          'messaging': 'messaging', 'analytics': 'analytics', 'reports': 'reports',
        };

        for (const [keyword, view] of Object.entries(viewMap)) {
          if (userContent.toLowerCase().includes(keyword)) {
            actions.push({
              id: `nav-${view}`,
              label: `Go to ${view.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
              type: 'navigate',
              targetView: view,
              variant: 'primary',
            });
            break;
          }
        }
        break;
      }

      default: {
        const generalResult = await callLLM({
          systemPrompt: (systemPrompt || 'You are LeadReach AI, an intelligent assistant for B2B lead generation.') +
            '\n\nYou have access to these platform capabilities: Lead Discovery (17+ channels), Deep Research, ICP Building, Lead Scoring, Data Enrichment, Outreach Generation, Campaign Creation, Pipeline Management, AI Setter (automated booking), Multi-channel Messaging, Analytics, and Reports.\n\nWhen a user\'s question relates to any of these capabilities, suggest they use the relevant feature and offer to help them navigate to it. Always respond in English.',
          userMessage: conversationContext
            ? `Conversation so far:\n${conversationContext}\n\nCurrent question: ${userContent}`
            : userContent,
          temperature: 0.7,
          model: MODEL_PRIMARY,
          useFallback: true,
          thinkingBudget: 'standard',
        });

        responseMessage = generalResult || 'I apologize, but I couldn\'t process your request. Please try again.';

        const lowerMsg = userContent.toLowerCase();
        if (lowerMsg.includes('find') || lowerMsg.includes('search') || lowerMsg.includes('lead')) {
          actions.push({
            id: 'nav-prospects',
            label: 'Prospect Discovery',
            type: 'navigate',
            targetView: 'prospect-discovery',
            variant: 'outline',
          });
        }
        if (lowerMsg.includes('outreach') || lowerMsg.includes('email') || lowerMsg.includes('message')) {
          actions.push({
            id: 'nav-outreach',
            label: 'Outreach',
            type: 'navigate',
            targetView: 'outreach',
            variant: 'outline',
          });
        }
        break;
      }
    }

    if (!responseMessage) {
      const fallbackResult = await callLLM({
        systemPrompt: (systemPrompt || 'You are LeadReach AI, an intelligent assistant for B2B lead generation.') +
          '\n\nAlways respond in English.',
        userMessage: conversationContext
          ? `Conversation so far:\n${conversationContext}\n\nCurrent question: ${userContent}`
          : userContent,
        temperature: 0.7,
        model: MODEL_PRIMARY,
        useFallback: true,
        thinkingBudget: 'standard',
      });
      responseMessage = fallbackResult || 'I\'m having trouble processing your request. Please try again.';
    }

    const response: PowerChatResponse = {
      message: responseMessage,
      intent: intent.intent,
      confidence: intent.confidence,
      actions,
      discoveredLeads,
      outreachContent,
      icpProfile,
      leadScore,
      targetView: INTENT_VIEW_MAP[intent.intent],
      deepResearchQuery,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[PowerChat] Error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';

    if (errMsg.includes('429') || errMsg.includes('rate limit')) {
      return NextResponse.json({
        message: 'The AI service is currently experiencing high demand. Please wait a moment and try again.',
        intent: 'general_question',
        confidence: 0,
        actions: [],
      });
    }

    return NextResponse.json(
      { error: 'AI chat request failed. Please try again.' },
      { status: 500 }
    );
  }
}
