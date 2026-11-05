import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withDb, UserModel } from "@/lib/mongodb";
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

    const isObjectId = mongoose.Types.ObjectId.isValid(session.user.id);
    const query = {
      $or: [
        { email: session.user.email.toLowerCase() },
        { user_id: session.user.id },
        ...(isObjectId ? [{ _id: session.user.id }] : []),
      ],
    };

    const user = await withDb(() => UserModel.findOne(query).lean());
    const favorites = Array.isArray((user as any)?.favorites) ? (user as any).favorites : [];

    return NextResponse.json({
      success: true,
      favorites,
    });
  } catch (error: any) {
    console.error("GET /api/users/favorites error:", error);
    return NextResponse.json(
      { success: true, favorites: [], message: "Failed to load favorites" },
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

    const body = await req.json();
    const { songId, favorites: newFavoritesList } = body;

    const isObjectId = mongoose.Types.ObjectId.isValid(session.user.id);
    const query = {
      $or: [
        { email: session.user.email.toLowerCase() },
        { user_id: session.user.id },
        ...(isObjectId ? [{ _id: session.user.id }] : []),
      ],
    };

    const user = await withDb(() => UserModel.findOne(query).lean());
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    let updatedFavorites: string[] = (user as any).favorites || [];

    if (Array.isArray(newFavoritesList)) {
      updatedFavorites = Array.from(new Set(newFavoritesList));
    } else if (songId) {
      if (updatedFavorites.includes(songId)) {
        updatedFavorites = updatedFavorites.filter((id) => id !== songId);
      } else {
        updatedFavorites.push(songId);
      }
    }

    const updatedUser = await withDb(() =>
      UserModel.findOneAndUpdate(
        query,
        { $set: { favorites: updatedFavorites } },
        { new: true }
      ).lean()
    );

    return NextResponse.json({
      success: true,
      message: "Favorites updated",
      favorites: (updatedUser as any)?.favorites || updatedFavorites,
    });
  } catch (error: any) {
    console.error("POST /api/users/favorites error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update favorites", error: error.message },
      { status: 400 }
    );
  }
}
