import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Persist an uploaded image and return its public URL.
 *
 * - Production (Vercel): uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 *   because the serverless filesystem is read-only and can't keep uploads.
 * - Local dev (no token): writes to public/uploads as before.
 */
export async function saveUploadedImage(
  file: File,
  prefix = ""
): Promise<string> {
  const ext = path.extname(file.name) || ".jpg";
  const name = `${prefix}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${ext}`;

  // Use Vercel Blob in production. On Vercel the filesystem is read-only, and a
  // connected Blob store authenticates the SDK automatically (via
  // BLOB_READ_WRITE_TOKEN on older stores, or BLOB_STORE_ID + platform OIDC on
  // newer ones). Only fall back to local disk in dev.
  const useBlob =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) ||
    Boolean(process.env.BLOB_STORE_ID);

  if (useBlob) {
    const blob = await put(`uploads/${name}`, file, {
      access: "public",
      contentType: file.type || undefined,
    });
    return blob.url;
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}
