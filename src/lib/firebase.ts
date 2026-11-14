import { getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup, type Auth } from "firebase/auth";

/**
 * Firebase web configuration is public by design, but it is still read from
 * environment variables so that no project identifiers are hardcoded in the
 * repository.
 *
 * Nothing is initialised at import time on purpose. `/login` and `/favorites`
 * are client pages that Next also evaluates while prerendering, and a build
 * machine without the `NEXT_PUBLIC_FIREBASE_*` values (they are inlined at
 * build time, and `.env` is git-ignored) made `initializeApp()` throw
 * `auth/invalid-api-key`, which aborted the entire export. The SDK is now
 * created on first use and a missing configuration becomes a readable error on
 * the sign-in button instead of a failed deploy.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

const NOT_CONFIGURED_MESSAGE =
  "Google sign-in is not configured on this deployment: set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN and NEXT_PUBLIC_FIREBASE_PROJECT_ID as build variables, then rebuild (public values are inlined at build time).";

if (!isFirebaseConfigured && process.env.NODE_ENV !== "production") {
  console.warn(
    "[firebase] Missing NEXT_PUBLIC_FIREBASE_* variables: Google sign-in will be unavailable."
  );
}

let cachedAuth: Auth | null = null;
let cachedProvider: GoogleAuthProvider | null = null;

function getAuthInstance(): Auth {
  if (!isFirebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
  if (!cachedAuth) {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

function getGoogleProvider(): GoogleAuthProvider {
  if (!cachedProvider) {
    cachedProvider = new GoogleAuthProvider();
    cachedProvider.setCustomParameters({ prompt: "select_account" });
  }
  return cachedProvider;
}

/**
 * Opens the Google popup and returns the Firebase ID token. The token is
 * verified server-side before a session is issued, so the client can never
 * assert its own identity; a thrown error carries a message that is safe to
 * show in the sign-in dialog.
 */
export async function signInWithGoogle(): Promise<string> {
  const credential = await signInWithPopup(getAuthInstance(), getGoogleProvider());
  return credential.user.getIdToken();
}
