"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MusicTrack, Album, Artist, MusicUser, MusicStats } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { useAuth } from "@/features/auth";
import { compressImage } from "@/lib/mediaOptimization";
import { StatsCards } from "./StatsCards";
import { TrackTable } from "./TrackTable";
import { UsersTable } from "./UsersTable";
import { MusicUploadModal } from "@/features/upload";
import { BulkUploadModal } from "./BulkUploadModal";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/shared/skeletons";
import { Overlay, Swap } from "@/shared/motion";
import {
  LayoutDashboard,
  Music,
  Users,
  PlusCircle,
  Disc,
  Mic2,
  Trash2,
  Edit3,
  Loader2,
  Upload,
  CheckCircle,
  X,
  FileSpreadsheet,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

type AdminTab = "overview" | "songs" | "upload" | "albums" | "artists" | "users";

export function AdminDashboard() {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const [requestedTab, setActiveTab] = useState<AdminTab>("overview");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [stats, setStats] = useState<MusicStats>({
    totalSongs: 0,
    totalAlbums: 0,
    totalArtists: 0,
    totalUsers: 0,
    totalPlays: 0,
  });

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [users, setUsers] = useState<MusicUser[]>([]);
  const [loading, setLoading] = useState(true);

  // New Album Form State
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumImage, setNewAlbumImage] = useState("");
  const [newAlbumFileId, setNewAlbumFileId] = useState("");
  const [isUploadingAlbumImg, setIsUploadingAlbumImg] = useState(false);
  const albumFileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Album Modal State
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editAlbumName, setEditAlbumName] = useState("");
  const [editAlbumImage, setEditAlbumImage] = useState("");
  const [editAlbumFileId, setEditAlbumFileId] = useState("");
  const [isUploadingEditAlbumImg, setIsUploadingEditAlbumImg] = useState(false);
  const [isUpdatingAlbum, setIsUpdatingAlbum] = useState(false);
  const editAlbumFileInputRef = useRef<HTMLInputElement | null>(null);

  // New Artist Form State
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistImage, setNewArtistImage] = useState("");
  const [newArtistInstagram, setNewArtistInstagram] = useState("");
  const [newArtistTwitter, setNewArtistTwitter] = useState("");
  const [newArtistFileId, setNewArtistFileId] = useState("");
  const [isUploadingArtistImg, setIsUploadingArtistImg] = useState(false);
  const artistFileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Artist Modal State
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [editArtistName, setEditArtistName] = useState("");
  const [editArtistImage, setEditArtistImage] = useState("");
  const [editArtistInstagram, setEditArtistInstagram] = useState("");
  const [editArtistTwitter, setEditArtistTwitter] = useState("");
  const [editArtistFileId, setEditArtistFileId] = useState("");
  const [isUploadingEditArtistImg, setIsUploadingEditArtistImg] = useState(false);
  const [isUpdatingArtist, setIsUpdatingArtist] = useState(false);
  const editArtistFileInputRef = useRef<HTMLInputElement | null>(null);

  // Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "album" | "artist";
    id: string;
    name: string;
    fileId?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdminData = useCallback(async () => {
    const [songsData, albumsData, artistsData, usersData] = await Promise.all([
      musicService.getSongs(),
      musicService.getAlbums(),
      musicService.getArtists(),
      isSuperAdmin ? musicService.getUsers() : Promise.resolve([]),
    ]);

    return {
      songs: songsData || [],
      albums: albumsData || [],
      artists: artistsData || [],
      users: usersData || [],
    };
  }, [isSuperAdmin]);

  const applyAdminData = useCallback((data: Awaited<ReturnType<typeof fetchAdminData>>) => {
    setStats({
      totalSongs: data.songs.length,
      totalAlbums: data.albums.length,
      totalArtists: data.artists.length,
      totalUsers: data.users.length,
      totalPlays: data.songs.reduce((sum, song) => sum + (song.playsCount || 0), 0),
    });

    setTracks(data.songs);
    setAlbums(data.albums);
    setArtists(data.artists);
    setUsers(data.users);
  }, []);

  const reloadAdminData = useCallback(
    () => fetchAdminData().then(applyAdminData),
    [fetchAdminData, applyAdminData]
  );

  useEffect(() => {
    let cancelled = false;

    fetchAdminData()
      .then((data) => {
        if (!cancelled) applyAdminData(data);
      })
      .catch((err) => console.error("Failed to load admin data:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchAdminData, applyAdminData]);

  // Admins cannot see the users tab, so clamp the selection at render time
  // instead of correcting it in an effect after the fact.
  const activeTab: AdminTab =
    !isSuperAdmin && requestedTab === "users" ? "overview" : requestedTab;

  const handleTrackCreated = (track: MusicTrack) => {
    setTracks((prev) => [track, ...prev]);
    setStats((prev) => ({ ...prev, totalSongs: prev.totalSongs + 1 }));
    setActiveTab("songs");
  };

  const handleTrackDeleted = (id: string) => {
    setTracks((prev) => prev.filter((t) => t._id !== id));
    setStats((prev) => ({ ...prev, totalSongs: Math.max(0, prev.totalSongs - 1) }));
  };

  const handleTrackUpdated = (updated: MusicTrack) => {
    setTracks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  // ================= ALBUM HANDLERS =================
  const handleUploadAlbumImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAlbumImg(true);
    try {
      const compressed = await compressImage(file, 1000, 0.75);
      const { url, fileId } = await musicService.uploadMedia(compressed);
      setNewAlbumImage(url);
      setNewAlbumFileId(fileId);
    } catch (err) {
      console.error("Album artwork upload error:", err);
    } finally {
      setIsUploadingAlbumImg(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim() || !newAlbumImage.trim()) return;
    try {
      const created = await musicService.saveAlbum({
        name: newAlbumName.trim(),
        imageURL: newAlbumImage.trim(),
        fileId: newAlbumFileId || `alb_${Date.now()}`,
      });
      setAlbums((prev) => [created, ...prev]);
      setNewAlbumName("");
      setNewAlbumImage("");
      setNewAlbumFileId("");
      setStats((prev) => ({ ...prev, totalAlbums: prev.totalAlbums + 1 }));
    } catch (err) {
      console.error("Create album failed:", err);
    }
  };

  const openEditAlbumModal = (album: Album) => {
    setEditingAlbum(album);
    setEditAlbumName(album.name);
    setEditAlbumImage(album.imageURL);
    setEditAlbumFileId(album.fileId || "");
  };

  const handleUploadEditAlbumImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEditAlbumImg(true);
    try {
      const compressed = await compressImage(file, 1000, 0.75);
      const { url, fileId } = await musicService.uploadMedia(compressed);
      setEditAlbumImage(url);
      setEditAlbumFileId(fileId);
    } catch (err) {
      console.error("Edit album artwork upload error:", err);
    } finally {
      setIsUploadingEditAlbumImg(false);
    }
  };

  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum || !editAlbumName.trim() || !editAlbumImage.trim()) return;
    setIsUpdatingAlbum(true);
    try {
      const updated = await musicService.updateAlbum(editingAlbum._id, {
        name: editAlbumName.trim(),
        imageURL: editAlbumImage.trim(),
        fileId: editAlbumFileId,
      });
      setAlbums((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      setEditingAlbum(null);
    } catch (err) {
      console.error("Update album failed:", err);
    } finally {
      setIsUpdatingAlbum(false);
    }
  };

  // ================= ARTIST HANDLERS =================
  const handleUploadArtistImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingArtistImg(true);
    try {
      const compressed = await compressImage(file, 1000, 0.75);
      const { url, fileId } = await musicService.uploadMedia(compressed);
      setNewArtistImage(url);
      setNewArtistFileId(fileId);
    } catch (err) {
      console.error("Artist photo upload error:", err);
    } finally {
      setIsUploadingArtistImg(false);
    }
  };

  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtistName.trim() || !newArtistImage.trim() || !newArtistInstagram.trim()) return;
    try {
      const created = await musicService.saveArtist({
        name: newArtistName.trim(),
        imageURL: newArtistImage.trim(),
        instagram: newArtistInstagram.trim(),
        twetter: newArtistTwitter.trim(),
        fileId: newArtistFileId || `art_${Date.now()}`,
      });
      setArtists((prev) => [created, ...prev]);
      setNewArtistName("");
      setNewArtistImage("");
      setNewArtistInstagram("");
      setNewArtistTwitter("");
      setNewArtistFileId("");
      setStats((prev) => ({ ...prev, totalArtists: prev.totalArtists + 1 }));
    } catch (err) {
      console.error("Create artist failed:", err);
    }
  };

  const openEditArtistModal = (artist: Artist) => {
    setEditingArtist(artist);
    setEditArtistName(artist.name);
    setEditArtistImage(artist.imageURL);
    setEditArtistInstagram(artist.instagram);
    setEditArtistTwitter(artist.twetter || "");
    setEditArtistFileId(artist.fileId || "");
  };

  const handleUploadEditArtistImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEditArtistImg(true);
    try {
      const compressed = await compressImage(file, 1000, 0.75);
      const { url, fileId } = await musicService.uploadMedia(compressed);
      setEditArtistImage(url);
      setEditArtistFileId(fileId);
    } catch (err) {
      console.error("Edit artist photo upload error:", err);
    } finally {
      setIsUploadingEditArtistImg(false);
    }
  };

  const handleUpdateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArtist || !editArtistName.trim() || !editArtistImage.trim()) return;
    setIsUpdatingArtist(true);
    try {
      const updated = await musicService.updateArtist(editingArtist._id, {
        name: editArtistName.trim(),
        imageURL: editArtistImage.trim(),
        instagram: editArtistInstagram.trim(),
        twetter: editArtistTwitter.trim(),
        fileId: editArtistFileId,
      });
      setArtists((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      setEditingArtist(null);
    } catch (err) {
      console.error("Update artist failed:", err);
    } finally {
      setIsUpdatingArtist(false);
    }
  };

  // ================= DELETE HANDLER =================
  const confirmDeleteTarget = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "album") {
        await musicService.deleteAlbum(deleteTarget.id, deleteTarget.fileId);
        setAlbums((prev) => prev.filter((a) => a._id !== deleteTarget.id));
        setStats((prev) => ({ ...prev, totalAlbums: Math.max(0, prev.totalAlbums - 1) }));
      } else {
        await musicService.deleteArtist(deleteTarget.id, deleteTarget.fileId);
        setArtists((prev) => prev.filter((a) => a._id !== deleteTarget.id));
        setStats((prev) => ({ ...prev, totalArtists: Math.max(0, prev.totalArtists - 1) }));
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <PageHeaderSkeleton />
        <StatCardsSkeleton />
        <TableSkeleton rows={6} columns={5} />
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: LucideIcon }[] = [
    { id: "overview", label: t("admin.tabOverview"), icon: LayoutDashboard },
    { id: "songs", label: `${t("admin.tabSongs")} (${tracks.length})`, icon: Music },
    { id: "upload", label: t("admin.tabUpload"), icon: PlusCircle },
    { id: "albums", label: `${t("admin.tabAlbums")} (${albums.length})`, icon: Disc },
    { id: "artists", label: `${t("admin.tabArtists")} (${artists.length})`, icon: Mic2 },
    ...(isSuperAdmin
      ? [{ id: "users" as const, label: `${t("admin.tabUsers")} (${users.length})`, icon: Users }]
      : []),
  ];

  return (
    <div className="w-full space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>{t("admin.title")}</span>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                isSuperAdmin
                  ? "bg-chart-5/20 text-chart-5 border border-chart-5/30"
                  : "bg-destructive/15 text-destructive border border-destructive/30"
              }`}
            >
              {isSuperAdmin ? "SUPERADMIN STUDIO" : "ADMIN STUDIO"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("admin.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/secret-box"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-accent text-foreground border border-border font-bold text-xs transition-transform active:scale-95"
            title="Encrypt or decrypt a configuration value"
          >
            <KeyRound className="size-4 text-primary" />
            <span>Secret Box</span>
          </Link>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 hover:bg-primary/25 text-primary border border-primary/40 font-bold text-xs transition-transform active:scale-95 shadow-lg"
          >
            <FileSpreadsheet className="size-4" />
            <span>Bulk Upload & Export</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-transform active:scale-95 shadow-lg"
          >
            <PlusCircle className="size-4" />
            <span>{t("admin.addNewSong")}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }`}
            >
              <Icon className={`size-4 ${isActive ? "text-primary" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <Swap stateKey={activeTab}>
        {activeTab === "overview" && (
          <div className="space-y-6">
            <StatsCards stats={stats} />

            <div className="space-y-3">
              <h3 className="text-base font-bold text-foreground">Recent Catalog Uploads</h3>
              <TrackTable
                tracks={tracks.slice(0, 5)}
                onTrackDeleted={handleTrackDeleted}
                onTrackUpdated={handleTrackUpdated}
                canEdit={isSuperAdmin}
                canDelete={isSuperAdmin}
              />
            </div>
          </div>
        )}

        {activeTab === "songs" && (
          <TrackTable
            tracks={tracks}
            onTrackDeleted={handleTrackDeleted}
            onTrackUpdated={handleTrackUpdated}
            canEdit={isSuperAdmin}
            canDelete={isSuperAdmin}
          />
        )}

        {activeTab === "upload" && (
          <div className="flex justify-center">
            <MusicUploadModal
              onSuccess={handleTrackCreated}
              existingAlbums={albums}
              existingArtists={artists}
            />
          </div>
        )}

      {/* ================= ALBUMS TAB ================= */}
      {activeTab === "albums" && (
        <div className="space-y-6">
          {/* Create Album Form with File Upload & URL */}
          <form
            onSubmit={handleCreateAlbum}
            className="p-5 rounded-2xl bg-card border border-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Create New Album
              </span>
              {isUploadingAlbumImg && (
                <span className="text-xs text-primary flex items-center gap-1.5 font-medium">
                  <Loader2 className="size-3.5 animate-spin" /> Uploading artwork to ImageKit...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Album title..."
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="h-10 px-3 rounded-lg bg-muted text-xs text-foreground border border-border focus:border-primary outline-none"
              />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Artwork URL or upload..."
                  value={newAlbumImage}
                  onChange={(e) => setNewAlbumImage(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-muted text-xs text-foreground border border-border focus:border-primary outline-none flex-1 min-w-0"
                />

                <input
                  ref={albumFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadAlbumImage}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => albumFileInputRef.current?.click()}
                  disabled={isUploadingAlbumImg}
                  className="h-10 px-3 rounded-lg bg-accent hover:bg-border text-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Upload artwork image"
                >
                  <Upload className="size-3.5 text-primary" />
                  <span>Upload</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!newAlbumName.trim() || !newAlbumImage.trim() || isUploadingAlbumImg}
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-transform active:scale-95 disabled:opacity-50"
              >
                {t("admin.addNewAlbum")}
              </button>
            </div>

            {/* Preview Thumbnail */}
            {newAlbumImage && (
              <div className="flex items-center gap-3 pt-2">
                <div className="relative size-12 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                  <Image src={newAlbumImage} alt="Preview" fill sizes="48px" className="object-cover" unoptimized />
                </div>
                <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <CheckCircle className="size-3.5 text-primary" /> Artwork verified
                </span>
              </div>
            )}
          </form>

          {/* Album Grid with Edit & Delete Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {albums.map((album) => (
              <div
                key={album._id}
                className="group relative p-3 rounded-xl bg-card border border-transparent hover:border-border transition-all flex flex-col"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={album.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                    alt={album.name}
                    fill
                    sizes="150px"
                    className="object-cover"
                    unoptimized
                  />

                  {/* Action Overlay */}
                  {isSuperAdmin && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditAlbumModal(album)}
                        className="p-1.5 rounded-full bg-scrim/70 text-scrim-foreground hover:bg-scrim/90 transition-all"
                        title="Edit Album"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "album",
                            id: album._id,
                            name: album.name,
                            fileId: album.fileId,
                          })
                        }
                        className="p-1.5 rounded-full bg-scrim/70 text-scrim-foreground hover:bg-scrim/90 transition-all"
                        title="Delete Album"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="font-semibold text-xs text-foreground truncate mt-2">{album.name}</span>
                <span className="text-[10px] text-muted-foreground/70">Album</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ARTISTS TAB ================= */}
      {activeTab === "artists" && (
        <div className="space-y-6">
          {/* Create Artist Form with File Upload & URL */}
          <form
            onSubmit={handleCreateArtist}
            className="p-5 rounded-2xl bg-card border border-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Create New Artist
              </span>
              {isUploadingArtistImg && (
                <span className="text-xs text-primary flex items-center gap-1.5 font-medium">
                  <Loader2 className="size-3.5 animate-spin" /> Uploading photo to ImageKit...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Artist name..."
                value={newArtistName}
                onChange={(e) => setNewArtistName(e.target.value)}
                className="h-10 px-3 rounded-lg bg-muted text-xs text-foreground border border-border focus:border-primary outline-none"
              />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Photo URL or upload..."
                  value={newArtistImage}
                  onChange={(e) => setNewArtistImage(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-muted text-xs text-foreground border border-border focus:border-primary outline-none flex-1 min-w-0"
                />

                <input
                  ref={artistFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadArtistImage}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => artistFileInputRef.current?.click()}
                  disabled={isUploadingArtistImg}
                  className="h-10 px-3 rounded-lg bg-accent hover:bg-border text-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Upload artist photo"
                >
                  <Upload className="size-3.5 text-primary" />
                  <span>Upload</span>
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="Instagram handle (e.g. arun_official)..."
                value={newArtistInstagram}
                onChange={(e) => setNewArtistInstagram(e.target.value)}
                className="h-10 px-3 rounded-lg bg-muted text-xs text-foreground border border-border focus:border-primary outline-none"
              />

              <input
                type="text"
                placeholder="Twitter handle (optional)..."
                value={newArtistTwitter}
                onChange={(e) => setNewArtistTwitter(e.target.value)}
                className="h-10 px-3 rounded-lg bg-muted text-xs text-foreground border border-border focus:border-primary outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {newArtistImage ? (
                <div className="flex items-center gap-2">
                  <div className="relative size-9 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                    <Image src={newArtistImage} alt="Preview" fill sizes="36px" className="object-cover" unoptimized />
                  </div>
                  <span className="text-[11px] text-muted-foreground">Photo ready</span>
                </div>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={!newArtistName.trim() || !newArtistImage.trim() || !newArtistInstagram.trim() || isUploadingArtistImg}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-transform active:scale-95 disabled:opacity-50"
              >
                {t("admin.addNewArtist")}
              </button>
            </div>
          </form>

          {/* Artist Circles with Edit & Delete Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {artists.map((art) => (
              <div
                key={art._id}
                className="group relative p-3 rounded-xl bg-card border border-transparent hover:border-border transition-all flex flex-col items-center text-center"
              >
                <div className="relative size-24 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={art.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                    alt={art.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />

                  {/* Action Overlay */}
                  {isSuperAdmin && (
                    <div className="absolute inset-0 bg-scrim/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditArtistModal(art)}
                        className="p-1.5 rounded-full bg-scrim/60 text-scrim-foreground hover:bg-scrim/80 transition-colors"
                        title="Edit Artist"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "artist",
                            id: art._id,
                            name: art.name,
                            fileId: art.fileId,
                          })
                        }
                        className="p-1.5 rounded-full bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors"
                        title="Delete Artist"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="font-semibold text-xs text-foreground truncate mt-2 w-full">{art.name}</span>
                <span className="text-[10px] text-muted-foreground truncate">@{art.instagram}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= USERS TAB ================= */}
      {activeTab === "users" && isSuperAdmin && (
        <UsersTable
          users={users}
          currentUserEmail={user?.email}
          isSuperAdmin={isSuperAdmin}
          onUserUpdated={reloadAdminData}
        />
      )}
      </Swap>

      {/* ================= EDIT ALBUM MODAL ================= */}
      <Overlay
        open={!!editingAlbum}
        onClose={() => setEditingAlbum(null)}
        label="Edit Album"
        className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl space-y-4 text-left"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Disc className="size-4 text-primary" /> Edit Album
          </h3>
          <button onClick={() => setEditingAlbum(null)} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleUpdateAlbum} className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Album Title *</label>
            <input
              type="text"
              required
              value={editAlbumName}
              onChange={(e) => setEditAlbumName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Artwork Image *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={editAlbumImage}
                onChange={(e) => setEditAlbumImage(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none flex-1 min-w-0"
              />
              <input
                ref={editAlbumFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadEditAlbumImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => editAlbumFileInputRef.current?.click()}
                disabled={isUploadingEditAlbumImg}
                className="h-10 px-3 rounded-lg bg-accent hover:bg-border text-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Upload className="size-3.5 text-primary" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {editAlbumImage && (
            <div className="relative size-16 rounded-lg overflow-hidden bg-muted border border-border">
              <Image src={editAlbumImage} alt="Album artwork" fill sizes="64px" className="object-cover" unoptimized />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingAlbum(null)}
              className="px-4 py-2 rounded-full bg-muted text-xs font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingAlbum || !editAlbumName.trim() || !editAlbumImage.trim()}
              className="px-5 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2"
            >
              {isUpdatingAlbum && <Loader2 className="size-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Overlay>

      {/* ================= EDIT ARTIST MODAL ================= */}
      <Overlay
        open={!!editingArtist}
        onClose={() => setEditingArtist(null)}
        label="Edit Artist"
        className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl space-y-4 text-left"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Mic2 className="size-4 text-primary" /> Edit Artist
          </h3>
          <button onClick={() => setEditingArtist(null)} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleUpdateArtist} className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Artist Name *</label>
            <input
              type="text"
              required
              value={editArtistName}
              onChange={(e) => setEditArtistName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Photo Image *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={editArtistImage}
                onChange={(e) => setEditArtistImage(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none flex-1 min-w-0"
              />
              <input
                ref={editArtistFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadEditArtistImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => editArtistFileInputRef.current?.click()}
                disabled={isUploadingEditArtistImg}
                className="h-10 px-3 rounded-lg bg-accent hover:bg-border text-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Upload className="size-3.5 text-primary" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Instagram Handle *</label>
              <input
                type="text"
                required
                value={editArtistInstagram}
                onChange={(e) => setEditArtistInstagram(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Twitter Handle</label>
              <input
                type="text"
                value={editArtistTwitter}
                onChange={(e) => setEditArtistTwitter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
              />
            </div>
          </div>

          {editArtistImage && (
            <div className="relative size-16 rounded-full overflow-hidden bg-muted border border-border">
              <Image src={editArtistImage} alt="Artist photo" fill sizes="64px" className="object-cover" unoptimized />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingArtist(null)}
              className="px-4 py-2 rounded-full bg-muted text-xs font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingArtist || !editArtistName.trim() || !editArtistImage.trim()}
              className="px-5 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2"
            >
              {isUpdatingArtist && <Loader2 className="size-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Overlay>

      {/* Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === "album" ? "Delete Album" : "Delete Artist"}
        message={
          deleteTarget?.type === "album"
            ? "Are you sure you want to permanently delete this album and its associated media?"
            : "Are you sure you want to permanently delete this artist profile and its media?"
        }
        highlight={deleteTarget?.name}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Bulk Catalog Importer & Exporter Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={reloadAdminData}
      />
    </div>
  );
}
