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
} from "@/types/music";

class MusicService {
  private baseUrl = "/api";

  // ================= SONGS =================
  async getSongs(options?: FilterOptions): Promise<MusicTrack[]> {
    try {
      const params = new URLSearchParams();
      if (options?.search) params.set("search", options.search);
      if (options?.category && options.category !== "all") params.set("category", options.category);
      if (options?.language && options.language !== "all") params.set("language", options.language);
      if (options?.sortBy) params.set("sortBy", options.sortBy);

      const res = await fetch(`${this.baseUrl}/songs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch songs");
      const data = await res.json();
      return data.songs || data.data || [];
    } catch (err) {
      console.error("MusicService.getSongs error:", err);
      return [];
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
    try {
      const res = await fetch(`${this.baseUrl}/albums`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.albums || data.data || [];
    } catch (err) {
      console.error("MusicService.getAlbums error:", err);
      return [];
    }
  }

  async saveAlbum(input: CreateAlbumInput): Promise<Album> {
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
    if (fileId) await this.deleteMedia(fileId).catch(console.warn);
    const res = await fetch(`${this.baseUrl}/albums/${id}`, { method: "DELETE" });
    return res.ok;
  }

  // ================= ARTISTS =================
  async getArtists(): Promise<Artist[]> {
    try {
      const res = await fetch(`${this.baseUrl}/artists`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.artists || data.data || [];
    } catch (err) {
      console.error("MusicService.getArtists error:", err);
      return [];
    }
  }

  async saveArtist(input: CreateArtistInput): Promise<Artist> {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return res.ok;
  }

  async updateUserStatus(userId: string, status: "approved" | "pending"): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/users/${userId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: "DELETE",
    });
    return res.ok;
  }

  // ================= FAVORITES PERSISTENCE =================
  async getUserFavorites(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/users/favorites`);
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
        headers: { "Content-Type": "application/json" },
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

