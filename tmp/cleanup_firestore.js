import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAOmmT883w6NMVp4_2VkC_WACDkc_VrNlE",
  authDomain: "culture-app-c3881.firebaseapp.com",
  projectId: "culture-app-c3881",
  storageBucket: "culture-app-c3881.firebasestorage.app",
  messagingSenderId: "1036005101120",
  appId: "1:1036005101120:web:3dcdfbc58609288a8459a5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteCollection(colName) {
  console.log(`Cleaning collection: ${colName}...`);
  const colRef = collection(db, colName);
  const snap = await getDocs(colRef);
  let count = 0;
  for (const d of snap.docs) {
    await deleteDoc(doc(db, colName, d.id));
    count++;
  }
  console.log(`Deleted ${count} documents from ${colName}.`);
}

async function run() {
  try {
    await deleteCollection('presence');
    await deleteCollection('wallPosts');
    await deleteCollection('kudos');
    await deleteCollection('polls');
    console.log('Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

run();
