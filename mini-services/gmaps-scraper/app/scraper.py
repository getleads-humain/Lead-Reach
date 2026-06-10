"""Core Google Maps scraper using Playwright with APP_INITIALIZATION_STATE extraction."""
import asyncio
import json
import re
import hashlib
import time
import logging
from typing import Optional, List, Dict, Any, Tuple

try:
    from playwright.async_api import async_playwright, Browser, Page, BrowserContext
except ImportError:
    async_playwright = None
    Browser = Page = BrowserContext = None

from app.models import GmapsBusiness, GmapsImage, GmapsLinkSource, GmapsOwner, GmapsCompleteAddress, GmapsAbout, GmapsAboutOption, GmapsReview

logger = logging.getLogger("gmaps-scraper")

# JavaScript to extract Google Maps internal data
EXTRACT_JS = """
async () => {
    try {
        // Method 1: Extract from APP_INITIALIZATION_STATE
        const appState = window.APP_INITIALIZATION_STATE;
        if (appState && appState.length > 3) {
            for (let i = 0; i < appState.length; i++) {
                try {
                    const raw = typeof appState[i] === 'string' ? appState[i] : JSON.stringify(appState[i]);
                    const prefix = ")]}'";
                    const cleaned = raw.startsWith(prefix) ? raw.substring(prefix.length) : raw;
                    const data = JSON.parse(cleaned);
                    if (data && typeof data === 'object') return { method: 'APP_STATE', index: i, data: data };
                } catch(e) { continue; }
            }
        }

        // Method 2: Extract from page content via DOM
        const titleEl = document.querySelector('h1.DUwDvf, h1.fontHeadlineLarge');
        const categoryEl = document.querySelector('button[jsaction*="category"] .fontBodyMedium');
        const ratingEl = document.querySelector('div.F7nice span[aria-label]');
        const reviewCountEl = document.querySelector('div.F7nice button span[aria-label]');
        const addressEl = document.querySelector('button[data-item-id*="address"] .fontBodyMedium');
        const phoneEl = document.querySelector('button[data-item-id*="phone"] .fontBodyMedium');
        const websiteEl = document.querySelector('a[data-item-id*="authority"] .fontBodyMedium');
        const hoursEl = document.querySelector('div[aria-label*="Hours"]');

        const result = {
            method: 'DOM',
            data: {
                title: titleEl?.textContent?.trim() || '',
                category: categoryEl?.textContent?.trim() || '',
                address: addressEl?.textContent?.trim() || '',
                phone: phoneEl?.textContent?.trim() || '',
                website: websiteEl?.textContent?.trim() || '',
                rating_text: ratingEl?.getAttribute('aria-label') || '',
                review_count_text: reviewCountEl?.getAttribute('aria-label') || '',
            }
        };
        return result;
    } catch(e) {
        return { method: 'ERROR', error: e.message };
    }
}
"""

# JavaScript to scroll the results list
SCROLL_JS = """
async (depth) => {
    const feed = document.querySelector('div[role="feed"]');
    if (!feed) return { scrolled: false, reason: 'no feed' };

    let lastHeight = feed.scrollHeight;
    for (let i = 0; i < depth; i++) {
        feed.scrollTop = feed.scrollHeight;
        await new Promise(r => setTimeout(r, Math.min(200 + i * 100, 2000)));
        const newHeight = feed.scrollHeight;
        if (newHeight === lastHeight) break;
        lastHeight = newHeight;
    }
    return { scrolled: true, depth: depth };
}
"""

# JavaScript to click reject cookies
REJECT_COOKIES_JS = """
async () => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
        const text = btn.textContent.toLowerCase();
        if (text.includes('reject') || text.includes('decline') || text.includes('ablehnen') || text.includes('refuse')) {
            btn.click();
            await new Promise(r => setTimeout(r, 500));
            return true;
        }
    }
    return false;
}
"""


def safe_get(data: Any, *keys, default=None):
    """Safely navigate nested dicts/lists."""
    current = data
    for key in keys:
        try:
            current = current[key]
        except (KeyError, IndexError, TypeError):
            return default
    return current


def parse_app_state(data: Any) -> GmapsBusiness:
    """Parse APP_INITIALIZATION_STATE data into GmapsBusiness."""
    biz = GmapsBusiness()

    # The data structure is deeply nested with array indices
    # Based on reverse engineering of google-maps-scraper
    darray = data if isinstance(data, list) else [data]

    # Try to find the place data in the nested structure
    place_data = None
    if isinstance(data, dict):
        # Look for the place data array
        for key in data:
            val = data[key]
            if isinstance(val, list) and len(val) > 0:
                for item in val:
                    if isinstance(item, list) and len(item) > 0:
                        for sub in item:
                            if isinstance(sub, list) and len(sub) > 6:
                                place_data = sub
                                break
                    if place_data:
                        break
            if place_data:
                break

    if not place_data:
        # Try flat dictionary extraction
        _extract_from_dict(data, biz)
        return biz

    # Extract fields from the array structure
    try:
        biz.title = safe_get(place_data, 14, default="") or ""
        biz.category = safe_get(place_data, 38, default="") or ""
        biz.address = safe_get(place_data, 2, default="") or ""
        biz.phone = safe_get(place_data, 178, 0, 0, default="") or ""
        biz.website = safe_get(place_data, 134, 0, default="") or ""
        biz.description = safe_get(place_data, 32, default="") or ""
        biz.status = safe_get(place_data, 34, 4, default="") or ""
        biz.timezone = safe_get(place_data, 30, default="") or ""
        biz.price_range = safe_get(place_data, 4, default="") or ""

        # Coordinates
        lat = safe_get(place_data, 9, 2, default=0)
        lng = safe_get(place_data, 9, 3, default=0)
        if lat and lng:
            biz.latitude = float(lat)
            biz.longitude = float(lng)

        # Reviews
        biz.review_count = safe_get(place_data, 4, 8, default=0) or 0
        biz.review_rating = safe_get(place_data, 4, 7, default=0.0) or 0.0

        # Place IDs
        biz.data_id = safe_get(place_data, 78, default="") or ""
        biz.place_id = safe_get(place_data, 78, default="") or ""
        biz.cid = safe_get(place_data, 66, 10, default="") or ""

        # Plus code
        biz.plus_code = safe_get(place_data, 183, 2, 2, 1, default="") or ""

        # Thumbnail
        biz.thumbnail = safe_get(place_data, 183, 2, 2, 0, default="") or ""

        # Images
        images_data = safe_get(place_data, 183, 2, 2, default=[])
        if isinstance(images_data, list):
            for img in images_data[:5]:
                if isinstance(img, (list, str)):
                    url = img[0] if isinstance(img, list) and len(img) > 0 else str(img)
                    if url and isinstance(url, str) and url.startswith("http"):
                        biz.images.append(GmapsImage(url=url, title=""))

        # Categories
        cat = safe_get(place_data, 38, default="")
        if cat:
            biz.categories = [cat]

        # Complete address
        addr_data = safe_get(place_data, 2, default="")
        if addr_data and isinstance(addr_data, str):
            biz.address = addr_data

        # Owner
        owner_data = safe_get(place_data, 57, default=None)
        if owner_data:
            biz.owner = GmapsOwner(
                id=str(safe_get(owner_data, 0, default="")),
                name=str(safe_get(owner_data, 1, default="")),
                link=str(safe_get(owner_data, 2, default=""))
            )

    except Exception as e:
        logger.warning(f"Error parsing APP_STATE array: {e}")

    return biz


def _extract_from_dict(data: dict, biz: GmapsBusiness):
    """Fallback extraction from dictionary-style data."""
    # Walk the dict tree looking for recognizable patterns
    _walk_dict(data, biz, 0)


def _walk_dict(data: Any, biz: GmapsBusiness, depth: int):
    """Recursively walk nested data to extract business info."""
    if depth > 10:
        return

    if isinstance(data, dict):
        for key, val in data.items():
            if isinstance(val, str):
                if not biz.title and len(val) > 2 and len(val) < 200 and any(c.isupper() for c in val):
                    # Heuristic: might be a business name
                    pass
            elif isinstance(val, (dict, list)):
                _walk_dict(val, biz, depth + 1)
    elif isinstance(data, list):
        for item in data[:20]:
            _walk_dict(item, biz, depth + 1)


def parse_dom_data(data: dict) -> GmapsBusiness:
    """Parse DOM-extracted data into GmapsBusiness."""
    biz = GmapsBusiness()
    biz.title = data.get("title", "")
    biz.category = data.get("category", "")
    biz.address = data.get("address", "")
    biz.phone = data.get("phone", "")
    biz.website = data.get("website", "")

    # Parse rating
    rating_text = data.get("rating_text", "")
    if rating_text:
        match = re.search(r'(\d+\.?\d*)', rating_text)
        if match:
            biz.review_rating = float(match.group(1))

    # Parse review count
    review_text = data.get("review_count_text", "")
    if review_text:
        match = re.search(r'(\d+)', review_text.replace(',', ''))
        if match:
            biz.review_count = int(match.group(1))

    return biz


class GmapsScraper:
    """Google Maps scraper using Playwright with APP_INITIALIZATION_STATE extraction."""

    def __init__(self, headless: bool = True, max_browsers: int = 2, max_pages: int = 3):
        self.headless = headless
        self.max_browsers = max_browsers
        self.max_pages = max_pages
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._seen_place_ids: set = set()
        self._started_at = time.time()

    async def start(self):
        """Initialize browser."""
        if not async_playwright:
            logger.error("Playwright not installed. Run: pip install playwright && playwright install chromium")
            return False

        try:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=self.headless,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-images',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--window-size=1280,720',
                ]
            )
            self._context = await self._browser.new_context(
                viewport={'width': 1280, 'height': 720},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                locale='en-US',
                java_script_enabled=True,
            )
            logger.info("Browser started successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            return False

    async def stop(self):
        """Close browser."""
        try:
            if self._context:
                await self._context.close()
            if self._browser:
                await self._browser.close()
            if self._playwright:
                await self._playwright.stop()
        except Exception as e:
            logger.warning(f"Error closing browser: {e}")

    async def _new_page(self) -> Page:
        """Create a new page."""
        page = await self._context.new_page()
        await page.set_default_timeout(30000)
        return page

    async def _handle_cookies(self, page: Page):
        """Handle Google cookie consent dialog."""
        try:
            result = await page.evaluate(REJECT_COOKIES_JS)
            if result:
                logger.info("Rejected cookies")
                await asyncio.sleep(0.5)
        except Exception:
            pass

    async def search(self, query: str, depth: int = 10, lang: str = "en",
                     geo: Optional[str] = None, zoom: int = 15) -> List[GmapsBusiness]:
        """Search Google Maps and extract business listings."""
        if not self._browser:
            started = await self.start()
            if not started:
                return []

        page = await self._new_page()
        results = []

        try:
            # Build URL
            encoded_query = query.replace(' ', '+')
            url = f"https://www.google.com/maps/search/{encoded_query}/"

            if geo:
                url = f"https://www.google.com/maps/@{geo},{zoom}z/search/{encoded_query}/"

            if lang != "en":
                url += f"?hl={lang}"

            logger.info(f"Navigating to: {url}")
            await page.goto(url, wait_until='networkidle', timeout=45000)
            await self._handle_cookies(page)
            await asyncio.sleep(2)

            # Scroll to load more results
            try:
                scroll_result = await page.evaluate(SCROLL_JS, depth)
                logger.info(f"Scroll result: {scroll_result}")
            except Exception as e:
                logger.warning(f"Scroll error: {e}")

            await asyncio.sleep(1)

            # Extract result links
            result_links = await page.evaluate("""
                () => {
                    const items = document.querySelectorAll('a[href*="/maps/place/"]');
                    const links = [];
                    items.forEach(item => {
                        const href = item.getAttribute('href') || '';
                        if (href.includes('/maps/place/') && !links.includes(href)) {
                            links.push(href);
                        }
                    });
                    return links;
                }
            """)

            logger.info(f"Found {len(result_links)} result links")

            # Visit each result to get detailed data
            for i, link in enumerate(result_links[:depth * 12]):
                try:
                    result = await self._extract_place(page, link)
                    if result and result.place_id not in self._seen_place_ids:
                        self._seen_place_ids.add(result.place_id)
                        result.input_id = f"search_{i}"
                        results.append(result)
                        logger.info(f"Extracted: {result.title} ({result.category})")
                except Exception as e:
                    logger.warning(f"Error extracting place {i}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Search error: {e}")
        finally:
            await page.close()

        return results

    async def get_place(self, url_or_place_id: str, email: bool = False,
                        extra_reviews: bool = False) -> Optional[GmapsBusiness]:
        """Get detailed place data by URL or place ID."""
        if not self._browser:
            started = await self.start()
            if not started:
                return None

        page = await self._new_page()
        try:
            url = url_or_place_id
            if not url.startswith("http"):
                # Treat as place ID
                url = f"https://www.google.com/maps/place/?q=place_id:{url_or_place_id}"

            logger.info(f"Getting place: {url}")
            await page.goto(url, wait_until='networkidle', timeout=45000)
            await self._handle_cookies(page)
            await asyncio.sleep(3)

            result = await self._extract_current_place(page)
            if result:
                result.input_id = "place_direct"

                # Extract emails if requested
                if email and result.website:
                    from app.email_extractor import extract_emails_from_url
                    try:
                        emails = await extract_emails_from_url(result.website)
                        result.emails = emails
                    except Exception as e:
                        logger.warning(f"Email extraction failed: {e}")

            return result

        except Exception as e:
            logger.error(f"Get place error: {e}")
            return None
        finally:
            await page.close()

    async def _extract_place(self, page: Page, url: str) -> Optional[GmapsBusiness]:
        """Extract place data by navigating to its URL."""
        try:
            await page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(2)
            await self._handle_cookies(page)
            return await self._extract_current_place(page)
        except Exception as e:
            logger.warning(f"Error navigating to place: {e}")
            return None

    async def _extract_current_place(self, page: Page) -> Optional[GmapsBusiness]:
        """Extract data from the currently loaded place page."""
        try:
            raw = await page.evaluate(EXTRACT_JS)
            if not raw:
                return None

            method = raw.get("method", "")

            if method == "APP_STATE":
                data = raw.get("data")
                biz = parse_app_state(data)
            elif method == "DOM":
                data = raw.get("data", {})
                biz = parse_dom_data(data)
            else:
                logger.warning(f"Extraction method: {method}, error: {raw.get('error', '')}")
                return None

            # Get the current URL for link
            current_url = page.url
            if "/maps/place/" in current_url:
                biz.link = current_url

            # Extract place_id from URL
            match = re.search(r'place_id:([A-Za-z0-9_\-]+)', current_url)
            if match:
                biz.place_id = match.group(1)
            elif not biz.place_id:
                # Use URL hash as fallback
                biz.place_id = hashlib.md5(biz.title.encode()).hexdigest()[:16] if biz.title else ""

            return biz if biz.title else None

        except Exception as e:
            logger.error(f"Extract current place error: {e}")
            return None

    async def search_fast(self, query: str, geo: Optional[str] = None,
                          lang: str = "en") -> List[GmapsBusiness]:
        """Fast mode: use HTTP requests instead of browser (up to 21 results)."""
        import httpx

        results = []
        try:
            # Construct Google Maps search URL
            params = {
                'tbm': 'map',
                'q': query,
                'hl': lang,
            }
            if geo:
                parts = geo.split(',')
                if len(parts) == 2:
                    params['ll'] = geo

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': f'{lang},en;q=0.5',
            }

            async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
                resp = await client.get('https://www.google.com/maps', params=params, headers=headers)
                if resp.status_code != 200:
                    logger.error(f"Fast search HTTP {resp.status_code}")
                    return results

                # Parse the response for business data
                # Google Maps search results are embedded in the HTML
                text = resp.text
                # Look for APP_INITIALIZATION_STATE in the response
                match = re.search(r'APP_INITIALIZATION_STATE\s*=\s*(\[.*?\]);', text, re.DOTALL)
                if match:
                    try:
                        state = json.loads(match.group(1))
                        for item in state:
                            if isinstance(item, str):
                                cleaned = item.lstrip(")]}'")
                                try:
                                    data = json.loads(cleaned)
                                    biz = parse_app_state(data)
                                    if biz.title:
                                        results.append(biz)
                                except:
                                    continue
                    except json.JSONDecodeError:
                        pass

        except Exception as e:
            logger.error(f"Fast search error: {e}")

        return results

    async def grid_search(self, min_lat: float, min_lon: float, max_lat: float, max_lon: float,
                          query: str, cell_size_km: float = 1.0, depth: int = 5) -> List[GmapsBusiness]:
        """Grid-based area scraping to overcome Google's ~120 results limit."""
        # Calculate cell centers
        km_per_deg_lat = 111.0
        km_per_deg_lon = 111.0 * __import__('math').cos(__import__('math').radians((min_lat + max_lat) / 2))

        cell_size_lat = cell_size_km / km_per_deg_lat
        cell_size_lon = cell_size_km / km_per_deg_lon

        cells = []
        lat = min_lat
        while lat < max_lat:
            lon = min_lon
            while lon < max_lon:
                center_lat = lat + cell_size_lat / 2
                center_lon = lon + cell_size_lon / 2
                cells.append((center_lat, center_lon))
                lon += cell_size_lon
            lat += cell_size_lat

        logger.info(f"Grid search: {len(cells)} cells for '{query}'")

        all_results = []
        seen = set()

        for i, (clat, clon) in enumerate(cells):
            try:
                geo = f"{clat},{clon}"
                results = await self.search(query, depth=depth, geo=geo)
                for biz in results:
                    pid = biz.place_id or biz.title
                    if pid not in seen:
                        seen.add(pid)
                        biz.input_id = f"grid_{i}"
                        all_results.append(biz)
                await asyncio.sleep(2)  # Rate limiting
            except Exception as e:
                logger.warning(f"Grid cell {i} error: {e}")
                continue

        return all_results

    def uptime(self) -> float:
        """Return service uptime in seconds."""
        return time.time() - self._started_at


# Global scraper instance
_scraper: Optional[GmapsScraper] = None


async def get_scraper() -> GmapsScraper:
    """Get or create the global scraper instance."""
    global _scraper
    if _scraper is None:
        _scraper = GmapsScraper()
        await _scraper.start()
    return _scraper


async def shutdown_scraper():
    """Shutdown the global scraper."""
    global _scraper
    if _scraper:
        await _scraper.stop()
        _scraper = None
