import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, UserModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/users/favorites - Get current user's saved favorites
export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await UserModel.findOne({
      $or: [{ email: session.user.email.toLowerCase() }, { user_id: session.user.id }],
    }).lean();

    return NextResponse.json({
      success: true,
      favorites: (user as any)?.favorites || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to load favorites", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users/favorites - Toggle or sync user favorites
export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { songId, favorites: newFavoritesList } = body;

    const user = await UserModel.findOne({
      $or: [{ email: session.user.email.toLowerCase() }, { user_id: session.user.id }],
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    let updatedFavorites: string[] = (user as any).favorites || [];

    if (Array.isArray(newFavoritesList)) {
      // Direct sync of list
      updatedFavorites = Array.from(new Set(newFavoritesList));
    } else if (songId) {
      // Toggle single track
      if (updatedFavorites.includes(songId)) {
        updatedFavorites = updatedFavorites.filter((id) => id !== songId);
      } else {
        updatedFavorites.push(songId);
      }
    }

    user.set("favorites", updatedFavorites);
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Favorites updated",
      favorites: updatedFavorites,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to update favorites", error: error.message },
      { status: 500 }
    );
  }
}

