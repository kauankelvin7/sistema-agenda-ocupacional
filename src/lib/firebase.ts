import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.storageBucket ||
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  throw new Error("Missing Firebase configuration. Please check your .env file.");
}

// Initialize Firebase
let app;
if (getApps().length > 0) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);

// Set the auth state persistence to SESSION to improve security
try {
  auth.setPersistence(browserSessionPersistence);
} catch (error) {
  console.error("Error setting auth persistence:", error);
}

// CORREÇÃO: Firestore simples sem cache persistente para evitar warnings
const db = getFirestore(app);

const storage = getStorage(app);

// Improved connection monitoring with adaptive limit
const connectionMonitor = {
  count: 0,
  warningThreshold: 750,
  criticalThreshold: 950,
  maxConnections: 1000,

  // Monitor a new connection
  monitor: function () {
    this.count++;

    // Log connection status apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`Active Firebase connections: ${this.count}`);
    }

    // Check thresholds for warnings
    if (this.count >= this.criticalThreshold) {
      console.error(`CRITICAL: Connection count (${this.count}) approaching maximum limit!`);
    } else if (this.count >= this.warningThreshold) {
      console.warn(`WARNING: High connection count (${this.count})`);
    }

    // Return cleanup function
    return () => {
      this.count = Math.max(0, this.count - 1);
      if (import.meta.env.DEV) {
        console.log(`Connection closed. Remaining: ${this.count}`);
      }
    };
  },

  // Get current connection status
  getStatus: function () {
    return {
      current: this.count,
      maximum: this.maxConnections,
      percentUsed: (this.count / this.maxConnections) * 100,
      status:
        this.count >= this.criticalThreshold
          ? "critical"
          : this.count >= this.warningThreshold
          ? "warning"
          : "normal",
    };
  },
};

// Backward compatibility
const monitorConnections = connectionMonitor.monitor.bind(connectionMonitor);

// Function to check token validity periodically
const setupTokenRefreshMonitor = () => {
  const intervalId = setInterval(async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // This will force a token refresh if needed
        const token = await currentUser.getIdToken(true);
        const decodedToken = await auth.currentUser?.getIdTokenResult();

        // Check if token is about to expire (within 5 minutes)
        if (decodedToken) {
          const expirationTime = new Date(decodedToken.expirationTime).getTime();
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;

          if (expirationTime - now < fiveMinutes) {
            console.log("Token expires soon. Refreshing...");
            await currentUser.getIdToken(true);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes

  // ADICIONADO: Cleanup do interval
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      clearInterval(intervalId);
    });
  }

  return intervalId;
};

// Start the token refresh monitor
if (typeof window !== "undefined") {
  setupTokenRefreshMonitor();
}

export { app, auth, db, storage, monitorConnections, connectionMonitor };
export default app;
