# SpaceGuard — Setup Guide

## Prerequisites

| Tool | Min version | Notes |
|---|---|---|
| Python | 3.9+ | Use `python3 --version` to check |
| Node.js | 18+ | Needed for the Next.js frontend |
| Firebase project | — | Free Spark plan is fine |
| npm | 8+ | Bundled with Node |

---

## 1. Clone & enter the repo

```bash
git clone https://github.com/your-org/SpaceGuard.git
cd SpaceGuard
```

---

## 2. Firebase credentials

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Project Settings** → **Service Accounts**.
2. Click **Generate new private key** → download the JSON.
3. Rename it `serviceAccountKey.json` and place it in the `backend/` folder.

> **Firestore rules**: make sure read/write is enabled for your project (at least in test mode).

---

## 3. Backend environment

```bash
cd backend

# Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy the sample env file and fill in your keys
cp .env.example .env
```

Edit `backend/.env`:

| Key | Required? | Where to get it |
|---|---|---|
| `FIREBASE_CREDENTIALS_PATH` | **Yes** | Set to `serviceAccountKey.json` (step 2) |
| `MISTRAL_API_KEY` | Optional | [console.mistral.ai](https://console.mistral.ai) — agent returns IGNORE without it |
| `NASA_API_KEY` | Optional | [api.nasa.gov](https://api.nasa.gov) — falls back to `DEMO_KEY` (rate-limited) |
| `OPENWEATHER_API_KEY` | Optional | [openweathermap.org](https://openweathermap.org/api) — launch weather enrichment |

---

## 4. Run the data pipeline

```bash
# from SpaceGuard/backend/ with venv active
python src/main.py
```

The pipeline runs these steps:

| Step | Description | Fallback if unavailable |
|---|---|---|
| 1 | Satellite TLE data (Celestrak) | Sample set of 5 well-known objects (ISS, NOAA-19, Terra, Starlink, COSMOS debris) |
| 2 | Upcoming launches (The Space Devs) | Returns `[]` — non-fatal |
| 3 | Orbital conjunction prediction (Skyfield) | Injects a mock CRITICAL event for demo |
| 3.5 | Near Earth Objects (NASA NeoWs) | Returns `[]` — non-fatal |
| 3.6 | Space weather events (NASA DONKI, 8 s timeout) | Returns `[]` — non-fatal |
| 4 | Mistral AI risk assessment agent | Returns `IGNORE` — non-fatal |

> **Celestrak unreachable?** You'll see `⚠ Celestrak unreachable; using sample TLE data` — the pipeline continues normally.

---

## 5. Run the REST API

```bash
# Option A — convenience script (from repo root)
./run_backend.sh

# Option B — manual
cd backend
source venv/bin/activate
python -m uvicorn src.api:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

---

## 6. Run the Frontend

```bash
# Option A — convenience script (from repo root)
./run_frontend.sh

# Option B — manual
cd frontend
npm install
npm run build
npm start -- -p 3007
```

Open `http://localhost:3007` in your browser.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Firebase credentials not found` | Confirm `serviceAccountKey.json` is in `backend/` and `FIREBASE_CREDENTIALS_PATH` is set |
| `MISTRAL_API_KEY` 401 error | Check for extra spaces in `.env`; enable billing on the Mistral console |
| Pipeline hangs on space weather | DONKI API is slow — the 8 s timeout will kick in and the step will be skipped |
| `skyfield` data download on first run | Normal — Skyfield downloads `de421.bsp` (~17 MB) once and caches it |
| `ModuleNotFoundError` | Re-run `pip install -r requirements.txt` inside the activated venv |
