"""
Grid-based area scraping module.
Splits a bounding box into cells and runs searches at each cell center
to achieve comprehensive area coverage.
"""

from __future__ import annotations

import asyncio
import logging
import math
from typing import Optional

from .models import GmapsBusiness, GridRequest
from .scraper import GmapsScraper

logger = logging.getLogger("gmaps-scraper")


def generate_grid_points(
    lat_min: float,
    lat_max: float,
    lng_min: float,
    lng_max: float,
    grid_rows: int = 3,
    grid_cols: int = 3,
) -> list[tuple[float, float, int, int]]:
    """
    Generate grid center points from a bounding box.

    Returns:
        List of (lat, lng, row, col) tuples representing the center of each grid cell.
    """
    points = []

    # Calculate step sizes
    lat_step = (lat_max - lat_min) / grid_rows if grid_rows > 1 else 0
    lng_step = (lng_max - lng_min) / grid_cols if grid_cols > 1 else 0

    for row in range(grid_rows):
        for col in range(grid_cols):
            # Calculate the center of this grid cell
            lat = lat_min + lat_step * (row + 0.5)
            lng = lng_min + lng_step * (col + 0.5)
            points.append((lat, lng, row, col))

    return points


def calculate_optimal_zoom(lat_step: float) -> int:
    """
    Calculate an appropriate zoom level based on the grid cell size.

    Args:
        lat_step: The latitude span of one grid cell in degrees

    Returns:
        A zoom level (1-21) appropriate for the cell size.
    """
    # Approximate mapping of latitude span to zoom level
    # At zoom 15, ~0.005° per cell; at zoom 10, ~0.5° per cell
    if lat_step <= 0:
        return 15

    zoom_map = [
        (0.005, 16),
        (0.01, 15),
        (0.02, 14),
        (0.05, 13),
        (0.1, 12),
        (0.2, 11),
        (0.5, 10),
        (1.0, 9),
        (2.0, 8),
        (5.0, 7),
        (10.0, 6),
        (20.0, 5),
        (45.0, 4),
        (90.0, 3),
        (180.0, 2),
    ]

    for span, zoom in zoom_map:
        if lat_step <= span:
            return zoom

    return 2


def deduplicate_results(
    results: list[GmapsBusiness],
) -> list[GmapsBusiness]:
    """
    Remove duplicate businesses based on place_id, data_id, or title+address.
    Keeps the version with the most data filled in.
    """
    seen: dict[str, int] = {}  # key -> index in results
    unique: list[GmapsBusiness] = []

    for biz in results:
        # Create a dedup key
        key = None
        if biz.place_id:
            key = f"pid:{biz.place_id}"
        elif biz.data_id:
            key = f"did:{biz.data_id}"
        elif biz.cid:
            key = f"cid:{biz.cid}"
        elif biz.title and biz.address:
            key = f"ta:{biz.title.lower()}|{biz.address.lower()}"
        elif biz.title:
            key = f"t:{biz.title.lower()}"
        else:
            # No good key, keep it
            unique.append(biz)
            continue

        if key in seen:
            # Compare: keep the one with more fields filled
            existing_idx = seen[key]
            existing = unique[existing_idx]
            existing_fields = sum(1 for v in existing.model_dump().values() if v is not None and v != [] and v != {})
            new_fields = sum(1 for v in biz.model_dump().values() if v is not None and v != [] and v != {})
            if new_fields > existing_fields:
                unique[existing_idx] = biz
        else:
            seen[key] = len(unique)
            unique.append(biz)

    return unique


async def grid_search(
    scraper: GmapsScraper,
    request: GridRequest,
    progress_callback=None,
) -> list[GmapsBusiness]:
    """
    Perform grid-based area scraping.

    Splits the bounding box into a grid, runs a search at each cell center,
    and combines/deduplicates the results.

    Args:
        scraper: The GmapsScraper instance to use
        request: GridRequest with bounding box and search parameters
        progress_callback: Optional async callback(current_cell, total_cells) for progress updates

    Returns:
        Deduplicated list of GmapsBusiness results
    """
    # Generate grid points
    grid_points = generate_grid_points(
        request.lat_min,
        request.lat_max,
        request.lng_min,
        request.lng_max,
        request.grid_rows,
        request.grid_cols,
    )

    total_cells = len(grid_points)
    logger.info(
        f"Grid search: {request.query} | "
        f"Grid: {request.grid_rows}x{request.grid_cols} = {total_cells} cells | "
        f"Bounds: ({request.lat_min}, {request.lng_min}) to ({request.lat_max}, {request.lng_max})"
    )

    all_results: list[GmapsBusiness] = []
    seen_place_ids: set[str] = set()

    for cell_idx, (lat, lng, row, col) in enumerate(grid_points):
        try:
            logger.info(
                f"Scraping cell ({row},{col}) at ({lat:.4f}, {lng:.4f}) "
                f"[{cell_idx+1}/{total_cells}]"
            )

            # Calculate zoom based on cell size
            lat_step = (request.lat_max - request.lat_min) / request.grid_rows
            zoom = calculate_optimal_zoom(lat_step)

            # Build coordinates string
            coordinates = f"{lat},{lng}"

            # Run search for this cell
            cell_results = await scraper.search(
                query=request.query,
                depth=request.depth,
                extract_emails=request.extract_emails,
                email_limit=request.email_limit,
                deep_reviews=request.deep_reviews,
                max_reviews=request.max_reviews,
                coordinates=coordinates,
                zoom=zoom,
            )

            # Add results, avoiding duplicates
            for biz in cell_results:
                pid = biz.place_id or biz.data_id or biz.cid or ""
                if pid and pid in seen_place_ids:
                    continue
                if pid:
                    seen_place_ids.add(pid)
                # Add grid cell info to input_id
                if biz.input_id:
                    biz.input_id = f"{biz.input_id}|grid_{row}_{col}"
                else:
                    biz.input_id = f"grid_{row}_{col}"
                all_results.append(biz)

            logger.info(
                f"Cell ({row},{col}): found {len(cell_results)} results, "
                f"total so far: {len(all_results)}"
            )

            # Progress callback
            if progress_callback:
                try:
                    await progress_callback(cell_idx + 1, total_cells)
                except Exception:
                    pass

            # Respectful delay between cells
            await asyncio.sleep(2)

        except Exception as e:
            logger.error(f"Error scraping cell ({row},{col}): {e}")
            continue

    # Final deduplication
    final_results = deduplicate_results(all_results)
    logger.info(
        f"Grid search complete: {len(final_results)} unique results "
        f"(from {len(all_results)} total)"
    )

    return final_results
