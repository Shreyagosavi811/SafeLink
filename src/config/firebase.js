import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-yRp-2_0KTnW58hCPAS9NtTsOGs-LKMw",
  authDomain: "v2v-database-6d645.firebaseapp.com",
  databaseURL: "https://v2v-database-6d645-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "v2v-database-6d645",
  storageBucket: "v2v-database-6d645.firebasestorage.app",
  messagingSenderId: "1069969284178",
  appId: "1:1069969284178:web:316a94ee1c410341d6538b",
  measurementId: "G-FSJ4LQ0ED5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);
