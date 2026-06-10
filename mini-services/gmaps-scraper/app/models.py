"""Pydantic models for Google Maps Scraper Service."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class GmapsImage(BaseModel):
    url: str = ""
    title: str = ""


class GmapsLinkSource(BaseModel):
    url: str = ""
    title: str = ""


class GmapsOwner(BaseModel):
    id: str = ""
    name: str = ""
    link: str = ""


class GmapsCompleteAddress(BaseModel):
    borough: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class GmapsAboutOption(BaseModel):
    name: str = ""
    enabled: bool = False


class GmapsAbout(BaseModel):
    id: str = ""
    name: str = ""
    options: List[GmapsAboutOption] = []


class GmapsReview(BaseModel):
    name: str = ""
    profile_picture: Optional[str] = None
    rating: int = 0
    description: Optional[str] = None
    when: Optional[str] = None
    review_id: Optional[str] = None
    posted_at: Optional[str] = None
    language: Optional[str] = None
    reply_text: Optional[str] = None


class GmapsBusiness(BaseModel):
    """Complete Google Maps business listing with 34+ data fields."""
    input_id: str = ""
    link: str = ""
    title: str = ""
    category: str = ""
    categories: List[str] = Field(default_factory=list)
    address: str = ""
    open_hours: Dict[str, Any] = Field(default_factory=dict)
    popular_times: Dict[str, Any] = Field(default_factory=dict)
    website: str = ""
    phone: str = ""
    plus_code: str = ""
    review_count: int = 0
    review_rating: float = 0.0
    reviews_per_rating: Dict[str, int] = Field(default_factory=dict)
    latitude: float = 0.0
    longitude: float = 0.0
    cid: str = ""
    status: str = ""
    description: str = ""
    reviews_link: str = ""
    thumbnail: str = ""
    timezone: str = ""
    price_range: str = ""
    data_id: str = ""
    street_view_url: str = ""
    place_id: str = ""
    images: List[GmapsImage] = Field(default_factory=list)
    reservations: List[GmapsLinkSource] = Field(default_factory=list)
    order_online: List[GmapsLinkSource] = Field(default_factory=list)
    menu: Optional[GmapsLinkSource] = None
    owner: Optional[GmapsOwner] = None
    complete_address: Optional[GmapsCompleteAddress] = None
    about: List[GmapsAbout] = Field(default_factory=list)
    user_reviews: List[GmapsReview] = Field(default_factory=list)
    emails: List[str] = Field(default_factory=list)


class ScrapeOptions(BaseModel):
    """Options for Google Maps scraping."""
    depth: int = 10
    email: bool = False
    extra_reviews: bool = False
    lang: str = "en"
    geo: Optional[str] = None
    zoom: int = 15
    radius: int = 10000
    fast_mode: bool = False
    max_results: int = 100


class ScrapeRequest(BaseModel):
    """Request to start a scrape job."""
    query: str
    options: ScrapeOptions = Field(default_factory=ScrapeOptions)


class PlaceRequest(BaseModel):
    """Request to get place details."""
    url_or_place_id: str
    email: bool = False
    extra_reviews: bool = False


class EnrichRequest(BaseModel):
    """Request to enrich a business."""
    url_or_place_id: str
    email: bool = True
    extra_reviews: bool = False


class GridRequest(BaseModel):
    """Request for grid-based area scraping."""
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float
    query: str
    cell_size_km: float = 1.0
    options: ScrapeOptions = Field(default_factory=ScrapeOptions)


class EmailExtractRequest(BaseModel):
    """Request to extract emails from a website."""
    website_url: str


class ScrapeJob(BaseModel):
    """Scrape job status."""
    id: str
    query: str
    status: str = "pending"  # pending, running, completed, failed
    progress: float = 0.0
    total_results: int = 0
    results: List[GmapsBusiness] = Field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""
    options: ScrapeOptions = Field(default_factory=ScrapeOptions)
    error: Optional[str] = None


class SearchResponse(BaseModel):
    """Response for quick search."""
    success: bool = True
    results: List[GmapsBusiness] = Field(default_factory=list)
    count: int = 0
    query: str = ""


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    uptime: float = 0.0
    active_jobs: int = 0
    version: str = "1.0.0"
