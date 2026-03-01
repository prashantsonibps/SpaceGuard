import os
import requests
import json
from datetime import datetime, timezone
from utils import get_logger, safe_retry, time_it

logger = get_logger("n2yo_fetcher")

N2YO_BASE_URL = "https://api.n2yo.com/rest/v1/satellite"

def _get_api_key():
    return os.getenv("N2YO_API_KEY")

@safe_retry
@time_it
def fetch_visual_passes(norad_id, lat, lon, alt=0, days=2, min_visibility=60):
    """Fetches upcoming visual passes for a satellite over a specific location."""
    api_key = _get_api_key()
    if not api_key:
        logger.warning("N2YO API Key not set. Skipping pass prediction.")
        return []

    logger.info(f"Fetching visual passes for {norad_id} over ({lat}, {lon})...")
    try:
        url = f"{N2YO_BASE_URL}/visualpasses/{norad_id}/{lat}/{lon}/{alt}/{days}/{min_visibility}/&apiKey={api_key}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        passes = data.get("passes", [])
        logger.info(f"Found {len(passes)} visual passes for {norad_id}.")
        return passes
    except Exception as e:
        logger.error(f"Failed to fetch passes from N2YO: {e}")
        return []

if __name__ == "__main__":
    # Test with ISS (25544) over SF (37.77, -122.41)
    # Requires N2YO_API_KEY in .env
    from dotenv import load_dotenv
    load_dotenv()
    passes = fetch_visual_passes(25544, 37.77, -122.41)
    print(json.dumps(passes, indent=2))
