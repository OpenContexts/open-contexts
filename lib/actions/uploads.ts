"use server";

// Uploading an image for a text. The browser has already scaled and compressed it (image-upload.tsx); this checks
// what arrived, since anyone can call the action directly, and stores it in Vercel Blob.
import { put } from "@vercel/blob";
import { and, count, eq, gt } from "drizzle-orm";
import { getCurrentUser, isModerator } from "@/lib/auth/session";
import { isBlobConfigured, sweepUploadsLater } from "@/lib/data/uploads";
import { db } from "@/lib/db";
import { upload } from "@/lib/db/schema";
import { IMAGE_DAILY_LIMIT, IMAGE_MAX_BYTES, IMAGE_TYPES, type ImageType } from "@/lib/images";

export type UploadResult = { url: string; error?: never } | { error: string; url?: never };

/** The format the file's first bytes show, which need not be the one it claims. */
function sniff(bytes: Uint8Array): ImageType | undefined {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return undefined;
}

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to add images." };
  if (!isBlobConfigured()) return { error: "Image uploads are not set up on this site yet." };

  const file = formData.get("image");
  if (!(file instanceof File) || !file.size) return { error: "No image arrived. Please try again." };
  if (file.size > IMAGE_MAX_BYTES) return { error: "This image is too large, even compressed. Please choose a smaller one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return { error: "This file is not an image the site can store." };

  if (!isModerator(user)) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ n }] = await db.select({ n: count() }).from(upload).where(and(eq(upload.uploaderId, user.id), gt(upload.createdAt, since)));
    if (n >= IMAGE_DAILY_LIMIT) return { error: `You can add up to ${IMAGE_DAILY_LIMIT} images a day. Please try again tomorrow.` };
  }

  const id = crypto.randomUUID();
  try {
    // The name is new and never reused, so the file can be cached for good.
    const blob = await put(`images/${id}.${IMAGE_TYPES[type]}`, Buffer.from(bytes), {
      access: "public",
      contentType: type,
      addRandomSuffix: false,
      cacheControlMaxAge: 365 * 24 * 60 * 60,
    });
    await db.insert(upload).values({ id, url: blob.url, uploaderId: user.id, size: bytes.length });
    sweepUploadsLater();
    return { url: blob.url };
  } catch (error) {
    console.error("Uploading an image failed", error);
    return { error: "The image could not be uploaded. Please try again in a moment." };
  }
}
