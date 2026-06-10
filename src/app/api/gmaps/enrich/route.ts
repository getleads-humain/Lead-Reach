import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, location, website, enrichOptions } = body;

    if (!companyName) {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
    }

    const searchParams = new URLSearchParams();
    searchParams.set('XTransformPort', '5340');

    // Step 1: Search for the company on Google Maps
    const searchQuery = location ? `${companyName} ${location}` : companyName;
    const searchResponse = await fetch(`/api/v1/search?${searchParams.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        options: { depth: 3, max_results: 5 },
      }),
    });

    if (!searchResponse.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const searchData = await searchResponse.json();
    const results = searchData.results || [];

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        enriched_data: {},
        completeness: 0,
        match_confidence: 0,
        message: 'No matching business found on Google Maps',
      });
    }

    // Step 2: Find the best match
    let bestMatch = results[0];
    let bestScore = 0;

    for (const biz of results) {
      let score = 0;
      const nameSimilarity = calculateSimilarity(
        companyName.toLowerCase(),
        (biz.title || '').toLowerCase()
      );
      score += nameSimilarity * 50;

      if (location && biz.address && biz.address.toLowerCase().includes(location.toLowerCase())) {
        score += 25;
      }

      if (website && biz.website) {
        const domain1 = extractDomain(website);
        const domain2 = extractDomain(biz.website);
        if (domain1 === domain2) score += 25;
      }

      if (biz.review_count > 0) score += Math.min(biz.review_count / 10, 10);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = biz;
      }
    }

    // Step 3: Enrich with email extraction if requested
    if (enrichOptions?.email && bestMatch.website) {
      try {
        const emailResponse = await fetch(`/api/v1/extract-emails?${searchParams.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website_url: bestMatch.website }),
        });
        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          bestMatch.emails = emailData.emails || [];
        }
      } catch (e) {
        // Email extraction failed, continue without
      }
    }

    // Calculate completeness
    const completeness = calculateCompleteness(bestMatch);

    return NextResponse.json({
      success: true,
      enriched_data: bestMatch,
      completeness,
      match_confidence: Math.min(bestScore, 100),
    });
  } catch (error: any) {
    console.error('[GMaps Enrich API] Error:', error.message);
    return NextResponse.json({ success: false, enriched_data: {}, completeness: 0, match_confidence: 0, error: error.message }, { status: 500 });
  }
}

function calculateSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function extractDomain(url: string): string {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    return new URL(fullUrl).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function calculateCompleteness(biz: any): number {
  const fields: [string, number][] = [
    ['title', 5], ['category', 5], ['address', 8], ['phone', 10],
    ['website', 10], ['email', 12], ['review_count', 3], ['review_rating', 3],
    ['latitude', 5], ['longitude', 5], ['open_hours', 5], ['description', 5],
    ['status', 3], ['timezone', 2], ['complete_address', 8], ['images', 3],
    ['about', 3], ['popular_times', 2], ['price_range', 2],
  ];

  let score = 0;
  let maxScore = 0;

  for (const [field, weight] of fields) {
    maxScore += weight;
    const value = biz[field];
    if (value && (typeof value === 'string' ? value.length > 0 : true) &&
        (Array.isArray(value) ? value.length > 0 : true) &&
        (typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length > 0 : true)) {
      score += weight;
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}
