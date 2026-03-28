import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ──────────────────────────────────────────────────────
// 👉 GEKOPPELD AAN: culture-app-88cbd
// ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBB5e6zJKujVL4UwZRFv2zuY7NrJlkJTIQ",
  authDomain: "culture-app-88cbd.firebaseapp.com",
  projectId: "culture-app-88cbd",
  storageBucket: "culture-app-88cbd.firebasestorage.app",
  messagingSenderId: "18971487687",
  appId: "1:18971487687:web:3ab98f47f5d0d389103de2",
  measurementId: "G-L4HFMCS7H7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
