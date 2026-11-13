import { serverEnv } from "./env";
import { badRequest } from "./http";

/**
 * Upload hardening.
 *  - allow-list of MIME types and extensions
 *  - magic-byte verification (a renamed .exe or .svg is rejected)
 *  - hard size limits
 *  - SVG is never accepted (stored XSS vector)
 */

export type UploadKind = "audio" | "image";

const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".aac", ".ogg", ".oga", ".wav", ".flac", ".webm"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

const AUDIO_MIME_PREFIX = "audio/";
const IMAGE_MIME_ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export interface ValidatedUpload {
  kind: UploadKind;
  extension: string;
  contentType: string;
  size: number;
}

function extensionOf(name: string): string {
  const match = /\.[a-z0-9]+$/i.exec(name ?? "");
  return match ? match[0].toLowerCase() : "";
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function asciiAt(bytes: Uint8Array, offset: number, text: string): boolean {
  if (bytes.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

function detectAudioContainer(bytes: Uint8Array): boolean {
  if (asciiAt(bytes, 0, "ID3")) return true; // MP3 with ID3 tag
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return true; // MPEG frame sync
  if (asciiAt(bytes, 0, "OggS")) return true;
  if (asciiAt(bytes, 0, "fLaC")) return true;
  if (asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WAVE")) return true;
  if (asciiAt(bytes, 4, "ftyp")) return true; // MP4 / M4A
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return true; // Matroska/WebM
  return false;
}

function detectImageContainer(bytes: Uint8Array): boolean {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return true; // JPEG
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return true; // PNG
  if (asciiAt(bytes, 0, "GIF87a") || asciiAt(bytes, 0, "GIF89a")) return true;
  if (asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WEBP")) return true;
  if (asciiAt(bytes, 4, "ftyp") && (asciiAt(bytes, 8, "avif") || asciiAt(bytes, 8, "avis"))) {
    return true;
  }
  return false;
}

export function validateUpload(file: {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}): ValidatedUpload {
  const extension = extensionOf(file.name);
  const declaredType = (file.type || "").toLowerCase();

  // Never accept SVG or HTML: stored XSS.
  if (declaredType.includes("svg") || extension === ".svg" || extension === ".svgz") {
    throw badRequest("SVG uploads are not allowed");
  }

  const isAudioByType = declaredType.startsWith(AUDIO_MIME_PREFIX);
  const isImageByType = IMAGE_MIME_ALLOWED.has(declaredType);

  if (!isAudioByType && !isImageByType) {
    throw badRequest("Unsupported file type");
  }

  const kind: UploadKind = isAudioByType ? "audio" : "image";
  const allowedExtensions = kind === "audio" ? AUDIO_EXTENSIONS : IMAGE_EXTENSIONS;

  if (!allowedExtensions.has(extension)) {
    throw badRequest(`Unsupported ${kind} extension`);
  }

  const maxBytes =
    kind === "audio" ? serverEnv.maxAudioUploadBytes : serverEnv.maxImageUploadBytes;
  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw badRequest("Empty file");
  }
  if (file.size > maxBytes) {
    throw badRequest(
      `File too large. Maximum ${Math.floor(maxBytes / (1024 * 1024))} MB for ${kind} uploads`
    );
  }

  const containerOk = kind === "audio" ? detectAudioContainer(file.bytes) : detectImageContainer(file.bytes);
  if (!containerOk) {
    throw badRequest("File content does not match its declared type");
  }

  return {
    kind,
    extension,
    contentType: declaredType,
    size: file.size,
  };
}
