"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { quick } from "./presets";

/**
 * Route-level entrance animation for the App Router.
 *
 * App Router swaps `children` on navigation, so keying on the pathname gives
 * each route a fresh mount and a short fade/slide — no exit animation, which
 * would otherwise delay the new page from painting.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quick}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
