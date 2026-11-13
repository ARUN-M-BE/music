import { z } from "zod";
import { badRequest } from "./http";

/** Mongo ObjectId (24 hex chars). Also accepts 24-char hex strings only. */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{24}$/i, "Invalid identifier");

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const httpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url("Must be a valid URL")
  .refine((value) => value.startsWith("https://"), "Only HTTPS URLs are allowed");

export const nameSchema = z.string().trim().min(1, "Required").max(200);
export const shortTextSchema = z.string().trim().max(500);
export const mediumTextSchema = z.string().trim().max(2000);

export function assertObjectId(value: string, label = "id"): string {
  const parsed = objectIdSchema.safeParse(value);
  if (!parsed.success) throw badRequest(`Invalid ${label}`);
  return parsed.data;
}

// ----------------------------------------------------------------- songs
export const createSongSchema = z
  .object({
    name: nameSchema,
    imageURL: httpsUrlSchema,
    songURL: httpsUrlSchema,
    album: z.string().trim().max(200).default("Single"),
    artist: nameSchema,
    language: z.string().trim().max(60).default("English"),
    category: z.string().trim().max(60).default("Pop"),
    fileId: z.string().trim().max(200).default(""),
    songId: z.string().trim().max(200).default(""),
  })
  .strict();

/** Whitelisted fields only: prevents mass assignment of playsCount/_id/role. */
export const updateSongSchema = z
  .object({
    name: nameSchema.optional(),
    imageURL: httpsUrlSchema.optional(),
    songURL: httpsUrlSchema.optional(),
    album: z.string().trim().max(200).optional(),
    artist: nameSchema.optional(),
    language: z.string().trim().max(60).optional(),
    category: z.string().trim().max(60).optional(),
    fileId: z.string().trim().max(200).optional(),
    songId: z.string().trim().max(200).optional(),
  })
  .strict();

// ----------------------------------------------------------------- albums
export const createAlbumSchema = z
  .object({
    name: nameSchema,
    imageURL: httpsUrlSchema,
    fileId: z.string().trim().max(200).default(""),
  })
  .strict();

export const updateAlbumSchema = z
  .object({
    name: nameSchema.optional(),
    imageURL: httpsUrlSchema.optional(),
    fileId: z.string().trim().max(200).optional(),
  })
  .strict();

// ----------------------------------------------------------------- artists
export const createArtistSchema = z
  .object({
    name: nameSchema,
    imageURL: httpsUrlSchema,
    twetter: z.string().trim().max(300).default(""),
    instagram: z.string().trim().max(300).default(""),
    fileId: z.string().trim().max(200).default(""),
  })
  .strict();

export const updateArtistSchema = z
  .object({
    name: nameSchema.optional(),
    imageURL: httpsUrlSchema.optional(),
    twetter: z.string().trim().max(300).optional(),
    instagram: z.string().trim().max(300).optional(),
    fileId: z.string().trim().max(200).optional(),
  })
  .strict();

// ----------------------------------------------------------------- users
export const updateRoleSchema = z
  .object({
    role: z.enum(["admin", "member", "superadmin"]),
  })
  .strict();

export const updateStatusSchema = z
  .object({
    status: z.enum(["approved", "pending"]),
  })
  .strict();

export const favoritesSchema = z
  .object({
    songId: z.string().trim().max(64).optional(),
    favorites: z.array(z.string().trim().max(64)).max(500).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.songId) || Array.isArray(value.favorites), {
    message: "Either songId or favorites is required",
  });

// ----------------------------------------------------------------- playlists
export const createPlaylistSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    coverImage: httpsUrlSchema.optional(),
    songs: z.array(z.record(z.string(), z.unknown())).max(1000).optional(),
  })
  .strict();

export const updatePlaylistSchema = z
  .object({
    id: objectIdSchema,
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    coverImage: httpsUrlSchema.optional(),
    songs: z.array(z.record(z.string(), z.unknown())).max(1000).optional(),
  })
  .strict();

// ----------------------------------------------------------------- auth
export const firebaseSessionSchema = z
  .object({
    idToken: z.string().min(100).max(8192),
  })
  .strict();

export const typingQuerySchema = z.object({
  language: z.string().trim().max(32).optional(),
  mode: z.string().trim().max(16).optional(),
  mode2: z.string().trim().max(24).optional(),
});
