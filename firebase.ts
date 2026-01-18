
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper function to safely get environment variables
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
  } catch (e) {}
  
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

// ------------------------------------------------------------------
// [중요] 여기에 선생님의 Firebase 설정값을 직접 입력하거나, 
// .env 파일을 통해 환경변수가 제대로 로드되는지 확인해야 합니다.
// 빌드 과정에서 환경변수가 누락되면 앱이 실행되지 않을 수 있습니다.
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: getEnv("REACT_APP_FIREBASE_API_KEY") || "AIzaSy_PLACEHOLDER", 
  authDomain: getEnv("REACT_APP_FIREBASE_AUTH_DOMAIN") || "demo-project.firebaseapp.com",
  projectId: getEnv("REACT_APP_FIREBASE_PROJECT_ID") || "demo-project",
  storageBucket: getEnv("REACT_APP_FIREBASE_STORAGE_BUCKET") || "demo-project.appspot.com",
  messagingSenderId: getEnv("REACT_APP_FIREBASE_MESSAGING_SENDER_ID") || "123456789",
  appId: getEnv("REACT_APP_FIREBASE_APP_ID") || "1:123456789:web:abcdef"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  console.error("Please check your firebaseConfig in firebase.ts");
  // Prevent crash by assigning dummy objects if init fails
  // This allows the UI to render an error message instead of white screen
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  googleProvider = new GoogleAuthProvider();
}

export { auth, db, googleProvider };
export default app;
