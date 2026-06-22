import { NextRequest, NextResponse } from 'next/server';
import {
  crawlUrl,
  crawlUrlAdvanced,
  extractWithCSS,
  extractWithLLM,
  deepCrawl,
  takeScreenshot,
  generateSitemap,
  checkCrawl4AIStatus,
  ensureServiceRunning,
  type CrawlerRunOptions,
  type ExtractionSchema,
} from '@/lib/crawl4ai';

/**
 * POST /api/crawl4ai
 *
 * Unified crawl4ai endpoint — exposes the FULL crawl4ai 0.9.x surface to the
 * frontend and to agents. Backed by the long-lived local Python service at
 * lib/crawl4ai-service/server.py (auto-started on first request).
 *
 * Body:
 *   {
 *     "operation": "crawl" | "crawl_advanced" | "extract_css" | "extract_llm"
 *                  | "deep_crawl" | "screenshot" | "sitemap" | "status",
 *     "url":       "https://example.com",         // required for crawl ops
 *     "schema":    { ... },                       // for extract_css
 *     "instruction": "...",                        // for extract_llm
 *     "options":   { ...CrawlerRunOptions },      // optional
 *     "strategy":  "bfs" | "dfs" | "best-first",  // for deep_crawl / sitemap
 *     "maxDepth":  2,                              // for deep_crawl / sitemap
 *     "maxPages":  10,                             // for deep_crawl / sitemap
 *     "keywords":  ["..."]                         // for best-first deep_crawl
 *   }
 *
 * Backwards compat: if body has no `operation`, defaults to `crawl` and uses
 * `extractSchema` (legacy field) to trigger LLM extraction.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const operation = (body.operation as string) || 'crawl';

    // Auto-start the crawl4ai service if it's not running
    const serviceOk = await ensureServiceRunning();
    if (!serviceOk && operation !== 'status') {
      return NextResponse.json(
        { success: false, error: 'crawl4ai service could not be started. Check server logs.' },
        { status: 503 },
      );
    }

    const opts = (body.options as CrawlerRunOptions) || {};
    const url = body.url as string | undefined;

    switch (operation) {
      case 'status': {
        const status = await checkCrawl4AIStatus();
        return NextResponse.json({ success: true, status });
      }

      case 'crawl':
      case 'crawl_advanced': {
        if (!url) {
          return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
        }
        const fn = operation === 'crawl_advanced' ? crawlUrlAdvanced : crawlUrl;
        const result = await fn(url, opts);
        if (!result.success || !result.data) {
          return NextResponse.json({ success: false, error: result.error || 'Crawl failed' }, { status: 502 });
        }
        // Backwards-compat: if `extractSchema` was provided, also run LLM extraction
        if (body.extractSchema && typeof body.extractSchema === 'object' && Object.keys(body.extractSchema).length > 0) {
          const llmResult = await extractWithLLM(
            url,
            `Extract the following fields from this page: ${Object.keys(body.extractSchema).join(', ')}.`,
            { ...opts, schema: body.extractSchema as Record<string, unknown> },
          );
          return NextResponse.json({
            success: true,
            content: result.data.markdown,
            title: result.data.metadata.title,
            wordCount: result.data.markdown.split(/\s+/).length,
            extracted: llmResult.data,
            crawl4ai: result.data,
          });
        }
        return NextResponse.json({
          success: true,
          content: body.format === 'json' ? JSON.stringify(result.data, null, 2) : result.data.markdown,
          title: result.data.metadata.title,
          wordCount: result.data.markdown.split(/\s+/).length,
          crawl4ai: result.data,
        });
      }

      case 'extract_css': {
        if (!url || !body.schema) {
          return NextResponse.json({ success: false, error: 'url and schema are required' }, { status: 400 });
        }
        const result = await extractWithCSS(url, body.schema as ExtractionSchema, opts);
        return NextResponse.json({
          success: result.success,
          extracted: result.data,
          crawl4ai: result.raw,
          error: result.error,
        });
      }

      case 'extract_llm': {
        if (!url || !body.instruction) {
          return NextResponse.json({ success: false, error: 'url and instruction are required' }, { status: 400 });
        }
        const result = await extractWithLLM(
          url,
          body.instruction as string,
          { ...opts, schema: body.schema as Record<string, unknown> | undefined },
        );
        return NextResponse.json({
          success: result.success,
          extracted: result.data,
          crawl4ai: result.raw,
          error: result.error,
        });
      }

      case 'deep_crawl': {
        if (!url) {
          return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 });
        }
        const result = await deepCrawl(url, {
          ...opts,
          strategy: body.strategy as 'bfs' | 'dfs' | 'best-first' | undefined,
          maxDepth: body.maxDepth as number | undefined,
          maxPages: body.maxPages as number | undefined,
          keywords: body.keywords as string[] | undefined,
        });
        return NextResponse.json({
          success: result.success,
          pages: result.pages,
          totalPages: result.pages.length,
          error: result.error,
        });
      }

      case 'screenshot': {
        if (!url) {
          return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 });
        }
        const result = await takeScreenshot(url, opts);
        return NextResponse.json({
          success: result.success,
          screenshot: result.screenshot,
          error: result.error,
        });
      }

      case 'sitemap': {
        if (!url) {
          return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 });
        }
        const result = await generateSitemap(url, {
          maxDepth: body.maxDepth as number | undefined,
          maxPages: body.maxPages as number | undefined,
          strategy: body.strategy as 'bfs' | 'dfs' | 'best-first' | undefined,
        });
        return NextResponse.json({ success: true, sitemap: result });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown operation: ${operation}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in crawl4ai endpoint:', error);
    const msg = error instanceof Error ? error.message : 'Crawling failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * GET /api/crawl4ai — quick status check (no body needed).
 */
export async function GET() {
  const status = await checkCrawl4AIStatus();
  return NextResponse.json({ success: true, status });
}
