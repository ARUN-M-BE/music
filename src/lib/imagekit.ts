import crypto from "crypto";
import { serverEnv } from "./env";

/**
 * ImageKit credentials come exclusively from the environment.
 * Nothing is hardcoded and the private key is never imported by client code.
 */
function requirePrivateKey(): string {
  if (!serverEnv.imagekitPrivateKey) {
    throw new Error("ImageKit is not configured (IMAGEKIT_PRIVATE_KEY missing).");
  }
  return serverEnv.imagekitPrivateKey;
}

function requirePublicKey(): string {
  if (!serverEnv.imagekitPublicKey) {
    throw new Error("ImageKit is not configured (IMAGEKIT_PUBLIC_KEY missing).");
  }
  return serverEnv.imagekitPublicKey;
}

function requireUrlEndpoint(): string {
  if (!serverEnv.imagekitUrlEndpoint) {
    throw new Error("ImageKit is not configured (IMAGEKIT_URL_ENDPOINT missing).");
  }
  return serverEnv.imagekitUrlEndpoint;
}

export function isImageKitConfigured(): boolean {
  return Boolean(serverEnv.imagekitPrivateKey && serverEnv.imagekitPublicKey);
}

export function getImageKitAuth() {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 1800; // 30 mins
  const signature = crypto
    .createHmac("sha1", requirePrivateKey())
    .update(token + expire)
    .digest("hex");

  return {
    token,
    expire,
    signature,
    publicKey: requirePublicKey(),
  };
}

export async function uploadToImageKit(
  fileBuffer: Buffer | string,
  fileName: string,
  folder: string = "/music"
) {
  const authHeader =
    "Basic " + Buffer.from(requirePrivateKey() + ":").toString("base64");
  requireUrlEndpoint();

  const formData = new FormData();
  if (typeof fileBuffer === "string") {
    formData.append("file", fileBuffer);
  } else {
    const uint8 = new Uint8Array(fileBuffer);
    const blob = new Blob([uint8]);
    formData.append("file", blob, fileName);
  }
  formData.append("fileName", sanitizeFileName(fileName));
  formData.append("folder", folder);
  formData.append("useUniqueFileName", "true");
  // Reject SVG/HTML-ish assets server side as well (defence in depth).
  formData.append("overwriteFile", "false");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    // Do not surface upstream payloads to the client.
    console.error(`ImageKit upload failed with HTTP ${res.status}`);
    throw new Error("Upload provider rejected the file");
  }

  const data = await res.json();
  return {
    url: data.url,
    fileId: data.fileId,
    name: data.name,
  };
}

export async function deleteFromImageKit(fileId: string): Promise<boolean> {
  if (!fileId) return false;
  const authHeader =
    "Basic " + Buffer.from(requirePrivateKey() + ":").toString("base64");

  try {
    const res = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
      signal: AbortSignal.timeout(15000),
    });

    return res.ok || res.status === 404;
  } catch (err) {
    console.warn(`Failed to delete ImageKit file ${fileId}:`, err);
    return false;
  }
}

/** Removes path traversal / control characters from user supplied file names. */
export function sanitizeFileName(name: string): string {
  return (name || "upload")
    .replace(/[\\/]+/g, "_")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 120)
    .trim() || "upload";
}

export const imagekit = {
  get publicKey() {
    return serverEnv.imagekitPublicKey;
  },
  get urlEndpoint() {
    return serverEnv.imagekitUrlEndpoint;
  },
  getImageKitAuth,
  uploadToImageKit,
  deleteFromImageKit,
};

export default imagekit;
