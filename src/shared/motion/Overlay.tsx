"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { overlayBackdrop, overlayPanel } from "./presets";

interface OverlayProps {
  /** Mounts and animates the layer. Exiting layers stay mounted to finish. */
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  /** Panel classes (width, padding, surface). Positioning is handled here. */
  className?: string;
  backdropClassName?: string;
  /** Vertically centre the panel, or pin it near the top for long forms. */
  align?: "center" | "top";
  /** Accessible name announced by screen readers. */
  label?: string;
  closeOnBackdrop?: boolean;
}

/**
 * Fixed layer with the shared overlay motion: the backdrop fades, the panel
 * lifts and settles. Used by every hand-rolled modal so they all dismiss with
 * an exit animation instead of vanishing.
 */
export function Overlay({
  open,
  onClose,
  children,
  className,
  backdropClassName,
  align = "center",
  label,
  closeOnBackdrop = true,
}: OverlayProps) {
  // Keep the latest close handler in a ref so the listener and the scroll lock
  // are installed once per open, not re-installed on every parent render.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current?.();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex justify-center p-4",
            align === "center" ? "items-center" : "items-start pt-[8vh]"
          )}
        >
          <motion.div
            variants={overlayBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={closeOnBackdrop ? onClose : undefined}
            className={cn("fixed inset-0 bg-scrim/80 backdrop-blur-sm", backdropClassName)}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            variants={overlayPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            className={cn("relative z-10", className)}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
