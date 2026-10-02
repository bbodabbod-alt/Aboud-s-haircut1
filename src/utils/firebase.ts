import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDnhKU4yv0RJ5EY84pKxvR_TWUiK8j0w8Y",
  authDomain: "aboud-s-haircut.firebaseapp.com",
  projectId: "aboud-s-haircut",
  storageBucket: "aboud-s-haircut.firebasestorage.app",
  messagingSenderId: "901180312135",
  appId: "1:901180312135:web:12695a921748b4747b7f62",
  measurementId: "G-KNDY6DNR0C",
  databaseURL: "https://aboud-s-haircut-default-rtdb.firebaseio.com"
};

// Initialize or retrieve Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Realtime Database (rtdb) for instant onValue synchronization
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

// Standard auth and db exports
export const auth = getAuth(app);
export const db = rtdb; // primary database export

// Optional Firestore fallback if needed
export const firestore = getFirestore(app);
