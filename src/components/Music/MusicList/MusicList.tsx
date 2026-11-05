"use client";

import React from "react";
import Image from "next/image";
import { MusicTrack } from "@/types/music";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useLanguage } from "@/context/LanguageContext";
import { Play, Pause, Heart, Clock, Music } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col items-center justify-center p-12 text-[#b3b3b3]">
        <Music className="size-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">{t("library.noResults")}</p>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-[#282828] text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-6 md:col-span-5">{t("library.track")}</div>
        {showAlbum && <div className="hidden md:block col-span-3">{t("library.album")}</div>}
        <div className="col-span-3 md:col-span-2 text-center">{t("library.plays")}</div>
        <div className="col-span-2 md:col-span-1 flex justify-center">
          <Clock className="size-3.5" />
        </div>
      </div>

      {/* Track Rows */}
      <div className="mt-2 space-y-1">
        {tracks.map((track, idx) => {
          const isCurrent = currentTrack?._id === track._id;
          const isThisPlaying = isCurrent && isPlaying;
          const favorited = isFavorite(track._id);

          return (
            <div
              key={track._id || idx}
              onClick={() => {
                if (isCurrent) togglePlayPause();
                else playTrack(track, tracks);
              }}
              className={cn(
                "group grid grid-cols-12 gap-4 items-center px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer",
                isCurrent && "bg-white/10 text-[#1db954]"
              )}
            >
              {/* Index / Play Icon */}
              <div className="col-span-1 flex items-center justify-center text-sm font-medium">
                {isThisPlaying ? (
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-1" />
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-2" />
                    <span className="w-0.5 bg-[#1db954] rounded-full animate-wave-3" />
                  </div>
                ) : (
                  <>
                    <span className="group-hover:hidden text-[#b3b3b3]">{idx + 1}</span>
                    <Play className="hidden group-hover:block size-4 fill-white text-white" />
                  </>
                )}
              </div>

              {/* Title & Artist & Thumbnail */}
              <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                <div className="relative size-10 rounded shrink-0 overflow-hidden bg-[#242424]">
                  <Image
                    src={track.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                    alt={track.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span
                    className={cn(
                      "font-medium text-sm truncate text-white",
                      isCurrent && "text-[#1db954]"
                    )}
                  >
                    {track.name}
                  </span>
                  <span className="text-xs text-[#b3b3b3] truncate">{track.artist}</span>
                </div>
              </div>

              {/* Album */}
              {showAlbum && (
                <div className="hidden md:block col-span-3 text-sm text-[#b3b3b3] truncate">
                  {track.album || "Single"}
                </div>
              )}

              {/* Plays */}
              <div className="col-span-3 md:col-span-2 text-center text-xs text-[#b3b3b3]">
                {track.playsCount?.toLocaleString() || 0}
              </div>

              {/* Like / Actions */}
              <div className="col-span-2 md:col-span-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track._id);
                  }}
                  className="p-1 rounded-full text-[#b3b3b3] hover:text-white transition-colors"
                >
                  <Heart
                    className={cn(
                      "size-4",
                      favorited ? "fill-red-500 text-red-500" : "opacity-0 group-hover:opacity-100"
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

