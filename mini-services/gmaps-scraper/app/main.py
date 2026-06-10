"""FastAPI application for Google Maps Scraper Service."""
import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    ScrapeRequest, ScrapeOptions, PlaceRequest, EnrichRequest,
    GridRequest, EmailExtractRequest, ScrapeJob, SearchResponse,
    HealthResponse, GmapsBusiness
)
from app.scraper import get_scraper, shutdown_scraper, GmapsScraper
from app.job_manager import get_job_manager, run_scrape_job

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(name)s %(levelname)s %(message)s')
logger = logging.getLogger("gmaps-scraper")

START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    logger.info("Starting GMaps Scraper Service...")
    # Pre-start the scraper
    scraper = await get_scraper()
    if scraper._browser:
        logger.info("Browser initialized successfully")
    else:
        logger.warning("Browser initialization failed - will retry on first request")
    yield
    logger.info("Shutting down GMaps Scraper Service...")
    await shutdown_scraper()
    jm = await get_job_manager()
    await jm.close()


app = FastAPI(
    title="Google Maps Scraper Service",
    description="Comprehensive Google Maps business scraping service for LeadReach",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ────────────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    jm = await get_job_manager()
    scraper = await get_scraper()
    active_jobs = await jm.get_active_job_count()

    return HealthResponse(
        status="healthy" if scraper._browser else "degraded",
        uptime=time.time() - START_TIME,
        active_jobs=active_jobs,
        version="1.0.0"
    )


# ─── Quick Search ──────────────────────────────────────────────────────

@app.post("/api/v1/search", response_model=SearchResponse)
async def quick_search(request: ScrapeRequest):
    """Quick search - returns results directly."""
    scraper = await get_scraper()
    if not scraper._browser:
        await scraper.start()

    try:
        if request.options.fast_mode:
            results = await scraper.search_fast(
                request.query,
                lang=request.options.lang
            )
        else:
            results = await scraper.search(
                request.query,
                depth=request.options.depth,
                lang=request.options.lang,
                geo=request.options.geo,
                zoom=request.options.zoom
            )

        # Limit results
        if request.options.max_results and len(results) > request.options.max_results:
            results = results[:request.options.max_results]

        return SearchResponse(
            success=True,
            results=results,
            count=len(results),
            query=request.query
        )

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Place Details ─────────────────────────────────────────────────────

@app.post("/api/v1/place")
async def get_place(request: PlaceRequest):
    """Get detailed place data."""
    scraper = await get_scraper()
    if not scraper._browser:
        await scraper.start()

    try:
        result = await scraper.get_place(
            request.url_or_place_id,
            email=request.email,
            extra_reviews=request.extra_reviews
        )

        if not result:
            raise HTTPException(status_code=404, detail="Place not found")

        return {"success": True, "place": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get place error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Async Job Submission ──────────────────────────────────────────────

@app.post("/api/v1/scrape")
async def submit_scrape_job(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Submit an async scrape job."""
    jm = await get_job_manager()
    job = await jm.create_job(request.query, request.options)

    # Run in background
    background_tasks.add_task(run_scrape_job, job.id, request.query, request.options)

    return {"success": True, "job_id": job.id, "status": "pending"}


# ─── Job Management ────────────────────────────────────────────────────

@app.get("/api/v1/jobs")
async def list_jobs(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    """List all jobs."""
    jm = await get_job_manager()
    return await jm.list_jobs(page, limit)


@app.get("/api/v1/jobs/{job_id}")
async def get_job(job_id: str):
    """Get job status and results."""
    jm = await get_job_manager()
    job = await jm.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.delete("/api/v1/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job."""
    jm = await get_job_manager()
    await jm.delete_job(job_id)
    return {"success": True}


@app.get("/api/v1/jobs/{job_id}/download")
async def download_results(job_id: str):
    """Download results as CSV."""
    import csv
    import io

    jm = await get_job_manager()
    job = await jm.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    output = io.StringIO()
    if job.results:
        writer = csv.DictWriter(output, fieldnames=job.results[0].model_dump().keys())
        writer.writeheader()
        for biz in job.results:
            row = biz.model_dump()
            # Convert lists/dicts to JSON strings for CSV
            for key, val in row.items():
                if isinstance(val, (list, dict)):
                    row[key] = str(val)
            writer.writerow(row)

    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(output.getvalue(), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename=gmaps_{job_id}.csv"})


# ─── Enrichment ────────────────────────────────────────────────────────

@app.post("/api/v1/enrich")
async def enrich_business(request: EnrichRequest):
    """Enrich a business with email extraction and extended data."""
    scraper = await get_scraper()
    if not scraper._browser:
        await scraper.start()

    try:
        result = await scraper.get_place(
            request.url_or_place_id,
            email=request.email,
            extra_reviews=request.extra_reviews
        )

        if not result:
            raise HTTPException(status_code=404, detail="Business not found")

        return {"success": True, "business": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enrich error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Grid Search ───────────────────────────────────────────────────────

@app.post("/api/v1/grid")
async def grid_search(request: GridRequest):
    """Grid-based area scraping."""
    scraper = await get_scraper()
    if not scraper._browser:
        await scraper.start()

    try:
        results = await scraper.grid_search(
            min_lat=request.min_lat,
            min_lon=request.min_lon,
            max_lat=request.max_lat,
            max_lon=request.max_lon,
            query=request.query,
            cell_size_km=request.cell_size_km,
            depth=request.options.depth
        )

        return {
            "success": True,
            "results": results,
            "cells_scraped": 0,  # Updated by scraper
            "count": len(results)
        }

    except Exception as e:
        logger.error(f"Grid search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Email Extraction ──────────────────────────────────────────────────

@app.post("/api/v1/extract-emails")
async def extract_emails(request: EmailExtractRequest):
    """Extract emails from a website URL."""
    from app.email_extractor import extract_emails_from_url

    try:
        emails = await extract_emails_from_url(request.website_url)
        return {"success": True, "emails": emails, "count": len(emails)}

    except Exception as e:
        logger.error(f"Email extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Root ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Google Maps Scraper",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }
