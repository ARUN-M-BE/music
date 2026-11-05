"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MusicTrack, Album, Artist } from "@/types/music";
import { musicService } from "@/services/music.service";
import { MusicCard } from "@/components/Music/MusicCard/MusicCard";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useLanguage } from "@/context/LanguageContext";
import { Play, Sparkles, ChevronRight, Disc, Mic2, Flame } from "lucide-react";

export default function MusicHomePage() {
  const { playTrack } = useMusicPlayer();
  const { t } = useLanguage();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      musicService.getSongs(),
      musicService.getAlbums(),
      musicService.getArtists(),
    ])
      .then(([songsData, albumsData, artistsData]) => {
        if (isMounted) {
          setTracks(songsData);
          setAlbums(albumsData);
          setArtists(artistsData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Home page data load error:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredTrack = tracks[0] || null;
  const popularTracks = [...tracks].sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0)).slice(0, 5);
  const recentTracks = tracks.slice(0, 10);

  const categories = [
  // Mainstream
  { name: "Pop", color: "from-pink-600 to-rose-700" },
  { name: "Rock", color: "from-orange-600 to-amber-700" },
  { name: "Hip Hop", color: "from-purple-600 to-indigo-800" },
  { name: "R&B", color: "from-blue-600 to-cyan-800" },
  { name: "Electronic", color: "from-emerald-600 to-teal-800" },
  { name: "Dance", color: "from-fuchsia-600 to-purple-800" },

  // Rock genres
  { name: "Alternative Rock", color: "from-red-600 to-rose-800" },
  { name: "Indie Rock", color: "from-orange-500 to-red-700" },
  { name: "Hard Rock", color: "from-gray-600 to-slate-900" },
  { name: "Heavy Metal", color: "from-zinc-700 to-black" },
  { name: "Punk Rock", color: "from-rose-700 to-red-900" },
  { name: "Progressive Rock", color: "from-indigo-600 to-blue-900" },
  { name: "Grunge", color: "from-stone-600 to-neutral-900" },

  // Hip Hop
  { name: "Rap", color: "from-violet-600 to-purple-900" },
  { name: "Trap", color: "from-purple-700 to-fuchsia-900" },
  { name: "Drill", color: "from-slate-700 to-gray-950" },
  { name: "Old School Hip Hop", color: "from-amber-600 to-orange-900" },
  { name: "Conscious Hip Hop", color: "from-green-600 to-emerald-900" },
  { name: "Lo-Fi Hip Hop", color: "from-indigo-500 to-violet-800" },

  // Electronic
  { name: "EDM", color: "from-cyan-500 to-blue-800" },
  { name: "House", color: "from-teal-500 to-emerald-800" },
  { name: "Techno", color: "from-blue-700 to-indigo-950" },
  { name: "Trance", color: "from-violet-600 to-indigo-900" },
  { name: "Dubstep", color: "from-lime-600 to-green-900" },
  { name: "Drum and Bass", color: "from-sky-600 to-blue-950" },
  { name: "Ambient", color: "from-cyan-600 to-teal-900" },
  { name: "Synthwave", color: "from-fuchsia-600 to-indigo-900" },
  { name: "Disco", color: "from-pink-500 to-purple-800" },

  // R&B and Soul
  { name: "Contemporary R&B", color: "from-blue-600 to-indigo-900" },
  { name: "Neo Soul", color: "from-amber-600 to-yellow-900" },
  { name: "Soul", color: "from-orange-600 to-red-900" },
  { name: "Funk", color: "from-yellow-600 to-orange-900" },
  { name: "Motown", color: "from-rose-600 to-pink-900" },

  // Jazz and Blues
  { name: "Jazz", color: "from-yellow-600 to-orange-800" },
  { name: "Smooth Jazz", color: "from-sky-600 to-indigo-800" },
  { name: "Bebop", color: "from-purple-600 to-blue-900" },
  { name: "Blues", color: "from-blue-800 to-slate-950" },
  { name: "Soul Jazz", color: "from-amber-700 to-red-900" },
  { name: "Swing", color: "from-orange-500 to-amber-900" },

  // Indian genres
  { name: "Indian Classical", color: "from-orange-600 to-amber-900" },
  { name: "Carnatic", color: "from-orange-500 to-red-800" },
  { name: "Hindustani Classical", color: "from-yellow-600 to-orange-900" },
  { name: "Tamil Film Songs", color: "from-rose-600 to-pink-900" },
  { name: "Tamil Indie", color: "from-purple-600 to-violet-900" },
  { name: "Bollywood", color: "from-pink-600 to-red-900" },
  { name: "Indian Pop", color: "from-fuchsia-600 to-purple-900" },
  { name: "Bhangra", color: "from-yellow-500 to-orange-800" },
  { name: "Punjabi", color: "from-orange-500 to-red-800" },
  { name: "Telugu Songs", color: "from-red-600 to-orange-900" },
  { name: "Malayalam Songs", color: "from-green-600 to-teal-900" },
  { name: "Kannada Songs", color: "from-amber-600 to-yellow-900" },
  { name: "Devotional", color: "from-yellow-500 to-orange-800" },
  { name: "Ghazal", color: "from-indigo-600 to-purple-900" },
  { name: "Qawwali", color: "from-emerald-600 to-green-900" },
  { name: "Melody", color: "from-emerald-600 to-green-900" },

  // Other world genres
  { name: "Country", color: "from-amber-700 to-yellow-950" },
  { name: "Folk", color: "from-green-600 to-lime-900" },
  { name: "Reggae", color: "from-green-500 to-yellow-800" },
  { name: "Latin", color: "from-red-600 to-orange-800" },
  { name: "Afrobeats", color: "from-yellow-600 to-green-900" },
  { name: "K-Pop", color: "from-pink-500 to-violet-900" },
  { name: "J-Pop", color: "from-rose-500 to-pink-900" },
  { name: "Gospel", color: "from-blue-600 to-indigo-900" },
  { name: "Opera", color: "from-purple-700 to-slate-950" },
  { name: "Classical", color: "from-stone-500 to-zinc-900" },

  // Mood and listening styles
  { name: "Acoustic", color: "from-lime-600 to-green-900" },
  { name: "Instrumental", color: "from-teal-600 to-cyan-900" },
  { name: "Lo-Fi", color: "from-indigo-500 to-purple-900" },
  { name: "Chillout", color: "from-cyan-500 to-blue-900" },
  { name: "Meditation", color: "from-emerald-500 to-teal-900" },
  { name: "Soundtracks", color: "from-violet-600 to-indigo-950" },
  { name: "Anime", color: "from-pink-600 to-purple-900" },
  { name: "Christmas", color: "from-red-600 to-green-900" },
  { name: "Kids Music", color: "from-yellow-500 to-pink-800" },
];

  return (
    <div className="space-y-10">
      {/* ================= HERO FEATURED BANNER ================= */}
      {featuredTrack ? (
        <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-[#121212] border border-white/10 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex-1 space-y-3 z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-[#1db954] uppercase tracking-wider">
              <Sparkles className="size-3.5" />
              <span>{t("home.heroBadge")}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {featuredTrack.name}
            </h1>
            <p className="text-sm sm:text-base text-[#b3b3b3] max-w-lg">
              Featured release by <span className="text-white font-semibold">{featuredTrack.artist}</span>. {featuredTrack.album && `Album: ${featuredTrack.album}.`} Stream now in studio fidelity.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button
                onClick={() => playTrack(featuredTrack, tracks)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-sm transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-[#1db954]/25"
              >
                <Play className="size-4 fill-black" />
                <span>{t("home.quickPlay")}</span>
              </button>
              <Link
                href="/library"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors"
              >
                {t("library.title")}
              </Link>
            </div>
          </div>

          <div className="relative size-44 sm:size-56 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 shrink-0">
            <Image
              src={featuredTrack.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
              alt={featuredTrack.name}
              fill
              sizes="224px"
              priority
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-gradient-to-r from-gray-900 to-[#181818] border border-white/5 text-center">
          <h2 className="text-2xl font-bold text-white">{t("home.heroTitle")}</h2>
          <p className="text-xs text-[#b3b3b3] mt-2">{t("home.heroSubtitle")}</p>
        </div>
      )}

      {/* ================= TRENDING & POPULAR ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t("home.popularTracks")}
            </h2>
          </div>
          <Link
            href="/library"
            className="flex items-center gap-1 text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors"
          >
            <span>{t("home.viewAll")}</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {popularTracks.map((track) => (
            <MusicCard key={track._id} track={track} queueContext={tracks} />
          ))}
        </div>
      </section>

      {/* ================= RECENTLY ADDED ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t("home.recentAdditions")}
          </h2>
          <Link
            href="/library"
            className="flex items-center gap-1 text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors"
          >
            <span>{t("home.viewAll")}</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recentTracks.map((track) => (
            <MusicCard key={track._id} track={track} queueContext={tracks} />
          ))}
        </div>
      </section>

      {/* ================= GENRE CATEGORIES ================= */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {t("home.browseCategories")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/library?category=${cat.name.toLowerCase()}`}
              className={`p-4 rounded-xl bg-gradient-to-br ${cat.color} hover:scale-105 active:scale-95 transition-transform flex flex-col justify-between h-28 shadow-lg cursor-pointer`}
            >
              <span className="font-extrabold text-sm text-white">{cat.name}</span>
              <span className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">
                Explore &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= FEATURED ARTISTS ================= */}
      {artists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Mic2 className="size-5 text-[#1db954]" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t("home.topArtists")}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {artists.map((art) => (
              <Link
                key={art._id}
                href={`/library?search=${encodeURIComponent(art.name)}`}
                className="group flex flex-col items-center text-center p-3 rounded-xl hover:bg-[#181818] transition-colors"
              >
                <div className="relative size-24 sm:size-28 rounded-full overflow-hidden bg-[#242424] shadow-lg group-hover:scale-105 transition-transform">
                  <Image
                    src={art.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                    alt={art.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="font-semibold text-xs text-white truncate mt-2 w-full">
                  {art.name}
                </span>
                <span className="text-[10px] text-[#b3b3b3]">Artist</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= FEATURED ALBUMS ================= */}
      {albums.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Disc className="size-5 text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t("home.curatedAlbums")}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((alb) => (
              <Link
                key={alb._id}
                href={`/library?search=${encodeURIComponent(alb.name)}`}
                className="group flex flex-col p-3 rounded-xl bg-[#181818] hover:bg-[#282828] transition-colors"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#242424] shadow-md group-hover:scale-105 transition-transform">
                  <Image
                    src={alb.imageURL || "https://cdn-icons-png.flaticon.com/512/3844/3844724.png"}
                    alt={alb.name}
                    fill
                    sizes="150px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="font-semibold text-xs text-white truncate mt-2">{alb.name}</span>
                <span className="text-[10px] text-[#b3b3b3]">Album</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

