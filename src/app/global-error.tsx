"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error] Root boundary captured:", error?.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans antialiased">
        <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-center space-y-6">
          <div className="size-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="size-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">System Error</h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              An unexpected system error occurred. The application is trying to recover.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full h-11 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
          >
            <RefreshCw className="size-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
