import type { NextRequest } from "next/server";
import { withDb, UserModel } from "./mongodb";
import { serverEnv } from "./env";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./session";
import { forbidden, unauthorized } from "./http";

export type UserRole = "admin" | "member" | "superadmin";

export interface AuthSession {
  user: {
    id: string;
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    status: "approved" | "pending";
    imageURL?: string;
    email_verified?: boolean;
  };
}

export function isPrivileged(role: UserRole | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return serverEnv.adminEmails.includes(email.trim().toLowerCase());
}

/**
 * Reads and verifies the signed session cookie (or a signed Bearer token).
 * Unsigned client supplied identity headers are intentionally ignored.
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthSession | null> {
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;

  const verification = await verifySessionToken(cookieToken || bearerToken);
  if (!verification.valid) return null;

  return sessionToAuthSession(verification.payload);
}

export function sessionToAuthSession(payload: SessionPayload): AuthSession {
  return {
    user: {
      id: payload.sub || payload.uid,
      uid: payload.uid,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      status: payload.status,
      imageURL: payload.imageURL,
      email_verified: payload.status === "approved",
    },
  };
}

export async function requireUser(req: NextRequest): Promise<AuthSession> {
  const session = await getUserFromRequest(req);
  if (!session) throw unauthorized();
  return session;
}

/**
 * Role and status are embedded in the signed cookie when it is issued, so a
 * demoted admin or a suspended member would otherwise keep access for up to
 * SESSION_TTL (7 days). Privileged and write paths therefore confirm the
 * authoritative values in MongoDB, memoised for 30 seconds so the common case
 * stays a single cached lookup instead of a database round-trip per request.
 *
 * `SESSION_VERSION` remains the global kill switch: bumping it invalidates
 * every outstanding token at once.
 */
type LiveAuthorization =
  | { authoritative: true; exists: boolean; role: UserRole; status: "approved" | "pending" }
  | { authoritative: false };

const liveAuthzCache = new Map<string, { value: LiveAuthorization; expiresAt: number }>();
const LIVE_AUTHZ_TTL_MS = 30_000;
const LIVE_AUTHZ_CACHE_MAX = 1_000;

async function getLiveAuthorization(userId: string): Promise<LiveAuthorization> {
  const cached = liveAuthzCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const doc = (await withDb(() =>
      UserModel.findById(userId, { role: 1, status: 1 }).lean()
    )) as { role?: UserRole; status?: "approved" | "pending" } | null;

    const value: LiveAuthorization = doc
      ? {
          authoritative: true,
          exists: true,
          role: doc.role ?? "member",
          status: doc.status ?? "pending",
        }
      : { authoritative: true, exists: false, role: "member", status: "pending" };

    if (liveAuthzCache.size > LIVE_AUTHZ_CACHE_MAX) liveAuthzCache.clear();
    liveAuthzCache.set(userId, { value, expiresAt: Date.now() + LIVE_AUTHZ_TTL_MS });
    return value;
  } catch (error) {
    // Availability over strictness: the token is still cryptographically valid,
    // so an unreachable database falls back to the previous behaviour. Failures
    // are not cached, so the next request retries the lookup.
    console.warn("[auth] authoritative role check skipped:", (error as Error)?.message);
    return { authoritative: false };
  }
}

export async function requireAdmin(req: NextRequest): Promise<AuthSession> {
  const session = await requireUser(req);
  if (!isPrivileged(session.user.role)) throw forbidden("Administrator privileges required");

  const live = await getLiveAuthorization(session.user.id);
  if (live.authoritative && (!live.exists || !isPrivileged(live.role))) {
    throw forbidden("Administrator privileges required");
  }
  return session;
}

export async function requireSuperAdmin(req: NextRequest): Promise<AuthSession> {
  const session = await requireUser(req);
  if (session.user.role !== "superadmin") {
    throw forbidden("Superadmin privileges required");
  }

  const live = await getLiveAuthorization(session.user.id);
  if (live.authoritative && (!live.exists || live.role !== "superadmin")) {
    throw forbidden("Superadmin privileges required");
  }
  return session;
}

export async function requireApprovedUser(req: NextRequest): Promise<AuthSession> {
  const session = await requireUser(req);
  if (session.user.status !== "approved") {
    throw forbidden("Account pending administrator approval");
  }

  const live = await getLiveAuthorization(session.user.id);
  if (live.authoritative && (!live.exists || live.status !== "approved")) {
    throw forbidden("Account pending administrator approval");
  }
  return session;
}

// --------------------------------------------------------------------------
// Firebase ID token verification (server-side, via Google Identity Toolkit)
// --------------------------------------------------------------------------

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  name: string;
  imageURL?: string;
  emailVerified: boolean;
  provider: string;
}

type IdentityToolkitResponse = {
  users?: Array<{
    localId: string;
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
    photoUrl?: string;
    providerUserInfo?: Array<{ providerId?: string }>;
  }>;
  error?: { message?: string };
};

/**
 * Verifies a Firebase ID token by asking Google to validate it. Google checks
 * the signature, issuer, audience and expiry, so no service account is needed
 * and the client can never forge an identity.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  if (!serverEnv.firebaseApiKey) {
    // Deliberately explicit: this is a deployment misconfiguration, and the
    // variable names are public (`NEXT_PUBLIC_*`), so naming the missing one
    // saves debugging time without disclosing a secret.
    throw unauthorized(
      "Google sign-in is not configured on this deployment: set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID, then rebuild (public variables are baked in at build time)"
    );
  }
  if (!idToken || idToken.length > 8192) {
    throw unauthorized("Missing or malformed identity token");
  }

  let response: Response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        serverEnv.firebaseApiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      }
    );
  } catch {
    throw unauthorized("Could not reach the identity provider, please retry");
  }

  const data = (await response.json().catch(() => ({}))) as IdentityToolkitResponse;

  if (!response.ok) {
    throw unauthorized("Identity token was rejected");
  }

  const account = data.users?.[0];
  if (!account?.localId || !account.email) {
    throw unauthorized("Identity token is missing an email address");
  }
  if (!account.emailVerified) {
    throw unauthorized("Please verify your email address before signing in");
  }

  const provider = account.providerUserInfo?.[0]?.providerId ?? "password";
  if (provider === "google.com" && !account.emailVerified) {
    throw unauthorized("Google account is not verified");
  }

  return {
    uid: account.localId,
    email: account.email.toLowerCase(),
    name: account.displayName || account.email.split("@")[0],
    imageURL: account.photoUrl,
    emailVerified: true,
    provider,
  };
}

// --------------------------------------------------------------------------
// User provisioning
// --------------------------------------------------------------------------

export interface ProvisionResult {
  userId: string;
  role: UserRole;
  status: "approved" | "pending";
  isNewUser: boolean;
  downgraded: boolean;
}

/**
 * Creates or refreshes the user record. Roles are decided exclusively on the
 * server: the ADMIN_EMAILS allow-list grants superadmin, everybody else keeps
 * the role already stored in the database (default: member).
 */
export async function provisionUser(input: {
  uid: string;
  email: string;
  name: string;
  imageURL?: string;
  emailVerified: boolean;
}): Promise<ProvisionResult> {
  const email = input.email.trim().toLowerCase();
  const isAdminEmail = isSuperAdminEmail(email);

  const existing = await withDb(() =>
    UserModel.findOne({ $or: [{ user_id: input.uid }, { email }] }).lean()
  );

  const isNewUser = !existing;

  // Legacy data could contain self-assigned superadmin rows created by the old
  // insecure endpoints. Only allow-listed emails may keep that role.
  const downgraded = Boolean(existing && existing.role === "superadmin" && !isAdminEmail);

  const role: UserRole = isAdminEmail
    ? "superadmin"
    : downgraded
      ? "member"
      : ((existing?.role as UserRole) ?? "member");

  const status: "approved" | "pending" = isAdminEmail
    ? "approved"
    : (existing?.status ?? "pending");

  const displayName = input.name?.trim() || email.split("@")[0];

  const updated = await withDb(() =>
    UserModel.findOneAndUpdate(
      { $or: [{ user_id: input.uid }, { email }] },
      {
        $set: {
          name: displayName,
          email,
          ...(input.imageURL ? { imageURL: input.imageURL } : {}),
          user_id: input.uid,
          email_verified: input.emailVerified,
          auth_time: new Date().toISOString(),
          role,
          status,
        },
        $setOnInsert: { favorites: [] },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()
  );

  return {
    userId: String(updated?._id ?? existing?._id ?? input.uid),
    role,
    status,
    isNewUser,
    downgraded,
  };
}
