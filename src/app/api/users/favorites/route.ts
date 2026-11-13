import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { withDb, UserModel } from "@/lib/mongodb";
import { requireApprovedUser } from "@/lib/auth";
import { route, jsonOk, badRequest, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { favoritesSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Only well-formed catalog identifiers (local ObjectId or provider id). */
const FAVORITE_ID = /^[A-Za-z0-9_-]{1,64}$/;

function userQuery(session: { user: { id: string; uid: string; email: string } }) {
  const isObjectId = mongoose.Types.ObjectId.isValid(session.user.id);
  return {
    $or: [
      { email: session.user.email.toLowerCase() },
      { user_id: session.user.uid },
      ...(isObjectId ? [{ _id: session.user.id }] : []),
    ],
  };
}

// GET /api/users/favorites - current user's saved tracks
export const GET = route("favorites.get", async (req: NextRequest) => {
  const session = await requireApprovedUser(req);
  await enforceRateLimit(req, {
    scope: "favorites:get",
    identifier: session.user.id,
    limit: 120,
    windowSeconds: 60,
  });

  const user = await withDb(() => UserModel.findOne(userQuery(session)).lean());
  const favorites = Array.isArray(user?.favorites) ? user.favorites : [];

  return jsonOk({ favorites }, { headers: { "Cache-Control": "no-store" } });
});

// POST /api/users/favorites - toggle or replace the favourites list
export const POST = route("favorites.post", async (req: NextRequest) => {
  const session = await requireApprovedUser(req);
  await enforceRateLimit(req, {
    scope: "favorites:post",
    identifier: session.user.id,
    limit: 120,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const parsed = favoritesSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid favourites payload");

  const user = await withDb(() => UserModel.findOne(userQuery(session)).lean());
  if (!user) throw notFound("User not found");

  let updatedFavorites: string[] = Array.isArray(user.favorites) ? [...user.favorites] : [];

  if (Array.isArray(parsed.data.favorites)) {
    updatedFavorites = Array.from(
      new Set(parsed.data.favorites.filter((id) => FAVORITE_ID.test(id)))
    ).slice(0, 500);
  } else if (parsed.data.songId) {
    if (!FAVORITE_ID.test(parsed.data.songId)) throw badRequest("Invalid song id");
    updatedFavorites = updatedFavorites.includes(parsed.data.songId)
      ? updatedFavorites.filter((id) => id !== parsed.data.songId)
      : [...updatedFavorites, parsed.data.songId].slice(-500);
  }

  const updatedUser = await withDb(() =>
    UserModel.findOneAndUpdate(
      userQuery(session),
      { $set: { favorites: updatedFavorites } },
      { new: true }
    ).lean()
  );

  return jsonOk({
    message: "Favorites updated",
    favorites: updatedUser?.favorites ?? updatedFavorites,
  });
});
