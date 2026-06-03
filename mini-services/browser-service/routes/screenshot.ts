import { Router } from 'express';
import { withPage } from '../index.js';

const router = Router();

interface ScreenshotRequest {
  url: string;
  fullPage?: boolean;
  selector?: string;
  width?: number;
  height?: number;
}

router.post('/', async (req, res) => {
  try {
    const body = req.body as ScreenshotRequest;
    const { url, fullPage = true, selector, width = 1920, height = 1080 } = body;

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
      await page.setViewport({ width, height });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      let screenshotBuffer: Buffer;

      if (selector) {
        const element = await page.$(selector);
        if (!element) {
          return {
            error: 'Selector not found',
            message: `Could not find element matching selector: ${selector}`,
            status: 404,
          };
        }
        screenshotBuffer = (await element.screenshot({ type: 'png' })) as Buffer;
      } else {
        screenshotBuffer = (await page.screenshot({
          type: 'png',
          fullPage,
        })) as Buffer;
      }

      const base64Image = screenshotBuffer.toString('base64');

      return {
        image: base64Image,
        format: 'png',
        size: screenshotBuffer.length,
        url,
        fullPage,
        selector: selector || null,
        status: 200,
      };
    });

    if (result.status === 404) {
      res.status(404).json({ error: result.error, message: result.message });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Screenshot error:', error);
    res.status(500).json({
      error: 'Screenshot failed',
      message: error.message || 'An error occurred while taking screenshot',
    });
  }
});

export { router as screenshotRouter };
