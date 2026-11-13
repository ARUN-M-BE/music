import mongoose, { Schema, model, models, Model } from "mongoose";
import { serverEnv } from "./env";

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

// ------------------------------------------------------------------
// Security & analytics event storage (bounded, auto-expiring)
// ------------------------------------------------------------------
const securityEventSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    actorEmail: { type: String, default: "" },
    ipHash: { type: String, default: "" },
    country: { type: String, default: "" },
    path: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
securityEventSchema.index({ createdAt: -1 });
// Retention: security logs self-delete after 90 days.
securityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const analyticsEventSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    actorId: { type: String, default: "" },
    songId: { type: String, default: "" },
    language: { type: String, default: "" },
    provider: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
analyticsEventSchema.index({ createdAt: -1 });
// Retention: analytics fallback self-deletes after 30 days.
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const SecurityEvent: Model<any> =
  models.securityEvent || model("securityEvent", securityEventSchema);
export const AnalyticsEvent: Model<any> =
  models.analyticsEvent || model("analyticsEvent", analyticsEventSchema);

/**
 * The connection string is read exclusively from the environment, through
 * `serverEnv` so a sealed (`enc:v1:...`) value is decrypted first.
 * Credentials are never bundled into the repository.
 */
function getResolvedMongoUri(): string {
  return serverEnv.mongodbUri;
}

function getDatabaseName(uri: string): string {
  if (process.env.MONGODB_DB?.trim()) return process.env.MONGODB_DB.trim();
  try {
    const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const withoutCredentials = withoutScheme.includes("@")
      ? withoutScheme.slice(withoutScheme.indexOf("@") + 1)
      : withoutScheme;
    const path = withoutCredentials.split("/")[1] ?? "";
    const name = path.split("?")[0]?.trim();
    return name || "music";
  } catch {
    return "music";
  }
}

// Track active DB operations and the single in-flight connect attempt.
let activeDbOperations = 0;
let connecting: Promise<typeof mongoose> | null = null;
let idleDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

/** Idle sockets are closed after this delay (keeps Worker isolates healthy). */
const IDLE_DISCONNECT_MS = 30_000;

// Catch background connection events safely so unhandled errors never crash the isolate
if (typeof mongoose !== "undefined" && mongoose.connection) {
  if (!mongoose.connection.listenerCount("error")) {
    mongoose.connection.on("error", (err) => {
      console.warn("MongoDB connection background warning:", err?.message || err);
    });
  }
}

function connectOptions(uri: string): mongoose.ConnectOptions {
  return {
    bufferCommands: false,
    dbName: getDatabaseName(uri),
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 30_000,
  };
}

/**
 * Returns a live connection, de-duplicating concurrent connect attempts so a
 * burst of requests never opens several sockets (which previously caused
 * "Client must be connected before running operations").
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!connecting) {
    const uri = getResolvedMongoUri();
    connecting = mongoose
      .connect(uri, connectOptions(uri))
      .finally(() => {
        connecting = null;
      });
  }

  return connecting;
}

function isConnectionError(error: unknown): boolean {
  const name = (error as { name?: string })?.name ?? "";
  const message = (error as { message?: string })?.message ?? "";
  return (
    name === "MongoNotConnectedError" ||
    name === "MongooseServerSelectionError" ||
    /Client must be connected|connection .*closed|topology is closed|ECONNRESET|ETIMEDOUT/i.test(
      message
    )
  );
}

async function resetConnection(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch {
    // The socket is already gone; nothing else to do.
  }
}

function scheduleIdleDisconnect(): void {
  if (idleDisconnectTimer) clearTimeout(idleDisconnectTimer);
  idleDisconnectTimer = setTimeout(() => {
    idleDisconnectTimer = null;
    if (activeDbOperations > 0) return;
    void resetConnection();
  }, IDLE_DISCONNECT_MS);
  // Never keep a Node process (or a test runner) alive just for this timer.
  (idleDisconnectTimer as { unref?: () => void }).unref?.();
}

/**
 * Runs a database operation on a shared connection.
 *
 * The connection is kept open for the whole isolate and closed only after an
 * idle period, so concurrent requests and background tasks (audit logging,
 * analytics) can safely overlap.
 */
export async function withDb<T>(operation: () => Promise<T>): Promise<T> {
  activeDbOperations++;
  if (idleDisconnectTimer) {
    clearTimeout(idleDisconnectTimer);
    idleDisconnectTimer = null;
  }

  try {
    await connectToDatabase();
    return await operation();
  } catch (error) {
    if (!isConnectionError(error)) throw error;

    console.warn("[mongodb] reconnecting after connectivity error");
    await resetConnection();
    await connectToDatabase();
    return await operation();
  } finally {
    activeDbOperations--;
    if (activeDbOperations <= 0) {
      activeDbOperations = 0;
      scheduleIdleDisconnect();
    }
  }
}

// Aliases for unified consumption across Route Handlers
export const SongModel = Song;
export const AlbumModel = Album;
export const ArtistModel = Artist;
export const UserModel = User;
export const PlaylistModel = Playlist;
