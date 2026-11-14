import { PageHeaderSkeleton, TrackListSkeleton } from "@/shared/skeletons";

/** Route-level fallback for `/favorites`. */
export default function FavoritesLoading() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6" aria-busy="true" aria-live="polite">
      <PageHeaderSkeleton />
      <TrackListSkeleton rows={8} />
    </div>
  );
}
