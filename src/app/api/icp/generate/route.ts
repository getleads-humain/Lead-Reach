import { NextRequest, NextResponse } from 'next/server';
import { callLLMForJSON } from '@/lib/llm';
import { db } from '@/lib/db';

export const maxDuration = 300;

interface ICPInput {
  icpTitle: string;
  segmentDescription: string;
  ticketSize: string;
  avendusProduct: string;
  kpiDashboard: string;
  decisionTriggers: string;
  buyingJourney: string;
  preferredChannels: string;
  keyCompetitors: string;
}

interface GenerateICPRequest {
  companyName: string;
  analysis: {
    businessOverview: string;
    coreServiceLines: Array<{ segment: string; services: string; target: string }>;
    uniqueSolutions: Array<{ title: string; problem: string; solution: string; whyUnique: string }>;
    keyMetrics: Array<{ metric: string; value: string }>;
    industrySectors: string[];
    competitiveDifferentiation: string[];
    targetCustomerSegments: string[];
    suggestedPromptSnippets?: Array<{ id: string; title: string; description: string; icon: string; prompt: string }>;
  };
  prospectUrl?: string;
  userPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, analysis, prospectUrl, userPrompt } = body as GenerateICPRequest;

    if (!companyName || !analysis) {
      return NextResponse.json({ error: 'companyName and analysis are required' }, { status: 400 });
    }

    const promptInstruction = userPrompt || 'Generate all relevant Ideal Customer Profiles (ICPs) for this company based on the business analysis. Create 4-6 distinct ICPs covering different segments, ticket sizes, and product/service mappings.';

    // Step 1: Generate ICPs using LLM
    const icpData = await callLLMForJSON<{ icps: ICPInput[] }>(
      `You are a senior B2B strategy consultant specializing in Ideal Customer Profile (ICP) development for a lead generation platform.

Given a company analysis, create detailed ICPs that map to the company's products/services and target customer segments.

For each ICP, you must provide:
- icpTitle: A descriptive title like "Founder of a Tech Unicorn (Series C+)" or "CFO of Mid-Market Manufacturing Firm"
- segmentDescription: Detailed description of this customer segment (2-3 sentences)
- ticketSize: "high" (>$1M), "mid" ($100K-$1M), or "low" (<$100K)
- avendusProduct: Which of the company's products/services this ICP maps to
- kpiDashboard: Key KPIs and metrics for this segment (formatted as "KPI1: Value | KPI2: Value | KPI3: Value")
- decisionTriggers: Pain points and triggers that make them buy (2-3 sentences)
- buyingJourney: Timeline and buying journey description (2-3 sentences)
- preferredChannels: Best channels to reach them (e.g., "LinkedIn, Industry Events, Board Referrals")
- keyCompetitors: Main competitors they might consider (comma-separated)

Generate 4-6 distinct ICPs that cover different segments, from enterprise to mid-market, across the company's service lines.

Return JSON: { "icps": [ { icpTitle, segmentDescription, ticketSize, avendusProduct, kpiDashboard, decisionTriggers, buyingJourney, preferredChannels, keyCompetitors } ] }`,
      `Company: ${companyName}
${prospectUrl ? `Website: ${prospectUrl}` : ''}

BUSINESS ANALYSIS:
Overview: ${analysis.businessOverview}

Core Service Lines:
${analysis.coreServiceLines?.map(s => `- ${s.segment}: ${s.services} → Target: ${s.target}`).join('\n') || 'N/A'}

Unique Solutions:
${analysis.uniqueSolutions?.map(s => `- ${s.title}: ${s.problem} → ${s.solution} (Unique: ${s.whyUnique})`).join('\n') || 'N/A'}

Key Metrics:
${analysis.keyMetrics?.map(m => `- ${m.metric}: ${m.value}`).join('\n') || 'N/A'}

Industry Sectors: ${analysis.industrySectors?.join(', ') || 'N/A'}

Competitive Differentiation:
${analysis.competitiveDifferentiation?.map(d => `- ${d}`).join('\n') || 'N/A'}

Target Customer Segments: ${analysis.targetCustomerSegments?.join(', ') || 'N/A'}

USER INSTRUCTION: ${promptInstruction}`,
      { temperature: 0.3, maxTokens: 6000 }
    );

    if (!icpData || !icpData.icps || icpData.icps.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate ICPs. Please try again.',
      }, { status: 500 });
    }

    // Step 2: Save each ICP to the database and create campaigns
    const savedICPs = [];
    const createdCampaigns = [];

    for (const icp of icpData.icps) {
      try {
        // Save ICP to database
        const savedICP = await db.iCP.create({
          data: {
            prospectName: companyName,
            prospectUrl: prospectUrl || null,
            title: icp.icpTitle,
            segment: icp.segmentDescription,
            ticketSize: icp.ticketSize,
            avendusProduct: icp.avendusProduct,
            kpiDashboard: icp.kpiDashboard,
            decisionTriggers: icp.decisionTriggers,
            buyingJourney: icp.buyingJourney,
            preferredChannels: icp.preferredChannels,
            keyCompetitors: icp.keyCompetitors,
            targetIndustry: analysis.industrySectors?.[0] || null,
            targetLocation: null,
            targetCompanySize: null,
            targetCriteria: JSON.stringify({
              segment: icp.segmentDescription,
              triggers: icp.decisionTriggers,
            }),
            status: 'active',
            source: 'ai-generated',
          },
        });

        savedICPs.push(savedICP);

        // Create campaigns for this ICP (2-3 search angles)
        const searchAngles = generateSearchAngles(icp, analysis);
        for (const angle of searchAngles) {
          try {
            const campaign = await db.campaign.create({
              data: {
                name: `${icp.icpTitle} - ${angle.angle}`,
                description: `Auto-generated campaign for ICP: ${icp.icpTitle}. ${angle.description}`,
                status: 'active',
                targetIndustry: analysis.industrySectors?.[0] || null,
                targetLocation: null,
                targetCompanySize: null,
                targetCriteria: JSON.stringify({
                  icpId: savedICP.id,
                  icpTitle: icp.icpTitle,
                  searchAngle: angle.angle,
                  targetSegment: icp.segmentDescription,
                  ticketSize: icp.ticketSize,
                  product: icp.avendusProduct,
                }),
              },
            });
            createdCampaigns.push(campaign);
          } catch (campaignErr) {
            console.warn('[icp/generate] Failed to create campaign:', campaignErr instanceof Error ? campaignErr.message : 'Unknown');
          }
        }
      } catch (icpErr) {
        console.warn('[icp/generate] Failed to save ICP:', icpErr instanceof Error ? icpErr.message : 'Unknown');
      }
    }

    return NextResponse.json({
      success: true,
      companyName,
      icps: savedICPs.map(icp => ({
        id: icp.id,
        icpTitle: icp.title,
        segmentDescription: icp.segment,
        ticketSize: icp.ticketSize,
        avendusProduct: icp.avendusProduct,
        kpiDashboard: icp.kpiDashboard,
        decisionTriggers: icp.decisionTriggers,
        buyingJourney: icp.buyingJourney,
        preferredChannels: icp.preferredChannels,
        keyCompetitors: icp.keyCompetitors,
      })),
      campaigns: createdCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
      })),
    });
  } catch (error) {
    console.error('[icp/generate] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: `ICP generation failed: ${msg}`,
    }, { status: 500 });
  }
}

function generateSearchAngles(icp: ICPInput, analysis: GenerateICPRequest['analysis']): Array<{ angle: string; description: string }> {
  const angles: Array<{ angle: string; description: string }> = [];

  // Angle 1: Direct industry targeting
  const industry = analysis.industrySectors?.[0] || 'General';
  angles.push({
    angle: `${industry} Direct Outreach`,
    description: `Target ${icp.ticketSize}-ticket ${industry} companies matching the ${icp.icpTitle} profile through direct channels.`,
  });

  // Angle 2: Trigger-based
  angles.push({
    angle: 'Trigger-Based Prospecting',
    description: `Identify prospects experiencing decision triggers: ${icp.decisionTriggers?.slice(0, 100) || 'key pain points'}.`,
  });

  // Angle 3: Competitive displacement
  if (icp.keyCompetitors) {
    angles.push({
      angle: 'Competitive Displacement',
      description: `Target clients of competitors (${icp.keyCompetitors?.split(',').slice(0, 2).join(', ')}) for displacement opportunities.`,
    });
  }

  return angles;
}
