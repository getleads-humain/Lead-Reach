"""SEC EDGAR service - US public company filings scraper."""
import logging
from typing import Dict, Any, List
import re

logger = logging.getLogger(__name__)

EDGAR_BASE = "https://efts.sec.gov/LATEST"
EDGAR_SEARCH = f"{EDGAR_BASE}/search-index"
EDGAR_FILING = "https://www.sec.gov/cgi-bin/browse-edgar"

HEADERS = {
    "User-Agent": "LeadReach-AI/1.0 research@leadreach.ai",
    "Accept": "application/json",
}

RISK_KEYWORDS = [
    "supply chain", "competition", "cybersecurity", "regulatory",
    "climate", "inflation", "pandemic", "geopolitical", "litigation",
    "data privacy", "trade war", "tariffs",
]

def search_filings(company: str, filing_types: List[str] = None, limit: int = 5) -> Dict[str, Any]:
    """Search SEC EDGAR for company filings."""
    if filing_types is None:
        filing_types = ["10-K", "8-K"]

    try:
        import requests

        # Search EDGAR full-text search
        search_url = f"https://efts.sec.gov/LATEST/search-index"
        params = {
            "q": f'"{company}"',
            "dateRange": "1year",
            "forms": ",".join(filing_types),
            "from": "0",
            "size": str(limit),
        }

        resp = requests.get(
            "https://efts.sec.gov/LATEST/search-index",
            params=params,
            headers=HEADERS,
            timeout=15,
        )

        filings = []
        risk_keywords_found = []
        key_executives = []
        insider_transactions = []

        if resp.status_code == 200:
            data = resp.json()
            hits = data.get("hits", {}).get("hits", [])

            for hit in hits[:limit]:
                source = hit.get("_source", {})
                filing = {
                    "type": source.get("form_type", ""),
                    "date": source.get("filing_date", ""),
                    "description": source.get("display_names", [""])[0] if source.get("display_names") else "",
                    "url": f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company={company}&type={source.get('form_type', '')}&dateb=&owner=include&count=5",
                    "entity_name": source.get("entity_name", ""),
                }
                filings.append(filing)

                # Extract risk keywords from filing text
                filing_text = source.get("file_text", "") or source.get("display_names", [])
                if isinstance(filing_text, str):
                    text_lower = filing_text.lower()
                    for kw in RISK_KEYWORDS:
                        if kw in text_lower and kw not in risk_keywords_found:
                            risk_keywords_found.append(kw)

        # Also try the company search API for executives
        try:
            company_url = f"https://efts.sec.gov/LATEST/search-index"
            co_params = {"q": company, "forms": "DEF 14A", "size": "1"}
            co_resp = requests.get(company_url, params=co_params, headers=HEADERS, timeout=10)
            if co_resp.status_code == 200:
                co_data = co_resp.json()
                co_hits = co_data.get("hits", {}).get("hits", [])
                if co_hits:
                    exec_names = co_hits[0].get("_source", {}).get("display_names", [])
                    for name in exec_names[:5]:
                        if name != company and len(name) < 80:
                            key_executives.append(name)
        except Exception:
            pass

        return {
            "company": company,
            "filings": filings,
            "filing_count": len(filings),
            "key_executives": key_executives,
            "risk_keywords": risk_keywords_found,
            "insider_transactions": insider_transactions,
            "data_source": "edgar",
        }

    except Exception as e:
        logger.error(f"EDGAR search error: {e}")
        return {
            "company": company,
            "filings": [],
            "filing_count": 0,
            "key_executives": [],
            "risk_keywords": [],
            "insider_transactions": [],
            "error": str(e),
            "data_source": "edgar",
        }
