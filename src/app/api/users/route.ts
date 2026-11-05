import { NextRequest, NextResponse } from "next/server";
import { withDb, UserModel } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/users - Get all users for admin
export async function GET(req: NextRequest) {
  try {
    const users = await withDb(() =>
      UserModel.find({}).sort({ createdAt: -1 }).lean()
    );

    const superAdminEmails = [
      "arunm102301@gmail.com",
      "arun102301@gmail.com",
      (process.env.ADMIN_EMAIL || "arunm102301@gmail.com").toLowerCase(),
    ];

    const mapped = users.map((u: any) => ({
      ...u,
      role: superAdminEmails.includes(u.email?.toLowerCase())
        ? "superadmin"
        : u.role || "member",
      status: u.status || (superAdminEmails.includes(u.email?.toLowerCase()) ? "approved" : "pending"),
    }));

    return NextResponse.json({ success: true, data: mapped, users: mapped });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { success: false, data: [], users: [], message: "Failed to fetch users" },
      { status: 200 }
    );
  }
}

// POST /api/users - Login or Upsert user
export async function POST(req: NextRequest) {
  try {
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
      updateFields.status = "approved";
    }

    const user = await withDb(() =>
      UserModel.findOneAndUpdate(
        { $or: [{ user_id }, { email: email.toLowerCase() }] },
        {
          ...updateFields,
          $setOnInsert: {
            role: isSuperAdmin ? "superadmin" : "member",
            status: isSuperAdmin ? "approved" : "pending",
          },
        },
        { upsert: true, new: true }
      ).lean()
    );

    const finalRole = isSuperAdmin ? "superadmin" : (user?.role || "member");
    const finalStatus = isSuperAdmin ? "approved" : (user?.status || "pending");

    return NextResponse.json({
      success: true,
      user: { ...user, role: finalRole, status: finalStatus },
    });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { success: false, message: "Auth failed", error: error.message },
      { status: 400 }
    );
  }
}

