import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBRPpSKT_nJmJdN7ktIAFHRGUOgY5ZOiUI",
  authDomain: "schopy-pos-technology.firebaseapp.com",
  projectId: "schopy-pos-technology",
  storageBucket: "schopy-pos-technology.firebasestorage.app",
  messagingSenderId: "230912941188",
  appId: "1:230912941188:web:c4ca3e04032804a8fdb6d1",
  measurementId: "G-88EC0ZG0FS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore Database
export const db = getFirestore(app);

export default app;
