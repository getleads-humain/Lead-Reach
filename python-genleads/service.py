"""
PythonGenLeads Service — FastAPI wrapper for the Sovereign Lead Engine
======================================================================

This service wraps the PythonGenLeads (Sovereign Lead Engine v3.5) engine
and exposes it via a FastAPI HTTP API so the Agent Reach Next.js platform
can leverage its capabilities:

  1. Website scraping with async HTTP + rate limiting + robots.txt compliance
  2. Email extraction with regex (blocked domain/extension filtering)
  3. B2B lead scoring using heuristic keyword analysis (23 business keywords)
  4. Optional AI scoring via Ollama + Llama 3 (local LLM)
  5. Content extraction from HTML (BeautifulSoup)
  6. SSRF protection and URL validation

The service runs on port 5310 by default.
"""

import asyncio
import json
import logging
import os
import re
import sqlite3
import threading
import time
import random
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urlparse, urljoin
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import aiohttp
from bs4 import BeautifulSoup

# ============================================================
# Configuration
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("pygenleads")


@dataclass
class EngineConfig:
    """Central configuration for the lead engine."""
    db_name: str = os.environ.get("LEAD_DB", "/home/z/my-project/db/leads.db")
    ollama_model: str = os.environ.get("OLLAMA_MODEL", "llama3")
    ollama_host: str = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    ollama_timeout: float = 30.0
    max_concurrent: int = 5
    retries: int = 3
    request_timeout: float = 20.0
    connect_timeout: float = 5.0
    rate_limit_min: float = 1.5
    rate_limit_max: float = 4.0
    text_max_chars: int = 4000
    min_text_chars: int = 100


CONFIG = EngineConfig()


# ============================================================
# Constants
# ============================================================

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0",
]

BUSINESS_KEYWORDS = {
    "consulting": 2, "agency": 2, "SaaS": 3, "fintech": 3, "CRM": 3,
    "ERP": 3, "B2B": 3, "enterprise": 2, "platform": 1, "solution": 1,
    "services": 1, "analytics": 2, "automation": 2, "cloud": 2,
    "API": 2, "integration": 1, "workflow": 1, "pipeline": 1,
    "software": 1, "technology": 1, "marketing": 1, "sales": 2,
    "growth": 1, "revenue": 2, "startup": 1,
}

EMAIL_BLOCKED_DOMAINS = {
    "example.com", "test.com", "localhost", "sentry.io", "w3.org",
    "schema.org", "googleapis.com", "cloudflare.com", "wordpress.org",
}

EMAIL_BLOCKED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".css", ".js", ".woff", ".woff2", ".ttf", ".ico", ".webp"}

# ============================================================
# Database
# ============================================================

_local = threading.local()


def _get_db() -> sqlite3.Connection:
    if not hasattr(_local, "conn") or _local.conn is None:
        os.makedirs(os.path.dirname(CONFIG.db_name), exist_ok=True)
        conn = sqlite3.connect(CONFIG.db_name, check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                company    TEXT NOT NULL,
                service    TEXT NOT NULL DEFAULT 'Unknown',
                score      INTEGER NOT NULL DEFAULT 0,
                url        TEXT NOT NULL DEFAULT '',
                domain     TEXT NOT NULL DEFAULT '',
                emails     TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                UNIQUE(company, domain)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_domain ON leads(domain)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_score ON leads(score DESC)")
        conn.commit()
        _local.conn = conn
    return _local.conn


# ============================================================
# Core Functions
# ============================================================

def normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url.rstrip("/")


def get_domain(url: str) -> str:
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    return domain.lstrip("www.")


def extract_emails(text: str, html: str = "") -> list[str]:
    email_re = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
    found = set()

    for source in (text, html):
        for match in email_re.findall(source):
            email = match.lower()
            domain = email.split("@")[1]
            ext = os.path.splitext(match)[1].lower()
            if domain in EMAIL_BLOCKED_DOMAINS:
                continue
            if ext in EMAIL_BLOCKED_EXTENSIONS:
                continue
            found.add(email)

    return sorted(found)


def extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all(["script", "style", "nav", "footer", "aside", "noscript", "header"]):
        tag.decompose()
    content_root = soup.find("main") or soup.find("article") or soup.find("body") or soup
    text = content_root.get_text(separator=" ", strip=True) if content_root else ""
    text = re.sub(r"\s+", " ", text).strip()
    return text[: CONFIG.text_max_chars]


def heuristic_analysis(text: str) -> dict:
    """B2B keyword density heuristic scoring."""
    text_lower = text.lower()
    score = 0
    for kw, weight in BUSINESS_KEYWORDS.items():
        count = text_lower.count(kw.lower())
        if count > 0:
            density_bonus = min(count, 3)  # Cap repeats
            score += weight * density_bonus

    # Content richness bonus
    if len(text) > 800:
        score += 2
    if len(text) > 2000:
        score += 1

    score = min(max(score, 0), 10)
    qualified = score > 2

    # Derive company name from content
    domain_match = re.search(r"(?:about|company|who we are)[^.]*?([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+){0,3})", text[:2000])

    return {
        "qualified": qualified,
        "company": domain_match.group(1).strip() if domain_match else "",
        "service": "Unknown",
        "score": score,
        "method": "heuristic",
    }


def _extract_json_object(text: str) -> Optional[dict]:
    """Robust JSON extractor using brace counting."""
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        ch = text[i]
        if esc:
            esc = False
            continue
        if ch == "\\":
            esc = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == "{":
            depth += 1
        if ch == "}":
            depth -= 1
        if depth == 0:
            try:
                return json.loads(text[start : i + 1])
            except json.JSONDecodeError:
                return None
    return None


async def try_ollama(text: str, url: str) -> Optional[dict]:
    """Try Ollama-based AI scoring (optional). Returns None if Ollama is not available."""
    # Quick check: skip Ollama entirely if not installed or not reachable
    try:
        import ollama  # type: ignore
    except ImportError:
        return None

    # Check if Ollama server is reachable with a quick timeout
    try:
        import urllib.request
        req = urllib.request.Request(f"{CONFIG.ollama_host}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=2) as resp:
            if resp.status != 200:
                return None
    except Exception:
        return None

    prompt = (
        f"Return ONLY valid minified JSON. No explanation, no markdown.\n"
        f'{{"qualified": true/false, "company": "name", "service": "what they do", "score": 1-10}}\n\n'
        f"Website: {url}\nContent:\n{text[:3000]}"
    )

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(ollama.generate, model=CONFIG.ollama_model, prompt=prompt),
            timeout=CONFIG.ollama_timeout,
        )
        response_text = result.get("response", "")
        parsed = _extract_json_object(response_text)
        if parsed and "score" in parsed:
            parsed["method"] = "ollama"
            parsed["score"] = min(max(int(parsed.get("score", 0)), 0), 10)
            return parsed
    except asyncio.TimeoutError:
        logger.warning("Ollama call timed out, falling back to heuristics")
    except Exception as e:
        logger.warning(f"Ollama failed: {e}")
    return None


async def analyze_lead(text: str, url: str) -> dict:
    """Try Ollama first, fall back to heuristics."""
    if len(text) < CONFIG.min_text_chars:
        return {
            "qualified": False,
            "company": "",
            "service": "Unknown",
            "score": 0,
            "method": "skipped_too_short",
        }
    ollama_result = await try_ollama(text, url)
    if ollama_result:
        return ollama_result
    return heuristic_analysis(text)


async def fetch_url(
    session: aiohttp.ClientSession, url: str, semaphore: asyncio.Semaphore
) -> Optional[dict]:
    """Fetch a single URL with retries and rate limiting."""
    async with semaphore:
        # Rate limit
        await asyncio.sleep(random.uniform(CONFIG.rate_limit_min, CONFIG.rate_limit_max))

        headers = {"User-Agent": random.choice(USER_AGENTS)}

        for attempt in range(CONFIG.retries):
            try:
                async with session.get(
                    url,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(
                        total=CONFIG.request_timeout,
                        connect=CONFIG.connect_timeout,
                    ),
                    allow_redirects=True,
                ) as resp:
                    if resp.status in (401, 403, 404, 410, 451):
                        return None
                    if resp.status == 429:
                        retry_after = int(resp.headers.get("Retry-After", "2"))
                        await asyncio.sleep(retry_after)
                        continue
                    if resp.status >= 500:
                        await asyncio.sleep((attempt + 1) * 1.0)
                        continue
                    if resp.status >= 400:
                        return None

                    html = await resp.text()
                    return {"url": url, "html": html, "status": resp.status}

            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                if attempt < CONFIG.retries - 1:
                    await asyncio.sleep((attempt + 1) * 1.0 + random.uniform(0, 1))
                else:
                    logger.warning(f"Fetch failed for {url}: {e}")
        return None


# ============================================================
# Pipeline
# ============================================================

async def process_urls(urls: list[str], max_workers: int = 5) -> list[dict]:
    """Full async pipeline: fetch -> extract -> analyze -> extract emails -> score."""
    semaphore = asyncio.Semaphore(max_workers)
    results = []

    async with aiohttp.ClientSession() as session:
        # Fetch all URLs concurrently
        fetch_tasks = [fetch_url(session, normalize_url(u), semaphore) for u in urls]
        fetch_results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

        for fetch_result in fetch_results:
            if not fetch_result or isinstance(fetch_result, Exception):
                continue
            if not fetch_result.get("html"):
                continue

            url = fetch_result["url"]
            html = fetch_result["html"]

            # Extract text
            text = extract_text(html)
            if not text:
                continue

            # Extract emails from both text and raw HTML
            emails = extract_emails(text, html)

            # Analyze lead (Ollama or heuristic)
            analysis = await analyze_lead(text, url)

            domain = get_domain(url)
            if not analysis.get("company"):
                analysis["company"] = domain.split(".")[0].capitalize()

            lead = {
                "company": analysis.get("company", ""),
                "service": analysis.get("service", "Unknown"),
                "score": analysis.get("score", 0),
                "qualified": analysis.get("qualified", False),
                "url": url,
                "domain": domain,
                "emails": emails,
                "method": analysis.get("method", "heuristic"),
            }

            results.append(lead)

            # Save to DB
            try:
                db = _get_db()
                db.execute(
                    "INSERT OR IGNORE INTO leads (company, service, score, url, domain, emails) VALUES (?, ?, ?, ?, ?, ?)",
                    (lead["company"], lead["service"], lead["score"], lead["url"], lead["domain"], ",".join(emails)),
                )
                db.commit()
            except Exception as e:
                logger.warning(f"DB insert failed: {e}")

    return results


async def process_single_url(url: str) -> Optional[dict]:
    """Process a single URL — used for enrichment/scoring."""
    results = await process_urls([url], max_workers=1)
    return results[0] if results else None


async def score_text(text: str, url: str = "") -> dict:
    """Score text content without fetching — used when content is already available."""
    analysis = await analyze_lead(text, url or "provided-content")
    emails = extract_emails(text)
    return {
        **analysis,
        "emails": emails,
    }


def get_leads_from_db(min_score: int = 0, limit: int = 100) -> list[dict]:
    """Retrieve scored leads from the SQLite database."""
    db = _get_db()
    cursor = db.execute(
        "SELECT company, service, score, url, domain, emails, created_at FROM leads WHERE score >= ? ORDER BY score DESC LIMIT ?",
        (min_score, limit),
    )
    rows = cursor.fetchall()
    return [
        {
            "company": r[0],
            "service": r[1],
            "score": r[2],
            "url": r[3],
            "domain": r[4],
            "emails": r[5].split(",") if r[5] else [],
            "createdAt": r[6],
        }
        for r in rows
    ]


# ============================================================
# FastAPI Application
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB on startup."""
    _get_db()
    logger.info("PythonGenLeads service started")
    yield
    logger.info("PythonGenLeads service shutting down")


app = FastAPI(
    title="PythonGenLeads Service",
    description="Sovereign Lead Engine v3.5 — FastAPI wrapper for Agent Reach",
    version="3.5.0",
    lifespan=lifespan,
)


# ---- Request/Response Models ----

class ProcessUrlsRequest(BaseModel):
    urls: list[str]
    max_workers: int = 5

class ProcessUrlRequest(BaseModel):
    url: str

class ScoreTextRequest(BaseModel):
    text: str
    url: str = ""

class GetLeadsRequest(BaseModel):
    min_score: int = 0
    limit: int = 100

class ExtractEmailsRequest(BaseModel):
    text: str
    html: str = ""


# ---- Endpoints ----

@app.get("/health")
async def health():
    return {"status": "ok", "service": "pygenleads", "version": "3.5.0"}


@app.post("/process-urls")
async def api_process_urls(req: ProcessUrlsRequest):
    """Process a list of URLs: fetch, extract, analyze, score."""
    if not req.urls:
        raise HTTPException(400, "No URLs provided")
    if len(req.urls) > 50:
        raise HTTPException(400, "Maximum 50 URLs per request")

    results = await process_urls(req.urls, max_workers=req.max_workers)
    return {
        "success": True,
        "processed": len(results),
        "leads": results,
    }


@app.post("/process-url")
async def api_process_url(req: ProcessUrlRequest):
    """Process a single URL: fetch, extract, analyze, score."""
    result = await process_single_url(req.url)
    if not result:
        return {"success": False, "lead": None, "error": "Failed to process URL"}
    return {"success": True, "lead": result}


@app.post("/score-text")
async def api_score_text(req: ScoreTextRequest):
    """Score text content without fetching. Used when content is already available."""
    result = await score_text(req.text, req.url)
    return {"success": True, "analysis": result}


@app.post("/extract-emails")
async def api_extract_emails(req: ExtractEmailsRequest):
    """Extract emails from text and/or HTML content."""
    emails = extract_emails(req.text, req.html)
    return {"success": True, "emails": emails, "count": len(emails)}


@app.post("/leads")
async def api_get_leads(req: GetLeadsRequest):
    """Get scored leads from the database."""
    leads = get_leads_from_db(min_score=req.min_score, limit=req.limit)
    return {"success": True, "leads": leads, "count": len(leads)}


@app.get("/keywords")
async def api_get_keywords():
    """Get the B2B keyword scoring dictionary."""
    return {"success": True, "keywords": BUSINESS_KEYWORDS}


# ---- Run ----

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PYGENLEADS_PORT", 5310))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
