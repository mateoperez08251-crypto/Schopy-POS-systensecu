import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBRPpSKT_nJmJdN7ktIAFHRGUOgY5ZOiUI",
  authDomain: "schopy-pos-technology.firebaseapp.com",
  projectId: "schopy-pos-technology",
  storageBucket: "schopy-pos-technology.firebasestorage.app",
  messagingSenderId: "230912941188",
  appId: "1:230912941188:web:c4ca3e04032804a8fdb6d1",
  measurementId: "G-88EC0ZG0FS"
};

// Evitar error de re-inicialización en Fast Refresh de React Native
let app;
let auth: any;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { app, auth };

// Initialize Firestore Database
export const db = getFirestore(app);

export default app;

