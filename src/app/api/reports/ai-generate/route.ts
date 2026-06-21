/**
 * /api/reports/ai-generate
 *
 * AI report generator.
 *
 * Generates a comprehensive AI report for:
 *   - A specific lead (prospect profile report)
 *   - A specific campaign (campaign performance report)
 *   - All data (pipeline snapshot report)
 *
 * Returns a structured report with title, sections, and content that gets
 * persisted to the ProspectReport table (so it shows up in /api/reports).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

interface ReportSection {
  title: string;
  content: string;
}

interface AIReport {
  title: string;
  type: string;
  sections: ReportSection[];
  keyFindings: string[];
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reportType = 'pipeline_snapshot',
      leadId,
      campaignId,
      userInstruction,
      save = true,
    } = body as {
      reportType?: 'prospect_profile' | 'campaign_performance' | 'pipeline_snapshot' | 'market_analysis';
      leadId?: string;
      campaignId?: string;
      userInstruction?: string;
      save?: boolean;
    };

    let snapshot: Record<string, unknown> = {};
    let prospectName = 'Pipeline Snapshot';
    let prospectUrl: string | undefined;

    // Build snapshot based on report type
    if (reportType === 'prospect_profile' && leadId) {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: {
          campaign: { select: { name: true, targetIndustry: true, targetLocation: true } },
          outreach: { take: 30, orderBy: { createdAt: 'desc' }, select: { channel: true, type: true, status: true, subject: true, createdAt: true } },
        },
      });

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }

      prospectName = lead.companyName;
      prospectUrl = lead.website || undefined;
      snapshot = {
        lead: {
          company: lead.companyName,
          industry: lead.industry,
          website: lead.website,
          location: { city: lead.city, country: lead.country },
          employees: lead.employeeCount,
          revenue: lead.revenueEstimate,
          founded: lead.foundingYear,
          ownership: lead.ownershipType,
          techStack: lead.techStack,
          contact: { name: lead.keyContactName, title: lead.keyContactTitle, email: lead.keyContactEmail },
          leadScore: lead.leadScore,
          leadTier: lead.leadTier,
          stage: lead.stage,
          notes: lead.notes,
          enrichedAt: lead.enrichedAt,
        },
        campaign: lead.campaign,
        outreach: lead.outreach,
      };
    } else if (reportType === 'campaign_performance' && campaignId) {
      const campaign = await db.campaign.findUnique({
        where: { id: campaignId },
        include: {
          leads: {
            take: 100,
            orderBy: { leadScore: 'desc' },
            select: { id: true, companyName: true, industry: true, leadTier: true, leadScore: true, stage: true, keyContactName: true, createdAt: true },
          },
        },
      });

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      prospectName = `Campaign: ${campaign.name}`;
      snapshot = {
        campaign: {
          name: campaign.name,
          description: campaign.description,
          status: campaign.status,
          targetIndustry: campaign.targetIndustry,
          targetLocation: campaign.targetLocation,
          targetCompanySize: campaign.targetCompanySize,
          createdAt: campaign.createdAt,
        },
        leads: campaign.leads,
        summary: {
          total: campaign.leads.length,
          hot: campaign.leads.filter(l => l.leadTier === 'hot').length,
          warm: campaign.leads.filter(l => l.leadTier === 'warm').length,
          cold: campaign.leads.filter(l => l.leadTier === 'cold').length,
          qualified: campaign.leads.filter(l => l.stage === 'qualified').length,
          contacted: campaign.leads.filter(l => l.stage === 'contacted' || l.stage === 'engaged').length,
        },
      };
    } else {
      // Pipeline snapshot
      const [leads, campaigns, outreach, conversations] = await Promise.all([
        db.lead.findMany({ take: 200, orderBy: { createdAt: 'desc' }, select: { id: true, companyName: true, industry: true, leadTier: true, leadScore: true, stage: true, campaignId: true, createdAt: true } }),
        db.campaign.findMany({ select: { id: true, name: true, status: true, targetIndustry: true, createdAt: true } }),
        db.outreach.findMany({ take: 100, orderBy: { createdAt: 'desc' }, select: { id: true, status: true, channel: true, type: true, createdAt: true } }),
        db.setterConversation.findMany({ take: 100, orderBy: { updatedAt: 'desc' }, select: { id: true, leadName: true, leadChannel: true, status: true, qualificationScore: true, bookedAppointment: true } }),
      ]);

      prospectName = 'Pipeline Snapshot';
      snapshot = {
        summary: {
          totalLeads: leads.length,
          totalCampaigns: campaigns.length,
          totalOutreach: outreach.length,
          totalConversations: conversations.length,
          totalBookings: conversations.filter(c => c.bookedAppointment).length,
        },
        leadsByTier: {
          hot: leads.filter(l => l.leadTier === 'hot').length,
          warm: leads.filter(l => l.leadTier === 'warm').length,
          cold: leads.filter(l => l.leadTier === 'cold').length,
        },
        leadsByStage: {
          new: leads.filter(l => l.stage === 'new').length,
          enriched: leads.filter(l => l.stage === 'enriched').length,
          qualified: leads.filter(l => l.stage === 'qualified').length,
          contacted: leads.filter(l => l.stage === 'contacted' || l.stage === 'engaged').length,
        },
        outreachByStatus: {
          draft: outreach.filter(o => o.status === 'draft').length,
          sent: outreach.filter(o => o.status === 'sent').length,
          replied: outreach.filter(o => o.status === 'replied').length,
        },
        topCampaigns: campaigns.slice(0, 5),
      };
    }

    const systemPrompt = `You are a senior sales intelligence analyst. Generate a comprehensive ${reportType.replace(/_/g, ' ')} report from the provided data snapshot.

Return JSON with this EXACT shape:
{
  "title": "Report title (max 80 chars)",
  "type": "${reportType}",
  "sections": [
    {
      "title": "Section heading",
      "content": "2-4 paragraph section content with specific data references"
    }
  ],
  "keyFindings": [
    "Finding 1 with specific data",
    "Finding 2 ...",
    "Finding 3 ..."
  ],
  "recommendations": [
    "Recommendation 1 with concrete action",
    "Recommendation 2 ...",
    "Recommendation 3 ..."
  ]
}

Report-type guidance:
- prospect_profile: Cover company overview, industry context, contact analysis, competitive position, technology stack, buying signals, recommended outreach angle.
- campaign_performance: Cover campaign objectives, lead pipeline breakdown, channel performance, qualification funnel, top opportunities, risks, next steps.
- pipeline_snapshot: Cover executive summary, pipeline composition, conversion funnel, channel performance, top opportunities, risks, recommendations.
- market_analysis: Cover market overview, key trends, competitive landscape, target segment analysis, opportunities, threats.

Rules:
- Always reference specific numbers from the data.
- Each section should have 2-4 paragraphs of substantive content.
- Generate 4-7 sections, 4-6 keyFindings, and 3-5 recommendations.
- Always respond in English.
- Return ONLY valid JSON.`;

    const userMessage = `REPORT TYPE: ${reportType}
PROSPECT: ${prospectName}

DATA SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

${userInstruction ? `USER INSTRUCTION: ${userInstruction}\n\n` : ''}Generate the report now.`;

    const report = await callLLMForJSON<AIReport>(systemPrompt, userMessage, {
      temperature: 0.4,
      maxTokens: 6000,
      model: MODEL_PRIMARY,
      thinkingBudget: 'standard',
    });

    if (!report || !report.title || !Array.isArray(report.sections)) {
      return NextResponse.json({
        report: getDefaultReport(reportType, prospectName, snapshot),
      });
    }

    // Persist the report (use the same db.prospectReport accessor as existing routes — the model is added via Prisma extension)
    let savedReportId: string | null = null;
    if (save) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbAny = db as any;
        if (dbAny.prospectReport) {
          const saved = await dbAny.prospectReport.create({
            data: {
              prospectName,
              prospectUrl: prospectUrl || null,
              title: report.title,
              type: reportType,
              content: JSON.stringify({
                sections: report.sections,
                keyFindings: report.keyFindings,
                recommendations: report.recommendations,
              }),
              sections: report.sections.map(s => s.title),
              campaignId: campaignId || null,
              status: 'active',
              source: 'ai-generated',
            },
          });
          savedReportId = saved.id;
        }
      } catch (saveError) {
        console.warn('[reports/ai-generate] Failed to save report:', saveError);
      }
    }

    return NextResponse.json({
      report,
      savedReportId,
    });
  } catch (error) {
    console.error('[reports/ai-generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDefaultReport(reportType: string, prospectName: string, snapshot: Record<string, unknown>): AIReport {
  return {
    title: `${reportType.replace(/_/g, ' ')} — ${prospectName}`,
    type: reportType,
    sections: [
      {
        title: 'Overview',
        content: `This report covers ${prospectName}. AI generation encountered an issue and a fallback report has been generated. Please review the data snapshot and try regenerating.`,
      },
      {
        title: 'Data Snapshot',
        content: `Snapshot: ${JSON.stringify(snapshot).slice(0, 1000)}...`,
      },
    ],
    keyFindings: ['AI report generation failed — using fallback.'],
    recommendations: ['Retry report generation', 'Verify data quality', 'Contact support if issue persists'],
  };
}
