"use client";

import React from "react";
import Image from "next/image";
import { MusicTrack } from "@/types/music";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { Play, Pause, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicCardProps {
  track: MusicTrack;
  queueContext?: MusicTrack[];
  className?: string;
}

export function MusicCard({ track, queueContext, className }: MusicCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, toggleFavorite, isFavorite } =
    useMusicPlayer();

  const isCurrent = currentTrack?._id === track._id;
  const isThisPlaying = isCurrent && isPlaying;
  const favorited = isFavorite(track._id);

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, queueContext);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track._id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col p-3 rounded-xl bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer border border-transparent hover:border-white/10 shadow-lg hover:shadow-2xl",
        isCurrent && "border-green-500/50 bg-[#222222]",
        className
      )}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#242424] shadow-md">
        <Image
          src={track.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
          alt={track.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          unoptimized
        />

        {/* Category Pill */}
        {track.category && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white uppercase tracking-wider">
            {track.category}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          aria-label="Favorite"
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all text-white hover:text-red-500"
        >
          <Heart className={cn("size-3.5", favorited && "fill-red-500 text-red-500")} />
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
            <span className="w-1 bg-[#1db954] rounded-full animate-wave-1" />
            <span className="w-1 bg-[#1db954] rounded-full animate-wave-2" />
            <span className="w-1 bg-[#1db954] rounded-full animate-wave-3" />
            <span className="w-1 bg-[#1db954] rounded-full animate-wave-4" />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-3 flex flex-col">
        <h4
          className={cn(
            "font-semibold text-sm truncate text-white transition-colors",
            isCurrent && "text-[#1db954]"
          )}
        >
          {track.name}
        </h4>
        <p className="text-xs text-[#b3b3b3] truncate mt-0.5">{track.artist}</p>
        <div className="flex items-center justify-between text-[11px] text-[#727272] mt-1">
          <span className="truncate max-w-[65%]">{track.album || "Single"}</span>
          <span>{track.playsCount || 0} plays</span>
        </div>
      </div>
    </div>
  );
}

