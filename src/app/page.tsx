"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MusicTrack, Album, Artist } from "@/types/music";
import { musicService } from "@/services/music.service";
import { MusicCard } from "@/features/catalog";
import { useMusicPlayer } from "@/features/player";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { ChevronRight, Disc3, Flame, Mic2, Play, Sparkles, Library } from "lucide-react";
import { MUSIC_CATEGORIES } from "@/constants/categories";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  CarouselSkeleton,
  HeroSkeleton,
  MediaGridSkeleton,
} from "@/shared/skeletons";
import { Reveal, Stagger, StaggerItem, Swap } from "@/shared/motion";

const CARD_GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

function SectionHeader({
  icon: Icon,
  title,
  href,
  action,
}: {
  icon: React.ElementType;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="font-display flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
        <Icon className="size-5 text-primary" />
        {title}
      </h2>
      {href && action && (
        <Button asChild variant="ghost" size="sm" className="gap-1 rounded-full text-xs text-muted-foreground">
          <Link href={href}>
            {action}
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function MusicHomePage() {
  const { playTrack } = useMusicPlayer();
  const { t } = useLanguage();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([musicService.getSongs(), musicService.getAlbums(), musicService.getArtists()])
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
  const popularTracks = [...tracks]
    .sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0))
    .slice(0, 5);
  const recentTracks = tracks.slice(0, 10);

  const displayedCategories = showAllCategories ? MUSIC_CATEGORIES : MUSIC_CATEGORIES.slice(0, 12);

  return (
    <div className="mx-auto max-w-[1600px] space-y-12">
      {/* Hero — cross-fades from its skeleton into real content. */}
      <Swap stateKey={loading ? "loading" : featuredTrack ? "ready" : "empty"}>
        {loading ? (
          <HeroSkeleton />
        ) : featuredTrack ? (
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
            <div className="brand-glow absolute inset-0" aria-hidden />
            <div className="relative flex flex-col items-center justify-between gap-8 p-6 sm:p-10 md:flex-row">
              <div className="z-10 max-w-xl space-y-4 text-center md:text-left">
                <Badge className="gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/15">
                  <Sparkles className="size-3.5" />
                  {t("home.heroBadge")}
                </Badge>

                <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                  {featuredTrack.name}
                </h1>

                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Featured release by{" "}
                  <span className="font-semibold text-foreground">{featuredTrack.artist}</span>
                  {featuredTrack.album && <> · Album: {featuredTrack.album}</>}. Stream now in studio
                  fidelity.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
                  <Button
                    size="lg"
                    onClick={() => playTrack(featuredTrack, tracks)}
                    className="gap-2 rounded-full px-6 font-bold shadow-lg shadow-primary/25"
                  >
                    <Play className="size-4 fill-current" />
                    {t("home.quickPlay")}
                  </Button>
                  <Button asChild size="lg" variant="outline" className="gap-2 rounded-full px-6">
                    <Link href="/library">
                      <Library className="size-4" />
                      {t("library.title")}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative size-44 shrink-0 sm:size-56">
                <div className="absolute -inset-3 rounded-[2rem] bg-primary/20 blur-2xl" aria-hidden />
                <div className="relative size-full overflow-hidden rounded-3xl ring-1 ring-border shadow-2xl">
                  <Image
                    src={featuredTrack.imageURL || "/default-song.png"}
                    alt={featuredTrack.name}
                    fill
                    sizes="224px"
                    priority
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <h2 className="font-display text-2xl font-semibold">{t("home.heroTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("home.heroSubtitle")}</p>
            <Button asChild className="mt-5 rounded-full">
              <Link href="/admin">Add your first track</Link>
            </Button>
          </section>
        )}
      </Swap>

      {/* Popular */}
      <section>
        <Reveal>
          <SectionHeader
            icon={Flame}
            title={t("home.popularTracks")}
            href="/library"
            action={t("home.viewAll")}
          />
        </Reveal>
        {loading ? (
          <MediaGridSkeleton count={5} gridClassName={CARD_GRID} />
        ) : popularTracks.length ? (
          <Stagger className={CARD_GRID}>
            {popularTracks.map((track) => (
              <StaggerItem key={track._id}>
                <MusicCard track={track} queueContext={tracks} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">No tracks yet.</p>
        )}
      </section>

      {/* Recently added */}
      <section>
        <Reveal>
          <SectionHeader
            icon={Sparkles}
            title={t("home.recentAdditions")}
            href="/library"
            action={t("home.viewAll")}
          />
        </Reveal>
        {loading ? (
          <MediaGridSkeleton count={5} gridClassName={CARD_GRID} />
        ) : recentTracks.length ? (
          <Stagger className={CARD_GRID} gap={0.04}>
            {recentTracks.map((track) => (
              <StaggerItem key={track._id}>
                <MusicCard track={track} queueContext={tracks} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </section>

      {/* Categories */}
      <section>
        <Reveal>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="font-display flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              <Disc3 className="size-5 text-primary" />
              {t("home.browseCategories")}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCategories((prev) => !prev)}
              aria-expanded={showAllCategories}
              className="gap-1.5 rounded-full text-xs text-primary hover:text-primary"
            >
              {showAllCategories ? "Show less" : `View all (${MUSIC_CATEGORIES.length})`}
              <ChevronRight
                className={`size-3.5 transition-transform ${showAllCategories ? "rotate-90" : ""}`}
              />
            </Button>
          </div>
        </Reveal>

        <Stagger
          key={showAllCategories ? "all" : "less"}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          gap={0.03}
        >
          {displayedCategories.map((cat) => (
            <StaggerItem key={cat.name}>
              <Link
                href={`/library?category=${encodeURIComponent(cat.name)}`}
                className={`group relative flex h-28 flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-sm ring-1 ring-scrim/10 transition-transform hover:-translate-y-0.5 hover:shadow-lg ${cat.color}`}
              >
                <span className="font-display text-sm font-semibold text-scrim-foreground drop-shadow-sm">
                  {cat.name}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-scrim-foreground/80">
                  Explore &rarr;
                </span>
                <span className="pointer-events-none absolute -bottom-6 -right-4 size-20 rounded-full bg-scrim-foreground/10 blur-xl transition-transform group-hover:scale-125" />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Artists */}
      {(loading || artists.length > 0) && (
        <section>
          <Reveal>
            <SectionHeader icon={Mic2} title={t("home.topArtists")} />
          </Reveal>
          {loading ? (
            <CarouselSkeleton count={6} />
          ) : (
            <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {artists.map((art) => (
                <StaggerItem key={art._id}>
                  <Link
                    href={`/library?search=${encodeURIComponent(art.name)}`}
                    className="group flex flex-col items-center rounded-2xl p-3 text-center transition-colors hover:bg-card"
                  >
                    <div className="relative size-24 overflow-hidden rounded-full bg-muted shadow-md ring-2 ring-transparent transition-all group-hover:ring-primary/40 sm:size-28">
                      <Image
                        src={art.imageURL || "/default-avatar.png"}
                        alt={art.name}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                    <span className="mt-3 w-full truncate text-xs font-semibold text-foreground">
                      {art.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Artist
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </section>
      )}

      {/* Albums */}
      {(loading || albums.length > 0) && (
        <section>
          <Reveal>
            <SectionHeader icon={Disc3} title={t("home.curatedAlbums")} />
          </Reveal>
          {loading ? (
            <MediaGridSkeleton count={5} gridClassName={CARD_GRID} />
          ) : (
            <Stagger className={CARD_GRID} gap={0.04}>
              {albums.map((alb) => (
                <StaggerItem key={alb._id}>
                  <Link
                    href={`/library?search=${encodeURIComponent(alb.name)}`}
                    className="group flex flex-col rounded-2xl border border-transparent bg-card p-2.5 transition-all hover:border-border hover:shadow-lg hover:shadow-scrim/10"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={alb.imageURL || "/default-song.png"}
                        alt={alb.name}
                        fill
                        sizes="200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                    <span className="mt-3 truncate text-sm font-semibold">{alb.name}</span>
                    <span className="text-[11px] text-muted-foreground">Album</span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </section>
      )}
    </div>
  );
}
