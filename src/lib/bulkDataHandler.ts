import * as XLSX from "xlsx";
import { DEFAULT_COVER_URL } from "./mediaOptimization";

export type BulkEntityType = "songs" | "artists" | "albums";
export type BulkFormatType = "xlsx" | "csv" | "json";

export interface ValidationResult<T> {
  item: T;
  isValid: boolean;
  errors: string[];
  rawRow: number;
}

// Sample Templates Data
export const SAMPLE_SONGS_DATA = [
  {
    name: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    category: "Pop",
    language: "English",
    songURL: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    imageURL: DEFAULT_COVER_URL,
    playsCount: 1540,
  },
  {
    name: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    category: "Pop",
    language: "English",
    songURL: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    imageURL: DEFAULT_COVER_URL,
    playsCount: 2200,
  },
  {
    name: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    category: "Pop",
    language: "English",
    songURL: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    imageURL: DEFAULT_COVER_URL,
    playsCount: 980,
  },
];

export const SAMPLE_ARTISTS_DATA = [
  {
    name: "The Weeknd",
    instagram: "theweeknd",
    twetter: "theweeknd",
    imageURL:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Dua Lipa",
    instagram: "dualipa",
    twetter: "dualipa",
    imageURL:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
  },
  {
    name: "Post Malone",
    instagram: "postmalone",
    twetter: "postmalone",
    imageURL:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
  },
];

export const SAMPLE_ALBUMS_DATA = [
  {
    name: "After Hours",
    imageURL: DEFAULT_COVER_URL,
  },
  {
    name: "Future Nostalgia",
    imageURL: DEFAULT_COVER_URL,
  },
  {
    name: "Hollywood's Bleeding",
    imageURL: DEFAULT_COVER_URL,
  },
];

/**
 * Downloads a sample template in chosen format (.xlsx, .csv, or .json)
 */
export function downloadSampleTemplate(entity: BulkEntityType, format: BulkFormatType) {
  if (typeof window === "undefined") return;

  let data: any[] = [];
  if (entity === "songs") data = SAMPLE_SONGS_DATA;
  else if (entity === "artists") data = SAMPLE_ARTISTS_DATA;
  else if (entity === "albums") data = SAMPLE_ALBUMS_DATA;

  const fileName = `${entity}_sample_template.${format}`;

  if (format === "json") {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    triggerBlobDownload(blob, fileName);
  } else if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(data);
    const csvStr = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    triggerBlobDownload(blob, fileName);
  } else if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, fileName);
  }
}

/**
 * Helper to download Blob
 */
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses uploaded File (Excel, CSV, or JSON) into array of plain objects
 */
export async function parseBulkFile(file: File): Promise<any[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
    if (parsed && Array.isArray(parsed.songs)) return parsed.songs;
    if (parsed && Array.isArray(parsed.artists)) return parsed.artists;
    if (parsed && Array.isArray(parsed.albums)) return parsed.albums;
    throw new Error("JSON file must contain an array of records");
  }

  // Handle Excel (.xlsx, .xls) and CSV
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error("Spreadsheet contains no sheets");

  const worksheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  return rows;
}

/**
 * Validates parsed records before submission to guarantee all requirements are met
 */
export function validateBulkRecords(
  entity: BulkEntityType,
  records: any[]
): {
  validated: ValidationResult<any>[];
  validCount: number;
  invalidCount: number;
} {
  const validated: ValidationResult<any>[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const errors: string[] = [];

    if (entity === "songs") {
      const name = String(row.name || row.title || row.songName || "").trim();
      const artist = String(row.artist || row.artistName || "").trim();
      const songURL = String(row.songURL || row.audioUrl || row.url || "").trim();
      const album = String(row.album || row.albumName || "Single").trim();
      const category = String(row.category || row.genre || "Pop").trim();
      const language = String(row.language || "English").trim();
      const imageURL = String(row.imageURL || row.artwork || row.cover || DEFAULT_COVER_URL).trim();
      const playsCount = Number(row.playsCount || row.plays || 0) || 0;

      if (!name) errors.push("Missing track name");
      if (!artist) errors.push("Missing artist name");
      if (!songURL) {
        errors.push("Missing audio stream URL");
      } else if (!songURL.startsWith("http://") && !songURL.startsWith("https://")) {
        errors.push("Invalid songURL: must start with http:// or https://");
      }

      const item = {
        name,
        artist,
        album: album || "Single",
        category: category || "Pop",
        language: language || "English",
        songURL,
        imageURL: imageURL || DEFAULT_COVER_URL,
        playsCount,
      };

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      validated.push({
        item,
        isValid,
        errors,
        rawRow: i + 1,
      });
    } else if (entity === "artists") {
      const name = String(row.name || row.artist || "").trim();
      const instagram = String(row.instagram || "").trim();
      const twetter = String(row.twetter || row.twitter || "").trim();
      const imageURL = String(
        row.imageURL ||
          row.image ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
      ).trim();

      if (!name) errors.push("Missing artist name");

      const item = {
        name,
        instagram: instagram || name.toLowerCase().replace(/\s+/g, ""),
        twetter: twetter || name.toLowerCase().replace(/\s+/g, ""),
        imageURL,
      };

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      validated.push({
        item,
        isValid,
        errors,
        rawRow: i + 1,
      });
    } else if (entity === "albums") {
      const name = String(row.name || row.album || row.title || "").trim();
      const imageURL = String(row.imageURL || row.image || DEFAULT_COVER_URL).trim();

      if (!name) errors.push("Missing album title");

      const item = {
        name,
        imageURL: imageURL || DEFAULT_COVER_URL,
      };

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      validated.push({
        item,
        isValid,
        errors,
        rawRow: i + 1,
      });
    }
  }

  return { validated, validCount, invalidCount };
}

