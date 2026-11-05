import React, { Suspense } from "react";
import { MusicLibrary } from "@/components/Music/MusicLibrary/MusicLibrary";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Music Library - Good Music",
  description: "Browse all tracks, albums, genres, and audio streams.",
};

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 text-[#b3b3b3]">
          <Loader2 className="size-8 animate-spin text-[#1db954] mb-3" />
          <p className="text-sm">Loading Music Library...</p>
        </div>
      }
    >
      <MusicLibrary />
    </Suspense>
  );
}

