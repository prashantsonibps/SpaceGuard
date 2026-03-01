import os
import json
import time as _time
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from utils import get_logger, safe_retry, time_it
from models import LaunchModel, WeatherModel

load_dotenv()
logger = get_logger("launch_fetcher")

# ---------------------------------------------------------------------------
# LL2 v2.2.0 – Dev endpoint (authenticated, 15 req/hr free tier)
# v2.3.0 returns 404 on both hosts; v2.2.0 is the latest working version.
# ---------------------------------------------------------------------------
LAUNCH_API_URL = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=10"
OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"

# Local cache file – keeps last response so we never exceed 15 calls/hour
_CACHE_FILE = Path(__file__).resolve().parent.parent / ".launch_cache.json"
_CACHE_MAX_AGE_SEC = 15 * 60  # 15 minutes → max 4 calls/hour


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------
def _read_cache():
    """Return (launches_list, cache_age_seconds) or (None, inf)."""
    try:
        if _CACHE_FILE.exists():
            raw = json.loads(_CACHE_FILE.read_text())
            cached_at = raw.get("cached_at", 0)
            age = _time.time() - cached_at
            return raw.get("launches", []), age
    except Exception as e:
        logger.warning(f"Cache read failed (will fetch live): {e}")
    return None, float("inf")


def _write_cache(launches: list):
    try:
        _CACHE_FILE.write_text(json.dumps({
            "cached_at": _time.time(),
            "launches": launches,
        }))
    except Exception as e:
        logger.warning(f"Cache write failed: {e}")


# ---------------------------------------------------------------------------
# Weather helper (unchanged)
# ---------------------------------------------------------------------------
@safe_retry
def fetch_weather_for_pad(lat, lon):
    """Fetches real-time weather at launch pad using OpenWeather API."""
    import requests
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key or not lat or not lon:
        return None

    try:
        url = f"{OPENWEATHER_API_URL}?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            weather_data = {
                "temp_c": data["main"]["temp"],
                "wind_speed_ms": data["wind"]["speed"],
                "conditions": data["weather"][0]["main"],
                "description": data["weather"][0]["description"]
            }
            return WeatherModel(**weather_data).model_dump()
        else:
            logger.warning(f"Weather API returned {response.status_code}. (Key might be invalid or not activated yet)")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch weather: {e}")
        return None


# ---------------------------------------------------------------------------
# Main fetcher – with auth + caching
# ---------------------------------------------------------------------------
@safe_retry
@time_it
def fetch_upcoming_launches():
    """Fetches upcoming launches from LL2 v2.3.0 with auth & caching.

    Rate-limit strategy:
    • Cached data younger than 15 min is reused immediately.
    • This guarantees ≤4 LL2 calls/hour, well within the 15/hr free tier.
    """
    import requests

    # --- Check cache first ---------------------------------------------------
    cached, age = _read_cache()
    if cached is not None and age < _CACHE_MAX_AGE_SEC:
        logger.info(f"Returning {len(cached)} launches from cache ({int(age)}s old, limit {_CACHE_MAX_AGE_SEC}s).")
        return cached

    # --- Live fetch -----------------------------------------------------------
    logger.info("Fetching upcoming launches from LL2 v2.3.0...")
    headers = {"User-Agent": "SpaceGuard-Hackathon-Project/1.0"}

    ll2_key = os.getenv("LL2_API_KEY")
    if ll2_key:
        headers["Authorization"] = f"Token {ll2_key}"
        logger.info("Using authenticated LL2 request.")
    else:
        logger.warning("LL2_API_KEY not set – using unauthenticated (stricter rate limits).")

    try:
        response = requests.get(LAUNCH_API_URL, headers=headers, timeout=15)

        # --- Rate limit guard: do NOT retry on 403/429 ----------------------
        if response.status_code in (403, 429):
            logger.warning(
                f"LL2 rate-limited ({response.status_code}). "
                "Will NOT retry — falling back to cache."
            )
            if cached is not None:
                logger.info(f"Returning stale cache ({int(age)}s old) after rate-limit.")
                return cached
            logger.error("No cache available and rate-limited. Returning empty list.")
            return []

        response.raise_for_status()

        data = response.json()
        launches = []

        for launch in data.get("results", []):
            probability = launch.get("probability")
            if probability is None:
                probability = -1.0

            pad = launch.get("pad", {})
            lat = pad.get("latitude")
            lon = pad.get("longitude")

            # Fetch Weather!
            weather_info = fetch_weather_for_pad(lat, lon)

            launch_info = {
                "id": str(launch.get("id")),
                "name": launch.get("name"),
                "status": launch.get("status", {}).get("name", "Unknown"),
                "window_start": launch.get("window_start"),
                "window_end": launch.get("window_end"),
                "provider": launch.get("launch_service_provider", {}).get("name", "Unknown"),
                "location": pad.get("location", {}).get("name", "Unknown"),
                "probability": float(probability),
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "weather": weather_info
            }

            # Smart Prediction Algorithm:
            # If wind > 10m/s, or Thunderstorm/Rain, risk is HIGH.
            risk_level = "LOW"
            if launch_info["status"] == "TBD" or (probability != -1 and probability < 50):
                risk_level = "HIGH"

            if weather_info:
                if weather_info["wind_speed_ms"] > 10.0 or weather_info["conditions"] in ["Thunderstorm", "Rain", "Snow"]:
                    risk_level = "HIGH"

            launch_info["delay_risk"] = risk_level

            # Validate with Pydantic
            try:
                validated_launch = LaunchModel(**launch_info)
                launches.append(validated_launch.model_dump())
            except Exception as e:
                logger.error(f"Error validating launch {launch_info['name']}: {e}")

        logger.info(f"Successfully processed {len(launches)} upcoming launches.")

        # --- Save to cache ----------------------------------------------------
        _write_cache(launches)

        return launches

    except Exception as e:
        logger.error(f"Failed to fetch launch data: {e}")
        # If live fetch fails, fall back to stale cache
        if cached is not None:
            logger.warning(f"Returning stale cache ({int(age)}s old) after live fetch failure.")
            return cached
        raise e


if __name__ == "__main__":
    launches = fetch_upcoming_launches()
    if launches:
        print(f"Sample data: {json.dumps(launches[0], indent=2)}")
