// ============================================
// PawShield — Firebase Admin SDK (server only)
// Used by Next.js API routes for sending FCM
// push notifications from the admin panel.
// ============================================

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App;
let adminMessaging: Messaging;
let adminDb: Firestore;

function initAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  const credentials = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!credentials) {
    throw new Error(
      "FIREBASE_ADMIN_CREDENTIALS environment variable is not set. " +
        "Add it in Firebase App Hosting secrets (see apphosting.yaml).",
    );
  }

  const serviceAccount = JSON.parse(credentials);

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
  });
}

export function getAdminApp(): App {
  if (!adminApp) adminApp = initAdmin();
  return adminApp;
}

export function getAdminMessaging(): Messaging {
  if (!adminMessaging) adminMessaging = getMessaging(getAdminApp());
  return adminMessaging;
}

export function getAdminDb(): Firestore {
  if (!adminDb) adminDb = getFirestore(getAdminApp());
  return adminDb;
}
