"use client";

import React from "react";
import { MotionConfig } from "motion/react";

/**
 * Global motion configuration.
 *
 * `reducedMotion="user"` is the important part: when the OS reports
 * "prefers-reduced-motion", motion.dev drops every transform/opacity animation
 * instead of us sprinkling media queries through components.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
