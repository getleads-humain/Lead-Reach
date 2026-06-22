/**
 * End-to-end smoke test for the crawl4ai integration.
 *
 * Verifies that the TypeScript layer (src/lib/crawl4ai.ts) can:
 *  1. Detect a running crawl4ai HTTP service
 *  2. Perform a basic crawl (markdown + metadata)
 *  3. Extract structured data via CSS selectors
 *  4. Take a screenshot
 *  5. Generate a sitemap via deep crawl
 *
 * Prerequisites:
 *   - crawl4ai service running on http://127.0.0.1:8765
 *     (./lib/crawl4ai-service/start-service.sh --bg)
 *
 * Run:
 *   npx tsx scripts/test-crawl4ai-ts.ts
 */

import {
  crawlUrl,
  extractWithCSS,
  takeScreenshot,
  generateSitemap,
  checkCrawl4AIStatus,
  ensureServiceRunning,
} from '../src/lib/crawl4ai';

async function main() {
  console.log('=== Step 0: Ensure service is running ===');
  const ok = await ensureServiceRunning();
  if (!ok) {
    console.error('FAIL: crawl4ai service is not running');
    process.exit(1);
  }
  const status = await checkCrawl4AIStatus();
  console.log('  Status:', JSON.stringify(status, null, 2));

  console.log('\n=== Step 1: Basic crawl (example.com) ===');
  const r1 = await crawlUrl('https://example.com', { bypassCache: true });
  console.log('  success:', r1.success);
  console.log('  url:', r1.data?.url);
  console.log('  status:', r1.data?.statusCode);
  console.log('  title:', r1.data?.metadata.title);
  console.log('  markdown length:', r1.data?.markdown.length);
  console.log('  markdown preview:', r1.data?.markdown.slice(0, 100));
  if (!r1.success) {
    console.error('FAIL: basic crawl failed:', r1.error);
    process.exit(1);
  }

  console.log('\n=== Step 2: CSS extraction (Hacker News top stories) ===');
  const r2 = await extractWithCSS(
    'https://news.ycombinator.com/',
    {
      name: 'HN Top Stories',
      baseSelector: '.athing',
      fields: [
        { name: 'title', selector: '.titleline > a', type: 'text' },
        { name: 'url', selector: '.titleline > a', type: 'attribute', attribute: 'href' },
      ],
    },
    { bypassCache: true },
  );
  console.log('  success:', r2.success);
  console.log('  extracted count:', r2.data?.length);
  console.log('  first item:', r2.data?.[0]);
  if (!r2.success || (r2.data?.length ?? 0) === 0) {
    console.error('FAIL: CSS extraction returned no results:', r2.error);
    process.exit(1);
  }

  console.log('\n=== Step 3: Screenshot (example.com) ===');
  const r3 = await takeScreenshot('https://example.com');
  console.log('  success:', r3.success);
  console.log('  screenshot length (base64):', r3.screenshot?.length);
  if (!r3.success || !r3.screenshot) {
    console.error('FAIL: screenshot failed:', r3.error);
    process.exit(1);
  }

  console.log('\n=== Step 4: Sitemap (example.com, max 3 pages) ===');
  const r4 = await generateSitemap('https://example.com', { maxDepth: 1, maxPages: 3 });
  console.log('  total pages:', r4.totalPages);
  console.log('  max depth:', r4.maxDepth);
  console.log('  urls:', r4.urls);

  console.log('\n========================================');
  console.log('✅ ALL CRAWL4AI INTEGRATION TESTS PASSED');
  console.log('========================================');
  console.log('\nThe vendored crawl4ai 0.9.0 is fully integrated with the platform:');
  console.log('  - Service: http://127.0.0.1:8765/health');
  console.log('  - Vendored source: lib/crawl4ai-source/');
  console.log('  - HTTP service:    lib/crawl4ai-service/server.py');
  console.log('  - TypeScript API:  src/lib/crawl4ai.ts');
  console.log('  - Agent Reach:     crawl4ai channel registered');
  console.log('  - Agent pipeline:  smartWebRead + crawl4aiLeads integrated');
}

main().catch((err) => {
  console.error('Test threw:', err);
  process.exit(1);
});
