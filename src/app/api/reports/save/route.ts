import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prospectName,
      prospectUrl,
      title,
      type,
      content,
      sections,
      campaignId,
    } = body as {
      prospectName: string;
      prospectUrl?: string;
      title: string;
      type: string;
      content: Record<string, unknown>;
      sections?: string[];
      campaignId?: string;
    };

    if (!prospectName || !title || !content) {
      return NextResponse.json({ error: 'prospectName, title, and content are required' }, { status: 400 });
    }

    const report = await db.prospectReport.create({
      data: {
        prospectName,
        prospectUrl: prospectUrl || null,
        title,
        type: type || 'prospect-profile',
        content: typeof content === 'string' ? content : JSON.stringify(content),
        sections: sections ? JSON.stringify(sections) : null,
        campaignId: campaignId || null,
        status: 'active',
        source: 'prospect-discovery',
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        prospectName: report.prospectName,
        prospectUrl: report.prospectUrl,
        title: report.title,
        type: report.type,
        content: report.content,
        sections: report.sections,
        campaignId: report.campaignId,
        status: report.status,
        source: report.source,
        createdAt: typeof report.createdAt === 'string' ? report.createdAt : report.createdAt?.toISOString?.() ?? null,
        updatedAt: typeof report.updatedAt === 'string' ? report.updatedAt : report.updatedAt?.toISOString?.() ?? null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[reports/save] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save report', details: message }, { status: 500 });
  }
}
