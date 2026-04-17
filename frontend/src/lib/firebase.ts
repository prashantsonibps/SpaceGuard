import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Use the Firebase *Web app* config from the same project as your Firestore data.
// Console → Project settings → Your apps → Web → copy values into frontend/.env.local (see .env.example).
const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'spaceguard-a0dbc';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.appspot.com`,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
};

if (typeof window !== 'undefined' && !firebaseConfig.apiKey) {
  console.warn(
    '[SpaceGuard] NEXT_PUBLIC_FIREBASE_API_KEY is not set. Firestore may not connect; add Web app env vars from Firebase Console (see frontend/.env.example).'
  );
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
