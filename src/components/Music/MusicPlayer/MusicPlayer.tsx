"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { formatTime } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Heart,
  Minimize2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniPlayer } from "./MiniPlayer";
import { QueueDrawer } from "./QueueDrawer";

export function MusicPlayer() {
  const {
    currentTrack,
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
    toggleFavorite,
    isFavorite,
  } = useMusicPlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  if (!currentTrack) return null;

  if (isMiniPlayer) {
    return <MiniPlayer />;
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
    setSeekValue(currentTime);
  };

  const handleSeekMouseUp = () => {
    setIsSeeking(false);
    seek(seekValue);
  };

  const activeTime = isSeeking ? seekValue : currentTime;
  const progressPercent = duration > 0 ? (activeTime / duration) * 100 : 0;
  const favorited = isFavorite(currentTrack._id);

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-50 h-20 sm:h-24 bg-[#181818] border-t border-[#282828] px-3 sm:px-6 flex items-center justify-between select-none shadow-2xl">
        {/* ================= LEFT: Track Info ================= */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          <div className="relative size-12 sm:size-14 rounded-md overflow-hidden shrink-0 bg-[#242424] shadow-md">
            <Image
              src={currentTrack.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
              alt={currentTrack.name}
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-semibold text-white truncate hover:underline cursor-pointer">
              {currentTrack.name}
            </span>
            <span className="text-[11px] sm:text-xs text-[#b3b3b3] truncate hover:underline cursor-pointer">
              {currentTrack.artist}
            </span>
          </div>

          <button
            onClick={() => toggleFavorite(currentTrack._id)}
            className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors shrink-0 ml-1 hidden xs:block"
            aria-label="Save to favorites"
          >
            <Heart className={cn("size-4", favorited && "fill-red-500 text-red-500")} />
          </button>
        </div>

        {/* ================= CENTER: Controls & Progress ================= */}
        <div className="flex flex-col items-center justify-center w-[45%] max-w-xl">
          {/* Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-5 mb-1.5">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={cn(
                "p-1 text-[#b3b3b3] hover:text-white transition-colors",
                isShuffle && "text-[#1db954] hover:text-[#1db954]"
              )}
              title="Shuffle"
            >
              <Shuffle className="size-4" />
            </button>

            {/* Previous */}
            <button
              onClick={previousTrack}
              className="p-1 text-[#b3b3b3] hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack className="size-5 fill-current" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className="size-9 sm:size-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="size-5 fill-black" />
              ) : (
                <Play className="size-5 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="p-1 text-[#b3b3b3] hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward className="size-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={cn(
                "p-1 text-[#b3b3b3] hover:text-white transition-colors",
                repeatMode !== "off" && "text-[#1db954] hover:text-[#1db954]"
              )}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </button>
          </div>

          {/* Progress Timeline Slider */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-[#b3b3b3] w-9 text-right font-mono">
              {formatTime(activeTime)}
            </span>

            <div className="relative flex-1 group flex items-center h-4 cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={activeTime}
                onChange={handleSeekChange}
                onMouseDown={handleSeekMouseDown}
                onMouseUp={handleSeekMouseUp}
                onTouchStart={handleSeekMouseDown}
                onTouchEnd={handleSeekMouseUp}
                aria-label="Seek timeline"
                className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-[#1db954] group-hover:h-1.5 transition-all"
                style={{
                  background: `linear-gradient(to right, #1db954 ${progressPercent}%, #4d4d4d ${progressPercent}%)`,
                }}
              />
            </div>

            <span className="text-[10px] sm:text-xs text-[#b3b3b3] w-9 text-left font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* ================= RIGHT: Volume & Utilities ================= */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-[25%]">
          {/* Mini Player Toggle */}
          <button
            onClick={toggleMiniPlayer}
            className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors hidden sm:block"
            title="Mini Player"
          >
            <Minimize2 className="size-4" />
          </button>

          {/* Queue Drawer Button */}
          <button
            onClick={toggleQueue}
            className={cn(
              "p-1.5 text-[#b3b3b3] hover:text-white transition-colors",
              isQueueOpen && "text-[#1db954] hover:text-[#1db954]"
            )}
            title="Play Queue"
          >
            <ListMusic className="size-4" />
          </button>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-1.5 w-28 group">
            <button
              onClick={toggleMute}
              className="text-[#b3b3b3] hover:text-white transition-colors p-1"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="size-4 text-red-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
              aria-label="Volume level"
              className="w-full h-1 bg-[#4d4d4d] rounded-lg appearance-none cursor-pointer accent-white group-hover:accent-[#1db954] transition-all"
              style={{
                background: `linear-gradient(to right, #ffffff ${(isMuted ? 0 : volume) * 100}%, #4d4d4d ${(isMuted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Floating Queue Drawer */}
      <QueueDrawer />
    </>
  );
}

