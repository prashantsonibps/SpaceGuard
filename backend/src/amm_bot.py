import time
import uuid
import random
from datetime import datetime
from .db import initialize_db
from .matching_engine import place_order_transaction, OrderAction, OrderOutcome

db = initialize_db()
AMM_USER_ID = "amm_system_bot"

def init_amm_user():
    """Ensure the AMM bot user exists with massive balance."""
    user_ref = db.collection('users').document(AMM_USER_ID)
    if not user_ref.get().exists:
        user_ref.set({
            "id": AMM_USER_ID,
            "balance": 100000000.0, # 100M Demo USD
            "created_at": datetime.utcnow().isoformat()
        })
        print(f"[AMM] Initialized AMM bot account: {AMM_USER_ID}")

def cancel_all_amm_orders(market_id: str):
    """Cancel existing AMM orders for a market before placing new ones to avoid self-crossing."""
    orders_ref = db.collection('orders').where("user_id", "==", AMM_USER_ID)\
                                        .where("market_id", "==", market_id)\
                                        .where("status", "==", "OPEN")
    batch = db.batch()
    count = 0
    for doc in orders_ref.stream():
        batch.update(doc.reference, {"status": "CANCELLED"})
        count += 1
    if count > 0:
        batch.commit()
    return count

def run_amm_cycle():
    """Run one pass over all active markets to adjust liquidity."""
    try:
        init_amm_user()
        
        MOCK_MARKETS = {
             "mkt_coll_1": 85,
             "mkt_neo_1": 5,
             "mkt_launch_1": 15,
             "mkt_debris_1": 42,
             "mkt_col_2": 82,
             "mkt_man_1": 65,
             "mkt_launch_2": 95,
             "mkt_weather_1": 30,
             "mkt_neo_2": 8,
             "mkt_weather_2": 60,
             "mkt_launch_3": 12,
             "mkt_debris_2": 25
        }
        
        for market_id, fair_value in MOCK_MARKETS.items():
            jitter = random.randint(-1, 1) # Reduce jitter for stability
            current_fv = max(5, min(95, fair_value + jitter))
            
            cancel_all_amm_orders(market_id)
            
            # Rehydrate the order book
            placed = 0
            transaction = db.transaction()
            
            # SELL YES (Asks) above fair value
            for i in range(1, 6):
                ask_price = current_fv + (i * 2) # Spread is 2c
                if ask_price >= 99: break
                qty = random.randint(10, 100)
                try:
                    place_order_transaction(transaction, db, AMM_USER_ID, market_id, "YES", "SELL", ask_price, qty)
                    placed += 1
                except Exception:
                    pass

            # BUY YES (Bids) below fair value
            for i in range(1, 6):
                bid_price = current_fv - (i * 2)
                if bid_price <= 1: break
                qty = random.randint(10, 100)
                try:
                    place_order_transaction(transaction, db, AMM_USER_ID, market_id, "YES", "BUY", bid_price, qty)
                    placed += 1
                except Exception:
                    pass
                    
            print(f"[AMM] Updated {market_id} | FV: {current_fv}¢ | Orders: {placed}")
            
    except Exception as e:
        print(f"[AMM Error] {e}")

def start_amm_bot():
    """Infinite loop for the background thread."""
    print("🚀 Starting AMM Liquidity Bot...")
    while True:
        run_amm_cycle()
        time.sleep(30) # Re-balance every 30 seconds to avoid DB limits
