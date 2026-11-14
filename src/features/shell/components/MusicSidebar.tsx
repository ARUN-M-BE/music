"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { useAuth } from "@/features/auth";
import {
  Home,
  Library,
  Disc3,
  ShieldAlert,
  Heart,
  Headphones,
  Music2,
  Flame,
  Radio,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

/** Shared row styling: one shape for every navigation target in the rail. */
function navRowClasses(active: boolean, tone: "default" | "danger" = "default") {
  return cn(
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
    tone === "danger" && !active && "text-destructive/90 hover:text-destructive"
  );
}

export function MusicSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const mainLinks = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.library"), href: "/library", icon: Library },
    { label: t("nav.favorites"), href: "/favorites", icon: Heart },
  ];

  const collections = [
    { label: "Trending Hits", href: "/library?tab=trending", icon: Flame, tint: "from-chart-2 to-chart-2/60" },
    { label: "Tamil Hits", href: "/library?language=Tamil", icon: Music2, tint: "from-chart-1 to-chart-1/60" },
    { label: "Hindi Top 50", href: "/library?language=Hindi", icon: Disc3, tint: "from-chart-4 to-chart-4/60" },
    { label: "English Global", href: "/library?language=English", icon: Radio, tint: "from-chart-3 to-chart-3/60" },
  ];

  return (
    <aside className="sticky top-0 z-30 hidden h-dvh w-60 shrink-0 select-none flex-col border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground md:flex lg:w-64">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-3 rounded-xl px-2 py-3 transition-opacity hover:opacity-90"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/25">
          <Headphones className="size-5" />
        </span>
        <span className="flex flex-col">
          <span className="font-display text-base font-semibold leading-none tracking-tight">
            Good Music
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
            Studio Hi-Fi
          </span>
        </span>
      </Link>

      <nav className="mt-3 flex flex-col gap-1">
        {mainLinks.map((item) => {
          const isActive = pathname === item.href && !item.href.includes("?");
          return (
            <Link key={item.href} href={item.href} className={navRowClasses(isActive)}>
              <item.icon className={cn("size-5 shrink-0", isActive ? "text-primary" : "text-current")} />
              <span>{item.label}</span>
              {isActive && <span className="ml-auto size-1.5 rounded-full bg-primary" aria-hidden />}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-4 bg-sidebar-border" />

      {/* Collections */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("nav.playlists")}
          </span>
          <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-semibold">
            {collections.length}
          </Badge>
        </div>

        <ScrollArea className="-mr-2 flex-1 pr-2">
          <div className="flex flex-col gap-0.5">
            {collections.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-scrim-foreground shadow-sm",
                    item.tint
                  )}
                >
                  <item.icon className="size-3.5" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Footer tools */}
      <div className="mt-3 flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/api-monitor"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <Activity className="size-4" />
              <span>System status</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Health, logs and integrations</TooltipContent>
        </Tooltip>

        {isAdmin && (
          <Link
            href="/admin"
            className={navRowClasses(pathname.startsWith("/admin"), "danger")}
          >
            <ShieldAlert className="size-5 shrink-0" />
            <span>{t("nav.admin")}</span>
          </Link>
        )}
      </div>

      <Separator className="my-3 bg-sidebar-border" />

      <div className="px-2 pb-1 text-[11px] leading-relaxed text-muted-foreground">
        <p className="font-medium">&copy; {new Date().getFullYear()} Good Music</p>
        <p className="text-[10px] text-muted-foreground/70">Arun M &middot; Cloudflare Edge</p>
      </div>
    </aside>
  );
}
