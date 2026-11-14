import React, { Suspense } from "react";
import { MusicLibrary } from "@/features/library";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Music Library - Good Music",
  description: "Browse all tracks, albums, genres, and audio streams.",
};

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Loading Music Library...</p>
        </div>
      }
    >
      <MusicLibrary />
    </Suspense>
  );
}

