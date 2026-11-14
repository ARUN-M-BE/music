import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { withDb, UserModel } from "@/lib/mongodb";
import { isSuperAdminEmail, requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { route, jsonOk, badRequest, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateRoleSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// GET /api/users/[id]/role - admin check
export const GET = route("users.role.get", async (req: NextRequest, { params }: Params) => {
  const session = await requireAdmin(req);
  const { id } = await params;
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { user_id: id }] }
    : { user_id: id };

  const existingUser = await withDb(() => UserModel.findOne(query, { role: 1, email: 1, status: 1 }).lean());
  if (!existingUser) throw notFound("User not found");

  return jsonOk({ role: existingUser.role, email: existingUser.email, status: existingUser.status });
});

// PUT /api/users/[id]/role - superadmin only
export const PUT = route("users.role", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "users:role",
    identifier: session.user.id,
    limit: 30,
    windowSeconds: 60,
  });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { role } = updateRoleSchema.parse(body);

  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { user_id: id }] }
    : { user_id: id };

  const existingUser = await withDb(() => UserModel.findOne(query).lean());
  if (!existingUser) throw notFound("User not found");

  const targetEmail = String(existingUser.email ?? "").toLowerCase();
  if (isSuperAdminEmail(targetEmail)) {
    throw badRequest("Cannot modify the owner account role");
  }
  if (role === "superadmin") {
    throw badRequest("Superadmin is derived from ADMIN_EMAILS and cannot be granted here");
  }

  const updatedUser = await withDb(() =>
    UserModel.findOneAndUpdate(query, { $set: { role } }, { new: true }).lean()
  );

  runAfter(() =>
    logSecurityEvent({
      type: "users.role_change",
      severity: role === "admin" ? "warning" : "info",
      actorEmail: session.user.email,
      request: req,
      meta: { targetEmail, role },
    })
  );

  return jsonOk({ message: `User role updated to ${role.toUpperCase()}`, user: updatedUser });
});
