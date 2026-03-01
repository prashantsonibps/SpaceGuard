# SpaceGuard 🛡️🚀

### **The First Prediction Market & Risk Engine for the Orbital Economy**

> *"Managing the financial risks of the next trillion-dollar frontier."*

![SpaceGuard Dashboard](https://media.discordapp.net/attachments/109000000000000000/109000000000000000/spaceguard-demo.png?width=1200) 
*(Replace with actual screenshot)*

---

## 🌌 The Problem: The Kessler Syndrome is Unpriced
The space economy is booming ($600B+ today, $1T+ by 2030), but **orbital risk is unmanaged**.
- **25,000+** tracked objects and debris pieces are cluttering Low Earth Orbit (LEO).
- **Satellite Collisions** are becoming statistically inevitable (e.g., Iridium-33 vs Cosmos-2251).
- **Launch Delays** cost millions per day in lost revenue and operational burn.
- **Space Weather** (Solar Flares) can fry electronics instantly.

Currently, insurance is slow, manual, and reactive. **SpaceGuard makes it real-time, algorithmic, and tradable.**

---

## 🛰️ What is SpaceGuard?
SpaceGuard is a **B2B Prediction Market & Financial Terminal** that ingests real-time space data to price and hedge orbital risks instantly.

We don't just show you where satellites are; **we calculate the financial probability of disaster.**

### **Core Modules**
1.  **🌍 Real-Time Orbital Conjunctions**: Uses SGP4 propagation (Skyfield) on live TLE data to detect satellites on collision courses (<10km miss distance).
2.  **🚀 Launch Delay Prediction**: analyzing pad location, live OpenWeather data, and historical provider reliability to price the risk of T-0 scrubs.
3.  **☄️ Deep Space & Weather**: Monitoring NASA NeoWs (Asteroids) and DONKI (Space Weather) for external threats.
4.  **🧠 Gemini AI Financial Agent**: An autonomous risk manager that analyzes raw telemetry and executes **automated financial hedges** (mock USD portfolio) when risk thresholds are breached.

---

## 💰 The Business Model: "Data as a Hedge"
We are not a consumer app. We are the **Bloomberg Terminal for Space Insurers and Operators**.

1.  **Risk APIs**: Selling high-frequency probability streams to parametric insurance providers.
2.  **Automated Hedging**: Smart contracts that automatically payout when a "Critical" event (Probability > 50%) is verified on-chain.
3.  **Orbital Derivatives**: Creating a market for "Collision Swaps" and "Delay Futures"—allowing operators to hedge their downside.

---

## 🛠️ Tech Stack
*   **Frontend**: Next.js 14, Tailwind CSS, Framer Motion.
*   **Visualization**: Three.js / React Three Fiber (R3F) for the 3D Digital Twin globe.
*   **Backend**: Python (FastAPI/Scripts) for orbital mechanics & data ingestion.
*   **AI Engine**: **Google Gemini 2.5 Flash** for structured financial reasoning and decision making.
*   **Data**: Firebase Firestore (Real-time sync), CelesTrak (TLEs), NASA NeoWs, OpenWeather, The SpaceDevs.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/prashantsonibps/SpaceGuard.git
cd SpaceGuard
```

### 2. Backend Setup (The Engine)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Add your .env file with:
# GEMINI_API_KEY=...
# NASA_API_KEY=...
# OPENWEATHER_API_KEY=...
# FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json

python src/main.py
```

### 3. Frontend Setup (The Dashboard)
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:3000` to see the future of space risk management.

### 4. Hosting the frontend (e.g. Vercel)
On branch `feat/host-frontend`, the UI uses the inline-expand Financial Terminal and betting flow. To deploy the frontend:

1. Set the backend API URL in your host’s environment:
   - **`NEXT_PUBLIC_API_URL`** = your backend base URL (e.g. `https://your-api.fly.dev`).
2. Copy `frontend/.env.example` to `frontend/.env.local` and fill in `NEXT_PUBLIC_API_URL` for local builds, or configure the same variable in your hosting dashboard.
3. Ensure the backend allows your frontend origin in CORS (the default API allows all origins).

Without `NEXT_PUBLIC_API_URL`, the app falls back to `http://localhost:8000` (local dev).

---

## 🔮 Future Roadmap
*   **Blockchain Integration**: Move the "Hedge" button to execute real USDC transactions on Solana/Base.
*   **Parametric Payouts**: Oracle-based triggers for instant insurance claims upon verified collisions.
*   **Debris Mapping**: High-fidelity visualization of the 2009 Cosmos collision debris cloud.

---

*Built for the Future of Space.* 🚀
