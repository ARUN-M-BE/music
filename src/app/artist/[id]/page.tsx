"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { UnifiedArtist, UnifiedSong } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useMusicPlayer } from "@/features/player";
import { formatTime } from "@/lib/utils";
import { mapUnifiedToTrack } from "@/lib/musicMappers";
import { HeroSkeleton, TrackListSkeleton } from "@/shared/skeletons";
import { Reveal, Stagger, StaggerItem } from "@/shared/motion";
import {
  Play,
  Pause,
  Heart,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from "lucide-react";

export default function ArtistDetailPage({
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
    artist: UnifiedArtist | null;
    songs: UnifiedSong[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    musicService
      .getArtistProfile(id)
      .then((profile) => {
        if (!isMounted) return;
        setLoaded({ id, artist: profile?.artist ?? null, songs: profile?.songs ?? [] });
      })
      .catch((err) => {
        console.error("Failed to load artist profile:", err);
        if (isMounted) setLoaded({ id, artist: null, songs: [] });
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Derived, so switching artists never flashes the previous profile.
  const loading = loaded?.id !== id;
  const artist = loaded?.artist ?? null;
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

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto space-y-4">
        <div className="size-16 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground/70">
          <Users className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Artist Not Found</h2>
        <p className="text-xs text-muted-foreground">
          We couldn&apos;t find discography details for this artist.
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

  const isCurrentArtistPlaying =
    currentTrack &&
    isPlaying &&
    songs.some((s) => (s.id || s._id) === (currentTrack.id || currentTrack._id));

  const handlePlayArtist = () => {
    if (songs.length === 0) return;
    if (isCurrentArtistPlaying) {
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

      {/* Artist Hero Header */}
      <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-scrim/5 sm:p-10">
        <div className="brand-glow absolute inset-0" aria-hidden />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
          <div className="relative size-36 shrink-0 overflow-hidden rounded-full bg-muted shadow-2xl ring-4 ring-border sm:size-48 md:size-56">
            <Image
              src={artist.image || "/default-avatar.png"}
              alt={artist.name}
              fill
              sizes="224px"
              priority
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary uppercase tracking-wider">
              <CheckCircle2 className="size-3.5" />
              <span>Verified Artist</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-semibold text-foreground tracking-tight">
              {artist.name}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl line-clamp-2">
              {artist.bio || `Top streaming artist on Good Music with ${songs.length} verified songs.`}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground font-medium pt-1">
              <span>{artist.followerCount?.toLocaleString() || "350,000"} monthly listeners</span>
              <span>&bull;</span>
              <span>{songs.length} Tracks Available</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="relative mt-8 flex items-center justify-center gap-4 border-t border-border pt-4 sm:justify-start">
          <button
            onClick={handlePlayArtist}
            disabled={songs.length === 0}
            className="flex items-center gap-3 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 hover:bg-primary/90 active:scale-95"
          >
            {isCurrentArtistPlaying ? (
              <>
                <Pause className="size-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-5 fill-current" />
                <span>Play Discography</span>
              </>
            )}
          </button>
        </div>
      </Reveal>

      {/* Popular Tracks Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Popular Tracks
          </h2>
          <span className="text-xs text-muted-foreground/70">{songs.length} songs</span>
        </div>

        <Reveal delay={0.08} className="rounded-2xl bg-card/60 border border-border overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm text-muted-foreground">
            <thead className="bg-background uppercase tracking-wider text-[11px] text-muted-foreground/70 border-b border-border">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden md:table-cell">Album</th>
                <th className="py-3 px-4 hidden sm:table-cell">Language</th>
                <th className="py-3 px-4 text-right pr-6">
                  <Clock className="size-4 inline" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {songs.map((song, idx) => {
                const songId = song.id || song._id || `song_${idx}`;
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
                            src={song.artwork || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"}
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
                          <p className="text-xs text-muted-foreground/70 truncate">{song.artist}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground truncate max-w-xs">
                      {song.album || "Single"}
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground/70">
                      <span className="px-2 py-0.5 rounded-full bg-foreground/5 text-[11px]">
                        {song.language || "Global"}
                      </span>
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

      {/* Albums Section */}
      {artist.albums && artist.albums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Discography & Albums
          </h2>
          <Stagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" gap={0.04}>
            {artist.albums.map((album) => (
              <StaggerItem key={album.id}>
              <Link
                key={album.id}
                href={`/album/${encodeURIComponent(album.title)}`}
                className="group p-3.5 rounded-2xl bg-card border border-border hover:bg-muted transition-all duration-300 flex flex-col space-y-3 cursor-pointer shadow-lg"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-accent">
                  <Image
                    src={album.artwork || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"}
                    alt={album.title}
                    fill
                    sizes="200px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-scrim/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xl">
                      <Play className="size-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {album.title}
                  </h3>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {album.releaseYear || "Album"} &bull; {album.artist}
                  </p>
                </div>
              </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  );
}

