"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { UnifiedAlbum, UnifiedSong } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useMusicPlayer } from "@/features/player";
import { formatTime } from "@/lib/utils";
import { mapUnifiedToTrack } from "@/lib/musicMappers";
import { HeroSkeleton, TrackListSkeleton } from "@/shared/skeletons";
import { Reveal } from "@/shared/motion";
import {
  Play,
  Pause,
  Heart,
  Disc3,
  Clock,
  ArrowLeft,
} from "lucide-react";

export default function AlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    toggleFavorite,
    isFavorite,
  } = useMusicPlayer();

  const [loaded, setLoaded] = useState<{
    id: string;
    album: UnifiedAlbum | null;
    songs: UnifiedSong[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    musicService
      .getAlbumDetails(id)
      .then((details) => {
        if (!isMounted) return;
        setLoaded({ id, album: details?.album ?? null, songs: details?.songs ?? [] });
      })
      .catch((err) => {
        console.error("Failed to load album details:", err);
        if (isMounted) setLoaded({ id, album: null, songs: [] });
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Derived, so a new album never shows the previous one's tracklist.
  const loading = loaded?.id !== id;
  const album = loaded?.album ?? null;
  const songs = useMemo(() => loaded?.songs ?? [], [loaded]);
  const playerQueue = useMemo(() => songs.map(mapUnifiedToTrack), [songs]);

  if (loading) {
    return (
      <div className="space-y-8 pb-16" aria-busy="true">
        <HeroSkeleton variant="detail" />
        <TrackListSkeleton rows={8} />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto space-y-4">
        <div className="size-16 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground/70">
          <Disc3 className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Album Not Found</h2>
        <p className="text-xs text-muted-foreground">
          We couldn&apos;t find tracklist details for this album.
        </p>
        <Link
          href="/library"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:scale-105 transition-transform"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Music Library</span>
        </Link>
      </div>
    );
  }

  const isCurrentAlbumPlaying =
    currentTrack &&
    isPlaying &&
    songs.some((s) => (s.id || s._id) === (currentTrack.id || currentTrack._id));

  const handlePlayAlbum = () => {
    if (songs.length === 0) return;
    if (isCurrentAlbumPlaying) {
      togglePlayPause();
    } else {
      playTrack(playerQueue[0], playerQueue);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        <span>Back to Library</span>
      </Link>

      {/* Album Header */}
      <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-scrim/5 sm:p-10">
        <div className="brand-glow absolute inset-0" aria-hidden />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
          <div className="relative size-44 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-2xl ring-1 ring-border sm:size-56 md:size-64">
            <Image
              src={album.artwork || "/default-song.png"}
              alt={album.title}
              fill
              sizes="256px"
              priority
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1">
            <span className="text-xs uppercase tracking-widest font-bold text-primary">
              Album Release
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-semibold text-foreground tracking-tight">
              {album.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-muted-foreground">
              <Link
                href={`/artist/${encodeURIComponent(album.artist)}`}
                className="font-bold text-foreground hover:underline hover:text-primary transition-colors"
              >
                {album.artist}
              </Link>
              <span>&bull;</span>
              <span>{album.releaseYear || 2024}</span>
              <span>&bull;</span>
              <span>{songs.length} songs</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="relative mt-8 flex items-center justify-center gap-4 border-t border-border pt-4 sm:justify-start">
          <button
            onClick={handlePlayAlbum}
            disabled={songs.length === 0}
            className="flex items-center gap-3 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 hover:bg-primary/90 active:scale-95"
          >
            {isCurrentAlbumPlaying ? (
              <>
                <Pause className="size-5 fill-current" />
                <span>Pause Album</span>
              </>
            ) : (
              <>
                <Play className="size-5 fill-current" />
                <span>Play Album</span>
              </>
            )}
          </button>
        </div>
      </Reveal>

      {/* Album Tracks Table */}
      <section className="space-y-4">
        <Reveal delay={0.08} className="rounded-2xl bg-card/60 border border-border overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm text-muted-foreground">
            <thead className="bg-background uppercase tracking-wider text-[11px] text-muted-foreground/70 border-b border-border">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden sm:table-cell">Artist</th>
                <th className="py-3 px-4 text-right pr-6">
                  <Clock className="size-4 inline" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {songs.map((song, idx) => {
                const songId = song.id || song._id || `album_song_${idx}`;
                const isSelected =
                  currentTrack &&
                  (currentTrack.id === songId || currentTrack._id === songId);
                const isTrackPlaying = isSelected && isPlaying;
                const favorited = isFavorite(songId);

                return (
                  <tr
                    key={songId}
                    onClick={() => playTrack(mapUnifiedToTrack(song), playerQueue)}
                    className="hover:bg-accent/60 group cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-muted-foreground/70 group-hover:text-foreground">
                      {isTrackPlaying ? (
                        <div className="size-4 mx-auto text-primary flex items-center justify-center">
                          <span className="animate-pulse font-bold">&bull;&bull;&bull;</span>
                        </div>
                      ) : (
                        <span className="group-hover:hidden">{idx + 1}</span>
                      )}
                      <Play className="size-3.5 fill-current text-foreground mx-auto hidden group-hover:block" />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 rounded overflow-hidden shrink-0 bg-muted">
                          <Image
                            src={song.artwork || album.artwork || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"}
                            alt={song.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`font-semibold truncate ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {song.title}
                          </p>
                          <p className="text-xs text-muted-foreground/70 truncate sm:hidden">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground truncate max-w-xs">
                      <Link
                        href={`/artist/${encodeURIComponent(song.artist)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline hover:text-foreground"
                      >
                        {song.artist}
                      </Link>
                    </td>

                    <td className="py-3 px-4 text-right pr-6 text-xs text-muted-foreground/70">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(songId);
                          }}
                          className="p-1 hover:text-foreground transition-colors"
                        >
                          <Heart
                            className={`size-4 ${
                              favorited ? "fill-primary text-primary" : "text-muted-foreground/70"
                            }`}
                          />
                        </button>
                        <span>{formatTime(song.duration || 210)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Reveal>
      </section>
    </div>
  );
}

