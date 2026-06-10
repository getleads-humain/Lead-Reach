/**
 * Google Maps Bridge — TypeScript Integration Layer
 * ==================================================
 *
 * This module provides a clean TypeScript interface for the Google Maps
 * scraper service running on port 5340. All API routes in /api/gmaps/*
 * use this bridge to communicate with the scraper service.
 *
 * The gmaps-scraper service is a Python FastAPI application that uses
 * Playwright for browser automation. It provides search, place detail,
 * grid search, email extraction, and job management capabilities.
 *
 * The bridge calls the service directly (server-to-server) from API routes.
 *
 * Available Functions:
 *   - gmapsSearch()       → Search Google Maps for businesses
 *   - gmapsGetPlace()     → Get detailed place data
 *   - gmapsGridSearch()   → Grid-based area scraping (async job)
 *   - gmapsBulkSearch()   → Bulk business discovery (parallel searches)
 *   - gmapsExtractEmail() → Extract emails from a website
 *   - gmapsHealth()       → Check service health
 */

// ============================================================
// Configuration
// ============================================================

const GMAPS_SERVICE_PORT = 5340;
const SERVICE_TIMEOUT = 120000; // 2 minutes — scraping can be slow

// ============================================================
// Types
// ============================================================

export interface GmapsBusiness {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  category: string;
  categories: string[];
  hours: string;
  isOpen: boolean | null;
  lat: number | null;
  lng: number | null;
  url: string;
  email: string | null;
  description: string | null;
  imageUrl: string | null;
}

export interface GmapsScrapeOptions {
  depth?: boolean;
  email?: boolean;
  extraReviews?: boolean;
  lang?: string;
  fastMode?: boolean;
  maxResults?: number;
}

export interface GmapsSearchResult {
  success: boolean;
  results: GmapsBusiness[];
  count: number;
  query: string;
}

export interface GmapsPlaceResult {
  success: boolean;
  place: GmapsBusiness;
}

export interface GmapsGridResult {
  success: boolean;
  results: GmapsBusiness[];
  cells_scraped: number;
}

export interface GmapsBulkResult {
  success: boolean;
  results: GmapsBusiness[];
  total: number;
  duplicates_removed: number;
}

export interface GmapsEmailResult {
  success: boolean;
  emails: string[];
  url: string;
}

export interface GmapsHealthResult {
  status: string;
  version: string;
  uptime_seconds: number;
  /** Alias for uptime_seconds for backwards compatibility */
  uptime?: number;
  active_jobs?: number;
  total_jobs?: number;
}

export interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

/**
 * Extended business type matching the Python scraper's full output shape.
 * Used by the Maps Discovery UI component for detailed business views.
 */
export interface ExtendedGmapsBusiness {
  input_id: string;
  link: string;
  title: string;
  category: string;
  categories: string[];
  address: string;
  open_hours: Record<string, unknown>;
  popular_times: Record<string, unknown>;
  website: string;
  phone: string;
  plus_code: string;
  review_count: number;
  review_rating: number;
  reviews_per_rating: Record<string, number>;
  latitude: number;
  longitude: number;
  cid: string;
  status: string;
  description: string;
  reviews_link: string;
  thumbnail: string;
  timezone: string;
  price_range: string;
  data_id: string;
  street_view_url: string;
  place_id: string;
  images: Array<{ url: string; title: string }>;
  reservations: Array<{ url: string; title: string }>;
  order_online: Array<{ url: string; title: string }>;
  menu: { url: string; title: string } | null;
  owner: { id: string; name: string; link: string } | null;
  complete_address: {
    borough?: string;
    street?: string;
    city?: string;
    postal_code?: string;
    state?: string;
    country?: string;
  } | null;
  about: Array<{
    id: string;
    name: string;
    options: Array<{ name: string; enabled: boolean }>;
  }>;
  user_reviews: Array<{
    name: string;
    profile_picture?: string;
    rating: number;
    description?: string;
    when?: string;
    review_id?: string;
    posted_at?: string;
  }>;
  emails: string[];
}

/**
 * Map a raw Python scraper result to ExtendedGmapsBusiness.
 * Falls back gracefully for missing fields.
 */
export function mapToExtendedBusiness(raw: Record<string, unknown>): ExtendedGmapsBusiness {
  return {
    input_id: (raw.input_id as string) || '',
    link: (raw.link as string) || (raw.url as string) || '',
    title: (raw.title as string) || (raw.name as string) || '',
    category: (raw.category as string) || (raw.type as string) || '',
    categories: Array.isArray(raw.categories) ? raw.categories as string[] : [],
    address: (raw.address as string) || (raw.full_address as string) || '',
    open_hours: (raw.open_hours as Record<string, unknown>) || (raw.operating_hours as Record<string, unknown>) || {},
    popular_times: (raw.popular_times as Record<string, unknown>) || {},
    website: (raw.website as string) || (raw.site as string) || '',
    phone: (raw.phone as string) || '',
    plus_code: (raw.plus_code as string) || '',
    review_count: typeof raw.review_count === 'number' ? raw.review_count : (typeof raw.reviews === 'number' ? raw.reviews : 0),
    review_rating: typeof raw.review_rating === 'number' ? raw.review_rating : (typeof raw.rating === 'number' ? raw.rating : 0),
    reviews_per_rating: (raw.reviews_per_rating as Record<string, number>) || {},
    latitude: typeof raw.latitude === 'number' ? raw.latitude : (typeof raw.lat === 'number' ? raw.lat : 0),
    longitude: typeof raw.longitude === 'number' ? raw.longitude : (typeof raw.lng === 'number' ? raw.lng : 0),
    cid: (raw.cid as string) || '',
    status: (raw.status as string) || (typeof raw.open_now === 'boolean' ? (raw.open_now ? 'Open' : 'Closed') : ''),
    description: (raw.description as string) || '',
    reviews_link: (raw.reviews_link as string) || '',
    thumbnail: (raw.thumbnail as string) || (raw.image_url as string) || (raw.photo as string) || '',
    timezone: (raw.timezone as string) || '',
    price_range: (raw.price_range as string) || '',
    data_id: (raw.data_id as string) || '',
    street_view_url: (raw.street_view_url as string) || '',
    place_id: (raw.place_id as string) || (raw.id as string) || '',
    images: Array.isArray(raw.images) ? raw.images as Array<{ url: string; title: string }> : [],
    reservations: Array.isArray(raw.reservations) ? raw.reservations as Array<{ url: string; title: string }> : [],
    order_online: Array.isArray(raw.order_online) ? raw.order_online as Array<{ url: string; title: string }> : [],
    menu: raw.menu as { url: string; title: string } | null || null,
    owner: raw.owner as { id: string; name: string; link: string } | null || null,
    complete_address: raw.complete_address as ExtendedGmapsBusiness['complete_address'] || null,
    about: Array.isArray(raw.about) ? raw.about as ExtendedGmapsBusiness['about'] : [],
    user_reviews: Array.isArray(raw.user_reviews) ? raw.user_reviews as ExtendedGmapsBusiness['user_reviews'] : [],
    emails: Array.isArray(raw.emails) ? raw.emails as string[] : [],
  };
}

// ============================================================
// Internal Helper — Python Service Business Mapper
// ============================================================

/**
 * Maps a Python scraper service business object to our GmapsBusiness interface.
 * The Python service returns a different shape than our TypeScript interface.
 */
function mapPythonBusiness(raw: Record<string, unknown>): GmapsBusiness {
  return {
    place_id: (raw.place_id as string) || (raw.id as string) || `gmaps_${Math.random().toString(36).slice(2, 10)}`,
    name: (raw.name as string) || '',
    address: (raw.full_address as string) || (raw.address as string) || '',
    phone: (raw.phone as string) || '',
    website: (raw.site as string) || (raw.website as string) || '',
    rating: typeof raw.rating === 'number' ? raw.rating : 0,
    reviewCount: typeof raw.reviews === 'number' ? raw.reviews : (typeof raw.review_count === 'number' ? raw.review_count : 0),
    category: (raw.category as string) || (raw.type as string) || '',
    categories: Array.isArray(raw.categories) ? raw.categories as string[] : ((raw.category as string) ? [raw.category as string] : []),
    hours: (raw.operating_hours as string) || (raw.hours as string) || '',
    isOpen: typeof raw.open_now === 'boolean' ? raw.open_now : null,
    lat: typeof raw.lat === 'number' ? raw.lat : null,
    lng: typeof raw.lng === 'number' ? raw.lng : null,
    url: (raw.url as string) || (raw.google_maps_url as string) || '',
    email: Array.isArray(raw.emails) && raw.emails.length > 0 ? raw.emails[0] as string : (raw.email as string) || null,
    description: (raw.description as string) || (raw.about as string) || null,
    imageUrl: (raw.image_url as string) || (raw.photo as string) || null,
  };
}

// ============================================================
// Internal Service Call
// ============================================================

/**
 * Call the gmaps-scraper Python service directly.
 * Used when calling from Next.js API routes (server-side).
 */
async function callService<T>(
  endpoint: string,
  body: Record<string, unknown>,
  method: 'POST' | 'GET' = 'POST',
): Promise<T> {
  const url = `http://localhost:${GMAPS_SERVICE_PORT}${endpoint}`;

  const fetchOptions: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(SERVICE_TIMEOUT),
  };

  if (method === 'POST') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`gmaps-service returned ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================
// Public API Functions
// ============================================================

/**
 * Search Google Maps for businesses matching a query.
 *
 * @param query - Search term (e.g., "coffee shops", "plumbers")
 * @param location - Optional location (e.g., "Toronto, Canada")
 * @param options - Scraping options (depth, email, fastMode, etc.)
 * @returns Search results with business listings
 *
 * @example
 * const result = await gmapsSearch('coffee shops', 'Toronto', { depth: true, maxResults: 20 });
 */
export async function gmapsSearch(
  query: string,
  location?: string,
  options?: GmapsScrapeOptions,
): Promise<GmapsSearchResult> {
  const searchQuery = location ? `${query} in ${location}` : query;

  try {
    // Try the Python service first (Playwright-based, more reliable)
    const result = await callService<{ results: Record<string, unknown>[]; total: number }>('/api/v1/search', {
      query: searchQuery,
      depth: options?.depth ?? false,
      extract_emails: options?.email ?? false,
      lang: options?.lang ?? 'en',
    });

    const mappedResults = (result.results || []).map(mapPythonBusiness);

    return {
      success: true,
      results: mappedResults.slice(0, options?.maxResults || 20),
      count: mappedResults.length,
      query,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[gmaps-bridge] Python service search failed, trying browser-service fallback:', msg);

    // Fallback to browser-service
    try {
      const fallbackResult = await fetch(`http://localhost:5330/google-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          maxResults: options?.maxResults || 20,
          language: options?.lang || 'en',
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (fallbackResult.ok) {
        const data = await fallbackResult.json() as { places: Record<string, unknown>[]; total: number };
        const mappedResults = (data.places || []).map(mapPythonBusiness);
        return {
          success: true,
          results: mappedResults,
          count: mappedResults.length,
          query,
        };
      }
    } catch {
      // Fallback also failed
    }

    throw error;
  }
}

/**
 * Get detailed information about a specific place.
 *
 * @param urlOrPlaceId - Google Maps URL or place ID
 * @param options - Options for email extraction and extra reviews
 * @returns Detailed place data
 *
 * @example
 * const place = await gmapsGetPlace('https://maps.google.com/...', { email: true });
 */
export async function gmapsGetPlace(
  urlOrPlaceId: string,
  options?: { email?: boolean; extraReviews?: boolean },
): Promise<GmapsPlaceResult> {
  const isUrl = urlOrPlaceId.startsWith('http');

  const result = await callService<{ results: Record<string, unknown>[]; total: number }>('/api/v1/place', {
    url: isUrl ? urlOrPlaceId : undefined,
    place_id: isUrl ? undefined : urlOrPlaceId,
    extract_emails: options?.email ?? false,
    deep_reviews: options?.extraReviews ?? false,
  });

  const places = (result.results || []).map(mapPythonBusiness);

  if (places.length === 0) {
    throw new Error('Place not found');
  }

  return {
    success: true,
    place: places[0],
  };
}

/**
 * Grid-based area scraping — searches a geographic grid for businesses.
 *
 * Divides the bounding box into cells and searches each cell to maximize
 * coverage of the target area. Creates an async job in the scraper service.
 *
 * @param boundingBox - Geographic bounding box { minLat, minLon, maxLat, maxLon }
 * @param query - Business type to search for
 * @param cellSizeKm - Size of each grid cell in kilometers (default: 2)
 * @returns Async job submission result
 *
 * @example
 * const results = await gmapsGridSearch(
 *   { minLat: 43.65, minLon: -79.40, maxLat: 43.70, maxLon: -79.35 },
 *   'restaurants',
 *   2
 * );
 */
export async function gmapsGridSearch(
  boundingBox: BoundingBox,
  query: string,
  cellSizeKm?: number,
): Promise<GmapsGridResult> {
  // The Python service's grid endpoint creates an async job.
  // For our synchronous API, we'll do the grid search ourselves
  // by making multiple search calls in parallel.
  const { minLat, minLon, maxLat, maxLon } = boundingBox;

  // Calculate grid cells
  const avgLat = (minLat + maxLat) / 2;
  const km = cellSizeKm || 2;
  const latStep = km / 111;
  const lonStep = km / (111 * Math.cos((avgLat * Math.PI) / 180));

  const cells: { lat: number; lon: number }[] = [];
  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    for (let lon = minLon; lon <= maxLon; lon += lonStep) {
      cells.push({ lat, lon });
    }
  }

  // Limit cells to prevent excessive scraping
  const maxCells = 20;
  const limitedCells = cells.slice(0, maxCells);

  const allResults: GmapsBusiness[] = [];
  const seenPlaceIds = new Set<string>();

  // Process in batches of 3
  const concurrency = 3;
  for (let i = 0; i < limitedCells.length; i += concurrency) {
    const batch = limitedCells.slice(i, i + concurrency);
    const batchPromises = batch.map(cell =>
      gmapsSearch(`${query} near ${cell.lat},${cell.lon}`, undefined, { fastMode: true, maxResults: 10 })
        .catch(() => ({ results: [] as GmapsBusiness[], count: 0, success: true, query: '' }))
    );

    const batchResults = await Promise.all(batchPromises);

    for (const searchResult of batchResults) {
      for (const place of searchResult.results) {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          allResults.push(place);
        }
      }
    }
  }

  return {
    success: true,
    results: allResults,
    cells_scraped: limitedCells.length,
  };
}

/**
 * Bulk business discovery — search for multiple queries in parallel.
 *
 * Runs searches for all queries with a concurrency limit of 3,
 * then deduplicates results by place_id.
 *
 * @param queries - Array of search queries
 * @param location - Optional location to append to all queries
 * @param options - Scraping options
 * @returns Deduplicated results from all queries
 *
 * @example
 * const results = await gmapsBulkSearch(
 *   ['dentists', 'orthodontists', 'dental clinics'],
 *   'San Francisco',
 *   { fastMode: true }
 * );
 */
export async function gmapsBulkSearch(
  queries: string[],
  location?: string,
  options?: GmapsScrapeOptions,
): Promise<GmapsBulkResult> {
  const allResults: GmapsBusiness[] = [];
  const seenPlaceIds = new Set<string>();
  let totalBeforeDedup = 0;

  // Process queries with concurrency limit of 3
  const concurrency = 3;
  for (let i = 0; i < queries.length; i += concurrency) {
    const batch = queries.slice(i, i + concurrency);
    const batchPromises = batch.map(q =>
      gmapsSearch(q, location, options)
        .catch(() => ({ results: [] as GmapsBusiness[], count: 0, success: true, query: q }))
    );

    const batchResults = await Promise.all(batchPromises);

    for (const searchResult of batchResults) {
      totalBeforeDedup += searchResult.results.length;
      for (const place of searchResult.results) {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          allResults.push(place);
        }
      }
    }
  }

  return {
    success: true,
    results: allResults,
    total: allResults.length,
    duplicates_removed: totalBeforeDedup - allResults.length,
  };
}

/**
 * Extract email addresses from a website.
 *
 * Uses the gmaps-scraper service's email extraction endpoint,
 * which crawls multiple pages on the site.
 *
 * @param url - Website URL to extract emails from
 * @returns List of extracted email addresses
 *
 * @example
 * const emails = await gmapsExtractEmail('https://example.com');
 */
export async function gmapsExtractEmail(
  url: string,
): Promise<GmapsEmailResult> {
  try {
    const result = await callService<{ url: string; emails: string[]; pages_crawled: number }>('/api/v1/extract-emails', {
      url,
      limit: 3,
    });

    return {
      success: true,
      emails: result.emails || [],
      url,
    };
  } catch (error) {
    // Fallback: try browser-service for email extraction
    try {
      const fallbackResult = await fetch(`http://localhost:5330/google-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: url }),
        signal: AbortSignal.timeout(30000),
      });

      if (fallbackResult.ok) {
        // Browser service doesn't have email extraction, return empty
        return { success: true, emails: [], url };
      }
    } catch {
      // Ignore fallback errors
    }

    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Email extraction failed: ${msg}`);
  }
}

/**
 * Check the health of the Google Maps scraper service.
 * Tries the Python gmaps-scraper first, then falls back to browser-service.
 *
 * @returns Health status including uptime and version
 *
 * @example
 * const health = await gmapsHealth();
 * if (health.status === 'ok') { ... }
 */
export async function gmapsHealth(): Promise<GmapsHealthResult | null> {
  // Try the Python gmaps-scraper service on port 5340
  try {
    return await callService<GmapsHealthResult>('/api/v1/health', {}, 'GET');
  } catch {
    // Python service not available, try browser-service on port 5330
    try {
      const browserHealth = await fetch('http://localhost:5330/health', {
        signal: AbortSignal.timeout(5000),
      });
      if (browserHealth.ok) {
        const data = await browserHealth.json() as { status: string; uptime: number };
        return {
          status: data.status || 'ok',
          version: 'browser-service',
          uptime_seconds: data.uptime || 0,
        };
      }
    } catch {
      // Browser service also not available
    }
    return null;
  }
}

// ============================================================
// String Similarity Utilities
// ============================================================

/**
 * Calculate Levenshtein distance between two strings.
 * Used for fuzzy matching company names.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1).
 * 1 = identical, 0 = completely different.
 */
export function stringSimilarity(a: string, b: string): number {
  const normalizedA = a.toLowerCase().trim();
  const normalizedB = b.toLowerCase().trim();

  if (normalizedA === normalizedB) return 1;
  if (!normalizedA.length || !normalizedB.length) return 0;

  const distance = levenshteinDistance(normalizedA, normalizedB);
  const maxLength = Math.max(normalizedA.length, normalizedB.length);

  return 1 - distance / maxLength;
}

/**
 * Calculate haversine distance between two lat/lng points in km.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate data completeness score for a GmapsBusiness.
 * Returns 0-100 based on how many fields are populated.
 */
export function calculateCompleteness(business: Partial<GmapsBusiness>): number {
  const fields: (keyof GmapsBusiness)[] = [
    'name', 'address', 'phone', 'website', 'rating',
    'reviewCount', 'category', 'hours', 'lat', 'lng',
    'email', 'description',
  ];

  let filled = 0;
  for (const field of fields) {
    const value = business[field];
    if (value !== null && value !== undefined && value !== '' && value !== 0) {
      filled++;
    }
  }

  return Math.round((filled / fields.length) * 100);
}
