import os
import json
from pathlib import Path
from mistralai import Mistral
from dotenv import load_dotenv

# Load .env from backend directory (works when run from backend/ or project root)
_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")
load_dotenv()  # also cwd

# Mistral's best flagship model: state-of-the-art reasoning and JSON output
MISTRAL_MODEL = "mistral-large-latest"


def get_mistral_client():
    api_key = (os.getenv("MISTRAL_API_KEY") or "").strip()
    if not api_key:
        raise ValueError(
            "🚨 MISTRAL_API_KEY not set. Add it to backend/.env (get a key at https://console.mistral.ai → API keys)."
        )
    return Mistral(api_key=api_key)


def analyze_risk_and_hedge(event_data):
    """
    Sends the conjunction or delay event to Mistral to assess financial risk
    and decide whether to execute a hedge (e.g., buy insurance).
    """
    client = get_mistral_client()

    system_prompt = """You are an autonomous AI Financial Risk Manager for SpaceGuard, a satellite operator.
Your job is to evaluate real-time space events (satellite conjunctions/collisions or rocket launch delays)
and decide if we need to execute a financial hedge to protect our USD portfolio.

You will be given JSON data representing a space event.

RULES:
1. If the risk is CRITICAL (probability > 50% or distance < 1.0km), you MUST recommend executing a hedge.
2. If the risk is HIGH, you should strongly consider a hedge.
3. If the risk is LOW or MEDIUM, do NOT hedge.
4. For hedges, recommend an amount between $10,000 and $500,000 USD depending on severity.

You MUST respond with a single valid JSON object only, no other text. Use this exact structure:
{"reasoning": "<1-2 sentence explanation>", "action": "HEDGE" or "IGNORE", "hedge_amount_usd": <number>, "hedge_type": "collision_insurance" or "maneuver_fuel_cost" or "delay_insurance" or "none"}"""

    # Normalize so both conjunction events (asset_name) and NEO events (name) work
    display_name = event_data.get("asset_name") or event_data.get("name") or "Unknown"
    user_prompt = f"Evaluate this event and provide your decision as JSON only:\n{json.dumps(event_data, indent=2)}"

    print(f"🧠 Asking Mistral ({MISTRAL_MODEL}) to evaluate risk for: {display_name}")

    try:
        response = client.chat.complete(
            model=MISTRAL_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from Mistral")

        result = json.loads(content.strip())

        # Normalize to expected keys (Mistral might return slightly different names)
        return {
            "reasoning": result.get("reasoning", result.get("thought_process", "")),
            "action": result.get("action", "IGNORE").upper(),
            "hedge_amount_usd": float(result.get("hedge_amount_usd", 0)),
            "hedge_type": result.get("hedge_type", "none"),
        }

    except json.JSONDecodeError as e:
        print(f"❌ Mistral returned invalid JSON: {e}")
        return {
            "reasoning": f"Failed to parse Mistral response: {str(e)}",
            "action": "IGNORE",
            "hedge_amount_usd": 0,
            "hedge_type": "none",
        }
    except Exception as e:
        err_msg = str(e)
        print(f"❌ Mistral API Error: {err_msg}")
        if "401" in err_msg or "Unauthorized" in err_msg:
            print("   → Check backend/.env: MISTRAL_API_KEY must be valid (get one at https://console.mistral.ai).")
            print("   → Ensure no extra spaces; enable billing if required.")
        return {
            "reasoning": f"Failed to reach Mistral API: {err_msg}",
            "action": "IGNORE",
            "hedge_amount_usd": 0,
            "hedge_type": "none",
        }


if __name__ == "__main__":
    mock_event = {
        "asset_id": "MOCK-1",
        "asset_name": "Demo Asset Alpha",
        "secondary_id": "DEB-X",
        "secondary_name": "Unknown Debris",
        "closest_approach_km": 0.5,
        "collision_probability": 0.85,
        "time_of_closest_approach": "2026-03-01T12:00:00Z",
        "risk_level": "CRITICAL",
    }

    try:
        decision = analyze_risk_and_hedge(mock_event)
        print("\n🤖 Mistral Agent Decision:")
        print(json.dumps(decision, indent=2))
    except Exception as e:
        print(e)
