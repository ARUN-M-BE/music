"use client";

import React from "react";
import Image from "next/image";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { Maximize2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause, toggleMiniPlayer } = useMusicPlayer();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-2 pr-4 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 hover:scale-105">
      {/* Artwork with beat pulse */}
      <div
        className={cn(
          "relative size-12 rounded-full overflow-hidden shrink-0 border border-white/20",
          isPlaying && "ring-2 ring-[#1db954] ring-offset-2 ring-offset-black animate-pulse"
        )}
      >
        <Image
          src={currentTrack.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
          alt={currentTrack.name}
          fill
          sizes="48px"
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Info & Waveform */}
      <div className="flex flex-col min-w-0 max-w-[130px]">
        <span className="text-xs font-semibold text-white truncate">{currentTrack.name}</span>
        <span className="text-[10px] text-[#b3b3b3] truncate">{currentTrack.artist}</span>

        {/* Dynamic soundbars */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 mt-1 h-2">
            <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-1" />
            <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-2" />
            <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-3" />
            <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-4" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 ml-1">
        <button
          onClick={togglePlayPause}
          className="p-2 rounded-full bg-[#1db954] text-black hover:bg-[#1ed760] transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="size-3.5 fill-black" /> : <Play className="size-3.5 fill-black ml-0.5" />}
        </button>
        <button
          onClick={toggleMiniPlayer}
          className="p-1.5 rounded-full text-[#b3b3b3] hover:text-white transition-colors"
          aria-label="Maximize"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

