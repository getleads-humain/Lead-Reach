// ============================================================
// Prospect Discovery Agent — Main Agent Loop
// ============================================================

import type {
  AgentPersona,
  UserIntent,
  AgentMessage,
  AgentThinking,
  AgentAction,
  ConversationContext,
  ProspectResult,
  ICPResult,
  SuggestedAction,
} from './types';
import { classifyIntent, intentToThinking, type IntentClassification } from './intents';
import {
  executeCompanyResearch,
  executePersonResearch,
  executeUrlResearch,
  executeMarketAnalysis,
  executeCompetitiveAnalysis,
  executeICPBuilding,
  executeLeadScoring,
  executeOutreachComposition,
  generateConversationResponse,
} from './actions';
import { PERSONA_META } from './types';

/**
 * Process a user message through the agent pipeline.
 * This is the main entry point for the agent chat API.
 *
 * Flow:
 * 1. Classify intent (LLM + rule-based fallback)
 * 2. Generate thinking/plan for UI display
 * 3. Execute the appropriate action pipeline
 * 4. Generate a conversational response
 * 5. Return the complete agent message with suggested actions
 */
export async function processAgentMessage(
  userMessage: string,
  context?: ConversationContext,
  forceIntent?: UserIntent,
): Promise<{
  message: AgentMessage;
  updatedContext: ConversationContext;
  suggestedActions: SuggestedAction[];
}> {
  const startTime = Date.now();

  // Step 1: Classify intent
  let classification: IntentClassification;
  if (forceIntent) {
    // Use forced intent with rule-based persona selection
    const personas: Record<UserIntent, AgentPersona> = {
      research_company: 'scout',
      research_person: 'hound',
      research_url: 'scout',
      analyze_market: 'analyst',
      analyze_competitors: 'analyst',
      build_icp: 'architect',
      score_lead: 'judge',
      compose_outreach: 'scribe',
      refine_search: 'scout',
      add_to_pipeline: 'navigator',
      clarify: 'navigator',
      converse: 'navigator',
    };
    classification = {
      intent: forceIntent,
      persona: personas[forceIntent],
      confidence: 1.0,
      reasoning: 'Intent was explicitly specified',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  } else {
    classification = await classifyIntent(userMessage, context);
  }

  const thinking: AgentThinking = intentToThinking(classification);

  // Step 2: Execute actions based on intent
  let actions: AgentAction[] = [];
  let prospectData: ProspectResult | undefined;
  let icpData: ICPResult | undefined;
  let outreachData: unknown;
  let marketData: unknown;
  let scoreData: unknown;
  let responseContent = '';
  let updatedContext: ConversationContext = context || {
    recentProspects: [],
    activeICP: null,
    lastIntent: null,
    lastPersona: null,
    userPreferences: {},
  };

  switch (classification.intent) {
    case 'research_company': {
      const companyName = classification.extractedEntities.companyName || userMessage.trim();
      const result = await executeCompanyResearch(companyName);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        // Generate conversational response
        const actionSummary = JSON.stringify({
          company: result.prospect.companyName,
          industry: result.prospect.industry,
          employees: result.prospect.employeeCount,
          revenue: result.prospect.revenueEstimate,
          ceo: result.prospect.ceoName,
          keyContact: result.prospect.keyContactName,
          email: result.prospect.keyContactEmail || result.prospect.generalEmail,
          completeness: result.prospect.dataCompleteness,
        });
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }
      break;
    }

    case 'research_person': {
      const personName = classification.extractedEntities.personName || userMessage.trim();
      const result = await executePersonResearch(personName);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        const actionSummary = JSON.stringify({
          person: result.prospect.personName,
          title: result.prospect.personTitle,
          company: result.prospect.personCompany || result.prospect.companyName,
          email: result.prospect.personEmail,
          linkedin: result.prospect.personLinkedin,
          completeness: result.prospect.dataCompleteness,
        });
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }
      break;
    }

    case 'research_url': {
      const url = classification.extractedEntities.url || userMessage.trim();
      const result = await executeUrlResearch(url);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        const actionSummary = JSON.stringify({
          company: result.prospect.companyName,
          person: result.prospect.personName,
          industry: result.prospect.industry,
          completeness: result.prospect.dataCompleteness,
        });
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }
      break;
    }

    case 'analyze_market': {
      const result = await executeMarketAnalysis(userMessage);
      actions = result.steps;
      if (result.market) {
        marketData = result.market;
        const actionSummary = JSON.stringify({
          summary: result.market.summary,
          findings: result.market.keyFindings,
          competitors: result.market.competitors.map(c => c.name),
          trends: result.market.trends,
        });
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }
      break;
    }

    case 'analyze_competitors': {
      const result = await executeCompetitiveAnalysis(userMessage);
      actions = result.steps;
      if (result.market) {
        marketData = result.market;
        const actionSummary = JSON.stringify({
          summary: result.market.summary,
          competitors: result.market.competitors,
          trends: result.market.trends,
          opportunities: result.market.opportunities,
        });
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }
      break;
    }

    case 'build_icp': {
      const result = await executeICPBuilding(userMessage, updatedContext.activeICP);
      actions = result.steps;
      if (result.icp) {
        icpData = result.icp;
        updatedContext.activeICP = result.icp;
        responseContent = result.response;
      }
      break;
    }

    case 'score_lead': {
      // Score the most recent prospect against the active ICP
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      if (recentProspect) {
        const result = await executeLeadScoring(recentProspect, updatedContext.activeICP);
        actions = result.steps;
        if (result.score) {
          scoreData = result.score;
          const actionSummary = JSON.stringify(result.score);
          responseContent = await generateConversationResponse(
            classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
          );
        }
      } else {
        responseContent = "I don't have a prospect to score yet. Please research a company or person first, and then I can score them against your ICP.";
      }
      break;
    }

    case 'compose_outreach': {
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      if (recentProspect) {
        // Determine channel from message
        const channel = userMessage.toLowerCase().includes('linkedin') ? 'linkedin' : 'email';
        const result = await executeOutreachComposition(recentProspect, channel);
        actions = result.steps;
        if (result.outreach) {
          outreachData = result.outreach;
          const actionSummary = JSON.stringify(result.outreach);
          responseContent = await generateConversationResponse(
            classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
          );
        }
      } else {
        responseContent = "I don't have a prospect to write outreach for yet. Please research a company or person first, and then I can compose a personalized message.";
      }
      break;
    }

    case 'refine_search': {
      // Use the most recent prospect as a reference for finding similar ones
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      const refQuery = recentProspect
        ? `companies similar to ${recentProspect.companyName || recentProspect.personCompany} in ${recentProspect.industry || 'the same industry'}`
        : userMessage;
      const result = await executeCompanyResearch(refQuery);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        const actionSummary = JSON.stringify({
          company: result.prospect.companyName,
          industry: result.prospect.industry,
          completeness: result.prospect.dataCompleteness,
        });
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }
      break;
    }

    case 'add_to_pipeline': {
      // This is handled client-side, but we acknowledge it
      responseContent = "I'll add this prospect to your lead pipeline. Click the 'Add to Leads' button below to confirm.";
      break;
    }

    case 'clarify': {
      responseContent = classification.clarifyingQuestion || "I'd love to help! Could you tell me more specifically what you're looking for?";
      break;
    }

    case 'converse':
    default: {
      // General conversation — use LLM to respond
      try {
        const response = await generateConversationResponse(
          'navigator', classification.intent, userMessage, 'No specific actions taken — this is a conversational response.', updatedContext,
        );
        responseContent = response;
      } catch {
        responseContent = "I'm here to help with B2B lead generation! You can ask me to research companies, find people, analyze markets, build ICPs, score leads, or compose outreach messages. What would you like to do?";
      }
      break;
    }
  }

  // Update context
  updatedContext.lastIntent = classification.intent;
  updatedContext.lastPersona = classification.persona;

  // Extract preferences from entities
  if (classification.extractedEntities.industry) {
    updatedContext.userPreferences.industries = [
      ...(updatedContext.userPreferences.industries || []),
      classification.extractedEntities.industry,
    ].slice(-5);
  }
  if (classification.extractedEntities.location) {
    updatedContext.userPreferences.locations = [
      ...(updatedContext.userPreferences.locations || []),
      classification.extractedEntities.location,
    ].slice(-5);
  }

  // Build the agent message
  const agentMessage: AgentMessage = {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: responseContent,
    timestamp: new Date(),
    persona: classification.persona,
    thinking,
    actions,
    prospectData,
    icpData,
    outreachData: outreachData as import('./types').OutreachResult | undefined,
    marketData: marketData as import('./types').MarketResult | undefined,
    scoreData: scoreData as import('./types').ScoreResult | undefined,
  };

  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(classification.intent, prospectData, updatedContext.activeICP);

  console.log(`[AgentLoop] Processed "${userMessage.slice(0, 50)}" → intent=${classification.intent}, persona=${classification.persona}, confidence=${classification.confidence}, took=${Date.now() - startTime}ms`);

  return {
    message: agentMessage,
    updatedContext,
    suggestedActions,
  };
}

/**
 * Generate suggested follow-up actions based on the current intent and results.
 */
function generateSuggestedActions(
  intent: UserIntent,
  prospect?: ProspectResult,
  icp?: ICPResult | null,
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  switch (intent) {
    case 'research_company':
    case 'research_person':
    case 'research_url':
      if (prospect) {
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
        actions.push({ label: 'Score This Lead', prompt: 'Score this lead against my ICP', icon: 'Star' });
        actions.push({ label: 'Compose Outreach', prompt: `Write an email to ${prospect.companyName || prospect.personName}`, icon: 'Mail' });
        actions.push({ label: 'Find Similar', prompt: 'Find similar companies', icon: 'Search' });
      }
      break;

    case 'analyze_market':
    case 'analyze_competitors':
      actions.push({ label: 'Research Top Company', prompt: 'Research the top company from this analysis', icon: 'Building2' });
      actions.push({ label: 'Build ICP', prompt: 'Build an ICP for this market', icon: 'Target' });
      break;

    case 'build_icp':
      actions.push({ label: 'Score a Lead', prompt: 'Score my most recent prospect against this ICP', icon: 'Star' });
      actions.push({ label: 'Find Matching Companies', prompt: 'Find companies matching my ICP', icon: 'Search' });
      break;

    case 'score_lead':
      if (prospect) {
        actions.push({ label: 'Compose Outreach', prompt: `Write an email to ${prospect.companyName || prospect.personName}`, icon: 'Mail' });
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
      }
      break;

    case 'compose_outreach':
      if (prospect) {
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
        actions.push({ label: 'Find Similar', prompt: 'Find similar companies', icon: 'Search' });
      }
      break;

    default:
      actions.push({ label: 'Research a Company', prompt: 'I want to research a company', icon: 'Building2' });
      actions.push({ label: 'Build an ICP', prompt: 'Help me build an Ideal Customer Profile', icon: 'Target' });
      break;
  }

  return actions.slice(0, 4); // Max 4 suggestions
}
