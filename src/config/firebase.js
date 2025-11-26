import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration - using environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD-yRp-2_0KTnW58hCPAS9NtTsOGs-LKMw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "v2v-database-6d645.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://v2v-database-6d645-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "v2v-database-6d645",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "v2v-database-6d645.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1069969284178",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1069969284178:web:316a94ee1c410341d6538b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FSJ4LQ0ED5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);
