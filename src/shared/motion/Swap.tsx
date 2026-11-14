"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { quick } from "./presets";

interface SwapProps {
  /**
   * Identity of the current state — usually "loading" / "empty" / "ready".
   * Changing it cross-fades the old content out before the new one fades in.
   */
  stateKey: string | number;
  children: React.ReactNode;
  className?: string;
  /** Wait for the exit animation before mounting the next state. */
  mode?: "wait" | "sync";
}

/**
 * Cross-fades between mutually exclusive states (skeleton → content, guess vs.
 * results, empty vs. populated). Skeleton placeholders get a soft hand-off
 * instead of popping out.
 */
export function Swap({ stateKey, children, className, mode = "wait" }: SwapProps) {
  return (
    <AnimatePresence mode={mode} initial={false}>
      <motion.div
        key={stateKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={quick}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
