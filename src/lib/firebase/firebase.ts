import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBdK-6XHBZGjlrT1SP7IbjzbKQ4qiddPek",
  authDomain: "culinator-67aeb.firebaseapp.com",
  projectId: "culinator-67aeb",
  storageBucket: "culinator-67aeb.appspot.com",
  messagingSenderId: "200120265928",
  appId: "1:200120265928:web:b236d4e97d1087fa9ac9fd",
  measurementId: "G-6WGR3NXBN9"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics conditionally (only in browser)
const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, auth, db, storage, analytics };
