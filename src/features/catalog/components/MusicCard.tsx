"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MusicTrack } from "@/types/music";
import { useMusicPlayer } from "@/features/player";
import { Play, Pause, Heart } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

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
  const trackImage = track.imageURL || track.artwork || "/default-song.png";
  const trackDuration =
    typeof track.duration === "number"
      ? track.duration
      : Number.parseInt(track.duration ?? "0", 10) || 0;

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
    <article
      onClick={handleCardClick}
      className={cn(
        "group relative flex cursor-pointer select-none flex-col rounded-2xl border border-transparent bg-card p-2.5 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-scrim/10",
        "focus-within:border-ring/60",
        isCurrent && "border-primary/40 bg-accent/40",
        className
      )}
    >
      {/* Artwork */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={trackImage}
          alt={trackTitle}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          unoptimized
        />

        {/* Artwork overlays stay dark in both themes: they sit on a photo. */}
        <div className="absolute left-2 top-2 z-10 flex gap-1">
          {track.language && (
            <Badge className="border-0 bg-scrim/55 px-2 py-0 text-[9px] font-bold uppercase tracking-wider text-scrim-foreground backdrop-blur-md hover:bg-scrim/55">
              {track.language}
            </Badge>
          )}
          {track.releaseYear && (
            <Badge
              variant="outline"
              className="border-scrim-foreground/15 bg-scrim/35 px-1.5 py-0 text-[9px] font-medium text-scrim-foreground/85 backdrop-blur-md"
            >
              {track.releaseYear}
            </Badge>
          )}
        </div>

        <button
          onClick={handleFavoriteClick}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "absolute right-2 top-2 z-10 rounded-full bg-scrim/55 p-1.5 text-scrim-foreground backdrop-blur-md transition-all",
            "hover:scale-110 hover:bg-scrim/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            favorited ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          )}
        >
          <Heart className={cn("size-3.5", favorited ? "fill-destructive text-destructive" : "text-scrim-foreground")} />
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={isThisPlaying ? `Pause ${trackTitle}` : `Play ${trackTitle}`}
              className={cn(
                "absolute bottom-3 right-3 z-10 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-scrim/30 transition-all duration-300",
                "hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-card",
                isThisPlaying
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
              )}
            >
              {isThisPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="ml-0.5 size-5 fill-current" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">{isThisPlaying ? "Pause" : "Play"}</TooltipContent>
        </Tooltip>

        {isThisPlaying && (
          <div className="absolute bottom-3 left-3 flex items-end gap-0.5 rounded-md bg-scrim/60 p-1.5 backdrop-blur-md">
            <span className="h-3 w-1 animate-wave-1 rounded-full bg-primary" />
            <span className="h-4 w-1 animate-wave-2 rounded-full bg-primary" />
            <span className="h-2 w-1 animate-wave-3 rounded-full bg-primary" />
            <span className="h-3.5 w-1 animate-wave-4 rounded-full bg-primary" />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-3 flex flex-1 flex-col justify-between px-0.5">
        <div>
          <h4
            className={cn(
              "truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground",
              isCurrent && "text-primary"
            )}
            title={trackTitle}
          >
            {trackTitle}
          </h4>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <Link
              href={`/artist/${encodeURIComponent(track.artist)}`}
              onClick={(e) => e.stopPropagation()}
              className="transition-colors hover:text-foreground hover:underline"
            >
              {track.artist}
            </Link>
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
          <Link
            href={`/album/${encodeURIComponent(track.album || "Single")}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[65%] truncate transition-colors hover:text-foreground"
          >
            {track.album || "Single"}
          </Link>
          {trackDuration > 0 ? (
            <span className="shrink-0 tabular-nums">{formatTime(trackDuration)}</span>
          ) : (
            <span className="shrink-0">{track.playsCount || 0} plays</span>
          )}
        </div>
      </div>
    </article>
  );
}
