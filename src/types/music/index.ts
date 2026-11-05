export type MusicProvider = "jiosaavn" | "itunes" | "audius" | "deezer" | "catalog";
export type RepeatMode = "off" | "all" | "one";

export interface UnifiedSong {
  id: string;
  _id?: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: number; // in seconds
  language: string;
  releaseYear: string | number;
  previewUrl: string;
  streamUrl: string;
  provider: MusicProvider;
  externalUrl?: string;
  lyrics?: string;
  playsCount?: number;
}

export interface UnifiedArtist {
  id: string;
  name: string;
  image: string;
  bio?: string;
  followerCount?: number;
  provider: MusicProvider;
  topSongs?: UnifiedSong[];
  albums?: UnifiedAlbum[];
}

export interface UnifiedAlbum {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  releaseYear: string | number;
  songCount?: number;
  provider: MusicProvider;
  songs?: UnifiedSong[];
}

export interface UserPlaylist {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  userId: string;
  songs: UnifiedSong[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MusicTrack {
  _id: string;
  id?: string;
  name: string;
  title?: string;
  imageURL: string;
  artwork?: string;
  songURL: string;
  streamUrl?: string;
  previewUrl?: string;
  album: string;
  artist: string;
  language: string;
  category: string;
  fileId?: string;
  songId?: string;
  playsCount: number;
  duration?: number | string;
  releaseYear?: string | number;
  provider?: MusicProvider;
  externalUrl?: string;
  lyrics?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Artist {
  _id: string;
  name: string;
  imageURL: string;
  twetter?: string;
  instagram: string;
  fileId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Album {
  _id: string;
  name: string;
  artist?: string;
  imageURL: string;
  fileId?: string;
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

export interface FilterOptions {
  search?: string;
  category?: string;
  language?: string;
  sortBy?: "popular" | "newest" | "oldest" | "name";
  provider?: MusicProvider | "all";
}

export interface CreateSongInput {
  name: string;
  artist: string;
  album: string;
  category: string;
  language: string;
  songURL: string;
  imageURL: string;
  fileId?: string;
  songId?: string;
}

export interface CreateArtistInput {
  name: string;
  imageURL: string;
  instagram: string;
  twetter?: string;
  fileId?: string;
}

export interface CreateAlbumInput {
  name: string;
  imageURL: string;
  fileId?: string;
}
