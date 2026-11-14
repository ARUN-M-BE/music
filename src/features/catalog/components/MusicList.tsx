"use client";

import React from "react";
import Image from "next/image";
import { MusicTrack } from "@/types/music";
import { useMusicPlayer } from "@/features/player";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { Play, Heart, Clock, Music } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

interface MusicListProps {
  tracks: MusicTrack[];
  showAlbum?: boolean;
}

export function MusicList({ tracks, showAlbum = true }: MusicListProps) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, toggleFavorite, isFavorite } =
    useMusicPlayer();
  const { t } = useLanguage();

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-muted-foreground">
        <Music className="mb-3 size-10 opacity-40" />
        <p className="text-sm font-medium">{t("library.noResults")}</p>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Column header */}
      <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 border-b border-border bg-background/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-6 md:col-span-5">{t("library.track")}</div>
        {showAlbum && <div className="col-span-3 hidden md:block">{t("library.album")}</div>}
        <div className="col-span-3 text-center md:col-span-2">{t("library.plays")}</div>
        <div className="col-span-2 flex justify-center md:col-span-1">
          <Clock className="size-3.5" />
        </div>
      </div>

      <div className="mt-1 space-y-0.5">
        {tracks.map((track, idx) => {
          const trackKey = track._id || track.id || `track_${idx}`;
          const trackTitle = track.name || track.title || "Unknown Track";
          const trackImage = track.imageURL || track.artwork || "/default-song.png";
          const isCurrent =
            (currentTrack?._id && currentTrack._id === trackKey) ||
            (currentTrack?.id && currentTrack.id === trackKey) ||
            (currentTrack?.name === trackTitle && currentTrack?.artist === track.artist);
          const isThisPlaying = isCurrent && isPlaying;
          const favorited = isFavorite(trackKey);
          const duration = Number(track.duration) || 0;

          return (
            <div
              key={trackKey}
              onClick={() => {
                if (isCurrent) togglePlayPause();
                else playTrack(track, tracks);
              }}
              className={cn(
                "group grid cursor-pointer grid-cols-12 items-center gap-4 rounded-lg px-4 py-2.5 transition-colors hover:bg-accent",
                isCurrent && "bg-primary/10"
              )}
            >
              {/* Index / equaliser */}
              <div className="col-span-1 flex items-center justify-center text-sm font-medium tabular-nums">
                {isThisPlaying ? (
                  <div className="flex h-3 items-end gap-0.5">
                    <span className="w-0.5 animate-wave-1 rounded-full bg-primary" />
                    <span className="w-0.5 animate-wave-2 rounded-full bg-primary" />
                    <span className="w-0.5 animate-wave-3 rounded-full bg-primary" />
                  </div>
                ) : (
                  <>
                    <span className="text-muted-foreground group-hover:hidden">{idx + 1}</span>
                    <Play className="hidden size-4 fill-current text-foreground group-hover:block" />
                  </>
                )}
              </div>

              {/* Title */}
              <div className="col-span-6 flex min-w-0 items-center gap-3 md:col-span-5">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={trackImage}
                    alt={trackTitle}
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span
                    className={cn("truncate text-sm font-medium text-foreground", isCurrent && "text-primary")}
                  >
                    {trackTitle}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{track.artist}</span>
                </div>
              </div>

              {showAlbum && (
                <div className="col-span-3 hidden truncate text-sm text-muted-foreground md:block">
                  {track.album || "Single"}
                </div>
              )}

              <div className="col-span-3 text-center text-xs tabular-nums text-muted-foreground md:col-span-2">
                {duration > 0 ? formatTime(duration) : `${track.playsCount?.toLocaleString() || 0} plays`}
              </div>

              <div className="col-span-2 flex items-center justify-center md:col-span-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        toggleFavorite(trackKey);
                      }}
                      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                      className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <Heart
                        className={cn(
                          "size-4",
                          favorited ? "fill-destructive text-destructive" : "opacity-0 group-hover:opacity-100"
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{favorited ? "Remove favorite" : "Add favorite"}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
