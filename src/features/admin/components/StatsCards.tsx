"use client";

import React from "react";
import { MusicStats } from "@/types/music";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { Music, Disc, Mic2, Users, PlayCircle } from "lucide-react";
import { Stagger, StaggerItem } from "@/shared/motion";

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
      color: "from-chart-3/20 to-chart-3/10 text-chart-3 border-chart-3/20",
    },
    {
      title: t("admin.totalAlbums"),
      value: stats.totalAlbums,
      icon: Disc,
      color: "from-chart-5/20 to-chart-5/10 text-chart-5 border-chart-5/20",
    },
    {
      title: t("admin.totalArtists"),
      value: stats.totalArtists,
      icon: Mic2,
      color: "from-chart-4/20 to-chart-4/10 text-chart-4 border-chart-4/20",
    },
    {
      title: t("admin.totalUsers"),
      value: stats.totalUsers,
      icon: Users,
      color: "from-chart-1/20 to-chart-1/10 text-chart-1 border-chart-1/20",
    },
    {
      title: t("admin.totalPlays"),
      value: stats.totalPlays.toLocaleString(),
      icon: PlayCircle,
      color: "from-chart-2/20 to-chart-2/10 text-chart-2 border-chart-2/20",
    },
  ];

  return (
    <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" gap={0.04}>
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <StaggerItem key={idx}>
            <div
              className={`flex flex-col p-4 rounded-xl bg-gradient-to-br ${card.color} border backdrop-blur-md h-full`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                <Icon className="size-5 opacity-80" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-foreground mt-3">
                {card.value}
              </span>
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

