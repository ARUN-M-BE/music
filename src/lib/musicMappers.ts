import { MusicTrack, UnifiedSong } from "@/types/music";

/**
 * Bridges the streaming-provider shape (`UnifiedSong`) and the local catalogue
 * shape (`MusicTrack`) the player and tables speak. Kept in one place so detail
 * pages, search and the library all build identical queue items.
 */
export function mapUnifiedToTrack(song: UnifiedSong): MusicTrack {
  return {
    _id: song.id,
    id: song.id,
    name: song.title,
    title: song.title,
    artist: song.artist,
    album: song.album,
    imageURL: song.artwork,
    artwork: song.artwork,
    songURL: song.streamUrl || song.previewUrl,
    previewUrl: song.previewUrl,
    streamUrl: song.streamUrl,
    duration: song.duration,
    language: song.language,
    category: song.language || "Music",
    playsCount: 0,
    provider: song.provider,
    releaseYear: song.releaseYear,
    externalUrl: song.externalUrl,
  };
}

/** Drops duplicate provider/local entries that share a title and artist. */
export function dedupeTracks(tracks: MusicTrack[]): MusicTrack[] {
  const seen = new Set<string>();
  const unique: MusicTrack[] = [];

  for (const track of tracks) {
    const key = `${(track.name || track.title || "").toLowerCase()}__${(track.artist || "").toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(track);
    }
  }

  return unique;
}
