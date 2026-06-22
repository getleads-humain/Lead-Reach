#!/usr/bin/env python3
"""
Smoke test: crawl a real URL with crawl4ai and dump the result as JSON.

Tests:
1. Basic async crawl with markdown + cleaned HTML
2. Structured extraction (CSS-based) on a known page
3. Deep crawl (BFS) on a small site (limited pages)
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, "/home/z/my-project/lib/crawl4ai-source")

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy
from crawl4ai.deep_crawling import BFSDeepCrawlStrategy
from crawl4ai.deep_crawling.filters import FilterChain


async def test_basic_crawl():
    """Test 1: Simple async crawl of example.com."""
    print("\n=== Test 1: Basic crawl (example.com) ===")
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(
            url="https://example.com",
            cache_mode=CacheMode.BYPASS,
        )
        print(f"  success: {result.success}")
        print(f"  status_code: {result.status_code}")
        print(f"  markdown length: {len(result.markdown.raw_markdown or '')}")
        print(f"  fit markdown length: {len(result.markdown.fit_markdown or '')}")
        print(f"  title: {result.metadata.get('title', '') if result.metadata else ''}")
        print(f"  links internal: {len(result.links.get('internal', [])) if result.links else 0}")
        return {
            "test": "basic_crawl",
            "success": result.success,
            "status_code": result.status_code,
            "markdown_length": len(result.markdown.raw_markdown or "") if result.markdown else 0,
            "fit_markdown_length": len(result.markdown.fit_markdown or "") if result.markdown else 0,
            "title": (result.metadata or {}).get("title", "") if result.metadata else "",
            "error": result.error_message if hasattr(result, "error_message") else None,
        }


async def test_css_extraction():
    """Test 2: CSS-based structured extraction on Hacker News."""
    print("\n=== Test 2: CSS extraction (news.ycombinator.com) ===")
    schema = {
        "name": "HN Top Stories",
        "baseSelector": ".athing",
        "fields": [
            {"name": "title", "selector": ".titleline > a", "type": "text"},
            {"name": "url", "selector": ".titleline > a", "type": "attribute", "attribute": "href"},
            {"name": "score", "selector": ".score", "type": "text"},
        ],
    }
    extraction = JsonCssExtractionStrategy(schema=schema)
    run_config = CrawlerRunConfig(extraction_strategy=extraction, cache_mode=CacheMode.BYPASS)
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(
            url="https://news.ycombinator.com/",
            config=run_config,
        )
        print(f"  success: {result.success}")
        extracted = None
        try:
            extracted = json.loads(result.extracted_content or "[]") if result.extracted_content else []
        except Exception:
            extracted = []
        print(f"  extracted items: {len(extracted) if isinstance(extracted, list) else 0}")
        if isinstance(extracted, list) and extracted:
            print(f"  first item: {extracted[0]}")
        return {
            "test": "css_extraction",
            "success": result.success,
            "extracted_count": len(extracted) if isinstance(extracted, list) else 0,
            "first_item": extracted[0] if isinstance(extracted, list) and extracted else None,
        }


async def test_deep_crawl():
    """Test 3: BFS deep crawl — small max-pages to keep test fast."""
    print("\n=== Test 3: BFS deep crawl (max 3 pages) ===")
    bfs = BFSDeepCrawlStrategy(max_depth=1, max_pages=3)
    run_config = CrawlerRunConfig(deep_crawl_strategy=bfs, cache_mode=CacheMode.BYPASS)
    async with AsyncWebCrawler() as crawler:
        results = await crawler.arun(
            url="https://example.com",
            config=run_config,
        )
        # results may be a list or single
        if not isinstance(results, list):
            results = [results]
        print(f"  pages crawled: {len(results)}")
        for r in results[:3]:
            print(f"    - {r.url}: success={r.success}")
        return {
            "test": "deep_crawl_bfs",
            "success": all(r.success for r in results),
            "pages_crawled": len(results),
            "urls": [r.url for r in results],
        }


async def main():
    results = []
    try:
        results.append(await test_basic_crawl())
    except Exception as e:
        print(f"  ERROR: {e}")
        results.append({"test": "basic_crawl", "success": False, "error": str(e)})
    try:
        results.append(await test_css_extraction())
    except Exception as e:
        print(f"  ERROR: {e}")
        results.append({"test": "css_extraction", "success": False, "error": str(e)})
    try:
        results.append(await test_deep_crawl())
    except Exception as e:
        print(f"  ERROR: {e}")
        results.append({"test": "deep_crawl_bfs", "success": False, "error": str(e)})

    out_path = Path("/home/z/my-project/scripts/crawl4ai_smoke_test_results.json")
    out_path.write_text(json.dumps(results, indent=2, default=str))
    print(f"\n=== All tests complete. Results saved to {out_path} ===")
    print(json.dumps({"summary": [{"test": r["test"], "success": r.get("success")} for r in results]}, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
