"""Google Maps scraper service - Business listing discovery via Playwright."""
import logging
from typing import Dict, Any, List
import re
import json

logger = logging.getLogger(__name__)


async def scrape_google_maps(query: str, max_results: int = 20, language: str = "en") -> Dict[str, Any]:
    """Scrape Google Maps search results using Playwright for browser automation."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return {"places": [], "total": 0, "error": "playwright not installed", "data_source": "google_maps"}

    places = []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
            )
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                locale=language,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            )
            page = await context.new_page()

            # Navigate to Google Maps
            encoded_query = query.replace(" ", "+")
            url = f"https://www.google.com/maps/search/{encoded_query}/?hl={language}"
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)

            # Wait for results to load
            try:
                await page.wait_for_selector('[role="feed"]', timeout=10000)
            except Exception:
                # Try alternative selector
                await page.wait_for_selector(".Nv2PK", timeout=5000)

            # Scroll to load more results
            for _ in range(min(max_results // 10, 3)):
                await page.evaluate("""
                    const feed = document.querySelector('[role="feed"]');
                    if (feed) feed.scrollTop = feed.scrollHeight;
                """)
                await page.wait_for_timeout(1000)

            # Extract place data
            items = await page.query_selector_all('.Nv2PK, [role="feed"] > div > div')

            for item in items[:max_results]:
                try:
                    place = {}

                    # Name
                    name_el = await item.query_selector('.fontHeadlineSmall, .qBF1Pd, .hfpxzc')
                    if name_el:
                        place["name"] = await name_el.inner_text()

                    # Rating
                    rating_el = await item.query_selector('.MW4etd, [role="img"]')
                    if rating_el:
                        rating_text = await rating_el.get_attribute("aria-label") or await rating_el.inner_text()
                        rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                        place["rating"] = float(rating_match.group(1)) if rating_match else None

                    # Review count
                    review_el = await item.query_selector('.UY7F9, .RDApEe')
                    if review_el:
                        review_text = await review_el.inner_text()
                        review_match = re.search(r'(\d+[\d,]*)', review_text)
                        place["review_count"] = int(review_match.group(1).replace(",", "")) if review_match else 0

                    # Category and address
                    category_el = await item.query_selector('.fontBodyMedium .EnGMXb, .fontBodyMedium span:first-child')
                    if category_el:
                        place["category"] = await category_el.inner_text()

                    address_el = await item.query_selector('.fontBodyMedium .W4Efsd:last-child span:first-child, .W4Efsd span')
                    if address_el:
                        place["address"] = await address_el.inner_text()

                    # Phone (may require clicking into detail)
                    phone_el = await item.query_selector('.UsdlK, [data-tooltip*="phone"]')
                    if phone_el:
                        phone_text = await phone_el.inner_text()
                        place["phone"] = phone_text.strip()

                    # Hours
                    hours_el = await item.query_selector('.W4Efsd span[aria-label*="hours"], .W4Efsd:last-child span:last-child')
                    if hours_el:
                        place["hours"] = await hours_el.inner_text()

                    # Click to get more details (URL, coordinates)
                    try:
                        link_el = await item.query_selector('a.hfpxzc')
                        if link_el:
                            href = await link_el.get_attribute("href")
                            if href:
                                # Extract coordinates from URL
                                coord_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', href)
                                if coord_match:
                                    place["lat"] = float(coord_match.group(1))
                                    place["lng"] = float(coord_match.group(2))
                                place["maps_url"] = href
                    except Exception:
                        pass

                    if place.get("name"):
                        places.append(place)

                except Exception as e:
                    logger.warning(f"Failed to extract place data: {e}")
                    continue

            await browser.close()

    except Exception as e:
        logger.error(f"Google Maps scraping error: {e}")
        return {
            "places": places,
            "total": len(places),
            "error": str(e),
            "data_source": "google_maps",
        }

    return {
        "places": places,
        "total": len(places),
        "data_source": "google_maps",
    }
