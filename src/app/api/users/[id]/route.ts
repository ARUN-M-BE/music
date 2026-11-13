import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { withDb, UserModel } from "@/lib/mongodb";
import { isSuperAdminEmail, requireSuperAdmin } from "@/lib/auth";
import { route, jsonOk, badRequest, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/users/[id] - superadmin only
export const DELETE = route("users.delete", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "users:delete",
    identifier: session.user.id,
    limit: 20,
    windowSeconds: 60,
  });

  const { id } = await params;

  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { user_id: id }] }
    : { user_id: id };

  const userToDelete = await withDb(() => UserModel.findOne(query).lean());
  if (!userToDelete) throw notFound("User not found in database");

  const targetEmail = String(userToDelete.email ?? "").toLowerCase();

  if (isSuperAdminEmail(targetEmail) || userToDelete.role === "superadmin") {
    throw badRequest("Cannot delete a superadmin account");
  }
  if (targetEmail === session.user.email.toLowerCase()) {
    throw badRequest("You cannot delete your own account");
  }

  await withDb(() => UserModel.deleteOne({ _id: userToDelete._id }));

  runAfter(() =>
    logSecurityEvent({
      type: "users.delete",
      severity: "warning",
      actorEmail: session.user.email,
      request: req,
      meta: { targetEmail },
    })
  );

  return jsonOk({
    message: `User ${userToDelete.name || targetEmail} permanently deleted from database`,
  });
});
