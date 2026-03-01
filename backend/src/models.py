from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class SatelliteModel(BaseModel):
    id: str
    name: str
    tle_line1: str
    tle_line2: str
    last_updated: str

class WeatherModel(BaseModel):
    temp_c: float
    wind_speed_ms: float
    conditions: str
    description: str

class LaunchModel(BaseModel):
    id: str
    name: str
    status: str
    window_start: Optional[str] = None
    window_end: Optional[str] = None
    provider: str
    location: str
    probability: float
    delay_risk: str
    weather: Optional[WeatherModel] = None
    last_updated: str

class SpaceWeatherEventModel(BaseModel):
    id: str
    type: str
    start_time: str
    peak_time: Optional[str] = None
    end_time: Optional[str] = None
    note: Optional[str] = "No details"
    catalog: Optional[str] = ""
    instruments: List[str] = []
    class_type: Optional[str] = None
    source_location: Optional[str] = None
    risk_level: str
    last_updated: str

class NeoEventModel(BaseModel):
    id: str
    name: str
    estimated_diameter_min_km: float
    estimated_diameter_max_km: float
    is_hazardous: bool
    close_approach_date: str
    velocity_km_s: float
    miss_distance_km: float
    miss_distance_lunar: float
    risk_level: str
    last_updated: str

class SpaceTrackTLEModel(BaseModel):
    id: str
    name: str
    tle_line1: str
    tle_line2: str
    last_updated: str

class CDMModel(BaseModel):
    id: str
    asset_id: str
    asset_name: str
    secondary_id: str
    secondary_name: str
    tca: str  # Time of Closest Approach
    miss_distance_km: float
    collision_probability: float
    risk_level: str
    last_updated: str

class NOAAIndexModel(BaseModel):
    name: str  # e.g., "Kp-Index" or "F10.7"
    value: float
    timestamp: str
    description: str
    risk_level: str
    last_updated: str

class FireballModel(BaseModel):
    id: str
    date: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    alt: Optional[float] = None
    velocity_km_s: Optional[float] = None
    energy_kt: float
    last_updated: str
