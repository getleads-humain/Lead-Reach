import { Router } from 'express';
import { withPage } from '../index.js';

const router = Router();

interface GoogleMapsRequest {
  query: string;
  maxResults?: number;
  language?: string;
}

interface PlaceResult {
  name: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  category: string;
  website: string;
  hours: string;
  lat: number | null;
  lng: number | null;
}

router.post('/', async (req, res) => {
  try {
    const body = req.body as GoogleMapsRequest;
    const { query, maxResults = 20, language = 'en' } = body;

    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/?hl=${language}`;

    const result = await withPage(async (page) => {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.setExtraHTTPHeaders({
        'Accept-Language': `${language};q=0.9,en;q=0.8`,
      });

      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for results to load
      await page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => {
        console.log('Feed selector not found, trying alternative...');
      });

      // Scroll to load more results
      const scrollContainer = await page.$('[role="feed"]');
      if (scrollContainer) {
        for (let i = 0; i < Math.ceil(maxResults / 10); i++) {
          await page.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
          }, scrollContainer);
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      // Extract place data from the search results list
      const places: PlaceResult[] = await page.evaluate((max) => {
        const results: PlaceResult[] = [];
        const items = document.querySelectorAll('[role="feed"] > div > div > div');

        for (let i = 0; i < Math.min(items.length, max); i++) {
          const item = items[i];
          if (!item) continue;

          const nameEl = item.querySelector('.fontHeadlineSmall, .fontHeadlineMedium');
          const name = nameEl?.textContent?.trim() || '';

          if (!name) continue;

          const ratingEl = item.querySelector('span[role="img"]');
          const ratingText = ratingEl?.getAttribute('aria-label') || '';
          const ratingMatch = ratingText.match(/(\d+[\.,]\d+)/);
          const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : 0;

          const reviewEl = item.querySelector('span[role="img"] + span, .fontBodyMedium span');
          const reviewText = reviewEl?.textContent?.trim() || '';
          const reviewMatch = reviewText.match(/[\(]?(\d+[\.,]?\d*)[\)]?/);
          const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(',', ''), 10) : 0;

          const categoryEl = item.querySelector('.fontBodyMedium span:first-child');
          const category = categoryEl?.textContent?.trim() || '';

          const addressParts: string[] = [];
          const spans = item.querySelectorAll('.fontBodyMedium span');
          spans.forEach((span) => {
            const txt = span.textContent?.trim() || '';
            if (txt.includes(',') && txt.length > 10) {
              addressParts.push(txt);
            }
          });
          const address = addressParts[0] || '';

          const allText = item.textContent || '';
          const hoursMatch = allText.match(
            /Open.*?(?:closes|closes at|⋅|·)(.*?)(?:\d{1,2}:\d{2}\s*[AP]M|\d{1,2}\s*[AP]M)/i
          );
          const hours = hoursMatch ? hoursMatch[0].trim() : '';

          results.push({
            name,
            address,
            phone: '',
            rating,
            reviewCount,
            category,
            website: '',
            hours,
            lat: null,
            lng: null,
          });
        }

        return results;
      }, maxResults);

      // Click on each place to get detailed info
      for (let i = 0; i < Math.min(places.length, maxResults); i++) {
        try {
          const placeItems = await page.$$('[role="feed"] > div > div > div');
          if (!placeItems[i]) continue;

          await placeItems[i].click();
          await new Promise((r) => setTimeout(r, 2000));

          await page.waitForSelector('h1.fontHeadlineLarge', { timeout: 5000 }).catch(() => {});

          const detail = await page.evaluate(() => {
            let foundPhone = '';
            let foundWebsite = '';

            const buttons = document.querySelectorAll('button[data-tooltip]');
            buttons.forEach((btn) => {
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
              foundPhone = infoLinks[0].textContent?.trim() || foundPhone;
            }

            const webLinks = document.querySelectorAll('a[href^="http"]');
            webLinks.forEach((link) => {
              const label = link.getAttribute('aria-label') || '';
              if (label.toLowerCase().includes('website') && !foundWebsite) {
                foundWebsite = link.getAttribute('href') || '';
              }
            });

            const urlMatch = window.location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

            return {
              phone: foundPhone,
              website: foundWebsite,
              lat: urlMatch ? parseFloat(urlMatch[1]) : null,
              lng: urlMatch ? parseFloat(urlMatch[2]) : null,
            };
          });

          places[i].phone = detail.phone;
          places[i].website = detail.website;
          places[i].lat = detail.lat;
          places[i].lng = detail.lng;

          await page.goBack({ waitUntil: 'networkidle2', timeout: 10000 }).catch(async () => {
            // If goBack fails, navigate directly
          });
          await new Promise((r) => setTimeout(r, 1000));
        } catch {
          // Continue with next place
        }
      }

      return places;
    });

    res.json({
      places: result.slice(0, maxResults),
      total: result.length,
      source: 'google_maps',
    });
  } catch (error: any) {
    console.error('Google Maps error:', error);
    res.status(500).json({
      error: 'Google Maps scraping failed',
      message: error.message || 'An error occurred during Google Maps scraping',
    });
  }
});

export { router as googleMapsRouter };
