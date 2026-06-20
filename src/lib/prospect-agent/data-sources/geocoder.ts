// ============================================================
// Geocoder Data Source — Address ↔ Coordinates Conversion
// ============================================================
//
// Uses OpenStreetMap Nominatim (free, no API key required) by default.
// Can be extended with Bing/Google/Mapbox for higher quotas.
//
// Provides:
//   - Forward geocoding (address → lat/lng)
//   - Reverse geocoding (lat/lng → address)
//   - Distance calculation (haversine, in km)
//   - Administrative area resolution (region/state lookup)
//   - Time zone derivation (rough — based on longitude)
//
// Wired to: Augment (Enrichment) & Judge (Qualification) — as a utility.
//
// Rate limit: Nominatim's usage policy is 1 request/second.
// Production deployments should self-host Nominatim or use a paid provider.
// ============================================================

// ─── Configuration ───────────────────────────────────────────────────────

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const GEOCODE_TIMEOUT = 15_000;
const NOMINATIM_MIN_DELAY_MS = 1100; // 1.1s between requests (1 req/s limit)

// ─── Types ───────────────────────────────────────────────────────────────

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  displayName: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
  type: string;             // 'house', 'street', 'city', 'administrative'
  importance: number;       // 0-1
  boundingBox?: [number, number, number, number];
}

export interface GeocodeOptions {
  /** Restrict search to a specific country (ISO 3166-1 alpha-2, e.g., 'US') */
  countryCodes?: string;
  /** Restrict to bounding box [south, north, west, east] */
  viewbox?: [number, number, number, number];
  /** Limit results (default 5, max 40 per Nominatim policy) */
  limit?: number;
}

export interface DistanceResult {
  kilometers: number;
  miles: number;
  bearing: number;          // compass bearing 0-360°
}

// ─── Internal Helpers ────────────────────────────────────────────────────

let lastNominatimTime = 0;

async function enforceNominatimRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastNominatimTime;
  if (elapsed < NOMINATIM_MIN_DELAY_MS) {
    await new Promise(r => setTimeout(r, NOMINATIM_MIN_DELAY_MS - elapsed));
  }
  lastNominatimTime = Date.now();
}

async function nominatimFetch(path: string): Promise<any> {
  await enforceNominatimRateLimit();

  const url = `${NOMINATIM_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LeadReach-AI/1.0 (contact@leadreach.ai)',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(GEOCODE_TIMEOUT),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Nominatim returned ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

function mapNominatimResult(raw: any): GeocodedAddress {
  const addr = raw.address || {};
  return {
    latitude: Number(raw.lat) || 0,
    longitude: Number(raw.lon) || 0,
    displayName: raw.display_name || '',
    street: addr.road || addr.pedestrian || addr.footway,
    houseNumber: addr.house_number,
    city: addr.city || addr.town || addr.village || addr.hamlet,
    county: addr.county,
    state: addr.state,
    postcode: addr.postcode,
    country: addr.country,
    countryCode: addr.country_code?.toUpperCase(),
    type: raw.type || raw.category || 'unknown',
    importance: Number(raw.importance) || 0,
    boundingBox: raw.boundingbox
      ? [
          Number(raw.boundingbox[0]),
          Number(raw.boundingbox[1]),
          Number(raw.boundingbox[2]),
          Number(raw.boundingbox[3]),
        ]
      : undefined,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Forward geocode: convert a free-text address into lat/lng + structured fields.
 *
 * @example
 * const results = await geocodeForward('1600 Pennsylvania Ave, Washington DC');
 * console.log(results[0].latitude, results[0].longitude);
 */
export async function geocodeForward(
  query: string,
  opts: GeocodeOptions = {},
): Promise<GeocodedAddress[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(Math.min(opts.limit || 5, 40)),
  });
  if (opts.countryCodes) params.set('countrycodes', opts.countryCodes);
  if (opts.viewbox) {
    const [s, n, w, e] = opts.viewbox;
    params.set('viewbox', `${w},${s},${e},${n}`);
  }

  const data = await nominatimFetch(`/search?${params.toString()}`);
  if (!Array.isArray(data)) return [];
  return data.map(mapNominatimResult);
}

/**
 * Reverse geocode: convert lat/lng into a structured address.
 *
 * @example
 * const addr = await geocodeReverse(40.7128, -74.0060);
 * console.log(addr.city, addr.state); // 'New York', 'New York'
 */
export async function geocodeReverse(
  lat: number,
  lon: number,
): Promise<GeocodedAddress | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1',
  });

  const data = await nominatimFetch(`/reverse?${params.toString()}`);
  if (!data || data.error) return null;
  return mapNominatimResult(data);
}

/**
 * Calculate the haversine distance between two coordinates.
 *
 * @example
 * const d = haversineDistance(40.7128, -74.0060, 51.5074, -0.1278);
 * console.log(d.kilometers); // ~5570 km
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): DistanceResult {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Bearing
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return {
    kilometers: R * c,
    miles: R * c * 0.621371,
    bearing: (bearing + 360) % 360,
  };
}

/**
 * Compute the distance from a lead's location to a target center.
 * Useful as a KPI: "distance_to_downtown_km".
 *
 * @example
 * const kpi = await computeDistanceKpi(leadLat, leadLon, downtownLat, downtownLon);
 */
export function computeDistanceKpi(
  leadLat: number | null | undefined,
  leadLon: number | null | undefined,
  targetLat: number,
  targetLon: number,
): { distance_km: number; distance_mi: number; bearing: number } | null {
  if (typeof leadLat !== 'number' || typeof leadLon !== 'number') return null;
  const d = haversineDistance(leadLat, leadLon, targetLat, targetLon);
  return {
    distance_km: Math.round(d.kilometers * 10) / 10,
    distance_mi: Math.round(d.miles * 10) / 10,
    bearing: Math.round(d.bearing),
  };
}

/**
 * Derive an approximate IANA timezone from longitude (rough heuristic).
 *
 * For precise timezone lookup, use tz-lookup or @vvo/tzdb. This utility
 * is intentionally simple — used only when nothing better is available.
 */
export function roughTimezoneFromLongitude(lon: number): string {
  const offsets = [
    { tz: 'America/Los_Angeles', min: -127.5, max: -112.5 },
    { tz: 'America/Denver', min: -112.5, max: -97.5 },
    { tz: 'America/Chicago', min: -97.5, max: -82.5 },
    { tz: 'America/New_York', min: -82.5, max: -67.5 },
    { tz: 'Europe/London', min: -7.5, max: 7.5 },
    { tz: 'Europe/Paris', min: 7.5, max: 22.5 },
    { tz: 'Europe/Athens', min: 22.5, max: 37.5 },
    { tz: 'Asia/Kolkata', min: 67.5, max: 82.5 },
    { tz: 'Asia/Shanghai', min: 82.5, max: 127.5 },
    { tz: 'Asia/Tokyo', min: 127.5, max: 142.5 },
  ];
  for (const o of offsets) {
    if (lon >= o.min && lon < o.max) return o.tz;
  }
  return 'UTC';
}

/**
 * Health check.
 */
export async function geocoderHealth(): Promise<{ status: 'ok' | 'error'; latencyMs?: number }> {
  const start = Date.now();
  try {
    await nominatimFetch('/status.php?format=json');
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error' };
  }
}
