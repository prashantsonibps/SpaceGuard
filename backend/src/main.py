import os
import json
import time
from tle_fetcher import get_all_satellite_data
from launch_fetcher import fetch_upcoming_launches
from conjunction_calculator import calculate_conjunctions
from db import initialize_db, save_satellites, save_launches, save_conjunctions

def run_pipeline():
    print("========================================")
    print("🚀 Starting SpaceGuard Ingestion Pipeline")
    print("========================================\n")
    
    # Initialize Database Connection
    try:
        db = initialize_db()
    except Exception as e:
        print(f"Failed to connect to Firebase: {e}")
        print("Please make sure you downloaded your Firebase Admin SDK JSON file and saved it as backend/serviceAccountKey.json")
        return

    # 1. Fetch TLE Data
    print("--- 1. Fetching Satellite TLE Data ---")
    satellites = get_all_satellite_data()
    print(f"Total satellites & debris tracked: {len(satellites)}\n")
    
    # Save a subset to avoid blowing up Firebase quotas during testing
    # For production/real demo you can upload all
    save_satellites(db, satellites[:200])

    # 2. Fetch Launch Delays
    print("\n--- 2. Fetching Upcoming Launches ---")
    launches = fetch_upcoming_launches()
    print(f"Total upcoming launches fetched: {len(launches)}")
    high_risk_launches = [l for l in launches if l.get('delay_risk') == 'HIGH']
    print(f"High risk / delayed launches detected: {len(high_risk_launches)}\n")
    
    save_launches(db, launches)

    # 3. Predict Conjunctions (Math-based Prediction)
    print("\n--- 3. Running Orbital Conjunction Math ---")
    # For a quick run, we use a smaller subset if it's too large
    subset_sats = satellites[:100] if len(satellites) > 100 else satellites
    
    # We will inject a mock high-risk conjunction for the hackathon demo if none are found naturally
    conjunctions = calculate_conjunctions(subset_sats, time_window_hours=6)
    
    if not conjunctions:
        print("No natural conjunctions found in the time window. Injecting a mock high-risk event for demo...")
        conjunctions = [{
            "asset_id": "MOCK-1",
            "asset_name": "Demo Asset Alpha",
            "secondary_id": "DEB-X",
            "secondary_name": "Unknown Debris",
            "closest_approach_km": 0.5,
            "collision_probability": 0.85,
            "time_of_closest_approach": "2026-03-01T12:00:00Z",
            "risk_level": "CRITICAL"
        }]
    else:
        print(f"Detected {len(conjunctions)} close approaches!")
        
    save_conjunctions(db, conjunctions)
    
    print("\n--- Pipeline Summary ---")
    print(f"High-Risk Conjunctions: {len([c for c in conjunctions if c['risk_level'] in ['HIGH', 'CRITICAL']])}")
    print(f"Delayed Launches: {len(high_risk_launches)}")
    print("✅ Pipeline run completed successfully!")

if __name__ == "__main__":
    run_pipeline()
