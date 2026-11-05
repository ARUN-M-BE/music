"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MusicTrack, UnifiedSong, Artist, Album } from "@/types/music";
import { musicService } from "@/services/music.service";
import { MusicCard } from "../MusicCard/MusicCard";
import { MusicList } from "../MusicList/MusicList";
import { useLanguage } from "@/context/LanguageContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import {
  LayoutGrid,
  List,
  Loader2,
  Search,
  Flame,
  Sparkles,
  Music2,
  Disc3,
  Radio,
  Play,
  Heart,
  Globe,
  SlidersHorizontal,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicLibraryProps {
  initialTracks?: MusicTrack[];
}

type TabType = "all" | "trending" | "tamil" | "hindi" | "english" | "latest";

export function MusicLibrary({ initialTracks = [] }: MusicLibraryProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") || "all") as TabType;
  const initialLang = searchParams.get("language") || "";

  const [activeTab, setActiveTab] = useState<TabType>(
    initialLang ? (initialLang.toLowerCase() as TabType) : initialTab
  );
  const [tracks, setTracks] = useState<MusicTrack[]>(initialTracks);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  const { playTrack } = useMusicPlayer();
  const { t } = useLanguage();

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
      .catch((err) => console.warn("Failed to fetch library widgets:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Main Fetch Effect (combines API Aggregator + MongoDB live catalog)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

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

          if (isMounted) {
            // Also merge any local catalog matches
            const localMatches = await musicService.getSongs({ search: debouncedQuery });
            const merged = [...localMatches, ...results.map(mapUnifiedToTrack)];
            setTracks(dedupeTracks(merged));
            setLoading(false);
          }
          return;
        }

        // Tab selection logic
        if (activeTab === "trending") {
          const trending = await musicService.getTrendingMusic();
          if (isMounted) {
            setTracks(trending.map(mapUnifiedToTrack));
            setLoading(false);
          }
        } else if (activeTab === "tamil") {
          const [saavnTamil, dbTamil] = await Promise.all([
            musicService.searchAggregatedMusic("tamil hits 2024", "Tamil", 25),
            musicService.getSongs({ language: "Tamil" }),
          ]);
          if (isMounted) {
            const merged = [...dbTamil, ...saavnTamil.map(mapUnifiedToTrack)];
            setTracks(dedupeTracks(merged));
            setLoading(false);
          }
        } else if (activeTab === "hindi") {
          const [saavnHindi, dbHindi] = await Promise.all([
            musicService.searchAggregatedMusic("hindi top hits bollywood", "Hindi", 25),
            musicService.getSongs({ language: "Hindi" }),
          ]);
          if (isMounted) {
            const merged = [...dbHindi, ...saavnHindi.map(mapUnifiedToTrack)];
            setTracks(dedupeTracks(merged));
            setLoading(false);
          }
        } else if (activeTab === "english") {
          const [itunesEnglish, dbEnglish] = await Promise.all([
            musicService.searchAggregatedMusic("top billboard hits pop", "English", 25),
            musicService.getSongs({ language: "English" }),
          ]);
          if (isMounted) {
            const merged = [...dbEnglish, ...itunesEnglish.map(mapUnifiedToTrack)];
            setTracks(dedupeTracks(merged));
            setLoading(false);
          }
        } else if (activeTab === "latest") {
          const [saavnNew, dbNew] = await Promise.all([
            musicService.searchAggregatedMusic("latest releases 2024 songs", undefined, 25),
            musicService.getSongs({ sortBy: "newest" }),
          ]);
          if (isMounted) {
            const merged = [...dbNew, ...saavnNew.map(mapUnifiedToTrack)];
            setTracks(dedupeTracks(merged));
            setLoading(false);
          }
        } else {
          // "all" - Catalog + Streaming discovery
          const [dbSongs, trendingSongs] = await Promise.all([
            musicService.getSongs(),
            musicService.getTrendingMusic(),
          ]);
          if (isMounted) {
            const merged = [...dbSongs, ...trendingSongs.map(mapUnifiedToTrack)];
            setTracks(dedupeTracks(merged));
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("MusicLibrary load error:", err);
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeTab]);

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Title Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#282828]">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Music2 className="size-8 text-[#1db954]" />
            <span>Good Music Discovery</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1">
            Unlimited Streaming &bull; JioSaavn, iTunes &amp; Hi-Fi Catalog
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#181818] border border-white/5 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid" ? "bg-[#282828] text-white" : "text-[#727272] hover:text-white"
            )}
            title="Grid View"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list" ? "bg-[#282828] text-white" : "text-[#727272] hover:text-white"
            )}
            title="List View"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Real-time Search Input */}
      <div className="relative max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#727272]">
          <Search className="size-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by song title, artist, album, or genre..."
          className="w-full pl-11 pr-10 py-3.5 rounded-full bg-[#181818] border border-white/10 text-white placeholder-[#727272] text-sm focus:outline-none focus:border-[#1db954] focus:ring-1 focus:ring-[#1db954] transition-all shadow-lg"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#727272] hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Discovery Tabs (Curated Categories) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <TabButton
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
          icon={<Globe className="size-3.5" />}
          label="All Music"
        />
        <TabButton
          active={activeTab === "trending"}
          onClick={() => setActiveTab("trending")}
          icon={<Flame className="size-3.5 text-amber-500" />}
          label="Trending Songs"
        />
        <TabButton
          active={activeTab === "tamil"}
          onClick={() => setActiveTab("tamil")}
          icon={<Sparkles className="size-3.5 text-emerald-400" />}
          label="Tamil Hits"
        />
        <TabButton
          active={activeTab === "hindi"}
          onClick={() => setActiveTab("hindi")}
          icon={<Disc3 className="size-3.5 text-rose-400" />}
          label="Hindi Songs"
        />
        <TabButton
          active={activeTab === "english"}
          onClick={() => setActiveTab("english")}
          icon={<Radio className="size-3.5 text-cyan-400" />}
          label="English Global"
        />
        <TabButton
          active={activeTab === "latest"}
          onClick={() => setActiveTab("latest")}
          icon={<Sparkles className="size-3.5 text-purple-400" />}
          label="Latest Releases"
        />
      </div>

      {/* Popular Artists Carousel */}
      {!debouncedQuery && popularArtists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="size-4 text-[#1db954]" />
              <span>Popular Artists</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
            {popularArtists.map((artist) => (
              <Link
                key={artist._id}
                href={`/artist/${encodeURIComponent(artist.name)}`}
                className="group flex flex-col items-center p-3 rounded-2xl bg-[#181818] hover:bg-[#242424] border border-white/5 transition-all shrink-0 w-32 sm:w-36 text-center cursor-pointer shadow-md"
              >
                <div className="relative size-20 sm:size-24 rounded-full overflow-hidden bg-[#282828] shadow-md group-hover:ring-2 ring-[#1db954] transition-all">
                  <Image
                    src={artist.imageURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={artist.name}
                    fill
                    sizes="96px"
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                </div>
                <span className="font-bold text-xs text-white mt-2.5 truncate w-full group-hover:text-[#1db954] transition-colors">
                  {artist.name}
                </span>
                <span className="text-[10px] text-[#727272] uppercase font-semibold mt-0.5">
                  Artist
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular Albums Carousel */}
      {!debouncedQuery && popularAlbums.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Disc3 className="size-4 text-purple-400" />
              <span>Featured Albums</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
            {popularAlbums.map((album) => (
              <Link
                key={album._id}
                href={`/album/${encodeURIComponent(album.name)}`}
                className="group flex flex-col p-3 rounded-2xl bg-[#181818] hover:bg-[#242424] border border-white/5 transition-all shrink-0 w-36 sm:w-40 cursor-pointer shadow-md"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#282828] shadow-md">
                  <Image
                    src={album.imageURL || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"}
                    alt={album.name}
                    fill
                    sizes="160px"
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                </div>
                <span className="font-bold text-xs text-white mt-2.5 truncate group-hover:text-[#1db954] transition-colors">
                  {album.name}
                </span>
                <span className="text-[10px] text-[#727272] truncate mt-0.5">
                  {album.artist}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Track Results Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          {debouncedQuery
            ? `Results for "${debouncedQuery}"`
            : activeTab === "trending"
            ? "Trending Hits"
            : activeTab === "tamil"
            ? "Tamil Top Hits"
            : activeTab === "hindi"
            ? "Hindi Top 50"
            : activeTab === "english"
            ? "English Global Charts"
            : activeTab === "latest"
            ? "New Releases"
            : "All Catalog & Streams"}
        </h2>
        <span className="text-xs text-[#727272]">{tracks.length} tracks found</span>
      </div>

      {/* Main Tracks Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#b3b3b3]">
          <Loader2 className="size-8 animate-spin text-[#1db954] mb-3" />
          <p className="text-sm font-medium">Aggregating live music streams...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto space-y-3">
          <Music2 className="size-12 text-[#727272] opacity-40" />
          <h3 className="text-base font-bold text-white">No songs found</h3>
          <p className="text-xs text-[#b3b3b3]">
            Try a different search keyword or switch to another discovery category.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveTab("all");
            }}
            className="px-5 py-2 rounded-full bg-[#242424] hover:bg-[#333333] text-xs font-bold text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {tracks.map((track, idx) => (
            <MusicCard key={track._id || track.id || `trk_${idx}`} track={track} queueContext={tracks} />
          ))}
        </div>
      ) : (
        <MusicList tracks={tracks} />
      )}
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
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm select-none",
        active
          ? "bg-white text-black shadow-white/10"
          : "bg-[#181818] text-[#b3b3b3] hover:text-white hover:bg-[#282828] border border-white/5"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function mapUnifiedToTrack(s: UnifiedSong): MusicTrack {
  return {
    _id: s.id,
    id: s.id,
    name: s.title,
    title: s.title,
    artist: s.artist,
    album: s.album,
    imageURL: s.artwork,
    artwork: s.artwork,
    songURL: s.streamUrl || s.previewUrl,
    previewUrl: s.previewUrl,
    streamUrl: s.streamUrl,
    duration: s.duration,
    language: s.language,
    category: s.language || "Music",
    playsCount: 0,
    provider: s.provider,
    releaseYear: s.releaseYear,
    externalUrl: s.externalUrl,
  };
}

function dedupeTracks(tracks: MusicTrack[]): MusicTrack[] {
  const seen = new Set<string>();
  const out: MusicTrack[] = [];

  for (const t of tracks) {
    const key = `${(t.name || t.title || "").toLowerCase()}__${(t.artist || "").toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }

  return out;
}
