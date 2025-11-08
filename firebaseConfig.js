import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const fallbackConfig = {
  apiKey: "AIzaSyCnlOBqnRG5H3jkzloDm_G17DaJrRSkAbA",
  authDomain: "studio-531461249-2504d.firebaseapp.com",
  databaseURL:
    "https://studio-531461249-2504d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studio-531461249-2504d",
  storageBucket: "studio-531461249-2504d.firebasestorage.app",
  messagingSenderId: "159917021111",
  appId: "1:159917021111:web:696c7ef0ef2d2ff0e63a32",
  measurementId: "G-S20R60HCWK",
};

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  databaseURL:
    process.env.REACT_APP_FIREBASE_DATABASE_URL || fallbackConfig.databaseURL,
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let analyticsPromise = null;
let performancePromise = null;

if (typeof window !== "undefined") {
  analyticsPromise = isAnalyticsSupported().then((supported) =>
    supported ? getAnalytics(app) : null
  );
  
  // Firebase Performance doesn't have isSupported, use try-catch instead
  performancePromise = Promise.resolve().then(() => {
    try {
      return getPerformance(app);
    } catch (error) {
      // Performance monitoring not available (e.g., in development or unsupported browser)
      if (process.env.NODE_ENV === "development") {
        console.log("Firebase Performance not available:", error.message);
      }
      return null;
    }
  });
}

export const firebaseApp = app;
export const analytics = analyticsPromise;
export const performance = performancePromise;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

