// v9 only exposes sub-path entry points; the browser build reads `File`/`Blob`.
import { readSheet } from "read-excel-file/browser";
import { DEFAULT_COVER_URL } from "./mediaOptimization";

export type BulkEntityType = "songs" | "artists" | "albums";
// Excel generation was dropped together with the vulnerable `xlsx` package:
// CSV and JSON are exported instead and Excel opens both natively.
export type BulkFormatType = "csv" | "json";

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
  } else {
    const blob = new Blob([toCsv(data)], { type: "text/csv;charset=utf-8;" });
    triggerBlobDownload(blob, fileName);
  }
}

/** Serialises records to CSV (RFC 4180 quoting) without any dependency. */
function toCsv(records: Array<Record<string, unknown>>): string {
  if (records.length === 0) return "";
  const headers = Array.from(
    records.reduce<Set<string>>((set, record) => {
      Object.keys(record).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const escape = (value: unknown): string => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [headers.join(",")];
  for (const record of records) {
    lines.push(headers.map((header) => escape(record[header])).join(","));
  }
  return lines.join("\r\n");
}

/** Minimal RFC 4180 parser: quotes, escaped quotes, CRLF and a BOM. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

/** Maps a header row plus data rows into plain objects. */
function rowsToRecords(rows: Array<Array<unknown>>): Array<Record<string, unknown>> {
  if (rows.length === 0) return [];
  const headers = (rows[0] ?? []).map((header) => String(header ?? "").trim());
  return rows.slice(1).map((row) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const value = row[index];
      record[header] = value === null || value === undefined ? "" : value;
    });
    return record;
  });
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
 * Parses an uploaded File (.xlsx, .csv or .json) into plain objects.
 *
 * `.xlsx` is read with `read-excel-file` (MIT, actively maintained, no known
 * CVEs) because the `xlsx` package bundled an unpatched prototype-pollution /
 * ReDoS advisory. Legacy binary `.xls` files must be re-saved as .xlsx/.csv.
 */
export async function parseBulkFile(file: File): Promise<any[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  // Guard the parser against absurd inputs before doing any work.
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File is larger than 10 MB. Split it into smaller batches.");
  }

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

  if (ext === "csv") {
    const text = await file.text();
    return rowsToRecords(parseCsv(text));
  }

  if (ext === "xlsx" || ext === "xlsm") {
    // `readSheet` returns the first worksheet as a matrix of cell values.
    const rows = await readSheet(file);
    return rowsToRecords(rows as Array<Array<unknown>>);
  }

  if (ext === "xls") {
    throw new Error(
      "Legacy .xls files are not supported. Re-save the file as .xlsx or .csv and try again."
    );
  }

  throw new Error("Unsupported file type. Upload a .xlsx, .csv or .json file.");
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

