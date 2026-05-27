import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import { callLLMForJSON } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, leadIds, fields } = body;

    if (!campaignId && (!leadIds || !Array.isArray(leadIds))) {
      return NextResponse.json({ error: 'campaignId or leadIds array is required' }, { status: 400 });
    }

    // Get leads to enrich
    const where: Record<string, unknown> = {};
    if (leadIds && Array.isArray(leadIds)) {
      where.id = { in: leadIds };
    } else if (campaignId) {
      where.campaignId = campaignId;
    }

    // Limit to prevent overload
    const leads = await db.lead.findMany({
      where,
      take: 50,
    });

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads found to enrich' }, { status: 404 });
    }

    let enriched = 0;
    let failed = 0;
    const results: Array<{ leadId: string; companyName: string; fieldsEnriched: string[] }> = [];

    for (const lead of leads) {
      try {
        const fieldsToEnrich = fields || getEmptyFields(lead);
        if (fieldsToEnrich.length === 0) {
          results.push({ leadId: lead.id, companyName: lead.companyName, fieldsEnriched: [] });
          continue;
        }

        // Gather web data about the company
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
          // Web search failed, continue with LLM only
        }

        // Use centralized callLLMForJSON with rate limiting, retries, and model fallback
        const systemPrompt = `You are a B2B data enrichment specialist. Fill in the missing fields for this company based on available data. Respond ONLY with a JSON object containing the filled fields. Use null for fields you cannot determine.
Available fields: industry, subIndustry, website, hqAddress, city, stateProvince, country, postalCode, phoneMain, generalEmail, ceoName, keyContactName, keyContactTitle, employeeCount, revenueEstimate, foundingYear, ownershipType, linkedinUrl, techStack
Example: {"industry": "Technology", "employeeCount": "51-200"}`;

        const userMessage = `COMPANY: ${lead.companyName}
INDUSTRY: ${lead.industry || 'Unknown'}
WEBSITE: ${lead.website || 'Unknown'}
CITY: ${lead.city || 'Unknown'}
COUNTRY: ${lead.country || 'Unknown'}

WEB RESEARCH DATA:
${webData || 'No web data available'}

FIELDS TO FILL (only fill fields that are missing or empty):
${fieldsToEnrich.join(', ')}`;

        try {
          const enrichedData = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
            temperature: 0.2,
            retriesPerModel: 2,
            useFallback: true,
          });

          // Update the lead with enriched data
          const updateData: Record<string, unknown> = {
            enrichedAt: new Date(),
            stage: lead.stage === 'new' ? 'enriched' : lead.stage,
          };

          const fieldsEnriched: string[] = [];
          if (enrichedData) {
            for (const [key, value] of Object.entries(enrichedData)) {
              if (value !== null && value !== undefined && value !== '') {
                const currentVal = (lead as Record<string, unknown>)[key];
                if (!currentVal || currentVal === '' || currentVal === null) {
                  updateData[key] = value;
                  fieldsEnriched.push(key);
                }
              }
            }
          }

          if (fieldsEnriched.length > 0) {
            await db.lead.update({
              where: { id: lead.id },
              data: updateData,
            });
            enriched++;
          }

          results.push({ leadId: lead.id, companyName: lead.companyName, fieldsEnriched });
        } catch {
          failed++;
          results.push({ leadId: lead.id, companyName: lead.companyName, fieldsEnriched: [] });
        }
      } catch {
        failed++;
        results.push({ leadId: lead.id, companyName: lead.companyName, fieldsEnriched: [] });
      }
    }

    return NextResponse.json({
      total: leads.length,
      enriched,
      failed,
      results,
    });
  } catch (error) {
    console.error('Error bulk enriching leads:', error);
    return NextResponse.json({ error: 'Failed to bulk enrich leads' }, { status: 500 });
  }
}

function getEmptyFields(lead: Record<string, unknown>): string[] {
  const fieldsToCheck = [
    'industry', 'subIndustry', 'website', 'hqAddress', 'city', 'stateProvince',
    'country', 'phoneMain', 'generalEmail', 'ceoName', 'keyContactName',
    'keyContactTitle', 'employeeCount', 'revenueEstimate', 'foundingYear',
    'ownershipType', 'linkedinUrl', 'techStack',
  ];

  return fieldsToCheck.filter(field => !lead[field] || lead[field] === '');
}
