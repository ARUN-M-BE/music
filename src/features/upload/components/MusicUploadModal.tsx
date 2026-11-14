"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MusicTrack, Album, Artist } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useLanguage } from "@/shared/providers/LanguageContext";
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
} from "lucide-react";
import { GENRE_NAMES } from "@/constants/categories";
import { errorMessage } from "@/lib/errors";

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

  // Fallback catalog lists, fetched only when the parent does not pass them.
  const [fetchedAlbums, setFetchedAlbums] = useState<Album[]>([]);
  const [fetchedArtists, setFetchedArtists] = useState<Artist[]>([]);
  const hasAlbumsProp = existingAlbums.length > 0;
  const hasArtistsProp = existingArtists.length > 0;

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
    if (hasAlbumsProp) return;

    let isMounted = true;
    musicService
      .getAlbums()
      .then((data) => {
        if (isMounted) setFetchedAlbums(data || []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [hasAlbumsProp]);

  useEffect(() => {
    if (hasArtistsProp) return;

    let isMounted = true;
    musicService
      .getArtists()
      .then((data) => {
        if (isMounted) setFetchedArtists(data || []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [hasArtistsProp]);

  const albumsList = hasAlbumsProp ? existingAlbums : fetchedAlbums;
  const artistsList = hasArtistsProp ? existingArtists : fetchedArtists;

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
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: errorMessage(err, "Audio upload failed."),
      });
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
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: errorMessage(err, "Image upload failed."),
      });
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
    } catch (err) {
      setStatusMessage({ type: "error", text: errorMessage(err, t("admin.errorSaving")) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl bg-card p-6 rounded-2xl border border-border shadow-2xl space-y-5"
    >
      <div className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>{t("admin.addNewSong")}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              SMART COMPRESSION &bull; ID3 EXTRACT
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-compress media, extract ID3 cover art, and link existing albums & artists.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold ${
            statusMessage.type === "success"
              ? "bg-primary/15 text-primary border border-primary/30"
              : statusMessage.type === "info"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-destructive/15 text-destructive border border-destructive/30"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle className="size-4 shrink-0" />
          ) : statusMessage.type === "info" ? (
            <Sparkles className="size-4 shrink-0 text-primary" />
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
          <label className="text-xs font-medium text-muted-foreground">{t("admin.songTitle")} *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Blinding Lights (auto-extracted if audio is selected)"
            className="h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
          />
        </div>

        {/* Existing Artist Select & Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Mic2 className="size-3.5 text-primary" />
              <span>{t("admin.artistName")} *</span>
            </label>
            <span className="text-[10px] text-muted-foreground/70">
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
              className="h-9 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none cursor-pointer"
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
            className="h-9 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
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
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-accent border-border text-muted-foreground hover:text-foreground"
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
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Disc className="size-3.5 text-primary" />
              <span>{t("admin.albumName")}</span>
            </label>
            <span className="text-[10px] text-muted-foreground/70">
              {albumsList.length} existing in catalog
            </span>
          </div>

          {/* Quick Dropdown for Existing Albums */}
          <select
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            className="h-9 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none cursor-pointer"
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
            className="h-9 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none"
          />

          {/* Quick Pills for Top Existing Albums */}
          {albumsList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setAlbum("Single")}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  album === "Single"
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-accent border-border text-muted-foreground hover:text-foreground"
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
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-accent border-border text-muted-foreground hover:text-foreground"
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
          <label className="text-xs font-medium text-muted-foreground">{t("admin.genre")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none cursor-pointer"
          >
            {GENRE_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("admin.language")}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-10 px-3 rounded-lg bg-muted border border-border focus:border-primary text-xs text-foreground outline-none cursor-pointer"
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
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Music className="size-4 text-primary" />
              <span>{t("admin.audioFile")} *</span>
            </label>
            {audioFile && (
              <span className="text-[10px] text-primary font-mono">
                {formatFileSize(audioFile.size)}
              </span>
            )}
          </div>

          <div className="relative border-2 border-dashed border-border hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-muted">
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {isProcessingAudio ? (
              <Loader2 className="size-6 text-primary animate-spin mb-2" />
            ) : (
              <Upload className="size-6 text-muted-foreground mb-2" />
            )}
            <span className="text-xs font-medium text-foreground truncate max-w-full">
              {audioFile ? audioFile.name : "Select or drag audio file"}
            </span>
            <span className="text-[10px] text-muted-foreground/70 mt-1">
              Auto-extracts title & ID3 cover art
            </span>

            {audioProgress > 0 && audioProgress < 100 && (
              <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            )}
            {audioUrl && (
              <span className="text-[10px] text-primary font-semibold mt-2 flex items-center gap-1">
                <CheckCircle className="size-3" /> Audio Ready
              </span>
            )}
          </div>
        </div>

        {/* Artwork Image Upload Box with Client-Side Canvas Compression */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="size-4 text-primary" />
              <span>{t("admin.coverImage")}</span>
            </label>
            <button
              type="button"
              onClick={handleUseDefaultCover}
              className="text-[10px] text-primary hover:opacity-80 underline font-medium"
            >
              Use Default Cover
            </button>
          </div>

          <div className="relative border-2 border-dashed border-border hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-muted">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {isCompressingImage ? (
              <Loader2 className="size-6 text-primary animate-spin mb-2" />
            ) : imageUrl ? (
              <div className="relative size-16 rounded-md overflow-hidden mb-1 border border-border shadow-md">
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
              <Upload className="size-6 text-muted-foreground mb-2" />
            )}
            <span className="text-xs font-medium text-foreground truncate max-w-full">
              {imageFile ? imageFile.name : imageUrl ? "Cover Ready" : "Select or drag cover image"}
            </span>

            {/* Compression Feedback */}
            {compressionRatio && (
              <span className="text-[10px] text-primary font-mono mt-0.5">
                {compressionRatio}
              </span>
            )}

            {!compressionRatio && (
              <span className="text-[10px] text-muted-foreground/70 mt-1">
                Auto-compressed to low KB &bull; WebP / JPEG
              </span>
            )}

            {imageProgress > 0 && imageProgress < 100 && (
              <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${imageProgress}%` }}
                />
              </div>
            )}
            {imageUrl && (
              <span className="text-[10px] text-primary font-semibold mt-2 flex items-center gap-1">
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
        className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 disabled:bg-border text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin text-primary-foreground" />
            <span>Publishing to Catalog...</span>
          </>
        ) : (
          <span>{t("admin.saveTrack")}</span>
        )}
      </button>
    </form>
  );
}
