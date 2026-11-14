import { getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup, type Auth } from "firebase/auth";

/**
 * Firebase web SDK bootstrap for the browser.
 *
 * Two rules make this reliable on every deployment:
 *
 *  1. Nothing is initialised at import time. `/login` and `/favorites` are
 *     client pages that Next also evaluates while prerendering, and an
 *     `initializeApp()` call with an empty key threw `auth/invalid-api-key`
 *     during the build ("Export encountered an error on /favorites/page").
 *
 *  2. The configuration is resolved lazily and from two sources. `NEXT_PUBLIC_*`
 *     literals are replaced by the bundler at build time, so a Worker built
 *     without them ships empty strings even when `wrangler.jsonc` provides the
 *     values at runtime. When the inlined copy is incomplete the browser asks
 *     `/api/config/firebase`, which reads the runtime environment instead.
 */
export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const buildTimeConfig: FirebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const NOT_CONFIGURED_MESSAGE =
  "Google sign-in is not configured on this deployment. The server needs FIREBASE_WEB_API_KEY (a Worker secret) and FIREBASE_AUTH_DOMAIN / FIREBASE_PROJECT_ID / FIREBASE_APP_ID (wrangler.jsonc vars or Worker secrets), then redeploy.";

function isComplete(config: FirebaseWebConfig | null | undefined): config is FirebaseWebConfig {
  return Boolean(config?.apiKey && config.authDomain && config.projectId);
}

let runtimeConfigRequest: Promise<FirebaseWebConfig | null> | null = null;

async function fetchRuntimeConfig(): Promise<FirebaseWebConfig | null> {
  // Prerendering runs in Node, where a relative fetch has no origin to resolve.
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch("/api/config/firebase", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      configured?: boolean;
      firebase?: FirebaseWebConfig;
    };
    return payload.configured && payload.firebase ? payload.firebase : null;
  } catch {
    return null;
  }
}

/**
 * The configuration to initialise the SDK with. Throws a message that is safe to
 * show in the sign-in dialog when the deployment genuinely has none.
 */
export async function resolveFirebaseConfig(): Promise<FirebaseWebConfig> {
  if (isComplete(buildTimeConfig)) return buildTimeConfig;

  runtimeConfigRequest ??= fetchRuntimeConfig();
  const runtimeConfig = await runtimeConfigRequest;

  if (isComplete(runtimeConfig)) return runtimeConfig;

  // Do not cache the failure: a later click retries, so a transient network
  // error does not disable sign-in until the page is reloaded.
  runtimeConfigRequest = null;
  throw new Error(NOT_CONFIGURED_MESSAGE);
}

let cachedAuth: Auth | null = null;
let cachedProvider: GoogleAuthProvider | null = null;

async function getAuthInstance(): Promise<Auth> {
  if (cachedAuth) return cachedAuth;

  const config = await resolveFirebaseConfig();
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  cachedAuth = getAuth(app);
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
 * assert its own identity.
 */
export async function signInWithGoogle(): Promise<string> {
  const credential = await signInWithPopup(await getAuthInstance(), getGoogleProvider());
  return credential.user.getIdToken();
}
