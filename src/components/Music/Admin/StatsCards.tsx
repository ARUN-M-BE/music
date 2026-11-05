"use client";

import React from "react";
import { MusicStats } from "@/types/music";
import { useLanguage } from "@/context/LanguageContext";
import { Music, Disc, Mic2, Users, PlayCircle } from "lucide-react";

interface StatsCardsProps {
  stats: MusicStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useLanguage();

  const cards = [
    {
      title: t("admin.totalSongs"),
      value: stats.totalSongs,
      icon: Music,
      color: "from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20",
    },
    {
      title: t("admin.totalAlbums"),
      value: stats.totalAlbums,
      icon: Disc,
      color: "from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20",
    },
    {
      title: t("admin.totalArtists"),
      value: stats.totalArtists,
      icon: Mic2,
      color: "from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/20",
    },
    {
      title: t("admin.totalUsers"),
      value: stats.totalUsers,
      icon: Users,
      color: "from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: t("admin.totalPlays"),
      value: stats.totalPlays.toLocaleString(),
      icon: PlayCircle,
      color: "from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <div
            key={idx}
            className={`flex flex-col p-4 rounded-xl bg-gradient-to-br ${card.color} border backdrop-blur-md`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#b3b3b3]">{card.title}</span>
              <Icon className="size-5 opacity-80" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              {card.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

