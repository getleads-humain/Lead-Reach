import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    try {
      const { chat } = await import('z-ai-web-dev-sdk');

      const systemPrompt = `You are LeadReach AI, an intelligent lead generation assistant. You help users with:
1. Creating and managing lead generation campaigns
2. Discovering and qualifying leads
3. Composing outreach messages
4. Analyzing pipeline data
5. Generating reports

When the user asks you to find leads or create a campaign, respond with a structured plan.
Format your response as JSON with the following structure when applicable:
{
  "intent": "search|create|analyze|outreach|report",
  "plan": ["step 1", "step 2", ...],
  "agents": ["agent-name-1", "agent-name-2"],
  "campaignName": "suggested name",
  "targetIndustry": "detected industry",
  "targetLocation": "detected location"
}

For general questions, respond naturally with helpful information about lead generation best practices.`;

      const result = await chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      });

      let plan = null;
      let agentTasks: Array<{ agentName: string; taskType: string; input: Record<string, unknown> }> = [];

      const responseText = result.choices?.[0]?.message?.content || result.content || '';

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Not JSON, that's fine
      }

      if (plan?.intent === 'search' || plan?.agents) {
        agentTasks = (plan.agents || ['prospect-discovery']).map((agent: string) => ({
          agentName: agent,
          taskType: plan.intent === 'search' ? 'search' : plan.intent === 'create' ? 'coordinate' : 'search',
          input: {
            query: message,
            industry: plan.targetIndustry,
            location: plan.targetLocation,
          },
        }));
      }

      return NextResponse.json({
        response: responseText,
        plan,
        agentTasks,
      });
    } catch (sdkError) {
      console.error('SDK Error:', sdkError);

      const lowerMessage = message.toLowerCase();
      let response = '';
      let plan = null;
      let agentTasks: Array<{ agentName: string; taskType: string; input: Record<string, unknown> }> = [];

      if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('discover')) {
        let industry = 'Technology';
        let location = 'Global';

        const industryMatch = lowerMessage.match(/(?:accounting|tech|marketing|finance|healthcare|legal|real estate|manufacturing|consulting|engineering)/i);
        if (industryMatch) industry = industryMatch[0].charAt(0).toUpperCase() + industryMatch[0].slice(1);

        const locationMatch = lowerMessage.match(/(?:dubai|singapore|london|new york|san francisco|tokyo|sydney|toronto|berlin|paris|mumbai)/i);
        if (locationMatch) location = locationMatch[0].charAt(0).toUpperCase() + locationMatch[0].slice(1);

        response = `I'll help you find ${industry.toLowerCase()} companies in ${location}. Here's my plan:\n\n1. **Prospect Discovery Agent** - Search for ${industry} companies in ${location}\n2. **Data Enrichment Agent** - Enrich found leads with contact and firmographic data\n3. **Lead Qualification Agent** - Score and qualify the discovered leads\n\nI'm creating the campaign and queuing agent tasks now.`;

        plan = {
          intent: 'search',
          plan: [
            `Search for ${industry} companies in ${location}`,
            'Enrich leads with contact data',
            'Score and qualify leads',
          ],
          agents: ['prospect-discovery', 'data-enrichment', 'lead-qualification'],
          campaignName: `${industry} Firms in ${location}`,
          targetIndustry: industry,
          targetLocation: location,
        };

        agentTasks = [
          { agentName: 'prospect-discovery', taskType: 'search', input: { query: message, industry, location } },
          { agentName: 'data-enrichment', taskType: 'enrich', input: { industry, location } },
          { agentName: 'lead-qualification', taskType: 'qualify', input: { industry, location } },
        ];
      } else if (lowerMessage.includes('outreach') || lowerMessage.includes('email') || lowerMessage.includes('message')) {
        response = `I'll help you compose outreach messages. Here's my plan:\n\n1. **Outreach Composer Agent** - Generate personalized outreach messages\n2. **Pipeline Manager Agent** - Schedule follow-up sequences\n\nLet me set up the outreach workflow.`;

        plan = {
          intent: 'outreach',
          plan: ['Generate personalized messages', 'Schedule follow-up sequences'],
          agents: ['outreach-composer', 'pipeline-manager'],
        };

        agentTasks = [
          { agentName: 'outreach-composer', taskType: 'outreach', input: { query: message } },
          { agentName: 'pipeline-manager', taskType: 'coordinate', input: { query: message } },
        ];
      } else {
        response = `I'm your LeadReach AI assistant. I can help you with:\n\n🔍 **Lead Discovery** - Find companies matching your ideal customer profile\n📊 **Data Enrichment** - Enhance lead data with firmographics and contacts\n🎯 **Lead Qualification** - Score and prioritize leads\n✉️ **Outreach** - Compose personalized messages and sequences\n📈 **Reports** - Generate campaign analytics and insights\n\nTry asking me to "Find accounting firms in Dubai" or "Create an outreach campaign for tech startups".`;
      }

      return NextResponse.json({
        response,
        plan,
        agentTasks,
      });
    }
  } catch (error) {
    console.error('Error in AI endpoint:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
