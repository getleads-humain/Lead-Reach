import { NextRequest, NextResponse } from 'next/server';
import { detectTechStack, detectIndustry, extractSocialLinks, extractContactInfo, estimateCompanySize } from '@/lib/sales-intelligence';

/**
 * POST /api/sales-intelligence/analyze-url
 *
 * Analyze HTML content from a URL to extract sales intelligence:
 * - Tech stack detection
 * - Industry classification
 * - Social links
 * - Contact info (emails, phones)
 * - Company size signals
 *
 * Body: {
 *   html: string;          // Raw HTML content
 *   url?: string;          // Original URL (for context)
 *   scripts?: string[];    // Script src URLs for tech detection
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.html) {
      return NextResponse.json({ error: 'html content is required' }, { status: 400 });
    }

    const html = body.html;
    const scripts = body.scripts || [];

    const [techStack, industrySignals, socialLinks, contactInfo, companySizeSignals] = await Promise.all([
      Promise.resolve(detectTechStack(html, scripts)),
      Promise.resolve(detectIndustry(html)),
      Promise.resolve(extractSocialLinks(html)),
      Promise.resolve(extractContactInfo(html)),
      Promise.resolve(estimateCompanySize(html)),
    ]);

    return NextResponse.json({
      url: body.url || null,
      techStack,
      industrySignals,
      socialLinks,
      contactInfo,
      companySizeSignals,
    });
  } catch (error) {
    console.error('[Analyze URL] Error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
