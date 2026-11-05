"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useLanguage } from "@/context/LanguageContext";
import { musicService } from "@/services/music.service";
import { MusicTrack } from "@/types/music";
import { MusicCard } from "@/components/Music/MusicCard/MusicCard";
import { CheckCircle2, Clock, ShieldCheck, Heart, User } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { favorites } = useMusicPlayer();
  const { t } = useLanguage();
  const [favoriteTracks, setFavoriteTracks] = useState<MusicTrack[]>([]);

  useEffect(() => {
    if (favorites.length > 0) {
      musicService.getSongs().then((all) => {
        setFavoriteTracks(all.filter((track) => favorites.includes(track._id)));
      });
    } else {
      setFavoriteTracks([]);
    }
  }, [favorites]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="size-12 text-[#b3b3b3] mb-3 opacity-40" />
        <p className="text-sm text-[#b3b3b3]">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#181818] border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative size-28 sm:size-32 rounded-full overflow-hidden bg-[#242424] shadow-xl shrink-0 ring-4 ring-[#1db954]/20">
          <Image
            src={user.imageURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt={user.name}
            fill
            sizes="128px"
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-[#1db954]">
              {user.role} Account
            </span>
            {user.email_verified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="size-3" />
                {t("profile.verified")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Clock className="size-3" />
                {t("profile.unverified")}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {user.name}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#b3b3b3]">
            <div className="p-2.5 rounded-lg bg-[#242424]">
              <span className="text-[10px] text-[#727272] block">{t("profile.email")}</span>
              <span className="text-white font-mono mt-0.5 block">{user.email}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#242424]">
              <span className="text-[10px] text-[#727272] block">{t("profile.userId")}</span>
              <span className="text-white font-mono mt-0.5 block">{user.user_id}</span>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="px-4 py-2 rounded-full bg-[#333333] hover:bg-[#444444] text-xs font-semibold text-white transition-colors"
            >
              Sign Out / Switch Account
            </button>
            <a
              href="/login"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              Manage Logins
            </a>
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="size-5 text-red-500 fill-red-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t("profile.favorites")} ({favoriteTracks.length})
          </h2>
        </div>

        {favoriteTracks.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#181818] border border-white/5 text-center text-xs text-[#b3b3b3]">
            <p>You haven't liked any songs yet. Click the heart icon on any track to save it here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoriteTracks.map((track) => (
              <MusicCard key={track._id} track={track} queueContext={favoriteTracks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

