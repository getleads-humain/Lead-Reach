/**
 * LeadReach Google Maps Scraper Service
 * ======================================
 * Full-featured Google Maps scraper running on port 5340.
 * Provides business search, place details, grid-based area scraping,
 * bulk discovery, and email extraction capabilities.
 *
 * Endpoints:
 *   GET  /health                  — Service health check
 *   POST /search                  — Search Google Maps for businesses
 *   POST /place                   — Get detailed place data
 *   POST /grid                    — Grid-based area scraping
 *   POST /bulk                    — Bulk business discovery
 *   POST /extract-email           — Extract email from a website
 */
import express from 'express';
import cors from 'cors';
import { assertSafeBrowserUrl, UnsafeUrlError } from './url-guard';

const app = express();
const PORT = 5340;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Browser Pool ──
let browserInstance: any = null;

const CHROME_EXECUTABLE = '/home/z/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome';

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    const puppeteer = await import('puppeteer-core');
    browserInstance = await puppeteer.default.launch({
      headless: true,
      executablePath: CHROME_EXECUTABLE,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--window-size=1920,1080',
      ],
    });
  }
  return browserInstance;
}

// ── In-memory job store ──
interface ScrapeJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: any;
  output: any;
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

const jobs = new Map<string, ScrapeJob>();
let serviceStartTime = Date.now();

// ── Types ──
interface GmapsBusiness {
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

// ── Health ──
app.get('/health', (_req: any, res: any) => {
  const activeJobs = Array.from(jobs.values()).filter(j => j.status === 'running').length;
  res.json({
    status: 'ok',
    service: 'gmaps-service',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    active_jobs: activeJobs,
    total_jobs: jobs.size,
  });
});

// ── Search Google Maps ──
app.post('/search', async (req: any, res: any) => {
  const {
    query,
    location,
    language = 'en',
    maxResults = 20,
    depth = false,
    fastMode = false,
  } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': `${language};q=0.9,en;q=0.8` });

    const searchQuery = location ? `${query} in ${location}` : query;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/?hl=${language}`;

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for results to load
    try {
      await page.waitForSelector('[role="feed"]', { timeout: 15000 });
    } catch {
      try {
        await page.waitForSelector('.Nv2PK', { timeout: 5000 });
      } catch {
        // Continue anyway
      }
    }

    // Scroll to load more results
    const scrollCount = fastMode ? 1 : Math.ceil(maxResults / 10);
    for (let i = 0; i < scrollCount; i++) {
      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollTop = feed.scrollHeight;
      });
      await new Promise(r => setTimeout(r, fastMode ? 500 : 1500));
    }

    // Extract place data from the search results list
    const places: GmapsBusiness[] = await page.evaluate((max: number) => {
      const results: GmapsBusiness[] = [];
      const items = document.querySelectorAll('.Nv2PK, [role="feed"] > div > div > div');

      for (let i = 0; i < Math.min(items.length, max); i++) {
        const item = items[i] as HTMLElement;
        if (!item) continue;

        const nameEl = item.querySelector('.fontHeadlineSmall, .fontHeadlineMedium, .qBF1Pd, .hfpxzc');
        const name = nameEl?.textContent?.trim() || '';
        if (!name) continue;

        // Rating
        const ratingEl = item.querySelector('span[role="img"], .MW4etd');
        const ratingText = ratingEl?.getAttribute('aria-label') || ratingEl?.textContent || '';
        const ratingMatch = ratingText.match(/(\d+[\.,]\d+)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : 0;

        // Review count
        const reviewEl = item.querySelector('span[role="img"] + span, .fontBodyMedium span');
        const reviewText = reviewEl?.textContent?.trim() || '';
        const reviewMatch = reviewText.match(/[\(]?(\d+[\.,]?\d*)[\)]?/);
        const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(',', ''), 10) : 0;

        // Category
        const categoryEl = item.querySelector('.fontBodyMedium span:first-child, .fontBodyMedium .EnGMXb');
        const category = categoryEl?.textContent?.trim() || '';

        // Address
        const addressParts: string[] = [];
        const spans = item.querySelectorAll('.fontBodyMedium span, .W4Efsd span');
        spans.forEach((span: any) => {
          const txt = span.textContent?.trim() || '';
          if (txt.includes(',') && txt.length > 10) {
            addressParts.push(txt);
          }
        });
        const address = addressParts[0] || '';

        // Hours
        const allText = item.textContent || '';
        const isOpenMatch = allText.match(/Open\s*(?:⋅|·|until|closes)\s*(.*?)$/im);
        const isClosedMatch = allText.match(/Closed\s*(?:⋅|·|opens)\s*(.*?)$/im);
        let hours = '';
        let isOpen: boolean | null = null;
        if (isOpenMatch) {
          hours = isOpenMatch[0].trim();
          isOpen = true;
        } else if (isClosedMatch) {
          hours = isClosedMatch[0].trim();
          isOpen = false;
        }

        // Coordinates from link
        let lat: number | null = null;
        let lng: number | null = null;
        let placeUrl = '';
        const linkEl = item.querySelector('a.hfpxzc');
        if (linkEl) {
          const href = linkEl.getAttribute('href') || '';
          placeUrl = href;
          const coordMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
          }
          // Extract place_id from data CID
          const cidMatch = href.match(/0x[a-f0-9]+:0x([a-f0-9]+)/);
          if (cidMatch) {
            // Use as place_id
          }
        }

        // Generate a pseudo place_id
        const placeId = `gmaps_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}_${i}`;

        results.push({
          place_id: placeId,
          name,
          address,
          phone: '',
          website: '',
          rating,
          reviewCount,
          category,
          categories: category ? [category] : [],
          hours,
          isOpen,
          lat,
          lng,
          url: placeUrl,
          email: null,
          description: null,
          imageUrl: null,
        });
      }

      return results;
    }, maxResults);

    // If depth mode, click into each place for detailed info
    if (depth && !fastMode) {
      for (let i = 0; i < Math.min(places.length, maxResults); i++) {
        try {
          const placeItems = await page.$$('[role="feed"] > div > div > div, .Nv2PK');
          if (!placeItems[i]) continue;

          await placeItems[i].click();
          await new Promise(r => setTimeout(r, 2000));

          await page.waitForSelector('h1.fontHeadlineLarge', { timeout: 5000 }).catch(() => {});

          const detail = await page.evaluate(() => {
            let foundPhone = '';
            let foundWebsite = '';
            let foundDescription = '';
            let foundImageUrl: string | null = null;

            // Phone
            const buttons = document.querySelectorAll('button[data-tooltip]');
            buttons.forEach((btn: any) => {
              const tooltip = btn.getAttribute('data-tooltip') || '';
              const ariaLabel = btn.getAttribute('aria-label') || '';
              if (tooltip.toLowerCase().includes('phone') || ariaLabel.toLowerCase().includes('phone')) {
                foundPhone = btn.textContent?.trim() || '';
              }
              if (tooltip.toLowerCase().includes('website') || ariaLabel.toLowerCase().includes('website')) {
                const link = btn.closest('a') || btn.querySelector('a');
                foundWebsite = link?.getAttribute('href') || '';
                if (!foundWebsite && btn.textContent?.includes('.')) {
                  foundWebsite = btn.textContent.trim();
                }
              }
            });

            const infoLinks = document.querySelectorAll('a[href^="tel:"]');
            if (infoLinks.length > 0) {
              foundPhone = (infoLinks[0] as HTMLElement).textContent?.trim() || foundPhone;
            }

            const webLinks = document.querySelectorAll('a[href^="http"]');
            webLinks.forEach((link: any) => {
              const label = link.getAttribute('aria-label') || '';
              if (label.toLowerCase().includes('website') && !foundWebsite) {
                foundWebsite = link.getAttribute('href') || '';
              }
            });

            // Description
            const descEl = document.querySelector('.PoZ0Pd, .bS8vP');
            if (descEl) {
              foundDescription = descEl.textContent?.trim() || '';
            }

            // Image
            const imgEl = document.querySelector('.RZQOTb img, .lMbq3c img');
            if (imgEl) {
              foundImageUrl = imgEl.getAttribute('src') || null;
            }

            // Coordinates from URL
            const urlMatch = window.location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

            // Category list
            const catEls = document.querySelectorAll('.fontBodyMedium .btnNNe, .fontBodyMedium span[jsaction]');
            const categories: string[] = [];
            catEls.forEach((el: any) => {
              const t = el.textContent?.trim();
              if (t && t.length > 2 && t.length < 50) categories.push(t);
            });

            return {
              phone: foundPhone,
              website: foundWebsite,
              description: foundDescription,
              imageUrl: foundImageUrl,
              lat: urlMatch ? parseFloat(urlMatch[1]) : null,
              lng: urlMatch ? parseFloat(urlMatch[2]) : null,
              categories,
            };
          });

          places[i].phone = detail.phone;
          places[i].website = detail.website;
          places[i].description = detail.description;
          places[i].imageUrl = detail.imageUrl;
          if (detail.lat) places[i].lat = detail.lat;
          if (detail.lng) places[i].lng = detail.lng;
          if (detail.categories.length > 0) places[i].categories = detail.categories;

          // Update place_id with real data if possible
          if (places[i].website) {
            places[i].place_id = `gmaps_${Buffer.from(places[i].name + places[i].address).toString('base64url').slice(0, 40)}`;
          }

          await page.goBack({ waitUntil: 'networkidle2', timeout: 10000 }).catch(async () => {
            const searchQuery2 = document.querySelector('input.searchboxinput') as HTMLInputElement;
            if (searchQuery2) {
              // Stay on current page
            }
          });
          await new Promise(r => setTimeout(r, 800));
        } catch {
          // Continue with next place
        }
      }
    }

    res.json({
      success: true,
      results: places,
      count: places.length,
      query,
    });
  } catch (err: any) {
    console.error('[gmaps-service] Search error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Google Maps search failed',
    });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Get Place Details ──
app.post('/place', async (req: any, res: any) => {
  const { urlOrPlaceId, email = false, extraReviews = false } = req.body;

  if (!urlOrPlaceId) {
    return res.status(400).json({ error: 'urlOrPlaceId is required' });
  }

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    let placeUrl: string;
    if (urlOrPlaceId.startsWith('http')) {
      // SSRF guard — parse URL with `new URL()` and validate scheme + hostname
      // inline (CodeQL sanitizer barrier). Use the re-serialized `safePlaceUrl`
      // for `page.goto()` so the taint flow on the user-supplied input is cut.
      let safePlaceUrl: string;
      try {
        const parsed = new URL(urlOrPlaceId);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return res.status(400).json({
            error: `Refused URL for SSRF safety: disallowed scheme ${parsed.protocol}`,
            data_source: 'google_maps',
          });
        }
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host === '::1' || host === '0.0.0.0' ||
            host.endsWith('.local') || host.endsWith('.internal') ||
            host.endsWith('.localhost') || host.endsWith('.intranet') ||
            /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
            /^169\.254\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host) ||
            /^0\./.test(host) || /^f[cd][0-9a-f]{2}:/.test(host) ||
            host.startsWith('fe8') || host.startsWith('fe9') ||
            host.startsWith('fea') || host.startsWith('feb') || host.startsWith('ff')) {
          return res.status(400).json({
            error: `Refused URL for SSRF safety: internal/private host ${host}`,
            data_source: 'google_maps',
          });
        }
        safePlaceUrl = parsed.toString();
      } catch {
        return res.status(400).json({
          error: 'Refused URL for SSRF safety: malformed URL',
          data_source: 'google_maps',
        });
      }

      // Defense-in-depth: full DNS-rebinding check via url-guard.
      try {
        assertSafeBrowserUrl(safePlaceUrl);
      } catch (err) {
        const reason = err instanceof UnsafeUrlError ? err.reason : 'unknown';
        return res.status(400).json({
          error: `Refused URL for SSRF safety: ${reason}`,
          data_source: 'google_maps',
        });
      }
      placeUrl = safePlaceUrl;
    } else {
      // It's a place ID, search for it — constructed URL is safe (Google domain).
      placeUrl = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(urlOrPlaceId)}`;
    }

    await page.goto(placeUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await page.waitForSelector('h1.fontHeadlineLarge', { timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    const place: GmapsBusiness = await page.evaluate(() => {
      const nameEl = document.querySelector('h1.fontHeadlineLarge');
      const name = nameEl?.textContent?.trim() || '';

      // Rating
      const ratingEl = document.querySelector('div[role="img"][aria-label*="star"], .fontDisplayLarge');
      const ratingText = ratingEl?.getAttribute('aria-label') || ratingEl?.textContent || '';
      const ratingMatch = ratingText.match(/(\d+[\.,]\d+)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : 0;

      // Review count
      const reviewEl = document.querySelector('button[aria-label*="review"], .fontBodyMedium span');
      const reviewText = reviewEl?.getAttribute('aria-label') || reviewEl?.textContent || '';
      const reviewMatch = reviewText.match(/(\d+[\.,]?\d*)\s*review/i);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(',', ''), 10) : 0;

      // Category
      const catEls = document.querySelectorAll('.fontBodyMedium .btnNNe, button[jsaction*="category"]');
      const categories: string[] = [];
      catEls.forEach((el: any) => {
        const t = el.textContent?.trim();
        if (t && t.length > 2 && t.length < 50) categories.push(t);
      });

      // Address
      const addressEl = document.querySelector('button[data-tooltip*="address"], button[aria-label*="address"]');
      let address = '';
      if (addressEl) {
        address = addressEl.textContent?.trim() || '';
      }

      // Phone
      let foundPhone = '';
      const phoneButtons = document.querySelectorAll('button[data-tooltip*="phone"], button[aria-label*="phone"]');
      if (phoneButtons.length > 0) {
        foundPhone = (phoneButtons[0] as HTMLElement).textContent?.trim() || '';
      }
      const telLinks = document.querySelectorAll('a[href^="tel:"]');
      if (telLinks.length > 0 && !foundPhone) {
        foundPhone = (telLinks[0] as HTMLElement).textContent?.trim() || '';
      }

      // Website
      let foundWebsite = '';
      const webButtons = document.querySelectorAll('button[data-tooltip*="website"], button[aria-label*="website"]');
      if (webButtons.length > 0) {
        const link = webButtons[0].closest('a') || webButtons[0].querySelector('a');
        foundWebsite = link?.getAttribute('href') || (webButtons[0] as HTMLElement).textContent?.trim() || '';
      }
      if (!foundWebsite) {
        const webLinks = document.querySelectorAll('a[aria-label*="website"], a[data-tooltip*="website"]');
        if (webLinks.length > 0) {
          foundWebsite = webLinks[0].getAttribute('href') || '';
        }
      }

      // Hours
      const hoursEl = document.querySelector('button[aria-label*="Hours"], .fontBodyMedium span');
      let hours = '';
      let isOpen: boolean | null = null;
      const bodyText = document.body?.innerText || '';
      const openMatch = bodyText.match(/Open\s*⋅\s*(.*?)(?:\n|$)/i);
      const closedMatch = bodyText.match(/Closed\s*⋅\s*(.*?)(?:\n|$)/i);
      if (openMatch) { hours = openMatch[0].trim(); isOpen = true; }
      else if (closedMatch) { hours = closedMatch[0].trim(); isOpen = false; }

      // Coordinates
      const urlMatch = window.location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      const lat = urlMatch ? parseFloat(urlMatch[1]) : null;
      const lng = urlMatch ? parseFloat(urlMatch[2]) : null;

      // Description
      const descEl = document.querySelector('.PoZ0Pd, .bS8vP');
      const description = descEl?.textContent?.trim() || null;

      // Image
      const imgEl = document.querySelector('.RZQOTb img, .lMbq3c img');
      const imageUrl = imgEl?.getAttribute('src') || null;

      return {
        place_id: `gmaps_${Buffer.from(name + address).toString('base64url').slice(0, 40)}`,
        name,
        address,
        phone: foundPhone,
        website: foundWebsite,
        rating,
        reviewCount,
        category: categories[0] || '',
        categories,
        hours,
        isOpen,
        lat,
        lng,
        url: window.location.href,
        email: null,
        description,
        imageUrl,
      } as GmapsBusiness;
    });

    // If email extraction is requested, visit the website
    if (email && place.website) {
      try {
        const emailPage = await browser.newPage();
        await emailPage.goto(place.website, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        await new Promise(r => setTimeout(r, 2000));

        const extractedEmail = await emailPage.evaluate(() => {
          const bodyText = document.body?.innerText || '';
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const matches = bodyText.match(emailRegex) || [];
          // Filter out common non-business emails
          const filtered = matches.filter(
            (e: string) =>
              !e.includes('example.com') &&
              !e.includes('sentry.io') &&
              !e.includes('wixpress.com') &&
              !e.includes('googleapis.com') &&
              !e.endsWith('.png') &&
              !e.endsWith('.jpg')
          );
          return filtered[0] || null;
        });

        place.email = extractedEmail;
        await emailPage.close().catch(() => {});
      } catch {
        // Email extraction failed, continue without it
      }
    }

    res.json({
      success: true,
      place,
    });
  } catch (err: any) {
    console.error('[gmaps-service] Place error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to get place details',
    });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Grid-Based Area Scraping ──
app.post('/grid', async (req: any, res: any) => {
  const {
    boundingBox,
    query,
    cellSizeKm = 2,
  } = req.body;

  if (!boundingBox || !query) {
    return res.status(400).json({ error: 'boundingBox and query are required' });
  }

  const { minLat, minLon, maxLat, maxLon } = boundingBox;

  // Calculate grid cells
  // Approximate: 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 * cos(lat) km
  const avgLat = (minLat + maxLat) / 2;
  const latStep = cellSizeKm / 111;
  const lonStep = cellSizeKm / (111 * Math.cos((avgLat * Math.PI) / 180));

  const cells: { lat: number; lon: number }[] = [];
  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    for (let lon = minLon; lon <= maxLon; lon += lonStep) {
      cells.push({ lat, lon });
    }
  }

  // Limit to prevent excessive scraping
  const maxCells = 20;
  const limitedCells = cells.slice(0, maxCells);

  const allResults: GmapsBusiness[] = [];
  const seenPlaceIds = new Set<string>();

  for (const cell of limitedCells) {
    try {
      const cellQuery = `${query} near ${cell.lat},${cell.lon}`;

      // Use the internal search function
      const searchResult = await performSearch(cellQuery, '', 'en', 10, false, true);

      for (const place of searchResult) {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          allResults.push(place);
        }
      }
    } catch {
      // Continue with next cell
    }
  }

  res.json({
    success: true,
    results: allResults,
    cells_scraped: limitedCells.length,
    total_cells: cells.length,
  });
});

// ── Bulk Search ──
app.post('/bulk', async (req: any, res: any) => {
  const { queries, location, language = 'en', maxResults = 20, fastMode = false } = req.body;

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    return res.status(400).json({ error: 'queries array is required' });
  }

  const allResults: GmapsBusiness[] = [];
  const seenPlaceIds = new Set<string>();
  let totalBeforeDedup = 0;

  // Process queries with concurrency limit
  const concurrency = 3;
  for (let i = 0; i < queries.length; i += concurrency) {
    const batch = queries.slice(i, i + concurrency);
    const batchPromises = batch.map(q =>
      performSearch(q, location || '', language, maxResults, false, fastMode)
        .catch(() => [] as GmapsBusiness[])
    );

    const batchResults = await Promise.all(batchPromises);

    for (const results of batchResults) {
      totalBeforeDedup += results.length;
      for (const place of results) {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          allResults.push(place);
        }
      }
    }
  }

  res.json({
    success: true,
    results: allResults,
    total: allResults.length,
    duplicates_removed: totalBeforeDedup - allResults.length,
  });
});

// ── Extract Email ──
app.post('/extract-email', async (req: any, res: any) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  // SSRF guard — parse URL with `new URL()` and validate scheme + hostname
  // inline (CodeQL sanitizer barrier). The re-serialized `safeUrl` is used
  // for `page.goto()` so the taint flow on the user-supplied input is cut.
  // Without this, an attacker could ask our service to navigate to
  // http://169.254.169.254/... or http://localhost:3000/... and exfiltrate
  // the response body via the email extraction output.
  let safeUrl: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({
        error: `Refused URL for SSRF safety: disallowed scheme ${parsed.protocol}`,
        data_source: 'puppeteer',
      });
    }
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '::1' || host === '0.0.0.0' ||
        host.endsWith('.local') || host.endsWith('.internal') ||
        host.endsWith('.localhost') || host.endsWith('.intranet') ||
        /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
        /^169\.254\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host) ||
        /^0\./.test(host) || /^f[cd][0-9a-f]{2}:/.test(host) ||
        host.startsWith('fe8') || host.startsWith('fe9') ||
        host.startsWith('fea') || host.startsWith('feb') || host.startsWith('ff')) {
      return res.status(400).json({
        error: `Refused URL for SSRF safety: internal/private host ${host}`,
        data_source: 'puppeteer',
      });
    }
    safeUrl = parsed.toString();
  } catch {
    return res.status(400).json({
      error: 'Refused URL for SSRF safety: malformed URL',
      data_source: 'puppeteer',
    });
  }

  // Defense-in-depth: full DNS-rebinding check via url-guard.
  try {
    assertSafeBrowserUrl(safeUrl);
  } catch (err) {
    const reason = err instanceof UnsafeUrlError ? err.reason : 'unknown';
    return res.status(400).json({
      error: `Refused URL for SSRF safety: ${reason}`,
      data_source: 'puppeteer',
    });
  }

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.goto(safeUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await new Promise(r => setTimeout(r, 2000));

    const emails = await page.evaluate(() => {
      const bodyText = document.body?.innerText || '';
      const html = document.body?.innerHTML || '';
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

      const textEmails = bodyText.match(emailRegex) || [];
      const htmlEmails = html.match(emailRegex) || [];

      const allEmails = [...new Set([...textEmails, ...htmlEmails])];
      const filtered = allEmails.filter(
        (e: string) =>
          !e.includes('example.com') &&
          !e.includes('sentry.io') &&
          !e.includes('wixpress.com') &&
          !e.includes('googleapis.com') &&
          !e.endsWith('.png') &&
          !e.endsWith('.jpg') &&
          !e.endsWith('.svg')
      );
      return filtered;
    });

    res.json({
      success: true,
      emails,
      url,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Email extraction failed',
    });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Internal search helper ──
async function performSearch(
  query: string,
  location: string,
  language: string,
  maxResults: number,
  depth: boolean,
  fastMode: boolean,
): Promise<GmapsBusiness[]> {
  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': `${language};q=0.9,en;q=0.8` });

    const searchQuery = location ? `${query} in ${location}` : query;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/?hl=${language}`;

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    try {
      await page.waitForSelector('[role="feed"]', { timeout: 10000 });
    } catch {
      // Continue anyway
    }

    // Scroll
    const scrollCount = fastMode ? 1 : Math.ceil(maxResults / 10);
    for (let i = 0; i < scrollCount; i++) {
      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollTop = feed.scrollHeight;
      });
      await new Promise(r => setTimeout(r, fastMode ? 500 : 1000));
    }

    const places: GmapsBusiness[] = await page.evaluate((max: number) => {
      const results: GmapsBusiness[] = [];
      const items = document.querySelectorAll('.Nv2PK, [role="feed"] > div > div > div');

      for (let i = 0; i < Math.min(items.length, max); i++) {
        const item = items[i] as HTMLElement;
        if (!item) continue;

        const nameEl = item.querySelector('.fontHeadlineSmall, .fontHeadlineMedium, .qBF1Pd');
        const name = nameEl?.textContent?.trim() || '';
        if (!name) continue;

        const ratingEl = item.querySelector('span[role="img"], .MW4etd');
        const ratingText = ratingEl?.getAttribute('aria-label') || '';
        const ratingMatch = ratingText.match(/(\d+[\.,]\d+)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : 0;

        const reviewEl = item.querySelector('span[role="img"] + span');
        const reviewText = reviewEl?.textContent?.trim() || '';
        const reviewMatch = reviewText.match(/[\(]?(\d+[\.,]?\d*)[\)]?/);
        const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(',', ''), 10) : 0;

        const categoryEl = item.querySelector('.fontBodyMedium span:first-child');
        const category = categoryEl?.textContent?.trim() || '';

        const addressParts: string[] = [];
        const spans = item.querySelectorAll('.fontBodyMedium span');
        spans.forEach((span: any) => {
          const txt = span.textContent?.trim() || '';
          if (txt.includes(',') && txt.length > 10) addressParts.push(txt);
        });

        let lat: number | null = null;
        let lng: number | null = null;
        let placeUrl = '';
        const linkEl = item.querySelector('a.hfpxzc');
        if (linkEl) {
          const href = linkEl.getAttribute('href') || '';
          placeUrl = href;
          const coordMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
          }
        }

        results.push({
          place_id: `gmaps_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}_${i}`,
          name,
          address: addressParts[0] || '',
          phone: '',
          website: '',
          rating,
          reviewCount,
          category,
          categories: category ? [category] : [],
          hours: '',
          isOpen: null,
          lat,
          lng,
          url: placeUrl,
          email: null,
          description: null,
          imageUrl: null,
        });
      }
      return results;
    }, maxResults);

    return places;
  } catch {
    return [];
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ── Start Server ──
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[gmaps-service] Running on http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close();
  if (browserInstance) browserInstance.close();
});

process.on('SIGINT', () => {
  server.close();
  if (browserInstance) browserInstance.close();
});
