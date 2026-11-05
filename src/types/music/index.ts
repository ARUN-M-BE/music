export interface MusicTrack {
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
  duration?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Artist {
  _id: string;
  name: string;
  imageURL: string;
  twetter?: string;
  instagram: string;
  fileId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Album {
  _id: string;
  name: string;
  imageURL: string;
  fileId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MusicUser {
  _id: string;
  name: string;
  email: string;
  imageURL?: string;
  user_id: string;
  email_verified: boolean;
  status?: "approved" | "pending";
  favorites?: string[];
  role: "admin" | "member" | "superadmin";
  auth_time: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MusicStats {
  totalSongs: number;
  totalAlbums: number;
  totalArtists: number;
  totalUsers: number;
  totalPlays: number;
}

export type RepeatMode = "off" | "all" | "one";

export interface MusicPlayerState {
  currentTrack: MusicTrack | null;
  currentIndex: number;
  queue: MusicTrack[];
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isMiniPlayer: boolean;
  isQueueOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  song?: T;
  songs?: T[];
  album?: T;
  albums?: T[];
  artist?: T;
  artists?: T[];
  user?: T;
  users?: T[];
  error?: string;
}

export interface CreateSongInput {
  name: string;
  imageURL: string;
  songURL: string;
  album: string;
  artist: string;
  language: string;
  category: string;
  fileId: string;
  songId: string;
}

export interface UpdateSongInput extends Partial<CreateSongInput> {
  _id: string;
}

export interface CreateArtistInput {
  name: string;
  imageURL: string;
  twetter?: string;
  instagram: string;
  fileId: string;
}

export interface CreateAlbumInput {
  name: string;
  imageURL: string;
  fileId: string;
}

export interface FilterOptions {
  search?: string;
  category?: string;
  language?: string;
  artist?: string;
  album?: string;
  sortBy?: "newest" | "oldest" | "popular" | "name";
}

