import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Saves an uploaded photo to the local filesystem and returns its public URL.
 * Prototype-stage storage -- local disk doesn't survive Vercel's serverless
 * filesystem, so this needs to move to Vercel Blob/S3 before that deploy.
 */
export async function saveUploadedPhoto(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/${filename}`;
}

export async function saveUploadedPhotos(files: File[]): Promise<string[]> {
  const valid = files.filter((f) => f.size > 0);
  return Promise.all(valid.map(saveUploadedPhoto));
}