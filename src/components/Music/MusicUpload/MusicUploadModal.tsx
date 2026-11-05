"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MusicTrack, Album, Artist } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useLanguage } from "@/context/LanguageContext";
import { Upload, Music, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface MusicUploadModalProps {
  onSuccess: (track: MusicTrack) => void;
  existingAlbums?: Album[];
  existingArtists?: Artist[];
}

export function MusicUploadModal({
  onSuccess,
  existingAlbums = [],
  existingArtists = [],
}: MusicUploadModalProps) {
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("Single");
  const [category, setCategory] = useState("Pop");
  const [language, setLanguage] = useState("English");

  // Files & URLs
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFileId, setAudioFileId] = useState("");
  const [audioProgress, setAudioProgress] = useState(0);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFileId, setImageFileId] = useState("");
  const [imageProgress, setImageProgress] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle Audio File Selection & Upload
  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setStatusMessage({ type: "error", text: "Please select a valid audio file (MP3, WAV, FLAC, M4A)." });
      return;
    }

    setAudioFile(file);
    try {
      const res = await musicService.uploadMedia(file, setAudioProgress);
      setAudioUrl(res.url);
      setAudioFileId(res.fileId);
      setStatusMessage({ type: "success", text: "Audio file uploaded successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Audio upload failed." });
    }
  };

  // Handle Cover Image Selection & Upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please select an image file (PNG, JPG, WEBP)." });
      return;
    }

    setImageFile(file);
    try {
      const res = await musicService.uploadMedia(file, setImageProgress);
      setImageUrl(res.url);
      setImageFileId(res.fileId);
      setStatusMessage({ type: "success", text: "Cover artwork uploaded successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Image upload failed." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !artist.trim() || !audioUrl || !imageUrl) {
      setStatusMessage({ type: "error", text: "Please fill in all required fields and upload both audio and artwork." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const newTrack = await musicService.saveSong({
        name: name.trim(),
        artist: artist.trim(),
        album: album.trim() || "Single",
        category,
        language,
        songURL: audioUrl,
        imageURL: imageUrl,
        fileId: imageFileId || `img_${Date.now()}`,
        songId: audioFileId || `aud_${Date.now()}`,
      });

      setStatusMessage({ type: "success", text: t("admin.successTrackSaved") });
      // Reset form
      setName("");
      setAudioFile(null);
      setAudioUrl("");
      setImageFile(null);
      setImageUrl("");
      onSuccess(newTrack);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || t("admin.errorSaving") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-[#181818] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5">
      <div className="border-b border-[#282828] pb-3">
        <h3 className="text-lg font-bold text-white">{t("admin.addNewSong")}</h3>
        <p className="text-xs text-[#b3b3b3] mt-0.5">Upload new audio track, cover art, and publish to the streaming catalog.</p>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold ${
            statusMessage.type === "success"
              ? "bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Track Title */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-[#b3b3b3]">{t("admin.songTitle")} *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Blinding Lights"
            className="h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
          />
        </div>

        {/* Artist */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#b3b3b3]">{t("admin.artistName")} *</label>
          <input
            type="text"
            required
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. The Weeknd"
            list="artists-datalist"
            className="h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
          />
          <datalist id="artists-datalist">
            {existingArtists.map((a) => (
              <option key={a._id} value={a.name} />
            ))}
          </datalist>
        </div>

        {/* Album */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#b3b3b3]">{t("admin.albumName")}</label>
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="e.g. After Hours"
            list="albums-datalist"
            className="h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
          />
          <datalist id="albums-datalist">
            {existingAlbums.map((alb) => (
              <option key={alb._id} value={alb.name} />
            ))}
          </datalist>
        </div>

        {/* Genre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#b3b3b3]">{t("admin.genre")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none cursor-pointer"
          >
            {["Pop", "Rock", "Hip Hop", "R&B", "Electronic", "Classical", "Jazz", "Country", "Reggae", "Blues"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#b3b3b3]">{t("admin.language")}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none cursor-pointer"
          >
            {["English", "Tamil", "Hindi", "Telugu", "Malayalam", "Punjabi", "Arabic"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dual File Upload Dropzones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Audio Upload Box */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[#b3b3b3] flex items-center gap-1.5">
            <Music className="size-4 text-[#1db954]" />
            <span>{t("admin.audioFile")} *</span>
          </label>
          <div className="relative border-2 border-dashed border-[#383838] hover:border-[#1db954] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#202020]">
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="size-6 text-[#b3b3b3] mb-2" />
            <span className="text-xs font-medium text-white truncate max-w-full">
              {audioFile ? audioFile.name : "Select or drag audio file"}
            </span>
            <span className="text-[10px] text-[#727272] mt-1">MP3, WAV, FLAC up to 50MB</span>
            {audioProgress > 0 && audioProgress < 100 && (
              <div className="w-full bg-[#383838] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#1db954] h-full transition-all" style={{ width: `${audioProgress}%` }} />
              </div>
            )}
            {audioUrl && (
              <span className="text-[10px] text-[#1db954] font-semibold mt-2 flex items-center gap-1">
                <CheckCircle className="size-3" /> Ready
              </span>
            )}
          </div>
        </div>

        {/* Artwork Image Upload Box */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[#b3b3b3] flex items-center gap-1.5">
            <ImageIcon className="size-4 text-purple-400" />
            <span>{t("admin.coverImage")} *</span>
          </label>
          <div className="relative border-2 border-dashed border-[#383838] hover:border-purple-400 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#202020]">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {imageUrl ? (
              <div className="relative size-16 rounded-md overflow-hidden mb-1">
                <Image src={imageUrl} alt="Artwork preview" fill sizes="64px" className="object-cover" unoptimized />
              </div>
            ) : (
              <Upload className="size-6 text-[#b3b3b3] mb-2" />
            )}
            <span className="text-xs font-medium text-white truncate max-w-full">
              {imageFile ? imageFile.name : "Select or drag image cover"}
            </span>
            <span className="text-[10px] text-[#727272] mt-1">PNG, JPG, WEBP up to 5MB</span>
            {imageProgress > 0 && imageProgress < 100 && (
              <div className="w-full bg-[#383838] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-500 h-full transition-all" style={{ width: `${imageProgress}%` }} />
              </div>
            )}
            {imageUrl && (
              <span className="text-[10px] text-purple-400 font-semibold mt-2 flex items-center gap-1">
                <CheckCircle className="size-3" /> Ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !audioUrl || !imageUrl}
        className="w-full h-11 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#383838] text-black font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin text-black" />
            <span>Publishing to Catalog...</span>
          </>
        ) : (
          <span>{t("admin.saveTrack")}</span>
        )}
      </button>
    </form>
  );
}

