import {
  MusicTrack,
  Artist,
  Album,
  MusicUser,
  MusicStats,
  CreateSongInput,
  CreateArtistInput,
  CreateAlbumInput,
  FilterOptions,
  UnifiedSong,
  UnifiedArtist,
  UnifiedAlbum,
  UserPlaylist,
} from "@/types/music";

class MusicService {
  private baseUrl = "/api";

  // High Performance In-Memory Cache (30s TTL)
  private songsCache: { data: MusicTrack[]; timestamp: number } | null = null;
  private albumsCache: { data: Album[]; timestamp: number } | null = null;
  private artistsCache: { data: Artist[]; timestamp: number } | null = null;
  private CACHE_TTL_MS = 30000;

  invalidateCache() {
    this.songsCache = null;
    this.albumsCache = null;
    this.artistsCache = null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("music_user");
        if (stored) {
          const user = JSON.parse(stored);
          if (user.email) {
            headers["Authorization"] = `Bearer ${user.email}`;
            headers["x-user-email"] = user.email;
          }
        }
      } catch {}
    }
    return headers;
  }

  // ================= SONGS =================
  async getSongs(options?: FilterOptions): Promise<MusicTrack[]> {
    const hasFilters =
      !!options?.search ||
      (options?.category && options.category !== "all") ||
      (options?.language && options.language !== "all") ||
      (options?.sortBy && options.sortBy !== "newest");

    // Return cached immediately if no filters and fresh
    if (!hasFilters && this.songsCache && Date.now() - this.songsCache.timestamp < this.CACHE_TTL_MS) {
      return this.songsCache.data;
    }

    try {
      const params = new URLSearchParams();
      if (options?.search) params.set("search", options.search);
      if (options?.category && options.category !== "all") params.set("category", options.category);
      if (options?.language && options.language !== "all") params.set("language", options.language);
      if (options?.sortBy) params.set("sortBy", options.sortBy);

      const res = await fetch(`${this.baseUrl}/songs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch songs");
      const data = await res.json();
      const list = data.songs || data.data || [];

      if (!hasFilters) {
        this.songsCache = { data: list, timestamp: Date.now() };
      }

      return list;
    } catch (err) {
      console.error("MusicService.getSongs error:", err);
      return this.songsCache?.data || [];
    }
  }

  async getSongById(id: string): Promise<MusicTrack | null> {
    try {
      const res = await fetch(`${this.baseUrl}/songs/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.song || data.data || null;
    } catch (err) {
      console.error("MusicService.getSongById error:", err);
      return null;
    }
  }

  async saveSong(input: CreateSongInput): Promise<MusicTrack> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to save song");
    }
    const data = await res.json();
    return data.song;
  }

  async updateSong(id: string, input: Partial<CreateSongInput>): Promise<MusicTrack> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/songs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update song");
    }
    const data = await res.json();
    return data.song;
  }

  async deleteSong(id: string, fileId?: string, songId?: string): Promise<boolean> {
    this.invalidateCache();
    // Purge media files from ImageKit
    if (fileId) await this.deleteMedia(fileId).catch(console.warn);
    if (songId) await this.deleteMedia(songId).catch(console.warn);

    const res = await fetch(`${this.baseUrl}/songs/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  }

  // ================= ALBUMS =================
  async getAlbums(): Promise<Album[]> {
    if (this.albumsCache && Date.now() - this.albumsCache.timestamp < this.CACHE_TTL_MS) {
      return this.albumsCache.data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/albums`);
      if (!res.ok) return [];
      const data = await res.json();
      const list = data.albums || data.data || [];
      this.albumsCache = { data: list, timestamp: Date.now() };
      return list;
    } catch (err) {
      console.error("MusicService.getAlbums error:", err);
      return this.albumsCache?.data || [];
    }
  }

  async saveAlbum(input: CreateAlbumInput): Promise<Album> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/albums`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create album");
    const data = await res.json();
    return data.album;
  }

  async updateAlbum(id: string, input: Partial<CreateAlbumInput>): Promise<Album> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/albums/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to update album");
    const data = await res.json();
    return data.album;
  }

  async deleteAlbum(id: string, fileId?: string): Promise<boolean> {
    this.invalidateCache();
    if (fileId) await this.deleteMedia(fileId).catch(console.warn);
    const res = await fetch(`${this.baseUrl}/albums/${id}`, { method: "DELETE" });
    return res.ok;
  }

  // ================= ARTISTS =================
  async getArtists(): Promise<Artist[]> {
    if (this.artistsCache && Date.now() - this.artistsCache.timestamp < this.CACHE_TTL_MS) {
      return this.artistsCache.data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/artists`);
      if (!res.ok) return [];
      const data = await res.json();
      const list = data.artists || data.data || [];
      this.artistsCache = { data: list, timestamp: Date.now() };
      return list;
    } catch (err) {
      console.error("MusicService.getArtists error:", err);
      return this.artistsCache?.data || [];
    }
  }

  async saveArtist(input: CreateArtistInput): Promise<Artist> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/artists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create artist");
    const data = await res.json();
    return data.artist;
  }

  async updateArtist(id: string, input: Partial<CreateArtistInput>): Promise<Artist> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/artists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to update artist");
    const data = await res.json();
    return data.artist;
  }

  async deleteArtist(id: string, fileId?: string): Promise<boolean> {
    this.invalidateCache();
    if (fileId) await this.deleteMedia(fileId).catch(console.warn);
    const res = await fetch(`${this.baseUrl}/artists/${id}`, { method: "DELETE" });
    return res.ok;
  }

  // ================= USERS & RBAC =================
  async getUsers(): Promise<MusicUser[]> {
    try {
      const res = await fetch(`${this.baseUrl}/users`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || data.data || [];
    } catch (err) {
      console.error("MusicService.getUsers error:", err);
      return [];
    }
  }

  async updateUserRole(userId: string, role: "admin" | "member" | "superadmin"): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/users/${userId}/role`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update user role");
    }
    return true;
  }

  async updateUserStatus(userId: string, status: "approved" | "pending"): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/users/${userId}/status`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update user status");
    }
    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete user");
    }
    return true;
  }

  // ================= FAVORITES PERSISTENCE =================
  async getUserFavorites(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/users/favorites`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.favorites || [];
    } catch {
      return [];
    }
  }

  async toggleUserFavorite(songId: string): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/users/favorites`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ songId }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.favorites || [];
    } catch {
      return [];
    }
  }

  // ================= MEDIA UPLOADS =================
  async uploadMedia(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; fileId: string }> {
    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress if requested
    if (onProgress) {
      onProgress(30);
      setTimeout(() => onProgress(65), 300);
      setTimeout(() => onProgress(90), 600);
    }

    const res = await fetch(`${this.baseUrl}/media/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorMsg = await res.json().catch(() => ({}));
      throw new Error(errorMsg.message || "Upload failed");
    }

    const data = await res.json();
    if (onProgress) onProgress(100);

    return {
      url: data.songURL || data.imageURL || data.url,
      fileId: data.fileId || `file_${Date.now()}`,
    };
  }

  async deleteMedia(fileId: string): Promise<boolean> {
    if (!fileId) return false;
    try {
      const res = await fetch(`${this.baseUrl}/media/delete/${fileId}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ================= BULK IMPORT =================
  async bulkImportSongs(songs: any[]): Promise<{ count: number; errors?: any[] }> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/songs/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Bulk import failed");
    }
    return { count: data.count || 0, errors: data.errors };
  }

  async bulkImportArtists(artists: any[]): Promise<{ count: number; errors?: any[] }> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/artists/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artists }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Bulk import failed");
    }
    return { count: data.count || 0, errors: data.errors };
  }

  async bulkImportAlbums(albums: any[]): Promise<{ count: number; errors?: any[] }> {
    this.invalidateCache();
    const res = await fetch(`${this.baseUrl}/albums/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albums }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Bulk import failed");
    }
    return { count: data.count || 0, errors: data.errors };
  }

  // ================= UNIFIED STREAMING & DISCOVERY =================
  async searchAggregatedMusic(query: string, language?: string, limit = 30): Promise<UnifiedSong[]> {
    if (!query.trim()) return [];
    try {
      const params = new URLSearchParams({ q: query, limit: limit.toString() });
      if (language && language !== "all") params.set("language", language);
      const res = await fetch(`${this.baseUrl}/music/search?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.songs || [];
    } catch (err) {
      console.error("MusicService.searchAggregatedMusic error:", err);
      return [];
    }
  }

  async getTrendingMusic(language?: string): Promise<UnifiedSong[]> {
    try {
      const params = new URLSearchParams();
      if (language && language !== "all") params.set("language", language);
      const res = await fetch(`${this.baseUrl}/music/trending?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.songs || [];
    } catch (err) {
      console.error("MusicService.getTrendingMusic error:", err);
      return [];
    }
  }

  async getArtistProfile(idOrName: string): Promise<{ artist: UnifiedArtist; songs: UnifiedSong[] } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/music/artist/${encodeURIComponent(idOrName)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return { artist: data.artist, songs: data.songs || [] };
    } catch (err) {
      console.error("MusicService.getArtistProfile error:", err);
      return null;
    }
  }

  async getAlbumDetails(idOrTitle: string): Promise<{ album: UnifiedAlbum; songs: UnifiedSong[] } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/music/album/${encodeURIComponent(idOrTitle)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return { album: data.album, songs: data.songs || [] };
    } catch (err) {
      console.error("MusicService.getAlbumDetails error:", err);
      return null;
    }
  }

  // ================= PLAYLISTS =================
  async getUserPlaylists(userId?: string): Promise<UserPlaylist[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      const res = await fetch(`${this.baseUrl}/music/playlists?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.playlists || [];
    } catch (err) {
      console.error("MusicService.getUserPlaylists error:", err);
      return [];
    }
  }

  async createPlaylist(data: {
    name: string;
    description?: string;
    coverImage?: string;
    userId?: string;
    songs?: UnifiedSong[];
  }): Promise<UserPlaylist | null> {
    try {
      const res = await fetch(`${this.baseUrl}/music/playlists`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.playlist || null;
    } catch (err) {
      console.error("MusicService.createPlaylist error:", err);
      return null;
    }
  }

  async updatePlaylist(id: string, updates: Partial<UserPlaylist>): Promise<UserPlaylist | null> {
    try {
      const res = await fetch(`${this.baseUrl}/music/playlists`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.playlist || null;
    } catch (err) {
      console.error("MusicService.updatePlaylist error:", err);
      return null;
    }
  }

  async deletePlaylist(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/music/playlists?id=${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ================= OVERVIEW METRICS =================
  async getMetrics(): Promise<MusicStats> {
    const [songs, albums, artists, users] = await Promise.all([
      this.getSongs(),
      this.getAlbums(),
      this.getArtists(),
      this.getUsers(),
    ]);

    const totalPlays = songs.reduce((sum, s) => sum + (s.playsCount || 0), 0);

    return {
      totalSongs: songs.length,
      totalAlbums: albums.length,
      totalArtists: artists.length,
      totalUsers: users.length,
      totalPlays,
    };
  }
}

export const musicService = new MusicService();

