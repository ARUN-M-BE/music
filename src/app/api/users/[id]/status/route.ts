import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb, UserModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPERADMIN_EMAILS = [
  "arunm102301@gmail.com",
  "arun102301@gmail.com",
  (process.env.ADMIN_EMAIL || "arunm102301@gmail.com").toLowerCase(),
];

// PUT /api/users/[id]/status - Change status to approved or pending (Superadmin only)
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
        { success: false, message: "Superadmin access required to change user status" },
        { status: 403 }
      );
    }

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
      const statusIdx = parts.indexOf("status");
      if (statusIdx > 0) targetId = parts[statusIdx - 1];
    }

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: "Target user ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const status = body.status;

    if (!status || (status !== "approved" && status !== "pending")) {
      return NextResponse.json(
        { success: false, message: "Invalid status: must be 'approved' or 'pending'" },
        { status: 400 }
      );
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
    const query = isObjectId
      ? { $or: [{ _id: targetId }, { user_id: targetId }] }
      : { user_id: targetId };

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

    if (!updated) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Status updated to ${status}`,
      user: updated,
    });
  } catch (error: any) {
    console.error("User status update error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Status update failed" },
      { status: 400 }
    );
  }
}
