import requests
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# We'll use the free Celestrak API endpoints which don't require auth
# for the active satellites catalog
CELESTRAK_ACTIVE_SATS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
CELESTRAK_DEBRIS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=1999-025&FORMAT=tle" # Fengyun-1C debris as example

def fetch_tle_data(url):
    """Fetches TLE data from a given Celestrak URL."""
    print(f"Fetching TLEs from {url}...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Parse the 3-line format (Name, Line 1, Line 2)
        lines = response.text.strip().split('\n')
        satellites = []
        
        # Process in chunks of 3 lines
        for i in range(0, len(lines), 3):
            if i + 2 < len(lines):
                name = lines[i].strip()
                line1 = lines[i+1].strip()
                line2 = lines[i+2].strip()
                
                # Extract Satellite Catalog Number (NORAD ID) from line 1
                try:
                    sat_id = line1[2:7].strip()
                    
                    satellites.append({
                        "id": sat_id,
                        "name": name,
                        "tle_line1": line1,
                        "tle_line2": line2,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    })
                except Exception as e:
                    print(f"Error parsing TLE for {name}: {e}")
                    
        print(f"Successfully parsed {len(satellites)} satellites.")
        return satellites
        
    except Exception as e:
        print(f"Failed to fetch TLE data: {e}")
        return []

def get_all_satellite_data():
    """Fetches both active satellites and tracked debris."""
    active_sats = fetch_tle_data(CELESTRAK_ACTIVE_SATS_URL)
    debris = fetch_tle_data(CELESTRAK_DEBRIS_URL)
    
    # In a real scenario we'd push this to Firestore. 
    # For now, we just return the combined list.
    return active_sats + debris

if __name__ == "__main__":
    # Test the fetcher
    sats = get_all_satellite_data()
    print(f"Total objects tracked: {len(sats)}")
    if sats:
        print(f"Sample data: {json.dumps(sats[0], indent=2)}")
