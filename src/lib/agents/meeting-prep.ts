/**
 * Meeting Preparation Module
 * 
 * Generate comprehensive 11-section meeting briefings using LLM.
 */

import ZAI from 'z-ai-web-dev-sdk';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';

// ============================================================
// Types
// ============================================================

export interface MeetingPrepInput {
  leadId?: string;
  companyName: string;
  contactName?: string;
  contactTitle?: string;
  industry?: string;
  website?: string;
  meetingObjective?: string;
  previousInteractions?: string;
  additionalContext?: string;
}

export interface MeetingPrep {
  companyName: string;
  contactName: string;
  generatedAt: string;
  sections: {
    companyOverview: string;
    industryContext: string;
    keyContacts: string;
    recentNews: string;
    painPoints: string;
    competitiveLandscape: string;
    technologyStack: string;
    buyingSignals: string;
    meetingStrategy: string;
    talkingPoints: string[];
    nextStepsTemplate: string;
  };
}

// ============================================================
// Main Generation
// ============================================================

/**
 * Generate a comprehensive meeting preparation briefing
 */
export async function generateMeetingPrep(
  input: MeetingPrepInput
): Promise<MeetingPrep> {
  // Gather real-time data
  let webData = '';
  try {
    const searches = await Promise.all([
      exaSearch(`${input.companyName} ${input.industry || ''} news recent`, 3),
      input.website ? webRead(input.website) : null,
    ]);

    const newsResults = searches[0];
    if (newsResults?.success && newsResults.data.length > 0) {
      webData += 'RECENT NEWS:\n' + newsResults.data.map(r => `- ${r.title}: ${r.snippet}`).join('\n') + '\n\n';
    }

    const websiteData = searches[1];
    if (websiteData?.success && websiteData.data.content) {
      webData += 'WEBSITE CONTENT (excerpt):\n' + websiteData.data.content.slice(0, 3000) + '\n\n';
    }
  } catch {
    // Web research failed, continue with LLM only
  }

  const prompt = `You are an expert B2B sales strategist preparing a comprehensive meeting briefing.

COMPANY: ${input.companyName}
CONTACT: ${input.contactName || 'Unknown'}
CONTACT TITLE: ${input.contactTitle || 'Unknown'}
INDUSTRY: ${input.industry || 'Unknown'}
WEBSITE: ${input.website || 'Unknown'}
MEETING OBJECTIVE: ${input.meetingObjective || 'Discovery call'}
PREVIOUS INTERACTIONS: ${input.previousInteractions || 'None'}
${input.additionalContext ? `ADDITIONAL CONTEXT: ${input.additionalContext}` : ''}

${webData ? `RESEARCH DATA:\n${webData}` : ''}

Generate a comprehensive 11-section meeting briefing as JSON:
{
  "sections": {
    "companyOverview": "2-3 paragraph overview of the company, their business model, and market position",
    "industryContext": "2-3 paragraphs about the industry, trends, and challenges",
    "keyContacts": "Information about key decision makers and stakeholders at the company",
    "recentNews": "Recent news, events, or announcements about the company",
    "painPoints": "3-5 likely pain points this company faces, based on industry and size",
    "competitiveLandscape": "Who they compete with and how they differentiate",
    "technologyStack": "Likely technology they use based on industry and size",
    "buyingSignals": "Signals that indicate they might be ready to buy",
    "meetingStrategy": "Recommended approach for the meeting — tone, focus areas, what to avoid",
    "talkingPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
    "nextStepsTemplate": "Suggested follow-up email template after the meeting"
  }
}

Be specific and actionable. Reference real data where possible.
Return ONLY valid JSON.`;

  try {
    const zai = await ZAI.create();
    const result = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
    });

    const content = result.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    const sections = (parsed.sections as Record<string, unknown>) || {};

    return {
      companyName: input.companyName,
      contactName: input.contactName || 'Unknown',
      generatedAt: new Date().toISOString(),
      sections: {
        companyOverview: (sections.companyOverview as string) || `${input.companyName} is a company in the ${input.industry || 'technology'} sector.`,
        industryContext: (sections.industryContext as string) || `The ${input.industry || 'technology'} industry is evolving rapidly with increasing digital transformation needs.`,
        keyContacts: (sections.keyContacts as string) || `Research the key decision makers at ${input.companyName} before the meeting.`,
        recentNews: (sections.recentNews as string) || webData || 'No recent news found. Research company announcements before the meeting.',
        painPoints: (sections.painPoints as string) || 'Common pain points include operational efficiency, cost management, and competitive pressure.',
        competitiveLandscape: (sections.competitiveLandscape as string) || `Research ${input.companyName}'s main competitors in the ${input.industry || 'technology'} space.`,
        technologyStack: (sections.technologyStack as string) || 'Technology stack details would benefit from further research.',
        buyingSignals: (sections.buyingSignals as string) || 'Look for signs of growth, digital transformation initiatives, or operational challenges.',
        meetingStrategy: (sections.meetingStrategy as string) || 'Focus on understanding their challenges and positioning your solution as a strategic enabler.',
        talkingPoints: Array.isArray(sections.talkingPoints) ? (sections.talkingPoints as string[]) : [
          `Current challenges at ${input.companyName}`,
          'Industry trends and how they impact their business',
          'Their technology and operational priorities',
          'Success stories from similar companies',
          'Next steps and timeline',
        ],
        nextStepsTemplate: (sections.nextStepsTemplate as string) || `Hi ${input.contactName || '[Contact]'},\n\nThank you for your time today. Based on our conversation about [topic], I'd like to suggest [next step].\n\nBest regards`,
      },
    };
  } catch (error) {
    console.warn('[MeetingPrep] LLM failed, using defaults:', error);
    return {
      companyName: input.companyName,
      contactName: input.contactName || 'Unknown',
      generatedAt: new Date().toISOString(),
      sections: {
        companyOverview: `${input.companyName} operates in the ${input.industry || 'technology'} sector. Research their website and recent news for detailed information.`,
        industryContext: `The ${input.industry || 'technology'} industry faces rapid change and digital transformation pressures.`,
        keyContacts: `Identify decision makers and influencers at ${input.companyName} before the meeting.`,
        recentNews: webData || 'Research company announcements and news before the meeting.',
        painPoints: 'Identify specific pain points through discovery questions during the meeting.',
        competitiveLandscape: `Map out ${input.companyName}'s key competitors before the meeting.`,
        technologyStack: 'Ask about their current technology during the discovery call.',
        buyingSignals: 'Look for growth signals, budget discussions, and timeline mentions.',
        meetingStrategy: 'Focus on discovery — ask open-ended questions and listen actively.',
        talkingPoints: [
          `What are the biggest challenges ${input.companyName} is facing?`,
          'What does your current workflow look like?',
          'What would an ideal solution look like?',
          'What is your timeline for making a change?',
          'Who else is involved in the decision process?',
        ],
        nextStepsTemplate: `Hi ${input.contactName || '[Contact]'},\n\nThank you for the conversation today. I'd love to continue exploring how we can help.\n\nBest regards`,
      },
    };
  }
}
