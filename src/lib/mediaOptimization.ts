/**
 * Media optimization, client-side compression, and audio ID3 metadata extraction utilities.
 */

export const DEFAULT_COVER_URL =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80";

/**
 * Compresses an image client-side using HTML5 Canvas to keep file size small (under ~100KB).
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  maxDimension = 1000,
  initialQuality = 0.75
): Promise<File> {
  // If running on server or no DOM
  if (typeof window === "undefined" || typeof document === "undefined") {
    if (fileOrBlob instanceof File) return fileOrBlob;
    return new File([fileOrBlob], "compressed.jpg", { type: "image/jpeg" });
  }

  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onerror = () => reject(new Error("Invalid image format"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const fallback =
            fileOrBlob instanceof File
              ? fileOrBlob
              : new File([fileOrBlob], "image.jpg", { type: "image/jpeg" });
          return resolve(fallback);
        }

        // Fill background with black for transparency handling
        ctx.fillStyle = "#121212";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const fallback =
                fileOrBlob instanceof File
                  ? fileOrBlob
                  : new File([fileOrBlob], "image.jpg", { type: "image/jpeg" });
              return resolve(fallback);
            }

            const fileName =
              (fileOrBlob instanceof File ? fileOrBlob.name.replace(/\.[^.]+$/, "") : "artwork") +
              "_compressed.jpg";

            const compressedFile = new File([blob], fileName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          initialQuality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Extracts embedded album artwork (ID3 APIC frame) from an audio file (MP3/M4A).
 */
export async function extractCoverFromAudio(audioFile: File): Promise<File | null> {
  if (typeof window === "undefined") return null;

  try {
    // Read up to 4MB of the file header where ID3 metadata lives
    const slice = audioFile.slice(0, Math.min(audioFile.size, 4 * 1024 * 1024));
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check ID3v2 header ('ID3')
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
      return null;
    }

    const version = bytes[3]; // e.g., 3 for ID3v2.3, 4 for ID3v2.4
    // Calculate tag size from syncsafe integer (bytes 6-9)
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);

    const maxOffset = Math.min(bytes.length, tagSize + 10);
    let offset = 10;

    while (offset < maxOffset - 10) {
      // Find APIC frame (ID3v2.3 / ID3v2.4)
      if (
        bytes[offset] === 0x41 && // 'A'
        bytes[offset + 1] === 0x50 && // 'P'
        bytes[offset + 2] === 0x49 && // 'I'
        bytes[offset + 3] === 0x43 // 'C'
      ) {
        // Frame size
        let frameSize = 0;
        if (version === 4) {
          // Syncsafe integer in v2.4
          frameSize =
            ((bytes[offset + 4] & 0x7f) << 21) |
            ((bytes[offset + 5] & 0x7f) << 14) |
            ((bytes[offset + 6] & 0x7f) << 7) |
            (bytes[offset + 7] & 0x7f);
        } else {
          // Standard integer in v2.3
          frameSize =
            (bytes[offset + 4] << 24) |
            (bytes[offset + 5] << 16) |
            (bytes[offset + 6] << 8) |
            bytes[offset + 7];
        }

        if (frameSize <= 0 || offset + 10 + frameSize > bytes.length) break;

        const frameDataOffset = offset + 10;
        let p = frameDataOffset + 1; // skip text encoding byte

        // Read MIME type (null-terminated string)
        let mime = "";
        while (p < frameDataOffset + frameSize && bytes[p] !== 0) {
          mime += String.fromCharCode(bytes[p]);
          p++;
        }
        p++; // skip null terminator

        // Picture type (1 byte, 0x03 is front cover)
        p++;

        // Description (null-terminated)
        while (p < frameDataOffset + frameSize && bytes[p] !== 0) {
          p++;
        }
        p++; // skip null terminator

        // Image binary data starts at p
        const imgData = bytes.slice(p, frameDataOffset + frameSize);
        if (imgData.length > 100) {
          const contentType = mime.includes("png") ? "image/png" : "image/jpeg";
          const ext = mime.includes("png") ? ".png" : ".jpg";
          const rawBlob = new Blob([imgData], { type: contentType });
          const rawFile = new File([rawBlob], `audio_embedded_cover${ext}`, {
            type: contentType,
          });

          // Compress extracted cover so it's optimized
          return await compressImage(rawFile, 1000, 0.75);
        }
        break;
      }

      offset++;
    }

    return null;
  } catch (err) {
    console.warn("Could not extract ID3 cover from audio:", err);
    return null;
  }
}

/**
 * Extracts Song Title and Artist from the audio filename if possible.
 * e.g. "The Weeknd - Blinding Lights.mp3" -> { artist: "The Weeknd", title: "Blinding Lights" }
 */
export function parseAudioFilename(filename: string): { title: string; artist?: string } {
  const cleanName = filename.replace(/\.[^/.]+$/, "").trim();

  // If filename has " - "
  if (cleanName.includes(" - ")) {
    const parts = cleanName.split(" - ");
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(" - ").trim(),
      };
    }
  }

  // If filename has "_"
  if (cleanName.includes("_")) {
    return {
      title: cleanName.replace(/_/g, " ").trim(),
    };
  }

  return { title: cleanName };
}

/**
 * Formats bytes to KB/MB readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

