import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Note: For the hackathon, we are hardcoding the public configuration.
// In a real app, these should be in a .env.local file.
// You can find these values in your Firebase Console > Project Settings > General > Your Apps (Web App)
const firebaseConfig = {
  projectId: "spaceguard-a0dbc",
  // We don't have the full web config since we only have the admin SDK key right now.
  // BUT, since we are only using Firestore, the projectId is usually enough for the JS SDK
  // to initialize if rules are open in Test Mode. If this fails, we'll need the full config snippet.
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
