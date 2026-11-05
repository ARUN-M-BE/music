"use client";

import React, { useState, useEffect } from "react";
import { MusicTrack } from "@/types/music";
import { musicService } from "@/services/music.service";
import { MusicCard } from "../MusicCard/MusicCard";
import { MusicList } from "../MusicList/MusicList";
import { MusicSearch } from "../MusicSearch/MusicSearch";
import { useLanguage } from "@/context/LanguageContext";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicLibraryProps {
  initialTracks?: MusicTrack[];
}

export function MusicLibrary({ initialTracks = [] }: MusicLibraryProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>(initialTracks);
  const [loading, setLoading] = useState<boolean>(initialTracks.length === 0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular" | "name">("newest");
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    musicService
      .getSongs({ search, category, language, sortBy })
      .then((data) => {
        if (isMounted) {
          setTracks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load tracks:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search, category, language, sortBy]);

  return (
    <div className="w-full space-y-6">
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#282828]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t("library.title")}
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1">{t("library.subtitle")}</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#181818] border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "grid" ? "bg-[#282828] text-white" : "text-[#727272] hover:text-white"
            )}
            title="Grid View"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "list" ? "bg-[#282828] text-white" : "text-[#727272] hover:text-white"
            )}
            title="List View"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <MusicSearch
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onLanguageChange={setLanguage}
        onSortChange={setSortBy}
        selectedCategory={category}
        selectedLanguage={language}
        selectedSort={sortBy}
      />

      {/* Track Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#b3b3b3]">
          <Loader2 className="size-8 animate-spin text-[#1db954] mb-3" />
          <p className="text-sm">Loading tracks from database...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#b3b3b3]">
          <p className="text-base font-semibold">{t("library.noResults")}</p>
          <button
            onClick={() => {
              setSearch("");
              setCategory("all");
              setLanguage("all");
            }}
            className="mt-4 px-4 py-2 rounded-full bg-[#242424] hover:bg-[#333333] text-xs font-semibold text-white transition-colors"
          >
            {t("library.clearFilters")}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {tracks.map((track) => (
            <MusicCard key={track._id} track={track} queueContext={tracks} />
          ))}
        </div>
      ) : (
        <MusicList tracks={tracks} />
      )}
    </div>
  );
}

