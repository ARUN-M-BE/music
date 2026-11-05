import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, UserModel } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// DELETE /api/users/[id] - Only Superadmin can delete users
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    if (session.user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "Superadmin privileges required to delete users" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    const userToDelete = await UserModel.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Protect primary Superadmin
    if (
      userToDelete.email.toLowerCase() === "arunm102301@gmail.com" ||
      userToDelete.role === "superadmin"
    ) {
      return NextResponse.json(
        { success: false, message: "Cannot delete the Superadmin account" },
        { status: 400 }
      );
    }

    await UserModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "User deletion failed", error: error.message },
      { status: 500 }
    );
  }
}
