"""General web scraping service using BeautifulSoup and Scrapy utilities."""
import logging
from typing import Dict, Any, Optional

from .url_guard import assert_safe_url_sync, UnsafeUrlError

logger = logging.getLogger(__name__)


def scrape_url(
    url: str,
    extract: str = "text",
    selector: Optional[str] = None,
    timeout: int = 15000,
) -> Dict[str, Any]:
    """Scrape a URL and extract content using BeautifulSoup.

    SSRF protection: the URL is validated via `assert_safe_url_sync()`
    before any request is dispatched. This prevents the endpoint from
    being abused to fetch internal services (cloud metadata at
    169.254.169.254, RFC1918 ranges, loopback, link-local, etc.).
    """
    # SSRF guard — refuse internal/private hosts before fetching.
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

        # Manually follow redirects, re-validating each Location header.
        redirects = 0
        while 300 <= resp.status_code < 400 and redirects < 5:
            location = resp.headers.get("location")
            if not location:
                break
            from urllib.parse import urljoin
            next_url = urljoin(url, location)
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
