import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ──────────────────────────────────────────────────────
// 👉 STAP 1: Maak een gratis project op console.firebase.google.com
// ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "JOUW_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "JOUW_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "JOUW_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "JOUW_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "JOUW_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "JOUW_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
