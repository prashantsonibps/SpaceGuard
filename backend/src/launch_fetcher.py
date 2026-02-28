import requests
import json
from datetime import datetime, timezone

# We can use the open Library 2 endpoints (or The SpaceDevs)
# URL for next upcoming launches
LAUNCH_API_URL = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=10"

def fetch_upcoming_launches():
    """Fetches upcoming launches from the SpaceDevs API."""
    print("Fetching upcoming launches...")
    try:
        # Dev endpoint is rate limited to 15 req/hour, but good enough for hackathon demo
        headers = {'User-Agent': 'SpaceGuard-Hackathon-Project/1.0'}
        response = requests.get(LAUNCH_API_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        launches = []
        
        for launch in data.get('results', []):
            probability = launch.get("probability")
            if probability is None:
                probability = -1
                
            launch_info = {
                "id": launch.get("id"),
                "name": launch.get("name"),
                "status": launch.get("status", {}).get("name", "Unknown"),
                "window_start": launch.get("window_start"),
                "window_end": launch.get("window_end"),
                "provider": launch.get("launch_service_provider", {}).get("name", "Unknown"),
                "location": launch.get("pad", {}).get("location", {}).get("name", "Unknown"),
                "probability": probability, # Weather probability if available
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            
            # Simple mock prediction: If T-0 is close but status says "TBD" or probability is low, 
            # we tag it with a "Delay Risk"
            risk_level = "LOW"
            if launch_info["status"] == "TBD" or (probability != -1 and probability < 50):
                risk_level = "HIGH"
                
            launch_info["delay_risk"] = risk_level
            
            launches.append(launch_info)
            
        print(f"Successfully processed {len(launches)} upcoming launches.")
        return launches
        
    except Exception as e:
        print(f"Failed to fetch launch data: {e}")
        return []

if __name__ == "__main__":
    launches = fetch_upcoming_launches()
    if launches:
        print(f"Sample data: {json.dumps(launches[0], indent=2)}")
