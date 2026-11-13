import { NextRequest, NextResponse } from "next/server";
import { withDb, UserModel } from "@/lib/mongodb";
import { createSessionToken, sessionCookieOptions, clearedSessionCookieOptions } from "@/lib/session";
import { SESSION_COOKIE_NAME } from "@/lib/env";
import {
  isPrivileged,
  isSuperAdminEmail,
  provisionUser,
  requireUser,
  verifyFirebaseIdToken,
} from "@/lib/auth";
import { firebaseSessionSchema } from "@/lib/validation";
import { route, jsonOk, unauthorized } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";
import {
  addAudienceContact,
  notifyAdminOfPendingUser,
  sendWelcomeEmail,
} from "@/lib/integrations/resend";
import { notifyAdminOnWhatsApp } from "@/lib/integrations/evolution";
import { trackEvent } from "@/lib/integrations/tinybird";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/auth/session
 * Returns the current user. The role/status are re-read from the database so
 * approvals and demotions take effect without a new sign-in.
 */
export const GET = route("auth.session.get", async (req: NextRequest) => {
  const session = await requireUser(req);

  const refreshed = await withDb(() =>
    UserModel.findOne({
      $or: [
        { user_id: session.user.uid },
        { email: session.user.email },
      ],
    }).lean()
  );

  if (!refreshed) {
    // The account was deleted: the token is no longer meaningful.
    const response = NextResponse.json({ success: false, code: "account_removed" }, { status: 401 });
    response.cookies.set(SESSION_COOKIE_NAME, "", clearedSessionCookieOptions);
    return response;
  }

  const email = String(refreshed.email).toLowerCase();
  const isAdminEmail = isSuperAdminEmail(email);
  const role = isAdminEmail
    ? "superadmin"
    : refreshed.role === "superadmin"
      ? "member"
      : (refreshed.role ?? "member");
  const status = isAdminEmail ? "approved" : (refreshed.status ?? "pending");

  const token = await createSessionToken({
    sub: String(refreshed._id),
    uid: refreshed.user_id,
    email,
    name: refreshed.name,
    role,
    status,
    imageURL: refreshed.imageURL,
  });

  const response = jsonOk({
    user: {
      _id: String(refreshed._id),
      name: refreshed.name,
      email,
      imageURL: refreshed.imageURL ?? "",
      user_id: refreshed.user_id,
      email_verified: refreshed.email_verified ?? status === "approved",
      role,
      status,
      favorites: refreshed.favorites ?? [],
    },
    isAdmin: isPrivileged(role),
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  response.headers.set("Cache-Control", "no-store");
  return response;
});

/**
 * POST /api/auth/session
 * Exchanges a Firebase ID token (verified server side with Google) for an
 * HttpOnly session cookie. The client can never choose its own role.
 */
export const POST = route("auth.session.post", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "auth:session", limit: 10, windowSeconds: 60 });

  const body = await req.json().catch(() => null);
  const parsed = firebaseSessionSchema.safeParse(body);
  if (!parsed.success) throw unauthorized("A valid identity token is required");

  const firebaseUser = await verifyFirebaseIdToken(parsed.data.idToken);
  const provisioned = await provisionUser({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.name,
    imageURL: firebaseUser.imageURL,
    emailVerified: firebaseUser.emailVerified,
  });

  const token = await createSessionToken({
    sub: provisioned.userId,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.name,
    role: provisioned.role,
    status: provisioned.status,
    imageURL: firebaseUser.imageURL,
  });

  const response = jsonOk({
    user: {
      _id: provisioned.userId,
      name: firebaseUser.name,
      email: firebaseUser.email,
      imageURL: firebaseUser.imageURL ?? "",
      user_id: firebaseUser.uid,
      email_verified: true,
      role: provisioned.role,
      status: provisioned.status,
      favorites: [],
    },
    isAdmin: isPrivileged(provisioned.role),
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  response.headers.set("Cache-Control", "no-store");

  runAfter(async () => {
    await logSecurityEvent({
      type: provisioned.isNewUser ? "auth.signup" : "auth.login",
      severity: provisioned.downgraded ? "critical" : "info",
      actorEmail: firebaseUser.email,
      request: req,
      meta: { role: provisioned.role, status: provisioned.status, method: "firebase" },
    });

    await trackEvent({
      name: "auth_login",
      actorId: provisioned.userId,
      meta: { method: "firebase", new_user: provisioned.isNewUser },
    });

    if (provisioned.isNewUser) {
      await Promise.allSettled([
        sendWelcomeEmail({ to: firebaseUser.email, name: firebaseUser.name }),
        addAudienceContact({ email: firebaseUser.email, firstName: firebaseUser.name }),
      ]);
    }

    if (provisioned.status === "pending") {
      await Promise.allSettled([
        notifyAdminOfPendingUser({ email: firebaseUser.email, name: firebaseUser.name }),
        notifyAdminOnWhatsApp(
          `Good Music: new account pending approval - ${firebaseUser.email}`
        ),
      ]);
    }
  });

  return response;
});

/** DELETE /api/auth/session - sign out (clears the HttpOnly cookie). */
export const DELETE = route("auth.session.delete", async (req: NextRequest) => {
  const session = await requireUser(req).catch(() => null);
  const response = jsonOk({ message: "Signed out" });
  response.cookies.set(SESSION_COOKIE_NAME, "", clearedSessionCookieOptions);
  response.headers.set("Cache-Control", "no-store");

  runAfter(async () => {
    await logSecurityEvent({
      type: "auth.logout",
      actorEmail: session?.user.email,
      request: req,
    });
  });

  return response;
});
