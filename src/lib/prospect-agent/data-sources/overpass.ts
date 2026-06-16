// ============================================================
// Overpass API Data Source — OpenStreetMap Place Discovery
// ============================================================
//
// Free, no API key required. Queries the Overpass API to extract
// points of interest (POIs), businesses, amenities, and offices
// from OpenStreetMap within a bounding box or around a center point.
//
// Wired to: Scout agent (Prospect Discovery) — for place-based lead
// discovery ("find all cafes in Kreuzberg, Berlin").
//
// Public API:
//   - overpassSearchPlaces()   → Search POIs by category + bbox/center
//   - overpassGetPlace()       → Fetch a single OSM element by id
//   - overpassHealth()         → Check endpoint availability
//
// Rate limit: 2 concurrent requests, 10,000 queries/day per IP
// (per https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Instances)
// ============================================================

// ─── Configuration ───────────────────────────────────────────────────────

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const OVERPASS_TIMEOUT = 60_000; // 60s — Overpass can be slow on large queries
const MAX_RESULTS = 200;

// ─── Types ───────────────────────────────────────────────────────────────

export type OsmElementType = 'node' | 'way' | 'relation';

export interface OverpassPlace {
  osmId: string;
  osmType: OsmElementType;
  name: string;
  category: string;        // amenity, shop, office, tourism, etc.
  subcategory: string;     // cafe, restaurant, insurance, etc.
  latitude: number;
  longitude: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  wheelchair?: 'yes' | 'no' | 'limited';
  buildingAreaSqM?: number;
  tags: Record<string, string>;
}

export interface OverpassSearchOptions {
  /** Category tag: amenity, shop, office, tourism, leisure, craft */
  category?: string;
  /** Subcategory value: cafe, restaurant, insurance, etc. */
  subcategory?: string;
  /** Free-text name filter (case-insensitive) */
  nameContains?: string;
  /** Bounding box: [south, west, north, east] in degrees */
  bbox?: [number, number, number, number];
  /** Center point + radius (km) — alternative to bbox */
  around?: { lat: number; lon: number; radiusKm: number };
  /** Max results (default 100, capped at 200) */
  limit?: number;
}

export interface OverpassSearchResult {
  success: boolean;
  places: OverpassPlace[];
  count: number;
  endpoint: string;
}

// ─── Internal Helpers ────────────────────────────────────────────────────

function buildOverpassQuery(opts: OverpassSearchOptions): string {
  const cat = opts.category || 'amenity';
  const sub = opts.subcategory || '*';
  const limit = Math.min(opts.limit || 100, MAX_RESULTS);

  let areaFilter = '';
  if (opts.bbox) {
    const [s, w, n, e] = opts.bbox;
    areaFilter = `(${s},${w},${n},${e})`;
  } else if (opts.around) {
    const { lat, lon, radiusKm } = opts.around;
    // Convert km to meters for Overpass "around" filter
    areaFilter = `(around:${Math.round(radiusKm * 1000)},${lat},${lon})`;
  } else {
    // Default: entire world (will be slow, but valid)
    areaFilter = '';
  }

  // Build the query — handle wildcard subcategory
  const tagFilter = sub === '*'
    ? `["${cat}"]`
    : `["${cat}"="${sub}"]`;

  return `[out:json][timeout:55];
    (
      node${tagFilter}${areaFilter};
      way${tagFilter}${areaFilter};
    );
    out center body ${limit};`;
}

function mapElement(el: any): OverpassPlace | null {
  if (!el || !el.type || !el.id) return null;

  const tags = el.tags || {};
  const name = tags.name || tags['name:en'] || '';
  if (!name) return null; // Skip unnamed POIs

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;

  // Pick the primary category (first matching well-known OSM key)
  const categoryKeys = ['amenity', 'shop', 'office', 'tourism', 'leisure', 'craft', 'healthcare', 'education'];
  let category = '';
  let subcategory = '';
  for (const k of categoryKeys) {
    if (tags[k]) {
      category = k;
      subcategory = tags[k];
      break;
    }
  }
  if (!category) {
    category = 'unknown';
    subcategory = 'poi';
  }

  // Extract address fields
  const address: OverpassPlace['address'] = {};
  if (tags['addr:street']) address.street = tags['addr:street'];
  if (tags['addr:housenumber']) address.street = `${tags['addr:housenumber']} ${address.street || ''}`.trim();
  if (tags['addr:city']) address.city = tags['addr:city'];
  if (tags['addr:state']) address.state = tags['addr:state'];
  if (tags['addr:postcode']) address.postalCode = tags['addr:postcode'];
  if (tags['addr:country']) address.country = tags['addr:country'];

  // Building area (sq meters) — for ways with geometry
  let buildingAreaSqM: number | undefined;
  if (el.geometry && el.type === 'way' && el.geometry.length >= 3) {
    buildingAreaSqM = computePolygonArea(el.geometry);
  }

  // Wheelchair
  let wheelchair: OverpassPlace['wheelchair'];
  if (tags.wheelchair === 'yes' || tags.wheelchair === 'no' || tags.wheelchair === 'limited') {
    wheelchair = tags.wheelchair;
  }

  return {
    osmId: `${el.type[0].toUpperCase()}${el.id}`,
    osmType: el.type,
    name,
    category,
    subcategory,
    latitude: lat,
    longitude: lon,
    address: Object.keys(address).length > 0 ? address : undefined,
    phone: tags.phone || tags['contact:phone'] || undefined,
    email: tags.email || tags['contact:email'] || undefined,
    website: tags.website || tags['contact:website'] || tags.url || undefined,
    openingHours: tags.opening_hours || undefined,
    wheelchair,
    buildingAreaSqM,
    tags,
  };
}

/**
 * Compute the area of a polygon given an array of {lat, lon} points
 * using the spherical excess formula. Returns area in sq meters.
 */
function computePolygonArea(geom: Array<{ lat: number; lon: number }>): number {
  if (geom.length < 3) return 0;
  const R = 6378137; // Earth radius in meters
  let total = 0;
  for (let i = 0; i < geom.length; i++) {
    const p1 = geom[i];
    const p2 = geom[(i + 1) % geom.length];
    total += (p2.lon - p1.lon) * (Math.PI / 180) *
             (2 + Math.sin((p1.lat * Math.PI) / 180) + Math.sin((p2.lat * Math.PI) / 180));
  }
  return Math.abs((total * R * R) / 2);
}

async function callOverpass(query: string): Promise<any> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(OVERPASS_TIMEOUT),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        lastError = new Error(`Overpass ${endpoint} returned ${res.status}: ${text.slice(0, 200)}`);
        continue;
      }

      const json = await res.json() as { elements?: any[] };
      return { elements: json.elements || [], endpoint };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Try next endpoint
      continue;
    }
  }

  throw lastError || new Error('All Overpass endpoints failed');
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Search OpenStreetMap for points of interest (POIs) by category and area.
 *
 * @example
 * // Find all cafes in a 5km radius around central Berlin
 * const result = await overpassSearchPlaces({
 *   category: 'amenity',
 *   subcategory: 'cafe',
 *   around: { lat: 52.5200, lon: 13.4050, radiusKm: 5 },
 *   limit: 50,
 * });
 *
 * @example
 * // Find all insurance offices within a bounding box
 * const result = await overpassSearchPlaces({
 *   category: 'office',
 *   subcategory: 'insurance',
 *   bbox: [40.70, -74.02, 40.78, -73.96], // [S, W, N, E]
 * });
 */
export async function overpassSearchPlaces(
  opts: OverpassSearchOptions,
): Promise<OverpassSearchResult> {
  const query = buildOverpassQuery(opts);
  const { elements, endpoint } = await callOverpass(query);

  let places = elements
    .map(mapElement)
    .filter((p): p is OverpassPlace => p !== null);

  // Apply name filter
  if (opts.nameContains) {
    const needle = opts.nameContains.toLowerCase();
    places = places.filter(p => p.name.toLowerCase().includes(needle));
  }

  return {
    success: true,
    places,
    count: places.length,
    endpoint,
  };
}

/**
 * Fetch a single OSM element by type + id.
 */
export async function overpassGetPlace(
  osmType: OsmElementType,
  osmId: number,
): Promise<OverpassPlace | null> {
  const query = `[out:json][timeout:25];
    ${osmType}(${osmId});
    out body;`;
  const { elements } = await callOverpass(query);
  if (!elements || elements.length === 0) return null;
  return mapElement(elements[0]);
}

/**
 * Check Overpass API health by sending a tiny query.
 */
export async function overpassHealth(): Promise<{
  status: 'ok' | 'error';
  endpoint?: string;
  latencyMs?: number;
}> {
  const start = Date.now();
  try {
    const { endpoint } = await callOverpass('[out:json];node(1);out body;');
    return { status: 'ok', endpoint, latencyMs: Date.now() - start };
  } catch {
    return { status: 'error' };
  }
}

// ─── Convenience: Build a Lead-shaped object from a place ────────────────

/**
 * Convert an OverpassPlace into the Lead model shape (leadType='place').
 * Used by the Scout agent when ingesting OSM POIs as leads.
 */
export function overpassPlaceToLeadFields(place: OverpassPlace) {
  return {
    leadType: 'place' as const,
    displayName: place.name,
    companyName: place.name, // For backward compat — companyName is required on Lead
    latitude: place.latitude,
    longitude: place.longitude,
    placeType: place.subcategory,
    hqAddress: place.address?.street,
    city: place.address?.city,
    stateProvince: place.address?.state,
    postalCode: place.address?.postalCode,
    country: place.address?.country,
    phoneMain: place.phone,
    generalEmail: place.email,
    website: place.website,
    osmTags: JSON.stringify(place.tags),
    sources: JSON.stringify(['overpass']),
    industry: place.category === 'shop' ? 'Retail' :
              place.category === 'office' ? 'Professional Services' :
              place.category === 'amenity' ? 'Hospitality/Services' :
              place.category === 'tourism' ? 'Tourism' : undefined,
  };
}
