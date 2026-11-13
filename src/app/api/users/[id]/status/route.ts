import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { withDb, UserModel } from "@/lib/mongodb";
import { isSuperAdminEmail, requireSuperAdmin } from "@/lib/auth";
import { route, jsonOk, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateStatusSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// PUT /api/users/[id]/status - superadmin only (account approval)
export const PUT = route("users.status", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "users:status",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { status } = updateStatusSchema.parse(body);

  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { user_id: id }] }
    : { user_id: id };

  const updated = await withDb(() =>
    UserModel.findOneAndUpdate(
      query,
      {
        $set: {
          status,
          email_verified: status === "approved",
        },
      },
      { new: true }
    ).lean()
  );

  if (!updated) throw notFound("User not found");
  if (isSuperAdminEmail(updated.email)) {
    // Owner accounts are always approved; nothing to change.
    return jsonOk({ message: "Owner account status is managed by ADMIN_EMAILS", user: updated });
  }

  runAfter(() =>
    logSecurityEvent({
      type: "users.status_change",
      actorEmail: session.user.email,
      request: req,
      meta: { targetEmail: updated.email, status },
    })
  );

  return jsonOk({ message: `Status updated to ${status}`, user: updated });
});
