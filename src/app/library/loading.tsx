import {
  CarouselSkeleton,
  MediaGridSkeleton,
  PageHeaderSkeleton,
  SectionHeaderSkeleton,
} from "@/shared/skeletons";

/** Route-level fallback for `/library`. */
export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8" aria-busy="true" aria-live="polite">
      <PageHeaderSkeleton />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-9 w-28 shrink-0 rounded-full bg-muted" />
        ))}
      </div>
      <section>
        <SectionHeaderSkeleton />
        <CarouselSkeleton count={6} className="mt-4" />
      </section>
      <MediaGridSkeleton
        count={12}
        gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      />
    </div>
  );
}
