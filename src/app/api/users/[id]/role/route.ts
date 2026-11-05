import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, UserModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

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
    const isSuper =
      session?.user?.role === "superadmin" ||
      (xEmail && SUPERADMIN_EMAILS.includes(xEmail)) ||
      (session?.user?.email && SUPERADMIN_EMAILS.includes(session.user.email.toLowerCase()));

    if (!isSuper) {
      return NextResponse.json(
        { success: false, message: "Superadmin access required to change user roles" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const role = body.role || body.data?.role;

    if (!role || (role !== "admin" && role !== "member" && role !== "superadmin")) {
      return NextResponse.json({ success: false, message: "Invalid role: must be admin or member" }, { status: 400 });
    }

    // Try finding by _id or user_id
    let existingUser = await UserModel.findById(id);
    if (!existingUser) {
      existingUser = await UserModel.findOne({ user_id: id });
    }

    if (!existingUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Protect superadmin account from role change
    if (SUPERADMIN_EMAILS.includes(existingUser.email.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: "Cannot modify primary Superadmin role" },
        { status: 400 }
      );
    }

    existingUser.role = role;
    await existingUser.save();

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role.toUpperCase()}`,
      user: existingUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Role update failed", error: error.message },
      { status: 500 }
    );
  }
}
