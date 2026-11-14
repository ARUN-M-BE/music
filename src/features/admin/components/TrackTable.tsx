"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MusicTrack } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { Trash2, Edit3, Search, Loader2 } from "lucide-react";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { Overlay } from "@/shared/motion";
import { GENRE_NAMES } from "@/constants/categories";

interface TrackTableProps {
  tracks: MusicTrack[];
  onTrackDeleted: (id: string) => void;
  onTrackUpdated: (track: MusicTrack) => void;
  canDelete?: boolean;
  canEdit?: boolean;
}

export function TrackTable({
  tracks,
  onTrackDeleted,
  onTrackUpdated,
  canDelete = false,
  canEdit = false,
}: TrackTableProps) {
  const { t } = useLanguage();
  const [filterText, setFilterText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmModalTrack, setConfirmModalTrack] = useState<MusicTrack | null>(null);

  // Edit Modal State
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [editName, setEditName] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const filtered = tracks.filter(
    (t) =>
      t.name.toLowerCase().includes(filterText.toLowerCase()) ||
      t.artist.toLowerCase().includes(filterText.toLowerCase()) ||
      t.album.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleDelete = async () => {
    if (!confirmModalTrack) return;
    setDeletingId(confirmModalTrack._id);

    try {
      await musicService.deleteSong(
        confirmModalTrack._id,
        confirmModalTrack.fileId,
        confirmModalTrack.songId
      );
      onTrackDeleted(confirmModalTrack._id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
      setConfirmModalTrack(null);
    }
  };

  const openEditModal = (track: MusicTrack) => {
    setEditingTrack(track);
    setEditName(track.name);
    setEditArtist(track.artist);
    setEditAlbum(track.album || "Single");
    setEditCategory(track.category || "Pop");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    setIsUpdating(true);

    try {
      const updated = await musicService.updateSong(editingTrack._id, {
        name: editName,
        artist: editArtist,
        album: editAlbum,
        category: editCategory,
      });
      onTrackUpdated(updated);
      setEditingTrack(null);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search tracks by title, artist, album..."
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          Showing {filtered.length} of {tracks.length} tracks
        </span>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs text-muted-foreground">
          <thead className="bg-muted text-[11px] uppercase tracking-wider font-semibold text-foreground border-b border-border">
            <tr>
              <th className="py-3 px-4">Artwork</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Artist</th>
              <th className="py-3 px-4">Album</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-center">Streams</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground/70">
                  No tracks found.
                </td>
              </tr>
            ) : (
              filtered.map((track) => (
                <tr key={track._id} className="hover:bg-accent/60 transition-colors">
                  <td className="py-2 px-4">
                    <div className="relative size-10 rounded overflow-hidden bg-muted">
                      <Image
                        src={track.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                        alt={track.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="py-2 px-4 font-semibold text-foreground">{track.name}</td>
                  <td className="py-2 px-4">{track.artist}</td>
                  <td className="py-2 px-4">{track.album || "Single"}</td>
                  <td className="py-2 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-accent text-[10px] uppercase font-bold text-foreground">
                      {track.category}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-center font-mono">
                    {track.playsCount?.toLocaleString() || 0}
                  </td>
                  <td className="py-2 px-4 text-right">
                    {!canEdit && !canDelete ? (
                      <span className="text-[10px] text-muted-foreground/70 font-mono italic">
                        Read-only
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(track)}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title={t("admin.edit")}
                          >
                            <Edit3 className="size-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmModalTrack(track)}
                            disabled={deletingId === track._id}
                            className="p-1.5 rounded hover:bg-destructive/15 text-destructive transition-colors"
                            title={t("admin.delete")}
                          >
                            {deletingId === track._id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmModalTrack}
        title={t("admin.deleteTrack")}
        message={t("admin.confirmDelete")}
        highlight={
          confirmModalTrack ? `${confirmModalTrack.name} by ${confirmModalTrack.artist}` : undefined
        }
        confirmText={t("admin.delete")}
        cancelText={t("admin.cancel")}
        type="danger"
        isLoading={!!deletingId}
        onConfirm={handleDelete}
        onClose={() => setConfirmModalTrack(null)}
      />

      {/* Edit Track Modal */}
      <Overlay
        open={!!editingTrack}
        onClose={() => setEditingTrack(null)}
        label={t("admin.editTrack")}
        className="w-full max-w-md"
      >
        <form
          onSubmit={handleUpdate}
          className="w-full max-w-md bg-card p-6 rounded-2xl border border-border shadow-2xl space-y-4"
        >
          <h3 className="text-base font-bold text-foreground">{t("admin.editTrack")}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-1">Title</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-1">Artist</label>
              <input
                type="text"
                required
                value={editArtist}
                onChange={(e) => setEditArtist(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-1">Album</label>
              <input
                type="text"
                value={editAlbum}
                onChange={(e) => setEditAlbum(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-1">Category / Genre</label>
              <input
                type="text"
                list="genre-options"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
              />
              <datalist id="genre-options">
                {GENRE_NAMES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditingTrack(null)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-foreground bg-muted hover:bg-accent"
            >
              {t("admin.cancel")}
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 rounded-full text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 flex items-center gap-1.5"
            >
              {isUpdating && <Loader2 className="size-3.5 animate-spin" />}
              <span>{t("admin.saveChanges")}</span>
            </button>
          </div>
        </form>
      </Overlay>
    </div>
  );
}

