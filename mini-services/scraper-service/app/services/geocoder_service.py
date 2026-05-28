"""Geocoder service - Address geocoding and reverse geocoding."""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def geocode_address(address: str, provider: str = "osm") -> Dict[str, Any]:
    """Geocode an address to coordinates."""
    try:
        import geocoder
        g = geocoder.get(address, provider=provider)

        if g.ok:
            result = {
                "address": address,
                "lat": g.lat,
                "lng": g.lng,
                "postal": g.postal,
                "city": g.city,
                "state": g.state,
                "country": g.country,
                "provider": provider,
                "data_source": "geocoder",
            }
            # Try to get timezone
            try:
                result["timezone"] = g.json.get("timezone", "") if g.json else ""
            except Exception:
                result["timezone"] = ""
            # Try to get admin area
            try:
                result["administrative_area"] = g.json.get("administrative_area_level_1", "") if g.json else ""
            except Exception:
                result["administrative_area"] = ""

            return result
        else:
            return {"error": f"Could not geocode address: {address}", "data_source": "geocoder"}

    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return {"error": str(e), "data_source": "geocoder"}


def reverse_geocode(lat: float, lng: float, provider: str = "osm") -> Dict[str, Any]:
    """Reverse geocode coordinates to an address."""
    try:
        import geocoder
        g = geocoder.get([lat, lng], method="reverse", provider=provider)

        if g.ok:
            return {
                "lat": lat,
                "lng": lng,
                "address": g.address,
                "postal": g.postal,
                "city": g.city,
                "state": g.state,
                "country": g.country,
                "provider": provider,
                "data_source": "geocoder",
            }
        else:
            return {"error": f"Could not reverse geocode: {lat}, {lng}", "data_source": "geocoder"}

    except Exception as e:
        logger.error(f"Reverse geocoding error: {e}")
        return {"error": str(e), "data_source": "geocoder"}


def compute_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute straight-line distance in km between two coordinates using Haversine formula."""
    import math
    R = 6371  # Earth's radius in km
    dLat = math.radians(lat2 - lat1)
    dLng = math.radians(lng2 - lng1)
    a = (math.sin(dLat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)
