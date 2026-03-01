import os
import json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from utils import get_logger, safe_retry, time_it
from models import NeoEventModel

load_dotenv()
logger = get_logger("neo_fetcher")

@safe_retry
@time_it
def fetch_neo_events():
    """
    Fetches Near Earth Objects (Asteroids) that are making close approaches this week
    using the NASA NeoWs API. This acts as another "event" for our prediction market.
    """
    import requests
    logger.info("Fetching Near Earth Objects (Asteroids) from NASA NeoWs...")
    
    api_key = os.getenv("NASA_API_KEY", "DEMO_KEY")
    
    # We fetch for today and tomorrow
    start_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    end_date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    
    url = f"https://api.nasa.gov/neo/rest/v1/feed?start_date={start_date}&end_date={end_date}&api_key={api_key}"
    
    try:
        response = requests.get(url, timeout=15)
        
        # If the key provided by the user is invalid, we fallback to DEMO_KEY
        if response.status_code == 403:
            logger.warning("Provided NASA API Key seems invalid or rate limited. Falling back to DEMO_KEY.")
            url = f"https://api.nasa.gov/neo/rest/v1/feed?start_date={start_date}&end_date={end_date}&api_key=DEMO_KEY"
            response = requests.get(url, timeout=15)
            
        response.raise_for_status()
        data = response.json()
        
        near_earth_objects = data.get("near_earth_objects", {})
        
        events = []
        for date_str, neos in near_earth_objects.items():
            for neo in neos:
                # We only care about objects that are potentially hazardous
                # OR approach closer than 10 lunar distances (approx 3.8M km)
                is_hazardous = neo.get("is_potentially_hazardous_asteroid", False)
                close_approach_data = neo.get("close_approach_data", [])[0]
                
                miss_distance_lunar = float(close_approach_data["miss_distance"]["lunar"])
                
                if is_hazardous or miss_distance_lunar < 10.0:
                    event_data = {
                        "id": str(neo["id"]),
                        "name": neo["name"],
                        "estimated_diameter_min_km": float(neo["estimated_diameter"]["kilometers"]["estimated_diameter_min"]),
                        "estimated_diameter_max_km": float(neo["estimated_diameter"]["kilometers"]["estimated_diameter_max"]),
                        "is_hazardous": is_hazardous,
                        "close_approach_date": close_approach_data["close_approach_date_full"],
                        "velocity_km_s": float(close_approach_data["relative_velocity"]["kilometers_per_second"]),
                        "miss_distance_km": float(close_approach_data["miss_distance"]["kilometers"]),
                        "miss_distance_lunar": miss_distance_lunar,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }
                    
                    risk_level = "LOW"
                    if is_hazardous:
                        risk_level = "CRITICAL" if miss_distance_lunar < 1.0 else "HIGH"
                    elif miss_distance_lunar < 5.0:
                        risk_level = "MEDIUM"
                        
                    event_data["risk_level"] = risk_level
                    
                    try:
                        validated_neo = NeoEventModel(**event_data)
                        events.append(validated_neo.model_dump())
                    except Exception as e:
                        logger.error(f"Error validating NEO {event_data['name']}: {e}")
                    
        # Sort by closest approach
        events.sort(key=lambda x: x["miss_distance_km"])
        logger.info(f"Successfully identified {len(events)} significant asteroid approaches.")
        return events
        
    except Exception as e:
        logger.error(f"Failed to fetch NEO data: {e}")
        raise e

if __name__ == "__main__":
    neos = fetch_neo_events()
    if neos:
        print(f"Sample NEO Data: {json.dumps(neos[0], indent=2)}")
