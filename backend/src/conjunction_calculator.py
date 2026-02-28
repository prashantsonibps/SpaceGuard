from skyfield.api import load, wgs84, EarthSatellite
import numpy as np
from datetime import timedelta

def calculate_conjunctions(satellites_data, max_distance_km=10.0, time_window_hours=24):
    """
    Predicts close approaches between satellites using Skyfield orbital mechanics.
    This is actual math/physics predicting future states based on current TLEs.
    """
    print(f"Loading ephemeris data for {len(satellites_data)} objects...")
    ts = load.timescale()
    t_now = ts.now()
    
    # We will look ahead in small time steps to find closest approaches
    # For a hackathon demo, calculating N x N collisions over 24 hours at 1-minute 
    # intervals is too slow. We will do a fast pass:
    # Look ahead 6 hours, in 5-minute steps.
    minutes = np.arange(0, time_window_hours * 60, 5)
    t_steps = ts.tt_jd(t_now.tt + minutes / (24.0 * 60.0))
    
    satellites = []
    for sat in satellites_data:
        try:
            # Create Skyfield EarthSatellite objects from TLE lines
            s = EarthSatellite(sat['tle_line1'], sat['tle_line2'], sat['name'], ts)
            satellites.append({
                "obj": s,
                "id": sat.get('id', sat['name']),
                "name": sat['name']
            })
        except Exception as e:
            continue

    conjunctions = []
    
    print(f"Propagating orbits and calculating distances for next {time_window_hours} hours...")
    # O(N^2) comparison - for demo we might want to limit the input list length
    # or just compare a few "high risk" assets against the debris catalog.
    
    # Let's assume the first min(10, len/2) items in the list are our "assets"
    num_assets = max(1, min(10, len(satellites) // 2))
    assets = satellites[:num_assets]
    others = satellites[num_assets:]
    
    if not assets or not others:
        print("Not enough satellite data to calculate conjunctions.")
        return []

    for asset in assets:
        # Pre-compute positions for this asset over all time steps
        pos_asset = asset['obj'].at(t_steps).position.km # shape: (3, num_steps)
        
        for other in others:
            if asset['id'] == other['id']:
                continue
                
            pos_other = other['obj'].at(t_steps).position.km
            
            # Calculate distance at all time steps
            # distance = sqrt(dx^2 + dy^2 + dz^2)
            delta = pos_asset - pos_other
            distances = np.linalg.norm(delta, axis=0)
            
            # Find the minimum distance in this time window
            min_dist_idx = np.argmin(distances)
            min_dist = distances[min_dist_idx]
            
            if min_dist < max_distance_km:
                tca = t_steps[min_dist_idx] # Time of Closest Approach
                
                # Mock a probability based on distance and standard deviation
                # (Real probability of collision uses covariance matrices which we don't have from TLEs)
                # If it's within 1km, high probability. Within 10km, lower probability.
                prob = max(0.00001, (max_distance_km - min_dist) / max_distance_km * 0.1)
                
                risk_level = "LOW"
                if min_dist < 1.0:
                    risk_level = "CRITICAL"
                elif min_dist < 5.0:
                    risk_level = "HIGH"
                elif min_dist < 10.0:
                    risk_level = "MEDIUM"

                conjunctions.append({
                    "asset_id": asset['id'],
                    "asset_name": asset['name'],
                    "secondary_id": other['id'],
                    "secondary_name": other['name'],
                    "closest_approach_km": round(float(min_dist), 2),
                    "collision_probability": prob,
                    "time_of_closest_approach": tca.utc_datetime().isoformat(),
                    "risk_level": risk_level
                })
                
    # Sort by highest risk
    conjunctions.sort(key=lambda x: x['closest_approach_km'])
    
    print(f"Found {len(conjunctions)} conjunction events.")
    return conjunctions

if __name__ == "__main__":
    # Simple test with mock data
    mock_data = [
        {"name": "ISS (ZARYA)", "tle_line1": "1 25544U 98067A   23284.92040509  .00018440  00000+0  33414-3 0  9997", "tle_line2": "2 25544  51.6416 345.9189 0004928 322.8687 186.2950 15.50085859420045"},
        {"name": "DEBRIS A", "tle_line1": "1 25544U 98067A   23284.92040509  .00018440  00000+0  33414-3 0  9997", "tle_line2": "2 25544  51.6416 345.9189 0004928 322.8687 186.2950 15.50085859420045"} # Exact same orbit to trigger collision
    ]
    results = calculate_conjunctions(mock_data, time_window_hours=1)
    if results:
        print(results[0])
