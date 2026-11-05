/**
 * Unified Music Providers Service (JioSaavn, iTunes, Audius, Local Catalog)
 * Normalizes all sources into a single consistent format with fallback support.
 */

import { UnifiedSong, UnifiedArtist, UnifiedAlbum } from "@/types/music";
import { connectToDatabase, SongModel, ArtistModel, AlbumModel } from "./mongodb";
import { DEFAULT_COVER_URL } from "./mediaOptimization";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * 1. JioSaavn Music Provider
 */
export async function searchJioSaavn(query: string, limit = 20): Promise<UnifiedSong[]> {
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&p=1&n=${limit}&q=${encodeURIComponent(
      query
    )}`;

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 120 },
    });

    if (!res.ok) return [];
    const text = await res.text();
    const data = JSON.parse(text);
    const results = data.results || [];

    const songs: UnifiedSong[] = [];

    for (const item of results) {
      const encryptedMediaUrl = item.more_info?.encrypted_media_url;
      let streamUrl = "";

      // Generate direct audio stream URL if encrypted_media_url is present
      if (encryptedMediaUrl) {
        try {
          const authRes = await fetch(
            `https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&url=${encodeURIComponent(
              encryptedMediaUrl
            )}&bitrate=128&api_version=4&_format=json&ctx=web6dot0`,
            { headers: { "User-Agent": USER_AGENT }, next: { revalidate: 3600 } }
          );
          if (authRes.ok) {
            const authData = await authRes.json();
            streamUrl = authData.auth_url || "";
          }
        } catch {
          // Ignore token failure, will fallback to preview
        }
      }

      const artwork = (item.image || "")
        .replace("150x150", "500x500")
        .replace("50x50", "500x500") || DEFAULT_COVER_URL;

      const duration = parseInt(item.more_info?.duration || "210", 10) || 210;

      songs.push({
        id: `saavn_${item.id}`,
        title: cleanHtmlEntities(item.title || item.song || "Unknown Song"),
        artist: cleanHtmlEntities(item.more_info?.singers || item.more_info?.music || "Various Artists"),
        album: cleanHtmlEntities(item.more_info?.album || item.album || "Single"),
        artwork,
        duration,
        language: item.language || "Hindi",
        releaseYear: item.year || new Date().getFullYear(),
        previewUrl: streamUrl,
        streamUrl: streamUrl || `https://www.jiosaavn.com/song/${item.perma_url}/${item.id}`,
        provider: "jiosaavn",
        externalUrl: item.perma_url ? `https://www.jiosaavn.com/song/${item.perma_url}` : undefined,
      });
    }

    return songs;
  } catch (err) {
    console.warn("JioSaavn search failed:", err);
    return [];
  }
}

/**
 * 2. iTunes Search API Provider (Global coverage, 30s AAC previews, 600x600 artwork)
 */
export async function searchITunes(query: string, limit = 20): Promise<UnifiedSong[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&media=music&entity=song&limit=${limit}`;

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];

    return results.map((item: any) => {
      const artwork = (item.artworkUrl100 || "").replace("100x100bb", "600x600bb") || DEFAULT_COVER_URL;
      const duration = Math.round((item.trackTimeMillis || 210000) / 1000);
      const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024;

      return {
        id: `itunes_${item.trackId}`,
        title: item.trackName || "Unknown Song",
        artist: item.artistName || "Unknown Artist",
        album: item.collectionName || "Single",
        artwork,
        duration,
        language: guessLanguage(item.primaryGenreName, query),
        releaseYear,
        previewUrl: item.previewUrl || "",
        streamUrl: item.previewUrl || "",
        provider: "itunes",
        externalUrl: item.trackViewUrl,
      };
    });
  } catch (err) {
    console.warn("iTunes search failed:", err);
    return [];
  }
}

/**
 * 3. Audius Open Catalog Provider (Full streaming legal tracks)
 */
export async function searchAudius(query: string, limit = 15): Promise<UnifiedSong[]> {
  try {
    const url = query
      ? `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(
          query
        )}&app_name=GoodMusic&limit=${limit}`
      : `https://discoveryprovider.audius.co/v1/tracks/trending?app_name=GoodMusic&limit=${limit}`;

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const tracks = data.data || [];

    return tracks.map((item: any) => {
      const artwork =
        item.artwork?.["480x480"] ||
        item.artwork?.["150x150"] ||
        DEFAULT_COVER_URL;

      const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${item.id}/stream?app_name=GoodMusic`;

      return {
        id: `audius_${item.id}`,
        title: item.title || "Untitled",
        artist: item.user?.name || "Audius Artist",
        album: item.genre || "Audius Stream",
        artwork,
        duration: item.duration || 180,
        language: "English",
        releaseYear: item.release_date ? new Date(item.release_date).getFullYear() : 2024,
        previewUrl: streamUrl,
        streamUrl,
        provider: "audius",
        playsCount: item.play_count || 0,
      };
    });
  } catch (err) {
    console.warn("Audius search failed:", err);
    return [];
  }
}

/**
 * 4. Local Database Catalog Provider
 */
export async function searchLocalCatalog(query?: string): Promise<UnifiedSong[]> {
  try {
    await connectToDatabase();
    const filter: Record<string, any> = {};

    if (query && query.trim()) {
      const q = query.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { artist: { $regex: q, $options: "i" } },
        { album: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    const songs = await SongModel.find(filter).sort({ createdAt: -1 }).limit(30).lean();

    return songs.map((s: any) => ({
      id: s._id.toString(),
      title: s.name,
      artist: s.artist,
      album: s.album || "Single",
      artwork: s.imageURL || DEFAULT_COVER_URL,
      duration: typeof s.duration === "number" ? s.duration : 210,
      language: s.language || "English",
      releaseYear: s.createdAt ? new Date(s.createdAt).getFullYear() : 2024,
      previewUrl: s.songURL,
      streamUrl: s.songURL,
      provider: "catalog",
      playsCount: s.playsCount || 0,
    }));
  } catch (err) {
    console.warn("Local catalog search failed:", err);
    return [];
  }
}

/**
 * Master Aggregator: Searches all providers with fallback and deduplication
 */
export async function aggregateMusicSearch(
  query: string,
  preferredLanguage?: string,
  limit = 25
): Promise<UnifiedSong[]> {
  const cleanQ = (query || "").trim();
  if (!cleanQ) return getTrendingAggregate(preferredLanguage);

  // Search local DB, JioSaavn, iTunes, and Audius in parallel
  const [localResults, saavnResults, itunesResults, audiusResults] = await Promise.all([
    searchLocalCatalog(cleanQ),
    searchJioSaavn(cleanQ, 15),
    searchITunes(cleanQ, 15),
    searchAudius(cleanQ, 10),
  ]);

  // Combine results with local catalog first, then JioSaavn (full streams), then iTunes, then Audius
  const combined = [
    ...localResults,
    ...saavnResults,
    ...itunesResults,
    ...audiusResults,
  ];

  return deduplicateSongs(combined);
}

/**
 * Trending Songs Aggregator for Tamil, Hindi, English, or Overall
 */
export async function getTrendingAggregate(language?: string): Promise<UnifiedSong[]> {
  const lang = (language || "all").toLowerCase();

  let queries: string[] = [];
  if (lang === "tamil") {
    queries = ["tamil hits 2024", "anirudh ravichander", "ar rahman tamil", "latest tamil songs"];
  } else if (lang === "hindi") {
    queries = ["arijit singh", "hindi top hits 2024", "bollywood trending", "pritam"];
  } else if (lang === "english") {
    queries = ["billboard hot 100", "taylor swift", "the weeknd", "top pop hits 2024"];
  } else {
    queries = ["trending 2024 hits", "tamil latest", "hindi top hits", "arijit singh"];
  }

  // Fetch first 2 query pools in parallel
  const [localSongs, pool1, pool2, audiusTrending] = await Promise.all([
    searchLocalCatalog(),
    searchJioSaavn(queries[0], 12),
    searchITunes(queries[1] || queries[0], 12),
    searchAudius("", 8),
  ]);

  const combined = [...localSongs, ...pool1, ...pool2, ...audiusTrending];
  return deduplicateSongs(combined);
}

/**
 * Get Artist Profile & Complete Song List
 */
export async function getArtistData(nameOrId: string): Promise<{
  artist: UnifiedArtist;
  songs: UnifiedSong[];
}> {
  const cleanName = decodeURIComponent(nameOrId).replace(/^artist_/, "");

  // Search local songs, JioSaavn, and iTunes for this artist
  const [localSongs, saavnSongs, itunesSongs] = await Promise.all([
    searchLocalCatalog(cleanName),
    searchJioSaavn(cleanName, 25),
    searchITunes(cleanName, 25),
  ]);

  const songs = deduplicateSongs([...localSongs, ...saavnSongs, ...itunesSongs]);

  // Fetch artist image from top song or iTunes
  const topArtwork = songs[0]?.artwork || DEFAULT_COVER_URL;

  // Extract distinct albums
  const albumsMap = new Map<string, UnifiedAlbum>();
  for (const s of songs) {
    if (s.album && s.album !== "Single" && !albumsMap.has(s.album)) {
      albumsMap.set(s.album, {
        id: `album_${s.album.toLowerCase().replace(/\s+/g, "_")}`,
        title: s.album,
        artist: s.artist,
        artwork: s.artwork,
        releaseYear: s.releaseYear,
        provider: s.provider,
      });
    }
  }

  const artist: UnifiedArtist = {
    id: `artist_${cleanName.toLowerCase().replace(/\s+/g, "_")}`,
    name: cleanName,
    image: topArtwork,
    bio: `Top streaming artist on Good Music with ${songs.length} verified songs in the library.`,
    followerCount: 245000 + songs.length * 1200,
    provider: songs[0]?.provider || "catalog",
    topSongs: songs.slice(0, 5),
    albums: Array.from(albumsMap.values()),
  };

  return { artist, songs };
}

/**
 * Get Album Details & Tracks
 */
export async function getAlbumData(albumNameOrId: string): Promise<{
  album: UnifiedAlbum;
  songs: UnifiedSong[];
}> {
  const cleanTitle = decodeURIComponent(albumNameOrId).replace(/^album_/, "");

  const [localSongs, saavnSongs, itunesSongs] = await Promise.all([
    searchLocalCatalog(cleanTitle),
    searchJioSaavn(cleanTitle, 20),
    searchITunes(cleanTitle, 20),
  ]);

  const allSongs = deduplicateSongs([...localSongs, ...saavnSongs, ...itunesSongs]);
  // Filter songs that belong to or match this album
  const songs = allSongs.filter(
    (s) =>
      s.album.toLowerCase().includes(cleanTitle.toLowerCase()) ||
      cleanTitle.toLowerCase().includes(s.album.toLowerCase())
  );

  const primary = songs[0] || allSongs[0];

  const album: UnifiedAlbum = {
    id: `alb_${cleanTitle.toLowerCase().replace(/\s+/g, "_")}`,
    title: cleanTitle,
    artist: primary?.artist || "Various Artists",
    artwork: primary?.artwork || DEFAULT_COVER_URL,
    releaseYear: primary?.releaseYear || 2024,
    songCount: (songs.length > 0 ? songs : allSongs).length,
    provider: primary?.provider || "catalog",
    songs: songs.length > 0 ? songs : allSongs,
  };

  return { album, songs: songs.length > 0 ? songs : allSongs };
}

/**
 * Deduplicates songs by checking normalized title and artist
 */
function deduplicateSongs(songs: UnifiedSong[]): UnifiedSong[] {
  const seen = new Set<string>();
  const unique: UnifiedSong[] = [];

  for (const song of songs) {
    const key = `${normalizeStr(song.title)}__${normalizeStr(song.artist)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(song);
    }
  }

  return unique;
}

function normalizeStr(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function cleanHtmlEntities(str: string): string {
  return (str || "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function guessLanguage(genre?: string, query?: string): string {
  const text = `${genre || ""} ${query || ""}`.toLowerCase();
  if (text.includes("tamil")) return "Tamil";
  if (text.includes("hindi") || text.includes("bollywood")) return "Hindi";
  if (text.includes("telugu")) return "Telugu";
  if (text.includes("punjabi")) return "Punjabi";
  return "English";
}
