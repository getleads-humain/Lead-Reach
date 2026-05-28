import { Router } from 'express';
import { withPage } from '../index.js';

const router = Router();

interface ExtractRequest {
  url: string;
  selectors: Record<string, string>;
  waitMs?: number;
  waitSelector?: string;
  extractAttributes?: Record<string, string[]>;
}

router.post('/', async (req, res) => {
  try {
    const body = req.body as ExtractRequest;
    const { url, selectors, waitMs = 2000, waitSelector, extractAttributes } = body;

    if (!url) {
      res.status(400).json({ error: 'url is required' });
      return;
    }

    if (!selectors || typeof selectors !== 'object' || Object.keys(selectors).length === 0) {
      res.status(400).json({ error: 'selectors object is required and must not be empty' });
      return;
    }

    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: `Invalid URL: ${url}` });
      return;
    }

    const result = await withPage(async (page) => {
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for a specific selector if provided
      if (waitSelector) {
        try {
          await page.waitForSelector(waitSelector, { timeout: 10000 });
        } catch {
          console.log(`Wait selector "${waitSelector}" not found, proceeding anyway`);
        }
      }

      // Wait for specified duration for dynamic content to settle
      if (waitMs > 0) {
        await new Promise((r) => setTimeout(r, waitMs));
      }

      // Extract data based on selectors
      const extracted = await page.evaluate(
        (sels: Record<string, string>, attrs: Record<string, string[]> | undefined) => {
          const result: Record<string, any> = {};

          for (const [key, selector] of Object.entries(sels)) {
            const elements = document.querySelectorAll(selector);

            if (elements.length === 0) {
              result[key] = null;
            } else if (elements.length === 1) {
              const el = elements[0];
              const entry: Record<string, any> = {
                text: el.textContent?.trim() || '',
                html: el.innerHTML,
              };

              if (attrs && attrs[key]) {
                for (const attr of attrs[key]) {
                  entry[attr] = el.getAttribute(attr) || '';
                }
              }

              entry.href = el.getAttribute('href') || '';
              entry.src = el.getAttribute('src') || '';
              entry.alt = el.getAttribute('alt') || '';
              entry.value = (el as HTMLInputElement).value || '';
              entry.tagName = el.tagName.toLowerCase();

              result[key] = entry;
            } else {
              result[key] = Array.from(elements).map((el) => {
                const entry: Record<string, any> = {
                  text: el.textContent?.trim() || '',
                  html: el.innerHTML,
                };

                if (attrs && attrs[key]) {
                  for (const attr of attrs[key]) {
                    entry[attr] = el.getAttribute(attr) || '';
                  }
                }

                entry.href = el.getAttribute('href') || '';
                entry.src = el.getAttribute('src') || '';
                entry.tagName = el.tagName.toLowerCase();

                return entry;
              });
            }
          }

          return result;
        },
        selectors,
        extractAttributes
      );

      return extracted;
    });

    // Count matched elements for reporting
    const matchCounts: Record<string, number> = {};
    for (const [key, value] of Object.entries(result)) {
      if (value === null) {
        matchCounts[key] = 0;
      } else if (Array.isArray(value)) {
        matchCounts[key] = value.length;
      } else {
        matchCounts[key] = 1;
      }
    }

    res.json({
      url,
      data: result,
      matchCounts,
      selectors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Extract error:', error);
    res.status(500).json({
      error: 'Extraction failed',
      message: error.message || 'An error occurred during data extraction',
    });
  }
});

export { router as extractRouter };
