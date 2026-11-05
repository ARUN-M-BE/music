import { NextResponse } from "next/server";
import { getImageKitAuth } from "@/lib/imagekit";

export const runtime = "nodejs";

// GET /api/auth/imagekit
export async function GET() {
  try {
    const authParams = getImageKitAuth();
    return NextResponse.json(authParams);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "ImageKit auth failed", error: err.message },
      { status: 500 }
    );
  }
}

