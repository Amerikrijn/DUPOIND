import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ──────────────────────────────────────────────────────
// 👉 GEKOPPELD AAN: culture-app-c3881 (Free Spark Plan)
// ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAOmmT883w6NMVp4_2VkC_WACDkc_VrNlE",
  authDomain: "culture-app-c3881.firebaseapp.com",
  projectId: "culture-app-c3881",
  storageBucket: "culture-app-c3881.firebasestorage.app",
  messagingSenderId: "1036005101120",
  appId: "1:1036005101120:web:3dcdfbc58609288a8459a5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
