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

  // A connected Vercel Blob store exposes either BLOB_READ_WRITE_TOKEN (classic
  // stores) or BLOB_STORE_ID (newer stores that authenticate via Vercel's
  // platform OIDC). Either one means a store is wired up and put() can upload.
  const hasBlob =
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) ||
    Boolean(process.env.BLOB_STORE_ID);

  if (hasBlob) {
    try {
      const blob = await put(`uploads/${name}`, file, {
        access: "public",
        contentType: file.type || undefined,
      });
      return blob.url;
    } catch (err) {
      throw new Error(
        `Image upload to Vercel Blob failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  // On Vercel without a connected Blob store the filesystem is read-only, so we
  // can't write to public/uploads. Fail with a clear, actionable message rather
  // than a generic 500.
  if (process.env.VERCEL) {
    throw new Error(
      "Image uploads need a Blob store. In your Vercel project: Storage → " +
        "Create / Connect a Blob store, then redeploy. Until then, paste an " +
        "image URL into the Image URL field instead of uploading a file."
    );
  }

  // Local dev: persist to public/uploads.
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}
