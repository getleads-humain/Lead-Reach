import { Router } from 'express';
import { withPage } from '../index.js';

const router = Router();

interface CrawlRequest {
  urls: string[];
  maxPages?: number;
  extractText?: boolean;
  extractLinks?: boolean;
}

interface CrawlResult {
  url: string;
  title: string;
  text?: string;
  links?: string[];
  status: number;
}

async function crawlPage(
  page: import('puppeteer').Page,
  url: string,
  extractText: boolean,
  extractLinks: boolean
): Promise<CrawlResult> {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const title = await page.title();

    const result: CrawlResult = {
      url,
      title,
      status: 200,
    };

    if (extractText) {
      try {
        result.text = await page.evaluate(() => {
          const clone = document.body.cloneNode(true) as HTMLElement;
          const removeSelectors = clone.querySelectorAll('script, style, noscript, iframe, svg');
          removeSelectors.forEach((el) => el.remove());
          return clone.innerText?.replace(/\s+/g, ' ').trim() || '';
        });
      } catch {
        result.text = '';
      }
    }

    if (extractLinks) {
      try {
        result.links = await page.evaluate((currentUrl) => {
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          const seen = new Set<string>();
          return anchors
            .map((a) => {
              try {
                const href = a.getAttribute('href') || '';
                if (href.startsWith('#') || href.startsWith('javascript:')) return null;
                const absoluteUrl = new URL(href, currentUrl).href;
                if (seen.has(absoluteUrl)) return null;
                seen.add(absoluteUrl);
                return absoluteUrl;
              } catch {
                return null;
              }
            })
            .filter(Boolean) as string[];
        }, url);
      } catch {
        result.links = [];
      }
    }

    return result;
  } catch (error: any) {
    return {
      url,
      title: '',
      status: error.message?.includes('timeout') ? 408 : 500,
      text: '',
      links: [],
    };
  }
}

router.post('/', async (req, res) => {
  try {
    const body = req.body as CrawlRequest;
    const { urls, maxPages = 5, extractText = true, extractLinks = true } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ error: 'urls array is required and must not be empty' });
      return;
    }

    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        res.status(400).json({ error: `Invalid URL: ${url}` });
        return;
      }
    }

    const urlsToCrawl = urls.slice(0, maxPages);
    const results: CrawlResult[] = [];

    await withPage(async (page) => {
      // Crawl the seed URLs
      for (const url of urlsToCrawl) {
        if (results.length >= maxPages) break;

        const result = await crawlPage(page, url, extractText, extractLinks);
        results.push(result);

        // If extractLinks is enabled and we haven't reached maxPages, follow discovered links
        if (extractLinks && result.links && result.links.length > 0 && results.length < maxPages) {
          const newLinks = result.links.filter(
            (link) => !results.some((r) => r.url === link) && !urlsToCrawl.includes(link)
          );

          for (const link of newLinks) {
            if (results.length >= maxPages) break;
            try {
              new URL(link);
              const linkResult = await crawlPage(page, link, extractText, extractLinks);
              results.push(linkResult);
            } catch {
              // Skip invalid URLs
            }
          }
        }
      }
    });

    res.json({
      results,
      totalPages: results.length,
    });
  } catch (error: any) {
    console.error('Crawl error:', error);
    res.status(500).json({
      error: 'Crawl failed',
      message: error.message || 'An error occurred during crawling',
    });
  }
});

export { router as crawlRouter };
