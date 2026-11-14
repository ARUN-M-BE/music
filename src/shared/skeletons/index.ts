/**
 * Skeleton system — one reusable placeholder per real UI shape.
 *
 * Primitives wrap the design-system `Skeleton` (Material-style: `variant` +
 * `animation="wave"`); composites mirror the actual cards, rows, tables and
 * page frames so a loading screen never shifts layout when data lands.
 *
 * Usage rule: pick the composite that matches the content that is loading,
 * never hand-roll `<div className="animate-pulse">` blocks in feature code.
 */
export { Skeleton } from "@/shared/ui/skeleton";
export type { SkeletonAnimation, SkeletonVariant } from "@/shared/ui/skeleton";
export { SkeletonArtwork, SkeletonAvatar, SkeletonText } from "./primitives";
export {
  CarouselSkeleton,
  HeroSkeleton,
  MediaCardSkeleton,
  MediaGridSkeleton,
  PageHeaderSkeleton,
  SectionHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
  TrackListSkeleton,
  TrackRowSkeleton,
} from "./composites";
