#!/usr/bin/env python3
"""
crawl4ai-service — long-lived local HTTP service that exposes the FULL
unclecode/crawl4ai 0.9.x API surface to the Agent Reach Next.js platform.

Why a service instead of subprocess-per-call?
  - Spawning a Python interpreter + initializing Playwright + AsyncWebCrawler
    takes 1-3 seconds. With a long-lived service we pay that cost ONCE at boot
    and every subsequent crawl is ~10x faster.
  - Lets us keep a single AsyncWebCrawler instance warm (with browser pool).
  - Enables deep-crawl streaming and large markdown responses without the
    20MB exec() buffer cap that subprocess mode hits.
  - Provides a single health-checkable endpoint for the Node.js side.

Endpoints
---------
  GET  /health                 -> {"status": "ok", "version": "...", "browser_ready": bool}
  POST /crawl                  -> single URL crawl (markdown/html/links/metadata)
  POST /deep-crawl             -> multi-page BFS/DFS/BestFirst crawl
  POST /extract-css            -> JsonCssExtractionStrategy
  POST /extract-xpath          -> JsonXPathExtractionStrategy
  POST /extract-llm            -> LLMExtractionStrategy (requires LLMConfig)
  POST /extract-regex          -> RegexExtractionStrategy
  POST /sitemap                -> generate a sitemap via deep crawl (URLs only)
  POST /screenshot             -> capture full-page screenshot (PNG, base64)
  POST /pdf                    -> capture full-page PDF (base64)
  GET  /shutdown               -> graceful shutdown

All POST bodies are JSON. Responses are JSON. Errors return HTTP 500 with
{"error": "...", "traceback": "..."}.

Usage:
  python3 server.py --port 8765 --host 127.0.0.1

Environment variables:
  CRAWL4AI_SERVICE_PORT   (default 8765)
  CRAWL4AI_SERVICE_HOST   (default 127.0.0.1)
  ZHIPU_API_KEY           (used for LLM-based extraction if needed)
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import logging
import os
import signal
import sys
import traceback
import types
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional, Tuple, Union

# Ensure the vendored crawl4ai source is importable
CRAWL4AI_SRC = "/home/z/my-project/lib/crawl4ai-source"
if CRAWL4AI_SRC not in sys.path:
    sys.path.insert(0, CRAWL4AI_SRC)

# Import crawl4ai lazily-at-module-load so import failures are caught early
import crawl4ai  # noqa: E402
from crawl4ai import (  # noqa: E402
    AsyncWebCrawler,
    BrowserConfig,
    CrawlerRunConfig,
    CacheMode,
    LLMConfig,
    ProxyConfig,
)
from crawl4ai.extraction_strategy import (  # noqa: E402
    JsonCssExtractionStrategy,
    JsonXPathExtractionStrategy,
    LLMExtractionStrategy,
    RegexExtractionStrategy,
)
from crawl4ai.deep_crawling import (  # noqa: E402
    BFSDeepCrawlStrategy,
    DFSDeepCrawlStrategy,
    BestFirstCrawlingStrategy,
)
from crawl4ai.deep_crawling.scorers import (  # noqa: E402
    KeywordRelevanceScorer,
)
from crawl4ai.content_filter_strategy import (  # noqa: E402
    PruningContentFilter,
    BM25ContentFilter,
)
from crawl4ai.chunking_strategy import (  # noqa: E402
    RegexChunking,
    SlidingWindowChunking,
    OverlappingWindowChunking,
    FixedLengthWordChunking,
    NlpSentenceChunking,
    TopicSegmentationChunking,
)
from crawl4ai.markdown_generation_strategy import (  # noqa: E402
    DefaultMarkdownGenerator,
)

logger = logging.getLogger("crawl4ai-service")
logging.basicConfig(
    level=os.environ.get("CRAWL4AI_SERVICE_LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# ---------------------------------------------------------------------------
# Global state — single AsyncWebCrawler instance kept warm for the lifetime
# of the service. AsyncWebCrawler is internally safe to share across
# concurrent crawls (it has a browser pool).
# ---------------------------------------------------------------------------
_crawler: Optional[AsyncWebCrawler] = None
_crawler_lock = asyncio.Lock()
_server_loop: Optional[asyncio.AbstractEventLoop] = None
_shutdown_event = asyncio.Event()

CRAWL4AI_VERSION = getattr(crawl4ai, "__version__", "unknown")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _to_bool(v: Any, default: bool = False) -> bool:
    if v is None:
        return default
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.lower() in ("1", "true", "yes", "on", "y")
    if isinstance(v, (int, float)):
        return bool(v)
    return default


def _build_browser_config(opts: Dict[str, Any]) -> BrowserConfig:
    """Build a BrowserConfig from request options."""
    return BrowserConfig(
        headless=_to_bool(opts.get("headless"), True),
        browser_type=opts.get("browser_type", "chromium"),
        viewport_width=int(opts.get("viewport_width", 1280)),
        viewport_height=int(opts.get("viewport_height", 800)),
        user_agent=opts.get("user_agent"),
        user_agent_mode=opts.get("user_agent_mode"),
        user_agent_generator_config=opts.get("user_agent_generator_config") or {},
        proxy=ProxyConfig(
            server=opts["proxy"]["server"],
            username=opts["proxy"].get("username"),
            password=opts["proxy"].get("password"),
        ) if opts.get("proxy") else None,
        verbose=_to_bool(opts.get("verbose"), False),
        accept_downloads=_to_bool(opts.get("accept_downloads"), False),
        java_script_enabled=_to_bool(opts.get("java_script_enabled"), True),
        extra_args=opts.get("extra_args") or None,
        headers=opts.get("headers") or None,
        cookies=opts.get("cookies") or None,
        light_mode=_to_bool(opts.get("light_mode"), False),
        text_mode=_to_bool(opts.get("text_mode") or opts.get("text_only"), False),
        use_managed_browser=_to_bool(opts.get("use_managed_browser"), False),
        cdp_url=opts.get("cdp_url"),
        debugging_port=int(opts["debugging_port"]) if opts.get("debugging_port") else 9222,
        enable_stealth=_to_bool(opts.get("enable_stealth"), False),
        ignore_https_errors=_to_bool(opts.get("ignore_https_errors"), True),
        memory_saving_mode=_to_bool(opts.get("memory_saving_mode"), False),
        max_pages_before_recycle=int(opts.get("max_pages_before_recycle", 0)),
        sleep_on_close=_to_bool(opts.get("sleep_on_close"), False),
        browser_mode=opts.get("browser_mode", "dedicated"),
        chrome_channel=opts.get("chrome_channel", "chromium"),
    )


def _build_run_config(opts: Dict[str, Any]) -> CrawlerRunConfig:
    """Build a CrawlerRunConfig from request options."""
    extraction_strategy = _build_extraction_strategy(opts.get("extraction"))
    content_filter = _build_content_filter(opts.get("content_filter"))
    chunking_strategy = _build_chunking_strategy(opts.get("chunking"))
    deep_crawl = _build_deep_crawl_strategy(opts.get("deep_crawl"))

    # Markdown generator with optional content filter
    md_generator = DefaultMarkdownGenerator(content_filter=content_filter) if content_filter else None

    return CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS if _to_bool(opts.get("bypass_cache"), True) else CacheMode.ENABLED,
        page_timeout=int(opts.get("page_timeout", 60000)),
        wait_for=opts.get("wait_for"),
        wait_for_timeout=int(opts.get("wait_for_timeout", 0)) or None,
        wait_until=opts.get("wait_until", "domcontentloaded"),
        delay_before_return_html=float(opts.get("delay_before_return_html", 0.1)),
        js_code=opts.get("js_code"),
        js_only=_to_bool(opts.get("js_only"), False),
        extraction_strategy=extraction_strategy,
        chunking_strategy=chunking_strategy,
        markdown_generator=md_generator,
        css_selector=opts.get("css_selector"),
        target_elements=opts.get("target_elements"),
        excluded_tags=opts.get("excluded_tags"),
        excluded_selector=opts.get("excluded_selector"),
        word_count_threshold=int(opts.get("word_count_threshold", 200)),
        exclude_external_links=_to_bool(opts.get("exclude_external_links"), False),
        exclude_social_media_domains=opts.get("exclude_social_media_domains"),
        exclude_domains=opts.get("exclude_domains"),
        remove_overlay_elements=_to_bool(opts.get("remove_overlay_elements"), False),
        process_iframes=_to_bool(opts.get("process_iframes"), False),
        flatten_shadow_dom=_to_bool(opts.get("flatten_shadow_dom"), False),
        scan_full_page=_to_bool(opts.get("scan_full_page"), False),
        scroll_delay=float(opts.get("scroll_delay", 0.2)) if opts.get("scroll_delay") else None,
        screenshot=_to_bool(opts.get("screenshot"), False),
        pdf=_to_bool(opts.get("pdf"), False),
        screenshot_wait_for=opts.get("screenshot_wait_for"),
        verbose=_to_bool(opts.get("verbose"), False),
        stream=_to_bool(opts.get("stream"), False),
        mean_delay=float(opts.get("mean_delay", 0.1)),
        max_range=float(opts.get("max_range", 0.3)),
        session_id=opts.get("session_id"),
        magic=_to_bool(opts.get("magic"), False),
        simulate_user=_to_bool(opts.get("simulate_user"), False),
        override_navigator=_to_bool(opts.get("override_navigator"), False),
        remove_consent_popups=_to_bool(opts.get("remove_consent_popups"), False),
        adjust_viewport_to_content=_to_bool(opts.get("adjust_viewport_to_content"), False),
        only_text=_to_bool(opts.get("only_text"), False),
        user_agent=opts.get("user_agent"),
        user_agent_mode=opts.get("user_agent_mode"),
        deep_crawl_strategy=deep_crawl,
        max_retries=int(opts.get("max_retries", 3)),
        check_robots_txt=_to_bool(opts.get("check_robots_txt"), False),
    )


def _build_extraction_strategy(spec: Optional[Dict[str, Any]]):
    if not spec:
        return None
    kind = spec.get("type", "").lower()
    if kind == "css":
        return JsonCssExtractionStrategy(schema=spec.get("schema", {}))
    if kind == "xpath":
        return JsonXPathExtractionStrategy(schema=spec.get("schema", {}))
    if kind == "regex":
        return RegexExtractionStrategy(pattern=spec["pattern"])
    if kind == "llm":
        llm_cfg = spec.get("llm_config") or {}
        # LLMConfig.provider uses litellm's "provider/model" format.
        # Z.AI (Zhipu) is reached via the OpenAI-compatible endpoint:
        #   provider = "openai/glm-4.7-flash"
        #   base_url = "https://open.bigmodel.cn/api/paas/v4/"
        #   api_token = ZHIPU_API_KEY
        # unclecode-litellm 1.81.x does NOT have a native "zhipu-tls" provider,
        # so the OpenAI-compatible path is the only working option.
        provider = llm_cfg.get("provider", "openai/glm-4.7-flash")
        api_key = (llm_cfg.get("api_key")
                   or os.environ.get("ZHIPU_API_KEY")
                   or os.environ.get("OPENAI_API_KEY")
                   or "")
        base_url = llm_cfg.get("base_url") or "https://open.bigmodel.cn/api/paas/v4/"
        return LLMExtractionStrategy(
            llm_config=LLMConfig(
                provider=provider,
                api_token=api_key,
                base_url=base_url,
                temperature=float(llm_cfg["temperature"]) if llm_cfg.get("temperature") is not None else None,
                max_tokens=int(llm_cfg["max_tokens"]) if llm_cfg.get("max_tokens") is not None else None,
            ),
            schema=spec.get("schema"),
            instruction=spec.get("instruction", ""),
            extraction_type=spec.get("extraction_type", "block"),
            chunk_token_threshold=int(spec.get("chunk_token_threshold", 1200)),
            apply_chunking=_to_bool(spec.get("apply_chunking"), True),
            input_format=spec.get("input_format", "markdown"),
            extra_args=spec.get("extra_args") or {},
        )
    return None


def _build_content_filter(spec: Optional[Dict[str, Any]]):
    if not spec:
        return None
    kind = spec.get("type", "").lower()
    if kind == "pruning":
        return PruningContentFilter(
            threshold=float(spec.get("threshold", 0.48)),
            threshold_type=spec.get("threshold_type", "fixed"),
            min_word_threshold=int(spec.get("min_word_threshold", 10)),
        )
    if kind == "bm25":
        return BM25ContentFilter(
            user_query=spec.get("query", ""),
            bm25_threshold=float(spec.get("threshold", 1.0)),
        )
    return None


def _build_chunking_strategy(spec: Optional[Dict[str, Any]]):
    if not spec:
        return None
    kind = spec.get("type", "").lower()
    if kind == "regex":
        return RegexChunking(patterns=spec.get("patterns", [r"\n\n"]))
    if kind == "sliding_window":
        return SlidingWindowChunking(
            window_size=int(spec.get("window_size", 1000)),
            step=int(spec.get("step", 500)),
        )
    if kind in ("semantic", "topic"):
        # TopicSegmentationChunking — local NLP, no API key required
        try:
            return TopicSegmentationChunking(
                num_sentences=int(spec.get("num_sentences", 12)),
                overlap=int(spec.get("overlap", 3)),
            )
        except Exception as e:
            logger.warning(f"Topic segmentation chunking unavailable: {e}")
            return None
    if kind == "nlp_sentence":
        return NlpSentenceChunking(
            num_sentences=int(spec.get("num_sentences", 12)),
            overlap=int(spec.get("overlap", 3)),
        )
    if kind == "fixed_word":
        return FixedLengthWordChunking(
            chunk_size=int(spec.get("chunk_size", 1000)),
        )
    if kind == "overlapping_window":
        return OverlappingWindowChunking(
            window_size=int(spec.get("window_size", 1000)),
            step=int(spec.get("step", 500)),
            overlap=int(spec.get("overlap", 100)),
        )
    return None


def _build_deep_crawl_strategy(spec: Optional[Dict[str, Any]]):
    if not spec:
        return None
    kind = spec.get("type", "").lower()
    max_depth = int(spec.get("max_depth", 1))
    max_pages = int(spec.get("max_pages", 10))
    if kind == "bfs":
        return BFSDeepCrawlStrategy(max_depth=max_depth, max_pages=max_pages)
    if kind == "dfs":
        return DFSDeepCrawlStrategy(max_depth=max_depth, max_pages=max_pages)
    if kind in ("best_first", "best-first", "bestfirst"):
        scorer_spec = spec.get("scorer", {})
        scorer = KeywordRelevanceScorer(
            keywords=scorer_spec.get("keywords", []),
            weight=scorer_spec.get("weight", 1.0),
        )
        return BestFirstCrawlingStrategy(
            max_depth=max_depth,
            max_pages=max_pages,
            url_scorer=scorer,
            keyphrases=scorer_spec.get("keyphrases"),
        )
    return None


def _serialize_crawl_result(result: Any) -> Dict[str, Any]:
    """Normalize a CrawlResult into a JSON-serializable dict."""
    md = getattr(result, "markdown", None)
    md_raw = ""
    md_fit = ""
    if md is not None:
        md_raw = getattr(md, "raw_markdown", "") or ""
        md_fit = getattr(md, "fit_markdown", "") or ""
        # If markdown is a string (older API), use it as raw
        if isinstance(md, str):
            md_raw = md
    media = getattr(result, "media", None) or {}
    links = getattr(result, "links", None) or {}

    return {
        "url": getattr(result, "url", ""),
        "success": bool(getattr(result, "success", False)),
        "status_code": getattr(result, "status_code", None),
        "response_headers": dict(getattr(result, "response_headers", {}) or {}),
        "markdown": md_raw,
        "markdown_fit": md_fit,
        "html": getattr(result, "html", "") or "",
        "cleaned_html": getattr(result, "cleaned_html", "") or "",
        "media": {
            "images": media.get("images", []) if isinstance(media, dict) else [],
            "videos": media.get("videos", []) if isinstance(media, dict) else [],
            "audio": media.get("audio", []) if isinstance(media, dict) else [],
        },
        "links": {
            "internal": links.get("internal", []) if isinstance(links, dict) else [],
            "external": links.get("external", []) if isinstance(links, dict) else [],
        },
        "metadata": dict(getattr(result, "metadata", {}) or {}),
        "extracted_content": getattr(result, "extracted_content", None),
        "screenshot": getattr(result, "screenshot", None),
        "pdf": getattr(result, "pdf", None),
        "error_message": getattr(result, "error_message", None),
        "session_id": getattr(result, "session_id", None),
        "total_tokens": getattr(result, "total_tokens", None),
    }


# ---------------------------------------------------------------------------
# Crawler lifecycle
# ---------------------------------------------------------------------------
async def get_crawler(browser_opts: Optional[Dict[str, Any]] = None) -> AsyncWebCrawler:
    """Get (or lazily create) the shared AsyncWebCrawler instance."""
    global _crawler
    async with _crawler_lock:
        if _crawler is None or browser_opts is not None:
            # If custom browser opts provided, create a transient crawler
            if browser_opts is not None:
                bc = _build_browser_config(browser_opts)
                c = AsyncWebCrawler(config=bc)
                await c.start()
                return c
            # Default shared crawler
            _crawler = AsyncWebCrawler()
            await _crawler.start()
            logger.info("AsyncWebCrawler started (version=%s)", CRAWL4AI_VERSION)
        return _crawler


async def shutdown_crawler() -> None:
    global _crawler
    async with _crawler_lock:
        if _crawler is not None:
            try:
                await _crawler.aclose()
            except Exception:
                pass
            _crawler = None


# ---------------------------------------------------------------------------
# Operation handlers
# ---------------------------------------------------------------------------
async def handle_crawl(body: Dict[str, Any]) -> Dict[str, Any]:
    url = body.get("url")
    if not url:
        raise ValueError("Missing 'url'")
    browser_opts = body.get("browser_config")
    run_opts = body.get("crawler_config") or {}
    crawler = await get_crawler(browser_opts)
    run_cfg = _build_run_config(run_opts)
    result = await crawler.arun(url=url, config=run_cfg)
    serialized = _serialize_crawl_result(result)
    # Cleanup transient crawler if browser_opts were provided
    if browser_opts is not None:
        try:
            await crawler.aclose()
        except Exception:
            pass
    return serialized


async def handle_deep_crawl(body: Dict[str, Any]) -> Dict[str, Any]:
    url = body.get("url")
    if not url:
        raise ValueError("Missing 'url'")
    browser_opts = body.get("browser_config")
    deep_spec = body.get("deep_crawl") or {"type": "bfs", "max_depth": 1, "max_pages": 5}
    run_opts = body.get("crawler_config") or {}
    run_opts["deep_crawl"] = deep_spec
    crawler = await get_crawler(browser_opts)
    run_cfg = _build_run_config(run_opts)
    # crawl4ai returns an async iterator when stream=True, list when stream=False
    results = await crawler.arun(url=url, config=run_cfg)
    if hasattr(results, "__aiter__"):
        # Streaming mode — collect into list
        collected = []
        async for r in results:
            collected.append(_serialize_crawl_result(r))
        results = collected
    elif not isinstance(results, list):
        results = [results]
    serialized = [_serialize_crawl_result(r) for r in results] if all(not isinstance(r, dict) for r in results) else results
    return {
        "pages": serialized,
        "total_pages": len(serialized),
        "urls": [p["url"] for p in serialized],
    }


async def handle_extract_css(body: Dict[str, Any]) -> Dict[str, Any]:
    body = dict(body)
    body.setdefault("crawler_config", {})
    body["crawler_config"]["extraction"] = {"type": "css", "schema": body.get("schema", {})}
    return await handle_crawl(body)


async def handle_extract_xpath(body: Dict[str, Any]) -> Dict[str, Any]:
    body = dict(body)
    body.setdefault("crawler_config", {})
    body["crawler_config"]["extraction"] = {"type": "xpath", "schema": body.get("schema", {})}
    return await handle_crawl(body)


async def handle_extract_llm(body: Dict[str, Any]) -> Dict[str, Any]:
    body = dict(body)
    body.setdefault("crawler_config", {})
    body["crawler_config"]["extraction"] = {
        "type": "llm",
        "schema": body.get("schema"),
        "instruction": body.get("instruction", ""),
        "extraction_type": body.get("extraction_type", "block"),
        "llm_config": body.get("llm_config", {}),
        "input_format": body.get("input_format", "markdown"),
    }
    return await handle_crawl(body)


async def handle_extract_regex(body: Dict[str, Any]) -> Dict[str, Any]:
    body = dict(body)
    body.setdefault("crawler_config", {})
    body["crawler_config"]["extraction"] = {"type": "regex", "pattern": body.get("pattern", "")}
    return await handle_crawl(body)


async def handle_sitemap(body: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a sitemap by deep-crawling and returning just URLs/titles."""
    url = body.get("url")
    if not url:
        raise ValueError("Missing 'url'")
    deep_spec = body.get("deep_crawl") or {"type": "bfs", "max_depth": 2, "max_pages": 50}
    run_opts = body.get("crawler_config") or {}
    run_opts["deep_crawl"] = deep_spec
    crawler = await get_crawler(body.get("browser_config"))
    run_cfg = _build_run_config(run_opts)
    results = await crawler.arun(url=url, config=run_cfg)
    if hasattr(results, "__aiter__"):
        collected = []
        async for r in results:
            collected.append(r)
        results = collected
    elif not isinstance(results, list):
        results = [results]
    urls = []
    for r in results:
        meta = getattr(r, "metadata", {}) or {}
        urls.append({
            "url": getattr(r, "url", ""),
            "title": meta.get("title", "") if isinstance(meta, dict) else "",
            "depth": getattr(r, "depth", 0) or 0,
        })
    return {
        "urls": urls,
        "total_pages": len(urls),
        "max_depth": max((u["depth"] for u in urls), default=0),
    }


async def handle_screenshot(body: Dict[str, Any]) -> Dict[str, Any]:
    body = dict(body)
    body.setdefault("crawler_config", {})
    body["crawler_config"]["screenshot"] = True
    result = await handle_crawl(body)
    return {
        "url": result["url"],
        "success": result["success"],
        "screenshot": result.get("screenshot"),
        "status_code": result["status_code"],
        "error": result.get("error_message"),
    }


async def handle_pdf(body: Dict[str, Any]) -> Dict[str, Any]:
    body = dict(body)
    body.setdefault("crawler_config", {})
    body["crawler_config"]["pdf"] = True
    result = await handle_crawl(body)
    return {
        "url": result["url"],
        "success": result["success"],
        "pdf": result.get("pdf"),
        "status_code": result["status_code"],
        "error": result.get("error_message"),
    }


async def handle_status() -> Dict[str, Any]:
    return {
        "status": "ok",
        "version": CRAWL4AI_VERSION,
        "browser_ready": _crawler is not None,
        "python_version": sys.version.split()[0],
        "crawl4ai_path": crawl4ai.__file__,
    }


# ---------------------------------------------------------------------------
# HTTP server (threaded) + async dispatch bridge
# ---------------------------------------------------------------------------
ROUTES: Dict[str, Tuple[str, Any]] = {
    "/health":         ("GET",  handle_status),
    "/crawl":          ("POST", handle_crawl),
    "/deep-crawl":     ("POST", handle_deep_crawl),
    "/extract-css":    ("POST", handle_extract_css),
    "/extract-xpath":  ("POST", handle_extract_xpath),
    "/extract-llm":    ("POST", handle_extract_llm),
    "/extract-regex":  ("POST", handle_extract_regex),
    "/sitemap":        ("POST", handle_sitemap),
    "/screenshot":     ("POST", handle_screenshot),
    "/pdf":            ("POST", handle_pdf),
}


class Handler(BaseHTTPRequestHandler):
    server_version = "crawl4ai-service/1.0"

    def log_message(self, fmt, *args):  # silence default stderr spam
        logger.info("%s - %s", self.address_string(), fmt % args)

    def _send_json(self, code: int, payload: Any) -> None:
        body = json.dumps(payload, default=str).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length") or 0)
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON body: {e}")

    def do_GET(self):
        if self.path == "/shutdown":
            self._send_json(200, {"status": "shutting down"})
            logger.info("Shutdown requested")
            # Schedule shutdown on the main loop
            if _server_loop:
                _server_loop.call_soon_threadsafe(_shutdown_event.set)
            return
        route = ROUTES.get(self.path)
        if not route or route[0] != "GET":
            self._send_json(404, {"error": f"Unknown route: {self.path}"})
            return
        try:
            fut = asyncio.run_coroutine_threadsafe(route[1](), _server_loop)
            result = fut.result(timeout=30)
            self._send_json(200, result)
        except Exception as e:
            self._send_json(500, {"error": str(e), "traceback": traceback.format_exc()})

    def do_POST(self):
        route = ROUTES.get(self.path)
        if not route or route[0] != "POST":
            self._send_json(404, {"error": f"Unknown route: {self.path}"})
            return
        try:
            body = self._read_body()
        except ValueError as e:
            self._send_json(400, {"error": str(e)})
            return
        try:
            fut = asyncio.run_coroutine_threadsafe(route[1](body), _server_loop)
            # Allow up to 5 minutes for deep crawls
            result = fut.result(timeout=300)
            self._send_json(200, result)
        except Exception as e:
            logger.exception("Handler error for %s", self.path)
            self._send_json(500, {"error": str(e), "traceback": traceback.format_exc()})


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
async def _amain(host: str, port: int) -> None:
    global _server_loop
    _server_loop = asyncio.get_running_loop()
    # Pre-warm the crawler
    try:
        await get_crawler()
        logger.info("Crawler pre-warmed")
    except Exception:
        logger.exception("Failed to pre-warm crawler — will lazy-init on first request")
    server = ThreadingHTTPServer((host, port), Handler)
    logger.info("crawl4ai-service listening on http://%s:%d (version=%s)", host, port, CRAWL4AI_VERSION)
    # Run server in a thread, await shutdown signal
    import threading
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    try:
        await _shutdown_event.wait()
    finally:
        logger.info("Shutting down HTTP server...")
        server.shutdown()
        await shutdown_crawler()
        logger.info("Goodbye.")


def main() -> None:
    parser = argparse.ArgumentParser(description="crawl4ai-service")
    parser.add_argument("--host", default=os.environ.get("CRAWL4AI_SERVICE_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("CRAWL4AI_SERVICE_PORT", "8765")))
    args = parser.parse_args()

    # Handle SIGTERM gracefully (so systemd/docker can stop us cleanly)
    def _sig(*_):
        if _server_loop:
            _server_loop.call_soon_threadsafe(_shutdown_event.set)

    try:
        signal.signal(signal.SIGTERM, _sig)
        signal.signal(signal.SIGINT, _sig)
    except (ValueError, AttributeError):
        pass

    try:
        asyncio.run(_amain(args.host, args.port))
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
