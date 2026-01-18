
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper function to safely get environment variables
// This prevents "ReferenceError: process is not defined" in browser environments
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors accessing process
  }
  try {
    // Check for Vite-style env vars
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
};

// Your web app's Firebase configuration
// NOTE: If running in a browser without a build step, replace the fallback strings with your actual keys.
const firebaseConfig = {
  apiKey: getEnv("REACT_APP_FIREBASE_API_KEY") || "AIzaSy_PLACEHOLDER_KEY_FOR_DEMO",
  authDomain: getEnv("REACT_APP_FIREBASE_AUTH_DOMAIN") || "demo-project.firebaseapp.com",
  projectId: getEnv("REACT_APP_FIREBASE_PROJECT_ID") || "demo-project",
  storageBucket: getEnv("REACT_APP_FIREBASE_STORAGE_BUCKET") || "demo-project.appspot.com",
  messagingSenderId: getEnv("REACT_APP_FIREBASE_MESSAGING_SENDER_ID") || "123456789",
  appId: getEnv("REACT_APP_FIREBASE_APP_ID") || "1:123456789:web:abcdef123456"
};

// Log warning if running with placeholder keys
if (firebaseConfig.apiKey.includes("PLACEHOLDER")) {
  console.warn(
    "%c Firebase Configuration Missing ", 
    "background: #222; color: #bada55; font-size: 16px; padding: 4px;",
    "\nPlease update firebase.ts with your actual Firebase config keys to enable Login."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
