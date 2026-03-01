import requests
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# Celestrak free API endpoints (no auth required)
CELESTRAK_ACTIVE_SATS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
CELESTRAK_DEBRIS_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=1999-025&FORMAT=tle"  # Fengyun-1C debris

# ---------------------------------------------------------------------------
# Sample fallback TLE data — used when Celestrak is unreachable.
# Contains 5 well-known objects so that the pipeline + conjunction step still
# produce meaningful output even without a live network connection.
# ---------------------------------------------------------------------------
SAMPLE_TLE_DATA = [
    {
        "id": "25544",
        "name": "ISS (ZARYA)",
        "tle_line1": "1 25544U 98067A   24060.50000000  .00018440  00000+0  33414-3 0  9997",
        "tle_line2": "2 25544  51.6416 345.9189 0004928 322.8687 186.2950 15.50085859420045",
    },
    {
        "id": "29155",
        "name": "NOAA 19",
        "tle_line1": "1 33591U 09005A   24060.50000000  .00000079  00000+0  65838-4 0  9996",
        "tle_line2": "2 33591  99.1687  60.4783 0013692 112.0884 248.1716 14.12396832774898",
    },
    {
        "id": "25994",
        "name": "TERRA",
        "tle_line1": "1 25994U 99068A   24060.50000000  .00000054  00000+0  18028-4 0  9993",
        "tle_line2": "2 25994  98.2075 115.3904 0001284  84.1017 276.0289 14.57118613272826",
    },
    {
        "id": "44713",
        "name": "STARLINK-1007",
        "tle_line1": "1 44713U 19074A   24060.50000000  .00001120  00000+0  88030-4 0  9991",
        "tle_line2": "2 44713  52.9956  87.3652 0001553  56.4278 303.6869 15.05670434234812",
    },
    {
        "id": "25730",
        "name": "COSMOS 2251 DEB",
        "tle_line1": "1 25730U 99025DEB  24060.50000000  .00000100  00000+0  14700-4 0  9999",
        "tle_line2": "2 25730  74.0368 335.4811 0044692 342.5161  17.3503 14.34819939278124",
    },
]


def _stamp_now(satellites):
    """Adds last_updated timestamp to a list of satellite dicts."""
    now = datetime.now(timezone.utc).isoformat()
    for s in satellites:
        s["last_updated"] = now
    return satellites


def fetch_tle_data(url):
    """Fetches raw TLE data from a Celestrak URL. Returns [] on any failure."""
    print(f"Fetching TLEs from {url}...")
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
                    satellites.append(
                        {
                            "id": sat_id,
                            "name": name,
                            "tle_line1": line1,
                            "tle_line2": line2,
                            "last_updated": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                except Exception as e:
                    print(f"  Error parsing TLE for {name}: {e}")

        print(f"  Successfully parsed {len(satellites)} satellites.")
        return satellites

    except Exception as e:
        print(f"  Failed to fetch TLE data from {url}: {e}")
        return []


def get_all_satellite_data():
    """
    Fetches active satellites and tracked debris from Celestrak.
    If both endpoints fail (e.g. SSL/network error) the function returns
    SAMPLE_TLE_DATA so that the pipeline and frontend can still run.
    """
    active_sats = fetch_tle_data(CELESTRAK_ACTIVE_SATS_URL)
    debris = fetch_tle_data(CELESTRAK_DEBRIS_URL)

    combined = active_sats + debris

    if not combined:
        print(
            "\n⚠  Celestrak unreachable; using sample TLE data so pipeline and frontend can run.\n"
            "   (5 well-known objects: ISS, NOAA-19, Terra, Starlink-1007, COSMOS 2251 DEB)\n"
        )
        return _stamp_now(list(SAMPLE_TLE_DATA))  # return a fresh copy

    return combined


if __name__ == "__main__":
    sats = get_all_satellite_data()
    print(f"Total objects tracked: {len(sats)}")
    if sats:
        print(f"Sample data: {json.dumps(sats[0], indent=2)}")
