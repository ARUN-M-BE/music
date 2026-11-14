import type { Transition, Variants } from "motion/react";

/**
 * Shared motion language.
 *
 * One easing curve and one spring keeps every section feeling like the same
 * product. Durations stay under 500ms so navigation never feels gated.
 */

/** Snappy, slightly overshooting spring for interactive elements. */
export const spring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.7,
};

/** Standard reveal curve (ease-out-expo). */
export const easeOut: Transition = { duration: 0.45, ease: [0.16, 1, 0.3, 1] };

/** Fast curve for chrome (page transitions, tab switches). */
export const quick: Transition = { duration: 0.26, ease: [0.16, 1, 0.3, 1] };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: easeOut },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
};

export const staggerItem = fadeUp;

/** Only animate the first time an element scrolls into view. */
export const viewportOnce = { once: true, margin: "-80px" } as const;

/** Collapse/expand used by disclosure sections (categories, filters). */
export const collapse: Variants = {
  hidden: { height: 0, opacity: 0 },
  show: { height: "auto", opacity: 1, transition: easeOut },
};

/**
 * Overlays: one vocabulary for every fixed layer in the app — dialogs, side
 * sheets and the mini player. Backdrops only fade; panels move a few pixels so
 * they read as "lifted off" the page without ever feeling slow.
 */
export const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: quick },
  exit: { opacity: 0, transition: quick },
};

export const overlayPanel: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, scale: 0.98, y: 6, transition: quick },
};

/** Side sheet / drawer: slides in from its anchored edge. */
export const sheetPanel = (from: "left" | "right" = "right"): Variants => ({
  hidden: { opacity: 0, x: from === "right" ? 32 : -32 },
  show: { opacity: 1, x: 0, transition: easeOut },
  exit: { opacity: 0, x: from === "right" ? 32 : -32, transition: quick },
});

/** Bottom-anchored chrome (mini player, snackbars). */
export const risePanel: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
  exit: { opacity: 0, y: 24, scale: 0.97, transition: quick },
};
