// ============================================================
// /api/data-sources/discover-places — OSM Place Discovery
// ============================================================
// Calls the Overpass API to discover points of interest (POIs)
// within a bounding box or radius. Returns place-type leads.
//
// Body:
//   {
//     category?: "amenity" | "shop" | "office" | "tourism" | "leisure" | "craft",
//     subcategory?: "cafe" | "restaurant" | "insurance" | ...,
//     bbox?: [south, west, north, east],   // OR
//     around?: { lat, lon, radiusKm },
//     limit?: number                       // default 100, max 200
//   }
// ============================================================

import { NextResponse } from 'next/server';
import { discoverPlaces } from '@/lib/prospect-agent/channel-enrichment';
import type { OverpassSearchOptions } from '@/lib/prospect-agent/data-sources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90; // Overpass can be slow

interface DiscoverRequest {
  category?: OverpassSearchOptions['category'];
  subcategory?: string;
  bbox?: [number, number, number, number];
  around?: { lat: number; lon: number; radiusKm: number };
  limit?: number;
  nameContains?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DiscoverRequest;

    if (!body.bbox && !body.around) {
      return NextResponse.json(
        { error: 'Either bbox or around must be specified' },
        { status: 400 },
      );
    }

    const result = await discoverPlaces({
      category: body.category,
      subcategory: body.subcategory,
      bbox: body.bbox,
      around: body.around,
      limit: body.limit,
    });

    // Apply optional name filter (Overpass doesn't support it natively in all cases)
    let places = result.places;
    if (body.nameContains) {
      const needle = body.nameContains.toLowerCase();
      places = places.filter(p =>
        String(p.name || '').toLowerCase().includes(needle)
      );
    }

    return NextResponse.json({
      success: result.success,
      count: places.length,
      places,
      error: result.error,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Place discovery failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
