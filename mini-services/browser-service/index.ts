/**
 * LeadReach Browser Automation Service
 * Wraps Puppeteer for headless browser automation, screenshots, and dynamic page rendering.
 * Port: 5330
 */
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5330;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Browser Pool ──
let browserInstance: any = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    const puppeteer = await import('puppeteer');
    browserInstance = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--window-size=1280,800',
      ],
    });
  }
  return browserInstance;
}

// ── Health ──
app.get('/health', (_req: any, res: any) => {
  res.json({
    status: 'ok',
    service: 'browser-service',
    tools: ['puppeteer'],
    uptime: process.uptime(),
  });
});

// ── Screenshot ──
app.post('/screenshot', async (req: any, res: any) => {
  const { url, fullPage = true, selector } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    let screenshotBuffer: Buffer;
    if (selector) {
      const element = await page.$(selector);
      if (!element) return res.status(404).json({ error: `Selector "${selector}" not found` });
      screenshotBuffer = await element.screenshot({ type: 'png' }) as Buffer;
    } else {
      screenshotBuffer = await page.screenshot({ type: 'png', fullPage }) as Buffer;
    }

    const base64 = screenshotBuffer.toString('base64');
    res.json({ success: true, image: base64, format: 'png', data_source: 'puppeteer' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, data_source: 'puppeteer' });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Render (JavaScript-heavy pages) ──
app.post('/render', async (req: any, res: any) => {
  const { url, waitSelector, timeout = 10000 } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout }).catch(() => {});
    } else {
      // Wait a bit for JS to execute
      await new Promise(r => setTimeout(r, 2000));
    }

    const html = await page.content();
    const title = await page.title();
    res.json({ success: true, html, title, url, data_source: 'puppeteer' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, data_source: 'puppeteer' });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Google Maps Scraper ──
app.post('/google-maps', async (req: any, res: any) => {
  const { query, maxResults = 20, language = 'en' } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': language });

    const encodedQuery = encodeURIComponent(query);
    await page.goto(`https://www.google.com/maps/search/${encodedQuery}/?hl=${language}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    // Wait for results
    try {
      await page.waitForSelector('[role="feed"]', { timeout: 8000 });
    } catch {
      try {
        await page.waitForSelector('.Nv2PK', { timeout: 5000 });
      } catch {
        // Continue anyway
      }
    }

    // Scroll to load more results
    for (let i = 0; i < Math.min(maxResults / 10, 3); i++) {
      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollTop = feed.scrollHeight;
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    // Extract places
    const places = await page.evaluate((max: number) => {
      const items = document.querySelectorAll('.Nv2PK, [role="feed"] > div > div');
      const results: any[] = [];

      items.forEach((item: any, idx: number) => {
        if (idx >= max) return;
        try {
          const nameEl = item.querySelector('.fontHeadlineSmall, .qBF1Pd, .hfpxzc');
          const ratingEl = item.querySelector('.MW4etd, [role="img"]');
          const categoryEl = item.querySelector('.fontBodyMedium .EnGMXb, .fontBodyMedium span:first-child');
          const addressEl = item.querySelector('.fontBodyMedium .W4Efsd:last-child span:first-child, .W4Efsd span');

          const place: any = {};
          if (nameEl) place.name = nameEl.textContent?.trim();
          if (ratingEl) {
            const ariaLabel = ratingEl.getAttribute('aria-label') || ratingEl.textContent || '';
            const match = ariaLabel.match(/(\d+\.?\d*)/);
            if (match) place.rating = parseFloat(match[1]);
          }
          if (categoryEl) place.category = categoryEl.textContent?.trim();
          if (addressEl) place.address = addressEl.textContent?.trim();

          // Get link for coordinates
          const linkEl = item.querySelector('a.hfpxzc');
          if (linkEl) {
            const href = linkEl.getAttribute('href') || '';
            const coordMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (coordMatch) {
              place.lat = parseFloat(coordMatch[1]);
              place.lng = parseFloat(coordMatch[2]);
            }
          }

          if (place.name) results.push(place);
        } catch {}
      });
      return results;
    }, maxResults);

    res.json({ places, total: places.length, data_source: 'google_maps' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, data_source: 'google_maps' });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Extract Elements by CSS Selectors ──
app.post('/extract', async (req: any, res: any) => {
  const { url, selectors, waitMs = 2000 } = req.body;
  if (!url || !selectors) return res.status(400).json({ error: 'url and selectors are required' });

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, waitMs));

    const data = await page.evaluate((sels: Record<string, string>) => {
      const result: Record<string, string | null> = {};
      for (const [key, selector] of Object.entries(sels)) {
        const el = document.querySelector(selector);
        result[key] = el ? el.textContent?.trim() || null : null;
      }
      return result;
    }, selectors);

    res.json({ success: true, data, url, data_source: 'puppeteer' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, data_source: 'puppeteer' });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Crawl pages (simple multi-page) ──
app.post('/crawl', async (req: any, res: any) => {
  const { urls, extractText = true, extractLinks = true } = req.body;
  if (!urls || !Array.isArray(urls)) return res.status(400).json({ error: 'urls array is required' });

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    const results = [];
    for (const targetUrl of urls.slice(0, 10)) {
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const title = await page.title();

        const extracted = await page.evaluate((doText: boolean, doLinks: boolean) => {
          const result: any = {};
          if (doText) {
            // Remove scripts and styles
            document.querySelectorAll('script, style, nav, footer').forEach((el: any) => el.remove());
            result.text = document.body?.innerText?.slice(0, 10000) || '';
          }
          if (doLinks) {
            result.links = Array.from(document.querySelectorAll('a[href]')).slice(0, 100).map((a: any) => ({
              text: a.textContent?.trim()?.slice(0, 100),
              href: a.href,
            }));
          }
          return result;
        }, extractText, extractLinks);

        results.push({ url: targetUrl, title, ...extracted, status: 200 });
      } catch (err: any) {
        results.push({ url: targetUrl, error: err.message, status: 0 });
      }
    }

    res.json({ results, totalPages: results.length, data_source: 'puppeteer' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, data_source: 'puppeteer' });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

// ── Start Server ──
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[browser-service] Running on http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close();
  if (browserInstance) browserInstance.close();
});

process.on('SIGINT', () => {
  server.close();
  if (browserInstance) browserInstance.close();
});
