import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
from utils import get_logger, safe_retry, time_it
from models import SatelliteModel

load_dotenv()
logger = get_logger("tle_fetcher")

# Celestrak free API endpoints (no auth required)
CELESTRAK_ACTIVE_SATS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
CELESTRAK_DEBRIS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=1999-025&FORMAT=tle"  # Fengyun-1C debris



@safe_retry
@time_it
def fetch_tle_data(url):
    """Fetches raw TLE data from a Celestrak URL. Returns [] on any failure."""
    import requests
    logger.info(f"Fetching TLEs from {url}...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        lines = response.text.strip().split("\n")
        satellites = []

        for i in range(0, len(lines), 3):
            if i + 2 < len(lines):
                name = lines[i].strip()
                line1 = lines[i + 1].strip()
                line2 = lines[i + 2].strip()

                try:
                    sat_id = line1[2:7].strip()
                    sat_data = {
                        "id": sat_id,
                        "name": name,
                        "tle_line1": line1,
                        "tle_line2": line2,
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                    }
                    # Validate with Pydantic
                    validated_sat = SatelliteModel(**sat_data)
                    satellites.append(validated_sat.model_dump())
                except Exception as e:
                    logger.error(f"Error parsing/validating TLE for {name}: {e}")

        logger.info(f"Successfully parsed {len(satellites)} satellites.")
        return satellites

    except Exception as e:
        logger.error(f"Failed to fetch TLE data from {url}: {e}")
        raise e  # Let safe_retry handle it


def get_all_satellite_data():
    """
    Fetches active satellites and tracked debris from Celestrak.
    """
    try:
        active_sats = fetch_tle_data(CELESTRAK_ACTIVE_SATS_URL)
    except Exception:
        active_sats = []

    try:
        debris = fetch_tle_data(CELESTRAK_DEBRIS_URL)
    except Exception:
        debris = []

    combined = active_sats + debris

    if not combined:
        logger.error("⚠ Failed to fetch any satellite data from Celestrak.")
        return []

    return combined


if __name__ == "__main__":
    sats = get_all_satellite_data()
    print(f"Total objects tracked: {len(sats)}")
    if sats:
        print(f"Sample data: {json.dumps(sats[0], indent=2)}")
