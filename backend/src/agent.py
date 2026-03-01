import os
import json
from datetime import datetime, timezone
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load env variables (GEMINI_API_KEY)
load_dotenv()

# We use Gemini 2.5 Flash as it is extremely fast and capable of JSON schema output
GEMINI_MODEL = "gemini-2.5-flash" 

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("🚨 GEMINI_API_KEY not found in .env file!")
    # Using explicit instantiation format for the new python SDK
    return genai.Client(api_key=api_key)

def analyze_risk_and_hedge(event_data):
    """
    Sends the conjunction or delay event to Gemini to assess financial risk
    and decide whether to execute a hedge (e.g., buy insurance).
    """
    client = get_gemini_client()
    
    # We create a strict system prompt so Gemini acts as a Financial Risk Agent
    system_prompt = """
    You are an autonomous AI Financial Risk Manager for SpaceGuard, a satellite operator.
    Your job is to evaluate real-time space events (satellite conjunctions/collisions or rocket launch delays) 
    and decide if we need to execute a financial hedge to protect our USD portfolio.

    You will be given JSON data representing a space event.
    
    RULES:
    1. If the risk is CRITICAL (probability > 50% or distance < 1.0km), you MUST recommend executing a hedge.
    2. If the risk is HIGH, you should strongly consider a hedge.
    3. If the risk is LOW or MEDIUM, do NOT hedge.
    4. For hedges, recommend an amount between $10,000 and $500,000 USD depending on severity.
    """

    user_prompt = f"Evaluate this event and provide your decision:\n{json.dumps(event_data, indent=2)}"

    print(f"🧠 Asking Gemini ({GEMINI_MODEL}) to evaluate risk for: {event_data.get('asset_name', 'Unknown')}")
    
    try:
        # Define the exact JSON schema we want Gemini to return
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "reasoning": {"type": "STRING", "description": "A 1-2 sentence explanation of your thought process"},
                "action": {"type": "STRING", "enum": ["HEDGE", "IGNORE"]},
                "hedge_amount_usd": {"type": "NUMBER"},
                "hedge_type": {"type": "STRING", "enum": ["collision_insurance", "maneuver_fuel_cost", "delay_insurance", "none"]}
            },
            "required": ["reasoning", "action", "hedge_amount_usd", "hedge_type"]
        }

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.2, # Low temperature for more deterministic financial outputs
            )
        )
        
        # Parse the JSON response
        result = json.loads(response.text)
        return result
        
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        # Fallback safe response if API fails
        return {
            "reasoning": f"Failed to reach Gemini API: {str(e)}",
            "action": "IGNORE",
            "hedge_amount_usd": 0,
            "hedge_type": "none"
        }

if __name__ == "__main__":
    # Test the agent locally
    mock_event = {
        "asset_id": "MOCK-1",
        "asset_name": "Demo Asset Alpha",
        "secondary_id": "DEB-X",
        "secondary_name": "Unknown Debris",
        "closest_approach_km": 0.5,
        "collision_probability": 0.85,
        "time_of_closest_approach": "2026-03-01T12:00:00Z",
        "risk_level": "CRITICAL"
    }
    
    try:
        decision = analyze_risk_and_hedge(mock_event)
        print("\n🤖 Gemini Agent Decision:")
        print(json.dumps(decision, indent=2))
    except Exception as e:
        print(e)
