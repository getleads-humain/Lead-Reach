"""
Crawl4AI Channel — Deep Web Crawling & Scraping

Integrates unclecode/crawl4ai into Agent-Reach toolkit.
Crawl4AI provides LLM-friendly web crawling with full browser rendering,
deep site exploration, structured data extraction, and lead data mining.

Installation:
    pip install crawl4ai
    crawl4ai-setup

CLI Reference: https://github.com/unclecode/crawl4ai
"""

import asyncio
import json
import re
from typing import Any, Dict, List, Optional

from .base import ChannelBase, ChannelResult


class Crawl4AIChannel(ChannelBase):
    """Crawl4AI channel for deep web crawling and scraping."""

    name = "crawl4ai"
    display_name = "Crawl4AI"
    description = "Deep web crawling & scraping with full browser rendering — LLM-ready Markdown, structured extraction, deep site exploration, and lead data mining"
    tier = 0  # Zero-config
    backend = "Crawl4AI (unclecode/crawl4ai)"

    async def crawl(self, url: str, output_format: str = "all") -> ChannelResult:
        """Crawl a single URL with full browser rendering."""
        try:
            from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

            async with AsyncWebCrawler(config=BrowserConfig(headless=True, verbose=False)) as crawler:
                result = await crawler.arun(
                    url=url,
                    config=CrawlerRunConfig(cache_mode=CacheMode.ENABLED),
                )

                markdown_text = result.markdown.raw_markdown if hasattr(result.markdown, 'raw_markdown') else str(result.markdown)

                return ChannelResult(
                    success=True,
                    data={
                        "url": result.url,
                        "markdown": markdown_text[:50000],
                        "metadata": result.metadata if result.metadata else {},
                        "success": result.success,
                    },
                    source="Crawl4AI",
                )
        except ImportError:
            return ChannelResult(success=False, data={}, error="crawl4ai not installed. Run: pip install crawl4ai")
        except Exception as e:
            return ChannelResult(success=False, data={}, error=str(e))

    async def deep_crawl(self, start_url: str, max_depth: int = 2, max_pages: int = 10) -> ChannelResult:
        """Deep crawl a website using BFS strategy."""
        try:
            from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
            from crawl4ai.deep_crawling import BFSDeepCrawlStrategy

            strategy = BFSDeepCrawlStrategy(max_depth=max_depth, max_pages=max_pages)

            results = []
            async with AsyncWebCrawler(config=BrowserConfig(headless=True, verbose=False)) as crawler:
                async for result in await crawler.arun(
                    url=start_url,
                    config=CrawlerRunConfig(cache_mode=CacheMode.BYPASS, deep_crawl_strategy=strategy),
                ):
                    markdown_text = result.markdown.raw_markdown if hasattr(result.markdown, 'raw_markdown') else str(result.markdown)
                    results.append({
                        "url": result.url,
                        "markdown": markdown_text[:30000],
                        "success": result.success,
                    })

            return ChannelResult(success=True, data={"pages": results, "totalPages": len(results)}, source="Crawl4AI Deep Crawl")
        except ImportError:
            return ChannelResult(success=False, data={}, error="crawl4ai not installed")
        except Exception as e:
            return ChannelResult(success=False, data={}, error=str(e))

    async def extract_leads(self, url: str) -> ChannelResult:
        """Extract lead data (emails, phones, addresses) from a URL."""
        try:
            from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

            async with AsyncWebCrawler(config=BrowserConfig(headless=True, verbose=False)) as crawler:
                result = await crawler.arun(
                    url=url,
                    config=CrawlerRunConfig(cache_mode=CacheMode.BYPASS),
                )

                markdown_text = result.markdown.raw_markdown if hasattr(result.markdown, 'raw_markdown') else str(result.markdown)

                # Extract emails
                email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
                emails = list(set(re.findall(email_pattern, markdown_text)))

                # Extract phone numbers
                phone_pattern = r'(?:\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
                phones = list(set(re.findall(phone_pattern, markdown_text)))

                # Extract addresses (basic heuristic)
                address_pattern = r'\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd)[,\s]+[A-Za-z\s]+[,\.]\s*[A-Z]{2}\s+\d{5}'
                addresses = list(set(re.findall(address_pattern, markdown_text, re.IGNORECASE)))

                return ChannelResult(
                    success=True,
                    data={
                        "url": url,
                        "emails": emails,
                        "phones": phones,
                        "addresses": addresses,
                        "companyInfo": result.metadata or {},
                        "rawMarkdown": markdown_text[:50000],
                    },
                    source="Crawl4AI Lead Extraction",
                )
        except ImportError:
            return ChannelResult(success=False, data={}, error="crawl4ai not installed")
        except Exception as e:
            return ChannelResult(success=False, data={}, error=str(e))


# Channel instance
channel = Crawl4AIChannel()
