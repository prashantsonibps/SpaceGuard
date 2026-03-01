import uuid
from datetime import datetime
from enum import Enum
from typing import List
from google.cloud import firestore

class OrderOutcome(str, Enum):
    YES = "YES"
    NO = "NO"

class OrderAction(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderStatus(str, Enum):
    OPEN = "OPEN"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"

def get_available_balance(user_doc_dict: dict, user_open_orders: List[dict]) -> float:
    balance = user_doc_dict.get('balance', 0.0)
    locked_cash = sum((o.get('quantity', 0) - o.get('filled', 0)) * o.get('price_cents', 0) / 100.0 
                      for o in user_open_orders if o.get('action') == OrderAction.BUY.value)
    return max(0.0, balance - locked_cash)

def get_available_shares(position_doc_dict: dict, user_open_orders_in_market: List[dict], outcome: str) -> int:
    shares = position_doc_dict.get(f"{outcome.lower()}_shares", 0)
    locked_shares = sum((o.get('quantity', 0) - o.get('filled', 0)) 
                        for o in user_open_orders_in_market 
                        if o.get('action') == OrderAction.SELL.value and o.get('outcome') == outcome)
    return max(0, shares - locked_shares)

@firestore.transactional
def place_order_transaction(transaction, db, user_id: str, market_id: str, outcome: str, action: str, price_cents: int, quantity: int):
    outcome_enum = OrderOutcome(outcome)
    action_enum = OrderAction(action)
    
    user_ref = db.collection('users').document(user_id)
    user_snap = user_ref.get(transaction=transaction)
    if not user_snap.exists:
        raise ValueError("User not found")
    user_data = user_snap.to_dict()

    pos_id = f"{user_id}_{market_id}"
    pos_ref = db.collection('positions').document(pos_id)
    pos_snap = pos_ref.get(transaction=transaction)
    pos_data = pos_snap.to_dict() if pos_snap.exists else {"user_id": user_id, "market_id": market_id, "yes_shares": 0, "no_shares": 0}

    # Fetch all open orders for this user to check balance
    user_orders_query = db.collection('orders').where("user_id", "==", user_id).where("status", "==", OrderStatus.OPEN.value)
    user_open_orders = [doc.to_dict() for doc in user_orders_query.stream(transaction=transaction)]
    user_open_orders_market = [o for o in user_open_orders if o.get('market_id') == market_id]

    if action_enum == OrderAction.BUY:
        avail_cash = get_available_balance(user_data, user_open_orders)
        if avail_cash < (price_cents * quantity) / 100.0:
            raise ValueError(f"Insufficient available balance. You have ${avail_cash:.2f}")
    else:
        avail_shares = get_available_shares(pos_data, user_open_orders_market, outcome_enum.value)
        if avail_shares < quantity:
            raise ValueError(f"Insufficient available {outcome_enum.value} shares")

    # Fetch all open orders for this market
    market_orders_query = db.collection('orders').where("market_id", "==", market_id).where("status", "==", OrderStatus.OPEN.value)
    market_open_orders = []
    for doc in market_orders_query.stream(transaction=transaction):
        data = doc.to_dict()
        data['doc_id'] = doc.id
        market_open_orders.append(data)

    matchable_orders = [o for o in market_open_orders if o.get('user_id') != user_id]

    new_order = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "market_id": market_id,
        "outcome": outcome_enum.value,
        "action": action_enum.value,
        "price_cents": price_cents,
        "quantity": quantity,
        "filled": 0,
        "status": OrderStatus.OPEN.value,
        "created_at": datetime.utcnow().isoformat()
    }
    
    remaining_qty = quantity
    updates = {} 
    user_balance_change = 0.0
    user_shares_change = { "YES": 0, "NO": 0 }
    
    maker_balance_changes = {} 
    maker_pos_changes = {} 

    candidates = []
    for o in matchable_orders:
        o_qty = o['quantity'] - o['filled']
        if o_qty <= 0: continue
        
        if action_enum == OrderAction.BUY:
            if outcome_enum == OrderOutcome.YES:
                if o['action'] == OrderAction.SELL.value and o['outcome'] == OrderOutcome.YES.value:
                    if o['price_cents'] <= price_cents:
                        candidates.append((o['price_cents'], o['created_at'], o, 'TRANSFER'))
                elif o['action'] == OrderAction.BUY.value and o['outcome'] == OrderOutcome.NO.value:
                    implied_yes_price = 100 - o['price_cents']
                    if implied_yes_price <= price_cents:
                        candidates.append((implied_yes_price, o['created_at'], o, 'MINT'))
            else: # BUY NO
                if o['action'] == OrderAction.SELL.value and o['outcome'] == OrderOutcome.NO.value:
                    if o['price_cents'] <= price_cents:
                        candidates.append((o['price_cents'], o['created_at'], o, 'TRANSFER'))
                elif o['action'] == OrderAction.BUY.value and o['outcome'] == OrderOutcome.YES.value:
                    implied_no_price = 100 - o['price_cents']
                    if implied_no_price <= price_cents:
                        candidates.append((implied_no_price, o['created_at'], o, 'MINT'))
        else: # SELL
            if outcome_enum == OrderOutcome.YES:
                if o['action'] == OrderAction.BUY.value and o['outcome'] == OrderOutcome.YES.value:
                    if o['price_cents'] >= price_cents:
                        candidates.append((-o['price_cents'], o['created_at'], o, 'TRANSFER'))
                elif o['action'] == OrderAction.SELL.value and o['outcome'] == OrderOutcome.NO.value:
                    implied_yes_price = 100 - o['price_cents']
                    if implied_yes_price >= price_cents:
                        candidates.append((-implied_yes_price, o['created_at'], o, 'UNMINT'))
            else: # SELL NO
                if o['action'] == OrderAction.BUY.value and o['outcome'] == OrderOutcome.NO.value:
                    if o['price_cents'] >= price_cents:
                        candidates.append((-o['price_cents'], o['created_at'], o, 'TRANSFER'))
                elif o['action'] == OrderAction.SELL.value and o['outcome'] == OrderOutcome.YES.value:
                    implied_no_price = 100 - o['price_cents']
                    if implied_no_price >= price_cents:
                        candidates.append((-implied_no_price, o['created_at'], o, 'UNMINT'))

    candidates.sort(key=lambda x: (x[0], x[1]))

    for price_key, _, maker_order, match_type in candidates:
        if remaining_qty <= 0: break
        
        maker_rem = maker_order['quantity'] - maker_order['filled']
        if maker_rem <= 0: continue
        
        fill_qty = min(remaining_qty, maker_rem)
        exec_price = price_key if action_enum == OrderAction.BUY else -price_key
        
        remaining_qty -= fill_qty
        maker_order['filled'] += fill_qty
        if maker_order['filled'] == maker_order['quantity']:
            maker_order['status'] = OrderStatus.FILLED.value
        updates[maker_order['doc_id']] = maker_order
        
        maker_id = maker_order['user_id']
        if maker_id not in maker_balance_changes: maker_balance_changes[maker_id] = 0.0
        if maker_id not in maker_pos_changes: maker_pos_changes[maker_id] = {"YES": 0, "NO": 0}
            
        if action_enum == OrderAction.BUY:
            cents_paid = exec_price * fill_qty
            user_balance_change -= cents_paid / 100.0
            user_shares_change[outcome_enum.value] += fill_qty
            
            if match_type == 'TRANSFER':
                maker_balance_changes[maker_id] += cents_paid / 100.0
                maker_pos_changes[maker_id][outcome_enum.value] -= fill_qty
            elif match_type == 'MINT':
                cents_paid_by_maker = maker_order['price_cents'] * fill_qty
                maker_balance_changes[maker_id] -= cents_paid_by_maker / 100.0
                opp_outcome = "NO" if outcome_enum.value == "YES" else "YES"
                maker_pos_changes[maker_id][opp_outcome] += fill_qty
                
        else: # SELL
            cents_received = exec_price * fill_qty
            user_balance_change += cents_received / 100.0
            user_shares_change[outcome_enum.value] -= fill_qty
            
            if match_type == 'TRANSFER':
                maker_balance_changes[maker_id] -= cents_received / 100.0
                maker_pos_changes[maker_id][outcome_enum.value] += fill_qty
            elif match_type == 'UNMINT':
                cents_received_by_maker = maker_order['price_cents'] * fill_qty
                maker_balance_changes[maker_id] += cents_received_by_maker / 100.0
                opp_outcome = "NO" if outcome_enum.value == "YES" else "YES"
                maker_pos_changes[maker_id][opp_outcome] -= fill_qty

    new_order['filled'] = quantity - remaining_qty
    if remaining_qty == 0:
        new_order['status'] = OrderStatus.FILLED.value
    
    # Write Phase
    if user_balance_change != 0: transaction.update(user_ref, {"balance": user_data['balance'] + user_balance_change})
        
    if user_shares_change["YES"] != 0 or user_shares_change["NO"] != 0:
        pos_data['yes_shares'] = pos_data.get('yes_shares', 0) + user_shares_change["YES"]
        pos_data['no_shares'] = pos_data.get('no_shares', 0) + user_shares_change["NO"]
        if pos_snap.exists: transaction.update(pos_ref, {"yes_shares": pos_data['yes_shares'], "no_shares": pos_data['no_shares']})
        else: transaction.set(pos_ref, pos_data)

    new_order_ref = db.collection('orders').document(new_order['id'])
    transaction.set(new_order_ref, new_order)
    
    for doc_id, order_data in updates.items():
        doc_ref = db.collection('orders').document(doc_id)
        save_data = order_data.copy()
        del save_data['doc_id']
        transaction.set(doc_ref, save_data, merge=True)
        
    for m_id, bal_change in maker_balance_changes.items():
        if bal_change != 0:
            m_user_ref = db.collection('users').document(m_id)
            m_user_snap = m_user_ref.get(transaction=transaction)
            if m_user_snap.exists:
                transaction.update(m_user_ref, {"balance": m_user_snap.to_dict().get('balance', 0) + bal_change})
                
    for m_id, pos_chg in maker_pos_changes.items():
        if pos_chg["YES"] != 0 or pos_chg["NO"] != 0:
            m_pos_ref = db.collection('positions').document(f"{m_id}_{market_id}")
            m_pos_snap = m_pos_ref.get(transaction=transaction)
            m_pos_data = m_pos_snap.to_dict() if m_pos_snap.exists else {"yes_shares": 0, "no_shares": 0}
            new_yes = m_pos_data.get('yes_shares', 0) + pos_chg["YES"]
            new_no = m_pos_data.get('no_shares', 0) + pos_chg["NO"]
            if m_pos_snap.exists:
                transaction.update(m_pos_ref, {"yes_shares": new_yes, "no_shares": new_no})
            else:
                transaction.set(m_pos_ref, {"user_id": m_id, "market_id": market_id, "yes_shares": new_yes, "no_shares": new_no})

    return new_order
