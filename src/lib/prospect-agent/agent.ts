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
 * 4. If multi-intent detected, execute secondary action
 * 5. Generate a conversational response with proactive suggestions
 * 6. Return the complete agent message with suggested actions
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
        const actionSummary = buildResearchSummary(result.prospect);
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }

      // Multi-intent: Auto-execute secondary action if implied
      if (classification.secondaryIntent === 'score_lead' && prospectData) {
        const scoreResult = await executeLeadScoring(prospectData, updatedContext.activeICP);
        actions = [...actions, ...scoreResult.steps];
        if (scoreResult.score) {
          scoreData = scoreResult.score;
          // Append scoring results to the response
          const scoreSummary = `\n\n**Lead Score: ${scoreResult.score.overallScore}/100 (${scoreResult.score.tier})**\n${scoreResult.score.recommendation}`;
          responseContent += scoreSummary;
        }
      } else if (classification.secondaryIntent === 'compose_outreach' && prospectData) {
        const channel = userMessage.toLowerCase().includes('linkedin') ? 'linkedin' : 'email';
        const outreachResult = await executeOutreachComposition(prospectData, channel);
        actions = [...actions, ...outreachResult.steps];
        if (outreachResult.outreach) {
          outreachData = outreachResult.outreach;
        }
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
        const actionSummary = buildPersonSummary(result.prospect);
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }

      // Multi-intent: Auto-compose outreach if implied
      if (classification.secondaryIntent === 'compose_outreach' && prospectData) {
        const outreachResult = await executeOutreachComposition(prospectData, 'email');
        actions = [...actions, ...outreachResult.steps];
        if (outreachResult.outreach) {
          outreachData = outreachResult.outreach;
        }
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
        const actionSummary = buildResearchSummary(result.prospect);
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

          // Proactive: If score is strong, suggest outreach
          if (result.score.overallScore >= 65 && result.score.tier !== 'poor' && result.score.tier !== 'weak') {
            const prospectName = recentProspect.companyName || recentProspect.personName;
            responseContent += `\n\nThis lead scores well! Would you like me to compose a personalized outreach message to ${prospectName}?`;
          }
        }
      } else {
        responseContent = "I don't have a prospect to score yet. Please research a company or person first, and then I can score them against your ICP.\n\nYou can also ask me to research a specific company like: \"Research Stripe\" or \"Tell me about Acme Corp\".";
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

          // Proactive: Suggest adding to pipeline after outreach
          if (!recentProspect.companyName) {
            responseContent += '\n\nWant me to add this prospect to your lead pipeline?';
          }
        }
      } else {
        // No recent prospect — try to extract a target from the message
        const target = userMessage.replace(/^(?:write|compose|draft|send|email|reach out|craft)\s*(?:an?\s*)?(?:email|message|outreach|connection)?\s*(?:to\s*)?/i, '').trim();
        if (target.length > 2) {
          responseContent = `I don't have information about "${target}" yet. Let me research them first so I can write a truly personalized message.\n\nWould you like me to research ${target}? Just say "Research ${target}" and I'll find their details, then compose a personalized outreach message.`;
        } else {
          responseContent = "I don't have a prospect to write outreach for yet. Please research a company or person first, and then I can compose a personalized message.\n\nFor example: \"Research Stripe\" followed by \"Write an email to Stripe\".";
        }
      }
      break;
    }

    case 'refine_search': {
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      const refQuery = recentProspect
        ? `companies similar to ${recentProspect.companyName || recentProspect.personCompany} in ${recentProspect.industry || 'the same industry'}`
        : userMessage;
      const result = await executeCompanyResearch(refQuery);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        const actionSummary = buildResearchSummary(result.prospect);
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } else {
        responseContent = "I couldn't find similar companies right now. Try being more specific — for example, \"Find SaaS companies in healthcare\" or \"Show me fintech startups in London\".";
      }
      break;
    }

    case 'add_to_pipeline': {
      // This is handled client-side, but we acknowledge it intelligently
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      if (recentProspect) {
        const name = recentProspect.companyName || recentProspect.personName;
        responseContent = `Click the "Add to Leads" button below to add ${name || 'this prospect'} to your lead pipeline. I'll make sure all the data is properly saved.`;
      } else {
        responseContent = "I'll add this prospect to your lead pipeline. Click the 'Add to Leads' button below to confirm.";
      }
      break;
    }

    case 'clarify': {
      responseContent = classification.clarifyingQuestion || "I'd love to help! Could you tell me more specifically what you're looking for?";
      break;
    }

    case 'converse':
    default: {
      // General conversation — use LLM to respond intelligently
      try {
        const contextHint = buildContextHint(updatedContext);
        const response = await generateConversationResponse(
          'navigator', classification.intent, userMessage,
          contextHint || 'No specific actions taken — this is a conversational response.',
          updatedContext,
        );
        responseContent = response;
      } catch {
        responseContent = "I'm here to help with B2B lead generation! You can ask me to:\n\n• **Research a company** — \"Tell me about Stripe\"\n• **Find a person** — \"Find Patrick Collison\"\n• **Analyze a market** — \"SaaS market trends in 2026\"\n• **Build an ICP** — \"Build an ICP for B2B SaaS\"\n• **Score a lead** — \"Is Stripe a good lead for us?\"\n• **Compose outreach** — \"Write an email to Stripe\"\n• **Analyze competitors** — \"HubSpot vs Salesforce\"\n\nWhat would you like to do?";
      }
      break;
    }
  }

  // Step 3: Update context with learned preferences
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

  // Learn company size preferences from prospect data
  if (prospectData?.employeeCount) {
    const size = categorizeCompanySize(prospectData.employeeCount);
    if (size) {
      updatedContext.userPreferences.companySizes = [
        ...(updatedContext.userPreferences.companySizes || []),
        size,
      ].slice(-5);
    }
  }

  // Step 4: Build the agent message
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

  // Step 5: Generate suggested actions (proactive)
  const suggestedActions = generateSuggestedActions(classification.intent, prospectData, updatedContext);

  console.log(`[AgentLoop] Processed "${userMessage.slice(0, 50)}" → intent=${classification.intent}, persona=${classification.persona}, confidence=${classification.confidence}, secondary=${classification.secondaryIntent || 'none'}, took=${Date.now() - startTime}ms`);

  return {
    message: agentMessage,
    updatedContext,
    suggestedActions,
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Build a structured research summary for the conversational response.
 */
function buildResearchSummary(prospect: ProspectResult): string {
  return JSON.stringify({
    company: prospect.companyName,
    person: prospect.personName,
    industry: prospect.industry,
    employees: prospect.employeeCount,
    revenue: prospect.revenueEstimate,
    ceo: prospect.ceoName,
    keyContact: prospect.keyContactName,
    email: prospect.keyContactEmail || prospect.generalEmail,
    linkedin: prospect.linkedinUrl,
    website: prospect.website,
    techStack: prospect.techStack?.slice(0, 5),
    recentNews: prospect.recentNews?.slice(0, 2),
    completeness: prospect.dataCompleteness,
    buyingSignals: extractBuyingSignals(prospect),
  });
}

/**
 * Build a structured person summary for the conversational response.
 */
function buildPersonSummary(prospect: ProspectResult): string {
  return JSON.stringify({
    person: prospect.personName,
    title: prospect.personTitle,
    company: prospect.personCompany || prospect.companyName,
    email: prospect.personEmail,
    linkedin: prospect.personLinkedin,
    bio: prospect.personBio?.slice(0, 200),
    completeness: prospect.dataCompleteness,
  });
}

/**
 * Build a context hint for the conversational response.
 */
function buildContextHint(context: ConversationContext): string {
  const parts: string[] = [];
  if (context.recentProspects.length > 0) {
    parts.push(`Recently discussed: ${context.recentProspects.map(p => p.companyName || p.personName).filter(Boolean).join(', ')}`);
  }
  if (context.activeICP) {
    parts.push(`Active ICP: ${context.activeICP.name}`);
  }
  if (context.userPreferences.industries?.length) {
    parts.push(`User interests: ${context.userPreferences.industries.join(', ')}`);
  }
  return parts.join('; ');
}

/**
 * Extract buying signals from prospect data.
 */
function extractBuyingSignals(prospect: ProspectResult): string[] {
  const signals: string[] = [];
  if (prospect.recentNews?.some(n => /hiring|expanding|growth|funding|raised/i.test(n))) {
    signals.push('Growth activity detected in recent news');
  }
  if (prospect.fundingInfo && /raised|funding|series/i.test(prospect.fundingInfo)) {
    signals.push(`Recent funding: ${prospect.fundingInfo}`);
  }
  if (prospect.techStack?.length) {
    signals.push(`Active tech adoption (${prospect.techStack.slice(0, 3).join(', ')})`);
  }
  return signals;
}

/**
 * Categorize company size from employee count (string or number from LLM).
 */
function categorizeCompanySize(employeeCount: string | number | null | undefined): string | null {
  if (employeeCount === null || employeeCount === undefined) return null;
  // LLM may return a number instead of a string
  const str = String(employeeCount);
  const match = str.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (n < 10) return 'Micro (1-9)';
  if (n < 50) return 'Small (10-49)';
  if (n < 200) return 'Mid-Market (50-199)';
  if (n < 1000) return 'Mid-Enterprise (200-999)';
  return 'Enterprise (1000+)';
}

/**
 * Generate suggested follow-up actions based on the current intent and results.
 * Enhanced with context-aware, proactive suggestions.
 */
function generateSuggestedActions(
  intent: UserIntent,
  prospect?: ProspectResult,
  context?: ConversationContext,
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];
  const hasICP = !!context?.activeICP;
  const hasRecentProspects = (context?.recentProspects.length || 0) > 0;
  const prospectName = prospect?.companyName || prospect?.personName;

  switch (intent) {
    case 'research_company':
    case 'research_person':
    case 'research_url':
      if (prospect) {
        // Primary suggestions based on data completeness
        if (hasICP) {
          actions.push({ label: 'Score Against ICP', prompt: `Score ${prospectName} against my ICP`, icon: 'Star' });
        } else {
          actions.push({ label: 'Build an ICP', prompt: 'Help me build an Ideal Customer Profile', icon: 'Target' });
        }
        actions.push({ label: 'Compose Outreach', prompt: `Write an email to ${prospectName}`, icon: 'Mail' });
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
        if (prospect.industry) {
          actions.push({ label: 'Find Similar', prompt: `Find similar companies in ${prospect.industry}`, icon: 'Search' });
        } else {
          actions.push({ label: 'Find Similar', prompt: 'Find similar companies', icon: 'Search' });
        }
      }
      break;

    case 'analyze_market':
    case 'analyze_competitors':
      actions.push({ label: 'Research Top Company', prompt: 'Research the top company from this analysis', icon: 'Building2' });
      if (!hasICP) {
        actions.push({ label: 'Build an ICP', prompt: 'Build an ICP for this market', icon: 'Target' });
      }
      if (hasICP) {
        actions.push({ label: 'Score a Lead', prompt: 'Score my most recent prospect against my ICP', icon: 'Star' });
      }
      break;

    case 'build_icp':
      if (hasRecentProspects) {
        actions.push({ label: 'Score Recent Lead', prompt: 'Score my most recent prospect against this ICP', icon: 'Star' });
      }
      actions.push({ label: 'Find Matches', prompt: 'Find companies matching my ICP', icon: 'Search' });
      actions.push({ label: 'Research a Company', prompt: 'Research a specific company', icon: 'Building2' });
      break;

    case 'score_lead':
      if (prospect) {
        actions.push({ label: 'Compose Outreach', prompt: `Write an email to ${prospectName}`, icon: 'Mail' });
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
      }
      actions.push({ label: 'Find Better Leads', prompt: 'Find companies that better match my ICP', icon: 'Search' });
      break;

    case 'compose_outreach':
      if (prospect) {
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
        actions.push({ label: 'Find Similar', prompt: 'Find similar companies', icon: 'Search' });
      }
      break;

    default:
      actions.push({ label: 'Research a Company', prompt: 'I want to research a company', icon: 'Building2' });
      if (!hasICP) {
        actions.push({ label: 'Build an ICP', prompt: 'Help me build an Ideal Customer Profile', icon: 'Target' });
      } else {
        actions.push({ label: 'Score a Lead', prompt: 'Score my most recent prospect', icon: 'Star' });
      }
      break;
  }

  return actions.slice(0, 4); // Max 4 suggestions
}
