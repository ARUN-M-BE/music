import { PageHeaderSkeleton, MediaGridSkeleton } from "@/shared/skeletons";

/** Route-level fallback for `/profile`. */
export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-8" aria-busy="true" aria-live="polite">
      <PageHeaderSkeleton />
      <MediaGridSkeleton count={6} />
    </div>
  );
}
