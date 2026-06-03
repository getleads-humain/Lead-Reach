import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Allow long-running LLM tasks
export const maxDuration = 120;

// ============================================================
// Safe Serialization Helper
// ============================================================

function safeSerialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// POST — Handle all cross-section workflow bridge actions
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'prospect-to-lead':
        return await handleProspectToLead(body);
      case 'prospect-to-icp':
        return await handleProspectToICP(body);
      case 'prospect-to-report':
        return await handleProspectToReport(body);
      case 'icp-to-campaign':
        return await handleICPToCampaign(body);
      case 'lead-to-enrichment':
        return await handleLeadToEnrichment(body);
      case 'lead-to-outreach':
        return await handleLeadToOutreach(body);
      case 'autoresearch-to-outreach':
        return await handleAutoresearchToOutreach(body);
      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[Workflow Bridge] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// ============================================================
// prospect-to-lead — Convert a prospect to a Lead in a Campaign
// ============================================================

async function handleProspectToLead(body: {
  prospectName: string;
  prospectUrl?: string;
  industry?: string;
  location?: string;
  companySize?: string;
  campaignId?: string;
  website?: string;
  analysis?: Record<string, unknown>;
}) {
  const { prospectName, prospectUrl, industry, location, companySize, campaignId, website, analysis } = body;

  if (!prospectName) {
    return NextResponse.json({ error: 'prospectName is required' }, { status: 400 });
  }

  // Create or find a campaign if not provided
  let campaignIdToUse = campaignId;
  if (!campaignIdToUse) {
    const campaign = await db.campaign.create({
      data: {
        name: `${prospectName} Prospecting`,
        description: `Auto-created campaign for prospect: ${prospectName}`,
        targetIndustry: industry || null,
        targetLocation: location || null,
        targetCompanySize: companySize || null,
        status: 'active',
      },
    });
    campaignIdToUse = campaign.id;
  }

  // Extract location parts
  let city: string | null = null;
  let country: string | null = null;
  if (location) {
    const parts = location.split(',').map((s: string) => s.trim());
    if (parts.length >= 2) {
      city = parts[0];
      country = parts[1];
    } else {
      country = parts[0];
    }
  }

  const lead = await db.lead.create({
    data: {
      campaignId: campaignIdToUse,
      companyName: prospectName,
      website: website || prospectUrl || null,
      industry: industry || null,
      city,
      country,
      employeeCount: companySize || null,
      stage: 'new',
      leadTier: 'unqualified',
      sources: JSON.stringify(['prospect-discovery']),
    },
  });

  // Update campaign lead count
  await db.campaign.update({
    where: { id: campaignIdToUse },
    data: { leadsFound: { increment: 1 } },
  });

  return NextResponse.json({
    success: true,
    leadId: lead.id,
    campaignId: campaignIdToUse,
  });
}

// ============================================================
// prospect-to-icp — Generate an ICP profile from prospect data
// ============================================================

async function handleProspectToICP(body: {
  prospectName: string;
  prospectUrl?: string;
  reportContent?: Record<string, unknown>;
  title?: string;
  segment?: string;
  ticketSize?: string;
  avendusProduct?: string;
  targetIndustry?: string;
  targetLocation?: string;
  targetCompanySize?: string;
}) {
  const { prospectName, prospectUrl, reportContent, title, segment, ticketSize, avendusProduct, targetIndustry, targetLocation, targetCompanySize } = body;

  if (!prospectName) {
    return NextResponse.json({ error: 'prospectName is required' }, { status: 400 });
  }

  // If reportContent is provided, use LLM to generate ICP fields
  let icpTitle = title || `ICP for ${prospectName}`;
  let icpSegment = segment || null;
  let icpTicketSize = ticketSize || null;
  let icpAvendusProduct = avendusProduct || null;
  let kpiDashboard: string | null = null;
  let decisionTriggers: string | null = null;
  let buyingJourney: string | null = null;
  let preferredChannels: string | null = null;
  let keyCompetitors: string | null = null;

  if (reportContent && !title) {
    // Use LLM to enrich ICP data from report content
    try {
      const { callLLMForJSON } = await import('@/lib/llm');
      const llmResult = await callLLMForJSON<{
        title: string;
        segment: string;
        ticketSize: string;
        avendusProduct: string;
        kpiDashboard: Record<string, string>;
        decisionTriggers: string[];
        buyingJourney: string;
        preferredChannels: string[];
        keyCompetitors: string[];
      }>(
        'You are an expert B2B ICP (Ideal Customer Profile) analyst. Generate a comprehensive ICP profile from the given prospect research data.',
        `Based on this prospect research data, generate an ICP profile:\n\nProspect: ${prospectName}\nURL: ${prospectUrl || 'N/A'}\nResearch Data: ${JSON.stringify(reportContent).slice(0, 3000)}\n\nReturn a JSON object with these fields:\n- title: A descriptive title for this ICP\n- segment: The market segment description\n- ticketSize: "high", "mid", or "low"\n- avendusProduct: The recommended product/service mapping\n- kpiDashboard: Object of key KPIs and their values\n- decisionTriggers: Array of pain points/triggers\n- buyingJourney: Description of the buying journey\n- preferredChannels: Array of preferred communication channels\n- keyCompetitors: Array of key competitors`,
        { temperature: 0.3 }
      );

      if (llmResult) {
        icpTitle = llmResult.title || icpTitle;
        icpSegment = llmResult.segment || icpSegment;
        icpTicketSize = llmResult.ticketSize || icpTicketSize;
        icpAvendusProduct = llmResult.avendusProduct || icpAvendusProduct;
        if (llmResult.kpiDashboard) kpiDashboard = JSON.stringify(llmResult.kpiDashboard);
        if (llmResult.decisionTriggers) decisionTriggers = JSON.stringify(llmResult.decisionTriggers);
        if (llmResult.buyingJourney) buyingJourney = llmResult.buyingJourney;
        if (llmResult.preferredChannels) preferredChannels = JSON.stringify(llmResult.preferredChannels);
        if (llmResult.keyCompetitors) keyCompetitors = JSON.stringify(llmResult.keyCompetitors);
      }
    } catch (err) {
      console.warn('[prospect-to-icp] LLM enrichment failed, using basic data:', err);
    }
  }

  const icp = await db.iCP.create({
    data: {
      prospectName,
      prospectUrl: prospectUrl || null,
      title: icpTitle,
      segment: icpSegment,
      ticketSize: icpTicketSize,
      avendusProduct: icpAvendusProduct,
      kpiDashboard,
      decisionTriggers,
      buyingJourney,
      preferredChannels,
      keyCompetitors,
      targetIndustry: targetIndustry || null,
      targetLocation: targetLocation || null,
      targetCompanySize: targetCompanySize || null,
      source: 'ai-generated',
    },
  });

  return NextResponse.json({
    success: true,
    icpId: icp.id,
  });
}

// ============================================================
// prospect-to-report — Save prospect research as a report
// ============================================================

async function handleProspectToReport(body: {
  prospectName: string;
  prospectUrl?: string;
  title: string;
  content: Record<string, unknown>;
  sections?: string[];
  source?: string;
  type?: string;
}) {
  const { prospectName, prospectUrl, title, content, sections, source, type } = body;

  if (!prospectName || !title || !content) {
    return NextResponse.json({ error: 'prospectName, title, and content are required' }, { status: 400 });
  }

  const report = await db.prospectReport.create({
    data: {
      prospectName,
      prospectUrl: prospectUrl || null,
      title,
      type: type || 'prospect-profile',
      content: JSON.stringify(content),
      sections: sections ? JSON.stringify(sections) : null,
      source: source || 'prospect-discovery',
    },
  });

  return NextResponse.json({
    success: true,
    reportId: report.id,
  });
}

// ============================================================
// icp-to-campaign — Create a campaign from ICP targeting criteria
// ============================================================

async function handleICPToCampaign(body: {
  icpId: string;
  campaignName?: string;
}) {
  const { icpId, campaignName } = body;

  if (!icpId) {
    return NextResponse.json({ error: 'icpId is required' }, { status: 400 });
  }

  const icp = await db.iCP.findUnique({ where: { id: icpId } });
  if (!icp) {
    return NextResponse.json({ error: 'ICP not found' }, { status: 404 });
  }

  // Build targeting criteria from ICP
  const targetingCriteria: Record<string, string> = {};
  if (icp.targetIndustry) targetingCriteria.industry = icp.targetIndustry;
  if (icp.targetLocation) targetingCriteria.location = icp.targetLocation;
  if (icp.targetCompanySize) targetingCriteria.companySize = icp.targetCompanySize;
  if (icp.segment) targetingCriteria.segment = icp.segment;
  if (icp.ticketSize) targetingCriteria.ticketSize = icp.ticketSize;

  const campaign = await db.campaign.create({
    data: {
      name: campaignName || `${icp.prospectName} — ${icp.title}`,
      description: `Campaign generated from ICP: ${icp.title} (${icp.prospectName})`,
      targetIndustry: icp.targetIndustry,
      targetLocation: icp.targetLocation,
      targetCompanySize: icp.targetCompanySize,
      targetCriteria: Object.keys(targetingCriteria).length > 0 ? JSON.stringify(targetingCriteria) : null,
      status: 'active',
    },
  });

  // Link the ICP to the campaign
  await db.iCP.update({
    where: { id: icpId },
    data: { campaignId: campaign.id },
  });

  return NextResponse.json({
    success: true,
    campaignId: campaign.id,
  });
}

// ============================================================
// lead-to-enrichment — Send a lead to data enrichment
// ============================================================

async function handleLeadToEnrichment(body: {
  leadId: string;
  instructions?: string;
}) {
  const { leadId, instructions } = body;

  if (!leadId) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { campaign: true },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Build original data row from lead
  const originalRow: Record<string, string> = {
    companyName: lead.companyName,
  };
  if (lead.website) originalRow.website = lead.website;
  if (lead.industry) originalRow.industry = lead.industry;
  if (lead.city) originalRow.city = lead.city;
  if (lead.country) originalRow.country = lead.country;
  if (lead.employeeCount) originalRow.employeeCount = lead.employeeCount;
  if (lead.revenueEstimate) originalRow.revenueEstimate = lead.revenueEstimate;
  if (lead.phoneMain) originalRow.phoneMain = lead.phoneMain;
  if (lead.generalEmail) originalRow.generalEmail = lead.generalEmail;
  if (lead.keyContactName) originalRow.keyContactName = lead.keyContactName;
  if (lead.keyContactEmail) originalRow.keyContactEmail = lead.keyContactEmail;
  if (lead.ceoName) originalRow.ceoName = lead.ceoName;
  if (lead.linkedinUrl) originalRow.linkedinUrl = lead.linkedinUrl;

  const headers = Object.keys(originalRow);
  const enrichmentInstructions = instructions || `Enrich the data for ${lead.companyName}. Find missing contact details, firmographics, tech stack, and key decision makers.`;

  const job = await db.enrichmentJob.create({
    data: {
      fileName: `${lead.companyName}-enrichment.csv`,
      originalData: JSON.stringify([originalRow]),
      enrichedData: JSON.stringify([originalRow]),
      headers: JSON.stringify(headers),
      enrichedHeaders: JSON.stringify(headers),
      instructions: enrichmentInstructions,
      status: 'uploaded',
      totalRows: 1,
      processedRows: 0,
      currentRow: 0,
    },
  });

  return NextResponse.json({
    success: true,
    enrichmentJobId: job.id,
  });
}

// ============================================================
// lead-to-outreach — Generate outreach messages for a lead
// ============================================================

async function handleLeadToOutreach(body: {
  leadId: string;
  channel?: string;
  outreachType?: string;
}) {
  const { leadId, channel, outreachType } = body;

  if (!leadId) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { outreach: true },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const outreachChannel = channel || 'email';
  const outreachTypeValue = outreachType || 'cold_email';

  // Use LLM to generate personalized outreach messages
  let subject = `Opportunity for ${lead.companyName}`;
  let messageBody = `Hi ${lead.keyContactName || 'there'},\n\nI came across ${lead.companyName} and was impressed by your work${lead.industry ? ` in the ${lead.industry} industry` : ''}. I'd love to explore how we might be able to help you achieve your goals.\n\nWould you be open to a brief conversation this week?\n\nBest regards`;

  try {
    const { callLLM } = await import('@/lib/llm');
    const llmResponse = await callLLM({
      systemPrompt: 'You are an expert B2B outreach copywriter. Write concise, compelling, personalized outreach messages that avoid generic sales language. Focus on value and specific pain points.',
      userMessage: `Generate a ${outreachTypeValue.replace(/_/g, ' ')} ${outreachChannel} message for this lead:\n\nCompany: ${lead.companyName}\n${lead.industry ? `Industry: ${lead.industry}\n` : ''}${lead.keyContactName ? `Contact: ${lead.keyContactName} (${lead.keyContactTitle || 'Decision Maker'})\n` : ''}${lead.employeeCount ? `Size: ${lead.employeeCount} employees\n` : ''}${lead.revenueEstimate ? `Revenue: ${lead.revenueEstimate}\n` : ''}${lead.website ? `Website: ${lead.website}\n` : ''}\n${outreachChannel === 'email' ? 'Include a subject line prefixed with "Subject: " on the first line, then the email body.' : 'Just write the message body.'}`,
      temperature: 0.4,
    });

    if (llmResponse) {
      if (outreachChannel === 'email') {
        const lines = llmResponse.split('\n');
        const subjectLine = lines.find((l: string) => l.toLowerCase().startsWith('subject:'));
        if (subjectLine) {
          subject = subjectLine.replace(/^subject\s*:\s*/i, '').trim();
          messageBody = lines.slice(lines.indexOf(subjectLine) + 1).join('\n').trim();
        } else {
          messageBody = llmResponse;
        }
      } else {
        messageBody = llmResponse;
      }
    }
  } catch (err) {
    console.warn('[lead-to-outreach] LLM generation failed, using template:', err);
  }

  // Create the outreach record
  const outreach = await db.outreach.create({
    data: {
      leadId,
      channel: outreachChannel,
      type: outreachTypeValue,
      subject: outreachChannel === 'email' ? subject : null,
      body: messageBody,
      status: 'draft',
    },
  });

  return NextResponse.json({
    success: true,
    outreachIds: [outreach.id],
  });
}

// ============================================================
// autoresearch-to-outreach — Apply autoresearch findings to outreach
// ============================================================

async function handleAutoresearchToOutreach(body: {
  jobId: string;
  leadId?: string;
}) {
  const { jobId, leadId } = body;

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const job = await db.autoresearchJob.findUnique({
    where: { id: jobId },
    include: {
      experiments: {
        orderBy: { score: 'desc' },
        take: 5,
      },
      fragments: {
        orderBy: { score: 'desc' },
        take: 10,
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Autoresearch job not found' }, { status: 404 });
  }

  if (!job.experiments || job.experiments.length === 0) {
    return NextResponse.json({ error: 'No experiments found for this job' }, { status: 400 });
  }

  // Build research findings summary from best experiments
  const topExperiments = job.experiments.slice(0, 3);
  const findings = topExperiments.map((exp, i) => ({
    rank: i + 1,
    strategy: exp.strategy,
    candidateName: exp.candidateName,
    score: exp.score,
    headerSnippet: exp.header?.slice(0, 200) || '',
    footerSnippet: exp.footer?.slice(0, 200) || '',
    responseSnippet: exp.response?.slice(0, 300) || '',
  }));

  // Build fragments summary
  const topFragments = (job.fragments || [])
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((f) => ({
      kind: f.kind,
      text: f.text.slice(0, 200),
      score: f.score,
    }));

  // If a leadId is provided, generate outreach for that lead
  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      try {
        const { callLLM } = await import('@/lib/llm');
        const llmResponse = await callLLM({
          systemPrompt: 'You are an expert B2B outreach copywriter. Use the research findings below to create highly effective, personalized outreach messages. Apply the successful patterns and techniques identified by the research.',
          userMessage: `Generate a cold email for ${lead.companyName}${lead.industry ? ` (${lead.industry})` : ''}.\n${lead.keyContactName ? `Contact: ${lead.keyContactName}\n` : ''}\nAutoresearch findings (what messaging patterns work best):\n${JSON.stringify(findings, null, 2)}\n\nTop performing text fragments:\n${JSON.stringify(topFragments, null, 2)}\n\nUse these insights to craft a compelling, personalized message. Include "Subject: " on the first line followed by the email body.`,
          temperature: 0.4,
        });

        if (llmResponse) {
          const lines = llmResponse.split('\n');
          const subjectLine = lines.find((l: string) => l.toLowerCase().startsWith('subject:'));
          let subject = `Opportunity for ${lead.companyName}`;
          let messageBody = llmResponse;

          if (subjectLine) {
            subject = subjectLine.replace(/^subject\s*:\s*/i, '').trim();
            messageBody = lines.slice(lines.indexOf(subjectLine) + 1).join('\n').trim();
          }

          const outreach = await db.outreach.create({
            data: {
              leadId,
              channel: 'email',
              type: 'cold_email',
              subject,
              body: messageBody,
              status: 'draft',
            },
          });

          return NextResponse.json({
            success: true,
            outreachIds: [outreach.id],
            researchSummary: {
              bestScore: job.bestScore,
              baselineScore: job.baselineScore,
              topStrategy: topExperiments[0]?.strategy,
              totalExperiments: job.totalExperiments,
            },
          });
        }
      } catch (err) {
        console.warn('[autoresearch-to-outreach] LLM generation failed:', err);
      }
    }
  }

  // No leadId or LLM failed — just return the research findings for reference
  return NextResponse.json({
    success: true,
    outreachIds: [],
    researchSummary: {
      bestScore: job.bestScore,
      baselineScore: job.baselineScore,
      topStrategy: topExperiments[0]?.strategy,
      totalExperiments: job.totalExperiments,
      findings: safeSerialize(findings),
      topFragments: safeSerialize(topFragments),
    },
  });
}
