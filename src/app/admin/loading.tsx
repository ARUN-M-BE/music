import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/shared/skeletons";

/** Route-level fallback for `/admin`. */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
