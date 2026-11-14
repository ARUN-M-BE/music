"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { easeOut, viewportOnce } from "./presets";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate"> {
  /** Delay in seconds, handy when stacking sibling reveals. */
  delay?: number;
  /** Vertical travel distance in px. */
  y?: number;
  /** Replay the animation every time it enters the viewport. */
  repeat?: boolean;
}

/**
 * Reveals its children once they scroll into view.
 *
 * Automatically disabled for users who ask for reduced motion, because
 * `<MotionConfig reducedMotion="user">` in the root layout strips transforms.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  repeat = false,
  ...rest
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={repeat ? { margin: "-80px" } : viewportOnce}
      transition={{ ...easeOut, delay }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps extends HTMLMotionProps<"div"> {
  delay?: number;
  /** Seconds between each child. */
  gap?: number;
}

/**
 * Ceiling for the whole cascade. Without it a 100-card grid would still be
 * fading in five seconds later, so long lists trade per-item delay for a
 * snappier group reveal.
 */
const MAX_STAGGER_SPREAD = 0.8;

/** Container that reveals `StaggerItem` children one after another. */
export function Stagger({ children, className, delay = 0, gap = 0.055, ...rest }: StaggerProps) {
  const childCount = React.Children.count(children);
  const step = childCount > 1 ? Math.min(gap, MAX_STAGGER_SPREAD / (childCount - 1)) : gap;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: step, delayChildren: delay } },
      }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Child of <Stagger>. Animates itself in with the shared fade-up curve. */
export function StaggerItem({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: easeOut },
      }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
