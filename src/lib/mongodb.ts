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

// Direct replica set URI avoids DNS SRV lookup hangs and socket timeouts in serverless / Cloudflare isolates
const DIRECT_REPLICA_SET_URI =
  "mongodb://arunm:1Gm6yMeD4zOOYguX@cluster0-shard-00-00.lmxpr.mongodb.net:27017,cluster0-shard-00-01.lmxpr.mongodb.net:27017,cluster0-shard-00-02.lmxpr.mongodb.net:27017/test?ssl=true&replicaSet=atlas-11187l-shard-0&authSource=admin&retryWrites=true&w=majority";

function getResolvedMongoUri(): string {
  const envUri = process.env.MONGODB_URI || process.env.DATABASE_STRING;
  if (!envUri) return DIRECT_REPLICA_SET_URI;
  if (envUri.includes("cluster0.lmxpr.mongodb.net")) {
    return DIRECT_REPLICA_SET_URI;
  }
  return envUri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache || (globalThis.mongooseCache = { conn: null, promise: null });

// Attach permanent error and disconnect listeners once to prevent unhandled socket reset events
// from crashing the Cloudflare Worker isolate (Error 1101)
if (typeof mongoose !== "undefined" && mongoose.connection) {
  if (!mongoose.connection.listenerCount("error")) {
    mongoose.connection.on("error", (err) => {
      console.warn("MongoDB connection background warning:", err?.message || err);
      cached.conn = null;
      cached.promise = null;
    });
  }
  if (!mongoose.connection.listenerCount("disconnected")) {
    mongoose.connection.on("disconnected", () => {
      cached.conn = null;
      cached.promise = null;
    });
  }
  if (!mongoose.connection.listenerCount("close")) {
    mongoose.connection.on("close", () => {
      cached.conn = null;
      cached.promise = null;
    });
  }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = getResolvedMongoUri();

  // If already connected, verify vitality with ping so severed/frozen sockets are refreshed
  if (cached.conn && mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db?.command({ ping: 1 });
      return cached.conn;
    } catch {
      console.warn("Cached connection was severed or frozen, reconnecting...");
      try {
        await mongoose.disconnect();
      } catch {}
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      dbName: "test",
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      maxPoolSize: 2,
      minPoolSize: 0,
      maxIdleTimeMS: 5000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        console.error("MongoDB Atlas Connection Error:", err?.message || err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}

/**
 * Execute a database operation with automatic single-retry if the connection
 * was dropped or severed during serverless isolate freeze/thaw.
 */
export async function withDb<T>(operation: () => Promise<T>): Promise<T> {
  try {
    await connectToDatabase();
    return await operation();
  } catch (err: any) {
    console.warn("Database operation encountered error, resetting connection and retrying:", err?.message || err);
    try {
      await mongoose.disconnect();
    } catch {}
    cached.conn = null;
    cached.promise = null;
    await connectToDatabase();
    return await operation();
  }
}

// Aliases for unified consumption across Route Handlers
export const SongModel = Song;
export const AlbumModel = Album;
export const ArtistModel = Artist;
export const UserModel = User;
export const PlaylistModel = Playlist;
