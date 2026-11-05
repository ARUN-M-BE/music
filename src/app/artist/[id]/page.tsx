"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { UnifiedArtist, UnifiedSong } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { formatTime } from "@/lib/utils";
import {
  Play,
  Pause,
  Heart,
  Disc3,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Loader2,
  Music2,
} from "lucide-react";

export default function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    toggleFavorite,
    isFavorite,
  } = useMusicPlayer();

  const [artist, setArtist] = useState<UnifiedArtist | null>(null);
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    musicService
      .getArtistProfile(id)
      .then((data) => {
        if (isMounted && data) {
          setArtist(data.artist);
          setSongs(data.songs);
          setLoading(false);
        } else if (isMounted) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load artist profile:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[#b3b3b3]">
        <Loader2 className="size-10 animate-spin text-[#1db954] mb-3" />
        <p className="text-sm font-medium">Loading artist profile & catalog...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto space-y-4">
        <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-[#727272]">
          <Users className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Artist Not Found</h2>
        <p className="text-xs text-[#b3b3b3]">
          We couldn&apos;t find discography details for this artist.
        </p>
        <Link
          href="/library"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 transition-transform"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Music Library</span>
        </Link>
      </div>
    );
  }

  const isCurrentArtistPlaying =
    currentTrack &&
    isPlaying &&
    songs.some((s) => (s.id || s._id) === (currentTrack.id || currentTrack._id));

  const handlePlayArtist = () => {
    if (songs.length === 0) return;
    if (isCurrentArtistPlaying) {
      togglePlayPause();
    } else {
      playTrack(songs[0] as any, songs as any);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors"
      >
        <ArrowLeft className="size-4" />
        <span>Back to Library</span>
      </Link>

      {/* Artist Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-indigo-900/60 via-[#181818] to-[#121212] border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          <div className="relative size-36 sm:size-48 md:size-56 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10 shrink-0 bg-[#242424]">
            <Image
              src={artist.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt={artist.name}
              fill
              sizes="224px"
              priority
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1db954]/10 border border-[#1db954]/20 text-[11px] font-bold text-[#1db954] uppercase tracking-wider">
              <CheckCircle2 className="size-3.5" />
              <span>Verified Artist</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
              {artist.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#b3b3b3] max-w-2xl line-clamp-2">
              {artist.bio || `Top streaming artist on Good Music with ${songs.length} verified songs.`}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-[#b3b3b3] font-medium pt-1">
              <span>{artist.followerCount?.toLocaleString() || "350,000"} monthly listeners</span>
              <span>&bull;</span>
              <span>{songs.length} Tracks Available</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-8 flex items-center justify-center sm:justify-start gap-4 pt-4 border-t border-white/5">
          <button
            onClick={handlePlayArtist}
            disabled={songs.length === 0}
            className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-sm transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-[#1db954]/30"
          >
            {isCurrentArtistPlaying ? (
              <>
                <Pause className="size-5 fill-black" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-5 fill-black" />
                <span>Play Discography</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Popular Tracks Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Popular Tracks
          </h2>
          <span className="text-xs text-[#727272]">{songs.length} songs</span>
        </div>

        <div className="rounded-2xl bg-[#181818]/60 border border-white/5 overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm text-[#b3b3b3]">
            <thead className="bg-[#121212] uppercase tracking-wider text-[11px] text-[#727272] border-b border-white/5">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden md:table-cell">Album</th>
                <th className="py-3 px-4 hidden sm:table-cell">Language</th>
                <th className="py-3 px-4 text-right pr-6">
                  <Clock className="size-4 inline" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {songs.map((song, idx) => {
                const songId = song.id || song._id || `song_${idx}`;
                const isSelected =
                  currentTrack &&
                  (currentTrack.id === songId || currentTrack._id === songId);
                const isTrackPlaying = isSelected && isPlaying;
                const favorited = isFavorite(songId);

                return (
                  <tr
                    key={songId}
                    onClick={() => playTrack(song as any, songs as any)}
                    className="hover:bg-white/5 group cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-[#727272] group-hover:text-white">
                      {isTrackPlaying ? (
                        <div className="size-4 mx-auto text-[#1db954] flex items-center justify-center">
                          <span className="animate-pulse font-bold">&bull;&bull;&bull;</span>
                        </div>
                      ) : (
                        <span className="group-hover:hidden">{idx + 1}</span>
                      )}
                      <Play className="size-3.5 fill-white text-white mx-auto hidden group-hover:block" />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 rounded overflow-hidden shrink-0 bg-[#242424]">
                          <Image
                            src={song.artwork || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"}
                            alt={song.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`font-semibold truncate ${
                              isSelected ? "text-[#1db954]" : "text-white"
                            }`}
                          >
                            {song.title}
                          </p>
                          <p className="text-xs text-[#727272] truncate">{song.artist}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell text-[#b3b3b3] truncate max-w-xs">
                      {song.album || "Single"}
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell text-[#727272]">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[11px]">
                        {song.language || "Global"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right pr-6 text-xs text-[#727272]">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(songId);
                          }}
                          className="p-1 hover:text-white transition-colors"
                        >
                          <Heart
                            className={`size-4 ${
                              favorited ? "fill-[#1db954] text-[#1db954]" : "text-[#727272]"
                            }`}
                          />
                        </button>
                        <span>{formatTime(song.duration || 210)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Albums Section */}
      {artist.albums && artist.albums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Discography & Albums
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artist.albums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${encodeURIComponent(album.title)}`}
                className="group p-3.5 rounded-2xl bg-[#181818] border border-white/5 hover:bg-[#242424] transition-all duration-300 flex flex-col space-y-3 cursor-pointer shadow-lg"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#282828]">
                  <Image
                    src={album.artwork || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"}
                    alt={album.title}
                    fill
                    sizes="200px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="size-10 rounded-full bg-[#1db954] flex items-center justify-center text-black shadow-xl">
                      <Play className="size-5 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1db954] transition-colors">
                    {album.title}
                  </h3>
                  <p className="text-xs text-[#727272] mt-0.5">
                    {album.releaseYear || "Album"} &bull; {album.artist}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

