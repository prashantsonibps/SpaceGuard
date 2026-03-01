import os
import json
import time
from tle_fetcher import get_all_satellite_data
from launch_fetcher import fetch_upcoming_launches
from conjunction_calculator import calculate_conjunctions
from neo_fetcher import fetch_neo_events
from db import initialize_db, save_satellites, save_launches, save_conjunctions, save_neo_events
from agent import analyze_risk_and_hedge
import firebase_admin

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
    
    # 3.5 Fetch Near Earth Objects (Asteroids)
    print("\n--- 3.5 Fetching Near Earth Objects (Asteroids) ---")
    neos = fetch_neo_events()
    print(f"Total significant asteroid approaches: {len(neos)}")
    save_neo_events(db, neos)
    
    print("\n--- 4. LLM Risk Assessment Agent ---")
    # Evaluate critical conjunctions with Gemini
    critical_events = [c for c in conjunctions if c.get('risk_level') in ['HIGH', 'CRITICAL']]
    for event in critical_events:
        print(f"\nAnalyzing Conjunction Event for: {event.get('asset_name', 'Unknown')}")
        try:
            decision = analyze_risk_and_hedge(event)
            print(f"  Decision: {decision.get('action')}")
            print(f"  Reasoning: {decision.get('reasoning')}")
            print(f"  Amount: ${decision.get('hedge_amount_usd', 0)}")
            
            # Save the agent's decision back to Firestore
            event_id = f"{event['asset_id']}_{event['secondary_id']}_{event['time_of_closest_approach'][:10]}"
            db.collection('conjunction_events').document(event_id).update({
                'agent_assessment': decision.get('reasoning'),
                'hedge_status': decision.get('action'),
                'hedge_amount_usd': decision.get('hedge_amount_usd', 0),
                'hedge_type': decision.get('hedge_type', 'none')
            })
            print("  ✅ Saved decision to database")
            
        except Exception as e:
            print(f"  ❌ Agent analysis failed: {e}")
            print("  (Make sure your GEMINI_API_KEY is set in .env)")

    # Evaluate critical asteroid approaches
    critical_neos = [n for n in neos if n.get('risk_level') in ['HIGH', 'CRITICAL']]
    for event in critical_neos:
        print(f"\nAnalyzing Asteroid Event for: {event.get('name', 'Unknown')}")
        try:
            decision = analyze_risk_and_hedge(event)
            print(f"  Decision: {decision.get('action')}")
            print(f"  Reasoning: {decision.get('reasoning')}")
            print(f"  Amount: ${decision.get('hedge_amount_usd', 0)}")
            
            db.collection('neo_events').document(str(event['id'])).update({
                'agent_assessment': decision.get('reasoning'),
                'hedge_status': decision.get('action'),
                'hedge_amount_usd': decision.get('hedge_amount_usd', 0),
                'hedge_type': decision.get('hedge_type', 'none')
            })
            print("  ✅ Saved decision to database")
        except Exception as e:
            print(f"  ❌ Agent analysis failed: {e}")

    print("\n--- Pipeline Summary ---")
    print(f"High-Risk Conjunctions Evaluated: {len(critical_events)}")
    print(f"High-Risk Asteroids Evaluated: {len(critical_neos)}")
    print(f"Delayed Launches Updated: {len(high_risk_launches)}")
    print("✅ Pipeline run completed successfully!")

if __name__ == "__main__":
    run_pipeline()
