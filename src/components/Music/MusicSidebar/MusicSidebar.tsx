"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  Library,
  Disc3,
  ShieldAlert,
  Heart,
  Compass,
  Headphones,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MusicSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const mainLinks = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.library"), href: "/library", icon: Library },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 bg-black h-screen sticky top-0 border-r border-[#282828] p-4 text-[#b3b3b3] select-none z-30">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-3 px-3 py-4 text-white hover:opacity-90 transition-opacity">
        <div className="size-10 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-400 flex items-center justify-center text-black shadow-lg shadow-[#1db954]/20">
          <Headphones className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight leading-none text-white">Good Music</span>
          <span className="text-[10px] text-[#1db954] font-mono font-medium tracking-wider mt-0.5">STUDIO HI-FI</span>
        </div>
      </Link>

      {/* Main Navigation */}
      <div className="mt-6 flex flex-col gap-1">
        {mainLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-semibold transition-colors duration-200",
                isActive
                  ? "bg-[#282828] text-white"
                  : "text-[#b3b3b3] hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("size-5", isActive && "text-[#1db954]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Link if Authorized */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 mt-2",
              pathname.startsWith("/admin")
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-[#b3b3b3] hover:text-white hover:bg-white/5"
            )}
          >
            <ShieldAlert className="size-5 text-red-400" />
            <span>{t("nav.admin")}</span>
          </Link>
        )}
      </div>

      {/* Library & Playlists Section */}
      <div className="mt-8 flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#727272]">
          {t("nav.playlists")}
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          <Link
            href="/favorites"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors",
              pathname === "/favorites"
                ? "bg-[#282828] text-white"
                : "text-[#b3b3b3] hover:text-white hover:bg-white/5"
            )}
          >
            <div className="size-7 rounded bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center text-white shrink-0">
              <Heart className="size-3.5 fill-white" />
            </div>
            <span>{t("nav.favorites")}</span>
          </Link>

          <Link
            href="/library?category=pop"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium hover:text-white transition-colors"
          >
            <div className="size-7 rounded bg-gradient-to-br from-pink-600 to-rose-700 flex items-center justify-center text-white">
              <Disc3 className="size-3.5" />
            </div>
            <span>Top Pop Hits</span>
          </Link>

          <Link
            href="/library?category=rock"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium hover:text-white transition-colors"
          >
            <div className="size-7 rounded bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white">
              <Music2 className="size-3.5" />
            </div>
            <span>Rock Classics</span>
          </Link>

          <Link
            href="/library?category=jazz"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium hover:text-white transition-colors"
          >
            <div className="size-7 rounded bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white">
              <Compass className="size-3.5" />
            </div>
            <span>Midnight Jazz</span>
          </Link>
        </div>
      </div>

      {/* Footer Branding Info */}
      <div className="mt-auto pt-4 border-t border-[#282828] px-3 text-[11px] text-[#727272]">
        <p>&copy; {new Date().getFullYear()} Good Music</p>
        <p className="text-[10px] mt-0.5">Arun M &bull; Cloudflare Edge</p>
      </div>
    </aside>
  );
}

