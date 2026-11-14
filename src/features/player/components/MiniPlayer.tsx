"use client";

import React from "react";
import Image from "next/image";
import { useMusicPlayer } from "../context/MusicPlayerContext";
import { Maximize2, Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { risePanel } from "@/shared/motion";
import { Button } from "@/shared/ui/button";

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause, toggleMiniPlayer } = useMusicPlayer();

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          key="mini-player"
          variants={risePanel}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-border bg-popover/90 p-2 pr-3 shadow-2xl shadow-scrim/20 backdrop-blur-xl"
        >
          {/* Spinning artwork while playing */}
          <div
            className={cn(
              "relative size-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted",
              isPlaying && "animate-spin-slow"
            )}
          >
            <Image
              src={currentTrack.imageURL || "/default-song.png"}
              alt={currentTrack.name}
              fill
              sizes="44px"
              className="object-cover"
              unoptimized
            />
            <span className="absolute inset-1/4 rounded-full border border-scrim-foreground/20" aria-hidden />
          </div>

          <div className="flex max-w-[150px] min-w-0 flex-col">
            <span className="truncate text-xs font-semibold text-popover-foreground">{currentTrack.name}</span>
            <span className="truncate text-[10px] text-muted-foreground">{currentTrack.artist}</span>

            {isPlaying && (
              <div className="mt-1 flex h-2 items-end gap-0.5">
                <span className="w-0.5 animate-wave-1 rounded-full bg-primary" />
                <span className="w-0.5 animate-wave-2 rounded-full bg-primary" />
                <span className="w-0.5 animate-wave-3 rounded-full bg-primary" />
                <span className="w-0.5 animate-wave-4 rounded-full bg-primary" />
              </div>
            )}
          </div>

          <div className="ml-1 flex items-center gap-1">
            <Button
              size="icon"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="size-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMiniPlayer}
              aria-label="Expand player"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <Maximize2 className="size-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
