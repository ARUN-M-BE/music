"use client";

import React, { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const GENRES = [
  "all",
  "Pop",
  "Rock",
  "Hip Hop",
  "R&B",
  "Electronic",
  "Classical",
  "Jazz",
  "Country",
  "Reggae",
  "Blues",
  "Folk",
];

const LANGUAGES = [
  "all",
  "English",
  "Tamil",
  "Hindi",
  "Telugu",
  "Malayalam",
  "Punjabi",
  "Arabic",
];

interface MusicSearchProps {
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onLanguageChange: (language: string) => void;
  onSortChange: (sort: "newest" | "oldest" | "popular" | "name") => void;
  selectedCategory: string;
  selectedLanguage: string;
  selectedSort: string;
}

export function MusicSearch({
  onSearchChange,
  onCategoryChange,
  onLanguageChange,
  onSortChange,
  selectedCategory,
  selectedLanguage,
  selectedSort,
}: MusicSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { t } = useLanguage();

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleClear = () => {
    setSearchTerm("");
    onSearchChange("");
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        {/* Search Input Box */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#b3b3b3]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("library.searchPlaceholder")}
            className="w-full h-11 pl-10 pr-10 rounded-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#333333] border border-transparent focus:border-white/20 text-sm text-white placeholder-[#727272] outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <SlidersHorizontal className="size-4 text-[#b3b3b3]" />
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="h-11 px-3 rounded-full bg-[#242424] border border-transparent focus:border-white/20 text-xs text-white outline-none cursor-pointer"
          >
            <option value="newest">{t("library.sortNewest")}</option>
            <option value="popular">{t("library.sortPopular")}</option>
            <option value="name">{t("library.sortName")}</option>
          </select>
        </div>
      </div>

      {/* Genre Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => onCategoryChange(genre)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              selectedCategory.toLowerCase() === genre.toLowerCase()
                ? "bg-white text-black font-semibold"
                : "bg-[#242424] text-[#b3b3b3] hover:bg-[#2e2e2e] hover:text-white"
            )}
          >
            {genre === "all" ? t("library.allGenres") : genre}
          </button>
        ))}
      </div>

      {/* Language Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-[#727272] shrink-0 font-medium uppercase tracking-wider mr-1">
          {t("library.language")}:
        </span>
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              selectedLanguage.toLowerCase() === lang.toLowerCase()
                ? "bg-[#1db954] text-black font-semibold"
                : "bg-[#1e1e1e] text-[#b3b3b3] hover:bg-[#282828] hover:text-white"
            )}
          >
            {lang === "all" ? t("library.allLanguages") : lang}
          </button>
        ))}
      </div>
    </div>
  );
}

