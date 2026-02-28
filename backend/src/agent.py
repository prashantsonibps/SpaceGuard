import os
import json
from datetime import datetime, timezone
from mistralai import Mistral
from dotenv import load_dotenv

# Load env variables (MISTRAL_API_KEY)
load_dotenv()

# We use Mistral's latest large model for best reasoning.
# For a faster/cheaper hackathon demo, you could drop this down to "mistral-small-latest"
MISTRAL_MODEL = "mistral-large-latest" 

def get_mistral_client():
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError("🚨 MISTRAL_API_KEY not found in .env file!")
    return Mistral(api_key=api_key)

def analyze_risk_and_hedge(event_data):
    """
    Sends the conjunction or delay event to Mistral to assess financial risk
    and decide whether to execute a hedge (e.g., buy insurance).
    """
    client = get_mistral_client()
    
    # We create a strict system prompt so Mistral acts as a Financial Risk Agent
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
    
    You MUST output YOUR ENTIRE RESPONSE as a valid JSON object with the following schema:
    {
        "reasoning": "A 1-2 sentence explanation of your thought process",
        "action": "HEDGE" | "IGNORE",
        "hedge_amount_usd": <number or 0>,
        "hedge_type": "collision_insurance" | "maneuver_fuel_cost" | "delay_insurance" | "none"
    }
    """

    user_prompt = f"Evaluate this event and provide your JSON decision:\n{json.dumps(event_data, indent=2)}"

    print(f"🧠 Asking Mistral ({MISTRAL_MODEL}) to evaluate risk for: {event_data.get('asset_name', 'Unknown')}")
    
    try:
        response = client.chat.complete(
            model=MISTRAL_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON response from Mistral
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        print(f"❌ Mistral API Error: {e}")
        # Fallback safe response if API fails
        return {
            "reasoning": f"Failed to reach Mistral API: {str(e)}",
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
        print("\n🤖 Mistral Agent Decision:")
        print(json.dumps(decision, indent=2))
    except Exception as e:
        print(e)
