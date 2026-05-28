import { Router } from 'express';
import { withPage } from '../index.js';

const router = Router();

interface RenderRequest {
  url: string;
  waitSelector?: string;
  timeout?: number;
  executeJs?: string;
}

router.post('/', async (req, res) => {
  try {
    const body = req.body as RenderRequest;
    const { url, waitSelector, timeout = 10000, executeJs } = body;

    if (!url) {
      res.status(400).json({ error: 'url is required' });
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

      // Disable unnecessary resources for faster rendering
      await page.setRequestInterception(true);
      page.on('request', (interceptedRequest) => {
        const resourceType = interceptedRequest.resourceType();
        if (['font', 'media'].includes(resourceType)) {
          interceptedRequest.abort();
        } else {
          interceptedRequest.continue();
        }
      });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout,
      });

      // Wait for specific selector if provided
      if (waitSelector) {
        try {
          await page.waitForSelector(waitSelector, { timeout: Math.min(timeout, 15000) });
        } catch {
          console.log(`Wait selector "${waitSelector}" not found within timeout, returning current state`);
        }
      }

      // Execute custom JavaScript if provided
      if (executeJs) {
        try {
          await page.evaluate(executeJs);
          await new Promise((r) => setTimeout(r, 1000));
        } catch (e: any) {
          console.error('Custom JS execution error:', e.message);
        }
      }

      // Get the fully rendered HTML
      const html = await page.content();

      // Extract metadata
      const metadata = await page.evaluate(() => {
        const title = document.title;
        const metaDescription =
          document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const canonicalUrl =
          document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const ogTitle =
          document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
        const ogDescription =
          document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

        return {
          title,
          metaDescription,
          canonicalUrl,
          ogTitle,
          ogDescription,
        };
      });

      return { html, metadata };
    });

    res.json({
      html: result.html,
      url,
      metadata: result.metadata,
      rendered: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Render error:', error);

    if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
      res.status(408).json({
        error: 'Render timeout',
        message: 'Page rendering timed out. Try increasing the timeout or using a waitSelector.',
      });
      return;
    }

    res.status(500).json({
      error: 'Render failed',
      message: error.message || 'An error occurred during page rendering',
    });
  }
});

export { router as dynamicRouter };
