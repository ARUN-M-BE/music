"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Applies `class="dark"` on <html> from the user's choice (or the OS setting).
 *
 * The app used to hard-code `className="dark"`, so every surface was stuck in
 * one theme. All colours now come from CSS variables in globals.css, which means
 * a single class swap re-themes the whole product - no component knows which
 * theme is active.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
