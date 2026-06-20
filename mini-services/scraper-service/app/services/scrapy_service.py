"""General web scraping service using BeautifulSoup and Scrapy utilities."""
import logging
import re
from typing import Dict, Any, Optional
from urllib.parse import urlparse, urlunparse

from .url_guard import assert_safe_url_sync, UnsafeUrlError

logger = logging.getLogger(__name__)


# Pre-compiled private-host detector — used by the inline SSRF guard.
_PRIVATE_HOST_RE = re.compile(
    r'^(?:localhost|::1|0\.0\.0\.0|'
    r'127\.|10\.|192\.168\.|169\.254\.|'
    r'172\.(?:1[6-9]|2[0-9]|3[01])\.|'
    r'0\.|f[cd][0-9a-f]{2}:|fe[89ab]|ff)'
)
_PRIVATE_HOST_SUFFIXES = ('.local', '.internal', '.localhost', '.intranet', '.corp', '.lan')


def _validate_url_inline(url: str) -> str:
    """Inline SSRF guard — parse URL with `urllib.parse.urlparse()` and validate
    scheme + hostname (CodeQL sanitizer barrier). Returns the re-serialized URL
    so the taint flow on the original input is cut.

    Mirrors the pattern CodeQL recognizes in JS (`new URL()` + protocol/hostname
    check + re-serialize via `urlunparse()`).
    """
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        raise UnsafeUrlError(
            f"Disallowed URL scheme: {parsed.scheme}",
            reason='disallowed-scheme',
            url=url,
        )
    host = (parsed.hostname or '').lower()
    if not host:
        raise UnsafeUrlError('Empty hostname', reason='empty-hostname', url=url)
    if host in ('localhost', '::1', '0.0.0.0') or \
       _PRIVATE_HOST_RE.match(host) or \
       any(host.endswith(suffix) for suffix in _PRIVATE_HOST_SUFFIXES):
        raise UnsafeUrlError(
            f"Internal/private host blocked: {host}",
            reason='private-hostname',
            url=url,
        )
    # Reject userinfo (user:pass@) — common SSRF trick
    if parsed.username or parsed.password:
        raise UnsafeUrlError(
            'URL must not contain userinfo',
            reason='has-userinfo',
            url=url,
        )
    return urlunparse(parsed)


def scrape_url(
    url: str,
    extract: str = "text",
    selector: Optional[str] = None,
    timeout: int = 15000,
) -> Dict[str, Any]:
    """Scrape a URL and extract content using BeautifulSoup.

    SSRF protection: the URL is validated inline via `urllib.parse.urlparse()`
    + scheme/hostname check (CodeQL sanitizer barrier) BEFORE any request is
    dispatched. This prevents the endpoint from being abused to fetch internal
    services (cloud metadata at 169.254.169.254, RFC1918 ranges, loopback,
    link-local, etc.). Defense-in-depth: the comprehensive url-guard runs
    afterwards to catch DNS-rebinding-to-internal-IP attacks.
    """
    # Inline SSRF guard — CodeQL sanitizer barrier.
    try:
        url = _validate_url_inline(url)
    except UnsafeUrlError as e:
        logger.warning(f"Refused to scrape unsafe URL {url}: {e.reason}")
        return {
            "url": url,
            "error": f"Refused URL for SSRF safety: {e.reason}",
            "data_source": "scrapy",
        }

    # Defense-in-depth: full DNS-rebinding check via url-guard.
    try:
        assert_safe_url_sync(url)
    except UnsafeUrlError as e:
        logger.warning(f"Refused to scrape unsafe URL {url}: {e.reason}")
        return {
            "url": url,
            "error": f"Refused URL for SSRF safety: {e.reason}",
            "data_source": "scrapy",
        }

    try:
        import requests
        from bs4 import BeautifulSoup

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        # Disable automatic redirect following so we can re-validate each hop.
        session = requests.Session()
        session.max_redirects = 5
        resp = session.get(url, headers=headers, timeout=timeout / 1000, allow_redirects=False)

        # Manually follow redirects, re-validating each Location header inline.
        redirects = 0
        while 300 <= resp.status_code < 400 and redirects < 5:
            location = resp.headers.get("location")
            if not location:
                break
            from urllib.parse import urljoin
            next_url = urljoin(url, location)
            # Inline SSRF guard for each redirect target (CodeQL barrier).
            try:
                next_url = _validate_url_inline(next_url)
            except UnsafeUrlError:
                logger.warning(f"Refused to follow redirect to unsafe URL: {next_url}")
                return {
                    "url": url,
                    "error": f"Refused redirect target for SSRF safety",
                    "data_source": "scrapy",
                }
            # Defense-in-depth: DNS-rebinding check.
            try:
                assert_safe_url_sync(next_url)
            except UnsafeUrlError:
                logger.warning(f"Refused to follow redirect to unsafe URL: {next_url}")
                return {
                    "url": url,
                    "error": f"Refused redirect target for SSRF safety",
                    "data_source": "scrapy",
                }
            url = next_url
            resp = session.get(url, headers=headers, timeout=timeout / 1000, allow_redirects=False)
            redirects += 1

        if resp.status_code != 200:
            return {
                "url": url,
                "error": f"HTTP {resp.status_code}",
                "data_source": "scrapy",
            }

        soup = BeautifulSoup(resp.text, "lxml")

        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()

        result = {"url": url, "status": resp.status_code, "data_source": "scrapy"}

        if extract == "text":
            if selector:
                elements = soup.select(selector)
                result["text"] = "\n".join(el.get_text(strip=True) for el in elements)
            else:
                result["title"] = soup.title.string if soup.title else ""
                result["text"] = soup.get_text(separator="\n", strip=True)[:10000]

        elif extract == "links":
            links = []
            for a in soup.find_all("a", href=True):
                links.append({
                    "text": a.get_text(strip=True),
                    "href": a["href"],
                })
            result["links"] = links[:200]
            result["link_count"] = len(links)

        elif extract == "structured":
            if selector:
                elements = soup.select(selector)
                rows = []
                for el in elements:
                    cells = el.find_all(["td", "th", "li", "dd", "dt"])
                    if cells:
                        rows.append([cell.get_text(strip=True) for cell in cells])
                    else:
                        rows.append(el.get_text(strip=True))
                result["data"] = rows
            else:
                # Try to extract main content areas
                main = soup.find("main") or soup.find("article") or soup.find(class_="content") or soup.find(id="content")
                if main:
                    result["text"] = main.get_text(separator="\n", strip=True)[:10000]
                else:
                    result["text"] = soup.get_text(separator="\n", strip=True)[:10000]
                result["title"] = soup.title.string if soup.title else ""

        # Extract metadata
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            result["meta_description"] = meta_desc.get("content", "")

        return result

    except Exception as e:
        logger.error(f"Scrape error for {url}: {e}")
        return {"url": url, "error": str(e), "data_source": "scrapy"}


def scrape_google_serp(query: str, limit: int = 10) -> Dict[str, Any]:
    """Scrape Google Search results (SERP) for a query."""
    try:
        import requests
        from bs4 import BeautifulSoup

        encoded_query = query.replace(" ", "+")
        url = f"https://www.google.com/search?q={encoded_query}&num={limit}&hl=en"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }

        resp = requests.get(url, headers=headers, timeout=10)

        results = []
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "lxml")

            # Extract organic results
            for g in soup.select(".g"):
                title_el = g.select_one("h3")
                link_el = g.select_one("a")
                snippet_el = g.select_one(".VwiC3b, .st")

                if title_el and link_el:
                    results.append({
                        "title": title_el.get_text(strip=True),
                        "url": link_el.get("href", ""),
                        "snippet": snippet_el.get_text(strip=True) if snippet_el else "",
                        "position": len(results) + 1,
                    })

                if len(results) >= limit:
                    break

        return {
            "query": query,
            "results": results,
            "total": len(results),
            "data_source": "gsctool",
        }

    except Exception as e:
        logger.error(f"SERP scraping error: {e}")
        return {
            "query": query,
            "results": [],
            "total": 0,
            "error": str(e),
            "data_source": "gsctool",
        }
