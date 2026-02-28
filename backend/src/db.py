import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from dotenv import load_dotenv

# Load environment variables (like the path to the credentials file)
load_dotenv()

def initialize_db():
    """Initializes and returns the Firestore client."""
    # Check if Firebase is already initialized to avoid errors if this is called multiple times
    if not firebase_admin._apps:
        # We read the path from the .env file, or default to checking the root of the backend folder
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
        
        # Go up one directory from src/ to backend/ where the file should be
        full_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), cred_path)
        
        if not os.path.exists(full_path):
            raise FileNotFoundError(
                f"🚨 Firebase credentials not found at {full_path}.\n"
                f"Please download your service account JSON file, rename it to 'serviceAccountKey.json', "
                f"and place it inside the 'backend' folder."
            )
            
        cred = credentials.Certificate(full_path)
        firebase_admin.initialize_app(cred)
        print("✅ Successfully connected to Firebase Firestore")
        
    return firestore.client()

def save_satellites(db, satellites):
    """Saves or updates satellite data in the 'satellites' collection."""
    print(f"Saving {len(satellites)} satellites to Firestore...")
    batch = db.batch()
    col_ref = db.collection('satellites')
    
    count = 0
    for sat in satellites:
        # Use the satellite ID (NORAD ID) as the document ID
        doc_ref = col_ref.document(sat['id'])
        batch.set(doc_ref, sat, merge=True)
        count += 1
        
        # Firestore batches have a limit of 500 operations
        if count % 450 == 0:
            batch.commit()
            batch = db.batch()
            
    if count % 450 != 0:
        batch.commit()
        
    print("✅ Finished saving satellites.")

def save_launches(db, launches):
    """Saves or updates upcoming launches in the 'launches' collection."""
    print(f"Saving {len(launches)} launches to Firestore...")
    batch = db.batch()
    col_ref = db.collection('launches')
    
    for launch in launches:
        doc_ref = col_ref.document(launch['id'])
        batch.set(doc_ref, launch, merge=True)
        
    batch.commit()
    print("✅ Finished saving launches.")

def save_conjunctions(db, conjunctions):
    """Saves conjunction events to the 'conjunction_events' collection."""
    print(f"Saving {len(conjunctions)} conjunctions to Firestore...")
    batch = db.batch()
    col_ref = db.collection('conjunction_events')
    
    for conj in conjunctions:
        # Create a unique ID for this event based on the assets and time
        event_id = f"{conj['asset_id']}_{conj['secondary_id']}_{conj['time_of_closest_approach'][:10]}"
        
        doc_ref = col_ref.document(event_id)
        # We use merge=True so we update the probability/distance if it changes, 
        # but don't overwrite user actions like "status" if they exist
        batch.set(doc_ref, conj, merge=True)
        
    batch.commit()
    print("✅ Finished saving conjunctions.")

if __name__ == "__main__":
    # Test the connection
    try:
        db = initialize_db()
        print("Database connection test successful.")
    except Exception as e:
        print(f"Connection test failed: {e}")
