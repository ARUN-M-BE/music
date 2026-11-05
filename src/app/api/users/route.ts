import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, UserModel } from "@/lib/mongodb";

export const runtime = "nodejs";

// GET /api/users - Get all users for admin
export async function GET() {
  try {
    await connectToDatabase();
    const users = await UserModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: users, users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch users", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users - Login or Upsert user
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { email, name, imageURL, user_id, email_verified } = body;
    if (!email || !user_id) {
      return NextResponse.json(
        { success: false, message: "Email and user_id are required" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || "arunm102301@gmail.com";
    const isSuperAdmin =
      email.toLowerCase() === adminEmail.toLowerCase() ||
      email.toLowerCase() === "arunm102301@gmail.com" ||
      email.toLowerCase() === "arun102301@gmail.com";

    const updateFields: any = {
      name: name || "User",
      email: email.toLowerCase(),
      imageURL: imageURL || "",
      user_id,
      email_verified: !!email_verified,
      auth_time: new Date().toISOString(),
    };

    if (isSuperAdmin) {
      updateFields.role = "superadmin";
    }

    const user = await UserModel.findOneAndUpdate(
      { $or: [{ user_id }, { email: email.toLowerCase() }] },
      {
        ...updateFields,
        $setOnInsert: { role: isSuperAdmin ? "superadmin" : "member" },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Auth failed", error: error.message },
      { status: 500 }
    );
  }
}

