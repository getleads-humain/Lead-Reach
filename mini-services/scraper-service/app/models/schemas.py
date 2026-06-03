"""Pydantic schemas for the scraper service."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ── yfinance ──
class YFinanceRequest(BaseModel):
    symbol: str = Field(..., description="Stock ticker symbol, e.g. AAPL")
    metrics: List[str] = Field(default=["market_cap", "revenue", "employees", "pe_ratio", "sector", "growth_5y"])


# ── News / Newspaper3k ──
class NewsRequest(BaseModel):
    query: str = Field(..., description="Search query for news articles")
    max_articles: int = Field(default=5, ge=1, le=20)


# ── Geocoder ──
class GeocodeRequest(BaseModel):
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    reverse: bool = False
    provider: str = Field(default="osm", description="Geocoding provider: osm, google, bing")


# ── SEC EDGAR ──
class EdgarRequest(BaseModel):
    company: str = Field(..., description="Company name to search in SEC filings")
    filing_types: List[str] = Field(default=["10-K", "8-K"])
    limit: int = Field(default=5, ge=1, le=20)


# ── PublicWWW ──
class PublicWWWRequest(BaseModel):
    query: str = Field(..., description="Technology or code snippet to search for")
    limit: int = Field(default=20, ge=1, le=100)


# ── OpenCorporates ──
class OpenCorporatesRequest(BaseModel):
    company: str = Field(..., description="Company name to search")
    jurisdiction: Optional[str] = None


# ── OpenStreetMap / Overpass ──
class OSMRequest(BaseModel):
    query: Optional[str] = None
    bbox: Optional[List[float]] = None  # [south, west, north, east]
    tags: Optional[Dict[str, str]] = None
    radius_km: float = Field(default=5.0)
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    limit: int = Field(default=50, ge=1, le=500)


# ── Google Maps ──
class GoogleMapsRequest(BaseModel):
    query: str = Field(..., description="Search query, e.g. 'plumbers in Toronto'")
    max_results: int = Field(default=20, ge=1, le=50)
    language: str = Field(default="en")


# ── General Scrape ──
class ScrapeRequest(BaseModel):
    url: str = Field(..., description="URL to scrape")
    extract: str = Field(default="text", description="Extraction mode: text, links, structured")
    selector: Optional[str] = None
    timeout: int = Field(default=15000)


# ── Google SERP ──
class GSCToolRequest(BaseModel):
    query: str = Field(..., description="Search query")
    limit: int = Field(default=10, ge=1, le=50)


# ── Generic Response ──
class ServiceResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[str] = None
    data_source: Optional[str] = None
