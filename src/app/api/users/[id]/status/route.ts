import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, UserModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

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
    const isSuper =
      session?.user?.role === "superadmin" ||
      (xEmail && SUPERADMIN_EMAILS.includes(xEmail)) ||
      (session?.user?.email && SUPERADMIN_EMAILS.includes(session.user.email.toLowerCase()));

    if (!isSuper) {
      return NextResponse.json(
        { success: false, message: "Superadmin access required to change user status" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const status = body.status;

    if (!status || (status !== "approved" && status !== "pending")) {
      return NextResponse.json({ success: false, message: "Invalid status: must be 'approved' or 'pending'" }, { status: 400 });
    }

    // Try finding by _id or user_id
    let updated = await UserModel.findByIdAndUpdate(
      id,
      {
        status,
        email_verified: status === "approved",
      },
      { new: true }
    ).lean();

    if (!updated) {
      updated = await UserModel.findOneAndUpdate(
        { user_id: id },
        {
          status,
          email_verified: status === "approved",
        },
        { new: true }
      ).lean();
    }

    if (!updated) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Status updated to ${status}`, user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Status update failed", error: error.message },
      { status: 500 }
    );
  }
}
