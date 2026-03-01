import requests
import json
from datetime import datetime, timezone
from utils import get_logger, safe_retry, time_it
from models import FireballModel

logger = get_logger("meteor_fetcher")

FIREBALL_API_URL = "https://ssd-api.jpl.nasa.gov/fireball.api"

@safe_retry
@time_it
def fetch_recent_fireballs(limit=10):
    """Fetches recent fireball events from NASA JPL."""
    logger.info("Fetching recent fireball data from NASA JPL SSD...")
    try:
        # We fetch without any special filters to get the most recent ones
        url = f"{FIREBALL_API_URL}?limit={limit}"
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        # Format: fields: ["date", "energy", "impact-e", "lat", "lat-dir", "lon", "lon-dir", "alt", "vel"], data: [...]
        fields = data.get("fields", [])
        records = data.get("data", [])
        
        fireballs = []
        for rec in records:
            # Map fields to values
            rec_dict = dict(zip(fields, rec))
            
            fb_data = {
                "id": f"FB-{rec_dict['date'].replace(' ', 'T')}",
                "date": rec_dict["date"],
                "energy_kt": float(rec_dict.get("energy") or 0.0),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            
            if rec_dict.get("lat"): fb_data["lat"] = float(rec_dict["lat"])
            if rec_dict.get("lon"): fb_data["lon"] = float(rec_dict["lon"])
            if rec_dict.get("alt"): fb_data["alt"] = float(rec_dict["alt"])
            if rec_dict.get("vel"): fb_data["velocity_km_s"] = float(rec_dict["vel"])
            
            try:
                validated = FireballModel(**fb_data)
                fireballs.append(validated.model_dump())
            except Exception as e:
                logger.error(f"Error validating fireball entry: {e}")
                
        logger.info(f"Successfully processed {len(fireballs)} fireball events.")
        return fireballs
    except Exception as e:
        logger.error(f"Failed to fetch fireball data: {e}")
        return []

if __name__ == "__main__":
    fbs = fetch_recent_fireballs()
    print(json.dumps(fbs, indent=2))
