/**
 * Google Maps Scraper — TypeScript Implementation
 *
 * A comprehensive Google Maps scraper that matches the capabilities of the
 * Go-based google-maps-scraper (https://github.com/gosom/google-maps-scraper).
 *
 * Extracts ALL 34+ data fields from Google Maps listings using Puppeteer
 * with the same techniques as the Go version:
 *
 *   - Extracts `window.APP_INITIALIZATION_STATE[3]` from place pages
 *   - Strips the `)]}'` security prefix before JSON parsing
 *   - Navigates nested arrays at known index positions for field extraction
 *   - Scrolls the `[role='feed']` element with exponential backoff (100ms → 2000ms)
 *   - Handles cookie consent popups automatically (clicks "Reject")
 *   - Blocks images to reduce bandwidth
 *   - Implements random delays between actions
 *   - Deduplicates by place ID
 *
 * Modes:
 *   - Normal mode: Full scraping with APP_INITIALIZATION_STATE extraction
 *   - Fast mode: Uses `tbm=map` search parameter and parses JSON directly
 *   - Grid search: Splits a bounding box into cells and runs one search per cell
 *
 * Usage:
 *   import { searchGoogleMaps, scrapePlacePage, extractEmailsFromWebsite, fastModeSearch } from '@/lib/google-maps-scraper';
 *
 *   const results = await searchGoogleMaps({
 *     query: 'restaurants in New York',
 *     maxResults: 50,
 *     extractEmails: true,
 *   });
 */

import puppeteer, { type Browser, type Page, type HTTPRequest } from 'puppeteer';

// ============================================================
// Types — Exported Interfaces
// ============================================================

export interface GoogleMapsEntry {
  // Identity
  inputId: string;
  link: string;
  title: string;
  category: string;
  categories: string[];
  description: string;
  status: string;

  // Contact
  phone: string;
  website: string;
  emails: string[];

  // Location
  address: string;
  completeAddress: {
    borough: string;
    street: string;
    city: string;
    postalCode: string;
    state: string;
    country: string;
  };
  latitude: number;
  longitude: number;
  plusCode: string;
  timezone: string;

  // Reviews
  reviewCount: number;
  reviewRating: number;
  reviewsPerRating: Record<number, number>;
  reviewsLink: string;
  userReviews: Array<{
    name: string;
    rating: number;
    description: string;
    when: string;
    profilePicture: string;
    reviewId: string;
    replyText?: string;
  }>;

  // Business Details
  openHours: Record<string, string[]>;
  popularTimes: Record<string, Record<number, number>>;
  priceRange: string;
  about: Array<{
    id: string;
    name: string;
    options: Array<{ name: string; enabled: boolean }>;
  }>;

  // Media & Links
  thumbnail: string;
  images: Array<{ title: string; image: string }>;
  reservations: Array<{ link: string; source: string }>;
  orderOnline: Array<{ link: string; source: string }>;
  menu: { link: string; source: string };

  // Internal IDs
  cid: string;
  dataId: string;
  placeId: string;
  streetViewUrl: string;

  // Owner
  owner: {
    id: string;
    name: string;
    link: string;
  };
}

export interface GoogleMapsSearchOptions {
  query: string;
  language?: string;
  maxDepth?: number;
  maxResults?: number;
  geoCoordinates?: string;
  zoomLevel?: number;
  radius?: number;
  extractEmails?: boolean;
  extractReviews?: boolean;
  maxReviews?: number;
  fastMode?: boolean;
  gridSearch?: {
    boundingBox: { minLat: number; minLon: number; maxLat: number; maxLon: number };
    cellSizeKm: number;
  };
  proxyUrl?: string;
  timeout?: number;
}

// ============================================================
// Constants
// ============================================================

const LOG_PREFIX = '[GMapsScraper]';

const GOOGLE_MAPS_BASE = 'https://www.google.com/maps';

const SECURITY_PREFIX = ")]}'";

const DEFAULT_LANGUAGE = 'en';
const DEFAULT_MAX_DEPTH = 10;
const DEFAULT_MAX_RESULTS = 100;
const DEFAULT_ZOOM_LEVEL = 15;
const DEFAULT_RADIUS = 10000;
const DEFAULT_MAX_REVIEWS = 10;
const DEFAULT_TIMEOUT = 60000;

const SCROLL_INITIAL_DELAY = 100;
const SCROLL_MAX_DELAY = 2000;
const SCROLL_BACKOFF_FACTOR = 1.5;

const INTER_REQUEST_MIN_DELAY = 500;
const INTER_REQUEST_MAX_DELAY = 2000;

const PAGE_NAVIGATION_TIMEOUT = 30000;
const EMAIL_EXTRACTION_TIMEOUT = 15000;

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp'];

// ============================================================
// Utility Functions
// ============================================================

/** Create a zero-valued GoogleMapsEntry with all fields initialized */
function createEmptyEntry(inputId: string = ''): GoogleMapsEntry {
  return {
    inputId,
    link: '',
    title: '',
    category: '',
    categories: [],
    description: '',
    status: '',

    phone: '',
    website: '',
    emails: [],

    address: '',
    completeAddress: {
      borough: '',
      street: '',
      city: '',
      postalCode: '',
      state: '',
      country: '',
    },
    latitude: 0,
    longitude: 0,
    plusCode: '',
    timezone: '',

    reviewCount: 0,
    reviewRating: 0,
    reviewsPerRating: {},
    reviewsLink: '',
    userReviews: [],

    openHours: {},
    popularTimes: {},
    priceRange: '',
    about: [],

    thumbnail: '',
    images: [],
    reservations: [],
    orderOnline: [],
    menu: { link: '', source: '' },

    cid: '',
    dataId: '',
    placeId: '',
    streetViewUrl: '',

    owner: {
      id: '',
      name: '',
      link: '',
    },
  };
}

/** Sleep for a random duration between min and max milliseconds */
function randomDelay(min: number = INTER_REQUEST_MIN_DELAY, max: number = INTER_REQUEST_MAX_DELAY): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip the `)]}'` security prefix from Google's JSON-like responses */
function stripSecurityPrefix(raw: string): string {
  if (raw.startsWith(SECURITY_PREFIX)) {
    return raw.slice(SECURITY_PREFIX.length).trim();
  }
  return raw.trim();
}

/** Safely parse JSON, returning null on failure */
function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Safely access a nested property from an object using a path of keys/indices */
function safeGet(obj: unknown, ...path: (string | number)[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current) && typeof key === 'number') {
      current = current[key];
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string | number, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/** Safely get a string value from a nested path */
function safeGetString(obj: unknown, ...path: (string | number)[]): string {
  const val = safeGet(obj, ...path);
  return typeof val === 'string' ? val : '';
}

/** Safely get a number value from a nested path */
function safeGetNumber(obj: unknown, ...path: (string | number)[]): number {
  const val = safeGet(obj, ...path);
  return typeof val === 'number' ? val : 0;
}

/** Safely get an array from a nested path */
function safeGetArray<T>(obj: unknown, ...path: (string | number)[]): T[] {
  const val = safeGet(obj, ...path);
  return Array.isArray(val) ? (val as T[]) : [];
}

/** Generate a hash for deduplication */
function hashPlace(placeId: string, title: string): string {
  let hash = 0;
  const str = `${placeId}::${title}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// ============================================================
// Browser Management
// ============================================================

/** Launch a Puppeteer browser with anti-detection measures */
async function launchBrowser(proxyUrl?: string): Promise<Browser> {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-infobars',
    '--window-size=1920,1080',
    '--disable-extensions',
    '--disable-notifications',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-component-update',
    '--disable-default-apps',
    '--lang=en-US,en',
  ];

  if (proxyUrl) {
    args.push(`--proxy-server=${proxyUrl}`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args,
    ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=IdleDetection'],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });

  console.log(`${LOG_PREFIX} Browser launched`);
  return browser;
}

/** Create a new page with image blocking and anti-detection measures */
async function createStealthPage(browser: Browser, language: string = DEFAULT_LANGUAGE): Promise<Page> {
  const page = await browser.newPage();

  // Block images to reduce bandwidth
  await page.setRequestInterception(true);
  page.on('request', (request: HTTPRequest) => {
    const resourceType = request.resourceType();
    const url = request.url().toLowerCase();

    // Block images (except thumbnails we might need)
    if (resourceType === 'image') {
      // Allow Google Maps static API images for thumbnails
      if (url.includes('maps.googleapis.com/maps/api/staticmap') || url.includes('lh3.googleusercontent.com')) {
        request.continue();
        return;
      }
      request.abort();
      return;
    }

    // Block unnecessary resources
    if (['font', 'media'].includes(resourceType)) {
      request.abort();
      return;
    }

    request.continue();
  });

  // Set user agent to appear as a regular Chrome browser
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  );

  // Set language
  await page.setExtraHTTPHeaders({
    'Accept-Language': `${language}-${language.toUpperCase()},${language};q=0.9,en-US;q=0.8,en;q=0.7`,
  });

  // Override navigator properties for anti-detection
  await page.evaluateOnNewDocument(() => {
    // Override webdriver detection
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Override plugins to appear as a normal browser
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });

    // Override chrome property
    (window as unknown as Record<string, unknown>).chrome = {
      runtime: {},
    };

    // Override permissions
    const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
    Object.defineProperty(window.navigator.permissions, 'query', {
      value: (parameters: PermissionDescriptor) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters),
    });
  });

  await page.setViewport({ width: 1920, height: 1080 });

  return page;
}

// ============================================================
// Cookie Consent Handling
// ============================================================

/** Handle cookie consent popup by clicking "Reject" or similar buttons */
async function handleCookieConsent(page: Page): Promise<void> {
  try {
    // Wait a short time for the consent dialog to appear
    await page.waitForFunction(
      () => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        for (const btn of buttons) {
          const text = btn.textContent?.toLowerCase() || '';
          if (
            text.includes('reject') ||
            text.includes('decline') ||
            text.includes('refuse') ||
            text.includes('deny') ||
            text.includes('alle ablehnen') ||
            text.includes('tout refuser') ||
            text.includes('rechazar')
          ) {
            return btn;
          }
        }
        return null;
      },
      { timeout: 5000 }
    );

    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (
          text.includes('reject') ||
          text.includes('decline') ||
          text.includes('refuse') ||
          text.includes('deny') ||
          text.includes('alle ablehnen') ||
          text.includes('tout refuser') ||
          text.includes('rechazar')
        ) {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      console.log(`${LOG_PREFIX} Cookie consent dialog handled (rejected)`);
      await randomDelay(500, 1000);
    }
  } catch {
    // No consent dialog found, which is fine
  }
}

// ============================================================
// Search Results Scrolling
// ============================================================

/** Scroll the search results feed with exponential backoff */
async function scrollResultsFeed(
  page: Page,
  maxDepth: number = DEFAULT_MAX_DEPTH,
  maxResults?: number
): Promise<void> {
  console.log(`${LOG_PREFIX} Starting scroll (maxDepth=${maxDepth}, maxResults=${maxResults ?? 'unlimited'})`);

  let previousCount = 0;
  let noNewResultsCount = 0;
  let currentDelay = SCROLL_INITIAL_DELAY;

  for (let depth = 0; depth < maxDepth; depth++) {
    // Count current results
    const currentCount = await page.evaluate(() => {
      const feed = document.querySelector("[role='feed']");
      if (!feed) return 0;
      return feed.querySelectorAll('.Nv2PK').length;
    });

    // Check if we've reached max results
    if (maxResults && currentCount >= maxResults) {
      console.log(`${LOG_PREFIX} Reached max results (${currentCount}/${maxResults}), stopping scroll`);
      break;
    }

    // If no new results appeared after several iterations, stop
    if (currentCount === previousCount) {
      noNewResultsCount++;
      if (noNewResultsCount >= 5) {
        console.log(`${LOG_PREFIX} No new results after 5 attempts, stopping scroll (total: ${currentCount})`);
        break;
      }
    } else {
      noNewResultsCount = 0;
    }

    previousCount = currentCount;

    // Scroll the feed element
    await page.evaluate(() => {
      const feed = document.querySelector("[role='feed']");
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
    });

    // Exponential backoff
    await new Promise((resolve) => setTimeout(resolve, currentDelay));
    currentDelay = Math.min(currentDelay * SCROLL_BACKOFF_FACTOR, SCROLL_MAX_DELAY);

    console.log(`${LOG_PREFIX} Scroll depth ${depth + 1}/${maxDepth}: ${currentCount} results found`);
  }
}

/** Collect place URLs from the search results feed */
async function collectPlaceUrls(page: Page, maxResults?: number): Promise<Array<{ url: string; title: string }>> {
  const places = await page.evaluate((max: number | undefined) => {
    const feed = document.querySelector("[role='feed']");
    if (!feed) return [];

    const items = Array.from(feed.querySelectorAll('.Nv2PK'));
    const results: Array<{ url: string; title: string }> = [];

    const limit = max ?? items.length;
    for (let i = 0; i < Math.min(items.length, limit); i++) {
      const item = items[i];
      const anchor = item.querySelector('a[href*="/maps/place/"]');
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        const titleEl = item.querySelector('.fontHeadlineSmall, .qBF1Pd');
        const title = titleEl?.textContent?.trim() || '';
        results.push({ url: href, title });
      }
    }

    return results;
  }, maxResults);

  return places;
}

// ============================================================
// APP_INITIALIZATION_STATE Extraction
// ============================================================

/**
 * Extract the APP_INITIALIZATION_STATE from a Google Maps page.
 * This is the same technique used by the Go scraper — it pulls the deeply
 * nested JavaScript object that Google Maps uses to bootstrap the page.
 */
async function extractAppInitializationState(page: Page): Promise<unknown[] | null> {
  try {
    const state = await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      if (!win.APP_INITIALIZATION_STATE) return null;
      return win.APP_INITIALIZATION_STATE;
    });

    if (!state || !Array.isArray(state)) {
      return null;
    }

    return state;
  } catch (err) {
    console.warn(`${LOG_PREFIX} Failed to extract APP_INITIALIZATION_STATE: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

/**
 * Parse the deeply nested data from APP_INITIALIZATION_STATE[3].
 * The Go scraper uses index positions to navigate this structure.
 * Index [3] contains a JSON string with all the place data.
 */
function parsePlaceDataFromState(state: unknown[], url: string): GoogleMapsEntry {
  const entry = createEmptyEntry();

  try {
    // The 4th element (index 3) contains the main place data as a JSON string
    if (state.length < 4) {
      console.warn(`${LOG_PREFIX} APP_INITIALIZATION_STATE has fewer than 4 elements`);
      return entry;
    }

    const rawData = state[3];
    if (typeof rawData !== 'string') {
      console.warn(`${LOG_PREFIX} APP_INITIALIZATION_STATE[3] is not a string`);
      return entry;
    }

    // Strip the security prefix
    const cleanedJson = stripSecurityPrefix(rawData);
    const parsed = safeJsonParse<unknown[]>(cleanedJson);

    if (!parsed || !Array.isArray(parsed)) {
      console.warn(`${LOG_PREFIX} Failed to parse APP_INITIALIZATION_STATE[3] as JSON array`);
      return entry;
    }

    // Navigate the nested structure to extract data
    // The Go scraper navigates these paths:
    // - parsed[3] contains the bulk of the data (often an array with nested arrays)
    // - parsed[6] often has place metadata
    // - parsed[0] has basic info

    extractBasicInfo(entry, parsed);
    extractContactInfo(entry, parsed);
    extractLocationInfo(entry, parsed);
    extractReviewInfo(entry, parsed);
    extractBusinessDetails(entry, parsed);
    extractMediaInfo(entry, parsed);
    extractInternalIds(entry, parsed, url);
    extractOwnerInfo(entry, parsed);
    extractAboutInfo(entry, parsed);
    extractOrderAndReservations(entry, parsed);

  } catch (err) {
    console.warn(`${LOG_PREFIX} Error parsing place data: ${err instanceof Error ? err.message : err}`);
  }

  return entry;
}

// ============================================================
// Data Field Extraction — Navigating the Nested JSON
// ============================================================

/**
 * Extract basic identity information from the parsed state.
 *
 * In the Go scraper, the title is typically at:
 *   data[3][0][12][0] or data[6][0][1][0][2][0][0]
 *
 * Category is at:
 *   data[3][0][12][1] or data[6][0][1][0][2][0][1]
 */
function extractBasicInfo(entry: GoogleMapsEntry, data: unknown[]): void {
  // Title — try multiple known paths
  entry.title =
    safeGetString(data, 3, 0, 12, 0) ||
    safeGetString(data, 6, 0, 1, 0, 2, 0, 0) ||
    safeGetString(data, 6, 0, 1, 0, 14) ||
    '';

  // Category / primary category
  entry.category =
    safeGetString(data, 3, 0, 12, 1) ||
    safeGetString(data, 6, 0, 1, 0, 2, 0, 1) ||
    safeGetString(data, 6, 0, 1, 0, 13) ||
    '';

  // All categories
  const categoriesArr = safeGetArray<unknown>(data, 3, 0, 12);
  if (Array.isArray(categoriesArr) && categoriesArr.length > 1) {
    entry.categories = categoriesArr
      .slice(1)
      .filter((c): c is string => typeof c === 'string');
  } else {
    const altCategories = safeGetArray<unknown>(data, 6, 0, 1, 0, 2, 0);
    if (Array.isArray(altCategories)) {
      entry.categories = altCategories
        .filter((c): c is string => typeof c === 'string');
    }
  }

  // Description
  entry.description =
    safeGetString(data, 3, 0, 1, 0) ||
    safeGetString(data, 6, 0, 1, 0, 32, 1) ||
    safeGetString(data, 6, 0, 1, 0, 9, 0) ||
    '';

  // Status (OPERATIONAL, CLOSED_TEMPORARILY, etc.)
  const statusVal = safeGet(data, 3, 0, 34, 5, 0) || safeGet(data, 6, 0, 1, 0, 90, 0);
  entry.status = typeof statusVal === 'string' ? statusVal : '';
}

/**
 * Extract contact information (phone, website).
 *
 * Phone is typically at: data[6][0][1][0][7][0][0] or data[3][0][13][0][0]
 * Website is at: data[6][0][1][0][7][1][0] or data[3][0][13][1][0]
 */
function extractContactInfo(entry: GoogleMapsEntry, data: unknown[]): void {
  // Phone — multiple possible paths
  entry.phone =
    safeGetString(data, 6, 0, 1, 0, 7, 0, 0) ||
    safeGetString(data, 3, 0, 13, 0, 0) ||
    safeGetString(data, 6, 0, 1, 0, 178, 0, 0) ||
    '';

  // Website
  entry.website =
    safeGetString(data, 6, 0, 1, 0, 7, 1, 0) ||
    safeGetString(data, 3, 0, 13, 1, 0) ||
    safeGetString(data, 6, 0, 1, 0, 178, 1, 0) ||
    '';
}

/**
 * Extract location information.
 *
 * Address: data[6][0][1][0][2][2][0] or data[3][0][2][0]
 * Latitude/Longitude: data[6][0][1][0][2][3] or data[3][0][2][1]
 * Plus code: data[6][0][1][0][2][4] or data[3][0][2][2]
 * Timezone: data[6][0][1][0][2][5]
 */
function extractLocationInfo(entry: GoogleMapsEntry, data: unknown[]): void {
  // Address
  entry.address =
    safeGetString(data, 6, 0, 1, 0, 2, 2, 0) ||
    safeGetString(data, 3, 0, 2, 0) ||
    '';

  // Complete address components
  const addressParts = safeGetArray<unknown>(data, 6, 0, 1, 0, 2, 2);
  if (addressParts.length > 0) {
    entry.completeAddress.street = safeGetString(addressParts, 0);
    // Try to parse city, state, postal code, country from the address string
    parseCompleteAddress(entry);
  }

  // Also try alternative address structures
  const altAddr = safeGetArray<unknown>(data, 6, 0, 1, 0, 77);
  if (altAddr.length > 0) {
    entry.completeAddress.borough = safeGetString(altAddr, 0);
    entry.completeAddress.street = safeGetString(altAddr, 1) || entry.completeAddress.street;
    entry.completeAddress.city = safeGetString(altAddr, 2) || entry.completeAddress.city;
    entry.completeAddress.postalCode = safeGetString(altAddr, 3) || entry.completeAddress.postalCode;
    entry.completeAddress.state = safeGetString(altAddr, 4) || entry.completeAddress.state;
    entry.completeAddress.country = safeGetString(altAddr, 5) || entry.completeAddress.country;
  }

  // Latitude and Longitude
  const lat = safeGetNumber(data, 6, 0, 1, 0, 2, 3) || safeGetNumber(data, 3, 0, 2, 1);
  const lng = safeGetNumber(data, 6, 0, 1, 0, 2, 4) || safeGetNumber(data, 3, 0, 2, 2);
  entry.latitude = lat;
  entry.longitude = lng;

  // Plus code
  entry.plusCode =
    safeGetString(data, 6, 0, 1, 0, 2, 5) ||
    safeGetString(data, 3, 0, 2, 3) ||
    '';

  // Timezone
  entry.timezone =
    safeGetString(data, 6, 0, 1, 0, 2, 6) ||
    safeGetString(data, 6, 0, 1, 0, 2, 7) ||
    '';
}

/**
 * Parse a full address string into components.
 * Uses regex patterns to extract city, state, postal code, and country.
 */
function parseCompleteAddress(entry: GoogleMapsEntry): void {
  const addr = entry.address;
  if (!addr) return;

  // Try to match postal code (e.g., "10001", "SW1A 1AA")
  const postalMatch = addr.match(/\b(\d{5}(?:-\d{4})?)\b/) ||
                      addr.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/);
  if (postalMatch) {
    entry.completeAddress.postalCode = postalMatch[1];
  }

  // Try to match US state abbreviation
  const stateMatch = addr.match(/\b([A-Z]{2})\s+\d{5}/);
  if (stateMatch) {
    entry.completeAddress.state = stateMatch[1];
  }

  // Try to extract city (typically before the state/zip in US addresses)
  const cityMatch = addr.match(/,\s*([^,]+),\s*[A-Z]{2}\s+\d{5}/);
  if (cityMatch) {
    entry.completeAddress.city = cityMatch[1].trim();
  }

  // Country (last part after the last comma, or common country names)
  const parts = addr.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.length <= 3 || ['USA', 'UK', 'Canada', 'Australia'].some((c) => lastPart.includes(c))) {
      entry.completeAddress.country = lastPart;
    }
  }
}

/**
 * Extract review information.
 *
 * Review count: data[6][0][1][0][8] or data[3][0][4]
 * Review rating: data[6][0][1][0][9] or data[3][0][5]
 * Reviews per rating: data[6][0][1][0][10]
 * Reviews link: data[6][0][1][0][11]
 */
function extractReviewInfo(entry: GoogleMapsEntry, data: unknown[]): void {
  // Review count
  const reviewCount =
    safeGetNumber(data, 6, 0, 1, 0, 8) ||
    safeGetNumber(data, 3, 0, 4) ||
    0;
  entry.reviewCount = reviewCount;

  // Review rating
  const reviewRating =
    safeGetNumber(data, 6, 0, 1, 0, 9) ||
    safeGetNumber(data, 3, 0, 5) ||
    0;
  entry.reviewRating = Math.round(reviewRating * 10) / 10; // Round to 1 decimal

  // Reviews per rating (distribution)
  const reviewsPerRatingArr = safeGetArray<unknown>(data, 6, 0, 1, 0, 10);
  if (reviewsPerRatingArr.length >= 5) {
    entry.reviewsPerRating = {
      1: safeGetNumber(reviewsPerRatingArr, 0),
      2: safeGetNumber(reviewsPerRatingArr, 1),
      3: safeGetNumber(reviewsPerRatingArr, 2),
      4: safeGetNumber(reviewsPerRatingArr, 3),
      5: safeGetNumber(reviewsPerRatingArr, 4),
    };
  }

  // Reviews link
  entry.reviewsLink =
    safeGetString(data, 6, 0, 1, 0, 11) ||
    safeGetString(data, 3, 0, 6) ||
    '';
}

/**
 * Extract business details (hours, popular times, price range).
 *
 * Open hours: data[6][0][1][0][34]
 * Popular times: data[6][0][1][0][84]
 * Price range: data[6][0][1][0][4]
 */
function extractBusinessDetails(entry: GoogleMapsEntry, data: unknown[]): void {
  // Open hours
  const hoursData = safeGetArray<unknown>(data, 6, 0, 1, 0, 34);
  if (hoursData.length > 0) {
    entry.openHours = parseOpenHours(hoursData);
  }

  // Alternative hours location
  const altHoursData = safeGetArray<unknown>(data, 3, 0, 34);
  if (Object.keys(entry.openHours).length === 0 && altHoursData.length > 0) {
    entry.openHours = parseOpenHours(altHoursData);
  }

  // Popular times
  const popularTimesData = safeGetArray<unknown>(data, 6, 0, 1, 0, 84);
  if (popularTimesData.length > 0) {
    entry.popularTimes = parsePopularTimes(popularTimesData);
  }

  // Price range
  const priceRange = safeGet(data, 6, 0, 1, 0, 4);
  entry.priceRange = typeof priceRange === 'string' ? priceRange : '';

  // Alternative price range
  if (!entry.priceRange) {
    const altPrice = safeGetString(data, 3, 0, 4);
    entry.priceRange = altPrice;
  }
}

/**
 * Parse open hours from the nested data structure.
 * Format: [[dayIndex, {timeRanges}], ...]
 */
function parseOpenHours(hoursData: unknown[]): Record<string, string[]> {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const result: Record<string, string[]> = {};

  try {
    for (const dayEntry of hoursData) {
      if (!Array.isArray(dayEntry)) continue;

      const dayIndex = dayEntry[0];
      if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) continue;

      const dayName = DAYS[dayIndex];
      const timeRanges: string[] = [];

      // Time ranges can be at different positions
      const timeData = dayEntry[1];
      if (typeof timeData === 'string') {
        timeRanges.push(timeData);
      } else if (Array.isArray(timeData)) {
        for (const range of timeData) {
          if (typeof range === 'string') {
            timeRanges.push(range);
          } else if (Array.isArray(range)) {
            const start = range[0];
            const end = range[1];
            if (typeof start === 'string' && typeof end === 'string') {
              timeRanges.push(`${start} – ${end}`);
            } else if (typeof start === 'number' && typeof end === 'number') {
              // Convert minutes since midnight to time format
              timeRanges.push(`${minutesToTime(start)} – ${minutesToTime(end)}`);
            }
          }
        }
      }

      // Also check position 3 for the actual hours string
      if (timeRanges.length === 0 && typeof dayEntry[3] === 'string') {
        timeRanges.push(dayEntry[3]);
      }

      if (timeRanges.length > 0) {
        result[dayName] = timeRanges;
      }
    }
  } catch {
    // Silently handle parsing errors
  }

  return result;
}

/** Convert minutes since midnight to a 12-hour time string */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Parse popular times from the nested data structure.
 * Format: [[dayIndex, [[hour, popularity], ...]], ...]
 */
function parsePopularTimes(popularTimesData: unknown[]): Record<string, Record<number, number>> {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const result: Record<string, Record<number, number>> = {};

  try {
    for (const dayEntry of popularTimesData) {
      if (!Array.isArray(dayEntry)) continue;

      const dayIndex = dayEntry[0];
      if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) continue;

      const dayName = DAYS[dayIndex];
      const hourMap: Record<number, number> = {};

      const hourData = dayEntry[1];
      if (Array.isArray(hourData)) {
        for (const hourEntry of hourData) {
          if (Array.isArray(hourEntry) && hourEntry.length >= 2) {
            const hour = typeof hourEntry[0] === 'number' ? hourEntry[0] : 0;
            const popularity = typeof hourEntry[1] === 'number' ? hourEntry[1] : 0;
            hourMap[hour] = popularity;
          }
        }
      }

      if (Object.keys(hourMap).length > 0) {
        result[dayName] = hourMap;
      }
    }
  } catch {
    // Silently handle parsing errors
  }

  return result;
}

/**
 * Extract media information (thumbnail, images).
 */
function extractMediaInfo(entry: GoogleMapsEntry, data: unknown[]): void {
  // Thumbnail
  entry.thumbnail =
    safeGetString(data, 6, 0, 1, 0, 55, 0, 0, 0) ||
    safeGetString(data, 6, 0, 1, 0, 55, 0, 0, 1) ||
    safeGetString(data, 3, 0, 22, 0, 0, 0) ||
    safeGetString(data, 3, 0, 22, 0, 0, 1) ||
    '';

  // Images
  const imagesData = safeGetArray<unknown>(data, 6, 0, 1, 0, 55);
  if (imagesData.length > 0) {
    for (const imgEntry of imagesData) {
      if (!Array.isArray(imgEntry)) continue;
      const title = typeof imgEntry[2] === 'string' ? imgEntry[2] : '';
      const image = safeGetString(imgEntry, 0, 0, 0) || safeGetString(imgEntry, 0, 0, 1) || '';
      if (image) {
        entry.images.push({ title, image });
      }
    }
  }

  // Alternative images location
  if (entry.images.length === 0) {
    const altImagesData = safeGetArray<unknown>(data, 3, 0, 22);
    for (const imgEntry of altImagesData) {
      if (!Array.isArray(imgEntry)) continue;
      const title = typeof imgEntry[2] === 'string' ? imgEntry[2] : '';
      const image = safeGetString(imgEntry, 0, 0, 0) || safeGetString(imgEntry, 0, 0, 1) || '';
      if (image) {
        entry.images.push({ title, image });
      }
    }
  }

  // Menu
  const menuData = safeGetArray<unknown>(data, 6, 0, 1, 0, 38);
  if (menuData.length > 0) {
    const menuLink = safeGetString(menuData, 0, 0);
    const menuSource = safeGetString(menuData, 0, 1);
    if (menuLink) {
      entry.menu = { link: menuLink, source: menuSource || 'google' };
    }
  }
}

/**
 * Extract internal IDs (cid, dataId, placeId).
 */
function extractInternalIds(entry: GoogleMapsEntry, data: unknown[], url: string): void {
  // CID (customer ID)
  const cid =
    safeGetString(data, 6, 0, 1, 0, 16) ||
    safeGetString(data, 3, 0, 16) ||
    '';
  entry.cid = cid;

  // Extract CID from URL if not found in data
  if (!entry.cid) {
    const cidMatch = url.match(/[?&]cid=(\d+)/);
    if (cidMatch) {
      entry.cid = cidMatch[1];
    }
  }

  // Data ID
  entry.dataId =
    safeGetString(data, 6, 0, 1, 0, 10) ||
    safeGetString(data, 3, 0, 10) ||
    '';

  // Place ID
  entry.placeId =
    safeGetString(data, 6, 0, 1, 0, 15) ||
    safeGetString(data, 3, 0, 15) ||
    '';

  // Extract placeId from URL if not found in data
  if (!entry.placeId) {
    const placeIdMatch = url.match(/[?&]place_id=([^&]+)/);
    if (placeIdMatch) {
      entry.placeId = placeIdMatch[1];
    }
  }

  // Street View URL
  entry.streetViewUrl =
    safeGetString(data, 6, 0, 1, 0, 66, 0) ||
    safeGetString(data, 3, 0, 66, 0) ||
    '';

  // Set the link
  entry.link = url;
}

/**
 * Extract owner information.
 */
function extractOwnerInfo(entry: GoogleMapsEntry, data: unknown[]): void {
  const ownerData = safeGetArray<unknown>(data, 6, 0, 1, 0, 57);
  if (ownerData.length > 0) {
    entry.owner = {
      id: safeGetString(ownerData, 0),
      name: safeGetString(ownerData, 1),
      link: safeGetString(ownerData, 2),
    };
  }

  // Alternative owner location
  if (!entry.owner.name) {
    const altOwnerData = safeGetArray<unknown>(data, 3, 0, 57);
    if (altOwnerData.length > 0) {
      entry.owner = {
        id: safeGetString(altOwnerData, 0),
        name: safeGetString(altOwnerData, 1),
        link: safeGetString(altOwnerData, 2),
      };
    }
  }
}

/**
 * Extract "About" information (amenities, service options, etc.)
 */
function extractAboutInfo(entry: GoogleMapsEntry, data: unknown[]): void {
  const aboutData = safeGetArray<unknown>(data, 6, 0, 1, 0, 100);
  if (aboutData.length > 0) {
    for (const aboutEntry of aboutData) {
      if (!Array.isArray(aboutEntry)) continue;
      const id = safeGetString(aboutEntry, 0);
      const name = safeGetString(aboutEntry, 1);
      const options: Array<{ name: string; enabled: boolean }> = [];

      const optionsData = safeGetArray<unknown>(aboutEntry, 2);
      for (const opt of optionsData) {
        if (Array.isArray(opt) && opt.length >= 2) {
          options.push({
            name: typeof opt[0] === 'string' ? opt[0] : '',
            enabled: opt[1] === true || opt[1] === 1,
          });
        }
      }

      if (id || name) {
        entry.about.push({ id, name, options });
      }
    }
  }

  // Alternative about location
  if (entry.about.length === 0) {
    const altAboutData = safeGetArray<unknown>(data, 3, 0, 100);
    for (const aboutEntry of altAboutData) {
      if (!Array.isArray(aboutEntry)) continue;
      const id = safeGetString(aboutEntry, 0);
      const name = safeGetString(aboutEntry, 1);
      const options: Array<{ name: string; enabled: boolean }> = [];

      const optionsData = safeGetArray<unknown>(aboutEntry, 2);
      for (const opt of optionsData) {
        if (Array.isArray(opt) && opt.length >= 2) {
          options.push({
            name: typeof opt[0] === 'string' ? opt[0] : '',
            enabled: opt[1] === true || opt[1] === 1,
          });
        }
      }

      if (id || name) {
        entry.about.push({ id, name, options });
      }
    }
  }
}

/**
 * Extract order online and reservations links.
 */
function extractOrderAndReservations(entry: GoogleMapsEntry, data: unknown[]): void {
  // Reservations
  const reservationsData = safeGetArray<unknown>(data, 6, 0, 1, 0, 39);
  if (reservationsData.length > 0) {
    for (const resEntry of reservationsData) {
      if (!Array.isArray(resEntry)) continue;
      const link = safeGetString(resEntry, 0);
      const source = safeGetString(resEntry, 1);
      if (link) {
        entry.reservations.push({ link, source });
      }
    }
  }

  // Order online
  const orderData = safeGetArray<unknown>(data, 6, 0, 1, 0, 40);
  if (orderData.length > 0) {
    for (const ordEntry of orderData) {
      if (!Array.isArray(ordEntry)) continue;
      const link = safeGetString(ordEntry, 0);
      const source = safeGetString(ordEntry, 1);
      if (link) {
        entry.orderOnline.push({ link, source });
      }
    }
  }
}

// ============================================================
// Review Extraction via RPC Endpoint
// ============================================================

/**
 * Extract reviews from a place using Google Maps' RPC endpoint.
 * The Go scraper uses `/maps/rpc/listugcposts` with browser cookies.
 */
async function extractReviewsViaRPC(
  page: Page,
  placeId: string,
  maxReviews: number = DEFAULT_MAX_REVIEWS
): Promise<GoogleMapsEntry['userReviews']> {
  const reviews: GoogleMapsEntry['userReviews'] = [];

  try {
    // Get the authentication tokens from the page
    const tokens = await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const state = win.APP_INITIALIZATION_STATE;
      if (!state || !Array.isArray(state)) return null;

      // Extract the RPC token
      try {
        // The token is usually in the page's configuration
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const text = script.textContent || '';
          const tokenMatch = text.match(/"token":"([^"]+)"/);
          if (tokenMatch) {
            return { token: tokenMatch[1] };
          }
        }
      } catch {
        // Ignore
      }
      return null;
    });

    // Alternative: scrape reviews directly from the page
    const pageReviews = await page.evaluate((max) => {
      const results: Array<{
        name: string;
        rating: number;
        description: string;
        when: string;
        profilePicture: string;
        reviewId: string;
      }> = [];

      // Try to find review elements on the page
      const reviewElements = Array.from(document.querySelectorAll('.jftiEf'));
      for (let i = 0; i < Math.min(reviewElements.length, max); i++) {
        const el = reviewElements[i] as HTMLElement;

        const nameEl = el.querySelector('.d4r55') as HTMLElement | null;
        const name = nameEl?.textContent?.trim() || '';

        const ratingEl = el.querySelector('.kvMYJc') as HTMLElement | null;
        const ariaLabel = ratingEl?.getAttribute('aria-label') || '';
        const ratingMatch = ariaLabel.match(/(\d)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;

        const descEl = el.querySelector('.wiI7pd') as HTMLElement | null;
        const description = descEl?.textContent?.trim() || '';

        const whenEl = el.querySelector('.rsqaWe') as HTMLElement | null;
        const when = whenEl?.textContent?.trim() || '';

        const picEl = el.querySelector('.NBa7we img') as HTMLImageElement | null;
        const profilePicture = picEl?.src || '';

        const reviewId = el.getAttribute('data-review-id') || (el as HTMLElement).dataset.reviewId || '';

        results.push({ name, rating, description, when, profilePicture, reviewId });
      }

      return results;
    }, maxReviews);

    if (pageReviews.length > 0) {
      reviews.push(...pageReviews);
    }

    // If we didn't get enough reviews from the page, try the RPC approach
    if (reviews.length < maxReviews && tokens?.token) {
      // Click the "Reviews" tab to load more reviews
      try {
        await page.evaluate(() => {
          const reviewsTab = document.querySelector('button[role="tab"]') as HTMLElement | null;
          if (reviewsTab && reviewsTab.textContent?.includes('Reviews')) {
            reviewsTab.click();
          }
        });
        await randomDelay(1000, 2000);

        // Scroll the reviews panel
        for (let i = 0; i < 5 && reviews.length < maxReviews; i++) {
          await page.evaluate(() => {
            const scrollable = document.querySelector('.m6QErb.DkEzL');
            if (scrollable) {
              scrollable.scrollTop = scrollable.scrollHeight;
            }
          });
          await randomDelay(500, 1000);

          const moreReviews = await page.evaluate((currentCount, max) => {
            const results: Array<{
              name: string;
              rating: number;
              description: string;
              when: string;
              profilePicture: string;
              reviewId: string;
            }> = [];

            const reviewElements = Array.from(document.querySelectorAll('.jftiEf'));
            for (let i = currentCount; i < Math.min(reviewElements.length, max); i++) {
              const el = reviewElements[i] as HTMLElement;

              const nameEl = el.querySelector('.d4r55') as HTMLElement | null;
              const name = nameEl?.textContent?.trim() || '';

              const ratingEl = el.querySelector('.kvMYJc') as HTMLElement | null;
              const ariaLabel = ratingEl?.getAttribute('aria-label') || '';
              const ratingMatch = ariaLabel.match(/(\d)/);
              const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;

              const descEl = el.querySelector('.wiI7pd') as HTMLElement | null;
              const description = descEl?.textContent?.trim() || '';

              const whenEl = el.querySelector('.rsqaWe') as HTMLElement | null;
              const when = whenEl?.textContent?.trim() || '';

              const picEl = el.querySelector('.NBa7we img') as HTMLImageElement | null;
              const profilePicture = picEl?.src || '';

              const reviewId = el.getAttribute('data-review-id') || (el as HTMLElement).dataset.reviewId || '';

              results.push({ name, rating, description, when, profilePicture, reviewId });
            }

            return results;
          }, reviews.length, maxReviews);

          reviews.push(...moreReviews);

          if (moreReviews.length === 0) break;
        }
      } catch (err) {
        console.warn(`${LOG_PREFIX} Error loading additional reviews: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Try to get reply text for each review
    for (const review of reviews) {
      try {
        const replyText = await page.evaluate((reviewId) => {
          const reviewEl = document.querySelector(`[data-review-id="${reviewId}"]`) as HTMLElement | null;
          if (!reviewEl) return null;
          const replyEl = reviewEl.querySelector('.CDe7pd .wiI7pd') as HTMLElement | null;
          return replyEl?.textContent?.trim() || null;
        }, review.reviewId);
        if (replyText) {
          (review as { replyText?: string }).replyText = replyText;
        }
      } catch {
        // Ignore
      }
    }
  } catch (err) {
    console.warn(`${LOG_PREFIX} Error extracting reviews: ${err instanceof Error ? err.message : err}`);
  }

  return reviews;
}

// ============================================================
// Email Extraction from Website
// ============================================================

/**
 * Extract email addresses from a business website.
 * Visits the website URL and searches for mailto: links and email patterns.
 *
 * @param page - A Puppeteer page instance (reused for efficiency)
 * @param url - The website URL to extract emails from
 * @returns Array of unique email addresses found
 */
export async function extractEmailsFromWebsite(page: Page, url: string): Promise<string[]> {
  if (!url) return [];

  const emails = new Set<string>();
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

  try {
    // Normalize URL
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Navigate to the website
    await page.goto(normalizedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: EMAIL_EXTRACTION_TIMEOUT,
    });

    await randomDelay(500, 1000);

    // Extract emails from mailto: links
    const mailtoEmails = await page.evaluate(() => {
      const results: string[] = [];
      const links = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const email = href.replace('mailto:', '').split('?')[0].trim();
        if (email) results.push(email);
      }
      return results;
    });

    for (const email of mailtoEmails) {
      if (isValidEmail(email)) {
        emails.add(email.toLowerCase());
      }
    }

    // Extract emails from page content using regex
    const contentEmails = await page.evaluate(() => {
      const results: string[] = [];
      const text = document.body?.innerText || '';
      const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
      let match;
      while ((match = emailRegex.exec(text)) !== null) {
        results.push(match[0]);
      }

      // Also check href attributes
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        const hrefMatches = Array.from(href.matchAll(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g));
        for (const m of hrefMatches) {
          results.push(m[0]);
        }
      }

      return results;
    });

    for (const email of contentEmails) {
      if (isValidEmail(email)) {
        emails.add(email.toLowerCase());
      }
    }

    // Try to find contact page and extract emails from there
    const contactLinks = await page.evaluate(() => {
      const links: string[] = [];
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      for (const a of anchors) {
        const href = a.getAttribute('href') || '';
        const text = (a.textContent || '').toLowerCase();
        if (
          text.includes('contact') ||
          href.includes('contact') ||
          text.includes('about') ||
          href.includes('about') ||
          text.includes('impressum') ||
          href.includes('impressum')
        ) {
          links.push(href);
        }
      }
      return links.slice(0, 3); // Limit to 3 contact pages
    });

    for (const contactLink of contactLinks) {
      try {
        let fullUrl = contactLink;
        if (contactLink.startsWith('/')) {
          const baseUrl = new URL(normalizedUrl);
          fullUrl = `${baseUrl.origin}${contactLink}`;
        } else if (!contactLink.startsWith('http')) {
          continue;
        }

        await page.goto(fullUrl, {
          waitUntil: 'domcontentloaded',
          timeout: EMAIL_EXTRACTION_TIMEOUT,
        });

        await randomDelay(300, 600);

        const contactEmails = await page.evaluate(() => {
          const results: string[] = [];
          // mailto links
          const links = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
          for (const link of links) {
            const href = link.getAttribute('href') || '';
            const email = href.replace('mailto:', '').split('?')[0].trim();
            if (email) results.push(email);
          }
          // Text content
          const text = document.body?.innerText || '';
          const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
          let match;
          while ((match = emailRegex.exec(text)) !== null) {
            results.push(match[0]);
          }
          return results;
        });

        for (const email of contactEmails) {
          if (isValidEmail(email)) {
            emails.add(email.toLowerCase());
          }
        }
      } catch {
        // Ignore errors on contact pages
      }
    }
  } catch (err) {
    console.warn(`${LOG_PREFIX} Error extracting emails from ${url}: ${err instanceof Error ? err.message : err}`);
  }

  return Array.from(emails);
}

/** Validate an email address format */
function isValidEmail(email: string): boolean {
  // Basic format check
  if (!email || email.length < 5 || email.length > 254) return false;

  // Must have exactly one @
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) return false;

  const [local, domain] = email.split('@');

  // Local part checks
  if (!local || local.length > 64) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;

  // Domain part checks
  if (!domain || domain.length > 255) return false;
  if (!domain.includes('.')) return false;

  // Filter out common non-email patterns
  const ignoredDomains = ['example.com', 'test.com', 'domain.com', 'email.com', 'sentry.io'];
  if (ignoredDomains.some((d) => domain.endsWith(d))) return false;

  // Filter out image-like patterns
  if (IMAGE_EXTENSIONS.some((ext) => email.toLowerCase().endsWith(ext))) return false;

  return true;
}

// ============================================================
// Place Page Scraping
// ============================================================

/**
 * Scrape a single Google Maps place page.
 *
 * This is the core scraping function. It navigates to a place page,
 * extracts the APP_INITIALIZATION_STATE JavaScript object, and parses
 * the deeply nested data to extract all business fields.
 *
 * @param page - A Puppeteer page instance
 * @param url - The Google Maps place URL to scrape
 * @returns A GoogleMapsEntry with all extracted data, or null on failure
 */
export async function scrapePlacePage(
  page: Page,
  url: string,
  options?: { extractReviews?: boolean; maxReviews?: number }
): Promise<GoogleMapsEntry | null> {
  const extractReviews = options?.extractReviews ?? false;
  const maxReviews = options?.maxReviews ?? DEFAULT_MAX_REVIEWS;

  try {
    console.log(`${LOG_PREFIX} Scraping place page: ${url.slice(0, 80)}...`);

    // Navigate to the place page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: PAGE_NAVIGATION_TIMEOUT,
    });

    // Handle cookie consent popup
    await handleCookieConsent(page);

    // Wait for the page to fully load
    await randomDelay(1000, 2000);

    // Extract the APP_INITIALIZATION_STATE
    const state = await extractAppInitializationState(page);

    if (!state) {
      console.warn(`${LOG_PREFIX} Could not extract APP_INITIALIZATION_STATE from ${url.slice(0, 80)}`);

      // Fallback: try to extract basic data from the page DOM
      return extractFromDOM(page, url);
    }

    // Parse the data from the state
    const entry = parsePlaceDataFromState(state, url);

    // Extract reviews if requested
    if (extractReviews && entry.placeId) {
      try {
        entry.userReviews = await extractReviewsViaRPC(page, entry.placeId, maxReviews);
      } catch (err) {
        console.warn(`${LOG_PREFIX} Failed to extract reviews: ${err instanceof Error ? err.message : err}`);
      }
    }

    // If we didn't get the title from state, try DOM
    if (!entry.title) {
      const titleFromDom = await page.evaluate(() => {
        const titleEl = document.querySelector('h1.DUwDvf, h1.fontHeadlineLarge');
        return titleEl?.textContent?.trim() || '';
      });
      entry.title = titleFromDom;
    }

    console.log(`${LOG_PREFIX} Successfully scraped: ${entry.title || 'Unknown'}`);
    return entry;
  } catch (err) {
    console.warn(`${LOG_PREFIX} Error scraping place page ${url.slice(0, 80)}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

/**
 * Fallback: Extract basic place data from the DOM when APP_INITIALIZATION_STATE is unavailable.
 */
async function extractFromDOM(page: Page, url: string): Promise<GoogleMapsEntry | null> {
  try {
    const entry = createEmptyEntry();
    entry.link = url;

    // Extract basic info from DOM
    const domData = await page.evaluate(() => {
      const title = (document.querySelector('h1.DUwDvf, h1.fontHeadlineLarge') as HTMLElement)?.textContent?.trim() || '';
      const category = (document.querySelector('.DkEaL, button[jsaction*="category"]') as HTMLElement)?.textContent?.trim() || '';
      const rating = (document.querySelector('.MW4etd') as HTMLElement)?.textContent?.trim() || '';
      const reviewCount = (document.querySelector('.UY7F9') as HTMLElement)?.textContent?.trim() || '';
      const address = (document.querySelector('[data-item-id*="address"] .Io6YTe, button[data-item-id*="address"] .Io6YTe') as HTMLElement)?.textContent?.trim() || '';
      const phone = (document.querySelector('[data-item-id*="phone"] .Io6YTe, button[data-item-id*="phone"] .Io6YTe') as HTMLElement)?.textContent?.trim() || '';
      const website = (document.querySelector('[data-item-id*="authority"] .Io6YTe, a[data-item-id*="authority"]') as HTMLElement)?.textContent?.trim() || '';

      return { title, category, rating, reviewCount, address, phone, website };
    });

    entry.title = domData.title;
    entry.category = domData.category;
    entry.address = domData.address;
    entry.phone = domData.phone;
    entry.website = domData.website;

    // Parse rating
    const ratingMatch = domData.rating.match(/(\d+\.?\d*)/);
    if (ratingMatch) {
      entry.reviewRating = parseFloat(ratingMatch[1]);
    }

    // Parse review count
    const reviewCountMatch = domData.reviewCount.match(/(\d[\d,]*)/);
    if (reviewCountMatch) {
      entry.reviewCount = parseInt(reviewCountMatch[1].replace(/,/g, ''), 10);
    }

    // Extract website URL properly
    if (domData.website) {
      const websiteHref = await page.evaluate(() => {
        const link = document.querySelector('a[data-item-id*="authority"]') as HTMLAnchorElement | null;
        return link?.href || '';
      });
      if (websiteHref) {
        entry.website = websiteHref;
      }
    }

    // Extract internal IDs from URL
    const cidMatch = url.match(/[?&]cid=(\d+)/);
    if (cidMatch) entry.cid = cidMatch[1];

    const placeIdMatch = url.match(/[?&]place_id=([^&]+)/);
    if (placeIdMatch) entry.placeId = placeIdMatch[1];

    // Extract data ID from URL
    const dataMatch = url.match(/data=([^&]*)/);
    if (dataMatch) entry.dataId = dataMatch[1];

    if (!entry.title) {
      return null;
    }

    console.log(`${LOG_PREFIX} Extracted from DOM (fallback): ${entry.title}`);
    return entry;
  } catch (err) {
    console.warn(`${LOG_PREFIX} DOM extraction failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

// ============================================================
// Fast Mode Search
// ============================================================

/**
 * Fast mode search using the `tbm=map` search parameter.
 * This returns a JSON response directly from Google, avoiding the need
 * for full page rendering and APP_INITIALIZATION_STATE extraction.
 *
 * The Go scraper's fast mode parses the protobuf-like JSON from the
 * search results page directly.
 *
 * @param page - A Puppeteer page instance
 * @param options - Search options
 * @returns Array of Google Maps entries with basic data
 */
export async function fastModeSearch(
  page: Page,
  options: GoogleMapsSearchOptions
): Promise<GoogleMapsEntry[]> {
  const results: GoogleMapsEntry[] = [];
  const seenHashes = new Set<string>();

  try {
    const language = options.language || DEFAULT_LANGUAGE;
    const maxResults = options.maxResults || DEFAULT_MAX_RESULTS;

    // Build the search URL
    const searchUrl = buildSearchUrl(options, true);
    console.log(`${LOG_PREFIX} Fast mode search: ${searchUrl.slice(0, 100)}...`);

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: PAGE_NAVIGATION_TIMEOUT,
    });

    await handleCookieConsent(page);
    await randomDelay(1000, 2000);

    // In fast mode, we extract data from the search results page
    // The data is embedded in the page's JavaScript
    const entries = await page.evaluate(() => {
      const items: Array<{
        title: string;
        category: string;
        address: string;
        rating: number;
        reviewCount: number;
        phone: string;
        website: string;
        latitude: number;
        longitude: number;
        placeId: string;
        url: string;
        thumbnail: string;
        status: string;
      }> = [];

      // Try to parse the embedded data from the page
      try {
        const win = window as unknown as Record<string, unknown>;

        // Try APP_INITIALIZATION_STATE first
        if (win.APP_INITIALIZATION_STATE && Array.isArray(win.APP_INITIALIZATION_STATE)) {
          const state = win.APP_INITIALIZATION_STATE;

          // In fast mode, the data structure is slightly different
          for (let i = 0; i < state.length; i++) {
            const elem = state[i];
            if (typeof elem !== 'string') continue;

            let cleaned = elem;
            if (cleaned.startsWith(")]}'")) {
              cleaned = cleaned.slice(4).trim();
            }

            try {
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed)) {
                // Look for place data arrays
                for (const item of parsed) {
                  if (!Array.isArray(item)) continue;

                  // Try to extract place entries from the nested structure
                  extractPlacesFromArray(item, items);
                }
              }
            } catch {
              // Not valid JSON, skip
            }
          }
        }

        // Also try to extract from the DOM as a fallback
        const feedEl = document.querySelector("[role='feed']");
        if (feedEl) {
          const feedItems = Array.from(feedEl.querySelectorAll('.Nv2PK'));
          for (const fi of feedItems) {
            const anchor = fi.querySelector('a[href*="/maps/place/"]');
            const titleEl = fi.querySelector('.fontHeadlineSmall, .qBF1Pd');
            const ratingEl = fi.querySelector('.MW4etd');
            const reviewEl = fi.querySelector('.UY7F9');
            const categoryEl = fi.querySelector('.fontBodyMedium [style*="color"]');
            const addrEl = fi.querySelector('[data-item-id*="address"] .Io6YTe, .fontBodyMedium:last-child');

            const url = anchor?.getAttribute('href') || '';
            const title = titleEl?.textContent?.trim() || '';
            const rating = parseFloat(ratingEl?.textContent?.trim() || '0') || 0;
            const reviewCount = parseInt(reviewEl?.textContent?.replace(/[^\d]/g, '') || '0') || 0;
            const category = categoryEl?.textContent?.trim() || '';
            const address = addrEl?.textContent?.trim() || '';

            if (title && url) {
              items.push({
                title,
                category,
                address,
                rating,
                reviewCount,
                phone: '',
                website: '',
                latitude: 0,
                longitude: 0,
                placeId: '',
                url,
                thumbnail: '',
                status: '',
              });
            }
          }
        }
      } catch {
        // Ignore
      }

      return items;

      // Helper function to recursively extract places from nested arrays
      function extractPlacesFromArray(
        arr: unknown[],
        items: Array<{
          title: string;
          category: string;
          address: string;
          rating: number;
          reviewCount: number;
          phone: string;
          website: string;
          latitude: number;
          longitude: number;
          placeId: string;
          url: string;
          thumbnail: string;
          status: string;
        }>
      ): void {
        for (const item of arr) {
          if (!Array.isArray(item)) continue;

          // Check if this looks like a place entry (has title at known positions)
          const possibleTitle = item[0] || item[1] || item[11];
          if (typeof possibleTitle === 'string' && possibleTitle.length > 0 && possibleTitle.length < 200) {
            // This might be a place entry - try to extract data
            const title = typeof item[11] === 'string' ? item[11] : typeof item[0] === 'string' ? item[0] : '';
            if (title) {
              items.push({
                title,
                category: typeof item[13] === 'string' ? item[13] : '',
                address: typeof item[2] === 'string' ? item[2] : '',
                rating: typeof item[4] === 'number' ? item[4] : 0,
                reviewCount: typeof item[5] === 'number' ? item[5] : 0,
                phone: '',
                website: '',
                latitude: 0,
                longitude: 0,
                placeId: '',
                url: '',
                thumbnail: '',
                status: '',
              });
            }
          }

          // Recurse into nested arrays
          for (const sub of item) {
            if (Array.isArray(sub) && sub.length > 3) {
              extractPlacesFromArray(sub, items);
            }
          }
        }
      }
    });

    // Convert raw entries to GoogleMapsEntry objects
    for (const raw of entries) {
      const placeHash = hashPlace(raw.placeId || raw.url, raw.title);
      if (seenHashes.has(placeHash)) continue;
      seenHashes.add(placeHash);

      const entry = createEmptyEntry(placeHash);
      entry.title = raw.title;
      entry.category = raw.category;
      entry.address = raw.address;
      entry.reviewRating = raw.rating;
      entry.reviewCount = raw.reviewCount;
      entry.phone = raw.phone;
      entry.website = raw.website;
      entry.latitude = raw.latitude;
      entry.longitude = raw.longitude;
      entry.placeId = raw.placeId;
      entry.link = raw.url;
      entry.thumbnail = raw.thumbnail;
      entry.status = raw.status;

      results.push(entry);

      if (results.length >= maxResults) break;
    }

    console.log(`${LOG_PREFIX} Fast mode found ${results.length} results`);
  } catch (err) {
    console.warn(`${LOG_PREFIX} Fast mode search failed: ${err instanceof Error ? err.message : err}`);
  }

  return results;
}

// ============================================================
// Grid Search
// ============================================================

/**
 * Perform a grid search by splitting a bounding box into cells
 * and running one search per cell. This is useful for finding all
 * businesses in a large area where a single search might miss some.
 *
 * Like the Go scraper's -grid-bbox and -grid-cell flags.
 */
async function performGridSearch(
  page: Page,
  options: GoogleMapsSearchOptions
): Promise<GoogleMapsEntry[]> {
  if (!options.gridSearch) return [];

  const { boundingBox, cellSizeKm } = options.gridSearch;
  const cells = calculateGridCells(boundingBox, cellSizeKm);

  console.log(`${LOG_PREFIX} Grid search: ${cells.length} cells in bounding box`);

  const allResults: GoogleMapsEntry[] = [];
  const seenHashes = new Set<string>();

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const cellCenter = `${cell.centerLat},${cell.centerLon}`;

    console.log(`${LOG_PREFIX} Grid cell ${i + 1}/${cells.length}: center=${cellCenter}`);

    const cellOptions: GoogleMapsSearchOptions = {
      ...options,
      geoCoordinates: cellCenter,
      gridSearch: undefined, // Prevent infinite recursion
      maxResults: options.maxResults ? Math.ceil(options.maxResults / cells.length) : DEFAULT_MAX_RESULTS,
    };

    try {
      const cellResults = options.fastMode
        ? await fastModeSearch(page, cellOptions)
        : await performNormalSearch(page, cellOptions);

      // Deduplicate
      for (const result of cellResults) {
        const placeHash = hashPlace(result.placeId || result.link, result.title);
        if (!seenHashes.has(placeHash)) {
          seenHashes.add(placeHash);
          allResults.push(result);
        }
      }

      // Random delay between cells
      await randomDelay(1000, 3000);
    } catch (err) {
      console.warn(`${LOG_PREFIX} Grid cell ${i + 1} failed: ${err instanceof Error ? err.message : err}`);
    }

    // Check if we've reached max results
    if (options.maxResults && allResults.length >= options.maxResults) {
      break;
    }
  }

  return allResults;
}

/** Calculate grid cells from a bounding box */
function calculateGridCells(
  bbox: { minLat: number; minLon: number; maxLat: number; maxLon: number },
  cellSizeKm: number
): Array<{ minLat: number; minLon: number; maxLat: number; maxLon: number; centerLat: number; centerLon: number }> {
  const cells: Array<{ minLat: number; minLon: number; maxLat: number; maxLon: number; centerLat: number; centerLon: number }> = [];

  // Approximate degree-to-km conversion
  const kmPerDegreeLat = 111.32; // km per degree of latitude
  const kmPerDegreeLon = 111.32 * Math.cos(((bbox.minLat + bbox.maxLat) / 2) * (Math.PI / 180));

  const cellSizeDegLat = cellSizeKm / kmPerDegreeLat;
  const cellSizeDegLon = cellSizeKm / kmPerDegreeLon;

  const latSteps = Math.ceil((bbox.maxLat - bbox.minLat) / cellSizeDegLat);
  const lonSteps = Math.ceil((bbox.maxLon - bbox.minLon) / cellSizeDegLon);

  for (let latStep = 0; latStep < latSteps; latStep++) {
    for (let lonStep = 0; lonStep < lonSteps; lonStep++) {
      const minLat = bbox.minLat + latStep * cellSizeDegLat;
      const minLon = bbox.minLon + lonStep * cellSizeDegLon;
      const maxLat = Math.min(minLat + cellSizeDegLat, bbox.maxLat);
      const maxLon = Math.min(minLon + cellSizeDegLon, bbox.maxLon);

      cells.push({
        minLat,
        minLon,
        maxLat,
        maxLon,
        centerLat: (minLat + maxLat) / 2,
        centerLon: (minLon + maxLon) / 2,
      });
    }
  }

  return cells;
}

// ============================================================
// Search URL Building
// ============================================================

/** Build a Google Maps search URL from the given options */
function buildSearchUrl(options: GoogleMapsSearchOptions, fastMode: boolean = false): string {
  const language = options.language || DEFAULT_LANGUAGE;
  const zoomLevel = options.zoomLevel || DEFAULT_ZOOM_LEVEL;
  const query = encodeURIComponent(options.query);

  if (fastMode) {
    // Fast mode uses the tbm=map parameter for a lightweight search
    let url = `https://www.google.com/search?tbm=map&q=${query}&hl=${language}`;

    if (options.geoCoordinates) {
      // Add geographic center
      const [lat, lng] = options.geoCoordinates.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        url += `&sll=${lat},${lng}`;
      }
    }

    return url;
  }

  // Normal mode uses Google Maps
  let url = `${GOOGLE_MAPS_BASE}/search/?q=${query}&hl=${language}`;

  if (options.geoCoordinates) {
    const [lat, lng] = options.geoCoordinates.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      url += `&center=${lat},${lng}`;
    }
  }

  url += `&zoom=${zoomLevel}`;

  return url;
}

// ============================================================
// Normal Mode Search
// ============================================================

/**
 * Perform a normal (full) search on Google Maps.
 * This scrolls through results, collects place URLs, and scrapes each one.
 */
async function performNormalSearch(
  page: Page,
  options: GoogleMapsSearchOptions
): Promise<GoogleMapsEntry[]> {
  const results: GoogleMapsEntry[] = [];
  const seenHashes = new Set<string>();
  const maxDepth = options.maxDepth || DEFAULT_MAX_DEPTH;
  const maxResults = options.maxResults || DEFAULT_MAX_RESULTS;
  const extractEmails = options.extractEmails ?? false;
  const extractReviews = options.extractReviews ?? false;
  const maxReviews = options.maxReviews || DEFAULT_MAX_REVIEWS;

  // Build search URL and navigate
  const searchUrl = buildSearchUrl(options);
  console.log(`${LOG_PREFIX} Normal search: ${searchUrl.slice(0, 100)}...`);

  await page.goto(searchUrl, {
    waitUntil: 'networkidle2',
    timeout: PAGE_NAVIGATION_TIMEOUT,
  });

  // Handle cookie consent
  await handleCookieConsent(page);

  // Wait for results to load
  await randomDelay(1000, 2000);

  // Wait for the feed element to appear
  try {
    await page.waitForSelector("[role='feed']", { timeout: 10000 });
  } catch {
    console.warn(`${LOG_PREFIX} Feed element not found. Trying to proceed anyway.`);
  }

  // Scroll the feed to load more results
  await scrollResultsFeed(page, maxDepth, maxResults);

  // Collect place URLs
  const placeUrls = await collectPlaceUrls(page, maxResults);
  console.log(`${LOG_PREFIX} Found ${placeUrls.length} place URLs`);

  // Scrape each place
  for (let i = 0; i < placeUrls.length && results.length < maxResults; i++) {
    const placeUrl = placeUrls[i];

    // Deduplicate
    const placeHash = hashPlace(placeUrl.url, placeUrl.title);
    if (seenHashes.has(placeHash)) {
      continue;
    }
    seenHashes.add(placeHash);

    console.log(`${LOG_PREFIX} Scraping ${i + 1}/${placeUrls.length}: ${placeUrl.title}`);

    // Random delay between place scrapes
    await randomDelay(300, 800);

    try {
      const entry = await scrapePlacePage(page, placeUrl.url, {
        extractReviews,
        maxReviews,
      });

      if (entry) {
        // Set the input ID from the search
        entry.inputId = placeHash;

        // Extract emails from website if requested
        if (extractEmails && entry.website) {
          try {
            const emails = await extractEmailsFromWebsite(page, entry.website);
            entry.emails = emails;
          } catch (err) {
            console.warn(`${LOG_PREFIX} Email extraction failed for ${entry.website}: ${err instanceof Error ? err.message : err}`);
          }
        }

        results.push(entry);
        console.log(`${LOG_PREFIX} Scraped ${results.length}/${maxResults}: ${entry.title}`);
      }
    } catch (err) {
      console.warn(`${LOG_PREFIX} Error scraping ${placeUrl.title}: ${err instanceof Error ? err.message : err}`);
    }

    // Go back to search results
    try {
      await page.goBack({
        waitUntil: 'networkidle2',
        timeout: PAGE_NAVIGATION_TIMEOUT,
      });
      await randomDelay(500, 1000);
    } catch {
      // If going back fails, re-navigate
      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: PAGE_NAVIGATION_TIMEOUT,
      });
      await randomDelay(1000, 2000);
    }
  }

  return results;
}

// ============================================================
// Main Search Function
// ============================================================

/**
 * Search Google Maps and extract business data.
 *
 * This is the main entry point for the scraper. It supports multiple modes:
 *
 * - **Normal mode**: Full scraping with APP_INITIALIZATION_STATE extraction.
 *   Scrolls through search results and visits each place page individually.
 *
 * - **Fast mode** (`fastMode: true`): Uses the `tbm=map` search parameter
 *   and parses the JSON response directly. Faster but returns less data.
 *
 * - **Grid search** (`gridSearch: { ... }`): Splits a bounding box into cells
 *   and runs one search per cell. Useful for covering large areas thoroughly.
 *
 * @param options - Search configuration options
 * @returns Array of Google Maps entries with extracted data
 *
 * @example
 * ```typescript
 * // Basic search
 * const results = await searchGoogleMaps({
 *   query: 'coffee shops in Manhattan',
 *   maxResults: 50,
 * });
 *
 * // Search with email extraction
 * const results = await searchGoogleMaps({
 *   query: 'dentists near me',
 *   extractEmails: true,
 *   extractReviews: true,
 *   maxReviews: 5,
 * });
 *
 * // Grid search for comprehensive coverage
 * const results = await searchGoogleMaps({
 *   query: 'restaurants',
 *   gridSearch: {
 *     boundingBox: {
 *       minLat: 40.70, minLon: -74.02,
 *       maxLat: 40.78, maxLon: -73.95,
 *     },
 *     cellSizeKm: 2,
 *   },
 * });
 *
 * // Fast mode for quick results
 * const results = await searchGoogleMaps({
 *   query: 'hotels in Paris',
 *   fastMode: true,
 *   maxResults: 200,
 * });
 * ```
 */
export async function searchGoogleMaps(
  options: GoogleMapsSearchOptions
): Promise<GoogleMapsEntry[]> {
  const startTime = Date.now();

  if (!options.query) {
    throw new Error('Search query is required');
  }

  console.log(`${LOG_PREFIX} Starting search: "${options.query}"`);

  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await launchBrowser(options.proxyUrl);

    // Create stealth page
    const page = await createStealthPage(browser, options.language);

    let results: GoogleMapsEntry[];

    if (options.gridSearch) {
      // Grid search mode
      results = await performGridSearch(page, options);
    } else if (options.fastMode) {
      // Fast mode
      results = await fastModeSearch(page, options);
    } else {
      // Normal mode
      results = await performNormalSearch(page, options);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`${LOG_PREFIX} Search complete: ${results.length} results in ${elapsed}s`);

    return results;
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`${LOG_PREFIX} Search failed after ${elapsed}s: ${err instanceof Error ? err.message : err}`);
    throw err;
  } finally {
    // Clean up browser
    if (browser) {
      try {
        await browser.close();
        console.log(`${LOG_PREFIX} Browser closed`);
      } catch {
        // Ignore close errors
      }
    }
  }
}

// ============================================================
// Convenience Functions
// ============================================================

/**
 * Search for a single place by name and location.
 *
 * @param query - Business name or search query
 * @param location - Location context (e.g., "New York, NY")
 * @returns First matching Google Maps entry, or null
 */
export async function findPlace(
  query: string,
  location?: string
): Promise<GoogleMapsEntry | null> {
  const fullQuery = location ? `${query} in ${location}` : query;

  const results = await searchGoogleMaps({
    query: fullQuery,
    maxResults: 1,
    maxDepth: 1,
  });

  return results[0] ?? null;
}

/**
 * Extract business data from a known Google Maps URL.
 *
 * @param url - A Google Maps place URL
 * @param options - Optional extraction settings
 * @returns Google Maps entry with extracted data, or null
 */
export async function scrapeGoogleMapsUrl(
  url: string,
  options?: { extractEmails?: boolean; extractReviews?: boolean; maxReviews?: number }
): Promise<GoogleMapsEntry | null> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await createStealthPage(browser);
    const entry = await scrapePlacePage(page, url, {
      extractReviews: options?.extractReviews ?? false,
      maxReviews: options?.maxReviews ?? DEFAULT_MAX_REVIEWS,
    });

    if (entry && options?.extractEmails && entry.website) {
      entry.emails = await extractEmailsFromWebsite(page, entry.website);
    }

    return entry;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore
      }
    }
  }
}

/**
 * Batch scrape multiple Google Maps URLs.
 *
 * @param urls - Array of Google Maps place URLs
 * @param options - Optional extraction settings
 * @returns Array of Google Maps entries (nulls for failed scrapes are filtered out)
 */
export async function batchScrapeUrls(
  urls: string[],
  options?: { extractEmails?: boolean; extractReviews?: boolean; maxReviews?: number; concurrency?: number }
): Promise<GoogleMapsEntry[]> {
  const concurrency = options?.concurrency ?? 1;
  const results: GoogleMapsEntry[] = [];

  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();

    // Process URLs in batches
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map(async (url) => {
          const page = await createStealthPage(browser!);
          try {
            const entry = await scrapePlacePage(page, url, {
              extractReviews: options?.extractReviews ?? false,
              maxReviews: options?.maxReviews ?? DEFAULT_MAX_REVIEWS,
            });

            if (entry && options?.extractEmails && entry.website) {
              entry.emails = await extractEmailsFromWebsite(page, entry.website);
            }

            return entry;
          } finally {
            try {
              await page.close();
            } catch {
              // Ignore
            }
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      }

      // Delay between batches
      if (i + concurrency < urls.length) {
        await randomDelay(1000, 3000);
      }
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore
      }
    }
  }

  return results;
}
