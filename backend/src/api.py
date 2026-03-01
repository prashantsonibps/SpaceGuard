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
from .matching_engine import OrderOutcome, OrderAction, OrderStatus, place_order_transaction

class OrderRequest(BaseModel):
    user_id: str
    market_id: str
    outcome: OrderOutcome
    action: OrderAction
    price_cents: int
    quantity: int

class ResolveRequest(BaseModel):
    outcome: OrderOutcome

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

@app.post("/orders")
def create_order(req: OrderRequest):
    """Place a limit order."""
    transaction = db.transaction()
    try:
        result = place_order_transaction(
            transaction, db, req.user_id, req.market_id, 
            req.outcome.value, req.action.value, req.price_cents, req.quantity
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/orders/{user_id}")
def get_user_orders(user_id: str):
    orders_ref = db.collection('orders').where("user_id", "==", user_id).order_by("created_at", direction=firestore.Query.DESCENDING)
    docs = orders_ref.stream()
    return [doc.to_dict() for doc in docs]

@app.get("/portfolio/{user_id}")
def get_user_portfolio(user_id: str):
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    pos_ref = db.collection('positions').where("user_id", "==", user_id)
    positions = [doc.to_dict() for doc in pos_ref.stream()]
    
    # Also fetch open orders to calculate locked cash
    from .matching_engine import get_available_balance
    orders_ref = db.collection('orders').where("user_id", "==", user_id).where("status", "==", OrderStatus.OPEN.value)
    open_orders = [doc.to_dict() for doc in orders_ref.stream()]
    
    avail_cash = get_available_balance(user_doc.to_dict(), open_orders)
    
    return {
        "user": user_doc.to_dict(),
        "available_balance": avail_cash,
        "positions": positions,
        "open_orders": open_orders
    }

@app.get("/markets/{market_id}/orderbook")
def get_orderbook(market_id: str):
    orders_ref = db.collection('orders').where("market_id", "==", market_id).where("status", "==", OrderStatus.OPEN.value)
    open_orders = [doc.to_dict() for doc in orders_ref.stream()]
    
    book = {
        "YES_BUY": {}, "YES_SELL": {},
        "NO_BUY": {}, "NO_SELL": {}
    }
    for o in open_orders:
        key = f"{o['outcome']}_{o['action']}"
        p = o['price_cents']
        qty = o['quantity'] - o['filled']
        if qty > 0:
            book[key][p] = book[key].get(p, 0) + qty
            
    result = {}
    for k, v in book.items():
        rev = "BUY" in k
        arr = [{"price_cents": price, "quantity": qty} for price, qty in v.items()]
        arr.sort(key=lambda x: x['price_cents'], reverse=rev)
        result[k] = arr
        
    return result

@app.post("/markets/{market_id}/resolve")
def resolve_market(market_id: str, req: ResolveRequest):
    """Admin endpoint to resolve a market and pay out winning shares."""
    pos_ref = db.collection('positions').where("market_id", "==", market_id)
    positions = [doc.to_dict() for doc in pos_ref.stream()]
    
    orders_ref = db.collection('orders').where("market_id", "==", market_id).where("status", "==", OrderStatus.OPEN.value)
    
    batch = db.batch()
    for doc in orders_ref.stream():
        batch.update(doc.reference, {"status": OrderStatus.CANCELLED.value})
        
    for pos in positions:
        user_id = pos['user_id']
        yes_qty = pos.get('yes_shares', 0)
        no_qty = pos.get('no_shares', 0)
        
        payout_cents = 0
        if req.outcome.value == "YES":
            payout_cents = yes_qty * 100
        else:
            payout_cents = no_qty * 100
            
        if payout_cents > 0:
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()
            if user_doc.exists:
                current_balance = user_doc.to_dict().get('balance', 0)
                batch.update(user_ref, {"balance": current_balance + (payout_cents / 100.0)})
                
        pos_doc_ref = db.collection('positions').document(f"{user_id}_{market_id}")
        batch.update(pos_doc_ref, {"yes_shares": 0, "no_shares": 0})
        
    batch.commit()
    return {"message": f"Market {market_id} resolved to {req.outcome.value}. Paid out {len(positions)} positions."}

