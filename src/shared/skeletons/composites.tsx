import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { SkeletonArtwork, SkeletonAvatar, SkeletonText } from "./primitives";

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/** Placeholder shaped like <MusicCard>: artwork, title, artist, accent line. */
export function MediaCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-2.5", className)}>
      <SkeletonArtwork />
      <div className="mt-3 space-y-2 px-1 pb-1">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Responsive grid of card placeholders — the grid classes are the caller's. */
export function MediaGridSkeleton({
  count = 10,
  className,
  gridClassName = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
}: {
  count?: number;
  className?: string;
  gridClassName?: string;
}) {
  return (
    <div className={cn(gridClassName, className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        <MediaCardSkeleton key={index} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tracks                                                              */
/* ------------------------------------------------------------------ */

/** Placeholder shaped like one row of <MusicList>. */
export function TrackRowSkeleton({ showAlbum = true }: { showAlbum?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-3 w-4 shrink-0" />
      <Skeleton className="size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/5" />
      </div>
      {showAlbum && <Skeleton className="hidden h-3 w-24 md:block" />}
      <Skeleton className="h-3 w-10 shrink-0" />
      <Skeleton variant="circular" className="hidden size-7 shrink-0 sm:block" />
    </div>
  );
}

/** Card-wrapped list of row placeholders. */
export function TrackListSkeleton({
  rows = 6,
  showAlbum = true,
  className,
}: {
  rows?: number;
  showAlbum?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("divide-y divide-border/60 rounded-2xl border border-border bg-card/60 p-1", className)}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <TrackRowSkeleton key={index} showAlbum={showAlbum} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

/** Placeholder for the admin/favorites tables: header row + body rows. */
export function TableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3" style={{ width: `${100 / columns}%` }} />
        ))}
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="size-9 shrink-0 rounded-md" />
            {Array.from({ length: columns - 1 }).map((_, column) => (
              <Skeleton key={column} className="h-3" style={{ width: `${80 / columns}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page frames                                                         */
/* ------------------------------------------------------------------ */

/** Placeholder for a section title + "view all" affordance. */
export function SectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/**
 * Hero placeholder.
 * - `wide`: home banner (artwork on the right, copy on the left)
 * - `detail`: album/artist header (large square or round portrait + meta)
 */
export function HeroSkeleton({
  variant = "wide",
  className,
}: {
  variant?: "wide" | "detail";
  className?: string;
}) {
  if (variant === "detail") {
    return (
      <div
        className={cn(
          "rounded-3xl border border-border bg-card p-6 sm:p-10",
          className
        )}
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
          <Skeleton className="size-36 shrink-0 rounded-full sm:size-48 md:size-56" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="mx-auto h-5 w-28 rounded-full sm:mx-0" />
            <Skeleton className="mx-auto h-9 w-3/4 sm:mx-0 md:h-12" />
            <SkeletonText lines={2} className="mx-auto max-w-lg sm:mx-0" />
            <Skeleton className="mx-auto h-10 w-40 rounded-full sm:mx-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10",
        className
      )}
      aria-busy="true"
    >
      <div className="flex flex-col-reverse items-center gap-8 md:flex-row md:justify-between">
        <div className="w-full space-y-4 md:max-w-lg">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-9 w-full md:h-12" />
          <SkeletonText lines={2} />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </div>
        <Skeleton className="size-48 rounded-2xl sm:size-56 md:size-64" />
      </div>
    </div>
  );
}

/** Placeholder for a page-level heading block (title, subtitle, actions). */
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-8 w-64 max-w-full md:h-10" />
        <SkeletonText lines={1} className="max-w-md" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
    </div>
  );
}

/** Placeholder for the admin KPI row. */
export function StatCardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)} aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for carousels of artists / albums. */
export function CarouselSkeleton({
  count = 6,
  variant = "circle",
  className,
}: {
  count?: number;
  variant?: "circle" | "square";
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4 overflow-hidden", className)} aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-32 shrink-0 space-y-3 sm:w-36">
          {variant === "circle" ? (
            <SkeletonAvatar size="size-32" className="mx-auto sm:size-36" />
          ) : (
            <Skeleton className="size-32 rounded-2xl sm:size-36" />
          )}
          <Skeleton className="mx-auto h-3 w-3/4" />
          <Skeleton className="mx-auto h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}
