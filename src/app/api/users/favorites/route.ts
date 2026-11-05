import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase, UserModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/users/favorites - Get current user's saved favorites
export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session || !session.user || !session.user.email) {
      // Unauthenticated or guest: return empty list gracefully (status 200)
      return NextResponse.json({ success: true, favorites: [] });
    }

    await connectToDatabase();
    const isObjectId = mongoose.Types.ObjectId.isValid(session.user.id);
    const user = await UserModel.findOne({
      $or: [
        { email: session.user.email.toLowerCase() },
        { user_id: session.user.id },
        ...(isObjectId ? [{ _id: session.user.id }] : []),
      ],
    }).lean();

    const favorites = Array.isArray((user as any)?.favorites) ? (user as any).favorites : [];

    return NextResponse.json({
      success: true,
      favorites,
    });
  } catch (error: any) {
    console.error("GET /api/users/favorites error:", error);
    return NextResponse.json(
      { success: true, favorites: [], message: error.message || "Failed to load favorites" },
      { status: 200 }
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

    const isObjectId = mongoose.Types.ObjectId.isValid(session.user.id);
    const user = await UserModel.findOne({
      $or: [
        { email: session.user.email.toLowerCase() },
        { user_id: session.user.id },
        ...(isObjectId ? [{ _id: session.user.id }] : []),
      ],
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
