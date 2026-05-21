import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { dispatchAndExecute, runFullPipeline } from '@/lib/agent-executor';
import { callLLM, extractJSONFromString, MODEL_PRIMARY, MODEL_VISION } from '@/lib/llm';
import type { AgentName } from '@/lib/types';

/**
 * POST /api/ai
 *
 * AI chat endpoint that:
 * 1. Understands the user's intent
 * 2. Creates agent tasks powered by Agent-Reach
 * 3. For search intents, fires the full pipeline ASYNCHRONOUSLY
 * 4. Returns a response immediately with pipeline status info
 *
 * When the user asks to find leads, it automatically triggers the FULL pipeline:
 * discovery → enrichment → qualification → outreach
 * The pipeline runs in the background — the frontend polls for progress.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, campaignId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Step 1: Use LLM to understand intent and plan agent execution
    let plan: {
      intent: string;
      agents: string[];
      campaignName?: string;
      targetIndustry?: string;
      targetLocation?: string;
      plan: string[];
    } | null = null;

    let responseText = '';
    let agentTaskResults: Array<{
      agentName: string;
      taskType: string;
      taskId: string;
      success: boolean;
      channelsUsed?: string[];
      output?: Record<string, unknown>;
    }> = [];

    try {
      const llmResponse = await callLLM({
        systemPrompt: `You are LeadReach AI, an intelligent lead generation assistant powered by Agent-Reach.
Agent-Reach gives you real-time access to 17+ internet channels: Web (Jina Reader), Exa Search, LinkedIn, Twitter/X, YouTube, GitHub, Reddit, RSS, V2EX, Weibo, Xueqiu, and more.

When the user asks you to find leads, research companies, or create campaigns, you MUST respond with a JSON execution plan.

Available agents and their Agent-Reach powers:
- orchestrator: Coordinates multi-agent workflows (no direct channel access)
- prospect-discovery: Searches across Exa, Web, LinkedIn, GitHub, Twitter, Reddit to find companies
- data-enrichment: Reads company websites (Jina), LinkedIn profiles, searches for contact data
- web-research: Deep research using Web, Exa, LinkedIn, Twitter, YouTube, Reddit, RSS
- lead-qualification: Scores leads using Exa intent signals, LinkedIn data, Web analysis
- outreach-composer: Crafts personalized messages using Exa research, Web analysis, LinkedIn data
- pipeline-manager: Manages pipeline stages and follow-ups (database operations)
- report-generator: Generates analytics reports (database operations)

Respond with JSON:
{
  "intent": "search|create|analyze|outreach|report|research",
  "plan": ["Step 1", "Step 2", ...],
  "agents": ["agent-name-1", "agent-name-2"],
  "campaignName": "suggested name",
  "targetIndustry": "detected industry",
  "targetLocation": "detected location"
}

For general questions, respond naturally.`,
        userMessage: message,
        temperature: 0.3,
        model: MODEL_PRIMARY,
        useFallback: true,
      });

      if (llmResponse === null) {
        throw new Error('LLM call failed — both models returned null');
      }

      responseText = llmResponse;

      // Try to parse the plan from the response
      try {
        const parsed = extractJSONFromString<{
          intent: string;
          agents: string[];
          campaignName?: string;
          targetIndustry?: string;
          targetLocation?: string;
          plan: string[];
        }>(responseText);
        if (parsed) {
          plan = parsed;
        }
      } catch {
        // Not JSON, that's fine
      }
    } catch (sdkError) {
      console.error('SDK Error, falling back to pattern matching:', sdkError);

      // Fallback: Pattern-based intent detection
      const lowerMessage = message.toLowerCase();
      let industry = 'Technology';
      let location = 'Global';

      const industryMatch = lowerMessage.match(/(?:accounting|tech|marketing|finance|healthcare|legal|real estate|manufacturing|consulting|engineering)/i);
      if (industryMatch) industry = industryMatch[0].charAt(0).toUpperCase() + industryMatch[0].slice(1);

      const locationMatch = lowerMessage.match(/(?:dubai|singapore|london|new york|san francisco|tokyo|sydney|toronto|berlin|paris|mumbai)/i);
      if (locationMatch) location = locationMatch[0].charAt(0).toUpperCase() + locationMatch[0].slice(1);

      if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('discover') || lowerMessage.includes('leads')) {
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
        responseText = `I'll find ${industry.toLowerCase()} companies in ${location} using Agent-Reach's multi-channel search. Let me dispatch the agents now.`;
      } else if (lowerMessage.includes('research') || lowerMessage.includes('market') || lowerMessage.includes('industry')) {
        plan = {
          intent: 'research',
          plan: [`Deep research on ${industry} in ${location}`],
          agents: ['web-research'],
          campaignName: `${industry} Market Research - ${location}`,
          targetIndustry: industry,
          targetLocation: location,
        };
        responseText = `I'll conduct deep research on ${industry} in ${location} using Agent-Reach's web research capabilities.`;
      } else if (lowerMessage.includes('outreach') || lowerMessage.includes('email') || lowerMessage.includes('message')) {
        plan = {
          intent: 'outreach',
          plan: ['Compose personalized outreach messages'],
          agents: ['outreach-composer'],
        };
        responseText = `I'll compose personalized outreach messages for your qualified leads using Agent-Reach's company intelligence.`;
      } else {
        responseText = `I'm your LeadReach AI assistant, powered by Agent-Reach with access to 17+ internet channels. I can help you with:

🔍 **Lead Discovery** — Multi-channel search across Web, LinkedIn, Twitter, GitHub, Reddit
📊 **Data Enrichment** — Deep website reading, contact extraction, firmographic data
🎯 **Lead Qualification** — AI-powered scoring with intent signal detection
✉️ **Outreach** — Personalized messages crafted from real company intelligence
📈 **Reports** — Campaign analytics and pipeline insights

Try asking me to "Find accounting firms in Dubai" or "Research the fintech market in Singapore".`;
      }
    }

    // Step 2: If the intent is to find leads, trigger the FULL pipeline ASYNCHRONOUSLY
    let pipelineCampaignId: string | null = null;

    if (plan?.intent === 'search' && plan.targetIndustry) {
      // Create a campaign first so we have an ID
      try {
        const { db } = await import('@/lib/db');
        const campaign = await db.campaign.create({
          data: {
            name: plan.campaignName || `${plan.targetIndustry} Campaign - ${plan.targetLocation || 'Global'}`,
            targetIndustry: plan.targetIndustry || null,
            targetLocation: plan.targetLocation || null,
            status: 'active',
          },
        });
        pipelineCampaignId = campaign.id;
      } catch (dbError) {
        console.error('Failed to create campaign for pipeline:', dbError);
      }

      // Use after() to schedule the pipeline to run after the response is sent
      const finalCampaignId = pipelineCampaignId || campaignId;
      after(async () => {
        try {
          const result = await runFullPipeline(
            message,
            plan.targetIndustry,
            plan.targetLocation,
            finalCampaignId || undefined,
          );
          console.log(`[AI Chat] Pipeline completed: ${result.summary.leadsFound} found, ${result.summary.leadsQualified} qualified`);
        } catch (pipelineError) {
          console.error('[AI Chat] Pipeline failed:', pipelineError);
        }
      });

      responseText = `## 🚀 Pipeline Started!

I've launched the full 4-stage agent pipeline for **${plan.targetIndustry}** in **${plan.targetLocation || 'Global'}**:

1. 🔍 **Discovery** — Searching across Exa, LinkedIn, Twitter, Reddit, and more
2. 📊 **Enrichment** — Reading company websites, extracting contact data
3. 🎯 **Qualification** — AI-powered scoring with intent signals
4. ✉️ **Outreach** — Crafting personalized messages

The pipeline is running in the background. Check the **Campaigns** page for real-time progress!

Campaign ID: ${finalCampaignId}`;

      agentTaskResults.push({
        agentName: 'pipeline',
        taskType: 'full_pipeline',
        taskId: '',
        success: true,
        output: { campaignId: finalCampaignId, status: 'running' },
      });
    } else if (plan?.agents && plan.agents.length > 0) {
      // For non-search intents, execute individual agents
      // These are typically quick (web-research, outreach, reports)
      let executionCampaignId = campaignId;
      if (!executionCampaignId && plan.campaignName) {
        try {
          const { db } = await import('@/lib/db');
          const campaign = await db.campaign.create({
            data: {
              name: plan.campaignName,
              targetIndustry: plan.targetIndustry || null,
              targetLocation: plan.targetLocation || null,
              status: 'active',
            },
          });
          executionCampaignId = campaign.id;
        } catch (dbError) {
          console.error('Failed to create campaign:', dbError);
        }
      }

      // Execute each agent in sequence (respecting dependencies)
      for (const agentName of plan.agents) {
        try {
          const taskType = plan.intent === 'research' ? 'research'
            : plan.intent === 'outreach' ? 'outreach'
            : plan.intent === 'analyze' ? 'report'
            : 'coordinate';

          const input: Record<string, unknown> = {
            query: message,
            industry: plan.targetIndustry,
            location: plan.targetLocation,
            description: plan.plan?.[0] || message,
          };

          const result = await dispatchAndExecute(
            agentName as AgentName,
            taskType,
            input,
            executionCampaignId,
          );

          agentTaskResults.push({
            agentName,
            taskType,
            taskId: '',
            success: result.success,
            channelsUsed: result.channelActivity
              .filter(c => c.success)
              .map(c => c.channel),
            output: result.output,
          });
        } catch (execError) {
          console.error(`Failed to execute agent ${agentName}:`, execError);
          agentTaskResults.push({
            agentName,
            taskType: plan.intent || 'unknown',
            taskId: '',
            success: false,
          });
        }
      }
    }

    return NextResponse.json({
      response: responseText,
      plan,
      agentTasks: agentTaskResults,
      pipeline: pipelineCampaignId ? {
        started: true,
        status: 'running',
        campaignId: pipelineCampaignId,
      } : null,
      campaignId: pipelineCampaignId || campaignId,
    });
  } catch (error) {
    console.error('Error in AI endpoint:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
