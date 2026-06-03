"""LeadReach AI Scraper Service - FastAPI application wrapping multiple scraping/data tools."""
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


@app.post("/yfinance")
async def yfinance_endpoint(req: YFinanceRequest):
    result = get_financial_data(req.symbol, req.metrics)
    if "error" in result and "data_source" not in result.get("error", ""):
        raise HTTPException(status_code=500, detail=result)
    return result


@app.post("/news")
async def news_endpoint(req: NewsRequest):
    result = extract_news(req.query, req.max_articles)
    return result


@app.post("/geocode")
async def geocode_endpoint(req: GeocodeRequest):
    if req.reverse and req.lat is not None and req.lng is not None:
        return reverse_geocode(req.lat, req.lng, req.provider)
    elif req.address:
        return geocode_address(req.address, req.provider)
    else:
        raise HTTPException(status_code=400, detail="Provide either 'address' or 'lat'+'lng' with 'reverse=true'")


@app.post("/edgar")
async def edgar_endpoint(req: EdgarRequest):
    result = search_filings(req.company, req.filing_types, req.limit)
    return result


@app.post("/publicwww")
async def publicwww_endpoint(req: PublicWWWRequest):
    result = search_technology(req.query, req.limit)
    return result


@app.post("/opencorporates")
async def opencorporates_endpoint(req: OpenCorporatesRequest):
    result = search_company(req.company, req.jurisdiction)
    return result


@app.post("/osm")
async def osm_endpoint(req: OSMRequest):
    result = search_places(
        query=req.query,
        bbox=req.bbox,
        tags=req.tags,
        center_lat=req.center_lat,
        center_lng=req.center_lng,
        radius_km=req.radius_km,
        limit=req.limit,
    )
    return result


@app.post("/google-maps")
async def google_maps_endpoint(req: GoogleMapsRequest):
    result = await scrape_google_maps(req.query, req.max_results, req.language)
    return result


@app.post("/scrape")
async def scrape_endpoint(req: ScrapeRequest):
    result = scrape_url(req.url, req.extract, req.selector, req.timeout)
    return result


@app.post("/gsctool")
async def gsctool_endpoint(req: GSCToolRequest):
    result = scrape_google_serp(req.query, req.limit)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5320)
