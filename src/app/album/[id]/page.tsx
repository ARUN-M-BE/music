"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { UnifiedAlbum, UnifiedSong } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { formatTime } from "@/lib/utils";
import {
  Play,
  Pause,
  Heart,
  Disc3,
  Clock,
  ArrowLeft,
  Loader2,
  Calendar,
  Music2,
} from "lucide-react";

export default function AlbumDetailPage({
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

  const [album, setAlbum] = useState<UnifiedAlbum | null>(null);
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    musicService
      .getAlbumDetails(id)
      .then((data) => {
        if (isMounted && data) {
          setAlbum(data.album);
          setSongs(data.songs);
          setLoading(false);
        } else if (isMounted) {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load album details:", err);
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
        <p className="text-sm font-medium">Loading album tracklist & artwork...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto space-y-4">
        <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-[#727272]">
          <Disc3 className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Album Not Found</h2>
        <p className="text-xs text-[#b3b3b3]">
          We couldn&apos;t find tracklist details for this album.
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

  const isCurrentAlbumPlaying =
    currentTrack &&
    isPlaying &&
    songs.some((s) => (s.id || s._id) === (currentTrack.id || currentTrack._id));

  const handlePlayAlbum = () => {
    if (songs.length === 0) return;
    if (isCurrentAlbumPlaying) {
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

      {/* Album Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-rose-950/50 via-[#181818] to-[#121212] border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          <div className="relative size-44 sm:size-56 md:size-64 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 shrink-0 bg-[#242424]">
            <Image
              src={album.artwork || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"}
              alt={album.title}
              fill
              sizes="256px"
              priority
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1">
            <span className="text-xs uppercase tracking-widest font-extrabold text-[#1db954]">
              Album Release
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
              {album.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-[#b3b3b3]">
              <Link
                href={`/artist/${encodeURIComponent(album.artist)}`}
                className="font-bold text-white hover:underline hover:text-[#1db954] transition-colors"
              >
                {album.artist}
              </Link>
              <span>&bull;</span>
              <span>{album.releaseYear || 2024}</span>
              <span>&bull;</span>
              <span>{songs.length} songs</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex items-center justify-center sm:justify-start gap-4 pt-4 border-t border-white/5">
          <button
            onClick={handlePlayAlbum}
            disabled={songs.length === 0}
            className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-sm transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-[#1db954]/30"
          >
            {isCurrentAlbumPlaying ? (
              <>
                <Pause className="size-5 fill-black" />
                <span>Pause Album</span>
              </>
            ) : (
              <>
                <Play className="size-5 fill-black" />
                <span>Play Album</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Album Tracks Table */}
      <section className="space-y-4">
        <div className="rounded-2xl bg-[#181818]/60 border border-white/5 overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm text-[#b3b3b3]">
            <thead className="bg-[#121212] uppercase tracking-wider text-[11px] text-[#727272] border-b border-white/5">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden sm:table-cell">Artist</th>
                <th className="py-3 px-4 text-right pr-6">
                  <Clock className="size-4 inline" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {songs.map((song, idx) => {
                const songId = song.id || song._id || `album_song_${idx}`;
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
                            src={song.artwork || album.artwork || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60"}
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
                          <p className="text-xs text-[#727272] truncate sm:hidden">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell text-[#b3b3b3] truncate max-w-xs">
                      <Link
                        href={`/artist/${encodeURIComponent(song.artist)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline hover:text-white"
                      >
                        {song.artist}
                      </Link>
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
    </div>
  );
}

