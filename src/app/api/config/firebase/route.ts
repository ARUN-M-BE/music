import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { route } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/config/firebase - public Firebase web configuration.
 *
 * The browser needs `apiKey`, `authDomain` and `projectId` to open the Google
 * popup. They used to come from `NEXT_PUBLIC_*` literals, which the bundler
 * replaces at build time: a Worker built without those variables shipped empty
 * strings and every sign-in ended in "not configured on this deployment",
 * even though the server itself was configured.
 *
 * Serving them from the runtime environment makes one build work everywhere.
 * Only public identifiers are returned - Google ships the same object to every
 * visitor - and the web API key is additionally restricted by domain in the
 * Firebase console. No other secret is read here.
 */
export const GET = route("config.firebase.get", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "config:firebase:get", limit: 120, windowSeconds: 60 });

  // A sealed key that cannot be opened (wrong SECRETS_MASTER_KEY) must degrade
  // to "not configured" instead of a 500; /api/health names the broken variable.
  let apiKey = "";
  try {
    apiKey = serverEnv.firebaseApiKey;
  } catch {
    apiKey = "";
  }

  const firebase = {
    apiKey,
    authDomain: serverEnv.firebaseAuthDomain,
    projectId: serverEnv.firebaseProjectId,
    databaseURL: serverEnv.firebaseDatabaseUrl,
    storageBucket: serverEnv.firebaseStorageBucket,
    messagingSenderId: serverEnv.firebaseMessagingId,
    appId: serverEnv.firebaseAppId,
  };

  const configured = Boolean(firebase.apiKey && firebase.authDomain && firebase.projectId);
  // Empty fields are omitted so the client can distinguish "absent" from "empty".
  const present = Object.fromEntries(Object.entries(firebase).filter(([, value]) => value));

  return NextResponse.json(
    { configured, firebase: present },
    {
      status: configured ? 200 : 503,
      headers: {
        // Public, non-secret identifiers: cacheable, but short so a rotated key
        // reaches browsers quickly. A misconfiguration must never be cached.
        "Cache-Control": configured
          ? "public, max-age=300, stale-while-revalidate=600"
          : "no-store",
      },
    }
  );
});
