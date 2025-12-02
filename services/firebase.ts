import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBfk-7HzvitKLySkFnXjrWs5CkhsTVl5HU",
  authDomain: "flow-index.firebaseapp.com",
  databaseURL: "https://flow-index-default-rtdb.firebaseio.com",
  projectId: "flow-index",
  storageBucket: "flow-index.firebasestorage.app",
  messagingSenderId: "526141325708",
  appId: "1:526141325708:web:41cc31d09f61968b1056a9",
  measurementId: "G-1NCX14ZTR8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const analytics = getAnalytics(app);

export { app, auth, db, analytics };