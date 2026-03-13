import json
import os
from pathlib import Path
from typing import Any, Dict

import httpx
import weave
from dotenv import load_dotenv

# Load environment from backend/.env (works when run from backend/ or project root)
_backend_dir = Path(__file__).resolve().parents[1]
load_dotenv(_backend_dir / ".env")
load_dotenv()


WHITECIRCLE_API_URL = os.getenv(
    "WHITECIRCLE_API_URL",
    # Default can be overridden via env; replace with the official endpoint as needed.
    "https://api.whitecircle.ai/v1/safety/verify",
)


def _get_whitecircle_api_key() -> str:
    api_key = (os.getenv("WHITECIRCLE_API_KEY") or "").strip()
    return api_key


async def _call_whitecircle_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    api_key = _get_whitecircle_api_key()
    if not api_key:
        return {
            "status": "ERROR",
            "safe": False,
            "error": "WHITECIRCLE_API_KEY not configured",
        }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(WHITECIRCLE_API_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        return {
            "status": "ERROR",
            "safe": False,
            "error": str(exc),
        }

    # Best-effort normalization of White Circle response
    overall = (data.get("overall") or data.get("status") or "").upper()
    if not overall and isinstance(data.get("safe"), bool):
        overall = "SAFE" if data["safe"] else "UNSAFE"

    is_safe = overall == "SAFE"

    return {
        "status": overall or ("SAFE" if is_safe else "UNSAFE"),
        "safe": is_safe,
        "categories": data.get("categories", {}),
        "raw": data,
    }


@weave.op()
async def verify_agent_output(prompt: str, ai_response: str) -> Dict[str, Any]:
    """
    Asynchronously verify a Mistral agent response against White Circle safety policies.

    The payload checks for hallucination, jailbreak, and financial_misinformation risks.
    Returns a normalized dict:
      {
        "status": "SAFE" | "UNSAFE" | "ERROR",
        "safe": bool,
        "categories": {...},   # provider-specific details when available
        "raw": {...}           # full provider response when available
      }
    """
    payload = {
        "prompt": prompt,
        "response": ai_response,
        "categories": [
            "hallucination",
            "jailbreak",
            "financial_misinformation",
        ],
    }

    return await _call_whitecircle_api(payload)


def verify_agent_output_sync(prompt: str, ai_response: str) -> Dict[str, Any]:
    """
    Synchronous wrapper around the async verifier for use in non-async code paths.

    This helper keeps the core API async while allowing existing synchronous agent
    code (e.g., pipeline runs) to remain unchanged.
    """
    import asyncio

    return asyncio.run(verify_agent_output(prompt=prompt, ai_response=ai_response))

