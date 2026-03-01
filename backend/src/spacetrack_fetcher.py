import os
import json
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from spacetrack import SpaceTrackClient
import spacetrack.operators as op
from utils import get_logger, safe_retry, time_it
from models import SpaceTrackTLEModel, CDMModel

load_dotenv()
logger = get_logger("spacetrack")

def _get_client():
    user = os.getenv("SPACETRACK_USER")
    password = os.getenv("SPACETRACK_PASSWORD")
    if not user or not password:
        logger.warning("Space-Track credentials not set. Skipping.")
        return None
    return SpaceTrackClient(identity=user, password=password)

@safe_retry
@time_it
def fetch_high_interest_tles(norad_ids):
    """Fetches latest TLEs for specific NORAD IDs from Space-Track."""
    client = _get_client()
    if not client:
        return []

    logger.info(f"Fetching authoritative TLEs for {len(norad_ids)} objects...")
    try:
        data = client.tle_latest(norad_cat_id=norad_ids, ordinal=1, iter_lines=False)
        tles = []
        for entry in data:
            tle_data = {
                "id": str(entry["NORAD_CAT_ID"]),
                "name": entry["OBJECT_NAME"],
                "tle_line1": entry["TLE_LINE1"],
                "tle_line2": entry["TLE_LINE2"],
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            try:
                validated = SpaceTrackTLEModel(**tle_data)
                tles.append(validated.model_dump())
            except Exception as e:
                logger.error(f"Error validating Space-Track TLE for {tle_data['id']}: {e}")
        
        logger.info(f"Successfully fetched {len(tles)} authoritative TLEs.")
        return tles
    except Exception as e:
        logger.error(f"Space-Track TLE fetch failed: {e}")
        return []

@safe_retry
@time_it
def fetch_recent_cdms(days=3):
    """Fetches recent Conjunction Data Messages (CDMs) from Space-Track."""
    client = _get_client()
    if not client:
        return []

    logger.info(f"Fetching CDMs for the last {days} days...")
    try:
        # We look for CDMs where the TCA is in the future or recent past
        within_days = op.inclusive_range(
            datetime.now(timezone.utc) - timedelta(days=1),
            datetime.now(timezone.utc) + timedelta(days=days)
        )
        data = client.cdm_public(tca=within_days, iter_lines=False)
        
        cdms = []
        for entry in data:
            # Space-Track CDM schema varies, we map it to our CDMModel
            cdm_data = {
                "id": str(entry.get("CDM_ID", f"CDM-{len(cdms)}")),
                "asset_id": str(entry.get("OBJECT1_ID", "Unknown")),
                "asset_name": entry.get("OBJECT1_NAME", "Unknown"),
                "secondary_id": str(entry.get("OBJECT2_ID", "Unknown")),
                "secondary_name": entry.get("OBJECT2_NAME", "Unknown"),
                "tca": entry.get("TCA", datetime.now(timezone.utc).isoformat()),
                "miss_distance_km": float(entry.get("MISS_DISTANCE", 0)),
                "collision_probability": float(entry.get("COLLISION_PROBABILITY", 0)),
                "risk_level": "LOW", # Will be calculated below
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            
            # Risk level logic
            pc = cdm_data["collision_probability"]
            md = cdm_data["miss_distance_km"]
            if pc > 0.001 or md < 0.5:
                cdm_data["risk_level"] = "CRITICAL"
            elif pc > 0.0001 or md < 2.0:
                cdm_data["risk_level"] = "HIGH"
            elif pc > 0.00001 or md < 5.0:
                cdm_data["risk_level"] = "MEDIUM"

            try:
                validated = CDMModel(**cdm_data)
                cdms.append(validated.model_dump())
            except Exception as e:
                logger.error(f"Error validating CDM {cdm_data['id']}: {e}")
                
        logger.info(f"Successfully fetched {len(cdms)} CDMs from Space-Track.")
        return cdms
    except Exception as e:
        logger.error(f"Space-Track CDM fetch failed: {e}")
        return []

if __name__ == "__main__":
    # Test with ISS (25544)
    tles = fetch_high_interest_tles([25544])
    print(json.dumps(tles, indent=2))
    cdms = fetch_recent_cdms(days=1)
    print(f"CDMs found: {len(cdms)}")
