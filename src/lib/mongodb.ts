import mongoose, { Schema, model, models, Model } from "mongoose";

export interface ISong {
  _id: string;
  name: string;
  imageURL: string;
  songURL: string;
  album: string;
  artist: string;
  language: string;
  category: string;
  fileId: string;
  songId: string;
  playsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAlbum {
  _id: string;
  name: string;
  imageURL: string;
  fileId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IArtist {
  _id: string;
  name: string;
  imageURL: string;
  twetter?: string;
  instagram: string;
  fileId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  imageURL?: string;
  user_id: string;
  email_verified: boolean;
  status?: "approved" | "pending";
  role: "admin" | "member" | "superadmin";
  auth_time: string;
  favorites?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ================= MONGOOSE SCHEMAS =================
const songSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    imageURL: { type: String, required: true },
    songURL: { type: String, required: true },
    album: { type: String, default: "Single" },
    artist: { type: String, required: true },
    language: { type: String, default: "English" },
    category: { type: String, required: true },
    fileId: { type: String, default: "" },
    songId: { type: String, default: "" },
    playsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// High Performance Query Indexes
songSchema.index({ createdAt: -1 });
songSchema.index({ playsCount: -1 });
songSchema.index({ category: 1 });
songSchema.index({ artist: 1 });
songSchema.index({ album: 1 });
songSchema.index({ name: 1 });

const albumSchema = new Schema(
  {
    name: { type: String, required: true },
    imageURL: { type: String, required: true },
    fileId: { type: String, default: "" },
  },
  { timestamps: true }
);
albumSchema.index({ createdAt: -1 });
albumSchema.index({ name: 1 });

const artistSchema = new Schema(
  {
    name: { type: String, required: true },
    imageURL: { type: String, required: true },
    twetter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    fileId: { type: String, default: "" },
  },
  { timestamps: true }
);
artistSchema.index({ createdAt: -1 });
artistSchema.index({ name: 1 });

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageURL: { type: String, default: "" },
    user_id: { type: String, required: true },
    email_verified: { type: Boolean, default: false },
    status: { type: String, enum: ["approved", "pending"], default: "approved" },
    role: { type: String, default: "member" },
    auth_time: { type: String, default: "" },
    favorites: { type: [String], default: [] },
  },
  { timestamps: true }
);
userSchema.index({ user_id: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export interface IPlaylist extends Document {
  name: string;
  description?: string;
  coverImage?: string;
  userId: string;
  songs: any[];
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    userId: { type: String, required: true, index: true },
    songs: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

playlistSchema.index({ userId: 1, createdAt: -1 });

export const Song: Model<ISong> = models.song || model<ISong>("song", songSchema);
export const Album: Model<IAlbum> = models.album || model<IAlbum>("album", albumSchema);
export const Artist: Model<IArtist> = models.artist || model<IArtist>("artist", artistSchema);
export const User: Model<IUser> = models.user || model<IUser>("user", userSchema);
export const Playlist: Model<IPlaylist> = models.playlist || model<IPlaylist>("playlist", playlistSchema);

// Connection Caching for Serverless
const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_STRING ||
  "mongodb+srv://arunm:1Gm6yMeD4zOOYguX@cluster0.lmxpr.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache || (globalThis.mongooseCache = { conn: null, promise: null });

export async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "test", // Targets the 'test' database where the catalog is stored
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 0,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("❌ MongoDB Atlas Connection Error:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

// Aliases for unified consumption across Route Handlers
export const SongModel = Song;
export const AlbumModel = Album;
export const ArtistModel = Artist;
export const UserModel = User;
export const PlaylistModel = Playlist;
