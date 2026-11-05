import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase, UserModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

const SUPERADMIN_EMAILS = [
  "arunm102301@gmail.com",
  "arun102301@gmail.com",
  (process.env.ADMIN_EMAIL || "arunm102301@gmail.com").toLowerCase(),
];

// DELETE /api/users/[id] - Only Superadmin can delete users from database
export async function DELETE(
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
        { success: false, message: "Superadmin access required to delete users" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    // Check if id is valid ObjectId or user_id string
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { user_id: id }] }
      : { user_id: id };

    const userToDelete = await UserModel.findOne(query);
    if (!userToDelete) {
      return NextResponse.json({ success: false, message: "User not found in database" }, { status: 404 });
    }

    // Protect primary Superadmin account
    if (
      SUPERADMIN_EMAILS.includes(userToDelete.email.toLowerCase()) ||
      userToDelete.role === "superadmin"
    ) {
      return NextResponse.json(
        { success: false, message: "Cannot delete the Superadmin account" },
        { status: 400 }
      );
    }

    await UserModel.deleteOne({ _id: userToDelete._id });

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.name || userToDelete.email} permanently deleted from database`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "User deletion failed", error: error.message },
      { status: 500 }
    );
  }
}
