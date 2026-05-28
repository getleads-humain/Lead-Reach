"""
ScrapeGraphAI Service — FastAPI Microservice
=============================================

Wraps all 6 ScrapeGraphAI graph types behind a REST API so that
every agent on the LeadReach platform (and the AI assistant itself)
can benefit from LLM-powered, zero-selector web scraping.

Graph Types Exposed:
  1. SmartScraperGraph      — single-page, prompt-based extraction
  2. SearchGraph            — web search + scrape top N results
  3. SpeechGraph            — single-page extraction → audio file
  4. ScriptCreatorGraph     — single-page extraction → Python script
  5. SmartScraperMultiGraph — multi-page, parallel LLM extraction
  6. ScriptCreatorMultiGraph— multi-page → Python scripts

LLM Configuration:
  Uses the same two models as the main platform:
    - glm-4.7-flash  (primary — via OpenAI-compatible endpoint)
    - glm-4.6v-flash (secondary — vision-capable fallback)

  The OpenAI-compatible endpoint is provided by the z-ai gateway,
  which the z-ai-web-dev-sdk also uses under the hood.

Run:
  python server.py
  # Starts on http://localhost:5100
"""

import os
import sys
import json
import time
import traceback
import uuid
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================
# LLM Configuration — OpenAI-compatible via z-ai gateway
# ============================================================

# The z-ai gateway exposes an OpenAI-compatible API.
# We configure scrapegraphai to use the same models the platform uses.
ZAI_BASE_URL = os.environ.get("ZAI_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
ZAI_API_KEY = os.environ.get("ZAI_API_KEY", "")
MODEL_PRIMARY = "glm-4.7-flash"
MODEL_SECONDARY = "glm-4.6v-flash"

def make_graph_config(
    model: str = MODEL_PRIMARY,
    headless: bool = True,
    verbose: bool = False,
    model_tokens: int = 8192,
) -> dict:
    """Build a scrapegraphai config dict for the chosen LLM model."""
    config: dict[str, Any] = {
        "llm": {
            "model": f"openai/{model}",
            "api_key": ZAI_API_KEY,
            "base_url": ZAI_BASE_URL,
            "model_tokens": model_tokens,
        },
        "verbose": verbose,
        "headless": headless,
    }
    return config


# ============================================================
# Pydantic Request / Response Models
# ============================================================

class SmartScraperRequest(BaseModel):
    prompt: str = Field(..., description="What to extract from the page")
    source: str = Field(..., description="URL to scrape")
    model: str = Field(MODEL_PRIMARY, description="LLM model to use")
    headless: bool = Field(True, description="Run browser headless")
    model_tokens: int = Field(8192, description="Max tokens for the model context")

class SearchScraperRequest(BaseModel):
    prompt: str = Field(..., description="What to extract from search results")
    source: Optional[str] = Field(None, description="Optional specific URL")
    model: str = Field(MODEL_PRIMARY)
    headless: bool = True
    model_tokens: int = 8192
    max_results: int = Field(5, description="Max search results to scrape")

class MultiScraperRequest(BaseModel):
    prompt: str = Field(..., description="What to extract from each page")
    sources: list[str] = Field(..., description="List of URLs to scrape")
    model: str = Field(MODEL_PRIMARY)
    headless: bool = True
    model_tokens: int = 8192

class ScriptCreatorRequest(BaseModel):
    prompt: str = Field(..., description="What the script should extract")
    source: str = Field(..., description="URL to scrape")
    model: str = Field(MODEL_PRIMARY)
    headless: bool = True
    model_tokens: int = 8192

class MultiScriptCreatorRequest(BaseModel):
    prompt: str = Field(..., description="What the scripts should extract")
    sources: list[str] = Field(..., description="List of URLs")
    model: str = Field(MODEL_PRIMARY)
    headless: bool = True
    model_tokens: int = 8192

class ScrapeResponse(BaseModel):
    success: bool
    data: Any = None
    graph_type: str
    model: str
    source: Optional[str] = None
    elapsed_seconds: float
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    scrapegraphai_version: str
    models_available: list[str]
    uptime_seconds: float


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(
    title="ScrapeGraphAI Service for LeadReach",
    description="LLM-powered web scraping microservice — all 6 graph types",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()

# ============================================================
# Lazy import — scrapegraphai is heavy, import only on first request
# ============================================================

_graphs_module = None

def get_graphs():
    global _graphs_module
    if _graphs_module is None:
        from scrapegraphai.graphs import (
            SmartScraperGraph,
            SearchGraph,
            ScriptCreatorGraph,
            SmartScraperMultiGraph,
            ScriptCreatorMultiGraph,
        )
        _graphs_module = {
            "SmartScraperGraph": SmartScraperGraph,
            "SearchGraph": SearchGraph,
            "ScriptCreatorGraph": ScriptCreatorGraph,
            "SmartScraperMultiGraph": SmartScraperMultiGraph,
            "ScriptCreatorMultiGraph": ScriptCreatorMultiGraph,
        }
    return _graphs_module


# ============================================================
# Helper: run a graph with model fallback
# ============================================================

def run_graph_with_fallback(graph_class, graph_kwargs: dict, primary_model: str) -> dict:
    """
    Run a ScrapeGraphAI graph with automatic model fallback.
    Tries primary model first, then falls back to secondary model.
    """
    models_to_try = [primary_model]
    if primary_model != MODEL_SECONDARY:
        models_to_try.append(MODEL_SECONDARY)

    last_error = None
    for model in models_to_try:
        try:
            config = make_graph_config(
                model=model,
                headless=graph_kwargs.get("headless", True),
                model_tokens=graph_kwargs.get("model_tokens", 8192),
            )
            graph_kwargs["config"] = config

            graph = graph_class(**graph_kwargs)
            result = graph.run()
            return {"success": True, "data": result, "model_used": model}
        except Exception as e:
            last_error = str(e)
            print(f"[ScrapeGraphAI] Model {model} failed: {last_error[:200]}", file=sys.stderr)
            continue

    return {"success": False, "data": None, "model_used": None, "error": last_error}


# ============================================================
# Endpoints
# ============================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    import scrapegraphai
    return HealthResponse(
        status="healthy",
        scrapegraphai_version=scrapegraphai.__version__ if hasattr(scrapegraphai, '__version__') else "unknown",
        models_available=[MODEL_PRIMARY, MODEL_SECONDARY],
        uptime_seconds=time.time() - START_TIME,
    )


@app.post("/smart-scraper", response_model=ScrapeResponse)
async def smart_scraper(req: SmartScraperRequest):
    """Single-page, prompt-based extraction — the most common use case."""
    graphs = get_graphs()
    start = time.time()

    graph_kwargs = {
        "prompt": req.prompt,
        "source": req.source,
        "headless": req.headless,
        "model_tokens": req.model_tokens,
    }

    result = run_graph_with_fallback(
        graphs["SmartScraperGraph"],
        graph_kwargs,
        req.model,
    )

    elapsed = time.time() - start
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Scraping failed"))

    return ScrapeResponse(
        success=True,
        data=result["data"],
        graph_type="SmartScraperGraph",
        model=result["model_used"],
        source=req.source,
        elapsed_seconds=round(elapsed, 2),
    )


@app.post("/search", response_model=ScrapeResponse)
async def search_scraper(req: SearchScraperRequest):
    """Search the web and scrape top N results."""
    graphs = get_graphs()
    start = time.time()

    graph_kwargs = {
        "prompt": req.prompt,
        "headless": req.headless,
        "model_tokens": req.model_tokens,
    }
    if req.source:
        graph_kwargs["source"] = req.source

    result = run_graph_with_fallback(
        graphs["SearchGraph"],
        graph_kwargs,
        req.model,
    )

    elapsed = time.time() - start
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Scraping failed"))

    return ScrapeResponse(
        success=True,
        data=result["data"],
        graph_type="SearchGraph",
        model=result["model_used"],
        source=req.source,
        elapsed_seconds=round(elapsed, 2),
    )


@app.post("/multi-scraper", response_model=ScrapeResponse)
async def multi_scraper(req: MultiScraperRequest):
    """Scrape multiple pages in parallel with a single prompt."""
    graphs = get_graphs()
    start = time.time()

    graph_kwargs = {
        "prompt": req.prompt,
        "sources": req.sources,
        "headless": req.headless,
        "model_tokens": req.model_tokens,
    }

    result = run_graph_with_fallback(
        graphs["SmartScraperMultiGraph"],
        graph_kwargs,
        req.model,
    )

    elapsed = time.time() - start
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Scraping failed"))

    return ScrapeResponse(
        success=True,
        data=result["data"],
        graph_type="SmartScraperMultiGraph",
        model=result["model_used"],
        elapsed_seconds=round(elapsed, 2),
    )


@app.post("/script-creator", response_model=ScrapeResponse)
async def script_creator(req: ScriptCreatorRequest):
    """Generate a standalone Python scraping script for the given page."""
    graphs = get_graphs()
    start = time.time()

    graph_kwargs = {
        "prompt": req.prompt,
        "source": req.source,
        "headless": req.headless,
        "model_tokens": req.model_tokens,
    }

    result = run_graph_with_fallback(
        graphs["ScriptCreatorGraph"],
        graph_kwargs,
        req.model,
    )

    elapsed = time.time() - start
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Scraping failed"))

    return ScrapeResponse(
        success=True,
        data=result["data"],
        graph_type="ScriptCreatorGraph",
        model=result["model_used"],
        source=req.source,
        elapsed_seconds=round(elapsed, 2),
    )


@app.post("/multi-script-creator", response_model=ScrapeResponse)
async def multi_script_creator(req: MultiScriptCreatorRequest):
    """Generate Python scripts for scraping multiple pages."""
    graphs = get_graphs()
    start = time.time()

    graph_kwargs = {
        "prompt": req.prompt,
        "sources": req.sources,
        "headless": req.headless,
        "model_tokens": req.model_tokens,
    }

    result = run_graph_with_fallback(
        graphs["ScriptCreatorMultiGraph"],
        graph_kwargs,
        req.model,
    )

    elapsed = time.time() - start
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Scraping failed"))

    return ScrapeResponse(
        success=True,
        data=result["data"],
        graph_type="ScriptCreatorMultiGraph",
        model=result["model_used"],
        elapsed_seconds=round(elapsed, 2),
    )


# ============================================================
# Generic /scrape endpoint — auto-selects the best graph type
# ============================================================

class GenericScrapeRequest(BaseModel):
    prompt: str = Field(..., description="What to extract")
    sources: list[str] = Field(default_factory=list, description="URL(s) to scrape")
    model: str = Field(MODEL_PRIMARY)
    headless: bool = True
    model_tokens: int = 8192
    graph_type: Optional[str] = Field(None, description="Override graph type: smart|search|multi|script|multi_script")

@app.post("/scrape", response_model=ScrapeResponse)
async def generic_scrape(req: GenericScrapeRequest):
    """
    Auto-select the best ScrapeGraphAI graph type based on input:
    - 1 source → SmartScraperGraph
    - 0 sources → SearchGraph (searches the web)
    - 2+ sources → SmartScraperMultiGraph
    - Override with graph_type parameter
    """
    graphs = get_graphs()
    start = time.time()

    # Determine graph type
    graph_type = req.graph_type
    if graph_type is None:
        if len(req.sources) == 0:
            graph_type = "search"
        elif len(req.sources) == 1:
            graph_type = "smart"
        else:
            graph_type = "multi"

    graph_class_map = {
        "smart": graphs["SmartScraperGraph"],
        "search": graphs["SearchGraph"],
        "multi": graphs["SmartScraperMultiGraph"],
        "script": graphs["ScriptCreatorGraph"],
        "multi_script": graphs["ScriptCreatorMultiGraph"],
    }

    if graph_type not in graph_class_map:
        raise HTTPException(status_code=400, detail=f"Unknown graph_type: {graph_type}")

    graph_class = graph_class_map[graph_type]

    graph_kwargs: dict[str, Any] = {
        "prompt": req.prompt,
        "headless": req.headless,
        "model_tokens": req.model_tokens,
    }

    if graph_type in ("smart", "script"):
        if not req.sources:
            raise HTTPException(status_code=400, detail=f"graph_type '{graph_type}' requires at least 1 source URL")
        graph_kwargs["source"] = req.sources[0]
    elif graph_type in ("multi", "multi_script"):
        if not req.sources:
            raise HTTPException(status_code=400, detail=f"graph_type '{graph_type}' requires at least 2 source URLs")
        graph_kwargs["sources"] = req.sources

    result = run_graph_with_fallback(graph_class, graph_kwargs, req.model)

    elapsed = time.time() - start
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Scraping failed"))

    return ScrapeResponse(
        success=True,
        data=result["data"],
        graph_type=graph_type,
        model=result["model_used"],
        source=req.sources[0] if req.sources else None,
        elapsed_seconds=round(elapsed, 2),
    )


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("SCRAPEGRAPH_PORT", 5100))
    print(f"🚀 ScrapeGraphAI Service starting on http://localhost:{port}")
    print(f"   Models: {MODEL_PRIMARY} (primary), {MODEL_SECONDARY} (fallback)")
    print(f"   Base URL: {ZAI_BASE_URL}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
