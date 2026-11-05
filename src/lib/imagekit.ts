import crypto from "crypto";

const publicKey =
  process.env.IMAGEKIT_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
  "public_VNd03RHffcl71KVGTGbiiVxGMlg=";

const privateKey =
  process.env.IMAGEKIT_PRIVATE_KEY ||
  "private_DOt/nHS24bVQxjdNjvFp2uOAdAA=";

const urlEndpoint =
  process.env.IMAGEKIT_URL_ENDPOINT ||
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
  "https://ik.imagekit.io/gmusic";

export function getImageKitAuth() {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 1800; // 30 mins
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return {
    token,
    expire,
    signature,
    publicKey,
  };
}

export async function uploadToImageKit(
  fileBuffer: Buffer | string,
  fileName: string,
  folder: string = "/music"
) {
  const authHeader = "Basic " + Buffer.from(privateKey + ":").toString("base64");

  const formData = new FormData();
  if (typeof fileBuffer === "string") {
    formData.append("file", fileBuffer);
  } else {
    const uint8 = new Uint8Array(fileBuffer);
    const blob = new Blob([uint8]);
    formData.append("file", blob, fileName);
  }
  formData.append("fileName", fileName);
  formData.append("folder", folder);

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `ImageKit upload failed with HTTP ${res.status}`);
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
  const authHeader = "Basic " + Buffer.from(privateKey + ":").toString("base64");

  try {
    const res = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    });

    return res.ok || res.status === 404;
  } catch (err) {
    console.warn(`Failed to delete ImageKit file ${fileId}:`, err);
    return false;
  }
}

export const imagekit = {
  publicKey,
  urlEndpoint,
  getImageKitAuth,
  uploadToImageKit,
  deleteFromImageKit,
};

export default imagekit;
