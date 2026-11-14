"use client";

import React from "react";
import Image from "next/image";
import { useMusicPlayer } from "../context/MusicPlayerContext";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { X, Play, Trash2, ListMusic } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { sheetPanel } from "@/shared/motion";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";

export function QueueDrawer() {
  const { queue, currentIndex, isQueueOpen, toggleQueue, playTrackAtIndex, removeFromQueue } =
    useMusicPlayer();
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <motion.aside
          key="queue-drawer"
          variants={sheetPanel("right")}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-20 right-0 top-16 z-40 flex w-80 flex-col border-l border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-24 sm:w-96"
        >
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListMusic className="size-4 text-primary" />
              <span>{t("player.queue")}</span>
              <span className="text-xs font-normal text-muted-foreground">({queue.length})</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleQueue}
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Close queue"
            >
              <X className="size-4" />
            </Button>
          </div>

          <Separator />

          <ScrollArea className="-mr-2 mt-3 flex-1 pr-2">
            {queue.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <ListMusic className="size-6 opacity-50" />
                <p>Queue is currently empty.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {queue.map((track, idx) => {
                  const isCurrent = idx === currentIndex;

                  return (
                    <div
                      key={`${track._id}-${idx}`}
                      onClick={() => playTrackAtIndex(idx)}
                      className={cn(
                        "group flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors",
                        isCurrent ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/60"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={track.imageURL || "/default-song.png"}
                            alt={track.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                          {isCurrent && (
                            <div className="absolute inset-0 flex items-center justify-center bg-scrim/45">
                              <Play className="size-3.5 fill-scrim-foreground text-scrim-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className={cn("truncate text-xs font-medium", isCurrent && "text-primary")}>
                            {track.name}
                          </span>
                          <span className="truncate text-[10px] text-muted-foreground">{track.artist}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          removeFromQueue(idx);
                        }}
                        className="size-7 shrink-0 rounded-full text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        title="Remove from queue"
                        aria-label={`Remove ${track.name} from queue`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
