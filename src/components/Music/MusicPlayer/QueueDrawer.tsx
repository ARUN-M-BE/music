"use client";

import React from "react";
import Image from "next/image";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useLanguage } from "@/context/LanguageContext";
import { X, Play, Trash2, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";

export function QueueDrawer() {
  const {
    queue,
    currentIndex,
    isQueueOpen,
    toggleQueue,
    playTrackAtIndex,
    removeFromQueue,
  } = useMusicPlayer();
  const { t } = useLanguage();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed right-0 bottom-24 top-16 z-40 w-80 sm:w-96 bg-[#181818]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282828]">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <ListMusic className="size-4 text-[#1db954]" />
          <span>{t("player.queue")}</span>
          <span className="text-xs text-[#b3b3b3] font-normal">({queue.length})</span>
        </div>
        <button
          onClick={toggleQueue}
          className="p-1 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#b3b3b3] text-xs">
            <p>Queue is currently empty.</p>
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={`${track._id}-${idx}`}
                onClick={() => playTrackAtIndex(idx)}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                  isCurrent ? "bg-white/15 text-[#1db954]" : "hover:bg-white/5 text-white"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative size-10 rounded shrink-0 overflow-hidden bg-[#242424]">
                    <Image
                      src={track.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                      alt={track.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="size-3.5 fill-[#1db954] text-[#1db954]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span
                      className={cn(
                        "text-xs font-medium truncate",
                        isCurrent && "text-[#1db954]"
                      )}
                    >
                      {track.name}
                    </span>
                    <span className="text-[10px] text-[#b3b3b3] truncate">{track.artist}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(idx);
                  }}
                  className="p-1.5 rounded text-[#727272] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from queue"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

