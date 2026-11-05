import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase, UserModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPERADMIN_EMAILS = [
  "arunm102301@gmail.com",
  "arun102301@gmail.com",
  (process.env.ADMIN_EMAIL || "arunm102301@gmail.com").toLowerCase(),
];

// PUT /api/users/[id]/role - Promote / Demote user role (Superadmin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserFromRequest(req);
    const xEmail = req.headers.get("x-user-email")?.trim().toLowerCase();
    const bearer = req.headers.get("authorization")?.replace("Bearer ", "").trim().toLowerCase();

    const isSuper =
      session?.user?.role === "superadmin" ||
      (xEmail && SUPERADMIN_EMAILS.includes(xEmail)) ||
      (bearer && SUPERADMIN_EMAILS.includes(bearer)) ||
      (session?.user?.email && SUPERADMIN_EMAILS.includes(session.user.email.toLowerCase()));

    if (!isSuper) {
      return NextResponse.json(
        { success: false, message: "Superadmin access required to change user roles" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Safely extract target user ID
    let targetId = "";
    if (params) {
      try {
        const resolved = await params;
        targetId = resolved?.id || "";
      } catch {}
    }
    if (!targetId) {
      const parts = req.nextUrl.pathname.split("/");
      const roleIdx = parts.indexOf("role");
      if (roleIdx > 0) targetId = parts[roleIdx - 1];
    }

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: "Target user ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const role = body.role || body.data?.role;

    if (!role || (role !== "admin" && role !== "member" && role !== "superadmin")) {
      return NextResponse.json(
        { success: false, message: "Invalid role: must be admin or member" },
        { status: 400 }
      );
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
    const query = isObjectId
      ? { $or: [{ _id: targetId }, { user_id: targetId }] }
      : { user_id: targetId };

    const existingUser = await UserModel.findOne(query).lean();
    if (!existingUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Protect superadmin account from role change
    if (SUPERADMIN_EMAILS.includes((existingUser as any).email?.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: "Cannot modify primary Superadmin role" },
        { status: 400 }
      );
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      query,
      { $set: { role } },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role.toUpperCase()}`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("User role update error:", error);
    return NextResponse.json(
      { success: false, message: "Role update failed", error: error.message },
      { status: 500 }
    );
  }
}
