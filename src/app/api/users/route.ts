import { NextRequest, NextResponse } from "next/server";
import { withDb, UserModel } from "@/lib/mongodb";
import { isSuperAdminEmail, requireAdmin } from "@/lib/auth";
import { route, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/users - admin only. Never exposes password hashes (none exist) and
// is the only endpoint that can list account metadata.
export const GET = route("users.get", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "users:list",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const users = await withDb(() =>
    UserModel.find({})
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
  );

  const mapped = users.map((user: Record<string, unknown>) => {
    const email = String(user.email ?? "").toLowerCase();
    const isAdminEmail = isSuperAdminEmail(email);
    return {
      ...user,
      role: isAdminEmail ? "superadmin" : user.role === "superadmin" ? "member" : user.role || "member",
      status: isAdminEmail ? "approved" : user.status || "pending",
    };
  });

  return NextResponse.json(
    { success: true, data: mapped, users: mapped },
    { headers: { "Cache-Control": "no-store" } }
  );
});

/**
 * POST /api/users used to be an unauthenticated "login/upsert" endpoint that let
 * anyone claim any email address (including the owner account). Identity is now
 * established exclusively through POST /api/auth/session.
 */
export const POST = route("users.post", async () =>
  jsonOk(
    {
      message:
        "This endpoint no longer accepts identity data. Authenticate via POST /api/auth/session.",
    },
    { status: 405, headers: { Allow: "GET" } }
  )
);
