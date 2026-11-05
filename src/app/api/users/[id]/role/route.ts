import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, UserModel } from "@/lib/mongodb";

export const runtime = "nodejs";

// PUT /api/users/[id]/role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const role = body.role || body.data?.role;

    if (!role || (role !== "admin" && role !== "member")) {
      return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 });
    }

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Role update failed", error: error.message },
      { status: 500 }
    );
  }
}

