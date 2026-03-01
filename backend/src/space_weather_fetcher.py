"""
space_weather_fetcher.py
Fetches solar / space weather events from NASA DONKI API and persists them
to Firestore. Designed to be non-blocking: any network or parse failure is
caught and logged so the main pipeline continues.
"""

import os
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

# NASA DONKI base URL
DONKI_BASE_URL = "https://api.nasa.gov/DONKI"

# Short timeout so a slow/unreachable DONKI server doesn't stall the pipeline
REQUEST_TIMEOUT_S = 8


def _donki_url(endpoint, start_date, end_date, api_key):
    return (
        f"{DONKI_BASE_URL}/{endpoint}"
        f"?startDate={start_date}&endDate={end_date}&api_key={api_key}"
    )


def fetch_space_weather_events(days=7):
    """
    Fetches Coronal Mass Ejections (CME) and Solar Flares (FLR) from NASA DONKI
    for the past `days` days.

    Returns a list of event dicts, or [] on any failure.
    """
    api_key = os.getenv("NASA_API_KEY", "DEMO_KEY")
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)

    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")

    events = []

    # --- Coronal Mass Ejections ---
    try:
        print(f"  Fetching CME data ({start_str} → {end_str})...")
        resp = requests.get(
            _donki_url("CME", start_str, end_str, api_key),
            timeout=REQUEST_TIMEOUT_S,
        )
        resp.raise_for_status()
        cme_list = resp.json() or []
        for cme in cme_list:
            events.append(
                {
                    "id": cme.get("activityID", f"CME-{len(events)}"),
                    "type": "CME",
                    "start_time": cme.get("startTime", ""),
                    "note": cme.get("note", "No details"),
                    "catalog": cme.get("catalog", ""),
                    "instruments": [
                        i.get("displayName", "")
                        for i in cme.get("instruments", [])
                    ],
                    "risk_level": _cme_risk(cme),
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                }
            )
        print(f"  CME events found: {len(cme_list)}")
    except Exception as e:
        print(f"  ⚠  CME fetch failed (non-fatal): {e}")

    # --- Solar Flares ---
    try:
        print(f"  Fetching Solar Flare data ({start_str} → {end_str})...")
        resp = requests.get(
            _donki_url("FLR", start_str, end_str, api_key),
            timeout=REQUEST_TIMEOUT_S,
        )
        resp.raise_for_status()
        flr_list = resp.json() or []
        for flr in flr_list:
            events.append(
                {
                    "id": flr.get("flrID", f"FLR-{len(events)}"),
                    "type": "SOLAR_FLARE",
                    "start_time": flr.get("beginTime", ""),
                    "peak_time": flr.get("peakTime", ""),
                    "end_time": flr.get("endTime", ""),
                    "class_type": flr.get("classType", "Unknown"),
                    "source_location": flr.get("sourceLocation", ""),
                    "instruments": [
                        i.get("displayName", "")
                        for i in flr.get("instruments", [])
                    ],
                    "risk_level": _flr_risk(flr.get("classType", "")),
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                }
            )
        print(f"  Solar flare events found: {len(flr_list)}")
    except Exception as e:
        print(f"  ⚠  Solar Flare fetch failed (non-fatal): {e}")

    return events


def _cme_risk(cme):
    """Assigns a rough risk level to a CME based on its note text."""
    note = (cme.get("note") or "").lower()
    if any(w in note for w in ["strong", "major", "x-class", "severe"]):
        return "HIGH"
    if any(w in note for w in ["moderate", "m-class"]):
        return "MEDIUM"
    return "LOW"


def _flr_risk(class_type):
    """
    X-class flares → CRITICAL/HIGH, M-class → MEDIUM, C/B/A → LOW.
    class_type is something like 'X1.0', 'M5.2', 'C3.2'.
    """
    if not class_type:
        return "LOW"
    upper = class_type.upper()
    if upper.startswith("X"):
        try:
            magnitude = float(upper[1:])
            return "CRITICAL" if magnitude >= 2.0 else "HIGH"
        except ValueError:
            return "HIGH"
    if upper.startswith("M"):
        return "MEDIUM"
    return "LOW"


def save_space_weather_events(db, events):
    """
    Saves space weather events to the Firestore 'space_weather_events'
    collection. Each event is stored by its unique ID.
    """
    if not events:
        print("  No space weather events to save.")
        return

    print(f"  Saving {len(events)} space weather events to Firestore...")
    batch = db.batch()
    col_ref = db.collection("space_weather_events")

    count = 0
    for event in events:
        doc_ref = col_ref.document(str(event["id"]).replace("/", "_"))
        batch.set(doc_ref, event, merge=True)
        count += 1

        if count % 450 == 0:
            batch.commit()
            batch = db.batch()

    if count % 450 != 0:
        batch.commit()

    print("  ✅ Finished saving space weather events.")


if __name__ == "__main__":
    import json

    events = fetch_space_weather_events(days=7)
    print(f"\nTotal space weather events: {len(events)}")
    if events:
        print(json.dumps(events[0], indent=2))
