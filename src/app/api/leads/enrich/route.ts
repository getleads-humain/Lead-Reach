import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import ZAI from 'z-ai-web-dev-sdk';

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

    const prompt = `You are a B2B data enrichment specialist. Fill in the missing fields for this company.

COMPANY: ${lead.companyName}
INDUSTRY: ${lead.industry || 'Unknown'}
WEBSITE: ${lead.website || 'Unknown'}
CITY: ${lead.city || 'Unknown'}
COUNTRY: ${lead.country || 'Unknown'}

WEB RESEARCH DATA:
${webData || 'No web data available'}

FIELDS TO FILL:
${emptyFields.join(', ')}

Respond ONLY with a JSON object containing the filled fields. Use null for fields you cannot determine.`;

    try {
      const zai = await ZAI.create();
      const llmResult = await zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
      });

      const content = llmResult.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const enrichedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      const updateData: Record<string, unknown> = {
        enrichedAt: new Date(),
        stage: lead.stage === 'new' ? 'enriched' : lead.stage,
      };

      const fieldsEnriched: string[] = [];
      for (const [key, value] of Object.entries(enrichedData)) {
        if (value !== null && value !== undefined && value !== '') {
          updateData[key] = value;
          fieldsEnriched.push(key);
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
