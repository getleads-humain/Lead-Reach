"""Google Search SERP scraping service - extract organic search results."""

import logging
import re
import time
import random
from typing import Any, Dict, List
from urllib.parse import quote_plus, urlparse

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


def _extract_serp_results(soup: BeautifulSoup, limit: int = 10) -> List[Dict[str, Any]]:
    """Extract organic search results from a Google SERP page."""
    results = []

    # Try multiple selectors for organic results
    # Google frequently changes its HTML structure, so we try several approaches
    
    # Approach 1: Look for div containers with data-hveid attribute (common pattern)
    organic_divs = soup.find_all("div", attrs={"data-hveid": True})
    
    # Approach 2: Look for specific result containers
    if not organic_divs:
        organic_divs = soup.find_all("div", class_=re.compile(r"g|tF2Cxc|yuRUbf"))
    
    # Approach 3: Find all links that look like search results
    if not organic_divs:
        for g_div in soup.find_all("div", recursive=True):
            h3 = g_div.find("h3")
            a_tag = g_div.find("a", href=True)
            if h3 and a_tag:
                href = a_tag.get("href", "")
                if href.startswith("http") and "google.com" not in href:
                    result = {
                        "title": h3.get_text(strip=True),
                        "url": href,
                        "snippet": None,
                        "position": len(results) + 1,
                    }
                    
                    # Try to extract snippet
                    parent = g_div.parent
                    if parent:
                        snippet_tags = parent.find_all("span", class_=re.compile(r"aCOpRe|st"))
                        for span in snippet_tags:
                            text = span.get_text(strip=True)
                            if len(text) > 50:
                                result["snippet"] = text
                                break
                    
                    results.append(result)
                    if len(results) >= limit:
                        return results

    # Process organic divs from approach 1/2
    for div in organic_divs:
        if len(results) >= limit:
            break

        try:
            # Find the title and link
            h3 = div.find("h3")
            if not h3:
                continue

            a_tag = h3.find_parent("a", href=True)
            if not a_tag:
                a_tag = div.find("a", href=True)
            
            if not a_tag:
                continue

            href = a_tag.get("href", "")
            
            # Skip non-organic results
            if not href.startswith("http"):
                continue
            if "google.com" in href and "/search?" not in href:
                continue
            if "youtube.com" in href and "/watch" not in href:
                pass  # YouTube results can be valid

            title = h3.get_text(strip=True)

            # Extract snippet
            snippet = None
            # Try various snippet selectors
            snippet_selectors = [
                "div.VwiC3b",
                "span.aCOpRe",
                "div.IsZvec",
                "span.st",
                "div[style*='-webkit-line-clamp']",
            ]
            for selector in snippet_selectors:
                try:
                    snippet_el = div.select_one(selector)
                    if snippet_el:
                        snippet = snippet_el.get_text(strip=True)
                        if snippet:
                            break
                except Exception:
                    continue

            # Fallback: look for longer text blocks in the div
            if not snippet:
                for span in div.find_all("span"):
                    text = span.get_text(strip=True)
                    if len(text) > 80 and text != title:
                        snippet = text
                        break

            results.append({
                "title": title,
                "url": href,
                "snippet": snippet,
                "position": len(results) + 1,
            })

        except Exception as e:
            logger.debug(f"Error extracting SERP result: {e}")
            continue

    return results


def fetch_google_search(query: str, limit: int = 10) -> Dict[str, Any]:
    """
    Scrape Google Search results for a given query.

    Args:
        query: Search query string
        limit: Maximum number of results to return

    Returns:
        Dictionary containing organic search results
    """
    logger.info(f"Scraping Google Search for: {query}, limit: {limit}")

    try:
        # Build Google Search URL
        search_url = f"https://www.google.com/search?q={quote_plus(query)}&num={min(limit * 2, 100)}&hl=en-US"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Referer": "https://www.google.com/",
        }

        # Add a small random delay to avoid being blocked
        time.sleep(random.uniform(0.5, 1.5))

        session = requests.Session()
        response = session.get(search_url, headers=headers, timeout=15)

        if response.status_code != 200:
            logger.warning(f"Google Search returned status {response.status_code}")
            return {
                "query": query,
                "results": [],
                "count": 0,
                "error": f"Google Search returned status code {response.status_code}",
                "data_source": "google_search",
            }

        soup = BeautifulSoup(response.text, "lxml")

        # Try to detect CAPTCHA or blocked page
        if "captcha" in response.text.lower() or "unusual traffic" in response.text.lower():
            logger.warning("Google Search returned CAPTCHA/blocked page")
            return {
                "query": query,
                "results": [],
                "count": 0,
                "error": "Google Search returned CAPTCHA. Try again later.",
                "data_source": "google_search",
            }

        results = _extract_serp_results(soup, limit)

        logger.info(f"Found {len(results)} Google Search results for '{query}'")

        return {
            "query": query,
            "results": results,
            "count": len(results),
            "data_source": "google_search",
        }

    except requests.Timeout:
        logger.error(f"Google Search request timed out for '{query}'")
        return {
            "query": query,
            "results": [],
            "count": 0,
            "error": "Request timed out",
            "data_source": "google_search",
        }
    except Exception as e:
        logger.error(f"Error scraping Google Search for '{query}': {e}")
        return {
            "query": query,
            "results": [],
            "count": 0,
            "error": str(e),
            "data_source": "google_search",
        }
