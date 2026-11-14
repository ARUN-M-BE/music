"use client";

import React, { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { quick } from "@/shared/motion";
import { cn } from "@/lib/utils";
import { GENRE_NAMES } from "@/constants/categories";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const GENRES = ["all", ...GENRE_NAMES];

type SortKey = "newest" | "oldest" | "popular" | "name";

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
  onSortChange: (sort: SortKey) => void;
  selectedCategory: string;
  selectedLanguage: string;
  selectedSort: string;
}

function FilterChip({
  active,
  onClick,
  children,
  tone = "neutral",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "neutral" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? tone === "primary"
            ? "bg-primary font-semibold text-primary-foreground"
            : "bg-foreground font-semibold text-background"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  );
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
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative w-full flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("library.searchPlaceholder")}
            aria-label={t("library.searchPlaceholder")}
            className="h-11 rounded-full border-border bg-muted pl-10 pr-10 text-sm shadow-none focus-visible:bg-card"
          />
          <AnimatePresence initial={false}>
            {searchTerm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={quick}
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  aria-label="Clear search"
                  className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort */}
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:self-auto">
          <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />
          <Select value={selectedSort} onValueChange={(value) => onSortChange(value as SortKey)}>
            <SelectTrigger className="h-11 w-full min-w-40 rounded-full border-border bg-muted text-xs sm:w-44">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("library.sortNewest")}</SelectItem>
              <SelectItem value="popular">{t("library.sortPopular")}</SelectItem>
              <SelectItem value="name">{t("library.sortName")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Genres */}
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
        {GENRES.map((genre) => (
          <FilterChip
            key={genre}
            active={selectedCategory.toLowerCase() === genre.toLowerCase()}
            onClick={() => onCategoryChange(genre)}
          >
            {genre === "all" ? t("library.allGenres") : genre}
          </FilterChip>
        ))}
      </div>

      {/* Languages */}
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
        <span className="mr-1 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("library.language")}:
        </span>
        {LANGUAGES.map((lang) => (
          <FilterChip
            key={lang}
            tone="primary"
            active={selectedLanguage.toLowerCase() === lang.toLowerCase()}
            onClick={() => onLanguageChange(lang)}
          >
            {lang === "all" ? t("library.allLanguages") : lang}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
