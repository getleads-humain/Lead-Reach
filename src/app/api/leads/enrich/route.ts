import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import { callLLMForJSON } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Gather web data
    let webData = '';
    try {
      const searchResult = await exaSearch(`${lead.companyName} ${lead.industry || ''} company information`, 3);
      if (searchResult.success && searchResult.data.length > 0) {
        webData = searchResult.data.map(r => `${r.title}: ${r.snippet}`).join('\n');
      }

      if (lead.website) {
        const webResult = await webRead(lead.website);
        if (webResult.success && webResult.data.content) {
          webData += '\n' + webResult.data.content.slice(0, 3000);
        }
      }
    } catch {
      // Web research failed
    }

    // Find empty fields
    const emptyFields = [
      'industry', 'subIndustry', 'website', 'hqAddress', 'city', 'stateProvince',
      'country', 'phoneMain', 'generalEmail', 'ceoName', 'keyContactName',
      'keyContactTitle', 'employeeCount', 'revenueEstimate', 'foundingYear',
      'ownershipType', 'linkedinUrl', 'techStack',
    ].filter(field => !(lead as Record<string, unknown>)[field]);

    if (emptyFields.length === 0) {
      return NextResponse.json({ message: 'Lead already has all fields filled', fieldsEnriched: [] });
    }

    const systemPrompt = `You are a B2B data enrichment specialist. Fill in the missing fields for a company based on available data. Respond ONLY with a JSON object containing the filled fields. Use null for fields you cannot determine.`;

    const userMessage = `COMPANY: ${lead.companyName}
INDUSTRY: ${lead.industry || 'Unknown'}
WEBSITE: ${lead.website || 'Unknown'}
CITY: ${lead.city || 'Unknown'}
COUNTRY: ${lead.country || 'Unknown'}

WEB RESEARCH DATA:
${webData || 'No web data available'}

FIELDS TO FILL:
${emptyFields.join(', ')}`;

    try {
      const enrichedData = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
        temperature: 0.2,
        retriesPerModel: 2,
        useFallback: true,
      });

      const updateData: Record<string, unknown> = {
        enrichedAt: new Date(),
        stage: lead.stage === 'new' ? 'enriched' : lead.stage,
      };

      const fieldsEnriched: string[] = [];
      if (enrichedData) {
        for (const [key, value] of Object.entries(enrichedData)) {
          if (value !== null && value !== undefined && value !== '') {
            updateData[key] = value;
            fieldsEnriched.push(key);
          }
        }
      }

      if (fieldsEnriched.length > 0) {
        await db.lead.update({
          where: { id: leadId },
          data: updateData,
        });
      }

      const updatedLead = await db.lead.findUnique({ where: { id: leadId } });

      return NextResponse.json({
        lead: updatedLead,
        fieldsEnriched,
        dataPointsFound: fieldsEnriched.length,
      });
    } catch (llmError) {
      console.error('LLM enrichment failed:', llmError);
      return NextResponse.json({ error: 'AI enrichment failed', fieldsEnriched: [] }, { status: 500 });
    }
  } catch (error) {
    console.error('Error enriching lead:', error);
    return NextResponse.json({ error: 'Failed to enrich lead' }, { status: 500 });
  }
}
