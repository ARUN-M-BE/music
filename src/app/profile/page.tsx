"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { useMusicPlayer } from "@/features/player";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { musicService } from "@/services/music.service";
import { MusicTrack } from "@/types/music";
import { MusicCard } from "@/features/catalog";
import { MediaGridSkeleton } from "@/shared/skeletons";
import { Reveal, Stagger, StaggerItem } from "@/shared/motion";
import { CheckCircle2, Clock, Heart, User } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { favorites } = useMusicPlayer();
  const { t } = useLanguage();
  const router = useRouter();
  const [catalog, setCatalog] = useState<MusicTrack[] | null>(null);

  // Load the catalog once and derive the liked songs from it. Deriving instead
  // of copying into state means the "no songs yet" message can never flash
  // while a request is still in flight.
  useEffect(() => {
    let cancelled = false;
    musicService
      .getSongs()
      .then((all) => {
        if (!cancelled) setCatalog(all);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const favoriteTracks = useMemo(
    () => (catalog ?? []).filter((track) => favorites.includes(track._id)),
    [catalog, favorites]
  );
  const loadingFavorites = catalog === null && favorites.length > 0;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="size-12 text-muted-foreground mb-3 opacity-40" />
        <p className="text-sm text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Profile Card */}
      <Reveal className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative size-28 sm:size-32 rounded-full overflow-hidden bg-muted shadow-xl shrink-0 ring-4 ring-primary/20">
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
            <span className="text-xs uppercase tracking-wider font-bold text-primary">
              {user.role} Account
            </span>
            {user.email_verified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="size-3" />
                {t("profile.verified")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                <Clock className="size-3" />
                {t("profile.unverified")}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {user.name}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground">
            <div className="p-2.5 rounded-lg bg-muted">
              <span className="text-[10px] text-muted-foreground/70 block">{t("profile.email")}</span>
              <span className="text-foreground font-mono mt-0.5 block">{user.email}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted">
              <span className="text-[10px] text-muted-foreground/70 block">{t("profile.userId")}</span>
              <span className="text-foreground font-mono mt-0.5 block">{user.user_id}</span>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="px-4 py-2 rounded-full bg-muted hover:bg-accent text-xs font-semibold text-foreground transition-colors"
            >
              Sign Out / Switch Account
            </button>
            <a
              href="/login"
              className="px-4 py-2 rounded-full bg-foreground/10 hover:bg-foreground/15 text-xs font-semibold text-foreground transition-colors"
            >
              Manage Logins
            </a>
          </div>
        </div>
      </Reveal>

      {/* Favorites Section */}
      <Reveal delay={0.05} className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="size-5 text-destructive fill-destructive" />
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {t("profile.favorites")} ({favoriteTracks.length})
          </h2>
        </div>

        {loadingFavorites ? (
          <MediaGridSkeleton
            count={5}
            gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          />
        ) : favoriteTracks.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border text-center text-xs text-muted-foreground">
            <p>You haven&apos;t liked any songs yet. Click the heart icon on any track to save it here!</p>
          </div>
        ) : (
          <Stagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" gap={0.04}>
            {favoriteTracks.map((track) => (
              <StaggerItem key={track._id}>
                <MusicCard track={track} queueContext={favoriteTracks} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Reveal>
    </div>
  );
}

