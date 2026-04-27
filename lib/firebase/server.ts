import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let firebaseAdminApp: App | null = null;

function getServiceAccount() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    return JSON.parse(serviceAccountKey);
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  throw new Error(
    "Missing Firebase Admin env vars. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
  );
}

function getFirebaseAdminApp() {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const existingApp = getApps()[0];

  if (existingApp) {
    firebaseAdminApp = existingApp;
    return firebaseAdminApp;
  }

  firebaseAdminApp = initializeApp({
    credential: cert(getServiceAccount()),
    projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  return firebaseAdminApp;
}

export function getServerAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getServerFirestore() {
  return getFirestore(getFirebaseAdminApp());
}

export async function verifyBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("Missing authorization token.");
  }

  return getServerAuth().verifyIdToken(token);
}
