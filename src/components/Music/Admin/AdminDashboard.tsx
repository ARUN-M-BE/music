"use client";

import React, { useState, useEffect } from "react";
import { MusicTrack, Album, Artist, MusicUser, MusicStats } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useLanguage } from "@/context/LanguageContext";
import { StatsCards } from "./StatsCards";
import { TrackTable } from "./TrackTable";
import { UsersTable } from "./UsersTable";
import { MusicUploadModal } from "../MusicUpload/MusicUploadModal";
import {
  LayoutDashboard,
  Music,
  Users,
  PlusCircle,
  Disc,
  Mic2,
  Trash2,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { ConfirmationModal } from "@/components/Common/ConfirmationModal";

export function AdminDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"overview" | "songs" | "upload" | "albums" | "artists" | "users">("overview");

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

  // New Artist Form State
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistImage, setNewArtistImage] = useState("");
  const [newArtistInstagram, setNewArtistInstagram] = useState("");
  const [newArtistTwitter, setNewArtistTwitter] = useState("");
  const [newArtistFileId, setNewArtistFileId] = useState("");

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
      const [metricsData, songsData, albumsData, artistsData, usersData] = await Promise.all([
        musicService.getMetrics(),
        musicService.getSongs(),
        musicService.getAlbums(),
        musicService.getArtists(),
        musicService.getUsers(),
      ]);

      setStats(metricsData);
      setTracks(songsData);
      setAlbums(albumsData);
      setArtists(artistsData);
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    } catch (err) {
      console.error("Create album failed:", err);
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
      setStats((prev) => ({ ...prev, totalArtists: prev.totalArtists + 1 }));
    } catch (err) {
      console.error("Create artist failed:", err);
    }
  };

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
    { id: "songs", label: t("admin.tabSongs"), icon: Music },
    { id: "upload", label: t("admin.tabUpload"), icon: PlusCircle },
    { id: "albums", label: t("admin.tabAlbums"), icon: Disc },
    { id: "artists", label: t("admin.tabArtists"), icon: Mic2 },
    { id: "users", label: t("admin.tabUsers"), icon: Users },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#282828]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{t("admin.title")}</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              RBAC ADMIN
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1">{t("admin.subtitle")}</p>
        </div>

        <button
          onClick={() => setActiveTab("upload")}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs transition-transform active:scale-95 shadow-lg self-start sm:self-auto"
        >
          <PlusCircle className="size-4" />
          <span>{t("admin.addNewSong")}</span>
        </button>
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
            />
          </div>
        </div>
      )}

      {activeTab === "songs" && (
        <TrackTable
          tracks={tracks}
          onTrackDeleted={handleTrackDeleted}
          onTrackUpdated={handleTrackUpdated}
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

      {activeTab === "albums" && (
        <div className="space-y-6">
          {/* Create Album Form */}
          <form
            onSubmit={handleCreateAlbum}
            className="p-4 rounded-xl bg-[#181818] border border-[#282828] flex flex-wrap items-center gap-3"
          >
            <input
              type="text"
              required
              placeholder="New album name..."
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none flex-1 min-w-[200px]"
            />
            <input
              type="text"
              required
              placeholder="Artwork image URL..."
              value={newAlbumImage}
              onChange={(e) => setNewAlbumImage(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none flex-1 min-w-[200px]"
            />
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs"
            >
              {t("admin.addNewAlbum")}
            </button>
          </form>

          {/* Album Grid */}
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
                  <button
                    onClick={() =>
                      setDeleteTarget({
                        type: "album",
                        id: album._id,
                        name: album.name,
                        fileId: album.fileId,
                      })
                    }
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <span className="font-semibold text-xs text-white truncate mt-2">{album.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "artists" && (
        <div className="space-y-6">
          {/* Create Artist Form */}
          <form
            onSubmit={handleCreateArtist}
            className="p-4 rounded-xl bg-[#181818] border border-[#282828] flex flex-wrap items-center gap-3"
          >
            <input
              type="text"
              required
              placeholder="Artist name..."
              value={newArtistName}
              onChange={(e) => setNewArtistName(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none flex-1 min-w-[150px]"
            />
            <input
              type="text"
              required
              placeholder="Photo image URL..."
              value={newArtistImage}
              onChange={(e) => setNewArtistImage(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none flex-1 min-w-[150px]"
            />
            <input
              type="text"
              required
              placeholder="Instagram handle..."
              value={newArtistInstagram}
              onChange={(e) => setNewArtistInstagram(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#242424] text-xs text-white border border-[#383838] focus:border-[#1db954] outline-none flex-1 min-w-[150px]"
            />
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs"
            >
              {t("admin.addNewArtist")}
            </button>
          </form>

          {/* Artist Circles */}
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
                  <button
                    onClick={() =>
                      setDeleteTarget({
                        type: "artist",
                        id: art._id,
                        name: art.name,
                        fileId: art.fileId,
                      })
                    }
                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <span className="font-semibold text-xs text-white truncate mt-2 w-full">{art.name}</span>
                <span className="text-[10px] text-[#b3b3b3] truncate">@{art.instagram}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <UsersTable users={users} onUserUpdated={loadData} />
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
    </div>
  );
}

