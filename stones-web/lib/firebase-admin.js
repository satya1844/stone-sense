// Server-side Firebase Admin SDK for verifying ID tokens and managing users.
// Requires FIREBASE_* env vars. Do NOT expose these to the client.
import { cert, getApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

let adminApp = null;

export function getFirebaseAdminApp() {
  if (adminApp) return adminApp;
  
  try {
    if (getApps().length > 0) {
      adminApp = getApps()[0];
      return adminApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin environment variables");
    }

    const firebaseAdminConfig = {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    };

    adminApp = initializeAdminApp(firebaseAdminConfig);
    return adminApp;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}

export function getFirebaseAdminAuth() {
  const app = getFirebaseAdminApp();
  return getAdminAuth(app);
}
