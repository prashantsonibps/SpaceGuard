#!/usr/bin/env python3
"""
Quick check that MISTRAL_API_KEY is valid. Run from repo root or backend/:
  python backend/scripts/check_mistral_api.py
  # or: cd backend && python scripts/check_mistral_api.py
"""
import os
import sys
from pathlib import Path

# Ensure backend/.env is loaded
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

def main():
    api_key = (os.getenv("MISTRAL_API_KEY") or "").strip()
    if not api_key:
        print("❌ MISTRAL_API_KEY not set in backend/.env")
        print("   Get a key at https://console.mistral.ai → API keys")
        return 1

    try:
        from mistralai import Mistral
        client = Mistral(api_key=api_key)
        # Minimal request to validate key
        r = client.chat.complete(
            model="mistral-large-latest",
            messages=[{"role": "user", "content": "Reply with only: OK"}],
            max_tokens=10,
        )
        content = (r.choices[0].message.content or "").strip()
        print("✅ Mistral API is working. Response:", content[:50])
        return 0
    except Exception as e:
        err = str(e)
        print("❌ Mistral API error:", err)
        if "401" in err or "Unauthorized" in err:
            print("   → Your key was rejected. Get a new key at https://console.mistral.ai")
            print("   → Ensure no extra spaces in .env; enable billing if required.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
