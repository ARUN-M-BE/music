import {
  HeroSkeleton,
  MediaGridSkeleton,
  SectionHeaderSkeleton,
} from "@/shared/skeletons";

/** Route-level fallback for `/` — mirrors the home hero + card rails. */
export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-12" aria-busy="true" aria-live="polite">
      <HeroSkeleton />
      <section>
        <SectionHeaderSkeleton />
        <MediaGridSkeleton count={5} className="mt-4" />
      </section>
      <section>
        <SectionHeaderSkeleton />
        <MediaGridSkeleton count={5} className="mt-4" />
      </section>
    </div>
  );
}
