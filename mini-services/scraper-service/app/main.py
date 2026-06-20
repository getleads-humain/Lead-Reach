"""LeadReach AI Scraper Service - FastAPI application wrapping multiple scraping/data tools.

Security: each endpoint catches exceptions and returns a generic error message
to the client (logging the real exception for debugging). This prevents
information exposure through exceptions (CodeQL alerts #4–#14).
"""
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import (
    YFinanceRequest, NewsRequest, GeocodeRequest, EdgarRequest,
    PublicWWWRequest, OpenCorporatesRequest, OSMRequest,
    GoogleMapsRequest, ScrapeRequest, GSCToolRequest,
)
from app.services.yfinance_service import get_financial_data
from app.services.news_service import extract_news
from app.services.geocoder_service import geocode_address, reverse_geocode
from app.services.edgar_service import search_filings
from app.services.publicwww_service import search_technology
from app.services.opencorporates_service import search_company
from app.services.osm_service import search_places
from app.services.google_maps_service import scrape_google_maps
from app.services.scrapy_service import scrape_url, scrape_google_serp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LeadReach Scraper Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "scraper-service",
        "tools": [
            "yfinance", "newspaper3k", "geocoder", "edgar",
            "publicwww", "opencorporates", "osm", "google_maps",
            "scrapy", "gsctool",
        ],
    }


def _safe_call(func, *args, **kwargs):
    """Call a service function and sanitize the result so exception details
    are not exposed to the client. If the service returns a dict with an
    `error` key, replace it with a generic message (the real error is
    already logged inside the service)."""
    try:
        result = func(*args, **kwargs)
    except Exception as e:
        # Log the real exception for debugging; return generic error to client.
        logger.error(f"Service call failed: {e}", exc_info=True)
        return {"error": "Service call failed. See server logs for details."}
    if isinstance(result, dict) and "error" in result:
        # Service reported an error — strip the detailed message.
        logger.warning(f"Service returned error: {result.get('error')}")
        return {"error": "Service reported an error. See server logs for details."}
    return result


@app.post("/yfinance")
async def yfinance_endpoint(req: YFinanceRequest):
    result = _safe_call(get_financial_data, req.symbol, req.metrics)
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=500, detail=result)
    return result


@app.post("/news")
async def news_endpoint(req: NewsRequest):
    return _safe_call(extract_news, req.query, req.max_articles)


@app.post("/geocode")
async def geocode_endpoint(req: GeocodeRequest):
    if req.reverse and req.lat is not None and req.lng is not None:
        return _safe_call(reverse_geocode, req.lat, req.lng, req.provider)
    elif req.address:
        return _safe_call(geocode_address, req.address, req.provider)
    else:
        raise HTTPException(status_code=400, detail="Provide either 'address' or 'lat'+'lng' with 'reverse=true'")


@app.post("/edgar")
async def edgar_endpoint(req: EdgarRequest):
    return _safe_call(search_filings, req.company, req.filing_types, req.limit)


@app.post("/publicwww")
async def publicwww_endpoint(req: PublicWWWRequest):
    return _safe_call(search_technology, req.query, req.limit)


@app.post("/opencorporates")
async def opencorporates_endpoint(req: OpenCorporatesRequest):
    return _safe_call(search_company, req.company, req.jurisdiction)


@app.post("/osm")
async def osm_endpoint(req: OSMRequest):
    return _safe_call(
        search_places,
        query=req.query,
        bbox=req.bbox,
        tags=req.tags,
        center_lat=req.center_lat,
        center_lng=req.center_lng,
        radius_km=req.radius_km,
        limit=req.limit,
    )


@app.post("/google-maps")
async def google_maps_endpoint(req: GoogleMapsRequest):
    try:
        result = await scrape_google_maps(req.query, req.max_results, req.language)
    except Exception as e:
        logger.error(f"google_maps call failed: {e}", exc_info=True)
        return {"error": "Service call failed. See server logs for details."}
    if isinstance(result, dict) and "error" in result:
        logger.warning(f"google_maps returned error: {result.get('error')}")
        return {"error": "Service reported an error. See server logs for details."}
    return result


@app.post("/scrape")
async def scrape_endpoint(req: ScrapeRequest):
    return _safe_call(scrape_url, req.url, req.extract, req.selector, req.timeout)


@app.post("/gsctool")
async def gsctool_endpoint(req: GSCToolRequest):
    return _safe_call(scrape_google_serp, req.query, req.limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5320)
