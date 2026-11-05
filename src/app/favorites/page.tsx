"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { musicService } from "@/services/music.service";
import { MusicTrack } from "@/types/music";
import { firebaseAuth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import {
  Heart,
  Play,
  Pause,
  Search,
  Music2,
  Clock,
  Sparkles,
  Loader2,
  ArrowRight,
  Disc3,
  LogIn,
} from "lucide-react";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loginWithGoogle, isLoading: authLoading } = useAuth();
  const {
    favorites,
    isFavorite,
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

  // Google Sign-In helper
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const userCred = await signInWithPopup(firebaseAuth, googleProvider);
      if (userCred && userCred.user) {
        const fbUser = userCred.user;
        await loginWithGoogle({
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          email: fbUser.email || "",
          imageURL: fbUser.photoURL || undefined,
          user_id: fbUser.uid,
          email_verified: fbUser.emailVerified,
        });
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
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

  // 1. Guard: If not signed in with Google, show Spotify-style login banner
  if (!user && !authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#251538] to-[#121212] border border-purple-500/20 shadow-2xl text-center space-y-6">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-purple-600/30">
            <Heart className="size-10 fill-white" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Songs You Love
            </h1>
            <p className="text-sm text-[#b3b3b3] mt-2 max-w-sm mx-auto">
              Sign in with your Google account to save your favorite songs and stream your personal
              curated collection anytime.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full h-12 rounded-full bg-white hover:bg-gray-100 text-black font-extrabold text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
            >
              {googleLoading ? (
                <Loader2 className="size-5 animate-spin text-black" />
              ) : (
                <>
                  <svg className="size-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign In with Google</span>
                </>
              )}
            </button>

            <Link
              href="/"
              className="inline-block text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors pt-2"
            >
              Explore Public Music First &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24">
      {/* 2. Hero Header - Spotify Liked Songs style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-purple-900/90 via-indigo-950/70 to-[#121212] p-6 sm:p-8 border border-purple-500/20 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Big Playlist Artwork */}
          <div className="relative size-40 sm:size-48 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-900/50 shrink-0">
            <Heart className="size-20 text-white fill-white drop-shadow-md" />
          </div>

          {/* Playlist Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-300">
              PLAYLIST &bull; PERSONAL LIBRARY
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Liked Songs
            </h1>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#b3b3b3]">
              {user?.imageURL && (
                <div className="relative size-5 rounded-full overflow-hidden bg-[#242424]">
                  <Image
                    src={user.imageURL}
                    alt={user.name}
                    fill
                    sizes="20px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <span className="font-bold text-white">{user?.name || "Member"}</span>
              <span>&bull;</span>
              <span className="font-medium text-white">{favoriteTracks.length} songs</span>
              <span>&bull;</span>
              <span className="text-purple-300 font-mono">Google Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Bar: Big Play Button + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayAllFavorites}
            disabled={favoriteTracks.length === 0}
            className={`size-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl ${
              favoriteTracks.length === 0
                ? "bg-[#282828] text-[#727272] cursor-not-allowed"
                : "bg-[#1db954] hover:bg-[#1ed760] text-black shadow-[#1db954]/30"
            }`}
            title={isFavoritesPlaying ? "Pause Favorites" : "Play All Favorites"}
          >
            {isFavoritesPlaying ? (
              <Pause className="size-6 fill-black" />
            ) : (
              <Play className="size-6 fill-black translate-x-0.5" />
            )}
          </button>

          <span className="text-xs font-semibold text-[#b3b3b3]">
            {isFavoritesPlaying ? "Streaming Favorites Queue" : "Play All Liked Songs"}
          </span>
        </div>

        {/* Quick Search */}
        {favoriteTracks.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#b3b3b3]" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search in Liked Songs..."
              className="w-full h-9 pl-9 pr-3 rounded-full bg-[#242424] text-xs text-white placeholder-[#727272] border border-[#383838] focus:border-purple-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* 4. Tracks Content */}
      {loadingTracks ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#b3b3b3]">
          <Loader2 className="size-8 animate-spin text-purple-400 mb-3" />
          <p className="text-xs">Loading your saved tracks...</p>
        </div>
      ) : favoriteTracks.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-[#181818]/50 border border-white/5 space-y-4">
          <div className="size-16 rounded-full bg-[#242424] mx-auto flex items-center justify-center text-[#727272]">
            <Music2 className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No liked songs yet</h3>
            <p className="text-xs text-[#b3b3b3] mt-1 max-w-sm mx-auto">
              Explore the music library or home page and click the heart icon on any song to build
              your personal collection.
            </p>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs transition-transform hover:scale-105 active:scale-95"
          >
            <span>Explore Music Catalog</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#282828] bg-[#181818]/60 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#727272] border-b border-[#282828]">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 sm:col-span-5">Title</div>
            <div className="hidden sm:block sm:col-span-3">Album</div>
            <div className="hidden md:block md:col-span-2">Genre</div>
            <div className="col-span-5 sm:col-span-3 md:col-span-1 text-right flex items-center justify-end pr-2">
              <Clock className="size-3.5" />
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#282828]">
            {displayedTracks.map((track, idx) => {
              const isCurrent = currentTrack?._id === track._id;
              const isTrackPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track._id}
                  onClick={() => playTrack(track, favoriteTracks)}
                  className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs text-[#b3b3b3] hover:bg-white/5 cursor-pointer transition-colors group ${
                    isCurrent ? "bg-purple-900/10 text-white" : ""
                  }`}
                >
                  {/* Track Number / Play button */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="group-hover:hidden font-mono text-[11px]">
                      {isTrackPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 h-full bg-[#1db954] animate-pulse" />
                          <span className="w-0.5 h-2/3 bg-[#1db954] animate-pulse delay-75" />
                          <span className="w-0.5 h-4/5 bg-[#1db954] animate-pulse delay-150" />
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
                      className="hidden group-hover:flex items-center justify-center text-white hover:text-[#1db954]"
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
                    <div className="relative size-10 rounded overflow-hidden bg-[#242424] shrink-0">
                      <Image
                        src={track.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                        alt={track.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-semibold truncate text-xs ${
                          isCurrent ? "text-[#1db954]" : "text-white group-hover:text-white"
                        }`}
                      >
                        {track.name}
                      </p>
                      <p className="text-[11px] text-[#b3b3b3] truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="hidden sm:block sm:col-span-3 truncate text-[#b3b3b3]">
                    {track.album || "Single"}
                  </div>

                  {/* Genre */}
                  <div className="hidden md:block md:col-span-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#242424] text-[10px] uppercase font-bold text-white border border-white/5">
                      {track.category}
                    </span>
                  </div>

                  {/* Heart Toggle + Duration */}
                  <div className="col-span-5 sm:col-span-3 md:col-span-1 flex items-center justify-end gap-3 pr-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track._id);
                      }}
                      className="p-1 rounded text-purple-400 hover:text-purple-300 transition-colors"
                      title="Remove from Liked Songs"
                    >
                      <Heart className="size-4 fill-purple-400 text-purple-400" />
                    </button>
                    <span className="font-mono text-[11px] text-[#727272]">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

