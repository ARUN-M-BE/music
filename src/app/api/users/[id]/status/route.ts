import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, UserModel } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// PUT /api/users/[id]/status - Change status to approved or pending (Superadmin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    if (session.user.role !== "superadmin") {
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
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const updated = await UserModel.findByIdAndUpdate(
      id,
      {
        status,
        email_verified: status === "approved",
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Status update failed", error: error.message },
      { status: 500 }
    );
  }
}
