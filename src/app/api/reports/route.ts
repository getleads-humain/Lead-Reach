import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: List all reports with optional prospectName filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prospectName = searchParams.get('prospectName');

    const where = prospectName
      ? { prospectName: { contains: prospectName } }
      : {};

    const reports = await db.prospectReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
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
      })),
    });
  } catch (error) {
    console.error('[reports] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// DELETE: Delete a report by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = await db.prospectReport.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await db.prospectReport.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Report "${report.title}" deleted successfully`,
    });
  } catch (error) {
    console.error('[reports] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
