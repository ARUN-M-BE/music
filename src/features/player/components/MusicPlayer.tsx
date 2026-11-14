"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useMusicPlayer } from "../context/MusicPlayerContext";
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
import { AnimatePresence, motion } from "motion/react";
import { quick, spring } from "@/shared/motion";
import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { MiniPlayer } from "./MiniPlayer";
import { QueueDrawer } from "./QueueDrawer";

/** Ghost icon button with a tooltip - the player's control vocabulary. */
function ControlButton({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          aria-label={label}
          className={cn(
            "size-8 rounded-full text-muted-foreground hover:text-foreground",
            active && "text-primary hover:text-primary",
            className
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

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

  // While the user drags the timeline we render the dragged value, so the thumb
  // never fights the audio clock; the seek is committed on pointer release.
  const [dragValue, setDragValue] = useState<number | null>(null);

  if (!currentTrack) return null;

  if (isMiniPlayer) {
    return <MiniPlayer />;
  }

  const activeTime = dragValue ?? currentTime;
  const trackKey = currentTrack._id || currentTrack.id || "";
  const favorited = isFavorite(trackKey);
  const volumeValue = isMuted ? 0 : volume;

  return (
    <>
      <motion.div
        initial={{ y: 96, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/85 backdrop-blur-xl"
      >
        <div className="mx-auto grid h-20 max-w-[1800px] grid-cols-[1fr_auto] items-center gap-3 px-3 sm:h-24 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] sm:px-6">
          {/* Track identity */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm sm:size-14">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={trackKey}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={quick}
                  className="absolute inset-0"
                >
                  <Image
                    src={currentTrack.imageURL || "/default-song.png"}
                    alt={currentTrack.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex min-w-0 flex-col justify-center">
              <span className="truncate text-sm font-semibold text-foreground">{currentTrack.name}</span>
              <span className="truncate text-xs text-muted-foreground">{currentTrack.artist}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(trackKey)}
              aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
              className="ml-1 hidden shrink-0 rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <Heart className={cn("size-4", favorited && "fill-destructive text-destructive")} />
            </Button>
          </div>

          {/* Transport + timeline */}
          <div className="flex flex-col items-center justify-center">
            <div className="mb-1.5 flex items-center gap-1.5 sm:gap-3">
              <ControlButton label="Shuffle" active={isShuffle} onClick={toggleShuffle} className="hidden sm:inline-flex">
                <Shuffle className="size-4" />
              </ControlButton>

              <ControlButton label="Previous" onClick={previousTrack}>
                <SkipBack className="size-5 fill-current" />
              </ControlButton>

              <Button
                type="button"
                size="icon"
                onClick={togglePlayPause}
                disabled={isLoading}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="size-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 hover:bg-primary/90 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="size-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 size-5 fill-current" />
                )}
              </Button>

              <ControlButton label="Next" onClick={nextTrack}>
                <SkipForward className="size-5 fill-current" />
              </ControlButton>

              <ControlButton
                label={`Repeat: ${repeatMode}`}
                active={repeatMode !== "off"}
                onClick={toggleRepeat}
                className="hidden sm:inline-flex"
              >
                {repeatMode === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
              </ControlButton>
            </div>

            <div className="hidden w-full max-w-xl items-center gap-2 sm:flex">
              <span className="w-9 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatTime(activeTime)}
              </span>

              <Slider
                value={[Math.min(activeTime, duration || 0)]}
                max={duration || 100}
                step={0.1}
                onValueChange={([value]) => setDragValue(value)}
                onValueCommit={([value]) => {
                  seek(value);
                  setDragValue(null);
                }}
                aria-label="Seek timeline"
                className="flex-1 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:opacity-0 hover:[&_[data-slot=slider-thumb]]:opacity-100 [&_[data-slot=slider-track]]:h-1"
              />

              <span className="w-9 text-left font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Utilities */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <ControlButton
              label="Mini player"
              onClick={toggleMiniPlayer}
              className="hidden sm:inline-flex"
            >
              <Minimize2 className="size-4" />
            </ControlButton>

            <ControlButton label="Play queue" active={isQueueOpen} onClick={toggleQueue}>
              <ListMusic className="size-4" />
            </ControlButton>

            <div className="hidden items-center gap-1.5 md:flex">
              <ControlButton label={isMuted ? "Unmute" : "Mute"} onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-4" />
                ) : volume < 0.5 ? (
                  <Volume1 className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </ControlButton>

              <Slider
                value={[volumeValue]}
                max={1}
                step={0.01}
                onValueChange={([value]) => setVolumeLevel(value)}
                aria-label="Volume level"
                className="w-24 [&_[data-slot=slider-range]]:bg-foreground/70 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:opacity-0 hover:[&_[data-slot=slider-thumb]]:opacity-100 [&_[data-slot=slider-track]]:h-1"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <QueueDrawer />
    </>
  );
}
