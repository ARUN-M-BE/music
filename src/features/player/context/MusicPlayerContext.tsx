"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { MusicTrack, RepeatMode } from "@/types/music";
import { musicService } from "@/services/music.service";
import { usePersistedState } from "@/shared/hooks/usePersistedState";
import { errorField } from "@/lib/errors";

// Revivers for the two values that must survive a reload.
const DEFAULT_FAVORITES: string[] = [];
const DEFAULT_VOLUME = 0.8;

function reviveFavorites(raw: string): string[] | undefined {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return undefined;
  return parsed.filter((id): id is string => typeof id === "string");
}

function reviveVolume(raw: string): number | undefined {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : undefined;
}

interface MusicPlayerContextType {
  currentTrack: MusicTrack | null;
  currentIndex: number;
  queue: MusicTrack[];
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isMiniPlayer: boolean;
  isQueueOpen: boolean;
  error: string | null;
  favorites: string[];
  
  // Actions
  playTrack: (track: MusicTrack, newQueue?: MusicTrack[]) => void;
  playTrackAtIndex: (index: number) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (time: number) => void;
  setVolumeLevel: (level: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleMiniPlayer: () => void;
  toggleQueue: () => void;
  addToQueue: (track: MusicTrack) => void;
  removeFromQueue: (index: number) => void;
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = usePersistedState<number>(
    "music_volume",
    DEFAULT_VOLUME,
    reviveVolume
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = usePersistedState<string[]>(
    "music_favorites",
    DEFAULT_FAVORITES,
    reviveFavorites
  );

  // Shared single HTMLAudioElement
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Volume and favorites come straight from storage via usePersistedState, so
  // this effect only has to merge the list saved on the user's account.
  useEffect(() => {
    let cancelled = false;

    musicService
      .getUserFavorites()
      .then((serverFavs) => {
        if (cancelled || !serverFavs || serverFavs.length === 0) return;
        setFavorites((prev) => Array.from(new Set([...prev, ...serverFavs])));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [setFavorites]);

  // Initialize and attach listeners to audio element
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError("Failed to stream audio file.");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Sync volume & muted status
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Record play count on backend
  const recordPlayCount = useCallback(async (trackId: string) => {
    if (!trackId) return;
    try {
      await fetch(`/api/songs/${trackId}/play`, { method: "PUT" });
    } catch {
      // Non-critical background telemetry
    }
  }, []);

  // Play track with URL verification and autoplay rejection handling
  const playTrack = useCallback(
    async (track: MusicTrack, newQueue?: MusicTrack[]) => {
      const audioUrl = track?.songURL || track?.streamUrl || track?.previewUrl;
      if (!audioRef.current || !track || !audioUrl) {
        console.warn("Cannot play track without valid audio URL:", track);
        return;
      }

      // Ensure normalized fields for UI
      const normalizedTrack: MusicTrack = {
        ...track,
        songURL: audioUrl,
        name: track.name || track.title || "Unknown Track",
        imageURL: track.imageURL || track.artwork || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60",
      };

      const audio = audioRef.current;
      setError(null);
      setIsLoading(true);

      const trackKey = normalizedTrack._id || normalizedTrack.id || audioUrl;

      if (newQueue) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((t) => (t._id || t.id) === trackKey);
        setCurrentIndex(idx !== -1 ? idx : 0);
      } else if (queue.length === 0) {
        setQueue([normalizedTrack]);
        setCurrentIndex(0);
      } else {
        const idx = queue.findIndex((t) => (t._id || t.id) === trackKey);
        if (idx !== -1) {
          setCurrentIndex(idx);
        } else {
          setQueue((prev) => [...prev, normalizedTrack]);
          setCurrentIndex(queue.length);
        }
      }

      setCurrentTrack(normalizedTrack);

      try {
        if (audio.src !== audioUrl) {
          audio.src = audioUrl;
          audio.load();
        }
        await audio.play();
        setIsPlaying(true);
        if (normalizedTrack._id) {
          recordPlayCount(normalizedTrack._id);
        }
      } catch (err) {
        console.warn("Autoplay restriction or playback error:", err);
        setIsPlaying(false);
        setIsLoading(false);
        if (errorField(err, "name") !== "AbortError") {
          setError("Click play to start audio.");
        }
      }
    },
    [queue, recordPlayCount]
  );

  const playTrackAtIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < queue.length) {
        playTrack(queue[index]);
      }
    },
    [queue, playTrack]
  );

  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Playback resume error:", err);
      }
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playTrack(queue[randomIndex]);
      return;
    }

    const nextIndex = (currentIndex + 1) % queue.length;
    playTrack(queue[nextIndex]);
  }, [queue, currentIndex, isShuffle, playTrack]);

  const previousTrack = useCallback(() => {
    if (queue.length === 0) return;
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    playTrack(queue[prevIndex]);
  }, [queue, currentIndex, currentTime, playTrack]);

  // Handle track ending with repeat logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      } else if (repeatMode === "all" || currentIndex < queue.length - 1) {
        nextTrack();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [repeatMode, currentIndex, queue.length, nextTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && !isNaN(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolumeLevel = useCallback(
    (level: number) => {
      const clamped = Math.max(0, Math.min(1, level));
      setVolume(clamped);
      setIsMuted(clamped === 0);
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev: RepeatMode) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleMiniPlayer = useCallback(() => {
    setIsMiniPlayer((prev) => !prev);
  }, []);

  const toggleQueue = useCallback(() => {
    setIsQueueOpen((prev) => !prev);
  }, []);

  const addToQueue = useCallback((track: MusicTrack) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleFavorite = useCallback(
    (trackId: string) => {
      setFavorites((prev) =>
        prev.includes(trackId)
          ? prev.filter((id) => id !== trackId)
          : [...prev, trackId]
      );

      // Persist to user's MongoDB account
      musicService.toggleUserFavorite(trackId).catch(() => {});
    },
    [setFavorites]
  );

  const isFavorite = useCallback(
    (trackId: string) => favorites.includes(trackId),
    [favorites]
  );

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        currentIndex,
        queue,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffle,
        isMiniPlayer,
        isQueueOpen,
        error,
        favorites,
        playTrack,
        playTrackAtIndex,
        togglePlayPause,
        nextTrack,
        previousTrack,
        seek,
        setVolumeLevel,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        toggleMiniPlayer,
        toggleQueue,
        addToQueue,
        removeFromQueue,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
}

