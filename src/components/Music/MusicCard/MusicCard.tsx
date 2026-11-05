"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MusicTrack } from "@/types/music";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { Play, Pause, Heart, Clock } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

interface MusicCardProps {
  track: MusicTrack;
  queueContext?: MusicTrack[];
  className?: string;
}

export function MusicCard({ track, queueContext, className }: MusicCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, toggleFavorite, isFavorite } =
    useMusicPlayer();

  const trackKey = track._id || track.id || "";
  const trackTitle = track.name || track.title || "Unknown Song";
  const trackImage =
    track.imageURL ||
    track.artwork ||
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60";
  const trackDuration = typeof track.duration === "number" ? track.duration : parseInt(track.duration as any || "0", 10);

  const isCurrent =
    (currentTrack?._id && currentTrack._id === trackKey) ||
    (currentTrack?.id && currentTrack.id === trackKey) ||
    (currentTrack?.name === trackTitle && currentTrack?.artist === track.artist);

  const isThisPlaying = isCurrent && isPlaying;
  const favorited = isFavorite(trackKey);

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, queueContext);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(trackKey);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col p-3 rounded-2xl bg-[#181818] hover:bg-[#242424] transition-all duration-300 cursor-pointer border border-transparent hover:border-white/10 shadow-lg hover:shadow-2xl select-none",
        isCurrent && "border-[#1db954]/50 bg-[#222222]",
        className
      )}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#242424] shadow-md">
        <Image
          src={trackImage}
          alt={trackTitle}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          unoptimized
        />

        {/* Language or Category Pill */}
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          {track.language && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider">
              {track.language}
            </span>
          )}
          {track.releaseYear && (
            <span className="px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-medium text-white/80">
              {track.releaseYear}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          aria-label="Favorite"
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all text-white hover:text-red-500"
        >
          <Heart className={cn("size-3.5", favorited ? "fill-red-500 text-red-500" : "text-white")} />
        </button>

        {/* Play/Pause Overlay Button */}
        <div
          className={cn(
            "absolute right-3 bottom-3 z-10 flex size-11 items-center justify-center rounded-full bg-[#1db954] text-black shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#1ed760]",
            isThisPlaying
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0"
          )}
        >
          {isThisPlaying ? (
            <Pause className="size-5 fill-black" />
          ) : (
            <Play className="size-5 fill-black ml-0.5" />
          )}
        </div>

        {/* Playing Sound Wave Indicator */}
        {isThisPlaying && (
          <div className="absolute left-3 bottom-3 flex items-end gap-0.5 bg-black/70 backdrop-blur-md p-1.5 rounded-md">
            <span className="w-1 bg-[#1db954] rounded-full animate-wave-1 h-3" />
            <span className="w-1 bg-[#1db954] rounded-full animate-wave-2 h-4" />
            <span className="w-1 bg-[#1db954] rounded-full animate-wave-3 h-2" />
            <span className="w-1 bg-[#1db954] rounded-full animate-wave-4 h-3.5" />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-3 flex flex-col flex-1 justify-between">
        <div>
          <h4
            className={cn(
              "font-bold text-sm truncate text-white transition-colors",
              isCurrent && "text-[#1db954]"
            )}
            title={trackTitle}
          >
            {trackTitle}
          </h4>
          <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
            <Link
              href={`/artist/${encodeURIComponent(track.artist)}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline hover:text-white"
            >
              {track.artist}
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#727272] mt-2 pt-1 border-t border-white/5">
          <Link
            href={`/album/${encodeURIComponent(track.album || "Single")}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate max-w-[65%] hover:underline hover:text-[#b3b3b3]"
          >
            {track.album || "Single"}
          </Link>
          {trackDuration > 0 ? (
            <span className="shrink-0">{formatTime(trackDuration)}</span>
          ) : (
            <span>{track.playsCount || 0} plays</span>
          )}
        </div>
      </div>
    </div>
  );
}


