import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

interface SkeletonTextProps {
  /** Number of placeholder lines. */
  lines?: number;
  /** Per-line width classes; the last line defaults to 2/3 width. */
  widths?: string[];
  className?: string;
  lineClassName?: string;
}

/** Paragraph placeholder with an optically natural taper on the last line. */
export function SkeletonText({ lines = 1, widths, className, lineClassName }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={cn(
            "h-3",
            widths?.[index] ?? (lines > 1 && index === lines - 1 ? "w-2/3" : "w-full"),
            lineClassName
          )}
        />
      ))}
    </div>
  );
}

/** Square-ish artwork placeholder that keeps its 1:1 aspect ratio. */
export function SkeletonArtwork({ className }: { className?: string }) {
  return <Skeleton className={cn("aspect-square w-full rounded-xl", className)} />;
}

/** Round avatar / artist portrait placeholder. */
export function SkeletonAvatar({
  size = "size-10",
  className,
}: {
  size?: string;
  className?: string;
}) {
  return <Skeleton variant="circular" className={cn(size, className)} />;
}
