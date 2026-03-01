import os
import threading
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
import uuid
from datetime import datetime
from .db import initialize_db
from google.cloud import firestore
from contextlib import asynccontextmanager
from .main import run_pipeline

def pipeline_loop():
    """Runs the ingestion pipeline repeatedly in the background."""
    while True:
        try:
            run_pipeline()
        except Exception as e:
            print(f"Background pipeline encountered an error: {e}")
        # Wait 5 minutes between runs
        time.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting background data ingestion pipeline...")
    thread = threading.Thread(target=pipeline_loop, daemon=True)
    thread.start()
    yield
    print("Shutting down API...")

app = FastAPI(title="SpaceGuard Betting API", lifespan=lifespan)

# CORS: Use CORS_ORIGINS env (comma-separated) or allow all for local dev
_cors_origins = os.getenv("CORS_ORIGINS", "*")
if _cors_origins == "*":
    allow_origins = ["*"]
else:
    allow_origins = [o.strip() for o in _cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firestore
db = initialize_db()

# Models
class BetOutcome(str, Enum):
    YES = "YES" # e.g. Collision will happen / Launch success
    NO = "NO"   # e.g. Collision won't happen / Launch fail
    DELAY = "DELAY" # Launch specific

class BetStatus(str, Enum):
    PENDING = "PENDING"
    WON = "WON"
    LOST = "LOST"
    CANCELLED = "CANCELLED"

class BetRequest(BaseModel):
    user_id: str
    event_id: str
    event_type: str # 'launch' or 'conjunction'
    amount: float
    outcome: BetOutcome

class User(BaseModel):
    id: str
    balance: float
    created_at: datetime

class Bet(BaseModel):
    id: str
    user_id: str
    event_id: str
    event_type: str
    amount: float
    outcome: BetOutcome
    status: BetStatus
    created_at: datetime
    payout: float = 0.0

@app.get("/")
def read_root():
    return {"message": "Welcome to SpaceGuard Betting API"}

@app.post("/users/{user_id}/init")
def init_user(user_id: str):
    """Initialize a new user with starting balance if they don't exist."""
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if user_doc.exists:
        return user_doc.to_dict()
    
    new_user = {
        "id": user_id,
        "balance": 10000.0, # Start with $10k fake USD
        "created_at": datetime.now()
    }
    user_ref.set(new_user)
    return new_user

@app.get("/users/{user_id}")
def get_user(user_id: str):
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user_doc.to_dict()

@app.post("/bets")
def place_bet(bet_req: BetRequest):
    """Place a bet on an event."""
    # 1. Validate User Balance
    user_ref = db.collection('users').document(bet_req.user_id)
    
    # Run inside a transaction to ensure atomicity
    transaction = db.transaction()
    
    try:
        result = _place_bet_transaction(transaction, user_ref, bet_req)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@firestore.transactional
def _place_bet_transaction(transaction, user_ref, bet_req):
    snapshot = user_ref.get(transaction=transaction)
    
    if not snapshot.exists:
        raise ValueError("User not found")
        
    user_data = snapshot.to_dict()
    current_balance = user_data.get('balance', 0)
    
    if current_balance < bet_req.amount:
        raise ValueError("Insufficient funds")
        
    if not event_doc.exists:
        raise ValueError(f"Event {bet_req.event_id} not found")

    # 3. Create Bet
    bet_id = str(uuid.uuid4())
    new_bet = {
        "id": bet_id,
        "user_id": bet_req.user_id,
        "event_id": bet_req.event_id,
        "event_type": bet_req.event_type,
        "amount": bet_req.amount,
        "outcome": bet_req.outcome,
        "status": BetStatus.PENDING,
        "created_at": datetime.now(),
        "payout": 0.0
    }
    
    bet_ref = db.collection('bets').document(bet_id)
    
    # 4. Update Balance and Save Bet
    transaction.update(user_ref, {"balance": current_balance - bet_req.amount})
    transaction.set(bet_ref, new_bet)
    
    return new_bet

@app.get("/bets/{user_id}")
def get_user_bets(user_id: str):
    bets_ref = db.collection('bets').where("user_id", "==", user_id).order_by("created_at", direction=firestore.Query.DESCENDING)
    docs = bets_ref.stream()
    return [doc.to_dict() for doc in docs]

