/**
 * Motion layer — motion.dev (`motion/react`) primitives with one shared
 * language: `easeOut` for reveals, `spring` for interaction, `quick` for chrome.
 *
 * Import from here rather than reaching for `motion/react` directly so easing
 * stays consistent and reduced-motion keeps working through MotionProvider.
 */
export { MotionProvider } from "./MotionProvider";
export { PageTransition } from "./PageTransition";
export { Reveal, Stagger, StaggerItem } from "./Reveal";
export { Swap } from "./Swap";
export { Overlay } from "./Overlay";
export {
  collapse,
  easeOut,
  fadeIn,
  fadeUp,
  overlayBackdrop,
  overlayPanel,
  quick,
  risePanel,
  scaleIn,
  sheetPanel,
  spring,
  viewportOnce,
} from "./presets";
