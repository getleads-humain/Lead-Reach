"""OpenCorporates service - Official company registry data from 130+ jurisdictions."""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def search_company(company: str, jurisdiction: Optional[str] = None) -> Dict[str, Any]:
    """Search OpenCorporates for official company registry data."""
    try:
        import requests

        base_url = "https://api.opencorporates.com/v0.4/companies/search"
        params = {
            "q": company,
            "format": "json",
        }
        if jurisdiction:
            params["jurisdiction_code"] = jurisdiction.lower()

        # OpenCorporates API (free tier, no key needed but rate-limited)
        headers = {"User-Agent": "LeadReach-AI/1.0 research@leadreach.ai"}

        resp = requests.get(base_url, params=params, headers=headers, timeout=15)

        companies = []
        directors = []

        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", {}).get("companies", [])

            for item in results[:10]:
                co = item.get("company", {})
                company_data = {
                    "name": co.get("name", ""),
                    "jurisdiction": co.get("jurisdiction_code", ""),
                    "company_number": co.get("company_number", ""),
                    "status": co.get("current_status", ""),
                    "incorporation_date": co.get("incorporation_date", ""),
                    "registered_address": co.get("registered_address_in_full", ""),
                    "opencorporates_url": co.get("opencorporates_url", ""),
                    "source": "opencorporates",
                }

                # Extract directors/officers if available
                officers = co.get("officers", [])
                for officer_item in officers[:5]:
                    officer = officer_item.get("officer", {})
                    director = {
                        "name": officer.get("name", ""),
                        "position": officer.get("position", ""),
                        "start_date": officer.get("start_date", ""),
                        "end_date": officer.get("end_date", ""),
                        "company_name": co.get("name", ""),
                    }
                    directors.append(director)
                    company_data["officers"] = company_data.get("officers", [])
                    company_data["officers"].append(director)

                companies.append(company_data)

        elif resp.status_code == 429:
            return {
                "company": company,
                "companies": [],
                "directors": [],
                "error": "Rate limited by OpenCorporates API. Try again later.",
                "data_source": "opencorporates",
            }

        return {
            "company": company,
            "companies": companies,
            "directors": directors,
            "total_found": len(companies),
            "data_source": "opencorporates",
        }

    except Exception as e:
        logger.error(f"OpenCorporates search error: {e}")
        return {
            "company": company,
            "companies": [],
            "directors": [],
            "error": str(e),
            "data_source": "opencorporates",
        }
