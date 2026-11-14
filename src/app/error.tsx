"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error locally or to analytics without exposing credentials
    console.error("[app-boundary] Rendering error captured:", error?.message);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-destructive/20 shadow-2xl space-y-6">
        <div className="size-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto text-destructive shadow-lg shadow-destructive/10">
          <AlertTriangle className="size-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-display font-semibold text-foreground tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            The application encountered a temporary error while loading this page. You can retry or return to the home page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
          >
            <RefreshCw className="size-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 h-10 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="size-3.5" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
