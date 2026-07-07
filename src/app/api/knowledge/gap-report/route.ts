/**
 * /api/knowledge/gap-report — Generate (or fetch latest) Echo gap report
 *
 * GET (no params) — returns the most recent gap report (looks for the latest
 *   YYYY-MM-gap-report.md in knowledge/gap-reports/). If none exists, generates
 *   one on the fly.
 *
 * POST — forces generation of a new gap report for the current month.
 *   Overwrites any existing report for the current month.
 *
 * Query params:
 *   month — optional YYYY-MM; returns the report for that month (read-only).
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import * as fs from 'fs';
import * as path from 'path';
import { generateGapReport, type GapReportResult } from '@/lib/knowledge/gap-report';
import { getKnowledgeIndex } from '@/lib/knowledge';

const GAP_REPORTS_DIR = path.join(process.cwd(), 'knowledge', 'gap-reports');

function findLatestReport(): string | null {
  if (!fs.existsSync(GAP_REPORTS_DIR)) return null;
  const files = fs.readdirSync(GAP_REPORTS_DIR)
    .filter(f => f.endsWith('-gap-report.md'))
    .sort()
    .reverse();
  return files.length > 0 ? path.join(GAP_REPORTS_DIR, files[0]) : null;
}

function findReportForMonth(month: string): string | null {
  const filePath = path.join(GAP_REPORTS_DIR, `${month}-gap-report.md`);
  return fs.existsSync(filePath) ? filePath : null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get('month');

    let reportPath: string | null;
    if (month) {
      reportPath = findReportForMonth(month);
      if (!reportPath) {
        return Response.json(
          { ok: false, error: `No gap report found for month ${month}` },
          { status: 404 }
        );
      }
    } else {
      reportPath = findLatestReport();
      if (!reportPath) {
        // No report exists yet — generate one on the fly
        const result = generateGapReport();
        return Response.json({ ok: true, result, generated: true }, { status: 200 });
      }
    }

    const content = fs.readFileSync(reportPath, 'utf-8');
    const fileName = path.basename(reportPath);
    const reportMonth = fileName.replace('-gap-report.md', '');

    // Also collect current stats for context
    const stats = getKnowledgeIndex().stats();

    // Generate fresh structured result for the UI
    const freshResult = generateGapReport({ now: new Date(reportMonth + '-01') });

    return Response.json({
      ok: true,
      reportMonth,
      reportPath: path.relative(process.cwd(), reportPath),
      content,
      stats,
      generated: false,
      result: {
        generatedAt: freshResult.generatedAt,
        reportMonth: freshResult.reportMonth,
        reportPath: freshResult.reportPath,
        totalGaps: freshResult.coverageGaps.industriesMissing.length +
          freshResult.coverageGaps.regionsMissing.length +
          freshResult.coverageGaps.playbooksMissing.length +
          freshResult.coverageGaps.domainsMissing.length +
          freshResult.coverageGaps.agentsMissing.length +
          freshResult.coverageGaps.methodologiesMissing.length +
          freshResult.coverageGaps.integrationsMissing.length +
          freshResult.coverageGaps.caseStudiesMissing.length +
          freshResult.coverageGaps.productMissing.length +
          freshResult.qualityGaps.length +
          freshResult.freshnessGaps.length,
        coverageGaps: freshResult.coverageGaps,
        qualityGaps: freshResult.qualityGaps,
        usageGaps: freshResult.usageGaps,
        freshnessGaps: freshResult.freshnessGaps,
        recommendations: freshResult.recommendations,
      },
    }, { status: 200 });
  } catch (err) {
    console.error('[/api/knowledge/gap-report GET] Error:', err);
    return Response.json(
      { ok: false, error: 'Failed to fetch gap report' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result: GapReportResult = generateGapReport();
    return Response.json({
      ok: true,
      result: {
        generatedAt: result.generatedAt,
        reportMonth: result.reportMonth,
        reportPath: result.reportPath,
        totalGaps: result.coverageGaps.industriesMissing.length +
          result.coverageGaps.regionsMissing.length +
          result.coverageGaps.playbooksMissing.length +
          result.coverageGaps.domainsMissing.length +
          result.coverageGaps.agentsMissing.length +
          result.coverageGaps.methodologiesMissing.length +
          result.coverageGaps.integrationsMissing.length +
          result.coverageGaps.caseStudiesMissing.length +
          result.coverageGaps.productMissing.length +
          result.qualityGaps.length +
          result.freshnessGaps.length,
        coverageGaps: result.coverageGaps,
        qualityGaps: result.qualityGaps,
        usageGaps: result.usageGaps,
        freshnessGaps: result.freshnessGaps,
        recommendations: result.recommendations,
      },
    }, { status: 200 });
  } catch (err) {
    console.error('[/api/knowledge/gap-report POST] Error:', err);
    return Response.json(
      { ok: false, error: 'Failed to generate gap report' },
      { status: 500 }
    );
  }
}
