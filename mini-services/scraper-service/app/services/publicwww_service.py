"""PublicWWW service - Technology stack and footprint discovery."""
import logging
from typing import Dict, Any, List
import re

logger = logging.getLogger(__name__)

def search_technology(query: str, limit: int = 20) -> Dict[str, Any]:
    """Search PublicWWW for websites using a specific technology or code pattern."""
    try:
        import requests
        from bs4 import BeautifulSoup

        # PublicWWW search URL
        encoded_query = query.replace(" ", "+")
        url = f"https://publicwww.com/websites/%22{encoded_query}%22/"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        resp = requests.get(url, headers=headers, timeout=15)

        results = []
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")

            # Parse search results - PublicWWW returns a table of results
            for row in soup.select("table tr")[1:limit+1]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    link = cells[0].find("a")
                    if link:
                        domain = link.text.strip()
                        results.append({
                            "domain": domain,
                            "url": f"https://{domain}" if not domain.startswith("http") else domain,
                            "snippet": cells[1].text.strip()[:200] if len(cells) > 1 else "",
                        })

        # If the structured parsing didn't work, try extracting domains from the raw HTML
        if not results:
            domains = re.findall(r'https?://([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', resp.text)
            seen = set()
            for d in domains[:limit]:
                if d not in seen and not d.startswith("publicwww"):
                    seen.add(d)
                    results.append({"domain": d, "url": f"https://{d}", "snippet": ""})

        # Identify tech categories
        tech_categories = []
        query_lower = query.lower()
        tech_map = {
            "shopify": "E-Commerce Platform",
            "wordpress": "CMS",
            "salesforce": "CRM",
            "react": "JavaScript Framework",
            "angular": "JavaScript Framework",
            "vue": "JavaScript Framework",
            "jquery": "JavaScript Library",
            "google analytics": "Analytics",
            "gtag": "Analytics",
            "hubspot": "Marketing Automation",
            "intercom": "Customer Support",
            "drift": "Chat Widget",
            "zendesk": "Customer Support",
        }
        for tech, category in tech_map.items():
            if tech in query_lower:
                tech_categories.append({"technology": tech, "category": category})

        return {
            "query": query,
            "results": results,
            "total_found": len(results),
            "tech_categories": tech_categories,
            "data_source": "publicwww",
        }

    except Exception as e:
        logger.error(f"PublicWWW search error: {e}")
        return {
            "query": query,
            "results": [],
            "total_found": 0,
            "tech_categories": [],
            "error": str(e),
            "data_source": "publicwww",
        }
