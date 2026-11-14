"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MusicTrack, Artist, Album } from "@/types/music";
import { musicService } from "@/services/music.service";
import { MusicCard, MusicList } from "@/features/catalog";
import {
  LayoutGrid,
  List,
  Search,
  Flame,
  Sparkles,
  Music2,
  Disc3,
  Radio,
  Globe,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dedupeTracks, mapUnifiedToTrack } from "@/lib/musicMappers";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CarouselSkeleton, MediaGridSkeleton } from "@/shared/skeletons";
import { Stagger, StaggerItem, Swap } from "@/shared/motion";

interface MusicLibraryProps {
  initialTracks?: MusicTrack[];
}

type TabType = "all" | "trending" | "tamil" | "hindi" | "english" | "latest";

export function MusicLibrary({ initialTracks = [] }: MusicLibraryProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") || "all") as TabType;
  const initialLang = searchParams.get("language") || "";

  const initialTabValue = initialLang ? (initialLang.toLowerCase() as TabType) : initialTab;
  const [activeTab, setActiveTab] = useState<TabType>(initialTabValue);
  // The catalog remembers which (tab, query) pair it answers, so the spinner is
  // derived from that instead of being switched on inside the fetch effect. An
  // empty key means "nothing fetched yet", which is what the first paint shows.
  const [catalog, setCatalog] = useState<{ key: string; tracks: MusicTrack[] }>(() => ({
    key: initialTracks.length > 0 ? `${initialTabValue}::` : "",
    tracks: initialTracks,
  }));
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [widgetsLoaded, setWidgetsLoaded] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  const requestKey = `${activeTab}::${debouncedQuery.trim()}`;
  const tracks = catalog.tracks;
  const loading = catalog.key !== requestKey;
  const widgetsLoading = !widgetsLoaded;

  // 350ms Debounce on Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Popular Artists and Albums once for carousels
  useEffect(() => {
    let isMounted = true;
    Promise.all([musicService.getArtists(), musicService.getAlbums()])
      .then(([artists, albums]) => {
        if (isMounted) {
          setPopularArtists(artists.slice(0, 10));
          setPopularAlbums(albums.slice(0, 10));
        }
      })
      .catch((err) => console.warn("Failed to fetch library widgets:", err))
      .finally(() => {
        if (isMounted) setWidgetsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Main Fetch Effect (combines API Aggregator + MongoDB live catalog)
  useEffect(() => {
    let cancelled = false;

    const settle = (nextTracks: MusicTrack[]) => {
      if (!cancelled) setCatalog({ key: requestKey, tracks: nextTracks });
    };

    const loadData = async () => {
      try {
        if (debouncedQuery.trim()) {
          // If search is active, aggregate across JioSaavn, iTunes, Audius, and DB
          const results = await musicService.searchAggregatedMusic(
            debouncedQuery.trim(),
            activeTab === "tamil"
              ? "Tamil"
              : activeTab === "hindi"
              ? "Hindi"
              : activeTab === "english"
              ? "English"
              : undefined
          );

          if (cancelled) return;

          // Also merge any local catalog matches
          const localMatches = await musicService.getSongs({ search: debouncedQuery });
          settle(dedupeTracks([...localMatches, ...results.map(mapUnifiedToTrack)]));
          return;
        }

        // Tab selection logic
        if (activeTab === "trending") {
          const trending = await musicService.getTrendingMusic();
          settle(trending.map(mapUnifiedToTrack));
        } else if (activeTab === "tamil") {
          const [saavnTamil, dbTamil] = await Promise.all([
            musicService.searchAggregatedMusic("tamil hits 2024", "Tamil", 25),
            musicService.getSongs({ language: "Tamil" }),
          ]);
          settle(dedupeTracks([...dbTamil, ...saavnTamil.map(mapUnifiedToTrack)]));
        } else if (activeTab === "hindi") {
          const [saavnHindi, dbHindi] = await Promise.all([
            musicService.searchAggregatedMusic("hindi top hits bollywood", "Hindi", 25),
            musicService.getSongs({ language: "Hindi" }),
          ]);
          settle(dedupeTracks([...dbHindi, ...saavnHindi.map(mapUnifiedToTrack)]));
        } else if (activeTab === "english") {
          const [itunesEnglish, dbEnglish] = await Promise.all([
            musicService.searchAggregatedMusic("top billboard hits pop", "English", 25),
            musicService.getSongs({ language: "English" }),
          ]);
          settle(dedupeTracks([...dbEnglish, ...itunesEnglish.map(mapUnifiedToTrack)]));
        } else if (activeTab === "latest") {
          const [saavnNew, dbNew] = await Promise.all([
            musicService.searchAggregatedMusic("latest releases 2024 songs", undefined, 25),
            musicService.getSongs({ sortBy: "newest" }),
          ]);
          settle(dedupeTracks([...dbNew, ...saavnNew.map(mapUnifiedToTrack)]));
        } else {
          // "all" - Catalog + Streaming discovery
          const [dbSongs, trendingSongs] = await Promise.all([
            musicService.getSongs(),
            musicService.getTrendingMusic(),
          ]);
          settle(dedupeTracks([...dbSongs, ...trendingSongs.map(mapUnifiedToTrack)]));
        }
      } catch (err) {
        console.error("MusicLibrary load error:", err);
        // Keep whatever is on screen, but stop the spinner for this request.
        if (!cancelled) setCatalog((prev) => ({ key: requestKey, tracks: prev.tracks }));
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, activeTab, requestKey]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-16">
      {/* Header + view switcher */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <h1 className="font-display flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-4xl">
            <Music2 className="size-7 text-primary sm:size-8" />
            <span>Discover</span>
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Unlimited streaming &middot; curated charts &middot; your hi-fi catalog
          </p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-xl border border-border bg-card p-1 shadow-sm sm:self-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            aria-label="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by song title, artist, album, or genre..."
          aria-label="Search the library"
          className="h-12 rounded-full bg-card pl-11 pr-10 text-sm shadow-sm"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Discovery tabs */}
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
        <TabButton
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
          icon={<Globe className="size-3.5" />}
          label="All Music"
        />
        <TabButton
          active={activeTab === "trending"}
          onClick={() => setActiveTab("trending")}
          icon={<Flame className="size-3.5 text-chart-2" />}
          label="Trending"
        />
        <TabButton
          active={activeTab === "tamil"}
          onClick={() => setActiveTab("tamil")}
          icon={<Sparkles className="size-3.5 text-chart-1" />}
          label="Tamil Hits"
        />
        <TabButton
          active={activeTab === "hindi"}
          onClick={() => setActiveTab("hindi")}
          icon={<Disc3 className="size-3.5 text-chart-4" />}
          label="Hindi Songs"
        />
        <TabButton
          active={activeTab === "english"}
          onClick={() => setActiveTab("english")}
          icon={<Radio className="size-3.5 text-chart-3" />}
          label="English Global"
        />
        <TabButton
          active={activeTab === "latest"}
          onClick={() => setActiveTab("latest")}
          icon={<Sparkles className="size-3.5 text-chart-5" />}
          label="Latest Releases"
        />
      </div>

      {/* Popular artists */}
      {!debouncedQuery && (widgetsLoading || popularArtists.length > 0) && (
        <section className="space-y-3">
          <h2 className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
            <Users className="size-4 text-primary" />
            <span>Popular artists</span>
          </h2>

          {widgetsLoading ? (
            <CarouselSkeleton count={6} className="pb-2" />
          ) : (
          <Stagger className="scrollbar-none flex items-center gap-3 overflow-x-auto pb-2" gap={0.04}>
            {popularArtists.map((artist) => (
              <StaggerItem key={artist._id} className="shrink-0">
              <Link
                href={`/artist/${encodeURIComponent(artist.name)}`}
                className="group flex w-32 shrink-0 cursor-pointer flex-col items-center rounded-2xl border border-transparent bg-card p-3 text-center transition-all hover:border-border hover:shadow-md sm:w-36"
              >
                <div className="relative size-20 overflow-hidden rounded-full bg-muted ring-2 ring-transparent transition-all group-hover:ring-primary/50 sm:size-24">
                  <Image
                    src={artist.imageURL || "/default-avatar.png"}
                    alt={artist.name}
                    fill
                    sizes="96px"
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                </div>
                <span className="mt-2.5 w-full truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                  {artist.name}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Artist
                </span>
              </Link>
              </StaggerItem>
            ))}
          </Stagger>
          )}
        </section>
      )}

      {/* Featured albums */}
      {!debouncedQuery && (widgetsLoading || popularAlbums.length > 0) && (
        <section className="space-y-3">
          <h2 className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
            <Disc3 className="size-4 text-primary" />
            <span>Featured albums</span>
          </h2>

          {widgetsLoading ? (
            <CarouselSkeleton count={6} variant="square" className="pb-2" />
          ) : (
          <Stagger className="scrollbar-none flex items-center gap-3 overflow-x-auto pb-2" gap={0.04}>
            {popularAlbums.map((album) => (
              <StaggerItem key={album._id} className="shrink-0">
              <Link
                href={`/album/${encodeURIComponent(album.name)}`}
                className="group flex w-36 shrink-0 cursor-pointer flex-col rounded-2xl border border-transparent bg-card p-2.5 transition-all hover:border-border hover:shadow-md sm:w-40"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={album.imageURL || "/default-song.png"}
                    alt={album.name}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                </div>
                <span className="mt-2.5 truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                  {album.name}
                </span>
                <span className="mt-0.5 truncate text-[10px] text-muted-foreground">{album.artist}</span>
              </Link>
              </StaggerItem>
            ))}
          </Stagger>
          )}
        </section>
      )}

      {/* Results header */}
      <div className="flex items-end justify-between pt-2">
        <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
          {debouncedQuery
            ? `Results for "${debouncedQuery}"`
            : activeTab === "trending"
            ? "Trending hits"
            : activeTab === "tamil"
            ? "Tamil top hits"
            : activeTab === "hindi"
            ? "Hindi top 50"
            : activeTab === "english"
            ? "English global charts"
            : activeTab === "latest"
            ? "New releases"
            : "All catalog & streams"}
        </h2>
        <span className="text-xs text-muted-foreground">{tracks.length} tracks found</span>
      </div>

      {/* Tracks */}
      <Swap stateKey={loading ? "loading" : tracks.length === 0 ? "empty" : viewMode}>
      {loading ? (
        <MediaGridSkeleton
          count={12}
          gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        />
      ) : tracks.length === 0 ? (
        <div className="mx-auto flex max-w-sm flex-col items-center justify-center space-y-3 py-24 text-center">
          <Music2 className="size-12 text-muted-foreground opacity-40" />
          <h3 className="text-base font-semibold text-foreground">No songs found</h3>
          <p className="text-xs text-muted-foreground">
            Try a different search keyword or switch to another discovery category.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setActiveTab("all");
            }}
            className="rounded-full px-5"
          >
            Reset filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <Stagger
          key={activeTab + debouncedQuery}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
          gap={0.04}
        >
          {tracks.map((track, idx) => (
            <StaggerItem key={track._id || track.id || `trk_${idx}`}>
              <MusicCard track={track} queueContext={tracks} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <MusicList tracks={tracks} />
      )}
      </Swap>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-foreground text-background shadow-sm"
          : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

