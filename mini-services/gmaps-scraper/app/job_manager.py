"""Job manager for async scrape jobs with SQLite persistence."""
import asyncio
import json
import uuid
import time
import logging
from typing import Optional, List, Dict, Any

import aiosqlite

from app.models import ScrapeJob, GmapsBusiness, ScrapeOptions

logger = logging.getLogger("gmaps-scraper.jobs")

DB_PATH = "/home/z/my-project/mini-services/gmaps-scraper/jobs.db"


class JobManager:
    """Manage scrape jobs with SQLite persistence."""

    def __init__(self):
        self._db: Optional[aiosqlite.Connection] = None
        self._active_jobs: Dict[str, asyncio.Task] = {}

    async def init(self):
        """Initialize the database."""
        self._db = await aiosqlite.connect(DB_PATH)
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                query TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                progress REAL DEFAULT 0.0,
                total_results INTEGER DEFAULT 0,
                results TEXT DEFAULT '[]',
                created_at TEXT,
                updated_at TEXT,
                options TEXT DEFAULT '{}',
                error TEXT
            )
        """)
        await self._db.commit()

    async def close(self):
        """Close the database."""
        if self._db:
            await self._db.close()

    async def create_job(self, query: str, options: ScrapeOptions = None) -> ScrapeJob:
        """Create a new scrape job."""
        job_id = str(uuid.uuid4())[:8]
        now = time.strftime('%Y-%m-%dT%H:%M:%SZ')

        job = ScrapeJob(
            id=job_id,
            query=query,
            status="pending",
            progress=0.0,
            total_results=0,
            results=[],
            created_at=now,
            updated_at=now,
            options=options or ScrapeOptions()
        )

        await self._db.execute(
            "INSERT INTO jobs (id, query, status, progress, total_results, results, created_at, updated_at, options) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (job.id, job.query, job.status, job.progress, job.total_results,
             json.dumps([]), job.created_at, job.updated_at, job.options.model_dump_json())
        )
        await self._db.commit()

        return job

    async def get_job(self, job_id: str) -> Optional[ScrapeJob]:
        """Get a job by ID."""
        cursor = await self._db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = await cursor.fetchone()
        if not row:
            return None
        return self._row_to_job(row)

    async def list_jobs(self, page: int = 1, limit: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """List jobs with pagination."""
        if status:
            cursor = await self._db.execute(
                "SELECT COUNT(*) FROM jobs WHERE status = ?", (status,))
            count_row = await cursor.fetchone()
            total = count_row[0]
            cursor = await self._db.execute(
                "SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (status, limit, (page - 1) * limit))
        else:
            cursor = await self._db.execute("SELECT COUNT(*) FROM jobs")
            count_row = await cursor.fetchone()
            total = count_row[0]
            cursor = await self._db.execute(
                "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, (page - 1) * limit))

        rows = await cursor.fetchall()
        jobs = [self._row_to_job(row) for row in rows]

        return {"jobs": jobs, "total": total, "page": page, "limit": limit}

    async def update_job(self, job_id: str, **kwargs):
        """Update a job's fields."""
        sets = []
        values = []
        for key, val in kwargs.items():
            if key == 'results':
                sets.append("results = ?")
                values.append(json.dumps([b.model_dump() for b in val]))
            else:
                sets.append(f"{key} = ?")
                values.append(val)

        values.append(time.strftime('%Y-%m-%dT%H:%M:%SZ'))
        sets.append("updated_at = ?")
        values.append(job_id)

        await self._db.execute(
            f"UPDATE jobs SET {', '.join(sets)} WHERE id = ?",
            values
        )
        await self._db.commit()

    async def delete_job(self, job_id: str):
        """Delete a job."""
        await self._db.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        await self._db.commit()

    async def get_active_job_count(self) -> int:
        """Count running/pending jobs."""
        cursor = await self._db.execute(
            "SELECT COUNT(*) FROM jobs WHERE status IN ('pending', 'running')")
        row = await cursor.fetchone()
        return row[0]

    def _row_to_job(self, row) -> ScrapeJob:
        """Convert a database row to a ScrapeJob."""
        results_json = row[5] if row[5] else '[]'
        try:
            results_data = json.loads(results_json)
            results = [GmapsBusiness(**r) for r in results_data]
        except:
            results = []

        options_json = row[8] if len(row) > 8 and row[8] else '{}'
        try:
            options = ScrapeOptions(**json.loads(options_json))
        except:
            options = ScrapeOptions()

        return ScrapeJob(
            id=row[0],
            query=row[1],
            status=row[2],
            progress=row[3],
            total_results=row[4],
            results=results,
            created_at=row[6],
            updated_at=row[7],
            options=options,
            error=row[9] if len(row) > 9 else None
        )


# Global job manager
_job_manager: Optional[JobManager] = None


async def get_job_manager() -> JobManager:
    """Get or create the global job manager."""
    global _job_manager
    if _job_manager is None:
        _job_manager = JobManager()
        await _job_manager.init()
    return _job_manager


async def run_scrape_job(job_id: str, query: str, options: ScrapeOptions):
    """Run a scrape job in the background."""
    from app.scraper import get_scraper

    jm = await get_job_manager()
    try:
        await jm.update_job(job_id, status="running", progress=0.1)

        scraper = await get_scraper()

        if options.fast_mode:
            results = await scraper.search_fast(query, lang=options.lang)
        else:
            results = await scraper.search(
                query,
                depth=options.depth,
                lang=options.lang,
                geo=options.geo,
                zoom=options.zoom
            )

        # Email extraction if requested
        if options.email and results:
            from app.email_extractor import extract_emails_from_url
            for i, biz in enumerate(results[:20]):  # Limit email extraction to top 20
                if biz.website:
                    try:
                        emails = await extract_emails_from_url(biz.website)
                        biz.emails = emails
                    except:
                        pass
                await asyncio.sleep(0.5)
                await jm.update_job(job_id, progress=0.5 + (i / len(results[:20])) * 0.4)

        await jm.update_job(
            job_id,
            status="completed",
            progress=1.0,
            total_results=len(results),
            results=results
        )

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        await jm.update_job(job_id, status="failed", error=str(e))
