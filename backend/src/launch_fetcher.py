import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
from utils import get_logger, safe_retry, time_it
from models import LaunchModel, WeatherModel

load_dotenv()
logger = get_logger("launch_fetcher")

LAUNCH_API_URL = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=10"
OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"

@safe_retry
def fetch_weather_for_pad(lat, lon):
    """Fetches real-time weather at launch pad using OpenWeather API."""
    import requests
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key or not lat or not lon:
        return None
    
    try:
        url = f"{OPENWEATHER_API_URL}?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            weather_data = {
                "temp_c": data["main"]["temp"],
                "wind_speed_ms": data["wind"]["speed"],
                "conditions": data["weather"][0]["main"],
                "description": data["weather"][0]["description"]
            }
            # Validate with Pydantic
            return WeatherModel(**weather_data).model_dump()
        else:
            logger.warning(f"Weather API returned {response.status_code}. (Key might be invalid or not activated yet)")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch weather: {e}")
        return None

@safe_retry
@time_it
def fetch_upcoming_launches():
    """Fetches upcoming launches and augments with real weather data."""
    import requests
    logger.info("Fetching upcoming launches...")
    try:
        headers = {'User-Agent': 'SpaceGuard-Hackathon-Project/1.0'}
        response = requests.get(LAUNCH_API_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        launches = []
        
        for launch in data.get('results', []):
            probability = launch.get("probability")
            if probability is None:
                probability = -1.0
            
            pad = launch.get("pad", {})
            lat = pad.get("latitude")
            lon = pad.get("longitude")
            
            # Fetch Weather!
            weather_info = fetch_weather_for_pad(lat, lon)
                
            launch_info = {
                "id": str(launch.get("id")),
                "name": launch.get("name"),
                "status": launch.get("status", {}).get("name", "Unknown"),
                "window_start": launch.get("window_start"),
                "window_end": launch.get("window_end"),
                "provider": launch.get("launch_service_provider", {}).get("name", "Unknown"),
                "location": pad.get("location", {}).get("name", "Unknown"),
                "probability": float(probability),
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "weather": weather_info
            }
            
            # Smart Prediction Algorithm:
            # If wind > 10m/s, or Thunderstorm/Rain, risk is HIGH.
            risk_level = "LOW"
            if launch_info["status"] == "TBD" or (probability != -1 and probability < 50):
                risk_level = "HIGH"
                
            if weather_info:
                if weather_info["wind_speed_ms"] > 10.0 or weather_info["conditions"] in ["Thunderstorm", "Rain", "Snow"]:
                    risk_level = "HIGH"
                    
            launch_info["delay_risk"] = risk_level
            
            # Validate with Pydantic
            try:
                validated_launch = LaunchModel(**launch_info)
                launches.append(validated_launch.model_dump())
            except Exception as e:
                logger.error(f"Error validating launch {launch_info['name']}: {e}")
            
        logger.info(f"Successfully processed {len(launches)} upcoming launches.")
        return launches
        
    except Exception as e:
        logger.error(f"Failed to fetch launch data: {e}")
        raise e

if __name__ == "__main__":
    launches = fetch_upcoming_launches()
    if launches:
        print(f"Sample data: {json.dumps(launches[0], indent=2)}")
