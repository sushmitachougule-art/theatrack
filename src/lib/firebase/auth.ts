// ============================================
// PawShield — Firebase Auth Helper
// ============================================

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { UserProfile, UserSettings } from "@/types";

const googleProvider = new GoogleAuthProvider();

// --- Sign In ---
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await ensureUserProfile(result.user);
  return result.user;
}

// Shared demo account — always the same UID across sessions
const DEMO_EMAIL = "demo@theatrack.app";
const DEMO_PASSWORD = "DemoUser@TheaTrack2024!";

export async function signInAsDemo(): Promise<User> {
  try {
    // Try signing in with existing demo account first
    const result = await signInWithEmailAndPassword(
      auth,
      DEMO_EMAIL,
      DEMO_PASSWORD,
    );
    await ensureUserProfile(result.user);
    return result.user;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (
      code === "auth/user-not-found" ||
      code === "auth/invalid-credential" ||
      code === "auth/invalid-email"
    ) {
      // First time ever — create the demo account
      const result = await createUserWithEmailAndPassword(
        auth,
        DEMO_EMAIL,
        DEMO_PASSWORD,
      );
      await updateProfile(result.user, { displayName: "Demo User" });
      await ensureUserProfile(result.user);
      return result.user;
    }
    throw err;
  }
}

// --- Sign Out ---
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// --- Create user profile in Firestore if it doesn't exist ---
async function ensureUserProfile(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const defaultSettings: UserSettings = {
      notificationsEnabled: true,
      reminderDaysBefore: [7, 3, 1],
      darkMode: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const profile: Omit<UserProfile, "uid"> = {
      email: user.email || "",
      displayName: user.displayName || "",
      photoUrl: user.photoURL || null,
      role: "owner",
      plan: "free",
      settings: defaultSettings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, profile);
  }
}

// --- Get user profile ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as UserProfile;
  }
  return null;
}

// --- Auth state listener ---
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
