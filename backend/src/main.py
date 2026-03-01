import os
import sys
import json
import time
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Path setup — allow running from project root or from backend/
# ---------------------------------------------------------------------------
_src_dir = Path(__file__).resolve().parent
if str(_src_dir) not in sys.path:
    sys.path.insert(0, str(_src_dir))

from dotenv import load_dotenv
_backend_dir = _src_dir.parent
load_dotenv(_backend_dir / ".env")
load_dotenv()

from tle_fetcher import get_all_satellite_data
from launch_fetcher import fetch_upcoming_launches
from conjunction_calculator import calculate_conjunctions
from neo_fetcher import fetch_neo_events
from spacetrack_fetcher import fetch_high_interest_tles, fetch_recent_cdms
from noaa_fetcher import fetch_all_noaa_indices
from meteor_fetcher import fetch_recent_fireballs
from n2yo_fetcher import fetch_visual_passes
from db import initialize_db, save_satellites, save_launches, save_conjunctions, save_neo_events
from agent import analyze_risk_and_hedge

# Optional space weather module — pipeline still runs without it
try:
    from space_weather_fetcher import fetch_space_weather_events, save_space_weather_events
    _HAS_SPACE_WEATHER = True
except ImportError:
    _HAS_SPACE_WEATHER = False
    print("⚠  space_weather_fetcher not found — space weather step will be skipped.")


# ---------------------------------------------------------------------------

def run_pipeline():
    print("========================================")
    print("🚀 Starting SpaceGuard Ingestion Pipeline")
    print("========================================\n")

    # ── DB ──────────────────────────────────────────────────────────────────
    try:
        db = initialize_db()
    except Exception as e:
        print(f"❌ Failed to connect to Firebase: {e}")
        print("   Make sure serviceAccountKey.json is in the backend/ folder.")
        return

    satellites = []
    launches = []
    conjunctions = []
    neos = []
    space_weather = []

    # ── Step 1: TLE Data ────────────────────────────────────────────────────
    print("--- 1. Fetching Satellite TLE Data ---")
    try:
        satellites = get_all_satellite_data()
        print(f"Total satellites & debris tracked: {len(satellites)}\n")
        # Save a subset to avoid hitting Firebase write quotas during testing
        save_satellites(db, satellites[:200])
    except Exception as e:
        print(f"❌ TLE / satellite step failed (non-fatal): {e}\n")

    # ── Step 2: Upcoming Launches ────────────────────────────────────────────
    print("\n--- 2. Fetching Upcoming Launches ---")
    try:
        launches = fetch_upcoming_launches()
        print(f"Total upcoming launches fetched: {len(launches)}")
        high_risk_launches = [l for l in launches if l.get("delay_risk") == "HIGH"]
        print(f"High risk / delayed launches detected: {len(high_risk_launches)}\n")
        save_launches(db, launches)
    except Exception as e:
        print(f"❌ Launch fetch step failed (non-fatal): {e}\n")
        high_risk_launches = []

    # ── Step 3: Conjunction Prediction ──────────────────────────────────────
    print("\n--- 3. Running Orbital Conjunction Math ---")
    try:
        subset_sats = satellites[:100] if len(satellites) > 100 else satellites
        conjunctions = calculate_conjunctions(subset_sats, time_window_hours=6)

        if not conjunctions:
            print("No natural conjunctions found. Injecting mock high-risk event for demo...")
            conjunctions = [
                {
                    "asset_id": "MOCK-1",
                    "asset_name": "Demo Asset Alpha",
                    "secondary_id": "DEB-X",
                    "secondary_name": "Unknown Debris",
                    "closest_approach_km": 0.5,
                    "collision_probability": 0.85,
                    "time_of_closest_approach": "2026-03-01T12:00:00Z",
                    "risk_level": "CRITICAL",
                }
            ]
        else:
            print(f"Detected {len(conjunctions)} close approaches!")

        save_conjunctions(db, conjunctions)
    except Exception as e:
        print(f"❌ Conjunction step failed (non-fatal): {e}\n")

    # ── Step 3.5: Near Earth Objects ────────────────────────────────────────
    print("\n--- 3.5 Fetching Near Earth Objects (Asteroids) ---")
    try:
        neos = fetch_neo_events()
        print(f"Total significant asteroid approaches: {len(neos)}")
        save_neo_events(db, neos)
    except Exception as e:
        print(f"❌ NEO step failed (non-fatal): {e}\n")

    # ── Step 3.6: Space Weather ──────────────────────────────────────────────
    print("\n--- 3.6 Fetching Space Weather (NASA DONKI) ---")
    if _HAS_SPACE_WEATHER:
        try:
            space_weather = fetch_space_weather_events(days=7)
            print(f"Total space weather events: {len(space_weather)}")
            save_space_weather_events(db, space_weather)
        except Exception as e:
            print(f"❌ Space weather step failed (non-fatal): {e}\n")
    # ── Step 3.7: Authoritative Data (Space-Track & NOAA) ────────────────────
    print("\n--- 3.7 Authoritative Data (Space-Track & NOAA) ---")
    try:
        # TLEs for ISS and NOAA 19
        st_tles = fetch_high_interest_tles([25544, 33591])
        if st_tles:
            print(f"Fetched {len(st_tles)} authoritative TLEs from Space-Track.")
            save_satellites(db, st_tles)
        
        cdms = fetch_recent_cdms(days=3)
        if cdms:
            print(f"Fetched {len(cdms)} Conjunction Data Messages from Space-Track.")
            save_conjunctions(db, cdms)
            
        noaa_indices = fetch_all_noaa_indices()
        if noaa_indices:
            print(f"Fetched {len(noaa_indices)} NOAA Space Weather indices.")
            # Save to a new collection
            for idx in noaa_indices:
                db.collection("noaa_indices").document(idx["name"].replace(" ", "_")).set(idx)
    except Exception as e:
        print(f"❌ Space-Track / NOAA step failed (non-fatal): {e}\n")

    # ── Step 3.8: Meteor Fireball Data ──────────────────────────────────────
    print("\n--- 3.8 Fetching Meteor Fireball Data ---")
    try:
        fireballs = fetch_recent_fireballs(limit=10)
        print(f"Total recent fireball events: {len(fireballs)}")
        # Save to a new collection
        for fb in fireballs:
            db.collection("fireball_events").document(fb["id"]).set(fb)
    except Exception as e:
        print(f"❌ Meteor fetch step failed (non-fatal): {e}\n")

    # ── Step 3.9: Localized Passes (N2YO demo for ISS) ──────────────────────
    print("\n--- 3.9 Fetching Localized Passes (N2YO Demo) ---")
    try:
        # ISS passes over NASA HQ (approx 38.88, -77.00)
        passes = fetch_visual_passes(25544, 38.88, -77.00)
        if passes:
            print(f"Found {len(passes)} visual passes for ISS.")
            # Save to a new collection
            db.collection("observation_passes").document("ISS_NASA_HQ").set({
                "asset_id": "25544",
                "asset_name": "ISS",
                "location": "NASA HQ",
                "passes": passes,
                "last_updated": datetime.now(timezone.utc).isoformat()
            })
    except Exception as e:
        print(f"❌ N2YO fetch step failed (non-fatal): {e}\n")

    # ── Step 4: LLM Risk Assessment Agent ───────────────────────────────────
    print("\n--- 4. LLM Risk Assessment Agent ---")
    critical_events = [c for c in conjunctions if c.get("risk_level") in ["HIGH", "CRITICAL"]]

    for event in critical_events:
        print(f"\nAnalyzing Conjunction Event for: {event.get('asset_name', 'Unknown')}")
        try:
            decision = analyze_risk_and_hedge(event)
            print(f"  Decision : {decision.get('action')}")
            print(f"  Reasoning: {decision.get('reasoning')}")
            print(f"  Amount   : ${decision.get('hedge_amount_usd', 0):,}")

            event_id = (
                f"{event['asset_id']}_{event['secondary_id']}"
                f"_{event['time_of_closest_approach'][:10]}"
            )
            db.collection("conjunction_events").document(event_id).update(
                {
                    "agent_assessment": decision.get("reasoning"),
                    "hedge_status": decision.get("action"),
                    "hedge_amount_usd": decision.get("hedge_amount_usd", 0),
                    "hedge_type": decision.get("hedge_type", "none"),
                }
            )
            print("  ✅ Saved decision to database")
        except Exception as e:
            print(f"  ❌ Agent analysis failed: {e}")
            print("     (Make sure MISTRAL_API_KEY is set in backend/.env)")

    critical_neos = [n for n in neos if n.get("risk_level") in ["HIGH", "CRITICAL"]]
    for event in critical_neos:
        print(f"\nAnalyzing Asteroid Event for: {event.get('name', 'Unknown')}")
        try:
            decision = analyze_risk_and_hedge(event)
            print(f"  Decision : {decision.get('action')}")
            print(f"  Reasoning: {decision.get('reasoning')}")
            print(f"  Amount   : ${decision.get('hedge_amount_usd', 0):,}")

            db.collection("neo_events").document(str(event["id"])).update(
                {
                    "agent_assessment": decision.get("reasoning"),
                    "hedge_status": decision.get("action"),
                    "hedge_amount_usd": decision.get("hedge_amount_usd", 0),
                    "hedge_type": decision.get("hedge_type", "none"),
                }
            )
            print("  ✅ Saved decision to database")
        except Exception as e:
            print(f"  ❌ Agent analysis failed: {e}")

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n--- Pipeline Summary ---")
    print(f"Satellites tracked        : {len(satellites)}")
    print(f"Upcoming launches         : {len(launches)}")
    print(f"High-risk conjunctions    : {len(critical_events)}")
    print(f"High-risk asteroids       : {len(critical_neos)}")
    print(f"Space weather events      : {len(space_weather)}")
    print("✅ Pipeline run completed successfully!")


if __name__ == "__main__":
    run_pipeline()
