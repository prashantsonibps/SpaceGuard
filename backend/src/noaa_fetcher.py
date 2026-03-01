import requests
import json
from datetime import datetime, timezone
from utils import get_logger, safe_retry, time_it
from models import NOAAIndexModel

logger = get_logger("noaa_fetcher")

KP_INDEX_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
F107_INDEX_URL = "https://services.swpc.noaa.gov/json/solar-cycle/f10-7cm-flux.json"

@safe_retry
@time_it
def fetch_kp_index():
    """Fetches the latest Planetary K-Index (Geomagnetic activity)."""
    logger.info("Fetching NOAA Kp-Index...")
    try:
        response = requests.get(KP_INDEX_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Format: [["time_tag", "kp", "a_running", "station_count"], ["2026-03-01 02:00:00.000", "2.33", "9", "8"]]
        if len(data) < 2:
            return None
        
        latest = data[-1]
        kp_value = float(latest[1])
        
        risk_level = "LOW"
        if kp_value >= 5: risk_level = "CRITICAL"
        elif kp_value >= 4: risk_level = "HIGH"
        elif kp_value >= 3: risk_level = "MEDIUM"
        
        index_data = {
            "name": "Kp-Index",
            "value": kp_value,
            "timestamp": latest[0],
            "description": "Measures geomagnetic activity. High values indicate potential GPS and grid interference.",
            "risk_level": risk_level,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
        return NOAAIndexModel(**index_data).model_dump()
    except Exception as e:
        logger.error(f"Failed to fetch Kp-Index: {e}")
        return None

@safe_retry
@time_it
def fetch_f107_index():
    """Fetches the latest F10.7cm Solar Flux (Atmospheric drag indicator)."""
    logger.info("Fetching NOAA F10.7 Solar Flux...")
    try:
        response = requests.get(F107_INDEX_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Format: [{"time_tag": "2026-02-28", "flux": 150.5, ...}, ...]
        if not data:
            return None
        
        latest = data[-1]
        flux_value = float(latest.get("f10.7", 0))
        
        risk_level = "LOW"
        if flux_value >= 250: risk_level = "CRITICAL"
        elif flux_value >= 200: risk_level = "HIGH"
        elif flux_value >= 150: risk_level = "MEDIUM"
        
        index_data = {
            "name": "F10.7 Solar Flux",
            "value": flux_value,
            "timestamp": latest.get("time-tag", ""),
            "description": "Measures solar activity affecting upper atmosphere density and satellite drag.",
            "risk_level": risk_level,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
        return NOAAIndexModel(**index_data).model_dump()
    except Exception as e:
        logger.error(f"Failed to fetch F10.7 Index: {e}")
        return None

def fetch_all_noaa_indices():
    results = []
    kp = fetch_kp_index()
    if kp: results.append(kp)
    f107 = fetch_f107_index()
    if f107: results.append(f107)
    return results

if __name__ == "__main__":
    indices = fetch_all_noaa_indices()
    print(json.dumps(indices, indent=2))
