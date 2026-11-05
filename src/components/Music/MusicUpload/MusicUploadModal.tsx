"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MusicTrack, Album, Artist } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useLanguage } from "@/context/LanguageContext";
import {
  compressImage,
  extractCoverFromAudio,
  parseAudioFilename,
  formatFileSize,
  DEFAULT_COVER_URL,
} from "@/lib/mediaOptimization";
import {
  Upload,
  Music,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Disc,
  Mic2,
  Layers,
} from "lucide-react";

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

  const [albumsList, setAlbumsList] = useState<Album[]>(existingAlbums);
  const [artistsList, setArtistsList] = useState<Artist[]>(existingArtists);

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
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFileId, setImageFileId] = useState("");
  const [imageProgress, setImageProgress] = useState(0);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [compressionRatio, setCompressionRatio] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Sync / Load existing albums and artists
  useEffect(() => {
    if (existingAlbums.length > 0) {
      setAlbumsList(existingAlbums);
    } else {
      musicService.getAlbums().then((data) => setAlbumsList(data || [])).catch(() => {});
    }

    if (existingArtists.length > 0) {
      setArtistsList(existingArtists);
    } else {
      musicService.getArtists().then((data) => setArtistsList(data || [])).catch(() => {});
    }
  }, [existingAlbums, existingArtists]);

  // Handle Audio File Selection, ID3 extraction, and Auto-Upload
  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/") && !file.name.match(/\.(mp3|wav|flac|m4a|aac|ogg)$/i)) {
      setStatusMessage({
        type: "error",
        text: "Please select a valid audio file (MP3, WAV, FLAC, M4A, OGG).",
      });
      return;
    }

    setAudioFile(file);
    setIsProcessingAudio(true);
    setStatusMessage(null);

    // 1. Auto-extract Song Title & Artist from filename if not yet provided
    const parsed = parseAudioFilename(file.name);
    if (!name.trim() && parsed.title) {
      setName(parsed.title);
    }
    if (!artist.trim() && parsed.artist) {
      setArtist(parsed.artist);
    }

    // 2. Extract embedded ID3 cover artwork
    try {
      const extractedCover = await extractCoverFromAudio(file);
      if (extractedCover && !imageUrl) {
        setImageFile(extractedCover);
        setIsCompressingImage(true);
        setCompressionRatio(`Extracted from MP3: ${formatFileSize(extractedCover.size)}`);

        // Upload extracted & compressed cover art to ImageKit
        const imgRes = await musicService.uploadMedia(extractedCover, setImageProgress);
        setImageUrl(imgRes.url);
        setImageFileId(imgRes.fileId);
        setIsCompressingImage(false);
        setStatusMessage({
          type: "info",
          text: `✨ Audio loaded & embedded album art automatically extracted and compressed (${formatFileSize(extractedCover.size)})!`,
        });
      }
    } catch (coverErr) {
      console.warn("Cover extraction skipped:", coverErr);
    }

    // 3. Upload Audio File to ImageKit / R2 Storage
    try {
      const res = await musicService.uploadMedia(file, setAudioProgress);
      setAudioUrl(res.url);
      setAudioFileId(res.fileId);
      setStatusMessage({
        type: "success",
        text: `Audio file (${formatFileSize(file.size)}) uploaded successfully!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Audio upload failed." });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  // Handle Cover Image Selection with Client-Side Canvas Compression
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({
        type: "error",
        text: "Please select an image file (PNG, JPG, WEBP).",
      });
      return;
    }

    setIsCompressingImage(true);
    setStatusMessage(null);

    try {
      const originalSize = file.size;
      // Compress image client-side before sending to ImageKit
      const compressed = await compressImage(file, 1000, 0.75);
      const compressedSize = compressed.size;

      setImageFile(compressed);
      setCompressionRatio(
        `${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${Math.round(
          ((originalSize - compressedSize) / originalSize) * 100
        )}% saved)`
      );

      // Upload compressed image
      const res = await musicService.uploadMedia(compressed, setImageProgress);
      setImageUrl(res.url);
      setImageFileId(res.fileId);
      setStatusMessage({
        type: "success",
        text: `Cover compressed from ${formatFileSize(originalSize)} to ${formatFileSize(
          compressedSize
        )} and uploaded!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Image upload failed." });
    } finally {
      setIsCompressingImage(false);
    }
  };

  // Use Default Cover Artwork
  const handleUseDefaultCover = () => {
    setImageUrl(DEFAULT_COVER_URL);
    setImageFileId(`default_art_${Date.now()}`);
    setImageFile(null);
    setCompressionRatio("Default High-Res Artwork Selected");
    setStatusMessage({
      type: "info",
      text: "Default Spotify-style cover artwork selected.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalImageUrl = imageUrl || DEFAULT_COVER_URL;
    const finalImageId = imageFileId || `cover_${Date.now()}`;

    if (!name.trim() || !artist.trim() || !audioUrl) {
      setStatusMessage({
        type: "error",
        text: "Please enter song title, artist, and upload an audio file.",
      });
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
        imageURL: finalImageUrl,
        fileId: finalImageId,
        songId: audioFileId || `aud_${Date.now()}`,
      });

      setStatusMessage({ type: "success", text: t("admin.successTrackSaved") });
      // Reset form
      setName("");
      setAudioFile(null);
      setAudioUrl("");
      setImageFile(null);
      setImageUrl("");
      setCompressionRatio(null);
      onSuccess(newTrack);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || t("admin.errorSaving") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl bg-[#181818] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5"
    >
      <div className="border-b border-[#282828] pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{t("admin.addNewSong")}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30">
              SMART COMPRESSION &bull; ID3 EXTRACT
            </span>
          </h3>
          <p className="text-xs text-[#b3b3b3] mt-0.5">
            Auto-compress media, extract ID3 cover art, and link existing albums & artists.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold ${
            statusMessage.type === "success"
              ? "bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30"
              : statusMessage.type === "info"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle className="size-4 shrink-0" />
          ) : statusMessage.type === "info" ? (
            <Sparkles className="size-4 shrink-0 text-purple-400" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
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
            placeholder="e.g. Blinding Lights (auto-extracted if audio is selected)"
            className="h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
          />
        </div>

        {/* Existing Artist Select & Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#b3b3b3] flex items-center gap-1">
              <Mic2 className="size-3.5 text-[#1db954]" />
              <span>{t("admin.artistName")} *</span>
            </label>
            <span className="text-[10px] text-[#727272]">
              {artistsList.length} existing in catalog
            </span>
          </div>

          {/* Quick Dropdown for Existing Artists */}
          {artistsList.length > 0 && (
            <select
              value={artistsList.some((a) => a.name === artist) ? artist : ""}
              onChange={(e) => {
                if (e.target.value) setArtist(e.target.value);
              }}
              className="h-9 px-3 rounded-lg bg-[#202020] border border-[#333333] focus:border-[#1db954] text-xs text-white outline-none cursor-pointer"
            >
              <option value="">-- Choose Existing Artist ({artistsList.length}) --</option>
              {artistsList.map((a) => (
                <option key={a._id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          {/* Direct Input */}
          <input
            type="text"
            required
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Or type custom artist..."
            className="h-9 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
          />

          {/* Quick Pills for Top Existing Artists */}
          {artistsList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto scrollbar-none">
              {artistsList.slice(0, 8).map((a) => (
                <button
                  key={a._id}
                  type="button"
                  onClick={() => setArtist(a.name)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    artist === a.name
                      ? "bg-[#1db954]/20 border-[#1db954] text-[#1db954]"
                      : "bg-[#282828] border-[#383838] text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Existing Album Select & Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#b3b3b3] flex items-center gap-1">
              <Disc className="size-3.5 text-purple-400" />
              <span>{t("admin.albumName")}</span>
            </label>
            <span className="text-[10px] text-[#727272]">
              {albumsList.length} existing in catalog
            </span>
          </div>

          {/* Quick Dropdown for Existing Albums */}
          <select
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#202020] border border-[#333333] focus:border-[#1db954] text-xs text-white outline-none cursor-pointer"
          >
            <option value="Single">Single (Standalone Track)</option>
            {albumsList.map((alb) => (
              <option key={alb._id} value={alb.name}>
                {alb.name}
              </option>
            ))}
          </select>

          {/* Direct Input */}
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="Or type custom album..."
            className="h-9 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
          />

          {/* Quick Pills for Top Existing Albums */}
          {albumsList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setAlbum("Single")}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  album === "Single"
                    ? "bg-purple-500/20 border-purple-500 text-purple-300"
                    : "bg-[#282828] border-[#383838] text-[#b3b3b3] hover:text-white"
                }`}
              >
                Single
              </button>
              {albumsList.slice(0, 8).map((alb) => (
                <button
                  key={alb._id}
                  type="button"
                  onClick={() => setAlbum(alb.name)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    album === alb.name
                      ? "bg-purple-500/20 border-purple-500 text-purple-300"
                      : "bg-[#282828] border-[#383838] text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  {alb.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Genre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#b3b3b3]">{t("admin.genre")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none cursor-pointer"
          >
            {[
              "Pop",
              "Rock",
              "Hip Hop",
              "R&B",
              "Electronic",
              "Classical",
              "Jazz",
              "Country",
              "Reggae",
              "Blues",
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
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
            {["English", "Tamil", "Hindi", "Telugu", "Malayalam", "Punjabi", "Arabic"].map(
              (l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Dual File Upload Dropzones with Compression & Extraction */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Audio Upload Box */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#b3b3b3] flex items-center gap-1.5">
              <Music className="size-4 text-[#1db954]" />
              <span>{t("admin.audioFile")} *</span>
            </label>
            {audioFile && (
              <span className="text-[10px] text-[#1db954] font-mono">
                {formatFileSize(audioFile.size)}
              </span>
            )}
          </div>

          <div className="relative border-2 border-dashed border-[#383838] hover:border-[#1db954] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#202020]">
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {isProcessingAudio ? (
              <Loader2 className="size-6 text-[#1db954] animate-spin mb-2" />
            ) : (
              <Upload className="size-6 text-[#b3b3b3] mb-2" />
            )}
            <span className="text-xs font-medium text-white truncate max-w-full">
              {audioFile ? audioFile.name : "Select or drag audio file"}
            </span>
            <span className="text-[10px] text-[#727272] mt-1">
              Auto-extracts title & ID3 cover art
            </span>

            {audioProgress > 0 && audioProgress < 100 && (
              <div className="w-full bg-[#383838] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#1db954] h-full transition-all"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            )}
            {audioUrl && (
              <span className="text-[10px] text-[#1db954] font-semibold mt-2 flex items-center gap-1">
                <CheckCircle className="size-3" /> Audio Ready
              </span>
            )}
          </div>
        </div>

        {/* Artwork Image Upload Box with Client-Side Canvas Compression */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#b3b3b3] flex items-center gap-1.5">
              <ImageIcon className="size-4 text-purple-400" />
              <span>{t("admin.coverImage")}</span>
            </label>
            <button
              type="button"
              onClick={handleUseDefaultCover}
              className="text-[10px] text-purple-400 hover:text-purple-300 underline font-medium"
            >
              Use Default Cover
            </button>
          </div>

          <div className="relative border-2 border-dashed border-[#383838] hover:border-purple-400 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#202020]">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {isCompressingImage ? (
              <Loader2 className="size-6 text-purple-400 animate-spin mb-2" />
            ) : imageUrl ? (
              <div className="relative size-16 rounded-md overflow-hidden mb-1 border border-white/10 shadow-md">
                <Image
                  src={imageUrl}
                  alt="Artwork preview"
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <Upload className="size-6 text-[#b3b3b3] mb-2" />
            )}
            <span className="text-xs font-medium text-white truncate max-w-full">
              {imageFile ? imageFile.name : imageUrl ? "Cover Ready" : "Select or drag cover image"}
            </span>

            {/* Compression Feedback */}
            {compressionRatio && (
              <span className="text-[10px] text-purple-300 font-mono mt-0.5">
                {compressionRatio}
              </span>
            )}

            {!compressionRatio && (
              <span className="text-[10px] text-[#727272] mt-1">
                Auto-compressed to low KB &bull; WebP / JPEG
              </span>
            )}

            {imageProgress > 0 && imageProgress < 100 && (
              <div className="w-full bg-[#383838] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all"
                  style={{ width: `${imageProgress}%` }}
                />
              </div>
            )}
            {imageUrl && (
              <span className="text-[10px] text-purple-400 font-semibold mt-2 flex items-center gap-1">
                <CheckCircle className="size-3" /> Artwork Ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !audioUrl}
        className="w-full h-11 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#383838] text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
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
