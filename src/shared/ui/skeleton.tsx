import { cn } from "@/lib/utils"

type SkeletonVariant = "text" | "rectangular" | "rounded" | "circular"
type SkeletonAnimation = "wave" | "pulse" | "none"

/**
 * MUI-style skeleton placeholder.
 *
 * Mirrors the Material API so loading UI is predictable:
 * - `variant`: text | rectangular | rounded | circular
 * - `animation`: wave (default, a highlight sweeps across) | pulse | none
 *
 * Sizing is done with Tailwind classes (`h-4 w-3/4`), exactly like the rest of
 * the design system, and every instance is hidden from assistive tech because
 * the surrounding loading region announces itself.
 */
function Skeleton({
  className,
  variant = "rounded",
  animation = "wave",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: SkeletonVariant
  animation?: SkeletonAnimation
}) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      data-animation={animation}
      aria-hidden="true"
      className={cn(
        "shrink-0",
        variant === "circular" && "rounded-full",
        variant === "rounded" && "rounded-md",
        variant === "text" && "rounded-sm",
        animation === "wave" && "skeleton-wave",
        animation === "pulse" && "animate-pulse bg-accent",
        animation === "none" && "bg-accent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
export type { SkeletonAnimation, SkeletonVariant }
