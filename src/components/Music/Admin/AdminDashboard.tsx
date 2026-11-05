"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MusicTrack, Album, Artist, MusicUser, MusicStats } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { compressImage } from "@/lib/mediaOptimization";
import { StatsCards } from "./StatsCards";
import { TrackTable } from "./TrackTable";
import { UsersTable } from "./UsersTable";
import { MusicUploadModal } from "../MusicUpload/MusicUploadModal";
import { BulkUploadModal } from "./BulkUploadModal";
import { ConfirmationModal } from "@/components/Common/ConfirmationModal";
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
  Image as ImageIcon,
  CheckCircle,
  X,
  FileSpreadsheet,
} from "lucide-react";

export function AdminDashboard() {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "songs" | "upload" | "albums" | "artists" | "users">("overview");
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

  const loadData = async () => {
    try {
      const [songsData, albumsData, artistsData, usersData] = await Promise.all([
        musicService.getSongs(),
        musicService.getAlbums(),
        musicService.getArtists(),
        isSuperAdmin ? musicService.getUsers() : Promise.resolve([]),
      ]);

      const totalPlays = (songsData || []).reduce((sum, s) => sum + (s.playsCount || 0), 0);

      setStats({
        totalSongs: (songsData || []).length,
        totalAlbums: (albumsData || []).length,
        totalArtists: (artistsData || []).length,
        totalUsers: (usersData || []).length,
        totalPlays,
      });

      setTracks(songsData || []);
      setAlbums(albumsData || []);
      setArtists(artistsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && activeTab === "users") {
      setActiveTab("overview");
    }
  }, [isSuperAdmin, activeTab]);

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
    setEditAlbumFileId(album.fileId);
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
    setEditArtistFileId(artist.fileId);
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
      <div className="flex flex-col items-center justify-center py-24 text-[#b3b3b3]">
        <Loader2 className="size-8 animate-spin text-[#1db954] mb-3" />
        <p className="text-sm">Connecting to Music Admin Nexus...</p>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: t("admin.tabOverview"), icon: LayoutDashboard },
    { id: "songs", label: `${t("admin.tabSongs")} (${tracks.length})`, icon: Music },
    { id: "upload", label: t("admin.tabUpload"), icon: PlusCircle },
    { id: "albums", label: `${t("admin.tabAlbums")} (${albums.length})`, icon: Disc },
    { id: "artists", label: `${t("admin.tabArtists")} (${artists.length})`, icon: Mic2 },
    ...(isSuperAdmin
      ? [{ id: "users", label: `${t("admin.tabUsers")} (${users.length})`, icon: Users }]
      : []),
  ];

  return (
    <div className="w-full space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#282828]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{t("admin.title")}</span>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                isSuperAdmin
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {isSuperAdmin ? "SUPERADMIN STUDIO" : "ADMIN STUDIO"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1">{t("admin.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs transition-transform active:scale-95 shadow-lg"
          >
            <FileSpreadsheet className="size-4" />
            <span>Bulk Upload & Export</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs transition-transform active:scale-95 shadow-lg"
          >
            <PlusCircle className="size-4" />
            <span>{t("admin.addNewSong")}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#282828] scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[#282828] text-white"
                  : "text-[#b3b3b3] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`size-4 ${isActive ? "text-[#1db954]" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <StatsCards stats={stats} />

          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Recent Catalog Uploads</h3>
            <TrackTable
              tracks={tracks.slice(0, 5)}
              onTrackDeleted={handleTrackDeleted}
              onTrackUpdated={handleTrackUpdated}
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
            className="p-5 rounded-2xl bg-[#181818] border border-[#282828] space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Create New Album
              </span>
              {isUploadingAlbumImg && (
                <span className="text-xs text-[#1db954] flex items-center gap-1.5 font-medium">
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
                className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none"
              />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Artwork URL or upload..."
                  value={newAlbumImage}
                  onChange={(e) => setNewAlbumImage(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none flex-1 min-w-0"
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
                  className="h-10 px-3 rounded-lg bg-[#2e2e2e] hover:bg-[#383838] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Upload artwork image"
                >
                  <Upload className="size-3.5 text-[#1db954]" />
                  <span>Upload</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!newAlbumName.trim() || !newAlbumImage.trim() || isUploadingAlbumImg}
                className="h-10 px-5 rounded-lg bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs transition-transform active:scale-95 disabled:opacity-50"
              >
                {t("admin.addNewAlbum")}
              </button>
            </div>

            {/* Preview Thumbnail */}
            {newAlbumImage && (
              <div className="flex items-center gap-3 pt-2">
                <div className="relative size-12 rounded-lg overflow-hidden bg-[#242424] border border-white/10 shrink-0">
                  <Image src={newAlbumImage} alt="Preview" fill sizes="48px" className="object-cover" unoptimized />
                </div>
                <span className="text-[11px] text-[#b3b3b3] truncate flex items-center gap-1">
                  <CheckCircle className="size-3.5 text-[#1db954]" /> Artwork verified
                </span>
              </div>
            )}
          </form>

          {/* Album Grid with Edit & Delete Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {albums.map((album) => (
              <div
                key={album._id}
                className="group relative p-3 rounded-xl bg-[#181818] border border-transparent hover:border-white/10 transition-all flex flex-col"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#242424]">
                  <Image
                    src={album.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                    alt={album.name}
                    fill
                    sizes="150px"
                    className="object-cover"
                    unoptimized
                  />

                  {/* Action Overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditAlbumModal(album)}
                      className="p-1.5 rounded-full bg-black/70 text-white hover:bg-white/20 transition-all"
                      title="Edit Album"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "album",
                            id: album._id,
                            name: album.name,
                            fileId: album.fileId,
                          })
                        }
                        className="p-1.5 rounded-full bg-black/70 text-red-400 hover:bg-red-500/20 transition-all"
                        title="Delete Album"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-xs text-white truncate mt-2">{album.name}</span>
                <span className="text-[10px] text-[#727272]">Album</span>
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
            className="p-5 rounded-2xl bg-[#181818] border border-[#282828] space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Create New Artist
              </span>
              {isUploadingArtistImg && (
                <span className="text-xs text-[#1db954] flex items-center gap-1.5 font-medium">
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
                className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none"
              />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Photo URL or upload..."
                  value={newArtistImage}
                  onChange={(e) => setNewArtistImage(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none flex-1 min-w-0"
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
                  className="h-10 px-3 rounded-lg bg-[#2e2e2e] hover:bg-[#383838] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Upload artist photo"
                >
                  <Upload className="size-3.5 text-[#1db954]" />
                  <span>Upload</span>
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="Instagram handle (e.g. arun_official)..."
                value={newArtistInstagram}
                onChange={(e) => setNewArtistInstagram(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none"
              />

              <input
                type="text"
                placeholder="Twitter handle (optional)..."
                value={newArtistTwitter}
                onChange={(e) => setNewArtistTwitter(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {newArtistImage ? (
                <div className="flex items-center gap-2">
                  <div className="relative size-9 rounded-full overflow-hidden bg-[#242424] border border-white/10 shrink-0">
                    <Image src={newArtistImage} alt="Preview" fill sizes="36px" className="object-cover" unoptimized />
                  </div>
                  <span className="text-[11px] text-[#b3b3b3]">Photo ready</span>
                </div>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={!newArtistName.trim() || !newArtistImage.trim() || !newArtistInstagram.trim() || isUploadingArtistImg}
                className="h-10 px-6 rounded-lg bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs transition-transform active:scale-95 disabled:opacity-50"
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
                className="group relative p-3 rounded-xl bg-[#181818] border border-transparent hover:border-white/10 transition-all flex flex-col items-center text-center"
              >
                <div className="relative size-24 rounded-full overflow-hidden bg-[#242424]">
                  <Image
                    src={art.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                    alt={art.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />

                  {/* Action Overlay */}
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditArtistModal(art)}
                      className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                      title="Edit Artist"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "artist",
                            id: art._id,
                            name: art.name,
                            fileId: art.fileId,
                          })
                        }
                        className="p-1.5 rounded-full bg-red-600/60 text-white hover:bg-red-600 transition-colors"
                        title="Delete Artist"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-xs text-white truncate mt-2 w-full">{art.name}</span>
                <span className="text-[10px] text-[#b3b3b3] truncate">@{art.instagram}</span>
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
          onUserUpdated={loadData}
        />
      )}

      {/* ================= EDIT ALBUM MODAL ================= */}
      {editingAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setEditingAlbum(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#181818] border border-white/10 shadow-2xl space-y-4 text-left z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Disc className="size-4 text-[#1db954]" /> Edit Album
              </h3>
              <button onClick={() => setEditingAlbum(null)} className="text-[#b3b3b3] hover:text-white">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAlbum} className="space-y-4">
              <div>
                <label className="text-[11px] text-[#b3b3b3] block mb-1">Album Title *</label>
                <input
                  type="text"
                  required
                  value={editAlbumName}
                  onChange={(e) => setEditAlbumName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#b3b3b3] block mb-1">Artwork Image *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editAlbumImage}
                    onChange={(e) => setEditAlbumImage(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none flex-1 min-w-0"
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
                    className="h-10 px-3 rounded-lg bg-[#2e2e2e] hover:bg-[#383838] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="size-3.5 text-[#1db954]" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {editAlbumImage && (
                <div className="relative size-16 rounded-lg overflow-hidden bg-[#242424] border border-white/10">
                  <Image src={editAlbumImage} alt="Album artwork" fill sizes="64px" className="object-cover" unoptimized />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAlbum(null)}
                  className="px-4 py-2 rounded-full bg-[#242424] text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAlbum || !editAlbumName.trim() || !editAlbumImage.trim()}
                  className="px-5 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs flex items-center gap-2"
                >
                  {isUpdatingAlbum && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT ARTIST MODAL ================= */}
      {editingArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setEditingArtist(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#181818] border border-white/10 shadow-2xl space-y-4 text-left z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mic2 className="size-4 text-[#1db954]" /> Edit Artist
              </h3>
              <button onClick={() => setEditingArtist(null)} className="text-[#b3b3b3] hover:text-white">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateArtist} className="space-y-4">
              <div>
                <label className="text-[11px] text-[#b3b3b3] block mb-1">Artist Name *</label>
                <input
                  type="text"
                  required
                  value={editArtistName}
                  onChange={(e) => setEditArtistName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#b3b3b3] block mb-1">Photo Image *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editArtistImage}
                    onChange={(e) => setEditArtistImage(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none flex-1 min-w-0"
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
                    className="h-10 px-3 rounded-lg bg-[#2e2e2e] hover:bg-[#383838] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="size-3.5 text-[#1db954]" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#b3b3b3] block mb-1">Instagram Handle *</label>
                  <input
                    type="text"
                    required
                    value={editArtistInstagram}
                    onChange={(e) => setEditArtistInstagram(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#b3b3b3] block mb-1">Twitter Handle</label>
                  <input
                    type="text"
                    value={editArtistTwitter}
                    onChange={(e) => setEditArtistTwitter(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
                  />
                </div>
              </div>

              {editArtistImage && (
                <div className="relative size-16 rounded-full overflow-hidden bg-[#242424] border border-white/10">
                  <Image src={editArtistImage} alt="Artist photo" fill sizes="64px" className="object-cover" unoptimized />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingArtist(null)}
                  className="px-4 py-2 rounded-full bg-[#242424] text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingArtist || !editArtistName.trim() || !editArtistImage.trim()}
                  className="px-5 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs flex items-center gap-2"
                >
                  {isUpdatingArtist && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        onSuccess={loadData}
      />
    </div>
  );
}
