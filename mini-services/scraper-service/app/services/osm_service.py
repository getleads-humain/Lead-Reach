"""OpenStreetMap Overpass API service - Place-based lead discovery."""
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def search_places(
    query: Optional[str] = None,
    bbox: Optional[List[float]] = None,
    tags: Optional[Dict[str, str]] = None,
    center_lat: Optional[float] = None,
    center_lng: Optional[float] = None,
    radius_km: float = 5.0,
    limit: int = 50,
) -> Dict[str, Any]:
    """Search OpenStreetMap via Overpass API for businesses and places."""

    # Build Overpass QL query
    if query:
        # Text search: find nodes/ways with name matching query
        tag_filter = ""
        if tags:
            tag_filter = "".join(f'["{k}"="{v}"]' for k, v in tags.items())

        if center_lat and center_lng:
            # Around a center point
            radius_m = int(radius_km * 1000)
            overpass_query = f"""
            [out:json][timeout:25];
            (nwr["name"~"{query}",i]{tag_filter}(around:{radius_m},{center_lat},{center_lng});
            );
            out center {limit};
            """
        elif bbox:
            south, west, north, east = bbox
            overpass_query = f"""
            [out:json][timeout:25];
            (nwr["name"~"{query}",i]{tag_filter}({south},{west},{north},{east});
            );
            out center {limit};
            """
        else:
            # Global search (limited)
            overpass_query = f"""
            [out:json][timeout:25];
            (nwr["name"~"{query}",i]{tag_filter};
            );
            out center {limit};
            """
    elif tags:
        # Tag-only search
        tag_filter = "".join(f'["{k}"="{v}"]' for k, v in tags.items())
        if center_lat and center_lng:
            radius_m = int(radius_km * 1000)
            overpass_query = f"""
            [out:json][timeout:25];
            (nwr{tag_filter}(around:{radius_m},{center_lat},{center_lng});
            );
            out center {limit};
            """
        elif bbox:
            south, west, north, east = bbox
            overpass_query = f"""
            [out:json][timeout:25];
            (nwr{tag_filter}({south},{west},{north},{east});
            );
            out center {limit};
            """
        else:
            overpass_query = f"""
            [out:json][timeout:25];
            (nwr{tag_filter};
            );
            out center {limit};
            """
    else:
        return {"places": [], "count": 0, "error": "Either query or tags must be provided", "data_source": "osm"}

    try:
        import requests

        resp = requests.post(OVERPASS_URL, data={"data": overpass_query}, timeout=30)

        places = []
        if resp.status_code == 200:
            data = resp.json()
            elements = data.get("elements", [])

            for el in elements[:limit]:
                tags = el.get("tags", {})

                # Get coordinates
                lat = el.get("lat") or el.get("center", {}).get("lat")
                lon = el.get("lon") or el.get("center", {}).get("lon")

                # Determine place type
                place_type = "unknown"
                place_category = ""
                for key in ["amenity", "shop", "office", "tourism", "leisure", "craft", "healthcare", "building"]:
                    if key in tags:
                        place_type = key
                        place_category = tags[key]
                        break

                place = {
                    "name": tags.get("name", ""),
                    "type": place_type,
                    "category": place_category,
                    "lat": lat,
                    "lon": lon,
                    "address": _format_address(tags),
                    "opening_hours": tags.get("opening_hours", ""),
                    "website": tags.get("website", tags.get("contact:website", "")),
                    "phone": tags.get("phone", tags.get("contact:phone", "")),
                    "email": tags.get("email", tags.get("contact:email", "")),
                    "tags": {k: v for k, v in tags.items() if k not in ["name", "opening_hours", "website", "phone", "email", "addr:street", "addr:housenumber", "addr:city", "addr:postcode", "addr:country"]},
                    "osm_id": f"{el.get('type', '')}/{el.get('id', '')}",
                }
                places.append(place)

        return {
            "places": places,
            "count": len(places),
            "query_used": overpass_query.strip(),
            "data_source": "osm",
        }

    except Exception as e:
        logger.error(f"OSM Overpass error: {e}")
        return {"places": [], "count": 0, "error": str(e), "data_source": "osm"}


def _format_address(tags: dict) -> str:
    """Format OSM address tags into a readable address string."""
    parts = []
    if tags.get("addr:housenumber"):
        parts.append(tags["addr:housenumber"])
    if tags.get("addr:street"):
        parts.append(tags["addr:street"])
    if tags.get("addr:city"):
        parts.append(tags["addr:city"])
    if tags.get("addr:postcode"):
        parts.append(tags["addr:postcode"])
    if tags.get("addr:country"):
        parts.append(tags["addr:country"])
    return ", ".join(parts) if parts else ""
