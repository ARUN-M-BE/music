import { NextRequest } from "next/server";
import { withDb, UserModel } from "@/lib/mongodb";
import { serverEnv } from "@/lib/env";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { SESSION_COOKIE_NAME } from "@/lib/env";
import { jsonOk, route, forbidden } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GUEST = {
  uid: "demo_guest_listener",
  email: "guest@demo.invalid",
  name: "Demo Listener",
  imageURL:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
};

/**
 * POST /api/auth/guest
 * Issues a read-only, non-privileged demo session. No user supplied data is
 * accepted, so this cannot be used to impersonate or escalate.
 */
export const POST = route("auth.guest.post", async (req: NextRequest) => {
  if (!serverEnv.allowGuestSessions) {
    throw forbidden("Guest access is disabled on this deployment");
  }

  await enforceRateLimit(req, { scope: "auth:guest", limit: 5, windowSeconds: 600 });

  const user = await withDb(() =>
    UserModel.findOneAndUpdate(
      { user_id: GUEST.uid },
      {
        $set: {
          name: GUEST.name,
          email: GUEST.email,
          imageURL: GUEST.imageURL,
          email_verified: true,
          role: "member",
          status: "approved",
          auth_time: new Date().toISOString(),
        },
        $setOnInsert: { favorites: [] },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()
  );

  const token = await createSessionToken({
    sub: String(user?._id ?? GUEST.uid),
    uid: GUEST.uid,
    email: GUEST.email,
    name: GUEST.name,
    role: "member",
    status: "approved",
    imageURL: GUEST.imageURL,
  });

  const response = jsonOk({
    user: {
      _id: String(user?._id ?? GUEST.uid),
      name: GUEST.name,
      email: GUEST.email,
      imageURL: GUEST.imageURL,
      user_id: GUEST.uid,
      email_verified: true,
      role: "member",
      status: "approved",
      favorites: [],
    },
    isAdmin: false,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  response.headers.set("Cache-Control", "no-store");

  runAfter(async () => {
    await logSecurityEvent({
      type: "auth.guest_login",
      actorEmail: GUEST.email,
      request: req,
    });
  });

  return response;
});
