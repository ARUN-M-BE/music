import { HeroSkeleton, TrackListSkeleton } from "@/shared/skeletons";

/** Route-level fallback for `/album/[id]`. */
export default function AlbumLoading() {
  return (
    <div className="space-y-8 pb-16" aria-busy="true" aria-live="polite">
      <HeroSkeleton variant="detail" />
      <TrackListSkeleton rows={8} />
    </div>
  );
}
