import { NextRequest, NextResponse } from "next/server";
import { deleteFromImageKit } from "@/lib/imagekit";

export const runtime = "nodejs";

// DELETE /api/media/delete/[fileId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const success = await deleteFromImageKit(fileId);

    return NextResponse.json({
      success,
      message: success ? "File deleted successfully" : "Failed to delete file",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}

