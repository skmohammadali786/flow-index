import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Check if API key is present and not the default placeholder
const apiKey = import.meta.env.FIREBASE_API_KEY;
const isFirebaseConfigured = !!apiKey && apiKey !== "DEMO_KEY";

// Use environment variables for configuration.
// If these are missing, we use a placeholder that will trigger the authService fallback
// allowing the app to run in "Offline/Demo Mode" without crashing.
const firebaseConfig = {
  apiKey: apiKey || "DEMO_KEY",
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  databaseURL: import.meta.env.FIREBASE_DATABASE_URL || "https://demo.firebaseio.com",
  projectId: import.meta.env.FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID || "0000000000",
  appId: import.meta.env.FIREBASE_APP_ID || "1:0000000000:web:0000000000"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db, isFirebaseConfigured };