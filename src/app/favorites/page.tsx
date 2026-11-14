"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { useMusicPlayer } from "@/features/player";
import { musicService } from "@/services/music.service";
import { MusicTrack } from "@/types/music";
import { signInWithGoogle } from "@/lib/firebase";
import { errorMessage } from "@/lib/errors";
import {
  Heart,
  Play,
  Pause,
  Search,
  Music2,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { TrackListSkeleton } from "@/shared/skeletons";
import { Reveal } from "@/shared/motion";

export default function FavoritesPage() {
  const { user, loginWithGoogle, isLoading: authLoading } = useAuth();
  const {
    favorites,
    toggleFavorite,
    playTrack,
    currentTrack,
    isPlaying,
    togglePlayPause,
  } = useMusicPlayer();

  const [allTracks, setAllTracks] = useState<MusicTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState<boolean>(true);
  const [filterText, setFilterText] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Load all tracks once to match favorite IDs
  useEffect(() => {
    let isMounted = true;
    musicService
      .getSongs()
      .then((data) => {
        if (isMounted) {
          setAllTracks(data || []);
          setLoadingTracks(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch tracks:", err);
        if (isMounted) setLoadingTracks(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter tracks that are in the user's favorites list
  const favoriteTracks = useMemo(() => {
    return allTracks.filter((track) => favorites.includes(track._id));
  }, [allTracks, favorites]);

  // Apply search query within favorites
  const displayedTracks = useMemo(() => {
    if (!filterText.trim()) return favoriteTracks;
    const q = filterText.toLowerCase();
    return favoriteTracks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [favoriteTracks, filterText]);

  // Check if currently playing a song from this favorites playlist
  const isFavoritesPlaying = useMemo(() => {
    if (!currentTrack || !isPlaying) return false;
    return favorites.includes(currentTrack._id);
  }, [currentTrack, isPlaying, favorites]);

  // Handle Play All / Pause All for Favorites
  const handlePlayAllFavorites = () => {
    if (favoriteTracks.length === 0) return;

    if (isFavoritesPlaying) {
      togglePlayPause();
    } else {
      // If current track is already in favorites, resume or restart it, else play first track
      const startIndex = currentTrack
        ? favoriteTracks.findIndex((t) => t._id === currentTrack._id)
        : 0;
      const trackToPlay = startIndex !== -1 ? favoriteTracks[startIndex] : favoriteTracks[0];
      // Setting queue to only favoriteTracks so player iterates only user's favorite songs
      playTrack(trackToPlay, favoriteTracks);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const idToken = await signInWithGoogle();
      await loginWithGoogle(idToken);
    } catch (err) {
      console.error("Google sign in error:", err);
      setGoogleError(errorMessage(err, "Failed to sign in with Google."));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Format track duration mm:ss
  const formatDuration = (seconds?: number | string) => {
    if (!seconds) return "3:30";
    const sec = typeof seconds === "string" ? parseInt(seconds, 10) : seconds;
    if (isNaN(sec)) return "3:30";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 1. Guard: signed-out visitors get a focused sign-in card.
  if (!user && !authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-2xl shadow-scrim/5 sm:p-10">
          <div className="brand-glow pointer-events-none absolute inset-0" aria-hidden />

          <div className="relative space-y-6">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-4 via-primary to-chart-5 text-scrim-foreground shadow-xl shadow-primary/25">
              <Heart className="size-10 fill-current" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Songs you love
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                Sign in with your Google account to save favorite songs and stream your personal
                collection anywhere.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <Button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                size="lg"
                className="h-12 w-full gap-3 rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90"
              >
                {googleLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </Button>

              {googleError && (
                <p className="text-[11px] leading-relaxed text-destructive">{googleError}</p>
              )}

              <Button asChild variant="link" size="sm" className="text-xs text-muted-foreground">
                <Link href="/">
                  Explore public music first
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
        <div className="brand-glow absolute inset-0" aria-hidden />
        <div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-end sm:gap-8 sm:p-8">
          <div className="relative flex size-40 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-4 via-primary to-chart-5 text-scrim-foreground shadow-2xl shadow-primary/20 sm:size-48">
            <Heart className="size-20 fill-current drop-shadow-md" />
          </div>

          <div className="flex flex-col items-center space-y-2 text-center sm:items-start sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Playlist &middot; Personal library
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Liked songs
            </h1>
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <div className="relative size-5 overflow-hidden rounded-full bg-muted">
                <Image
                  src={user?.imageURL || "/default-avatar.png"}
                  alt={user?.name || "Member"}
                  fill
                  sizes="20px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="font-semibold text-foreground">{user?.name || "Member"}</span>
              <span>&bull;</span>
              <span className="font-medium text-foreground">{favoriteTracks.length} songs</span>
              <span>&bull;</span>
              <span className="font-mono text-primary">Google synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center justify-between gap-4 px-1 sm:flex-row">
        <div className="flex items-center gap-4">
          <Button
            size="icon-lg"
            onClick={handlePlayAllFavorites}
            disabled={favoriteTracks.length === 0}
            aria-label={isFavoritesPlaying ? "Pause favorites" : "Play all favorites"}
            className="size-14 rounded-full shadow-xl shadow-primary/30"
          >
            {isFavoritesPlaying ? (
              <Pause className="size-6 fill-current" />
            ) : (
              <Play className="size-6 translate-x-0.5 fill-current" />
            )}
          </Button>

          <span className="text-xs font-medium text-muted-foreground">
            {isFavoritesPlaying ? "Streaming favorites queue" : "Play all liked songs"}
          </span>
        </div>

        {favoriteTracks.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search in liked songs..."
              aria-label="Search within liked songs"
              className="h-10 rounded-full border-border bg-muted pl-9 text-xs shadow-none"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loadingTracks ? (
        <TrackListSkeleton rows={6} />
      ) : favoriteTracks.length === 0 ? (
        <div className="space-y-4 rounded-3xl border border-dashed border-border bg-card/50 px-4 py-20 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Music2 className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">No liked songs yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Explore the library or home page and tap the heart on any song to build your personal
              collection.
            </p>
          </div>
          <Button asChild className="rounded-full px-6">
            <Link href="/library">
              Explore catalog
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <Reveal className="overflow-hidden rounded-2xl border border-border bg-card/60">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 sm:col-span-5">Title</div>
            <div className="hidden sm:block sm:col-span-3">Album</div>
            <div className="hidden md:block md:col-span-2">Genre</div>
            <div className="col-span-5 sm:col-span-3 md:col-span-1 text-right flex items-center justify-end pr-2">
              <Clock className="size-3.5" />
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border">
            {displayedTracks.map((track, idx) => {
              const isCurrent = currentTrack?._id === track._id;
              const isTrackPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track._id}
                  onClick={() => playTrack(track, favoriteTracks)}
                  className={`group grid cursor-pointer grid-cols-12 items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent/60 ${
                    isCurrent ? "bg-primary/10" : ""
                  }`}
                >
                  {/* Track Number / Play button */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="font-mono text-[11px] tabular-nums group-hover:hidden">
                      {isTrackPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 h-full bg-primary animate-pulse" />
                          <span className="w-0.5 h-2/3 bg-primary animate-pulse delay-75" />
                          <span className="w-0.5 h-4/5 bg-primary animate-pulse delay-150" />
                        </div>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) {
                          togglePlayPause();
                        } else {
                          playTrack(track, favoriteTracks);
                        }
                      }}
                      className="hidden items-center justify-center text-foreground hover:text-primary group-hover:flex"
                      aria-label={isTrackPlaying ? "Pause" : "Play"}
                    >
                      {isTrackPlaying ? (
                        <Pause className="size-3.5 fill-current" />
                      ) : (
                        <Play className="size-3.5 fill-current" />
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={track.imageURL || "/default-song.png"}
                        alt={track.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-xs font-semibold ${
                          isCurrent ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {track.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="hidden sm:block sm:col-span-3 truncate text-muted-foreground">
                    {track.album || "Single"}
                  </div>

                  {/* Genre */}
                  <div className="hidden md:block md:col-span-2">
                    <Badge variant="secondary" className="rounded-full text-[10px] font-semibold uppercase">
                      {track.category}
                    </Badge>
                  </div>

                  {/* Heart Toggle + Duration */}
                  <div className="col-span-5 sm:col-span-3 md:col-span-1 flex items-center justify-end gap-3 pr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        toggleFavorite(track._id);
                      }}
                      className="size-7 rounded-full text-destructive hover:text-destructive/80"
                      title="Remove from liked songs"
                      aria-label="Remove from liked songs"
                    >
                      <Heart className="size-4 fill-current" />
                    </Button>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      )}
    </div>
  );
}

