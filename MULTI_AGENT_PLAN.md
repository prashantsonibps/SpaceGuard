# SpaceGuard — Multi-Agent Plan

> **Central coordination document. All agents read and write here.**
> Update your section when starting or finishing a task. Always include a timestamp and your agent name.

---

## Project Overview

**SpaceGuard** is a real-time satellite collision detection and financial risk hedging platform.

### What It Does
1. Pulls live TLE (Two-Line Element) data from CelesTrak
2. Runs orbital math (Skyfield + NumPy) to compute conjunction distances and collision probabilities
3. Stores results in Firestore — frontend listens with `onSnapshot` for live updates
4. An LLM agent (Mistral or Claude) assesses risk, logs its chain-of-thought via W&B Weave, and executes hedges as Firestore transactions
5. A 3D dashboard (Three.js / CesiumJS) shows Earth + satellites + impending conjunctions in real time, alongside a live financial terminal

### Target Personas
- CFO / Risk Manager at a satellite operator
- Needs: enterprise login (Firebase Auth), audit trail (Weave), live risk dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Orbital Engine | Python · Skyfield · NumPy |
| Compute | Firebase Cloud Functions (Python 2nd Gen) or AWS Lambda |
| Database | Firestore (NoSQL, real-time) |
| Auth | Firebase Auth |
| Agent / LLM | Mistral (or Claude) |
| Audit Trail | Weights & Biases Weave |
| Frontend | Next.js · Tailwind CSS |
| 3D Visualization | Three.js or CesiumJS |
| Branch | `feat/frontend-backend` |

---

## Firestore Schema

```
satellites/
  {sat_id}/
    name: str
    tle_line1: str
    tle_line2: str
    last_updated: timestamp

conjunction_events/
  {event_id}/
    sat_id_a: str
    sat_id_b: str
    closest_approach_km: float
    collision_probability: float       # 0.0 – 1.0
    time_of_closest_approach: timestamp
    risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    agent_assessment: str              # LLM chain-of-thought summary
    status: "OPEN" | "HEDGED" | "RESOLVED"
    created_at: timestamp
    updated_at: timestamp

executed_hedges/
  {hedge_id}/
    event_id: str
    user_id: str
    hedge_type: str                    # e.g. "insurance_put", "maneuver_order"
    amount: float
    executed_at: timestamp
    weave_trace_id: str                # W&B Weave audit log reference

users/
  {user_id}/
    email: str
    role: "admin" | "risk_manager" | "viewer"
    portfolio_value: float
    risk_tolerance: "LOW" | "MEDIUM" | "HIGH"
```

---

## Agent Roles

### Agent 1 — Architect (Research & Planning)
- **Owns**: Architecture docs, schema decisions, task breakdown, inter-agent coordination
- **Tools**: Read/write files, CelesTrak API research, Firebase docs
- **Branch**: `agent1/planning`

### Agent 2 — Builder (Core Implementation)
- **Owns**: Python orbital engine, Firebase Cloud Functions, Next.js scaffolding, Firestore integration
- **Tools**: File creation/editing, package install, code generation
- **Branch**: `agent2/implementation`

### Agent 3 — Validator (Testing & Quality)
- **Owns**: Unit tests for orbital math, Firestore security rules, end-to-end tests, edge cases (debris in LEO, GEO, Molniya orbits)
- **Tools**: pytest, Firebase emulator, test runners
- **Branch**: `agent3/testing`

### Agent 4 — Scribe (Docs & Refinement)
- **Owns**: API documentation, compliance/audit docs (for financial hedging), onboarding guide, demo script for hackathon judges
- **Tools**: Doc generators, file operations
- **Branch**: `agent4/documentation`

---

## Task Board

### BACKLOG

| ID | Task | Agent | Status | Notes |
|----|------|-------|--------|-------|
| T-01 | Scaffold Next.js app with Tailwind | Builder | `pending` | |
| T-02 | Set up Firebase project + Firestore + Auth | Builder | `pending` | Use Firebase Admin SDK |
| T-03 | Write `tle_fetcher.py` — pull CelesTrak TLEs | Builder | `pending` | Store in Firestore `satellites/` |
| T-04 | Write `conjunction_calculator.py` — Skyfield math | Builder | `pending` | Output: distance_km, probability, TCA |
| T-05 | Write Firebase Cloud Function to run T-04 on schedule | Builder | `pending` | Trigger: Pub/Sub every 15 min |
| T-06 | Set up LLM agent with Mistral + tool-calling | Builder | `pending` | Tools: read_conjunction, execute_hedge |
| T-07 | Integrate W&B Weave for agent audit logging | Builder | `pending` | Log prompt → reasoning → action |
| T-08 | Build 3D Earth visualizer (Three.js / CesiumJS) | Builder | `pending` | Driven by Firestore `onSnapshot` |
| T-09 | Build financial terminal panel (Next.js) | Builder | `pending` | Live updates from `conjunction_events` |
| T-10 | Firebase Auth — login page + role-based guards | Builder | `pending` | |
| T-11 | Write unit tests for orbital math | Validator | `pending` | Depends on T-04 |
| T-12 | Firestore security rules | Validator | `pending` | Depends on T-02 |
| T-13 | End-to-end test: TLE fetch → risk flag → hedge | Validator | `pending` | Depends on T-03 – T-07 |
| T-14 | API documentation | Scribe | `pending` | Depends on T-05, T-06 |
| T-15 | Hackathon demo script | Scribe | `pending` | CFO persona walkthrough |

---

## Inter-Agent Messages

*Agents post messages here when they need to hand off work or flag a dependency.*

---

## Completed Work Log

*Agents move tasks here when done, with a brief summary.*

---

## Architecture Decisions

### ADR-001: Firebase over custom WebSocket server
**Decision**: Use Firestore real-time listeners instead of WebSockets.
**Rationale**: Firestore `onSnapshot` gives sub-second updates with zero infrastructure overhead. Critical for live orbital data.
**Status**: Accepted

### ADR-002: Python for all backend compute
**Decision**: Python 2nd Gen Cloud Functions for orbital math.
**Rationale**: Skyfield and NumPy are Python-native. Firebase's 2nd Gen (Cloud Run) supports Python with no impedance mismatch.
**Status**: Accepted

### ADR-003: Weave for agent audit trail
**Decision**: Log every agent inference step to W&B Weave.
**Rationale**: Financial hedging requires auditability. Weave captures the full chain-of-thought for compliance review.
**Status**: Accepted

---

## Sync Protocol

- All agents re-read this file at the start of each session
- Update task status (`pending` → `in_progress` → `done`) when you pick up or finish a task
- Post to **Inter-Agent Messages** when handing off a dependency
- Architect breaks ties on design conflicts

---

*Initialized by Architect · 2026-02-28*
